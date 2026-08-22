## Why

The platform has zero production observability. Neo4j query latency, API p95, error rates, and container health are all blind spots. When something breaks, the only way to diagnose is SSH into the host and read `docker logs`. This sprint adds a complete observability stack: Prometheus metrics, Grafana dashboards, Sentry error tracking, structured JSON logging, and healthchecks.io pings in both deploy and backup workflows.

## What Changes

- Add Prometheus scrape targets: `node_exporter`, `cadvisor`, `neo4j-exporter`, `express-prom-bundle` for chat-api
- Add Grafana with provisioned dashboards (4 panels: request rate, 5xx, p95, Neo4j heap/queries)
- Integrate Sentry SDK into `api/server.js` for error tracking
- Convert remaining `console.log/warn` statements to pino structured JSON logging
- Wire healthchecks.io into deploy workflow (post-deploy ping) and backup cron
- Define alert rules (5xx spike >5%, backup failure, disk >90%, p95 >3s)
- Write `docs/OBSERVABILITY.md` documenting stack, dashboards, and runbooks

## Capabilities

### Modified Capabilities

- `calculators` / `quiz` / `ai-assistant` — all benefit from error tracking and latency monitoring

## Impact

- **Infrastructure**: 3-4 new sidecar containers (prometheus, grafana, node_exporter, cadvisor) added to docker-compose.yml
- **Dependencies**: `@sentry/node`, `express-prom-bundle`, `pino`
- **Configuration**: Grafana dashboards provisioned via config maps; alert rules in PrometheusRule files
