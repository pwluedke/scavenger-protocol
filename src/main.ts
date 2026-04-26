import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';

new Phaser.Game({
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  parent: 'game-container',
  scene: [BootScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
