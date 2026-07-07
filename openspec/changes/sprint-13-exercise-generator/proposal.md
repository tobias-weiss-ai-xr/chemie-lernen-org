## Why

Students need immediate, personalized practice exercises tied to the curriculum. Manual exercise creation doesn't scale — the KG and LiteLLM can auto-generate MCQ, fill-in-blank, and calculation exercises grounded in learning objectives, with auto-grading and difficulty scaling.

## What Changes

- New `POST /api/exercises/generate` — accepts learning objective slug + difficulty, returns exercise
- New `POST /api/exercises/answer` — auto-grades MCQ/calc, AI-grades short answer
- New `GET /api/exercises/history` — student's past exercises with results
- LiteLLM prompt template for KG-grounded exercise generation
- 3 difficulty levels: easy (recall), medium (apply), hard (analyze/synthesize)
- Storage of generated exercises in chat session data
- i18n keys for exercise UI and prompt templates

## Capabilities

### New Capabilities
- `exercise-generator`: AI-powered exercise generation, grading, and history via LiteLLM and the KG

### Modified Capabilities
*(None — no existing spec-level requirements change)*

## Impact

- **api/server.js**: 3 new route groups (generate, answer, history)
- **api/**: New LiteLLM prompt template for exercise generation
- **api/data/**: Exercises stored in session store JSON
- **myhugoapp/static/js/**: Exercise UI (if frontend added)
- **i18n keys**: Exercise labels, prompt templates

## Rollback Plan

Each route is independently revertible via `git revert`.
