# Change Proposal: bloom-zpd-adaptive-engine

## Why

chemie-lernen.org already models **Bloom's taxonomy** (`:LearningObjective`
carries `blooms_level`; the Exercise Generator scales difficulty via Bloom —
Design D3) and already ships the five **Zone-of-Proximal-Development (ZPD)**
classroom strategies as isolated components: formative assessment
(auto-grader / feedback-engine / quiz / FSRS), scaffolding (feedback-engine
hints), peer collaboration (`collab-engine`, Hubs), differentiation
(learning-paths), and technology integration (ki-assistent, calculators,
3D viz).

What is **missing** is the orchestration layer that turns these into a
coherent adaptive experience:

1. There is **no unified learner-state** `m(user, LO, bloomLevel)` — assessment,
   FSRS and quiz signals live in separate stores.
2. Prerequisites are **ordinal only** (curricular order), not mastery-gated, so
   the platform cannot tell whether an objective is _too easy_, _in ZPD_, or
   _too hard_ for a given learner.
3. Bloom is used **statically** (an LO has a level; an exercise is generated at
   a band) but never to _route_ the next optimal step.

This change introduces the **Bloom × ZPD adaptive engine**: a learner-state
model + ZPD computation + a `nextObjectiveInZPD` query + a lightweight
strategy activator that tells the caller _which_ of the five ZPD strategies to
apply next. It wires the existing components together without rebuilding them.

## What Changes

- **Bloom index**: add `blooms_index` (1–6) to `:LearningObjective` alongside
  `blooms_level`; backfill existing LOs.
- **Learner state**: `(:User)-[:HAS_OBJECTIVE_STATE]->(:ObjectiveState)-[:FOR]->(:LearningObjective)`
  recording `mastery ∈ [0,1]`, `bloomsMaxReached`, `lastSeen`, `source`.
- **ZPD computation**: an LO is _in ZPD_ when its prerequisites are solid
  (`avg prereq mastery ≥ θ_high`) and the LO itself is not yet mastered
  (`mastery ≤ θ_low`).
- **`nextObjectiveInZPD(userId, pathSlug?)`**: Cypher query returning the
  highest-Bloom LO currently in the learner's ZPD (Vygotsky's "sensitive next
  step"), tied to an enrolled path when given.
- **Strategy activator** (hook only): given ZPD position, return
  `recommendedStrategy ∈ { scaffold, peer, differentiate, tool, assess }` so
  future deep-dive changes know where to plug in.
- **Public API**: `GET /api/learning-paths/:slug/next` and
  `POST /api/zpd/mastery` (upsert ObjectiveState). Learning-paths list/detail
  gain a `nextInZPD` field.

### Explicitly OUT of scope (see Roadmap)

The five ZPD deep dives — actually _implementing_ each strategy's behavior —
are **not** in this change. This change only establishes the shared model,
the ZPD math, and the strategy hook. The deep dives are tracked as separate
future changes on the roadmap below.

## Capabilities

### Modified Capabilities

- `learning-paths`: gains ZPD-aware next-objective routing + the learner-state
  model and a `nextInZPD` field on path responses.
- `lehrplan-curriculum`: `:LearningObjective` gains `blooms_index` and a
  canonical 6-level Bloom enum; `:ObjectiveState` is added to the schema.

## Impact

- `api/routes/learning-paths.js` — add `/:slug/next`, extend list/detail with
  `nextInZPD`; add `api/routes/zpd.js` (`POST /api/zpd/mastery`).
- `api/services/zpd-engine.js` (public) — ZPD math + `nextObjectiveInZPD`
  query + strategy activator.
- `scripts/backfill-bloom-index.mjs` — populate `blooms_index` from
  `blooms_level`.
- Neo4j: add `blooms_index` property + `:ObjectiveState` label/relationships
  (scoped to the `chemie` subset).
- Tests: `tests/zpd-engine.test.mjs`, `tests/learning-paths-next.test.mjs`.
- No change to private `chemie-core` (auto-grader/feedback-engine) in this
  change; they will later _call_ `POST /api/zpd/mastery`.

## Roadmap — ZPD deep dives (separate future changes)

Each strategy below becomes its own OpenSpec change, consuming the engine
from this one:

- **R1 · Formative assessment unification** — single mastery signal aggregated
  from auto-grader + quiz + FSRS; cold-start handling; thresholds θ_high/θ_low
  tuning.
- **R2 · Scaffolding engine** — Bloom-staircase hint generation in the Exercise
  Generator / feedback-engine (remember → create as mastery rises).
- **R3 · Peer collaboration** — ZPD-matched learner grouping via `collab-engine`
  - Hubs rooms (pair learners with overlapping ZPD).
- **R4 · Differentiation** — per-learner path variants + per-learner Bloom
  target depth (some reach _apply_, some reach _create_).
- **R5 · Technology tool integration** — ZPD-aware media/tool routing
  (3D `molekuel-studio`, calculator, `ki-assistent`) selected by level.
