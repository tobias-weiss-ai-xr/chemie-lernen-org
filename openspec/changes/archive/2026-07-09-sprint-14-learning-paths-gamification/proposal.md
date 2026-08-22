## Why

Users currently have no structured learning progression on chemie-lernen.org — content is browsed freely, but there is no path, no progression tracking, and no motivation system. This leads to low engagement and poor retention. Adding learning paths and gamification turns the site into a structured learning companion, increasing time-on-site and learning outcomes.

## What Changes

- Define learning paths as Curriculum→Topic→LearningObjective chains in Neo4j (reuses existing `lehrplan-curriculum` data)
- New API endpoints: GET/POST learning paths, enrollment, progress tracking
- XP system: article read (10XP), quiz 80%+ (25XP), exercise completed (15XP)
- Achievement/badge system with earn conditions
- Daily check-in with streak tracking (uses existing `FileBackedSessionStore`)
- PDF certificate generation on path completion (PDFKit, server-side)
- Frontend: learning path overview page with progress bars, badge display, daily check-in button
- i18n keys for all new UI strings (German primary)

## Capabilities

### New Capabilities

- `learning-paths`: Structured curriculum-aligned learning paths with enrollment, progress tracking, and completion certificates
- `gamification`: XP system, achievements/badges, daily check-in streaks

### Modified Capabilities

- (none — all new capabilities, no spec-level requirement changes to existing specs)

## Impact

- **API**: 6 new routes (`GET /api/learning-paths`, `GET /api/learning-paths/:slug`, `POST /api/learning-paths/:slug/enroll`, `GET /api/achievements`, `POST /api/check-in`, `GET /api/learning-paths/progress`)
- **Frontend**: New Hugo content + layout at `myhugoapp/content/lernpfade/`
- **Backend**: New module `api/learning-engine.js`, PDFKit dependency added
- **Neo4j**: New `LearningPath` node label + `BELONGS_TO_PATH` relationship (no disruption to existing data)
- **Session store**: XP/badge/streak data persisted in `FileBackedSessionStore` under `user.progress`

## Rollback

- Each API route is independently revertible via git revert
- Neo4j labels and relationships are additive (no destructive schema changes)
- Frontend pages are new content paths — no existing pages are modified
- Session store data is namespaced under `user.progress` — can be wiped without affecting chat or exercise history
