/**
 * @jest-environment jsdom
 */
import { createInputManager, LogicalAction } from './input';

function makeGamepad(overrides: Partial<{
  axes: number[];
  buttons: { pressed: boolean; value: number }[];
  id: string;
  mapping: string;
}> = {}): Gamepad {
  return {
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0, touched: false })),
    connected: true,
    id: 'Mock Gamepad',
    index: 0,
    mapping: 'standard',
    timestamp: 0,
    hapticActuators: [],
    vibrationActuator: null,
    ...overrides,
  } as unknown as Gamepad;
}

function mockGamepads(gamepad: Gamepad | null) {
  Object.defineProperty(navigator, 'getGamepads', {
    value: () => [gamepad],
    writable: true,
    configurable: true,
  });
}

function pressKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function releaseKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

describe('input -- justPressed edge detection', () => {
  it('PROBE appears in justPressed on the frame U is pressed', () => {
    mockGamepads(null);
    const mgr = createInputManager();
    pressKey('u');
    const frame = mgr.update();
    expect(frame.justPressed.has(LogicalAction.PROBE)).toBe(true);
    mgr.dispose();
  });

  it('PROBE is not in justPressed on subsequent frames without a new keydown', () => {
    mockGamepads(null);
    const mgr = createInputManager();
    pressKey('u');
    mgr.update();
    const frame = mgr.update();
    expect(frame.justPressed.has(LogicalAction.PROBE)).toBe(false);
    mgr.dispose();
  });

  it('FIRE appears in justPressed on Space press', () => {
    mockGamepads(null);
    const mgr = createInputManager();
    pressKey(' ');
    const frame = mgr.update();
    expect(frame.justPressed.has(LogicalAction.FIRE)).toBe(true);
    mgr.dispose();
  });

  it('PAUSE appears in justPressed on Escape press', () => {
    mockGamepads(null);
    const mgr = createInputManager();
    pressKey('Escape');
    const frame = mgr.update();
    expect(frame.justPressed.has(LogicalAction.PAUSE)).toBe(true);
    mgr.dispose();
  });

  it('CANCEL_PROBE appears in justPressed on O press', () => {
    mockGamepads(null);
    const mgr = createInputManager();
    pressKey('o');
    const frame = mgr.update();
    expect(frame.justPressed.has(LogicalAction.CANCEL_PROBE)).toBe(true);
    mgr.dispose();
  });

  it('PROBE appears in justPressed on R3 press (button 11)', () => {
    // Switch source to gamepad via button 7, then release all buttons
    const gpWithFire = makeGamepad({
      buttons: Array.from({ length: 17 }, (_, i) =>
        i === 7 ? { pressed: true, value: 1, touched: false } : { pressed: false, value: 0, touched: false }
      ),
    });
    mockGamepads(gpWithFire);
    const mgr = createInputManager();
    mgr.update(); // source switches to gamepad

    // Press R3 (button 11) with no other buttons held
    const gpWithR3 = makeGamepad({
      buttons: Array.from({ length: 17 }, (_, i) =>
        i === 11 ? { pressed: true, value: 1, touched: false } : { pressed: false, value: 0, touched: false }
      ),
    });
    mockGamepads(gpWithR3);
    const frame = mgr.update();
    expect(frame.justPressed.has(LogicalAction.PROBE)).toBe(true);
    mgr.dispose();
  });
});

describe('input -- diagonal normalization', () => {
  it('W+D combined magnitude is 1.0', () => {
    mockGamepads(null);
    const mgr = createInputManager();
    pressKey('w');
    pressKey('d');
    const { current } = mgr.update();
    const magnitude = Math.sqrt(current.moveX ** 2 + current.moveY ** 2);
    expect(magnitude).toBeCloseTo(1.0, 5);
    mgr.dispose();
  });

  it('single direction magnitude is 1.0', () => {
    mockGamepads(null);
    const mgr = createInputManager();
    pressKey('w');
    const { current } = mgr.update();
    const magnitude = Math.sqrt(current.moveX ** 2 + current.moveY ** 2);
    expect(magnitude).toBeCloseTo(1.0, 5);
    mgr.dispose();
  });

  it('no keys pressed produces magnitude 0', () => {
    mockGamepads(null);
    const mgr = createInputManager();
    const { current } = mgr.update();
    expect(current.moveX).toBe(0);
    expect(current.moveY).toBe(0);
    mgr.dispose();
  });
});

describe('input -- gamepad deadzone', () => {
  it('axis below deadzone (0.1) produces moveX of 0', () => {
    mockGamepads(makeGamepad({ axes: [0.1, 0, 0, 0] }));
    const mgr = createInputManager();
    // Trigger gamepad source by pressing a gamepad button first
    const gp = makeGamepad({
      axes: [0.1, 0, 0, 0],
      buttons: Array.from({ length: 17 }, (_, i) =>
        i === 7 ? { pressed: true, value: 1, touched: false } : { pressed: false, value: 0, touched: false }
      ),
    });
    mockGamepads(gp);
    mgr.update(); // first frame: button 7 pressed, source switches to gamepad
    // Now test with stick only (button released, stick below deadzone)
    mockGamepads(makeGamepad({ axes: [0.1, 0, 0, 0] }));
    const { current } = mgr.update();
    expect(current.moveX).toBe(0);
    mgr.dispose();
  });

  it('axis above deadzone (0.5) passes through', () => {
    // Press button first to switch to gamepad source
    const gpWithButton = makeGamepad({
      axes: [0.5, 0, 0, 0],
      buttons: Array.from({ length: 17 }, (_, i) =>
        i === 7 ? { pressed: true, value: 1, touched: false } : { pressed: false, value: 0, touched: false }
      ),
    });
    mockGamepads(gpWithButton);
    const mgr = createInputManager();
    mgr.update(); // switches to gamepad
    mockGamepads(makeGamepad({ axes: [0.5, 0, 0, 0] }));
    const { current } = mgr.update();
    expect(current.moveX).toBeCloseTo(0.5, 5);
    mgr.dispose();
  });
});

describe('input -- last-input-wins source switching', () => {
  it('keydown switches source to keyboard, overriding gamepad values', () => {
    const gp = makeGamepad({
      axes: [1.0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, (_, i) =>
        i === 7 ? { pressed: true, value: 1, touched: false } : { pressed: false, value: 0, touched: false }
      ),
    });
    mockGamepads(gp);
    const mgr = createInputManager();
    mgr.update(); // gamepad source, moveX = 1.0

    // Keyboard event switches source back to keyboard; no keys held so moveX = 0
    mockGamepads(makeGamepad({ axes: [1.0, 0, 0, 0] }));
    pressKey('a'); // keydown triggers keyboard source
    const { current } = mgr.update();
    // keyboard source: A = moveX -1, gamepad axes[0]=1.0 ignored
    expect(current.moveX).toBe(-1);
    mgr.dispose();
  });

  it('gamepad button press switches source to gamepad', () => {
    mockGamepads(null);
    const mgr = createInputManager();
    pressKey('d');
    mgr.update(); // keyboard source, moveX = 1

    releaseKey('d');
    const gp = makeGamepad({
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, (_, i) =>
        i === 7 ? { pressed: true, value: 1, touched: false } : { pressed: false, value: 0, touched: false }
      ),
    });
    mockGamepads(gp);
    const { current } = mgr.update(); // gamepad source: fire=true
    expect(current.fire).toBe(true);
    mgr.dispose();
  });

  it('gamepad disconnect falls back to keyboard', () => {
    const gp = makeGamepad({
      buttons: Array.from({ length: 17 }, (_, i) =>
        i === 7 ? { pressed: true, value: 1, touched: false } : { pressed: false, value: 0, touched: false }
      ),
    });
    mockGamepads(gp);
    const mgr = createInputManager();
    mgr.update(); // gamepad source

    // Simulate disconnect
    window.dispatchEvent(new Event('gamepaddisconnected'));
    mockGamepads(null);
    pressKey('u');
    const { current } = mgr.update();
    expect(current.probe).toBe(true); // keyboard source after disconnect
    mgr.dispose();
  });
});
