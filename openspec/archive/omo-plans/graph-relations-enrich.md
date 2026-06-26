# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

# graph-relations-enrich - Work Plan

## TL;DR (For humans)

**What you'll get:** Der generische `RELATED_TO`-Beziehungstyp im Wissensgraphen wird durch spezifische, semantisch aussagekräftige Typen ersetzt (z.B. `ERZEUGT`, `BESCHREIBT`, `AEHNLICH_ZU`). Eine vorberechnete Cached View (`kg_rich_data.json`) speichert alle aufgelösten Beziehungen für schnellen Zugriff im Frontend.

**Why this approach:** Neo4j Community Edition hat kein GDS (Graph Data Science) — daher reine Cypher + APOC + bestehende Co-Occurrence-Bibliothek (graphwiz).

**What it will NOT do:** Keine Echtzeit-Neo4j-Abfragen im Frontend, keine GDS-Algorithmen, keine Migration bestehender Daten (nur Anreicherung).

**Effort:** Medium (~3-4h)
**Risk:** Low — bestehende Daten werden nicht gelöscht, nur neue Typen hinzugefügt
**Decisions to sanity-check:** Typisierungsmatrix für Relationen (s.u.), Build-Pipeline Integration

Your next move: Approve and start execution.

---

> **TL;DR (machine):** Medium effort, low risk. Replace generic RELATED_TO with semantic types via Cypher rules + Co-Occurrence; pre-compute as kg_rich_data.json cached view.

## Scope

### Must have

1. Cypher-basierte Typisierungsregeln ersetzen RELATED_TO durch semantische Typen (siehe Matrix)
2. `scripts/kg-enrich.mjs` — Pre-computed Export als `data/kg_rich_data.json`
3. Build-Pipeline Integration — `npm run enrich` vor Hugo-Build
4. Entities in `kg_rich_data.json` haben nach Typ gruppierte Relationen

### Must NOT have

- Kein GDS, keine ML-basierten Ähnlichkeiten
- Kein Löschen oder Überschreiben bestehender RELATED_TO → nur neue Typen zusätzlich
- Keine Änderungen an entity/single.html Frontend (deferred)
- Keine APOC-Nutzung (nicht in docker-compose eingerichtet) — pure Cypher + graphwiz

## Verification strategy

- Test decision: tests-after
- Evidence: .omo/evidence/ — Cypher-Dry-Run Log, kg_rich_data.json Validierung, Build-Pipeline Log

## Execution strategy

### Parallel execution waves

- **Wave 1**: Typisierungsregeln als Cypher-Skript + Dry-Run
- **Wave 2**: kg-enrich.mjs (Cached View Generator) + Build-Pipeline Integration

### Dependency matrix

| Todo              | Depends on | Blocks | Can parallelize with |
| ----------------- | ---------- | ------ | -------------------- |
| 1. Cypher-Regeln  | —          | 2      | —                    |
| 2. kg-enrich.mjs  | 1          | 3      | —                    |
| 3. Build-Pipeline | 2          | —      | —                    |

## Todos

- [ ] 1. **Cypher-Typisierungsregeln für Entity-Relationen**
     **What to do:** Erstelle `scripts/enrich-relations.cypher` mit MATCH/CREATE-Queries. Lese existierende `RELATED_TO`-Beziehungen, bestimme Quell- und Zielkategorie (`e.sourceCategory`, `e2.sourceCategory`), lege neue semantische Typ-Beziehung an.

  **Typisierungsmatrix:**
  | Source Cat | Target Cat | Neuer Typ | Bedingung |
  |---|---|---|---|
  | stoff | stoff | AEHNLICH_ZU | — |
  | stoff | konzept | BEINHALTET | — |
  | stoff | reaktion | BETEILIGT_AN | — |
  | stoff | methode | WIRD_VERWENDET_IN | — |
  | konzept | konzept | VERALLGEMEINERT | — |
  | konzept | stoff | BESCHREIBT | — |
  | konzept | reaktion | BESCHREIBT | — |
  | reaktion | reaktion | VERGLEICHBAR | — |
  | reaktion | stoff | ERZEUGT | — |
  | reaktion | konzept | DEMONSTRIERT | — |
  | methode | stoff | VERWENDET | — |
  | methode | konzept | WENDET_AN | — |
  | person | stoff/konzept/reaktion | ENTDECKT | — |
  | quelle | alles | QUELLE_VON | — |

  **Kommando:** Nutze `cypher-shell` (docker exec) oder inline `node ./api/server.js`-basierte Ausführung. Dry-Run mit RETURN statt CREATE.

  **Must NOT:** Nicht `DETACH DELETE` oder `MATCH (n) DETACH DELETE n` verwenden. Nur CREATE neuer Typen, kein DELETE bestehender.

  **Parallelization:** Wave 1 | Blocked by: — | Blocks: Todo 2

  **References:**
  - `scripts/upgrade-relation-types.mjs` (Pattern für Cypher-Ausführung von Node)
  - `api/server.js` (Neo4j-Session + Cypher-Patterns)

  **Acceptance criteria:** Cypher Dry-Run gibt für jede RELATED_TO-Beziehung den neuen Typ aus. Nach Ausführung hat der Neo4j-Graph für jede Entity semantisch typisierte Beziehungen zusätzlich zu RELATED_TO.

  **QA:** Dry-Run mit RETURN (kein CREATE) zur Validierung. Evidence: `.omo/evidence/task-1-cypher-dryrun.log`

  **Commit:** Y | `feat(graph): add semantic relationship type Cypher rules`

- [ ] 2. **kg-enrich.mjs — Cached View Generator**
     **What to do:** Erstelle `scripts/kg-enrich.mjs` das:
  1. `data/kg_data.json` einliest (wurde vorher von export-kg-data.mjs erzeugt)
  1. Für jede Entity die Beziehungen nach Typ gruppiert
  1. Co-Occurrence-Ähnlichkeit via graphwiz builder `buildEntityGraph()` berechnet
  1. Ausgabe: `data/kg_rich_data.json` mit Struktur:
     ```json
     {
       "entities": { "wasser": { "name": "Wasser", "category": "stoff", ...,
         "relations": { "BEINHALTET": [{"target": "oxidationszahl", "weight": 1}],
                        "BETEILIGT_AN": [...],
                        "AeHNLICH_ZU": [...] }}},
       "statistics": { "totalRelations": 342, "byType": {...} }
     }
     ```
  1. Fallback bei leerem kg_data.json: Log-Warnung, exit 0 ohne File-Überschreibung

  **Must NOT:** Kein Neo4j-Direktzugriff aus kg-enrich.mjs — liest nur kg_data.json. Kein Überschreiben von kg_data.json.

  **Parallelization:** Wave 2 | Blocked by: Todo 1 | Blocks: Todo 3

  **References:**
  - `scripts/export-kg-data.mjs` (Pattern: Datei-Lesen/Schreiben, Exit-Codes)
  - `scripts/article-pipeline.mjs` (Pattern: graphwiz buildEntityGraph)
  - `scripts/generate-entity-pages.mjs` (Pattern: Entity-Datenverarbeitung)

  **Acceptance criteria:** `node scripts/kg-enrich.mjs` erzeugt `myhugoapp/data/kg_rich_data.json` mit gültigem JSON. Jede Entity hat relations nach Typ gruppiert. Bei leerer Eingabe: exit 0, keine Datei.

  **QA:** node scripts/kg-enrich.mjs; node -e "const d=require('./myhugoapp/data/kg_rich_data.json'); console.log(Object.keys(d.entities).length, 'entities,', d.statistics.totalRelations, 'relations')". Evidence: `.omo/evidence/task-2-enrich-validate.log`

  **Commit:** Y | `feat(graph): add kg-enrich.mjs cached view generator`

- [ ] 3. **Build-Pipeline Integration**
     **What to do:** Erweitere `package.json` scripts:
  - `"enrich": "node scripts/kg-enrich.mjs"`
  - Erweitere `"enrich:export"` (oder bestehenden build) um: export → enrich → hugo build
  - Oder erweitere `"build"` auf: `npm run export:kg && npm run enrich && docker run hugo --minify`

  **Must NOT:** Keine Änderungen an Docker-Konfiguration. Keine neuen Abhängigkeiten.

  **Parallelization:** Wave 3 | Blocked by: Todo 2 | Blocks: —

  **References:**
  - `package.json` scripts section
  - `AGENTS.md` Build-Abschnitt

  **Acceptance criteria:** `npm run enrich` läuft ohne Fehler. `npm run build` schließt enrich-Schritt ein.

  **QA:** npm run enrich. Evidence: `.omo/evidence/task-3-build-pipeline.log`

  **Commit:** Y | `ci: add kg-enrich to build pipeline`

## Final verification wave

- [ ] F1. Lint (0 errors)
- [ ] F2. npm run enrich + validate kg_rich_data.json
- [ ] F3. Hugo build test (docker run hugo --minify dry-run)
- [ ] F4. Scope fidelity — alle Must-haves erfüllt, kein Must-NOT verletzt

## Commit strategy

3 separate Commits (einer pro Todo) mit `feat(graph):` oder `ci:` Präfix.

## Success criteria

- Neo4j hat semantisch typisierte Beziehungen (mindestens 8 neue Typen)
- `kg_rich_data.json` existiert mit nach Typ gruppierten Relationen
- `npm run enrich` ist Teil der Build-Pipeline
- Kein Datenverlust (RELATED_TO bleibt als Fallback erhalten)
