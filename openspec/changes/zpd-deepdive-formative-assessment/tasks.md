# Tasks: zpd-deepdive-formative-assessment

## 1. Mastery aggregation service

- [ ] 1.1 Create `api/services/mastery-aggregator.js` (public):
      `aggregateMastery(userId, objectiveSlug, { quizResults, fsrsCards,
      gradedAnswers, weights })` — computes weighted mastery from up to
      three signal sources. Return `null` when no evidence exists.
- [ ] 1.2 Implement signal extraction helpers:
      `quizSignal(quizResults, topic, objectiveSlug)` maps quiz percentage
      to [0,1]; `fsrsSignal(fsrsCards, topicId)` maps FSRS stability/ease
      to [0,1]; `autoGraderSignal(gradedAnswers, loSlug)` averages
      correctness of recent answers.
- [ ] 1.3 Implement missing-source weight redistribution: when one or two
      sources return `null`, redistribute their weights proportionally.
- [ ] 1.4 Make weights configurable via env vars
      (`MASTERY_WEIGHT_AUTOGRADER`, `MASTERY_WEIGHT_QUIZ`,
      `MASTERY_WEIGHT_FSRS`). Defaults: 0.40, 0.35, 0.25. Validate sum ≤ 1.0.
- [ ] 1.5 Add `mapTopicToObjectives(topic)` helper: given a quiz topic or
      FSRS topicId, resolve to `:LearningObjective` slugs via
      `Topic/SubTopic/FULFILLS` chain in Neo4j (scoped via `subsetMatch`).

## 2. Cold-start resolution

- [ ] 2.1 In `api/routes/zpd.js` `GET /api/zpd/next`: before calling
      `nextObjectiveInZPD`, check whether the user has any
      `:ObjectiveState` records. If zero, trigger cold-start.
- [ ] 2.2 Cold-start logic: read user's quiz results and FSRS cards,
      map topics to LO slugs, compute aggregated mastery, upsert
      `:ObjectiveState` records with `source: 'cold-start'`.
- [ ] 2.3 Add per-session cache: cold-start runs at most once per server
      process per userId (use a `Set` or `Map` with TTL).
- [ ] 2.4 Performance guard: if user has >50 quiz results or >100 FSRS
      cards, batch the Neo4j topic→LO mapping queries.

## 3. Threshold configuration

- [ ] 3.1 Modify `GET /api/zpd/next` to accept optional `thetaHigh` /
      `thetaLow` query params. Clamp values to valid ranges; invalid →
      fallback to global defaults.
- [ ] 3.2 Add `GET /api/zpd/thresholds` (no auth) returning current
      `{ thetaHigh, thetaLow }`.

## 4. Auto-ingestion hooks

- [ ] 4.1 In `api/routes/exercises.js` `POST /api/exercises/grade`:
      after successful grading, if `ENABLE_MASTERY_AUTO_INGEST=true`,
      extract objective slug, compute aggregated mastery, and upsert
      via `upsertObjectiveState`. Failures logged, not surfaced.
- [ ] 4.2 In `api/routes/quiz.js` `PUT /api/quiz-results`: after saving,
      if flag enabled, map quiz topic to LO slugs, aggregate, upsert.
- [ ] 4.3 Add integration tests: mock `ENABLE_MASTERY_AUTO_INGEST=true`,
      verify mastery upsert is called on grade/result.

## 5. Tests

- [ ] 5.1 `tests/mastery-aggregator.test.mjs`: pure-function tests for
      `aggregateMastery` — all three sources, missing sources (weight
      redistribution), zero evidence, edge cases (NaN, >1, empty arrays),
      env-var weight configuration.
- [ ] 5.2 Update `tests/zpd-engine.test.mjs`: threshold clamping tests,
      cold-start trigger logic (mocked aggregator).
- [ ] 5.3 Auto-ingestion hook tests: verify exercise-grade and quiz-result
      routes call `upsertObjectiveState` when flag is on; no call when off.

## 6. Spec sync & archive

- [ ] 6.1 Sync delta specs to `openspec/specs/learning-paths/spec.md` and
      `openspec/specs/quiz/spec.md`; update SPECS_INDEX.md.
- [ ] 6.2 Archive the change after implementation is complete.
