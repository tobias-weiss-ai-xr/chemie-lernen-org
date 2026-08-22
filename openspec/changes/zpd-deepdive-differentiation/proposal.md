# Change Proposal: zpd-deepdive-differentiation

## Why

The Bloom × ZPD adaptive engine (parent change: `bloom-zpd-adaptive-engine`) establishes a unified learner-state model and computes the next optimal learning objective. However, it assumes all learners should progress through the same Bloom levels to the maximum (level 6: create). 

In real classrooms, **differentiation** is a core ZPD classroom strategy: different learners have different cognitive targets. Some learners may be working towards **understanding** (Bloom level 2), while advanced learners aim for **create** (Bloom level 6). The current engine does not account for individual Bloom depth targets.

This deep dive (R4) implements **per-learner Bloom target depth** — allowing the adaptive engine to respect that different learners should stop at different cognitive levels. It also introduces **path variants** so that curriculum designers can create different versions of paths targeting specific Bloom depth ranges.

## What Changes

- **Learner Bloom target**: Each user has a configurable `targetBloomIndex` (1–6) stored in their learner profile. This represents the highest Bloom level they are expected to reach.
- **Bloom-depth-aware ZPD**: The `nextObjectiveInZPD` query filters out objectives whose `blooms_index` exceeds the learner's `targetBloomIndex`. This ensures learners are not routed to objectives beyond their target depth.
- **Path variants**: Learning paths can have multiple variants, each with a `targetBloomMax` property. When a user enrolls in a path, they can be assigned to a variant matching their target Bloom depth.
- **API extensions**: Add `GET /api/users/me/bloom-target` to retrieve/set a user's target Bloom depth, and extend path responses to include variant information.

### Relationship to Parent Change

This change consumes and extends the engine from `bloom-zpd-adaptive-engine`:
- Uses the existing `:ObjectiveState` model and `nextObjectiveInZPD` function
- Adds Bloom depth filtering as an additional constraint
- Does NOT modify the core ZPD math or learner-state model
- The `recommendedStrategy` hook may return `'differentiate'` more frequently when a learner's target is below the maximum available Bloom level

## Capabilities

### Modified Capabilities

- `learning-paths`: Paths gain variant support with `targetBloomMax`; path enrollment and next-objective computation respect per-learner `targetBloomIndex`.
- `gamification`: User profiles carry `targetBloomIndex`; defaults to 6 (create) for new users, can be customized per learner.

### New Capabilities

- `differentiation`: Per-learner Bloom target depth configuration and path variant assignment.

## Impact

- `api/services/zpd-engine.js` — extend `nextObjectiveInZPD` to accept `targetBloomIndex` parameter
- `api/services/zpd-engine.js` — add `getBloomTarget(userId)` function
- `api/routes/zpd.js` — add `GET /api/zpd/bloom-target` and `POST /api/zpd/bloom-target`
- `api/routes/learning-paths.js` — extend path detail with variant info and filter next objective by target Bloom
- `api/auth-db.js` — add `targetBloomIndex` to user profile schema
- Tests: extend `tests/zpd-engine.test.mjs` with Bloom depth filtering scenarios
- Neo4j: add `targetBloomMax` property to `:LearningPath` or `:PathVariant` nodes (TBD)

## Constraints

- Must NOT break existing `bloom-zpd-adaptive-engine` functionality
- Default behavior (no target set) must match current behavior (target = 6)
- Bloom depth filtering is an **additional constraint**, not a replacement for ZPD math
- All queries must use `subsetMatch()` to scope to chemie subset
