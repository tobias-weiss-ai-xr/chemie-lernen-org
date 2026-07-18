## Why

The D3 Wissensnetz graph shows uniform gray edges with no relationship type differentiation. Entity detail pages have no curriculum context (which Bundesländer teach this concept). Learning paths are built on a single seed "Mittelstufe Chemie" instead of real state curricula. The KI-assistant ignores the KG entirely — it can't detect entities in chat or suggest related concepts. The D3 graph is desktop-only (no touch support). No filtering exists on the Wissensnetz landing page. This sprint makes the visualizations useful with real data and builds intelligent features on top of the KG.

## What Changes

- D3 graph: color edges by relationship type (MENTIONS, RELATED_TO, FULFILLS, etc.), add optional edge labels
- Entity detail pages: add "Lehrplan-Bezug" panel showing which states/grades teach this concept
- Replace single "Mittelstufe Chemie" learning path with per-state paths generated from imported curriculum data
- KI-assistant: entity detection in chat messages, auto-suggest related entities
- D3 graph: touch support (pinch-zoom, swipe pan) for mobile
- Wissensnetz landing: filter by Bundesland, Klassenstufe, Themenbereich

## Capabilities

### Modified Capabilities

- `wissensnetz-graph/spec.md` — edge colors, touch support, filters
- `entity-knowledge-graph/spec.md` — curriculum context panel
- `ai-assistant/spec.md` — entity-aware chat
- `learning-paths/spec.md` — real curriculum-based paths

## Impact

- **UX**: Richer graph visualization with semantic edge colors, mobile-friendly
- **Content**: Real per-state learning paths instead of single seed
- **KI**: Smarter chat that leverages the knowledge graph
- **Navigation**: Filterable Wissensnetz landing page
