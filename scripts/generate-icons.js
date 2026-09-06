const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const sourcePng = path.join(rootDir, "assets/images/logo.png");
const sourceSvg = path.join(rootDir, "assets/images/logo.svg");
const electronDir = path.join(rootDir, "packages/coldbru-electron");
const pngDir = path.join(electronDir, "resources/icons/png");
const winIconPath = path.join(electronDir, "resources/icons/win/icon.ico");
const aboutPngPath = path.join(electronDir, "src/about/256x256.png");
const aboutSvgPath = path.join(electronDir, "src/about/logo.svg");
const faviconPath = path.join(
  rootDir,
  "packages/coldbru-app/public/favicon.ico",
);
const macIconsetDir = path.join(
  electronDir,
  "resources/icons/mac/icon.iconset",
);
const macIconPath = path.join(electronDir, "resources/icons/mac/icon.icns");

const pngSizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const macIconSizes = [
  ["16x16", 16],
  ["16x16@2x", 32],
  ["32x32", 32],
  ["32x32@2x", 64],
  ["128x128", 128],
  ["128x128@2x", 256],
  ["256x256", 256],
  ["256x256@2x", 512],
  ["512x512", 512],
  ["512x512@2x", 1024],
];

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

function resizePng(size, outputPath) {
  execFileSync(
    "sips",
    ["-z", String(size), String(size), sourcePng, "--out", outputPath],
    {
      stdio: "ignore",
    },
  );
}

function createMacIcon() {
  fs.mkdirSync(macIconsetDir, { recursive: true });

  for (const [name, size] of macIconSizes) {
    resizePng(size, path.join(macIconsetDir, `icon_${name}.png`));
  }

  execFileSync("iconutil", ["-c", "icns", macIconsetDir, "-o", macIconPath], {
    stdio: "ignore",
  });
}

function createIco(outputPath, pngPaths) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngPaths.length, 4);

  let offset = 6 + 16 * pngPaths.length;
  const directory = [];
  const images = [];

  for (const pngPath of pngPaths) {
    const png = fs.readFileSync(pngPath);
    const size = path.basename(pngPath).split("x")[0];
    const numericSize = Number(size);
    const entry = Buffer.alloc(16);
    entry.writeUInt8(numericSize === 256 ? 0 : numericSize, 0);
    entry.writeUInt8(numericSize === 256 ? 0 : numericSize, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    directory.push(entry);
    images.push(png);
  }

  fs.writeFileSync(
    outputPath,
    Buffer.concat([header, ...directory, ...images]),
  );
}

function main() {
  ensureFile(sourcePng);
  ensureFile(sourceSvg);

  fs.mkdirSync(pngDir, { recursive: true });

  for (const size of pngSizes) {
    resizePng(size, path.join(pngDir, `${size}x${size}.png`));
  }

  fs.copyFileSync(sourceSvg, aboutSvgPath);
  fs.copyFileSync(path.join(pngDir, "256x256.png"), aboutPngPath);

  createMacIcon();
  createIco(
    winIconPath,
    icoSizes.map((size) => path.join(pngDir, `${size}x${size}.png`)),
  );
  createIco(
    faviconPath,
    [16, 24, 32, 48].map((size) => path.join(pngDir, `${size}x${size}.png`)),
  );

  console.log("Icons generated successfully.");
}

main();
