# /review

## Version History
- v2.0 - forked from Session Zero v1.x, rescoped for Scavenger Protocol architecture (logic/render separation, determinism rules, prototype exemptions)

Review the open PR in two explicit passes before recommending merge.

## Pass 1 -- Spec compliance
Does this PR deliver exactly what was asked?
- Read the linked GitHub Issue acceptance criteria line by line
- Confirm every AC item is implemented and testable
- Flag any AC item that is missing, partially implemented, or interpreted differently than specified
- Check that the PR description references the issue with "Closes #n"
- Do not proceed to Pass 2 if any AC item is unmet -- report the gaps first

## Pass 2 -- Code quality
Is the code well built and consistent with the project?
- Surgical changes only: every changed line traces to the issue. Flag drive-by refactoring.
- No em dashes anywhere in any file.
- No emojis anywhere in any file.
- Logic/render layer separation: no Phaser imports in `src/logic/`, no DOM, no `Date.now()`, no `Math.random()` in logic layer.
- Determinism: all randomness via seeded RNG, all time explicitly injected.
- Tuning values pulled from data files (`src/logic/*-data.ts` or `docs/tuning.md`), not hardcoded in scenes or entities.
- Tests live next to source (`foo.ts` plus `foo.test.ts`).
- Jest unit tests cover new logic-layer code with reasonable coverage.
- Playwright tests follow Page Object Model, no raw selectors in test files.
- No dead code, unused imports, or variables left behind.
- Matches existing code style and conventions.

## Prototype exemption
Work under `prototypes/` is exempt from the logic/render separation, determinism, tuning-in-data-files, and test-coverage items. Prototype code must still be clean, readable, and match its own spec. Surgical changes, no em dashes, no emojis, and no dead code rules still apply to prototype work.

## After both passes
State one of:
- APPROVED -- both passes clean, ready to merge
- CHANGES REQUESTED -- list specific items by pass, block merge until resolved
- QUESTION -- something needs clarification before a verdict

Never approve a PR that fails Pass 1. A well-written PR that doesn't meet the spec is not done.
