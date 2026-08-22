# Sprint 10: Production Audit

**Goal**: Comprehensive production readiness audit — security, performance, documentation, and monitoring.

## Scope

### Security Audit

- Full OWASP Top 10 assessment of all API endpoints
- Penetration test: auth bypass, injection, XSS, CSRF, rate limit bypass
- Dependency vulnerability scan (Snyk or `npm audit` + `grype`)
- Secrets scanning (truffleHog or git leaks)
- CORS and CSP headers audit
- Session management audit (token storage, expiration, rotation)
- Remediate all findings severity ≥ medium

### Performance Audit

- Lighthouse: target 95+ all categories
- API endpoint latency profiling (p50/p95/p99 for top 10 endpoints)
- Neo4j query analysis (EXPLAIN for slow Cypher queries)
- Bundle size audit: target <50kB gzipped total JS
- Image optimization audit (WebP, lazy loading, srcset)
- CDN/caching strategy review
- Fix top 3 performance bottlenecks

### Documentation

- Complete `README.md` with architecture overview, dev setup, deploy guide
- `docs/ARCHITECTURE.md` — system architecture, data flow diagrams (Mermaid)
- `docs/API.md` — all 33+ API routes with request/response examples
- `docs/DEPLOYMENT.md` — Docker setup, env vars, backup/restore procedures
- `docs/SECURITY.md` — security model, auth flow, responsible disclosure
- `docs/CONTRIBUTING.md` — how to add content, calculators, tests
- API docs as OpenAPI 3.0 spec (`docs/openapi.yaml`)

### Monitoring & Alerting

- Grafana dashboard for key metrics (request rate, error rate, p95 latency, Neo4j queries)
- Alert rules: 5xx rate > 1%, p95 latency > 2s, backup failure, disk > 80%
- Uptime monitoring (healthchecks.io or similar)
- Error tracking (Sentry or similar)
- Log aggregation review (structured JSON logging from Sprint 3)

## Success Criteria

- No security findings ≥ medium severity
- Lighthouse 95+ in all categories
- All API endpoints documented in OpenAPI spec
- Grafana dashboard shows all key metrics
- Alert rules configured and tested
- README and deploy docs complete and accurate
