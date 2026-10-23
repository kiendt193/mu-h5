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
8. Build system version: **v3**, Node.js **22.16.0** (root `.node-version` pins this).
9. Save & deploy. No API tokens, paid upgrade or environment variables are required for this static build.

## Build error troubleshooting

To inspect the exact error: **Workers & Pages → your Pages project → Deployments → View details → Build log**.

| Message or symptom | Resolution |
| --- | --- |
| `Cannot find module .../build-cloudflare-pages.cjs` | Root directory is wrong. Leave it empty (Git repository root). Command: `node game/build-cloudflare-pages.cjs`. |
| `Missing game/public/assets` | Git checkout has no assets or Root directory is wrong. Ensure `game/public/assets` is tracked on `main`. |
| `node:fs`, `fs.cpSync is not a function` | Set Build system **v3** and Node 22.16.0 (or `NODE_VERSION=22.16.0`). |
| `20,000 file limit exceeded` | Pages Free cannot hold all files; split assets across Pages/R2, do not purchase a plan without assessing options. |
| `25 MiB/file limit` | Large JSON files are now automatically GZIP-packed by the build script. If a non-JSON file exceeds 25 MiB, use R2 for that individual file; if JSON is still over 25 MiB after compression, split it or use R2. |
| Build succeeds but deployment fails | Open the upload/deploy portion of the same build log; investigate Pages limits or account errors. |

On a normal build the log prints `[MU-CDN] Found ... public game asset files` and later `[MU-CDN] Build ready`. If those lines are absent, the failure occurs before our script is executed (Git connection, Node toolchain, or build command).

Do **not** select **Workers** to deploy this static CDN. Use **Pages** from the Workers & Pages section.

The build checks Pages Free limits (20,000 files and 25 MiB per individual file). Oversized **JSON** resources, including `assets/mu05/manifest.json`, are losslessly GZIP-compressed into `.json.mucdn` files below 25 MiB. The game automatically decompresses them; the source JSON remains unchanged in GitHub and on Render. It creates `/mu/assets/*`, `/mu/cdn-check.json`, and CORS/cache headers automatically.

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
