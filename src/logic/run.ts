// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.

export interface RunState {
  salvageCount: number;
  salvagePoints: number;
  pickedNodes: string[];
  nextOfferThreshold: number;
}

// Salvage points awarded per probe return tier
export const SALVAGE_TIER_VALUES: Record<number, number> = { 1: 1, 2: 3, 3: 6 };

// Cumulative salvage point thresholds that trigger an offer screen
export const OFFER_THRESHOLDS = [3, 8, 16, 28, 44, 64];

export function createRunState(): RunState {
  return {
    salvageCount: 0,
    salvagePoints: 0,
    pickedNodes: [],
    nextOfferThreshold: OFFER_THRESHOLDS[0],
  };
}

export interface IncrementResult {
  state: RunState;
  offerTriggered: boolean;
  salvageTierForOffer: number;
}

// Updates salvageCount and salvagePoints. Returns offerTriggered if the
// threshold has been crossed, but does NOT advance nextOfferThreshold --
// that happens in applyPickedNode so skip can leave the threshold unchanged.
export function incrementSalvage(state: RunState, tier: number): IncrementResult {
  const newSalvageCount = state.salvageCount + tier;
  const points = SALVAGE_TIER_VALUES[tier] ?? 1;
  const newSalvagePoints = state.salvagePoints + points;

  const offerTriggered = state.nextOfferThreshold !== Infinity && newSalvagePoints >= state.nextOfferThreshold;

  return {
    state: {
      ...state,
      salvageCount: newSalvageCount,
      salvagePoints: newSalvagePoints,
    },
    offerTriggered,
    salvageTierForOffer: tier,
  };
}

export function checkOfferTrigger(state: RunState): boolean {
  return state.nextOfferThreshold !== Infinity && state.salvagePoints >= state.nextOfferThreshold;
}

// Adds the picked node and advances nextOfferThreshold to the next value.
// Called on confirm pick; on skip, call nothing so threshold stays and re-triggers.
export function applyPickedNode(state: RunState, nodeId: string): RunState {
  const thresholdIndex = OFFER_THRESHOLDS.indexOf(state.nextOfferThreshold);
  const nextOfferThreshold =
    thresholdIndex >= 0 ? (OFFER_THRESHOLDS[thresholdIndex + 1] ?? Infinity) : state.nextOfferThreshold;
  return { ...state, pickedNodes: [...state.pickedNodes, nodeId], nextOfferThreshold };
}
