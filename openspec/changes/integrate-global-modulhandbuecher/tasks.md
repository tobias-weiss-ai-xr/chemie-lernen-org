# Tasks: integrate-global-modulhandbuecher (Active)

## Phase 1: Marburg reference implementation

- [ ] **MH-1** Find Marburg Modulhandbuch PDF URL
- [ ] **MH-2** Implement `marburg_modulhandbuch.py` (pdfplumber)
- [ ] **MH-3** Verify JSON shape per REQ-MH-5
- [ ] **MH-4** Save to `myhugoapp/data/modulhandbuch/marburg.json`

## Phase 2: More universities

- [ ] **MH-5** TU München
- [ ] **MH-6** ETH Zürich
- [ ] **MH-7** LMU München
- [ ] **MH-8** RWTH Aachen
- [ ] **MH-9** University of Cambridge
- [ ] **MH-10** Imperial College London
- [ ] **MH-11** MIT
- [ ] **MH-12** Stanford
- [ ] **MH-13** University of Tokyo

## Phase 3: Neo4j import

- [ ] **MH-14** `scripts/import-modulhandbuch.mjs` (6 node types)
- [ ] **MH-15** Cross-subset `:TEACHES` resolution
- [ ] **MH-16** Update `docs/KNOWLEDGE_GRAPH_SCHEMA.md`

## Phase 4: API

- [ ] **MH-17** 6 endpoints (scoped to modulhandbuch subset)
- [ ] **MH-18** `tests/modulhandbuch-api.test.js`

## Phase 5: Front-end

- [ ] **MH-19** `/modulhandbuecher/` index
- [ ] **MH-20** `/modulhandbuecher/{uni_slug}/` page
- [ ] **MH-21** Module detail page
- [ ] **MH-22** "Universitäten" on entity pages

## Phase 6: KI-Assistent

- [ ] **MH-23** Extend `getRAGContext`
- [ ] **MH-24** System prompt snippet (de/en)

## Phase 7: Quality

- [ ] **MH-25** Data quality tests
- [ ] **MH-26** Cross-subset audit
- [ ] **MH-27** Commit + push
