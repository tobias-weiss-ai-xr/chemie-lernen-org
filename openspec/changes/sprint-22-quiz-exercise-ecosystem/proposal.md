## Why

The quiz system exists but lacks spaced repetition, AI-generated exercise scaling, per-topic quiz content, and auto-grading for short-answer questions. Students need adaptive review schedules, exercises that match their skill level, and instant feedback on open-ended answers — without waiting for a teacher.

## What Changes

- Add FSRS (Free Spaced Repetition Scheduler) frontend UI: review queue, card intervals, ELO-based difficulty
- Enhance exercise generator (`POST /api/exercises/generate`) with difficulty scaling (leicht/mittel/schwer) tied to user learning profile
- Create per-topic quiz pages: every themenbereich and klassenstufe gets a dedicated quiz with 10 curated questions
- Build exercise history dashboard: past attempts, accuracy trends, recommended topics to review
- Add auto-grading for short-answer questions via LiteLLM: semantic comparison against reference answer
- Wire quiz/exercise performance back into learning profile (enhancing sprint-21 weak area detection)

## Capabilities

### Modified Capabilities

- `quiz/spec.md` — FSRS, per-topic quizzes, auto-grade
- `ai-assistant/spec.md` — short-answer grading pipeline

## Impact

- **Backend**: `POST /api/exercises/grade` (short-answer); new FSRS card endpoints; per-topic quiz endpoints
- **Frontend**: FSRS review UI; exercise history dashboard; per-topic quiz pages; difficulty selector
- **Dependencies**: `fsrs.js` (browser FSRS implementation) or custom port
