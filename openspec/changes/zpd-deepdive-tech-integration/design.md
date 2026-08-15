# Design: ZPD-aware Technology Tool Routing

## Context

The Bloom × ZPD adaptive engine (`bloom-zpd-adaptive-engine` parent change)
already computes the learner's next-in-ZPD objective and returns a
`recommendedStrategy` field from `{ scaffold, peer, differentiate, tool,
assess }`. The `tool` strategy currently triggers on a vague heuristic
("spatial/visual objective & level allows") and returns no tool metadata.

The platform already ships three categories of interactive tools:

| Category | Examples | Best Bloom band | Skill focus |
|----------|----------|-----------------|-------------|
| **3D visualization** | `molekuel-studio`, orbital viewer, periodic table | 2–4 (understand → analyze) | Spatial/structural understanding |
| **Calculator** | 30+ stoichiometry, gas-law, pH, redox tools | 3–5 (apply → evaluate) | Quantitative problem-solving |
| **AI assistant** | KI-Assistent (LLM chat + RAG) | 4–6 (analyze → create) | Open-ended reasoning, synthesis |

These tools are loaded via `LazyLoader` and served as Hugo pages. They
already exist and work — R5 only adds the routing intelligence.

## Goals / Non-Goals

**Goals:**
- Replace the generic `tool` strategy condition with a concrete resolver
  based on Bloom level + objective tags.
- Return actionable tool metadata (`toolId`, `toolType`, `launchUrl`,
  `rationale`) when `tool` is selected.
- Provide an editorial endpoint for content authors to preview tool matches.
- Keep the tool registry as a static JS object (no DB round-trip for
  routing decisions).

**Non-Goals:**
- Modifying existing tool internals (molekuel-studio, calculators,
  ki-assistent code stays untouched).
- Building new tools (R5 only routes to existing ones).
- Personalization beyond Bloom level (e.g., user preference history — future
  enhancement).
- Changing the ZPD math or learner-state model (owned by parent engine).

## Decisions

### 1. Static registry vs. Neo4j-backed tool metadata

**Decision:** Static JS object in `api/services/tool-router.js`.

**Rationale:** The tool set is small (< 10 canonical tools), changes
infrequently (only when a new tool page is added to Hugo), and requires no
per-user personalization in this iteration. A static registry avoids a DB
query on every ZPD call. The registry can be migrated to Neo4j later if
tools grow or need per-learner preference ranking.

**Alternative considered:** Store tools as `(:Tool)` nodes with `[:SUITABLE_FOR]`
relationships to `(:LearningObjective)` — too heavy for < 10 entries; would
require a new import pipeline.

### 2. Objective tags as strings, not a new graph property

**Decision:** Use a convention-based tag mapping from objective metadata
already in the KG (e.g., `blooms_level`, topic/subtopic context, description
keywords). Tags are passed as an optional array to `resolveTool()`.

**Rationale:** Learning objectives don't currently carry explicit "spatial" or
"quantitative" tags. Adding KG properties is an R1/R4 concern (objective
metadata enrichment). For now, tags are inferred by the caller (API route)
from the objective's context (subtopic = "Aufbau der Materie" → `spatial`,
subtopic = "Stöchiometrie" → `quantitative`) and passed through.

**Alternative considered:** Add `tool_tags` to `:LearningObjective` in this
change — rejected because it crosses into the curriculum import pipeline
owned by `lehrplan-curriculum`.

### 3. Fallback to `differentiate` when resolver returns null

**Decision:** If `resolveTool()` returns `null`, the strategy activator
falls back to `differentiate` (the default in the parent engine's table).

**Rationale:** The engine must always return a strategy. `differentiate` is the
safest fallback — it covers the "let the learner continue on their adapted
path" case regardless of tool availability.

### 4. Ranking algorithm for overlapping tools

**Decision:** When multiple tools match the Bloom band + tags, rank by tag
affinity (tool type matching the primary objective tag) → highest Bloom
ceiling → first in registry order.

**Rationale:** Simple, deterministic, testable. More sophisticated ranking
(user history, effectiveness data) is deferred.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Tag inference from subtopic is fragile (not all subtopics map cleanly to `spatial`/`quantitative`) | Tags are optional — when absent, the resolver uses only Bloom level, which still gives a valid match. |
| Static registry gets stale when new tools are added to Hugo | The editorial endpoint (`GET /api/tools`) returns the full registry — content authors can verify coverage. A CI check can flag content pages with tools not in the registry. |
| Bloom-band boundaries are arbitrary (3D viz at 2–4, calculators at 3–5) | Bands are configurable constants in the registry. R1 (assessment unification) will gather effectiveness data to recalibrate. |
| Tool router adds a dependency to `zpd-engine.js` | The router is a pure-function module with zero side effects — easy to mock in tests, no coupling risk. |

## Data flow

```
Client                         API                              Tool Router
  |                              |                                  |
  |-- GET /lp/:slug/next ------->|                                  |
  |                              |-- nextObjectiveInZPD() --------->|  (Neo4j)
  |                              |<-- { slug, bloom, prereqAvg } --|
  |                              |                                  |
  |                              |-- resolveTool(bloom, tags?) ---->|
  |                              |<-- { toolId, launchUrl } -------|
  |                              |                                  |
  |                              |-- recommendedStrategy() --------->|
  |                              |<-- { strategy: 'tool',           |
  |                              |      toolRecommendation } -------|
  |<-- { next, strategy, tool }--|                                  |
```

## Registry schema

```javascript
const TOOL_REGISTRY = [
  {
    toolId: 'molekuel-studio',
    toolType: 'visualization',
    bloomRange: [2, 4],       // understand → analyze
    objectiveTags: ['spatial', 'structural'],
    launchUrl: '/molekuel-studio/',
    description: '3D molecule viewer for spatial understanding of molecular structures',
  },
  {
    toolId: 'perioden-system',
    toolType: 'visualization',
    bloomRange: [1, 2],       // remember → understand
    objectiveTags: ['spatial', 'structural'],
    launchUrl: '/perioden-system-der-elemente/',
    description: 'Interactive periodic table for element exploration and classification',
  },
  {
    toolId: 'stoichiometry-calculator',
    toolType: 'calculator',
    bloomRange: [3, 5],       // apply → evaluate
    objectiveTags: ['quantitative', 'reaction'],
    launchUrl: '/stoichiometrie-rechner/',
    description: 'Stoichiometry calculator for quantitative reaction analysis',
  },
  {
    toolId: 'ki-assistent',
    toolType: 'ai-assistant',
    bloomRange: [4, 6],       // analyze → create
    objectiveTags: ['conceptual', 'synthesis', 'evaluation'],
    launchUrl: '/ki-assistent/',
    description: 'AI chat assistant for open-ended chemistry reasoning and synthesis',
  },
];
```

## Open Questions

- Should the tool registry eventually be editable via API (admin endpoint)?
  Deferred — not needed until tool count exceeds ~15.
- Should tool usage telemetry feed back into ranking? Deferred to R1
  (assessment unification will have mastery-correlation data).
