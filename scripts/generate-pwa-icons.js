const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const INPUT_ICO = path.join(PUBLIC_DIR, 'favicon.ico');

const icons = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'icon-pos.png', size: 96 },
  { name: 'icon-inventory.png', size: 96 },
];

async function generateIcons() {
  if (!fs.existsSync(INPUT_ICO)) {
    console.error('❌ favicon.ico no encontrado en public/');
    process.exit(1);
  }

  console.log('🎨 Generando iconos PWA desde favicon.ico...\n');

  try {
    const image = await Jimp.read(INPUT_ICO);

    for (const icon of icons) {
      const outputPath = path.join(PUBLIC_DIR, icon.name);
      try {
        await image
          .clone()
          .resize(icon.size, icon.size, Jimp.RESIZE_BILINEAR)
          .writeAsync(outputPath);
        console.log(`✅ ${icon.name} (${icon.size}x${icon.size})`);
      } catch (err) {
        console.error(`❌ Error generando ${icon.name}:`, err.message);
      }
    }

    console.log('\n🚀 Iconos PWA generados correctamente en public/');
  } catch (err) {
    console.error('❌ Error leyendo favicon.ico:', err.message);
    process.exit(1);
  }
}

generateIcons();
