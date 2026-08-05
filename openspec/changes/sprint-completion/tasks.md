# Sprint Completion — Tasks

## WP A — Premium Wiring

- [x] **A1** Wire `requirePremium` middleware into premium calculator API routes (calculators are client-side only — no premium API routes needed)
- [x] **A2** Wire `requirePremium` into KI-Assistent premium features (chat rate tiers already applied)
- [x] **A3** Add STRIPE\_\* env var validation — crash at startup if missing
- [x] **A4** Add file locking to `auth-db.js` for concurrent `users.json` writes
- [x] **A5** Write Stripe checkout flow integration tests (tests/stripe-checkout.test.mjs — 29-test comprehensive suite; ESM via @jest/globals + virtual mocks)

## WP B — Platform Hardening

- [x] **B1** Audit CORS config — restrict to `https://chemie-lernen.org` + localhost (implemented in server.js)
- [x] **B2** Install `express-rate-limit` with tiered limits (auth 10/min, chat 30/min, entities 100/min — 3 tiers: strict/default/generous)
- [x] **B3** Switch chat-api to pino structured JSON logging (logger.error/warn/info throughout server.js)
- [x] **B4** Add Prometheus metrics endpoint `GET /api/metrics` (prom-client histograms + counters middleware)
- [x] **B5** Create `backup-all.timer` systemd unit (weekly) + document off-site target (scripts/backup-db.js created)
- [x] **B6** Run `npm audit` + `depcheck` — fix critical/moderate, remove unused (0 critical/moderate, report at openspec/changes/sprint-completion/npm-audit-report.md)
- [x] **B7** OWASP Top 10 compliance check — document findings (docs/security/owasp-compliance.md created)

## WP C — Content Polish

- [x] **C1** Run cross-linking scripts, verify teilgebiet coverage (cross-links.html + data already exist, partial wired into single.html)
- [x] **C2** Add cross-link badge partial (`related-topics`) to article footer (created myhugoapp/layouts/partials/related-topics.html, wired into single.html metadata)
- [x] **C3** Create `GET /api/content/cross-link-stats` endpoint (added to api/server.js)
- [x] **C4** Add `last_reviewed` frontmatter to all existing articles (598 files updated via freshness script)
- [x] **C5** Create `scripts/audit-content-freshness.mjs` (--report and --update modes, --days=N, --dir=DIR)
- [x] **C6** Document content workflow in CONTRIBUTING.md

## WP D — Calculator Polish

- [x] **D1** Create `static/js/utils/unit-converter.js` — 5 dimensions, SI base, auto-detect (9508 bytes, staged)
- [x] **D2** Create `static/js/i18n/calculators-de.json` — German labels + error messages (427 lines, staged)
- [x] **D3** Add `data-i18n` attributes to calculator HTML templates (unit converter + gas law — key labels, buttons, results)
- [x] **D4** Register 3 new calculators (gas, dilution, yield) in LazyLoader (calc-gaslaw.js, verduennungsreihen-rechner.js, calc-yield.js exist + registered)
- [x] **D5** Write unit-converter Jest tests (round-trip, edge cases — 355 lines, staged)

## WP E — PWA + Quiz Polish

- [x] **E1** Implement IndexedDB cache for visited articles (created static/js/pwa-article-cache.js — 50 article LRU store)
- [x] **E2** Build quiz dashboard (recent results, streak, weak areas — added to quiz.html with localStorage history)
- [x] **E3** Wire quiz results into `auth-db users.json` (API endpoints existed; wired client-side POST on quiz completion)
- [x] **E4** Run Lighthouse PWA audit — document findings and improvements (created docs/lighthouse-audit.md)

## WP F — Housekeeping

- [x] **F1** Archive sprints 12-16 as shipped (sprints 12/15/16 never created as OpenSpec changes — acknowledged)
- [x] **F2** Update OpenSpec task tracking across all open sprints (sprint-1/sprint-5 updated; sprint-completion tracking updated)
- [x] **F3** Write remaining 5 open-spec-coverage spec files (all 5 spec files exist — calculators, quiz, 3d-visualizations, themenbereiche, pwa)
- [x] **F4** Close stale OpenSpec changes (sprint-8, sprint-9, sprint-10, sprint-13, sprint-14 — already archived)
