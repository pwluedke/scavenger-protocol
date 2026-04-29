import { bulletEnemyHits, playerEnemyHits, bulletHuskHits, playerHuskHits, playerWreckHits, BULLET_HIT_RADIUS } from './collision';
import { DRIFTLING_HIT_RADIUS, HUSK_HIT_RADIUS } from './enemies';
import type { Driftling, Husk } from './enemies';
import { WRECK_HIT_RADIUS } from './wreck';
import type { Wreck } from './wreck';
import type { Bullet } from './player';

function makeDriftling(id: number, x: number, y: number, alive = true): Driftling {
  return {
    id,
    x,
    y,
    spawnX: x,
    amplitude: 0,
    frequency: 0.5,
    phase: 0,
    spawnedAtMs: 0,
    hp: 1,
    alive,
  };
}

function makeBullet(x: number, y: number): Bullet {
  return { x, y };
}

const COMBINED_BULLET = BULLET_HIT_RADIUS + DRIFTLING_HIT_RADIUS; // 18
const COMBINED_PLAYER = 16 + DRIFTLING_HIT_RADIUS; // 30

describe('bulletEnemyHits', () => {
  it('returns a hit when bullet is at the center of an enemy', () => {
    const bullets = [makeBullet(200, 200)];
    const enemies = [makeDriftling(1, 200, 200)];
    expect(bulletEnemyHits(bullets, enemies)).toEqual([{ bulletIndex: 0, enemyId: 1 }]);
  });

  it('returns a hit when bullet is just within the combined radius', () => {
    // distance = combined - 1, should hit
    const bullets = [makeBullet(200, 200)];
    const enemies = [makeDriftling(1, 200 + COMBINED_BULLET - 1, 200)];
    expect(bulletEnemyHits(bullets, enemies)).toHaveLength(1);
  });

  it('returns no hit when bullet is just outside the combined radius', () => {
    // distance = combined + 1, should miss
    const bullets = [makeBullet(200, 200)];
    const enemies = [makeDriftling(1, 200 + COMBINED_BULLET + 1, 200)];
    expect(bulletEnemyHits(bullets, enemies)).toHaveLength(0);
  });

  it('returns the correct bulletIndex', () => {
    const bullets = [makeBullet(0, 0), makeBullet(200, 200)];
    const enemies = [makeDriftling(5, 200, 200)];
    const hits = bulletEnemyHits(bullets, enemies);
    expect(hits).toHaveLength(1);
    expect(hits[0].bulletIndex).toBe(1);
  });

  it('returns the correct enemyId (uses stable id, not array index)', () => {
    const bullets = [makeBullet(200, 200)];
    const enemies = [makeDriftling(42, 200, 200)];
    const hits = bulletEnemyHits(bullets, enemies);
    expect(hits[0].enemyId).toBe(42);
  });

  it('two bullets each hitting different enemies returns two entries', () => {
    const bullets = [makeBullet(100, 100), makeBullet(300, 300)];
    const enemies = [makeDriftling(1, 100, 100), makeDriftling(2, 300, 300)];
    const hits = bulletEnemyHits(bullets, enemies);
    expect(hits).toHaveLength(2);
    expect(hits[0]).toEqual({ bulletIndex: 0, enemyId: 1 });
    expect(hits[1]).toEqual({ bulletIndex: 1, enemyId: 2 });
  });

  it('skips enemies with alive=false', () => {
    const bullets = [makeBullet(200, 200)];
    const enemies = [makeDriftling(1, 200, 200, false)];
    expect(bulletEnemyHits(bullets, enemies)).toHaveLength(0);
  });

  it('returns empty array when bullets is empty', () => {
    const enemies = [makeDriftling(1, 200, 200)];
    expect(bulletEnemyHits([], enemies)).toHaveLength(0);
  });

  it('returns empty array when enemies is empty', () => {
    const bullets = [makeBullet(200, 200)];
    expect(bulletEnemyHits(bullets, [])).toHaveLength(0);
  });
});

describe('playerEnemyHits', () => {
  const player = { x: 640, y: 600, radius: 16 };

  it('returns enemy id when player overlaps enemy', () => {
    const enemies = [makeDriftling(7, 640, 600)];
    expect(playerEnemyHits(player, enemies)).toEqual([7]);
  });

  it('returns hit when player is just within combined radius', () => {
    const enemies = [makeDriftling(1, 640 + COMBINED_PLAYER - 1, 600)];
    expect(playerEnemyHits(player, enemies)).toHaveLength(1);
  });

  it('returns no hit when player is just outside combined radius', () => {
    const enemies = [makeDriftling(1, 640 + COMBINED_PLAYER + 1, 600)];
    expect(playerEnemyHits(player, enemies)).toHaveLength(0);
  });

  it('returns multiple ids when player overlaps multiple enemies', () => {
    const enemies = [makeDriftling(3, 640, 600), makeDriftling(4, 641, 601)];
    const ids = playerEnemyHits(player, enemies);
    expect(ids).toContain(3);
    expect(ids).toContain(4);
  });

  it('skips enemies with alive=false', () => {
    const enemies = [makeDriftling(1, 640, 600, false)];
    expect(playerEnemyHits(player, enemies)).toHaveLength(0);
  });

  it('returns empty array when enemies is empty', () => {
    expect(playerEnemyHits(player, [])).toHaveLength(0);
  });
});

function makeHusk(id: number, x: number, y: number, alive = true): Husk {
  return { id, x, y, hp: 4, alive, spawnedAtMs: 0 };
}

function makeWreck(id: number, x: number, y: number, phase: 'settled' | 'falling' = 'settled', alive = true): Wreck {
  return { id, x, y, vx: 0, vy: 25, phase, settledAt: 0, scale: 1.0, alive };
}

const COMBINED_BULLET_HUSK = BULLET_HIT_RADIUS + HUSK_HIT_RADIUS; // 28
const COMBINED_PLAYER_HUSK = 16 + HUSK_HIT_RADIUS; // 40
const COMBINED_PLAYER_WRECK = 16 + WRECK_HIT_RADIUS; // 32

describe('bulletHuskHits', () => {
  it('returns a hit when bullet is at the center of a husk', () => {
    const bullets = [makeBullet(200, 200)];
    const husks = [makeHusk(1, 200, 200)];
    expect(bulletHuskHits(bullets, husks)).toEqual([{ bulletIndex: 0, huskId: 1 }]);
  });

  it('returns a hit within combined radius', () => {
    const bullets = [makeBullet(200, 200)];
    const husks = [makeHusk(1, 200 + COMBINED_BULLET_HUSK - 1, 200)];
    expect(bulletHuskHits(bullets, husks)).toHaveLength(1);
  });

  it('returns no hit outside combined radius', () => {
    const bullets = [makeBullet(200, 200)];
    const husks = [makeHusk(1, 200 + COMBINED_BULLET_HUSK + 1, 200)];
    expect(bulletHuskHits(bullets, husks)).toHaveLength(0);
  });

  it('skips husks with alive=false', () => {
    const bullets = [makeBullet(200, 200)];
    const husks = [makeHusk(1, 200, 200, false)];
    expect(bulletHuskHits(bullets, husks)).toHaveLength(0);
  });

  it('returns empty when husks is empty', () => {
    expect(bulletHuskHits([makeBullet(200, 200)], [])).toHaveLength(0);
  });
});

describe('playerHuskHits', () => {
  const player = { x: 640, y: 600, radius: 16 };

  it('returns husk id when player overlaps husk', () => {
    expect(playerHuskHits(player, [makeHusk(5, 640, 600)])).toEqual([5]);
  });

  it('returns hit within combined radius', () => {
    expect(playerHuskHits(player, [makeHusk(1, 640 + COMBINED_PLAYER_HUSK - 1, 600)])).toHaveLength(1);
  });

  it('returns no hit outside combined radius', () => {
    expect(playerHuskHits(player, [makeHusk(1, 640 + COMBINED_PLAYER_HUSK + 1, 600)])).toHaveLength(0);
  });

  it('skips husks with alive=false', () => {
    expect(playerHuskHits(player, [makeHusk(1, 640, 600, false)])).toHaveLength(0);
  });

  it('returns empty when husks is empty', () => {
    expect(playerHuskHits(player, [])).toHaveLength(0);
  });
});

describe('playerWreckHits', () => {
  const player = { x: 640, y: 600, radius: 16 };

  it('returns wreck id when player overlaps settled wreck', () => {
    expect(playerWreckHits(player, [makeWreck(3, 640, 600)])).toEqual([3]);
  });

  it('returns hit within combined radius for settled wreck', () => {
    expect(playerWreckHits(player, [makeWreck(1, 640 + COMBINED_PLAYER_WRECK - 1, 600)])).toHaveLength(1);
  });

  it('returns no hit outside combined radius', () => {
    expect(playerWreckHits(player, [makeWreck(1, 640 + COMBINED_PLAYER_WRECK + 1, 600)])).toHaveLength(0);
  });

  it('skips falling wrecks', () => {
    expect(playerWreckHits(player, [makeWreck(1, 640, 600, 'falling')])).toHaveLength(0);
  });

  it('skips wrecks with alive=false', () => {
    expect(playerWreckHits(player, [makeWreck(1, 640, 600, 'settled', false)])).toHaveLength(0);
  });

  it('returns empty when wrecks is empty', () => {
    expect(playerWreckHits(player, [])).toHaveLength(0);
  });
});
