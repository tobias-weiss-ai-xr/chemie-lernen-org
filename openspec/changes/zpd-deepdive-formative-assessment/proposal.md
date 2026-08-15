# Change Proposal: zpd-deepdive-formative-assessment

## Why

The Bloom × ZPD adaptive engine (change `bloom-zpd-adaptive-engine`) established
a unified learner-state model and the `POST /api/zpd/mastery` endpoint for
ingesting mastery signals. However, three critical gaps remain:

1. **Fragmented signal sources.** Mastery data lives in three separate stores —
   quiz results (users.json `quizResults[]`), exercise grades (Neo4j
   `(:GradedAnswer)` + session store), and FSRS cards (users.json
   `fsrsCards[]`) — with no aggregation logic. The current
   `POST /api/zpd/mastery` endpoint accepts raw mastery values, so each
   caller must compute its own score before posting. There is no single
   service that reads all three sources and produces one authoritative
   mastery value per `(user, LearningObjective)`.

2. **Cold-start blindness.** When a learner has no `:ObjectiveState` record,
   the engine assumes `mastery = 0.0`. For returning users who have quiz
   history or FSRS cards but never triggered a mastery upsert, the ZPD
   band is wrong — objectives they partially know are treated as
   completely unknown, producing suboptimal recommendations.

3. **No threshold calibration.** θ\_high = 0.8 and θ\_low = 0.6 are hard-coded
   starting values. Real learners may need per-cohort or per-curriculum
   adjustment. There is no endpoint to read or override thresholds, and
   no instrumentation to evaluate whether the defaults produce good ZPD
   placement.

This change (R1) is the first **ZPD deep dive**: it unifies the mastery
signal, solves cold-start, and makes thresholds configurable so subsequent
deep dives (R2 scaffolding, R3 peer, R4 differentiation, R5 tech tools)
operate on a reliable mastery foundation.

## What Changes

- **Mastery aggregation service** (`api/services/mastery-aggregator.js`):
  pure-function logic that reads quiz results, graded answers, and FSRS
  cards for a user, maps them to LearningObjective slugs, and computes a
  weighted mastery score per objective. Weights: auto-grader 0.4, quiz
  0.35, FSRS 0.25 (reflecting auto-grader's structured, Bloom-levelled
  assessment).

- **Cold-start resolver**: when `GET /api/zpd/next` encounters a user
  with zero `:ObjectiveState` records, it calls the aggregator to seed
  an initial mastery from existing quiz/FSRS history before running the
  ZPD query. This is an opt-in pre-check — no automatic bulk upsert.

- **Threshold configuration**: `ZPD_THRESHOLDS` in `zpd-engine.js` becomes
  overridable per-request via query params (`?thetaHigh=0.75`) on the
  `/api/zpd/next` endpoint. A new `GET /api/zpd/thresholds` endpoint
  returns the current defaults (for UI display / teacher calibration).

- **Auto-ingestion hooks** (lightweight): `POST /api/exercises/grade` and
  `PUT /api/quiz-results` gain an optional post-flight call to
  `upsertObjectiveState` via the mastery aggregator, so mastery updates
  happen automatically without every client calling `POST /api/zpd/mastery`
  manually. This is off by default (feature flag `ENABLE_MASTERY_AUTO_INGEST`).

### Explicitly OUT of scope

- Actual threshold _calibration_ (A/B testing, Bayesian optimisation) —
  that requires production usage data; this change only makes thresholds
  _configurable_.
- FSRS–Neo4j sync (persisting FSRS cards as KG nodes) — tracked separately.
- Changing the auto-grader or exercise-generator logic (private chemie-core).

## Capabilities

### Modified Capabilities

- `learning-paths`: mastery aggregator integration + cold-start pre-check
  on `/next` + threshold override support.
- `quiz`: auto-ingestion hook on quiz-result submission.

### Added Capabilities

- `mastery-aggregation`: new service + public functions for computing and
  reading unified mastery.

## Impact

- `api/services/mastery-aggregator.js` (new, public) — aggregation logic.
- `api/services/zpd-engine.js` — threshold per-request override; cold-start
  trigger.
- `api/routes/zpd.js` — `GET /api/zpd/thresholds`; optional `thetaHigh` /
  `thetaLow` query params on `/api/zpd/next`.
- `api/routes/exercises.js` — optional post-grade mastery upsert.
- `api/routes/quiz.js` — optional post-result mastery upsert.
- Tests: `tests/mastery-aggregator.test.mjs`, updates to
  `tests/zpd-engine.test.mjs`.
- No change to private `chemie-core` services.

## Rollback Plan

- Mastery aggregation is a read-only computation — it does not alter any
  existing data stores. Rollback: revert the route hooks (auto-ingest
  feature flag off) and remove the new service file. Cold-start and
  threshold overrides are additive; removing them falls back to the
  pre-R1 behaviour (θ = 0.8/0.6, cold = 0.0).
