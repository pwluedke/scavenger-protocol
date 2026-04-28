# Deployment

## Why deploys are manual

Netlify free tier is 300 credits/month. Each production deploy costs 15 credits. Auto-deploy on every merge burned half the monthly budget in a single day of rapid PR merges.

Production deploys are now intentional and batched. Pushing to main does not deploy. The live site is updated only when a developer explicitly triggers a deploy.

## How to trigger a production deploy

1. Go to the GitHub Actions tab in the repository
2. Select "Deploy to production" from the left sidebar
3. Click "Run workflow"
4. Type `DEPLOY` in the confirm field (must be exact -- uppercase, no spaces)
5. Click "Run workflow"

The workflow POSTs to the Netlify build hook, which queues a build from the current HEAD of `main`. Build progress is visible in the Netlify dashboard.

If "Run workflow" is clicked twice before the first deploy completes, the second run queues and waits -- it does not cancel the first.

## Where to view deploy status

- **GitHub Actions:** the workflow run logs show the commit SHA, actor, and UTC timestamp of the triggered deploy
- **Netlify dashboard:** full build logs and deploy history for the production site

## Emergency: how to disable

If the manual workflow is broken and a deploy is urgently needed, re-enable auto publishing in the Netlify dashboard:

`Site settings -> Build & deploy -> Continuous deployment -> Start auto publishing`

This bypasses the GitHub workflow entirely and restores the original behavior (deploy on every push to main). Disable again after the emergency is resolved.
