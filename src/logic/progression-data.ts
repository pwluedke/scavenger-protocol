// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.
// Node definitions. Driven by docs/tuning.md.

export type Branch = 'offense' | 'defense' | 'probe' | 'mobility' | 'salvage';
export type RarityPool = 'common' | 'uncommon' | 'rare';

export interface NodeDefinition {
  id: string;
  name: string;
  branch: Branch;
  tier: number;
  pool: RarityPool;
  parentId: string | null; // null = root node (tier 1), no prerequisite
}

export const NODES: NodeDefinition[] = [
  // Offense branch
  { id: 'pellet-drive',    name: 'Pellet Drive',      branch: 'offense',  tier: 1, pool: 'common',   parentId: null },
  { id: 'twin-shot',       name: 'Twin Shot',          branch: 'offense',  tier: 2, pool: 'uncommon', parentId: 'pellet-drive' },
  { id: 'piercing-rounds', name: 'Piercing Rounds',    branch: 'offense',  tier: 3, pool: 'uncommon', parentId: 'twin-shot' },
  { id: 'salvo',           name: 'Salvo',              branch: 'offense',  tier: 4, pool: 'rare',     parentId: 'piercing-rounds' },

  // Defense branch
  { id: 'plating',          name: 'Plating',           branch: 'defense',  tier: 1, pool: 'common',   parentId: null },
  { id: 'hull-memory',      name: 'Hull Memory',        branch: 'defense',  tier: 2, pool: 'uncommon', parentId: 'plating' },
  { id: 'static-shielding', name: 'Static Shielding',  branch: 'defense',  tier: 3, pool: 'uncommon', parentId: 'hull-memory' },
  { id: 'phoenix-protocol', name: 'Phoenix Protocol',  branch: 'defense',  tier: 4, pool: 'rare',     parentId: 'static-shielding' },

  // Probe branch
  { id: 'reinforced-tether', name: 'Reinforced Tether', branch: 'probe', tier: 1, pool: 'common',   parentId: null },
  { id: 'quick-recall',      name: 'Quick Recall',       branch: 'probe', tier: 2, pool: 'uncommon', parentId: 'reinforced-tether' },
  { id: 'infiltration',      name: 'Infiltration',       branch: 'probe', tier: 3, pool: 'uncommon', parentId: 'quick-recall' },
  { id: 'salvagers-kiss',    name: "Salvager's Kiss",    branch: 'probe', tier: 4, pool: 'rare',     parentId: 'infiltration' },

  // Mobility branch
  { id: 'thruster-boost', name: 'Thruster Boost', branch: 'mobility', tier: 1, pool: 'common',   parentId: null },
  { id: 'slip-drive',     name: 'Slip Drive',     branch: 'mobility', tier: 2, pool: 'uncommon', parentId: 'thruster-boost' },
  { id: 'weightless',     name: 'Weightless',     branch: 'mobility', tier: 3, pool: 'uncommon', parentId: 'slip-drive' },
  { id: 'phase-shift',    name: 'Phase Shift',    branch: 'mobility', tier: 4, pool: 'rare',     parentId: 'weightless' },

  // Salvage branch
  { id: 'scrap-sense',       name: 'Scrap Sense',       branch: 'salvage', tier: 1, pool: 'common',   parentId: null },
  { id: 'extended-haul',     name: 'Extended Haul',     branch: 'salvage', tier: 2, pool: 'uncommon', parentId: 'scrap-sense' },
  { id: 'integrity-survey',  name: 'Integrity Survey',  branch: 'salvage', tier: 3, pool: 'uncommon', parentId: 'extended-haul' },
  { id: 'deep-salvage',      name: 'Deep Salvage',      branch: 'salvage', tier: 4, pool: 'rare',     parentId: 'integrity-survey' },
];
