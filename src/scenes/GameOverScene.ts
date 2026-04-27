import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    this.add.text(640, 300, 'PROTOCOL TERMINATED', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(640, 380, 'Press any key to restart', {
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // keyboard plugin always available in browser environment
    this.input.keyboard!.once('keydown', () => this.scene.start('MenuScene'));
  }
}
