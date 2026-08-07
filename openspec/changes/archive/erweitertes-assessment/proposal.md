## Why

Current quizzes on chemie-lernen.org are static — questions are hand-authored in `quiz-database.js`, and feedback is limited to correct/incorrect with a fixed explanation. Teachers have no way to generate personalized exercises for their students, and learners receive no adaptive feedback tailored to their specific mistakes. The FSRS and quiz-history infrastructure shipped in sprint-completion provides the foundation for adaptive assessment, but the actual generation, grading, and feedback loops are missing.

This change brings AI-powered quiz generation, automatic grading, and individualized feedback to the platform — making assessment adaptive, scalable, and pedagogically effective.

## What Changes

- **AI quiz generation endpoint** (`/api/exercises/generate`) — generate MCQ, fill-in-blank, calculation, and short-answer exercises from KG learning objectives via LiteLLM (building on existing `exercise-generator` spec)
- **Auto-grading pipeline** — deterministic grading for MCQ/calc, AI-assisted grading for short-answer and free-text responses
- **Individualized feedback engine** — generate student-specific feedback texts that reference the learner's FSRS history, past mistakes, and knowledge gaps
- **Assessment dashboard** — teacher-facing view of student results per class/curriculum and learner-facing view of personal progress with weak-area recommendations
- **Adaptive difficulty selection** — quiz engine automatically selects difficulty based on learner's FSRS stability and past performance
- **Feedback persistence** — store graded answers, feedback texts, and teacher annotations in the Neo4j knowledge graph

## Capabilities

### New Capabilities

- `ai-exercise-generation`: AI-powered exercise generation from KG learning objectives via LiteLLM. Supports MCQ, fill-in-blank, calculation, and short-answer types. Generates distractors, explanations, and difficulty-calibrated variants.
- `auto-grading`: Automatic grading of exercise submissions — deterministic for MCQ/calc, AI-assisted for short-answer/free-text. Returns score, correctness, and structured feedback.
- `individualized-feedback`: Generate personalized feedback for each learner based on FSRS history, past mistakes, and knowledge gaps. Includes actionable recommendations for improvement.
- `assessment-dashboard`: Teacher dashboard for class-level assessment analytics. Learner dashboard for personal progress, weak-area identification, and study recommendations.

### Modified Capabilities

- `quiz`: Quiz engine gains adaptive difficulty selection based on FSRS stability metrics. Quiz data model extended to include generated exercises alongside hand-authored ones.
- `exercise-generator`: Extended from generation-only to full generation → grading → feedback pipeline. Returns enriched feedback alongside scores.

## Impact

- **New API endpoints**: `/api/exercises/generate`, `/api/exercises/grade`, `/api/exercises/feedback`, `/api/assessment/results`
- **New JS modules**: `ai-exercise-generator.js`, `auto-grader.js`, `feedback-engine.js`, `assessment-dashboard.js`
- **Neo4j schema extension**: New labels `Assessment`, `GradedAnswer`, `Feedback`, `AssessmentResult` with relationships to `User` and `LearningObjective`
- **API server changes**: LiteLLM integration in `api/server.js`, new route files in `api/routes/`
- **Frontend**: New dashboard layouts for teachers and learners
- **i18n**: New namespace `assessment` in `de.json`
- **Dependencies**: LiteLLM Python package (or API key), Neo4j driver for assessment data

## Rollback Plan

- Feature-flag all AI generation behind `/api/exercises/generate` — disable the route to fall back to static `quiz-database.js` quizzes
- Feature-flag auto-grading per question type — disable AI grading to fall back to deterministic grading only
- New Neo4j labels are additive — no existing data affected. DETACH DELETE on `Assessment`, `GradedAnswer`, `Feedback` nodes is safe if rollback needed
- All new JS modules are lazy-loaded via `LazyLoader` — removing them from the build has no effect on other functionality
