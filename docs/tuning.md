# Tuning

Authoritative source for all numeric values in Scavenger Protocol. Codified into `src/logic/*-data.ts` files at implementation time.

**Version:** v1.0, design pass 2 complete, April 2026

**Version history:**
- v1.0 (design pass 2): player ship baseline, probe tuning, progression tree, boss and wave schedule, background scroll

---

## Player ship

### Weapon baseline
Single forward shot. Maximum design space for progression to add multishot, spread, piercing, charge. Starter weapon is deliberately humble so progression growth feels meaningful.

### Stats

| Stat | Value | Notes |
|---|---|---|
| HP | 3 | Roguelite standard; three meaningful death moments per run. |
| Hitbox size | 16 x 16 px | Smaller than 48 x 48 visible sprite. Touhou-style core hitbox. |
| Max move speed | 320 px/s | Slower than prototype's 400 because inertia plus analog stick reduces overshoot need. |
| Acceleration | 1600 px/s² | Reaches max speed in ~0.2s from standstill. |
| Deceleration | 800 px/s² | A bit drifty. On first test after scaffolding, changed from 2400 to 800. Will likely tune more.|
| Y movement bound | bottom 35% of canvas | More room than prototype's 30%, allowing upward dodge into bullet patterns. |
| Bullet damage | 10 | Round number for clean progression scaling. |
| Fire rate | 200 ms (5 shots/sec) | Same as prototype, felt right. |
| Bullet speed | 600 px/s | Faster than prototype's 500. Bullets outpace the ship. |

### Movement behavior

| Behavior | Rule |
|---|---|
| Inertia profile | In-between: 1942 / Aero Fighters style. Acceleration and deceleration as above. |
| Diagonal movement | Normalized. Up+right total speed equals up alone. No diagonal speed advantage. |
| Horizontal edges | Wrap. Exit left, reappear right. Preserves Megamania DNA and provides Husk-bullet escape options. |
| Vertical edges | Clamp. Hard stop at top and bottom of allowed Y range. No wrap, no bounce. |
| Input source switching | Last input evt wins. Keyboard keydown OR gamepad button-press / stick-edge transitions. |

### Death and game over

| Condition | Outcome |
|---|---|
| Player HP reaches 0 | GameScene transitions to GameOverScene immediately; no partial-frame state updates after the check |
| GameOverScene | Displays "PROTOCOL TERMINATED". Any keypress restarts from MenuScene. |
| On restart | GameScene.create() resets gameTimeMs to 0; all spawn schedules and timers resume from t=0 of the new run. |

### Open questions

1. **Tap-to-fire as alternative input mode.** Current behavior is hold-to-fire (space or RT held continuously, fire rate capped by 200ms throttle). A tap-each-shot mode for players who prefer twin-stick rhythm could be added as a settings toggle. Defer until post-MVP playtest provides signal on whether this is needed.

---

## Probe

### Tuning carryover from prototype

All prototype values felt right after 20+ runs. Locked in.

| Stat | Value | Notes |
|---|---|---|
| Probe travel speed | 600 px/s | Same speed for launch and return. |
| Slow-mo factor | 0.2 | Game speed during TARGETING. |
| Tier 1 max | 1500 ms | 0 to 1.5s tether duration: common pool. |
| Tier 2 max | 3000 ms | 1.5 to 3s tether duration: uncommon pool. |
| Tier 3 threshold | 3000 ms+ | Beyond 3s: rare pool. |
| Tether duration cap | 6000 ms | Auto-releases at the cap with the earned tier (always Tier 3). No penalty. Behaves identically to manual release at that moment. |
| Cooldown on successful return | 3000 ms | |
| Cooldown on destruction | 8000 ms | ~2.6x penalty motivates probe preservation without being punitive. |
| Probe HP | 3 | Three Husk-bullet hits while extended before destruction. |
| Probe radius | 8 px | Visual and collision. |
| Reticle speed | 480 px/s | Bumped from prototype's 400 to feel snappier alongside the ship's 320 max speed. |
| Reticle snap distance | 60 px | Wreck highlighting range. |

### Visual feedback

| Element | Spec |
|---|---|
| Tether line | Cyan, 2 px wide, drawn from player center to probe |
| Charge ring (Tier 1) | Cyan (#00CCCC), 2 px lineWidth |
| Charge ring (Tier 2) | Brighter cyan (#00FFFF), 4 px lineWidth |
| Charge ring (Tier 3) | White-cyan (#CCFFFF), 8 px lineWidth |
| Tier transition flash | Single-frame full ring flash on entering Tier 2 and Tier 3 |
| Probe destruction | 100 ms white flash at probe position + small screen shake (~4 px amplitude, 200 ms duration) |
| Probe successful return | Brief glow on probe arriving at player, ~200 ms cyan halo |

### Audio behavior during slow-mo

| Channel | Behavior during TARGETING |
|---|---|
| Music | Drop to 50% volume |
| Enemy sounds (bullets, deaths, spawn) | Drop to 50% volume |
| Player ship sounds (movement, fire) | Drop to 50% volume |
| Reticle and probe sounds | Full volume |
| Optional polish (post-MVP if time) | Add low-pass filter or short reverb to the dampened channels for a muffled time effect |

### Edge cases

| Scenario | Behavior |
|---|---|
| Player dies while probe is extended | Probe freezes in current visual state. No special probe-death animation. State resets on run reset. |
| Wreck expires (10s) while probe is in LAUNCHED toward it | Probe immediately enters RETURNING with empty flag. Cooldown applies as normal on return. No reward flash. |
| Wreck expires (10s) while probe is in TETHERED | Same: RETURNING with empty flag. |
| Probe destroyed during TARGETING | Not possible. TARGETING is pre-launch; probe is not yet extended. |
| E pressed in TARGETING with no highlighted target | Cancels TARGETING, returns to IDLE at full speed. Same effect as Q. |

### Reticle defaults

| Behavior | Rule |
|---|---|
| Starting position on TARGETING entry | 60 px above player center |
| Bounds | Clamps to canvas bounds; cannot move offscreen |
| Speed during slow-mo | Full real-time speed (not slowed) |
| Visibility | Only rendered during TARGETING state |

---

## Progression tree

### Structure rules

- 5 branches, 4 tiers each, 20 nodes total at MVP
- Tether duration on probe return determines rarity pool for the offer
- On probe return: 3 random eligible nodes offered, player picks 1
- Eligibility: parent node (same branch, previous tier) must already be taken
- All picks apply immediately to the ship for the current run only
- Run ends, all picks lost. Clean slate next run.
- Fallback if fewer than 3 eligible nodes in target pool: fall back to next rarity down until 3 offers can be assembled
- End state: player has taken every node in the rare pool. No more offers fire silently on probe return.

### Rarity pool assignments

| Pool | Nodes |
|---|---|
| Common (Tier 1 tether, 0-1.5s) | Pellet Drive, Plating, Reinforced Tether, Thruster Boost, Scrap Sense |
| Uncommon (Tier 2 tether, 1.5-3s) | Twin Shot, Hull Memory, Quick Recall, Slip Drive, Extended Haul, Piercing Rounds, Static Shielding, Infiltration, Integrity Survey, Weightless |
| Rare (Tier 3 tether, 3s+) | Salvo, Phoenix Protocol, Salvager's Kiss, Phase Shift, Deep Salvage |

### Full node table

| Branch | Tier | Name | Effect | Key stat(s) |
|---|---|---|---|---|
| Offense | 1 | Pellet Drive | +20% bullet damage | 10 → 12 damage |
| Offense | 2 | Twin Shot | Fire 2 parallel pellets per shot | 12px spacing, same damage per pellet |
| Offense | 3 | Piercing Rounds | Bullets pass through 1 enemy | Pierce count 1 at MVP |
| Offense | 4 | Salvo | Every 5th shot fires a burst projectile | 3x damage (36 total), slightly larger hitbox |
| Defense | 1 | Plating | +1 max HP | 3 → 4 HP |
| Defense | 2 | Hull Memory | Regen 1 HP every 60 seconds | Does not exceed max HP |
| Defense | 3 | Static Shielding | Taking damage emits a 100px shockwave | 25 damage to all enemies in radius |
| Defense | 4 | Phoenix Protocol | First lethal hit per run is negated | Drops to 1 HP instead of dying, triggers once per run |
| Probe | 1 | Reinforced Tether | +1 probe HP | 3 → 4 probe HP |
| Probe | 2 | Quick Recall | Successful return cooldown reduced 33% | 3000ms → 2000ms (destruction cooldown unchanged at 8000ms) |
| Probe | 3 | Infiltration | Mid-tether (0.5s to 1.5s) on a live enemy triggers a hack. Hacked enemy fires one burst on its nearest ally then returns to normal. Below 0.5s tether: probe bounces back, no effect, no cooldown. Above 1.5s with Salvager's Kiss: transitions into damage territory. | Hack requires 0.5s minimum tether on live enemy |
| Probe | 4 | Salvager's Kiss | Long tether (1.5s+) on live enemy damages and kills it. Enemy becomes a wreck mid-tether. Tier rules apply from kill moment. Tether timer continues after kill for tier purposes. | Damage scales with tether duration. |
| Mobility | 1 | Thruster Boost | +20% max move speed | 320 → 384 px/s |
| Mobility | 2 | Slip Drive | Probe button in IDLE state triggers i-frame dash in movement direction | Distance 120px, duration 80ms, cooldown 1500ms, i-frames during dash |
| Mobility | 3 | Weightless | Deceleration doubled + vertical constraint removed | 2400 → 4800 px/s² deceleration. Player can move full canvas vertically. |
| Mobility | 4 | Phase Shift | Each time HP drops to exactly 1, enter 3-second ghost mode (no bullet damage) | Triggers per HP-drop-to-1 event, not once per run |
| Salvage | 1 | Scrap Sense | Wrecks pulse with visible glow for 2 seconds after spawning | 2s spawn highlight |
| Salvage | 2 | Extended Haul | Wreck expiry time increased | 10000ms → 18000ms |
| Salvage | 3 | Integrity Survey | Reveals class-specific design flaw weak points on enemy hulls for enemy classes the player has probed in any prior run. Weak points take 1.5x damage. Visual: subtle structural indicator on sprite, not a glowing dot. First run: nothing revealed even with node active. | 1.5x damage to revealed weak points |
| Salvage | 4 | Deep Salvage | Tier 1 and Tier 2 probe returns upgraded one tier for offer purposes | Tier 1 tether → uncommon pool, Tier 2 tether → rare pool, Tier 3 unchanged |

### Cross-branch synergies (intentional)

| Synergy | Branches | How it plays |
|---|---|---|
| Plating + Phase Shift | Defense + Mobility | Extra HP means more opportunities to hit the 1-HP trigger |
| Phoenix Protocol + Phase Shift | Defense + Mobility | Phoenix negates the kill; Phase Shift activates at 1 HP. Two distinct safety layers. |
| Salvager's Kiss + Deep Salvage | Probe + Salvage | Live-enemy probing gets tier-upgraded rewards. Short tether on a Husk = uncommon pool. |
| Quick Recall + Deep Salvage | Probe + Salvage | Fast probes hit uncommon pool. Short cooldown means more frequent offers. |
| Static Shielding + Weightless | Defense + Mobility | Move freely across full canvas, absorb hits intentionally to trigger shock pulse. |
| Hull Memory + Phoenix Protocol | Defense + Defense | Slow regen keeps HP from sitting at 1 after Phoenix triggers. |
| Integrity Survey + Infiltration | Salvage + Probe | Hacked enemy targets ally weak points with its burst fire. Chaos with intelligence behind it. |

### Post-MVP notes

- **Multi-level Piercing (v1.1):** Piercing Rounds at MVP = 1-pierce. v1.1 alien-tech unlocks add "Deep Piercing" (2-pierce) and "Apex Piercing" (3-pierce) as new nodes via meta-progression.
- **Shock Rounds (v1.1):** Bullet-to-enemy chain-shock mechanic deferred. Potentially a new Offense node unlocked via alien-tech meta.
- **Capstone synergy nodes (v1.1):** Cross-branch capstones planned in design doc but out of MVP scope.

---

## Bosses

### Warden (mini-boss, appears twice)

Visual: large orange-red rectangle, 64x48px. Two visible vents (small rects, one each side) are probe-valid hitboxes.

**HP:**
| Encounter | HP |
|---|---|
| Encounter 1 (minute 6) | 400 |
| Encounter 2 (minute 13) | 600 |

**Movement:**
| Encounter | Movement |
|---|---|
| Encounter 1 | Slow horizontal drift across top third of screen, reverses at edges |
| Encounter 2 | Same drift plus slow downward lunge every 15 seconds (to mid-screen and back) |

**Attacks:**
| Attack | Encounter 1 | Encounter 2 |
|---|---|---|
| Spread shot | 3-bullet spread, every 2.5s | 5-bullet spread, every 2s |
| Aimed shot | One bullet aimed at player, every 4s | Every 3s |
| Lunge | None | Slow downward move to mid-screen every 15s, fires spread on arrival |

**Probe interaction:**
- Vents glow cyan every 12 seconds for 3 seconds (probe window)
- Encounter 2: vent window every 15 seconds
- Probe during window: normal tier rules, Salvager's Kiss damage applies if taken
- Probe outside window: probe bounces back immediately, no reward, no cooldown

**Death:**
- Large explosion
- 3 wrecks spawn at death position
- 30-second recovery period before next wave

---

### Behemoth (final boss)

Visual: dark gray rectangle, 96x72px. Four vents: one each side plus two on bottom facing player.

**HP:** 1200 total, 400 per phase

**Movement:**
| Phase | Movement |
|---|---|
| Phase 1 | Slow horizontal drift, top 20% of screen |
| Phase 2 | Diagonal movement added, top 30% of screen |
| Phase 3 | Unpredictable movement, top 40% of screen |

**Attacks:**
| Attack | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Spread shot | 5-bullet, every 2s | 7-bullet, every 1.8s | 9-bullet, every 1.5s |
| Aimed shot | Every 3s | Every 2.5s | Every 2s |
| Bullet wall | None | Row of 8 bullets every 8s | Every 5s |
| Homing bullet | None | None | One slow-tracking bullet every 6s |

**Phase transitions:**
- 1 second pause on each transition
- Screen flash, color shift (dark gray → dark red → near-black)
- All 4 vents glow simultaneously for probe window (4 seconds on Phase 1-2, 3 seconds on Phase 2-3)
- Phase transition probe window: rare pool guaranteed regardless of tether duration

**Probe interaction:**
| Phase | Valid vents | Glow window | Interval | Pool |
|---|---|---|---|---|
| Phase 1 | Bottom 2 vents | 3 seconds | Every 10s | Normal tier rules |
| Phase 2 | All 4 vents | 3 seconds | Every 10s | Normal tier rules |
| Phase 3 | All 4 vents | 2 seconds | Every 12s | Rare pool guaranteed |
| Transition | All 4 vents | 4s (Ph1-2), 3s (Ph2-3) | Once per transition | Rare pool guaranteed |

**Death:**
- Multi-stage explosion animation
- 5 wrecks spawn
- Run-end screen after explosion
- Score: enemies killed, wrecks probed, nodes acquired, time survived, mini-bosses defeated

---

## Driftlings

### Stats

| Stat | Value | Notes |
|---|---|---|
| HP | 1 | One bullet kill. |
| Hitbox radius | 14 px | Matches visual circle radius. |
| Descent speed | 80 px/s | Steady downward drift. |
| Sine amplitude range | 20 to 200 px (capped) | Random per spawn. Capped to keep Driftling inside canvas. |
| Amplitude edge margin | 50 px | Minimum gap between Driftling path and canvas edge. |
| Sine frequency | 0.5 to 0.6 Hz | Random per spawn. |
| Sine phase | 0 to 2*PI rad | Random per spawn. |

### Spawn schedule

| Window | Rate | Notes |
|---|---|---|
| 0 to 5000 ms | None | Grace period at run start. |
| 5000 to 25000 ms | 1 per 1500 ms | Early wave: one every 1.5 seconds. |
| 25000 to 45000 ms | 1 per 800 ms | Escalation: one every 0.8 seconds. |
| 45000+ ms | None | Placeholder. Full wave scheduler (Issue #73) will take over. |

### Spawn position

| Axis | Rule |
|---|---|
| X | Random across [50, 1230] |
| Y | -20 px (just above canvas top) |

### Collision

| Hit type | Effect |
|---|---|
| Bullet hits Driftling | Bullet consumed, Driftling HP -1 (dead at 0) |
| Player body hits Driftling | Player takes 1 HP damage (invulnerability 1000ms), Driftling dies |

---

## Wrecks and ground effects

### Wreck lifecycle

| Phase | Duration | Scale | Layer |
|---|---|---|---|
| Drifting | 4000 ms | 1.0 | LAYER_COMBAT (400) |
| MidFall | 2000 ms | 1.0 to 0.7 (lerp) | LAYER_MID_FALL (300) |
| LateFall | 2000 ms | 0.7 to 0.4 (lerp) | LAYER_LATE_FALL (200) |
| Grounded | -- | -- | Replaced by debris flash + ground stain |

Scale lerps smoothly within each fall phase; no snap at phase boundaries. Velocity constant at 40 px/s (80% of Husk descent speed) through all phases.

### Debris flash

Created when a wreck transitions from lateFall to grounded.

| Property | Value |
|---|---|
| Lifetime | 600 ms |
| Initial radius | 8 px |
| Final radius | 50 px |
| Alpha | 1.0 to 0.0 over lifetime |
| Color | 0x806040 (warm orange-brown, reads as impact dust) |
| Layer | LAYER_GROUND + 1 (101) |

### Ground stain

Created alongside the debris flash; persists for the entire run.

| Property | Value |
|---|---|
| Shape | Filled circle, radius 8 px |
| Color | 0x202020 |
| Alpha | 0.6 |
| Layer | LAYER_GROUND (100) |
| Cap | 100 stains maximum; oldest drops off when cap is reached |

---

## Wave schedule

### Timeline

| Time | Event | Notes |
|---|---|---|
| 0:00 | Run start | No enemies for 3 seconds |
| 0:03 | Wave 1: Sine Sweep | 5 Driftlings, tight arcs |
| 0:45 | Wave 2: Sine Sweep (larger) | 8 Driftlings, wider arcs |
| 1:30 | Wave 3: Turret Line | 3 Hivecasters, static fire |
| 2:15 | Rest beat (15s) | Recovery |
| 2:30 | Wave 4: Husk Rush | 2 Husks |
| 3:30 | Wave 5: Pincer | Skimmers from both edges |
| 4:15 | Wave 6: Mixed Pressure | Driftlings + 1 Husk + Hivecaster |
| 5:00 | Rest beat (20s) | Pre-boss recovery |
| 5:20 | Warden arrival card | Title card: "WARDEN" |
| 5:30 | Warden Encounter 1 | Boss fight |
| ~7:00 | Warden death | 3 wrecks, 30s recovery |
| 7:30 | Wave 7: Sine Sweep | Faster Driftlings |
| 8:15 | Wave 8: Husk Rush | 3 Husks |
| 9:00 | Wave 9: Turret Line | 4 Hivecasters, tighter spacing |
| 9:45 | Wave 10: Pincer | Skimmers + 1 Husk |
| 10:30 | Rest beat (20s) | Recovery |
| 10:50 | Wave 11: Mixed Pressure | Denser than Wave 6 |
| 11:45 | Wave 12: Husk Rush | 4 Husks, maximum probe opportunity |
| 12:30 | Rest beat (25s) | Pre-boss recovery |
| 12:55 | Warden arrival card | Title card: "WARDEN RETURNS" |
| 13:00 | Warden Encounter 2 | Harder, lunge added |
| ~15:00 | Warden death | 3 wrecks, 30s recovery |
| 15:30 | Wave 13: Mixed Pressure | Hardest general wave |
| 16:15 | Wave 14: Pincer | Maximum Skimmer count |
| 17:00 | Rest beat (45s) | Long pre-Behemoth recovery |
| 17:45 | Behemoth arrival card | Title card: "THE BEHEMOTH" |
| 18:00 | Behemoth Phase 1 | |
| ~19:00 | Behemoth Phase 2 | Approximate, scales to player DPS |
| ~19:30 | Behemoth Phase 3 | |
| ~20:00 | Behemoth death | Run end |

### Difficulty ramp

| Window | Character |
|---|---|
| 0:00 to 5:00 | Introduction. All enemy types appear at least once. Player learns the basics. |
| 5:00 to 13:00 | Escalation. Counts increase, spacing tightens, Husks more frequent. |
| 13:00 to 18:00 | Peak pressure. Hardest general waves. Maximum probe opportunity before Behemoth. |
| 18:00 to 20:00 | Boss gauntlet. Behemoth only. No general enemies during any boss fight. |

### Design rules

- Rest beats are not optional. They let the player collect wrecks, recover from probe cooldown, and prepare for the next escalation. Do not compress without playtesting evidence.
- All spawn times, enemy counts, and trajectories are derived from the run seed. Same seed = identical run.

---

## Background scroll

### Concept

Vertically scrolling destroyed Earth surface drawn behind all game entities. Sells the narrative frame without tutorial text. Anchors vertical scroll as forward motion over a warzone.

### Scroll speed by game state

| State | Scroll speed | Notes |
|---|---|---|
| General waves | 60 px/s | Comfortable forward motion |
| Warden Encounter 1 | 45 px/s | Slight slowdown as intensity rises |
| Warden Encounter 2 | 30 px/s | Noticeably slower, tension building |
| Behemoth Phase 1 | 15 px/s | World beginning to grind |
| Behemoth Phase 2 | 8 px/s | Near crawl |
| Behemoth Phase 3 | 4 px/s | Almost imperceptible. World has nearly stopped. |
| Run end / death | 0 px/s | Freeze on death frame |

Speed transitions lerp over 2 seconds on state change. Not instant.

### Technical spec

- Phaser TileSprite with autoScroll on Y axis
- Single looping tileable texture, vertical repeat
- Drawn first in scene (behind all entities, behind UI)
- Scroll speed stored as a runtime variable, updated on game state change
- No horizontal scroll

### Post-MVP parallax layers (deferred)

Layer stack when parallax lands:
1. Far background (slowest): distant destroyed cityscape
2. Mid background (medium): current destroyed Earth surface
3. Near foreground (fastest): debris, low cloud layer
4. Above player: high cloud wisps

Animated elements (fires, smoke, dynamic destruction) also deferred.

### Art sourcing

Placeholder art acceptable for scaffold and first playable build. Real art required before first public deploy.

**Sourcing order:**
1. Kenney.nl: "Space Shooter Redux" and "Sci-Fi RTS" packs
2. OpenGameArt.org: search "destroyed city tile", "apocalypse ground", "warzone aerial"
3. AI generation: prompt below
4. Commission: last resort

**AI generation prompt:**
Seamless tileable texture, aerial view of destroyed city, dark color palette, rubble and ruined buildings, no sky, top-down perspective, muted oranges and grays, pixel art style, 512x512

**Asset spec:**
- Format: PNG, 512x512px minimum
- Must loop cleanly on Y axis
- Dark enough that player ship, enemies, and bullets remain readable against it
- Avoid strong horizontal lines that look wrong during vertical scroll
