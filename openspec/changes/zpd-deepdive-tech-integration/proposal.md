# Change Proposal: ZPD-aware Technology Tool Routing

## Why

The Bloom × ZPD adaptive engine (parent change `bloom-zpd-adaptive-engine`)
already returns `recommendedStrategy: "tool"` when the next objective is a
spatial/visual one whose Bloom level permits tool usage. However, this is
currently a bare string — no routing logic, no tool metadata, no
launch-context for the frontend.

chemie-lernen.org ships three categories of interactive technology tools:

- **3D visualizations** (`molekuel-studio`, orbital viewer, periodic table) —
  ideal for `remember`/`understand` Bloom levels where spatial models build
  mental scaffolds.
- **Calculators** (30+ stoichiometry/gas-law/pH/redox tools) — ideal for
  `apply`/`analyze` Bloom levels where quantitative problem-solving is the
  learning goal.
- **KI-Assistent** (LLM chat with RAG) — ideal for `evaluate`/`create` Bloom
  levels where open-ended reasoning and synthesis are required.

Without R5, the engine says "use a tool" but the platform cannot answer
_which_ tool or _how_ to launch it contextually. This change closes that gap
by introducing a **tool registry** and a **ZPD-aware tool router** that maps
objective metadata + Bloom level → concrete tool recommendation with
launch parameters.

## What Changes

- Add a **tool registry** mapping tool categories to Bloom-level bands and
  objective-type tags (spatial, quantitative, conceptual).
- Implement `resolveTool(objectiveSlug, bloomsIndex, objectiveTags?)` in a
  new `api/services/tool-router.js` — returns `{ toolId, toolType, launchUrl,
  rationale }`.
- Extend the `recommendedStrategy` activator condition for `tool`: replace the
  generic "spatial/visual objective & level allows" placeholder with actual
  Bloom-level + tag-based routing via the tool registry.
- Enrich `GET /api/learning-paths/:slug/next` (and `nextInZPD` fields) with
  a `toolRecommendation` object when strategy is `tool`.
- Add `GET /api/tools/:objectiveSlug` endpoint to fetch available tools for
  any objective (even outside ZPD flow) for editorial use.
- Rollback: if the router returns no match, the `tool` strategy falls back to
  `differentiate` with no disruption.

## Capabilities

### New Capabilities
- `tech-tool-routing`: Tool registry + ZPD-aware resolver that maps
  (Bloom level, objective tags) → concrete interactive tool recommendations
  with launch context.

### Modified Capabilities
- `learning-paths`: `nextInZPD` gains a `toolRecommendation` field when
  `recommendedStrategy = "tool"`. The `/:slug/next` endpoint includes
  tool launch data.

## Impact

- `api/services/tool-router.js` (new) — tool registry + resolver function.
- `api/services/zpd-engine.js` — import `resolveTool` and extend
  `recommendedStrategy` to populate `toolRecommendation`.
- `api/routes/learning-paths.js` — pass `toolRecommendation` through.
- `api/routes/tools.js` (new) — editorial tool-lookup endpoint.
- No change to private `chemie-core`.
- No new dependencies (pure JS, reuses `neo4j-driver` for optional KG
  objective-tag lookups).
