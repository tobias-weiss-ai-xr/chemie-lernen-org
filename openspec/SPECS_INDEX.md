# OpenSpec — Capabilities Index

Last updated: 2026-07-18

## Main capabilities (specs/)

| Capability                      | Spec                               | Status | Owners   | Last change                                             |
| ------------------------------- | ---------------------------------- | ------ | -------- | ------------------------------------------------------- |
| Entity Knowledge Graph          | `entity-knowledge-graph/spec.md`   | Active | Sisyphus | sprint-8b-neo4j-data                                    |
| AI Assistant (KI-Assistent)     | `ai-assistant/spec.md`             | Active | Sisyphus | sprint-8c-rag                                           |
| WCAG 2.1 AA Compliance          | `a11y-compliance/spec.md`          | Active | Sisyphus | sprint-7-wcag-a11y                                      |
| Wissensnetz Full-Graph          | `wissensnetz-graph/spec.md`        | Active | Sisyphus | sprint-8a-d3-ego-graph                                  |
| Central KG Architecture         | `central-kg-architecture/spec.md`  | Active | Sisyphus | sprint-9-specs-and-fixes                                |
| Lehrplan + Didaktik (curricula) | `lehrplan-curriculum/spec.md`      | Active | Sisyphus | sprint-d-import (15 states + 5 KMK guidelines imported) |
| Modulhandbuch (universities)    | `modulhandbuch-university/spec.md` | Active | Sisyphus | sprint-c-scrapers (ETH+TUM working, 7 stubs)            |
| Calculators                     | `calculators/spec.md`              | Active | Sisyphus | sprint-9-specs-and-fixes                                |
| Quiz & Exercises                | `quiz/spec.md`                     | Active | Sisyphus | sprint-9-specs-and-fixes                                |
| 3D Visualizations               | `3d-visualizations/spec.md`        | Active | Sisyphus | sprint-9-specs-and-fixes                                |
| Themenbereiche (subject areas)  | `themenbereiche/spec.md`           | Active | Sisyphus | sprint-9-specs-and-fixes                                |
| PWA (Progressive Web App)       | `pwa/spec.md`                      | Active | Sisyphus | sprint-9-specs-and-fixes                                |
| Learning Paths & Gamification   | `learning-paths/spec.md`           | Active | Sisyphus | sprint-23-learning-paths-gamification                   |
| Elements API                    | `elements-api/spec.md`             | Active | Sisyphus | sprint-24-3d-visualizations                             |

## Active changes (`changes/`)

| Change                           | Status        | Goal                                                                       |
| -------------------------------- | ------------- | -------------------------------------------------------------------------- |
| `sprint-31-cleanup-archive`      | Spec + design | Archive shipped sprints, fix code-entity leak, .env.example, update index  |
| `sprint-32-content-data`         | Spec + design | Fix BB/BE curricula, add Saarland, cross-link audit, klassenstufen content |
| `sprint-33-lehrenden-premium`    | Spec + design | Stripe webhooks, premium gating, subscription management UI                |
| `sprint-34-platform-performance` | Spec + design | Hugo build perf, full-text entity search, PWA offline, mobile UX audit     |

## Archived changes (`changes/archive/`)

| Change                                  | Commits            | Status                                                      |
| --------------------------------------- | ------------------ | ----------------------------------------------------------- |
| sprint-6-wissensnetz-ssr                | dea14d91, e9ad62be | Shipped 2026-06-26                                          |
| sprint-7-wcag-a11y                      | dcb2ab18           | Shipped 2026-06-26                                          |
| sprint-8a-d3-ego-graph                  | e9ad62be           | Shipped 2026-06-26                                          |
| sprint-8b-neo4j-data                    | 5d5e6238           | Shipped 2026-06-26                                          |
| sprint-8c-rag                           | d47bd48e           | Shipped 2026-06-26                                          |
| sprint-8-mega-kg (umbrella)             | wraps 8a/8b/8c     | Shipped 2026-06-26                                          |
| deploy-observability (API smoke tests)  | a1a11699           | Shipped 2026-06-26                                          |
| sprint-9-specs-and-fixes                | 20/20 tasks ✓      | Archived 2026-07-04                                         |
| extend-entity-kg-with-lehrplan          | 19/19 tasks ✓      | Archived 2026-07-05. Commit `9aeb6b5b`                      |
| integrate-global-modulhandbuecher       | 33/33 tasks ✓      | Archived 2026-07-05. Commit `3753a6a1`                      |
| sprint-27-kg-pipeline-fix               | 24/24 tasks ✓      | Shipped 2026-07-18 (entity pages, API bugs, Neo4j indexes)  |
| sprint-28-neo4j-schema-reconciliation   | 13/13 tasks ✓      | Shipped 2026-07-18 (curriculum schema, entity linking)      |
| sprint-29-curriculum-quality-gaps       | 11/11 tasks ✓      | Shipped 2026-07-18 (didaktik endpoint, klassenstufen, CI)   |
| sprint-30-wissensnetz-ux-learning-paths | 18/18 tasks ✓      | Shipped 2026-07-18 (D3 edge colors, chat entities, filters) |

## Legacy planning artifacts (`archive/`)

Pre-OpenSpec planning from `.omo/`, `.opencode/`, `.hermes/`, `.sisyphus/`
directories. Kept for historical reference. See `README.md` for the
mapping.

## Adding a new change

```bash
# Create a new change folder
openspec change new my-feature

# Write the proposal
$EDITOR openspec/changes/my-feature/proposal.md

# List current open changes
openspec list

# Show what's in a change
openspec show my-feature

# Archive when shipped
openspec archive my-feature
```

See `openspec/README.md` for the full workflow.
