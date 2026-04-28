// Input mapping layer. Keyboard + Gamepad API produce identical logical actions.

export enum LogicalAction {
  MOVE_X,
  MOVE_Y,
  FIRE,
  PROBE,
  CANCEL_PROBE,
  PAUSE,
  DASH,
  RETICLE_LEFT,
  RETICLE_RIGHT,
  RETICLE_UP,
  RETICLE_DOWN,
}

export interface InputState {
  moveX: number;
  moveY: number;
  reticleX: number;
  reticleY: number;
  fire: boolean;
  probe: boolean;
  cancelProbe: boolean;
  pause: boolean;
  dash: boolean;
}

export interface InputFrame {
  current: InputState;
  previous: InputState;
  justPressed: Set<LogicalAction>;
}

export interface InputManager {
  update(): InputFrame;
  dispose(): void;
}

const DEADZONE = 0.15;

const IDLE_STATE: InputState = {
  moveX: 0,
  moveY: 0,
  reticleX: 0,
  reticleY: 0,
  fire: false,
  probe: false,
  cancelProbe: false,
  pause: false,
  dash: false,
};

function applyDeadzone(value: number): number {
  return Math.abs(value) > DEADZONE ? value : 0;
}

function normalize(x: number, y: number): [number, number] {
  const mag = Math.sqrt(x * x + y * y);
  return mag > 1 ? [x / mag, y / mag] : [x, y];
}

function computeJustPressed(prev: InputState, curr: InputState): Set<LogicalAction> {
  const set = new Set<LogicalAction>();
  if (!prev.fire && curr.fire) set.add(LogicalAction.FIRE);
  if (!prev.probe && curr.probe) set.add(LogicalAction.PROBE);
  if (!prev.cancelProbe && curr.cancelProbe) set.add(LogicalAction.CANCEL_PROBE);
  if (!prev.pause && curr.pause) set.add(LogicalAction.PAUSE);
  if (prev.moveX === 0 && curr.moveX !== 0) set.add(LogicalAction.MOVE_X);
  if (prev.moveY === 0 && curr.moveY !== 0) set.add(LogicalAction.MOVE_Y);
  return set;
}

function stateFromKeyboard(heldKeys: Set<string>): InputState {
  let moveX = 0;
  let moveY = 0;
  if (heldKeys.has('a') || heldKeys.has('A') || heldKeys.has('ArrowLeft')) moveX -= 1;
  if (heldKeys.has('d') || heldKeys.has('D') || heldKeys.has('ArrowRight')) moveX += 1;
  if (heldKeys.has('w') || heldKeys.has('W') || heldKeys.has('ArrowUp')) moveY -= 1;
  if (heldKeys.has('s') || heldKeys.has('S') || heldKeys.has('ArrowDown')) moveY += 1;
  moveX = Math.max(-1, Math.min(1, moveX));
  moveY = Math.max(-1, Math.min(1, moveY));
  const [nx, ny] = normalize(moveX, moveY);

  let reticleX = 0;
  let reticleY = 0;
  if (heldKeys.has('j') || heldKeys.has('J')) reticleX -= 1;
  if (heldKeys.has('l') || heldKeys.has('L')) reticleX += 1;
  if (heldKeys.has('i') || heldKeys.has('I')) reticleY -= 1;
  if (heldKeys.has('k') || heldKeys.has('K')) reticleY += 1;
  reticleX = Math.max(-1, Math.min(1, reticleX));
  reticleY = Math.max(-1, Math.min(1, reticleY));

  return {
    moveX: nx,
    moveY: ny,
    reticleX,
    reticleY,
    fire: heldKeys.has(' '),
    probe: heldKeys.has('u') || heldKeys.has('U'),
    cancelProbe: heldKeys.has('o') || heldKeys.has('O'),
    pause: heldKeys.has('Escape'),
    dash: false,
  };
}

function stateFromGamepad(gp: Gamepad): InputState {
  const rawX = applyDeadzone(gp.axes[0] ?? 0);
  const rawY = applyDeadzone(gp.axes[1] ?? 0);
  const [moveX, moveY] = normalize(rawX, rawY);
  const reticleX = applyDeadzone(gp.axes[2] ?? 0);
  const reticleY = applyDeadzone(gp.axes[3] ?? 0);
  return {
    moveX,
    moveY,
    reticleX,
    reticleY,
    fire: gp.buttons[7]?.pressed ?? false,       // R2/RT
    probe: (gp.buttons[2]?.pressed ?? false) || (gp.buttons[10]?.pressed ?? false), // X/Square (2) or R3 (10)
    cancelProbe: gp.buttons[1]?.pressed ?? false, // B/Circle
    pause: gp.buttons[9]?.pressed ?? false,       // Options/Menu
    dash: false,
  };
}

export function createInputManager(): InputManager {
  const heldKeys = new Set<string>();
  let prevState: InputState = { ...IDLE_STATE };
  let activeSource: 'keyboard' | 'gamepad' = 'keyboard';
  let hadKeydownThisFrame = false;
  let prevGamepadButtons: boolean[] = [];
  let prevRawAxes: [number, number, number, number] = [0, 0, 0, 0];
  let gamepadLoggedOnce = false;

  function onKeyDown(e: KeyboardEvent): void {
    heldKeys.add(e.key);
    hadKeydownThisFrame = true;
  }

  function onKeyUp(e: KeyboardEvent): void {
    heldKeys.delete(e.key);
  }

  function onGamepadConnected(e: Event): void {
    if (!gamepadLoggedOnce) {
      const gp = (e as GamepadEvent).gamepad;
      console.log(`Gamepad connected: ${gp.id} (mapping: ${gp.mapping})`);
      gamepadLoggedOnce = true;
    }
  }

  function onGamepadDisconnected(): void {
    if (activeSource === 'gamepad') {
      activeSource = 'keyboard';
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('gamepadconnected', onGamepadConnected);
  window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

  function update(): InputFrame {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0] ?? null;

    // Keyboard wins on same-frame ties -- hadKeydownThisFrame checked first
    if (hadKeydownThisFrame) {
      activeSource = 'keyboard';
    } else if (gp) {
      const rawX = gp.axes[0] ?? 0;
      const rawY = gp.axes[1] ?? 0;
      const rawRX = gp.axes[2] ?? 0;
      const rawRY = gp.axes[3] ?? 0;
      const newButtonPress = gp.buttons.some(
        (btn, i) => btn.pressed && !(prevGamepadButtons[i] ?? false)
      );
      const stickCrossed =
        (Math.abs(prevRawAxes[0]) <= DEADZONE && Math.abs(rawX) > DEADZONE) ||
        (Math.abs(prevRawAxes[1]) <= DEADZONE && Math.abs(rawY) > DEADZONE) ||
        (Math.abs(prevRawAxes[2]) <= DEADZONE && Math.abs(rawRX) > DEADZONE) ||
        (Math.abs(prevRawAxes[3]) <= DEADZONE && Math.abs(rawRY) > DEADZONE);
      if (newButtonPress || stickCrossed) activeSource = 'gamepad';
      prevRawAxes = [rawX, rawY, rawRX, rawRY];
    }

    hadKeydownThisFrame = false;

    const current =
      activeSource === 'gamepad' && gp
        ? stateFromGamepad(gp)
        : stateFromKeyboard(heldKeys);

    prevGamepadButtons = gp ? gp.buttons.map((b) => b.pressed) : [];

    const justPressed = computeJustPressed(prevState, current);
    const previous = prevState;
    prevState = current;

    return { current, previous, justPressed };
  }

  function dispose(): void {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('gamepadconnected', onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
  }

  return { update, dispose };
}
