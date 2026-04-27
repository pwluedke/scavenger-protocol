import Phaser from 'phaser';
import { createInputManager, InputManager, InputFrame } from '../systems/input';

const SLOWMO_FACTOR = 0.2;

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private inSlowMo = false;
  private loggedUpdateLogic = false;
  private loggedDrawScene = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.inputManager = createInputManager();
    this.events.once('shutdown', () => this.inputManager.dispose());
  }

  update(time: number, delta: number): void {
    const inputFrame = this.inputManager.update();
    const effectiveDeltaMs = delta * (this.inSlowMo ? SLOWMO_FACTOR : 1);
    const effectiveDeltaSeconds = effectiveDeltaMs / 1000;
    this.updateLogic(inputFrame, effectiveDeltaMs, time);
    this.drawScene();
    void effectiveDeltaSeconds;
  }

  setSlowMo(active: boolean): void {
    this.inSlowMo = active;
  }

  private updateLogic(_inputFrame: InputFrame, _effectiveDeltaMs: number, _timestamp: number): void {
    if (!this.loggedUpdateLogic) {
      console.log('updateLogic stub');
      this.loggedUpdateLogic = true;
    }
  }

  private drawScene(): void {
    if (!this.loggedDrawScene) {
      console.log('drawScene stub');
      this.loggedDrawScene = true;
    }
  }
}
