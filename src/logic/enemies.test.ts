import { updateDriftlings, Driftling } from './enemies';

function makeDriftling(overrides: Partial<Driftling> = {}): Driftling {
  return {
    id: 1,
    x: 640,
    y: 100,
    spawnX: 640,
    amplitude: 80,
    frequency: 0.5,
    phase: 0,
    spawnedAtMs: 0,
    hp: 1,
    alive: true,
    ...overrides,
  };
}

describe('updateDriftlings -- determinism', () => {
  it('same inputs produce identical output', () => {
    const driftlings = [makeDriftling()];
    const a = updateDriftlings(driftlings, 100, 1000);
    const b = updateDriftlings(driftlings, 100, 1000);
    expect(a).toEqual(b);
  });
});

describe('updateDriftlings -- sine motion', () => {
  it('at elapsed=0 (spawnedAtMs === currentTimeMs), x equals spawnX + amplitude * sin(phase)', () => {
    const phase = Math.PI / 4;
    const d = makeDriftling({ spawnedAtMs: 5000, phase, amplitude: 100, frequency: 0.5 });
    const result = updateDriftlings([d], 16, 5000);
    const expected = 640 + 100 * Math.sin(phase);
    expect(result[0].x).toBeCloseTo(expected, 10);
  });

  it('x oscillates around spawnX -- positive half-cycle', () => {
    // At elapsed = 0.5s with frequency=1Hz, sin(2*PI*1*0.5 + 0) = sin(PI) ≈ 0
    const d = makeDriftling({ spawnedAtMs: 0, amplitude: 100, frequency: 1, phase: 0 });
    const result = updateDriftlings([d], 16, 500);
    expect(result[0].x).toBeCloseTo(640 + 100 * Math.sin(2 * Math.PI * 1 * 0.5), 10);
  });
});

describe('updateDriftlings -- vertical descent', () => {
  it('y increases by DESCENT_SPEED * dt each frame', () => {
    const d = makeDriftling({ y: 200 });
    const deltaMs = 100;
    const result = updateDriftlings([d], deltaMs, 1000);
    // DESCENT_SPEED = 80, dt = 0.1s, expected descent = 8px
    expect(result[0].y).toBeCloseTo(208, 5);
  });
});

describe('updateDriftlings -- lifecycle filtering', () => {
  it('removes driftlings with alive=false', () => {
    const dead = makeDriftling({ alive: false });
    expect(updateDriftlings([dead], 16, 1000)).toHaveLength(0);
  });

  it('keeps alive driftlings', () => {
    const live = makeDriftling({ alive: true });
    expect(updateDriftlings([live], 16, 1000)).toHaveLength(1);
  });

  it('removes driftlings that descend past y=740', () => {
    // y=735, descent 80px/s over 100ms = 8px -> ends at 743, removed
    const d = makeDriftling({ y: 735 });
    expect(updateDriftlings([d], 100, 1000)).toHaveLength(0);
  });

  it('keeps driftlings still on screen after descent', () => {
    const d = makeDriftling({ y: 200 });
    expect(updateDriftlings([d], 100, 1000)).toHaveLength(1);
  });

  it('mixed array: returns only alive and on-screen', () => {
    const live = makeDriftling({ id: 1, y: 200 });
    const dead = makeDriftling({ id: 2, alive: false });
    const offscreen = makeDriftling({ id: 3, y: 738 });
    const result = updateDriftlings([live, dead, offscreen], 100, 1000);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});
