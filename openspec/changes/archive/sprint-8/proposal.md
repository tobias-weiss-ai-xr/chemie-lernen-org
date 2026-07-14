# Sprint 8: KI-Assistent Personalization

**Goal**: Make the KI-Assistent adaptive — learn from user interactions, personalize responses, and provide tailored learning support.

## Scope

### User Preferences & Learning Profile

- Extend user schema with `learning_profile`:
  - `level` (beginner/intermediate/advanced)
  - `interests` (array of teilgebiet topics)
  - `preferred_explanation_style` (simple/detailed/visual)
  - `weak_areas` (inferred from quiz results + chat topics)
- `PUT /api/auth/profile` — update learning preferences
- `GET /api/auth/profile` — return profile + inferred weak areas

### Chat History Persistence

- Store chat sessions per user (already started with FileBackedSessionStore)
- `GET /api/chat/history` — list past sessions (date, topic summary, message count)
- `GET /api/chat/history/:sessionId` — full conversation
- Session titles auto-generated from first user message (LLM-summarized)
- History retention: 90 days for free, 1 year for premium

### Personalized RAG

- Modify system prompt to include user's learning level and weak areas
- Boost RAG results matching user's interests (weighted scoring)
- Adjust explanation complexity based on `preferred_explanation_style`
- Detect confusion patterns (asks same question twice, rates answer "not helpful")
- Suggest remedial topics when weak areas detected

### Feedback Loop

- Thumb up/down on each assistant response
- "War das hilfreich?" prompt after 3 exchanges
- `POST /api/chat/feedback` — store per-message rating
- Analytics: topic-level satisfaction, improvement suggestions

## Success Criteria

- User can set learning level and interests → responses adapt
- Chat history browsable and searchable
- Personalized RAG boosts relevant results by ≥20% relevance score
- Feedback stored and actionable
- No regression in non-personalized chat quality
