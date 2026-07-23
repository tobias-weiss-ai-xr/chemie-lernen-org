## Learning Paths & Gamification Architecture

### Neo4j Curriculum Schema

```cypher
(:Curriculum {slug: "mittelstufe-chemie", title: "Mittelstufe Chemie", grade: 8})
  -[:HAS_TOPIC]->(:Topic {slug: "stoffgemische", title: "Stoffgemische", order: 1})
    -[:HAS_SUBTOPIC]->(:SubTopic {slug: "trennverfahren", title: "Trennverfahren", order: 1})
      -[:HAS_OBJECTIVE]->(:LearningObjective {
        slug: "trennverfahren-kennen",
        description: "Die Schüler kennen grundlegende Trennverfahren (Filtration, Destillation, Chromatographie)",
        bloomLevel: "remember",      // remember | understand | apply | analyze | evaluate | create
        estimatedMinutes: 15
      })
(:LearningObjective)
  -[:PREREQUISITE]->(:LearningObjective {slug: "..."})
  -[:COVERED_BY]->(:Content {url: "/themenbereiche/stoffgemische/trennverfahren/"})
```

### XP System

| Action                   | XP        | Daily Cap |
| ------------------------ | --------- | --------- |
| Complete a quiz          | +50       | 200       |
| Exercise correct         | +10       | 100       |
| Daily check-in           | +20       | 20        |
| Read a content page      | +5        | 50        |
| Exercise streak (5+)     | +25 bonus | 1/day     |
| Path objective completed | +100      | —         |

Levels: Every 500 XP → level up (Level 1 at 500, Level 2 at 1000, etc.)

### Badges

| Badge          | Trigger                                              | XP Bonus |
| -------------- | ---------------------------------------------------- | -------- |
| Erste Schritte | Complete first quiz                                  | +50      |
| Frühaufsteher  | 7-day streak                                         | +200     |
| Chemie-Fuchs   | 30-day streak                                        | +500     |
| Übungsmeister  | 100 exercises correct                                | +300     |
| Themen-Experte | 100% on a topic quiz                                 | +150     |
| Pfad-Absolvent | Complete a curriculum path                           | +500     |
| Sammler        | Earn 5 badges                                        | +200     |
| Beständig      | Check in 30 days total (not necessarily consecutive) | +250     |
| Schnellstarter | Complete 3 exercises in one day                      | +50      |
| Alleskönner    | Earn XP in all 5 action types                        | +300     |

### Streak Mechanics

- Daily check-in: one click per day, +20 XP
- Streak freeze: if user has >= 100 XP banked, auto-burn 100 XP to preserve streak for one missed day
- Streak displayed as flame icon: 🔥 N Tage

### Certificate Generation

```
POST /api/learning-paths/:slug/certificate
  → Verify all objectives completed
  → Generate PDF via PDFKit:
      - Title: "Zertifikat — {pathTitle}"
      - User name, completion date
      - List of completed topics/objectives
      - Score summary (quiz average)
  → Return PDF download URL
```

### Frontend Dashboard

- Left: Learning path tree with progress % per topic (expandable)
- Center: XP bar, level badge, streak flame
- Right: Badge showcase (earned + locked)
- Bottom: "Next recommended topic" button based on prerequisites

### Endpoint Summary

| Method | Route                                   | Purpose                                              |
| ------ | --------------------------------------- | ---------------------------------------------------- |
| `GET`  | `/api/learning-paths`                   | All available curriculum paths                       |
| `GET`  | `/api/learning-paths/:slug`             | Path detail with objectives, prerequisites, progress |
| `GET`  | `/api/learning-paths/:slug/certificate` | Download completion certificate (PDF)                |
| `GET`  | `/api/gamification/profile`             | User XP, level, streak, badges                       |
| `GET`  | `/api/gamification/badges`              | All badges with unlock status                        |
| `POST` | `/api/gamification/checkin`             | Daily check-in, returns streak info                  |
