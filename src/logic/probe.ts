// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.
import type { InputState } from '../systems/input';
import type { Wreck } from './wreck';
import { salvageTier } from './wreck';

const PROBE_TRAVEL_SPEED = 600;
export const PROBE_HP = 3;
const RETICLE_SPEED = 480;
export const COOLDOWN_RETURN_MS = 3000;
export const COOLDOWN_DESTROYED_MS = 8000;
export const TARGETING_MAX_MS = 3000;
export const TARGETING_COOLDOWN_CANCEL_MS = 1500;
export const TARGETING_COOLDOWN_TIMEOUT_MS = 3000;
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const RETICLE_LOCK_RADIUS = 30; // px: reticle must be within this distance to lock onto a drifting wreck

export type ProbeStatus =
  | 'IDLE'
  | 'TARGETING'
  | 'TARGETING_COOLDOWN'
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
  targetingStartMs: number;
  targetingCooldownEndMs: number;
  candidateWreckId: number | null;
  targetWreckId: number | null;
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
    targetingStartMs: 0,
    targetingCooldownEndMs: 0,
    candidateWreckId: null,
    targetWreckId: null,
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
    x: Math.max(0, Math.min(CANVAS_WIDTH, reticle.x + input.reticleX * RETICLE_SPEED * dt)),
    y: Math.max(0, Math.min(CANVAS_HEIGHT, reticle.y + input.reticleY * RETICLE_SPEED * dt)),
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
  wrecks: Wreck[],
): ProbeState {
  const dt = deltaMs / 1000;

  switch (probe.status) {
    case 'IDLE': {
      if (probeJustPressed && timestamp >= probe.targetingCooldownEndMs && timestamp >= probe.cooldownEndMs) {
        return { ...probe, status: 'TARGETING', hp: PROBE_HP, targetingStartMs: timestamp };
      }
      return probe;
    }

    case 'TARGETING': {
      // Scan for nearest drifting wreck within reticle lock radius
      let candidateWreckId: number | null = null;
      let minDist2 = RETICLE_LOCK_RADIUS * RETICLE_LOCK_RADIUS;
      for (const w of wrecks) {
        if (!w.alive || w.phase !== 'drifting') continue;
        const dx = reticleX - w.x;
        const dy = reticleY - w.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < minDist2) {
          minDist2 = dist2;
          candidateWreckId = w.id;
        }
      }

      if (timestamp - probe.targetingStartMs >= TARGETING_MAX_MS) {
        return {
          ...probe,
          candidateWreckId: null,
          status: 'TARGETING_COOLDOWN',
          targetingCooldownEndMs: timestamp + TARGETING_COOLDOWN_TIMEOUT_MS,
        };
      }
      if (input.cancelProbe) {
        return {
          ...probe,
          candidateWreckId: null,
          status: 'TARGETING_COOLDOWN',
          targetingCooldownEndMs: timestamp + TARGETING_COOLDOWN_CANCEL_MS,
        };
      }
      if (probeJustPressed) {
        const targetWreck = candidateWreckId !== null ? (wrecks.find((w) => w.id === candidateWreckId) ?? null) : null;
        const targetX = targetWreck ? targetWreck.x : reticleX;
        const targetY = targetWreck ? targetWreck.y : reticleY;
        return {
          ...probe,
          status: 'LAUNCHED',
          x: playerX,
          y: playerY,
          targetX,
          targetY,
          targetWreckId: candidateWreckId,
          candidateWreckId: null,
          emptyReturn: candidateWreckId === null,
        };
      }
      return { ...probe, candidateWreckId };
    }

    case 'TARGETING_COOLDOWN': {
      if (timestamp >= probe.targetingCooldownEndMs) {
        return { ...probe, status: 'IDLE' };
      }
      return probe;
    }

    case 'LAUNCHED': {
      const dx = probe.targetX - probe.x;
      const dy = probe.targetY - probe.y;
      const distToTarget = Math.sqrt(dx * dx + dy * dy);
      const moveDistance = PROBE_TRAVEL_SPEED * dt;
      if (distToTarget === 0 || moveDistance >= distToTarget) {
        if (probe.targetWreckId !== null) {
          const targetWreck = wrecks.find((w) => w.id === probe.targetWreckId) ?? null;
          if (!targetWreck || targetWreck.phase !== 'drifting') {
            return { ...probe, x: probe.targetX, y: probe.targetY, status: 'DESTROYED', targetWreckId: null };
          }
          return { ...probe, x: probe.targetX, y: probe.targetY, status: 'TETHERED', tetheredSinceMs: timestamp };
        }
        return { ...probe, x: probe.targetX, y: probe.targetY, status: 'RETURNING', emptyReturn: true };
      }
      const ratio = moveDistance / distToTarget;
      return { ...probe, x: probe.x + dx * ratio, y: probe.y + dy * ratio };
    }

    case 'TETHERED': {
      const tetheredWreck = wrecks.find((w) => w.id === probe.targetWreckId) ?? null;
      if (!tetheredWreck || tetheredWreck.phase !== 'drifting') {
        return { ...probe, status: 'DESTROYED', targetWreckId: null };
      }
      if (probeJustPressed) {
        const holdMs = timestamp - probe.tetheredSinceMs;
        const tier = salvageTier(holdMs);
        return { ...probe, status: 'RETURNING', rewardTier: tier, emptyReturn: false, targetWreckId: null };
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
