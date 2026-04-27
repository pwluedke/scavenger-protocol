import Phaser from 'phaser';
import { ASSETS } from '../config/assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image(ASSETS.background, `assets/sprites/background/${ASSETS.background}.png`);
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
