# Observability Stack — chemie-lernen.org

## Stack Overview

```
                            ┌───────────────┐
                            │   Grafana     │ ← grafana.chemie-lernen.org (port 3000)
                            │ (provisioned) │
                            └───────┬───────┘
                                    │ PromQL queries
                            ┌───────▼───────┐
                            │   Prometheus  │ ← prometheus.chemie-lernen.org (port 9090)
                            │  (30d retention│
                            └───┬───┬───┬───┘
                                │   │   │
               ┌────────────────┘   │   └────────────────┐
               ▼                    ▼                    ▼
        ┌───────────┐      ┌──────────────┐     ┌──────────────┐
        │ Chat API  │      │ Node Exporter│     │   cAdvisor   │
        │ :3001/api/│      │ host:9100    │     │ container:8080│
        │ metrics   │      │ (CPU/disk/   │     │ (container   │
        │ (express- │      │  mem/network) │     │  metrics)    │
        │ prom-     │      └──────────────┘     └──────────────┘
        │ bundle)   │
        └───────────┘
                │
        ┌───────▼───────┐
        │Neo4j Exporter │ ← Neo4j query latency, heap, connections
        │ port:9399     │
        └───────────────┘
```

## Services

| Service         | Purpose                                | Port | URL                          |
| --------------- | -------------------------------------- | ---- | ---------------------------- |
| Prometheus      | Metrics store, scrape all targets      | 9090 | prometheus.chemie-lernen.org |
| Grafana         | Dashboards + alerting                  | 3000 | grafana.chemie-lernen.org    |
| Node Exporter   | Host CPU/mem/disk/network              | 9100 | —                            |
| cAdvisor        | Container CPU/mem/filesystem           | 8080 | —                            |
| Neo4j Exporter  | Neo4j query latency, heap, connections | 9399 | —                            |
| Sentry          | Error tracking                         | —    | sentry.io (external)         |
| healthchecks.io | Uptime monitoring                      | —    | healthchecks.io (external)   |

## Error Tracking (Sentry)

Sentry captures:

- Unhandled rejections and uncaught exceptions
- 5xx server errors
- Rate limit violations
- LiteLLM upstream failures

Configuration: Set `SENTRY_DSN` environment variable on `chemie-chat-api` service.

## Alert Rules

| Rule         | Condition                     | Channel         | Action                                                             |
| ------------ | ----------------------------- | --------------- | ------------------------------------------------------------------ |
| High5xxRate  | `rate(5xx[5m]) > 5%` for 5min | healthchecks.io | Check chat-api logs: `docker logs chemie-chat-api --tail 100`      |
| BackupFailed | No successful backup in 24h   | healthchecks.io | Check backup logs: `cat scripts/backups/logs/master.log`           |
| DiskFull     | Disk usage > 90%              | healthchecks.io | Clean old images: `docker image prune -af`, check logs rotation    |
| HighLatency  | p95 latency > 3s for 5min     | healthchecks.io | Check Neo4j load: query cypher-shell, check LiteLLM response times |

## Quick-Ref: docker logs

```bash
# Chat API (primary service)
docker logs chemie-chat-api --tail 50 -f

# Neo4j knowledge graph
docker logs chemie-neo4j --tail 50

# Neo4j chemistry subset
docker logs chemie-kg --tail 50

# nginx
docker logs hugo-chemie-lernen-org --tail 50

# All services
docker compose logs --tail 20 -f

# Prometheus
docker logs prometheus --tail 50

# Grafana
docker logs grafana --tail 50
```

## Backup Monitoring

The `scripts/backup-all.sh` script pings healthchecks.io after each run:

- On success: `$HEALTHCHECK_URL` (HTTP 200 OK)
- On failure: `$HEALTHCHECK_URL/fail` (HTTP 200, but marks as failed)

Set `HEALTHCHECK_URL` env var to enable. Example:

```
HEALTHCHECK_URL=https://hc-ping.com/your-uuid-here
```

## Dashboards

Access Grafana at https://grafana.chemie-lernen.org (default login: admin/admin).

Provisioned dashboard: **Chemie Overview** includes:

1. Request Rate (req/s) — total HTTP requests per second
2. 5xx Error Rate — percentage of 5xx responses
3. p95 Latency — 95th percentile response time in ms
4. Container CPU — per-container CPU usage
5. Container Memory — per-container memory usage
6. Disk Usage — host filesystem fullness

## Adding New Metrics

To add Prometheus metrics to the chat-api:

1. In server.js, access the `promClient` from express-prom-bundle
2. Create a new Counter/Histogram/Gauge
3. Increment/observe at the relevant code point
4. The metric is automatically available at `/api/metrics`

## Runbook: Investigating an Alert

1. **High 5xx Rate**: `docker logs chemie-chat-api --tail 100 | grep "status=5"` — check Neo4j connectivity, LiteLLM status
2. **High Latency**: `docker logs chemie-chat-api --tail 50 | grep "duration"` — check for slow Neo4j queries
3. **Backup Failed**: `cat scripts/backups/logs/master.log` — check individual backup exit codes
4. **Disk Full**: `df -h` — `docker image prune -af` — rotate logs
