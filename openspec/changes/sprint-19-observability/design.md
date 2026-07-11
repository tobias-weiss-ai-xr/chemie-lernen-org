## Observability Stack Architecture

### Components

| Service                     | Image                               | Port | Purpose                                      |
| --------------------------- | ----------------------------------- | ---- | -------------------------------------------- |
| `prometheus`                | `prom/prometheus:latest`            | 9090 | Metrics store, scrape all targets            |
| `grafana`                   | `grafana/grafana:latest`            | 3000 | Dashboards, alert rules                      |
| `node_exporter`             | `prom/node-exporter:latest`         | 9100 | Host CPU/mem/disk/network                    |
| `cadvisor`                  | `gcr.io/cadvisor/cadvisor:latest`   | 8080 | Container CPU/mem/filesystem                 |
| `prometheus-neo4j-exporter` | `eformat/neo4j-prometheus-exporter` | 9399 | Neo4j query latency, heap, connections       |
| (in-process)                | —                                   | —    | `express-prom-bundle` middleware on chat-api |

### Data Flow

```
chat-api (express-prom-bundle: /metrics)
neo4j (built-in /metrics on 2004) ──→ Prometheus ──→ Grafana
node_exporter (host:9100)
cadvisor (container:8080)
```

### Sentry

- One DSN per environment (production + dev)
- Capture: unhandled rejections, uncaught exceptions, 5xx responses, rate limit violations
- Integrations: Express via `@sentry/node` request handler + error handler middleware

### Alert Rules

| Rule         | Condition                                                                                        | Channel         |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------- |
| High5xxRate  | `rate(http_requests_duration_seconds_count{status=~"5.."}[5m]) > 0.05`                           | healthchecks.io |
| BackupFailed | `time() - backup_last_success_timestamp > 86400`                                                 | healthchecks.io |
| DiskFull     | `node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.1` | healthchecks.io |
| HighLatency  | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 3`                   | healthchecks.io |
