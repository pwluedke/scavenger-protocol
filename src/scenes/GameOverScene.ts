import Phaser from 'phaser';

const STICK_DEADZONE = 0.15;

export class GameOverScene extends Phaser.Scene {
  private gpPrevAnyButton = false;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    this.gpPrevAnyButton = false;

    this.add.text(640, 300, 'PROTOCOL TERMINATED', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(640, 380, 'Press any key or button to restart', {
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.input.keyboard!.once('keydown', () => this.scene.start('MenuScene'));
  }

  update(): void {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    const anyPressed = gp.buttons.some((b) => b?.pressed) ||
      Math.abs(gp.axes[0] ?? 0) > STICK_DEADZONE ||
      Math.abs(gp.axes[1] ?? 0) > STICK_DEADZONE;

    if (!this.gpPrevAnyButton && anyPressed) {
      this.scene.start('MenuScene');
    }

    this.gpPrevAnyButton = anyPressed;
  }
}
