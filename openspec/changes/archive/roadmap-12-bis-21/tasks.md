## Sprint 12 — Virtual Lab Simulator (3D Chemistry Lab)

- [ ] 12.1 Create `myhugoapp/content/virtuelles-labor/_index.md` — lab landing page
- [ ] 12.2 Create `myhugoapp/layouts/_default/virtuelles-labor.html` — lab workspace template
- [ ] 12.3 Set up Three.js scene with basic lab equipment (beaker, burner, flask) via `myhugoapp/static/js/virtual-lab/renderer.js`
- [ ] 12.4 Implement equipment drag-and-drop and connector snapping (`equipment-manager.js`)
- [ ] 12.5 Build reaction engine: equation → color/gas/precip/temperature (`reaction-engine.js`)
- [ ] 12.6 Add safety overlay system (hazard icons per chemical, per step)
- [ ] 12.7 Create 5 pre-built experiment templates (e.g., titration, CO₂ detection)
- [ ] 12.8 Implement `POST /api/lab/experiment` and `GET /api/lab/experiment/:id` endpoints
- [ ] 12.9 Add i18n keys for all lab UI strings (DE/EN/FR)
- [ ] 12.10 Test: lab loads, equipment snaps, reactions show visual changes, experiments complete

## Sprint 13 — Exercise Generator Engine

- [ ] 13.1 Create `POST /api/exercises/generate` — accepts learning objective slug + difficulty
- [ ] 13.2 Build LiteLLM prompt template: KG-grounded exercise generation
- [ ] 13.3 Implement MCQ and fill-in-blank generation with 4 options
- [ ] 13.4 Implement calculation exercise generation with expected answer
- [ ] 13.5 Implement `POST /api/exercises/answer` — auto-grade MCQ/calc, AI-grade short answer
- [ ] 13.6 Add difficulty scaling: easy (recall), medium (apply), hard (analyze/synthesize)
- [ ] 13.7 Store generated exercises in chat session for review
- [ ] 13.8 Create `GET /api/exercises/history` — past exercises with results
- [ ] 13.9 Add i18n keys for exercise UI and prompt templates
- [ ] 13.10 Verify: generated exercises are grounded in KG entities, difficulty matches user level

## Sprint 14 — Learning Paths & Gamification

- [ ] 14.1 Define learning paths in Neo4j (Curriculum→Topic→LearningObjective chains)
- [ ] 14.2 Implement `GET /api/learning-paths` and `GET /api/learning-paths/:slug`
- [ ] 14.3 Implement `POST /api/learning-paths/:slug/enroll` + progress tracking
- [ ] 14.4 Create achievement/badge system (badge definitions, earn conditions, `GET /api/achievements`)
- [ ] 14.5 Implement daily check-in `POST /api/check-in` with streak tracking
- [ ] 14.6 Build XP system: article read (10XP), quiz 80%+ (25XP), exercise (15XP)
- [ ] 14.7 Create frontend: learning path page with progress bars, badge display
- [ ] 14.8 Generate printable PDF certificate on path completion (via Puppeteer or PDFKit)
- [ ] 14.9 Add i18n keys for path/achievement names and descriptions
- [ ] 14.10 Verify: enrolling in a path shows progress, badges unlock, certificate generates

## Sprint 15 — Advanced Periodic Table

- [ ] 15.1 Create `myhugoapp/content/periodensystem/_index.md` — table page
- [ ] 15.2 Create element dataset in `api/data/elements.json` (118 elements with full properties)
- [ ] 15.3 Build Three.js 3D periodic table grid (`periodic-table-3d.js`)
- [ ] 15.4 Implement color modes: groups, electronegativity, radius, ionization energy, melting point
- [ ] 15.5 Create element detail card: name, symbol, mass, configuration, discovery, uses
- [ ] 15.6 Build orbital viewer: electron shell filling animation (s/p/d/f subshells)
- [ ] 15.7 Implement element comparison tool (2-4 elements side-by-side)
- [ ] 15.8 Create `GET /api/elements` and `GET /api/elements/:symbol` endpoints
- [ ] 15.9 Add i18n for element names and property labels
- [ ] 15.10 Verify: table renders 3D, color modes switch, orbital viewer shows correct shells

## Sprint 16 — Collaborative Learning

- [ ] 16.1 Implement study group endpoints: create, join, leave, list
- [ ] 16.2 Add shared notes per group (CRUD, simple text, no real-time collab)
- [ ] 16.3 Implement group leaderboard (aggregated XP)
- [ ] 16.4 Build peer tutoring queue: request help, claim, mark resolved
- [ ] 16.5 Implement teacher dashboard: class roster, assignment progress, engagement stats
- [ ] 16.6 Add WebSocket server for group presence (who's online)
- [ ] 16.7 Create frontend pages: groups list, group detail, teacher dashboard
- [ ] 16.8 Add i18n for group/teacher UI
- [ ] 16.9 Verify: groups form, notes save, leaderboard reflects XP, presence updates

## Sprint 17 — Offline-First Mobile Experience

- [ ] 17.1 Extend service worker to cache all calculator/visualization JS in `install` event
- [ ] 17.2 Store quiz questions in IndexedDB for offline quiz play
- [ ] 17.3 Cache exercise templates for offline deterministic generation
- [ ] 17.4 Cache top 200 KG entity cards for offline browsing
- [ ] 17.5 Implement Background Sync for: quiz results, exercise answers, chat messages
- [ ] 17.6 Add custom install banner "App installieren" with beforeinstallprompt
- [ ] 17.7 Test: airplane mode → all calculators work, quiz plays, chat queued
- [ ] 17.8 Verify Background Sync fires on reconnect
- [ ] 17.9 Update manifest with icons, shortcuts, categories

## Sprint 18 — Exam Preparation Mode

- [ ] 18.1 Build exam session service: 180-min timer, question selection weighted by weak areas
- [ ] 18.2 Implement exam question set generation (30% MCQ, 30% calc, 40% short answer)
- [ ] 18.3 Build timer UI: countdown, auto-submit on expiry
- [ ] 18.4 Implement auto-grading: MCQ instant, calc with ±1% tolerance, AI short answer grading
- [ ] 18.5 Create result report: score, time-per-question, weak areas, recommended revision
- [ ] 18.6 Implement score prediction model (Bayesian, based on past exam results)
- [ ] 18.7 Create `GET /api/exams/start`, `POST /api/exams/submit`, `GET /api/exams/:id/result`
- [ ] 18.8 Add i18n for exam UI and grading feedback templates
- [ ] 18.9 Verify: exam timer runs, auto-submit works, grading is accurate, prediction improves over time

## Sprint 19 — Content Authoring Platform

- [ ] 19.1 Set up standalone React SPA at `/admin/` (separate build, served from nginx)
- [ ] 19.2 Create article editor: Markdown + KaTeX + mhchem live preview
- [ ] 19.3 Implement KG entity picker (search Neo4j, link entities to content)
- [ ] 19.4 Build exercise/quiz builder UI with difficulty and entity tagging
- [ ] 19.5 Implement media library: upload, crop, describe images
- [ ] 19.6 Add draft/publish workflow with revision history
- [ ] 19.7 Create admin analytics: article views, quiz completions, top search queries
- [ ] 19.8 Implement auth: only users with `role: "admin"` or `role: "educator"` can access
- [ ] 19.9 Add i18n for admin UI

## Sprint 20 — Public API v2

- [ ] 20.1 Set up `/api/v2/` router with API key authentication middleware
- [ ] 20.2 Implement rate limiting: free 1000/day, premium 10000/day (separate store)
- [ ] 20.3 Create public endpoints: `GET /api/v2/elements`, `/api/v2/curriculum`, `/api/v2/entities`
- [ ] 20.4 Create authenticated endpoints: `GET /api/v2/exercises`, `/api/v2/calculators`
- [ ] 20.5 Generate interactive API docs at `/api/docs/` (Scalar/Stoplight)
- [ ] 20.6 Implement cursor-based pagination for list endpoints
- [ ] 20.7 Create TypeScript SDK package: `@chemie-lernen/sdk`
- [ ] 20.8 Create Python SDK package: `chemie-lernen-sdk`
- [ ] 20.9 Publish SDKs to npm and PyPI

## Sprint 21 — Internationalization (DE/EN/FR)

- [ ] 21.1 Install and configure i18next in frontend JS
- [ ] 21.2 Extract all UI strings to `i18n/de/common.json`, create `i18n/en/`, `i18n/fr/`
- [ ] 21.3 Implement language detection (Accept-Language + manual switcher)
- [ ] 21.4 Translate all UI templates and JS strings (DeepL + human review)
- [ ] 21.5 Make calculator labels locale-aware (decimal separator, unit format)
- [ ] 21.6 Add content negotiation to API: `Accept-Language` header
- [ ] 21.7 Add parallel translations to Neo4j content (title_de, title_en, title_fr)
- [ ] 21.8 Make AI tutor detect user language and respond accordingly
- [ ] 21.9 Add language switcher to site header (flags dropdown)
- [ ] 21.10 Verify: site renders in DE by default, switcher changes language, all strings translated
