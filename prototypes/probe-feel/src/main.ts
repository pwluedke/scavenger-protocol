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

type Keys = Record<string, boolean>;

const keys: Keys = {};

window.addEventListener('keydown', (e) => {
  if (!keys[e.code]) {
    console.log('keydown', e.code);
  }
  keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  console.log('keyup', e.code);
});

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let lastTime = 0;

function loop(timestamp: number): void {
  const deltaMs = timestamp - lastTime;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(loop);
}

requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  requestAnimationFrame(loop);
});
