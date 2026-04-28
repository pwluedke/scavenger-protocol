// Phaser render entity only. Reads from logic layer state.
import Phaser from 'phaser';
import type { Bullet } from '../logic/player';

export class Bullets {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
  }

  update(bullets: Bullet[]): void {
    this.graphics.clear();
    this.graphics.fillStyle(0xffff00);
    for (const bullet of bullets) {
      this.graphics.fillRect(bullet.x - 2, bullet.y - 5, 4, 10);
    }
  }
}
