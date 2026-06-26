# Knowledge Graph Schema

**Status:** consolidated from all code paths
**Date:** 2026-06-26
**DB:** Neo4j 5.26, `chemie` database, `bolt://chemie-neo4j:7687`

## Node labels

| Label       | Purpose                                                        | Key properties                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:Entity`   | Core chemistry concept (Wasser, Kohlenstoff, Elektrolyse …)    | `name` (PK, lowercased), `kategorie`, `description`, `symbol`, `ordnungszahl`, `state`, `grade`, `school_type`, `objective_count`, `articleCount`, `components[]`, `relatedEntities[]` |
| `:Document` | Article or page that mentions entities                         | `title`, `url`, `type` (`page`/`article`), `date`, `entities[]`                                                                                                                        |
| `:Tag`      | Tag attached to entities (KMK standard, source type)           | `name`, `kind` (`kmk` / `quelle` / `topic`)                                                                                                                                            |
| `:Content`  | Curriculum / didactic content node                             | `name`, `state`, `grade`, `school_type`                                                                                                                                                |
| `:Category` | Kategorie proxy node (populated by `backfill-orphan-rels.mjs`) | `name`                                                                                                                                                                                 |

## Relationship types

### Always-written by current pipeline

| Type          | From        | To        | Direction                          |
| ------------- | ----------- | --------- | ---------------------------------- |
| `:HAS_TAG`    | `:Entity`   | `:Tag`    | entity → its tags                  |
| `:MENTIONS`   | `:Document` | `:Entity` | article → entities it mentions     |
| `:RELATED_TO` | `:Entity`   | `:Entity` | bidirectional concept relationship |

### Written by `scripts/backfill-orphan-rels.mjs`

| Type           | From      | To          | Direction                    |
| -------------- | --------- | ----------- | ---------------------------- |
| `:BESTEHT_AUS` | `:Entity` | `:Entity`   | compound → its components    |
| `:GEHOERT_ZU`  | `:Entity` | `:Category` | entity → its kategorie proxy |

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
lehrplan     Lehrplan (curriculum, framework)
lernziel     Lernziel (learning objective)
didaktik     Didaktik (KMK standard)
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
content/**/*.md
   ↓
scripts/knowledge-graph.mjs  (article → :Document, :Entity, :Tag)
   ↓
Neo4j (:Entity, :Document, :Tag, :Content)
   ↓
scripts/export-kg-data.mjs  (Neo4j → myhugoapp/data/kg_data.json)
   ↓
Hugo build
   ↓
entity/single.html, content/wissennetz.md, layouts/_default/entity-index.html
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

## Tunable env vars (export-kg-data.mjs)

| Var                       | Default | Effect                                                |
| ------------------------- | ------- | ----------------------------------------------------- |
| `LIMIT_ENTITIES`          | 5000    | Max entities to export                                |
| `LIMIT_ARTICLES`          | 10000   | Max articles to export                                |
| `LIMIT_CURRICULA`         | 5000    | Max curriculum rows                                   |
| `MAX_ARTICLES_PER_ENTITY` | 20      | Cap on per-entity article list (bigger = fatter JSON) |

## Files

| File                                                | Purpose                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| `scripts/knowledge-graph.mjs`                       | Article → KG pipeline (writes :Document, :Tag, :Entity)            |
| `scripts/export-kg-data.mjs`                        | Neo4j → kg_data.json                                               |
| `scripts/generate-entity-pages.mjs`                 | kg_data.json → `content/entity/*.md`                               |
| `scripts/backfill-orphan-rels.mjs`                  | Backfill `:BESTEHT_AUS`, `:GEHOERT_ZU`                             |
| `scripts/kg-enrich.mjs`                             | Local enricher (15-type catalog)                                   |
| `scripts/kg-enrich-relations.mjs`                   | Neo4j semantic rel promotion                                       |
| `scripts/import-curricula.mjs`                      | Curricula → `:Content`                                             |
| `scripts/import-didaktik.mjs`                       | KMK standards → `:Tag` (`kind:kmk`)                                |
| `scripts/import-content-nodes.mjs`                  | Misc content → `:Content`                                          |
| `api/server.js`                                     | All KG endpoints (including `/api/kg-stats`)                       |
| `myhugoapp/data/kg_data.json`                       | Hugo build-time data export                                        |
| `myhugoapp/content/entity/*.md`                     | 54 generated entity pages (3 hand-written element pages preserved) |
| `myhugoapp/static/js/visualization/d3-ego-graph.js` | Shared D3 graph renderer (ego + full modes)                        |
| `tests/kg-data-quality.test.js`                     | Data integrity unit tests                                          |
| `tests/d3-ego-graph.test.js`                        | Renderer unit tests                                                |
