# Change: integrate-global-modulhandbuecher (Active)

**Status:** Active (proposal stage)
**Spec impact:** New main spec `modulhandbuch-university/spec.md`

## Why

The Marburg Modulhandbuch source (`scripts/curricula_didaktik/sources/
marburg_modulhandbuch.py`) is a stub that returns `None` with a
"needs URL research" comment. The user wants to integrate module
catalogs from top chemistry universities worldwide so chemie-lernen
.org can show users the university-level continuation of school
chemistry.

This is a new subset in the central Neo4j KG (per
`central-kg-architecture/spec.md`). The data is separate from chemie
content but cross-references it via `:TEACHES → :Entity`.

## What changed (planned)

1. **Implement the Marburg scraper** as the reference implementation
   (PDF or HTML, depending on the Marburg catalog format)
2. **Add 9 more scrapers** for top DACH + UK + Europe + USA + Asia
   universities per `modulhandbuch-university/spec.md` REQ-MH-1
3. **Write `scripts/import-modulhandbuch.mjs`** for the Neo4j import
4. **Add 6 API endpoints** per REQ-MH-9
5. **Build 3 front-end pages** (uni index, uni modules, module
   detail) per REQ-MH-10
6. **Cross-subset integration** with chemie entities via `:TEACHES`
7. **Extend `getRAGContext`** to include modulhandbuch data when
   the user asks about university programs

## Tasks

### Phase 1: Marburg reference implementation

- [ ] **MH-1** Find the actual Marburg Modulhandbuch PDF URL
      (https://www.uni-marburg.de/de/fb15/studium/studiengaenge/
      lehramt-chemie)
- [ ] **MH-2** Implement `marburg_modulhandbuch.py` to parse the PDF
      with `pdfplumber`
- [ ] **MH-3** Verify output matches `modulhandbuch-university/spec.md`
      REQ-MH-5 JSON shape
- [ ] **MH-4** Save output to `myhugoapp/data/modulhandbuch/
marburg.json`

### Phase 2: More universities (priority order)

- [ ] **MH-5** TU München (Germany)
- [ ] **MH-6** ETH Zürich (Switzerland)
- [ ] **MH-7** LMU München (Germany)
- [ ] **MH-8** RWTH Aachen (Germany)
- [ ] **MH-9** University of Cambridge (UK)
- [ ] **MH-10** Imperial College London (UK)
- [ ] **MH-11** MIT (USA)
- [ ] **MH-12** Stanford (USA)
- [ ] **MH-13** University of Tokyo (Asia)

### Phase 3: Neo4j import

- [ ] **MH-14** Create `scripts/import-modulhandbuch.mjs` (idempotent
      MERGE for all 6 node types)
- [ ] **MH-15** Add cross-subset `:TEACHES → :Entity` resolution
      (tokenize learning outcomes, look up entities, wire relationship)
- [ ] **MH-16** Update `docs/KNOWLEDGE_GRAPH_SCHEMA.md` with new
      labels

### Phase 4: API

- [ ] **MH-17** Add 6 endpoints per REQ-MH-9, all using
      `subsetMatch('modulhandbuch')` from `_neo4j-subset-filter.mjs`
- [ ] **MH-18** Add endpoint tests in `tests/modulhandbuch-api.test.js`

### Phase 5: Front-end

- [ ] **MH-19** `/modulhandbuecher/` index page
- [ ] **MH-20** `/modulhandbuecher/{uni_slug}/` page
- [ ] **MH-21** `/modulhandbuecher/{uni_slug}/{code}/` detail page
- [ ] **MH-22** "Universitäten" section on entity pages (cross-subset
      query)

### Phase 6: KI-Assistent integration

- [ ] **MH-23** Extend `getRAGContext` to detect university-related
      queries and query the modulhandbuch subset
- [ ] **MH-24** Add system-prompt snippet for "University programs"
      in de/en

### Phase 7: Quality

- [ ] **MH-25** Add data-quality tests for the modulhandbuch subset
      (per REQ-MH-3, REQ-MH-5)
- [ ] **MH-26** Add cross-subset audit (every `:TEACHES` target
      must be a chemie `:Entity`)
- [ ] **MH-27** Commit + push

## Risks

- **Web scraping fragility**: many universities change their CMS
  without notice. Mitigate with: weekly `scraper.py` cron, alert on
  schema change
- **PDF parsing accuracy**: Marburg is PDF, low quality. Mitigate
  with: human review of first 10 modules, mark uncertain extractions
- **Cross-subset query performance**: 700k+ non-modulhandbuch nodes
  in the same DB. Mitigate with: always scope to
  `subsetMatch('modulhandbuch')` (per central-kg-architecture spec)

## Open questions

1. **Authenticating scrapers**: some unis (e.g. TUMonline) require
   login. Do we accept partial data, or invest in auth?
2. **Cross-language module names**: German for DACH, English for
   UK/USA/Asia. How do we match a German "Anorganische Chemie I" to
   an English "Inorganic Chemistry I" of the same content?
3. **ECTS conversion**: US unis use credit hours, not ECTS. Do we
   store the original + a converted value?

## Status

In progress (proposal stage, awaiting user go-ahead to start
Phase 1).
