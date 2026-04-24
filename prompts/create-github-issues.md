# Create GitHub Issues

## Purpose
Generate well-structured GitHub Issues for a feature or task area.
Use when planning new work that needs to be tracked in the repo.

## Version History
- v1.1 — added example output from first use (CI/CD pipeline area); added review notes
- v1.0 — initial version

## The Prompt
You are a senior software engineer and QA lead working on a project called Scavenger Protocol, using Phaser 3 + TypeScript, Jest + Playwright + simulation harness, and GitHub Actions CI/CD pipeline.

Create GitHub Issues for the following area: [AREA]

For each issue, provide:
- **Title** — concise, action-oriented
- **Description** — what it is and why it matters
- **Acceptance Criteria** — bullet list of specific, testable conditions
- **Labels** — suggest appropriate labels (e.g. infrastructure, testing, enhancement)
- **Epic** — which epic it belongs to (epic list TBD)

Keep scope small — each issue should represent 1–3 hours of focused work.

## Example Input
Area: GitHub Actions CI/CD pipeline for running Playwright tests on every PR

## Example Output

### Issue 6: Add Playwright CI status badge to README

**Description**
Surface the CI status visibly in the README so anyone viewing the repo immediately sees whether tests are passing. The badge links directly to the Actions workflow run history.

Note: the badge markup has already been added to `README.md` (references `playwright.yml`). This issue tracks confirming it renders correctly once #60 is merged and the workflow exists.

**Acceptance Criteria**
- Badge appears at the top of `README.md`, below the title
- Badge links to the Actions workflow run list
- Badge reflects the current status of the `main` branch
- Badge renders correctly on the GitHub repo page (not broken/missing)

**Labels:** `infrastructure`, `documentation`
**Epic:** TBD

## Notes
- Acceptance criteria should be testable, not vague
- One issue per distinct piece of work
- Infrastructure work belongs to Epic <TBD>
- Output reviewed and approved before creating issues in GitHub
`