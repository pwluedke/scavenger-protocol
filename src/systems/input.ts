// Input mapping layer. Keyboard + Gamepad API produce identical logical actions.

export enum LogicalAction {
  MOVE_X,
  MOVE_Y,
  FIRE,
  PROBE,
  CANCEL_PROBE,
  PAUSE,
  DASH,
}

export interface InputState {
  moveX: number;
  moveY: number;
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
  return {
    moveX: nx,
    moveY: ny,
    fire: heldKeys.has(' ') || heldKeys.has('j') || heldKeys.has('J'),
    probe: heldKeys.has('k') || heldKeys.has('K'),
    cancelProbe: heldKeys.has('l') || heldKeys.has('L'),
    pause: heldKeys.has('Escape'),
    dash: false,
  };
}

function stateFromGamepad(gp: Gamepad): InputState {
  const rawX = applyDeadzone(gp.axes[0] ?? 0);
  const rawY = applyDeadzone(gp.axes[1] ?? 0);
  const [moveX, moveY] = normalize(rawX, rawY);
  return {
    moveX,
    moveY,
    fire: gp.buttons[7]?.pressed ?? false,
    probe: gp.buttons[2]?.pressed ?? false,
    cancelProbe: gp.buttons[1]?.pressed ?? false,
    pause: gp.buttons[9]?.pressed ?? false,
    dash: false,
  };
}

export function createInputManager(): InputManager {
  const heldKeys = new Set<string>();
  let prevState: InputState = { ...IDLE_STATE };
  let activeSource: 'keyboard' | 'gamepad' = 'keyboard';
  let hadKeydownThisFrame = false;
  let prevGamepadButtons: boolean[] = [];
  let prevRawAxes: [number, number] = [0, 0];
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
      const newButtonPress = gp.buttons.some(
        (btn, i) => btn.pressed && !(prevGamepadButtons[i] ?? false)
      );
      const stickCrossed =
        (Math.abs(prevRawAxes[0]) <= DEADZONE && Math.abs(rawX) > DEADZONE) ||
        (Math.abs(prevRawAxes[1]) <= DEADZONE && Math.abs(rawY) > DEADZONE);
      if (newButtonPress || stickCrossed) activeSource = 'gamepad';
      prevRawAxes = [rawX, rawY];
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
