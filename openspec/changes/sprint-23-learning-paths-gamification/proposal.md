## Why

The platform has rich content but no progression system — no structured curriculum paths, no XP, no streaks, no badges, no certificates. Students browse randomly rather than following a sequenced track. Gamification research shows that XP, streaks, and achievement badges significantly improve learning platform retention and completion rates.

## What Changes

- Store curriculum paths in Neo4j as sequenced `Topic → SubTopic → LearningObjective` nodes with prerequisites
- Add XP system: XP earned for quiz completion, exercise streaks, daily check-in, content reading
- Add daily check-in streaks with streak counter and freeze mechanic
- Add achievement badges: 10 badges for milestones (first quiz, 7-day streak, 100 exercises, topic mastery, etc.)
- Add certificate generation: PDF certificate via PDFKit when user completes a curriculum path
- Frontend: progress dashboard showing path completion, XP graph, badges earned, next recommended topic

## Capabilities

### New Capabilities

- `learning-paths/spec.md` — Neo4j curriculum paths, prerequisites, progress tracking

### Modified Capabilities

- `central-kg-architecture` — adds Curriculum, Topic, SubTopic, LearningObjective labels to Neo4j
- `quiz/spec.md` — XP rewards for quiz completion

## Impact

- **Backend**: New neo4j session-based API (`GET /api/learning-paths/*`); XP/badge/streak storage in auth-db; PDFKit for certificates
- **Frontend**: Progress dashboard with path visualization; badge showcase; streak calendar; certificate download
- **Dependencies**: `pdfkit` (npm), Neo4j label changes
