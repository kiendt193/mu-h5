# MU H5 Full 2.8 — Cloudflare Pages static CDN

This deployment is **static game assets only**. It does not host Node.js, accounts, API, or Neon.

## One-time Cloudflare setup (free)

1. Sign in at https://dash.cloudflare.com/ → **Workers & Pages**.
2. **Create application → Pages → Connect to Git**.
3. Choose GitHub repository **kiendt193/mu-h5** and production branch **main**.
4. Framework preset: **None**; project name can be **mu-h5-assets** if available.
5. Root directory: **repository root** (leave blank).
6. Build command: `node game/build-cloudflare-pages.cjs`
7. Build output directory: `cdn-dist`
8. Save & deploy. No API tokens, paid upgrade or environment variables are required for this static build.

The build checks Pages Free limits (20,000 files and 25 MiB per individual file). It creates `/mu/assets/*`, `/mu/cdn-check.json`, and CORS/cache headers automatically.

## Confirm it is live

Open `https://YOUR-PROJECT.pages.dev/mu/cdn-check.json`; ensure it returns `{"ok":true,"assetsRevision":"...","count":...,"bytes":...}`.

Do **not** guess the project URL from the name. Copy the exact Cloudflare Pages production URL shown in Cloudflare.

## Activate CDN after verification

On Render service `mu-h5-sg`, set a **single** environment variable:

```
MU_CDN_ORIGIN=https://YOUR-PROJECT.pages.dev
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

Cloudflare Pages docs:
https://developers.cloudflare.com/pages/get-started/git-integration/
https://developers.cloudflare.com/pages/configuration/build-configuration/
https://developers.cloudflare.com/pages/platform/limits/
