## Context

Sprint 27-30 changes were implemented during a live-debugging session and never formally archived. The `_neo4j-subset-filter.mjs` has CHEMIE_LABELS but some entities carry only `:Entity` with no `kategorie`. The export script's Cypher query filters `kategorie NOT IN ['lernziel', 'lehrplan', 'didaktik']` but code entities (Variable, Function, Class) often have `kategorie` null/undefined. No `.env.example` exists — new devs must reverse-engineer required vars from docker-compose.yml and api/.env.

## Goals / Non-Goals

**Goals:**

- Archive OpenSpec changes 27-30
- Filter out code-analysis entities from chemie exports (fallback naming heuristic)
- Create `.env.example` covering all services (API, Neo4j, LiteLLM, Stripe, Grafana)
- Update SPECS_INDEX.md — remove stale entries

**Non-Goals:**

- Neo4j schema changes (covered in Sprint 28, shipped)
- Fixing the underlying cause of `:Entity`-only labels on code entities

## Decisions

| Decision                                                                                                                                | Rationale                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Heuristic filter**: exclude entities whose slug contains `algorithm`, `graph-`, `network-`, `data-structure` or matches code-patterns | Hard to distinguish `:Entity`-only code vs chemie nodes without a label; naming convention is a good proxy (~44 known false positives) |
| **Archive via `mv` to archive dir**                                                                                                     | Keep git history; use existing archive convention in openspec/changes/archive/                                                         |
| `.env.example` uses `your-...` placeholders                                                                                             | Never commit real secrets; makes it safe to commit                                                                                     |
| **SPECS_INDEX manually updated**                                                                                                        | Only 2 stale rows; CLI does not auto-update index                                                                                      |

## Risks / Trade-offs

- [Heuristic misses] → Some code entities may survive; acceptable (<10 false positives)
- [Heuristic over-filters] → A rare chemie entity might match the pattern; monitor and add allowlist if needed
- [Archive order] → Must archive in reverse order (30→27) so dependent references resolve cleanly
