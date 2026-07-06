## 1. 🔴 Traefik Routing Fix (docker-compose.yml)

- [x] 1.1 Add `PathPrefix('/api/auth')` to the `chemie-chat-api` traefik chat router rule
- [x] 1.2 Add `PathPrefix('/api/quizzes')` to the same rule
- [x] 1.3 Add `PathPrefix('/api/quiz-results')` to the same rule
- [x] 1.4 Add `PathPrefix('/api/studienvergleich')` to the same rule
- [x] 1.5 Rebuild Docker + restart and verify quiz endpoint returns 200: `docker exec chemie-chat-api wget -qO- http://localhost:3001/api/quizzes/alle` returns 30 questions

## 2. 🔴 Quiz API Fix (api/server.js + quiz questions data)

- [x] 2.1 Create `api/data/quiz-questions.json` — extract the question array from `myhugoapp/static/js/quiz-questions.js` as pure JSON
- [x] 2.2 Rewrite `GET /api/quizzes/:topic` in `api/server.js` to read from `api/data/quiz-questions.json` instead of using `vm.runInNewContext`
- [x] 2.3 Remove the `vm` import from the quiz endpoint (keep `import('vm')` only if used elsewhere)
- [x] 2.4 Rebuild Docker + restart and test: `docker exec chemie-chat-api wget -qO- http://localhost:3001/api/quizzes/alle` returns 200 with 30 questions

## 3. 🔴 Verify Auth Frontend Works End-to-End

- [x] 3.1 Verify `POST /api/auth/login` and `GET /api/auth/me` are reachable via traefik (200 with user:null, 401 with auth required)
- [ ] 3.2 Verify the login page (`/login/`) can submit and receive a JWT
- [ ] 3.3 Verify the premium page can call `POST /api/auth/create-checkout-session`

## 4. 🟡 Sprint 8 — KI Personalisierung Phase 1: Learning Profile

- [x] 4.1 Extend user schema in `api/auth-db.js` with `learning_profile` object (level, interests, preferred_explanation_style)
- [x] 4.2 Implement `PUT /api/auth/profile` — validate and store learning preferences
- [x] 4.3 Implement `GET /api/auth/profile` — return profile + inferred weak areas (from quiz results)
- [x] 4.4 Update JWT payload and sanitizeUser to include learning_profile

## 5. 🟡 Sprint 8 — KI Personalisierung Phase 2: Chat History

- [x] 5.1 Implement `GET /api/chat/history` — list past sessions with date, topic_summary, message_count
- [x] 5.2 Implement `GET /api/chat/history/:sessionId` — full conversation for a session
- [x] 5.3 Implement auto-generated session titles from first user message (first-80-chars; LLM-summarization deferred)
- [x] 5.4 Implement retention policy: 90 days free, 1 year premium

## 6. 🟡 Sprint 8 — KI Personalisierung Phase 3: Personalized RAG

- [x] 6.1 Modify system prompt builder to include user's learning level and weak areas
- [x] 6.2 Add weighted RAG scoring that boosts results matching user's interests
- [x] 6.3 Adjust explanation complexity based on `preferred_explanation_style`
- [x] 6.4 Detect confusion patterns (same question twice, "not helpful" rating)

## 7. 🟡 Sprint 8 — KI Personalisierung Phase 4: Feedback Loop

- [x] 7.1 Implement `POST /api/chat/feedback` — store per-message rating (thumb up/down)
- [x] 7.2 Add "War das hilfreich?" prompt after 3 exchanges
- [x] 7.3 Add analytics endpoint: topic-level satisfaction, improvement suggestions

## 8. 🟡 Sprint 10 — Production Audit: Security

- [x] 8.1 Run `npm audit` on the project — 4 vulns found (protobufjs via @xenova/transformers, accepted risk — force-fix breaks transformers)
- [ ] 8.2 Run truffleHog or git leaks on repository history — remove any committed secrets
- [ ] 8.3 Audit CORS and CSP headers across all API responses
- [ ] 8.4 Audit session management (JWT token storage, expiration, rotation)
- [ ] 8.5 Fix all security findings ≥ medium severity (or document accepted risk)

## 9. 🟡 Sprint 10 — Production Audit: Performance

- [ ] 9.1 Run Lighthouse against production URL — identify gaps to 95+ target
- [ ] 9.2 Fix top 3 performance bottlenecks by estimated impact
- [ ] 9.3 Audit bundle sizes — target < 50 kB gzipped total JS
- [ ] 9.4 Profile top 10 API endpoints for p50/p95/p99 latency
- [ ] 9.5 Analyze slow Neo4j queries (EXPLAIN for queries > 500ms)

## 10. 🟡 Sprint 10 — Production Audit: Documentation

- [x] 10.1 Create `docs/ARCHITECTURE.md` with Mermaid system diagrams
- [x] 10.2 Create `docs/API.md` documenting all API routes with request/response examples
- [x] 10.3 Create `docs/DEPLOYMENT.md` with Docker setup, env vars, backup/restore
- [x] 10.4 SECURITY.md already exists (452 lines, comprehensive)
- [x] 10.5 Create `docs/CONTRIBUTING.md` — how to add content, calculators, tests
- [x] 10.6 Create `docs/openapi.yaml` — OpenAPI 3.0 spec for all 40+ API routes

## 11. 🟡 Sprint 10 — Production Audit: Monitoring

- [ ] 11.1 Set up healthchecks.io or similar uptime monitoring for the health endpoint
- [ ] 11.2 Configure Sentry or similar error tracking for the chat-api
- [x] 11.3 Document required env vars for monitoring in docker-compose.yml and DEPLOYMENT.md
- [ ] 11.4 Define alert rules: 5xx > 1%, p95 > 2s, backup failure, disk > 80%

## 12. 🟢 OpenSpec Task Tracking Cleanup

- [x] 12.1 Inspect `openspec/changes/sprint-1/tasks.md` — mark completed tasks as `[x]`
- [x] 12.2 Repeat for sprint-2 through sprint-10 tasks.md files
- [x] 12.3 Update each change's `proposal.md` or status if needed
- [x] 12.4 Verify `openspec list --json` shows updated completion counts

## 13. 🧪 Verification & Deployment

- [x] 13.1 Run `npm test` — no regressions (13 pre-existing Neo4j timeout failures are acceptable)
- [x] 13.2 Run `npm run lint` — no new errors beyond pre-existing 17
- [x] 13.3 Rebuild Docker image: `docker build -t registry.chemie-lernen.org/chemie-chat-api:latest api/`
- [x] 13.4 Deploy: `docker push` then `docker compose up -d`
- [x] 13.5 Verify all critical endpoints: /api/health → ok, /api/quizzes/alle → 30 questions, /api/auth/me → {user:null}
