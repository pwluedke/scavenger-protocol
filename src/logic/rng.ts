// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.
// Seeded RNG module. No Math.random() calls anywhere in logic layer.
//
// Algorithm: xorshift128 with four uint32 state values. Period: 2^128 - 1.
// No external dependencies -- every line is auditable.
// String seeds are hashed to four uint32 values via djb2 with different salts.

export interface Rng {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  nextBool(probability?: number): boolean;
  nextItem<T>(array: T[]): T;
  clone(): Rng;
}

function djb2(s: string, salt: number): number {
  let h = (5381 + salt) >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

function numberToUint32s(n: number): [number, number, number, number] {
  const a = n >>> 0;
  return [
    (a ^ 0xdeadbeef) >>> 0 || 1,
    (a ^ 0x41c64e6d) >>> 0 || 2,
    (a ^ 0x6073) >>> 0 || 3,
    (a ^ 0x9b1) >>> 0 || 4,
  ];
}

function stringToUint32s(s: string): [number, number, number, number] {
  return [djb2(s, 0), djb2(s, 1), djb2(s, 2), djb2(s, 3)];
}

function makeRng(x: number, y: number, z: number, w: number): Rng {
  let _x = x;
  let _y = y;
  let _z = z;
  let _w = w;

  function next(): number {
    const t = (_x ^ (_x << 11)) >>> 0;
    _x = _y;
    _y = _z;
    _z = _w;
    _w = (_w ^ (_w >>> 19) ^ (t ^ (t >>> 8))) >>> 0;
    return _w / 0x100000000;
  }

  return {
    next,
    nextInt(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    nextFloat(min, max) {
      return next() * (max - min) + min;
    },
    nextBool(probability = 0.5) {
      return next() < probability;
    },
    nextItem<T>(array: T[]): T {
      return array[Math.floor(next() * array.length)];
    },
    clone() {
      return makeRng(_x, _y, _z, _w);
    },
  };
}

export function createRng(seed: string | number): Rng {
  const [x, y, z, w] =
    typeof seed === 'string' ? stringToUint32s(seed) : numberToUint32s(seed);
  return makeRng(x, y, z, w);
}
