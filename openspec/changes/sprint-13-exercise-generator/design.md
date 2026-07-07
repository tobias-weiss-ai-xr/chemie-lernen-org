## Context

Exercise Generator that uses the KG and LiteLLM to create curriculum-grounded practice exercises at 3 difficulty levels. Three API endpoints: generate, answer, history. Exercises stored in the JSON-backed session store.

## Goals / Non-Goals

**Goals:**
- Generate MCQ, fill-in-blank, and calculation exercises from KG learning objectives
- Auto-grade MCQ/calc, AI-grade short answers via LiteLLM
- Track exercise history per user
- Scale difficulty by user level (easy/medium/hard)

**Non-Goals:**
- Real-time collaborative exercises
- Multimedia exercise types (video/audio)

## Decisions

### D1: Prompt template in separate file
Exercise generation prompt stored in `api/prompts/exercise-generation.txt` — loaded at runtime. Keeps prompt engineering separate from server code.

### D2: Session store for exercises
Exercises stored in the existing `FileBackedSessionStore` (JSON file). No separate DB needed. Each user has an `exercises` array in their session data.

### D3: Difficulty scaling via Bloom's taxonomy
Easy = recall (define, list), Medium = apply (calculate, predict), Hard = analyze/synthesize (compare, design, evaluate).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| AI exercises hallucinate wrong content | Always include KG entity grounding in prompt; source learning objective shown |
| LiteLLM timeout on generation | Set 30s timeout; return 503 with retry hint |
