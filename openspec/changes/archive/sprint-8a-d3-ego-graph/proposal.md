# Change: sprint-8a-d3-ego-graph (ARCHIVED)

**Status:** Archived (shipped 2026-06-26)
**Commit:** `e9ad62be`
**Implemented by:** Sisyphus
**Spec impact:** `specs/entity-knowledge-graph/spec.md` REQ-EKG-4,
`specs/wissensnetz-graph/spec.md` (entire spec), `specs/a11y-compliance/spec.md` REQ-A11Y-7

## Why

The D3 ego-graph was inlined twice (`entity/single.html` and
`wissennetz.md`), 110 lines of unmaintainable code, no a11y, no zoom,
no drag, no tooltip, no click-to-navigate for entity nodes. Clicking a
related-entity node did nothing.

## What changed

- **New shared module**
  `myhugoapp/static/js/visualization/d3-ego-graph.js` (~530 lines)
  - Public API: `createEgoGraph(container, data, {entity})`,
    `createFullGraph(container, data, {filterControls, showLegend,
height})`
  - `colorize(cat)`, `labelize(cat)`, `slugify(name)` helpers
  - `CAT_COLORS` and `CAT_LABELS` for 9 categories
  - Lazy D3 load from local `/js/vendor/d3.v7.min.js`
- **Refactored** `entity/single.html` (921 → 792 lines) and
  `wissennetz.md` (193 → 55 lines) to use the module
- **Resolved 8 merge conflicts** in `entity-index.html`
- **20 new unit tests** in `tests/d3-ego-graph.test.js`

## Capabilities added

- A11y: `role=img`, `aria-label`, `<title>`/`<desc>`, `tabindex` on
  nodes, `<ul>` fallback
- `prefers-reduced-motion` freezes force simulation
- Click-to-navigate: entity nodes push to `/entity/{slug}/`
- `ResizeObserver` re-centers on container resize
- `clamp(280px, 50vw, 480px)` height, labels hidden below 480px
- Dark mode via CSS custom properties
- Local D3 (no CDN), unified color tokens
