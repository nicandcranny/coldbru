class Coldbru < Formula
  desc "Local-first API client fork of Bruno with enhanced UX"
  homepage "https://github.com/nicandcranny/coldbru"
  url "https://github.com/nicandcranny/coldbru/archive/refs/tags/v1.2.0.tar.gz"
  sha256 "13b487e3a21d804199d4f82ff3224080c4699a5a3038df24a221fd5dcf96a2de"
  license "MIT"

  depends_on "node@22"

  # Build options mirror the repository's release scripts
  def install
    # Install workspace dependencies
    system "npm", "ci", "--legacy-peer-deps"

    # Build the web UI that is bundled into the Electron app
    system "npm", "run", "build:web"

    # Prepare the Electron web directory
    system "rm", "-rf", "packages/coldbru-electron/web"
    system "mkdir", "-p", "packages/coldbru-electron/web"
    system "cp", "-r", "packages/coldbru-app/dist/*", "packages/coldbru-electron/web"

    # Strip sourcemaps to keep the build lean, matching scripts/release/build-electron.sh
    system "find", "packages/coldbru-electron/web", "-name", "*.map", "-type", "f", "-delete"

    # Build the platform-specific Electron distribution
    if OS.mac?
      # Build universal mac distribution via electron-builder
      system "npm", "run", "dist:mac", "--workspace=packages/coldbru-electron"

      # Install the built .app into Homebrew prefix
      app = Dir["packages/coldbru-electron/out/*.app"].first
      raise "No .app built" unless app
      prefix.install app
    elsif OS.linux?
      system "npm", "run", "dist:linux", "--workspace=packages/coldbru-electron"
      appimage = Dir["packages/coldbru-electron/out/*AppImage"].first
      raise "No AppImage built" unless appimage
      bin.install appimage
    else
      odie "Windows builds are not supported from this formula. Use the Cask or prebuilt binaries."
    end
  end

  test do
    if OS.mac?
      assert_predicate testpath/"ColdBru.app", :exist
    else
      # Basic sanity check that npm can read package.json
      assert_match "coldbru", shell_output("node -p \"require('./package.json').name\"")
    end
  end
end
