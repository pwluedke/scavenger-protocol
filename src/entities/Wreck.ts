// Phaser render entity only. Reads from logic layer state.
import Phaser from 'phaser';
import type { Wreck as WreckLogic } from '../logic/wreck';

export class Wreck {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
  }

  update(wrecks: WreckLogic[], _candidateWreckId: number | null = null): void {
    this.graphics.clear();
    for (const w of wrecks.filter((w) => w.alive)) {
      const half = 16 * w.scale;
      // TODO: when candidateWreckId === w.id, render with brighter/pulsing outline to show probe lock candidate
      this.graphics.lineStyle(1, 0x808080);
      this.graphics.strokeRect(w.x - half, w.y - half, half * 2, half * 2);
    }
  }
}
