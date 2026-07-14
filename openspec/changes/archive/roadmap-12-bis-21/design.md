## Context

The platform serves interactive chemistry education for German students (Abitur-level). Current stack: Hugo static site, Express API, Neo4j knowledge graph, LiteLLM AI proxy. Deployed via Docker + Traefik.

These 10 sprints extend the platform from a content site to a full interactive learning ecosystem. Each sprint is independent and shippable.

## Architecture Principles

1. **KG-first** — All exercises, paths, and content are driven by the Neo4j knowledge graph. No hardcoded data.
2. **Offline-capable** — Sprint 17 (Offline-first) applies to all previous features: lab simulations, exercises, periodic table must work without internet.
3. **i18n from Sprint 12** — All new code uses i18n keys (DE default). Avoid German string literals in JS. Prepares for Sprint 21.
4. **API v2 awareness** — New features that expose data should consider public API design (Sprint 20).

## Technology Decisions

| Sprint            | Key Tech                                | Rationale                                                                       |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| 12 Virtual Lab    | Three.js + Rapier physics               | WebGL for rendering, Rapier for reaction physics (gas expansion, precipitation) |
| 13 Exercise Gen   | LiteLLM + KG templates                  | AI generates from learning objectives, KG provides entity grounding             |
| 14 Learning Paths | Neo4j traversal + Redis                 | Path state in Redis (fast reads), path definition in Neo4j                      |
| 15 Per. Table     | Three.js + custom data                  | 118 elements with full property dataset; Three.js for orbital rendering         |
| 16 Collab         | WebSocket (ws) + Redis pub/sub          | Real-time group presence and shared editing state                               |
| 17 Offline        | Cache API + IndexedDB + Background Sync | SW extends existing service-worker.js; IndexedDB for local data                 |
| 18 Exam Mode      | Session store + timer service           | Server-side timed sessions to prevent cheating                                  |
| 19 Authoring      | React SPA (standalone) + Quill/Milkdown | Separate admin SPA, not Hugo; communicates via API                              |
| 20 Public API     | express-rate-limit + API keys           | Keys stored in auth-db.js (same user system), separate rate limit buckets       |
| 21 i18n           | i18next + POEditor workflow             | Transifex/POEditor for community translations; i18next for runtime              |

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Hugo SPA + Tools)               │
│  Lab │ Exercises │ Paths │ Per.Table │ Exam │ Authoring     │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST (or WebSocket for Sprint 16)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  chemie-chat-api (Express)                   │
│  ExerciseGen │ ExamTimer │ CollabWS │ PublicAPI │ AdminAPI  │
└──────┬──────────────┬──────────────┬─────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌────────────┐  ┌────────────┐
│  Neo4j   │  │ LiteLLM   │  │ Redis      │
│ (KG,     │  │ (Exercise │  │ (Sessions, │
│  paths)  │  │  gen)     │  │  state)     │
└──────────┘  └────────────┘  └────────────┘
```

## Dependencies Map

```
Sprint 12 ──┐
Sprint 13 ──┤
Sprint 14 ──┤
Sprint 15 ──┤─── All independent (any order)
Sprint 16 ──┤
Sprint 17 ──┤
Sprint 18 ──┘
Sprint 19 ──────────────────── depends on Sprint 20 (needs API v2 for CRUD)
Sprint 20 ──────────────────── independent (wrap existing API)
Sprint 21 ──────────────────── depends on all (i18n refactor)
```

## Risk Matrix

| Risk                                   | Impact | Likelihood | Mitigation                                                                |
| -------------------------------------- | ------ | ---------- | ------------------------------------------------------------------------- |
| Sprint 12 (Lab) physics too complex    | High   | Medium     | Start with 2D simulation (Canvas), upgrade to 3D later                    |
| Sprint 13 AI exercises hallucinate     | Medium | High       | Always show source learning objectives; teacher review queue in Sprint 19 |
| Sprint 17 offline data too large       | Medium | Low        | Cap stored sessions; LRU eviction for cached content                      |
| Sprint 21 i18n content volume too high | Medium | High       | Use DeepL API for initial translation; community review                   |
| Browser compatibility (WebGL, SW, WS)  | Low    | Low        | Fallbacks for each: 2D fallback for 3D, polling for WS                    |
