// Generates raster icons from the SVG sources. Run once (npm run gen-icons)
// and commit the outputs; electron-builder derives .icns/.ico from build/icon.png.
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const assets = path.join(root, 'assets');
const build = path.join(root, 'build');

async function main() {
  fs.mkdirSync(build, { recursive: true });

  await sharp(path.join(assets, 'icon.svg'))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(build, 'icon.png'));

  await sharp(path.join(assets, 'tray.svg'))
    .resize(16, 16)
    .png()
    .toFile(path.join(assets, 'trayTemplate.png'));

  await sharp(path.join(assets, 'tray.svg'))
    .resize(32, 32)
    .png()
    .toFile(path.join(assets, 'trayTemplate@2x.png'));

  await sharp(path.join(assets, 'icon.svg'))
    .resize(32, 32)
    .png()
    .toFile(path.join(assets, 'tray-win.png'));

  console.log('Icons generated: build/icon.png, assets/tray*.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
