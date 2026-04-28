// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.
import type { Rng } from './rng';
import type { Driftling } from './enemies';

const SPAWN_DELAY_MS = 5000;
const SPAWN_STOP_MS = 45000;
const INTERVAL_EARLY_MS = 1500; // 5s to 25s
const INTERVAL_LATE_MS = 800;   // 25s to 45s
const LATE_PHASE_MS = 25000;

const SPAWN_X_MIN = 100;
const SPAWN_X_MAX = 1180;
const AMPLITUDE_MIN = 20;
const AMPLITUDE_MAX = 200;
const AMPLITUDE_EDGE_MARGIN = 50;
const AMPLITUDE_CANVAS_EDGE = 1230;
const FREQUENCY_MIN = 0.5;
const FREQUENCY_MAX = 0.6;
const SPAWN_Y = -20;

export interface SpawnerState {
  nextSpawnAtMs: number;
  nextId: number;
}

export function createSpawner(): SpawnerState {
  return { nextSpawnAtMs: SPAWN_DELAY_MS, nextId: 0 };
}

export function updateSpawner(
  state: SpawnerState,
  rng: Rng,
  currentTimeMs: number,
): { state: SpawnerState; spawned: Driftling[] } {
  if (currentTimeMs < state.nextSpawnAtMs || currentTimeMs >= SPAWN_STOP_MS) {
    return { state, spawned: [] };
  }

  const spawnX = rng.nextInt(SPAWN_X_MIN, SPAWN_X_MAX);
  const maxLeft = spawnX - AMPLITUDE_EDGE_MARGIN;
  const maxRight = AMPLITUDE_CANVAS_EDGE - spawnX;
  const maxAllowed = Math.min(maxLeft, maxRight);
  const amplitude = rng.nextFloat(AMPLITUDE_MIN, Math.min(AMPLITUDE_MAX, maxAllowed));
  const frequency = rng.nextFloat(FREQUENCY_MIN, FREQUENCY_MAX);
  const phase = rng.nextFloat(0, 2 * Math.PI);

  const spawned: Driftling = {
    id: state.nextId,
    x: spawnX,
    y: SPAWN_Y,
    spawnX,
    amplitude,
    frequency,
    phase,
    spawnedAtMs: currentTimeMs,
    hp: 1,
    alive: true,
  };

  const interval = currentTimeMs >= LATE_PHASE_MS ? INTERVAL_LATE_MS : INTERVAL_EARLY_MS;

  return {
    state: { nextSpawnAtMs: state.nextSpawnAtMs + interval, nextId: state.nextId + 1 },
    spawned: [spawned],
  };
}
