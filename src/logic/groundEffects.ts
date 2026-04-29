// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.

export const DEBRIS_FLASH_LIFETIME_MS = 300;
export const GROUND_STAIN_CAP = 100;

export interface DebrisFlash {
  x: number;
  y: number;
  createdAt: number;
}

export interface GroundStain {
  x: number;
  y: number;
}

export function updateDebrisFlashes(flashes: DebrisFlash[], currentTimeMs: number): DebrisFlash[] {
  return flashes.filter((f) => currentTimeMs - f.createdAt < DEBRIS_FLASH_LIFETIME_MS);
}

export function addGroundStain(stains: GroundStain[], x: number, y: number): GroundStain[] {
  const next = [...stains, { x, y }];
  return next.length > GROUND_STAIN_CAP ? next.slice(next.length - GROUND_STAIN_CAP) : next;
}

export function flashProgress(flash: DebrisFlash, currentTimeMs: number): number {
  return Math.min(1, (currentTimeMs - flash.createdAt) / DEBRIS_FLASH_LIFETIME_MS);
}

export function flashRadius(progress: number): number {
  return 4 + (30 - 4) * progress; // 4 to 30
}

export function flashAlpha(progress: number): number {
  return 1.0 - progress; // 1.0 to 0.0
}
