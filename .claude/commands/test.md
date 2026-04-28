# /test
Switch to a PR branch and start the Vite dev server for manual testing. Run this after /review returns APPROVED.

Usage: /test #[PR number]

Steps:
1. Run: gh pr view [PR number] --json headRefName --jq '.headRefName' to get the branch name
2. Run: git checkout [branch name]
3. Check if a process is running on port 5173: lsof -t -i:5173
   - If a process is running: kill it with kill -9 $(lsof -t -i:5173) and report "Restarting dev server with fresh code from [branch name]."
   - If no process is running: report "Starting dev server for [branch name]."
4. Run: npm run dev from the project root
5. Report: active branch name and dev server URL (http://localhost:5173 unless Vite picks a different port, in which case report the actual port)
6. Read the PR description and linked issue AC. List the specific things Paul should verify manually in the browser for this PR. Be concrete: not "verify the game works" but "confirm the MenuScene displays SCAVENGER PROTOCOL centered on a black canvas" or "confirm pressing E fires the probe and the game enters slow-mo."
7. Wait for Paul to confirm manual verification is complete before he merges.
8. After Paul confirms, end your response with a next-step prompt in a visually distinctive separator block. Include the PR number and URL. Example:

~-~-~-~-~
PR #N verified. Merge it on GitHub, then run `/merged N` to sync locally and clean up the branch.
~-~-~-~-~

Note: /test is for post-review manual verification only. Always run /review first. Never run /test on a PR that has not received an APPROVED verdict from /review.

If /test is run while the dev server is already running, it will stop the existing server and restart it with the latest code from the target branch. This ensures the browser sees the freshly checked-out code.
