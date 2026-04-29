// Phaser render entity only. Reads from logic layer state.
import Phaser from 'phaser';
import type { Wreck as WreckLogic } from '../logic/wreck';
import { wreckScale } from '../logic/wreck';
import { LAYER_COMBAT, LAYER_MID_FALL, LAYER_LATE_FALL } from '../logic/layers';

export class Wreck {
  private combatGraphics: Phaser.GameObjects.Graphics;
  private midFallGraphics: Phaser.GameObjects.Graphics;
  private lateFallGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.combatGraphics = scene.add.graphics().setDepth(LAYER_COMBAT);
    this.midFallGraphics = scene.add.graphics().setDepth(LAYER_MID_FALL);
    this.lateFallGraphics = scene.add.graphics().setDepth(LAYER_LATE_FALL);
  }

  update(wrecks: WreckLogic[], candidateWreckId: number | null = null, currentTimeMs = 0): void {
    this.combatGraphics.clear();
    this.midFallGraphics.clear();
    this.lateFallGraphics.clear();

    for (const w of wrecks.filter((w) => w.alive)) {
      const scale = wreckScale(w, currentTimeMs);
      const half = 16 * scale;
      const color = candidateWreckId === w.id ? 0xffffff : 0x808080;

      let g: Phaser.GameObjects.Graphics;
      if (w.phase === 'drifting') g = this.combatGraphics;
      else if (w.phase === 'midFall') g = this.midFallGraphics;
      else g = this.lateFallGraphics;

      g.lineStyle(1, color);
      g.strokeRect(w.x - half, w.y - half, half * 2, half * 2);
    }
  }
}
