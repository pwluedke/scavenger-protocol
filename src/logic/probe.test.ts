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
} from './probe';
import type { InputState } from '../systems/input';

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
});

describe('TARGETING', () => {
  const targeting: ProbeState = { ...createProbe(), status: 'TARGETING', targetingStartMs: 0 };

  it('transitions to IDLE on cancelProbe', () => {
    const after = step(targeting, { input: withInput({ cancelProbe: true }) });
    expect(after.status).toBe('IDLE');
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

  it('transitions to IDLE when targeting times out', () => {
    const after = step(targeting, { timestamp: TARGETING_MAX_MS });
    expect(after.status).toBe('IDLE');
  });

  it('stays TARGETING with no input before timeout', () => {
    expect(step(targeting, { timestamp: TARGETING_MAX_MS - 1 }).status).toBe('TARGETING');
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
