import Phaser from 'phaser';
import { createInputManager, InputManager, InputFrame, LogicalAction } from '../systems/input';
import { createPlayer, updatePlayer, damagePlayer, PlayerState, PLAYER_HIT_RADIUS } from '../logic/player';
import {
  createProbe,
  updateProbe,
  ProbeState,
  createReticle,
  updateReticle,
  ReticleState,
  TARGETING_MAX_MS,
} from '../logic/probe';
import { updateDriftlings, Driftling, Husk, updateHusks } from '../logic/enemies';
import { createSpawner, updateSpawner, SpawnerState } from '../logic/spawner';
import { bulletEnemyHits, playerEnemyHits, bulletHuskHits, playerHuskHits } from '../logic/collision';
import { updateWrecks, spawnWreck } from '../logic/wreck';
import type { Wreck } from '../logic/wreck';
import { updateDebrisFlashes, addGroundStain } from '../logic/groundEffects';
import type { DebrisFlash, GroundStain } from '../logic/groundEffects';
import { LAYER_BACKGROUND } from '../logic/layers';
import { createRunState, RunState } from '../logic/run';
import { createRng, Rng } from '../logic/rng';
import { ASSETS } from '../config/assets';
import { Player } from '../entities/Player';
import { Bullets } from '../entities/Bullets';
import { Probe as ProbeEntity } from '../entities/Probe';
import { Enemy } from '../entities/Enemy';
import { Wreck as WreckEntity } from '../entities/Wreck';
import { GroundEffects } from '../entities/GroundEffects';

const SLOWMO_FACTOR = 0.2;
// TODO: vary by game state per tuning.md
const SCROLL_SPEED = 20;

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private inSlowMo = false;
  private playerState!: PlayerState;
  private probeState!: ProbeState;
  private reticleState!: ReticleState;
  private background!: Phaser.GameObjects.TileSprite;
  private scrollImages: Phaser.GameObjects.Image[] = [];
  // Entity render layer -- creation order determines draw depth (back to front)
  private wreckEntity!: WreckEntity;
  private enemyEntity!: Enemy;
  private bulletsEntity!: Bullets;
  private probeEntity!: ProbeEntity;
  private playerEntity!: Player;
  private driftlings: Driftling[] = [];
  private husks: Husk[] = [];
  private wrecks: Wreck[] = [];
  private groundStains: GroundStain[] = [];
  private debrisFlashes: DebrisFlash[] = [];
  private groundEffectsEntity!: GroundEffects;
  private spawnerState!: SpawnerState;
  private spawnerRng!: Rng;
  private runState!: RunState;
  private graphics!: Phaser.GameObjects.Graphics;
  private flashText!: Phaser.GameObjects.Text;
  private targetingTimerText!: Phaser.GameObjects.Text;
  private scanCooldownText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private salvageText!: Phaser.GameObjects.Text;
  private scrollY = 0;
  private currentScrollSpeed = SCROLL_SPEED;
  private effectiveDeltaMs = 0;
  private rawDeltaMs = 0;
  private gameTimeMs = 0; // game-time accumulator; increments by effectiveDeltaMs so slow-mo scales all time-based logic

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.inputManager = createInputManager();
    this.events.once('shutdown', () => this.inputManager.dispose());
    this.gameTimeMs = 0;
    this.playerState = createPlayer();
    this.probeState = createProbe();
    this.reticleState = createReticle();
    this.runState = createRunState();

    if (ASSETS.backgroundMode === 'tile') {
      this.background = this.add.tileSprite(640, 360, 1280, 720, ASSETS.background).setDepth(LAYER_BACKGROUND);
    } else {
      const tex = this.textures.get(ASSETS.background);
      const h = tex.getSourceImage().height;
      const imgA = this.add.image(640, 0, ASSETS.background).setOrigin(0.5, 0).setDepth(LAYER_BACKGROUND);
      const imgB = this.add.image(640, -h, ASSETS.background).setOrigin(0.5, 0).setDepth(LAYER_BACKGROUND);
      this.scrollImages = [imgA, imgB];
    }

    this.spawnerState = createSpawner();
    this.spawnerRng = createRng('run-seed-spawner');

    // Draw order (back to front): ground effects, wrecks, enemies, bullets, probe, player, HUD
    this.groundEffectsEntity = new GroundEffects(this);
    this.wreckEntity = new WreckEntity(this);
    this.enemyEntity = new Enemy(this);
    this.bulletsEntity = new Bullets(this);
    this.probeEntity = new ProbeEntity(this);
    this.playerEntity = new Player(this);
    this.graphics = this.add.graphics();
    this.flashText = this.add
      .text(640, 360, '', { fontSize: '32px', color: '#00ffff' })
      .setOrigin(0.5)
      .setVisible(false);
    this.targetingTimerText = this.add
      .text(0, 0, '', { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' })
      .setOrigin(0.5)
      .setVisible(false);
    this.scanCooldownText = this.add
      .text(20, 20, 'SCAN COOLDOWN', { fontSize: '12px', fontFamily: 'monospace', color: '#888888' })
      .setOrigin(0, 0)
      .setVisible(false);
    this.hpText = this.add
      .text(20, 680, 'HP: 3', { fontSize: '14px', fontFamily: 'monospace', color: '#ff4444' })
      .setOrigin(0, 1);
    this.salvageText = this.add
      .text(20, 700, 'SALVAGE: 0', { fontSize: '14px', fontFamily: 'monospace', color: '#00ffaa' })
      .setOrigin(0, 1);
  }

  update(_time: number, delta: number): void {
    const inputFrame = this.inputManager.update();
    this.rawDeltaMs = delta;
    this.effectiveDeltaMs = delta * (this.inSlowMo ? SLOWMO_FACTOR : 1);
    this.gameTimeMs += this.effectiveDeltaMs;
    this.updateLogic(inputFrame, this.effectiveDeltaMs, this.gameTimeMs);
    this.drawScene();
  }

  setSlowMo(active: boolean): void {
    this.inSlowMo = active;
  }

  setScrollSpeed(speed: number): void {
    this.currentScrollSpeed = speed;
  }

  private updateLogic(inputFrame: InputFrame, effectiveDeltaMs: number, gameTimeMs: number): void {
    this.playerState = updatePlayer(this.playerState, inputFrame.current, effectiveDeltaMs);

    const prevProbeStatus = this.probeState.status;

    // Reticle always updates using raw delta (dedicated IJKL / right stick, not slow-mo affected)
    this.reticleState = updateReticle(this.reticleState, inputFrame.current, this.rawDeltaMs);

    // Update wrecks before probe so probe arrival sees the current wreck phase
    const tetheredWreckId = this.probeState.status === 'TETHERED' ? this.probeState.targetWreckId : null;
    const { wrecks: updatedWrecks, newlyGrounded } = updateWrecks(this.wrecks, effectiveDeltaMs, gameTimeMs, tetheredWreckId);
    this.wrecks = updatedWrecks;

    // Ground effects: expire old flashes, then emit new ones for wrecks that just grounded
    this.debrisFlashes = updateDebrisFlashes(this.debrisFlashes, gameTimeMs);
    for (const pos of newlyGrounded) {
      this.debrisFlashes = [...this.debrisFlashes, { x: pos.x, y: pos.y, createdAt: gameTimeMs }];
      this.groundStains = addGroundStain(this.groundStains, pos.x, pos.y);
    }

    // Scroll ground effects with the background so stains appear fixed on the terrain
    const scrollDelta = this.currentScrollSpeed * (effectiveDeltaMs / 1000);
    if (this.groundStains.length > 0) {
      this.groundStains = this.groundStains.map((s) => ({ ...s, y: s.y + scrollDelta }));
    }
    if (this.debrisFlashes.length > 0) {
      this.debrisFlashes = this.debrisFlashes.map((f) => ({ ...f, y: f.y + scrollDelta }));
    }

    const probeJustPressed = inputFrame.justPressed.has(LogicalAction.PROBE);
    this.probeState = updateProbe(
      this.probeState,
      inputFrame.current,
      this.playerState.x,
      this.playerState.y,
      effectiveDeltaMs,
      gameTimeMs,
      this.reticleState.x,
      this.reticleState.y,
      probeJustPressed,
      this.wrecks,
    );

    // Snap reticle 60px above player when entering TARGETING
    if (prevProbeStatus !== 'TARGETING' && this.probeState.status === 'TARGETING') {
      this.reticleState = { x: this.playerState.x, y: this.playerState.y - 60 };
    }

    this.setSlowMo(this.probeState.status === 'TARGETING');

    // Salvage credit: probe completed a wreck tether return
    if (prevProbeStatus === 'RETURNING' && this.probeState.status === 'COOLDOWN' && !this.probeState.emptyReturn) {
      this.runState = { ...this.runState, salvageCount: this.runState.salvageCount + this.probeState.rewardTier };
    }

    const { state: newSpawner, spawned, spawnedHusks } = updateSpawner(this.spawnerState, this.spawnerRng, gameTimeMs);
    this.spawnerState = newSpawner;
    this.driftlings = [...this.driftlings, ...spawned];
    this.husks = [...this.husks, ...spawnedHusks];

    this.driftlings = updateDriftlings(this.driftlings, effectiveDeltaMs, gameTimeMs);
    this.husks = updateHusks(this.husks, effectiveDeltaMs);

    // Bullet hits
    const bHits = bulletEnemyHits(this.playerState.bullets, this.driftlings);
    const bHuskHits = bulletHuskHits(this.playerState.bullets, this.husks);

    const hitBulletIndices = new Set([
      ...bHits.map((h) => h.bulletIndex),
      ...bHuskHits.map((h) => h.bulletIndex),
    ]);
    this.playerState = {
      ...this.playerState,
      bullets: this.playerState.bullets.filter((_, i) => !hitBulletIndices.has(i)),
    };

    // Apply driftling damage
    const hitByBullet = new Set(bHits.map((h) => h.enemyId));
    this.driftlings = this.driftlings.map((d) =>
      hitByBullet.has(d.id) ? { ...d, hp: d.hp - 1, alive: d.hp - 1 > 0 } : d,
    );

    // Apply husk damage -- dead husks spawn wrecks
    const hitHusksByBullet = new Set(bHuskHits.map((h) => h.huskId));
    const newWrecks: Wreck[] = [];
    this.husks = this.husks.map((h) => {
      if (!hitHusksByBullet.has(h.id)) return h;
      const newHp = h.hp - 1;
      if (newHp <= 0) {
        newWrecks.push(spawnWreck(h.id, h.x, h.y, gameTimeMs));
        return { ...h, hp: 0, alive: false };
      }
      return { ...h, hp: newHp };
    });
    this.wrecks = [...this.wrecks, ...newWrecks];

    // Player-driftling collision
    const pHits = playerEnemyHits(
      { x: this.playerState.x, y: this.playerState.y, radius: PLAYER_HIT_RADIUS },
      this.driftlings,
    );
    if (pHits.length > 0) {
      this.playerState = damagePlayer(this.playerState, gameTimeMs);
      const hitByPlayer = new Set(pHits);
      this.driftlings = this.driftlings.map((d) => (hitByPlayer.has(d.id) ? { ...d, alive: false } : d));
    }

    // Player-husk collision: 2 HP damage, husks survive contact
    const pHuskHits = playerHuskHits(
      { x: this.playerState.x, y: this.playerState.y, radius: PLAYER_HIT_RADIUS },
      this.husks,
    );
    if (pHuskHits.length > 0) {
      this.playerState = damagePlayer(this.playerState, gameTimeMs, 2);
    }
  }

  private drawScene(): void {
    const dt = this.effectiveDeltaMs / 1000;
    const ts = this.gameTimeMs;
    const probe = this.probeState;
    const reticle = this.reticleState;

    if (ASSETS.backgroundMode === 'tile') {
      this.scrollY -= this.currentScrollSpeed * dt;
      this.background.tilePositionY = this.scrollY;
    } else {
      const tex = this.textures.get(ASSETS.background);
      const h = tex.getSourceImage().height;
      for (const img of this.scrollImages) {
        img.y += this.currentScrollSpeed * dt;
        if (img.y >= 720) {
          const other = this.scrollImages.find((s) => s !== img)!;
          img.y = other.y - h;
        }
      }
    }

    // Entity rendering -- depth values determine draw order, not call order
    this.groundEffectsEntity.update(this.groundStains, this.debrisFlashes, ts);
    this.wreckEntity.update(this.wrecks, probe.candidateWreckId, ts);
    this.enemyEntity.update(this.driftlings, this.husks);
    this.bulletsEntity.update(this.playerState.bullets);
    this.probeEntity.update(probe, reticle, ts, this.playerState.x, this.playerState.y);
    this.playerEntity.update(this.playerState);

    // Countdown timer text (TARGETING) / scan cooldown text (TARGETING_COOLDOWN) -- HUD, stays here
    if (probe.status === 'TARGETING') {
      const remaining = Math.max(0, TARGETING_MAX_MS - (ts - probe.targetingStartMs));
      const color = remaining < 500 ? '#ff0000' : remaining < 1500 ? '#ffff00' : '#ffffff';
      this.targetingTimerText.setText(Math.floor(remaining).toString());
      this.targetingTimerText.setColor(color);
      this.targetingTimerText.setPosition(reticle.x, reticle.y - 24);
      this.targetingTimerText.setVisible(true);
      this.scanCooldownText.setVisible(false);
    } else if (probe.status === 'TARGETING_COOLDOWN') {
      this.targetingTimerText.setVisible(false);
      this.scanCooldownText.setVisible(true);
    } else {
      this.targetingTimerText.setVisible(false);
      this.scanCooldownText.setVisible(false);
    }

    // HUD Graphics (cooldown bar only)
    this.graphics.clear();
    if (probe.status === 'COOLDOWN' && probe.cooldownTotalMs > 0) {
      const fraction = Math.max(0, (probe.cooldownEndMs - ts) / probe.cooldownTotalMs);
      this.graphics.fillStyle(0x888888);
      this.graphics.fillRect(20, 20, Math.round(200 * fraction), 8);
    }

    this.hpText.setText(`HP: ${this.playerState.hp}`);
    this.salvageText.setText(`SALVAGE: ${this.runState.salvageCount}`);

    // Reward flash text
    if (probe.rewardFlashEndMs > ts) {
      this.flashText.setText(`Tier ${probe.rewardTier} reward!`);
      this.flashText.setVisible(true);
    } else {
      this.flashText.setVisible(false);
    }
  }
}
