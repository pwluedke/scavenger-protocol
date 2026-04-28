# /start
Start the Vite dev server for Scavenger Protocol.

Steps:
1. Kill any existing process on port 5173: kill -9 $(lsof -t -i:5173) 2>/dev/null
2. Run: npm run dev from the project root
3. Report: dev server URL (http://localhost:5173 unless Vite picks a different port, in which case report the actual port)

Note: /test handles its own server lifecycle when verifying a PR. Use /start when you just want the dev server running for ad-hoc local development outside of a PR review flow.
