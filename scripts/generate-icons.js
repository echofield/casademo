const sharp = require('sharp');
const path = require('path');

// Casa One brand green
const brandGreen = '#1B4332';
const white = '#FFFFFF';

// Create SVG with "C" letter
const createIconSvg = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${brandGreen}"/>
  <text
    x="50%"
    y="54%"
    font-family="Georgia, serif"
    font-size="${size * 0.55}px"
    font-weight="400"
    fill="${white}"
    text-anchor="middle"
    dominant-baseline="middle"
  >C</text>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Generate 192x192
  await sharp(Buffer.from(createIconSvg(192)))
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // Generate 512x512
  await sharp(Buffer.from(createIconSvg(512)))
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // Generate apple-touch-icon (180x180)
  await sharp(Buffer.from(createIconSvg(180)))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Generate favicon
  await sharp(Buffer.from(createIconSvg(32)))
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  console.log('All icons generated!');
}

generateIcons().catch(console.error);
