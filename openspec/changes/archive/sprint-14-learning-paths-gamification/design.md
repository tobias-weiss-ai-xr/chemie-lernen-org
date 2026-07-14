## Context

chemie-lernen.org currently has a rich Neo4j curriculum graph (`lehrplan-curriculum`) covering 15 German states and KMK guidelines with Curriculum→Topic→SubTopic→LearningObjective chains. The site has chat, exercises (Sprint 13), and quizzes, but no structured progression or motivation system. Users browse freely with no persistence of what they've learned.

The backend is an Express.js ESM server (`api/server.js`) with:

- Neo4j driver for knowledge graph queries
- `FileBackedSessionStore` for per-user session data (chat history, exercises)
- `requireAuth` middleware for authenticated routes
- LiteLLM proxy for AI features

The frontend is Hugo SSR with vanilla JS (sourceType:script, no ESM), Three.js r128.

## Goals / Non-Goals

**Goals:**

- Define learning paths in Neo4j as curated Curriculum→Topic→LearningObjective sequences
- Provide REST API for path listing, enrollment, and progress tracking
- Implement XP system: article read (10XP), quiz 80%+ (25XP), exercise completed (15XP)
- Achievement/badge system with automatic earn conditions
- Daily check-in with streak tracking
- PDF certificate generation on path completion
- Frontend: learning path overview page with progress bars, badge display, daily check-in button
- All new UI strings in German, i18n-ready structure

**Non-Goals:**

- Real-time collaboration on learning paths
- Adaptive/AI path recommendation (future Sprint)
- Admin UI for path authoring (future Sprint 19)
- Mobile app notifications

## Decisions

### D1: XP & Achievement Data Store — FileBackedSessionStore (not Neo4j)

- **Decision**: Store XP, badges, streaks, and progress in `FileBackedSessionStore` under `user.progress` rather than in Neo4j
- **Rationale**: XP/achievement data is high-write, low-complexity — perfect for the existing JSON-backed session store. Neo4j is for the curriculum graph (read-heavy, structured relationships). Keeping gamification data in the session store avoids adding write contention to Neo4j and matches the existing pattern for exercise persistence.
- **Alternative considered**: Neo4j `User` node with `EARNED_BADGE` and `HAS_XP` relationships — rejected because session store provides simpler CRUD and automatic per-user namespacing.

### D2: Learning Path Model — Neo4j Labels + Relationships

- **Decision**: Learning paths are modeled as Neo4j `LearningPath` nodes connected to `Curriculum` via `BELONGS_TO_PATH`. Paths reference existing `Topic` and `LearningObjective` nodes — no data duplication.
- **Schema**: `(:LearningPath {slug, title, description, color, icon, estimatedHours}) -[:BELONGS_TO_PATH]-> (:Curriculum)` with ordering via `:HAS_TOPIC {order}` relationships from path to topics.
- **Rationale**: The curriculum data already exists — learning paths are curated subsets with ordering. Storing the ordering as relationship properties avoids a separate join table.

### D3: Badge Evaluation — Event-Driven (on XP/check-in)

- **Decision**: Badge conditions are evaluated synchronously when XP is earned or check-in occurs, not via a background poller
- **Rationale**: Badge conditions are simple threshold checks (reach 100XP, 7-day streak, complete 10 exercises). Polling adds unnecessary complexity. If badge conditions become more complex in future, a separate badge evaluator can be introduced.
- **Alternative considered**: Background cron job every 5 minutes — rejected as over-engineering for MVP.

### D4: Certificate Generation — PDFKit Server-Side

- **Decision**: Use `pdfkit` (already compatible with Node.js ESM) to generate PDF certificates on path completion
- **Rationale**: PDFKit is pure JS, no external binary dependencies (no Puppeteer/headless Chrome), and produces clean typographic PDFs suitable for printable certificates. The certificate includes user name, path name, completion date, and a verification hash.
- **Alternative considered**: Puppeteer HTML→PDF — rejected because it requires Chromium (~300MB) in the Docker image.

### D5: Frontend Architecture — Hugo SSR + Fetch API

- **Decision**: Learning path pages use Hugo server-side rendering for the shell (template, navigation, footer) and client-side fetch for dynamic data (progress, badges, check-in state)
- **Rationale**: Matches existing site architecture. Progress data is user-specific and changes frequently — static generation isn't suitable for that portion. The static shell provides SEO-friendly content about learning paths.
- **Pattern**: `myhugoapp/content/lernpfade/_index.md` → `myhugoapp/layouts/_default/lernpfade.html` with inline `<script>` that calls `fetch('/api/learning-paths')` and renders progress bars.

### D6: API Route Structure

```
GET    /api/learning-paths              — list all paths with user progress (requireAuth)
GET    /api/learning-paths/:slug        — single path detail with topic tree + progress
POST   /api/learning-paths/:slug/enroll — enroll user in a path (requireAuth)
GET    /api/learning-paths/progress     — aggregated progress across all paths (requireAuth)
POST   /api/check-in                    — daily check-in (requireAuth), returns streak + XP earned
GET    /api/achievements                — all achievements + user's earned badges (requireAuth)
```

## Risks / Trade-offs

| Risk                                                                    | Mitigation                                                                                                                                    |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Session store file grows large with XP/badge data                       | Cap `user.progress` at 10KB per user; archive old badge data                                                                                  |
| PDFKit certificate layout breaks on special characters (German umlauts) | Use embedded font with full Unicode support (e.g., Noto Sans)                                                                                 |
| Users game XP by repeatedly reading same article                        | Track unique article reads per day; 1XP per article max per day                                                                               |
| Badge conditions become complex                                         | Current design uses simple threshold checks — future complexity can use a badge rules DSL                                                     |
| Learning paths become outdated as curriculum changes                    | Paths reference Curriculum nodes — curriculum updates automatically reflect in paths if slugs match; stale path entries listed in admin audit |

## Open Questions

1. Should paths be ordered (must complete Topic A before Topic B) or unordered (any order within the path)? — **Decision**: Ordered for MVP. Users progress linearly through topics.
2. Certificate verification — should there be a public verify page? — **Deferred**: Simple QR code + hash for now; verification page in future Sprint.
3. Should guest (unauthenticated) users see progress? — **No**: Progress requires `requireAuth`. Guests see the path catalog but cannot enroll.
