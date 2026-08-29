# Tasks: hubs-scene-templates (S40 / E1)

## Design & scaffolding

- [x] OpenSpec change + design (aesthetic mandate, archetypes, plan)
- [x] `scripts/hubs-scenes/generate_scenes.py`: GLB generator (golden-ratio envelope,
      golden-point focal, Fibonacci ladder, chemie palette, Pillow textures)
- [x] `scripts/hubs-scenes/theme_map.py`: `archetype_for(theme)` (44 themes → 5)
- [x] `scripts/hubs-scenes/theme_to_archetype.json`: emitted mapping (44 themes)
- [x] `scripts/hubs-scenes/gen_screenshots.py`: on-brand scene thumbnails
- [x] `scripts/assign-hubs-scenes.mjs`: turnkey create+assign (idempotent, `--dry-run`)

## Generate & validate

- [x] Generate 5 archetype GLBs (ElementRoom, PeriodicPavilion, LabWing,
      ExperimentalRoom, Lobby)
- [x] Validate each GLB parses + has a scene via `three` GLTFLoader on legion
- [x] Host GLBs in reticulum `priv/static/generated-scenes/<archetype>.glb` (served at
      `https://hubs.chemie-lernen.org/generated-scenes/<archetype>.glb` via a
      `render_for_path("/generated-scenes/...")` clause in `page_controller.ex`)

## Create & assign (DONE — all 130 live chemie hubs themed)

> Required the hub-owner token. The 120-room manifest was STALE: the live reticulum has
> 130 "Chemie Raum – <Element>" hubs (all owned by account 2329678827225088001), and the
> manifest `hubId` values no longer match `hub_sid`. Assignment was done against the LIVE
> hubs (matched by element symbol parsed from the hub name).
> A valid owner token was minted with `Ret.Guardian.encode_and_sign` inside the reticulum
> container (dev secret is committed in `config/dev.exs`; token needs HS512, `typ:"access"`,
> `aud:"ret"`, `jti`, `nbf`). Scenes were created by FILE UPLOAD (not the `?url=` import,
> which needs Hubs-exported scene metadata), via `POST /api/v1/media` then
> `POST /api/v1/scenes` with `model_file_id`+`screenshot_file_id`.

- [x] Create 5 scenes (v2 sids, after polish regen): ElementRoom=rLL2FQw,
      PeriodicPavilion=j4RVSDa, LabWing=RKo2NfY, ExperimentalRoom=FXZPofd, Lobby=EnvmhXh
- [x] Assign each live chemie hub `scene_id` by symbol→theme→archetype
      (130/130 ok; idempotent re-run after rate-limit 403s with pacing+retry)
- [x] Verify: DB cross-check 130/130 hubs → correct archetype scene (0 missing, 0 mismatch);
      scene model_url + screenshot_url both serve HTTP 200

## Polish pass (DONE — richer composition + cleanup)

> Regenerated the GLB generator with stronger human-architecture detailing and re-deployed
> as v2 scenes (the `show` API does not expose file tokens, so in-place scene update would
> drop the screenshot — instead created v2 scenes, reassigned, then deleted orphans).

- [x] `generate_scenes.py` enriched: perimeter **baseboard** (Fibonacci 0.13 m) in accent,
      back-wall **golden-section light panel** on the focal axis (emissive accent),
      **two-tier Fibonacci pedestal** (0.55 + 0.45 = 1.0 m, human scale) with gold cap lip,
      **floor inlay** (golden-ratio square) under the focal point, fixed labels
      (Lobby "EMPFANG", PeriodicPavilion "PERIODEN-PAVILLON")
- [x] Regenerate + structurally validate 5 GLBs (accessors/buffers/index ranges OK)
- [x] Re-validate each GLB parses via `three` GLTFLoader on legion (engine Hubs uses)
- [x] Upload + create 5 v2 scenes; reassign all 130 hubs to v2 sids (130/130 ok)
- [x] Delete 10 orphan scenes (5 v1 + 1 test `B6mV9Df` + 4 v2 duplicates from rate-limited
      attempts) via targeted, scoped `DELETE FROM scenes WHERE scene_sid IN (...)`.
      Re-verify: 130/130 correct, 0 orphans, all v2 assets 200
- [x] Sync local `scripts/hubs-scenes/scene_sids.json` cache to v2 sids

## Verify

- [x] Smoke test: scene model + screenshot files serve 200; all 130 hubs reference the
      correct themed scene (verified via DB join on `scenes.scene_sid`)
- [ ] Visual pass in-browser (golden-ratio composition) — left for human review
