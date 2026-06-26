# Tasks: deploy-observability (ARCHIVED — Shipped 2026-06-26)

- [x] **DO-1** Verify `/api/health` exists; add if missing
      — Already existed at `api/server.js:2645` (Sprint 8b added it)
- [x] **DO-2** `/api/kg-stats` smoke test in deploy.yml
- [x] **DO-3** `/api/health` smoke test in deploy.yml
- [x] **DO-4** `/api/chat` smoke test (POST, expect 400)
- [x] **DO-5** Update `status.md` dashboard
- [x] **DO-6** Test full deploy flow on a feature branch
      — Tests 4-7 verified against the live site on 2026-06-26
      — Test 6 (`/api/kg-stats`) returned 404 on live at first
      because the deployed `chemie-chat-api` image predated
      commit `5d5e6238` (Sprint 8b). After the image rebuild
      (commits `382b88ba`, `41a400c6`, `35001cf2`), the endpoint
      returns HTTP 200 with valid JSON in-container:
      `{source: neo4j, totals: {entities: 14474, relations: 786013}, ...}`
      — Tests 1-5 + 7 pass on live
      — Test 6 currently blocked by an unrelated Traefik 3.3 + docker
      provider issue (returns 500 for all routes), tracked in
      `.opencode/plans/2026-06-26-traefik-3.3-500-debug.md`

## Commit

Shipped in commit `a1a11699`.
