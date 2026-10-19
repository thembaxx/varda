import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Creates a valid PNG buffer of width x height with RGBA pixel data
 */
function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image scanlines: 1 filter byte (0) + width * 4 bytes per row
  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (1 + rowSize));

  for (let y = 0; y < height; y++) {
    const rawOffset = y * (1 + rowSize);
    rawData[rawOffset] = 0; // Filter type None
    const srcOffset = y * rowSize;
    rgbaBuffer.copy(rawData, rawOffset + 1, srcOffset, srcOffset + rowSize);
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal >>> 0, 0);

  return Buffer.concat([len, body, crcBuf]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Render Varda icon pixels
function renderVardaPixels(width, height, isMaskable = false) {
  const buf = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = isMaskable ? 0 : width * 0.22;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Rounded rect check if not maskable
      let inside = true;
      if (!isMaskable) {
        const dx = Math.max(Math.abs(x - cx) - (width / 2 - cornerRadius), 0);
        const dy = Math.max(Math.abs(y - cy) - (height / 2 - cornerRadius), 0);
        if (Math.hypot(dx, dy) > cornerRadius) {
          inside = false;
        }
      }

      if (!inside) {
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
        continue;
      }

      // Forest green gradient background (#0E332B -> #144239)
      const gradT = (x + y) / (width + height);
      let r = Math.round(14 + gradT * 6);
      let g = Math.round(51 + gradT * 15);
      let b = Math.round(43 + gradT * 14);

      // Distance from center
      const distFromCenter = Math.hypot(x - cx, y - cy);

      // Subtle safe ring
      if (Math.abs(distFromCenter - width * 0.35) < 2) {
        r = Math.min(255, r + 40);
        g = Math.min(255, g + 60);
        b = Math.min(255, b + 50);
      }

      // V Monogram shape
      // Left arm from (cx - 0.18*w, cy - 0.2*h) to (cx, cy + 0.18*h)
      // Right arm from (cx, cy + 0.18*h) to (cx + 0.18*w, cy - 0.2*h)
      const px = (x - cx) / width;
      const py = (y - cy) / height;

      let onV = false;
      // Check left stroke
      if (px >= -0.22 && px <= 0 && py >= -0.22 && py <= 0.22) {
        const expectedY = -0.2 + (px - -0.18) * (0.38 / 0.18);
        if (Math.abs(py - expectedY) < 0.055) {
          onV = true;
        }
      }
      // Check right stroke
      if (px >= 0 && px <= 0.22 && py >= -0.22 && py <= 0.22) {
        const expectedY = 0.18 - px * (0.38 / 0.18);
        if (Math.abs(py - expectedY) < 0.055) {
          onV = true;
        }
      }

      if (onV) {
        // Golden V (#E6C465)
        r = 230;
        g = 196;
        b = 101;
      }

      // Solar focal core circle
      const coreDist = Math.hypot(x - cx, y - (cy - height * 0.14));
      if (coreDist < width * 0.05) {
        r = 79;
        g = 255;
        b = 176;
      }
      if (coreDist < width * 0.02) {
        r = 255;
        g = 255;
        b = 255;
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }

  return buf;
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, {recursive: true});
}

// Generate required PWA icons
const targets = [
  {file: 'pwa-192x192.png', size: 192, maskable: false},
  {file: 'pwa-512x512.png', size: 512, maskable: false},
  {file: 'pwa-maskable-512x512.png', size: 512, maskable: true},
  {file: 'apple-touch-icon.png', size: 180, maskable: false},
];

for (const target of targets) {
  const pixelData = renderVardaPixels(target.size, target.size, target.maskable);
  const pngBuffer = createPng(target.size, target.size, pixelData);
  const outPath = path.join(publicDir, target.file);
  fs.writeFileSync(outPath, pngBuffer);
  console.log(`Generated ${target.file} (${target.size}x${target.size})`);
}
