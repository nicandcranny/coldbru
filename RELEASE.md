# Release

## Goal

Build one verified release bundle in `build/v<version>/` containing:

- `coldbru_<version>_arm64_mac.dmg`
- `coldbru_<version>_x64_mac.dmg`
- `coldbru_<version>_x64_win.exe`
- `coldbru_<version>_x86_64_linux.AppImage`
- `SHA256SUMS.txt`

## Release Scripts

- `npm run release:version -- <version>`
  - Bumps:
    - [packages/coldbru-app/package.json](/Users/xen.nicholas/Code/coldbru/packages/coldbru-app/package.json)
    - [packages/coldbru-electron/package.json](/Users/xen.nicholas/Code/coldbru/packages/coldbru-electron/package.json)
    - workspace entries in [package-lock.json](/Users/xen.nicholas/Code/coldbru/package-lock.json)
- `npm run release:build:mac`
  - Builds both mac DMGs and copies them into `build/v<version>/`
- `npm run release:build:win`
  - Builds Windows x64 installer and copies it into `build/v<version>/`
- `npm run release:build:linux`
  - Builds Linux x64 AppImage on a Linux host and copies it into `build/v<version>/`
- `npm run release:build:linux:docker`
  - Builds Linux x64 AppImage inside Docker from macOS and copies it into `build/v<version>/`
- `npm run release:assemble`
  - Regenerates `SHA256SUMS.txt` from artifacts already in `build/v<version>/`
- `npm run release:verify`
  - Verifies exact expected filenames and SHA256 values
- `npm run release:build:bundle`
  - Human-friendly wrapper:
    - installs dependencies
    - builds host-appropriate targets
    - assembles checksums
    - verifies final bundle

## Normal Flow

### 1. Start from release commit

- Switch to release branch or exact commit
- Make sure `git status` is clean before building
- Do not release from random feature branch

### 2. Bump version

```bash
npm run release:version -- 1.1.0
```

### 3. Build release bundle

On macOS:

```bash
npm run release:build:bundle
```

This runs:

- `npm i --legacy-peer-deps`
- `npm run release:build:mac`
- `npm run release:build:win`
- `npm run release:build:linux:docker`
- `npm run release:assemble`
- `npm run release:verify`

On Linux:

```bash
npm run release:build:bundle -- --skip-mac --skip-win
```

### 4. Smoke test mac app

Run this before you do any later rebuild that clears `packages/coldbru-electron/out/`.

Check:

- packaged app exists under `packages/coldbru-electron/out/mac` and `packages/coldbru-electron/out/mac-arm64`
- app launches without blank screen
- no immediate `Cannot find module` or startup crash
- main process stays alive after first launch

### 5. Commit, tag, push

```bash
git add packages/coldbru-app/package.json packages/coldbru-electron/package.json package-lock.json build/v1.1.0
git commit -m "release: v1.1.0"
git tag v1.1.0
git push origin main
git push origin v1.1.0
```

### 6. Publish GitHub release

Create:

```bash
gh release create v1.1.0 build/v1.1.0/* --title "ColdBru v1.1.0" --notes ""
```

Update existing release:

```bash
gh release upload v1.1.0 build/v1.1.0/* --clobber
```

## macOS Signing

### Local unsigned or internal release

If no real Apple signing identity is configured, `scripts/release/build-electron.sh` falls back to:

- Electron Builder ad-hoc signing during packaging
- explicit post-build ad-hoc re-signing of every `.app` bundle under `packages/coldbru-electron/out`

This matters because mismatched ad-hoc signatures across helper apps can crash on other Macs with a "different Team IDs" style failure.

No extra setup needed for this fallback.

### Public signed mac release

Set one of:

- `CSC_NAME`
- `CSC_LINK` and matching key password env vars

Then build mac release:

```bash
npm run release:build:mac
```

Current repo behavior:

- real signing works when `CSC_NAME` or `CSC_LINK` is configured
- ad-hoc fallback runs only when neither is configured
- [packages/coldbru-electron/resources/entitlements.mac.plist](/Users/xen.nicholas/Code/coldbru/packages/coldbru-electron/resources/entitlements.mac.plist) must keep:
  - `com.apple.security.cs.allow-jit`
  - `com.apple.security.cs.allow-unsigned-executable-memory`
  - `com.apple.security.cs.disable-library-validation`

### Notarization

Repo already has [packages/coldbru-electron/notarize.js](/Users/xen.nicholas/Code/coldbru/packages/coldbru-electron/notarize.js), but current [packages/coldbru-electron/electron-builder-config.js](/Users/xen.nicholas/Code/coldbru/packages/coldbru-electron/electron-builder-config.js) sets:

- `mac.notarize = false`

So current release flow signs mac builds, but does not rely on Electron Builder notarization.

If notarization is re-enabled later, current helper expects:

- `APPLE_ID`
- `APPLE_ID_PASSWORD`

and uses hardcoded `ascProvider`.

## Platform Notes

### macOS host

Use:

- `npm run release:build:mac`
- `npm run release:build:win`
- `npm run release:build:linux:docker`

### Linux host

Use:

- `npm run release:build:linux`

### Build order

Recommended order on macOS:

1. mac
2. smoke test mac app from `packages/coldbru-electron/out/`
3. win
4. linux docker
5. assemble
6. verify

Reason:

- every target rebuild clears `packages/coldbru-electron/out`
- if you need to inspect packaged `.app`, do it immediately after mac build

## Troubleshooting

### `EPERM` under `~/Library/Caches/electron-builder`

Symptom:

- mac build fails creating lock or cache files in `~/Library/Caches/electron-builder`

Cause:

- sandbox or local permissions block Electron Builder cache writes

Fix:

- rerun mac build with permission to write that cache location

### `wineserver: bind: Operation not permitted`

Symptom:

- Windows build fails while running `rcedit` through Wine on macOS

Cause:

- sandbox or local restrictions block Wine helper process

Fix:

- rerun Windows build with permission to run Wine helper processes

### Linux build fails on macOS with native module cross-compile errors

Fix:

```bash
npm run release:build:linux:docker
```

### `build/v<version>/` exists but missing one artifact

Run:

```bash
npm run release:assemble
npm run release:verify
```

If still missing, rerun only missing platform build.

### Wrong files changed in `package-lock.json`

Do not hand-edit broad `1.0.x` strings. Use:

```bash
npm run release:version -- <version>
```

That script updates only workspace package version entries.

## Script Details

### `scripts/release/build-electron.sh`

- builds web app
- refreshes packaged `web/` directory
- rewrites static asset paths for Electron
- deletes sourcemaps
- runs target Electron build
- copies target artifact into `build/v<version>/`
- applies consistent ad-hoc re-signing for mac `.app` bundles when no real signing identity is configured

### `scripts/release/build-electron-linux-docker.sh`

- creates clean Linux build environment in Docker
- installs Linux-native rspack binding
- builds Linux AppImage
- copies `build/v<version>/` artifacts back to host

### `scripts/release/assemble-release.js`

- expects artifacts already present in `build/v<version>/`
- normalizes Linux filename if needed
- generates `SHA256SUMS.txt`

### `scripts/release/verify-release.js`

- checks exact expected artifact filenames
- checks `SHA256SUMS.txt` matches real file hashes
