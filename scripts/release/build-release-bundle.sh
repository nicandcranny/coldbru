#!/bin/bash

set -euo pipefail

SKIP_INSTALL=false
SKIP_MAC=false
SKIP_WIN=false
SKIP_LINUX=false

for arg in "$@"; do
  case "$arg" in
    --skip-install) SKIP_INSTALL=true ;;
    --skip-mac) SKIP_MAC=true ;;
    --skip-win) SKIP_WIN=true ;;
    --skip-linux) SKIP_LINUX=true ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: ./scripts/release/build-release-bundle.sh [--skip-install] [--skip-mac] [--skip-win] [--skip-linux]"
      exit 1
      ;;
  esac
done

if [ -n "$(git status --short)" ]; then
  echo "Git worktree has local changes. Expected after version bump, but double-check release scope before publishing."
fi

CURRENT_VERSION="$(node -p "require('./packages/coldbru-electron/package.json').version")"
HOST_PLATFORM="$(uname -s)"

echo "Preparing release bundle for v${CURRENT_VERSION} on ${HOST_PLATFORM}"

if [ "$SKIP_INSTALL" != "true" ]; then
  echo "Installing dependencies"
  npm i --legacy-peer-deps
fi

if [ "$HOST_PLATFORM" = "Darwin" ]; then
  if [ "$SKIP_MAC" != "true" ]; then
    if [ -n "${CSC_NAME:-}" ] || [ -n "${CSC_LINK:-}" ]; then
      echo "Building mac artifacts with configured signing identity"
    else
      echo "Building mac artifacts with ad-hoc signing fallback"
    fi
    npm run release:build:mac
  fi

  if [ "$SKIP_WIN" != "true" ]; then
    echo "Building Windows x64 artifact"
    npm run release:build:win
  fi

  if [ "$SKIP_LINUX" != "true" ]; then
    echo "Building Linux x64 artifact through Docker"
    npm run release:build:linux:docker
  fi
elif [ "$HOST_PLATFORM" = "Linux" ]; then
  if [ "$SKIP_MAC" != "true" ] || [ "$SKIP_WIN" != "true" ]; then
    echo "macOS and Windows release builds are only supported from macOS in this repo."
    exit 1
  fi

  if [ "$SKIP_LINUX" != "true" ]; then
    echo "Building Linux x64 artifact"
    npm run release:build:linux
  fi
else
  echo "Unsupported host platform: ${HOST_PLATFORM}"
  exit 1
fi

echo "Assembling release bundle"
npm run release:assemble

echo "Verifying release bundle"
npm run release:verify

echo "Release bundle ready in build/v${CURRENT_VERSION}"
