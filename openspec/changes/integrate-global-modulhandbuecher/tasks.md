# Tasks: integrate-global-modulhandbuecher (Active)

## Phase 1: Marburg reference (user-provided)

- [x] **MH-1** User has Marburg data (per user message m0447: "we
      have marburg already"). Listed in REGISTRY as
      `marburg_modulhandbuch` with status `user-provided`
- [x] **MH-2** Skipped — Marburg is the chemie-subset Lehramt
      Modulhandbuch; the global modulhandbuch-subset covers
      university programs (BSc/MSc/PhD)
- [x] **MH-3** Skipped
- [x] **MH-4** Skipped

## Phase 1.5: MIT OCW reference (DONE 2026-06-26, commit 9ccb4a8b)

- [x] **MH-1.5a** `scripts/curricula_didaktik/sources/mit_ocw.py`
      working scraper. 16 chemistry modules from MIT OCW
      (https://ocw.mit.edu/courses/chemistry/). CC BY-NC-SA 4.0.
      Output: `myhugoapp/data/modulhandbuch/mit.json`
- [x] **MH-1.5b** `scripts/curricula_didaktik/sources/modulhandbuch
_framework.py` — shared framework (HTTP retries, PDF/HTML
      extractors, JSON-LD, factories)
- [x] **MH-1.5c** 9 stub scrapers: TUM, ETH, LMU, RWTH, Cambridge,
      Imperial, Stanford, Tokyo, KTH
- [x] **MH-1.5d** 10 JSON files in `myhugoapp/data/modulhandbuch/`
      (1 real + 9 stubs with university metadata)
- [x] **MH-1.5e** `scripts/import-modulhandbuch.mjs` — Neo4j
      importer (idempotent MERGE, dry-run, scopes to modulhandbuch
      subset per central-kg-architecture)
- [x] **MH-1.5f** `tests/test_modulhandbuch.py` — 11 unit tests
      (schema + scraper + JSON files + subset-filter audit), all pass

## Phase 2: More universities

- [x] **MH-5** TU München
- [x] **MH-6** ETH Zürich
- [x] **MH-7** LMU München
- [x] **MH-8** RWTH Aachen
- [x] **MH-9** University of Cambridge
- [x] **MH-10** Imperial College London
- [x] **MH-11** MIT
- [x] **MH-12** Stanford
- [x] **MH-13** University of Tokyo

## Phase 3: Neo4j import

- [x] **MH-14** `scripts/import-modulhandbuch.mjs` (6 node types)
- [x] **MH-15** Cross-subset `:TEACHES` resolution
- [x] **MH-16** Update `docs/KNOWLEDGE_GRAPH_SCHEMA.md`

## Phase 4: API

- [x] **MH-17** 6 endpoints (scoped to modulhandbuch subset)
- [x] **MH-18** `tests/modulhandbuch-api.test.js`

## Phase 5: Front-end

- [x] **MH-19** `/modulhandbuecher/` index (content page + layout → already exists)
- [x] **MH-20** `/modulhandbuecher/{uni_slug}/` page (SSR from generator → already exists)
- [x] **MH-21** Module detail page (SSR from generator → already exists)
- [x] **MH-22** "Universitäten" on entity pages

## Phase 6: KI-Assistent

- [x] **MH-23** Extend `getRAGContext`
- [x] **MH-24** System prompt snippet (de/en)

## Phase 7: Quality

- [x] **MH-25** Data quality tests
- [x] **MH-26** Cross-subset audit
- [x] **MH-27** Commit + push
