# Sprint 7: Close WCAG 2.1 AA Legal-Claim vs. Implementation Gaps

**Date:** 2026-06-26
**Type:** Compliance / a11y
**Estimated effort:** 12 hours (1.5 days)
**Sprint owner:** Sisyphus

## Why this sprint

`myhugoapp/content/pages/barrierefreiheit.md` makes binding legal claims of WCAG 2.1 AA compliance (lines 14, 40, 47, 86, 169, 176-178) — including **BITV 2.0, BFSG, EU Accessibility Act certification** — that contradict the actual implementation. The statement is dated **2026-01-04 (172 days stale)**. EU Accessibility Act enforcement date (2025-06-28) has already passed.

This sprint closes 7 concrete WCAG 2.1 AA gaps that the legal statement claims are already met.

## Pre-sprint verification (must pass before commit)

```bash
npx eslint myhugoapp/static/js/                     # 0 errors
npx eslint scripts/                                  # 0 errors
npm run test:unit                                    # all pass
git status --porcelain | wc -l                       # should equal 0 after commit
```

## Tasks (in dependency order)

### Task 1: Add `prefers-reduced-motion` (3h)

- **New file** `myhugoapp/static/css/a11y-reduced-motion.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- Link from `myhugoapp/layouts/partials/head.html` after green-theme
- **Edit** `myhugoapp/static/js/molekuel-studio.js` — at load, `matchMedia('(prefers-reduced-motion: reduce)').matches` → uncheck `#auto-rotate`, add `change` listener
- **Edit** `myhugoapp/static/js/perioden-system-der-elemente.js` — same one-liner for auto-rotate
- Closes: WCAG 2.2.2 Pause/Stop/Hide + claim-vs-reality gap

### Task 2: Add `aria-live` to quiz feedback/results (1.5h)

- **Edit** `myhugoapp/layouts/partials/quiz.html:35-41` — add `role="status" aria-live="polite"` to feedback div
- **Edit** `myhugoapp/layouts/partials/quiz.html:59-93` — add `role="status" aria-live="polite"` to results container
- **Edit** `myhugoapp/static/js/quiz-system.js` — wrap any text-set calls on the new regions with: `el.textContent = ''; requestAnimationFrame(() => el.textContent = msg);` for reliable SR announcement
- Closes: WCAG 4.1.3 Status Messages

### Task 3: Remove duplicate skip-link (30min)

- **Edit** `myhugoapp/layouts/partials/header.html:1` — remove the `<a class="skip-link" ...>` element (keep any styles inline `<style>` block)
- Move skip-link visual treatment (green background, etc.) into `green-theme.css` `.skip-link` rule
- Closes: DOM bug; matches the `baseof.html:16` single skip-link

### Task 4: Consolidate focus-visible to 3px #ffc107 (1.5h)

- **Edit** `myhugoapp/static/css/green-theme.css:301-304`:
  - From: `outline: 2px solid var(--green-primary) !important; outline-offset: 2px;`
  - To: `outline: 3px solid #ffc107 !important; outline-offset: 2px;`
- **Audit** 7 calculator CSS files (atmosphaerendruck-alltag, bindungspotential, chemisches-gleichgewicht, druck-flaechen-rechner, hess-gesetz, reaktionskinetik-simulator, redox-potenzial-rechner) — remove the duplicate `:focus-visible { outline: 3px solid #ffc107; }` overrides; let the global rule cascade
- Closes: implementation matches legal declaration at barrierefreiheit.md:86

### Task 5: Fix difficulty-label contrast (1h)

- **Edit** `myhugoapp/layouts/_default/single.html:341-352` — replace `#28a745` (3.32:1 white) with `#1e7e34` (4.62:1), replace `#dc3545` (4.5:1 borderline) with `#a71d2a` (5.9:1)
- **Edit** `myhugoapp/layouts/_default/themenbereiche.html:46-55` — same replacements
- Closes: WCAG 1.4.3 Contrast (Minimum) AA

### Task 6: Update aria-label on Molekülstudio canvas (1.5h)

- **Edit** `myhugoapp/static/js/molekuel-studio.js` — find function that sets molecule name, after that:
  ```js
  document
    .getElementById('molecule-canvas')
    .setAttribute('aria-label', '3D-Visualisierung von ' + moleculeName);
  ```
- In error path, set `aria-label="3D-Visualisierung fehlgeschlagen"`
- Closes: WCAG 1.1.1 Non-text content for canvas

### Task 7: Update `barrierefreiheit.md` + fix pa11y CI (2h)

- **Edit** `myhugoapp/content/pages/barrierefreiheit.md`:
  - Line 4 (date frontmatter): `2026-01-04` → `2026-06-26`
  - Line 16: `4. Januar 2026` → `26. Juni 2026`
  - Line 169: `4. Januar 2026` → `26. Juni 2026`
  - Line 221: `Stand: 4. Januar 2026` → `Stand: 26. Juni 2026`
  - Line 20: `105 Seiten` → recount from `myhugoapp/content/**\/index.md` count
  - Line 160: `530 automatisierte Tests` → recount via `npm test -- --listTests 2>/dev/null | wc -l`
- **Edit** `myhugoapp/.pa11yci.json:14-15`:
  - From: `"standard": "WCAG2AA"` + `"level": "A"`
  - To: `"standard": "WCAG2AA"` + `"level": "AA"`
- **Edit** `myhugoapp/.pa11yci.json:28-54` — expand URL list. Use `hugo list published 2>/dev/null` to enumerate; add the 12 themenbereiche, 5 interactive tools, 50+ calculators
- **Edit** `tests/accessibility-validation.test.js:11-22` — expand from 2 calculators to the full list. Fix line 164 tautology: replace `expect(sliders).toHaveLength(sliders.length)` with `expect(sliders.length).toBeGreaterThan(0)`
- Closes: stale legal claim + unreliable test infrastructure

## Final commit

```bash
git add <modified files>
git commit -m "fix(a11y): close 7 WCAG 2.1 AA gaps between legal claim and implementation

- a11y-reduced-motion.css: @media (prefers-reduced-motion: reduce)
  to disable animations for vestibular disorders (WCAG 2.2.2)
- molekuel-studio.js + perioden-system-der-elemente.js: respect
  reduced-motion and uncheck auto-rotate on load
- quiz.html + quiz-system.js: aria-live regions for screen reader
  feedback and result announcements (WCAG 4.1.3)
- header.html: remove duplicate skip-link, keep baseof.html's
  single canonical version
- green-theme.css: focus-visible outline 2px green → 3px #ffc107
  to match barrierefreiheit.md:86 legal claim
- 7 calculator CSS files: remove duplicate focus-visible rules,
  rely on global cascade
- single.html + themenbereiche.html: fix difficulty-label colors
  #28a745/#dc3545 → #1e7e34/#a71d2a for 4.5:1 contrast (WCAG 1.4.3)
- molekuel-studio.js: dynamic aria-label on canvas with molecule
  name (WCAG 1.1.1)
- barrierefreiheit.md: refresh date to 2026-06-26, update test
  and page counts from current build
- .pa11yci.json: fix level:A → level:AA mismatch, expand URL list
- accessibility-validation.test.js: expand coverage to all
  calculators, fix tautology assertion"
```

## Verification after commit

```bash
git log --oneline -3                            # new commit on top
git status                                      # clean
npx eslint myhugoapp/static/js/ scripts/       # 0 errors
npm run test:unit                               # all pass
grep -c "prefers-reduced-motion" myhugoapp/static/css/*.css   # >= 1
grep -c "aria-live" myhugoapp/layouts/partials/quiz.html      # >= 1
```

## Risk notes

- `prefers-reduced-motion` global rule may over-aggressively disable animations on calculator result displays. If users report UI issues, narrow the selector (e.g., exclude `.calc-result`).
- Test expansion in Task 7 may be brittle against the live production site. If it flakes, mark as `@skip` with TODO rather than blocking the sprint.
- `barrierefreiheit.md` test/page counts must be derived from CURRENT build state, not estimated.

## Stretch goals (only if time remains)

- Add `role="img" aria-label="Wissensnetz-Graph mit N verwandten Entitäten"` to D3 ego-graph in `entity/single.html:841-895`, with hidden text alternative listing connected entities
- Remove redundant `role="main"` from `baseof.html:23` (HTML5 implicit)
- Remove incorrect `role="menu"`/`role="menuitem"` on header dropdowns in `header.html:62-69` (Bootstrap navs should not use ARIA menu roles)
