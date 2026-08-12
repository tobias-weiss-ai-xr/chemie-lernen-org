# Delta Spec: curricula-graph-viz

Modifies `lehrplan-curriculum` and `modulhandbuch-university`.

## ADDED Requirements

### Requirement: REQ-LP-9: Interactive curriculum graph

The curricula index page SHALL render an interactive graph visualization of
the Lehrplan + Modulhandbuch knowledge graph instead of a tabbed list.

- `GET /api/curricula/graph` SHALL return cytoscape-ready
  `{ nodes, edges, meta }`:
  - `scope=all|universities|curriculum` (default `all`)
  - `university=<short_code>` and `state=<state_abbr>` focus filters
  - `limit=<n>` node cap (default 500, max 1500)
  - `q=<substring>` name filter
- Nodes: `University`, `UniversityModule`, `Curriculum`, `Topic`,
  `SubTopic`, `LearningObjective`, `Entity`, `Content` (page).
- Edges: `OFFERS`, `COVERS`, `TEACHES`, `HAS_TOPIC`, `HAS_SUBTOPIC`,
  `HAS_LEARNING_OBJECTIVE`, `COVERS_TOPIC`, `MENTIONS`, `BEINHALTET`.
- The index page (template `curricula-index.html` + JS) renders the
  graph with: scope switcher, search box, legend, node click → detail
  panel, and a "Lernziele" expansion for a focused topic.
- The old four tabs (Durchsuchen / Ländervergleich / Lernziele /
  Inhalte) are removed from the index page.

#### Scenario: S-LP-9a: User explores the university graph

- **WHEN** the user opens `/curricula/` and switches scope to
  "Universitäten"
- **THEN** the graph shows University → UniversityModule nodes with
  OFFERS edges
- **AND** selecting a university shows its modules and their linked
  `Entity` nodes
- **AND** clicking a module shows its metadata (degree, level, ECTS)
  in the detail panel

#### Scenario: S-LP-9b: User explores a state curriculum

- **WHEN** the user switches scope to "Lehrpläne" and picks a state
- **THEN** the graph shows Curriculum → Topic → SubTopic nodes with
  HAS_TOPIC / HAS_SUBTOPIC edges
- **AND** learning objectives appear as a bounded set (capped) when
  expanding a topic

#### Scenario: S-LP-9c: Search highlights

- **WHEN** the user types into the search box
- **THEN** matching nodes are highlighted and non-matching nodes fade
- **AND** edges are shown only when they connect visible/highlighted
  nodes

### Requirement: REQ-MH-6: Module-handbook reachable from the curricula graph

- The curricula graph's "Universitäten" scope SHALL surface
  `UniversityModule` nodes with their degree/level/ECTS metadata
  (read from Neo4j, same subset as `/api/modulhandbuch/*`).

#### Scenario: S-MH-6a: University filter

- **WHEN** the user selects a university short code in the graph scope
  controls
- **THEN** only that university, its modules and their linked entities
  are shown
- **AND** the detail panel offers a link to the existing
  `/modulhandbuch/` page for the university

## MODIFIED Requirements

### REQ-LP-6: API surface

Adds:

- `GET /api/curricula/graph` — graph payload (see REQ-LP-9)
