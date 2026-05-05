import {
  createRunState,
  incrementSalvage,
  checkOfferTrigger,
  applyPickedNode,
  OFFER_THRESHOLDS,
  SALVAGE_TIER_VALUES,
} from './run';

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
    ({ state: s } = incrementSalvage(s, 1));
    ({ state: s } = incrementSalvage(s, 1));
    ({ state: s } = incrementSalvage(s, 1));
    expect(s.salvagePoints).toBe(3);
    expect(s.salvageCount).toBe(3);
  });
});

describe('incrementSalvage -- offer trigger', () => {
  it('does not trigger offer below first threshold', () => {
    let state = createRunState();
    ({ state } = incrementSalvage(state, 1));
    const { offerTriggered } = incrementSalvage(state, 1); // 2 points, threshold=3
    expect(offerTriggered).toBe(false);
  });

  it('triggers offer when points reach first threshold', () => {
    let state = createRunState();
    ({ state } = incrementSalvage(state, 1));
    ({ state } = incrementSalvage(state, 1));
    const { offerTriggered } = incrementSalvage(state, 1); // 3 points
    expect(offerTriggered).toBe(true);
  });

  it('triggers offer when points exceed threshold in a single return', () => {
    const s = createRunState(); // threshold = 3
    const { offerTriggered } = incrementSalvage(s, 3); // 6 points
    expect(offerTriggered).toBe(true);
  });

  it('does not advance nextOfferThreshold on trigger', () => {
    let state = createRunState(); // threshold = OFFER_THRESHOLDS[0]
    ({ state } = incrementSalvage(state, 1));
    ({ state } = incrementSalvage(state, 1));
    ({ state } = incrementSalvage(state, 1)); // offerTriggered, but threshold must NOT advance
    expect(state.nextOfferThreshold).toBe(OFFER_THRESHOLDS[0]); // still 3
  });

  it('does not trigger when threshold is Infinity', () => {
    const state = { ...createRunState(), nextOfferThreshold: Infinity, salvagePoints: 9999 };
    const { offerTriggered } = incrementSalvage(state, 3);
    expect(offerTriggered).toBe(false);
  });
});

describe('checkOfferTrigger', () => {
  it('returns false when salvagePoints is below threshold', () => {
    const s = createRunState(); // points=0, threshold=3
    expect(checkOfferTrigger(s)).toBe(false);
  });

  it('returns true when salvagePoints meets threshold', () => {
    let state = createRunState();
    ({ state } = incrementSalvage(state, 3)); // 6 points >= threshold of 3
    expect(checkOfferTrigger(state)).toBe(true);
  });

  it('returns true when salvagePoints exceeds threshold', () => {
    let state = createRunState();
    for (let i = 0; i < 5; i++) ({ state } = incrementSalvage(state, 1)); // 5 points >= 3
    expect(checkOfferTrigger(state)).toBe(true);
  });

  it('returns false when threshold is Infinity', () => {
    const s = { ...createRunState(), nextOfferThreshold: Infinity, salvagePoints: 9999 };
    expect(checkOfferTrigger(s)).toBe(false);
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

  it('advances nextOfferThreshold to the next value', () => {
    const s = createRunState(); // threshold = OFFER_THRESHOLDS[0] = 3
    const updated = applyPickedNode(s, 'pellet-drive');
    expect(updated.nextOfferThreshold).toBe(OFFER_THRESHOLDS[1]); // 8
  });

  it('sets nextOfferThreshold to Infinity after last threshold', () => {
    const lastThreshold = OFFER_THRESHOLDS[OFFER_THRESHOLDS.length - 1];
    const s = { ...createRunState(), nextOfferThreshold: lastThreshold };
    const updated = applyPickedNode(s, 'pellet-drive');
    expect(updated.nextOfferThreshold).toBe(Infinity);
  });

  it('does not change nextOfferThreshold when already Infinity', () => {
    const s = { ...createRunState(), nextOfferThreshold: Infinity };
    const updated = applyPickedNode(s, 'pellet-drive');
    expect(updated.nextOfferThreshold).toBe(Infinity);
  });
});
