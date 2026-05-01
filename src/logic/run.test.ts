import { createRunState, incrementSalvage, applyPickedNode, OFFER_THRESHOLDS, SALVAGE_TIER_VALUES } from './run';

describe('createRunState', () => {
  it('initializes with zeroed counters and first threshold', () => {
    const s = createRunState();
    expect(s.salvageCount).toBe(0);
    expect(s.salvagePoints).toBe(0);
    expect(s.pickedNodes).toEqual([]);
    expect(s.nextOfferThreshold).toBe(OFFER_THRESHOLDS[0]);
  });
});

describe('incrementSalvage -- point accumulation', () => {
  it('awards 1 point for tier 1 return', () => {
    const s = createRunState();
    const { state } = incrementSalvage(s, 1);
    expect(state.salvagePoints).toBe(SALVAGE_TIER_VALUES[1]);
  });

  it('awards 3 points for tier 2 return', () => {
    const s = createRunState();
    const { state } = incrementSalvage(s, 2);
    expect(state.salvagePoints).toBe(SALVAGE_TIER_VALUES[2]);
  });

  it('awards 6 points for tier 3 return', () => {
    const s = createRunState();
    const { state } = incrementSalvage(s, 3);
    expect(state.salvagePoints).toBe(SALVAGE_TIER_VALUES[3]);
  });

  it('increments salvageCount by the tier number', () => {
    const s = createRunState();
    const { state } = incrementSalvage(s, 2);
    expect(state.salvageCount).toBe(2);
  });

  it('accumulates across multiple returns', () => {
    let s = createRunState();
    ({ state: s } = incrementSalvage(s, 1)).state;
    ({ state: s } = incrementSalvage(s, 1)).state;
    ({ state: s } = incrementSalvage(s, 1)).state;
    expect(s.salvagePoints).toBe(3);
    expect(s.salvageCount).toBe(3);
  });
});

describe('incrementSalvage -- offer trigger', () => {
  it('does not trigger offer below first threshold', () => {
    const s = createRunState(); // threshold = 3
    // 2 tier-1 returns = 2 points
    let state = s;
    ({ state } = incrementSalvage(state, 1));
    const { offerTriggered } = incrementSalvage(state, 1);
    expect(offerTriggered).toBe(false);
  });

  it('triggers offer when points reach first threshold', () => {
    const s = createRunState(); // threshold = 3
    let state = s;
    ({ state } = incrementSalvage(state, 1));
    ({ state } = incrementSalvage(state, 1));
    const { offerTriggered } = incrementSalvage(state, 1); // 3 points total
    expect(offerTriggered).toBe(true);
  });

  it('triggers offer when points exceed threshold in a single return', () => {
    const s = createRunState(); // threshold = 3
    // single tier-3 return = 6 points, crosses threshold of 3
    const { offerTriggered } = incrementSalvage(s, 3);
    expect(offerTriggered).toBe(true);
  });

  it('advances nextOfferThreshold to the next value after trigger', () => {
    const s = createRunState(); // threshold = 3
    let state = s;
    ({ state } = incrementSalvage(state, 1));
    ({ state } = incrementSalvage(state, 1));
    ({ state } = incrementSalvage(state, 1)); // triggers at 3
    expect(state.nextOfferThreshold).toBe(OFFER_THRESHOLDS[1]); // 8
  });

  it('sets nextOfferThreshold to Infinity after last threshold is passed', () => {
    let state = createRunState();
    // Blast through all thresholds with tier-3 returns (6 pts each)
    // Thresholds: 3, 8, 16, 28, 44, 64
    // 11 tier-3 returns = 66 points -- passes all 6 thresholds (triggers on each step through)
    for (let i = 0; i < 15; i++) {
      ({ state } = incrementSalvage(state, 3));
    }
    expect(state.nextOfferThreshold).toBe(Infinity);
  });

  it('does not trigger after all thresholds are exhausted', () => {
    let state = createRunState();
    for (let i = 0; i < 15; i++) {
      ({ state } = incrementSalvage(state, 3));
    }
    // now nextOfferThreshold = Infinity
    const { offerTriggered } = incrementSalvage(state, 3);
    expect(offerTriggered).toBe(false);
  });
});

describe('applyPickedNode', () => {
  it('adds node id to pickedNodes', () => {
    const s = createRunState();
    const updated = applyPickedNode(s, 'pellet-drive');
    expect(updated.pickedNodes).toContain('pellet-drive');
  });

  it('accumulates multiple picks', () => {
    let s = createRunState();
    s = applyPickedNode(s, 'pellet-drive');
    s = applyPickedNode(s, 'twin-shot');
    expect(s.pickedNodes).toEqual(['pellet-drive', 'twin-shot']);
  });

  it('does not mutate original state', () => {
    const s = createRunState();
    applyPickedNode(s, 'pellet-drive');
    expect(s.pickedNodes).toHaveLength(0);
  });
});
