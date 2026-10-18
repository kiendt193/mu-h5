# MU H5 2.8 — Elf summon skills and MasterSkillTree source audit

## User-provided sources
- `Skill.txt`: Skill 30..36 are Elf (FE) monster-summon skills. Costs are 40, 70, 110, 160, 200, 250, and 350 MP.
- `Skill tieng viet.txt`: same summon ID range under Vietnamese labels. Encoding is partially damaged; English Skill.txt IDs are the authoritative matching keys, not the garbled strings.
- `SkillElect.hit`: 15,876-byte binary file, NOT UTF-8 text. Its role in hit/effect playback cannot be assumed until its original binary schema is available.
- `MasterSkillTree.txt`: 290 parsed nodes, three groups (64, 136, 90). Level cap per node is 20 (272 nodes) or 10 (18 nodes). Elf (FE) uses 77 nodes: groups 1/2/3 = 27/27/23.

## MasterSkillTree layout
Columns: Index, Group, Rank, MinLevel, MaxLevel, MainValue1..20, RelatedSkill, ReplaceSkill, RequireSkill1, RequireSkill2, DW, DK, FE, MG, DL, SU, RF.
Use node ID as stable key; prerequisites refer to other node IDs, not display labels. FE is the 3rd class selector after DW and DK. The 20 MainValue fields encode the exact value at each invested point; do not approximate by multiplying level 1 values.

## Planned server-side master skills (not activated by this change)
1. Parse all 290 nodes with validation of 36 columns and prerequisite graph.
2. Master EXP and master points need their own progression state, separate from base level cap 400. Never auto-grant speculative points to existing characters.
3. Server validates class, level, node rank, prerequisites, points available, MaxLevel and unlocks.
4. Effect mapping: RelatedSkill and ReplaceSkill refer to base skill indices. Do not activate any modifier without a verified formula/rule.
5. Persist master skill points, levels, and revisions in Neon state; expose class-filtered tree to UI.
6. Keep master skill UI accessible on mobile, with reset/refund after economy rules are specified.

## Elf summon first rollout
Server-authoritative Elf summoned ally is separate from inventory pets and Dark Raven. Initial skills use original spawned monster resource IDs when available. Damage is attributed to the summoner, uses normal monster eligibility, visibility, safe area and geometry rules.
For any summon lacking a matching source monster mesh, cast is disabled instead of fabricating a character. The original binary `SkillElect.hit` is NOT executed and no arbitrary executable data is uploaded to hosting.
The current summon panel is a first-stage accessible control; learning scroll/books, animation-specific FX, persistence and master buffs should be implemented after asset and gameplay verification.

## Original 2.8 spawn-resource audit (2026-10-18)
Matching exact spawn monster names:
- Summon Goblin (30) -> Goblin sourceId 26: found.
- Summon Stone Golem (31) -> Stone Golem sourceId 32: found.
- Summon Assassin (32) -> Assassin sourceId 21: found.
- Summon Elite Yeti (33) -> Elite Yeti sourceId 20: found.
- Summon Dark Knight (34), Bali (35) and Soldier (36): no **exact matching summon creature** in existing spawn table. The UI must disable these rather than invent a different monster model; request the three original creature assets when available.
- Node identifiers 30..36 are not directly referenced in FE MasterSkillTree RelatedSkill / ReplaceSkill columns; summon master upgrades therefore require additional effects/source metadata rather than guessing numerical buffs.

## Test & operations
- Fake data unit smoke checked MP consumption of skill 30 (40), attack damage, and restoration from saved last summon ID.
- Real Render/Neon integration is deployed separately and must be checked against the latest commit. No account or character data is reset.
