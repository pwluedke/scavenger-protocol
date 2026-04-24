# CLAUDE.md

This file provides guidance to Claude (Gloom in Cursor, Vega in claude.ai) when working with code in this repository.

## Project Overview
Scavenger Protocol is a retrofuturistic vertical shmup with a signature tether-probe salvage mechanic. Solo roguelite, one life, 20-minute runs, seeded determinism. Built as a portfolio project demonstrating game development alongside QA engineering depth (unit tests, E2E, simulation harness, CI/CD). Framing: rebel survivors during an alien invasion, salvaging alien tech from wrecks. Web first, Raspberry Pi 4 kiosk post-MVP.

## Tech Stack
- Frontend: Phaser 3 + TypeScript (strict mode)
- Build: Vite
- Testing: Jest (unit), Playwright (E2E), custom headless harness (simulation/balance)
- CI/CD: GitHub Actions
- Hosting: Cloudflare Pages or Netlify at scavenger.somanygames.app
- Post-MVP target: Chromium kiosk on Pi OS Lite, systemd autostart
- Input: Gamepad API (PS/Xbox controllers) + keyboard
- Version control: Git + GitHub
- Assets: Kenney.nl (sprites), freesound.org / OpenGameArt (audio), all free/CC0

## Commands

Start the dev server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Run unit tests:
```bash
npm run test
```

Run unit tests in watch mode:
```bash
npm run test:watch
```

Run Playwright E2E tests (starts dev server automatically):
```bash
npm run test:e2e
```

Run a single E2E test by name:
```bash
npx playwright test --grep "test name here"
```

Run the simulation harness:
```bash
npm run sim
```

## Architecture

### Layer separation
Logic and render are strictly separated. This is the architectural decision that makes the whole test strategy possible, do not violate it.

- `src/logic/` is pure TypeScript. No Phaser imports. No DOM. No Date.now(). No Math.random(). Deterministic given inputs.
- `src/scenes/` and `src/entities/` are Phaser scenes, sprites, input, audio.
- Render layer reads logic layer state. Logic layer never reaches into Phaser.

### Determinism
- All randomness comes from a seeded RNG module. Seed is set at run start.
- All game time is passed in as a parameter. No wall-clock reads in game logic.
- Same seed plus same input sequence must produce an identical run.
- This enables Playwright replay, simulation harness, and daily challenge mode.

### Input mapping
All input flows through a single mapping layer. Gamepad API and keyboard both produce the same logical actions (MOVE_X, MOVE_Y, FIRE, PROBE, CANCEL_PROBE, PAUSE). Scenes consume logical actions, never raw input.

### Probe state machine
The probe mechanic is the signature feature. Its behavior lives in `src/logic/probe.ts` as a state machine with states: IDLE, TARGETING (slow-mo), LAUNCHED, TETHERED, RETURNING, DESTROYED, COOLDOWN. Transitions are pure functions. See design doc section 4 for rules.

### Progression system
Skill tree structure with Vampire Survivors-style random offerings. Lives in `src/logic/progression.ts`. Nodes defined in `src/logic/progression-data.ts`, driven by `docs/tuning.md`.

### Wave scheduler
Deterministic wave spawning from seed. Lives in `src/logic/waves.ts`. Wave patterns defined in `src/logic/wave-data.ts`, driven by `docs/tuning.md`.

### Scenes (Phaser)
- BootScene: asset load
- MenuScene: title, seed display, start run
- GameScene: the actual game
- PauseScene: paused overlay
- GameOverScene: score summary, restart

### Tuning
All numeric values (damage, speed, HP, cooldowns, wave timings, node effects) live in `docs/tuning.md` and are codified into `src/logic/*-data.ts` files. Never hardcode a tuning value in a scene or entity, always pull from data files.

## Design Documents
- `docs/design-doc.md`: source of truth for scope, mechanics, narrative, decisions. Read before suggesting non-trivial changes.
- `docs/tuning.md`: all numeric values. Populated in design pass 2.
- `docs/ai-strategy.md`: interview leave-behind documenting the two-AI workflow.
- `docs/decisions/`: ADR-style markdown for non-trivial decisions. Format: YYYY-MM-DD-short-slug.md.
- `docs/diary.md`: project diary. /reflect at start of session, /diary at end.

## Core Principles

### 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

- State assumptions explicitly, if uncertain, ask rather than guess
- Present multiple interpretations, don't pick silently when ambiguity exists
- Push back when warranted, if a simpler approach exists, say so
- Stop when confused, name what's unclear and ask for clarification
- Always present a plan before implementing anything destructive or architectural

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

- YAGNI, You Aren't Gonna Need It. Never build flexibility, configurability, or abstractions that were not explicitly requested. If the issue doesn't ask for it, don't build it.
- No features beyond what was asked
- No abstractions for single-use code
- No flexibility or configurability that wasn't requested
- No error handling for impossible scenarios
- If 200 lines could be 50, rewrite it

The test: would a senior engineer say this is overcomplicated? If yes, simplify.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.

- Don't improve adjacent code, comments, or formatting unless asked
- Don't refactor things that aren't broken
- Match existing style, even if you'd do it differently
- If you notice something wrong outside the scope of the task: mention it, do not fix it, do not create a branch for it. Paul will decide whether to create an issue.
- Remove imports/variables/functions that YOUR changes made unused
- Don't remove pre-existing dead code unless asked
- Every changed line should trace directly to the request

### 4. Goal-Driven Execution
Define success criteria. Loop until verified.

- Write failing tests first on the logic layer, then implement until green (TDD loop)
- For multi-step tasks, state a brief plan with a verification step for each
- PRs are only opened when all tests pass, not before
- Use /compact when sessions get long to preserve output quality

### 5. Determinism is Non-Negotiable
The entire test strategy depends on seeded determinism.

- Never use Math.random() in game logic, always the seeded RNG
- Never use Date.now() in game logic, always injected time
- Never introduce async behavior into the logic layer, it must run synchronously for the simulation harness
- If a seeded run cannot be replayed, a regression has happened, fix it before shipping

## Testing Standards

Testing strategy by issue type:

- **Feature/Enhancement**: Acceptance-Driven, AC in issue, tests written in same PR as code
- **Bug**: Regression-first, write failing test that reproduces the bug before fixing it
- **Refactor**: Characterization-first, lock in current behavior with tests before touching code

Before writing any test, ask: "Am I adding new behavior or preserving existing behavior?"

### Logic layer (Jest)
- Target >80% coverage
- Every probe state transition, damage calc, progression tree query, wave scheduler tick, seeded RNG call
- Tests live next to source: `foo.ts` plus `foo.test.ts`

### Render layer (Playwright)
- Seeded full-run smoke test: game boots, seed produces expected waves, probe works, run ends
- Page Object Model, no raw selectors in test files
- Every test fully isolated, beforeEach resets state
- Test names describe behavior, not implementation

### Simulation harness
- Headless runs of logic layer only, no Phaser
- Batches of 1000+ runs, randomized builds
- Outputs CSV: win rate, node usage, death causes, run length
- Used for balance tuning, not pass/fail gating

### Rules for all test types
- No skipped or disabled tests in main
- CI must be green before merge, no exceptions
- External dependencies (asset load, Gamepad API) mocked or stubbed in tests

## Conventions
- Branch names: feature/short-description or fix/short-description or chore/short-description
- Never commit directly to main
- One issue per branch, one feature per PR
- PR descriptions always include Closes #n referencing the issue
- Commit messages explain why, not just what
- Never use em dashes in any file. Use commas, semicolons, colons, regular dashes, or parentheses instead.
- Never use emojis in any file.
- TypeScript strict mode, no `any` without a comment explaining why
- Prefer named exports over default exports
- One class or component per file, file name matches export

## Files You Should Never Modify Directly
- `.env`: environment variables, never touch
- `package-lock.json`: only modified by npm
- `docs/design-doc.md`: design decisions, update only via explicit design-pass work with Vega
- `docs/tuning.md`: tuning values, update only via explicit tuning-pass work with Vega
- `.github/workflows/`: CI config, only modify if explicitly asked
- `public/assets/`: asset files, only add or remove if explicitly asked

## Out of Scope for MVP
Push back and confirm intent if any of these appear in a plan:
- Meta-progression (alien tech unlocks, ship variants)
- Capstone synergies
- Multiple biomes or stages beyond stage 1
- Online leaderboards
- Mobile touch controls
- Pi kiosk deployment image
- Multiplayer in any form
- Save/load mid-run (roguelite, one life, no save)

MVP = single biome, single boss, clean slate per run, probe mechanic plus 20-node tree working, seeded determinism, web deploy.

## Known Gotchas
Running memory of things that wasted 30+ minutes. Add to this list as issues are discovered.

- (populate as we go)

## Working Approach
- Always ask "show me your plan first" before any new feature implementation
- Run tests after implementation, PRs only open when tests pass
- Scope stays focused, one feature or fix per session
- When creating GitHub Issues, follow the template in /prompts/create-github-issues.md
- The prompt library lives in /prompts/, check it before starting any repeatable task
- Use /plan before any implementation, never skip the plan step
- Use /issue to create GitHub Issues, keeps prompt library in sync
- Use /review before merging any PR
- docs/diary.md is the project diary, run /reflect at the start of each session and /diary at the end
- Journal entries (docs/build-journal.md) are drafted by Vega in claude.ai, not via slash command, because they capture strategic decisions made outside of Cursor's context.

## AI Personas
- **Vega**: strategy persona, runs in claude.ai. Handles planning, design iteration, decision review, issue authoring. Reads design-doc.md and tuning.md. Does not write implementation code.
- **Gloom**: implementation persona, runs in Cursor with Claude Code. Executes plans Vega has reviewed. Writes code, tests, and PRs. Does not make architectural or design decisions unilaterally.

All implementation starts with a plan written or reviewed by Vega before Gloom executes.
