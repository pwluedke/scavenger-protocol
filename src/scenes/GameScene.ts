import Phaser from 'phaser';
import { createInputManager, InputManager, InputFrame, LogicalAction } from '../systems/input';
import { createPlayer, updatePlayer, PlayerState } from '../logic/player';
import {
  createProbe,
  updateProbe,
  ProbeState,
  createReticle,
  updateReticle,
  ReticleState,
  TARGETING_MAX_MS,
} from '../logic/probe';
import { ASSETS } from '../config/assets';
import { Player } from '../entities/Player';
import { Bullets } from '../entities/Bullets';

const SLOWMO_FACTOR = 0.2;
// TODO: vary by game state per tuning.md
const SCROLL_SPEED = 60;

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private inSlowMo = false;
  private playerState!: PlayerState;
  private probeState!: ProbeState;
  private reticleState!: ReticleState;
  private background!: Phaser.GameObjects.TileSprite;
  private scrollImages: Phaser.GameObjects.Image[] = [];
  // Entity render layer -- creation order determines draw depth (probe < player < bullets < hud)
  private playerEntity!: Player;
  private bulletsEntity!: Bullets;
  private graphics!: Phaser.GameObjects.Graphics;
  private flashText!: Phaser.GameObjects.Text;
  private targetingTimerText!: Phaser.GameObjects.Text;
  private scanCooldownText!: Phaser.GameObjects.Text;
  private scrollY = 0;
  private currentScrollSpeed = SCROLL_SPEED;
  private effectiveDeltaMs = 0;
  private rawDeltaMs = 0;
  private currentTimestamp = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.inputManager = createInputManager();
    this.events.once('shutdown', () => this.inputManager.dispose());
    this.playerState = createPlayer();
    this.probeState = createProbe();
    this.reticleState = createReticle();

    if (ASSETS.backgroundMode === 'tile') {
      this.background = this.add.tileSprite(640, 360, 1280, 720, ASSETS.background);
    } else {
      const tex = this.textures.get(ASSETS.background);
      const h = tex.getSourceImage().height;
      const imgA = this.add.image(640, 0, ASSETS.background).setOrigin(0.5, 0);
      const imgB = this.add.image(640, -h, ASSETS.background).setOrigin(0.5, 0);
      this.scrollImages = [imgA, imgB];
    }

    this.playerEntity = new Player(this);
    this.bulletsEntity = new Bullets(this);
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
  }

  update(time: number, delta: number): void {
    const inputFrame = this.inputManager.update();
    this.rawDeltaMs = delta;
    this.currentTimestamp = time;
    this.effectiveDeltaMs = delta * (this.inSlowMo ? SLOWMO_FACTOR : 1);
    this.updateLogic(inputFrame, this.effectiveDeltaMs, time);
    this.drawScene();
  }

  setSlowMo(active: boolean): void {
    this.inSlowMo = active;
  }

  setScrollSpeed(speed: number): void {
    this.currentScrollSpeed = speed;
  }

  private updateLogic(inputFrame: InputFrame, effectiveDeltaMs: number, timestamp: number): void {
    this.playerState = updatePlayer(this.playerState, inputFrame.current, effectiveDeltaMs);

    const prevProbeStatus = this.probeState.status;

    // Reticle always updates using raw delta (dedicated IJKL / right stick, not slow-mo affected)
    this.reticleState = updateReticle(this.reticleState, inputFrame.current, this.rawDeltaMs);

    const probeJustPressed = inputFrame.justPressed.has(LogicalAction.PROBE);
    this.probeState = updateProbe(
      this.probeState,
      inputFrame.current,
      this.playerState.x,
      this.playerState.y,
      effectiveDeltaMs,
      timestamp,
      this.reticleState.x,
      this.reticleState.y,
      probeJustPressed,
    );

    // Snap reticle 60px above player when entering TARGETING
    if (prevProbeStatus !== 'TARGETING' && this.probeState.status === 'TARGETING') {
      this.reticleState = { x: this.playerState.x, y: this.playerState.y - 60 };
    }

    this.setSlowMo(this.probeState.status === 'TARGETING');
  }

  private drawScene(): void {
    const dt = this.effectiveDeltaMs / 1000;
    const ts = this.currentTimestamp;
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

    this.graphics.clear();

    // Reticle ring + countdown (TARGETING) / scan cooldown indicator (TARGETING_COOLDOWN)
    if (probe.status === 'TARGETING') {
      this.graphics.lineStyle(2, 0x00ffff);
      this.graphics.strokeCircle(reticle.x, reticle.y, 8);
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

    // Probe body (LAUNCHED, RETURNING, TETHERED)
    if (
      probe.status === 'LAUNCHED' ||
      probe.status === 'RETURNING' ||
      probe.status === 'TETHERED'
    ) {
      this.graphics.fillStyle(0x00ffff);
      this.graphics.fillCircle(probe.x, probe.y, 8);
    }

    // Tether line + charge ring (TETHERED)
    if (probe.status === 'TETHERED') {
      this.graphics.lineStyle(2, 0x00ffff);
      this.graphics.lineBetween(this.playerState.x, this.playerState.y, probe.x, probe.y);

      const elapsed = ts - probe.tetheredSinceMs;
      const lineWidth = elapsed >= 2000 ? 8 : elapsed >= 700 ? 4 : 2;
      this.graphics.lineStyle(lineWidth, 0x00ffff);
      this.graphics.strokeCircle(probe.x, probe.y, 16);
    }

    this.playerEntity.update(this.playerState);

    this.bulletsEntity.update(this.playerState.bullets);

    // Cooldown bar (top-left, 200px wide)
    if (probe.status === 'COOLDOWN' && probe.cooldownTotalMs > 0) {
      const fraction = Math.max(0, (probe.cooldownEndMs - ts) / probe.cooldownTotalMs);
      this.graphics.fillStyle(0x888888);
      this.graphics.fillRect(20, 20, Math.round(200 * fraction), 8);
    }

    // Reward flash text
    if (probe.rewardFlashEndMs > ts) {
      this.flashText.setText(`Tier ${probe.rewardTier} reward!`);
      this.flashText.setVisible(true);
    } else {
      this.flashText.setVisible(false);
    }
  }
}
