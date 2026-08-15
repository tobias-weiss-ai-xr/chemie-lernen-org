# Tasks: bloom-zpd-adaptive-engine

## 1. Schema & backfill

- [x] 1.1 Add `blooms_index` (int 1–6) to the `:LearningObjective` model in
      `lehrplan-curriculum` import/scripts; map `blooms_level` strings → index
      (remember=1 … create=6). **(done — BZ-11 merged)**
- [ ] 1.2 Write `scripts/backfill-bloom-index.mjs`: scan all `:LearningObjective`
      nodes, set `blooms_index` from `blooms_level`; dry-run + apply modes; scoped
      to the `chemie` KG subset. **(done)**
- [x] 1.3 Add `:ObjectiveState` label + relationships
      `(:ObjectiveState {userId, mastery, bloomsMaxReached, lastSeen, source,
  updatedAt})-[:FOR]->(:LearningObjective)` (scoped via CHEMIE_LABELS; added
      `ObjectiveState` to the subset filter).
- [ ] 1.4 Seed `:ObjectiveState` from existing quiz/exercise completion records
      where a (user, LO) link already exists.

## 2. ZPD engine service

- [x] 2.1 Create `api/services/zpd-engine.js` (public): `nextObjectiveInZPD(userId, pathSlug?)`
      implementing the Cypher sketch from design.md (ZPD band: prereqAvg ≥ θ_high,
      loMastery ≤ θ_low, one Bloom step).
- [x] 2.2 Implement `upsertObjectiveState(userId, objectiveSlug, {mastery, bloomLevel, source})`
      (merge `:ObjectiveState`, update `bloomsMaxReached`/`lastSeen`/`updatedAt`).
- [x] 2.3 Implement `recommendedStrategy(state)` activator returning
      `scaffold | peer | differentiate | tool | assess` per the design table.
- [x] 2.4 Make thresholds (θ_high=0.8, θ_low=0.6) configurable constants.

## 3. API routes

- [x] 3.1 `api/routes/zpd.js`: `POST /api/zpd/mastery` → calls upsert; returns
      updated state; auth required; validates input.
- [x] 3.2 `api/routes/learning-paths.js`: add `GET /api/learning-paths/:slug/next`
      → calls `nextObjectiveInZPD` + `recommendedStrategy`; auth required.
- [x] 3.3 Extend `GET /api/learning-paths/:slug` (and list) with a `nextInZPD`
      field computed via the engine. (detail route done; list pending)

## 4. Tests

- [x] 4.1 `tests/zpd-engine.test.mjs`: pure-function unit tests — `bloomIndex`
      mapping + `recommendedStrategy` classification (DB-free, CI-safe).
- [x] 4.2 `tests/learning-paths-next.test.mjs`: `/:slug/next` returns the
      highest-Bloom in-ZPD objective; respects `pathSlug` scope; 401 when anon.
      **(done — BZ-42 merged)**
- [x] 4.3 Backfill script test: idempotent, only touches `chemie` subset.
      **(done — BZ-43 merged)**

## 5. Spec sync & archive

- [ ] 5.1 Sync delta specs to `openspec/specs/learning-paths/spec.md` and
      `openspec/specs/lehrplan-curriculum/spec.md`; update SPECS_INDEX.md.
- [ ] 5.2 Archive the change after implementation is complete.

---

## Roadmap — ZPD deep dives (each spun off as its own OpenSpec change — all shipped)

These consume the engine above. Each is now a separate, validated OpenSpec change:

- [x] **R1 · Formative assessment unification** → `zpd-deepdive-formative-assessment`
- [x] **R2 · Scaffolding engine** → `zpd-deepdive-scaffolding`
- [x] **R3 · Peer collaboration** → `zpd-deepdive-peer-collaboration`
- [x] **R4 · Differentiation** → `zpd-deepdive-differentiation`
- [x] **R5 · Technology tool integration** → `zpd-deepdive-tech-integration`
