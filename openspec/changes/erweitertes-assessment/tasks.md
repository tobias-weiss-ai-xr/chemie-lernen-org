## 1. Backend API — Extend exercise routes

- [ ] 1.1 Add `POST /api/exercises/grade` endpoint for deterministic grading (MCQ, calculation, fill-in-blank)
- [ ] 1.2 Add `POST /api/exercises/grade` AI-assisted grading path for short-answer
- [ ] 1.3 Add `POST /api/exercises/feedback` endpoint for per-answer individualized feedback generation
- [ ] 1.4 Add `GET /api/assessment/results` endpoint for learner dashboard data
- [ ] 1.5 Add `GET /api/assessment/class-results` endpoint for teacher dashboard data (authenticated)
- [ ] 1.6 Add rate limiting middleware to grade and feedback endpoints (60 req/min per user)
- [ ] 1.7 Add exercise/topic generation caching with 24h TTL (in-memory store)
- [ ] 1.8 Add feedback cache for identical (questionId, answer, studentLevel) triplets
- [ ] 1.9 Add `POST /api/exercises/generate` support for `short-answer` and `fill-in-blank` question types
- [ ] 1.10 Add FSRS context calibration to generation request (`includeFsrsContext` flag)

## 2. Neo4j Assessment Schema

- [ ] 2.1 Create `Assessment`, `GradedAnswer`, `Feedback` node labels with properties per design data schema
- [ ] 2.2 Define relationships: `(:Assessment)-[:TESTS]->(:LearningObjective)`, `(:GradedAnswer)-[:PART_OF]->(:Assessment)`, `(:Feedback)-[:FOR]->(:GradedAnswer)`, `(:Feedback)-[:REFERENCES]->(:Concept)`
- [ ] 2.3 Extend `_neo4j-subset-filter.mjs` with `Assessment` label filter
- [ ] 2.4 Add Neo4j indexes on `Assessment.userId`, `GradedAnswer.createdAt`, `GradedAnswer.exerciseId`
- [ ] 2.5 Implement assessment data persistence module (`api/assessment-store.js`) — create, read, batch sync
- [ ] 2.6 Implement GDPR deletion endpoint `DELETE /api/assessment/user/{userId}`

## 3. AI Exercise Generator Module

- [ ] 3.1 Create `api/services/exercise-generator.js` with LiteLLM integration for MCQ generation
- [ ] 3.2 Add fill-in-blank generation with acceptable-answer detection
- [ ] 3.3 Add calculation exercise generation with tolerance computation
- [ ] 3.4 Add short-answer generation with rubric (keyConcepts, length constraints)
- [ ] 3.5 Implement topic discovery fallback: query Neo4j for learning objectives under a topic
- [ ] 3.6 Add FSRS-calibrated difficulty adjustment within specified level
- [ ] 3.7 Add distractor plausibility validation for MCQ options

## 4. Auto-Grader Module

- [ ] 4.1 Create `api/services/auto-grader.js` with deterministic grading for MCQ (exact match)
- [ ] 4.2 Add deterministic calculation grading (numeric tolerance comparison, unit stripping)
- [ ] 4.3 Add deterministic fill-in-blank grading (case-insensitive match against acceptable answers)
- [ ] 4.4 Add formula variant normalization for fill-in-blank (H2O ↔ H₂O)
- [ ] 4.5 Add AI-assisted short-answer grading via LiteLLM with rubric evaluation
- [ ] 4.6 Implement partial credit scoring (0-100 scale)
- [ ] 4.7 Handle grading errors gracefully (LLM timeout → return "Grading failed, please try again")

## 5. Feedback Engine Module

- [ ] 5.1 Create `api/services/feedback-engine.js` with per-answer feedback generation
- [ ] 5.2 Implement concept-level misconception detection from wrong MCQ choices
- [ ] 5.3 Add FSRS-aware study recommendation generation
- [ ] 5.4 Add teacher feedback override endpoint `PUT /api/assessment/feedback/{feedbackId}`
- [ ] 5.5 Implement feedback caching per (questionId, answer, studentLevel) triplet
- [ ] 5.6 Add disclaimer "KI-generiert — bitte mit Lehrenden besprechen" to AI feedback

## 6. Assessment Dashboard (Learner + Teacher)

- [ ] 6.1 Create learner dashboard layout `myhugoapp/layouts/_default/assessment-dashboard.html`
- [ ] 6.2 Create `myhugoapp/content/assessment.md` for learner dashboard page
- [ ] 6.3 Create `static/js/assessment-dashboard.js` with Chart.js integration for score trends
- [ ] 6.4 Implement weak-topic identification (bottom 3 by average score) with drill-down links
- [ ] 6.5 Create teacher dashboard layout `myhugoapp/layouts/_default/teacher-dashboard.html`
- [ ] 6.6 Create `myhugoapp/content/lehrerdashboard.md` for teacher dashboard page
- [ ] 6.7 Implement teacher class overview with topic breakdown table
- [ ] 6.8 Implement student drill-down view with feedback override capability
- [ ] 6.9 Add CSV export for class assessment data
- [ ] 6.10 Add i18n keys for assessment dashboard (`assessment` namespace in `de.json`)

## 7. Quiz Engine Adaptation

- [ ] 7.1 Extend `quiz-system.js` to support AI-generated questions (`source: "ai"`)
- [ ] 7.2 Implement mixed-source question rendering (hand-authored + AI-generated in same session)
- [ ] 7.3 Add adaptive difficulty selection based on FSRS stability (see design: <7d→leicht, 7-30d→mittel, >30d→schwer)
- [ ] 7.4 Add "KI-generiert" badge to AI-generated questions
- [ ] 7.5 Implement offline resilience: queue AI-generated answers locally when offline, sync on reconnect
- [ ] 7.6 Add tooltip explaining adaptive difficulty recommendation to learner

## 8. Testing

- [ ] 8.1 Write Jest unit tests for `api/services/exercise-generator.js` (generation, caching, FSRS calibration)
- [ ] 8.2 Write Jest unit tests for `api/services/auto-grader.js` (all grading modes, edge cases)
- [ ] 8.3 Write Jest unit tests for `api/services/feedback-engine.js` (feedback generation, caching, override)
- [ ] 8.4 Write Jest unit tests for `api/assessment-store.js` (Neo4j CRUD, GDPR deletion)
- [ ] 8.5 Write Jest unit tests for `static/js/assessment-dashboard.js` (data fetching, weak-topic logic)
- [ ] 8.6 Write integration tests for `/api/exercises/grade` and `/api/exercises/feedback` endpoints
- [ ] 8.7 Verify all existing quiz/FSRS/FSRS tests still pass
