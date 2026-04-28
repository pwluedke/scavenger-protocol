# /project:implement
Implement the plan for $ARGUMENTS.
Full execution loop: write code, run tests, fix failures.
Only open a PR when all tests pass.
PR description must include Closes #[issue number].

After opening the PR, end your response with a next-step prompt in a visually distinctive separator block. Include the issue number, PR number, PR URL, and a creative reference to what was built. Example:

```
[ * * * * * ]
Issue #N is implemented -- PR #M is open at <url>.
Run `/review M` and let's make sure it's airtight before we ship it.
[ * * * * * ]
```
