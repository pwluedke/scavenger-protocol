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

export function incrementSalvage(state: RunState, tier: number): IncrementResult {
  const newSalvageCount = state.salvageCount + tier;
  const points = SALVAGE_TIER_VALUES[tier] ?? 1;
  const newSalvagePoints = state.salvagePoints + points;

  const offerTriggered = state.nextOfferThreshold !== Infinity && newSalvagePoints >= state.nextOfferThreshold;

  const nextThresholdIndex = OFFER_THRESHOLDS.indexOf(state.nextOfferThreshold);
  const nextOfferThreshold = offerTriggered
    ? (OFFER_THRESHOLDS[nextThresholdIndex + 1] ?? Infinity)
    : state.nextOfferThreshold;

  return {
    state: {
      ...state,
      salvageCount: newSalvageCount,
      salvagePoints: newSalvagePoints,
      nextOfferThreshold,
    },
    offerTriggered,
    salvageTierForOffer: tier,
  };
}

export function applyPickedNode(state: RunState, nodeId: string): RunState {
  return { ...state, pickedNodes: [...state.pickedNodes, nodeId] };
}
