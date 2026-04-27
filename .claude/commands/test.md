# /test
Switch to a PR branch and start the Vite dev server for manual testing. Run this after /review returns APPROVED.

Usage: /test #[PR number]

Steps:
1. Run: gh pr view [PR number] --json headRefName --jq '.headRefName' to get the branch name
2. Run: git checkout [branch name]
3. Kill any existing process on port 5173: kill -9 $(lsof -t -i:5173) 2>/dev/null
4. Run: npm run dev from the project root
5. Report: active branch name and dev server URL (http://localhost:5173 unless Vite picks a different port, in which case report the actual port)
6. Read the PR description and linked issue AC. List the specific things Paul should verify manually in the browser for this PR. Be concrete: not "verify the game works" but "confirm the MenuScene displays SCAVENGER PROTOCOL centered on a black canvas" or "confirm pressing E fires the probe and the game enters slow-mo."
7. Wait for Paul to confirm manual verification is complete before he merges.

Note: /test is for post-review manual verification only. Always run /review first. Never run /test on a PR that has not received an APPROVED verdict from /review.
