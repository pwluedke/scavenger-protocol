import { createRng } from './rng';

describe('createRng -- determinism', () => {
  it('same seed produces identical sequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('different seeds produce different sequences', () => {
    const a = createRng(1);
    const b = createRng(2);
    const results: boolean[] = [];
    for (let i = 0; i < 20; i++) {
      results.push(a.next() === b.next());
    }
    expect(results.every(Boolean)).toBe(false);
  });
});

describe('createRng -- nextInt', () => {
  it('always returns values within [min, max] inclusive across 10000 calls', () => {
    const rng = createRng('test-seed');
    const min = 3;
    const max = 7;
    for (let i = 0; i < 10_000; i++) {
      const v = rng.nextInt(min, max);
      expect(v).toBeGreaterThanOrEqual(min);
      expect(v).toBeLessThanOrEqual(max);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('produces all values in range across 10000 calls', () => {
    const rng = createRng('distribution-seed');
    const counts: Record<number, number> = { 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    for (let i = 0; i < 10_000; i++) {
      counts[rng.nextInt(3, 7)]++;
    }
    expect(counts[3]).toBeGreaterThan(0);
    expect(counts[4]).toBeGreaterThan(0);
    expect(counts[5]).toBeGreaterThan(0);
    expect(counts[6]).toBeGreaterThan(0);
    expect(counts[7]).toBeGreaterThan(0);
  });
});

describe('createRng -- nextBool', () => {
  it('defaults to ~50% true probability', () => {
    const rng = createRng('bool-seed');
    let trueCount = 0;
    for (let i = 0; i < 10_000; i++) {
      if (rng.nextBool()) trueCount++;
    }
    expect(trueCount).toBeGreaterThan(4500);
    expect(trueCount).toBeLessThan(5500);
  });

  it('respects custom probability', () => {
    const rng = createRng('bool-prob-seed');
    let trueCount = 0;
    for (let i = 0; i < 10_000; i++) {
      if (rng.nextBool(0.1)) trueCount++;
    }
    expect(trueCount).toBeGreaterThan(500);
    expect(trueCount).toBeLessThan(1500);
  });
});

describe('createRng -- nextItem', () => {
  it('returns only items from the provided array', () => {
    const rng = createRng('item-seed');
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 1000; i++) {
      expect(items).toContain(rng.nextItem(items));
    }
  });

  it('returns all items from a large enough sample', () => {
    const rng = createRng('item-coverage-seed');
    const items = ['x', 'y', 'z'];
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(rng.nextItem(items));
    }
    expect(seen.size).toBe(3);
  });
});

describe('createRng -- clone', () => {
  it('clone produces identical sequence from clone point', () => {
    const rng = createRng('clone-seed');
    rng.next();
    rng.next();
    rng.next();
    const cloned = rng.clone();
    for (let i = 0; i < 50; i++) {
      expect(rng.next()).toBe(cloned.next());
    }
  });

  it('clone is independent -- advancing original does not affect clone', () => {
    const rng = createRng('clone-independence-seed');
    const cloned = rng.clone();
    const cloneFirst = cloned.next();
    rng.next();
    rng.next();
    rng.next();
    const cloneSecond = cloned.next();
    const fresh = createRng('clone-independence-seed');
    expect(cloneFirst).toBe(fresh.next());
    expect(cloneSecond).toBe(fresh.next());
  });
});

describe('createRng -- edge cases', () => {
  it('seed of 0 works and is deterministic', () => {
    const a = createRng(0);
    const b = createRng(0);
    expect(a.next()).toBe(b.next());
    expect(a.next()).not.toBe(0);
  });

  it('empty string seed works and is deterministic', () => {
    const a = createRng('');
    const b = createRng('');
    expect(a.next()).toBe(b.next());
  });

  it('very large seed values work and are deterministic', () => {
    const seed = Number.MAX_SAFE_INTEGER;
    const a = createRng(seed);
    const b = createRng(seed);
    expect(a.next()).toBe(b.next());
  });

  it('numeric seed 0 and string seed "0" produce different sequences', () => {
    const a = createRng(0);
    const b = createRng('0');
    const aVals = Array.from({ length: 10 }, () => a.next());
    const bVals = Array.from({ length: 10 }, () => b.next());
    expect(aVals).not.toEqual(bVals);
  });
});
