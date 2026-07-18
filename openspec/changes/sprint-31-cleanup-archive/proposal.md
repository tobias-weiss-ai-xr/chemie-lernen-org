## Why

Sprint 27-30 work is fully shipped on production but the OpenSpec changes were never archived, creating drift between the index and reality. Additionally, ~44 code-analysis entities (Dijkstra's Algorithm, Vertex Cover, etc.) leak into the Chemistry KG because they carry only the `:Entity` label with no distinguishing kategorie. No `.env.example` documents the required secrets for self-hosting. The SPECS_INDEX.md still references `open-spec-coverage` as active despite being absorbed in sprint-9. This sprint closes the hygiene gap.

## What Changes

- Archive Sprint 27, 28, 29, 30 changes in OpenSpec
- Fix code-analysis entity leak in `scripts/export-kg-data.mjs` and `_neo4j-subset-filter.mjs` — add fallback exclusion for entities without a `kategorie` property that match code-analysis naming patterns
- Create `.env.example` documenting all required/env vars (NEO4J_PASSWORD, GRAFANA_ADMIN_PASSWORD, LITELLM_API_KEY, STRIPE_SECRET_KEY, etc.)
- Update `openspec/SPECS_INDEX.md` — remove stale `open-spec-coverage` entry, update sprint 27-30 status

## Capabilities

### New Capabilities

- `env-config`: Environment variable documentation and validation for self-hosting and CI

### Modified Capabilities

- `central-kg-architecture/spec.md`: Add code-analysis subset exclusion rule to subset filter documentation

## Impact

- **KG data**: ~44 fewer non-chemistry entities in exports and API responses
- **OpenSpec**: Index reflects reality
- **Dev UX**: `.env.example` makes self-hosting setup 5 min instead of guessing
