## Design Decisions

### A1/A2: Premium Gating Wiring

The `requirePremium` middleware already exists in `api/auth.js`. Wiring it into calculator routes and KI-Assistent routes follows the existing pattern:

```js
// api/server.js
import { requirePremium } from './auth.js';

// Premium calculators
app.get('/api/calculators/*', requirePremium, calculatorHandler);

// AI premium features
app.post('/api/chat/premium', requirePremium, premiumChatHandler);
```

The middleware checks `req.user.role === 'premium'` and `premium_until > now`. Returns 403 with upgrade prompt if not premium.

### A3: STRIPE Env Validation

Add to server.js startup, before any routes are registered:

```js
const REQUIRED_ENV = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  'FRONTEND_URL',
];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required env var ${key}`);
    process.exit(1);
  }
}
```

### A4: File Locking

Use `proper-lockfile` or simple `fs.rename`-based advisory locking for `api/auth-db.js`. Lock per user ID, not global, to minimize contention.

### B1: CORS Restriction

Current CORS allows any origin. Restrict to explicit whitelist:

```js
const ALLOWED_ORIGINS = [
  'https://chemie-lernen.org',
  'http://localhost:1313', // Hugo dev
  'http://localhost:3001', // API dev
];
```

### B2: Rate Limiting Tiers

Replace custom in-memory Map with `express-rate-limit`:

| Endpoint pattern   | Limit       | Window |
| ------------------ | ----------- | ------ |
| `/api/auth/*`      | 10 req/min  | 1 min  |
| `/api/chat/*`      | 30 req/min  | 1 min  |
| `/api/entities/*`  | 100 req/min | 1 min  |
| `/api/*` (default) | 60 req/min  | 1 min  |

### B3: Structured Logging

Replace `console.log`/`console.error` with pino:

```js
import pino from 'pino';
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
logger.info({ path: req.path, method: req.method }, 'request');
```

### D1: Unit Converter Design

```js
// UnitConverter class
// Dimensions: pressure, volume, temperature, concentration, mass
// Each dimension has a base unit (SI) and conversion map
// Methods: convert(value, from, to), detectUnit(string), getAvailableUnits(dimension)
```

### E1: IndexedDB Article Cache

Service worker already handles asset caching. For article content caching:

- Open IndexedDB database `chemie-offline` with object store `articles`
- On article page load, store HTML content + metadata
- On offline fetch, serve from IndexedDB if SW cache misses
- LRU eviction at 50MB total

### E2: Quiz Dashboard

Extend `quiz-ui.js` with a dashboard view:

```
┌─────────────────────────────────────────┐
│  Quiz Dashboard                          │
│  ┌─────────────────────────────────┐    │
│  │ Streak: 5 days 🔥   Avg: 78%   │    │
│  ├─────────────────────────────────┤    │
│  │ Recent Results                   │    │
│  │ Säuren & Basen   85%  📅 2d ago│    │
│  │ Redoxreaktionen  72%  📅 5d ago│    │
│  │ Organische Chemie 91% 📅 1w ago│    │
│  ├─────────────────────────────────┤    │
│  │ Weak Areas                       │    │
│  │ ● Stöchiometrie    ⬇ 45%       │    │
│  │ ● Elektrochemie    ⬇ 52%       │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### F1-F4: Housekeeping

- Archive via `openspec archive <name>` for each shipped sprint
- Update task tracking by editing `tasks.md` files to mark [x] completed items
- Spec files follow the template in `openspec/specs/entity-knowledge-graph/spec.md`
