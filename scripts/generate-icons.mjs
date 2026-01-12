import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="64" fill="#1e3a5f"/>
  <rect x="106" y="133" width="300" height="246" rx="16" fill="white"/>
  <rect x="138" y="176" width="160" height="21" rx="4" fill="#1e3a5f"/>
  <rect x="138" y="218" width="236" height="16" rx="4" fill="#e5e7eb"/>
  <rect x="138" y="250" width="236" height="16" rx="4" fill="#e5e7eb"/>
  <rect x="138" y="282" width="236" height="16" rx="4" fill="#e5e7eb"/>
  <rect x="138" y="314" width="133" height="32" rx="8" fill="#10b981"/>
</svg>
`;

async function generateIcons() {
  const svgBuffer = Buffer.from(svgIcon);

  // Generate 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'pwa-192x192.png'));

  // Generate 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'pwa-512x512.png'));

  // Generate favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.ico'));

  // Generate apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
