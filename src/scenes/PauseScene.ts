import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    // keyboard plugin always available in browser environment
    this.input.keyboard!.once('keydown-ESC', () => this.scene.start('GameScene'));
  }
}
