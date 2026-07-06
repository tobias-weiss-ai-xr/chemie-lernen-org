# Sprint 7: Quiz Platform

**Goal**: Build an interactive quiz system for self-assessment, with a question bank, progress tracking, and spaced repetition.

## Scope

### Quiz Engine

- Create `static/js/quiz-engine.js` — core quiz logic
  - Question types: multiple choice (single + multiple), fill-in-the-blank, matching, ordering
  - Scoring: points per question, partial credit for multiple-select
  - Timer per question/quiz (configurable)
  - Shuffle questions, shuffle answer options
- Create `static/js/quiz-ui.js` — quiz renderer
  - Progress bar, question counter, answer feedback (correct/wrong with explanation)
  - Results screen: score, time, per-question review
  - Keyboard navigation (1-4 for mc, Enter to confirm)

### Question Bank

- Hugo data-driven question format: `data/quizzes/<topic>.yaml` or `.json`
- 30 initial questions across 5 Themenbereiche (6 each)
- Question schema: id, type, question, options (if mc), answer, explanation, difficulty (1-5), teilgebiet tags
- `GET /api/quizzes/<topic>` — serve quiz questions, filter by difficulty
- Admin quiz editor (basic CRUD via API)

### Progress Tracking

- `PUT /api/quiz-results` — save quiz attempt (score, answers, time, date)
- `GET /api/quiz-results` — user history, stats by topic, weak areas
- Store in auth-db `users.json` (quiz_results array per user)
- Dashboard: recent quizzes, streak, improvement over time

### Spaced Repetition

- Implement SM-2 algorithm for wrong answers
- "Wiederholen" button on quiz results for missed questions
- Daily review reminder ("Du hast 3 Karteikarten zur Wiederholung")

## Success Criteria

- 30 questions across 5 topics
- Quiz renders, shuffles, scores correctly
- Progress persists and displays on dashboard
- Spaced repetition shows due cards correctly
- All quiz interactions under 100ms input latency
