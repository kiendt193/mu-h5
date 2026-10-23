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

## Activate CDN after verification

After the CDN verification endpoint has returned valid JSON, on Render service `mu-h5-sg` set a **single** environment variable:

```
MU_CDN_ORIGIN=https://mu-h5.kiendt193-fpt.workers.dev
```

Do not include `/mu/` or a trailing slash.

The game queries `/mu/cdn-config.json`, verifies `/mu/cdn-check.json` against the deployed game's exact static asset fingerprint, and only then sends `/mu/assets/*` to Cloudflare. If it cannot verify CDN, it uses Render instead. All `/mu/api/*`, sessions, account data, game server, and Neon database remain on Render/Neon.

Render must be available for login; a CDN does not resolve Render Free quota suspension.

## Cache behavior

- On first visit, players may choose **Tải trọn bộ về thiết bị** to store fingerprinted static resources in Chrome.
- Subsequent visits use the same device cache and HTTP immutable CDN cache.
- Changed asset hashes cause changed URLs; only new/changed assets are transferred.
- Browser can evict data under storage pressure. Player accounts are never in the static cache.
- Service Worker accepts CDN origin only when the game has validated the release fingerprint.
- Audio byte-range requests use a cached HTTP 206 response, when present.

## Rollback

Remove `MU_CDN_ORIGIN` from Render Environment and deploy. The server automatically serves assets itself again. No Neon backup/restore is required: no player data is changed by this CDN configuration.

Cloudflare Workers Static Assets docs:
https://developers.cloudflare.com/workers/static-assets/
https://developers.cloudflare.com/workers/static-assets/headers/
https://developers.cloudflare.com/workers/wrangler/configuration/
