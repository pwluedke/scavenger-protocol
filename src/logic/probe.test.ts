import {
  createProbe,
  createReticle,
  updateProbe,
  updateReticle,
  probeTakeHit,
  ProbeState,
  PROBE_HP,
  COOLDOWN_RETURN_MS,
  COOLDOWN_DESTROYED_MS,
  TARGETING_MAX_MS,
  TARGETING_COOLDOWN_CANCEL_MS,
  TARGETING_COOLDOWN_TIMEOUT_MS,
} from './probe';
import type { InputState } from '../systems/input';
import { spawnWreck } from './wreck';
import type { Wreck } from './wreck';

const IDLE_INPUT: InputState = {
  moveX: 0, moveY: 0, reticleX: 0, reticleY: 0, fire: false, probe: false, cancelProbe: false, pause: false, dash: false,
};

function withInput(overrides: Partial<InputState>): InputState {
  return { ...IDLE_INPUT, ...overrides };
}

const PLAYER_X = 640;
const PLAYER_Y = 630;

function step(
  probe: ProbeState,
  opts: {
    input?: InputState;
    deltaMs?: number;
    timestamp?: number;
    reticleX?: number;
    reticleY?: number;
    probeJustPressed?: boolean;
    wrecks?: Wreck[];
  } = {},
): ProbeState {
  return updateProbe(
    probe,
    opts.input ?? IDLE_INPUT,
    PLAYER_X,
    PLAYER_Y,
    opts.deltaMs ?? 16,
    opts.timestamp ?? 0,
    opts.reticleX ?? 640,
    opts.reticleY ?? 200,
    opts.probeJustPressed ?? false,
    opts.wrecks ?? [],
  );
}

describe('createProbe', () => {
  it('returns correct initial IDLE state', () => {
    const p = createProbe();
    expect(p.status).toBe('IDLE');
    expect(p.hp).toBe(PROBE_HP);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
    expect(p.emptyReturn).toBe(false);
    expect(p.rewardTier).toBe(0);
    expect(p.cooldownEndMs).toBe(0);
    expect(p.cooldownTotalMs).toBe(0);
    expect(p.rewardFlashEndMs).toBe(0);
    expect(p.targetingCooldownEndMs).toBe(0);
    expect(p.candidateWreckId).toBeNull();
    expect(p.targetWreckId).toBeNull();
  });
});

describe('IDLE', () => {
  it('transitions to TARGETING on probeJustPressed', () => {
    const after = step(createProbe(), { probeJustPressed: true });
    expect(after.status).toBe('TARGETING');
    expect(after.hp).toBe(PROBE_HP);
  });

  it('stays IDLE when probe not just pressed', () => {
    expect(step(createProbe()).status).toBe('IDLE');
  });

  it('cannot enter TARGETING while targetingCooldownEndMs has not expired', () => {
    const blocked: ProbeState = { ...createProbe(), targetingCooldownEndMs: 2000 };
    const after = step(blocked, { probeJustPressed: true, timestamp: 1999 });
    expect(after.status).toBe('IDLE');
  });

  it('can enter TARGETING when targetingCooldownEndMs has expired', () => {
    const blocked: ProbeState = { ...createProbe(), targetingCooldownEndMs: 2000 };
    const after = step(blocked, { probeJustPressed: true, timestamp: 2000 });
    expect(after.status).toBe('TARGETING');
  });
});

describe('TARGETING', () => {
  const targeting: ProbeState = { ...createProbe(), status: 'TARGETING', targetingStartMs: 0 };

  it('transitions to TARGETING_COOLDOWN on cancelProbe, sets 1500ms cooldown', () => {
    const after = step(targeting, { input: withInput({ cancelProbe: true }), timestamp: 1000 });
    expect(after.status).toBe('TARGETING_COOLDOWN');
    expect(after.targetingCooldownEndMs).toBe(1000 + TARGETING_COOLDOWN_CANCEL_MS);
  });

  it('transitions to TARGETING_COOLDOWN on timeout, sets 3000ms cooldown', () => {
    const after = step(targeting, { timestamp: TARGETING_MAX_MS });
    expect(after.status).toBe('TARGETING_COOLDOWN');
    expect(after.targetingCooldownEndMs).toBe(TARGETING_MAX_MS + TARGETING_COOLDOWN_TIMEOUT_MS);
  });

  it('transitions to LAUNCHED on probeJustPressed (launches to reticle position)', () => {
    const after = step(targeting, { probeJustPressed: true, reticleX: 800, reticleY: 300 });
    expect(after.status).toBe('LAUNCHED');
    expect(after.targetX).toBe(800);
    expect(after.targetY).toBe(300);
    expect(after.x).toBe(PLAYER_X);
    expect(after.y).toBe(PLAYER_Y);
    expect(after.emptyReturn).toBe(true);
  });

  it('LAUNCHED does not set targetingCooldownEndMs', () => {
    const after = step(targeting, { probeJustPressed: true });
    expect(after.targetingCooldownEndMs).toBe(0);
  });

  it('stays TARGETING with no input before timeout', () => {
    expect(step(targeting, { timestamp: TARGETING_MAX_MS - 1 }).status).toBe('TARGETING');
  });
});

describe('TARGETING_COOLDOWN', () => {
  it('transitions to IDLE when timestamp >= targetingCooldownEndMs', () => {
    const tc: ProbeState = { ...createProbe(), status: 'TARGETING_COOLDOWN', targetingCooldownEndMs: 2000 };
    expect(step(tc, { timestamp: 2000 }).status).toBe('IDLE');
  });

  it('stays TARGETING_COOLDOWN before targetingCooldownEndMs', () => {
    const tc: ProbeState = { ...createProbe(), status: 'TARGETING_COOLDOWN', targetingCooldownEndMs: 2000 };
    expect(step(tc, { timestamp: 1999 }).status).toBe('TARGETING_COOLDOWN');
  });
});

describe('LAUNCHED', () => {
  it('transitions to RETURNING on arrival at target with emptyReturn true', () => {
    const launched: ProbeState = {
      ...createProbe(),
      status: 'LAUNCHED',
      x: 640,
      y: 630,
      targetX: 648,
      targetY: 630,
    };
    // 600 px/s * 0.016s = 9.6px move, distToTarget = 8px -- arrives
    const after = step(launched, { deltaMs: 16 });
    expect(after.status).toBe('RETURNING');
    expect(after.emptyReturn).toBe(true);
    expect(after.x).toBe(648);
    expect(after.y).toBe(630);
  });

  it('moves toward target when not yet arrived', () => {
    const launched: ProbeState = {
      ...createProbe(),
      status: 'LAUNCHED',
      x: 640,
      y: 630,
      targetX: 640,
      targetY: 100,
    };
    const after = step(launched, { deltaMs: 16 });
    expect(after.status).toBe('LAUNCHED');
    expect(after.y).toBeLessThan(630);
  });
});

describe('RETURNING', () => {
  it('transitions to COOLDOWN on arrival at player', () => {
    const returning: ProbeState = {
      ...createProbe(),
      status: 'RETURNING',
      x: PLAYER_X,
      y: PLAYER_Y,
      emptyReturn: true,
    };
    const after = step(returning, { timestamp: 1000 });
    expect(after.status).toBe('COOLDOWN');
    expect(after.cooldownTotalMs).toBe(COOLDOWN_RETURN_MS);
    expect(after.cooldownEndMs).toBe(1000 + COOLDOWN_RETURN_MS);
  });

  it('does not set rewardFlashEndMs when emptyReturn is true', () => {
    const returning: ProbeState = {
      ...createProbe(),
      status: 'RETURNING',
      x: PLAYER_X,
      y: PLAYER_Y,
      emptyReturn: true,
      rewardFlashEndMs: 0,
    };
    const after = step(returning, { timestamp: 1000 });
    expect(after.rewardFlashEndMs).toBe(0);
  });
});

describe('COOLDOWN', () => {
  it('transitions to IDLE when timestamp >= cooldownEndMs', () => {
    const cooldown: ProbeState = {
      ...createProbe(),
      status: 'COOLDOWN',
      cooldownEndMs: 5000,
      cooldownTotalMs: 3000,
    };
    const after = step(cooldown, { timestamp: 5000 });
    expect(after.status).toBe('IDLE');
    expect(after.hp).toBe(PROBE_HP);
  });

  it('stays COOLDOWN before cooldownEndMs', () => {
    const cooldown: ProbeState = {
      ...createProbe(),
      status: 'COOLDOWN',
      cooldownEndMs: 5000,
      cooldownTotalMs: 3000,
    };
    expect(step(cooldown, { timestamp: 4999 }).status).toBe('COOLDOWN');
  });
});

describe('DESTROYED', () => {
  it('transitions to COOLDOWN immediately with 8000ms cooldown', () => {
    const destroyed: ProbeState = { ...createProbe(), status: 'DESTROYED' };
    const after = step(destroyed, { timestamp: 1000 });
    expect(after.status).toBe('COOLDOWN');
    expect(after.cooldownTotalMs).toBe(COOLDOWN_DESTROYED_MS);
    expect(after.cooldownEndMs).toBe(1000 + COOLDOWN_DESTROYED_MS);
  });
});

describe('probeTakeHit', () => {
  it('decrements HP', () => {
    expect(probeTakeHit(createProbe(), 0).hp).toBe(PROBE_HP - 1);
  });

  it('enters DESTROYED when HP reaches 0', () => {
    const lowHp: ProbeState = { ...createProbe(), hp: 1 };
    const after = probeTakeHit(lowHp, 500);
    expect(after.status).toBe('DESTROYED');
    expect(after.cooldownEndMs).toBe(500 + COOLDOWN_DESTROYED_MS);
  });
});

describe('TARGETING -- wreck candidate detection', () => {
  const targeting: ProbeState = { ...createProbe(), status: 'TARGETING', targetingStartMs: 0 };

  it('sets candidateWreckId when drifting wreck is within 30px of reticle', () => {
    const wreck = spawnWreck(42, 640, 200, 0); // reticle default is (640, 200)
    const after = step(targeting, { wrecks: [wreck] });
    expect(after.candidateWreckId).toBe(42);
  });

  it('leaves candidateWreckId null when wreck is beyond 30px', () => {
    const wreck = spawnWreck(1, 640, 300, 0); // 100px below default reticle (640, 200)
    const after = step(targeting, { wrecks: [wreck] });
    expect(after.candidateWreckId).toBeNull();
  });

  it('leaves candidateWreckId null when wreck is in falling phase', () => {
    const wreck: Wreck = { ...spawnWreck(1, 640, 200, 0), phase: 'midFall' };
    const after = step(targeting, { wrecks: [wreck] });
    expect(after.candidateWreckId).toBeNull();
  });

  it('picks the nearest wreck when multiple are within range', () => {
    const close = spawnWreck(10, 641, 200, 0); // 1px away
    const far = spawnWreck(20, 650, 200, 0);   // 10px away
    const after = step(targeting, { wrecks: [far, close] });
    expect(after.candidateWreckId).toBe(10);
  });

  it('when launched with a candidate, sets targetX/Y to wreck position and emptyReturn=false', () => {
    const wreck = spawnWreck(5, 640, 200, 0);
    const after = step(targeting, { probeJustPressed: true, wrecks: [wreck] });
    expect(after.status).toBe('LAUNCHED');
    expect(after.targetX).toBe(640);
    expect(after.targetY).toBe(200);
    expect(after.targetWreckId).toBe(5);
    expect(after.emptyReturn).toBe(false);
  });

  it('when launched with no candidate, flies to reticle with emptyReturn=true', () => {
    const after = step(targeting, { probeJustPressed: true, reticleX: 800, reticleY: 300 });
    expect(after.status).toBe('LAUNCHED');
    expect(after.targetX).toBe(800);
    expect(after.targetY).toBe(300);
    expect(after.targetWreckId).toBeNull();
    expect(after.emptyReturn).toBe(true);
  });
});

describe('LAUNCHED -- wreck arrival', () => {
  function launchedAtWreck(wreckId: number): ProbeState {
    return {
      ...createProbe(),
      status: 'LAUNCHED',
      x: 640,
      y: 630,
      targetX: 648,
      targetY: 630,
      targetWreckId: wreckId,
      emptyReturn: false,
    };
  }

  it('transitions to TETHERED on arrival when target wreck is still drifting', () => {
    const wreck = spawnWreck(7, 648, 630, 0);
    const after = step(launchedAtWreck(7), { deltaMs: 16, timestamp: 100, wrecks: [wreck] });
    expect(after.status).toBe('TETHERED');
    expect(after.tetheredSinceMs).toBe(100);
  });

  it('transitions to DESTROYED on arrival when target wreck has gone falling', () => {
    const wreck: Wreck = { ...spawnWreck(7, 648, 630, 0), phase: 'midFall' };
    const after = step(launchedAtWreck(7), { deltaMs: 16, wrecks: [wreck] });
    expect(after.status).toBe('DESTROYED');
    expect(after.targetWreckId).toBeNull();
  });

  it('transitions to DESTROYED on arrival when target wreck no longer exists', () => {
    const after = step(launchedAtWreck(7), { deltaMs: 16, wrecks: [] });
    expect(after.status).toBe('DESTROYED');
  });
});

describe('TETHERED -- salvage and wreck-falls', () => {
  function tethered(wreckId: number, tetheredSinceMs: number): ProbeState {
    return { ...createProbe(), status: 'TETHERED', targetWreckId: wreckId, tetheredSinceMs };
  }

  it('returns to RETURNING with tier 1 on short hold (< 1000ms)', () => {
    const wreck = spawnWreck(3, 400, 300, 0);
    const after = step(tethered(3, 0), { probeJustPressed: true, timestamp: 500, wrecks: [wreck] });
    expect(after.status).toBe('RETURNING');
    expect(after.rewardTier).toBe(1);
    expect(after.emptyReturn).toBe(false);
    expect(after.targetWreckId).toBeNull();
  });

  it('returns tier 2 for hold 1000ms to 2499ms', () => {
    const wreck = spawnWreck(3, 400, 300, 0);
    const after = step(tethered(3, 0), { probeJustPressed: true, timestamp: 1500, wrecks: [wreck] });
    expect(after.rewardTier).toBe(2);
  });

  it('returns tier 3 for hold >= 2500ms', () => {
    const wreck = spawnWreck(3, 400, 300, 0);
    const after = step(tethered(3, 0), { probeJustPressed: true, timestamp: 3000, wrecks: [wreck] });
    expect(after.rewardTier).toBe(3);
  });

  it('enters DESTROYED when tethered wreck transitions to falling', () => {
    const wreck: Wreck = { ...spawnWreck(3, 400, 300, 0), phase: 'midFall' };
    const after = step(tethered(3, 0), { wrecks: [wreck] });
    expect(after.status).toBe('DESTROYED');
    expect(after.targetWreckId).toBeNull();
  });

  it('enters DESTROYED when tethered wreck no longer exists', () => {
    const after = step(tethered(3, 0), { wrecks: [] });
    expect(after.status).toBe('DESTROYED');
  });

  it('stays TETHERED when not pressing probe button and wreck is still drifting', () => {
    const wreck = spawnWreck(3, 400, 300, 0);
    const after = step(tethered(3, 0), { wrecks: [wreck] });
    expect(after.status).toBe('TETHERED');
  });
});

describe('reticle', () => {
  it('moves at RETICLE_SPEED (480 px/s)', () => {
    const reticle = createReticle();
    const after = updateReticle(reticle, withInput({ reticleX: 1 }), 1000);
    expect(after.x).toBeCloseTo(reticle.x + 480, 0);
  });

  it('clamps x to canvas bounds (0 to 1280)', () => {
    const atRight = { x: 1279, y: 360 };
    expect(updateReticle(atRight, withInput({ reticleX: 1 }), 1000).x).toBe(1280);

    const atLeft = { x: 1, y: 360 };
    expect(updateReticle(atLeft, withInput({ reticleX: -1 }), 1000).x).toBe(0);
  });

  it('clamps y to canvas bounds (0 to 720)', () => {
    const atBottom = { x: 640, y: 719 };
    expect(updateReticle(atBottom, withInput({ reticleY: 1 }), 1000).y).toBe(720);

    const atTop = { x: 640, y: 1 };
    expect(updateReticle(atTop, withInput({ reticleY: -1 }), 1000).y).toBe(0);
  });
});
