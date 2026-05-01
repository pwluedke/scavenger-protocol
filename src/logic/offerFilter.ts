// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.

import { NODES, NodeDefinition, RarityPool } from './progression-data';
import type { Rng } from './rng';

const POOL_ORDER: RarityPool[] = ['rare', 'uncommon', 'common'];

// Returns pool appropriate for the given salvage tier, accounting for Deep Salvage upgrade.
function poolForTier(salvageTier: number, pickedNodes: string[]): RarityPool {
  const hasDeepSalvage = pickedNodes.includes('deep-salvage');
  if (hasDeepSalvage) {
    // Tier 1 -> uncommon, Tier 2 -> rare, Tier 3 -> rare (unchanged)
    if (salvageTier === 1) return 'uncommon';
    return 'rare';
  }
  if (salvageTier >= 3) return 'rare';
  if (salvageTier === 2) return 'uncommon';
  return 'common';
}

function eligibleNodes(pickedNodes: string[], pool: RarityPool): NodeDefinition[] {
  return NODES.filter((n) => {
    if (n.pool !== pool) return false;
    if (pickedNodes.includes(n.id)) return false;
    // Tier-1 nodes have no prerequisite; always eligible if not picked
    if (n.parentId === null) return true;
    return pickedNodes.includes(n.parentId);
  });
}

// Assembles 3 offers for the player, drawing from the target pool and falling
// back to lower pools if needed to reach 3. Returns empty array when no nodes
// are available at all (end-of-tree state; offer screen should not fire).
export function getValidOffers(pickedNodes: string[], salvageTier: number, rng: Rng): NodeDefinition[] {
  const targetPool = poolForTier(salvageTier, pickedNodes);
  const poolFallbackOrder = POOL_ORDER.slice(POOL_ORDER.indexOf(targetPool));

  const offers: NodeDefinition[] = [];
  const usedIds = new Set<string>();

  for (const pool of poolFallbackOrder) {
    if (offers.length >= 3) break;
    const candidates = eligibleNodes(pickedNodes, pool).filter((n) => !usedIds.has(n.id));
    // Shuffle candidates via rng to avoid always offering the first alphabetical nodes
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (const node of shuffled) {
      if (offers.length >= 3) break;
      offers.push(node);
      usedIds.add(node.id);
    }
  }

  return offers;
}
