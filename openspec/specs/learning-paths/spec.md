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
