import { bulletEnemyHits, playerEnemyHits, BULLET_HIT_RADIUS } from './collision';
import { DRIFTLING_HIT_RADIUS } from './enemies';
import type { Driftling } from './enemies';
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
