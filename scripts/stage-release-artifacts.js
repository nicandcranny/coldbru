const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'packages', 'coldbru-electron', 'out');
const stagingDir = path.join(repoRoot, 'release', 'staging');

function main() {
  if (!fs.existsSync(outDir)) {
    throw new Error(`Missing build output directory: ${outDir}`);
  }

  fs.mkdirSync(stagingDir, { recursive: true });

  const files = fs.readdirSync(outDir, { withFileTypes: true });
  let stagedCount = 0;

  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }

    if (!/^coldbru_.*\.(dmg|exe|AppImage)$/.test(file.name)) {
      continue;
    }

    const sourcePath = path.join(outDir, file.name);
    const destinationPath = path.join(stagingDir, file.name);
    fs.copyFileSync(sourcePath, destinationPath);
    stagedCount += 1;
    console.log(`Staged ${file.name}`);
  }

  if (stagedCount === 0) {
    throw new Error(`No release artifacts found in ${outDir}`);
  }
}

main();
