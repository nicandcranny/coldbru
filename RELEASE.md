# Release

## Steps

1. Bump version in:
   - [packages/coldbru-app/package.json](/Users/xen.nicholas/Code/coldbru/packages/coldbru-app/package.json)
   - [packages/coldbru-electron/package.json](/Users/xen.nicholas/Code/coldbru/packages/coldbru-electron/package.json)
   - workspace entries in [package-lock.json](/Users/xen.nicholas/Code/coldbru/package-lock.json)
2. Install deps:
   - `npm i --legacy-peer-deps`
3. Build web:
   - `npm run build:web`
4. Build release artifact on matching OS:
   - macOS: `npm run build:electron:mac`
   - Windows x64: `npm run build:electron:win -- --x64`
   - Linux x64: `npm run build:electron:linux -- --x64`
5. Assemble public release from `packages/coldbru-electron/out`:
   - `npm run release:assemble`
6. Check `build/v<version>/` has expected files.
7. Smoke test artifact on target OS.
8. Commit, tag `v<version>`, push.
9. Create GitHub release and upload files from `build/v<version>/`.

## Smoke Test

For step 7, these are the steps that can be done by human/agent.

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
   - expected artifact files exist in `packages/coldbru-electron/out`
   - signing/ad-hoc signing step completed in build logs
4. Inspect packaged output for obvious regressions:
   - `app.asar` not missing major dependency folders
   - no accidental inclusion of `dist/`, `out/`, or other builder junk if package size jumps unexpectedly
5. Open app once and confirm basic startup behavior:
   - app window opens
   - no blank screen on first launch
   - main process stays alive after startup

## Notes

- `npm run release:assemble` generates `SHA256SUMS.txt`.

## Troubleshooting

- If package size suddenly huge, inspect packaged `app.asar`. Bad pack rules can include `dist/`, `out/`, tests, or builder-only files.

### macOS

- If packaged app crashes but `npm run dev` works, problem usually signing or entitlements, not app code.
- Keep [packages/coldbru-electron/resources/entitlements.mac.plist](/Users/xen.nicholas/Code/coldbru/packages/coldbru-electron/resources/entitlements.mac.plist) including:
  - `com.apple.security.cs.allow-jit`
  - `com.apple.security.cs.allow-unsigned-executable-memory`
  - `com.apple.security.cs.disable-library-validation`
- Local build can use ad-hoc signing when no real Apple cert exists.
- Public mac release should use valid Apple signing identity and notarization.
