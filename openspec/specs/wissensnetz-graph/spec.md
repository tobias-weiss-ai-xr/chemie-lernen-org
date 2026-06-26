# Spec: wissensnetz-graph

**Capability:** Wissensnetz full-graph visualization
**Owners:** Sisyphus (Sprint 6 partial, 8a partial)
**Status:** Active — main spec; deltas via `openspec/changes/`

---

## Purpose

The Wissensnetz at `/wissennetz/` is the full-graph view of the entity
knowledge graph. Unlike the per-entity ego-graph (covered in
`specs/entity-knowledge-graph/spec.md` REQ-EKG-4), this page shows all
entities and relationships in a single, filterable, zoomable view.

## Requirements

### REQ-WN-1: Full graph render

Uses `myhugoapp/static/js/visualization/d3-ego-graph.js`
`createFullGraph(container, data, { filterControls, showLegend,
height })`. Default height: 700px.

### REQ-WN-2: Filter chips

The page renders a row of category filter chips at the top
(`#kg-controls` div). Each chip:

- Color matches the category color (from `CAT_COLORS`)
- Shows the category label (German, from `CAT_LABELS`)
- Clicking toggles visibility of nodes of that category
- Multi-select: chips are independent toggles, not radio buttons
- A "Alle" chip at the start shows all categories

Filter state is reflected in:

- The node opacity (visible: 1, hidden: 0.1 with text faded)
- The link opacity (visible: 0.6, hidden: 0)
- The legend (hidden categories show in muted color)

### REQ-WN-3: Zoom and pan

The user can:

- Scroll-wheel zoom (min 0.3x, max 4x)
- Click-and-drag pan
- Click a node to focus / center on it
- Double-click empty space to reset zoom and pan

### REQ-WN-4: Legend

Bottom-left corner shows a legend with:

- 9 category color swatches
- Each swatch shows the German label
- Total count of visible nodes (e.g. "47 / 1234 Entitäten sichtbar")

### REQ-WN-5: Tooltip

Hovering over a node shows a tooltip with:

- Entity name (bold)
- Category badge
- Number of related entities
- Number of articles linking to it
- "Zum Entity klicken" hint

### REQ-WN-6: A11y (inherited from ego-graph module)

The full graph uses the same a11y primitives as the ego-graph (see
`specs/a11y-compliance/spec.md` REQ-A11Y-7):

- `role="img"` on the SVG
- `<title>` and `<desc>`
- `<ul>` fallback list with all visible node names + links
- `prefers-reduced-motion` freezes force simulation
- `tabindex` on nodes, keyboard navigation

### REQ-WN-7: Data source

Reads `data/kg_data.json` (built by `export-kg-data.mjs`).
Falls back to `/api/kg-data` if the data file is missing or stale
(>24h old).

## Scenarios

### S-WN-1: Initial page load

**Given** a user visits `/wissennetz/`
**When** the page loads
**Then**:

- The full D3 force-graph renders with all categories
- The legend shows 9 category swatches with counts
- The filter chips are visible at the top, all selected
- The graph is centered in the viewport
- A `<noscript>` fallback shows a static list of the 20 most connected
  entities

### S-WN-2: User filters to "stoff" only

**Given** the user is on `/wissennetz/`
**When** they click the "Stoff" chip
**Then**:

- All non-Stoff nodes fade to 0.1 opacity
- All links to/from non-Stoff nodes fade to 0
- The legend's Stoff swatch is highlighted, others muted
- The visible count updates: "X / Y Entitäten sichtbar"
- The aria-label of the SVG updates to reflect the filter

### S-WN-3: User clicks a node

**Given** the user is on `/wissennetz/`
**When** they click (or press Enter on) a node
**Then** the browser navigates to `/entity/{slug}/`

## References

- `myhugoapp/content/wissennetz.md` — page content + script
- `myhugoapp/static/js/visualization/d3-ego-graph.js` — shared module
- `myhugoapp/data/kg_data.json` — graph data
