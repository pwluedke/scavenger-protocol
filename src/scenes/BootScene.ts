import Phaser from 'phaser';
import { ASSETS } from '../config/assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image(ASSETS.background, `assets/sprites/background/${ASSETS.background}.png`);
    this.load.on('loaderror', (file: { key: string }) => {
      if (file.key === 'test-ground') return; // optional test asset, safe to ignore if missing
    });
    this.load.image('test-ground', 'assets/sprites/background/test-ground.png');
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
