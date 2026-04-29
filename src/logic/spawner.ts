// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.
import type { Rng } from './rng';
import type { Driftling } from './enemies';
import type { Husk } from './enemies';

const SPAWN_DELAY_MS = 5000;
const SPAWN_STOP_MS = 45000;
const INTERVAL_EARLY_MS = 1500; // 5s to 25s
const INTERVAL_LATE_MS = 800;   // 25s to 45s
const LATE_PHASE_MS = 25000;

const HUSK_SPAWN_INTERVAL_MS = 4000;
const HUSK_SPAWN_START_MS = 20000;
const HUSK_SPAWN_STOP_MS = 45000;
const HUSK_HP = 4;

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
  nextHuskSpawnAtMs: number;
}

export function createSpawner(): SpawnerState {
  return { nextSpawnAtMs: SPAWN_DELAY_MS, nextId: 0, nextHuskSpawnAtMs: HUSK_SPAWN_START_MS };
}

export function updateSpawner(
  state: SpawnerState,
  rng: Rng,
  currentTimeMs: number,
): { state: SpawnerState; spawned: Driftling[]; spawnedHusks: Husk[] } {
  let newState = state;
  const spawned: Driftling[] = [];
  const spawnedHusks: Husk[] = [];

  if (currentTimeMs >= newState.nextSpawnAtMs && currentTimeMs < SPAWN_STOP_MS) {
    const spawnX = rng.nextInt(SPAWN_X_MIN, SPAWN_X_MAX);
    const maxLeft = spawnX - AMPLITUDE_EDGE_MARGIN;
    const maxRight = AMPLITUDE_CANVAS_EDGE - spawnX;
    const maxAllowed = Math.min(maxLeft, maxRight);
    const amplitude = rng.nextFloat(AMPLITUDE_MIN, Math.min(AMPLITUDE_MAX, maxAllowed));
    const frequency = rng.nextFloat(FREQUENCY_MIN, FREQUENCY_MAX);
    const phase = rng.nextFloat(0, 2 * Math.PI);

    const driftling: Driftling = {
      id: newState.nextId,
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
    spawned.push(driftling);
    const interval = currentTimeMs >= LATE_PHASE_MS ? INTERVAL_LATE_MS : INTERVAL_EARLY_MS;
    newState = { ...newState, nextSpawnAtMs: newState.nextSpawnAtMs + interval, nextId: newState.nextId + 1 };
  }

  if (currentTimeMs >= newState.nextHuskSpawnAtMs && currentTimeMs < HUSK_SPAWN_STOP_MS) {
    const huskX = rng.nextInt(SPAWN_X_MIN, SPAWN_X_MAX);
    const husk: Husk = {
      id: newState.nextId,
      x: huskX,
      y: SPAWN_Y,
      hp: HUSK_HP,
      alive: true,
      spawnedAtMs: currentTimeMs,
    };
    spawnedHusks.push(husk);
    newState = {
      ...newState,
      nextHuskSpawnAtMs: newState.nextHuskSpawnAtMs + HUSK_SPAWN_INTERVAL_MS,
      nextId: newState.nextId + 1,
    };
  }

  return { state: newState, spawned, spawnedHusks };
}
