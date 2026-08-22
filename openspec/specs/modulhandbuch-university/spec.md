# Spec: modulhandbuch-university

**Capability:** University module handbooks (Modulhandbücher) for
top chemistry programs worldwide
**Owners:** Sisyphus (to be implemented via
`changes/integrate-global-modulhandbuecher/`)
**Status:** Active — main spec; data not yet scraped (Marburg source
is a stub)

---

## Purpose

chemie-lernen.org targets German-speaking chemistry learners at the
school level (Klasse 8-13). Many of these learners transition to
university chemistry programs. The platform maintains a structured
representation of **module catalogs (Modulhandbücher)** from top
chemistry universities worldwide, so users can:

- See what topics they will study at university (continuity from school)
- Compare programs across universities
- Link from chemie-lernen.org articles to the university module that
  teaches the concept
- Use the data in the KI-Assistent to answer "Which universities
  teach X?"

This is part of the **Modulhandbuch subset** of the central Neo4j KG
(see `specs/central-kg-architecture/spec.md` REQ-CKG-1).

## Requirements

### REQ-MH-1: Target university list

A non-exhaustive initial target list (top chemistry universities
worldwide). Real scraping depends on each university's data
availability (PDF, HTML, JSON-LD, custom CMS).

| Region | University                                    | Country | Status                     |
| ------ | --------------------------------------------- | ------- | -------------------------- |
| DACH   | Philipps-Universität Marburg                  | DE      | STUB (script returns None) |
| DACH   | TU München                                    | DE      | TODO                       |
| DACH   | ETH Zürich                                    | CH      | TODO                       |
| DACH   | EPFL Lausanne                                 | CH      | TODO                       |
| DACH   | LMU München                                   | DE      | TODO                       |
| DACH   | RWTH Aachen                                   | DE      | TODO                       |
| DACH   | Georg-August-Universität Göttingen            | DE      | TODO                       |
| DACH   | Universität Heidelberg                        | DE      | TODO                       |
| UK     | University of Cambridge                       | UK      | TODO                       |
| UK     | University of Oxford                          | UK      | TODO                       |
| UK     | Imperial College London                       | UK      | TODO                       |
| UK     | University College London (UCL)               | UK      | TODO                       |
| Europe | KTH Royal Institute of Technology             | SE      | TODO                       |
| Europe | Delft University of Technology                | NL      | TODO                       |
| USA    | MIT                                           | US      | TODO                       |
| USA    | Stanford University                           | US      | TODO                       |
| USA    | Caltech                                       | US      | TODO                       |
| USA    | UC Berkeley                                   | US      | TODO                       |
| USA    | Harvard University                            | US      | TODO                       |
| USA    | Princeton University                          | US      | TODO                       |
| Asia   | University of Tokyo                           | JP      | TODO                       |
| Asia   | Tsinghua University                           | CN      | TODO                       |
| Asia   | National University of Singapore (NUS)        | SG      | TODO                       |
| Asia   | Indian Institute of Technology Bombay (IIT-B) | IN      | TODO                       |

Goal: at least 10 universities across 4 regions by end of 2026.

### REQ-MH-2: Neo4j schema

| Label             | Purpose                                       | Key properties                                                   |
| ----------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `:University`     | A university                                  | `name`, `country`, `city`, `website`                             |
| `:Module`         | A module (course unit)                        | `name`, `code`, `ects`, `language`, `level` (BSc/MSc/PhD), `url` |
| `:ModuleOffering` | A specific instance of a module in a semester | `module_id`, `semester` (WS/SS), `year`, `lecturer_ids[]`        |
| `:Lecturer`       | A professor or lecturer                       | `name`, `university_id`, `title`, `email`, `orcid`               |
| `:ECTS`           | An ECTS credit allocation                     | `credits`, `workload_hours`                                      |
| `:Degree`         | A degree program                              | `name` (e.g. "BSc Chemie"), `level`, `university_id`             |

### REQ-MH-3: Relationships

| Type               | From              | To                | Notes                                |
| ------------------ | ----------------- | ----------------- | ------------------------------------ |
| `:OFFERS`          | `:University`     | `:Module`         | which modules the university offers  |
| `:OFFERED_IN`      | `:Module`         | `:ModuleOffering` | when the module runs                 |
| `:TAUGHT_BY`       | `:ModuleOffering` | `:Lecturer`       | who teaches it                       |
| `:PART_OF`         | `:Module`         | `:Degree`         | which degree program                 |
| `:TEACHES`         | `:Module`         | `:Entity`         | which chemie concepts (cross-subset) |
| `:REQUIRES`        | `:Module`         | `:Module`         | prerequisite modules                 |
| `:CARRIES`         | `:Module`         | `:ECTS`           | credit allocation                    |
| `:AFFILIATED_WITH` | `:Lecturer`       | `:University`     | employment                           |

### REQ-MH-4: Data source formats

Each university publishes its module catalog in one of these formats:

| Format            | Example universities                     | Scrapability               |
| ----------------- | ---------------------------------------- | -------------------------- |
| JSON-LD           | Modern CMS (TYPO3, WordPress with Yoast) | Easy                       |
| HTML (semantic)   | ETH Zürich, MIT OCW                      | Medium                     |
| HTML (table-only) | Many German unis                         | Hard                       |
| PDF               | Marburg, older catalogs                  | Very hard (use pdfplumber) |
| Custom API        | Some UK unis                             | Medium                     |

The scraper architecture (REQ-MH-6) must support all formats.

### REQ-MH-5: Data model (JSON shape)

For each module, the canonical shape is:

```json
{
  "university": "ETH Zürich",
  "country": "CH",
  "module_code": "529-0011-00L",
  "module_name": "Anorganische Chemie I",
  "ects": 5,
  "workload_hours": 150,
  "language": "de",
  "level": "BSc",
  "degree": "BSc Chemie",
  "semester_offered": ["WS"],
  "learning_outcomes": ["Die Studierenden verstehen ..."],
  "content": ["Grundlagen der Atomstruktur", "Chemische Bindung", "..."],
  "prerequisites": ["529-0010-00L Allgemeine Chemie"],
  "examination": "schriftliche Prüfung, 90 min",
  "lecturer_ids": ["weiss-eth-001"],
  "url": "https://www.ethz.ch/...",
  "last_checked": "2026-06-26"
}
```

### REQ-MH-6: Scraper architecture

```
scripts/curricula_didaktik/
├── schema.py                   (existing) — module catalog schema
├── diff.py
├── sources/
│   ├── __init__.py             (existing) — REGISTRY
│   ├── kmk.py                  (existing) — KMK scraper
│   ├── marburg_modulhandbuch.py (stub) — needs implementation
│   ├── eth_zurich.py           (TODO) — HTML scrape from ethz.ch
│   ├── tu_muenchen.py          (TODO) — TUMonline scraping
│   ├── cambridge.py            (TODO) — course-catalogue.cam.ac.uk
│   ├── oxford.py               (TODO) — www.ox.ac.uk/courses
│   ├── imperial.py             (TODO) — Imperial course catalog
│   ├── kth.py                  (TODO) — kth.se
│   ├── delft.py                (TODO) — tudelft.nl
│   ├── mit.py                  (TODO) — catalog.mit.edu
│   ├── stanford.py             (TODO) — explorecourses.stanford.edu
│   ├── berkeley.py             (TODO) — classes.berkeley.edu
│   ├── harvard.py              (TODO) — my.harvard.edu/courses
│   ├── princeton.py            (TODO) — registrar.princeton.edu
│   ├── tokyo.py                (TODO) — u-tokyo.ac.jp
│   └── ...                     (other unis as added)
└── scraper.py                  (existing) — orchestrator
```

Each source file is a Python module that:

- Exports `async def scrape() -> list[Module] | None`
- Returns `None` if the source is not yet implemented
- Logs progress to stdout
- Uses `requests` + `pdfplumber` (PDF) or `beautifulsoup4` (HTML) or
  `json` (JSON-LD)

### REQ-MH-7: Import to Neo4j

`scripts/import-modulhandbuch.mjs` reads the scraped JSON and:

1. Creates `:University` nodes (MERGE on `name + country`)
2. Creates `:Degree` nodes (MERGE on `name + university`)
3. Creates `:Module` nodes (MERGE on `module_code + university`)
4. Creates `:ECTS` nodes (MERGE on `module`)
5. Creates `:Lecturer` nodes (MERGE on `name + university`)
6. Creates `:ModuleOffering` nodes (MERGE on `module + semester + year`)
7. Wires all relationships

Idempotent. Exits 0 on partial success.

### REQ-MH-8: Cross-subset integration

When a module has `learning_outcomes` that reference chemie
concepts, the importer:

1. Tokenizes the outcome text
2. Looks up entities in the chemie subset (MATCH (e:Entity) WHERE
   e.name IN $tokens)
3. Creates `:Module -[:TEACHES]-> :Entity` relationships

This is the cross-subset bridge per
`specs/central-kg-architecture/spec.md` REQ-CKG-6.

### REQ-MH-9: API surface

- `GET /api/modulhandbuch/universities` — list all universities
- `GET /api/modulhandbuch/university/{id}/modules` — modules at a uni
- `GET /api/modulhandbuch/module/{code}` — single module detail
- `GET /api/modulhandbuch/lecturer/{id}` — single lecturer
- `GET /api/modulhandbuch/search?q=...` — search across modules
- `GET /api/modulhandbuch/teaches/{entity_name}` — modules that
  teach a chemie concept (cross-subset query)

All routes scope to the `modulhandbuch` subset per
`central-kg-architecture/spec.md` REQ-CKG-3.

### REQ-MH-10: Front-end

- New `/modulhandbuecher/` index — list of universities
- `/modulhandbuecher/{uni_slug}/` — modules at a university
- `/modulhandbuecher/{uni_slug}/{module_code}/` — module detail
- On entity pages: "Universitäten, die dieses Konzept vermitteln"
  with links to the relevant modules

### REQ-MH-11: Module-handbook reachable from the curricula graph

The curricula graph's "Universitäten" scope SHALL surface
`UniversityModule` nodes with their degree/level/ECTS metadata
(read from Neo4j, same subset as `/api/modulhandbuch/*`).

#### Scenario: S-MH-11a: University filter

- **WHEN** the user selects a university short code in the graph scope
  controls
- **THEN** only that university, its modules and their linked entities
  are shown
- **AND** the detail panel offers a link to the existing
  `/modulhandbuch/` page for the university

## Scenarios

### S-MH-1: User browses ETH modules

**Given** the user visits `/modulhandbuecher/eth-zurich/`
**Then** the page lists all 50+ BSc/MSc chemistry modules at ETH
**And** each module shows: code, name, ECTS, semester, lecturer
**And** clicking a module opens `/modulhandbuecher/eth-zurich/529-0011-00L/`
**And** the module page shows learning outcomes, content, and links
to chemie-lernen.org articles for the concepts

### S-MH-2: User sees university link on entity page

**Given** the user visits `/entity/ammoniak/`
**When** the entity is taught by ≥1 module at ≥1 university
**Then** the "Universitäten" section shows the list of modules
**And** each module links to its module detail page
**And** the chemie entity and module are linked via `:TEACHES`

### S-MH-3: KI-Assistent uses Modulhandbuch data

**Given** the user asks "Welche Universitäten lehren Ammoniak im
Bachelor?"
**When** the chat sends `POST /api/chat`
**Then** `getRAGContext` queries the modulhandbuch subset
(per `central-kg-architecture/spec.md`):
`MATCH (m:Module) -[:TEACHES]-> (e:Entity)
 WHERE toLower(e.name) CONTAINS 'ammoniak'
 AND m.level = 'BSc'
 RETURN m.name, m.ects, m.university`
**And** the answer lists the universities + their modules

## References

- `scripts/curricula_didaktik/sources/marburg_modulhandbuch.py` —
  existing stub to be implemented
- `scripts/curricula_didaktik/schema.py` — existing data model
- `scripts/curricula_didaktik/scraper.py` — existing orchestrator
- `docs/KNOWLEDGE_GRAPH_SCHEMA.md` — to be extended with the new
  labels
- `openspec/specs/central-kg-architecture/spec.md` — the architectural
  pattern for this subset
