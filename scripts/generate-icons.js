const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SOURCE = path.join(__dirname, '../assets/icon.png');
const ICONS_DIR = path.join(__dirname, '../src/icons');
const ASSETS_DIR = path.join(__dirname, '../src/assets');

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  try {
    // Ensure directories exist
    if (!fs.existsSync(ICONS_DIR)) {
      fs.mkdirSync(ICONS_DIR, { recursive: true });
    }
    if (!fs.existsSync(ASSETS_DIR)) {
      fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    // Generate resized icons
    for (const size of sizes) {
      await sharp(ICON_SOURCE)
        .resize(size, size)
        .toFile(path.join(ICONS_DIR, `icon${size}.png`));
      console.log(`Generated ${size}x${size} icon`);
    }

    // Copy original icon to src/assets
    fs.copyFileSync(ICON_SOURCE, path.join(ASSETS_DIR, 'icon.png'));
    console.log('Copied original icon to src/assets');

  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
