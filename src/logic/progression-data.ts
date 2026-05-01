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
  description: string;     // 1-2 sentences for the offer card
}

export const NODES: NodeDefinition[] = [
  // Offense branch
  {
    id: 'pellet-drive', name: 'Pellet Drive', branch: 'offense', tier: 1, pool: 'common', parentId: null,
    description: '+20% bullet damage. Each pellet hits for 12 instead of 10.',
  },
  {
    id: 'twin-shot', name: 'Twin Shot', branch: 'offense', tier: 2, pool: 'uncommon', parentId: 'pellet-drive',
    description: 'Fire 2 parallel pellets per shot with 12px spacing. Same damage per pellet.',
  },
  {
    id: 'piercing-rounds', name: 'Piercing Rounds', branch: 'offense', tier: 3, pool: 'uncommon', parentId: 'twin-shot',
    description: 'Bullets pass through 1 enemy before stopping.',
  },
  {
    id: 'salvo', name: 'Salvo', branch: 'offense', tier: 4, pool: 'rare', parentId: 'piercing-rounds',
    description: 'Every 5th shot fires a burst projectile dealing 3x damage with a larger hitbox.',
  },

  // Defense branch
  {
    id: 'plating', name: 'Plating', branch: 'defense', tier: 1, pool: 'common', parentId: null,
    description: '+1 max HP. Start the run with more room to absorb hits.',
  },
  {
    id: 'hull-memory', name: 'Hull Memory', branch: 'defense', tier: 2, pool: 'uncommon', parentId: 'plating',
    description: 'Regenerate 1 HP every 60 seconds, up to your current max.',
  },
  {
    id: 'static-shielding', name: 'Static Shielding', branch: 'defense', tier: 3, pool: 'uncommon', parentId: 'hull-memory',
    description: 'Taking damage emits a 100px shockwave dealing 25 damage to all nearby enemies.',
  },
  {
    id: 'phoenix-protocol', name: 'Phoenix Protocol', branch: 'defense', tier: 4, pool: 'rare', parentId: 'static-shielding',
    description: 'The first lethal hit this run drops you to 1 HP instead of killing you.',
  },

  // Probe branch
  {
    id: 'reinforced-tether', name: 'Reinforced Tether', branch: 'probe', tier: 1, pool: 'common', parentId: null,
    description: '+1 probe HP. Absorbs one extra Husk-bullet hit before the probe is destroyed.',
  },
  {
    id: 'quick-recall', name: 'Quick Recall', branch: 'probe', tier: 2, pool: 'uncommon', parentId: 'reinforced-tether',
    description: 'Successful return cooldown reduced from 3000ms to 2000ms. Probe faster, salvage more.',
  },
  {
    id: 'infiltration', name: 'Infiltration', branch: 'probe', tier: 3, pool: 'uncommon', parentId: 'quick-recall',
    description: 'Tether a live enemy for 0.5-1.5s to hack it. The hacked enemy fires a burst at its nearest ally.',
  },
  {
    id: 'salvagers-kiss', name: "Salvager's Kiss", branch: 'probe', tier: 4, pool: 'rare', parentId: 'infiltration',
    description: 'Tether a live enemy for 1.5s+ to kill it. The enemy becomes a wreck mid-tether.',
  },

  // Mobility branch
  {
    id: 'thruster-boost', name: 'Thruster Boost', branch: 'mobility', tier: 1, pool: 'common', parentId: null,
    description: '+20% max move speed. Top speed increases from 320 to 384 px/s.',
  },
  {
    id: 'slip-drive', name: 'Slip Drive', branch: 'mobility', tier: 2, pool: 'uncommon', parentId: 'thruster-boost',
    description: 'Probe button while idle triggers a 120px i-frame dash. 1500ms cooldown.',
  },
  {
    id: 'weightless', name: 'Weightless', branch: 'mobility', tier: 3, pool: 'uncommon', parentId: 'slip-drive',
    description: 'Doubles deceleration and removes the vertical movement restriction. Full canvas range.',
  },
  {
    id: 'phase-shift', name: 'Phase Shift', branch: 'mobility', tier: 4, pool: 'rare', parentId: 'weightless',
    description: 'Each time HP drops to exactly 1, enter 3 seconds of ghost mode immune to bullets.',
  },

  // Salvage branch
  {
    id: 'scrap-sense', name: 'Scrap Sense', branch: 'salvage', tier: 1, pool: 'common', parentId: null,
    description: 'Wrecks pulse with a visible glow for 2 seconds after spawning. Never miss a window.',
  },
  {
    id: 'extended-haul', name: 'Extended Haul', branch: 'salvage', tier: 2, pool: 'uncommon', parentId: 'scrap-sense',
    description: 'Wreck expiry time extended from 10 to 18 seconds. More time to tether.',
  },
  {
    id: 'integrity-survey', name: 'Integrity Survey', branch: 'salvage', tier: 3, pool: 'uncommon', parentId: 'extended-haul',
    description: 'Reveals weak points on hulls of enemy classes you have probed before. Weak points take 1.5x damage.',
  },
  {
    id: 'deep-salvage', name: 'Deep Salvage', branch: 'salvage', tier: 4, pool: 'rare', parentId: 'integrity-survey',
    description: 'Tier 1 probe returns draw uncommon offers. Tier 2 returns draw rare offers.',
  },
];
