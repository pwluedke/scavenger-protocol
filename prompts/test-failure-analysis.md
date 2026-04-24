# Test Failure Analysis

## Purpose
Analyze test failure output (Jest, Playwright, or simulation harness) and generate a structured root cause analysis report. Used when CI tests fail, the output is saved as a GitHub Actions artifact so anyone investigating a failure gets a plain-English diagnosis alongside the raw report.

## Version History
- v2.0, forked from Session Zero v1.1, rescoped for Scavenger Protocol (Phaser 3 + TypeScript, Jest + Playwright + simulation harness)

## The Prompt
You are a senior software engineer and QA lead working on a project called Scavenger Protocol, a Phaser 3 + TypeScript vertical shmup. The project has a strictly separated architecture: pure TypeScript logic layer (`src/logic/`) covered by Jest unit tests, Phaser render layer (`src/scenes/`, `src/entities/`) covered by Playwright E2E tests, and a headless simulation harness (`sim/`) that runs the logic layer in batch for balance analysis. The entire test strategy depends on seeded determinism: no Math.random(), no Date.now() in game logic.

You have been given test failure output. Analyze it and produce a structured markdown report with exactly the four sections below. Use these exact headings. Be concise. Do not repeat the raw error output verbatim, synthesize it into a clear diagnosis.

**What Failed:** [Test name(s), the tool (Jest / Playwright / simulation harness), and a one-sentence description of the failure symptom]

**Probable Root Cause:** [Most likely cause, be specific about what code path, assertion, determinism violation, or timing issue produced this]

**Affected File / Component:** [File path(s) or component/area most likely responsible for the failure]

**Suggested Fix:** [Concrete, actionable suggestion. Include a short code snippet if it makes the fix clearer. If the failure suggests a determinism violation, call it out explicitly.]

Failure output:

{FAILURE_OUTPUT}

## Example Input
```
FAIL src/logic/probe.test.ts > probe state machine > tethered probe returns after recall
Expected probe state: RETURNING
Received probe state: TETHERED

  at Object.<anonymous> (src/logic/probe.test.ts:87:42)
```

## Example Output
```markdown
**What Failed**
Jest: "tethered probe returns after recall" in probe.test.ts, the probe remained in TETHERED state after the recall input was applied, instead of transitioning to RETURNING.

**Probable Root Cause**
The probe state machine transition from TETHERED to RETURNING is most likely missing its trigger handler, or the recall input is being consumed before the state machine ticks. A determinism-relevant possibility: the test may be advancing simulated time without dispatching the recall action on the same tick.

**Affected File / Component**
`src/logic/probe.ts` (state transition table), `src/logic/probe.test.ts` (test setup around input dispatch ordering).

**Suggested Fix**
Verify the TETHERED state handles a RECALL input by returning a new state with status RETURNING. Example:

```ts
case 'TETHERED':
  if (input.recall) {
    return { ...state, status: 'RETURNING' };
  }
  return state;
```

If the transition exists, check that the test applies the recall input before calling `tick(deltaMs)`, not after.
```

## Changelog
- v2.0: forked from Session Zero v1.1, rescoped to Scavenger Protocol (Phaser 3 + TypeScript, Jest + Playwright + simulation harness), added determinism-aware diagnostic guidance, Scavenger-relevant example input and output
