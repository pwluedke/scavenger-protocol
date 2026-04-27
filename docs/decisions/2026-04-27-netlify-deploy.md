# Netlify deploy for scavenger.somanygames.app

Date: 2026-04-27

## Decision

Host Scavenger Protocol on Netlify at scavenger.somanygames.app. DNS handled by Porkbun with a CNAME record pointing the subdomain at the Netlify-assigned target.

## Why Netlify over Railway

Session Zero runs on Railway because it has a Node.js backend. Scavenger Protocol is a pure static Vite build -- HTML, JS, and assets. A static host is the right tool. Netlify's free tier gives auto-deploy on push to main, PR preview deployments (each PR gets a unique URL for manual testing), and HTTPS with no extra config. No Node server is needed and adding one would be unnecessary complexity.

## Why independent from Session Zero

Separate repos, separate concerns, separate billing. Coupling Scavenger Protocol to Session Zero's Railway account would mean a Session Zero deploy affecting Scavenger Protocol, shared environment variables, and no clean separation of the two projects. Netlify keeps them independent.

## DNS: CNAME for subdomain

The custom domain is a subdomain (scavenger.somanygames.app), not the root domain (somanygames.app). Subdomains use a CNAME record pointing to the Netlify-assigned value (e.g. [site-name].netlify.app). The root-domain ALIAS/ANAME gotcha does not apply here -- CNAMEs work correctly for subdomains across all DNS providers including Porkbun.

## Build configuration

`netlify.toml` at repo root:
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

`npm run build` runs `tsc --noEmit && vite build`. Output lands in `dist/`. Netlify reads `netlify.toml` automatically; no build configuration is needed in the dashboard beyond connecting the repo.
