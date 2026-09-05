# ARCHITECTURE.md — ColdBru Internals

> How data flows through the app, what each layer does, and where the tricky parts are.

## Mental Model

ColdBru is a two-process Electron app:

```
┌─────────────────────────────────────────────────────────────────┐
│ Renderer (coldbru-app)                                          │
│                                                                 │
│  React component → Redux dispatch → ipcRenderer.invoke()  ──────┐
│                                                                 │
│  Redux state update ← ipcRenderer.on() ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  → React re-render                                              │
└─────────────────────────────────────────────────────────────────┘
                                                                  │
                              IPC bridge                          │
                                                                  │
┌─────────────────────────────────────────────────────────────────┐
│ Main process (coldbru-electron)                                 │
│                                                                 │
│  ipcMain.handle() → disk / git / network / store → response  ◄─┘
│                                                                 │
│  File watchers (chokidar) → ipcMain.emit → webContents.send()  │
│  → pushes updates to renderer without being asked               │
└─────────────────────────────────────────────────────────────────┘
```

Two communication patterns:

1. **Request/response** — renderer calls `ipcRenderer.invoke('channel', payload)`, main returns a result.
2. **Push events** — main sends `webContents.send('event', data)` to renderer (file changes, loading states, import progress).

### Application shutdown

The main window intercepts its close event and asks the renderer to resolve unsaved changes through `main:start-quit-flow`. When the renderer invokes `main:complete-quit-flow`, the main process waits for collection, workspace, API spec, and dotenv chokidar watchers to close before calling `app.exit(0)`. Waiting is required on macOS because exiting while native fsevents watchers are active can deadlock process teardown.

## Domain Map

Every feature maps to an IPC file, a Redux slice, and a set of components:

| Domain | IPC file | Redux slice | Key components |
| --- | --- | --- | --- |
| Collections | `ipc/collection.js` (71 handlers) | `slices/collections/` | Sidebar, RequestPane, ResponsePane |
| Workspaces | `ipc/workspace.js` (26 handlers) | `slices/workspaces/` | WorkspaceSidebar, WorkspaceHome |
| Git | `ipc/git.js` (11 handlers) | `slices/git.js` | Git/ |
| HTTP/Network | `ipc/network/index.js` (6 handlers) | `slices/collections/` (response data) | RequestPane, ResponsePane |
| Global Environments | `ipc/global-environments.js` (11 handlers) | `slices/global-environments.js` | Environments/ |
| OpenAPI Sync | `ipc/openapi-sync.js` (13 handlers) | `slices/openapi-sync.js` | OpenAPISyncTab/ |
| API Specs | `ipc/apiSpec.js` (9 handlers) | `slices/apiSpec.js` | ApiSpecPanel/ |
| gRPC | `ipc/network/grpc-event-handlers.js` (10 handlers) | — | — |
| WebSocket | `ipc/network/ws-event-handlers.js` (7 handlers) | — | — |
| Preferences | `ipc/preferences.js` (7 handlers) | `slices/app.js` | Preferences/ |
| Terminal | `ipc/terminal.js` (5 handlers) | — | — |
| Filesystem | `ipc/filesystem.js` (6 handlers) | — | — |
| Notifications | `ipc/notifications.js` (1 handler) | `slices/notifications.js` | Notifications/ |
| System Monitor | `ipc/system-monitor.js` (3 handlers) | `slices/performance.js` | — |

Workspace global-environment files are watched by `app/workspace-watcher.js`. It emits `main:global-environment-added`, `main:global-environment-changed`, and `main:global-environment-deleted`; `providers/App/useIpcEvents.js` handles these events by reloading the active workspace through `renderer:get-global-environments`.

## Redux Middleware Pipeline

Middleware runs in this order:

```
Action dispatched
  → RTK default middleware (serializability, immutability checks)
    → Tasks middleware
      → RequestTabView middleware
        → Draft Detect middleware (pre-reducer)
          → Reducer runs
            → Autosave middleware (post-reducer)
              → Debug middleware (dev only)
```

### Tasks

Listener middleware. Implements a task queue for coordinating file I/O with tab opening.

When a new request is created or an example cloned, a task is enqueued before the file is written to disk. When chokidar fires `collectionAddFileEvent` or `collectionChangeFileEvent`, this middleware matches the event against pending tasks by `collectionUid + itemPathname` and dispatches `addTab`.

Gotcha: new requests open as preview tabs by default. Tasks are removed from the queue even if the item isn't found in state (race condition with unmounted collections).

### RequestTabView

Listener middleware. Keeps the request tab view mode in sync with the active tab.

Triggers on `addTab`, `focusTab`, `navigateBack`, and `navigateForward`. If the view is `home` and a workspace tab is focused, switches to `all`. If the view is `collection` and the focused tab belongs to a different collection, switches to that collection. History navigation reads the active tab after the tabs reducer runs so browser-style back/forward navigation can cross collection and workspace-home views. Global-environment settings preserve the current request-tab filter because they can be opened from any view.

### Draft Detect

Manual middleware. Runs before the reducer.

Intercepts ~70 action types that represent edits (request body changes, header changes, env changes, etc.). If the currently focused tab is a preview tab, promotes it to permanent — VS Code-style behavior where editing makes a preview tab stick.

Gotcha: `runRequestEvent` is in the intercept list, so sending a request also promotes preview tabs.

### Autosave

Manual middleware. Runs after the reducer.

Intercepts the same ~70 action types as Draft Detect (but the lists are maintained separately and can drift). If autosave is enabled in preferences, debounces a save per entity using `setTimeout` keyed by entity type + uid. Dispatches `saveRequest`, `saveFolderRoot`, `saveCollectionSettings`, `saveEnvironment`, or `saveGlobalEnvironment`.

Gotchas:

- `pendingTimers` is module-level state outside Redux — stale timers survive hot reload.
- When autosave is toggled on, it walks every collection and every item to flush existing drafts — can be slow with large workspaces.
- Transient requests are skipped.

### Debug (dev only)

Logs every action type, payload, and full post-action state via `console.debug`.

## Deep Dives

### 1. Sending an HTTP Request

The core flow of the app. Touches network, interpolation, auth, cookies, scripting, and response processing.

```
renderer dispatches sendRequest()
  → ipcRenderer.invoke('send-http-request', item, collection, environment, runtimeVariables)

Main process:
  1. prepareRequest()
     - Picks item.draft.request if draft exists, otherwise item.request
     - Walks collection tree root → item, merging headers, scripts, vars, auth from folders
     - Sets auth headers (Basic, Bearer, Digest, NTLM, WSSE, AWS SigV4, API key, OAuth2)
     - Sets body by mode (JSON, text, XML, form, multipart, GraphQL, file)

  2. runPreRequest()
     - Runs pre-request script in sandbox (QuickJS default, NodeVM in dev mode)
       Script can modify env/runtime/global vars
     - interpolateVars() — resolves all {{variable}} placeholders across URL, headers,
       body, path params, proxy, auth config
     - URL encoding (if enabled)
     - Body finalization (form-url-encoded → qs.stringify, multipart → FormData)

  3. configureRequest()
     - Resolves TLS certs and proxy config
     - Creates axios instance
     - Applies auth interceptors: NTLM, Digest, AWS SigV4, OAuth2 token fetch/refresh
     - Merges cookies from cookie jar
     - Appends API key to query params if configured

  4. Send via axios (responseType: 'stream')
     - Emits 'request-sent' to renderer with final URL, method, headers, body

  5. Response handling
     - Stream collected via promisifyStream() (SSE stays live)
     - Cookies from Set-Cookie saved to jar
     - Error with response (4xx/5xx): same stream collection
     - Network error: runs custom onFailHandler if exists
     - Cancellation: returns { isCancel: true }

  6. runPostResponse()
     - Post-response vars: evaluates vars.res expressions to extract values from response
     - Post-response script: runs in sandbox with access to request + response

  7. Assertions & Tests
     - Declarative assertions evaluated against response
     - Test script runs with test()/expect() API

  → Returns: status, statusText, headers, data, dataBuffer (base64), size, duration, timeline
```

**Variable precedence** (highest wins):

```
promptVariables > runtimeVariables > oauth2CredentialVariables > requestVariables
> folderVariables > envVariables > collectionVariables > globalEnvironmentVariables > process.env
```

**Auth precedence**: if request auth mode is `inherit`, collection root auth is used. Auth is applied in three stages: (1) structurally in `prepareRequest`, (2) credentials interpolated in `interpolateVars`, (3) protocol-specific interceptors in `configureRequest`.

### 1.5 Collection Runner and CSV Iterations

Collection and folder runs go through `renderer:run-collection-folder` in `ipc/network/index.js`. The renderer can now pass optional `runnerData` for CSV-backed runs:

```js
{
  type: 'csv',
  fileName,
  headers,
  rows: [{ iterationIndex, values, variables }]
}
```

Main process behavior:

- Builds request list exactly as before: recursive/non-recursive, tag filtering, optional configured request subset/order.
- If `runnerData.rows` exists, wraps the request loop in an outer iteration loop. Each CSV row becomes one full runner pass.
- Merges row variables into `envVars` for that iteration only. This means CSV values override global, collection, and selected environment variables, but request/folder/runtime/prompt variables still win.
- Reuses that iteration-scoped `envVars` for nested `bru.runRequest()` calls from scripts so manual jumps and scripted sub-requests see the same CSV row.

Runner event payloads sent over `main:run-folder-event` now include:

- `runnerItemUid` — unique per request execution, required because same request UID can run many times across CSV iterations.
- `iterationIndex`, `iterationCount`, `iterationVariables`, `csvFileName` — used by renderer to group and label results.

Renderer behavior:

- `slices/collections.runFolderEvent` keys updates by `runnerItemUid` when present, falling back to request UID for older events.
- `RunnerResults` shows iteration dividers and can safely display repeated request executions without later events overwriting earlier rows.

### 2. Opening a Collection & File Watching

Collections are plain-text files on disk. The UI collection tree is always a reflection of disk state.

```
User clicks "Open Collection"
  → renderer:open-collection
    → openCollectionDialog() — native OS folder picker
      → openCollection()
          - Reads config: checks opencollection.yml first (YAML format),
            falls back to coldbru.json/bruno.json (BRU format)
          - Validates config against Yup schema
          - Generates deterministic UID from directory path hash
          - Sends main:collection-opened to renderer → added to Redux store

Renderer receives main:collection-opened
  → dispatches renderer:mount-collection
    - Creates transient temp directory under <userData>/tmp/transient/
    - Checks collection stats for async loading (size > 20MB, files > 2000, single file > 5MB)
    - Calls CollectionWatcher.addWatcher()

CollectionWatcher (chokidar):
  - ignoreInitial: false — processes all existing files on startup
  - awaitWriteFinish with 80ms stabilityThreshold
  - depth: 20
  - Ignores: node_modules, .git, .env files, user-configured patterns
  - Falls back to polling for WSL paths or ENOSPC/EMFILE errors

  Events:
    'add'      → parses file by type (request, env, config, folder root)
                  → sends main:collection-tree-updated with 'addFile'
    'addDir'   → reads folder.bru/folder.yml for display name
                  → sends main:collection-tree-updated with 'addDir'
    'change'   → re-parses changed file
                  → sends main:collection-tree-updated with 'change'
    'unlink'   → sends main:collection-tree-updated with 'unlink'
    'unlinkDir'→ sends main:collection-tree-updated with 'unlinkDir'
    'ready'    → collection fully loaded, sends isLoading: false

External changes (Git, VS Code, CLI) are automatically detected and synced to the renderer.
```

**Two collection formats**:

- **BRU** — `coldbru.json` config + `.bru` request files (default)
- **YAML** — `opencollection.yml` config + `.yml` request files

### 3. Importing a Collection

```
renderer:import-collection
  - Accepts pre-converted collection objects (conversion from Postman/Insomnia/OpenAPI
    happens in renderer via @usebruno/converters)
  - For each collection:
    1. Sends main:collection-import-started (loading spinner)
    2. Creates directory (auto-renames if exists)
    3. Writes config file (coldbru.json or opencollection.yml)
    4. Recursively writes request files, folder files, environment files
    5. Saves OpenAPI spec if provided
    6. Sends main:collection-opened → triggers mount and file watching
    7. Sends main:collection-import-ended
  - Returns summary of successful/failed imports
```

### 4. OAuth2 Flow

The most complex auth flow — involves separate browser windows, encrypted token storage, and multiple grant types.

**Supported grant types**: authorization_code, client_credentials, password, implicit.

**Token caching** (`store/oauth2.js`):

- Backed by `electron-store`, encrypted at rest.
- Keyed by `(collectionUid, url, credentialsId)` — each request can have its own cached token.
- Expiry check: `created_at + expires_in * 1000 > Date.now()`.

**Automatic token resolution** (when `forceFetch` is false, i.e. during normal request sending):

1. Stored token exists and not expired → use it.
2. Expired + `autoRefreshToken` on + `refresh_token` exists → attempt refresh. On failure, fall through.
3. Expired + `autoFetchToken` on → clear cache, fetch new token.
4. Otherwise → return expired token as-is.

**Authorization code flow**:

```
1. Build authorize URL (client_id, redirect_uri, scope, state, PKCE if enabled)

2. User authorization — two strategies based on preference:

   a) Electron BrowserWindow:
      - Opens new window with per-collection session partition
      - Intercepts all web requests for debug trace
      - Listens for did-navigate/will-redirect matching callback URL
      - Extracts auth code from URL params, closes window

   b) System browser:
      - Replaces redirect_uri with coldbru://app/oauth2/callback
      - Opens URL via shell.openExternal()
      - 5-minute timeout waiting for protocol callback
      - OS routes coldbru:// callback back to app

3. Exchange code for token — POST to accessTokenUrl with grant_type=authorization_code
4. Persist encrypted token to store
```

**Cancellation**: only one authorization in-flight at a time. Starting a new one auto-cancels the previous. Renderer can explicitly cancel via `renderer:cancel-oauth2-authorization-request`.

### 5. Git Operations

```
renderer dispatches git action
  → ipcRenderer.invoke('renderer:<git-operation>', { collectionPath, ... })
    → Main process uses simple-git library
      → Returns result to renderer → Redux slices/git.js updated

Available operations:
  - clone-git-repository (with processUid for progress tracking)
  - get-collection-git-status (returns file statuses)
  - init-git-repository
  - get-working-git-file-diff (supports staged/unstaged/untracked diffs)
  - stage-git-files / unstage-git-files
  - revert-git-files
  - commit-git-changes
  - add-git-remote
  - push-git-changes / pull-git-changes (with strategy option)
```

### 6. WebSocket & gRPC Lifecycles

Unlike HTTP (fire-and-forget), these maintain persistent connections:

**WebSocket**:

- `renderer:ws:start-connection` → opens connection, registers event listeners
- Messages streamed to renderer via push events
- `renderer:ws:send-message` / `renderer:ws:close-connection` for interaction
- Active connections tracked in module-level Map, queryable via `renderer:ws:get-active-connections`

**gRPC**:

- `grpc:start-connection` → creates gRPC client, handles unary/server-stream/client-stream/bidi
- Methods loaded via reflection (`grpc:load-methods-reflection`) or proto file (`grpc:load-methods-proto`)
- `grpc:send-message` / `grpc:end-request` / `grpc:cancel-request` for stream control
- `grpc:generate-sample-message` generates sample payloads from proto definitions

## Edge Cases & Gotchas

### Transient vs Saved Requests

- A transient request lives in a temp directory (`<userData>/tmp/transient/`), not in the collection folder.
- Transient requests are created when opening a request in preview mode or creating an untitled request.
- When the user edits and saves, `renderer:save-transient-request` moves the file from temp to the real collection directory.
- Autosave middleware skips transient requests.
- The `SaveTransientRequest` modal handles the "save as" flow.

### File Watchers vs Manual Saves

- Chokidar watches the collection directory and pushes every change to the renderer.
- When the app itself writes a file (save request, create environment), chokidar also detects that write and fires a change event.
- This means every save triggers: write to disk → chokidar detects → `main:collection-tree-updated` → Redux update. The Redux reducer handles deduplication.
- `awaitWriteFinish` (80ms stabilityThreshold) prevents partial-write events.

### Collection Format Differences

- **BRU format**: `coldbru.json` config, `.bru` request files, `folder.bru` for folder metadata. Parsed by `@usebruno/lang`.
- **YAML format**: `opencollection.yml` config, `.yml` request files, `folder.yml` for folder metadata. Parsed as standard YAML.
- Format is determined at collection open time by which config file exists. Both formats coexist in the codebase — most IPC handlers accept a `format` parameter.

### Runtime Variables vs Environment Variables

- **Environment variables**: persisted to `.bru`/`.yml` files on disk. Scoped to a collection. Selected via environment switcher.
- **Global environment variables**: persisted to workspace-level files. Available across all collections in a workspace.
- **Runtime variables**: in-memory only, not persisted. Set by pre/post-request scripts via `bru.setVar()`. Lost on app restart.
- **Process env variables**: `process.env` from the OS. Lowest precedence.

### Draft State

- When a user edits a request without saving, the changes live in `item.draft.request` in Redux state.
- `prepareRequest()` checks for `item.draft.request` first, falling back to `item.request`.
- The Draft Detect middleware marks items as having unsaved changes.
- Autosave (if enabled) flushes drafts to disk after a debounce.

### Preview Tabs

- VS Code-style behavior: single-clicking a request opens it in a preview tab (italic title).
- Editing the request, or double-clicking, promotes it to a permanent tab.
- The Draft Detect middleware handles promotion — any of ~70 edit actions triggers it.
- The Tasks middleware opens new requests as preview tabs by default.
- Back/forward history stores snapshots of replaced preview tabs so navigation can restore them even after the single preview-tab slot is reused.

### OpenAPI Sync

The largest single IPC file (70K). Handles:

- Fetching remote OpenAPI specs and comparing against local collection
- Drift detection (local changes vs spec)
- Applying sync (add new endpoints, remove deleted, reset drifted)
- Per-endpoint diff data and decisions
- Multiple sync configs per collection (different spec sources)

## Keeping This Document Up to Date

This is a living document. Update it in the same PR when you:

- Add, remove, or rename an IPC channel.
- Add or change a Redux middleware.
- Change the variable precedence or auth resolution order.
- Change how file watching, collection mounting, or async loading works.
- Add a new grant type or auth strategy.
- Change the request lifecycle pipeline (pre-request, interpolation, post-response).
- Add a new persistent connection protocol (like WebSocket or gRPC).
- Discover a new edge case or gotcha worth documenting.

If a PR changes IPC channels, middleware behavior, or cross-process data flows and doesn't update this file, that's a review blocker.
