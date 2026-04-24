# AGENTS.md — ColdBru Repository Guide

> Everything an engineer or AI agent needs to understand, navigate, and contribute to this repository.

## Reply Guideline

- Always start your reply with ✨

## What Is ColdBru?

ColdBru is an independent fork of [Bruno](https://github.com/usebruno/bruno) — a local-first, offline-friendly API client. ColdBru adds opinionated UX on top: better navigation, a VS Code-style activity bar, Git tooling built into the sidebar, improved global search, and workspace polish. Collections are plain-text files on disk, not cloud-synced.

GitHub: <https://github.com/nicandcranny/coldbru>

## Repository Structure

```
coldbru/
├── packages/
│   ├── coldbru-app/          # React (Rsbuild) web UI — the renderer process
│   │   ├── src/
│   │   │   ├── components/   # React components (styled-components + Tailwind)
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── providers/    # React context providers
│   │   │   ├── selectors/    # Redux selectors
│   │   │   ├── utils/        # Shared utilities
│   │   │   ├── pages/        # Page-level components
│   │   │   ├── themes/       # Theme definitions
│   │   │   ├── styles/       # Global styles
│   │   │   ├── ui/           # Reusable UI primitives
│   │   │   ├── i18n/         # Internationalization
│   │   │   └── assets/       # Static assets
│   │   ├── storybook/        # Storybook config
│   │   └── jest/             # Jest transformers
│   └── coldbru-electron/     # Electron main process
│       ├── src/
│       │   ├── index.js      # Main process entry
│       │   ├── ipc/          # IPC handlers (main ↔ renderer)
│       │   ├── app/          # App lifecycle
│       │   ├── store/        # Electron-store persistence
│       │   ├── utils/        # Main-process utilities
│       │   ├── cache/        # Caching layer
│       │   ├── about/        # About window
│       │   └── preload.js    # Preload script
│       ├── tests/            # Jest tests for main process
│       ├── resources/        # Icons, entitlements, data files
│       └── web/              # Built web output served by Electron
├── scripts/                  # Dev, build, and release scripts
│   ├── dev.js                # `npm run dev` — starts web + electron
│   ├── dev-hot-reload.js     # `npm run dev:watch` — with hot reload
│   ├── release/
│   │   ├── build-electron.js # JS build orchestrator
│   │   ├── build-electron.sh # Shell wrapper for platform builds
│   │   ├── build-electron-linux-docker.sh # Linux x64 build on macOS via Docker
│   │   ├── collect-release-artifacts.js # Copies public artifacts into build/v<version>
│   │   └── assemble-release.js # Assembles release artifacts + SHA256SUMS
│   ├── generate-icons.js     # Icon generation
│   ├── setup.js              # First-time setup
│   ├── count-locs.js         # LOC counter
│   ├── pr-checkout.js        # PR checkout helper
│   └── changed-packages.js   # Detect changed packages
├── .github/
│   ├── workflows/
│   │   ├── tests.yml         # Unit tests CI (push + PR to main)
│   │   └── lint-checks.yml   # ESLint CI (push + PR to main)
│   ├── actions/              # Composite actions (setup-node-deps, run-unit-tests)
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/       # Bug report + feature request templates
│   ├── CODEOWNERS            # @nicandcranny
│   └── scripts/              # Flaky test detection
├── assets/                   # Logo, demo video
├── eslint.config.js          # Flat ESLint config
├── package.json              # Root workspace config
└── .nvmrc                    # Node v22.12.0
```

### Key Upstream Dependencies

ColdBru uses published `@usebruno/*` packages for core functionality:
- `@usebruno/common`, `@usebruno/converters`, `@usebruno/schema`, `@usebruno/lang`, `@usebruno/js`, `@usebruno/filestore`, `@usebruno/requests`

ColdBru-specific code lives in `packages/coldbru-app` and `packages/coldbru-electron`.

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19, Redux Toolkit, styled-components, Tailwind CSS |
| Build (web) | Rsbuild |
| Desktop shell | Electron 41 |
| Desktop build | electron-builder |
| Testing | Jest, @testing-library/react |
| Linting | ESLint 9 (flat config), @stylistic/eslint-plugin |
| Pre-commit | Husky + nano-staged |
| Git operations | simple-git |
| Node version | v22.12.0 (see `.nvmrc`) |

## Getting Started

```bash
# use correct Node version
nvm use

# install dependencies
npm i --legacy-peer-deps

# start dev (web + electron together)
npm run dev

# or start separately
npm run dev:web      # terminal 1
npm run dev:electron # terminal 2

# hot-reload mode
npm run dev:watch
```

To isolate Electron app data during development:
```bash
ELECTRON_USER_DATA_PATH=$(realpath ~/Desktop/coldbru-test) npm run dev:electron
```

## Coding Guidelines

Full standards are in [CODING_STANDARDS.md](CODING_STANDARDS.md) ([GitHub](https://github.com/nicandcranny/coldbru/blob/main/CODING_STANDARDS.md)).

Summary of the most important rules:

- 2-space indentation, single quotes, semicolons always.
- No trailing commas. Always parenthesise arrow function params.
- Styled-components for colors (via theme prop, not CSS variables). Tailwind for layout only.
- Prefer custom hooks for business logic. Avoid `useEffect` unless necessary.
- Import hooks directly (`import { useState } from 'react'`), never `React.useState`.
- No abstractions unless the same code appears in 3+ places.
- Add `data-testid` for testable elements.
- Meaningful comments on complex flows; skip obvious ones.
- Minimal diffs — don't introduce whitespace-only changes.
- **Reuse existing components** — check [COMPONENTS.md](COMPONENTS.md) ([GitHub](https://github.com/nicandcranny/coldbru/blob/main/COMPONENTS.md)) before building anything new. UI primitives live in `src/ui/`, shared components in `src/components/`, and custom hooks in `src/hooks/`.

## Commit Guidelines

- Husky runs `nano-staged` on pre-commit, which auto-lints staged `*.{js,ts,jsx}` files.
- Keep commits focused on a single logical change.
- Branch naming convention:
  - `feat/<name>`
  - `fix/<name>`
  - `docs/<name>`
  - `perf/<name>`
  - `chore/<name>`

## Pull Request Guidelines

Full template: [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) ([GitHub](https://github.com/nicandcranny/coldbru/blob/main/.github/PULL_REQUEST_TEMPLATE.md))

Contributing guide: [CONTRIBUTING.md](CONTRIBUTING.md) ([GitHub](https://github.com/nicandcranny/coldbru/blob/main/CONTRIBUTING.md))

Checklist:
- One issue or feature per PR. Keep it small and focused.
- No breaking changes unless discussed.
- Include screenshots/gifs for UI changes.
- Link to a related issue.
- Disclose if AI was used significantly.
- Lint must pass (`npm run lint`).
- Tests must pass.

CI runs automatically on PRs to `main` and `release/v*`:
- **Lint Checks** — ESLint with diff-aware checking against the base branch.
- **Unit Tests** — Jest tests for both `coldbru-app` and `coldbru-electron`.

## Testing

Testing standards are detailed in [CODING_STANDARDS.md](CODING_STANDARDS.md) ([GitHub](https://github.com/nicandcranny/coldbru/blob/main/CODING_STANDARDS.md)) under the "Tests" section.

### Running Tests

```bash
# app (renderer) tests
npm test --workspace=packages/coldbru-app

# electron (main process) tests
npm test --workspace=packages/coldbru-electron

# all workspace tests
npm test --workspaces --if-present
```

### Testing Philosophy

- Behaviour-driven, not implementation-driven.
- Minimise mocking — prefer real flows; only mock external services or non-deterministic behaviour.
- Cover happy path + realistic error/edge cases.
- Tests must be deterministic, fast, and fail with useful messages.
- Prioritise high-value tests over chasing coverage numbers.

### Linting

```bash
npm run lint        # check
npm run lint:fix    # auto-fix
```

ESLint uses a flat config (`eslint.config.js`) with `@stylistic/eslint-plugin` and `eslint-plugin-diff` (diff-aware linting in CI).

## Building & Releasing

To release, follow the guideline at [RELEASE.md](RELEASE.md) ([GitHub](https://github.com/nicandcranny/coldbru/blob/main/RELEASE.md))

## Security

See [SECURITY.md](SECURITY.md) ([GitHub](https://github.com/nicandcranny/coldbru/blob/main/SECURITY.md)). Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/nicandcranny/coldbru/security).

## Keeping Docs Up to Date

These docs are living documents. When you change the codebase, update the relevant docs in the same PR:

- **Add, remove, or change a reusable component, UI primitive, or custom hook** → update [COMPONENTS.md](COMPONENTS.md).
- **Change coding conventions, testing philosophy, or UI patterns** → update [CODING_STANDARDS.md](CODING_STANDARDS.md).
- **Change build, release, or dev setup steps** → update [RELEASE.md](RELEASE.md) or this file.
- **Change repo structure (new packages, moved directories)** → update the Repository Structure section in this file.

If a PR changes a component's props, path, or purpose and doesn't update COMPONENTS.md, that's a review blocker.

## Other Documentation

| Document | Description |
|---|---|
| [README.md](README.md) | Project overview and motivation |
| [DIFFERENCES.md](DIFFERENCES.md) | What ColdBru changes vs upstream Bruno |
| [IMPORTING.md](IMPORTING.md) | Importing from Postman, Insomnia, OpenAPI, etc. |
| [LICENSE.md](LICENSE.md) | MIT License |
