// Phaser render entity only. Reads from logic layer state.
import Phaser from 'phaser';
import type { PlayerState } from '../logic/player';
import { LAYER_COMBAT } from '../logic/layers';

export class Player {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(LAYER_COMBAT);
  }

  update(state: PlayerState): void {
    this.graphics.clear();
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillRect(state.x - 24, state.y - 18, 48, 36);
  }
}
