# Change: sprint-9-specs-and-fixes (Proposal)

**Status:** Proposal
**Spec impact:** Adds 5 capability specs (completing open-spec-coverage), may update existing specs
**Duration:** ~5-7d

## Why

The gaps/audit session identified 17 code quality findings across the
codebase: 3 critical, 4 high, 6 medium, 4 low. Sprint 9 addresses all
critical, most high, and several quick-win medium/low items — while
completing the spec coverage that `open-spec-coverage` started (5 specs
currently unwritten: calculators, quiz, 3d-visualizations, themenbereiche,
pwa). Doing spec coverage + critical fixes in one sprint ensures that
immediate code quality issues don't pile up while spec writing improves
the team's shared understanding of the stack.

## What changed

### Spec coverage (absorbs `open-spec-coverage`)

- `openspec/specs/calculators/spec.md` — new
- `openspec/specs/quiz/spec.md` — new
- `openspec/specs/3d-visualizations/spec.md` — new
- `openspec/specs/themenbereiche/spec.md` — new
- `openspec/specs/pwa/spec.md` — new
- `openspec/SPECS_INDEX.md` — updated

### Critical fixes

- `myhugoapp/static/js/enhanced-sw.js` — either fixed+registered or removed
- `scripts/import-modulhandbuch.mjs` — 3 unused vars removed
- `package.json` / `package-lock.json` — npm audit fix

### High

- `api/package.json` — neo4j-driver aligned with root version
- Various scripts — add unit smoke test coverage
- 265 ESLint warnings: reduce by 20% via `eslint --fix` and targeted ignores

### Medium (quick wins)

- `scripts/audit-*.mjs` — remove if unused, archive if needed
- Root directory — remove knowledge-graph snapshot `.json` artifacts
- `api/server.js` — `RATE_LIMIT` reads from env with `50` default
- `myhugoapp/static/js/utils/chemistry-utils.js` — fix `parseFloat(v) || 0`

### Low

- `package.json` — bump Jest 29→30, ESLint 9→10, Prettier 3.8.4→3.8.5
- `scripts/minify-calculators.js` — guard against mangling ESM imports

## Tasks

### Spec coverage (6 tasks)

- [ ] **S9-1** Write `openspec/specs/calculators/spec.md` covering 30+ calculator pages, ChemistryCalculator framework, chemistry-utils.js globals, lazy-loader.js setup
- [ ] **S9-2** Write `openspec/specs/quiz/spec.md` covering quiz partial, quiz-system.js, 3 difficulty levels, localStorage progress tracking
- [ ] **S9-3** Write `openspec/specs/3d-visualizations/spec.md` covering 6 visualization modules (molekuel-studio, perioden-system, molekuelorbitale, 3d-visualizer, chart-manager, periodic-table-viz), WebXR integration, prefers-reduced-motion handling
- [ ] **S9-4** Write `openspec/specs/themenbereiche/spec.md` covering 12 subject areas, article taxonomy, cross-linking patterns, expansion target (3-5 articles/area)
- [ ] **S9-5** Write `openspec/specs/pwa/spec.md` covering service worker (enhanced-sw.js or sw.js), offline page, manifest, PWA fix from commit 182d98e8
- [ ] **S9-6** Update `openspec/SPECS_INDEX.md` with all 5 new capabilities; archive `open-spec-coverage`

### Critical fixes (3 tasks)

- [ ] **S9-7** Decide enhanced-sw.js fate — if kept: fix 3 bugs (no-op fetch, non-awaited json(), missing null check on event.data), register in baseof.html, keep old sw.js as fallback. If removed: delete file, confirm no imports, confirm no PWA regression
- [ ] **S9-8** Fix 3 ESLint errors in `scripts/import-modulhandbuch.mjs` (unused vars: `cheerio`, `csvData`, `schema`)
- [ ] **S9-9** Run `npm audit fix`; fix remaining vulnerabilities manually where breaking; document pre-existing vuln counts per package

### High (2 tasks)

- [ ] **S9-10** Align neo4j-driver version: `api/package.json` ^5.15.0 → ^6.1.0 (match root); verify `server.js` imports still work; run `docker build` test
- [ ] **S9-11** Add smoke tests for critical scripts: `analyze-content.mjs`, `import-modulhandbuch.mjs`, `minify-calculators.js` — each gets a Jest unit test verifying it can parse valid input

### Medium quick wins (4 tasks)

- [ ] **S9-12** Clean orphaned `scripts/audit-*.mjs` (340 lines) — review each; keep useful, archive/delete unused
- [ ] **S9-13** Remove knowledge-graph snapshot `.json` artifacts from repo root; add to `.gitignore` if generated at build time
- [ ] **S9-14** `api/server.js`: `RATE_LIMIT` → read from `process.env.RATE_LIMIT || 50`
- [ ] **S9-15** `chemistry-utils.js`: `parseFloat(v) || 0` → explicit `Number.isFinite` check; add test for empty-string, NaN, undefined inputs

### Low (2 tasks)

- [ ] **S9-16** Bump dev deps: Jest 29→30, ESLint 9→10, Prettier 3.8.4→3.8.5; run `npm test` + `npm run validate` after
- [ ] **S9-17** `scripts/minify-calculators.js`: guard ESM files (`*.module.js`, `three/**/*.js`) from mangling; confirm with `npm run minify` test

## Depends On

- `open-spec-coverage` should be completed (or absorbed into this change before archival)

## Status

Proposal — ready for review.
