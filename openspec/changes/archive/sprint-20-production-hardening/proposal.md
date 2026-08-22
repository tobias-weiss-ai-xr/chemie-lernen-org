## Why

Production credentials (JWT secret, SMTP password, Neo4j passwords) are hardcoded in `docker-compose.yml`. The CSP allows `unsafe-inline` and `unsafe-eval`. CORS is unrestricted. There's no rate limiting on auth, chat, or entity endpoints. All backups stay on the same host — a host failure means total data loss. The `auth-db.js` user store isn't backed up at all. This sprint locks down the production surface and implements disaster recovery.

## What Changes

- Move all secrets from `docker-compose.yml` to `.env` file (gitignored) or Docker secrets
- Restrict CORS to `chemie-lernen.org` and localhost dev origins
- Replace `unsafe-inline`/`unsafe-eval` CSP with nonce-based or hash-based policy
- Implement `express-rate-limit` with 3 tiers: strict (5/min auth), default (30/min), generous (100/min)
- Set up off-site backup via restic to Hetzner Storage Box with encryption
- Add `auth-db.js` to backup rotation
- Remove deprecated `scripts/neo4j-backup.sh` (v4 syntax, broken on 5.x)
- Add `npm audit` and `depcheck` to CI pipeline
- Remove orphaned `nginx-pwa-config.conf`

## Capabilities

### Modified Capabilities

- `central-kg-architecture` — backup includes Neo4j + auth-db
- `ai-assistant` — rate-limited chat endpoint
- (security is cross-cutting)

## Impact

- **Infrastructure**: Off-site backup target added; docker-compose.yml restructured for env-file secrets
- **Dependencies**: `express-rate-limit`
- **Risk**: CSP changes may break inline event handlers in calculator JS — audit required
