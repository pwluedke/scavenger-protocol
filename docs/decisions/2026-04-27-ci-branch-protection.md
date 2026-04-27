# CI branch protection strategy

Date: 2026-04-27

## Decision

Five separate jobs run in parallel on every PR: lint, typecheck, unit, e2e, build. All five must pass before merge. Branch protection rules on main require these status checks.

## Why separate jobs

A monolithic "test" job that runs everything sequentially would take longer and give less actionable failure signals. Separate jobs surface exactly which check failed without having to read through a combined log.

## Coverage threshold

80% on statements, lines, and functions for `src/logic/**/*.ts`. Branches are excluded because `rng.ts` contains defensive `|| 1` guards that are unreachable in practice. Enforcing branch coverage here would require either dead test scaffolding or removing the guards, neither of which improves the codebase.

## Playwright: Chromium only

CI runs Chromium only. The game targets web-first, and adding Firefox and WebKit triples E2E time with no meaningful additional coverage at this stage. Revisit when the game approaches release.
