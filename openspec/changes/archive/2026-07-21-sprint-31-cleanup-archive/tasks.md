## 1. Archive Shipped Sprints

- [x] 1.1 Archive Sprint 30 (`mv openspec/changes/sprint-30-wissensnetz-ux-learning-paths openspec/changes/archive/`)
- [x] 1.2 Archive Sprint 29 (`mv openspec/changes/sprint-29-curriculum-quality-gaps openspec/changes/archive/`)
- [x] 1.3 Archive Sprint 28 (`mv openspec/changes/sprint-28-neo4j-schema-reconciliation openspec/changes/archive/`)
- [x] 1.4 Archive Sprint 27 (`mv openspec/changes/sprint-27-kg-pipeline-fix openspec/changes/archive/`)

## 2. Code-Analysis Entity Leak

- [x] 2.1 Add heuristic name-pattern filter to `scripts/export-kg-data.mjs` — exclude entities whose slug matches `/algorithm|graph-|network-|data-structure|vertex-|edge-|sorting|traversal|binary-|hash-|queue|stack|heap|tree-/i`
- [x] 2.2 Add same filter to `_neo4j-subset-filter.mjs` CHEMIE_LABELS fallback logic
- [x] 2.3 Re-export `kg_data.json` — verify entity count drops by ~44
- [x] 2.4 Regenerate entity pages — verify no algorithm/graph-theory entities remain

## 3. Environment Documentation

- [x] 3.1 Create `.env.example` at repo root with all required vars (NEO4J_PASSWORD, NEO4J_URI, NEO4J_DATABASE, GRAFANA_ADMIN_PASSWORD, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, LITELLM_API_KEY, SENTRY_DSN, etc.)
- [x] 3.2 Add comments for each var (purpose, where to get it, if optional)

## 4. SPECS_INDEX Maintenance

- [x] 4.1 Update SPECS_INDEX.md — remove `open-spec-coverage` row, change sprint 27-30 from "Spec draft" to "Shipped"
- [x] 4.2 Update SPECS_INDEX.md — add sprint 31-34 rows
