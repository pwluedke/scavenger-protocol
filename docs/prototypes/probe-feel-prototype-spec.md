Probe-Feel Prototype Spec
Status: pre-implementation
Owner: Paul
Implementer: Gloom
Strategy review: Vega
Purpose: answer a single question before committing to Scavenger Protocol: does the probe mechanic feel good?

1. Goal
Validate the probe-fire-target-tether-return loop as a moment-to-moment play experience. This prototype is throwaway. It is not the foundation of the final game. Its only output is a go/no-go decision on the mechanic.
2. Non-goals
Everything below is explicitly out of scope. If it comes up in implementation, cut it.

Phaser
TypeScript build tooling beyond a single-file Vite starter, or even no build (plain <script type="module"> is fine)
Jest, Playwright, any tests
Seeded RNG, determinism
Logic/render layer separation
Progression tree, node offers, rarity pools
Enemy variety beyond the minimum needed to evaluate the probe
Art beyond colored rectangles and circles
Sound
Score, timer, UI chrome, menus, pause screen
Controller input (keyboard only, prototype is desktop browser only)
Responsive sizing, mobile support
CI, deploy, any GitHub Actions
Repo conventions (no CLAUDE.md, no slash commands, no ADRs)

If the feel validates, this prototype is archived and the real project starts from scratch with full scaffolding.
3. Success criteria
After 15 minutes of play, Paul can answer yes to all of these:

Firing the probe feels like a decisive action, not a fiddle.
The slow-mo targeting phase feels useful, not annoying.
Target selection is fast and readable. It does not feel like picking from a menu.
The tether duration decision (bail early for safe commons vs. stay longer for rares) creates real tension in the moment.
Losing the probe to enemy fire feels bad in a motivating way, not frustrating.
The 3-second return cooldown and 8-second destruction cooldown feel right (or within a tweak, not a redesign).
Paul wants to keep playing after the 15-minute evaluation.

If any answer is no, the mechanic needs redesign before the real project starts.
4. Scope
The play field

Single static screen, no scroll
800x600 canvas, fixed size, black background
Player ship (white triangle or rectangle) at bottom center, controlled by arrow keys or WASD
Screen wraps horizontally (player can exit left edge, reappears right edge)

The enemies
Two types, nothing more:

Grunts. Red squares. Spawn at top, drift downward in slow sine waves. Die in one shot. Drop nothing. Purpose: provide basic shooting rhythm and incoming pressure.
Husks. Orange larger squares. Spawn at top, drift downward slowly. Take 3 shots to kill. On death, leave a stationary wreck (gray square) that persists for 10 seconds. Purpose: probe targets.

Spawn rates: 1 Grunt per second, 1 Husk per 6 seconds. Hardcoded. No waves, no ramp, no seeds.
The player

Move with arrow keys or WASD
Fire yellow bullets straight up with spacebar, 5 shots per second max
Player has 3 HP displayed as 3 circles in top left. Enemy contact or enemy bullet (Grunts do not shoot, only Husks do, see below) removes 1 HP.
Husks fire straight-down red bullets every 2 seconds while alive.
On 0 HP, game stops and shows "Dead. Press R to restart."

The probe (the whole point)

Fire with E key
State machine exactly as in the design doc section 4:

IDLE (default)
TARGETING: game drops to 20% speed, a cyan reticle appears near the player, left stick / WASD moves reticle, valid targets highlight (wrecks and floating pickups, see below). Grunts and live Husks are not valid targets. Press E to confirm target, press Q to cancel.
LAUNCHED: probe (small cyan circle) travels at 600 px/sec from player to target. If it collides with a Husk bullet en route, it is destroyed.
TETHERED: probe is stuck to target. A cyan line draws from player to probe. The tether pulses a visible charge ring around the probe showing tier (Tier 1: thin ring, Tier 2: medium ring, Tier 3: thick ring).

Tier 1: 0 to 1.5 seconds
Tier 2: 1.5 to 3 seconds
Tier 3: 3 seconds and beyond


RETURNING: on second E press, probe returns to player at 600 px/sec, carrying nothing visible. Incoming bullets can destroy it on the way back.
DESTROYED: if probe takes more than 3 hits while extended, it vanishes, 8-second cooldown begins.
COOLDOWN: cannot fire a new probe. Show a gray bar near the HP circles counting down. 3 seconds on normal return, 8 seconds on destruction.



The reward (stubbed)
This prototype is NOT validating the progression tree. It IS validating the tier decision. So:

On successful probe of a wreck, print to the top of the screen: Tier 1 reward! / Tier 2 reward! / Tier 3 reward! based on final tether duration.
No actual upgrade. No menu. Just the text flash for 2 seconds.
That is enough to validate whether the tier decision feels meaningful. The actual reward payload is a solved problem (Vampire Survivors did it, we just need to copy the pattern later).

Floating pickups
Optional, only if needed after first playtest. A green circle spawns every 20 seconds at a random screen location and drifts slowly downward. Probe can grab it for a "Pickup grabbed!" text flash. Purpose: validate the non-wreck probe target flow so we know slow-mo targeting works when picking between multiple target types.
Start without this. Add only if the wreck-only test feels incomplete.
Controls summary
ActionKeyMoveArrow keys or WASDFireSpaceProbe fire / confirm target / recallECancel probe targetingQRestart after deathR
5. Tech stack

Plain TypeScript, one file if possible, two or three max
Vite starter (fastest path to a TS dev server)
Canvas 2D API, no Phaser
No dependencies beyond Vite itself
No build step concerns beyond npm run dev
Runs in Chrome or Firefox, desktop only

Why not Phaser: the prototype needs to be trivially disposable. Spinning up a Phaser scene graph for a throwaway is overkill, and the point is to feel-test the mechanic, not learn Phaser's APIs.
Why TypeScript: Paul already uses it. Zero friction. Gives a tiny bit of type safety on the state machine that helps iteration.
6. Implementation plan (for Gloom)

npm create vite@latest probe-prototype -- --template vanilla-ts in a scratch directory outside the scavenger-protocol repo
Strip the template down to a single src/main.ts, single index.html with a canvas element, delete the CSS
Main game loop: requestAnimationFrame, track deltaMs since last frame
Entities as plain objects in arrays: player, grunts, husks, wrecks, bullets (player), huskBullets, probe
Probe as a discriminated union typed state machine, one ProbeState type with variants
Input via window.addEventListener('keydown' | 'keyup', ...), track a keys record
Update loop calls updatePlayer, updateEnemies, updateBullets, updateProbe, spawnEnemies, detectCollisions, draw
Slow-mo is implemented by multiplying deltaMs by 0.2 before passing it to update functions while probe is in TARGETING state
Draw everything as fillRect / arc / stroke. No sprites.
Iterate on feel. Expect to tweak: probe travel speed, slow-mo factor, tether tier thresholds, cooldown durations, reticle sensitivity.

7. Tuning knobs to expose at the top of main.ts
Paul should be able to edit these without hunting through code. Put them in a const TUNING = { ... } block at the top:
PROBE_TRAVEL_SPEED: 600
SLOWMO_FACTOR: 0.2
TIER_1_MAX_MS: 1500
TIER_2_MAX_MS: 3000
COOLDOWN_RETURN_MS: 3000
COOLDOWN_DESTROYED_MS: 8000
PROBE_HP: 3
PLAYER_HP: 3
PLAYER_FIRE_RATE_MS: 200
PLAYER_BULLET_SPEED: 500
HUSK_FIRE_RATE_MS: 2000
HUSK_BULLET_SPEED: 300
RETICLE_SPEED: 400
Change values, refresh browser, re-feel. Tight loop.
8. Definition of done
Prototype is done when:

All success criteria above can be evaluated (mechanic is playable end to end)
Paul has played it for at least 15 minutes
Paul has written a one-paragraph go/no-go verdict in notes.md in the prototype directory
If no-go: a list of what felt wrong, what to redesign
If go: confirmation that the design doc probe spec does not need to change, or the list of changes that should flow back into design doc v0.2

9. Time budget

Implementation: 4 to 6 hours in one sitting
Playtest and iteration: 1 to 2 hours across one or two sessions
Writeup: 30 minutes

If implementation is still going after 8 hours, something is wrong with the scope. Stop and re-scope.
10. After the prototype
Regardless of go/no-go, the prototype code is not reused. The real project starts with a clean scaffold. What DOES flow forward:

Tuning numbers that felt good (copy into docs/tuning.md)
Any design changes (update docs/design-doc.md to v0.2)
The prototype directory gets archived into scavenger-protocol/docs/prototypes/probe-feel/ for posterity and interview talking points