# Release Steps

## Checklist

1. Confirm the target version is set in [package.json](/Users/xen.nicholas/Code/coldbru/package.json), [packages/coldbru-app/package.json](/Users/xen.nicholas/Code/coldbru/packages/coldbru-app/package.json), and [packages/coldbru-electron/package.json](/Users/xen.nicholas/Code/coldbru/packages/coldbru-electron/package.json) as needed for the release.
2. Install dependencies with `npm i --legacy-peer-deps`.
3. Build each release artifact from the matching host OS:
   - macOS: `npm run build:electron:mac`
   - Windows x64: `npm run build:electron:win -- --x64`
   - Linux x64 AppImage: `npm run build:electron:linux -- --x64`
4. Each build automatically stages its release artifacts into `release/staging/`.
5. Assemble the release bundle with `npm run release:assemble`.
6. Verify the final release directory `release/v<version>/` contains exactly:
   - `coldbru_<version>_arm64_mac.dmg`
   - `coldbru_<version>_x64_mac.dmg`
   - `coldbru_<version>_x64_win.exe`
   - `coldbru_<version>_x86_64_linux.AppImage`
   - `SHA256SUMS.txt`
7. Smoke test each artifact on its target OS.
8. Create the Git tag `v<version>` and push it when the build is approved.
9. Create the GitHub release for `v<version>` and upload the files from `release/v<version>/`.

## Notes

- macOS notarization is skipped automatically when `APPLE_ID` and `APPLE_ID_PASSWORD` are not configured, which allows local rebuilds to complete.
- `npm run release:assemble` copies only the files that belong in the public release and generates `SHA256SUMS.txt`.
- If you rebuild multiple platforms, keep the staged artifacts in `release/staging/` until the full set is assembled.
