const TUNING = {
  PROBE_TRAVEL_SPEED: 600,
  PROBE_RADIUS: 8,
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
  RETICLE_SNAP_DIST: 60,
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

type ProbeState = 'IDLE' | 'TARGETING' | 'LAUNCHED' | 'TETHERED' | 'RETURNING' | 'COOLDOWN';

type Probe = {
  state: ProbeState;
  x: number;
  y: number;
  hp: number;
  targetX: number;
  targetY: number;
  targetWreck: Wreck | null;
  highlightedWreck: Wreck | null;
  tetheredSinceMs: number;
  cooldownEndMs: number;
  cooldownTotalMs: number;
  rewardTier: number;
  rewardFlashEndMs: number;
  emptyReturn: boolean;
};

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
    probe: {
      state: 'IDLE' as ProbeState,
      x: 0, y: 0,
      hp: TUNING.PROBE_HP,
      targetX: 0, targetY: 0,
      targetWreck: null,
      highlightedWreck: null,
      tetheredSinceMs: 0,
      cooldownEndMs: 0,
      cooldownTotalMs: 0,
      rewardTier: 0,
      rewardFlashEndMs: 0,
      emptyReturn: false,
    } as Probe,
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
  for (const w of wrecks) {
    ctx.fillStyle = w === state.probe.highlightedWreck ? '#cccccc' : '#666666';
    ctx.fillRect(w.x - TUNING.WRECK_SIZE / 2, w.y - TUNING.WRECK_SIZE / 2, TUNING.WRECK_SIZE, TUNING.WRECK_SIZE);
  }
}

function drawEnemyBullets(bullets: EnemyBullet[]): void {
  ctx.fillStyle = '#ff0000';
  for (const b of bullets) {
    ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
  }
}

function drawProbe(): void {
  const probe = state.probe;
  if (probe.state === 'IDLE' || probe.state === 'COOLDOWN') return;

  if (probe.state === 'TARGETING') {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(probe.x, probe.y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(probe.x - 22, probe.y); ctx.lineTo(probe.x + 22, probe.y);
    ctx.moveTo(probe.x, probe.y - 22); ctx.lineTo(probe.x, probe.y + 22);
    ctx.stroke();
    return;
  }

  if (probe.state === 'TETHERED' && probe.targetWreck) {
    // Draw tethered wreck (highlight; no longer in state.wrecks).
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(
      probe.targetWreck.x - TUNING.WRECK_SIZE / 2,
      probe.targetWreck.y - TUNING.WRECK_SIZE / 2,
      TUNING.WRECK_SIZE, TUNING.WRECK_SIZE
    );

    // Tether line from player to probe.
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(state.player.x, state.player.y);
    ctx.lineTo(probe.x, probe.y);
    ctx.stroke();

    // Charge ring: lineWidth by tier, radius pulses via sine.
    const duration = lastTime - probe.tetheredSinceMs;
    const tier = duration < TUNING.TIER_1_MAX_MS ? 1 : duration < TUNING.TIER_2_MAX_MS ? 2 : 3;
    const ringLineWidth = tier === 1 ? 2 : tier === 2 ? 4 : 8;
    const pulse = Math.sin(lastTime * 0.01) * 0.5 + 0.5;
    const ringRadius = TUNING.PROBE_RADIUS + 4 + pulse * 4;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = ringLineWidth;
    ctx.beginPath();
    ctx.arc(probe.x, probe.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Probe circle (LAUNCHED, TETHERED, RETURNING).
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.arc(probe.x, probe.y, TUNING.PROBE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}

function drawHp(hp: number): void {
  for (let i = 0; i < TUNING.PLAYER_HP; i++) {
    ctx.beginPath();
    ctx.arc(20 + i * 25, 20, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < hp ? '#ffffff' : '#444444';
    ctx.fill();
  }
}

function drawCooldownBar(): void {
  if (state.probe.state !== 'COOLDOWN' || state.probe.cooldownTotalMs === 0) return;
  const remaining = Math.max(0, state.probe.cooldownEndMs - lastTime);
  const progress = remaining / state.probe.cooldownTotalMs;
  const barX = 10;
  const barY = 36;
  const barW = 80;
  const barH = 6;
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#888888';
  ctx.fillRect(barX, barY, barW * progress, barH);
}

function drawRewardFlash(): void {
  if (lastTime >= state.probe.rewardFlashEndMs || state.probe.rewardTier === 0) return;
  ctx.fillStyle = '#00ffff';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Tier ${state.probe.rewardTier} reward!`, canvas.width / 2, canvas.height / 2 - 40);
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

// deltaSeconds here is always raw (not slow-mo); reticle uses it directly for real-time movement.
function updateProbe(input: GameInput, timestamp: number, deltaSeconds: number): void {
  const probe = state.probe;

  switch (probe.state) {
    case 'IDLE':
      if (input.probeAction) {
        probe.hp = TUNING.PROBE_HP;
        probe.x = state.player.x;
        probe.y = state.player.y - 60;
        probe.highlightedWreck = null;
        probe.state = 'TARGETING';
      }
      break;

    case 'TARGETING': {
      probe.x += input.moveX * TUNING.RETICLE_SPEED * deltaSeconds;
      probe.y += input.moveY * TUNING.RETICLE_SPEED * deltaSeconds;
      probe.x = Math.max(0, Math.min(canvas.width, probe.x));
      probe.y = Math.max(0, Math.min(canvas.height, probe.y));

      let nearest: Wreck | null = null;
      let nearestDist: number = TUNING.RETICLE_SNAP_DIST;
      for (const w of state.wrecks) {
        const d = Math.hypot(w.x - probe.x, w.y - probe.y);
        if (d < nearestDist) { nearest = w; nearestDist = d; }
      }
      probe.highlightedWreck = nearest;

      if (input.cancel || (input.probeAction && !nearest)) {
        // Q always cancels; E cancels when no target is highlighted.
        probe.highlightedWreck = null;
        probe.state = 'IDLE';
      } else if (input.probeAction && nearest) {
        // Probe launches FROM the player position TO the target wreck.
        probe.x = state.player.x;
        probe.y = state.player.y;
        probe.targetX = nearest.x;
        probe.targetY = nearest.y;
        probe.targetWreck = nearest;
        probe.highlightedWreck = null;
        probe.state = 'LAUNCHED';
      }
      break;
    }

    case 'LAUNCHED': {
      const dx = probe.targetX - probe.x;
      const dy = probe.targetY - probe.y;
      const dist = Math.hypot(dx, dy);
      const step = TUNING.PROBE_TRAVEL_SPEED * deltaSeconds;

      if (dist <= step) {
        if (probe.targetWreck && state.wrecks.includes(probe.targetWreck)) {
          // Remove wreck from world; probe now owns it.
          state.wrecks = state.wrecks.filter(w => w !== probe.targetWreck);
          probe.x = probe.targetX;
          probe.y = probe.targetY;
          probe.tetheredSinceMs = timestamp;
          probe.state = 'TETHERED';
        } else {
          // Wreck expired during transit; return empty.
          probe.emptyReturn = true;
          probe.targetWreck = null;
          probe.state = 'RETURNING';
        }
      } else {
        probe.x += (dx / dist) * step;
        probe.y += (dy / dist) * step;
      }
      break;
    }

    case 'TETHERED': {
      if (probe.targetWreck && timestamp - probe.targetWreck.spawnMs >= TUNING.WRECK_DURATION_MS) {
        probe.emptyReturn = true;
        probe.targetWreck = null;
        probe.state = 'RETURNING';
        break;
      }
      if (input.probeAction) {
        const duration = timestamp - probe.tetheredSinceMs;
        probe.rewardTier = duration < TUNING.TIER_1_MAX_MS ? 1 : duration < TUNING.TIER_2_MAX_MS ? 2 : 3;
        probe.emptyReturn = false;
        probe.targetWreck = null;
        probe.state = 'RETURNING';
      }
      break;
    }

    case 'RETURNING': {
      const dx = state.player.x - probe.x;
      const dy = state.player.y - probe.y;
      const dist = Math.hypot(dx, dy);
      const step = TUNING.PROBE_TRAVEL_SPEED * deltaSeconds;

      if (dist <= step) {
        if (!probe.emptyReturn && probe.rewardTier > 0) {
          probe.rewardFlashEndMs = timestamp + 2000;
        }
        probe.cooldownTotalMs = TUNING.COOLDOWN_RETURN_MS;
        probe.cooldownEndMs = timestamp + TUNING.COOLDOWN_RETURN_MS;
        probe.emptyReturn = false;
        probe.state = 'COOLDOWN';
      } else {
        probe.x += (dx / dist) * step;
        probe.y += (dy / dist) * step;
      }
      break;
    }

    case 'COOLDOWN':
      if (timestamp >= probe.cooldownEndMs) {
        probe.hp = TUNING.PROBE_HP;
        probe.rewardTier = 0;
        probe.state = 'IDLE';
      }
      break;
  }
}

let lastTime = 0;

function loop(timestamp: number): void {
  const deltaMs = timestamp - lastTime;
  lastTime = timestamp;
  const deltaSeconds = deltaMs / 1000;

  // Slow-mo applies only during TARGETING; all world updates use effectiveDeltaSeconds.
  const effectiveDeltaMs = state.probe.state === 'TARGETING'
    ? deltaMs * TUNING.SLOWMO_FACTOR
    : deltaMs;
  const effectiveDeltaSeconds = effectiveDeltaMs / 1000;

  const gpInput = pollGamepad();
  const input = lastInputSource === 'gamepad' && gpInput !== null
    ? gpInput
    : getKeyboardInput();

  // Reset works regardless of game over state.
  if (justPressed.has('KeyR') || input.reset) {
    state = createState();
  } else if (!state.gameOver) {

    updateProbe(input, timestamp, deltaSeconds);

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

    // Player moves only when not in TARGETING state.
    if (state.probe.state !== 'TARGETING') {
      state.player.x += input.moveX * TUNING.PLAYER_SPEED * effectiveDeltaSeconds;
      state.player.y += input.moveY * TUNING.PLAYER_SPEED * effectiveDeltaSeconds;
      if (state.player.x < 0) state.player.x = canvas.width;
      if (state.player.x > canvas.width) state.player.x = 0;
      state.player.y = Math.max(PLAYER_Y_MIN, Math.min(PLAYER_Y_MAX, state.player.y));
    }

    // Player fire.
    if (input.fire && timestamp - state.player.lastFireMs >= TUNING.PLAYER_FIRE_RATE_MS) {
      state.bullets.push({ x: state.player.x, y: state.player.y - PLAYER_H / 2 });
      state.player.lastFireMs = timestamp;
    }

    // Update player bullets.
    for (const b of state.bullets) {
      b.y -= TUNING.PLAYER_BULLET_SPEED * effectiveDeltaSeconds;
    }
    state.bullets = state.bullets.filter(b => b.y > -5);

    // Update grunts.
    for (const g of state.grunts) {
      g.age += effectiveDeltaMs;
      g.y += TUNING.GRUNT_SPEED * effectiveDeltaSeconds;
      g.x = g.spawnX + TUNING.GRUNT_SINE_AMPLITUDE * Math.sin(g.age * TUNING.GRUNT_SINE_FREQ);
    }
    state.grunts = state.grunts.filter(g => g.y < canvas.height + TUNING.GRUNT_SIZE / 2);

    // Update husks: move and fire.
    for (const h of state.husks) {
      h.y += TUNING.HUSK_SPEED * effectiveDeltaSeconds;
      if (timestamp - h.lastFireMs >= TUNING.HUSK_FIRE_RATE_MS) {
        state.enemyBullets.push({ x: h.x, y: h.y + TUNING.HUSK_SIZE / 2 });
        h.lastFireMs = timestamp;
      }
    }
    state.husks = state.husks.filter(h => h.y < canvas.height + TUNING.HUSK_SIZE / 2);

    // Update enemy bullets.
    for (const b of state.enemyBullets) {
      b.y += TUNING.HUSK_BULLET_SPEED * effectiveDeltaSeconds;
    }
    state.enemyBullets = state.enemyBullets.filter(b => b.y < canvas.height + 5);

    // Expire wrecks not owned by the probe.
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

    // Enemy bullets vs probe (probe blocks bullets; only Husk bullets interact with probe).
    const probeActive = state.probe.state === 'LAUNCHED'
      || state.probe.state === 'TETHERED'
      || state.probe.state === 'RETURNING';
    if (probeActive) {
      state.enemyBullets = state.enemyBullets.filter(b => {
        if (rectsOverlap(b.x, b.y, 4, 10, state.probe.x, state.probe.y,
                         TUNING.PROBE_RADIUS * 2, TUNING.PROBE_RADIUS * 2)) {
          state.probe.hp -= 1;
          if (state.probe.hp <= 0) {
            state.probe.hp = 0;
            state.probe.targetWreck = null;
            state.probe.cooldownTotalMs = TUNING.COOLDOWN_DESTROYED_MS;
            state.probe.cooldownEndMs = timestamp + TUNING.COOLDOWN_DESTROYED_MS;
            state.probe.state = 'COOLDOWN';
          }
          return false;
        }
        return true;
      });
    }

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
  drawProbe();
  drawGrunts(state.grunts);
  drawHusks(state.husks);
  drawEnemyBullets(state.enemyBullets);
  drawPlayer(state.player);
  drawBullets(state.bullets);
  drawHp(state.player.hp);
  drawCooldownBar();
  drawRewardFlash();
  if (state.gameOver) drawGameOver();

  justPressed.clear();

  requestAnimationFrame(loop);
}

requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  requestAnimationFrame(loop);
});
