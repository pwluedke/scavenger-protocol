# Scavenger Protocol: Design Document

**Version:** v0.3 working draft
**Owner:** Paul
**Status:** Pre-implementation, design pass 2 complete, scaffold pending

**Changelog:**
- v0.3: Major structural revision. Hybrid campaign model added. Survivor/salvage ship identity formalized. Salvage branch replaces Utility. HUD section added. Art direction sharpened with ZeroRanger coherence standard, Raiden II thematic arc, realism mandate. Crew log system defined. Run Type 2 (base infiltration) defined. Alien tech currency added as meta-progression foundation. Probe branch redesign flagged as open decision. Directional spawn architecture noted.
- v0.2: Added acceleration/deceleration ship movement note to section 3 based on prototype feel observations.
- v0.1: Initial draft.

---

## 1. Pitch

A retrofuturistic vertical shmup where a rebel scavenger pilot survives an alien invasion by salvaging wrecked enemy ships with a tether probe, retrofitting their vessel with alien technology to fight back. The ship was never built for combat. The pilot was never trained for war. Survival is improvisation.

One life, 20-minute runs, roguelite progression within an escalating campaign. Built in Phaser 3 + TypeScript, playable in browser and as a Raspberry Pi kiosk.

### Core identity statement

The player ship is a salvage and utility vessel pressed into combat. It was not designed to fight. The starting weapon is a repurposed utility laser. The probe is a salvage arm. Every upgrade is alien technology bolted on by the ship's automatons in real time. The player wins not through superior firepower but through improvisation, intelligence, and increasingly dangerous salvage operations.

This identity governs every design decision: art direction, upgrade design, narrative tone, enemy framing, and HUD philosophy. When a decision conflicts with this identity, the identity wins.

---

## 2. Core loop (60-second slice)

1. Fly through a scripted alien wave
2. Kill a mid-size enemy, leaving a wreck
3. Fire probe (game enters slow-mo), select wreck as target
4. Probe tethers on contact, player chooses hold duration
5. Recall probe, installation delay begins (variable by node rarity)
6. Crew log fires a dispatch about what was just salvaged
7. Upgrade effect activates, ship visually changes
8. Next wave arrives, loop continues with stronger build

---

## 3. Controls

| Action | PS / Xbox Controller | Keyboard |
|---|---|---|
| Move | Left stick | WASD / arrows |
| Move reticle | Right stick | IJKL |
| Fire | R2 / RT | Space |
| Probe fire / confirm target / recall | Square / X | U |
| Cancel probe target (during slow-mo) | Circle / B | O |
| Dash (Slip Drive node, probe button in IDLE) | Square / X | U |
| Pause | Options / Menu | Esc |
| Reset (prototype only, removed in real game) | View button | R |

Gamepad API handles controller input in both browser and Pi kiosk. No native driver work required.

### Movement rules
- Player vertical movement clamped to bottom 35% of canvas (Weightless node removes this constraint)
- Horizontal edges: wrap. Exit left, reappear right. Loop Drive (see section 4.1)
- Diagonal movement: normalized. Up + right total speed equals up alone.
- Inertia: in-between profile. Acceleration 1600 px/s², deceleration 2400 px/s².

---

## 4. Probe mechanic spec

### Fire sequence
1. Press probe button. Game drops to 20% speed.
2. Targeting cursor appears 60px above ship. Left stick or WASD moves cursor.
3. Valid targets (wrecks, floating pickups) highlight when within 60px snap distance.
4. Confirm with probe button. Probe launches at target. Full speed resumes.
5. Probe tethers on contact or is destroyed en route.

### Target types
- **Floating pickups:** single grab, auto-return, no installation delay
- **Enemy wrecks (mid/large enemies on death):** tether sticks, player controls hold duration, installation delay on return

### Tether duration system (wrecks only)

Pulsing charge ring on probe shows current tier in real time. Color and lineWidth shift at each tier threshold.

| Tier | Duration | Pool | Ring style |
|---|---|---|---|
| Tier 1 | 0 to 1.5s | Common | Cyan (#00CCCC), 2px |
| Tier 2 | 1.5 to 3s | Uncommon | Bright cyan (#00FFFF), 4px |
| Tier 3 | 3s+ | Rare | White-cyan (#CCFFFF), 8px |

Single-frame ring flash on tier transition. Recall by pressing probe button again.

### Installation delay (new)
Node effects do not apply instantly on probe return. The automatons install the salvaged technology in real time.

| Node rarity | Installation duration | Notes |
|---|---|---|
| Common | 1.5 seconds | Player fully active during install |
| Uncommon | 3 seconds | Higher risk window |
| Rare / capstone | 5 seconds | Most dangerous window |

During installation: a progress animation plays on the ship. The crew log fires a dispatch. The node effect activates when installation completes. Ship visually gains the new component on completion.

### Probe rules
- Max 1 probe active at a time
- Probe HP: 3 (takes 3 Husk bullet hits before destruction)
- Probe acts as partial bullet-blocker while extended
- Cooldown on successful return: 3s
- Cooldown if destroyed: 8s
- Probe has no offensive capability at base (Salvager's Kiss capstone adds live-enemy targeting)

### 4.1 Loop Drive (screen wrap justification)
Horizontal wrap is a ship system, not an arcade abstraction. The Loop Drive maintains a high-speed arc at the perimeter of the visible flight area. The screen is a window into a circular patrol path, not the boundary of the world.

On first wrap use: crew log fires once. "Loop Drive engaged. Maintaining patrol arc." Subsequent wraps: same visual (brief streak at exit, appear on other side), no repeat log. The visual uses the same language as the Slip Drive node (Mobility Tier 2), reflecting shared underlying technology.

---

## 5. Enemies and waves

### MVP enemy roster (5 types)

1. **Driftlings** - basic swarm, Megamania-style arc patterns, spawn from top
2. **Hivecasters** - stationary turrets, spread shots, spawn from top
3. **Skimmers** - fast diagonal strafers, spawn from sides (Pincer waves)
4. **Husks** - mid-size tanks, 3 HP, fire aimed bullets, drop probe-worthy wrecks on death
5. **Behemoth** - final boss, multi-phase (see tuning.md)

### Mini-boss
**Warden** - appears twice per run at ~6 min and ~13 min. Escalated tuning on second appearance. Full spec in tuning.md.

### MVP wave patterns (6 scripted)
1. Sine sweep (Driftlings)
2. Pincer (Skimmers from both edges)
3. Turret line (Hivecasters)
4. Husk rush (2-4 Husks, probe opportunity)
5. Mixed pressure (layered types)
6. Boss arrival

### Wave scheduling
Deterministic from run seed. Full wave schedule in tuning.md. All enemy spawns during general waves cease during boss encounters.

### Directional spawn architecture
Wave data files must include a `spawnDirection` field from day one (top, left, right, bottom, behind). MVP uses top and side spawns only. Rear and below spawns are post-MVP. Do not hardcode top-spawn-only assumptions into the wave scheduler.

---

## 6. Progression system

### Structure
Hybrid Vampire Survivors + skill tree. Within each run, the probe offer system provides roguelite variety. Between runs, the campaign layer provides persistent growth.

**Within-run (roguelite layer, resets each run):**
- 5 branches, 4 nodes each at MVP (20 nodes total)
- Probing a wreck offers 3 random eligible nodes from the tether-gated rarity pool
- Player picks 1
- Branch parents must be unlocked before children offer
- All picks lost at run end

**Between-run (campaign layer, persists):**
- Alien tech currency accumulates from wrecks probed across all runs
- Persistent baseline stat improvements (minor, between-run only)
- Intel unlocks: enemy weak point data persists once discovered
- Alien tech currency gates Run Type 2 access

### Branches (MVP)

1. **Offense** - damage, projectile quantity, projectile properties
2. **Defense** - HP, regeneration, reactive damage
3. **Probe** - cooldown, tether HP, snap distance, live-enemy targeting
4. **Mobility** - speed, dash, vertical freedom
5. **Salvage** - wreck visibility, wreck duration, drop rates, tier upgrades

Full node list with stats in tuning.md.

> **Open decision:** Probe branch redesign pending. Ghost Signal / Infiltration mechanic (hacking an enemy to turn it against allies) may replace Wide Scanner as Probe Tier 3. Salvage branch may also be redesigned to accommodate a weak point reveal upgrade. Both discussions must happen before Probe or Salvage nodes are implemented. See docs/ideas.md.

### Rarity pools
- Common: one Tier 1 node from each branch (5 nodes)
- Uncommon: Tier 2 and Tier 3 from each branch (10 nodes)
- Rare: Tier 4 capstones from each branch (5 nodes)

---

## 7. Run structure

### Campaign model (hybrid roguelite)

Scavenger Protocol uses an escalating campaign structure with roguelite elements inside each run. Runs are not identical loops. Each run is a chapter in a campaign that progresses the player toward the alien base.

**Two progression layers operate simultaneously:**

**Roguelite layer (within-run):**
Node picks from the probe offer system. All picks are lost at run end. Provides variety and replayability within each chapter.

**Campaign layer (between-run):**
Persistent baseline improvements and intel unlocks accumulated across runs. Alien tech currency persists and accumulates. The world changes visually and narratively as campaign chapters advance.

### Campaign chapter structure

| Chapter | Thematic setting | Difficulty | New element |
|---|---|---|---|
| Run 1 | High altitude, sparse alien presence | Baseline | All wave types introduced |
| Run 2 | Mid-high altitude, increased activity | +15% enemy HP, +1 spawn rate | Husk Rush waves more frequent |
| Run 3 | Mid altitude, alien construction visible | +30% | Warden gains new attack pattern |
| Run 4 | Low altitude, alien base visible below | +50% | Behemoth Phase 3 intensified |
| Run 5+ | Repeatable farming | Capped at Run 4 difficulty | Same as Run 4, tech accumulation |
| Base run | Inside/adjacent alien base (Run Type 2) | Different design | New level type, unlocked by alien tech currency |

### Run parameters
- Target length: 20 minutes per run
- One life per run, no continues
- Warden encounters at ~6 min and ~13 min
- Behemoth at ~18 min
- Score on run end: enemies killed, wrecks probed, nodes acquired, time survived, alien tech collected
- Every run has a visible seed (daily challenge + reproducibility)

### Between-run moment
After each run, a brief debrief screen. The crew reports on what was salvaged, what has been installed permanently, and what intelligence was gathered. Hades does this in the House of Hades. The equivalent here is a mission debrief with crew log dispatches and a summary of persistent progress made.

---

## 8. Run Type 2: Base Infiltration (post-MVP)

Unlocked when the alien tech currency crosses a threshold earned through the salvage economy across multiple runs. Not time-gated or beat-count-gated. The player earns access by probing aggressively.

### What changes in base infiltration runs
- Background and level art: alien construction site, scaffold-bound enemies, construction machinery
- Wave framing: base defense forces rather than aerial patrol formations
- Environmental hazards: moving construction elements, tunnel sections
- Behemoth: the installation itself or its ground-based power core, not an aerial command ship
- Crew log tone: infiltration tension rather than open combat dispatches

### What stays the same
- All mechanics (probe, upgrades, installation delay, wrap)
- Enemy types (same roster, different context)
- Branch system (same 20 nodes, same offer logic)
- Run length and pacing (20 minutes, same boss cadence)

### Architecture requirement
Wave scheduler, background system, and boss definitions must support a `runType` field from day one even if only Run Type 1 content is scripted at MVP. Retrofitting run type switching later is expensive.

---

## 9. Narrative frame

### Setting
Rebel survivors fighting an alien invasion. Player is a scavenger pilot whose vessel has been pressed into combat. The ship was not built to fight. The probe was designed for salvage operations. Every upgrade is alien technology installed under fire by the ship's automatons.

### Crew log system
The narrative is delivered through ambient text dispatches, not cutscenes or dialog trees.

**Delivery method:** Text appears briefly on screen (ZeroRanger flashing text style) and disappears. Never persistent. No scrolling log panel. Text arrives like a radio dispatch and leaves the same way.

**Timing:** Dispatches fire during the upgrade installation window. The player reads while watching the install animation, then the text is gone.

**Tone:** Not military precision. Improvisation, resourcefulness, dark humor, desperation. The crew knows they are outmatched and is making it up as they go.

**Content sources:**
- Installation reports: "Rask here. Alien tether array partially integrated. Probe HP increased."
- Enemy intelligence: "Husk-class fuel lines run exposed on the lower hull. Worth remembering."
- World dispatches: brief reports from other battles, fragmentary, atmospheric
- Milestone reactions: crew responds to first Warden kill, close calls, high tether tier rewards

**NPC dialogue between runs:** The debrief screen between runs includes crew reactions to that run's events. Influenced by what was probed, what nodes were taken, how long the player survived. Hades-style: the world acknowledges what happened.

### Minimal fixed narrative
- Run start: brief intro card establishing the mission
- Warden arrival: title card ("WARDEN")
- Behemoth arrival: title card ("THE BEHEMOTH")
- Run end: debrief screen with crew dispatches and score summary
- No dialog system, no voiced lines, no cutscenes at MVP

---

## 10. Art direction

### Core principle: coherence over variety
Every visual element must belong to the same vocabulary. When something feels out of place, redesign it rather than adding more elements around it. ZeroRanger is the coherence reference: a player who has never seen the game feels immediately fluent in its visual language.

### Aesthetic brief (three-point)
1. **Tyrian (1995):** Readability under extreme screen busyness. Background layering speed ratios. Ship design language: chunky, utilitarian, built to survive.
2. **Raiden II:** Thematic journey through the background. The level tells you where you are in the story. Simultaneously simple and realistic.
3. **50s pulp sci-fi:** Color palette and poster-art sensibility. Magazine cover energy. Retrofuturistic, not clean-future.

### Realism mandate
Scavenger Protocol is not a cartoon. Every design decision leans toward realistic rather than cartoony. Enemy designs should be alien-weird (Megamania's energy) but grounded in physical logic. Ships look like they were built, not drawn. Damage looks like damage.

### Thematic arc
The visual environment reflects narrative progress. Not arbitrary level variety. A continuous journey:
- Run 1: High altitude, distant ground, sparse alien presence
- Run 2-3: Mid altitude, alien construction visible, increasing density
- Run 4+: Low altitude, alien base visible, maximum pressure
- Base runs: Inside the alien construction itself

Background art changes serve the journey, not aesthetic variety.

### Palette
- Muted pulp base colors (dark earth tones, muted oranges, grays)
- Neon accents reserved for player-meaningful elements only: probe tether (cyan), danger (orange/red), rewards (magenta)
- Background and enemies use the muted palette
- Player always knows what is theirs and what is a threat by color alone

### Ship design
- Base player ship: utilitarian, worn, clearly a salvage vessel not a fighter
- No sharp weapon ports or aggressive silhouette at base
- Ship visually evolves as nodes are installed (sprite layering approach at MVP)
- Each branch adds visible components to specific attachment zones:
  - Offense: weapon hardpoints, barrel extensions (nose zone)
  - Defense: armor plating, shield emitters (hull sides)
  - Probe: tether coil, probe arm housing (forward zone)
  - Mobility: thruster extensions, fin additions (engine zone)
  - Salvage: scanner dish, cargo pod (rear zone)

### Enemy design
- Alien-weird silhouettes, physically grounded
- Weapon ports visually distinct from hull (not a glowing indicator, a structural distinction)
- Enemy hull degrades visually as damage accumulates

### Sprite specs
- Pixel art
- Enemies: ~32x32 base
- Player: 48x48 base
- Hitbox: 16x16 (smaller than visible sprite, Touhou-style core hitbox)

### Asset sourcing order
1. Kenney.nl space shooter packs (free, CC0)
2. OpenGameArt.org
3. AI generation (Midjourney / DALL-E)
4. Commission (last resort)

---

## 11. HUD design

### Philosophy
The HUD competes with the game for attention. Every HUD element that can be removed should be removed. Tyrian's persistent sidebar stat panel is the explicit anti-reference.

### Always visible
| Element | Implementation |
|---|---|
| Player HP | HP dots (3 base, scales with Plating upgrades). Small, top-left corner. |
| Probe cooldown | Subtle ring around ship base, depletes as cooldown runs. Not a separate bar. |
| Reward flash | Brief text on pickup ("Tier 2 reward!"). ZeroRanger flashing text style. Appears and disappears. |
| Crew log dispatches | Same flashing text delivery as reward flash. Brief, then gone. |
| Threat indicators | Directional pulse at screen edge when enemy approaches from off-screen. Minimal. |
| Strong enemy warning | Brief text flash ("WARDEN APPROACHING") using the same text system as the crew log. |

### On pause only
- Current node loadout
- Run timer
- Kill count
- Score
- Alien tech currency total

### On pickup freeze screen only
- Three node offers
- Current branch investment summary

### Never shown
- Persistent score counter during play
- Persistent timer during play
- Any element that takes up screen real estate without active gameplay relevance

---

## 12. Audio direction

- Chiptune + synthwave hybrid
- Sources: freesound.org, OpenGameArt, royalty-free chiptune packs
- SFX priorities: satisfying probe clang on tether connect, punchy pellet shots, meaty wreck explosion, installation assembly sound per rarity tier, crew log text arrival sound (subtle)

### Audio during slow-mo (TARGETING state)
| Channel | Behavior |
|---|---|
| Music | Drop to 50% volume |
| Enemy sounds | Drop to 50% volume |
| Player ship sounds | Drop to 50% volume |
| Reticle and probe sounds | Full volume |
| Optional post-MVP polish | Low-pass filter or short reverb on dampened channels |

---

## 13. Technical architecture

### Stack
- TypeScript + Phaser 3
- Vite build
- Jest (unit)
- Playwright (E2E)

### Layer separation
- **Logic layer (pure TS, no Phaser):** damage calc, probe state machine, progression tree, RNG, wave scheduler, campaign state, alien tech currency
- **Render layer (Phaser):** scenes, sprites, input, audio, UI, camera
- Logic layer is Jest-tested with >80% coverage target
- Render layer driven by logic layer state

### Data architecture requirements
The following fields must exist in data files from day one even if not fully implemented at MVP:

| Field | Location | Purpose |
|---|---|---|
| `runType` | Wave data files | Supports Run Type 1 and Run Type 2 switching |
| `spawnDirection` | Wave data files | Supports directional enemy spawns beyond top-only |
| `lifetimeAlienTech` | Persistence layer | Cross-run alien tech currency |
| `campaignChapter` | Persistence layer | Current chapter in the campaign arc |
| `persistentBaselineStats` | Persistence layer | Between-run stat improvements |
| `intelUnlocked` | Persistence layer | Enemy weak point data discovered across runs |
| `weaponTier` | Enemy data files | Supports future weapon strip and stealable weapon system |

### Deployment
- **Web (MVP):** Vite build, static deploy to scavenger.somanygames.app
- **Pi kiosk (post-MVP):** Chromium kiosk on Pi OS Lite, systemd autostart

### QA infrastructure (portfolio differentiator)
- Jest unit tests on logic modules (>80% coverage)
- Playwright: automated full-run smoke test using seeded determinism
- Simulation harness: headless runner, 10,000+ games, CSV output for balance analysis
- GitHub Actions CI: lint, unit, E2E, simulation summary on every PR
- Release automation: tag triggers auto-build, auto-deploy

---

## 14. MVP scope (Tier 1)

### In scope
- Campaign chapters Run 1 through Run 4 (escalating difficulty and visual progression)
- 5 enemy types, 6 wave patterns, Warden mini-boss x2, Behemoth final boss
- Probe mechanic: slow-mo targeting, tether, rarity-gated offers, destruction, cooldown, installation delay
- 5 branches x 4 nodes = 20 progression nodes
- Within-run roguelite layer (full probe offer system)
- Between-run campaign layer (alien tech currency, persistent baseline stats, chapter progression)
- Loop Drive screen wrap with visual justification
- Crew log ambient narrative system
- Minimal HUD (HP dots, cooldown ring, flashing text)
- Background scroll with graduated speed by game state
- Ship visual evolution via sprite layering
- Seeded runs, daily seed mode
- Web build on scavenger.somanygames.app
- Jest + Playwright + simulation harness
- GitHub Actions CI

### Deferred (post-MVP)
- Run Type 2 (base infiltration)
- Probe branch Ghost Signal / Infiltration mechanic
- Weak point reveal system (Tactical Scanner / Stress Imager)
- Weapon strip mechanic
- Enemy weapon stealable/destructible/incompatible system
- Boarding cutscene
- Tunnel / tight space sections
- Directional spawns beyond top and sides
- Parallax layers beyond single background scroll
- Animated background elements (fires, smoke, construction machinery)
- Capstone cross-branch synergy nodes
- Online leaderboard
- Mobile touch controls
- Pi kiosk distribution image
- Multi-level piercing / Shock Rounds nodes (v1.1)
- Ship unlocks with distinct tree shapes

---

## 15. Risks

1. **Scope creep.** The ideas doc (docs/ideas.md) is large and growing. Every idea in it is post-MVP unless explicitly listed in section 14 in scope. Hold the line.
2. **Campaign layer complexity.** Hybrid campaign adds a persistence layer that pure roguelite didn't need. Design the data architecture carefully before scaffold begins.
3. **Art mismatch.** Free asset packs may not deliver the realism mandate. Lock asset style before committing; adjust direction to match available assets. Do not let cartoony assets ship.
4. **Balance.** 20 nodes across 4 campaign chapters with a between-run layer is harder to balance than a single-run system. Simulation harness must come online early.
5. **Playwright on a real-time game.** Requires deterministic seeds, frame-stepping hooks, headless mode. Design the logic layer for testability from day 1.
6. **Probe branch open decision.** Ghost Signal / Infiltration may replace Wide Scanner. This decision must be made before implementing the Probe branch. Do not implement Wide Scanner as a placeholder.

---

## 16. Open decisions

1. **Probe branch redesign:** Ghost Signal / Infiltration (hacking an enemy to fire on allies) as Probe Tier 3, replacing Wide Scanner. Naming still open (Paul likes "Infiltration" as part of the name). Wide Scanner needs a new home if displaced. Full discussion required before implementation.
2. **Salvage branch redesign:** Weak point reveal upgrade (Tactical Scanner / Stress Imager) may displace existing Salvage nodes. Discuss alongside Probe branch redesign.
3. **Persistent baseline stats:** Exact stats that improve between campaign chapters need to be defined. Small HP buff? Speed buff? What persists and by how much?
4. **Intel persistence:** How is enemy weak point knowledge stored and displayed between runs?
5. **Between-run debrief screen:** Full design of the crew debrief / run summary screen.
6. **Alien tech currency threshold:** How much alien tech unlocks Run Type 2?

---

## 17. Next steps

1. Resolve open decisions 1 and 2 (Probe and Salvage branch redesign) with Vega before any branch implementation
2. Draft and commit this design doc as v0.3 via PR
3. Begin Vite + Phaser + TypeScript scaffold spec with Vega
4. Scaffold PR via Gloom (Issue under Epic #23)
5. First implementation issues: player ship, input layer, background scroll, probe state machine (in that order)
6. Probe and Salvage branch nodes implemented only after open decisions 1 and 2 are resolved
