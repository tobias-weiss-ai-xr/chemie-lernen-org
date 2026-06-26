# Change: sprint-8c-rag (ARCHIVED)

**Status:** Archived (shipped 2026-06-26)
**Commit:** `d47bd48e`
**Implemented by:** Sisyphus
**Spec impact:** `specs/ai-assistant/spec.md` (entire spec)

## Why

`getRAGContext` was using pure substring `CONTAINS` on entity name
(no embeddings, no TF-IDF, no proper keyword scoring). The RAG
context only included metadata — no `description`. Single-hop only.
No source ranking. No `currentEntity` context. No citation
enforcement. No i18n. Config drift (`ki-assistent.md` said "Gemini
2.5 Flash", `docker-compose.yml` used `gemma-4`). No tests for the AI
assistant.

## What changed

- **`api/server.js` `queryNeo4jRAG`** — new Cypher with TF-IDF-style
  scoring (name_exact*10 + name_prefix*6 + name_contains*3 +
  tag_contains*4 + description_contains\*2), `ORDER BY score DESC
LIMIT 10`, includes `description` (first 200 chars), multi-hop
  via `[:RELATED_TO|ERFUELLT|BESTEHT_AUS]`
- **`api/server.js` `/api/chat`** — accepts `currentEntity` from
  request body, prepends "Du liest gerade die Seite zu X" to the
  system prompt
- **`api/server.js` `buildSystemPrompt`** — factored out,
  supports de/en via `Accept-Language` header, embeds citation
  enforcement
- **`api/server.js` `extractSourceNames`** — now captures
  `Score:` and `Definition:` fields, extracted to
  `api/_rag-helpers.js` for unit testing
- **`myhugoapp/static/js/ki-assistent.js`** — deletes dead `_askAI`
  (L445), sends `currentEntity` from `data-entity`, renders source
  score on each chip (title + data-score), top 5 chips with "Mehr
  anzeigen" button
- **`myhugoapp/content/ki-assistent.md`** — config drift fix
  (Gemini 2.5 Flash → gemma-4)
- **`eslint.config.mjs`** — `api/**/*.js` now declares
  require/module as readonly globals
- **`tests/rag-context.test.js`** — 15 new unit tests
- **`myhugoapp/static/js/ki-assistent.optimized.js`** — regenerated
  (terser)

## Capabilities added

- Better RAG with proper ranking and description context
- Multi-hop reasoning (1-2 hops)
- Page-context awareness (currentEntity)
- Bilingual (de/en) system prompts
- Citation enforcement in system prompt
- Source score visibility on chips
- Test coverage for the RAG layer
