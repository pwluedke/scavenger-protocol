// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.

export const WRECK_HIT_RADIUS = 16;

const DRIFTING_DURATION_MS = 4000;
const FALLING_DURATION_MS = 4000;
const HUSK_SPAWN_VY = 40; // 80% of Husk descent speed (50px/s) -- slight slowdown on death

export interface Wreck {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: 'drifting' | 'falling';
  driftingAt: number; // ms timestamp; slides forward while tethered to pause the timer
  scale: number; // 1.0 to 0.0 during falling phase
  alive: boolean;
}

export function spawnWreck(id: number, x: number, y: number, spawnTimeMs: number): Wreck {
  return {
    id,
    x,
    y,
    vx: 0,
    vy: HUSK_SPAWN_VY,
    phase: 'drifting',
    driftingAt: spawnTimeMs,
    scale: 1.0,
    alive: true,
  };
}

export function salvageTier(holdMs: number): number {
  if (holdMs < 1000) return 1;
  if (holdMs < 2500) return 2;
  return 3;
}

export function updateWrecks(
  wrecks: Wreck[],
  deltaMs: number,
  currentTimeMs: number,
  tetheredWreckId: number | null,
): Wreck[] {
  const dt = deltaMs / 1000;
  return wrecks
    .filter((w) => w.alive)
    .map((w): Wreck => {
      if (w.phase === 'drifting') {
        const driftingAt = w.id === tetheredWreckId ? w.driftingAt + deltaMs : w.driftingAt;
        const x = w.x + w.vx * dt;
        const y = w.y + w.vy * dt;
        if (currentTimeMs - driftingAt >= DRIFTING_DURATION_MS) {
          return { ...w, x, y, driftingAt, phase: 'falling' };
        }
        return { ...w, x, y, driftingAt };
      }
      // falling phase -- constant velocity, scale shrinks to 0 over FALLING_DURATION_MS
      const fallingStartMs = w.driftingAt + DRIFTING_DURATION_MS;
      const fallingElapsedSec = (currentTimeMs - fallingStartMs) / 1000;
      const scale = Math.max(0, 1.0 - fallingElapsedSec / (FALLING_DURATION_MS / 1000));
      const y = w.y + w.vy * dt;
      return { ...w, y, scale, alive: scale > 0 };
    })
    .filter((w) => w.alive);
}
