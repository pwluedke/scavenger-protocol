// Phaser render entity only. Reads from logic layer state.
import Phaser from 'phaser';
import type { Driftling, Husk } from '../logic/enemies';

export class Enemy {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
  }

  update(driftlings: Driftling[], husks: Husk[]): void {
    this.graphics.clear();
    for (const d of driftlings.filter((d) => d.alive)) {
      this.graphics.lineStyle(1, 0x606060);
      this.graphics.strokeCircle(d.x, d.y, 14);
      this.graphics.fillStyle(0xc0c0c0);
      this.graphics.fillCircle(d.x, d.y, 12);
    }
    for (const h of husks.filter((h) => h.alive)) {
      this.graphics.fillStyle(0x808080);
      this.graphics.fillRect(h.x - 20, h.y - 20, 40, 40);
    }
  }
}
