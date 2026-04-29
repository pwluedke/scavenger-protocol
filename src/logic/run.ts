// NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs.

export interface RunState {
  salvageCount: number;
}

export function createRunState(): RunState {
  return { salvageCount: 0 };
}
