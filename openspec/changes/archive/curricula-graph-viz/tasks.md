# Tasks: curricula-graph-viz

## 1. Backend — graph endpoint

- [x] 1.1 Add `GET /api/curricula/graph` to `api/routes/curricula.js`:
      parse `scope`, `university`, `state`, `limit`, `q`.
- [x] 1.2 Query 1 (universities): `MATCH (u:University)-[:OFFERS]->(m:UniversityModule)` + `OPTIONAL MATCH (m)-[:COVERS|TEACHES]->(e:Entity)` — nodes
      uni/mod/ent, edges OFFERS + COVERS/TEACHES.
- [x] 1.3 Query 2 (curriculum): `MATCH (c:Curriculum)-[:HAS_TOPIC]->(t:Topic)`,
      `OPTIONAL MATCH (t)-[:HAS_SUBTOPIC]->(s:SubTopic)`,
      `OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)`
      with `state` filter on `c.state_abbr`; objectives capped.
- [x] 1.4 Query 3 (bridges): non-lehrplan `Entity` `-[:COVERS_TOPIC]->`
      `SubTopic`; lehrplan `Entity` `-[:MENTIONS]->` `Content` (pages).
- [x] 1.5 Merge results in JS into `{nodes, edges, meta}` with namespaced
      ids, dedup, degree-based cap honoring `limit`, `q` substring filter.
- [x] 1.6 In-memory cache keyed by scope+params (60s TTL).
- [x] 1.7 Export route; verify with curl against a local driver run.

## 2. Frontend — graph renderer

- [x] 2.1 Rewrite `myhugoapp/static/js/curricula-index.js` to render a
      cytoscape graph (cose layout, type colors, label styles mirroring
      `entity-graph-cytoscape.js`).
- [x] 2.2 Scope switcher (Alle / Universitäten / Lehrpläne) + university
      and state selects → re-fetch `/api/curricula/graph`.
- [x] 2.3 Search box: highlight matching nodes, fade others.
- [x] 2.4 Node click → detail panel (name, type, metadata, links to
      `/entity/<slug>` / `/modulhandbuch/`); "Lernziele anzeigen"
      expansion for topics.
- [x] 2.5 Legend + keyboard focus + `prefers-reduced-motion` respected.
- [x] 2.6 Update `curricula-index.html`: graph container, lazy cytoscape
      vendor loading (pattern from `entity-index.html`), drop tab chrome.

## 3. Tests & polish

- [x] 3.1 `tests/curricula-graph.test.mjs`: route shape, scope filters,
      state/university filtering, caps, `q` filter (mock driver or live).
- [x] 3.2 Update `tests/test-curricula-modulhandbuch.spec.js` (Playwright)
      if it asserts old tab buttons → assert graph container + legend.
- [x] 3.3 Manual smoke: `/curricula/` renders graph in all scopes,
      detail panel works, no console errors; web suite + lint green.

## 4. Spec sync & archive

- [x] 4.1 Sync delta spec to `openspec/specs/lehrplan-curriculum/spec.md`
      and `openspec/specs/modulhandbuch-university/spec.md` (+ index).
- [x] 4.2 Archive the change after implementation is complete.
