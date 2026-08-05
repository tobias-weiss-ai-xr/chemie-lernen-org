## 1. API Endpoints

- [ ] 1.1 Create `POST /api/exercises/generate` — accepts learning objective slug + difficulty + type
- [ ] 1.2 Create `POST /api/exercises/answer` — auto-grade MCQ/calc, AI-grade short answer
- [ ] 1.3 Create `GET /api/exercises/history` — past exercises with results

## 2. LiteLLM Integration

- [ ] 2.1 Create `api/prompts/exercise-generation.txt` — prompt template for MCQ/fill-in/calc generation
- [ ] 2.2 Create `api/prompts/exercise-grading.txt` — prompt template for AI short-answer grading
- [ ] 2.3 Implement KG entity lookup for prompt grounding

## 3. Exercise Types

- [ ] 3.1 MCQ generation with 4 options (1 correct, 3 plausible distractors)
- [ ] 3.2 Fill-in-blank generation with expected answer
- [ ] 3.3 Calculation exercise generation with expected answer + tolerance

## 4. Difficulty & Storage

- [ ] 4.1 Difficulty scaling: easy (recall), medium (apply), hard (analyze/synthesize)
- [ ] 4.2 Store generated exercises in user session data
- [ ] 4.3 i18n keys for exercise UI labels and prompt templates

## 5. Verification

- [ ] 5.1 Test: generate MCQ → answer correctly → verify in history
- [ ] 5.2 Test: generation includes source learning objective
- [ ] 5.3 Lint + commit + push
