const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('Usage: node ./scripts/release/bump-version.js <version>');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid semver version: ${version}`);
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..', '..');

function writeJson(filePath, update) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  update(json);
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
}

function replaceWorkspaceVersion(lockfilePath, workspaceName, packageName, nextVersion) {
  const content = fs.readFileSync(lockfilePath, 'utf8');
  const pattern = new RegExp(
    `("${workspaceName}":\\s*\\{\\s*"name":\\s*"${packageName}",\\s*"version":\\s*")([^"]+)(")`,
    'm'
  );

  if (!pattern.test(content)) {
    throw new Error(`Could not find workspace version entry for ${workspaceName} in package-lock.json`);
  }

  const updated = content.replace(pattern, `$1${nextVersion}$3`);
  fs.writeFileSync(lockfilePath, updated);
}

const appPackageJsonPath = path.join(repoRoot, 'packages', 'coldbru-app', 'package.json');
const electronPackageJsonPath = path.join(repoRoot, 'packages', 'coldbru-electron', 'package.json');
const lockfilePath = path.join(repoRoot, 'package-lock.json');

writeJson(appPackageJsonPath, (json) => {
  json.version = version;
});

writeJson(electronPackageJsonPath, (json) => {
  json.version = version;
});

replaceWorkspaceVersion(lockfilePath, 'packages/coldbru-app', '@coldbru/app', version);
replaceWorkspaceVersion(lockfilePath, 'packages/coldbru-electron', 'coldbru', version);

console.log(`Updated release version to ${version}`);
console.log(`- ${path.relative(repoRoot, appPackageJsonPath)}`);
console.log(`- ${path.relative(repoRoot, electronPackageJsonPath)}`);
console.log(`- ${path.relative(repoRoot, lockfilePath)}`);
