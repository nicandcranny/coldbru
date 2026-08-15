cask "coldbru" do
  version "1.2.0"
  # TODO: Update sha256 after downloading the release artifacts
  arch arm: "arm64", intel: "x64"
  sha256 arm:   "640dcabaff18c789651d23bf6d7928541fbe5949745616fd4fc2429d89f0e150",
         intel: "17b810fb38b93b0cc0c705e4e92cff7d12183451bfb81211f34ebf4871757fe9"

  url "https://github.com/nicandcranny/coldbru/releases/download/v#{version}/coldbru_#{version}_#{arch}_mac.dmg",
      verified: "github.com/nicandcranny/coldbru/"
  name "ColdBru"
  desc "Local-first API client fork of Bruno with enhanced UX"
  homepage "https://github.com/nicandcranny/coldbru"

  livecheck do
    url "https://github.com/nicandcranny/coldbru/releases/latest"
    strategy :github_latest
  end

  depends_on macos: ">= :monterey"

  on_arm do
    app "ColdBru.app"
  end

  on_intel do
    app "ColdBru.app"
  end

  zap trash: [
    "~/Library/Application Support/ColdBru",
    "~/Library/Caches/com.nicandcranny.coldbru",
    "~/Library/Preferences/com.nicandcranny.coldbru.plist",
    "~/Library/Saved Application State/com.nicandcranny.coldbru.savedState",
  ]
end
