# Global Higher Educational Services

This repository is the deployable source for the Global Higher Educational Services website.

## Live website

- Primary address: https://www.globalhighereducationalservices.com/
- Cloudflare address: https://globalhighereducationalservices.azargar.workers.dev/
- Cloudflare Worker: globalhighereducationalservices

## Repository layout

- public/ contains everything Cloudflare publishes.
- wrangler.jsonc connects the site to the existing Worker and custom domain.
- scripts/check-site.mjs checks all nine pages, internal file links, canonical URLs, and the sitemap before a deployment.
- package.json pins the deployment tool and provides the commands below.

The original one-page browser export remains recoverable from the pre-cloudflare-cleanup Git tag and repository history.

## Update the website

1. Edit the files in public/.
2. Install the pinned tools with corepack pnpm install --frozen-lockfile.
3. Run pnpm run check.
4. Preview locally with pnpm run dev.
5. Commit the reviewed change and push it to the main branch.

A manual production deployment can be run with:

    pnpm run deploy

A preview version can be uploaded with:

    pnpm run preview

Do not commit Cloudflare tokens, .dev.vars, .env files, or the generated .wrangler directory.

## Connect future GitHub updates to Cloudflare

In the Cloudflare dashboard, open **Workers & Pages → globalhighereducationalservices → Settings → Builds → Connect**. Authorize the Cloudflare Workers and Pages GitHub App, then select kjenab/GHES.

Use these build settings:

- Production branch: main
- Root directory: /
- Build command: leave blank
- Production deploy command: pnpm run deploy
- Preview deploy command: pnpm run preview

Cloudflare creates and manages the build token during this connection. A separate long-lived token does not need to be stored in GitHub.

## Current dependency note

The recovered pages still load Webador-hosted styles, scripts, fonts, and images to preserve the current appearance. Those assets should be copied into public/assets/ in a separate visual hardening update before the original Webador assets are retired.