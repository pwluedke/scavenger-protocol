import { createSpawner, updateSpawner, SpawnerState } from './spawner';
import { createRng } from './rng';
import type { Husk } from './enemies';

function advanceToTime(
  state: SpawnerState,
  targetMs: number,
  stepMs = 100,
): { state: SpawnerState; allSpawned: ReturnType<typeof updateSpawner>['spawned']; allHusks: Husk[] } {
  const rng = createRng('test-seed');
  let current = state;
  const allSpawned: ReturnType<typeof updateSpawner>['spawned'] = [];
  const allHusks: Husk[] = [];
  for (let t = 0; t <= targetMs; t += stepMs) {
    const result = updateSpawner(current, rng, t);
    current = result.state;
    allSpawned.push(...result.spawned);
    allHusks.push(...result.spawnedHusks);
  }
  return { state: current, allSpawned, allHusks };
}

describe('spawner -- determinism', () => {
  it('same seed and time sequence produces identical driftlings', () => {
    const runA = (seed: string) => {
      const rng = createRng(seed);
      let state = createSpawner();
      const spawned = [];
      for (let t = 0; t <= 30000; t += 100) {
        const result = updateSpawner(state, rng, t);
        state = result.state;
        spawned.push(...result.spawned);
      }
      return spawned;
    };

    const a = runA('determinism-seed');
    const rng2 = createRng('determinism-seed');
    let state2 = createSpawner();
    const b = [];
    for (let t = 0; t <= 30000; t += 100) {
      const result = updateSpawner(state2, rng2, t);
      state2 = result.state;
      b.push(...result.spawned);
    }

    expect(a).toEqual(b);
  });
});

describe('spawner -- schedule timing', () => {
  it('produces no spawns before 5000ms', () => {
    const rng = createRng('timing-seed');
    let state = createSpawner();
    for (let t = 0; t < 5000; t += 100) {
      const result = updateSpawner(state, rng, t);
      state = result.state;
      expect(result.spawned).toHaveLength(0);
    }
  });

  it('first spawn occurs at 5000ms', () => {
    const rng = createRng('first-spawn-seed');
    let state = createSpawner();
    for (let t = 0; t < 5000; t += 100) {
      const r = updateSpawner(state, rng, t);
      state = r.state;
    }
    const result = updateSpawner(state, rng, 5000);
    expect(result.spawned).toHaveLength(1);
  });

  it('produces no spawns at or after 45000ms', () => {
    const rng = createRng('stop-seed');
    let state = createSpawner();
    // Advance to just before stop
    for (let t = 0; t < 45000; t += 100) {
      const r = updateSpawner(state, rng, t);
      state = r.state;
    }
    // At and beyond 45000ms, nothing spawns
    for (let t = 45000; t <= 50000; t += 100) {
      const result = updateSpawner(state, rng, t);
      expect(result.spawned).toHaveLength(0);
    }
  });
});

describe('spawner -- amplitude constraint', () => {
  it('amplitude at x=100 never exceeds 50', () => {
    // Edge margin: maxLeft = 100 - 50 = 50, maxRight = 1230 - 100 = 1130, max = 50
    // Can't guarantee spawnX=100 from random; verify the constraint for all spawned instead
    const { allSpawned } = advanceToTime(createSpawner(), 45000);
    for (const d of allSpawned) {
      const maxLeft = d.spawnX - 50;
      const maxRight = 1230 - d.spawnX;
      const maxAllowed = Math.min(maxLeft, maxRight);
      expect(d.amplitude).toBeLessThanOrEqual(maxAllowed + 0.001); // float tolerance
      expect(d.amplitude).toBeGreaterThanOrEqual(20);
    }
  });

  it('amplitude at x=640 (center) can reach up to 200', () => {
    // maxLeft = 640 - 50 = 590, maxRight = 1230 - 640 = 590, min = 590 > 200, so max is 200
    // Run many seeds to find a spawn near x=640 with amplitude close to 200
    let maxAmplitude = 0;
    for (let seed = 0; seed < 200; seed++) {
      const rng = createRng(seed);
      let state = createSpawner();
      for (let t = 0; t <= 45000; t += 100) {
        const result = updateSpawner(state, rng, t);
        state = result.state;
        for (const d of result.spawned) {
          if (d.spawnX >= 400 && d.spawnX <= 880) {
            maxAmplitude = Math.max(maxAmplitude, d.amplitude);
          }
        }
      }
    }
    // Across 200 seeds, a center spawn should occasionally reach near max
    expect(maxAmplitude).toBeGreaterThan(150);
  });

  it('all spawned driftlings satisfy the amplitude constraint', () => {
    const { allSpawned } = advanceToTime(createSpawner(), 45000);
    for (const d of allSpawned) {
      const maxLeft = d.spawnX - 50;
      const maxRight = 1230 - d.spawnX;
      const maxAllowed = Math.min(maxLeft, maxRight);
      expect(d.amplitude).toBeLessThanOrEqual(Math.min(200, maxAllowed) + 0.001);
    }
  });
});

describe('spawner -- monotonic ids', () => {
  it('all spawned entities (driftlings + husks) have unique monotonically increasing ids', () => {
    const { allSpawned, allHusks } = advanceToTime(createSpawner(), 45000);
    // Collect all ids from both entity types sorted by id value
    const allIds = [...allSpawned.map((d) => d.id), ...allHusks.map((h) => h.id)].sort((a, b) => a - b);
    for (let i = 0; i < allIds.length; i++) {
      expect(allIds[i]).toBe(i);
    }
  });
});

describe('spawner -- spawn position', () => {
  it('all driftlings spawn at y=-20', () => {
    const { allSpawned } = advanceToTime(createSpawner(), 30000);
    for (const d of allSpawned) {
      expect(d.y).toBe(-20);
    }
  });

  it('all driftlings spawn with x within [100, 1180]', () => {
    const { allSpawned } = advanceToTime(createSpawner(), 45000);
    for (const d of allSpawned) {
      expect(d.spawnX).toBeGreaterThanOrEqual(100);
      expect(d.spawnX).toBeLessThanOrEqual(1180);
    }
  });
});

describe('spawner -- husk schedule', () => {
  it('produces no husks before 20000ms', () => {
    const { allHusks } = advanceToTime(createSpawner(), 19999);
    expect(allHusks).toHaveLength(0);
  });

  it('first husk spawns at 20000ms', () => {
    const rng = createRng('husk-timing-seed');
    let state = createSpawner();
    for (let t = 0; t < 20000; t += 100) {
      const r = updateSpawner(state, rng, t);
      state = r.state;
    }
    const result = updateSpawner(state, rng, 20000);
    expect(result.spawnedHusks).toHaveLength(1);
  });

  it('husks spawn every 4000ms after first spawn', () => {
    const { allHusks } = advanceToTime(createSpawner(), 45000);
    // From 20000ms to 44000ms in 4000ms steps: 7 husks (20k, 24k, 28k, 32k, 36k, 40k, 44k)
    expect(allHusks).toHaveLength(7);
  });

  it('produces no husks at or after 45000ms', () => {
    const rng = createRng('husk-stop-seed');
    let state = createSpawner();
    for (let t = 0; t < 45000; t += 100) {
      const r = updateSpawner(state, rng, t);
      state = r.state;
    }
    for (let t = 45000; t <= 50000; t += 100) {
      const result = updateSpawner(state, rng, t);
      expect(result.spawnedHusks).toHaveLength(0);
    }
  });

  it('all husks spawn with x within [100, 1180]', () => {
    const { allHusks } = advanceToTime(createSpawner(), 45000);
    for (const h of allHusks) {
      expect(h.x).toBeGreaterThanOrEqual(100);
      expect(h.x).toBeLessThanOrEqual(1180);
    }
  });

  it('all husks spawn at y=-20', () => {
    const { allHusks } = advanceToTime(createSpawner(), 45000);
    for (const h of allHusks) {
      expect(h.y).toBe(-20);
    }
  });

  it('all husks spawn with hp=4', () => {
    const { allHusks } = advanceToTime(createSpawner(), 45000);
    for (const h of allHusks) {
      expect(h.hp).toBe(4);
    }
  });
});
