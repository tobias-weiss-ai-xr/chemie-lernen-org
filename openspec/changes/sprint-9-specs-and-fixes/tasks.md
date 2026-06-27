# Tasks: sprint-9-specs-and-fixes (Proposal)

## Wave 1 — Spec coverage + critical fixes (parallel-friendly)

- [ ] **S9-1** `openspec/specs/calculators/spec.md` — 30+ calculators, framework
- [ ] **S9-2** `openspec/specs/quiz/spec.md` — quiz partial, system, levels
- [ ] **S9-3** `openspec/specs/3d-visualizations/spec.md` — 6 modules, WebXR
- [ ] **S9-4** `openspec/specs/themenbereiche/spec.md` — 12 areas, taxonomy
- [ ] **S9-5** `openspec/specs/pwa/spec.md` — service worker, offline, manifest
- [ ] **S9-7** enhanced-sw.js: fix 3 bugs + register OR remove (decision first)
- [ ] **S9-8** Fix 3 ESLint errors in import-modulhandbuch.mjs

## Wave 2 — After Wave 1

- [ ] **S9-6** Update SPECS_INDEX.md + archive open-spec-coverage
- [ ] **S9-9** npm audit fix (manual + automated)
- [ ] **S9-10** neo4j-driver version alignment
- [ ] **S9-12** orphaned audit-\*.mjs cleanup
- [ ] **S9-13** knowledge-graph snapshot artifact cleanup
- [ ] **S9-14** RATE_LIMIT env override
- [ ] **S9-15** parseFloat || 0 fix
- [ ] **S9-16** bump dev deps (Jest, ESLint, Prettier)
- [ ] **S9-17** minify-calculators.js ESM guard

## Wave 3 — Verification

- [ ] **S9-11** smoke tests for critical scripts
- [ ] **S9-18** `npm run validate` passes
- [ ] **S9-19** `docker build --no-cache -f api/Dockerfile -t test api/` succeeds
- [ ] **S9-20** final review + commit + push
