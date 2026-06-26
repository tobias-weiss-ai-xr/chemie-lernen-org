# Tasks: extend-entity-kg-with-lehrplan (Active)

## Cleanup phase (per AGENTS.md safety rules)

- [ ] **ELP-1** User consent on code-analysis pollution cleanup
- [ ] **ELP-2** Export backup of code-analysis data
- [ ] **ELP-3** Delete code-analysis nodes (Variables, Parameters,
      Functions, Classes, Files, Modules, Interfaces, Directories,
      Repositories, Macros, Structs, Enums, Episodic, no-label)
- [ ] **ELP-4** Verify chemie data intact after cleanup

## Import phase

- [ ] **ELP-5** `scripts/import-didaktik.mjs` (5 KMK guidelines)
- [ ] **ELP-6** Extend `scripts/import-curricula.mjs` (16 states)
- [ ] **ELP-7** Run + verify

## Schema phase

- [ ] **ELP-8** Update `docs/KNOWLEDGE_GRAPH_SCHEMA.md`
- [ ] **ELP-9** Wire `:FULFILLS` and `:COVERS_TOPIC` from
      pre-computed mapping files
- [ ] **ELP-10** Refactor `:Content` node shape

## API phase

- [ ] **ELP-11** 5 new endpoints per `lehrplan-curriculum/spec.md`
      REQ-LP-6

## Front-end phase

- [ ] **ELP-12** `/lehrplaene/` index + per-state pages
- [ ] **ELP-13** Lehrplan-Bezug on entity pages
- [ ] **ELP-14** "Lehrplan" filter chip on Wissensnetz
- [ ] **ELP-15** Extend `getRAGContext` for curriculum nodes

## Testing phase

- [ ] **ELP-16** Extend `tests/kg-data-quality.test.js`
- [ ] **ELP-17** 5 endpoint tests
- [ ] **ELP-18** Playwright test for `/lehrplaene/by/`

## Final

- [ ] **ELP-19** Commit + push
