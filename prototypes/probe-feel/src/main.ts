const TUNING = {
  PROBE_TRAVEL_SPEED: 600,
  SLOWMO_FACTOR: 0.2,
  TIER_1_MAX_MS: 1500,
  TIER_2_MAX_MS: 3000,
  COOLDOWN_RETURN_MS: 3000,
  COOLDOWN_DESTROYED_MS: 8000,
  PROBE_HP: 3,
  PLAYER_HP: 3,
  PLAYER_FIRE_RATE_MS: 200,
  PLAYER_BULLET_SPEED: 500,
  HUSK_FIRE_RATE_MS: 2000,
  HUSK_BULLET_SPEED: 300,
  RETICLE_SPEED: 400,
} as const;

const DEADZONE = 0.15;

// Standard W3C gamepad mapping (Axis 0/1 = left stick X/Y).
// Update this comment once the detection log fires and confirms the controller used.
const BUTTON = {
  FIRE: 7,    // RT / R2
  PROBE: 2,   // X / Square
  CANCEL: 1,  // B / Circle
  PAUSE: 9,   // Start / Options
} as const;

type GameInput = {
  moveX: number;
  moveY: number;
  fire: boolean;
  probeAction: boolean;
  cancel: boolean;
  pause: boolean;
};

type Keys = Record<string, boolean>;

const keys: Keys = {};
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

  const actionButtons: [number, 'fire' | 'probeAction' | 'cancel' | 'pause'][] = [
    [BUTTON.FIRE, 'fire'],
    [BUTTON.PROBE, 'probeAction'],
    [BUTTON.CANCEL, 'cancel'],
    [BUTTON.PAUSE, 'pause'],
  ];

  const input: GameInput = { moveX: stickX, moveY: stickY, fire: false, probeAction: false, cancel: false, pause: false };

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
  };
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let lastTime = 0;

function loop(timestamp: number): void {
  const deltaMs = timestamp - lastTime;
  lastTime = timestamp;

  const gpInput = pollGamepad();
  const input = lastInputSource === 'gamepad' && gpInput !== null
    ? gpInput
    : getKeyboardInput();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  justPressed.clear();

  void deltaMs;
  void input;

  requestAnimationFrame(loop);
}

requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  requestAnimationFrame(loop);
});
