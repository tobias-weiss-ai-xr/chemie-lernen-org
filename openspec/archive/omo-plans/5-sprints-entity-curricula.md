# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

# 5-sprints-entity-curricula - Work Plan

## TL;DR (For humans)

**Was Sie bekommen:**

1. **Daten-Export-Script** — Neo4j → `kg_data.json` per Cron, Hugo baut immer mit aktuellen Daten
2. **Curricula-Compare verbessert** — kombinierte Filter (Bundesland+Schulform+Klasse), Lernziel-Übersicht, Diff-Highlighting in der Compare-Tabelle
3. **Graph + Ego-Graph** — Kategorie-Filter im `/wissennetz/`-D3-Graph + Mini-D3-Graph auf jeder Entity-Detail-Seite
4. **Globale Volltextsuche** — Client-seitige Suche über Lunr.js oder Hugo-Index, mit Kategorie-Badges
5. **API-Performance** — `/api/kg-data` mit In-Memory-Cache (TTL) + D3-Lazy-Load

**Warum dieser Ansatz:** Alle Sprints sind unabhängig voneinander und können parallel entwickelt werden. Kein neuer Stack — alles baut auf bestehenden Patterns auf (Vanilla JS, fetch API, D3.js CDN).

**Was es NICHT tun wird:** Kein Redis, keine neuen npm-Pakete (außer ggf. lunr), keine Datenbank-Migrationen, keine Änderungen an bestehenden API-Routen-Logiken.

**Aufwand:** Medium (-Large) — 5 Sprints, ~8h
**Risiko:** Medium — Graph-Ego und Suche sind neue Komponenten
**Entscheidungen:** Lunr.js für client-seitige Suche (kein Server nötig), einfacher In-Memory-Cache (kein Redis), D3 per CDN (wie vorhanden)

---

> TL;DR (machine): 5 independent sprints — A: kg_data.json export, B: curricula compare filters + diff, C: graph category filter + ego-graph, D: full-text search via lunr, E: API cache + lazy D3. ~8h, Medium risk.

## Scope

### Must have

A1: `scripts/kg-data-export.mjs` — Neo4j lesen → `myhugoapp/data/kg_data.json` schreiben
A2: Script in `package.json` als `npm run export:kg-data` registrieren
B1: Curricula-Filter: Mehrfachauswahl für Bundesland, Schulform, Klasse (statt Einzel-Dropdowns)
B2: Compare-Modus: Diff-Highlighting (grün/rot für Unterschiede zwischen zwei Lehrplänen)
B3: Lernziele als expandierbare Liste in Compare-Zeilen
C1: Kategorie-Filter-UI im `/wissennetz/`-Graph (Checkboxen zum Ein-/Ausblenden)
C2: Ego-Graph auf Entity-Detail-Seite (Mini-D3 unter Relationen, zeigt direkte Verbindungen)
D1: Client-seitige Volltextsuche via Lunr.js CDN, indexiert Entities + Artikel + Curricula
D2: Suchleiste global im Header, Ergebnisse als Overlay mit Kategorie-Badges
E1: In-Memory-Cache für `/api/kg-data` (LRU, 5min TTL)
E2: D3.js-Script nur bei Bedarf laden (nicht auf jeder Seite)

### Must NOT have (guardrails, anti-slop, scope boundaries)

- Kein Redis oder externe Caching-Infrastruktur
- Keine neuen npm-Abhängigkeiten außer lunr (Option)
- Keine Änderungen an bestehenden API-Routen-Signaturen
- Keine Datenbank-Migrationen
- Kein Umbau des bestehenden D3-Graphen (nur Erweiterungen)
- Keine Entity-Detail-Seite neu schreiben (bereits in Sprint 1 erledigt)

## Verification strategy

> Zero human intervention - all verification is agent-executed.

- Test decision: none (JS-SPA ohne Test-Setup) — `node --check` für Scripts, Hugo build 0, curl für API
- Evidence: `.omo/evidence/`

## Execution strategy

### Parallel execution waves

Wave 1 (parallel): A1, B1, B2, C1, D1, E1
Wave 2 (parallel): A2, B3, C2, D2, E2
Wave 3: Hugo Build + Push

### Dependency matrix

| Todo                 | Depends on     | Blocks | Can parallelize with |
| -------------------- | -------------- | ------ | -------------------- |
| A1 kg-data-export    | —              | A2     | B1, C1, D1, E1       |
| A2 npm script        | A1             | —      | B3, C2, D2, E2       |
| B1 multi-filter      | —              | B3     | A1, C1, D1, E1       |
| B2 diff-highlight    | —              | B3     | A1, C1, D1, E1       |
| B3 expand objectives | B1,B2          | —      | A2, C2, D2, E2       |
| C1 category filter   | —              | —      | A1, B1, D1, E1       |
| C2 ego-graph         | —              | —      | A2, B3, D2, E2       |
| D1 fulltext search   | —              | D2     | A1, B1, C1, E1       |
| D2 search UI         | D1             | —      | A2, B3, C2, E2       |
| E1 API cache         | —              | —      | A1, B1, C1, D1       |
| E2 lazy D3           | —              | —      | A2, B3, C2, D2       |
| Wave 3: Hugo Build   | A2,B3,C2,D2,E2 | —      | —                    |

## Todos

> Implementation + Test = ONE todo. Never separate.

<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

### Wave 1 (alle parallel)

- [ ] 1. kg-data-export Script
     What: Erstelle `scripts/export-kg-data.mjs`. Es verbindet zu Neo4j (gleiche Creds wie api/server.js), führt Entities/Articles-Queries aus den bestehenden kg-data-Endpunkt aus, schreibt JSON nach `myhugoapp/data/kg_data.json`. Nutzt `fs.writeFileSync`. Idempotent — überschreibt immer die ganze Datei. Must NOT: Keine Änderung an api/server.js, kein Löschen anderer data/-Dateien.
     Parallelization: Wave 1 | Blocked by: — | Blocks: A2
     References: `api/server.js:1351-1519` (kg-data Queries), `api/server.js:162-175` (Neo4j Connection/Creds), `myhugoapp/data/kg_data.json` (Ziel), `scripts/curricula/import-content-nodes.mjs` (Pattern für Neo4j-Script), `.env.example` (NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD)
     Acceptance: `node scripts/export-kg-data.mjs` exit 0; `wc -c myhugoapp/data/kg_data.json` > 1000
     QA happy: Script läuft → `node -e "console.log(JSON.parse(require('fs').readFileSync('myhugoapp/data/kg_data.json','utf8')).entities.length)"` > 0
     QA failure: Neo4j down → Script gibt Fehler aus, exit ≠ 0; bestehende kg_data.json bleibt erhalten
     Commit: Y | `feat(data): add Neo4j→kg_data.json export script`

- [ ] 2. Curricula Multi-Filter
     What: In `myhugoapp/static/js/curricula-index.js` die Filter von single-select Dropdowns auf multi-select umbauen. Statt `filterState = ''` → `filterStates = []`. UI: Checkboxen oder Multi-Select-Dropdown für Bundesland, Schulform, Klasse. Filter-Logik: entity muss ALLE aktiven Filter erfüllen (AND-Verknüpfung). Must NOT: Keine Änderung am HTML-Template (curricula-index.html), nur JS.
     Parallelization: Wave 1 | Blocked by: — | Blocks: 7
     References: `myhugoapp/static/js/curricula-index.js` (gesamte Filter-Logik Zeilen 50-130), `myhugoapp/static/js/entity-index.js` (Kategorie-Filter als Referenz für Multi-Select-Pattern), `myhugoapp/layouts/_default/curricula-index.html` (CSS-Klassen)
     Acceptance: Filter-Buttons checkbar; entities filtern nach state+school+grade gleichzeitig
     QA happy: Seite lädt → 3 Multi-Select-Dropdowns sichtbar; Bayern+Gymnasium filtert korrekt
     QA failure: Keine entities nach Filter → "Keine Ergebnisse"-Zustand
     Commit: Y | `feat(curricula): multi-select filter for state, school, grade`

- [ ] 3. Compare Diff-Highlighting
     What: In curricula-index.js Compare-Modus: Wenn zwei Curricula gewählt, zeige in der Compare-Tabelle grüne/rote Zellen für Unterschiede. Gleiche Werte = grau, unterschiedlich = grün (besser/höher) oder rot (schlechter/niedriger). Für objective_count: numerischer Vergleich. Für school_type/state: Textvergleich. Must NOT: Keine Änderung an bestehender Compare-Tab-Struktur.
     Parallelization: Wave 1 | Blocked by: — | Blocks: 7
     References: `myhugoapp/static/js/curricula-index.js` Compare-Teil (ab Zeile ~300), `myhugoapp/layouts/_default/curricula-index.html` Compare-CSS (`.compare-table`, `.compare-state-cell`)
     Acceptance: 2 Curricula vergleichen → unterschiedliche Werte farblich markiert
     QA happy: Zwei verschiedene Bundesländer → school_type, grade, objective_count farblich unterschiedlich
     QA failure: Ein Curriculum mit sich selbst vergleichen → alle Zellen grau (keine Unterschiede)
     Commit: Y | `feat(curricula): diff highlighting in compare table`

- [ ] 4. Graph Category Filter
     What: In `myhugoapp/content/wissennetz.md` (D3-Code) UI-Elemente für Kategorie-Filter hinzufügen. Oberhalb des SVG: Checkboxen pro Kategorie (Stoff, Konzept, Reaktion, Methode, Person). Beim Toggeln: entity-Nodes der deaktivierten Kategorie ausblenden/Opacity 0.1 setzen. Filter-Status als CSS-Klasse oder data-Attribut. Must NOT: Kein CDN-Wechsel, keine Änderung am Layout der Seite.
     Parallelization: Wave 1 | Blocked by: — | Blocks: —
     References: `myhugoapp/content/wissennetz.md` (kompletter D3-Code Zeilen 15-127), catColors (Zeile 27), node rendering (Zeilen 77-96)
     Acceptance: Checkboxen sichtbar; klicken blendet Kategorie aus/ein
     QA happy: "Stoff" deaktivieren → alle Stoff-Nodes verschwinden/werden transparent
     QA failure: Alle Kategorien deaktivieren → Graph leer (oder mindestens Articles bleiben)
     Commit: Y | `feat(graph): add category filter checkboxes to D3 force graph`

- [ ] 5. Fulltext Search via Lunr
     What: Erstelle `myhugoapp/static/js/search.js`. Nutzt Lunr.js von CDN. Beim Laden: fetch `/api/kg-data`, baue Lunr-Index über entities (name, category), articles (title), curricula (name, state). `search(query)` findet relevante Ergebnisse. Exportiere als `window.__search`. Must NOT: Keine andere JS-Datei modifizieren.
     Parallelization: Wave 1 | Blocked by: — | Blocks: 9
     References: `myhugoapp/static/js/entity-index.js` (fetch kg-data Pattern), `api/server.js:1351` (API Response Shape), `myhugoapp/layouts/partials/header.html` (wo search UI später eingebunden wird)
     Acceptance: `node --check myhugoapp/static/js/search.js` exit 0; im Browser: `window.__search.search("wasser")` liefert Results
     QA happy: Lunr geladen + API OK → Suche findet "Wasser" in entities + articles
     QA failure: API nicht erreichbar → Suche funktioniert nicht, kein Crash
     Commit: Y | `feat(search): add Lunr.js client-side search engine`

- [ ] 6. API In-Memory Cache
     What: In `api/server.js` vor der kg-data Route ein LRU-Cache-Objekt (`Map` mit TTL) einbauen. Cache-Key: `kg-data-${req.query.lehrplan || 'false'}`. TTL: 300s (5 Minuten). Bei Cache-Hit: sofort Response aus Cache. Bei Cache-Miss: query ausführen, in Cache speichern, Response. Bei Neo4j-Fehler: Cache nicht aktualisieren. Must NOT: Keine Änderung an Query-Logik, kein Redis.
     Parallelization: Wave 1 | Blocked by: — | Blocks: —
     References: `api/server.js:498` (bestehender RAG-LRU-Cache als Pattern), `api/server.js:1351-1519` (kg-data Route), `api/server.js:29-40` (module imports)
     Acceptance: Erster Request ~2s (Neo4j), zweiter Request <10ms (Cache)
     QA happy: `curl -s /api/kg-data` → `loadTime` > 0.1 (uncached); nochmal → `loadTime` < 0.01 (cached)
     QA failure: Nach 5min → Cache expired (loadTime wieder > 0.1)
     Commit: Y | `feat(api): add LRU cache for /api/kg-data with 5min TTL`

### Wave 2 (alle parallel, nach Wave 1)

- [ ] 7. npm Script registrieren
     What: In `myhugoapp/package.json` unter `scripts` füge `"export:kg-data": "node ../scripts/export-kg-data.mjs"` hinzu. In `AGENTS.md` dokumentieren. Must NOT: Keine anderen package.json-Änderungen.
     Parallelization: Wave 2 | Blocked by: 1 | Blocks: —
     References: `myhugoapp/package.json` (scripts section), `AGENTS.md` (Dokumentations-Pattern)
     Acceptance: `npm run export:kg-data` exit 0 (in myhugoapp/)
     Commit: Y | `feat(data): register kg-data export as npm script`

- [ ] 8. Curricula Expandable Objectives
     What: In curricula-index.js Compare-Modus: Jede Tabellenzeile bekommt einen "▶ Lernziele anzeigen"-Button. Beim Klicken: fetch `/api/kg-data?lehrplan=true` (oder nutze bereits geladene data.entities), filtere didaktik-Entities die related zum curriculum sind, zeige deren Namen als Liste. Must NOT: Keine Änderung an der Compare-Logik.
     Parallelization: Wave 2 | Blocked by: 2, 3 | Blocks: —
     References: `myhugoapp/static/js/curricula-index.js` Compare-Render-Teil, `myhugoapp/layouts/_default/curricula-index.html` Compare-Tabelle CSS
     Acceptance: Klick auf "Lernziele" → expandiert Liste der zugeordneten KMK-Standards
     Commit: Y | `feat(curricula): expandable learning objectives in compare view`

- [ ] 9. Ego-Graph auf Entity-Detail
     What: In `myhugoapp/layouts/entity/single.html` nach den Relationen einen Mini-D3-Graph einfügen. Höhe: 300px. Zeigt die aktuelle Entity (zentral, groß) + direkte Verbindungen (related entities, category-farbig) + Artikel (klein, grau). Nutzt D3.js von CDN. Blendet nur ein wenn `window.__egoData` verfügbar. Must NOT: Kein D3 auf Nicht-Entity-Seiten laden.
     Parallelization: Wave 2 | Blocked by: — | Blocks: —
     References: `myhugoapp/layouts/entity/single.html` (aktuelle Version), `myhugoapp/content/wissennetz.md` (D3-Pattern), `myhugoapp/static/js/entity-index.js` (catColors)
     Acceptance: `/entity/wasser/` zeigt Mini-Graph mit Wasser-Zentrum + 3-5 verbundenen Nodes
     Commit: Y | `feat(entity): add ego-network D3 graph to entity detail page`

- [ ] 10. Search UI
      What: In `myhugoapp/layouts/partials/header.html` eine Suchleiste einbauen (Lupe-Icon, Input-Feld). Bei Eingabe >2 Zeichen: `window.__search.search(query)` aufrufen, Ergebnisse als Dropdown-Overlay unter der Leiste anzeigen. Anzeige: Entity-Name + Kategorie-Badge + Artikelanzahl. Klick → navigiere zu `/entity/{slug}/`. Escape schließt. Must NOT: Kein Suchindex auf jeder Seite neu aufbauen (nur einmal bei erster Suche).
      Parallelization: Wave 2 | Blocked by: 5 | Blocks: —
      References: `myhugoapp/layouts/partials/header.html` (Header-Template), `myhugoapp/static/js/search.js` (Such-Engine)
      Acceptance: Header zeigt Suchfeld; "Was" → Dropdown mit "Wasser", "Wasserstoffproduktion" etc.
      Commit: Y | `feat(search): add global search bar with overlay results`

- [ ] 11. Lazy D3 Load
      What: In `myhugoapp/content/wissennetz.md`: Entferne das `<script src="d3js.org">` aus dem HTML und ersetze durch JS-dynamisches Laden. Prüfe ob D3 bereits geladen (`typeof d3 !== 'undefined'`), wenn nicht: `document.createElement('script')` + `src="https://d3js.org/d3.v7.min.js"` + `onload = startGraph`. In `entity/single.html`: D3 nur laden wenn Ego-Graph-Bereich sichtbar ist (IntersectionObserver). Must NOT: D3 nicht auf jeder Seite laden.
      Parallelization: Wave 2 | Blocked by: — | Blocks: —
      References: `myhugoapp/content/wissennetz.md` (D3-Code), `myhugoapp/layouts/entity/single.html` (Ego-Graph)
      Acceptance: `/wissennetz/` lädt D3 dynamisch und rendert Graph; Entity-Seite lädt D3 nur beim Scrollen zum Ego-Graph
      Commit: Y | `feat(perf): lazy-load D3.js on graph and entity pages`

### Wave 3

- [ ] 12. Hugo Build + Push
      What: `cd myhugoapp && hugo` (oder Docker-Build). Prüfe exit 0. Überprüfe `public/entity/` und `public/curricula/`. `git add -A && git commit -m "feat: 5 sprints — kg-export, curricula compare, graph filters, search, cache" && git push`. Must NOT: Keine `public/` commits.
      Parallelization: Wave 3 | Blocked by: 7, 8, 9, 10, 11 | Blocks: —
      Acceptance: Hugo build exit 0; push erfolgreich

## Final verification wave

> Runs in parallel after ALL todos. ALL must APPROVE.

- [ ] F1. Plan compliance — alle 12 Todos durchgeführt?
- [ ] F2. Code quality — `node --check` auf alle Scripts + JS
- [ ] F3. Real manual QA — Entity-Detail mit Ego-Graph, Curricula-Filter, Graph-Filter, Suche, API-Performance
- [ ] F4. Scope fidelity — keine unerwünschten Änderungen

## Commit strategy

- A1: `feat(data): add Neo4j→kg_data.json export script`
- A2: `feat(data): register kg-data export as npm script`
- B1: `feat(curricula): multi-select filter for state, school, grade`
- B2: `feat(curricula): diff highlighting in compare table`
- B3: `feat(curricula): expandable learning objectives in compare view`
- C1: `feat(graph): add category filter checkboxes to D3 force graph`
- C2: `feat(entity): add ego-network D3 graph to entity detail page`
- D1: `feat(search): add Lunr.js client-side search engine`
- D2: `feat(search): add global search bar with overlay results`
- E1: `feat(api): add LRU cache for /api/kg-data with 5min TTL`
- E2: `feat(perf): lazy-load D3.js on graph and entity pages`
- Final: `feat: 5 sprints — kg-export, curricula compare, graph filters, search, cache`

## Success criteria

- [ ] A: `npm run export:kg-data` exportiert Neo4j → kg_data.json
- [ ] B: Curricula-Filter erlaubt Mehrfachauswahl; Compare zeigt Diff-Farben + expandierbare Lernziele
- [ ] C: Wissennetz-Graph hat Kategorie-Checkboxen; Entity-Seite zeigt Ego-Graph
- [ ] D: Globale Suchleiste im Header findet Entities + Artikel + Curricula
- [ ] E: `/api/kg-data` cached 5min; D3 lädt nur bei Bedarf
