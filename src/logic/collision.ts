// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.
// Circle-circle collision using squared distance. No Math.sqrt.
import type { Bullet } from './player';
import type { Driftling, Husk } from './enemies';
import { DRIFTLING_HIT_RADIUS, HUSK_HIT_RADIUS } from './enemies';
import type { Wreck } from './wreck';
import { WRECK_HIT_RADIUS } from './wreck';

export const BULLET_HIT_RADIUS = 4;

function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const sumR = ar + br;
  return dx * dx + dy * dy < sumR * sumR;
}

export function bulletEnemyHits(
  bullets: Bullet[],
  enemies: Driftling[],
): { bulletIndex: number; enemyId: number }[] {
  const hits: { bulletIndex: number; enemyId: number }[] = [];
  for (let bi = 0; bi < bullets.length; bi++) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (circlesOverlap(bullets[bi].x, bullets[bi].y, BULLET_HIT_RADIUS, enemy.x, enemy.y, DRIFTLING_HIT_RADIUS)) {
        hits.push({ bulletIndex: bi, enemyId: enemy.id });
      }
    }
  }
  return hits;
}

export function playerEnemyHits(
  player: { x: number; y: number; radius: number },
  enemies: Driftling[],
): number[] {
  const ids: number[] = [];
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (circlesOverlap(player.x, player.y, player.radius, enemy.x, enemy.y, DRIFTLING_HIT_RADIUS)) {
      ids.push(enemy.id);
    }
  }
  return ids;
}

export function bulletHuskHits(
  bullets: Bullet[],
  husks: Husk[],
): { bulletIndex: number; huskId: number }[] {
  const hits: { bulletIndex: number; huskId: number }[] = [];
  for (let bi = 0; bi < bullets.length; bi++) {
    for (const husk of husks) {
      if (!husk.alive) continue;
      if (circlesOverlap(bullets[bi].x, bullets[bi].y, BULLET_HIT_RADIUS, husk.x, husk.y, HUSK_HIT_RADIUS)) {
        hits.push({ bulletIndex: bi, huskId: husk.id });
      }
    }
  }
  return hits;
}

export function playerHuskHits(
  player: { x: number; y: number; radius: number },
  husks: Husk[],
): number[] {
  const ids: number[] = [];
  for (const husk of husks) {
    if (!husk.alive) continue;
    if (circlesOverlap(player.x, player.y, player.radius, husk.x, husk.y, HUSK_HIT_RADIUS)) {
      ids.push(husk.id);
    }
  }
  return ids;
}

export function playerWreckHits(
  player: { x: number; y: number; radius: number },
  wrecks: Wreck[],
): number[] {
  const ids: number[] = [];
  for (const wreck of wrecks) {
    if (!wreck.alive || wreck.phase !== 'drifting') continue;
    if (circlesOverlap(player.x, player.y, player.radius, wreck.x, wreck.y, WRECK_HIT_RADIUS)) {
      ids.push(wreck.id);
    }
  }
  return ids;
}
