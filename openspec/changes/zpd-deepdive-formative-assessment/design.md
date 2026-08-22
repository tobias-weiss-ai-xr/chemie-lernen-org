# Design: zpd-deepdive-formative-assessment

## Problem

Three independent assessment subsystems (quiz, auto-grader exercises, FSRS
spaced repetition) each generate evidence of learner mastery, but nothing
combines that evidence into the single `mastery ∈ [0,1]` value the ZPD engine
expects. The current `POST /api/zpd/mastery` endpoint is a dumb write — it
accepts whatever the caller provides with no validation against historical
signals.

## Model — Unified mastery signal

### Signal sources

| Source             | Where stored                     | Evidence per (user, LO)                         |
| ------------------ | -------------------------------- | ----------------------------------------------- |
| Auto-grader        | Neo4j `(:GradedAnswer)` + session | `{correct, score, difficulty, gradedBy, loSlug}` |
| Quiz               | users.json `quizResults[]`        | `{topic, score, total, percentage, timestamp}` |
| FSRS               | users.json `fsrsCards[]`          | `{topicId, stability, difficulty, reps, due}` |

Each source maps to a **local signal** `m_i ∈ [0,1]` for a given objective:

```
m_autoGrader  = avg(correctness of last N graded answers for the LO)
m_quiz        = map(quiz percentage for the LO's topic → [0,1])
m_fsrs        = map(FSRS stability / ease for the LO's topic → [0,1])
```

### Weighted aggregation

The unified mastery is a weighted mean:

```
mastery = w_ag * m_autoGrader + w_quiz * m_quiz + w_fsrs * m_fsrs
```

Default weights (reflecting assessment quality and Bloom alignment):

| Source      | Weight | Rationale                                                        |
| ----------- | ------ | ---------------------------------------------------------------- |
| auto-grader | 0.40   | Structured, Bloom-levelled, deterministic or AI-graded           |
| quiz        | 0.35   | Topic-level percentage, well-tested, but not LO-specific        |
| FSRS        | 0.25   | Spaced repetition evidence; high stability → high mastery signal |

Weights are configurable via `MASTERY_WEIGHTS` env vars:
`MASTERY_WEIGHT_AUTOGRADER`, `MASTERY_WEIGHT_QUIZ`, `MASTERY_WEIGHT_FSRS`
(each 0–1, must sum ≤ 1.0; unset sources default to 0).

### Missing-source handling

When a source has no data for the (user, LO) pair:

- If **one** source is missing, redistribute its weight proportionally
  to the other two.
- If **two** sources are missing, use the remaining source directly.
- If **all three** are missing, return `null` (no evidence → cold-start).

Example: auto-grader = 0.7, quiz = null, FSRS = 0.5:
```
effective: w_ag = 0.4/(0.4+0.25) = 0.615, w_fsrs = 0.25/(0.4+0.25) = 0.385
mastery = 0.615 * 0.7 + 0.385 * 0.5 = 0.623
```

## Cold-start resolution

### When cold-start fires

`GET /api/zpd/next` checks whether the user has **any** `:ObjectiveState`
records. If zero, it triggers a cold-start resolution before the ZPD query:

1. Read the user's quiz results and FSRS cards from users.json.
2. Map quiz topics and FSRS topicIds to `:LearningObjective` slugs via
   Neo4j (Topic → SubTopic → FULFILLS → LearningObjective).
3. Compute aggregated mastery per objective using the mastery aggregator.
4. Upsert `:ObjectiveState` for each objective with evidence (`source:
   'cold-start'`).
5. Proceed with the normal `nextObjectiveInZPD` query.

### Performance constraint

Cold-start runs at most **once per session** (cached in a transient
per-user flag on the server). For a user with <50 quiz results and <100
FSRS cards, the resolution must complete in <2s.

### Opt-out

If the aggregator returns no evidence for a user (no quiz, no FSRS, no
graded answers), cold-start is skipped and the user gets default
mastery = 0.0 for all objectives (same as pre-R1 behaviour).

## Threshold configuration

### Per-request override

`GET /api/zpd/next` accepts optional query parameters:

```
GET /api/zpd/next?path=<slug>&thetaHigh=0.75&thetaLow=0.55
```

These override the global `ZPD_THRESHOLDS` for that single request. Values
are clamped: `0.5 ≤ thetaHigh ≤ 1.0`, `0.2 ≤ thetaLow ≤ thetaHigh - 0.1`.
Invalid values fall back to the global default.

### Read defaults endpoint

```
GET /api/zpd/thresholds
```

Returns:

```json
{ "thetaHigh": 0.8, "thetaLow": 0.6 }
```

No auth required (public — teachers/students need to see the defaults).

## Auto-ingestion hooks

### Feature flag

`ENABLE_MASTERY_AUTO_INGEST=true` (default: `false`). When enabled, the
exercise-grade and quiz-result handlers automatically upsert mastery to
the ZPD engine after a successful grade/result.

### Exercise grading hook

After `POST /api/exercises/grade` returns successfully:

1. Extract the objective slug from the exercise metadata.
2. Call `aggregateMastery(userId, objectiveSlug)`.
3. If the aggregated mastery is non-null, call
   `upsertObjectiveState(userId, objectiveSlug, { mastery, source: 'auto-grader' })`.

### Quiz result hook

After `PUT /api/quiz-results` saves successfully:

1. Map the quiz topic to LearningObjective slugs (same mapping as
   cold-start).
2. For each matched LO, call `aggregateMastery(userId, loSlug)`.
3. Upsert with `source: 'quiz'`.

### Failure mode

Auto-ingestion failures are **logged but never surface** to the user.
Exercise grading and quiz submission succeed regardless of whether the
mastery upsert worked.

## Component wiring

```
quiz-results → [auto-ingest] → mastery-aggregator → zpd-engine.upsertObjectiveState
exercise-grade → [auto-ingest] → mastery-aggregator → zpd-engine.upsertObjectiveState
                                                    ↓
GET /zpd/next → [cold-start?] → mastery-aggregator → zpd-engine.upsertObjectiveState
                                    ↓
GET /zpd/next → [thresholds] → zpd-engine.nextObjectiveInZPD → strategy activator
```

## API contract additions

### `GET /api/zpd/thresholds`

```json
{ "thetaHigh": 0.8, "thetaLow": 0.6 }
```

### `GET /api/zpd/next` (enhanced query params)

```
GET /api/zpd/next?path=<slug>&thetaHigh=0.75&thetaLow=0.55
```

Same response shape as before; thresholds are request-scoped.

### `POST /api/zpd/mastery` (unchanged)

No changes — external callers can still post raw mastery values directly.

## Tests

### `tests/mastery-aggregator.test.mjs`

Pure-function unit tests (DB-free, mock users.json):

- `aggregateMastery` with all three sources present
- `aggregateMastery` with one/two missing sources (weight redistribution)
- `aggregateMastery` with zero evidence (returns null)
- Edge cases: empty arrays, NaN scores, scores > 1
- Weight configuration from env vars

### Updates to `tests/zpd-engine.test.mjs`

- Threshold clamping tests (out-of-range → default)
- Cold-start trigger logic (mocked)
