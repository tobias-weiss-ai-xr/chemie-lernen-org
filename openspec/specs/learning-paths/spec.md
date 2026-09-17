# Learning Paths

## Overview

Learning paths provide structured curriculum progression through Neo4j-stored paths with prerequisites, XP rewards, achievement badges, and PDF certificates.

## API Endpoints

| Method | Route                                   | Auth     | Description                                        |
| ------ | --------------------------------------- | -------- | -------------------------------------------------- |
| `GET`  | `/api/learning-paths`                   | Optional | All available curriculum paths with progress       |
| `GET`  | `/api/learning-paths/:slug`             | Required | Full tree with objectives, prerequisites, progress |
| `POST` | `/api/learning-paths/:slug/certificate` | Required | Download completion certificate (PDF)              |
| `GET`  | `/api/gamification/profile`             | Required | User XP, level, streak, badges                     |
| `GET`  | `/api/gamification/badges`              | Required | All badges with unlock status                      |
| `POST` | `/api/gamification/checkin`             | Required | Daily check-in, returns streak info                |

## Neo4j Schema

```cypher
(:Curriculum {slug, title, grade, description})
  -[:HAS_TOPIC]->(:Topic {slug, title, order})
    -[:HAS_SUBTOPIC]->(:SubTopic {slug, title, order})
      -[:HAS_OBJECTIVE]->(:LearningObjective {slug, description, bloomLevel, estimatedMinutes})
(:LearningObjective)-[:PREREQUISITE]->(:LearningObjective)
(:LearningObjective)-[:COVERED_BY]->(:Content)
```

## XP System

| Action                   | XP   | Daily Cap |
| ------------------------ | ---- | --------- |
| Complete a quiz          | +50  | 200       |
| Exercise correct         | +10  | 100       |
| Daily check-in           | +20  | 20        |
| Read a content page      | +5   | 50        |
| Path objective completed | +100 | —         |

Levels: Every 500 XP → level up.

## Badges

| Badge          | Trigger                         | XP Bonus |
| -------------- | ------------------------------- | -------- |
| Erste Schritte | Complete first quiz             | +50      |
| Frühaufsteher  | 7-day streak                    | +200     |
| Chemie-Fuchs   | 30-day streak                   | +500     |
| Übungsmeister  | 100 exercises correct           | +300     |
| Themen-Experte | 100% on a topic quiz            | +150     |
| Pfad-Absolvent | Complete a curriculum path      | +500     |
| Sammler        | Earn 5 badges                   | +200     |
| Beständig      | Check in 30 days total          | +250     |
| Schnellstarter | Complete 3 exercises in one day | +50      |
| Alleskönner    | Earn XP in all 5 action types   | +300     |

## Streak Mechanics

- Daily check-in: one per day, +20 XP
- Streak freeze: if missed day and XP >= 100, auto-burn 100 XP to preserve streak
- Streak displayed as flame: "🔥 N Tage"

## Certificate

- Generated via PDFKit on POST /api/learning-paths/:slug/certificate
- Requires ALL objectives in the path to be completed
- PDF includes: title, user name, completion date, topics list, score summary

## Requirements

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

### Requirement: LP-DIFF-1 — Per-learner Bloom target depth

The system SHALL support a per-learner Bloom target depth configuration that limits the maximum Bloom level objectives returned for that learner.

- Each user SHALL have a `targetBloomIndex` (integer 1–6) stored in their profile
- Default value SHALL be `6` (create level)
- The `targetBloomIndex` SHALL be configurable via API
- Bloom levels: `1=remember, 2=understand, 3=apply, 4=analyze, 5=evaluate, 6=create`

#### Scenario: User has default Bloom target

- **WHEN** a new user is created
- **THEN** their `targetBloomIndex` is `6`

#### Scenario: User configures lower Bloom target

- **WHEN** a user sets `targetBloomIndex` to `3` (apply)
- **THEN** subsequent next-objective queries return only objectives with `blooms_index <= 3`

### Requirement: LP-DIFF-2 — Bloom depth filtering on next objective

The `nextObjectiveInZPD` computation SHALL respect the learner's `targetBloomIndex` as an additional filter constraint.

- Objectives with `blooms_index > targetBloomIndex` SHALL be excluded from ZPD consideration
- The existing ZPD conditions (preqAvg >= θ_high, loMastery <= θ_low) remain applicable
- Bloom depth filtering is an **AND** condition with ZPD conditions

#### Scenario: Objective above target is filtered out

- **GIVEN** user has `targetBloomIndex = 3`
- **AND** objective `A` has `blooms_index = 4` and is in ZPD by other criteria
- **WHEN** `GET /api/learning-paths/:slug/next` is called
- **THEN** objective `A` is NOT returned

#### Scenario: Highest Bloom within target is returned

- **GIVEN** user has `targetBloomIndex = 4`
- **AND** objectives `A` (bloom=3, in ZPD), `B` (bloom=4, in ZPD), `C` (bloom=5, in ZPD) exist
- **WHEN** `GET /api/learning-paths/:slug/next` is called
- **THEN** objective `B` with bloom=4 is returned (highest within target)

#### Scenario: No objectives within target returns empty

- **GIVEN** user has `targetBloomIndex = 2`
- **AND** all in-ZPD objectives have `blooms_index >= 3`
- **WHEN** `GET /api/learning-paths/:slug/next` is called
- **THEN** response has `inZPD: false`

### Requirement: LP-DIFF-3 — Bloom target API endpoints

The system SHALL provide endpoints to retrieve and configure a user's Bloom target.

#### Scenario: Get current Bloom target

- **WHEN** authenticated user calls `GET /api/zpd/bloom-target`
- **THEN** response contains `targetBloomIndex` and `bloomLevel` string
- **AND** response contains `isDefault` boolean

#### Scenario: Set Bloom target by index

- **WHEN** authenticated user POSTs `{ targetBloomIndex: 4 }` to `/api/zpd/bloom-target`
- **THEN** user's target is updated to `4`
- **AND** response confirms the update

#### Scenario: Set Bloom target by level string

- **WHEN** authenticated user POSTs `{ bloomLevel: "analyze" }` to `/api/zpd/bloom-target`
- **THEN** user's target is updated to `4` (index for analyze)

#### Scenario: Invalid Bloom target is rejected

- **WHEN** user POSTs `{ targetBloomIndex: 7 }` to `/api/zpd/bloom-target`
- **THEN** response is `400 Bad Request` with error message

### Requirement: LP-DIFF-4 — Bloom target in path responses

Path detail responses SHALL include the learner's effective Bloom target information.

#### Scenario: Path detail includes Bloom target

- **GIVEN** authenticated user with `targetBloomIndex = 4`
- **WHEN** calling `GET /api/learning-paths/:slug`
- **THEN** response contains `bloomTarget.index` and `bloomTarget.level`

#### Scenario: Next endpoint includes Bloom target info

- **WHEN** calling `GET /api/learning-paths/:slug/next`
- **THEN** response contains `bloomTarget` field
- **AND** response contains `filteredOutCount` indicating how many objectives were excluded by Bloom depth filter
