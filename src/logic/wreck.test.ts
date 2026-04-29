import { spawnWreck, updateWrecks, salvageTier, Wreck } from './wreck';

describe('salvageTier', () => {
  it('returns 1 for hold < 1000ms', () => {
    expect(salvageTier(0)).toBe(1);
    expect(salvageTier(999)).toBe(1);
  });

  it('returns 2 for hold 1000ms to 2499ms', () => {
    expect(salvageTier(1000)).toBe(2);
    expect(salvageTier(2499)).toBe(2);
  });

  it('returns 3 for hold >= 2500ms', () => {
    expect(salvageTier(2500)).toBe(3);
    expect(salvageTier(5000)).toBe(3);
  });
});

describe('spawnWreck -- velocity inheritance', () => {
  it('spawns with vy=40 (80% of Husk descent speed of 50 px/s)', () => {
    expect(spawnWreck(1, 400, 300, 0).vy).toBe(40);
  });

  it('spawns with vx=0', () => {
    expect(spawnWreck(1, 400, 300, 0).vx).toBe(0);
  });
});

describe('updateWrecks -- drifting phase', () => {
  it('wreck stays drifting before 4000ms elapses', () => {
    const wreck = spawnWreck(1, 400, 300, 0);
    const result = updateWrecks([wreck], 100, 3999, null);
    expect(result).toHaveLength(1);
    expect(result[0].phase).toBe('drifting');
  });

  it('wreck transitions to falling at 4000ms', () => {
    const wreck = spawnWreck(1, 400, 300, 0);
    const result = updateWrecks([wreck], 100, 4000, null);
    expect(result).toHaveLength(1);
    expect(result[0].phase).toBe('falling');
  });

  it('wreck moves downward during drifting phase at its spawn vy', () => {
    // spawnWreck sets vy=40 px/s; after 1000ms (dt=1s) y should increase by 40
    const wreck = spawnWreck(1, 400, 300, 0);
    const result = updateWrecks([wreck], 1000, 1000, null);
    expect(result[0].y).toBeCloseTo(340, 1);
  });

  it('wreck moves 0.4px downward in a 10ms frame at vy=40', () => {
    const wreck = spawnWreck(1, 400, 300, 0); // vy=40
    const result = updateWrecks([wreck], 10, 10, null);
    expect(result[0].y).toBeCloseTo(300.4, 3);
  });
});

describe('updateWrecks -- timer pause while tethered', () => {
  it('tethering slides driftingAt forward by deltaMs each frame', () => {
    const wreck = spawnWreck(1, 400, 300, 0);
    const result = updateWrecks([wreck], 500, 500, 1);
    expect(result[0].driftingAt).toBe(500);
  });

  it('un-tethered wreck does not slide driftingAt', () => {
    const wreck = spawnWreck(1, 400, 300, 0);
    const result = updateWrecks([wreck], 500, 500, null);
    expect(result[0].driftingAt).toBe(0);
  });

  it('tethered wreck stays drifting past the un-tethered 4000ms deadline', () => {
    // Tether for 2000ms: driftingAt slides to ~2000, deadline becomes 6000ms
    let wrecks = [spawnWreck(1, 400, 300, 0)];
    for (let t = 100; t <= 2000; t += 100) {
      wrecks = updateWrecks(wrecks, 100, t, 1);
    }
    expect(wrecks[0].driftingAt).toBeCloseTo(2000, 0);
    // At t=4000 (still 2000ms before the new 6000ms deadline) -- still drifting
    const midResult = updateWrecks(wrecks, 100, 4000, null);
    expect(midResult[0].phase).toBe('drifting');
    // At t=6000 -- transitions to falling
    const lateResult = updateWrecks(wrecks, 100, 6000, null);
    expect(lateResult[0].phase).toBe('falling');
  });
});

describe('updateWrecks -- falling phase', () => {
  it('scale at 2000ms into falling is 0.5', () => {
    // driftingAt=0, fallingStartMs=4000, currentTime=6000 -> elapsed=2s, scale=1-2/4=0.5
    const wreck: Wreck = { ...spawnWreck(1, 400, 300, 0), phase: 'falling' };
    const result = updateWrecks([wreck], 16, 6000, null);
    expect(result[0].scale).toBeCloseTo(0.5, 2);
  });

  it('vy stays constant during falling (no acceleration)', () => {
    const wreck: Wreck = { ...spawnWreck(1, 400, 300, 0), phase: 'falling' };
    const result = updateWrecks([wreck], 1000, 5000, null); // dt=1s
    expect(result[0].vy).toBe(40);
  });

  it('falling wreck moves downward', () => {
    const wreck: Wreck = { ...spawnWreck(1, 400, 300, 0), phase: 'falling' };
    const result = updateWrecks([wreck], 100, 4100, null);
    expect(result[0].y).toBeGreaterThan(300);
  });

  it('wreck is removed when scale reaches 0', () => {
    // driftingAt=0, fallingStartMs=4000, scale=0 at currentTime=8000
    const wreck: Wreck = { ...spawnWreck(1, 400, 300, 0), phase: 'falling' };
    const result = updateWrecks([wreck], 100, 8100, null);
    expect(result).toHaveLength(0);
  });
});

describe('updateWrecks -- alive filter', () => {
  it('removes wrecks with alive=false', () => {
    const wreck: Wreck = { ...spawnWreck(1, 400, 300, 0), alive: false };
    expect(updateWrecks([wreck], 16, 1000, null)).toHaveLength(0);
  });
});
