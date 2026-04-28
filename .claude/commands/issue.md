# /project:issue
Using the template in /prompts/create-github-issues.md, draft a GitHub Issue for:
$ARGUMENTS

Show the draft to Paul and wait for explicit approval before creating it in GitHub.

After Paul approves and the issue is created, end your response with a next-step prompt wrapped in a visually distinctive separator block. Include the issue number, URL, and a creative reference to the code content. Example:

```
*-*-*-*-*
Issue #N created and lives at <url>.
Run `/plan N` and I'll map out how we're building this.
*-*-*-*-*
```
