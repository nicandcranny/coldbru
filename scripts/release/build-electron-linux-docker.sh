#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE="${COLDBRU_LINUX_DOCKER_IMAGE:-node:22-bookworm}"

docker run --rm \
  --platform linux/amd64 \
  -e "ELECTRON_MIRROR=${COLDBRU_ELECTRON_MIRROR:-}" \
  -e "ELECTRON_BUILDER_BINARIES_MIRROR=${ELECTRON_BUILDER_BINARIES_MIRROR:-}" \
  -v "${REPO_ROOT}:/workspace" \
  -w /workspace \
  "${IMAGE}" \
  bash -lc "
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive
    if [ -n "\${ELECTRON_MIRROR}" ]; then
      export ELECTRON_MIRROR
    fi
    if [ -n "\${ELECTRON_BUILDER_BINARIES_MIRROR}" ]; then
      export ELECTRON_BUILDER_BINARIES_MIRROR
    fi
    BUILD_ROOT=/tmp/coldbru-linux-build

    apt-get update
    apt-get install -y python3 make g++ rpm libarchive-tools xz-utils
    rm -rf \"\${BUILD_ROOT}\"
    mkdir -p \"\${BUILD_ROOT}\"

    tar \
      --exclude='./node_modules' \
      --exclude='./packages/coldbru-app/node_modules' \
      --exclude='./packages/coldbru-electron/node_modules' \
      --exclude='./packages/coldbru-electron/out' \
      --exclude='./packages/coldbru-electron/web' \
      --exclude='./build' \
      -cf - . | tar -xf - -C \"\${BUILD_ROOT}\"

    cd \"\${BUILD_ROOT}\"
    npm i --legacy-peer-deps
    RSPACK_LINUX_BINDING_VERSION=\$(node -p \"require('./node_modules/@rspack/core/package.json').version\")
    npm i --no-save \"@rspack/binding-linux-x64-gnu@\${RSPACK_LINUX_BINDING_VERSION}\" node-addon-api
    npm run build:electron:linux -- --x64

    mkdir -p /workspace/build
    cp -a \"\${BUILD_ROOT}/build/.\" /workspace/build/
  "
