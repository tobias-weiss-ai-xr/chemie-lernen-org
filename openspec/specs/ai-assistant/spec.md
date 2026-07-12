# Spec: ai-assistant

**Capability:** KI-Assistent (chat-based chemistry tutor) for chemie-lernen.org
**Owners:** Sisyphus (Sprint 8c)
**Status:** Active — main spec; deltas via `openspec/changes/`

---

## Purpose

The KI-Assistent at `/ki-assistent/` is a chat widget that lets users
ask chemistry questions in natural German. The assistant combines:

- A real LLM (gemma-4 via LiteLLM proxy, env-driven so the model can
  be swapped without code changes)
- RAG over the chemie-lernen.org knowledge graph (entity descriptions,
  related entities, articles)
- Per-session conversation memory (50 messages / IP / day rate limit)
- Source attribution: every answer cites the entities it used

## Requirements

### REQ-AI-1: Chat endpoint

`POST /api/chat` accepts:

```json
{
  "message": "string (1-1000 chars)",
  "sessionId": "uuid (optional, client-stored)",
  "currentEntity": "string (optional, set by entity pages)"
}
```

Returns either `application/json` (non-streaming) or
`text/event-stream` (SSE) when `Accept: text/event-stream` is sent.

Rate limit: 50 messages / IP / day. Returns `429` with `Retry-After`
header when exceeded.

### REQ-AI-2: RAG retrieval (TF-IDF weighted)

`getRAGContext(message)` returns a context string built from the top-10
entities matching the user's question.

Scoring weights:

- `name_exact` × 10
- `name_prefix` × 6 (not exact)
- `name_contains` × 3 (not exact, not prefix)
- `tag_contains` × 4
- `description_contains` × 2

The Cypher query searches `e.name`, `e.description`, and `e.tags[]`
case-insensitively. Result is `ORDER BY score DESC, e.name LIMIT 10`.
Multi-hop: the query collects 1-2 hop neighbours via
`[:RELATED_TO|ERFUELLT|BESTEHT_AUS]`.

The context string includes for each entity:
`Name | Score: X.X | Kategorie: Y | Definition: <200 chars> | verwandt: A, B`

### REQ-AI-3: System prompt

The system prompt has the following structure (de/en via
`Accept-Language` header):

- Base prompt in the user's language (German default, English fallback)
- Citation enforcement: "Wenn du Quellen aus dem Kontext verwendest,
  nenne sie namentlich im Text"
- If `currentEntity` is set: "Du liest gerade die Seite zu „X".
  Beziehe dich bevorzugt auf diesen Begriff."
- RAG context appended as `\n\nKontext aus dem Wissensgraph:\n...`

### REQ-AI-4: Source chips

The frontend renders source chips at the bottom of each assistant
message. Each chip:

- Links to `/entity/{slug}/`
- Shows `name` and `category` badge
- If the RAG result includes a `score`: shows it as `title="Relevanz: X.X"`
  and `data-score` attribute
- Default: top 5 chips visible, "Mehr anzeigen" button expands to all
  10

### REQ-AI-5: Frontend behavior

`myhugoapp/static/js/ki-assistent.js` (790 lines) is the source. The
served file is `ki-assistent.optimized.js` (terser-minified, gitignored).

- `askAIStream` is the entry point (SSE via `fetch` + `ReadableStream`).
- The dead `_askAI` (legacy non-streaming) is removed.
- Frontend reads `data-entity` from any element with this attribute
  (e.g. `#entity-app` on entity pages) and sends it as `currentEntity`.
- On error: 5s retry, then show "Verbindung fehlgeschlagen" with a
  reconnect button.
- Session ID stored in `localStorage` under `chemie_session`.

### REQ-AI-6: Health endpoint

`GET /api/health` returns:

```json
{
  "status": "ok",
  "entityCount": 1234,
  "neo4j": "up",
  "model": "gemma-4",
  "uptime": 12345
}
```

This is the canonical health check used by the deploy smoke test.

## Scenarios

### S-AI-1: User asks a question on the homepage

**Given** the user opens `/ki-assistent/` and types "Was ist Glucose?"
**When** the chat sends `POST /api/chat` with `Accept: text/event-stream`
**Then** the response streams via SSE with the answer
**And** the source chips include "Glucose" with a `data-score` attribute
**And** the answer contains the German word "Glucose" at least once
(citation enforcement)

### S-AI-2: User asks about a page they're on

**Given** the user is on `/entity/ammoniak/`
**When** the user opens the chat and types "Was sind die
Eigenschaften?"
**Then** the request includes `currentEntity: "Ammoniak"`
**And** the system prompt includes
"Du liest gerade die Seite zu „Ammoniak"."
**And** the answer references properties of Ammoniak specifically
(molar mass, pKb, etc.)

### S-AI-3: User hits the rate limit

**Given** the user has sent 50 messages today
**When** the user sends the 51st
**Then** the response is HTTP 429 with `Retry-After: 86400` (24h)
**And** the chat UI shows "Tageslimit erreicht (50/50)"

### S-AI-4: Neo4j is down

**Given** Neo4j is unreachable
**When** the user asks any question
**Then** `getRAGContext` falls back to `getRAGContextFallback` (reads
`myhugoapp/data/content-links.json` + curricula data)
**And** the chat still responds (no error to the user)
**And** the answer may be less specific than with live Neo4j data

### REQ-AI-7: Conversation memory

Authenticated users get persistent conversation memory across sessions.

- On each successful chat reply, `addConversationMemory(userId, { sessionId, topicSummary, messageCount })` is called in `auth-db.js`
- Memory stores last 10 session summaries (FIFO eviction)
- `buildSystemPrompt()` injects memory into the system prompt:
  `"Bisherige Themen: X, Y, Z. Knüpfe an bekannte Konzepte an."`
- Both streaming and non-streaming chat paths receive memory injection

### REQ-AI-8: Learning profile endpoint

`GET /api/auth/learning-profile` (requires auth) returns computed strengths and weaknesses:

```json
{
  "weakAreas": [{ "topic": "oxidation", "average": 45, "attempts": 3 }],
  "strongAreas": [{ "topic": "molare-masse", "average": 92, "attempts": 5 }],
  "totalQuizzes": 15,
  "lastUpdated": "2026-07-12T12:00:00Z"
}
```

- Weak areas: topics with quiz average < 60%
- Strong areas: topics with quiz average >= 80%
- Data sourced from `user.quiz_results[]`
- Frontend sidebar renders red-bordered weak areas, green-bordered strong areas

### REQ-AI-9: Hint generation

`POST /api/chat/hint` accepts `{ problem: string, topic?: string }` and returns step-by-step hints via LiteLLM:

```json
{ "hint": "1. Zähle die Fe-Atome auf jeder Seite...\n2. ..." }
```

- Hint prompt includes weak areas for authenticated users
- `temperature: 0.3`, `max_tokens: 512`
- The frontend adds hint buttons to:
  - Dynamic exercises (`uebungsgenerator.html` via `practice-generator.js`)
  - Static content pages with "Übungen" sections (via `ui-utils.js` `initExerciseHints()`)

### REQ-AI-10: Chat history search & export

- `GET /api/chat/history/search?q=<query>` returns matching sessions with message snippets (requires auth)
- `GET /api/chat/export/:sessionId` returns session as downloadable Markdown with `Content-Disposition: attachment` (requires auth)
- Frontend sidebar has search bar + results view and export button in chat header

## References

- `api/server.js` — `/api/chat` at L143, `getRAGContext` at L502
- `api/_rag-helpers.js` — extracted for testability
- `myhugoapp/static/js/ki-assistent.js` — frontend
- `myhugoapp/layouts/_default/ki-assistent.html` — page template
- `myhugoapp/content/ki-assistent.md` — marketing copy
- `tests/rag-context.test.js` — 15 unit tests for the RAG context
  builder
