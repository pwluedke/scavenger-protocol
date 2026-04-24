# /merged

Run this after merging a PR on GitHub to sync the local repo.

Takes the PR number as an argument (e.g. `/merged 4`).

## Steps

1. Run `gh pr view $ARGUMENTS --json state,mergedAt,headRefName` and inspect the output.
   - If `state` is not `MERGED`, stop and report: "PR #$ARGUMENTS is not merged (state: <state>). Sync aborted." Do not proceed.
   - Capture `headRefName` as the feature branch name.

2. Run `git checkout main`.

3. Run `git pull`.

4. Run `git branch -d <headRefName>`.
   - If the delete fails for any reason, stop and report the error exactly as git printed it. Do not retry with `-D` unless the user explicitly asks.

5. Run `git status` and confirm the working tree is clean.

6. Report back:
   - PR number merged
   - Branch deleted
   - main is now at `<short SHA>` (obtain via `git rev-parse --short HEAD`)

## Constraints

- Do not push anything.
- Do not delete the remote branch.
- If git surfaces an error on `git checkout` (e.g. uncommitted work on the feature branch), report it as-is and stop. Do not wrap it in custom handling.
