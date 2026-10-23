# MU H5 Full 2.8 — Cloudflare Workers Static Assets CDN

This deployment is **static game assets only**. It does not host Node.js, accounts, API, or Neon.

## Current Cloudflare project (verified by owner screenshot on 2026-10-23)

- Cloudflare account workers.dev subdomain: `kiendt193-fpt.workers.dev`
- Workers Static Assets project: `mu-h5`
- URL: `https://mu-h5.kiendt193-fpt.workers.dev`
- Deployment command: `npx wrangler deploy`
- GitHub build: `node game/build-cloudflare-pages.cjs`, output: `cdn-dist`.
- Root `wrangler.jsonc` makes this setup explicit and attaches `cdn-dist` as Static Assets, without executing a Worker script.
- Cloudflare dashboard indicates a successful Static Assets deployment. Validate assets using `/mu/cdn-check.json` and `/mu/assets/mu06/maps/manifest.json` before activating CDN on Render.

Do **not** create a new Pages project: the working existing service is a Worker with Static Assets.

## Existing Worker setup (already connected to GitHub)

The screenshot shows Workers Static Assets, not Pages. For this project:

1. Keep Cloudflare's existing Worker **mu-h5** and GitHub repository **kiendt193/mu-h5**.
2. Keep Build command `node game/build-cloudflare-pages.cjs`.
3. Keep Deploy command `npx wrangler deploy`.
4. Root directory must remain `/` (repository root).
5. `wrangler.jsonc` in GitHub specifies `assets.directory = "./cdn-dist"` and Worker name `mu-h5`.
6. GitHub push to `main` triggers a Cloudflare build (if automatic deployments are enabled).

## Confirm it is live

Open `https://mu-h5.kiendt193-fpt.workers.dev/mu/cdn-check.json`; ensure it returns `{"ok":true,"assetsRevision":"...","count":...,"bytes":...}`.

This is the exact URL shown in the owner's Cloudflare Workers overview. A green build does not alone prove the JSON and asset routes respond with valid data.

## Activate CDN when Render resumes

The Render Free service `mu-h5-sg` is currently suspended by monthly usage limits.
Updating Render's environment while suspended returned `cannot deploy suspended service`.

**No Render environment change is required for this Worker.**
The backend now advertises `https://mu-h5.kiendt193-fpt.workers.dev` automatically from GitHub `main` when Render deploys the new version.

The game queries `/mu/cdn-config.json`, verifies `/mu/cdn-check.json` against the deployed game's exact static asset fingerprint, and **only then** sends `/mu/assets/*` to Cloudflare. If CDN files or revision are wrong, Render serves the original resources instead. `/mu/api/*`, logins, characters, and Neon remain on Render/Neon.

To switch to another CDN: set `MU_CDN_ORIGIN=https://new-domain.example` when Render permits changes.
To disable CDN: explicitly set `MU_CDN_ORIGIN` to an empty string.
No Neon data changes are involved.

**Before assuming CDN is active**, check these on the Cloudflare Worker:
- `https://mu-h5.kiendt193-fpt.workers.dev/mu/cdn-check.json` — JSON with `ok:true` and `assetsRevision`.
- `https://mu-h5.kiendt193-fpt.workers.dev/mu/assets/mu06/maps/manifest.json` — valid map JSON.
- `https://mu-h5.kiendt193-fpt.workers.dev/mu/assets/mu05/manifest.json.mucdn` — compressed binary, not JSON text.

## Cache behavior

- On first visit, players may choose **Tải trọn bộ về thiết bị** to store fingerprinted static resources in Chrome.
- Subsequent visits use the same device cache and HTTP immutable CDN cache.
- Changed asset hashes cause changed URLs; only new/changed assets are transferred.
- Browser can evict data under storage pressure. Player accounts are never in the static cache.
- Service Worker accepts CDN origin only when the game has validated the release fingerprint.
- Audio byte-range requests use a cached HTTP 206 response, when present.

## Rollback

Set `MU_CDN_ORIGIN` to an empty value on Render and deploy. The server automatically serves assets itself again. No Neon backup/restore is required: no player data is changed by this CDN configuration.

Cloudflare Workers Static Assets docs:
https://developers.cloudflare.com/workers/static-assets/
https://developers.cloudflare.com/workers/static-assets/headers/
https://developers.cloudflare.com/workers/wrangler/configuration/
