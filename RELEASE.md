# Release

## Steps

1. Start from the exact release commit.
   - Do not release from a random feature branch.
   - Make sure `git status` is clean before building.
2. Bump the version in:
   - [packages/coldbru-app/package.json](/Users/xen.nicholas/Code/coldbru/packages/coldbru-app/package.json)
   - [packages/coldbru-electron/package.json](/Users/xen.nicholas/Code/coldbru/packages/coldbru-electron/package.json)
   - workspace entries in [package-lock.json](/Users/xen.nicholas/Code/coldbru/package-lock.json)
3. Install dependencies:
   - `npm i --legacy-peer-deps`
4. Build every required artifact:
   - macOS: `npm run build:electron:mac`
   - Windows x64: `npm run build:electron:win -- --x64`
   - Linux x64:
     - on Linux host: `npm run build:electron:linux -- --x64`
     - on macOS with Docker Desktop: `npm run build:electron:linux:docker`
5. Confirm each build copied its public artifact into `build/v<version>/`.
6. Assemble checksums and verify the final bundle:
   - `npm run release:assemble`
7. Confirm `build/v<version>/` contains exactly:
   - `coldbru_<version>_arm64_mac.dmg`
   - `coldbru_<version>_x64_mac.dmg`
   - `coldbru_<version>_x64_win.exe`
   - `coldbru_<version>_x86_64_linux.AppImage`
   - `SHA256SUMS.txt`
8. Smoke test on macOS.
9. Commit the release changes, create tag `v<version>`, and push:
   - `git add .`
   - `git commit -m "release: v<version>"`
   - `git tag v<version>`
   - `git push origin <branch>`
   - `git push origin v<version>`
10. Create or update the GitHub release and upload everything from `build/v<version>/`.
    - Create:
      - `gh release create v<version> build/v<version>/* --title "ColdBru v<version>" --notes ""`
    - Update:
      - `gh release upload v<version> build/v<version>/* --clobber`

## Build Strategy

- Final release artifacts live in `build/v<version>/`.
- There is no staging directory.
- Each platform build can be run independently and in any order.
- Release scripts live under `scripts/release/`.
- `npm run release:assemble` is the final verification step. It expects all release artifacts to already exist in `build/v<version>/` and then writes `SHA256SUMS.txt`.
- Build from the release commit or release tag, not from an arbitrary feature branch.
- On macOS, Windows x64 can be built locally and Linux x64 should be built through Docker to avoid native-module cross-compilation failures from macOS to Linux.

## Smoke Test

For step 8, only macOS smoke testing is required locally. Windows and Linux artifacts should still be built for the release, but they do not need local smoke testing if only a Mac is available.

### macOS

1. Verify packaged app contains expected runtime files:
   - `app.asar` exists
   - required module paths exist inside `app.asar`
   - sample resource files expected by app are present
2. Launch packaged `.app` directly on macOS and watch for immediate crash:
   - confirm process starts
   - confirm no startup `Cannot find module` or similar uncaught exception
3. Check Electron packaging basics:
   - app bundle exists under `packages/coldbru-electron/out/mac*`
   - expected mac artifact files exist in `packages/coldbru-electron/out`
   - signing/ad-hoc signing step completed in build logs
4. Inspect packaged output for obvious regressions:
   - `app.asar` not missing major dependency folders
   - no accidental inclusion of `dist/`, `out/`, or other builder junk if package size jumps unexpectedly
5. Open app once and confirm basic startup behavior:
   - app window opens
   - no blank screen on first launch
   - main process stays alive after startup

## Notes

- `npm run build:electron:<target>` runs the wrapper in `scripts/release/build-electron.sh`, clears `packages/coldbru-electron/out` before rebuilding that target, then copies the public release artifact into `build/v<version>/`.
- `npm run build:electron:linux:docker` runs the Linux x64 build inside a local `linux/amd64` Docker container and still writes the final artifact back into `build/v<version>/`.
- `npm run release:assemble` generates `SHA256SUMS.txt`.

## Troubleshooting

- If package size suddenly huge, inspect packaged `app.asar`. Bad pack rules can include `dist/`, `out/`, tests, or builder-only files.
- If you are building all platforms across multiple machines, make sure each machine contributes artifacts for the same version into `build/v<version>/` before running `npm run release:assemble`.

### macOS

- `build-electron.sh` now does a more defensive cleanup of `packages/coldbru-electron/out` and `packages/coldbru-electron/web` before rebuilding.
- If `npm run build:electron:linux -- --x64` fails on macOS with `node-gyp does not support cross-compiling native modules from source`, use `npm run build:electron:linux:docker` instead.
- If packaged app crashes but `npm run dev` works, problem usually signing or entitlements, not app code.
- Keep [packages/coldbru-electron/resources/entitlements.mac.plist](/Users/xen.nicholas/Code/coldbru/packages/coldbru-electron/resources/entitlements.mac.plist) including:
  - `com.apple.security.cs.allow-jit`
  - `com.apple.security.cs.allow-unsigned-executable-memory`
  - `com.apple.security.cs.disable-library-validation`
- Local build can use ad-hoc signing when no real Apple cert exists.
- Public mac release should use valid Apple signing identity and notarization.
