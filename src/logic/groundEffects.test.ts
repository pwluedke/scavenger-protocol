import {
  updateDebrisFlashes,
  addGroundStain,
  flashProgress,
  flashRadius,
  flashAlpha,
  DebrisFlash,
  GroundStain,
  GROUND_STAIN_CAP,
} from './groundEffects';

describe('updateDebrisFlashes', () => {
  it('removes flashes at or past their 300ms lifetime', () => {
    const flash: DebrisFlash = { x: 100, y: 200, createdAt: 0 };
    expect(updateDebrisFlashes([flash], 300)).toHaveLength(0);
  });

  it('keeps flashes before their 300ms lifetime', () => {
    const flash: DebrisFlash = { x: 100, y: 200, createdAt: 0 };
    expect(updateDebrisFlashes([flash], 299)).toHaveLength(1);
  });

  it('returns empty array when all flashes are expired', () => {
    const flashes: DebrisFlash[] = [
      { x: 100, y: 200, createdAt: 0 },
      { x: 300, y: 400, createdAt: 0 },
    ];
    expect(updateDebrisFlashes(flashes, 300)).toHaveLength(0);
  });
});

describe('addGroundStain', () => {
  it('creates a stain at the correct position', () => {
    const result = addGroundStain([], 100, 200);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 100, y: 200 });
  });

  it('drops the oldest stain when cap is reached', () => {
    const stains: GroundStain[] = Array.from({ length: GROUND_STAIN_CAP }, (_, i) => ({ x: i, y: 0 }));
    const result = addGroundStain(stains, 999, 999);
    expect(result).toHaveLength(GROUND_STAIN_CAP);
    expect(result[result.length - 1]).toEqual({ x: 999, y: 999 });
    expect(result[0]).toEqual({ x: 1, y: 0 }); // oldest (x:0) was dropped
  });

  it('accumulates correctly across multiple calls; grows monotonically until cap', () => {
    let stains: GroundStain[] = [];
    for (let i = 0; i < GROUND_STAIN_CAP; i++) {
      stains = addGroundStain(stains, i, 0);
      expect(stains).toHaveLength(i + 1);
    }
    stains = addGroundStain(stains, 999, 999);
    expect(stains).toHaveLength(GROUND_STAIN_CAP);
  });
});

describe('flashProgress', () => {
  it('returns 0.0 at createdAt', () => {
    const flash: DebrisFlash = { x: 0, y: 0, createdAt: 0 };
    expect(flashProgress(flash, 0)).toBeCloseTo(0.0);
  });

  it('returns 0.5 at 150ms', () => {
    const flash: DebrisFlash = { x: 0, y: 0, createdAt: 0 };
    expect(flashProgress(flash, 150)).toBeCloseTo(0.5);
  });

  it('returns 1.0 at 300ms', () => {
    const flash: DebrisFlash = { x: 0, y: 0, createdAt: 0 };
    expect(flashProgress(flash, 300)).toBeCloseTo(1.0);
  });
});

describe('flashRadius', () => {
  it('returns 4 at progress 0', () => {
    expect(flashRadius(0)).toBe(4);
  });

  it('returns 30 at progress 1.0', () => {
    expect(flashRadius(1.0)).toBe(30);
  });
});

describe('flashAlpha', () => {
  it('returns 1.0 at progress 0', () => {
    expect(flashAlpha(0)).toBeCloseTo(1.0);
  });

  it('returns 0.0 at progress 1.0', () => {
    expect(flashAlpha(1.0)).toBeCloseTo(0.0);
  });
});
