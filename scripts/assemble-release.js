const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const electronPackageJsonPath = path.join(repoRoot, 'packages', 'coldbru-electron', 'package.json');
const electronPackageJson = JSON.parse(fs.readFileSync(electronPackageJsonPath, 'utf8'));
const version = electronPackageJson.version;
const stagingDir = path.join(repoRoot, 'release', 'staging');
const releaseDir = path.join(repoRoot, 'release', `v${version}`);

const artifacts = [
  {
    source: `coldbru_${version}_arm64_mac.dmg`,
    destination: `coldbru_${version}_arm64_mac.dmg`
  },
  {
    source: `coldbru_${version}_x64_mac.dmg`,
    destination: `coldbru_${version}_x64_mac.dmg`
  },
  {
    source: `coldbru_${version}_x64_win.exe`,
    destination: `coldbru_${version}_x64_win.exe`
  },
  {
    source: `coldbru_${version}_x64_linux.AppImage`,
    destination: `coldbru_${version}_x86_64_linux.AppImage`,
    optionalAlternates: [`coldbru_${version}_x86_64_linux.AppImage`]
  }
];

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function resolveSourcePath(artifact) {
  const candidates = [artifact.source, ...(artifact.optionalAlternates || [])];
  for (const fileName of candidates) {
    const filePath = path.join(stagingDir, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  throw new Error(`Missing expected artifact in ${stagingDir}: ${candidates.join(', ')}`);
}

function main() {
  fs.rmSync(releaseDir, { recursive: true, force: true });
  fs.mkdirSync(releaseDir, { recursive: true });

  const checksums = [];

  for (const artifact of artifacts) {
    const sourcePath = resolveSourcePath(artifact);
    const destinationPath = path.join(releaseDir, artifact.destination);

    fs.copyFileSync(sourcePath, destinationPath);
    checksums.push(`${sha256(destinationPath)}  ${artifact.destination}`);
    console.log(`Prepared ${artifact.destination}`);
  }

  fs.writeFileSync(path.join(releaseDir, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`);
  console.log(`Release artifacts assembled in ${releaseDir}`);
}

main();
