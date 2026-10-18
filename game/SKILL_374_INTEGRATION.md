# Original MU Skill.zip integration (374 entries)

This update converts and indexes the user's original **Skill.zip**, not simulated effects.

| Original | Count | Browser format |
|---|---:|---|
| OZJ | 171 | WebP |
| OZT | 32 | WebP |
| JPG | 2 | WebP |
| BMD mesh/animation | 164 | WebGL .bin + .json (v10/v12 decrypted) |
| SMD mesh/animation | 2 | WebGL .bin + .json |
| skill.bmd table | 1 | BUX XOR-decrypted .bin |
| Directories | 2 | N/A |

Total 374 archive entries, 372 source data files; extracted pack has **542 browser files**, including index/metadata and animation data.

## One-time binary install
Put the file **skill-full-assets.zip** in **game/skill-full-assets.zip** in the repository.
The postinstall script calls `install-skill-assets.cjs` before generating its cache manifest.
It verifies the package and expands it into `game/public/assets/skill-full/`.

The GitHub connector cannot transmit a binary ZIP from this sandbox; thus **the archive is not included in this branch**. The runtime keeps existing MU native FX and fallback working until the archive is uploaded.

## Live behavior
`original-skill374.js` lazily loads mesh metadata/geometry/textures from the converted original source only for effects currently used. Original 12.23 GPU effects and 2.8.24 fallback remain available if models/textures are absent. Current 53 skills map to original models by effect type; 166 models are indexed in the pack (including animation-only models). Not all source assets are appropriate as direct attack effects (some are mount/pet/scene models).

Verify `window.MU_ORIGINAL_SKILL_FX.status === 'ready'` in the browser to confirm package availability and `playCount` after casting supported skills.

Data safety: This patch does not modify database schema, characters, accounts or saves. It does not alter skill damage or cooldown logic.

Conversion validation: all 205 textures decoded (duplicate injected JPEG headers and TGA headers handled), all 164 BMD meshes/animations decoded, 2 SMD imported, 1 BUX table retained and 542 output ZIP entries extracted successfully with the Node installer.
