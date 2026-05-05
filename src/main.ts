import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';
import { OfferScene } from './scenes/OfferScene';

new Phaser.Game({
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  parent: 'game-container',
  scene: [BootScene, MenuScene, GameScene, PauseScene, GameOverScene, OfferScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
