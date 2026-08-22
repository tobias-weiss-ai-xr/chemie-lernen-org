## Sprint 30: Wissensnetz UX + Learning Paths from Real Data

### D3 Graph Enhancement

- [x] 30.1: Add edge color mapping by relationship type in `d3-ego-graph.js` (6 colors for RELATED_TO, MENTIONS, FULFILLS, FULFILLS_OBJECTIVE, BESTEHT_AUS, PREREQUISITE)
- [x] 30.2: Add optional edge labels toggle (show/hide relationship type on edges)
- [x] 30.3: Add touch support (d3.zoom with pinch-zoom, two-finger pan) for mobile

### Entity Detail — Curriculum Context

- [x] 30.4: Add "Lehrplan-Bezug" panel to `entity/single.html` — show linked Bundesländer, Klassenstufen, Lernziel count
- [x] 30.5: Wire panel to existing `/api/entities/:name/curricula` endpoint

### Per-State Learning Paths

- [x] 30.6: Create `scripts/generate-learning-paths.mjs` — build 16 state-specific paths from imported curriculum data
- [x] 30.7: Add GET /api/learning-paths?state=BY route — return state-specific path
- [x] 30.8: Update lernpfade.html + lernpfade.js + lernpfade.css — state selector, dynamic path loading

### KI-Assistant Entity Detection

- [x] 30.9: Add entity name extraction to chat handler in server.js (match top 500 entities against user message)
- [x] 30.10: Inject entity context into system prompt (related entities, curriculum context)
- [x] 30.11: Add "Verwandte Konzepte" suggestion chips in chat response footer

### Wissensnetz Landing Filters

- [x] 30.12: Add filter bar to entity-index.js (Bundesland, Klassenstufe, Themenbereich dropdowns)
- [x] 30.13: Wire filters to `/api/curricula/linked-entities` and `/api/kg-data` for entity filtering

### Verification

- [ ] 30.14: ⛔ Needs running site — D3 graph renders colored edges on desktop + touch works on mobile
- [ ] 30.15: ⛔ Needs running site — Entity detail shows curriculum panel with real data
- [ ] 30.16: ⛔ Needs running site — Chat detects entities and shows related suggestions
- [ ] 30.17: ⛔ Needs running site — Wissensnetz filters reduce entities correctly
- [x] 30.18: node --check + eslint pass on all changed files
