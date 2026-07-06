## Why

Comprehensive gaps/issues audit revealed 6 critical areas that need fixing before the site is production-ready: broken API routes (auth, quiz, studienvergleich never reach the backend), a 503 Quiz-API, the wrong nginx upstream target for catch-all API traffic, two entire sprints of unimplemented work (KI Personalisierung, Production Audit), and dead OpenSpec task tracking that shows 0% progress despite completed work.

## What Changes

### 🔴 Bugfixes (blocking — must ship first)

1. **Traefik chat router rule** — Add `PathPrefix('/api/auth')`, `PathPrefix('/api/quizzes')`, `PathPrefix('/api/quiz-results')`, `PathPrefix('/api/studienvergleich')` so these requests reach `chemie-chat-api` instead of falling through to the hugo nginx → `leads-app`
2. **Quiz-API 503** — Make `GET /api/quizzes/:topic` serve questions. Either copy `quiz-questions.js` as JSON into the api container or proxy to the hugo container's static file
3. **Nginx `location /api/` upstream** — The catch-all proxies to `leads-app:3001` (wrong service). Must route to `chemie-chat-api` or be removed in favor of traefik-only routing

### 🟡 Unimplemented Sprint Work

4. **Sprint 8 — KI Personalisierung**: Learning profiles (`PUT /api/auth/profile`), chat history persistence, personalized RAG (weighted scoring, complexity adjustment), feedback loop (thumbs up/down, "War das hilfreich?" prompt)
5. **Sprint 10 — Production Audit**: Security audit (OWASP Top 10, dependency scan, secrets scan, CSP/CORS), performance audit (Lighthouse 95+, API latency p50/p95/p99, bundle <50kB gzipped), documentation (ARCHITECTURE.md, API.md, DEPLOYMENT.md, SECURITY.md, CONTRIBUTING.md, openapi.yaml), monitoring (Grafana dashboard, alert rules, Sentry/healthchecks.io)

### 🟢 Housekeeping

6. **OpenSpec task tracking** — Mark all actually-completed sprint tasks as `done` in their respective changes so the progress dashboard is accurate

## Capabilities

### New Capabilities

- `bugfix-infrastructure`: Fix traefik routing gaps, nginx upstream misconfiguration, and Quiz-API file access so all existing API endpoints are reachable and functional
- `ki-personalisierung`: Learning profiles (level, interests, weak areas), chat history with session management, personalized RAG scoring, and per-message feedback loop
- `production-audit`: Security audit + remediation, performance audit + bottleneck fixes, production documentation suite, monitoring/alerting stack

### Modified Capabilities

_(None — no existing spec-level requirements are changing)_

## Impact

- **docker-compose.yml**: Traefik router label for `chemie-chat-api` — add missing `PathPrefix` entries
- **api/server.js**: Quiz endpoint — change file loading to read from `api/data/quiz-questions.json` (or equivalent)
- **api/Dockerfile**: May need build context adjustment or a `COPY` for the quiz questions file
- **myhugoapp/static/api-proxy.conf**: Fix `location /api/` proxy_pass target or remove in favor of traefik-only routing
- **api/auth.js** + **api/server.js**: Sprint 8 additions (profile endpoints, chat history, feedback)
- **docs/**: Sprint 10 additions (ARCHITECTURE.md, API.md, DEPLOYMENT.md, SECURITY.md, CONTRIBUTING.md, openapi.yaml)
- **openspec/changes/sprint-{1..10}/tasks.md**: Mark completed tasks as done

## Rollback Plan

Each change is independently revertible via `git revert`:

- Traefik routing → revert `docker-compose.yml` change
- Quiz fix → revert `api/server.js` + Dockerfile change
- Nginx upstream → revert `api-proxy.conf`
- Sprint 8/10 → whole directories or features can be backed out by reverting commits
- Task tracking → reversed by reverting `tasks.md` edits
