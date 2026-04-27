import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private transitioning = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.transitioning = false;

    this.add.text(640, 300, 'SCAVENGER PROTOCOL', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(640, 380, 'Press any key to begin Protocol', {
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // keyboard plugin always available in browser environment
    this.input.keyboard!.once('keydown', () => this.startGame());
  }

  update(): void {
    if (this.transitioning) return;
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (gp && gp.buttons.some((b) => b.pressed)) {
        this.startGame();
        return;
      }
    }
  }

  private startGame(): void {
    this.transitioning = true;
    this.scene.start('GameScene');
  }
}
