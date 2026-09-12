# Spec: learning-paths

**Capability:** Structured curriculum-aligned learning paths with enrollment, progress tracking, completion certificates, and ZPD-aware next-step routing
**Owners:** Sisyphus

---

## ADDED Requirements

### Requirement: LP-ZPD-1 — ZPD-aware next objective

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
