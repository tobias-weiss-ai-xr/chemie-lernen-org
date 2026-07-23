## Security Architecture

### Secrets Migration

```yaml
# docker-compose.yml (before)
environment:
  NEO4J_PASSWORD: chemie_knowledge_2024
  JWT_SECRET: '569f48d79dfa29ba...'

# docker-compose.yml (after)
env_file: .env.production
```

`.env.production` (gitignored, one per environment):

```
NEO4J_PASSWORD=<random-32-char>
JWT_SECRET=<random-64-hex>
SMTP_PASSWORD=<random-16-char>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
HEALTHCHECK_URL=https://hc-ping.com/...
SENTRY_DSN=https://...
FRONTEND_URL=https://chemie-lernen.org
```

### Rate Limit Tiers

| Tier     | Window | Max Requests | Routes                                              | Overflow |
| -------- | ------ | ------------ | --------------------------------------------------- | -------- |
| Strict   | 15 min | 5            | `POST /api/auth/login`, `POST /api/auth/register`   | 429      |
| Default  | 1 min  | 30           | entity/curricula/quizzes/content GET                | 429      |
| Generous | 1 min  | 100          | `POST /api/chat` (premium), `POST /api/exercises/*` | 429      |

Middleware order: rate limiter → auth → handler.

### Off-Site Backup

```
Daily cron:
  1. scripts/backup-all.sh (local dumps)
  2. restic backup /opt/git/hugo-chemie-lernen-org/backups/
  3. restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 3
  4. restic check (verify integrity)
```

Encryption: AES-256-GCM via restic repo key.
Target: Hetzner Storage Box (sftp://uXXXXX@uXXXXX.your-backup.de/backup/chemie-lernen)
