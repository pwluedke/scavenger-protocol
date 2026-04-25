# Scavenger Protocol: Design Document

Version: v0.2 working draft | Owner: Paul | Status: Pre-implementation, design pass 1 complete

Changelog:
- v0.2 (after probe-feel prototype verdict): added acceleration/deceleration ship movement note to section 3 based on prototype feel observations.

## 1. Pitch

A retrofuturistic vertical shmup where a rebel pilot salvages wrecked alien ships with a tether probe to power up their own ship. One life, 20-minute runs, roguelite progression. Built in Phaser 3 + TypeScript, playable in browser and as a Raspberry Pi kiosk.

## 2. Core loop (60-second slice)

1. Fly up through a scripted alien wave
2. Kill a mid-size enemy, leaving a wreck
3. Fire probe (game enters slow-mo), select wreck as target
4. Probe tethers on contact, player chooses hold duration
5. Recall probe, receive progression offering (1 of 3 from rarity-gated pool)
6. Pick a node to upgrade ship
7. Next wave arrives, loop continues with stronger build

## 3. Controls

| Action | PS / Xbox Controller | Keyboard |
|---|---|---|
| Move | Left stick | WASD / arrows |
| Fire | R2 / RT | Space / J |
| Probe fire, confirm target, recall | Square / X | E |
| Cancel probe target (during slow-mo) | Circle / B | Q |
| Pause | Options / Menu | Esc |

Gamepad API handles controller input in both browser and Pi kiosk. No native driver work required.

Player vertical movement is clamped to the bottom third of the canvas.

Ship movement uses acceleration and deceleration curves rather than instant input response. Specific tuning TBD during design pass 2.

## 4. Probe mechanic spec

### Fire sequence

1. Press probe button. Game drops to 20% speed.
2. Targeting cursor appears near ship. Left stick moves cursor. Valid targets highlight.
3. Confirm with probe button. Probe launches at target.
4. Full speed resumes.
5. Probe tethers on contact (or is destroyed en route).

### Target types

- Powerup pickups (floating items): single grab, auto-return
- Enemy wrecks (mid/large enemies on death): tether sticks, player controls hold duration

### Tether duration system (wrecks only)

Pulsing charge ring on probe shows current tier in real time.

- Tier 1 (0 to 1.5s): common pool, 1 offer, pick 1 of 3
- Tier 2 (1.5 to 3s): uncommon pool, 1 offer, pick 1 of 3
- Tier 3 (3s+): rare pool, 1 offer, pick 1 of 3

Recall by pressing probe button again.

### Probe rules

- Max 1 probe active at a time
- Probe is destructible (3 HP while extended)
- Probe acts as partial bullet-blocker for player while extended
- Cooldown on successful return: 3s
- Cooldown if destroyed: 8s
- Probe has no offensive capability

## 5. Enemies and waves

### MVP enemy roster (5 types)

1. Driftlings - basic swarm, Megamania-style arc patterns
2. Hivecasters - stationary turrets, spread shots
3. Skimmers - fast diagonal strafers
4. Husks - mid-size tanks, drop probe-worthy wrecks
5. Behemoth - stage 1 boss, multi-phase

### MVP wave patterns (6 scripted)

1. Sine sweep (Driftlings)
2. Pincer (Skimmers from both edges)
3. Turret line (Hivecasters, dodge static fire)
4. Husk rush (3 Husks, probe opportunity)
5. Mixed pressure (layered types)
6. Boss arrival

### Wave scheduling

Deterministic from run seed. Waves timed on a 20-minute arc with difficulty ramp and rest beats.

## 6. Progression system

### Structure

Hybrid Vampire Survivors + skill tree:

- 5 branches, 4 nodes each at MVP (20 nodes total)
- Probing a wreck offers 3 random eligible nodes from the tether-gated rarity pool
- Player picks 1
- Branch parents must be unlocked before children offer
- Capstones (post-MVP) require nodes across multiple branches

### Branches (MVP)

1. Offense - damage, fire rate, weapon variants
2. Defense - shield, armor, damage reduction
3. Probe - cooldown, tether HP, grab range
4. Mobility - speed, dodge, emergency burst
5. Utility - currency gain, XP gain, screen-clear bombs

Specific nodes and stats defined in design pass 2 (docs/tuning.md).

### Capstone examples (post-MVP)

- Harpoon Drive (Offense 3 + Probe 2): probe deals damage on hit
- Arc Shield (Defense 2 + Probe 2): probe extends a shield field while tethered
- Overclock (Mobility 3 + Utility 2): kills reduce probe cooldown

## 7. Run structure

- Target length: 20 minutes
- 3 stages, each ~6-7 minutes
- Mini-boss at ~6 min, ~13 min; final boss ~20 min
- One life per run, no continues
- Score on death: enemies killed, wrecks probed, nodes earned, time survived
- Every run has a visible seed (daily challenge + reproducibility)

## 8. Meta-progression (post-MVP)

Explicitly out of MVP scope. Planned for v1.1:

- Alien tech discoveries: probing specific wreck types unlocks permanent new nodes in the tree
- Ship unlocks: alternate starter ships with distinct tree shapes and weapons
- Cosmetic unlocks
- Daily challenge leaderboard

## 9. Narrative frame

Rebel survivors fighting an alien invasion. Player is a scavenger pilot retrofitting their ship with salvaged alien tech. Minimal storytelling: intro card, boss intro cards, ending card. No dialog system.

## 10. Art direction

- Retrofuturistic retro-pulpy: 50s sci-fi magazine covers meet 80s arcade cabinets
- Palette: muted pulp base colors with neon accents (orange, teal, magenta)
- Sprite style: pixel art, ~32x32 base for enemies, 48x48 for player
- Source: Kenney.nl space shooter packs (free)
- Render resolution: 480x270 base, integer-scaled to window size

## 11. Audio direction

- Chiptune + synthwave hybrid
- Sources: freesound.org, OpenGameArt, royalty-free chiptune packs
- SFX priorities: satisfying probe clang on connect, punchy pellet shots, meaty wreck explosion

## 12. Technical architecture

### Stack

- TypeScript + Phaser 3
- Vite build
- Jest (unit)
- Playwright (E2E)

### Layer separation

- Logic layer (pure TS, no Phaser): damage calc, probe state machine, progression tree, RNG, wave scheduler
- Render layer (Phaser): scenes, sprites, input, audio, UI, camera
- Logic layer is Jest-tested with >80% coverage target
- Render layer driven by logic layer state

### Deployment

- Web (MVP): Vite build, static deploy to scavenger.somanygames.app
- Pi kiosk (post-MVP): Chromium kiosk on Pi OS Lite, systemd autostart, PS/Xbox controller via Bluetooth, optional pre-baked SD image for distribution

### QA infrastructure (portfolio differentiator)

- Jest unit tests on logic modules (>80% coverage)
- Playwright: automated full-run smoke test using seeded determinism
- Simulation harness: headless runner that plays 10,000 games with randomized builds, exports CSV of win rates / node usage / death causes for balance analysis
- GitHub Actions CI: lint, unit, E2E, simulation summary on every PR
- Release automation: tag triggers auto-build, auto-deploy web, auto-publish Pi binary

## 13. MVP scope (Tier 1)

### In scope

- 1 biome (deep space)
- 5 enemy types, 6 wave patterns, 1 stage boss
- Probe mechanic: slow-mo targeting, tether, rarity-gated offers, destruction, cooldown
- 5 branches x 4 nodes = 20 progression nodes
- Seeded runs, daily seed mode
- Web build on scavenger.somanygames.app
- Jest + Playwright + simulation harness
- GitHub Actions CI

### Deferred (post-MVP)

- Meta-progression (alien tech unlocks, ship variants)
- Capstone synergies
- Multiple biomes or stages beyond stage 1
- Online leaderboard
- Mobile touch controls
- Pi kiosk distribution image

## 14. Risks

1. Scope creep. Vampire Survivors was a full team over years. Hold the MVP line. Post-MVP features stay post-MVP.
2. Probe feel. Slow-mo targeting can frustrate if sluggish or imprecise. Validate with a standalone feel prototype before committing to full progression system.
3. Art mismatch. Free asset packs may not deliver retrofuturistic vibe. Lock asset style before committing to art direction; adjust direction to match available assets.
4. Balance. Small tree limits replayability; large tree grows a balancing tail. Simulation harness must come online early, not late.
5. Playwright on a real-time game. Hard without deterministic seeds, frame-stepping hooks, and a headless mode. Design the logic layer for testability from day 1.

## 15. Open decisions

1. Per-node stats and effects for all 20 MVP nodes (design pass 2).
2. Behemoth boss mechanics and phases (design pass 2).
3. Weapon baseline. Single forward shot at start, or something more distinctive? (Design pass 2.)

## 16. Next steps

1. Build probe-feel prototype (see docs/prototypes/probe-feel-prototype-spec.md)
2. Paul plays and delivers go/no-go verdict
3. If go: design pass 2 (populate docs/tuning.md)
4. If no-go: redesign probe mechanic, update this doc to v0.2
