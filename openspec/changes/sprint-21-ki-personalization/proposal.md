## Why

The KI-Assistent currently responds to each chat message in isolation — no memory of who the user is, what they've struggled with, or what they've already learned. This sprint adds personalization: conversation memory across sessions, a learning profile that tracks weak areas, adaptive responses tuned to the user's level, AI-generated exercise hints based on past mistakes, and full chat history search/export.

## What Changes

- Conversation memory: past N chat sessions included as context in `/api/chat` requests (per user)
- Learning profile: track quiz results, exercise accuracy, and weak area entities per user → store in auth-db
- Adaptive chat: inject learning profile into LiteLLM system prompt so responses target weak areas
- AI exercise hints: `POST /api/chat/hint` — given a problem, generate a step-by-step hint tailored to user's level
- Chat history search: full-text search across user's past sessions
- Chat export: download conversation as Markdown or PDF

## Capabilities

### Modified Capabilities

- `ai-assistant/spec.md` — add personalization requirements, conversation memory, learning profile

## Impact

- **Backend**: `/api/chat` becomes user-aware; new `GET /api/chat/profile`, `POST /api/chat/hint` routes
- **Frontend**: Learning profile indicator in chat UI; hint button on exercises; search bar in history
- **Dependencies**: No new external deps (history stored in auth-db `users.json`)
