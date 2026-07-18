## Architecture

### D3 Graph Enhancement

Current: `d3-ego-graph.js` (1091 lines) renders all edges as uniform gray lines.

Target: Edge color by relationship type:

```
RELATED_TO → #667eea (blue)
MENTIONS → #45b7d1 (cyan)
FULFILLS → #4ecdc4 (teal)
FULFILLS_OBJECTIVE → #f093fb (pink)
BESTEHT_AUS → #ff9a76 (orange)
PREREQUISITE → #a8a8a8 (gray)
```

Touch support: Add `d3.zoom()` with touch events (pinch-zoom gesture, two-finger pan). Mobile detection via `'ontouchstart' in window`.

### Entity Detail — Curriculum Context Panel

New section in `entity/single.html`:

```
┌─────────────────────────────┐
│ Lehrplan-Bezug              │
├─────────────────────────────┤
│ 🏫 12 Bundesländer          │
│ 📚 Klassenstufe 7-9         │
│ 📖 23 Lernziele             │
│                             │
│ [Bayern] [Berlin] [...]     │
└─────────────────────────────┘
```

Data source: `GET /api/entities/:name/curricula` (already exists, returns linked curricula).

### Per-State Learning Paths

Current: 1 seed "Mittelstufe Chemie" from Sprint 23 migration.

Target: Generate learning path for each state using imported curriculum data:

- Group SubTopics by Curriculum.state
- Order by grade level
- Link to related themenbereiche articles
- Create 16 state-specific learning paths + 1 "Alle Bundesländer" overview

### KI-Assistant Entity Detection

In `server.js` chat handler, before sending to LiteLLM:

1. Extract entity names from user message (match against top 500 entities by articleCount)
2. Fetch related entities via `/api/kg-data/entity/:name`
3. Inject entity context into system prompt: "Der Nutzer fragt über [entities]. Verwandte Konzepte: [related]"
4. Suggest related entities in response footer

### Wissensnetz Landing Filters

Add filter bar to `/entity/` page (entity-index.js):

- Bundesland dropdown (populated from /api/curricula)
- Klassenstufe dropdown (5-6, 7-8, 9-10, 11-12, 13)
- Themenbereich multi-select
- Filter logic: show entities linked to selected curriculum nodes

## Key Files

| File                                                | Change                                                   |
| --------------------------------------------------- | -------------------------------------------------------- |
| `myhugoapp/static/js/visualization/d3-ego-graph.js` | Edge colors, touch support                               |
| `myhugoapp/layouts/_default/entity/single.html`     | Curriculum context panel                                 |
| `myhugoapp/static/js/entity-index.js`               | Landing page filters                                     |
| `api/server.js`                                     | Entity detection in chat, per-state learning path routes |
| `scripts/generate-learning-paths.mjs`               | NEW — generate 16 state paths from curriculum data       |
| `myhugoapp/content/lernpfade.md`                    | Update with per-state path selection                     |

## Verification

1. D3 graph shows colored edges by relationship type
2. Touch gestures work on mobile (pinch-zoom, pan)
3. Entity detail pages show curriculum context panel
4. /api/learning-paths returns per-state paths
5. Chat responses include entity context when entities detected
6. Wissensnetz landing filters reduce visible entities correctly
7. node --check on all modified JS
