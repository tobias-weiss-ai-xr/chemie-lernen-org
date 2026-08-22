# Sprint: Completion Sprint

**Goal**: Close all partially-finished work from Sprints 1-7, sync OpenSpec tracking to reality, and archive shipped work. Result: a clean slate for Sprints 17+.

## Why

The platform has 16 shipped sprints interleaved with stale OpenSpec task tracking showing 0% completion. Sprints 1-7 contain medium-priority polish items (env validation, cross-linking, calculator i18n, hardening, PWA caching) that were deferred for feature work. These accumulate technical debt and make deployment riskier. A dedicated completion sprint clears the deck.

## Scope

### WP A — Premium Wiring (Sprint 1 leftovers)

- Wire `requirePremium` middleware into premium calculator routes + KI-Assistent
- Add STRIPE\_\* env vars to startup validation (fail if missing)
- Add file locking to `auth-db.js` for concurrent `users.json` writes
- Write integration tests for Stripe checkout flow

### WP B — Platform Hardening (Sprint 3 leftovers)

- Audit CORS config → restrict to `https://chemie-lernen.org`
- Install `express-rate-limit` with tiered config
- Switch to pino structured JSON logging
- Add Prometheus metrics endpoint (`GET /api/metrics`)
- Create backup systemd timer + document off-site target
- Run `npm audit` + `depcheck` cleanup
- Verify OWASP Top 10 compliance (document findings)

### WP C — Content Polish (Sprint 4 leftovers)

- Verify cross-linking coverage, add badge partial to article footer
- Create `GET /api/content/cross-link-stats` endpoint
- Add `last_reviewed` to article frontmatter
- Create `scripts/audit-content-freshness.mjs`
- Document content workflow in CONTRIBUTING.md

### WP D — Calculator Polish (Sprint 5 leftovers)

- Create `static/js/utils/unit-converter.js` (5 dimensions, SI base units)
- Create `static/js/i18n/calculators-de.json` with German labels
- Add `data-i18n` attributes to calculator HTML templates
- Register 3 new calculators in LazyLoader
- Write unit-converter Jest tests

### WP E — PWA + Quiz Polish (Sprints 6-7 leftovers)

- Implement IndexedDB cache for visited articles
- Build quiz dashboard (recent, streak, weak areas)
- Wire quiz results into `auth-db users.json`
- Run Lighthouse PWA audit and fix findings

### WP F — Housekeeping

- Archive sprints 12-16 as shipped
- Update OpenSpec task tracking across all open sprints
- Write remaining open-spec-coverage spec files (5 specs)
- Close stale OpenSpec changes (sprint-8, sprint-9, sprint-10, sprint-13, sprint-14)

## Out of Scope

- Sprint 17 Offline-First Mobile implementation
- Sprint 18 Exam Preparation
- Roadmap 19-21 work
- Major refactoring beyond what's needed for these tasks

## Risks

- Unit converter dimension coverage may expand scope if gas law constants are needed
- Lighthouse PWA audit may reveal fundamental issues requiring architecture changes
- OpenSpec task sync is manual — risk of missing shipped items
