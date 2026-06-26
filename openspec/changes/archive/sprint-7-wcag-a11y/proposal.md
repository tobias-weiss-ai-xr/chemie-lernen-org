# Change: sprint-7-wcag-a11y (ARCHIVED)

**Status:** Archived (shipped 2026-06-26)
**Commit:** `dcb2ab18`
**Implemented by:** Sisyphus
**Spec impact:** `specs/a11y-compliance/spec.md` (entire spec)

## Why

`pages/barrierefreiheit.md` claimed full WCAG 2.1 AA + BITV 2.0/BFSG
compliance as of 2026-01-04. A targeted audit found 7 concrete gaps
between the legal claim and the implementation. EU Accessibility Act
enforcement started 2025-06-28; we were 10 months behind.

## What changed

- `myhugoapp/static/css/a11y-reduced-motion.css` — new file, the
  `@media (prefers-reduced-motion: reduce)` block
- `myhugoapp/static/css/green-theme.css` — focus indicator
  `:focus-visible { outline: 3px solid #ffc107; }`
- `myhugoapp/layouts/partials/header.html` — removed duplicate
  skip-link
- `myhugoapp/layouts/partials/quiz.html` — added `aria-live="polite"`
  on the result container
- `myhugoapp/layouts/_default/single.html` and
  `myhugoapp/layouts/_default/themenbereiche.html` — color contrast
  fixes: `#28a745` → `#1e7e34`, `#dc3545` → `#a71d2a`
- `myhugoapp/static/js/molekuel-studio.js`,
  `3d-visualizer.js`, `molekuelorbitale.js` — respect
  `prefers-reduced-motion`
- `myhugoapp/static/js/molekuel-studio.js` — dynamic canvas aria-label
  on molecule change
- `myhugoapp/content/pages/barrierefreiheit.md` — refreshed date
  stamps and counts
- `.pa11yci.json` — `level: A` → `level: AA`, URL list expanded to
  8 routes
- `tests/accessibility-validation.test.js` — 9 new local tests

## Capabilities added

- All 7 audit findings closed
- Legal claim in `barrierefreiheit.md` now matches implementation
- 8 routes covered by the pa11y-ci weekly audit
