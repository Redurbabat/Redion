# RED Morph — Cloudflare Workers deployment

## Root cause of the 2026-11-04 deployment failure
The dashboard deploy command was `npx wrangler deploy` from the repository root. Wrangler reads `wrangler.jsonc`, which expects static assets at `./app/dist`. The repository does not commit generated Vite output; `app/dist` must be created first.

## Cloudflare Workers Builds configuration
- **Repository:** `Redurbabat/RED-Morph`
- **Root directory:** repository root (`/`)
- **Build command:** `npm --prefix app ci && npm --prefix app run build`
- **Deploy command:** `npx wrangler deploy`
- **Build output directory:** not needed for Workers Builds; Wrangler uses `assets.directory` in `wrangler.jsonc`.

Alternatively, if Cloudflare exposes only a single deploy command, use:

```sh
npm --prefix app ci && npm --prefix app run build && npx wrangler deploy
```

## Worker name and URL
The existing `wrangler.jsonc` retains `"name": "ui-kit"` to keep the live worker `ui-kit.redurbabat7.workers.dev` stable. The public site branding is **RED Morph**. To switch the Worker URL to `red-morph.redurbabat7.workers.dev`, change the Worker name and the Cloudflare deployment settings together, then check the new URL and any routes or domains. A repository rename does not rename a Cloudflare Worker.

## Verify
1. Confirm build completes and `app/dist/index.html` exists.
2. Confirm Wrangler reports a successful deployment.
3. Open the Worker URL and verify title, styles, routes and GitHub links.
4. Only after the deployment is healthy, consider merging PR #18.
