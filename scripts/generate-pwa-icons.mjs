import sharp from 'sharp';
import {readFileSync} from 'node:fs';

// The committed SVG is the single brand source for browser, iOS and PWA icons.
const svg = readFileSync('public/icon.svg', 'utf8');
if (!svg.includes('id="varda-emblem"') || !svg.includes('id="icon-surface"')) {
  throw new Error('Varda icon SVG is missing its expected branded layers.');
}
// Maskable icons require the distinctive mark to fit inside the center safe zone.
const maskableSvg = svg
  .replaceAll('rx="112"', 'rx="0"')
  .replace('rx="105"', 'rx="0"')
  .replace('<g id="varda-emblem">', '<g id="varda-emblem" transform="translate(58 58) scale(0.773)">');
const icons = [
  ['pwa-192x192.png', 192, svg],
  ['pwa-512x512.png', 512, svg],
  ['pwa-maskable-512x512.png', 512, maskableSvg],
  ['apple-touch-icon.png', 180, svg],
];
await Promise.all(icons.map(async ([file, size, input]) => {
  await sharp(Buffer.from(input))
    .resize(size, size)
    .png({compressionLevel: 9})
    .toFile(`public/${file}`);
}));
console.log('Generated Varda favicon, PWA and iOS home-screen icons from public/icon.svg.');
