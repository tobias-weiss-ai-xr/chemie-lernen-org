# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

# Graph-Erweiterung + Plattform-Split

## TL;DR

Zwei zusammenhängende Arbeiten:

**1. Plattform-Split**: `/entity/` wird reine Schüler-Ansicht (Stoffe, Konzepte, Reaktionen, Methoden, Personen, Quellen). `/curricula/` wird dedizierte Lehrkräfte-SPA mit vollem Explorer, Compare, KMK-Matrix, Entity-Details inkl. Curriculum-Daten. Curriculum-Code wird sauber aus entity-index.js/entity-index.html entfernt und in curricula-index.js + curricula-index.html verlagert.

**2. Graph-Erweiterung für Schüler**: Aktuelle Fallback-Daten haben 10 Artikel (aus Pipeline) aber **0 Artikel-Entity-Verknüpfungen** — die `articles[]`-Arrays auf Entities sind alle leer. Quelle-Entities existieren nicht. Ziel: Artikel-Quelle-Learning-Paths im Graph abbilden, sodass Schüler strukturierte Lernpfade mit Quellenangaben sehen.

---

## Teil 1: Plattform-Split (/entity/ vs /curricula/)

### Aktuelle Probleme

- `entity-index.js` (605 Zeilen) mischt Schüler- und Lehrer-Features
- Curriculum-Kategorien (lehrplan, didaktik) in catLabels/catColors
- Explorer-Tab mit Curriculum-spezifischen Filtern
- Compare/KMK-Features im Explorer
- CSS-Klassen für lehrplan/didaktik in entity-index.html
- API `/api/kg-data` liefert Curriculum-Entities in denselben Response

### Arbeitsschritte

#### 1.1 Entity-Index curricular bereinigen

**Dateien**: `myhugoapp/static/js/entity-index.js`, `myhugoapp/layouts/_default/entity-index.html`

**Aus entity-index.js entfernen**:

- `lehrplan` aus `catLabels` (bleibt: stoff, konzept, reaktion, methode, person, quelle)
- `didaktik` aus `catLabels`
- `lehrplan`/`didaktik` aus `catColors`
- `lehrplan`-Zweig in `getTooltipHtml()` (curriculumMeta-Zeigen für lehrplan-Entities)
- `_renderExplorer()` — gesamte Funktion (200+ Zeilen Curriculum-Explorer)
- `_attachExplorerEvents()` — gesamte Event-Handler
- `_renderCurriculumCard()` — falls existiert
- `_attachCommonEvents()` kann bleiben (wird auch von main view genutzt)
- Explorer-Tab aus der Tab-Leiste
- Compare-Sektion
- KMK-spezifische Logik (pre-computed \_kmkTopicMap)
- `lehrplan`/`didaktik` aus `_renderImpl` Filterlogik

**Aus entity-index.html entfernen**:

- `.entity-card[data-cat="lehrplan"]::before { background: #9b59b6; }`
- `.entity-card[data-cat="lehrplan"] .entity-card-cat`
- `.entity-card-curriculum-meta`
- `.entity-explorer`, `.explorer-controls`
- `.explorer-search-input`, `.explorer-autocomplete`
- `.explorer-compare-btn`, `.explorer-compare-section`
- `.explorer-compare-table`, `.compare-cell-ok`, `.compare-cell-none`
- `.kmk-badge`
- Alle zugehörigen Dark-Mode-Varianten

#### 1.2 API anpassen

**Datei**: `api/server.js`

- `/api/kg-data`: Curriculum-Entities (lehrplan, didaktik) nur noch liefern wenn `?curricula=true` Query-Parameter gesetzt
- `/api/entity/:slug`: weiterhin alle Entities liefern (Curriculum-Detail braucht API)
- `/api/curricula/compare`: bleibt bestehen (von /curricula/ genutzt)
- `/api/admin/chat-logs`: bleibt unverändert

#### 1.3 Neue Curricula-SPA erstellen

**Dateien**:

- `myhugoapp/layouts/_default/curricula-index.html` — Layout für /curricula/
- `myhugoapp/static/js/curricula-index.js` — Volle SPA mit Explorer, Compare, KMK-Matrix
- `myhugoapp/content/curricula/_index.md` — Content-Frontmatter (existiert bereits)

**curricula-index.js**:

- Kopie der curriculum-spezifischen Logik aus entity-index.js:
  - `_renderExplorer()` — State/School/Grade-Dropdowns, Topic-Suche, Autocomplete
  - `_renderComparison()` — Compare-Sektion mit `/api/curricula/compare`
  - `_renderKMKMatrix()` — KMK-Compliance-Tabelle
  - `_renderCurriculumDetail()` — Entity-Detail-Ansicht (ähnlich /entity/:slug HTML)
  - `_attachEvents()` — Alle Event-Handler für Explorer, Compare, KMK

**curricula-index.html**:

- Eigene CSS-Klassen (kopiert aus entity-index.html + erweitert)
- Dark-Mode-Support
- Responsive Design

**Hugo Routing**:

- `content/curricula/_index.md` → `layouts/_default/curricula-index.html`
- Hugo `outputs: ["html"]` in Frontmatter

### API-Änderungen (zusammengefasst)

| Endpoint                          | Änderung                                                  |
| --------------------------------- | --------------------------------------------------------- |
| `GET /api/kg-data`                | Filter lehrplan/didaktik raus wenn kein `?curricula=true` |
| `GET /api/kg-data?curricula=true` | Unverändert (volle Response)                              |
| `GET /api/entity/:slug`           | Unverändert                                               |
| `GET /api/curricula/compare`      | Unverändert                                               |
| `GET /api/admin/chat-logs`        | Unverändert                                               |

---

## Teil 2: Graph-Erweiterung für Schüler

### Aktueller Zustand

- **10 Fallback-Artikel** im Top-Level-Array mit `{id, title, url, entities, date}`
- **18 Entities** mit Kategorien (stoff, konzept, reaktion, methode)
- **NICHT verbunden**: jedes Entity hat `articles: []` — null!
- **Keine Quelle-Entities** im Fallback
- **Neo4j**: Document-Knoten existieren via Pipeline, aber nicht im Fallback
- **Mind the gap**: Die 10 Pipeline-Artikel referenzieren Entity-Namen per `entities[]`-Feld, aber die Gegenrichtung (Entity→Artikel) fehlt

### Erweiterungs-Plan

#### 2.1 Entity↔Article-Verknüpfung im Fallback

**Datei**: `api/server.js`

- `articles`-Array auf Entities auffüllen basierend auf Pipeline-Artikel-`entities[]`-Feld
- Jedes Entity bekommt `articles: [{id, title, url, date}]` wenn ein Pipeline-Artikel es referenziert
- **Expected**: ~18 Entities mit je 1-2 Artikeln

```javascript
// In getFallbackData(), nach entities-Array:
for (var ai = 0; ai < fallback.articles.length; ai++) {
  var article = fallback.articles[ai];
  for (var ei = 0; ei < fallback.entities.length; ei++) {
    if (article.entities && article.entities.indexOf(fallback.entities[ei].name) !== -1) {
      if (!fallback.entities[ei].articles) fallback.entities[ei].articles = [];
      fallback.entities[ei].articles.push({
        id: article.id,
        title: article.title,
        url: article.url,
        date: article.date,
        source_type: 'pipeline',
      });
    }
  }
}
```

#### 2.2 Quelle-Entities im Fallback

**Datei**: `api/server.js`

- Pro Pipeline-Artikel eine Quelle-Entity anlegen (falls Quelle-Name aus Artikel extrahierbar)
- Fallback: 3-5 generische Quelle-Entities:
  ```javascript
  { id: 'e40', name: 'forschungsbericht-nanochemie', category: 'quelle',
    articles: [...], relatedEntities: [...], articleCount: 0 }
  ```
- Quelle-Entities zeigen `type`-Property: 'forschungsartikel', 'lehrbuch', 'video', 'webseite'
- Verknüpfung: Quelle `[:MENTIONS]` Entity, Entity `[:HAS_SOURCE]` Quelle

#### 2.3 Article-Detail-Ansicht

**Datei**: `api/server.js` (neue Route)

- `GET /api/article/:slug` — gibt Artikel-Detail mit verknüpften Entities, Quellen, Curriculum-Context
- `GET /article/:slug` — HTML-Seite für Artikel (eigenständige Seite, nicht nur Fallback)
- Article-Seite zeigt: "Dieser Artikel behandelt: Entity1, Entity2..." (verlinkt zu /entity/)
- Article-Seite zeigt: "Quelle: [Name]" mit Quelle-Entity-Link

#### 2.4 Lernpfad-Struktur

**Datei**: `scripts/curricula/link-content.mjs` (erweitern)

- Zusätzliche Relation: `[:BESTEHT_AUS {order:N}]` zwischen Lerninhalten
- Lernpfad = Entity → Article → Calculator → Quiz
- In Neo4j: `(Entity)-[:BESTEHT_AUS {order:0}]->(Article)` → `(Entity)-[:BESTEHT_AUS {order:1}]->(Calculator)` → `(Entity)-[:BESTEHT_AUS {order:2}]->(Quiz)`
- Für Fallback: `learningPath`-Feld auf Entities

#### 2.5 Frontend: Student Learning View

**Datei**: `myhugoapp/static/js/entity-index.js`

- Entity-Detail-Karte zeigt jetzt "Artikel zu diesem Thema" (wenn articles[] gefüllt)
- Artikel-Chips: blau, verlinken zu /article/ oder externer URL
- Quelle-Anzeige: "Basierend auf: [Quelle]" unter Artikeln
- Lernpfad-Vorschlag: "Weiterführende Inhalte: [Calculator], [Quiz]"
- Neue Section auf Entity-Detail: "Lernmaterial"

#### 2.6 KMK-Bildungsstandards für Schüler

**Datei**: `api/server.js` + `entity-index.js`

- Auf Entity-Detail-Seite (Schüler): "Dieses Thema wird in folgenden Lehrplänen behandelt:"
- Liste der Bundesländer + Klassenstufen (aus curriculumMeta)
- Keine didaktik/lernziel-Details — nur "wird in BY Klasse 9 unterrichtet"
- Dezent, informativ — Schüler sehen Relevanz des Themas für den Unterricht

### Datenmodell (erweitert)

```javascript
// Entity (Student-facing)
{
  name: 'redoxreaktionen',
  category: 'reaktion', // stoff|konzept|reaktion|methode|person|quelle
  articles: [
    { id: 'a1', title: 'Neue Katalysatoren...', url: '/article/...', date: '2025-01-01', source_type: 'pipeline' }
  ],
  sources: [
    { name: 'forschungsbericht-nanochemie', type: 'forschungsartikel', url: '...', reliability: 'high' }
  ],
  learningPath: {
    articles: ['redoxreaktionen-grundlagen', 'oxidation-zahlen'],
    calculators: ['redox-potenzial-rechner'],
    quizzes: ['lueckentexte-redox'],
  },
}
```

### Implementierungs-Reihenfolge

```
Phase 1: Platform-Split
1.1 Bereinigen entity-index.js/entity-index.html (Curriculum entfernen)
1.2 curricula-index.js + curricula-index.html erstellen
1.3 API /api/kg-data ?curricula=true Filter
→ Commit 1

Phase 2: Graph-Erweiterung
2.1 Entity↔Article-Verknüpfung im Fallback
2.2 Quelle-Entities im Fallback
2.3 Article-Detail-Route
2.4 Lernpfad-Struktur
→ Commit 2

Phase 3: Frontend Learning View
2.5 Student Learning View in entity-index.js
2.6 KMK-Bildungsstandards-Hinweis (dezent)
→ Commit 3

Phase 4: Final
QA, ESLint, Hugo Build, Tests
→ Commit 4 + Push
```

### Aufwandsabschätzung

| Phase | Dateien                                  | Änderungen            | Aufwand |
| ----- | ---------------------------------------- | --------------------- | ------- |
| 1.1   | entity-index.js, entity-index.html       | ~150 Zeilen entfernen | 30 min  |
| 1.2   | curricula-index.js, curricula-index.html | ~400 Zeilen neu       | 2 h     |
| 1.3   | api/server.js                            | ~10 Zeilen ändern     | 15 min  |
| 2.1   | api/server.js (fallback)                 | ~20 Zeilen            | 15 min  |
| 2.2   | api/server.js (fallback)                 | ~30 Zeilen            | 30 min  |
| 2.3   | api/server.js (routes)                   | ~60 Zeilen            | 30 min  |
| 2.4   | scripts/curricula/link-content.mjs       | ~40 Zeilen            | 30 min  |
| 2.5   | entity-index.js                          | ~50 Zeilen            | 30 min  |
| 2.6   | api/server.js + entity-index.js          | ~20 Zeilen            | 15 min  |
| QA    | Build, Tests, Lint                       | -                     | 15 min  |

**Gesamt**: ~5-6 h
