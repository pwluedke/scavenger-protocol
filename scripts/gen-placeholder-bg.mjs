// Generates public/assets/sprites/background/placeholder-ground.png
// 512x512 dark gray PNG with subtle grid pattern. No external dependencies.
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/assets/sprites/background/placeholder-ground.png');
const SIZE = 512;
const GRID = 64;
const BASE = 30;
const LINE = 50;

// Simple deterministic noise: LCG per pixel
function lcg(seed) {
  return ((seed * 1664525 + 1013904223) & 0xffffffff) >>> 0;
}

// Build raw scanlines: filter byte (0) + RGB per pixel
const rows = [];
for (let y = 0; y < SIZE; y++) {
  const row = new Uint8Array(1 + SIZE * 3);
  row[0] = 0; // filter type None
  for (let x = 0; x < SIZE; x++) {
    const isGrid = x % GRID === 0 || y % GRID === 0;
    const base = isGrid ? LINE : BASE;
    let seed = lcg(y * SIZE + x);
    const noise = (seed % 9) - 4; // -4 to +4
    const v = Math.max(0, Math.min(255, base + noise));
    const i = 1 + x * 3;
    row[i] = v;
    row[i + 1] = v;
    row[i + 2] = v;
  }
  rows.push(row);
}

const raw = Buffer.concat(rows.map(r => Buffer.from(r)));
const idat = deflateSync(raw);

function uint32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const dataBytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crcInput = Buffer.concat([typeBytes, dataBytes]);
  return Buffer.concat([uint32be(dataBytes.length), typeBytes, dataBytes, uint32be(crc32(crcInput))]);
}

const ihdr = Buffer.concat([
  uint32be(SIZE), uint32be(SIZE),
  Buffer.from([8, 2, 0, 0, 0]), // 8-bit depth, RGB, no interlace
]);

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`wrote ${OUT} (${png.length} bytes)`);
