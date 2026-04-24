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