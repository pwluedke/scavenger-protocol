Scavenger Protocol: Build Journal
A chronological narrative of the design and build process. Distinct from the design doc (what the game is), tuning doc (numbers), and diary (session work log). This is the story of how the project came to exist: decisions made, options rejected, rationale preserved.
Portable to Google Docs at any time via copy-paste.

Entry 01: Kickoff and concept shaping
Date range: April 2026, pre-implementation
Personas involved: Paul (design lead), Vega (strategy)
Artifacts produced: design doc v0.1, CLAUDE.md, probe-feel prototype spec
Starting point
Paul came in with a loose idea: build a retro video game that runs on a Raspberry Pi 4, start from a Megamania-style fixed shooter, and use a wireless PS-style controller. The request was deliberately open-ended: "what are my options for an OS and engine, and what could be built that would easily port to a web browser?"
OS and engine evaluation
Evaluated Pi OS (Lite vs full desktop), DietPi, RetroPie/Batocera. Landed on Pi OS full for development, Pi OS Lite for the final kiosk experience. RetroPie was dismissed as a category mismatch (emulator frontend, not a dev environment).
Evaluated engines ranked by fit for Paul's stack and goals:

Phaser 3 + TypeScript: chosen
PICO-8 / TIC-80: rejected (new language, aesthetic lock-in)
Godot 4: deferred for the future Hood project, overkill for this
LÖVE 2D: rejected (web port is rough)
Pygame: rejected (pygbag is janky)

Why Phaser won: Paul already writes TypeScript daily. The web IS the primary target, and Pi kiosk becomes a Chromium window pointed at the same build. Gamepad API handles controller input in both contexts with no native work. Same toolchain as Session Zero means zero new tooling to learn.
Concept evolution
The concept shifted meaningfully through conversation:

Started as: Megamania clone
Became: vertical scrolling shmup with Megamania-style scripted waves
Signature mechanic added: tether probe that salvages wrecks
Progression model added: hybrid Vampire Survivors + skill tree

The Megamania-to-vertical-scroll pivot came when Paul recognized 1942 as a better structural reference while keeping the Megamania "weird alien beings" aesthetic. This is the version that stuck.
The probe mechanic
The probe is the project's signature design element and got the most iteration. Key design decisions, in order:

Tether vs fire-and-return: tether, for tactical depth
Offensive capability: none, it is purely a salvage arm
Destructible: yes, with 3 HP while extended and a cooldown penalty on destruction
Slow-mo targeting phase: added to let the player pick targets without twitch pressure
Tether duration tiers: 0 to 1.5s = common pool, 1.5 to 3s = uncommon, 3s+ = rare
Reward model: single-select from 3 offerings in the tier-gated pool (rejected a multi-select model that would have broken shmup pacing)
Bullet-blocking: yes, while extended, absorbs up to 3 hits

Progression model
Evaluated three structures:

Branching skill tree (Nova Drift model)
Synergy slots (Vampire Survivors model)
Ship loadouts (Jamestown model)

Paul initially leaned Vampire Survivors for its replayability, then asked about a skill tree with skill points. Vega pushed back: the two are not the same thing and mixing them poorly muddies the design. The resolution was a hybrid:
Final model: a skill tree structure (5 branches, 4 to 6 nodes each) with Vampire Survivors-style random offerings. On level-up, the player is offered 3 random eligible nodes drawn from the rarity pool the tether duration unlocked. Tree structure gives designer legibility and balance; random offerings give the run-to-run variance that makes the game replayable.
Portfolio framing
Paul is pursuing QA leadership and AI-integrated QA roles. The project is explicitly a portfolio piece, so Vega pushed several additions that leverage his QA/release manager background:

Seeded determinism for reproducible runs (enables Playwright full-run smoke tests)
Logic/render layer separation (enables Jest unit tests on pure TS)
Simulation harness that runs the logic layer headless in batches of thousands for balance analysis
GitHub Actions CI with lint, unit, E2E, and simulation summary on every PR
Release automation mirroring Session Zero's patterns

These moves are the project's differentiator. Any solo dev can ship a Phaser game; very few ship one with a simulation harness and a test suite that plays the game.
Scope
Three tiers were evaluated:

MVP (3 to 4 weekends): 1 biome, 5 enemy types, 6 wave patterns, 1 boss, full probe mechanic, 20 progression nodes, seeded runs, web deploy
Vertical slice (2 to 3 months): adds meta-progression, more biomes, Playwright and simulation harness
Full game (6+ months): explicitly rejected as the starting target (this is where portfolio projects die)

Paul committed to Tier 1 as the shipping target.
Meta-progression
Deferred to post-MVP explicitly. Paul had a strong idea (alien tech discoveries unlocking permanent new tree nodes across runs) but accepted the decision to keep it out of MVP. This was the single most important scope discipline moment so far.
Working title
Evaluated 13 title options across three buckets:

Probe-forward (mechanic-driven)
Alien-weird (tone-driven)
Retro-pulpy (aesthetic-driven)

Working title locked: Scavenger Protocol. Sounds like a real indie Steam title, evokes the rebel-survivor framing, portfolio-legible. Not boxed in if the design shifts.
Repo and infrastructure
Decisions made:

Separate repo from Session Zero (different project, different audience, different release cadence)
Copy-and-adapt CLAUDE.md and slash commands from Session Zero (graduate to a shared conventions repo later if duplication becomes painful)
Subdomain hosting (scavenger.somanygames.app) over subpath, via Cloudflare Pages or Netlify
MIT license, public repo, Node .gitignore template

AI workflow
Two-persona model ported from Session Zero:

Vega in claude.ai: strategy, planning, design iteration, decision review. Named after the star, fits Paul's astronomy interest and the retrofuturistic tone.
Gloom in Cursor with Claude Code: implementation. Same as Session Zero.
All implementation work starts with a plan reviewed by Vega before Gloom executes.

Probe-feel prototype
Vega pushed for a throwaway prototype before any real scaffolding. The reasoning: if the probe mechanic doesn't feel good, nothing else in the project matters, and discovering that after building the logic-layer testing harness would be expensive. The prototype is deliberately:

Plain Canvas 2D, no Phaser
Single file, no tests, no determinism, no architecture
Built outside the real repo in a scratch directory
Archived into docs/prototypes/probe-feel/ afterward, not reused
Success-criteria-driven: 7 yes/no questions Paul answers after 15 minutes of play

Decisions still open at end of this entry

Probe tier reward UI details (resolved: single-select 1-of-3, confirmed)
Per-node stats and effects for all 20 MVP nodes (design pass 2, after prototype validates)
Behemoth boss mechanics and phases (design pass 2)
Weapon baseline (design pass 2)
Prototype go/no-go verdict (pending Paul's playtest)

Next step
Gloom builds the probe-feel prototype per spec. Paul plays 15 minutes. Verdict logged. If go, design pass 2 begins. If no-go, probe mechanic redesign.

--

Entry 02: Scaffolding, conventions, and the journal itself
Date range: April 2026, same day as Entry 01
Personas involved: Paul (design lead), Vega (strategy), Gloom (implementation, briefly)
Artifacts produced: scavenger-protocol repo on GitHub, CLAUDE.md v1, adapted test-failure-analysis prompt, build-journal.md, decision to scope /journal out of the slash command library
Context
Entry 01 ended with the probe-feel prototype spec in hand and a decision to play-test before scaffolding the real project. Entry 02 covers the parallel work of setting up the repo and conventions so the project has a real home, even though code does not get written until the prototype validates.
Decisions made
Repo scaffolding basics (GitHub create screen):

Public repository, to serve the portfolio goal
Description reframed from the repo name echo to a real one-line pitch
Node .gitignore template included at creation time
MIT license, chosen for compatibility with Kenney.nl CC0 assets and to signal open-source comfort to hiring managers
README toggled on as a placeholder, to be overwritten in the scaffold PR

CLAUDE.md adapted from Session Zero:

Kept the four Core Principles verbatim (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution)
Added a fifth principle, "Determinism is Non-Negotiable," promoted to first-class status because the entire test strategy (Playwright full-run replay, simulation harness) depends on it
Rewrote the Architecture section around logic/render layer separation, seeded RNG, explicit injected time, and a single input-mapping layer
Codified the tuning-values-in-data-files rule so balance changes become reviewable PRs instead of scattered hunts
Added an explicit "AI Personas" section defining Vega and Gloom roles so the workflow is self-documenting
Stripped Session Zero specifics (Migration State, Demo mode, Session lifecycle, Player IDs, Modal pattern)
Preserved Paul's communication norms verbatim (no em dashes, no emojis, direct, concise, no unearned praise)

Test failure analysis prompt, forked to v2.0:

Rescoped from Playwright-only to cover Jest, Playwright, and the simulation harness
Added determinism-aware diagnostic guidance so the analyzer can flag Math.random or Date.now violations
Replaced Session Zero example input and output with a Scavenger Protocol probe-state-machine example
Kept the v1.1 bold-heading fix that prevents extractPrompt from stopping early

Build journal established:

Lives at docs/build-journal.md in the repo
Narrative, chronological, decision-focused, options-rejected included
Portable to Google Docs via copy-paste at any time
Cadence: Vega proactively offers to draft an entry when a meaningful chunk of work wraps

Cursor explorer view cleanup:

Diagnosed the compact-folders behavior that made the new repo's .claude/rules render differently from Session Zero's
Set explorer.compactFolders: false in user settings to normalize across all projects

Options rejected
Shared conventions repo (right now): Paul and Vega discussed extracting CLAUDE.md, slash commands, and the prompt library into a separate ai-conventions meta-repo shared between Session Zero and Scavenger Protocol. Rejected for now. The copy-and-adapt approach is simpler today, and graduation to a shared repo is cheap later if duplication becomes painful. Revisit if the same principle ends up edited in both CLAUDE.md files more than twice.
Subpath hosting under somanygames.app: considered and rejected in favor of a subdomain (scavenger.somanygames.app). Subpath would have coupled the game's deploy to Session Zero's Railway deploy and burdened Railway with serving static assets it does not need to serve. Subdomain gives independent release cycles and keeps the Session Zero infra focused.
Separate slash command per test tool (Jest, Playwright, sim harness): considered for the failure analysis prompt. Rejected in favor of a single generic prompt that infers the tool from the output format. Less maintenance, same diagnostic quality.
/journal as a Gloom-invoked slash command: Gloom drafted a thoughtful plan and implemented the command. On first invocation with an empty chat, Paul noticed the command was asking Vega for context Gloom did not have. This surfaced a real design flaw: Gloom lives in Cursor and cannot see claude.ai conversations, which is where the strategic decisions the journal captures actually happen. Three reconciliation options were considered (Vega-only command, context-transfer ritual, summary-expansion flow). The Vega-only option won.
What got deferred

Vite + Phaser + TypeScript scaffold spec: pending the probe-feel prototype verdict, same as Entry 01
Design pass 2 (per-node stats, boss phases, weapon baseline): pending prototype verdict
Graduating to a shared conventions repo: revisit if copy-and-adapt drift becomes painful

Open at end of entry

Probe-feel prototype has not been built or played yet. This is the gating decision for everything downstream.
Slash command library for Scavenger Protocol is partial. Paul still needs to copy the remaining commands (/plan, /implement, /issue, /review, /diary, /reflect, /start, /compact) from Session Zero and adapt them if needed.
Prompt library directory (/prompts/) still needs to be ported from Session Zero.
docs/diary.md still needs to be created as an empty file to start the implementation diary.

--

## Entry 03: Prototype build, verdict, and external validation

**Date range:** April 2026, multi-session arc following Entry 02
**Personas involved:** Paul (design lead, playtester), Vega (strategy), Gloom (implementation)
**Artifacts produced:** prototypes/probe-feel/ (full Canvas 2D prototype), 9 closed issues, /merged slash command, gamepad logging parity, prototype verdict notes, design-doc.md v0.2

### Context

Entry 02 ended with the conventions scaffolding committed and the probe-feel prototype spec defined but unbuilt. Entry 03 covers the actual build of the prototype, the iterative issue-by-issue progression, real Xbox controller integration, the verdict playtest, and the first external validation signal from a senior developer.

### Decisions made

**Issue execution sequence.** The prototype broke into five sequential issues (#4 through #8), with two corrective issues inserted mid-flight (#10 gamepad input, #15 gamepad logging parity) and a workflow tooling issue (#11 /merged slash command) interleaved between them. Total: 9 closed issues for the prototype epic and adjacent infrastructure.

**Workflow tools built before they were needed.** Two infrastructure improvements landed during the prototype work rather than after: the /merged slash command (post-PR-merge local sync automation) and the test-failure-analysis fork to v2.0. Both compounded across every subsequent issue, validating the decision to build them mid-stream rather than defer.

**State factory pattern for resets.** Issue #5 introduced a createState() factory function that returns a fresh game state object. Both initial game start and R-key resets call the same factory. This eliminated partial-reset bugs before they could exist and set the architectural pattern for every subsequent issue. The pattern survived through the probe state machine work in Issue #7 without modification.

**Per-grunt sine age vs shared timestamp.** Each Grunt enemy carries its own age counter that drives its sine-wave horizontal motion, rather than all Grunts sharing a global timestamp. This gives each enemy independent phase, producing the chaotic Megamania-style visual density rather than rigid lockstep formations. Verified visually correct on first run.

**Wreck ownership transfer model.** When the probe enters TETHERED state, the target wreck is moved out of the global state.wrecks array into probe.targetWreck. This avoids index invalidation, makes wreck expiry checks cleanly scoped, and lets drawProbe handle the tethered wreck visualization directly. Cleaner than maintaining cross-references between collections.

**Reticle stays at full speed during slow-mo.** All other game entities slow to 0.2x speed during TARGETING state. The reticle does not. This matches the design intent of slow-mo as a "thinking time" rather than a "everything slower including your input" mechanic. Validated by the playtest: the targeting phase felt useful, not sluggish.

**Probe button is accept-or-cancel based on context.** Original spec had E (probe button) be a no-op when no target was highlighted in TARGETING state. Vega flagged this as a trap state and suggested making E a context-sensitive accept-or-cancel: with target, launches; without target, cancels. Implemented and felt better in playtest than the original spec.

### Options rejected

**Mapping unused controller inputs.** After Xbox controller integration landed, Paul asked whether to map the remaining buttons (D-pad, bumpers, right stick, A, Y, etc.). Vega pushed back: speculative work violates Simplicity First, future input needs are not yet known, and the prototype is throwaway. Decision: only map what the spec needs (movement, fire, probe, cancel, pause, plus the View button reset added mid-Issue #5). Other inputs stay unmapped until the real project's input layer demands them.

**Plan-mode CLAUDE.md rule.** Mid-stream, Paul expressed frustration with manual mode toggling between Plan Mode and Accept Edits in Cursor. Vega initially proposed adding a CLAUDE.md rule that would behaviorally enforce plan-mode for the /plan command regardless of UI mode. After more issues completed, the friction turned out to be theoretical, not real. The Cursor default-mode setting alone was enough. Decision reversed and the rule was not added. This is a documented case of "speculative engineering against friction we hadn't actually measured."

**Hard 15-minute formal verdict playtest.** Issue #8 originally specified a structured 15-minute playtest session with the 7 success criteria evaluated immediately afterward. Paul instead ran 20+ runs across multiple sessions and brought in a second tester (his son), then surfaced the verdict informally. Vega flagged this as a process deviation and asked Paul to confirm a clean evaluation of the 7 criteria before declaring GO. After verification, the informal extended playtest was treated as equivalent or stronger than the formal session. Process variation documented in the verdict notes.

### Surprises

**The prototype felt fun before the probe was even in.** After Issue #6 (enemies and enemy bullets), Paul reported audibly laughing during testing, before any probe mechanic was implemented. This was an unexpected positive signal. Vega flagged the risk of "fun is not verdict" but the data was real: the underlying shmup loop was already engaging on its own merits.

**Gamepad logging gap surfaced post-merge.** Issue #10 (gamepad API support) merged with one-time detection logging but no per-input logs. Keyboard had per-keypress logs from Issue #4. The gap surfaced when Paul tried to verify gamepad input was actually flowing and saw nothing in the console after the initial detection. A small corrective issue (#15) added gamepad logging parity. Paul noted this was a clean example of "spec was incomplete, verification gap surfaced during real use, tracked as a small corrective issue rather than worked around."

**Verification quality compounds.** By Issue #7 (probe state machine), the verification step was 15 numbered checks across state transitions, slow-mo scope, tier ring visual clarity, bullet blocking, and controller parity. Quality of plans, ACs, and verification grew across issues without any explicit instruction. Gloom builds project context and produces tighter plans over time when the workflow stays consistent.

### What got deferred

- **Mapping remaining controller inputs:** until the real project's input layer demands them
- **Floating pickup probe targets:** the spec made these optional; the prototype validated wreck-only targeting cleanly without them
- **Ship movement inertia:** noted from playtest as a needed addition, but added to design-doc.md v0.2 for design pass 2 rather than retrofitted into the throwaway prototype

### Verdict

GO.

Paul ran 20+ runs across multiple solo sessions and a second tester (his son) ran extended sessions independently. All 7 success criteria answered YES. The probe mechanic, slow-mo targeting, tether duration tier system, bullet blocking, and cooldown all felt right within tweaks expected during real implementation. One observation flowed forward to the design doc: ship movement needs acceleration and deceleration curves rather than the prototype's instant-on, instant-off responsiveness.

The prototype is archived in prototypes/probe-feel/ and does not flow into src/. Its job is done.

### External validation

A senior developer reviewed the project structure (not just the playable prototype but the repo, journal, ADRs, slash commands, and process discipline) and called it portfolio material on its own merits, citing the AI orchestration story as the differentiator rather than the game itself. Paul noted this carefully and committed to not promoting publicly until at least the scaffold and Issue 1 of the real game are deployed, to avoid undercutting the compounding narrative.

### Open at end of entry

1. Epic #2 (Probe Mechanic Prototype) needs to be closed on GitHub
2. A new epic for the real game scaffold and design pass 2 work needs to be created
3. Design pass 2 (per-node stats, boss phases, weapon baseline, ship inertia tuning) needs to happen here in chat with Vega before Gloom touches src/
4. docs/tuning.md needs to be filled in completely as the deliverable from design pass 2
5. Vite + Phaser + TypeScript scaffold spec needs to be drafted, then issued, planned, and implemented under the new epic

### Next step

Paul closes Epic #2 manually on GitHub. Vega writes a /issue prompt for Gloom to create the new epic. Then design pass 2 begins in this chat with Vega.

--

## Entry 04: Full scaffold built and deployed in one day

**Date range:** April 25-26, 2026 (one day after Entry 03)
**Personas involved:** Paul (engineering lead), Vega (strategy), Gloom (implementation)
**Artifacts produced:** Vite + Phaser 3.90 project, seeded RNG module, input mapping layer, game loop and scene shell, GitHub Actions CI pipeline, Netlify deploy at scavenger.somanygames.app

### Context

Entry 03 ended with the probe-feel prototype verdict locked as GO and the design pass 2 complete. Entry 04 covers the scaffold build the following day: seven sequential issues executed, producing a live URL with a working Phaser game instance, full CI pipeline, and branch protection.

### What was built

Seven issues executed in strict sequence, each depending on the previous:

**Issue A: Vite + Phaser 3 scaffold**
Initialized the project with Vite vanilla TypeScript, Phaser 3.90.0 pinned explicitly (npm latest resolves to Phaser 4, which Gloom caught and flagged before implementing), 1280x720 canvas with FIT scaling, and a BootScene stub. First dev server run produced a black canvas with Phaser's startup banner confirming the correct version.

**Issue B: Directory structure and logic/render separation**
22 stub files across 5 directories enforcing the architecture from day one. Every file in `src/logic/` got the mandatory comment: "NO Phaser imports. NO DOM. NO Math.random(). NO Date.now(). Deterministic given inputs." Verification included a grep confirming no Phaser imports or Math.random calls in the logic layer.

**Issue C: Seeded RNG module**
Custom xorshift128+ implementation chosen over seedrandom library for full auditability. String seeds hashed via djb2 with four salts. Jest configured with ts-jest in ESM mode. 14 tests covering determinism (1000-call sequence comparison), distribution, edge cases, and clone independence. This module is the foundation of all deterministic behavior downstream.

**Issue D: Input mapping layer**
Single source of truth for all player input. Keyboard and Gamepad API both produce identical LogicalActions. Last-input-wins switching between sources. Diagonal normalization. jsdom per-file test environment for faithful DOM event simulation. Gloom independently identified and correctly resolved the DASH enum question: E always emits probe: true from the input layer; game logic decides whether that means probe or dash based on game state. Logic layer context does not bleed into the input layer.

**Issue E: Game loop and scene shell**
Five scenes wired up: BootScene transitions to MenuScene, MenuScene shows "SCAVENGER PROTOCOL" and "Press any key to begin Protocol," GameScene has effectiveDelta slow-mo support and setSlowMo() method ready for the probe state machine. Gamepad detection in MenuScene uses direct navigator.getGamepads() polling rather than the Phaser gamepad plugin, keeping config minimal.

**Issue F: GitHub Actions CI pipeline**
Five jobs: lint, typecheck, unit, e2e, build. ESLint flat config with typescript-eslint. Playwright smoke test with Page Object Model. Jest coverage threshold at 80% on src/logic/. Branch protection ruleset configured in GitHub with all five checks required before merge. Two corrective issues required: missing ESLint rules (no-explicit-any warn, no-console off) caught by /review Pass 1, and jest.config.ts requiring ts-node in CI caught by the first CI run. Both resolved cleanly. The /review command's Pass 1 blocking behavior justified itself on the first real use.

**Issue G: Netlify deploy**
Pure static site, independent from Session Zero's Railway infrastructure. netlify.toml in repo root, Netlify reads it automatically on connection with no dashboard configuration needed. DNS setup via Porkbun: TXT record for subdomain ownership verification, CNAME record pointing scavenger to the Netlify-assigned subdomain. SSL provisioned automatically via Let's Encrypt after DNS verification. Total time from Netlify account connection to live HTTPS URL: under 30 minutes.

### Decisions made

**1280x720 over 480x270 for render resolution.**
Original design doc specified 480x270 (classic pixel art resolution). Changed during scaffold planning after Paul pushed back: the realism mandate from the watchlist session conflicts with a resolution that forces chunky visible pixels. 1280x720 allows both clean high-resolution rendering and deliberate blocky pixel art sprites scaled up on the canvas. The resolution and the art style are independent decisions.

**Custom xorshift128+ over seedrandom library.**
The RNG module is load-bearing for the entire project (seeded runs, Playwright replay, simulation harness). Having every line auditable outweighs the convenience of an external dependency. Zero supply chain surface on the most critical module.

**ts-jest ESM mode over babel-jest.**
Type-checked tests are non-negotiable given strict TypeScript everywhere. The experimental-vm-modules flag has been stable since Node 18. Fewer dependencies than the babel alternative.

**Netlify over Railway for static hosting.**
Session Zero runs on Railway with a Node server. Scavenger Protocol has no backend. Independent static deploy on Netlify means independent release cycles, free tier, and PR preview deployments. Separation of concerns between the two projects.

**CNAME over ALIAS for subdomain DNS.**
The root domain ALIAS gotcha (documented in Session Zero's decisions) does not apply to subdomains. CNAME is correct for scavenger.somanygames.app. Filed as a Known Gotcha in CLAUDE.md.

### Process observations

**The /review command earned its keep immediately.**
Issue F's first /review returned CHANGES REQUESTED on Pass 1: two ESLint rules explicitly in the AC were missing from the implementation. The PR was clean on every other dimension. Without Pass 1 blocking merge, those rules would have silently landed without the no-explicit-any warning or the no-console disable. The blocking behavior is correct behavior.

**CI caught a real environment bug.**
jest.config.ts requiring ts-node works locally because ts-node happens to be installed globally on Paul's machine. CI is a clean environment. The failure on the first CI run caught an invisible local/CI environment mismatch that would have blocked every future PR. Resolved by converting jest.config.ts to jest.config.js, no new dependencies.

**Gloom's plan quality continued to compound.**
By Issue D, Gloom was independently identifying and correctly resolving architectural questions (DASH enum, jsdom vs dependency injection) that weren't in the original spec. The context built across sequential issues produces better plans than any single-issue engagement.

**76 hours from first conversation to live URL.**
This conversation started April 23 at 5:00 PM. The live HTTPS URL at scavenger.somanygames.app was confirmed working April 26 at approximately 9:45 PM. In that window: concept design, probe prototype build and verdict, two-AI workflow established, full scaffold with CI, branch protection, seeded RNG, input mapping, game loop, and auto-deploy on every merge. 76 hours from "I want to build a game" to a deployed, tested, production-ready foundation at a real domain.

### What got deferred

- Playwright full-run smoke test with seeded determinism (deferred until GameScene has real game logic)
- Simulation harness (deferred until logic layer modules are implemented)
- Pi kiosk deployment (post-MVP)
- PR preview deploy verification (will be tested organically on the next gameplay PR)

### Open at end of entry

1. design-doc.md v0.3 PR still needs to be created and merged (design doc on disk is still v0.2; v0.3 was drafted by Vega but not yet committed via Gloom)
2. tuning.md is committed but reflects the original branch design; Probe and Salvage branch redesigns from the recent design session need a tuning.md update PR
3. Ideas parking lot (docs/ideas.md) has not been created in the repo yet; the document exists in Vega's session but has not been committed

### Next step

Player ship implementation: movement with inertia, horizontal wrap with Loop Drive visual, shooting. First real logic layer code in src/logic/. Validates the logic/render separation pattern that all subsequent gameplay issues follow.

---

## Entry 06: Salvage loop ships, layer depth becomes foundation, latent gaps surface

**Date range:** Two 4-hour sessions across consecutive evenings, late April 2026
**Personas involved:** Paul (engineering lead, playtester), Vega (strategy), Gloom (implementation)
**Artifacts produced:** Husks + wreck salvage system, layer system with ground stains and debris flashes, game clock architecture, GameOver wiring, per-run state reset, Driftling spawn variance tuning, background scroll tuning, Netlify Auto Publishing Lock workflow, /issue command preservation rules, six post-MVP parking lot entries

### Context

Entry 04 ended with the scaffold deployed at scavenger.somanygames.app and the player ship implementation queued. The arc between Entry 04 and this entry covered player ship, bullets, probe state machine, Driftlings, collision detection - that work belongs to the (still unwritten) Entry 05.

This entry covers two consecutive evening sessions, eight hours of focused work, that shipped the wreck salvage system, promoted visual depth into a gameplay foundation, and surfaced three latent architectural gaps that had been hiding in plain sight.

The one-line summary: the wreck salvage system shipped, the layer system promoted visual depth into gameplay foundation, and three latent architectural gaps surfaced and were closed in a single multi-PR session.

### What was built

Multiple PRs across the two evenings, in roughly this order:

- **Husks + wrecks (#75/76):** Second enemy type, wreck objects with drifting/falling phases, real probe-tether salvage replacing the hardcoded rewardTier
- **Wreck phase rename (#77):** "settled" became "drifting"
- **Background scroll + wreck velocity fixes (#78/79):** Bug fixes surfaced by relative motion problems
- **Layer system (#80/82):** Discrete depth planes for wrecks, debris flashes, persistent ground stains
- **/issue command update (#81):** Preserve user-provided spec content rather than paraphrase
- **Game clock architecture + GameOver wiring + restart fix (#83/84):** Slow-mo affects all time-based logic, HP=0 triggers GameOverScene, restart resets all run state
- **Parking lot entries (#74):** Six post-MVP ideas captured before they faded

### Decisions made

**Layers as visual-only for MVP. Combat-aware layering deferred.**
Three options were on the table: pure visual layers (Option A), probe layer-aware now and bullets later (B), or full layer-aware combat data model now (C). Paul chose A. Reasoning: the gameplay mechanics are still under construction; getting wrecks to fall through visual depth is enough to validate the visual concept, while leaving the data model simple. Layer-aware combat (bombs, ground enemies, lightning) is a coupled post-MVP feature that needs to be designed all at once when ground enemies arrive.

**Phase rename from "settled" to "drifting."**
"Settled" implied stationary or grounded. The wreck in this phase is airborne, drifting at 50% inherited velocity, fully salvageable. Paul flagged the name as actively confusing during testing. The rename was its own small refactor PR before the layer system work, so the layer system PR's diff stayed focused on layer mechanics.

**Tether duration cap at 6 seconds, with auto-release.**
Original locked design said no cap, add later if playtesting revealed exploit-holding. Playtest immediately revealed a different problem: holding the tether indefinitely pulled the probe off-screen and looked broken visually. The cap was added at 6 sec (well past the 3 sec Tier 3 threshold) with auto-release at the cap. The design rationale shifted from "cap to prevent exploit" to "cap to prevent visual breakdown."

**GameOver wiring bundled into the game clock PR.**
The game clock fix needed AC #5 verified: that gameTimeMs resets on run restart. Verifying that AC required actually dying and restarting. The death-to-GameOver path was missing entirely. Filing it as a separate issue would have blocked verification of the game clock fix on a separate PR cycle. Bundling was the right call because the work was small (3 lines) and required for the primary fix to be testable.

**Constant wreck velocity through all phases.**
The original design called for falling-phase acceleration (1.0x to 1.5x) to sell "the wreck is falling now." After the layer system added discrete scale changes per phase, the acceleration became visually distracting against the shrinking sprite. Removed in favor of constant 40 px/s through all three phases. The "it's falling away" sell now comes entirely from the layer transitions.

### Options rejected

**Cloudflare Pages migration.**
Netlify auto-publish on every PR merge had burned through the free tier credits in a single day. Cloudflare Pages was the architecturally cleaner choice (free tier, clean auto-deploy disable). Paul instead upgraded to Netlify Personal: path of least resistance, no DNS migration, no rebuild of the deploy pipeline. The Cloudflare migration is filed as a parking-lot item to be revisited if Netlify causes further friction.

**Layer-aware bullets and probe targeting now (Models B and C).**
Building the full layer-aware combat data model upfront was tempting because it avoids future rework when ground enemies arrive. Rejected because no other weapons exist yet (bullets are the only projectile), so building the abstraction for one consumer is premature. The cost of doing it later when ground enemies require it is similar to doing it now. The simpler choice is correct until ground enemies force the issue.

### Surprises

**A test asserted the bug as expected behavior.**
The wreck velocity bug fixed in #79 had a test alongside it: "wreck position is unchanged during drifting phase." This codified the bug as the spec. Paul flagged this as an unfamiliar gap: he doesn't have deep video game testing experience and didn't catch the implausible assertion in the test list during /plan review. The lesson is real and worth a CLAUDE.md addition: tests asserting "X does not change" deserve scrutiny because they often codify bugs.

**Three "this should already exist" gaps surfaced in sequence.**
Slow-mo not affecting Driftling sine oscillation. GameOver scene not wired to HP=0 transition. GameScene.create() not resetting all run state on restart. None of these were introduced by yesterday's work; all were preexisting but invisible until other systems started behaving correctly enough to expose them. The wreck velocity fix made wrecks move, which made it obvious that wrecks were the only thing slow-mo didn't slow. The visual layer system made deaths more dramatic, which made it obvious nothing happened on death. The layer system PR added enough state that incomplete reset became impossible to miss. Each gap was opened by progress on adjacent systems.

**Background scroll speed problem only surfaced after wreck velocity fix.**
Husks descended at 50 px/s. Background scrolled at 60 px/s. Husks appeared nearly stationary against the ground. Paul did not notice this until after #79 fixed the wreck velocity bug. With static wrecks, the relative-motion problem was invisible; with moving wrecks, the eye had a reference point and the Husk-vs-ground relationship became obviously wrong. Fixing one bug surfaced the next.

### Process observations

**Gloom abridged the layer system issue significantly during /issue draft.**
The user-provided spec for the layer system included specific values (color codes, scale factors, phase durations) and complete state shapes. Gloom's draft replaced specifics with placeholders ("white/orange burst, TBD," "exact values tunable"), dropped the phase enum rename entirely from acceptance criteria, and reframed two of the five layer constants as "reserved for future use" when they were used in the same issue. Paul caught the drift on review and pushed back. The fix landed in #81: an updated /issue command that explicitly instructs Gloom to treat user content as authoritative spec, not a starting point for interpretation.

**The "send to Vega first" pattern continued to compound value.**
Every major plan flowed through Vega before going to Gloom. This caught architectural drift on the layer system /plan (probe target selection happens in TARGETING, not LAUNCHED), corrected the test file location for #69 (next-to-source per CLAUDE.md, not __tests__/), and caught the buggy pHits resolution loop in #69 before implementation. The overhead of one extra review pass per plan was small relative to the cost of catching architectural drift after implementation.

**Honest scope correction: layer system PR became a multi-fix sweep.**
Issue #80 began as "implement layer depths for wrecks." It shipped as: layer system + smooth scale interpolation + ground stain scrolling with background + probe live-position tracking + tether duration cap + debris flash visibility tuning. Each addition was justified, but the PR grew. The right call was to keep going within the same branch since each fix was small and surfaced by testing the previous one. The wrong call would have been seven separate PRs for what was effectively one continuous test-and-tune session.

### What got deferred

Six post-MVP ideas captured to docs/ideas.md during the session:

- **Probe sees what the ship can't:** TARGETING reveals weak points, salvage previews, hidden artifacts in a cone around the reticle
- **Crew log via Anthropic API:** First-person fragmented log entries generated from compact run state, fired during combat lulls
- **Wrecks remember what killed them:** Salvage tier rolls weighted by how the enemy died (direct fire, collision, tether)
- **Ship visually accumulates alien tech:** Each picked node bolts visible hardware onto the ship; tier 4 picks especially
- **Partial death:** "Death" tears off the most recent node instead of ending the run; three deaths in a row strips ship to base, fourth death is real
- **Behemoth boss built from unsalvaged wrecks:** Final boss size and difficulty scale with wrecks the player let pass during the run

Plus four infrastructure parking items:

- Cloudflare Pages migration
- Tap-to-fire override for faster manual fire than the hold cadence
- Per-run spawn seed (currently identical Husk patterns every run, breaking replay variance)
- Smooth scale tweening for wreck phase transitions if the discrete jumps prove jarring in playtest

### Verdict

MVP-shipping foundation complete. Salvage loop functional end-to-end. Layer depth implemented. Run lifecycle works (death triggers GameOver, restart resets all state cleanly). Slow-mo affects all time-based logic. Game is now playable end-to-end with placeholder content. Ready for the content layers: progression offer screen, node effects, real HUD.

### Open at end of entry

1. Progression offer screen needs to be the next gameplay issue (Vampire Survivors-style 1-of-3 picker after probe-tether returns)
2. Node effects: what each picked node actually does mechanically, gating tier 4 visuals if pursued
3. Real HUD replacing the placeholder "HP:3" text
4. Per-run spawn seed: identical Husk patterns every run is a replayability problem and should be promoted from parking lot to active work whenever it starts to nag
5. Build journal Entry 05 (player ship through Husks + wrecks, the gap between scaffold deploy and this session) is unwritten; archaeological work that can be drafted from PR descriptions when convenient
6. Netlify Auto Publishing Lock workflow is in place but adds two manual clicks per intentional deploy; Cloudflare migration remains the long-term escape hatch

### Next step

Build journal Entry 05 (the gap between scaffold and yesterday's work) followed by the progression offer screen as the next development issue.

---


Entry template (copy for future entries)
## Entry NN: [short title]

**Date range:**
**Personas involved:**
**Artifacts produced:**

### Context
[What were we working on and why?]

### Decisions made
[What got chosen and why?]

### Options rejected
[What did we consider and drop? Why?]

### What got deferred
[Anything pushed to later?]

### Open at end of entry
[Loose threads]

### Next step
[The single thing that happens next]