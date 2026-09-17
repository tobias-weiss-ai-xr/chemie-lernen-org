# Spec: learning-paths

**Capability:** Structured curriculum-aligned learning paths with enrollment, progress tracking, completion certificates, ZPD-aware next-step routing, and scaffolding integration
**Owners:** Sisyphus

---

## ADDED Requirements

### Requirement: LP-SCAFFOLD-1 — Scaffolding hints endpoint

The system SHALL provide `GET /api/scaffolding/hints` (auth required) that
returns a Bloom-staircase scaffolding plan for a given learning objective.

#### Scenario: Retrieve scaffolding hints for an objective

- **WHEN** an authenticated user calls
  `GET /api/scaffolding/hints?objectiveSlug=stoffe-teilchen-lo-3`
- **THEN** the response is 200 with the scaffolding plan:
  `{objectiveSlug, targetBloom, learnerBloom, staircase, totalSteps, gap}`

#### Scenario: Missing objective returns 404

- **WHEN** the `objectiveSlug` does not match any `:LearningObjective`
  node (or has no `blooms_index`)
- **THEN** the response is 404

#### Scenario: Unauthenticated request returns 401

- **WHEN** an unauthenticated caller requests
  `GET /api/scaffolding/hints?objectiveSlug=...`
- **THEN** the response is 401

### Requirement: LP-SCAFFOLD-2 — Scaffolding service reads learner state

The scaffolding engine SHALL read the learner's current `bloomsMaxReached`
from their `:ObjectiveState` and the objective's `blooms_index` from
`:LearningObjective`, both scoped to the `chemie` KG subset.

#### Scenario: Cold-start learner (no ObjectiveState)

- **WHEN** no `:ObjectiveState` exists for the (user, objective) pair
- **THEN** `learnerBloom` defaults to `0` (full staircase from level 1 to
  target)
