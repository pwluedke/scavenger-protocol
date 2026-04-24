const TUNING = {
  PROBE_TRAVEL_SPEED: 600,
  SLOWMO_FACTOR: 0.2,
  TIER_1_MAX_MS: 1500,
  TIER_2_MAX_MS: 3000,
  COOLDOWN_RETURN_MS: 3000,
  COOLDOWN_DESTROYED_MS: 8000,
  PROBE_HP: 3,
  PLAYER_HP: 3,
  PLAYER_SPEED: 400,
  PLAYER_FIRE_RATE_MS: 200,
  PLAYER_BULLET_SPEED: 500,
  HUSK_FIRE_RATE_MS: 2000,
  HUSK_BULLET_SPEED: 300,
  RETICLE_SPEED: 400,
} as const;

const DEADZONE = 0.15;
const PLAYER_W = 32;
const PLAYER_H = 24;

// Standard W3C gamepad mapping (Axis 0/1 = left stick X/Y).
// Update this comment once the detection log fires and confirms the controller used.
const BUTTON = {
  FIRE: 7,    // RT / R2
  PROBE: 2,   // X / Square
  CANCEL: 1,  // B / Circle
  PAUSE: 9,   // Start / Options
  RESET: 8,   // View (Xbox) / Share (PS) - mirrors keyboard R
} as const;

type GameInput = {
  moveX: number;
  moveY: number;
  fire: boolean;
  probeAction: boolean;
  cancel: boolean;
  pause: boolean;
  reset: boolean;
};

type Bullet = { x: number; y: number };

type Player = { x: number; y: number; hp: number; lastFireMs: number };

type Keys = Record<string, boolean>;

const keys: Keys = {};
// Holds edge-detected key presses for one frame; cleared at end of each loop iteration.
const justPressed = new Set<string>();
let lastInputSource: 'keyboard' | 'gamepad' = 'keyboard';
let gamepadLogged = false;
const prevButtons: boolean[] = [];
let prevStickOutside = false;

window.addEventListener('keydown', (e) => {
  if (!keys[e.code]) {
    console.log('keydown', e.code);
    justPressed.add(e.code);
    lastInputSource = 'keyboard';
  }
  keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  console.log('keyup', e.code);
});

function pollGamepad(): GameInput | null {
  const gp = navigator.getGamepads()[0];
  if (!gp) return null;

  if (!gamepadLogged) {
    console.log('Gamepad connected:', gp.id, '| axes:', gp.axes.length, '| buttons:', gp.buttons.length, '| mapping:', gp.mapping);
    gamepadLogged = true;
  }

  const rawX = gp.axes[0] ?? 0;
  const rawY = gp.axes[1] ?? 0;
  const stickX = Math.abs(rawX) > DEADZONE ? rawX : 0;
  const stickY = Math.abs(rawY) > DEADZONE ? rawY : 0;
  const stickOutside = stickX !== 0 || stickY !== 0;

  if (stickOutside && !prevStickOutside) {
    lastInputSource = 'gamepad';
    console.log(`gamepad stick active: moveX=${stickX.toFixed(2)} moveY=${stickY.toFixed(2)}`);
  }

  const actionButtons: [number, 'fire' | 'probeAction' | 'cancel' | 'pause' | 'reset'][] = [
    [BUTTON.FIRE, 'fire'],
    [BUTTON.PROBE, 'probeAction'],
    [BUTTON.CANCEL, 'cancel'],
    [BUTTON.PAUSE, 'pause'],
    [BUTTON.RESET, 'reset'],
  ];

  const input: GameInput = { moveX: stickX, moveY: stickY, fire: false, probeAction: false, cancel: false, pause: false, reset: false };

  for (const [index, action] of actionButtons) {
    const pressed = gp.buttons[index]?.pressed ?? false;
    const wasPressed = prevButtons[index] ?? false;
    if (pressed && !wasPressed) {
      lastInputSource = 'gamepad';
      console.log(`gamepad button ${index} pressed`);
      input[action] = true;
    }
  }

  prevStickOutside = stickOutside;
  for (let i = 0; i < gp.buttons.length; i++) {
    prevButtons[i] = gp.buttons[i].pressed;
  }

  return input;
}

function getKeyboardInput(): GameInput {
  const moveX = (keys['ArrowRight'] || keys['KeyD'] ? 1 : 0) - (keys['ArrowLeft'] || keys['KeyA'] ? 1 : 0);
  const moveY = (keys['ArrowDown'] || keys['KeyS'] ? 1 : 0) - (keys['ArrowUp'] || keys['KeyW'] ? 1 : 0);
  return {
    moveX,
    moveY,
    fire: justPressed.has('Space'),
    probeAction: justPressed.has('KeyE'),
    cancel: justPressed.has('KeyQ'),
    pause: justPressed.has('Escape'),
    reset: false,
  };
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Vertical clamp bounds (y = player center); keeps player in bottom third of canvas.
const PLAYER_Y_MIN = 420 + PLAYER_H / 2;
const PLAYER_Y_MAX = canvas.height - PLAYER_H / 2;

function createState() {
  return {
    player: {
      x: canvas.width / 2,
      y: canvas.height - PLAYER_H / 2 - 20,
      hp: TUNING.PLAYER_HP,
      lastFireMs: 0,
    } as Player,
    bullets: [] as Bullet[],
  };
}

let state = createState();

function drawPlayer(player: Player): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(player.x - PLAYER_W / 2, player.y - PLAYER_H / 2, PLAYER_W, PLAYER_H);
}

function drawBullets(bullets: Bullet[]): void {
  ctx.fillStyle = '#ffff00';
  for (const b of bullets) {
    ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
  }
}

function drawHp(hp: number): void {
  for (let i = 0; i < TUNING.PLAYER_HP; i++) {
    ctx.beginPath();
    ctx.arc(20 + i * 25, 20, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < hp ? '#ffffff' : '#444444';
    ctx.fill();
  }
}

let lastTime = 0;

function loop(timestamp: number): void {
  const deltaMs = timestamp - lastTime;
  lastTime = timestamp;
  const deltaSeconds = deltaMs / 1000;

  const gpInput = pollGamepad();
  const input = lastInputSource === 'gamepad' && gpInput !== null
    ? gpInput
    : getKeyboardInput();

  if (justPressed.has('KeyR') || input.reset) {
    state = createState();
  }

  state.player.x += input.moveX * TUNING.PLAYER_SPEED * deltaSeconds;
  state.player.y += input.moveY * TUNING.PLAYER_SPEED * deltaSeconds;

  if (state.player.x < 0) state.player.x = canvas.width;
  if (state.player.x > canvas.width) state.player.x = 0;

  state.player.y = Math.max(PLAYER_Y_MIN, Math.min(PLAYER_Y_MAX, state.player.y));

  if (input.fire && timestamp - state.player.lastFireMs >= TUNING.PLAYER_FIRE_RATE_MS) {
    state.bullets.push({ x: state.player.x, y: state.player.y - PLAYER_H / 2 });
    state.player.lastFireMs = timestamp;
  }

  for (const b of state.bullets) {
    b.y -= TUNING.PLAYER_BULLET_SPEED * deltaSeconds;
  }
  state.bullets = state.bullets.filter(b => b.y > -5);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer(state.player);
  drawBullets(state.bullets);
  drawHp(state.player.hp);

  justPressed.clear();

  requestAnimationFrame(loop);
}

requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  requestAnimationFrame(loop);
});
