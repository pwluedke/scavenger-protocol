// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.
import type { InputState } from '../systems/input';

const BULLET_SPEED = 600;
const PLAYER_SPEED = 320;
const ACCELERATION = 1600;
const DECELERATION = 800;
const FIRE_RATE_MS = 200;

const Y_MIN = 432;
const Y_MAX = 684;
const CANVAS_WIDTH = 1280;

export interface Bullet {
  x: number;
  y: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  fireTimer: number;
  bullets: Bullet[];
}

export function createPlayer(): PlayerState {
  return { x: 640, y: 630, vx: 0, vy: 0, hp: 3, fireTimer: 0, bullets: [] };
}

export function updatePlayer(
  state: PlayerState,
  input: InputState,
  deltaMs: number,
): PlayerState {
  const dt = deltaMs / 1000;

  // Normalize input magnitude before applying acceleration
  const inputMagnitude = Math.sqrt(input.moveX ** 2 + input.moveY ** 2);
  const normalizedX = inputMagnitude > 1 ? input.moveX / inputMagnitude : input.moveX;
  const normalizedY = inputMagnitude > 1 ? input.moveY / inputMagnitude : input.moveY;

  // Accelerate or decelerate each axis
  let vx = state.vx;
  let vy = state.vy;

  if (normalizedX !== 0) {
    vx += normalizedX * ACCELERATION * dt;
  } else {
    const decel = DECELERATION * dt;
    vx = Math.abs(vx) <= decel ? 0 : vx - Math.sign(vx) * decel;
  }

  if (normalizedY !== 0) {
    vy += normalizedY * ACCELERATION * dt;
  } else {
    const decel = DECELERATION * dt;
    vy = Math.abs(vy) <= decel ? 0 : vy - Math.sign(vy) * decel;
  }

  // Cap combined speed so diagonal movement matches cardinal max speed
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed > PLAYER_SPEED) {
    const scale = PLAYER_SPEED / speed;
    vx *= scale;
    vy *= scale;
  }

  // Update position
  let x = state.x + vx * dt;
  let y = state.y + vy * dt;

  // Horizontal wrap
  if (x < 0) x = CANVAS_WIDTH;
  if (x > CANVAS_WIDTH) x = 0;

  // Vertical clamp
  y = Math.max(Y_MIN, Math.min(Y_MAX, y));

  // Shooting
  let fireTimer = state.fireTimer + deltaMs;
  let bullets = state.bullets.map((b) => ({ x: b.x, y: b.y - BULLET_SPEED * dt })).filter((b) => b.y >= -10);

  if (input.fire && fireTimer >= FIRE_RATE_MS) {
    bullets = [...bullets, { x, y }];
    fireTimer = 0;
  }

  return { x, y, vx, vy, hp: state.hp, fireTimer, bullets };
}
