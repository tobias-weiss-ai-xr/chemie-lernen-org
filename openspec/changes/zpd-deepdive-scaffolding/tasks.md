# Tasks: zpd-deepdive-scaffolding (R2)

## 1. Scaffolding engine service

- [ ] 1.1 Create `api/services/scaffolding-engine.js` (public): export
      `BLOOM_METADATA` (array of `{level, verb, descriptor, hintType}` per
      Bloom index 1–6).
- [ ] 1.2 Implement `computeStaircase(bloomsMaxReached, targetBloom)` pure
      function: returns array of steps from `bloomsMaxReached + 1` to
      `targetBloom`. Empty if `bloomsMaxReached >= targetBloom`. Truncate
      to max 5 steps.
- [ ] 1.3 Implement `scaffoldingPlan(userId, objectiveSlug)` async: reads
      `:ObjectiveState.bloomsMaxReached` and `:LearningObjective.blooms_index`
      from Neo4j (chemie subset, `subsetMatch`), then calls `computeStaircase`.
      Returns `{objectiveSlug, targetBloom, learnerBloom, staircase, totalSteps, gap}`
      or `null` if objective missing / no `blooms_index`.

## 2. API route

- [ ] 2.1 Create `api/routes/scaffolding.js`: `GET /api/scaffolding/hints`
      (query param `objectiveSlug`). Auth required. Returns scaffolding plan
      or 404. Register route in `api/server.js`.

## 3. Tests

- [ ] 3.1 `tests/scaffolding-engine.test.mjs`: DB-free unit tests:
  - `computeStaircase` — zero gap (empty), single step, multi-step,
    max-5 truncation, edge cases (invalid inputs, out-of-range).
  - `BLOOM_METADATA` — correct structure, 6 entries, all fields present.
  - Pure-function coverage for all branching in staircase logic.

## 4. Spec sync & archive

- [ ] 4.1 Verify delta specs pass `npx openspec validate
      zpd-deepdive-scaffolding`.
- [ ] 4.2 (Future) Archive after implementation is complete.
