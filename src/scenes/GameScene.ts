import Phaser from 'phaser';
import { createInputManager, InputManager, InputFrame } from '../systems/input';
import { createPlayer, updatePlayer, PlayerState } from '../logic/player';

const SLOWMO_FACTOR = 0.2;

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private inSlowMo = false;
  private playerState!: PlayerState;
  private graphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.inputManager = createInputManager();
    this.events.once('shutdown', () => this.inputManager.dispose());
    this.playerState = createPlayer();
    this.graphics = this.add.graphics();
  }

  update(time: number, delta: number): void {
    const inputFrame = this.inputManager.update();
    const effectiveDeltaMs = delta * (this.inSlowMo ? SLOWMO_FACTOR : 1);
    this.updateLogic(inputFrame, effectiveDeltaMs, time);
    this.drawScene();
  }

  setSlowMo(active: boolean): void {
    this.inSlowMo = active;
  }

  private updateLogic(inputFrame: InputFrame, effectiveDeltaMs: number, timestamp: number): void {
    this.playerState = updatePlayer(this.playerState, inputFrame.current, effectiveDeltaMs, timestamp);
  }

  private drawScene(): void {
    this.graphics.clear();

    this.graphics.fillStyle(0xffffff);
    this.graphics.fillRect(this.playerState.x - 24, this.playerState.y - 18, 48, 36);

    this.graphics.fillStyle(0xffff00);
    for (const bullet of this.playerState.bullets) {
      this.graphics.fillRect(bullet.x - 2, bullet.y - 5, 4, 10);
    }
  }
}
