# OpenSpec — Capabilities Index

Last updated: 2026-07-06

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

## Active changes (`changes/`)

| Change               | Status         | Goal                                                                    |
| -------------------- | -------------- | ----------------------------------------------------------------------- |
| `lehrenden-premium`  | 8/10 tasks     | Auth (Lucia/JWT), Stripe payments, premium gating                       |
| `open-spec-coverage` | 5/6 spec files | Create missing spec files for all capabilities                          |
| `sprint-1`           | Spec draft     | Lehrenden-Premium go-live — Stripe integration + premium gating         |
| `sprint-2`           | Spec draft     | Semantic RAG — embeddings + vector search in Neo4j                      |
| `sprint-3`           | Spec draft     | Platform Hardening — security, rate limits, backup DR, monitoring       |
| `sprint-4`           | Spec draft     | Content Expansion — 15 new articles, cross-linking improvements         |
| `sprint-5`           | Spec draft     | Calculator Ecosystem — 3 new calculators, unit converter, i18n          |
| `sprint-6`           | Spec draft     | PWA + Offline — service worker, manifest, offline content               |
| `sprint-7`           | Spec draft     | Quiz Platform — quiz engine, question bank, spaced repetition           |
| `sprint-8`           | Spec draft     | KI-Assistent Personalization — learning profile, chat history, feedback |
| `sprint-9`           | Spec draft     | 3D Visualizations — molecule viewer, periodic table, AR (experimental)  |
| `sprint-10`          | Spec draft     | Production Audit — security, performance, docs, monitoring              |

## Archived changes (`changes/archive/`)

| Change                                 | Commits            | Status                                 |
| -------------------------------------- | ------------------ | -------------------------------------- |
| sprint-6-wissensnetz-ssr               | dea14d91, e9ad62be | Shipped 2026-06-26                     |
| sprint-7-wcag-a11y                     | dcb2ab18           | Shipped 2026-06-26                     |
| sprint-8a-d3-ego-graph                 | e9ad62be           | Shipped 2026-06-26                     |
| sprint-8b-neo4j-data                   | 5d5e6238           | Shipped 2026-06-26                     |
| sprint-8c-rag                          | d47bd48e           | Shipped 2026-06-26                     |
| sprint-8-mega-kg (umbrella)            | wraps 8a/8b/8c     | Shipped 2026-06-26                     |
| deploy-observability (API smoke tests) | a1a11699           | Shipped 2026-06-26                     |
| sprint-9-specs-and-fixes               | 20/20 tasks ✓      | Archived 2026-07-04                    |
| extend-entity-kg-with-lehrplan         | 19/19 tasks ✓      | Archived 2026-07-05. Commit `9aeb6b5b` |
| integrate-global-modulhandbuecher      | 33/33 tasks ✓      | Archived 2026-07-05. Commit `3753a6a1` |

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
