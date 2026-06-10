const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const electronPackageJsonPath = path.join(
  repoRoot,
  'packages',
  'coldbru-electron',
  'package.json'
);
const electronPackageJson = JSON.parse(fs.readFileSync(electronPackageJsonPath, 'utf8'));
const version = electronPackageJson.version;
const releaseDir = path.join(repoRoot, 'build', `v${version}`);

const expectedFiles = [
  `SHA256SUMS.txt`,
  `coldbru_${version}_arm64_mac.dmg`,
  `coldbru_${version}_x64_mac.dmg`,
  `coldbru_${version}_x64_win.exe`,
  `coldbru_${version}_x86_64_linux.AppImage`
].sort();

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

if (!fs.existsSync(releaseDir)) {
  console.error(`Missing release directory: ${releaseDir}`);
  process.exit(1);
}

const actualFiles = fs
  .readdirSync(releaseDir)
  .filter((fileName) => fs.statSync(path.join(releaseDir, fileName)).isFile())
  .sort();

if (actualFiles.length !== expectedFiles.length || actualFiles.some((fileName, index) => fileName !== expectedFiles[index])) {
  console.error(`Release directory contents do not match expected files for ${version}.`);
  console.error(`Expected: ${expectedFiles.join(', ')}`);
  console.error(`Actual: ${actualFiles.join(', ')}`);
  process.exit(1);
}

const checksumPath = path.join(releaseDir, 'SHA256SUMS.txt');
const checksumLines = fs
  .readFileSync(checksumPath, 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean);

if (checksumLines.length !== expectedFiles.length - 1) {
  console.error(`Expected ${expectedFiles.length - 1} checksum entries, found ${checksumLines.length}`);
  process.exit(1);
}

for (const fileName of expectedFiles.filter((fileName) => fileName !== 'SHA256SUMS.txt')) {
  const filePath = path.join(releaseDir, fileName);
  const expectedLine = `${sha256(filePath)}  ${fileName}`;

  if (!checksumLines.includes(expectedLine)) {
    console.error(`Checksum mismatch for ${fileName}`);
    console.error(`Expected line: ${expectedLine}`);
    process.exit(1);
  }
}

console.log(`Verified release bundle in ${releaseDir}`);
