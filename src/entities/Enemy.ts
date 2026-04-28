// Phaser render entity only. Reads from logic layer state.
import Phaser from 'phaser';
import type { Driftling } from '../logic/enemies';

export class Enemy {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
  }

  update(driftlings: Driftling[]): void {
    this.graphics.clear();
    for (const d of driftlings) {
      this.graphics.lineStyle(1, 0x606060);
      this.graphics.strokeCircle(d.x, d.y, 14);
      this.graphics.fillStyle(0xc0c0c0);
      this.graphics.fillCircle(d.x, d.y, 12);
    }
  }
}
