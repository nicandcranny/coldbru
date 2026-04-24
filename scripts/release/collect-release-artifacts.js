const fs = require('fs');
const path = require('path');

const target = process.argv[2];

if (!target) {
  console.error('Usage: node ./scripts/release/collect-release-artifacts.js <target>');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..', '..');
const electronPackageJsonPath = path.join(repoRoot, 'packages', 'coldbru-electron', 'package.json');
const electronPackageJson = JSON.parse(fs.readFileSync(electronPackageJsonPath, 'utf8'));
const version = electronPackageJson.version;
const outDir = path.join(repoRoot, 'packages', 'coldbru-electron', 'out');
const buildDir = path.join(repoRoot, 'build', `v${version}`);

const artifactMap = {
  mac: [
    {
      source: `coldbru_${version}_arm64_mac.dmg`,
      destination: `coldbru_${version}_arm64_mac.dmg`
    },
    {
      source: `coldbru_${version}_x64_mac.dmg`,
      destination: `coldbru_${version}_x64_mac.dmg`
    }
  ],
  win: [
    {
      source: `coldbru_${version}_x64_win.exe`,
      destination: `coldbru_${version}_x64_win.exe`
    }
  ],
  linux: [
    {
      source: `coldbru_${version}_x64_linux.AppImage`,
      destination: `coldbru_${version}_x86_64_linux.AppImage`,
      optionalAlternates: [`coldbru_${version}_x86_64_linux.AppImage`]
    }
  ]
};

const artifacts = artifactMap[target];

if (!artifacts) {
  console.log(`No release artifact collection configured for target: ${target}`);
  process.exit(0);
}

function resolveSourcePath(artifact) {
  const candidates = [artifact.source, ...(artifact.optionalAlternates || [])];
  for (const fileName of candidates) {
    const filePath = path.join(outDir, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  throw new Error(`Missing expected artifact in ${outDir}: ${candidates.join(', ')}`);
}

function main() {
  fs.mkdirSync(buildDir, { recursive: true });

  for (const artifact of artifacts) {
    const sourcePath = resolveSourcePath(artifact);
    const destinationPath = path.join(buildDir, artifact.destination);

    fs.copyFileSync(sourcePath, destinationPath);
    console.log(`Prepared ${artifact.destination}`);
  }
}

main();
