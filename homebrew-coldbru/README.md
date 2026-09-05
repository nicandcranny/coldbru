# homebrew-coldbru

Homebrew tap for ColdBru.

## Installation

```bash
brew tap nicandcranny/homebrew-coldbru
brew install --cask coldbru
```

Or for building from source:

```bash
brew tap nicandcranny/homebrew-coldbru
brew install coldbru
```

Once pushed to `nicandcranny/homebrew-coldbru` you can use:
```bash
brew tap nicandcranny/homebrew-coldbru
brew install --cask coldbru   # prebuilt DMG
brew install coldbru          # build from source via npm/electron-builder
```

## Usage

This tap provides:

- `Casks/coldbru.rb` – macOS DMG installer from GitHub releases
- `Formula/coldbru.rb` – Build from source using npm/electron-builder

## Updating

Update the version and sha256 in the cask after a new release is published to https://github.com/nicandcranny/coldbru/releases

The build artifacts follow the naming convention:
- `coldbru_<version>_arm64_mac.dmg`
- `coldbru_<version>_x64_mac.dmg`
- `coldbru_<version>_x64_win.exe`
- `coldbru_<version>_x86_64_linux.AppImage`

See `RELEASE.md` in the main repository for build instructions.
