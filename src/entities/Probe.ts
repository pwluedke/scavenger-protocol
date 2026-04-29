// Phaser render entity only. Reads from logic layer state.
// Note: update() accepts timestamp and playerX/playerY beyond the issue spec's (state, reticle)
// because the tether line needs player position and the charge ring needs elapsed time.
import Phaser from 'phaser';
import type { ProbeState, ReticleState } from '../logic/probe';
import { LAYER_COMBAT } from '../logic/layers';

export class Probe {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(LAYER_COMBAT);
  }

  update(
    state: ProbeState,
    reticle: ReticleState,
    timestamp: number,
    playerX: number,
    playerY: number,
  ): void {
    this.graphics.clear();

    if (state.status === 'TARGETING') {
      this.graphics.lineStyle(2, 0x00ffff);
      this.graphics.strokeCircle(reticle.x, reticle.y, 8);
    }

    if (
      state.status === 'LAUNCHED' ||
      state.status === 'RETURNING' ||
      state.status === 'TETHERED'
    ) {
      this.graphics.fillStyle(0x00ffff);
      this.graphics.fillCircle(state.x, state.y, 8);
    }

    if (state.status === 'TETHERED') {
      this.graphics.lineStyle(2, 0x00ffff);
      this.graphics.lineBetween(playerX, playerY, state.x, state.y);

      const elapsed = timestamp - state.tetheredSinceMs;
      const lineWidth = elapsed >= 2000 ? 8 : elapsed >= 700 ? 4 : 2;
      this.graphics.lineStyle(lineWidth, 0x00ffff);
      this.graphics.strokeCircle(state.x, state.y, 16);
    }
  }
}
