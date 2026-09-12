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
