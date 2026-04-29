// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.

export const WRECK_HIT_RADIUS = 16;

const DRIFTING_DURATION_MS = 4000;
const MID_FALL_DURATION_MS = 2000;
const LATE_FALL_DURATION_MS = 2000;
const HUSK_SPAWN_VY = 40; // 80% of Husk descent speed (50px/s) -- slight slowdown on death

export interface Wreck {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: 'drifting' | 'midFall' | 'lateFall';
  driftingAt: number; // ms timestamp; slides forward while tethered to pause the timer
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
): { wrecks: Wreck[]; newlyGrounded: { x: number; y: number }[] } {
  const dt = deltaMs / 1000;
  const newlyGrounded: { x: number; y: number }[] = [];
  const result: Wreck[] = [];

  for (const w of wrecks) {
    if (!w.alive) continue;
    const x = w.x + w.vx * dt;
    const y = w.y + w.vy * dt;

    if (w.phase === 'drifting') {
      const driftingAt = w.id === tetheredWreckId ? w.driftingAt + deltaMs : w.driftingAt;
      if (currentTimeMs - driftingAt >= DRIFTING_DURATION_MS) {
        result.push({ ...w, x, y, driftingAt, phase: 'midFall' });
      } else {
        result.push({ ...w, x, y, driftingAt });
      }
    } else if (w.phase === 'midFall') {
      if (currentTimeMs - w.driftingAt >= DRIFTING_DURATION_MS + MID_FALL_DURATION_MS) {
        result.push({ ...w, x, y, phase: 'lateFall' });
      } else {
        result.push({ ...w, x, y });
      }
    } else {
      // lateFall
      if (currentTimeMs - w.driftingAt >= DRIFTING_DURATION_MS + MID_FALL_DURATION_MS + LATE_FALL_DURATION_MS) {
        newlyGrounded.push({ x, y });
      } else {
        result.push({ ...w, x, y });
      }
    }
  }

  return { wrecks: result, newlyGrounded };
}
