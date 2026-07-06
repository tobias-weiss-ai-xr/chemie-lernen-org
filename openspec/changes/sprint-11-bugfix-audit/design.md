## Context

The chemie-lernen.org stack has three traffic layers:

```
Browser → Traefik (TLS termination)
            ├── chemie router (Host match) → hugo-nginx (port 80)
            │    ├── serves static files (HTML, JS, CSS)
            │    └── proxies /api/ → leads-app:3001 (WRONG — should be chemie-chat-api)
            └── chat router (Host + PathPrefix) → chemie-chat-api:3001
                 └── only 13 of 17+ API path prefixes are listed
```

Current problems discovered in the audit:

1. Traefik `chat` router is missing 4 path prefixes — traffic falls through to hugo-nginx, which proxies to `leads-app` (wrong service)
2. Quiz API loads `quiz-questions.js` from `myhugoapp/static/js/` via `vm.runInNewContext()` — but that file doesn't exist in the chat-api Docker image (build context is `api/`)
3. Nginx `location /api/` catch-all proxies to `leads-app:3001` — this is an external CRM, not the chemie API
4. Sprint 8 (KI Personalisierung) and Sprint 10 (Production Audit) were never implemented
5. OpenSpec shows 0% completion across all 10 sprints despite completed work

## Goals / Non-Goals

**Goals:**

- All existing API endpoints are reachable from the public internet
- Quiz API returns questions instead of 503
- Auth flow (login, register, premium) actually works end-to-end
- Learning profiles and chat history are persisted and served
- Production docs, security audit, and monitoring are in place
- OpenSpec dashboard reflects real progress

**Non-Goals:**

- Rewriting the network topology (Traefik + nginx dual routing stays)
- Changing the quiz frontend architecture (still loads via `<script>` tag)
- Full CI/CD pipeline overhaul

## Decisions

### D1: Traefik routing — add prefixes, keep dual-layer approach

Traefik has two routers for this domain: `chemie` (catch-all → hugo-nginx) and `chat` (prefix-matched → chemie-chat-api, priority 100). The dual-layer works fine — we just need to enumerate all API path prefixes in the `chat` router rule. Missing prefixes discovered:

- `/api/auth`
- `/api/quizzes`
- `/api/quiz-results`
- `/api/studienvergleich`

**Why not switch to nginx-only routing?** Traefik handles TLS and is the single ingress. Nginx-only would require duplicating TLS termination and losing Docker-aware service discovery. Keep both but keep the prefix list complete.

### D2: Quiz questions — ship as JSON in the api image

Instead of `vm.runInNewContext()` on a browser-IIFE file (fragile, requires the hugo source), generate `api/data/quiz-questions.json` from the same question data. The API reads JSON directly. The browser still loads the IIFE from the hugo container.

**Alternatives considered:**

- Proxy to hugo nginx for the JS file → adds latency, nginx doesn't parse JS, would need an extraction endpoint
- Mount a shared volume → more Docker complexity, breaks container isolation
- **Chosen**: JSON file committed to `api/data/`. Source of truth stays as the IIFE; a maintainer updates both or a build step generates JSON from the JS.

### D3: Nginx `location /api/` — keep pointing to `leads-app`

Renamed the leads-app CRM. The catch-all is intentional for the CRM's API. The chemie API paths must all be caught by Traefik's `chat` router before they reach nginx. As long as the Traefik prefix list is complete, this is not a problem.

### D4: Sprint 8 — minimal viable personalization

Ship this in phases:

- **Phase 1**: `PUT /api/auth/profile` + `GET /api/auth/profile` with learning_level, interests, preferred_explanation_style in the JWT or a user store table
- **Phase 2**: Chat history endpoints (`GET /api/chat/history`, `GET /api/chat/history/:sessionId`) using the existing `FileBackedSessionStore`
- **Phase 3**: Personalized system prompt and RAG boost weighting
- **Phase 4**: Feedback endpoints (`POST /api/chat/feedback`) with analytics summary

Ship Phase 1+2 in this sprint. Phase 3+4 deferred if scope is too large.

### D5: Sprint 10 — docs-first, security second, monitoring third

- Documentation: ship ARCHITECTURE.md (Mermaid diagrams), API.md (all routes), DEPLOYMENT.md, SECURITY.md, CONTRIBUTING.md
- Security audit: run `npm audit`, `grype`, truffleHog on the repo; fix ≥medium findings
- Performance: Lighthouse audit + fix top 3 bottlenecks; bundle size to <50kB gzipped
- Monitoring: healthchecks.io for uptime, review existing structured logging

## Architecture — Request Flow (After Fix)

```
Browser → Traefik (chemie-lernen.org:443)
           │
           ├── PathPrefix matches chat router?
           │   ├── YES → chemie-chat-api:3001 (prio 100)
           │   │         ├── /api/auth/*         ← NEWLY ADDED
           │   │         ├── /api/quizzes/*       ← NEWLY ADDED
           │   │         ├── /api/quiz-results    ← NEWLY ADDED
           │   │         ├── /api/studienvergleich/* ← NEWLY ADDED
           │   │         ├── /api/chat/*
           │   │         ├── /api/health
           │   │         ├── /api/kg-data, /api/kg-stats
           │   │         ├── /api/curriculum, /api/curricula
           │   │         ├── /api/content, /api/didaktik
           │   │         ├── /api/modulhandbuch, /api/entity
           │   │         ├── /api/article, /api/session
           │   │         └── /api/admin
           │   └── NO → hugo-nginx:80
           │             ├── / (static files, HTML)
           │             ├── /api/kg-data (direct to chemie-chat-api)
           │             └── /api/ (catch-all, to leads-app CRM)
           │
           Quiz questions flow:
           ├── Browser: <script src="/js/quiz-questions.js"> → hugo serves static file
           └── API: reads api/data/quiz-questions.json → no vm needed
```

## Risks / Trade-offs

| Risk                                                                                                                                                | Mitigation                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1**: Adding path prefixes to the traefik rule changes traffic routing live — could take down working endpoints if the compose label is malformed | Edit in a new label line, `docker compose up -d` to apply, test each new prefix with curl before closing                                       |
| **R2**: quiz-questions.json and quiz-questions.js diverge (humans update one but not the other)                                                     | Add a CI smoke test: `diff <(extract-questions-from-js) <(cat api/data/quiz-questions.json)`. Or add a build step that generates JSON from JS. |
| **R3**: Sprint 8 Phase 3+4 deferred work never gets picked up                                                                                       | Explicitly capture deferred scope in `tasks.md` with `status: deferred` so it's visible, not lost                                              |
| **R4**: `npm audit` / grype produces findings that are hard to fix (breaking deps)                                                                  | Document accepted risks with rationale. Fix only ≥medium where a fix exists without breaking changes.                                          |
| **R5**: Monitoring depends on external services (healthchecks.io, Sentry) that need API keys                                                        | Document all required env vars in DEPLOYMENT.md and add them to docker-compose.yml with placeholder comments                                   |
