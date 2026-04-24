# Known Gotchas

Running memory of things that wasted 30+ minutes. Add to this list as issues are discovered.

## Gamepad API

Gamepad API does not report a connected controller until a button is pressed with the tab focused. Press any button after pairing to wake up `navigator.getGamepads()`.
