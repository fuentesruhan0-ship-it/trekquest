import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPNG(width, height, getPixel) {
  // getPixel(x, y) returns [r, g, b, a]
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// Precomputed CRC table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Pixel generator for TrekQuest Emerald mountain theme
function trekQuestPixel(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background Gradient (Dark emerald to pitch dark)
  let r = Math.round(6 + (2 - 6) * ny);
  let g = Math.round(78 + (26 - 78) * ny);
  let b = Math.round(59 + (19 - 59) * ny);
  let a = 255;

  // Sun in sky (center 0.5, 0.22, radius 0.12)
  const sunDx = nx - 0.5;
  const sunDy = ny - 0.22;
  const sunDist = Math.sqrt(sunDx * sunDx + sunDy * sunDy);
  if (sunDist < 0.12) {
    const sunT = sunDist / 0.12;
    r = Math.round(251 * (1 - sunT) + 245 * sunT);
    g = Math.round(191 * (1 - sunT) + 158 * sunT);
    b = Math.round(36 * (1 - sunT) + 11 * sunT);
  }

  // Mountain 1: Back Peak (Center 0.5, top 0.35, base 0.75, width 0.55)
  const m1PeakX = 0.5;
  const m1PeakY = 0.35;
  const m1Slope = 1.45;
  const m1YLine = m1PeakY + Math.abs(nx - m1PeakX) * m1Slope;
  if (ny >= m1YLine && ny <= 0.75 && Math.abs(nx - m1PeakX) <= 0.28) {
    // Back Peak Color (Medium emerald)
    r = 16; g = 185; b = 129;
    // Snow cap
    if (ny < m1PeakY + 0.10) {
      r = 240; g = 253; b = 244;
    }
  }

  // Mountain 2: Front Left Peak (Center 0.32, top 0.44, base 0.85, width 0.5)
  const m2PeakX = 0.32;
  const m2PeakY = 0.44;
  const m2Slope = 1.35;
  const m2YLine = m2PeakY + Math.abs(nx - m2PeakX) * m2Slope;
  if (ny >= m2YLine && ny <= 0.85 && Math.abs(nx - m2PeakX) <= 0.26) {
    r = 5; g = 150; b = 105;
    if (ny < m2PeakY + 0.08) {
      r = 255; g = 255; b = 255;
    }
  }

  // Mountain 3: Front Right Peak (Center 0.68, top 0.40, base 0.85, width 0.5)
  const m3PeakX = 0.68;
  const m3PeakY = 0.40;
  const m3Slope = 1.4;
  const m3YLine = m3PeakY + Math.abs(nx - m3PeakX) * m3Slope;
  if (ny >= m3YLine && ny <= 0.85 && Math.abs(nx - m3PeakX) <= 0.26) {
    r = 4; g = 120; b = 87;
    if (ny < m3PeakY + 0.09) {
      r = 255; g = 255; b = 255;
    }
  }

  // Red Summit Pin on Right Peak (center 0.68, 0.36)
  const pinDx = nx - 0.68;
  const pinDy = ny - 0.36;
  const pinDist = Math.sqrt(pinDx * pinDx + pinDy * pinDy);
  if (pinDist < 0.038) {
    r = 239; g = 68; b = 68;
    if (pinDist < 0.015) {
      r = 255; g = 255; b = 255;
    }
  }

  // Trail line (curved dashed cyan path)
  const trailY = 0.86 - 0.4 * Math.pow(nx - 0.2, 1.2);
  if (nx >= 0.2 && nx <= 0.68 && Math.abs(ny - trailY) < 0.016) {
    if (Math.floor(nx * 30) % 2 === 0) {
      r = 56; g = 189; b = 248;
    }
  }

  return [r, g, b, a];
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating PNG icons for PWA installability...');
const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192-maskable.png', size: 192 },
  { name: 'icon-512-maskable.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  const buf = createPNG(size, size, trekQuestPixel);
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`✓ Generated ${name} (${size}x${size})`);
}
console.log('All icons generated successfully!');
