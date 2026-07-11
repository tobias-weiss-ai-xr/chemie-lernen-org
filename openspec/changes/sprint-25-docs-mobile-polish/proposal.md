## Why

The codebase has accumulated stale docs (DEPLOYMENT.md references Neo4j 4.x), missing READMEs for key directories, no mobile/PWA polish, and no infrastructure-as-code for the systemd units that manage the Docker services. The PWA works for basic caching but lacks IndexedDB quiz cache, Background Sync for offline quiz submissions, and an install banner. Lighthouse scores are unknown. This sprint finishes the docs, polishes PWA, and codifies the production infrastructure.

## What Changes

- Refresh `docs/DEPLOYMENT.md` for current Docker Compose + Traefik + Node 22 stack
- Write missing READMEs: `tests/`, `scripts/`, `myhugoapp/layouts/partials/`, `static/js/calculators/`
- Add IndexedDB quiz cache (save answers offline, sync when online — Background Sync API)
- Add PWA install banner (beforeinstallprompt event handling)
- Run Lighthouse audit on 5 key pages; fix all issues below 95 (accessibility, performance, best practices, SEO)
- Create systemd service unit files for production services (hugo-server, chat-api, neo4j, traefik) + install script
- Run depcheck/fix across repo for clean dependency tree
- Final pre-flight checklist document

## Capabilities

### Modified Capabilities

- `quiz/spec.md` — add Background Sync + offline quiz caching
- `central-kg-architecture` / deployment docs

## Impact

- **Infrastructure**: systemd unit files for 4 services; install script
- **Frontend**: PWA install banner; offline quiz queue; improved Lighthouse scores
- **Dependencies**: No new external deps (Background Sync uses native Service Worker API)
