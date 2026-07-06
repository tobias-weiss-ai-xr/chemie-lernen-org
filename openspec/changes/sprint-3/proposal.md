# Sprint 3: Platform Hardening

**Goal**: Security and operational hardening of the entire platform — fix identified risks, add monitoring, ensure production stability.

## Scope

### Security Fixes

- **JWT_SECRET**: Remove hardcoded default, crash at startup if env var missing, generate strong default in dev only
- **Password hashing**: Verify bcryptjs cost factor ≥ 12, audit existing hashes
- **Stripe webhook**: Always verify signature (moved from Sprint 1 if not done)
- **Input validation**: Sanitize all user inputs in auth endpoints (XSS, injection)
- **CORS**: Audit CORS config, restrict to known origins
- **API key rotation**: `ADMIN_API_KEY` should use a proper key derivation

### Rate Limiting

- Replace in-memory Map with `express-rate-limit` backed by in-memory store
- Tiers: 10 req/min for `/api/auth/login`, 30 req/min for `/api/chat`, 100 req/min for `/api/entities`
- Configurable via env vars

### Backup & DR Hardening

- Schedule `backup-all.sh` as systemd timer (weekly, separate from daily Neo4j dumps)
- Off-site backup: rsync/restic to Hetzner Storage Box or S3-compatible
- Alert on backup failure: verify healthchecks.io integration works end-to-end
- Remove deprecated `neo4j-backup.sh` (v4 syntax, dead code)

### Monitoring & Observability

- Add healthcheck endpoint (`GET /api/health`) returning container status + last backup time
- Structured logging (JSON format) for chat-api, switch from `console.log` to `pino` or `winston`
- LiteLLM health check: periodic ping to `http://litellm-proxy:4000/health`, log failures
- Prometheus metrics endpoint (`GET /api/metrics`): request count, latency, error rate

### Dependency Auditing

- `npm audit` on both root and api/ — fix critical/moderate vulnerabilities
- Update Hugo version if security patches available
- Check for unused dependencies (`depcheck`)

## Success Criteria

- No hardcoded secrets in source
- Rate limits enforced and configurable
- Backups verified working + off-site copy exists
- Health endpoint returns all container statuses
- `npm audit` shows 0 critical vulnerabilities
- All routes validated against OWASP Top 10
