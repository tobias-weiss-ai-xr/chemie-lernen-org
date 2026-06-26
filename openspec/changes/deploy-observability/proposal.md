# Change: deploy-observability (Active)

**Status:** Active
**Spec impact:** None yet (proposal stage)

## Why

The `.github/workflows/deploy.yml` smoke test currently checks:

- `/entity/` returns 200
- `entity-index.js` script tag is properly quoted
- `entity-index.js` loads with 200

**Missing checks** (audit findings from KI-Assistent review):

- `/api/chat` health (Sprint 8c added 6 RAG improvements, untested
  in production)
- `/api/kg-stats` health (Sprint 8b added this endpoint, untested)
- `/api/health` endpoint (referenced in `ai-assistant.md` but
  probably doesn't exist as a separate route)
- `hubs.tobias-weiss.org` (the Hubs stack — separate from
  chemie-lernen.org, but it's a sister service and should be
  monitored)

Without production smoke tests for the API endpoints, a broken
backend can ship without anyone noticing.

## What changed (planned)

- `.github/workflows/deploy.yml` — add API smoke tests after the
  Hugo smoke test block:
  ```bash
  # 4. /api/kg-stats returns valid JSON
  STATS=$(curl -sf "$SITE/api/kg-stats")
  [ -n "$STATS" ] || exit 1
  # 5. /api/health returns 200
  HEALTH=$(curl -sf "$SITE/api/health" -o /dev/null -w "%{http_code}")
  [ "$HEALTH" = "200" ] || exit 1
  # 6. /api/chat accepts POST (test with a noop payload, expect 400)
  CHAT=$(curl -sf -X POST "$SITE/api/chat" -H "Content-Type: application/json" -d '{}' -o /dev/null -w "%{http_code}")
  [ "$CHAT" = "400" ] || exit 1
  ```
- `api/server.js` — add `GET /api/health` endpoint (referenced in
  the AI assistant spec but possibly missing in the actual code)
- `myhugoapp/content/pages/status.md` — include the new endpoints
  in the status dashboard

## Tasks

- [ ] **DO-1** Verify `/api/health` exists in `api/server.js`; add
      if missing
- [ ] **DO-2** Add `/api/kg-stats` smoke test to deploy.yml
- [ ] **DO-3** Add `/api/health` smoke test to deploy.yml
- [ ] **DO-4** Add `/api/chat` smoke test (POST, expect 400 on empty
      body)
- [ ] **DO-5** Update `status.md` dashboard
- [ ] **DO-6** Test full deploy flow on a feature branch
