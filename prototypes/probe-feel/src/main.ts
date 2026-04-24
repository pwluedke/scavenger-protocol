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
  GRUNT_SPEED: 80,
  GRUNT_SINE_AMPLITUDE: 60,
  GRUNT_SINE_FREQ: 0.002,
  GRUNT_SIZE: 20,
  GRUNT_SPAWN_INTERVAL_MS: 1000,
  HUSK_SPEED: 50,
  HUSK_SIZE: 32,
  HUSK_HP: 3,
  HUSK_FIRE_RATE_MS: 2000,
  HUSK_BULLET_SPEED: 300,
  HUSK_SPAWN_INTERVAL_MS: 6000,
  WRECK_SIZE: 32,
  WRECK_DURATION_MS: 10000,
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
type EnemyBullet = { x: number; y: number };
type Grunt = { x: number; y: number; spawnX: number; age: number; hp: number };
type Husk  = { x: number; y: number; hp: number; lastFireMs: number };
type Wreck = { x: number; y: number; spawnMs: number };
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

function rectsOverlap(ax: number, ay: number, aw: number, ah: number,
                      bx: number, by: number, bw: number, bh: number): boolean {
  return Math.abs(ax - bx) < (aw + bw) / 2 &&
         Math.abs(ay - by) < (ah + bh) / 2;
}

function createState() {
  return {
    player: {
      x: canvas.width / 2,
      y: canvas.height - PLAYER_H / 2 - 20,
      hp: TUNING.PLAYER_HP,
      lastFireMs: 0,
    } as Player,
    bullets: [] as Bullet[],
    grunts: [] as Grunt[],
    husks: [] as Husk[],
    wrecks: [] as Wreck[],
    enemyBullets: [] as EnemyBullet[],
    lastGruntSpawnMs: 0,
    lastHuskSpawnMs: 0,
    gameOver: false,
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

function drawGrunts(grunts: Grunt[]): void {
  ctx.fillStyle = '#ff4444';
  for (const g of grunts) {
    ctx.fillRect(g.x - TUNING.GRUNT_SIZE / 2, g.y - TUNING.GRUNT_SIZE / 2, TUNING.GRUNT_SIZE, TUNING.GRUNT_SIZE);
  }
}

function drawHusks(husks: Husk[]): void {
  ctx.fillStyle = '#ff8800';
  for (const h of husks) {
    ctx.fillRect(h.x - TUNING.HUSK_SIZE / 2, h.y - TUNING.HUSK_SIZE / 2, TUNING.HUSK_SIZE, TUNING.HUSK_SIZE);
  }
}

function drawWrecks(wrecks: Wreck[]): void {
  ctx.fillStyle = '#666666';
  for (const w of wrecks) {
    ctx.fillRect(w.x - TUNING.WRECK_SIZE / 2, w.y - TUNING.WRECK_SIZE / 2, TUNING.WRECK_SIZE, TUNING.WRECK_SIZE);
  }
}

function drawEnemyBullets(bullets: EnemyBullet[]): void {
  ctx.fillStyle = '#ff0000';
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

function drawGameOver(): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '32px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Dead. Press R to restart.', canvas.width / 2, canvas.height / 2);
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

  // Reset works regardless of game over state.
  if (justPressed.has('KeyR') || input.reset) {
    state = createState();
  } else if (!state.gameOver) {

    // Spawn grunts.
    if (timestamp - state.lastGruntSpawnMs >= TUNING.GRUNT_SPAWN_INTERVAL_MS) {
      const spawnX = Math.random() * canvas.width;
      state.grunts.push({ x: spawnX, y: -TUNING.GRUNT_SIZE / 2, spawnX, age: 0, hp: 1 });
      state.lastGruntSpawnMs = timestamp;
    }

    // Spawn husks.
    if (timestamp - state.lastHuskSpawnMs >= TUNING.HUSK_SPAWN_INTERVAL_MS) {
      const spawnX = Math.random() * canvas.width;
      state.husks.push({ x: spawnX, y: -TUNING.HUSK_SIZE / 2, hp: TUNING.HUSK_HP, lastFireMs: timestamp });
      state.lastHuskSpawnMs = timestamp;
    }

    // Move player.
    state.player.x += input.moveX * TUNING.PLAYER_SPEED * deltaSeconds;
    state.player.y += input.moveY * TUNING.PLAYER_SPEED * deltaSeconds;
    if (state.player.x < 0) state.player.x = canvas.width;
    if (state.player.x > canvas.width) state.player.x = 0;
    state.player.y = Math.max(PLAYER_Y_MIN, Math.min(PLAYER_Y_MAX, state.player.y));

    // Player fire.
    if (input.fire && timestamp - state.player.lastFireMs >= TUNING.PLAYER_FIRE_RATE_MS) {
      state.bullets.push({ x: state.player.x, y: state.player.y - PLAYER_H / 2 });
      state.player.lastFireMs = timestamp;
    }

    // Update player bullets.
    for (const b of state.bullets) {
      b.y -= TUNING.PLAYER_BULLET_SPEED * deltaSeconds;
    }
    state.bullets = state.bullets.filter(b => b.y > -5);

    // Update grunts.
    for (const g of state.grunts) {
      g.age += deltaMs;
      g.y += TUNING.GRUNT_SPEED * deltaSeconds;
      g.x = g.spawnX + TUNING.GRUNT_SINE_AMPLITUDE * Math.sin(g.age * TUNING.GRUNT_SINE_FREQ);
    }
    state.grunts = state.grunts.filter(g => g.y < canvas.height + TUNING.GRUNT_SIZE / 2);

    // Update husks: move and fire.
    for (const h of state.husks) {
      h.y += TUNING.HUSK_SPEED * deltaSeconds;
      if (timestamp - h.lastFireMs >= TUNING.HUSK_FIRE_RATE_MS) {
        state.enemyBullets.push({ x: h.x, y: h.y + TUNING.HUSK_SIZE / 2 });
        h.lastFireMs = timestamp;
      }
    }
    state.husks = state.husks.filter(h => h.y < canvas.height + TUNING.HUSK_SIZE / 2);

    // Update enemy bullets.
    for (const b of state.enemyBullets) {
      b.y += TUNING.HUSK_BULLET_SPEED * deltaSeconds;
    }
    state.enemyBullets = state.enemyBullets.filter(b => b.y < canvas.height + 5);

    // Expire wrecks.
    state.wrecks = state.wrecks.filter(w => timestamp - w.spawnMs < TUNING.WRECK_DURATION_MS);

    // Player bullets vs grunts (1-hit kill).
    state.bullets = state.bullets.filter(b => {
      for (let i = 0; i < state.grunts.length; i++) {
        const g = state.grunts[i];
        if (rectsOverlap(b.x, b.y, 4, 10, g.x, g.y, TUNING.GRUNT_SIZE, TUNING.GRUNT_SIZE)) {
          state.grunts.splice(i, 1);
          return false;
        }
      }
      return true;
    });

    // Player bullets vs husks (3-hit kill, spawn wreck on death).
    state.bullets = state.bullets.filter(b => {
      for (let i = 0; i < state.husks.length; i++) {
        const h = state.husks[i];
        if (rectsOverlap(b.x, b.y, 4, 10, h.x, h.y, TUNING.HUSK_SIZE, TUNING.HUSK_SIZE)) {
          h.hp -= 1;
          if (h.hp <= 0) {
            state.wrecks.push({ x: h.x, y: h.y, spawnMs: timestamp });
            state.husks.splice(i, 1);
          }
          return false;
        }
      }
      return true;
    });

    // Grunts vs player.
    state.grunts = state.grunts.filter(g => {
      if (rectsOverlap(g.x, g.y, TUNING.GRUNT_SIZE, TUNING.GRUNT_SIZE, state.player.x, state.player.y, PLAYER_W, PLAYER_H)) {
        state.player.hp -= 1;
        return false;
      }
      return true;
    });

    // Husks vs player.
    state.husks = state.husks.filter(h => {
      if (rectsOverlap(h.x, h.y, TUNING.HUSK_SIZE, TUNING.HUSK_SIZE, state.player.x, state.player.y, PLAYER_W, PLAYER_H)) {
        state.player.hp -= 1;
        return false;
      }
      return true;
    });

    // Enemy bullets vs player.
    state.enemyBullets = state.enemyBullets.filter(b => {
      if (rectsOverlap(b.x, b.y, 4, 10, state.player.x, state.player.y, PLAYER_W, PLAYER_H)) {
        state.player.hp -= 1;
        return false;
      }
      return true;
    });

    if (state.player.hp <= 0) {
      state.player.hp = 0;
      state.gameOver = true;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWrecks(state.wrecks);
  drawGrunts(state.grunts);
  drawHusks(state.husks);
  drawEnemyBullets(state.enemyBullets);
  drawPlayer(state.player);
  drawBullets(state.bullets);
  drawHp(state.player.hp);
  if (state.gameOver) drawGameOver();

  justPressed.clear();

  requestAnimationFrame(loop);
}

requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  requestAnimationFrame(loop);
});
