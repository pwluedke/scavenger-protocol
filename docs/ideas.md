# Scavenger Protocol: Ideas Parking Lot

Running log of ideas surfaced during design and build sessions. Each entry includes the raw idea, initial Vega reaction, and a status tag.

Status tags:
- HOLD: good idea, not yet evaluated for scope fit
- MVP CANDIDATE: worth considering for MVP if feasible
- POST-MVP: confirmed deferred
- REJECTED: evaluated and dismissed, reason noted
- NEEDS DISCUSSION: requires more back-and-forth before tagging

---

## Entry 001: Altitude zoom and run type variation

**Source:** Paul, design pass 2 session
**Raw idea:**
Two related concepts:
1. Run starts "high" with everything small (high altitude). As each mini-boss is defeated, the background tile zooms in to feel closer to Earth.
2. Sometimes the run goes upward into space toward the alien mothership (Behemoth = space boss). Sometimes the invasion has already landed and you're fighting at ground level (Behemoth = ground base). Different background art sets, different narrative framing, same mechanics.

**Vega initial thoughts:**
The altitude zoom is a strong visual storytelling mechanic. It means the player literally watches the stakes get closer as the run progresses. Each mini-boss kill would trigger a zoom transition, turning a mechanical milestone into a narrative one. Pairs naturally with parallax layers: as you zoom in, layer speeds would need to adjust to maintain the altitude illusion.

The run type variation is a meta-progression unlock idea: you start with the "going up" run type, unlock the "already landed" run type after enough runs or a specific meta unlock. Two background art sets, two Behemoth presentations, same underlying mechanical structure. Adds replayability without redesigning the game.

Both ideas compound well together: zoom mechanic works for both run types, just in opposite visual directions (zooming toward alien mothership exterior vs zooming toward ground base detail).

**Status:** POST-MVP

---

## Entry 002: Tyrian (1995) as aesthetic reference

**Source:** Paul, design pass 2 session
**Raw idea:**
Tyrian's aesthetic, ship design, and background layering are worth studying as a reference for Scavenger Protocol.

**Vega initial thoughts:**
Tyrian is one of the most readable shmups ever made. Its relevance to Scavenger Protocol:
- Background layering: 3 to 4 parallax layers at calibrated speed ratios. Direct reference for our deferred parallax work.
- Ground tile design: dark palettes that keep ships readable. Destroyed Earth tile should follow the same readability rule.
- Ship design language: chunky, utilitarian, built-to-survive. Matches the scavenger/rebel framing.
- Enemy silhouette hierarchy: shape communicates threat level instantly. Matches our Grunt/Skimmer/Husk/Warden/Behemoth scale.
- HUD: minimal, never obscures play field.

Three-point aesthetic brief for Scavenger Protocol: Tyrian (readability/layering), Megamania (alien-weird enemy energy), 50s pulp sci-fi (color palette and poster-art sensibility). Nova Drift added later for tonal seriousness and upgrade tree depth.

**Status:** HOLD (active reference, not an action item)

---

## Entry 003: AI-driven narrative fed by pickups

**Source:** Paul, away session
**Raw idea:**
Each pickup/upgrade you grab feeds flavor into an ongoing AI-driven story. Narrative happens inside the ship: automatons incorporating new alien tech, crew reports, dispatches from other battles on Earth. Story evolves based on what you actually pick up during a run.

**Vega initial thoughts:**
This is the most distinctive narrative idea in the project so far and it has real teeth. A few angles worth developing:

The "automatons installing alien tech" framing is perfect for the probe mechanic. You're not just grabbing a powerup, you're sending your probe out to salvage something and the ship's crew immediately starts incorporating it. The narrative makes the mechanic make sense in-world.

The AI-driven part maps directly to Paul's portfolio angle. An Anthropic API call per major pickup that generates a 2 to 3 sentence "crew report" based on what was just salvaged? That's a live demo of AI integration in a game, not just a checkbox. Hiring managers would notice that immediately.

Mechanically it also rewards build diversity. A player who always takes Offense nodes gets a different story than one who goes deep Salvage. Replayability through narrative, not just mechanics.

The "reports from Earth about other battles" layer adds worldbuilding without requiring cutscenes or dialog systems. Text-only, shown as a brief overlay. Low implementation cost, high atmosphere return.

**Status:** HOLD - strong idea, needs scoping. MVP candidate for a lightweight version (pre-written flavor text per node). Full AI-driven version is post-MVP but worth designing toward from the start so the hooks are in place.

---

## Entry 004: Shmup mechanics worth evaluating for Scavenger Protocol

**Source:** Vega, unprompted
**Raw idea:**
Running list of mechanics from other shmups that have thematic or mechanical fit with Scavenger Protocol.

**R-Type: Force Pod (direct ancestor of our probe)**
The Force Pod attaches to your ship or detaches to sit on the screen blocking bullets. Our probe is spiritually descended from this. Main lesson: the Force Pod was most satisfying when it had multiple functions (bullet absorb, fire amplifier, shield). Our probe already does this (grab, block, Salvager's Kiss). Good.

**Ikaruga: polarity switching**
Not a fit for Scavenger Protocol directly, but the underlying idea (a single button that changes your relationship to incoming damage) is worth keeping in mind for a future node idea. A "Phase Cloak" node that makes you absorb one bullet type could be interesting post-MVP.

**Jamestown: charge shot with area clear**
Holding fire builds a charge, releasing clears a small area. Could work as a Salvo variant or a future Offense node. Worth revisiting whether a charge mechanic belongs somewhere in the Offense branch post-MVP.

**Caves of Qud / Hades: run narrative that references your build**
Not shmups but the narrative-references-mechanics pattern is relevant. The key technical insight: the narrative engine only needs to know a few facts (branch investments, last pickup, time survived) to generate plausible flavor. It doesn't need full game state.

**Darius: zone-based stage selection**
After each boss, choose which zone to enter next from a branching map. Not MVP scope but fits the run-type variation idea from Entry 001.

**Nex Machina: enemy density as difficulty expression**
NOTE: top-down twin-stick, NOT a shmup. Player is a person on the ground. Still worth noting as a principle: when balancing feels off, try density before speed.

**ZeroRanger: minimal UI, maximum atmosphere**
ZeroRanger has almost no HUD. The game FEELS serious because of what it removes. Scavenger Protocol's HUD should be interrogated against this principle: what can be communicated through the ship itself rather than a number on screen?

**Status:** HOLD - reference list, individual items to be evaluated as issues when relevant

---

## Entry 005: Installation delay on probe return

**Source:** Paul, away session
**Raw idea:**
When the probe returns with a pickup, there should be a visible delay while the alien tech is being installed on the ship before the upgrade takes effect. Connects to the automatons narrative.

**Vega initial thoughts:**
Small mechanic, large narrative payoff. The probe returns, the crew goes to work, and for a beat the player is slightly more vulnerable while the installation completes.

The offer screen itself is fine to show immediately on return. The player makes their choice, then watches it get installed. This keeps the decision moment fast while making the application feel earned.

The ambient log entry fires during the installation window, not after. "Rask is integrating the wide-angle scanner array. Should improve targeting range." Then 2 seconds later the effect applies. Three-beat payoff instead of one.

If the player probes a wreck in a busy moment, they choose their node, then have to survive the installation window while potentially under fire. That's meaningful. It makes the probe return a commitment, not just a free reward.

**Status:** MVP CANDIDATE - low implementation cost, high narrative and mechanical payoff.

---

## Entry 006: Visual ship evolution and variable installation time by rarity

**Source:** Paul, away session
**Raw idea:**
The ship should visually change as upgrades are installed. More powerful upgrades should take longer to install, adding risk proportional to reward.

**Vega initial thoughts:**

**Variable installation time by rarity:**
- Common node (Tier 1 tether): 1.5 second install
- Uncommon node (Tier 2 tether): 3 second install
- Rare/capstone node (Tier 3 tether): 5 second install

This compounds with the tether duration risk model. To get a rare node you held the tether for 3+ seconds (risky). Then you pick the rare node and have to survive a 5-second installation (also risky). The reward is proportionally harder to cash in.

**Visual ship evolution:**
Each branch adds visible components to the ship sprite:
- Offense nodes: weapon hardpoints, barrel extensions (nose zone)
- Defense nodes: armor plating, shield emitters (hull sides)
- Probe nodes: tether coil, probe arm housing (forward zone)
- Mobility nodes: thruster extensions, fin additions (engine zone)
- Salvage nodes: scanner dish, cargo pod (rear zone)

By the end of a run, a heavily upgraded ship looks meaningfully different from a fresh one. Two players who built differently have visibly different ships. The ship IS the build, not just a stat sheet.

**Implementation approach:**
Sprite layering at MVP: base ship sprite plus overlay sprites per upgrade slot. Each node adds or swaps one overlay. Procedural assembly is post-MVP.

**Status:** MVP CANDIDATE (sprite layering approach). Procedural assembly POST-MVP.

---

## Entry 007: Shmup watchlist for reference research

**Source:** Vega, unprompted

**Priority watches:**
- Mushihimesama: enemy density and screen readability. Love the design quality and variety. Too cartoony but the character design is exceptional. Same variety of enemies, attack patterns, weaponry. Tunnel/fortress wall mechanic observed.
- Einhander: probe mechanic ancestor. Love the 3D way ships come in from behind/around. Love the weapon replacement visuals. Enemies entering from below or the side is definitely something to do. Too cartoony but the weapon change mechanic is worth considering.
- ZeroRanger: HUD minimalism and atmosphere. NOW THE PRIMARY AESTHETIC REFERENCE. See Entry 017 for full notes.
- Darius Gaiden: weak point / probe window design. Enemies flashing when hit is good.
- Gradius V boss rush: phase transition model. This is absolutely the feel wanted for boss battles. Boss fights should feel different from wave sections - deliberate and goal-oriented rather than frantic.
- Dead Cells / Hades: run-end screen design. Love the idea of a run summary screen, especially if it affects NPC dialogue in subsequent runs.

**Background layering + art direction:**
- Tyrian 2000: background layers good even if cartoony. Want more minimalist and realistic. Like the modular boss design. Level themes too incoherent - prefer cohesive thematic progression toward the invasion core.
- Raiden II: layering and level progression thematically representing a journey is exactly right. Backgrounds are wonderfully simultaneously simple and realistic.
- DoDonPachi: ship color palette readable against background. Keep the "survivor in a ship not made for combat" identity.

**Ship evolution + upgrade systems:**
- Gradius V: love the power scaling feel.
- R-Type Final 2: beautiful. Force Pod docking worth studying.

**Status:** HOLD - active reference list

---

## Entry 008: Probe weapon strip mechanic

**Source:** Paul, away session
**Raw idea:**
Probe hits an enemy ship and instead of or in addition to damaging it, the probe quickly retracts and rips the enemy's weapons off. Disarms the enemy.

**Vega initial thoughts:**
The core fantasy is "I just stole their ability to hurt me" which is distinct from "I just dealt damage."

Two interpretations:
- **Interpretation A (disarm only):** probe tethers briefly, retracts fast, enemy loses its weapon for the rest of its life. Still alive, still a collision threat, but no longer a bullet threat.
- **Interpretation B (weapon as pickup):** stripped weapon becomes a floating pickup. This is the Einhander mechanic almost exactly.

Both could stack: disable, loot, upgrade. Three-beat sequence that mirrors the Scavenger Protocol loop in miniature.

The three-tier probe model (strip, hack, kill) gives the probe three distinct uses on live enemies by tether duration:
1. Under 0.5s: strip weapon, enemy lives disarmed
2. 0.5s to 1.5s: hack/Infiltration, enemy fires on ally
3. 1.5s+: Salvager's Kiss damage, enemy becomes wreck

**Status:** MVP CANDIDATE (Interpretation A, disarm only). Weapon-as-pickup POST-MVP.

---

## Entry 009: Stealable vs destructible vs incompatible weapons - learned through play

**Source:** Paul, away session
**Raw idea:**
Rather than visual indicators, the player learns through play which enemy weapons can be stripped, which are destroyed on strip attempt, and which are incompatible with the current ship state/upgrades.

**Vega initial thoughts:**
The complexity concern is real but the source matters. Arbitrary complexity (memorize a lookup table) is bad. Legible complexity (outcomes follow a discoverable rule) is good.

**Proposed legible rule:**
Outcome depends on enemy weapon tier relative to player's current Offense branch depth:
- No Offense nodes: most weapons incompatible
- Offense Tier 1 (Pellet Drive): Grunt-class strippable, Husk-class destroyed
- Offense Tier 2 (Twin Shot): Husk-class strippable, Warden-class destroyed
- Offense Tier 3+ (Piercing Rounds): Warden-class strippable

This makes Offense branch do double duty: upgrades your weapons AND expands what you can strip.

The "incompatible" outcome: probe bounces back with no cooldown penalty. Player learns this enemy type is beyond current capability.

**Status:** POST-MVP but ARCHITECT FOR IT. Enemy weapon type field in data files from day one.

---

## Entry 010: Infiltration - probe hit causes enemy to fire on nearest ally

**Source:** Paul, away session
**Raw idea:**
When a ship gets hit with a probe (mid-tether duration), it immediately starts firing on the closest enemy ship. Working names: Hostile Takeover, Infiltration, Ghost Signal.

**Vega initial thoughts:**
This became Probe Tier 3 (Infiltration) in the locked branch redesign. See Entry 029.

Mid-tether window: 0.5s to 1.5s. Single burst on nearest ally, then returns to normal. Single burst (not timed takeover) for MVP.

Visual: brief cyan tether residue glow on hacked ship after probe retracts.

Paul likes "Infiltration" as the name. "Ghost Signal" is in contention. Final name landed on Infiltration.

**Status:** LOCKED as Probe Tier 3. Timed takeover version POST-MVP.

---

## Entry 011: Weak point system - dynamic, upgrade-gated, realism-grounded

**Source:** Paul, away session
**Raw idea:**
Weak points exist on enemies but are not highlighted by default. A specific upgrade reveals them. Weak point locations are not fixed or cartoonish - they emerge from accumulated damage, random structural variance, or ship-model design flaws. Lean into realism over arcade signposting.

**Vega initial thoughts:**
Three weak point sources:
1. **Accumulated damage:** hit the same area repeatedly, that zone becomes brittle. 2x damage on subsequent hits.
2. **Random structural variance per spawn:** each enemy instance rolls slight variance at spawn. Prevents memorization.
3. **Class-specific design flaws:** Husk-class fuel lines exposed on lower hull. Hivecaster emitter cores unshielded on back face. Consistent within a class.

The reveal upgrade (Integrity Survey, Salvage Tier 3) is the MVP-feasible version: reveals class-specific design flaws on enemy classes the player has probed in prior runs. No zone tracking at MVP. Intel persists in `intelUnlocked` field.

Realism visual language: no glowing yellow spots. Subtle structural indicators - a different panel color, a visible seam, an exposed component that reads as structurally distinct.

**Status:** POST-MVP (full system with zone tracking). Lightweight version (class design flaws only) LOCKED as Integrity Survey, Salvage Tier 3.

---

## Entry 012: Boarding enemy ships - Starfield-inspired

**Source:** Paul, away session
**Raw idea:**
Boarding an enemy ship, inspired by Starfield's boarding mechanic. Even as just a cutscene. Acknowledged as potentially out of scope but noted as one of Paul's favorite mechanics and something never seen in shmups.

**Vega initial thoughts:**
Three interpretations:
- **Version A (cutscene, lightest):** after a sufficiently large enemy is killed with a Salvager's Kiss probe kill, a 10 to 15 second cutscene plays. Automatons breach the hull, retrieve something specific, extract. Guaranteed rare node reward. This is the realistic first implementation.
- **Version B (mini-game, medium):** after a Warden or Behemoth kill, brief 10-second sequence where you navigate a single corridor. Returns to shmup immediately. v1.1 or v1.2 territory.
- **Version C (full boarding):** out of scope for foreseeable future.

The probe is the scout. The automatons are the boarding party. The story writes itself.

Base infiltration runs (Entry 023) ARE the boarding fantasy at scale. The entire Run Type 2 takes place inside/around the alien installation.

**Status:** POST-MVP. Version A is the realistic target. Design the boss death sequence from the start with a boarding cutscene slot in mind.

---

## Entry 013: Nova Drift as inspiration reference

**Source:** Paul, away session
**Raw idea:**
Add Nova Drift to the inspirations list. Described as bleak and "drifty" but with an amazing upgrade system.

**Vega initial thoughts:**
Nova Drift was actually the first reference cited in the initial design conversations when evaluating progression models. Its branching upgrade tree with mutually exclusive paths was a direct influence on the five-branch structure.

Key lessons:
- **Upgrade tree as identity commitment:** deep investment in one branch produces a fundamentally different ship feel.
- **Emergent synergies:** the interesting builds come from unexpected interactions between adjacent branches.
- **"Drifty" physics:** momentum-based movement is the "too far in this direction" reference if our tuning ever feels too floaty.
- **Tonal seriousness:** dark, sparse, no cartoon enemies. The tone matches the existential weight of choices.

**Status:** HOLD - active reference. Aesthetic brief now: Tyrian (readability), Megamania (alien-weird enemies), 50s pulp sci-fi (palette), Nova Drift (tonal seriousness, upgrade depth), ZeroRanger (coherence, minimalism).

---

## Entry 014: Screen wrap needs visual justification (Loop Drive)

**Source:** Paul, away session
**Raw idea:**
The horizontal screen wrap mechanic needs an in-world visual explanation. A ship just teleporting to the other side of the screen breaks immersion.

**Vega initial thoughts:**
**Recommendation: Loop Drive.** The ship literally loops around the visible area at high speed. The screen is a window into a circular flight path. On first wrap: crew log fires once, "Loop Drive engaged, maintaining patrol arc." Brief streak visual at edge, ship reappears on other side. Subsequent wraps: same visual, no repeat log.

Uses the same visual language as the Slip Drive node (Mobility Tier 2), suggesting related technologies. Base ship has passive Loop Drive for screen wrapping. Slip Drive node enhances that technology into an active dash with i-frames.

**Status:** MVP CANDIDATE. Visual treatment low implementation cost. Naming locked as Loop Drive.

---

## Entry 015: Tunnel and fortress wall mechanic - tight space navigation

**Source:** Paul, watchlist notes (Mushihimesama)
**Raw idea:**
Tunnel or fortress wall sections where you have to fly through tight spaces.

**Vega initial thoughts:**
Strong level design tool: natural pacing breaks, tests Mobility branch investments, choke points for enemy placement. Connects to alien base construction narrative (scaffold enemies from Entry 017).

Screen wrap disabled in tunnel sections. Weightless node (Mobility Tier 3) gives more vertical room in tunnels - meaningful advantage for Mobility builds.

**Status:** POST-MVP. Level design tool for v1.1. Architecture should not preclude it.

---

## Entry 016: Enemies entering from behind, below, and sides

**Source:** Paul, watchlist notes (Einhander)
**Raw idea:**
Love the 3D feel of enemies coming in from behind and around the ship. Enemies entering from below or the side is definitely something to incorporate.

**Vega initial thoughts:**
Significant expansion of the threat model. Requires indicator system (ZeroRanger does this well per Entry 017). Directional spawn data needs to be in wave definition files from day one even if only top-spawn waves are scripted at MVP. Retrofitting is expensive.

**Status:** MVP CANDIDATE for side spawns (Pincer waves already imply this). Rear and below spawns POST-MVP but ARCHITECT FOR IT in wave data files.

---

## Entry 017: ZeroRanger design observations - now primary aesthetic reference

**Source:** Paul, watchlist notes
**Raw ideas:**
- Minimal HUD: details only on pause or in pickup selection freeze menu
- Tutorial fantastic. Intro animations fantastic.
- Clean minimalist look - "I've never played this game but it feels like I have." This is the coherence signal.
- Indicators when enemies are coming from behind
- Warning indicator when a strong enemy is approaching (flashing text, then gone)
- Flashing text flying across screen adds to chaotic feel, then immediately disappears - THIS IS THE CREW LOG DELIVERY MECHANISM
- Enemies bound to/moving on scaffolds or rails
- Construction machinery for building a massive alien base
- Use of only a few colors - element separation is effortless
- Background extremely interactive
- Game feels very coherent in style, feel, and theme - this is the DESIGN NORTH STAR

**Vega initial thoughts:**
ZeroRanger is now the single most important aesthetic reference for Scavenger Protocol.

The flashing text delivery confirms the crew log implementation: text appears, makes its statement, vanishes. No persistent log panel. Text arrives and leaves like a radio dispatch.

The scaffold/rail enemies and construction machinery connect to the alien base narrative. The player fights through the CONSTRUCTION of the invasion, not just the invasion itself.

Few colors / element separation: neon accents reserved for player-meaningful elements only (probe tether: cyan, danger: orange/red, rewards: magenta). Background and enemies use the muted palette.

**Status:** Multiple MVP items. HUD redesign confirmed (see Entry 026).

---

## Entry 018: Cohesive thematic level progression

**Source:** Paul, watchlist notes (Tyrian and Raiden II)
**Raw idea:**
Tyrian's incoherent level themes are wrong for this game. Prefer runs that slowly increment in feel as the player gets closer to the invasion core. Raiden II's thematic journey approach is correct.

**Vega initial thoughts:**
This is a design principle, not a feature. Governs all level design decisions.

Proposed thematic arc for a single run:
- Minutes 0 to 6: High altitude, sparse alien presence
- Minutes 6 to 13: Mid altitude, alien construction visible
- Minutes 13 to 18: Low altitude, alien base visible below
- Minutes 18 to 20: The Behemoth itself

Every visual change serves the journey. Not arbitrary theme switching.

**Status:** DESIGN PRINCIPLE - governs all level design decisions.

---

## Entry 019: Ship readability through attachments and glow

**Source:** Paul, watchlist notes (Mushihimesama)
**Raw idea:**
When the screen gets busy, player ship readability is maintained by something around the ship: a shield, wings, attachments, or glow.

**Vega initial thoughts:**
Connects to Entry 006 (visual ship evolution). Attachments accumulate as nodes are installed, serving double duty: express build identity AND make the ship readable. A Probe-heavy build has a subtle cyan glow that intensifies. Ship communicates its own build identity through light.

**Status:** HOLD - reinforces existing decisions. Ensure base sprite has high contrast against background palette.

---

## Entry 020: The "survivor ship not made for combat" identity

**Source:** Paul, watchlist notes (DoDonPachi)
**Raw idea:**
Keep the idea of being a survivor in a ship that wasn't necessarily made for combat but has the means to salvage, infiltrate, and upgrade to survive.

**Vega initial thoughts:**
This is the single most important narrative/aesthetic principle in the doc. Now written into design-doc.md section 1 (Pitch).

The player ship is NOT a fighter. It's a salvage/utility vessel pressed into combat and adapting in real time:
- Base ship sprite: utilitarian, worn, no sharp weapon ports
- Starting weapon: repurposed utility laser
- Each upgrade: alien tech bolted on in real time
- Crew log tone: improvisation, resourcefulness, desperation, dark humor
- Probe: designed for salvage, combat applications discovered during invasion

The alien enemies WERE designed for combat. The player is always outmatched on paper. Winning is about cleverness, salvage, and adaptation.

**Status:** DESIGN PRINCIPLE - written into design-doc.md.

---

## Entry 021: Enemy weapon stealability obvious from appearance

**Source:** Paul, watchlist notes (Einhander)
**Raw idea:**
In Einhander, which weapons are stealable is obvious from the appearance of each enemy.

**Vega initial thoughts:**
The weapon is visually distinct on the enemy hull, clearly a separate component, clearly detachable. No tutorial or indicator needed.

For Scavenger Protocol: enemy weapon ports should be visually distinct from the hull. Not a glowing indicator, but a clearly separate component that looks like it could be removed. Design flaw weak points from Entry 011 follow the same principle.

**Status:** HOLD - reinforces Entries 009 and 011. Informs art direction for enemy design.

---

## Entry 022: Gradius V boss design - deliberate vs frantic

**Source:** Paul, watchlist notes
**Raw idea:**
Gradius V boss battles feel completely different from the rest of the shmup. Precise movements and controlled fire to accomplish specific goals. Wants to lean into this design.

**Vega initial thoughts:**
This validates the Warden and Behemoth design in tuning.md. The design principle: during boss fights, the player shifts from reactive (surviving wave chaos) to deliberate (executing a plan against a specific entity). The probe windows on vents are "goals to accomplish" in exactly the Gradius V sense.

Phase transitions as dramatic beats, not stat changes. The boss changes strategy in response to you.

**Status:** HOLD - validates existing boss design. Pacing principle: bosses are deliberate, waves are frantic.

---

## Entry 023: Two distinct run types - airborne and base infiltration

**Source:** Paul, away session
**Raw idea:**
First few runs are airborne battles. After beating those runs and accumulating enough alien tech, the player gains access to enemy base runs.

**Vega initial thoughts:**
Resolves and combines Entries 001, 012, 015, 017, 018 into a coherent structure.

**Run Type 1 (Airborne, MVP):** Flying above destroyed Earth, alien wave formations, aerial bosses. Background descends toward the invasion as mini-boss kills trigger visual progression.

**Run Type 2 (Base Infiltration, post-MVP):** Inside or adjacent to the alien construction. Scaffold-bound enemies, construction machinery hazards, tunnel sections, ground-based Behemoth.

What changes: background/art, wave framing, environmental hazards, boss identity, crew log tone.
What stays: all mechanics, enemy types, branch system, run length.

Architecture requirements: wave scheduler, background system, and boss definitions must support a runType field from day one.

**Status:** Run Type 1 MVP. Run Type 2 POST-MVP but ARCHITECT FOR IT.

---

## Entry 024: HUD minimalism - ZeroRanger standard

**Source:** Paul, away session
**Raw idea:**
The more minimal the HUD the better. Details only on pause or pickup selection screen.

**Note:** Superseded by Entry 026. HP dots stay (Paul confirmed). Enemy damage states are for enemies, not the player ship. See Entry 026 for final HUD spec.

**Status:** See Entry 026.

---

## Entry 025: Alien base under construction as narrative framing

**Source:** Paul + ZeroRanger watchlist
**Raw idea:**
The alien invasion isn't complete. The base is being built. Construction machinery, scaffold-bound enemies.

**Vega initial thoughts:**
The aliens aren't a finished army. They're mid-construction. The player is a disruption operation against an enemy that's still vulnerable because it isn't finished yet.

For Run Type 1: construction visible in background. Waves are construction defense forces. Warden is a site security vessel. Behemoth is the power core being transported into position.

For Run Type 2: construction IS the level. Alien workers (new enemy type?) are less militarized than security forces.

**Status:** POST-MVP narrative direction. Informs art direction for both run types from day one.

---

## Entry 026: HUD final spec - HP dots, no sidebar

**Source:** Paul, away session
**Raw idea:**
HP dots (circles) stay. What to avoid is the Tyrian 2000 sidebar stat display. Enemy ship damage states are for enemies, not the player ship.

**Vega initial thoughts (final HUD spec):**

**Always visible:**
- HP dots (3 base, scales with Plating upgrades) - small, top corner
- Probe cooldown ring around ship base (subtle, not a separate bar)
- Reward flash text (brief, then gone)
- Directional threat indicators at screen edges

**On pause only:** node loadout, run timer, kill count, score, alien tech currency total

**On pickup freeze screen only:** three node offers, branch investment summary

**Never shown:** persistent score, persistent timer, sidebar stats of any kind

**Enemy damage states:** enemies visually degrade (Husks crack, Warden lists, Behemoth color shifts through phases). World-level feedback, not HUD-level.

**Status:** MVP. Final spec.

---

## Entry 027: Run Type 2 meta-progression gate - alien tech economy

**Source:** Paul, away session
**Decision:** Run Type 2 unlocked by alien tech currency, not beat count.

**Vega initial thoughts:**
Economy-gated means probe-heavy Salvage builds unlock the base faster than pure Offense builds. The gate responds to playstyle. Narratively: you couldn't approach the base without the intelligence gathered from airborne runs.

Alien tech currency is also the foundation for all other meta-progression (ship unlocks, new tree nodes, cosmetics). Design it once, use it for everything.

The `lifetimeAlienTech` field must exist in the persistence data layer from day one even if nothing reads it yet in MVP.

**Status:** POST-MVP but DESIGN THE CURRENCY ARCHITECTURE NOW.

---

## Entry 028: Run structure decision - hybrid campaign locked

**Source:** Paul, away session
**Decision:** Option A - escalating campaign with roguelite elements inside each run.

**Vega initial thoughts:**
Two layers of progression:

**Within-run (roguelite layer, resets each run):** node picks, probe offers, tether tiers. All lost at run end. Provides variety.

**Between-run (campaign layer, persists):** alien tech currency, persistent baseline stat bumps, intel unlocks. Provides growth.

Campaign chapter structure:
| Run | Setting | Difficulty |
|---|---|---|
| Run 1 | High altitude, sparse | Baseline |
| Run 2 | Mid-high altitude | +15% HP, +1 spawn |
| Run 3 | Mid altitude, construction visible | +30% |
| Run 4 | Low altitude, base visible | +50% |
| Run 5+ | Farming mode | Capped at Run 4 |
| Base run | Run Type 2 content | Different design |

**Status:** LOCKED as core structural decision. Written into design-doc.md v0.3.

---

## Entry 029: Probe branch redesign - LOCKED

**Source:** Vega + Paul design session

| Tier | Name | Effect |
|---|---|---|
| 1 | Reinforced Tether | +1 probe HP (3 → 4) |
| 2 | Quick Recall | Return cooldown -33% (3000ms → 2000ms) |
| 3 | Infiltration | Mid-tether (0.5s to 1.5s) on live enemy: hacked enemy fires once on nearest ally |
| 4 | Salvager's Kiss | Long tether (1.5s+) on live enemy: damages and kills, becomes wreck mid-tether |

Wide Scanner dropped. Base snap distance (60px)ys unless playtesting demands otherwise.
Timed takeover (Version B) deferred to post-MVP.

**Status:** LOCKED - tuning.md updated.

---

## Entry 030: Salvage branch redesign - LOCKED

**Source:** Vega + Paul design session

| Tier | Name | Effect |
|---|---|---|
| 1 | Scrap Sense | Wrecks glow for 2s after spawning |
| 2 | Extended Haul | Wreck expiry 10000ms → 18000ms |
| 3 | Integrity Survey | Reveals class-specific design flaw weak points on known enemy classes. 1.5x damage on weak point hits. Requires prior run probe intel on that class. |
| 4 | Deep Salvage | Tier 1 and 2 probe returns upgraded one tier |

Opportunist dropped. Integrity Survey is the name (avoided "Tactical Scanner" connotation of discovering hidden ships).

New cross-branch synergy: Integrity Survey + Infiltration (Salvage 3 + Probe 3): hacked enemy targets ally weak points with its burst fire.

**Status:** LOCKED - tuning.md updated.

---

## Entry 031: Intel persistence system

**Source:** Paul + Vega design session
**Raw idea:**ntel earned across runs persists. Knowledge compounds. Four distinct upgrade types from one system.

| Intel category | Upgrade type | What changes |
|---|---|---|
| Enemy structural (Integrity Survey) | Mechanical | Damage multiplier on weak points |
| Boss phase intel | Mechanical | Combat timing (longer telegraph windows) |
| Probe window intel | Informational | Timing visibility (pre-glow 1s before vent opens) |
| Enemy spawn intel | Narrative | Crew dispatches only, no mechanical change |
| Alien tech intel | Stat | Class-specific combat bonuses |

**Locked for MVP:** Enemy structural intel (Integrity Survey node)
**Locked for v1.1:** Boss phase, probe window, enemy spawn (narrative), alien tech stat bonuses

**The compounding knowledge principle:**
Unlock enough narrative upgrades, a threshold triggers a new story branch. Different base entry point, same end goal, earned through knowledge not grinding.

**Portfolio note:** The Anthropic API call generating crew dispatches has richer context as intel accumulates. Run 10 dispatches are fundamentally different from Run 1. AI isn't generating generic flavor text. It's generating knowledge-aware narrative.

**Status:** Enemy structural intel MVP. All others v1.1+. Story branching POST-v1.1. Design all data structures to support it from day one.

---

## Entry 032: Game/campaign naming - "Protocol"

**Source:** Paul + Vega design session

**Decision:** Full campaign arc is called a "Protocol."
- Start screen: "Continue Protocol" / "New Protocol"
- Crew log intro: "Protocol initiated."
- In-world framing: the rebel organization runs Scavenger Protocol as their operational framework. Each full campaign arc is one Protocol execution.

**What "New Protocol" resets:** chapter, alien tech currency, intel, persistent baseline stats.
**What never resets (post-MVP):** permanently unlocked ships, unlocked node variants, cosmetics.

**Status:** LOCKED.

---

## Entry 033: Lore development - deferred to post-MVP

**Source:** Paul, design session
**Decision:** Deferred. MVP uses filler/placeholder dialogue.

**Placeholder approach:**
- "Rask here. Tether array integrated. Probe HP increased."
- "Unknown salvage component installed. Weapon output up."
- "Structural analysis complete. Hull reinforcement applied."

These can be swapped for real lore in v1.1 without any code changes.

**Status:** POST-MVP. Flag when ready to start world-building session with Vega.

---

## Entry 034: Watchlist research - additional observations

**Source:** Paul, extended watchlist session

**Nex Machina correction:** Top-down twin-stick, NOT a shmup. Player is a person on the ground, not a ship. Lower priority reference than originally listed.

**Einhander weapon arm clarification:** No player-controlled arm. The mechanic is flying over a dropped weapon to collect it and use it. The relevant design lesson: which enemies have stealable weapons is obvious from their appearance without any tutorial. See Entry 021.

**ZeroRanger confirmed as primary reference.** See Entry 017.

**Gradius V confirmed as boss design reference.** Boss battles should feel like solving a puzzle against a specific entity, not surviving a swarm. See Entry 022.

**Status:** HOLD - reference consolidation.

---

## Combat / Firing

### Tap-to-fire override on top of hold-to-fire

Current behavior: fire rate gated by a single timer. Hold and tap both produce the same fixed cadence.

Proposed behavior: hold-to-fire stays as the minimum cadence. Individual button taps fire immediately on press, even if faster than the hold cadence. Each tap resets the hold timer.

Rationale: rewards player input speed. Matches classic arcade shmup feel (Galaga, R-Type). Adds a skill expression layer without changing the base game balance for casual players.

Implementation hook: input.ts already does justPressed edge detection on the fire action, so the tap path is cheap to add. The hold path stays untouched.

Status: parking lot. Not MVP.
