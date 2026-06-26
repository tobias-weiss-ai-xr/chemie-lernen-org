# OpenSpec — Capabilities Index

Last updated: 2026-06-26

## Main capabilities (specs/)

| Capability                  | Spec                             | Status | Owners   | Last change            |
| --------------------------- | -------------------------------- | ------ | -------- | ---------------------- |
| Entity Knowledge Graph      | `entity-knowledge-graph/spec.md` | Active | Sisyphus | sprint-8b-neo4j-data   |
| AI Assistant (KI-Assistent) | `ai-assistant/spec.md`           | Active | Sisyphus | sprint-8c-rag          |
| WCAG 2.1 AA Compliance      | `a11y-compliance/spec.md`        | Active | Sisyphus | sprint-7-wcag-a11y     |
| Wissensnetz Full-Graph      | `wissensnetz-graph/spec.md`      | Active | Sisyphus | sprint-8a-d3-ego-graph |

## Active changes (`changes/`)

(none currently)

## Archived changes (`changes/archive/`)

| Change                      | Commits            | Status             |
| --------------------------- | ------------------ | ------------------ |
| sprint-6-wissensnetz-ssr    | dea14d91, e9ad62be | Shipped 2026-06-26 |
| sprint-7-wcag-a11y          | dcb2ab18           | Shipped 2026-06-26 |
| sprint-8a-d3-ego-graph      | e9ad62be           | Shipped 2026-06-26 |
| sprint-8b-neo4j-data        | 5d5e6238           | Shipped 2026-06-26 |
| sprint-8c-rag               | d47bd48e           | Shipped 2026-06-26 |
| sprint-8-mega-kg (umbrella) | wraps 8a/8b/8c     | Shipped 2026-06-26 |

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
