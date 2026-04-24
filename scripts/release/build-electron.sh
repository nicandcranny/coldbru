#!/bin/bash

set -e

TARGET="$1"
shift || true

reset_dir() {
  local dir="$1"

  if [ -d "$dir" ]; then
    find "$dir" -mindepth 1 -delete 2>/dev/null || true
    rm -rf "$dir"
  fi
}

# Build the web app that gets packaged into the desktop app.
npm run build:web

# Remove out directory
reset_dir packages/coldbru-electron/out

# Remove web directory
reset_dir packages/coldbru-electron/web

# Create a new web directory
mkdir -p packages/coldbru-electron/web

# Copy build
cp -r packages/coldbru-app/dist/* packages/coldbru-electron/web


# Update static paths
find packages/coldbru-electron/web -name '*.html' -type f -exec sed -i.bak -e 's@/static/@static/@g' {} +
find packages/coldbru-electron/web/static/css -name '*.css' -type f -exec sed -i.bak -e 's@/static/font@../../static/font@g' {} +
find packages/coldbru-electron/web -name '*.bak' -type f -delete

# Remove sourcemaps
find packages/coldbru-electron/web -name '*.map' -type f -delete

if [ "$TARGET" == "snap" ]; then
  echo "Building snap distribution"
  npm run dist:snap --workspace=packages/coldbru-electron -- "$@"
elif [ "$TARGET" == "mac" ]; then
  echo "Building mac distribution"
  npm run dist:mac --workspace=packages/coldbru-electron -- "$@"
elif [ "$TARGET" == "win" ]; then
  echo "Building windows distribution"
  npm run dist:win --workspace=packages/coldbru-electron -- "$@"
elif [ "$TARGET" == "deb" ]; then
  echo "Building debian distribution"
  npm run dist:deb --workspace=packages/coldbru-electron -- "$@"
elif [ "$TARGET" == "rpm" ]; then
  echo "Building rpm distribution"
  npm run dist:rpm --workspace=packages/coldbru-electron -- "$@"
elif [ "$TARGET" == "linux" ]; then
  echo "Building linux distribution"
  npm run dist:linux --workspace=packages/coldbru-electron -- "$@"
else
  echo "Please pass a build distribution type"
  exit 1
fi

node ./scripts/release/collect-release-artifacts.js "$TARGET"
