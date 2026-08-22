# scripts/

Utility and automation scripts for chemie-lernen.org.

## Categories

### Neo4j / Knowledge Graph

| Script                                                 | Purpose                                    |
| ------------------------------------------------------ | ------------------------------------------ |
| `knowledge-graph.mjs`                                  | Main KG pipeline (fetch, transform, load)  |
| `article-pipeline.mjs`                                 | Article enrichment and cross-linking       |
| `enrich-content-nodes.mjs`                             | Add metadata to content nodes              |
| `kg-enrich.mjs`, `kg-enrich-relations.mjs`             | Relationship enrichment                    |
| `export-kg-data.mjs`, `export-kg-from-api.mjs`         | Export KG data to Hugo                     |
| `migrate-chemie-neo4j.mjs`, `migrate-typed-labels.mjs` | Schema migrations                          |
| `neo4j-migrate-curriculum.mjs`                         | Curriculum data migration (Sprint 23)      |
| `link-entities-to-curricula.mjs`                       | Link entities to curriculum structure      |
| `backfill-*.mjs`                                       | One-shot backfill scripts                  |
| `_neo4j-subset-filter.mjs`                             | Centralized subset selector for KG queries |

### Backup

| Script                   | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `backup-all.sh`          | Master backup orchestrator                    |
| `backup-chemie-kg.sh`    | KG database backup                            |
| `backup-chemie-neo4j.sh` | Neo4j backup (deprecated — use backup-all.sh) |
| `backup-leads-neo4j.sh`  | Leads DB backup                               |
| `backup-db.js`           | Restic off-site backup (Sprint 20)            |
| `restore-neo4j.sh`       | Restore Neo4j from dump                       |

### Content

| Script                             | Purpose                 |
| ---------------------------------- | ----------------------- |
| `generate-articles.js`             | Article generation      |
| `generate-entity-pages.mjs`        | Entity page generation  |
| `generate-curricula-pages.mjs`     | Curriculum pages        |
| `generate-modulhandbuch-pages.mjs` | Module handbook pages   |
| `add-article-aliases.mjs`          | URL alias management    |
| `add-verwandte-themen.mjs`         | Cross-linking           |
| `update-index-links.mjs`           | Index page link updates |
| `normalize-section-order.mjs`      | Section ordering        |

### Audit & Analysis

| Script                                                | Purpose                                     |
| ----------------------------------------------------- | ------------------------------------------- |
| `audit-content-freshness.mjs`                         | Content freshness check (Sprint 20)         |
| `audit-site.mjs`, `audit-scope.mjs`, `audit-deep.mjs` | Site quality audits                         |
| `curricula-quality-report.mjs`                        | Curriculum data quality                     |
| `analyze-bundle.js`                                   | Bundle size analysis                        |
| `minify-calculators.js`                               | Calculator minification (overwrites source) |

### Curricula Import

| Script                         | Purpose                    |
| ------------------------------ | -------------------------- |
| `import-curricula.mjs`         | Import curricula data      |
| `import-didaktik.mjs`          | Import didactic guidelines |
| `import-modulhandbuch.mjs`     | Import module handbook     |
| `link-modules-to-entities.mjs` | Link modules to entities   |

### Infrastructure

| Script                     | Purpose                  |
| -------------------------- | ------------------------ |
| `healthcheck.sh`           | Service health checks    |
| `hubs-up.sh`               | Hub service startup      |
| `run-import-production.sh` | Production import runner |

## Notes

- `.mjs` files use ES modules (Node 22+)
- `.js` files use CommonJS (`require`/`module.exports`) or global scope
- Backup scripts use `pg_dump`, `neo4j-admin dump`, or restic
- `_neo4j-subset-filter.mjs` is the canonical subset selector — all KG queries must scope via it
