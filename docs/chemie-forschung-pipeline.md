# Chemie-Forschung-Pipeline — Architektur-Dokumentation

## A) Überblick

**Chemie-Forschung** ist die KG-basierte Forschungsartikel-Rubrik auf
chemie-lernen.org. Jeder Artikel entsteht ausschließlich aus echten
Wissensgraph-Entitäten (Labels `Entity` / `Tag` in der Neo4j-Datenbank
`chemie`). Bei Ausfall des Knowledge Graphs wird **kein** Artikel
erzeugt — es gibt keinen LLM-Fallback mit generierten Pseudotopics.

Die Pipeline umfasst drei klar getrennte Verantwortlichkeiten:

| Rolle | Repo | Aufgabe |
|---|---|---|
| **Generation** | `chemierecherche-runner` | KG-Abfrage, LLM-Artikel, Markdown-Output |
| **Orchestrierung** | `next-graphwiz-ai` (Caller-Workflow) | Zeitplan, Runner-Auswahl, Secret-Injektion |
| **Display / Deploy** | `hugo-chemie-lernen-org` | Hugo-Rendering, Nginx, Traefik |

## B) End-to-End-Flow

```
schedule (Di 06:30 UTC) oder workflow_dispatch
│
▼
next-graphwiz-ai/.github/workflows/chemie-forschung.yml   ← Caller
│  secrets: NEO4J_PASSWORD, LLM_API_KEY, CHEMIE_HUGO_PAT
│  passes: neo4j_host=localhost, llm_base_url=http://localhost:4000/v1
│
▼
chemierecherche-runner/.github/workflows/generate.yml       ← Reusable Workflow
│  runs-on: [self-hosted, kg-host]
│  checkout target repo (chemie-lernen-org) + generator repo
│
▼
npm run generate -- --out <target>/<path> --index N
│  (schleift N×, ein Artikel pro Durchlauf)
│
├─► Neo4j KG (localhost:7687, DB „chemie" → Entity/Tag)
├─► LLM (localhost:4000/v1, Modell deepseek-v4-flash/ai1)
│
▼
Artikel als Markdown nach
  myhugoapp/content/chemie-forschung/<date>-<slug>.md
│
▼
git commit & push → chemie-lernen-org/master
│  (via CHEMIE_HUGO_PAT)
│
▼
CI-Deploy → Docker-Image
  registry.contextual-intelligence.org/chemie-lernen-org:latest
  → Nginx → Traefik (Host chemie-lernen.org / www.chemie-lernen.org)
```

### Zeitplan

- **Cron**: `30 6 * * 2` — Dienstag, 06:30 UTC (nach dem allgemeinen
  graphwiz.ai-Batch am Montag)
- **Manuell**: `workflow_dispatch` mit optionalen Parametern
  `article_count` (default: 3) und `topic` (fester Topic-String)

## C) kg-host-Runner

Der GitHub Actions Self-Hosted Runner ist **auf diesem Host registriert**,
denn der Neo4j Knowledge Graph ist nur über `localhost:7687` erreichbar
und von GitHub-Cloud-Runnern nicht erreichbar.

### Systemd-Service

```
actions.runner.tobias-weiss-ai-xr-next-graphwiz-ai.kg-host-runner-1.service
```

- **ExecStart**: `/home/weiss/actions-runner-chemie/runsvc.sh`
- **User**: `weiss`
- **WorkingDirectory**: `/home/weiss/actions-runner-chemie`
- **KillSignal**: `SIGTERM`, **TimeoutStopSec**: `5min`

### Konfiguration

| Variable | Wert (aus `chemie-forschung.yml`) | Herkunft |
|---|---|---|
| `NEO4J_HOST` | `localhost` | Caller-Input (hardcodiert) |
| `NEO4J_USER` | `neo4j` | Caller-Input (hardcodiert) |
| `NEO4J_PASSWORD` | *(Secret)* | `secrets.NEO4J_PASSWORD` im Repo `next-graphwiz-ai` |
| `NEO4J_DATABASE` | `chemie` | Caller-Input (hardcodiert) |
| `LLM_BASE_URL` | `http://localhost:4000/v1` | Caller-Input (hardcodiert) |
| `LLM_MODEL` | `deepseek-v4-flash/ai1` | Caller-Input (hardcodiert) |
| `LLM_API_KEY` | *(Secret)* | `secrets.LLM_API_KEY` im Repo `next-graphwiz-ai` |
| `CHEMIE_HUGO_PAT` | *(Secret)* | `secrets.CHEMIE_HUGO_PAT` im Repo `next-graphwiz-ai` |

Der Runner nutzt **keine** Default-Werte aus dem reusable Workflow für
Host/URL — der Caller überschreibt `neo4j_host` mit `localhost` (statt
`192.168.42.10`) und `llm_base_url` mit `http://localhost:4000/v1`
(statt `http://chemie-lernen.org:4000/v1`), da der Runner auf demselben
Host läuft.

## D) Generator-Verhalten

### Topic-Auswahl (`getHotChemistryTopics`)

Die Funktion in `src/lib/neo4j-kg.ts` fragt die Neo4j-Datenbank `chemie` ab:

```cypher
MATCH (n:Entity)
WHERE n:Entity OR n:Tag
OPTIONAL MATCH (n)-[r]-()
WITH n, count(r) AS degree
WHERE degree > 0
OPTIONAL MATCH (d:Document)-[:MENTIONS]->(n)
WITH n, degree, count(d) AS documentCount
RETURN n.name, head(labels(n)), degree, documentCount
ORDER BY degree DESC
LIMIT toInteger($limit)
```

- Nur Nodes mit Label `Entity` oder `Tag` werden betrachtet.
- Sortiert nach **Vernetzungsgrad** (absteigend) — die am stärksten
  verknüpften Entitäten zuerst.
- Eine **Noise-Liste** filtert irrelevante Begriffe heraus
  (z. B. `github`, `pilotdeck`, `alexa`…).
- **Kein Fallback**: Wenn die KG-Abfrage fehlschlägt oder leer ist,
  wird das Skript beendet, ohne einen Artikel zu erzeugen.

### Wichtiger Bug-Fix: `LIMIT toInteger($limit)`

Ursprünglich verwendete die Query `LIMIT $limit`. Da JavaScript-Zahlen
als **Float** an Neo4j übertragen werden (z. B. `25.0` statt `25`),
scheiterte die Query mit einem Typfehler — `LIMIT` erwartet in Neo4j
einen Integer. Die Lösung war die explizite Umwandlung:

```cypher
LIMIT toInteger($limit)   -- statt: LIMIT $limit
```

Dasselbe Muster wurde in `getRelatedEntities` angewendet.

### Artikel-Erstellung (`generateArticle`)

1. Das ausgewählte Topic wird an den LLM gesendet (`deepseek-v4-flash/ai1`)
   mit einem System-Prompt für deutsche Chemie-Fachartikel (800–1500 Wörter,
   Zielgruppe: Oberstufe/Lehrkräfte/Studierende).
2. Der LLM-Output wird geparst: Titel aus der ersten `#`-Überschrift,
   Tags aus Keyword-Erkennung im Text plus `topic.label`.
3. Der Artikel wird als Markdown-Datei gespeichert.

### Fehlertoleranz im Workflow

Im reusable Workflow (`generate.yml`) werden Artikel in einer Schleife
generiert. Wenn ein einzelner Artikel fehlschlägt (`npm run generate`
endet mit Fehlercode), wird mit `continue` zum nächsten Artikel
gegangen — die gesamte Pipeline bricht also nicht bei einem
Einzel-Fehler ab.

## E) Frontmatter-Contract

Der Generator (`article-generator.ts`) erzeugt Hugo-kompatibles
Frontmatter. Die Hugo-Templates konsumieren diese Felder:

```yaml
---
title: 'Redoxreaktionen: Elektronenübertragung verstehen'
description: 'Redoxreaktionen gehören zu den grundlegendsten...'
tags:
 - 'chemie'
 - 'redox'
 - 'oxidation'
date: '2026-08-18'
last_reviewed: 2026-08-18
draft: false
---

## Einleitung
...
```

| Feld | Erzeugung | Konsum |
|---|---|---|
| `title` | Aus LLM-Output (erste `#`-Überschrift) oder Fallback | `layouts/section/chemie-forschung.html` (`.Title`), `layouts/index.html` (`.Title`) |
| `description` | Template-String mit Topic-Name | Karten-Vorschau |
| `date` | `YYYY-MM-DD` (Generierungsdatum) | Sortierung (`.ByDate.Reverse`), Anzeige |
| `last_reviewed` | Gleiches Datum wie `date` | Metadaten |
| `tags[]` | `topic.label` + auto-detected Keywords (max 7) | — |
| `draft` | Immer `false` | Veröffentlichungs-Steuerung |

### Konsumenten

- **Section-Liste** (`layouts/section/chemie-forschung.html`): Zeigt alle
  Artikel der Sektion in einer Karten-Grid-Ansicht (3 Spalten),
  sortiert nach Datum (neueste zuerst). Ohne Bild wird ein
  grüner Gradient-Platzhalter mit 🧪 angezeigt.

- **Startseite** (`layouts/index.html`, Block „Chemie-Forschung"): Zeigt
  die **4 neuesten** Artikel in derselben Karten-Optik, mit einem
  „Alle Chemie-Forschung anzeigen →"-Link zur Section-Seite.

- **Dateinamen-Schema**: `<date>-<slug>.md` (z. B.
  `2026-08-18-redoxreaktionen-elektronenuebertragung.md`).

## F) Klare Trennung der Verantwortlichkeiten

```
┌─────────────────────────┐    ┌──────────────────────────┐    ┌─────────────────────────┐
│   chemierecherche-runner │    │   next-graphwiz-ai       │    │  hugo-chemie-lernen-org  │
│   (Generation)          │    │   (Orchestrierung)       │    │  (Display / Deploy)      │
├─────────────────────────┤    ├──────────────────────────┤    ├─────────────────────────┤
│ • neo4j-kg.ts           │◄──│ • chemie-forschung.yml   │───►│ • content/chemie-        │
│ • article-generator.ts  │    │   (Caller-Workflow)      │    │   forschung/*.md         │
│ • generate-chemistry-   │    │ • schedule + dispatch    │    │ • layouts/section/       │
│   article.ts            │    │ • Secret-Weitergabe      │    │   chemie-forschung.html  │
│ • generate.yml          │    │ • Host/URL-Überschreibung│    │ • layouts/index.html    │
│   (reusable workflow)   │    │                          │    │   (Startseiten-Block)    │
└─────────────────────────┘    └──────────────────────────┘    └─────────────────────────┘
       KG + LLM                     Steuert WANN & WIE              Hugo → Nginx → Traefik
```

- **Generation** (`chemierecherche-runner`): Enthält die gesamte
  Fachlogik — KG-Abfrage, Topic-Auswahl, LLM-Aufruf, Markdown-Erzeugung.
  Kennt weder den Zeitplan noch die Deployment-Infrastruktur.

- **Orchestrierung** (`next-graphwiz-ai`): Der Caller-Workflow
  definiert **wann** (Cron / manuell), **wo** (kg-host-Runner) und
  **mit welchen Credentials** die Pipeline läuft. Er überschreibt
  Host- und URL-Defaults des reusable Workflows mit `localhost`.

- **Display / Deploy** (`hugo-chemie-lernen-org`): Konsumiert die
  generierten Markdown-Dateien. Hugo rendert die Seiten, der
  Docker-Container (Traefik + Nginx) serviert sie unter
  `chemie-lernen.org` und `www.chemie-lernen.org`.
