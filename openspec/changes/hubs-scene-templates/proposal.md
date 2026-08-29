# Change Proposal: hubs-scene-templates

## Why

The 120 per-element Hubs learning rooms (`hubs.chemie-lernen.org`) were created
with only `name`/`description` — no `scene_id` — so they all fall back to the
instance-default Hubs scene. S40 / E1 of the roadmap requires giving each room a
themed scene that reflects its element.

`hello-webxr` (the existing Three.js experience) is **code**, not a Hubs scene.
Hubs scenes are **glTF 2.0 environments**. A faithful 3D rebuild would be weeks
of art work; the cost-benefit-sensible path (chosen by the user: "eigene
glTF-Scenes") is to **generate lightweight, on-brand glTF scenes** — 5 reusable
archetypes mapped to the element `theme` — and assign each room its archetype.

## What Changes

- Add 5 glTF 2.0 scene archetypes (GLB), each following human-architecture &
  aesthetic best practices (golden ratio φ≈1.618, rule-of-thirds / golden-point
  focal placement, Fibonacci sizing ladder, human scale ≈2.618 m ceiling = φ²),
  using the chemie palette.
- Map each of the 44 element `theme` values → one of the 5 archetypes.
- Create the 5 scenes in reticulum (`POST /api/v1/scenes`) and assign each of
  the 120 rooms its `scene_id` (`hub` update).

### Archetypes

| Archetype          | Palette               | Intended themes (examples)                                                                                             |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ElementRoom`      | chemie-blue signature | nuclear, research, medical, science, theoretical                                                                       |
| `PeriodicPavilion` | warm gold             | history, historical, precious, treasure, gem, skeleton, desert                                                         |
| `LabWing`          | teal/green            | technology, semiconductor, silicon, electronics, electric, energy, industry, aerospace, space, welding, forge, kitchen |
| `ExperimentalRoom` | orange/red            | experimental, toxic, biological, life, discovery, breath, swimming, liquid, fire, volcano, pyrotechnics                |
| `Lobby`            | light/inviting        | discovery, welcome-oriented                                                                                            |

(Mapping is a curated dict in the generator; tunable.)

## Impact

- `services/hubs` client: no change (scenes are reticulum assets).
- `chemie-raeume-manifest.json`: unchanged (scene assignment lives in reticulum).
- New: `scripts/hubs-scenes/` generator + generated GLBs (hosted for reticulum
  to fetch).
