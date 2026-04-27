import Phaser from 'phaser';
import { createInputManager, InputManager, InputFrame } from '../systems/input';
import { createPlayer, updatePlayer, PlayerState } from '../logic/player';
import { ASSETS } from '../config/assets';

const SLOWMO_FACTOR = 0.2;
// TODO: vary by game state per tuning.md
const SCROLL_SPEED = 60;

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private inSlowMo = false;
  private playerState!: PlayerState;
  private background!: Phaser.GameObjects.TileSprite;
  private scrollImages: Phaser.GameObjects.Image[] = [];
  private graphics!: Phaser.GameObjects.Graphics;
  private scrollY = 0;
  private currentScrollSpeed = SCROLL_SPEED;
  private effectiveDeltaMs = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.inputManager = createInputManager();
    this.events.once('shutdown', () => this.inputManager.dispose());
    this.playerState = createPlayer();

    if (ASSETS.backgroundMode === 'tile') {
      this.background = this.add.tileSprite(640, 360, 1280, 720, ASSETS.background);
    } else {
      const tex = this.textures.get(ASSETS.background);
      const h = tex.getSourceImage().height;
      const imgA = this.add.image(640, 0, ASSETS.background).setOrigin(0.5, 0);
      const imgB = this.add.image(640, -h, ASSETS.background).setOrigin(0.5, 0);
      this.scrollImages = [imgA, imgB];
    }

    this.graphics = this.add.graphics();
  }

  update(time: number, delta: number): void {
    const inputFrame = this.inputManager.update();
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
    this.playerState = updatePlayer(this.playerState, inputFrame.current, effectiveDeltaMs, timestamp);
  }

  private drawScene(): void {
    const dt = this.effectiveDeltaMs / 1000;

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

    this.graphics.fillStyle(0xffffff);
    this.graphics.fillRect(this.playerState.x - 24, this.playerState.y - 18, 48, 36);

    this.graphics.fillStyle(0xffff00);
    for (const bullet of this.playerState.bullets) {
      this.graphics.fillRect(bullet.x - 2, bullet.y - 5, 4, 10);
    }
  }
}
