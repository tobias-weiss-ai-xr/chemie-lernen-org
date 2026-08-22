# PRE-FLIGHT — Deployment Readiness Checklist

> Use this checklist **before every production deployment** to verify that the
> chemie-lernen.org stack is healthy, secure, and fully operational.
>
> **How to use:** run each check block in order. Mark `[x]` when passed.
> If any item fails, **stop the deployment** and resolve before proceeding.

---

## 1. Environment

- [ ] `.env` file exists at project root with all required variables:
  - `NEO4J_PASSWORD`, `JWT_SECRET`, `GRAFANA_ADMIN_PASSWORD`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
  - `SENTRY_DSN`, `HEALTHCHECKS_IO_URL`
  - `LITELLM_URL`, `LITELLM_MODEL`
- [ ] Docker engine is installed and running (`docker info`)
- [ ] Docker Compose plugin is installed (`docker compose version`)
- [ ] Node.js >= 22 installed (`node --version`)
- [ ] All services are healthy on the host (memory, disk, load)

---

## 2. Database (Neo4j)

- [ ] `chemie-neo4j` container is running and reachable on `bolt://localhost:7687`
- [ ] Cypher shell connects and returns 1 (`cypher-shell "RETURN 1"`)
- [ ] `chemie-kg` container is running (dedicated chemistry KG)
- [ ] Migration scripts have been run (if schema changed):
  ```bash
  node scripts/migrate-chemie-neo4j.mjs
  node scripts/import-entities.mjs
  ```
- [ ] Knowledge graph data is consistent (check node/edge counts via `/api/kg-stats`)

---

## 3. Build

- [ ] `npm run build` succeeds
  - Hugo site generates into `myhugoapp/public/`
  - Pagefind search index builds without errors
- [ ] `npm run minify` succeeds (if calculator files changed)
- [ ] No broken internal links (check Hugo build output for warnings)
- [ ] Docker images build successfully:
  ```bash
  docker compose build
  ```

---

## 4. Tests

- [ ] `npm test` passes (Jest unit tests)
- [ ] `npm run test:unit` passes (unit-only, no integration)
- [ ] `npm run test:coverage` meets 70 % threshold (branches, functions, lines, statements)
- [ ] Key Playwright E2E scenarios pass:
  - `npx playwright test --project=chromium` (critical paths)
  - Homepage loads without 404/500
  - Calculator pages load and interact
  - Chat API responds to queries
- [ ] No flaky tests (run suite twice, expect identical results)

---

## 5. Security

- [ ] `npm audit` clean (no moderate or higher vulnerabilities)
  ```bash
  npm audit --audit-level=moderate
  ```
- [ ] CORS is configured correctly (api/server.js — `cors` middleware allows only `https://chemie-lernen.org`)
- [ ] CSP headers are set on all responses (nginx config)
- [ ] JWT secret is rotated if compromised or past 90 days
- [ ] Neo4j ports (7687) are not exposed to public internet (bound to `0.0.0.0` on host — verify firewall)
- [ ] `.env` file permissions are `600` (no world-readable secrets)
- [ ] No secrets committed to git (`git diff --cached` check for passwords, API keys)

---

## 6. Monitoring

- [ ] Prometheus targets are all reachable (`http://localhost:9090/targets`)
- [ ] Grafana is accessible and dashboards load (`http://localhost:3000`)
- [ ] Node exporter metrics available (`http://localhost:9100/metrics`)
- [ ] cAdvisor metrics available (`http://localhost:8080/metrics`)
- [ ] Neo4j exporter is running and scraping
- [ ] Alert manager rules loaded (check `docker/prometheus/alerts.yml`)
- [ ] Sentry error tracking is receiving events (check Sentry dashboard)
- [ ] Healthchecks.io reports the site as up

---

## 7. Backups

- [ ] Restic is configured and repository is reachable:
  ```bash
  restic -r /path/to/repo snapshots
  ```
- [ ] Neo4j data backup tested (restic backs up `chemie_neo4j_data` volume)
- [ ] Auth database (api/auth-db.js backing store) is included in backup scope
- [ ] Grafana dashboards are exported and version-controlled in `docker/grafana/dashboards-definitions/`
- [ ] Backup schedule is active (check systemd timer or cron)
- [ ] Restore procedure has been validated within the last 30 days

---

## 8. CI/CD

- [ ] GitHub Actions workflow passes on the target branch (master)
- [ ] Lint (`npm run lint`) passes
- [ ] Format check (`npm run format:check`) passes
- [ ] `npm run validate` passes (lint + format + test + build)
- [ ] Docker images are tagged and pushed to registry:
  - `registry.chemie-lernen.org/chemie-lernen-org:latest`
  - `registry.chemie-lernen.org/chemie-chat-api:latest`

---

## 9. Final Verification (Post-Deploy)

- [ ] Site loads at `https://chemie-lernen.org` with correct HTTPS
- [ ] `www.` redirects to bare domain
- [ ] All API routes return 200 (`/api/health`, `/api/kg-stats`)
- [ ] Chat responds to a test query
- [ ] 404 page renders for unknown routes
- [ ] Pagefind search works (search bar returns results)
- [ ] SSL/TLS certificate is valid (> 14 days until expiry)

---

## Quick Run

```bash
# One-liner for the most critical checks:
docker info \
  && node --version \
  && cypher-shell -u neo4j -p "$NEO4J_PASSWORD" "RETURN 1" \
  && npm test \
  && npm run validate \
  && npm audit --audit-level=moderate \
  && echo "ALL PRE-FLIGHT CHECKS PASSED"
```

---

> **Document owner:** DevOps / Project Lead
> **Review cadence:** Before every production deployment, or weekly if deploying continuously.
