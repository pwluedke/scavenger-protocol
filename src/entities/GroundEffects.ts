// Phaser render entity only. Reads from logic layer state.
import Phaser from 'phaser';
import type { DebrisFlash, GroundStain } from '../logic/groundEffects';
import { flashProgress, flashRadius, flashAlpha } from '../logic/groundEffects';
import { LAYER_GROUND } from '../logic/layers';

export class GroundEffects {
  private stainGraphics: Phaser.GameObjects.Graphics;
  private flashGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.stainGraphics = scene.add.graphics().setDepth(LAYER_GROUND);
    this.flashGraphics = scene.add.graphics().setDepth(LAYER_GROUND + 1);
  }

  update(stains: GroundStain[], flashes: DebrisFlash[], currentTimeMs: number): void {
    this.stainGraphics.clear();
    for (const s of stains) {
      this.stainGraphics.fillStyle(0x202020, 0.6);
      this.stainGraphics.fillCircle(s.x, s.y, 8);
    }

    this.flashGraphics.clear();
    for (const f of flashes) {
      const progress = flashProgress(f, currentTimeMs);
      this.flashGraphics.lineStyle(1, 0x404040, flashAlpha(progress));
      this.flashGraphics.strokeCircle(f.x, f.y, flashRadius(progress));
    }
  }
}
