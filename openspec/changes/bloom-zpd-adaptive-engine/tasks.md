# Tasks: bloom-zpd-adaptive-engine

## 1. Schema & backfill

- [ ] 1.1 Add `blooms_index` (int 1–6) to the `:LearningObjective` model in
      `lehrplan-curriculum` import/scripts; map `blooms_level` strings → index
      (remember=1 … create=6).
- [ ] 1.2 Write `scripts/backfill-bloom-index.mjs`: scan all `:LearningObjective`
      nodes, set `blooms_index` from `blooms_level`; dry-run + apply modes; scoped
      to the `chemie` KG subset.
- [ ] 1.3 Add `:ObjectiveState` label + relationships
      `(:User)-[:HAS_OBJECTIVE_STATE]->(:ObjectiveState)-[:FOR]->(:LearningObjective)`
      with props `mastery`, `bloomsMaxReached`, `lastSeen`, `source`,
      `updatedAt` to the Neo4j schema (central-kg-architecture / lehrplan-curriculum).
- [ ] 1.4 Seed `:ObjectiveState` from existing quiz/exercise completion records
      where a (user, LO) link already exists.

## 2. ZPD engine service

- [ ] 2.1 Create `api/services/zpd-engine.js` (public): `nextObjectiveInZPD(userId, pathSlug?)`
      implementing the Cypher sketch from design.md (ZPD band: prereqAvg ≥ θ_high,
      loMastery ≤ θ_low, one Bloom step).
- [ ] 2.2 Implement `upsertObjectiveState(userId, objectiveSlug, {mastery, bloomLevel, source})`
      (merge `:ObjectiveState`, update `bloomsMaxReached`/`lastSeen`/`updatedAt`).
- [ ] 2.3 Implement `recommendedStrategy(state)` activator returning
      `scaffold | peer | differentiate | tool | assess` per the design table.
- [ ] 2.4 Make thresholds (θ_high=0.8, θ_low=0.6) configurable constants.

## 3. API routes

- [ ] 3.1 `api/routes/zpd.js`: `POST /api/zpd/mastery` → calls upsert; returns
      updated state; auth required; validates input.
- [ ] 3.2 `api/routes/learning-paths.js`: add `GET /api/learning-paths/:slug/next`
      → calls `nextObjectiveInZPD` + `recommendedStrategy`; auth required.
- [ ] 3.3 Extend `GET /api/learning-paths/:slug` (and list) with a `nextInZPD`
      field computed via the engine.

## 4. Tests

- [ ] 4.1 `tests/zpd-engine.test.mjs`: ZPD band logic (prereqOk / notDone /
      out-of-reach cases), `recommendedStrategy` mapping, mastery upsert merge.
- [ ] 4.2 `tests/learning-paths-next.test.mjs`: `/:slug/next` returns the
      highest-Bloom in-ZPD objective; respects `pathSlug` scope; 401 when anon.
- [ ] 4.3 Backfill script test: idempotent, only touches `chemie` subset.

## 5. Spec sync & archive

- [ ] 5.1 Sync delta specs to `openspec/specs/learning-paths/spec.md` and
      `openspec/specs/lehrplan-curriculum/spec.md`; update SPECS_INDEX.md.
- [ ] 5.2 Archive the change after implementation is complete.

---

## Roadmap — ZPD deep dives (separate future changes, NOT in this change)

These consume the engine above; each is its own OpenSpec change:

- **R1 · Formative assessment unification** — aggregate auto-grader + quiz + FSRS
  into one `mastery` signal; cold-start defaults; calibrate θ thresholds.
- **R2 · Scaffolding engine** — Bloom-staircase hint generation in Exercise
  Generator / feedback-engine (remember → create as `bloomsMaxReached` rises).
- **R3 · Peer collaboration** — ZPD-overlap learner matching via `collab-engine`
  - Hubs rooms (pair learners with similar next-in-ZPD objectives).
- **R4 · Differentiation** — per-learner path variants + per-learner Bloom target
  depth (some stop at _apply_, others reach _create_).
- **R5 · Technology tool integration** — ZPD-aware media/tool routing
  (3D `molekuel-studio`, calculator, `ki-assistent`) selected by Bloom level.
