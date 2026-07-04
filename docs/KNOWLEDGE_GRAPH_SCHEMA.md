# Knowledge Graph Schema

**Status:** consolidated from all code paths
**Date:** 2026-06-28
**DB:** Neo4j 5.26, `chemie` database, `bolt://chemie-neo4j:7687`

## Subset isolation

The `chemie` database is a central knowledge graph serving multiple subsets.
The **chemie subset** is scoped by the following labels (see `scripts/_neo4j-subset-filter.mjs`):

| Label               | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `Entity`            | Core chemistry concepts                                         |
| `Document`          | Articles/pages                                                  |
| `Tag`               | Tags                                                            |
| `Content`           | Curriculum / content nodes                                      |
| `Category`          | Kategorie proxy nodes                                           |
| `Curriculum`        | Lehrplan (curriculum per state)                                 |
| `Topic`             | Topic within a curriculum                                       |
| `SubTopic`          | Sub-topic within a topic                                        |
| `LearningObjective` | Lernziel (learning objective)                                   |
| `DidacticGuideline` | KMK didactic guideline                                          |
| `GuidelineSection`  | Section within a didactic guideline                             |
| `University`        | University (active — 10 institutions, ETH/MIT/TUM with modules) |
| `UniversityModule`  | Study module (active — 55 modules from ETH, MIT, TUM)           |
| `Degree`            | Degree program offered by a university (active — 7 records)     |
| `ModuleOffering`    | Semester-specific module offering (active)                      |
| `Lecturer`          | Module lecturer (active)                                        |
| `ECTS`              | Credit point record (active — 55 credits linked to modules)     |

All Cypher queries **must** scope to the chemie subset via label checks. Use `subsetMatch()` (labels) or `subsetWhere()` (Cypher `WHERE`) from `_neo4j-subset-filter.mjs` for generic MATCH queries. Code-analysis nodes (~683k `Variable`, `Function`, `Class`, …) live in the same DB but are excluded from chemie queries.

## Node labels

| Label                | Purpose                                                        | Key properties                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:Entity`            | Core chemistry concept (Wasser, Kohlenstoff, Elektrolyse …)    | `name` (PK, lowercased), `kategorie`, `description`, `symbol`, `ordnungszahl`, `state`, `grade`, `school_type`, `objective_count`, `articleCount`, `components[]`, `relatedEntities[]` |
| `:Document`          | Article or page that mentions entities                         | `title`, `url`, `type` (`page`/`article`), `date`, `entities[]`                                                                                                                        |
| `:Tag`               | Tag attached to entities (KMK standard, source type)           | `name`, `kind` (`kmk` / `quelle` / `topic`)                                                                                                                                            |
| `:Content`           | Site content node (article, calculator, exercise)              | `url`, `title`, `type` (`article`/`calculator`)                                                                                                                                        |
| `:Article`           | Content sub-label for article type nodes                       | (same properties as parent :Content)                                                                                                                                                   |
| `:Calculator`        | Content sub-label for calculator type nodes                    | (same properties as parent :Content)                                                                                                                                                   |
| `:Exercise`          | Content sub-label for exercise type nodes (future)             | (same properties as parent :Content)                                                                                                                                                   |
| `:Category`          | Kategorie proxy node (populated by `backfill-orphan-rels.mjs`) | `name`                                                                                                                                                                                 |
| `:Curriculum`        | One per state + school_type combination                        | `slug` (PK), `state_abbr`, `state`, `school_type`                                                                                                                                      |
| `:Topic`             | A Lernbereich / topic within a curriculum                      | `slug` (PK), `title`, `grade`, `curriculum`                                                                                                                                            |
| `:SubTopic`          | A sub-topic within a topic                                     | `slug` (PK), `title`, `parent_topic`                                                                                                                                                   |
| `:LearningObjective` | A learning objective (Kompetenzerwartung)                      | `slug` (PK), `text`, `parent_topic`                                                                                                                                                    |
| `:DidacticGuideline` | A KMK standard or didactic guideline                           | `name` (PK), `title`, `source_type`, `institution`, `url`, `section_count`, `last_checked`                                                                                             |
| `:GuidelineSection`  | A section within a didactic guideline                          | `name` (PK), `title`, `order`, `guideline`                                                                                                                                             |
| `:University`        | University institution (active)                                | `short_code` (PK), `name`, `country`, `city`, `website`                                                                                                                                |
| `:UniversityModule`  | University module/course (active)                              | `module_code`, `university` (composite PK), `module_name`, `ects`, `language`, `level`, `degree`, `url`, `learning_outcomes[]`, `content[]`, `examination`, `last_checked`             |
| `:Degree`            | Degree program (active)                                        | `name`, `university`, `level`                                                                                                                                                          |
| `:ModuleOffering`    | Semester offering of a module (active)                         | `module_code`, `university`, `semester`, `year`                                                                                                                                        |
| `:Lecturer`          | Module lecturer (active)                                       | `name`, `university`, `title`, `email`, `orcid`                                                                                                                                        |
| `:ECTS`              | ECTS credit record (active)                                    | `module_code`, `university`, `credits`, `workload_hours`                                                                                                                               |

## Relationship types

### Always-written by current pipeline

| Type          | From        | To        | Direction                          |
| ------------- | ----------- | --------- | ---------------------------------- |
| `:HAS_TAG`    | `:Entity`   | `:Tag`    | entity → its tags                  |
| `:MENTIONS`   | `:Document` | `:Entity` | article → entities it mentions     |
| `:RELATED_TO` | `:Entity`   | `:Entity` | bidirectional concept relationship |

### Written by modulhandbuch importers (`import-modulhandbuch.mjs`, `link-module-entities.mjs`)

| Type             | From                | To                  | Direction                                     |
| ---------------- | ------------------- | ------------------- | --------------------------------------------- |
| `:OFFERS`        | `:University`       | `:UniversityModule` | uni → its modules                             |
| `:OFFERS_DEGREE` | `:University`       | `:Degree`           | uni → its degree programs                     |
| `:CARRIES`       | `:UniversityModule` | `:ECTS`             | module → its ECTS credit record               |
| `:COVERS`        | `:UniversityModule` | `:Entity`           | module → chemistry topic it covers            |
| `:TEACHES`       | `:Content`          | `:UniversityModule` | article → uni module that teaches the concept |

### Written by `scripts/backfill-orphan-rels.mjs`

| Type           | From      | To          | Direction                    |
| -------------- | --------- | ----------- | ---------------------------- |
| `:BESTEHT_AUS` | `:Entity` | `:Entity`   | compound → its components    |
| `:GEHOERT_ZU`  | `:Entity` | `:Category` | entity → its kategorie proxy |

### Written by curriculum importers

> Typed labels (`:Curriculum`, `:Topic`, `:SubTopic`, `:LearningObjective`,
> `:DidacticGuideline`, `:GuidelineSection`) are now applied by
> `import-curricula.mjs` and `import-didaktik.mjs`. Old `:Entity {kategorie: …}`
> nodes from prior imports may still exist but are superseded.

| Type                      | From                            | To                   | Source script                                              |
| ------------------------- | ------------------------------- | -------------------- | ---------------------------------------------------------- |
| `:HAS_TOPIC`              | `:Curriculum`                   | `:Topic`             | `import-curricula.mjs`                                     |
| `:HAS_SUBTOPIC`           | `:Topic`                        | `:SubTopic`          | `import-curricula.mjs`                                     |
| `:HAS_LEARNING_OBJECTIVE` | `:Topic`                        | `:LearningObjective` | `import-curricula.mjs`                                     |
| `:HAS_SECTION`            | `:DidacticGuideline`            | `:GuidelineSection`  | `import-didaktik.mjs`                                      |
| `:RELATED_TO`             | `:Topic` / `:DidacticGuideline` | `:Entity`            | `import-curricula.mjs`, `import-didaktik.mjs` — auto-links |

### Written by `scripts/link-entities-to-curricula.mjs`

> Uses typed labels (`:Topic`, `:LearningObjective`) for relationship targets.

| Type            | From      | To                   | Direction                               |
| --------------- | --------- | -------------------- | --------------------------------------- |
| `:COVERS_TOPIC` | `:Entity` | `:Topic`             | entity → curriculum topic it covers     |
| `:FULFILLS`     | `:Entity` | `:LearningObjective` | entity → learning objective it fulfills |

### Aspirational (15-type catalog, materialized by `scripts/kg-enrich-relations.mjs`)

`:FOERDERT`, `:HINDERT`, `:IST_BESTANDTEIL_VON`, `:REAGIERT_MIT`, `:WIRD_VERWENDET_IN`, `:WIRD_ERKLART_IN`, `:VORAUSSETZUNG_FUER`, `:NACHFOLGER_VON`, `:ANWENDUNG_VON`, `:GRUNDLAGE_FUER`, `:BEISPIEL_FUER`, `:EIGENSCHAFT_VON`, `:UNTERSCHIED_ZU`, `:GLEICHWIE`, `:TEIL_ASPEKT_VON`, `:TEIL_VON`, `:ERFUELLT`

Run `node scripts/kg-enrich-relations.mjs --force` to materialize.

## Kategorie vocabulary

```
stoff        Stoff (substance, element, compound)
konzept      Konzept (abstract concept)
reaktion     Reaktion (reaction type)
methode      Methode (method, procedure)
person       Person (historical / fictional person)
quelle       Quelle (source, reference)
lehrplan     Lehrplan (curriculum, framework)       ~1,380 nodes
lernziel     Lernziel (learning objective)          ~12,400 nodes
didaktik     Didaktik (KMK standard)                ~5 nodes
```

## Constraints & invariants

- `:Entity` PK: `name` (lowercased, unique)
- All `Entity.relatedEntities[]` items MUST resolve to an existing `:Entity.name` — verified by `/api/kg-stats` `danglingRefs` count
- All `:Document.entities[]` items MUST resolve to an existing `:Entity.name` — same check
- Element entities (`symbol` non-null) MUST have numeric `ordnungszahl` — verified by `elementCompleteness`
- `kategorie` coverage ≥ 80% — verified by `kategorieCoverage`
- `description` coverage ≥ 50% (after enrichment) — verified by `descriptionCoverage`

## Data quality metrics (exposed via `GET /api/kg-stats`)

```json
{
  "source": "neo4j",
  "entityCount": <int>,
  "articleCount": <int>,
  "relationshipCount": <int>,
  "byKategorie": { "stoff": <int>, "konzept": <int>, ... },
  "byRelType":   { "RELATED_TO": <int>, "BESTEHT_AUS": <int>, ... },
  "dataQuality": {
    "missingDescription": <int>,
    "missingKategorie":   <int>,
    "orphans":            <int>,
    "danglingRefs":       <int>,
    "duplicateNames":     <int>
  }
}
```

Endpoint caches for 5 minutes in-memory.

## Data flow

```
content/**/*.md              data/curricula/*.json     data/didaktik.json     data/modulhandbuch/*.json
   ↓                                ↓                        ↓                        ↓
scripts/knowledge-graph.mjs   scripts/import-           scripts/import-        scripts/import-
(article → :Document,         curricula.mjs             didaktik.mjs           modulhandbuch.mjs
 :Entity, :Tag)               (:Curriculum, :Topic,     (:DidacticGuideline,    (:University,
                               :SubTopic,                :GuidelineSection)      :UniversityModule, :ECTS)
                               :LearningObjective)
   ↓                                ↓                        ↓                        ↓
   └──────────────────────────────────┬───────────────────────────────────────────────┘
                                       ↓
                           ┌────────── Neo4j ──────────┐
                           │ (:Entity, :Document, :Tag, │
                           │  :Content, :Category,      │
                           │  :Curriculum, :Topic,      │
                           │  :SubTopic,                │
                           │  :LearningObjective,      │
                           │  :DidacticGuideline,       │
                           │  :GuidelineSection,        │
                           │  :University, :UniversityModule, │
                           │  :Degree, :ECTS, :Lecturer)│
                           └────────────────────────────┘
                                       ↓
                     scripts/link-entities-to-curricula.mjs
                     (→ :COVERS_TOPIC, :FULFILLS)
                                       ↓
                     scripts/curricula/link-module-entities.mjs
                     (→ :COVERS, :TEACHES)
                                       ↓
                     scripts/export-kg-data.mjs
                     (Neo4j → myhugoapp/data/kg_data.json)
                                       ↓
                                   Hugo build
                                       ↓
                     entity/single.html, content/wissennetz.md,
                     layouts/_default/entity-index.html
                                       ↓
                           browser (D3EgoGraph module)
```

## Build-time hook (Sprint 6)

`package.json` `prebuild` script:

```bash
node scripts/export-kg-data.mjs || echo '[build] Neo4j export skipped (non-fatal)'
node scripts/generate-entity-pages.mjs
```

The `|| echo` is non-fatal: if Neo4j is unreachable, build still proceeds and the entity pages fall back to the client-side `/api/kg-data` path.

## Tunable env vars

| Var                       | Default | File               | Effect                                                |
| ------------------------- | ------- | ------------------ | ----------------------------------------------------- |
| `LIMIT_ENTITIES`          | 5000    | export-kg-data.mjs | Max entities to export                                |
| `LIMIT_ARTICLES`          | 10000   | export-kg-data.mjs | Max articles to export                                |
| `LIMIT_CURRICULA`         | 5000    | export-kg-data.mjs | Max curriculum rows                                   |
| `MAX_ARTICLES_PER_ENTITY` | 20      | export-kg-data.mjs | Cap on per-entity article list (bigger = fatter JSON) |

## Files

| File                                                | Purpose                                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `scripts/knowledge-graph.mjs`                       | Article → KG pipeline (writes :Document, :Tag, :Entity)                      |
| `scripts/export-kg-data.mjs`                        | Neo4j → kg_data.json                                                         |
| `scripts/generate-entity-pages.mjs`                 | kg_data.json → `content/entity/*.md`                                         |
| `scripts/backfill-orphan-rels.mjs`                  | Backfill `:BESTEHT_AUS`, `:GEHOERT_ZU`                                       |
| `scripts/kg-enrich.mjs`                             | Local enricher (15-type catalog)                                             |
| `scripts/kg-enrich-relations.mjs`                   | Neo4j semantic rel promotion                                                 |
| `scripts/import-curricula.mjs`                      | Curricula → `:Curriculum`, `:Topic`, `:SubTopic`, `:LearningObjective`       |
| `scripts/import-didaktik.mjs`                       | KMK standards → `:DidacticGuideline`, `:GuidelineSection`                    |
| `scripts/import-content-nodes.mjs`                  | Content → `:Content` + sub-labels (`:Article`, `:Calculator`)                |
| `scripts/curricula/migrate-content-labels.mjs`      | One-time migration: add `:Article`/`:Calculator` to existing Content nodes   |
| `scripts/import-modulhandbuch.mjs`                  | Modulhandbuch JSON → `:University`, `:UniversityModule`, `:ECTS` nodes       |
| `scripts/curricula/link-module-entities.mjs`        | Create `:COVERS` and `:TEACHES` between modules and existing chemie entities |
| `scripts/link-entities-to-curricula.mjs`            | Create `:COVERS_TOPIC` and `:FULFILLS` between entities and curriculum data  |
| `scripts/_neo4j-subset-filter.mjs`                  | Subset isolation helpers (`CHEMIE_LABELS`, `subsetMatch`, `subsetWhere`)     |
| `api/server.js`                                     | All KG endpoints (including `/api/kg-stats`)                                 |
| `myhugoapp/data/kg_data.json`                       | Hugo build-time data export                                                  |
| `myhugoapp/content/entity/*.md`                     | 54 generated entity pages (3 hand-written element pages preserved)           |
| `myhugoapp/static/js/visualization/d3-ego-graph.js` | Shared D3 graph renderer (ego + full modes)                                  |
| `tests/kg-data-quality.test.js`                     | Data integrity unit tests                                                    |
| `tests/d3-ego-graph.test.js`                        | Renderer unit tests                                                          |
