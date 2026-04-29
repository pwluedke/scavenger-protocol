// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.

export const DRIFTLING_HIT_RADIUS = 14;
const DESCENT_SPEED = 80; // px/s

export const HUSK_HIT_RADIUS = 24;
const HUSK_DESCENT_SPEED = 50; // px/s

export interface Driftling {
  id: number;
  x: number;
  y: number;
  spawnX: number;
  amplitude: number;
  frequency: number;
  phase: number;
  spawnedAtMs: number;
  hp: number;
  alive: boolean;
}

export interface Husk {
  id: number;
  x: number;
  y: number;
  hp: number;
  alive: boolean;
  spawnedAtMs: number;
}

export function updateHusks(husks: Husk[], deltaMs: number): Husk[] {
  const dt = deltaMs / 1000;
  return husks
    .filter((h) => h.alive)
    .map((h) => ({ ...h, y: h.y + HUSK_DESCENT_SPEED * dt }))
    .filter((h) => h.y <= 740);
}

export function updateDriftlings(
  driftlings: Driftling[],
  deltaMs: number,
  currentTimeMs: number,
): Driftling[] {
  const dt = deltaMs / 1000;
  return driftlings
    .filter((d) => d.alive)
    .map((d) => {
      const elapsedSec = (currentTimeMs - d.spawnedAtMs) / 1000;
      return {
        ...d,
        x: d.spawnX + d.amplitude * Math.sin(2 * Math.PI * d.frequency * elapsedSec + d.phase),
        y: d.y + DESCENT_SPEED * dt,
      };
    })
    .filter((d) => d.y <= 740);
}
