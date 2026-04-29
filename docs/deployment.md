# Production Deployment

Production deploys are intentional and manually published. This prevents auto-deploy on every PR merge from burning Netlify credits.

## How it works

Netlify Auto Publishing is locked. PR merges to main still trigger builds (Netlify uploads the build), but the build is NOT published to the production URL automatically. The currently published deploy stays live until a developer manually publishes a newer deploy.

## How to publish a deploy

1. Go to the Netlify dashboard for the project (timely-sprinkles-900094)
2. Click into Deploys (left sidebar)
3. Find the latest deploy (it will show "Uploaded" status, not "Published")
4. Click into that deploy
5. Click the "Publish deploy" button
6. Confirm the production URL (scavenger.somanygames.app) now serves the new version

That's it. Two clicks plus confirmation.

## When to publish

- After a PR or batch of PRs merges and you want the changes to go live
- After verifying the changes work in local dev or a deploy preview
- Never on a Friday afternoon

## How to verify Auto Publishing is still locked

The Deploys page header should show an "Auto Publishing Locked" badge. If it shows "Auto publishing is on" instead, click "Lock to stop auto publishing" to re-lock it. Auto publishing being unlocked means every PR merge will publish to production immediately, which burns credits and bypasses the intentional deploy workflow.

## In an emergency

If the deploy-on-demand workflow needs to be bypassed (broken site, urgent fix, etc.):

1. Netlify dashboard -> Deploys
2. Click "Unlock to start auto publishing" - this will publish the most recent build immediately
3. Once the emergency is resolved, click "Lock to stop auto publishing" again to restore the controlled workflow

## Build hook (legacy)

The repo has a GitHub Actions workflow at .github/workflows/deploy-production.yml that calls a Netlify build hook. With Auto Publishing locked, this workflow triggers a build but does not publish it. The workflow is preserved for future use but is currently redundant - the Netlify UI's "Publish deploy" button is the simpler path.

If you want to remove the redundant workflow, that's a separate cleanup PR. For now it does no harm.

## Cost notes

Even with Auto Publishing locked, every PR merge triggers a build, which consumes Netlify build minutes. To reduce build cost further, the long-term plan is to migrate to Cloudflare Pages (parking lot item in docs/ideas.md), which has more generous free tier limits and clean auto-deploy disable.
