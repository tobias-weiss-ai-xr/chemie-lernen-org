# Spec: learning-paths

**Capability:** Structured curriculum-aligned learning paths with enrollment, progress tracking, completion certificates, and ZPD-aware next-step routing
**Owners:** Sisyphus

---

## MODIFIED Requirements

### Requirement: LP-ZPD-1 — ZPD-aware next objective (enhanced)

The system SHALL compute the next optimal learning objective for an enrolled
user as the **highest-Bloom objective currently inside the user's Zone of
Proximal Development (ZPD)**, using a unified learner-state model.

- An objective is _in ZPD_ when: its prerequisite objectives have average
  mastery `≥ θ_high` (default 0.8), the objective itself has mastery
  `≤ θ_low` (default 0.6), and its Bloom index is at most one step above the
  user's highest reached Bloom index.
- Mastery `m(user, LO) ∈ [0,1]` is stored on
  `(:User)-[:HAS_OBJECTIVE_STATE]->(:ObjectiveState)-[:FOR]->(:LearningObjective)`.
- The engine SHALL prefer the objective with the highest Bloom index among
  those in ZPD, breaking ties by curricular order.

#### Scenario: Next objective is the highest-Bloom in-ZPD item

- **WHEN** an enrolled user with solid prerequisites calls `GET /api/learning-paths/:slug/next`
- **THEN** the response `next.slug` is an objective in ZPD
- **AND** no in-ZPD objective with a higher `blooms_index` exists for that user

#### Scenario: Blocked objective is never recommended

- **WHEN** an objective's prerequisites are not yet mastered (`< θ_high`)
- **THEN** it is excluded from `next` (returned as `inZPD: false` or omitted)

#### Scenario: Thresholds can be overridden per-request

- **WHEN** `GET /api/zpd/next` is called with `?thetaHigh=0.75&thetaLow=0.55`
- **THEN** the ZPD computation uses 0.75 and 0.55 instead of the global defaults
- **AND** invalid or out-of-range values fall back to the global defaults

#### Scenario: Cold-start seeds mastery from existing history

- **WHEN** a user with quiz results but no `:ObjectiveState` records calls
  `GET /api/zpd/next`
- **THEN** the system aggregates mastery from quiz results and FSRS cards
- **AND** upserts `:ObjectiveState` records with `source: 'cold-start'`
- **AND** proceeds with the ZPD query using the seeded mastery values
- **AND** cold-start runs at most once per session for that user

### Requirement: LP-ZPD-2 — Strategy activator hook

For each `next` result the system SHALL return a `recommendedStrategy` from
`{ scaffold, peer, differentiate, tool, assess }` indicating which ZPD
classroom strategy applies, so downstream services can specialize behavior.

#### Scenario: Strategy reflects ZPD position

- **WHEN** the next objective has `mastery = 0` and solid prerequisites
- **THEN** `recommendedStrategy` is `scaffold` or `differentiate`
- **WHEN** `0.6 < mastery < 0.8`
- **THEN** `recommendedStrategy` is `assess`

### Requirement: LP-ZPD-3 — Mastery ingestion endpoint

The system SHALL provide `POST /api/zpd/mastery` (auth required) accepting
`{ objectiveSlug, mastery, bloomLevel, source }` and upserting the caller's
`:ObjectiveState` for that objective, updating `bloomsMaxReached`, `lastSeen`,
and `updatedAt`.

#### Scenario: Upsert is idempotent per user+objective

- **WHEN** the same user posts two mastery updates for the same objective
- **THEN** exactly one `:ObjectiveState` node exists for that (user, objective)
- **AND** `mastery` reflects the latest value

### Requirement: LP-ZPD-4 — Next field on path responses

The system SHALL include a `nextInZPD` object on `GET /api/learning-paths/:slug`
(and on the list endpoint when authenticated). The `nextInZPD` object SHALL contain
the computed next objective slug, its Bloom index, and the `recommendedStrategy`.

#### Scenario: Authenticated detail includes nextInZPD

- **WHEN** an enrolled user fetches path detail
- **THEN** the response contains `nextInZPD.next.slug` and `nextInZPD.recommendedStrategy`

### Requirement: LP-ZPD-5 — Threshold configuration endpoint

The system SHALL provide `GET /api/zpd/thresholds` (no auth required) returning
the current ZPD threshold defaults `{ thetaHigh, thetaLow }`.

#### Scenario: Read current thresholds

- **WHEN** a client calls `GET /api/zpd/thresholds`
- **THEN** the response is `{ thetaHigh: <number>, thetaLow: <number> }`
- **AND** no authentication is required

## ADDED Requirements

### Requirement: LP-ZPD-6 — Unified mastery aggregation

The system SHALL aggregate mastery evidence from multiple assessment sources
(auto-grader exercises, quiz results, FSRS spaced repetition) into a single
`mastery ∈ [0,1]` value per `(user, LearningObjective)`.

- Default weights: auto-grader = 0.40, quiz = 0.35, FSRS = 0.25.
- When a source has no data for a (user, LO) pair, its weight SHALL be
  redistributed proportionally to available sources.
- When all sources have no data, the aggregator SHALL return `null`.
- Weights SHALL be configurable via environment variables
  (`MASTERY_WEIGHT_AUTOGRADER`, `MASTERY_WEIGHT_QUIZ`, `MASTERY_WEIGHT_FSRS`).

#### Scenario: All three sources provide evidence

- **WHEN** a user has auto-grader correctness = 0.7 for an LO,
  quiz percentage = 0.8 for the LO's topic, and FSRS stability = 0.6
- **THEN** `mastery = 0.4*0.7 + 0.35*0.8 + 0.25*0.6 = 0.72`

#### Scenario: One source missing — weight redistributed

- **WHEN** auto-grader = 0.7, quiz = null, FSRS = 0.5
- **THEN** effective weights are 0.615 and 0.385 (proportional redistribution)
- **AND** `mastery = 0.615*0.7 + 0.385*0.5 ≈ 0.623`

#### Scenario: No evidence — returns null

- **WHEN** a user has no quiz results, no FSRS cards, and no graded answers
  for an objective
- **THEN** `aggregateMastery` returns `null`

### Requirement: LP-ZPD-7 — Auto-ingestion of mastery from assessments

The system SHALL automatically upsert mastery to the ZPD engine after
successful exercise grading and quiz result submission when the
`ENABLE_MASTERY_AUTO_INGEST` feature flag is `true`.

Failures in auto-ingestion MUST be logged but MUST NOT surface errors
to the user or block the grading/result response.
- The upsert source SHALL be `'auto-grader'` for exercise grades and
  `'quiz'` for quiz results.

#### Scenario: Exercise grade triggers auto-ingest

- **WHEN** `ENABLE_MASTERY_AUTO_INGEST=true`
- **AND** a user submits `POST /api/exercises/grade` successfully
- **THEN** the system computes aggregated mastery for the exercise's
  LearningObjective and upserts it via `upsertObjectiveState`

#### Scenario: Auto-ingest disabled — no upsert

- **WHEN** `ENABLE_MASTERY_AUTO_INGEST=false` (or unset)
- **AND** a user submits `POST /api/exercises/grade` successfully
- **THEN** no mastery upsert occurs
