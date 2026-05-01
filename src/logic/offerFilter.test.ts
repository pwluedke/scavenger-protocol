import { getValidOffers } from './offerFilter';
import { createRng } from './rng';
import { NODES } from './progression-data';

const rng = () => createRng('offer-test-seed');

describe('getValidOffers -- pool selection', () => {
  it('returns nodes from common pool for tier-1 salvage', () => {
    const offers = getValidOffers([], 1, rng());
    expect(offers.length).toBeGreaterThan(0);
    for (const o of offers) {
      expect(o.pool).toBe('common');
    }
  });

  it('returns nodes from uncommon pool for tier-2 salvage', () => {
    // Pick all common nodes so fallback does not apply, ensuring we stay in uncommon
    const commonPicked = NODES.filter((n) => n.pool === 'common').map((n) => n.id);
    const offers = getValidOffers(commonPicked, 2, rng());
    for (const o of offers) {
      expect(o.pool).toBe('uncommon');
    }
  });

  it('returns nodes from rare pool for tier-3 salvage', () => {
    // Pick all common + uncommon nodes so fallback does not apply
    const nonRarePicked = NODES.filter((n) => n.pool !== 'rare').map((n) => n.id);
    const offers = getValidOffers(nonRarePicked, 3, rng());
    for (const o of offers) {
      expect(o.pool).toBe('rare');
    }
  });
});

describe('getValidOffers -- count', () => {
  it('returns exactly 3 offers when enough nodes are available', () => {
    const offers = getValidOffers([], 1, rng());
    expect(offers).toHaveLength(3);
  });

  it('returns fewer than 3 when almost all nodes are picked', () => {
    // Pick all nodes; no offers should remain
    const allPicked = NODES.map((n) => n.id);
    const offers = getValidOffers(allPicked, 1, rng());
    expect(offers).toHaveLength(0);
  });
});

describe('getValidOffers -- eligibility', () => {
  it('does not offer already-picked nodes', () => {
    const offers = getValidOffers([], 1, rng());
    const firstPick = offers[0].id;
    const nextOffers = getValidOffers([firstPick], 1, rng());
    expect(nextOffers.map((o) => o.id)).not.toContain(firstPick);
  });

  it('does not offer a tier-2 node whose parent is not picked', () => {
    const offers = getValidOffers([], 2, rng());
    for (const o of offers) {
      if (o.tier > 1) {
        expect(o.parentId).not.toBeNull();
        // parentId would have to be in pickedNodes (empty here) -- so no tier-2+ node
        // from uncommon should appear unless it has no parent... but all tier-2 have parents
        // This is a fallback scenario: uncommon nodes require parent, so fallback to common
        expect(o.pool).toBe('common');
      }
    }
  });

  it('offers tier-2 uncommon node once its parent is picked', () => {
    // twin-shot requires pellet-drive
    const offers = getValidOffers(['pellet-drive'], 2, rng());
    const ids = offers.map((o) => o.id);
    expect(ids).toContain('twin-shot');
  });
});

describe('getValidOffers -- fallback', () => {
  it('falls back to uncommon when rare pool has no eligible nodes', () => {
    // Pick all rare nodes so rare pool is exhausted; also pick their parents so
    // uncommon pool is eligible
    const rarePicked = NODES.filter((n) => n.pool === 'rare').map((n) => n.id);
    const uncommonParentsPicked = NODES.filter((n) => n.pool === 'uncommon').map((n) => n.id);
    const offers = getValidOffers([...rarePicked, ...uncommonParentsPicked], 3, rng());
    // With uncommon already picked too, should fall back to common
    for (const o of offers) {
      expect(['uncommon', 'common']).toContain(o.pool);
    }
  });

  it('returns no duplicates across offers', () => {
    const offers = getValidOffers([], 1, rng());
    const ids = offers.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getValidOffers -- Deep Salvage upgrade', () => {
  it('upgrades tier-1 salvage to uncommon pool when deep-salvage is picked', () => {
    // Need the parent chain for deep-salvage to have uncommon nodes available
    const picked = ['deep-salvage', 'scrap-sense']; // scrap-sense is parent of extended-haul (uncommon)
    const offers = getValidOffers(picked, 1, rng());
    const pools = offers.map((o) => o.pool);
    // Should see some uncommon nodes since tier-1 is upgraded
    const hasUncommon = pools.some((p) => p === 'uncommon');
    const hasOnlyCommonAndUncommon = pools.every((p) => p === 'common' || p === 'uncommon');
    expect(hasOnlyCommonAndUncommon).toBe(true);
    expect(hasUncommon).toBe(true);
  });

  it('upgrades tier-2 salvage to rare pool when deep-salvage is picked', () => {
    // Need rare parents picked so rare nodes are eligible
    const rareTier3Nodes = NODES.filter((n) => n.pool === 'uncommon').map((n) => n.id);
    const picked = ['deep-salvage', ...rareTier3Nodes];
    const offers = getValidOffers(picked, 2, rng());
    for (const o of offers) {
      expect(o.pool).toBe('rare');
    }
  });
});
