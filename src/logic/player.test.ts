import { createPlayer, updatePlayer, PlayerState } from './player';
import type { InputState } from '../systems/input';

const IDLE: InputState = {
  moveX: 0, moveY: 0, reticleX: 0, reticleY: 0, fire: false, probe: false, cancelProbe: false, pause: false, dash: false,
};

function withInput(overrides: Partial<InputState>): InputState {
  return { ...IDLE, ...overrides };
}

function stepMany(state: PlayerState, input: InputState, steps: number, deltaMs = 16): PlayerState {
  let s = state;
  for (let i = 0; i < steps; i++) {
    s = updatePlayer(s, input, deltaMs);
  }
  return s;
}

describe('createPlayer', () => {
  it('returns correct initial state', () => {
    const p = createPlayer();
    expect(p.x).toBe(640);
    expect(p.y).toBe(630);
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
    expect(p.hp).toBe(3);
    expect(p.fireTimer).toBe(0);
    expect(p.bullets).toHaveLength(0);
  });
});

describe('movement', () => {
  it('accelerates toward max speed when input held', () => {
    const start = createPlayer();
    const after = stepMany(start, withInput({ moveX: 1 }), 5);
    expect(after.vx).toBeGreaterThan(0);
    expect(after.vx).toBeLessThanOrEqual(320);
  });

  it('caps velocity at PLAYER_SPEED', () => {
    const start = createPlayer();
    const after = stepMany(start, withInput({ moveX: 1 }), 200);
    expect(after.vx).toBeCloseTo(320, 0);
  });

  it('decelerates to zero when input released', () => {
    let state = stepMany(createPlayer(), withInput({ moveX: 1 }), 200);
    expect(state.vx).toBeGreaterThan(0);
    state = stepMany(state, IDLE, 200);
    expect(state.vx).toBe(0);
  });

  it('diagonal input produces combined speed approximately equal to PLAYER_SPEED at steady state', () => {
    const state = stepMany(createPlayer(), withInput({ moveX: 1, moveY: 1 }), 500);
    const speed = Math.sqrt(state.vx ** 2 + state.vy ** 2);
    expect(speed).toBeCloseTo(320, 0);
  });
});

describe('position bounds', () => {
  it('wraps x to CANVAS_WIDTH when x < 0', () => {
    const state: PlayerState = { ...createPlayer(), x: -1, vx: -1 };
    const after = updatePlayer(state, IDLE, 16);
    expect(after.x).toBe(1280);
  });

  it('wraps x to 0 when x > CANVAS_WIDTH', () => {
    const state: PlayerState = { ...createPlayer(), x: 1281, vx: 1 };
    const after = updatePlayer(state, IDLE, 16);
    expect(after.x).toBe(0);
  });

  it('clamps y to Y_MIN (432)', () => {
    const state: PlayerState = { ...createPlayer(), y: 432, vy: -1000 };
    const after = updatePlayer(state, IDLE, 100);
    expect(after.y).toBeGreaterThanOrEqual(432);
  });

  it('clamps y to Y_MAX (684)', () => {
    const state: PlayerState = { ...createPlayer(), y: 684, vy: 1000 };
    const after = updatePlayer(state, IDLE, 100);
    expect(after.y).toBeLessThanOrEqual(684);
  });
});

describe('shooting', () => {
  it('fires a bullet when fire is held for >= 200ms', () => {
    const state = updatePlayer(createPlayer(), withInput({ fire: true }), 200);
    expect(state.bullets).toHaveLength(1);
  });

  it('does not fire when accumulated time < 200ms', () => {
    const state = updatePlayer(createPlayer(), withInput({ fire: true }), 16);
    expect(state.bullets).toHaveLength(0);
  });

  it('fires a second bullet after another 200ms has elapsed', () => {
    let state = updatePlayer(createPlayer(), withInput({ fire: true }), 200);
    state = updatePlayer(state, withInput({ fire: true }), 200);
    expect(state.bullets).toHaveLength(2);
  });

  it('bullets move upward each frame', () => {
    let state = updatePlayer(createPlayer(), withInput({ fire: true }), 200);
    const startY = state.bullets[0].y;
    state = updatePlayer(state, IDLE, 16);
    expect(state.bullets[0].y).toBeLessThan(startY);
  });

  it('removes bullets with y < -10', () => {
    const offscreen: PlayerState = {
      ...createPlayer(),
      bullets: [{ x: 640, y: -11 }],
    };
    const after = updatePlayer(offscreen, IDLE, 16);
    expect(after.bullets).toHaveLength(0);
  });
});
