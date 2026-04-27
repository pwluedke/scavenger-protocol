// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.
import type { InputState } from '../systems/input';

const PROBE_TRAVEL_SPEED = 600;
export const PROBE_HP = 3;
const RETICLE_SPEED = 480;
export const COOLDOWN_RETURN_MS = 3000;
export const COOLDOWN_DESTROYED_MS = 8000;
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export type ProbeStatus =
  | 'IDLE'
  | 'TARGETING'
  | 'LAUNCHED'
  | 'TETHERED'
  | 'RETURNING'
  | 'DESTROYED'
  | 'COOLDOWN';

export interface ProbeState {
  status: ProbeStatus;
  x: number;
  y: number;
  hp: number;
  targetX: number;
  targetY: number;
  tetheredSinceMs: number;
  cooldownEndMs: number;
  cooldownTotalMs: number;
  rewardTier: number;
  rewardFlashEndMs: number;
  emptyReturn: boolean;
}

export interface ReticleState {
  x: number;
  y: number;
}

export function createProbe(): ProbeState {
  return {
    status: 'IDLE',
    x: 0,
    y: 0,
    hp: PROBE_HP,
    targetX: 0,
    targetY: 0,
    tetheredSinceMs: 0,
    cooldownEndMs: 0,
    cooldownTotalMs: 0,
    rewardTier: 0,
    rewardFlashEndMs: 0,
    emptyReturn: false,
  };
}

export function createReticle(): ReticleState {
  return { x: 640, y: 570 };
}

export function updateReticle(
  reticle: ReticleState,
  input: InputState,
  deltaMs: number,
): ReticleState {
  const dt = deltaMs / 1000;
  return {
    x: Math.max(0, Math.min(CANVAS_WIDTH, reticle.x + input.moveX * RETICLE_SPEED * dt)),
    y: Math.max(0, Math.min(CANVAS_HEIGHT, reticle.y + input.moveY * RETICLE_SPEED * dt)),
  };
}

export function probeTakeHit(probe: ProbeState, timestamp: number): ProbeState {
  const hp = probe.hp - 1;
  if (hp <= 0) {
    return {
      ...probe,
      hp: 0,
      status: 'DESTROYED',
      cooldownTotalMs: COOLDOWN_DESTROYED_MS,
      cooldownEndMs: timestamp + COOLDOWN_DESTROYED_MS,
    };
  }
  return { ...probe, hp };
}

export function updateProbe(
  probe: ProbeState,
  input: InputState,
  playerX: number,
  playerY: number,
  deltaMs: number,
  timestamp: number,
  reticleX: number,
  reticleY: number,
  probeJustPressed: boolean,
): ProbeState {
  const dt = deltaMs / 1000;

  switch (probe.status) {
    case 'IDLE': {
      if (probeJustPressed) {
        return { ...probe, status: 'TARGETING', hp: PROBE_HP };
      }
      return probe;
    }

    case 'TARGETING': {
      if (input.cancelProbe) {
        return { ...probe, status: 'IDLE' };
      }
      if (probeJustPressed) {
        return {
          ...probe,
          status: 'LAUNCHED',
          x: playerX,
          y: playerY,
          targetX: reticleX,
          targetY: reticleY,
          emptyReturn: true,
        };
      }
      return probe;
    }

    case 'LAUNCHED': {
      const dx = probe.targetX - probe.x;
      const dy = probe.targetY - probe.y;
      const distToTarget = Math.sqrt(dx * dx + dy * dy);
      const moveDistance = PROBE_TRAVEL_SPEED * dt;
      if (distToTarget === 0 || moveDistance >= distToTarget) {
        return {
          ...probe,
          x: probe.targetX,
          y: probe.targetY,
          status: 'RETURNING',
          emptyReturn: true,
        };
      }
      const ratio = moveDistance / distToTarget;
      return { ...probe, x: probe.x + dx * ratio, y: probe.y + dy * ratio };
    }

    case 'TETHERED': {
      if (probeJustPressed) {
        return { ...probe, status: 'RETURNING', rewardTier: 1, emptyReturn: false };
      }
      return probe;
    }

    case 'RETURNING': {
      const dx = playerX - probe.x;
      const dy = playerY - probe.y;
      const distToPlayer = Math.sqrt(dx * dx + dy * dy);
      const moveDistance = PROBE_TRAVEL_SPEED * dt;
      if (distToPlayer === 0 || moveDistance >= distToPlayer) {
        const cooldownTotalMs = COOLDOWN_RETURN_MS;
        const cooldownEndMs = timestamp + cooldownTotalMs;
        const rewardFlashEndMs = probe.emptyReturn ? probe.rewardFlashEndMs : timestamp + 2000;
        return {
          ...probe,
          x: playerX,
          y: playerY,
          status: 'COOLDOWN',
          cooldownTotalMs,
          cooldownEndMs,
          rewardFlashEndMs,
        };
      }
      const ratio = moveDistance / distToPlayer;
      return { ...probe, x: probe.x + dx * ratio, y: probe.y + dy * ratio };
    }

    case 'DESTROYED': {
      return {
        ...probe,
        status: 'COOLDOWN',
        cooldownTotalMs: COOLDOWN_DESTROYED_MS,
        cooldownEndMs: timestamp + COOLDOWN_DESTROYED_MS,
      };
    }

    case 'COOLDOWN': {
      if (timestamp >= probe.cooldownEndMs) {
        return { ...probe, status: 'IDLE', hp: PROBE_HP };
      }
      return probe;
    }
  }
}
