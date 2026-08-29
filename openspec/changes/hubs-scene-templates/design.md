# Design: hubs-scene-templates

## Aesthetic mandate (human architecture + composition)

Every scene is generated against the same compositional rules so the rooms feel
intentional, not arbitrary:

- **Golden ratio φ ≈ 1.618** for room envelope proportions:
  ceiling height `H = φ² m ≈ 2.618 m` (human scale), width `W = φ·H ≈ 4.23 m`,
  depth `D = φ·W ≈ 6.85 m`. Sub-divide the floor plan by cutting golden squares.
- **Golden-point focal placement**: the element "pedestal" (focal subject) sits
  on a golden point `(0.382·W, 0.382·D)` … `(0.618·W, 0.618·D)`, never dead-center.
- **Rule of thirds** (0.333 / 0.667) as the near-approximation when a strict grid
  is clearer; prefer true φ (0.382 / 0.618) for the focal anchor.
- **Fibonacci sizing ladder** `3,5,8,13,21,34,55,89,144,233` for pedestal height,
  signage size, tile spacing, column radii — adjacent rungs, never arbitrary.
- **Human scale**: all walkable surfaces, eye-level signage at ≈1.618 m,
  comfortable clearance.
- **Chemie palette**: primary `#1e63b3` (chemie-blue), accents per archetype
  (gold `#e0a82e`, teal `#1aa6a0`, ember `#e0531a`, bone `#f2efe6`),
  neutral floor `#d9d4c8`, sky gradient `#0b3d66 → #1e63b3`.

## Scene composition (per archetype)

Each scene = floor plane + perimeter walls/skybox + central golden-point
pedestal (with element symbol signage texture) + Fibonacci-arranged decorative
geometry (periodic-table tile wall, lab benches, columns, etc.) + soft ambient

- a key light from the rule-of-thirds upper corner.

| Archetype          | Distinguishing geometry                                       |
| ------------------ | ------------------------------------------------------------- |
| `ElementRoom`      | single central pedestal, chemie-blue, minimal                 |
| `PeriodicPavilion` | back wall of periodic-table tiles (Fibonacci grid), warm gold |
| `LabWing`          | bench rows (Fibonacci spacing) + instrument columns, teal     |
| `ExperimentalRoom` | central reaction vessel + radial safety ring, ember           |
| `Lobby`            | open welcoming volume, bone/light, low pedestal               |

## Technical approach

- **Generator**: `scripts/hubs-scenes/generate_scenes.py` — pure stdlib + Pillow
  (textures). Emits self-contained **GLB** (glTF 2.0) per archetype. No external
  glTF lib needed (raw JSON + binary chunk packing).
- **Geometry**: boxes (floor, walls, pedestals, benches) + planes (signage,
  tile wall, sky) with computed normals; PBR `pbrMetallicRoughness` materials;
  baseColorTexture from Pillow-rendered PNGs (element symbol, periodic grid).
- **Validation (no API token needed)**: load each GLB in `three`'s `GLTFLoader`
  on legion (`services/hubs` has `three`) to confirm it parses & has a scene.
- **Hosting**: copy GLBs to `reticulum/priv/static/scenes/<archetype>.glb` so
  reticulum can fetch `https://hubs.chemie-lernen.org/scenes/<archetype>.glb`
  (Traefik → reticulum static).
- **Create + assign (needs hub API token)**:
  `POST /api/v1/scenes` with `{"url": ...}` → scene sid;
  `hub` update with `scene_id` per room (mapped via `theme → archetype`).
  Spike one room first, then batch the 120.

## Mapping

`scripts/hubs-scenes/theme_map.py` holds `THEME_TO_ARCHETYPE` (44 themes → 5
archetypes). Tunable; reviewed after first visual pass.
