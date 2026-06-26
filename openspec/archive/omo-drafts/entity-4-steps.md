# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

---

slug: entity-4-steps
status: drafting
intent: clear
pending-action: write .omo/plans/entity-4-steps.md
approach: 4 unabhängige Schritte parallel ausführen — Entity-Detail-Frontend neu schreiben, Article-Redirect einrichten, Graph-Redirect einrichten, KG-Export-API verifizieren

---

# Draft: entity-4-steps

## Components (topology ledger)

| id  | outcome                                                                            | status | evidence path                            |
| --- | ---------------------------------------------------------------------------------- | ------ | ---------------------------------------- |
| 1   | Entity-Detail-Seite modernisiert (Karten-Layout, Live-API-Daten, Kategorie-Farben) | active | `myhugoapp/layouts/entity/single.html`   |
| 2   | `/article/{slug}` leitet auf `/themenbereiche/{topic}/{slug}/` weiter              | active | Hugo aliases in article frontmatter      |
| 3   | `/entity/graph/` leitet auf `/wissennetz/` weiter (oder rendert Graph)             | active | `content/entity/graph.md` + D3 existiert |
| 4   | `/api/kg-data` verifiziert und dokumentiert                                        | active | `api/server.js:1351`                     |

## Findings (cited - path:lines)

- **Entity Template**: `myhugoapp/layouts/entity/single.html` nutzt Bootstrap 3 panels, `panel panel-default`, `list-group`, `label label-primary`. Lädt Daten aus `$.Site.Data.kg_data.entities` (statisch). Minimalistisch, kein Dark Mode, kein Live-API-Fetch.
- **Entity Content**: 56 Entity-Ordner in `content/entity/`, jeder mit `_index.md` + `graph.md`. Template definiert `{{ define "main" }}`.
- **Design System**: `curricula-index.html` und `entity-index.js` definieren modernes Card-Design mit CSS-Variablen, Dark-Mode-Support (prefers-color-scheme), Kategorie-Farben (stoff:#667eea, konzept:#45b7d1, etc.), Skeleton-Screen, Tooltips. `entity-index.js`-Stil: Vanilla JS, IIFE, fetch(/api/kg-data).
- **Graph existiert**: `content/wissennetz.md` (nicht `/entity/graph/`) rendert vollen D3.js v7 Force-Graph, lädt `/api/kg-data`, ~120 Zeilen Inline-JS. Kein separates Template nötig.
- **graph.md existiert ohne Template**: `content/entity/graph.md` hat `layout: entity-graph` aber kein `layouts/_default/entity-graph.html`.
- **Article URLs**: alle unter `content/themenbereiche/{topic}/{slug}.md`, keine `/article/`- oder `/p/`-Pfade.
- **nginx config**: `root /opt/git/hugo-chemie-lernen-org/public`, `try_files $uri $uri/ /index.html`. Nutzt Traefik als Reverse-Proxy. `/api/` wird an `chemie-chat-api` weitergeleitet (Traefik Rule).
- **Hugo config**: `config.toml` mit theme hugo-cards, baseURL chemie-lernen.org. Keine URL-Rewrites oder Aliases konfiguriert.
- **KG-Export API**: `/api/kg-data` in `api/server.js:1351` liefert JSON mit `{source, articles, entities, curricula, loadTime}`. Fetcht von Neo4j mit Fallback zu embedded data. Genutzt von `entity-index.js`, `curricula-index.js`, `ki-assistent.js`.

## Decisions (with rationale)

1. **Entity-Detail = Client-Side Rendering**: Statt statisches Hugo-Template zu erweitern, fetch(/api/kg-data) + client-seitige Filterung. Weil: Daten in Neo4j live sind, kg_data.json statisch ist, und entity-index.js das gleiche Pattern erfolgreich nutzt.
2. **Article-Redirect via Hugo aliases + Build-Script**: Ein Script fügt `aliases: [/article/{slug}/]` zu jedem Artikel-Frontmatter hinzu. Hugo generiert daraus Redirect-HTML-Seiten. Einfachster Weg für statische Site ohne nginx-map-Datei.
3. **Graph = Redirect statt neu bauen**: D3-Graph existiert bereits unter `/wissennetz/`. `/entity/graph/` soll per Hugo alias auf `/wissennetz/` weiterleiten. Keine Code-Duplizierung.
4. **KG-Export = nur Verifikation**: Endpunkt läuft seit KG1-Import. Keine Änderungen nötig, nur Testdurchlauf und Dokumentation.

## Scope IN

1. entity/single.html: Vollständiger Rewrite als Client-Side SPA (fetch API → render)
2. Article Redirect: Build-Script für Hugo aliases, 1 Durchlauf
3. graph.md: Hugo alias hinzufügen → /wissennetz/
4. KG-Export: curl-Test + optionale Kommentar-Doku in server.js

## Scope OUT (Must NOT have)

- Kein D3-Graph-Neubau (existiert bereits)
- Kein Article-Redirect via nginx (nicht nötig wenn Hugo aliases)
- Keine Änderungen an entity-index.js oder curricula-index.js
- Keine Datenbank-Migrationen
- Keine neuen npm-Abhängigkeiten
- Keine Entity-Detail-Seite über Express API (nur Hugo)

## Open questions

(keine — alles durch Exploration geklärt)

## Approval gate

status: awaiting-approval

<!-- Der User hat bereits "plane alle 4 schritte b2b und führe sie dann durch /ralph" gesagt = pre-approval für Plan und Execution -->
