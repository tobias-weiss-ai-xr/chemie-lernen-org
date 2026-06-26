# Change: open-spec-coverage (Active)

**Status:** Active
**Spec impact:** Adds 5 main capability specs (calculators, quiz, 3d-visualizations, themenbereiche, pwa)

## Why

The OpenSpec bootstrap on 2026-06-26 created 4 main specs:
`entity-knowledge-graph`, `ai-assistant`, `a11y-compliance`,
`wissensnetz-graph`. These cover the recent sprint work but miss
several major capabilities that are referenced throughout AGENTS.md
and the roadmap:

- **Calculators** (`/rechner/*`): 30+ chemistry calculators using the
  `ChemistryCalculator` framework — covered in AGENTS.md but no spec
- **Quiz system** (`/quiz/` + `static/js/quiz-system.js`): interactive
  chemistry quiz with difficulty levels, used across the platform
- **3D visualizations** (Molekül-Studio, Periodensystem VR, etc.):
  6 WebXR/Three.js modules in `static/js/visualization/`
- **Themenbereiche** (12 subject areas): the main content taxonomy
  of the platform
- **PWA** (offline support, service worker, manifest)

Without specs for these, future changes will continue to drift from
the documented behavior.

## What changed

- `openspec/specs/calculators/spec.md` — new
- `openspec/specs/quiz/spec.md` — new
- `openspec/specs/3d-visualizations/spec.md` — new
- `openspec/specs/themenbereiche/spec.md` — new
- `openspec/specs/pwa/spec.md` — new
- `openspec/SPECS_INDEX.md` — updated

## Tasks

- [ ] **CSC-1** Write `openspec/specs/calculators/spec.md` covering
      the 30+ calculator pages, the `ChemistryCalculator` framework, the
      `chemistry-utils.js` shared globals, and the `lazy-loader.js` setup
- [ ] **CSC-2** Write `openspec/specs/quiz/spec.md` covering the
      quiz partial, `quiz-system.js`, the 3 difficulty levels
      (Leicht/Mittel/Schwer), the localStorage progress tracking
- [ ] **CSC-3** Write `openspec/specs/3d-visualizations/spec.md`
      covering the 6 visualization modules (molekuel-studio,
      perioden-system-der-elemente, molekuelorbitale, 3d-visualizer,
      chart-manager, periodic-table-viz), the WebXR integration, the
      `prefers-reduced-motion` handling inherited from a11y-compliance
- [ ] **CSC-4** Write `openspec/specs/themenbereiche/spec.md`
      covering the 12 subject areas, the article taxonomy, the
      cross-linking patterns, the P0 work to expand from 1-3 to 3-5
      articles per area
- [ ] **CSC-5** Write `openspec/specs/pwa/spec.md` covering the
      service worker, the offline page, the manifest, the PWA fix from
      commit `182d98e8`
- [ ] **CSC-6** Update `openspec/SPECS_INDEX.md` with all 5 new
      capabilities

## Status

In progress.
