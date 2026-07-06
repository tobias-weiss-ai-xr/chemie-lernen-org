## ADDED Capabilities

### Capability: Virtual Lab Simulator

An interactive 3D chemistry lab running in the browser, allowing students to perform virtual experiments.

**Routes:**

- `GET /virtuelles-labor/` — Lab workspace page
- `POST /api/lab/experiment` — Start/run an experiment
- `GET /api/lab/experiment/:id` — Get experiment state/results
- `POST /api/lab/reset` — Reset workspace

**Key behaviors:**

- 3D equipment rendered via Three.js: Bunsen burner, beaker, Erlenmeyer flask, graduated cylinder, titration stand, thermometer
- Reaction engine: chemical equation → color change, gas evolution, precipitation, temperature change
- Safety overlays: "Heat with open flame," "Use fume hood," "Wear safety goggles"
- Equipment snapping: drag-and-drop connectors (e.g., flask → burner)
- Pre-built experiment templates: "Nachweis von Kohlendioxid," "Titration einer starken Säure"

**Out of scope:** Molecular dynamics simulation, full PES scanning, NMR simulation.

### Capability: Exercise Generator Engine

AI-powered generation of practice exercises grounded in the Neo4j knowledge graph.

**Routes:**

- `GET /api/exercises/generate` — Generate exercises for a topic/skill
- `POST /api/exercises/answer` — Submit an answer for grading
- `GET /api/exercises/:id` — Get a specific exercise
- `GET /api/exercises/history` — Past exercises for the user

**Key behaviors:**

- Input: learning objective slug → produces 3-5 questions at appropriate difficulty
- Question types: multiple-choice, fill-in-blank, calculation (auto-graded), short answer (AI-graded)
- Uses LiteLLM with a structured prompt: "Generate 3 MCQs testing knowledge of [learning objective] at [difficulty] level"
- Grounding: every generated exercise references KG entities (verified against Neo4j)
- Difficulty scales with user's learning_level and past performance

### Capability: Learning Paths & Gamification

Structured curriculum paths through the 12 themenbereiche with progress tracking and rewards.

**Routes:**

- `GET /api/learning-paths` — List available paths
- `GET /api/learning-paths/:slug` — Path detail with progress
- `POST /api/learning-paths/:slug/enroll` — Enroll in a path
- `GET /api/achievements` — User's badges and stats
- `POST /api/check-in` — Daily check-in for streak

**Key behaviors:**

- Paths map to the existing curriculum (Themenbereiche → Topics → LearningObjectives)
- Progress = completed articles + quizzes + exercises in the path scope
- Badges: "Erste Schritte" (first article), "Feuereifer" (7-day streak), "Experte" (50 quizzes), "Säure-Profi" (all acid-base topics)
- XP formula: article = 10XP, quiz 80%+ = 25XP, exercise = 15XP, streak bonus = 5XP/day
- Certificate generated as PDF via Puppeteer on path completion

### Capability: Advanced Periodic Table

Interactive 3D periodic table with element data, property visualization, and orbital viewer.

**Routes:**

- `GET /periodensystem/` — Interactive table page
- `GET /api/elements` — All element data
- `GET /api/elements/:symbol` — Element detail with properties
- `GET /api/elements/:symbol/orbitals` — Orbital visualization data

**Key behaviors:**

- Three.js 3D table with zoom/pan/rotate
- Color modes: groups, electronegativity, atomic radius, ionization energy, melting point
- Element card: name, symbol, mass, configuration, common isotopes, discovery year
- Orbital viewer: electron shell visualization (s/p/d/f subshell filling)
- Comparison tool: side-by-side property comparison of 2-4 elements

### Capability: Collaborative Learning

Multi-user study features enabling group work and classroom management.

**Routes:**

- `GET /api/groups` — User's study groups
- `POST /api/groups` — Create a group
- `POST /api/groups/:id/join` — Join with invite code
- `GET /api/groups/:id/notes` — Shared notes for the group
- `POST /api/groups/:id/notes` — Add a note
- `GET /api/groups/:id/leaderboard` — Group XP ranking
- `GET /api/groups/:id/queue` — Peer tutoring queue

**WebSocket events:**

- `group:presence` — Who's online in the group
- `group:note:update` — Real-time shared note editing (basic, not CRDT)

### Capability: Offline-First Mobile

Full offline support via extended service worker, IndexedDB, and Background Sync.

**Key behaviors:**

- All JS tools and calculators cached and functional offline
- Quiz questions stored in IndexedDB for offline quizzes
- Exercise generator works offline with cached templates (deterministic generation from seed)
- Knowledge graph browsing works offline (cached entity cards)
- Background Sync: quiz results, exercise answers, chat messages queued and sent on reconnect
- Install prompt: custom "Installieren" banner for PWA

### Capability: Exam Preparation Mode

Timed practice exams simulating German Abitur chemistry exam conditions.

**Routes:**

- `GET /api/exams/start` — Start a timed exam session
- `POST /api/exams/submit` — Submit all answers when done
- `GET /api/exams/:id/result` — Graded result with feedback
- `GET /api/exams/predict` — Score prediction based on history

**Key behaviors:**

- Time limit: 180 minutes (matches Abitur)
- Question selection: random from appropriate learning objectives, weighted by past weak areas
- Question types: MCQ (30%), calculation (30%), short answer (40%)
- Auto-grading: MCQ instant, calculation validated against correct value (±1% tolerance), short answer AI-graded
- Result report: score, time per question, weak areas flagged, recommended revision topics
- Prediction: Bayesian model based on past exam performance

### Capability: Content Authoring Platform

Admin web application for educators to create and manage chemistry content.

**Routes:**

- `GET /admin/articles` — Article list (CRUD)
- `GET /admin/exercises` — Exercise library
- `GET /admin/quiz-builder` — Quiz builder UI
- `POST /admin/entities/link` — Link content to KG entities
- `GET /admin/stats` — Content usage analytics

**Key behaviors:**

- Standalone React SPA served at `/admin/`
- Markdown editor with live preview (KaTeX for formulas, mhchem for chemical equations)
- KG entity picker: search Neo4j and link content to entities
- Draft/publish workflow with revision history
- Media library: upload images, label diagrams, crop/formats

### Capability: Public API v2

Public REST API for third-party integrations with authentication and documentation.

**Routes:**

- `GET /api/v2/elements` — Public element data (no auth)
- `GET /api/v2/curriculum` — Public curriculum structure
- `GET /api/v2/entities` — Public entity search (no auth)
- `GET /api/v2/exercises` — Exercises (API key required)
- `GET /api/v2/calculators` — Calculator endpoints

**Key behaviors:**

- API key authentication via header `X-API-Key`
- Rate limits: free = 1000/day, premium = 10000/day
- Pagination: cursor-based for list endpoints
- Interactive docs at `/api/docs/` powered by Scalar/Stoplight
- Response format: JSON:API standard
- SDK packages: `@chemie-lernen/sdk` (npm) + `chemie-lernen-sdk` (PyPI)

### Capability: Internationalization (DE/EN/FR)

Multi-language support across all platform components.

**Key behaviors:**

- Runtime i18n via i18next with language detection from browser Accept-Language header
- Translation files: `i18n/de/common.json`, `i18n/en/common.json`, `i18n/fr/common.json`
- Content articles: DeepL-translated with human review workflow
- Calculator labels: locale-aware (e.g., decimal separator, unit localization)
- AI tutor: detects user language from message, responds in the same language, translates RAG sources if needed
- Curriculum data: parallel translations in Neo4j (`title_de`, `title_en`, `title_fr` properties)
- Language switcher in header (flags + dropdown)
- Content negotiation: `Accept-Language` header for API responses
