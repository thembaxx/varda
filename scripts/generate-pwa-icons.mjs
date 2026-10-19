import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {FlowerTulip} from '@phosphor-icons/react/ssr';
import sharp from 'sharp';
import {writeFileSync} from 'node:fs';

// Use the same official Phosphor mark as the navigation, with maskable safe margins.
const mark = renderToStaticMarkup(createElement(FlowerTulip, {size: 280, weight: 'fill', color: '#f4d674'}));
const content = mark.replace(/<svg[^>]*>/, '<svg x="116" y="116" width="280" height="280" viewBox="0 0 256 256">');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#155448"/>${content}</svg>`;
const maskable = svg.replace('rx="112"', 'rx="0"');
writeFileSync('public/icon.svg', svg);
for (const [file, size, source] of [['pwa-192x192.png', 192, svg], ['pwa-512x512.png', 512, svg], ['pwa-maskable-512x512.png', 512, maskable], ['apple-touch-icon.png', 180, svg]]) await sharp(Buffer.from(source)).resize(size, size).png().toFile(`public/${file}`);
console.log('Varda Phosphor icons generated, including a maskable safe-area icon.');
