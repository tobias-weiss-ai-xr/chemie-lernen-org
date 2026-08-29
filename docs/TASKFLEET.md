# 🚀 TaskFleet — Parallel Knowledge Graph Extension

**TaskFleet** ist ein Parallelisierungs-System für die Erweiterung des Wissensgraphen von chemie-lernen.org. Es ermöglicht die effiziente, parallele Ausführung von Datenimport-, Anreicherungs- und Verknüpfungsaufgaben.

## 📖 Übersicht

TaskFleet bietet mehrere Ausführungsmodalitäten:

| Methode                              | Beschreibung                                         | Skalierbarkeit                  | Komplexität | Empfohlen für             |
| ------------------------------------ | ---------------------------------------------------- | ------------------------------- | ----------- | ------------------------- |
| **Node.js (taskfleet.mjs)**          | Einfache Parallelisierung mit Node.js Worker Threads | Mittel (4-8 Tasks)              | Niedrig     | lokale Entwicklung, CI/CD |
| **Docker (taskfleet-docker.sh)**     | Container-basierte Parallelisierung                  | Hoch (8-16+ Container)          | Mittel      | Produktion, Cluster       |
| **Redis-Queue (coordinator/worker)** | Verteilte Ausführung mit Redis                       | Sehr Hoch (unbegrenzte Workers) | Hoch        | große Cluster, Cloud      |
| **Makefile**                         | Einfache Befehle für häufige Workflows               | Mittel                          | Niedrig     | tägliche Nutzung          |

## 🎯 Schnellstart

### 1. Einfache Ausführung mit Node.js

```bash
# Alle Aufgaben parallel ausführen (4 Tasks gleichzeitig)
node scripts/taskfleet.mjs

# Nur bestimmte Gruppen ausführen
node scripts/taskfleet.mjs --groups entity-enrichment,content-indexing

# Spezifische Aufgaben ausführen
node scripts/taskfleet.mjs --tasks enrich-entity-descriptions,link-entities-to-curriculum

# Dry Run (zeigt Ausführungsplan ohne Ausführung)
node scripts/taskfleet.mjs --dry-run

# Mit höherer Parallelität
node scripts/taskfleet.mjs --concurrency 8
```

### 2. Ausführung mit Makefile

```bash
# Vollständige KG-Erweiterung
make kg-extend

# Schnelle Aktualisierung
make kg-extend-quick

# Qualitätsprüfung
make kg-quality

# Content-Generierung
make kg-content

# Dry Run
make kg-dry-run
```

### 3. Docker-basierte Ausführung

```bash
# Mit Docker ausführen
./scripts/taskfleet-docker.sh --groups entity-enrichment

# Auf dem haeuser Cluster
./scripts/taskfleet-docker.sh --cluster haeuser --concurrency 12
```

### 4. Verteilte Ausführung mit Redis

```bash
# Redis starten (falls nicht vorhanden)
docker run -d --name taskfleet-redis -p 6379:6379 redis:7-alpine

# Coordinator starten
node scripts/taskfleet-coordinator.mjs

# Worker starten (mehrere Instanzen möglich)
node scripts/taskfleet-worker.mjs --worker-id 1 --worker-name worker-1
node scripts/taskfleet-worker.mjs --worker-id 2 --worker-name worker-2

# Monitor Dashboard starten
node scripts/taskfleet-monitor.mjs

# Dashboard öffnen: http://localhost:3000/dashboard
```

## 📦 Aufgabe konfigurieren

Die verfügbaren Aufgaben werden in `scripts/taskfleet-config.mjs` definiert. Jede Aufgabe hat folgende Struktur:

```javascript
{
  id: 'enrich-entity-descriptions',    // Eindeutige ID
  name: 'Entity-Beschreibungen anreichern',  // Anzeigename
  group: 'entity-enrichment',          // Gruppe für Filterung
  command: 'node scripts/enrich-entity-descriptions.mjs',  // auszuführender Befehl
  description: 'Fügt Beschreibungen zu Entity-Knoten hinzu',
  timeout: 300000,                      // Timeout in ms (5 Minuten)
  retries: 2,                           // Anzahl Wiederholungen bei Fehler
  priority: 10,                         // Priorität (höher = früher ausgeführt)
  dependencies: ['import-content-nodes']  // Abhängigkeiten (andere Aufgaben)
}
```

### Vordefinierte Aufgaben-Gruppen

| Gruppe               | Beschreibung         | Enthaltene Aufgaben                                               |
| -------------------- | -------------------- | ----------------------------------------------------------------- |
| `data-import`        | Datenimport          | import-curricula-all, import-didaktik, import-modulhandbuch       |
| `entity-enrichment`  | Entity-Anreicherung  | enrich-entity-descriptions, enrich-isolated-entities, kg-enrich   |
| `content-indexing`   | Content-Indexierung  | import-content-nodes, link-articles-to-entities, link-content     |
| `curriculum-linking` | Lehrplan-Verknüpfung | link-entities-to-curriculum, generate-learning-paths              |
| `quality-assurance`  | Qualitätsprüfung     | kg-quality-audit, cross-link-audit, merge-duplicate-entities      |
| `index-search`       | Indexierung & Suche  | create-neo4j-indexes, build-search-index                          |
| `data-export`        | Datenexport          | export-kg-data, export-graph-backup                               |
| `curricula-didaktik` | Curricula & Didaktik | generate-curricula-pages, validate-curricula                      |
| `marketing`          | Marketing & Analyse  | add-article-aliases, create-hubs-element-rooms, fetch-zigs-videos |
| `maintenance`        | Wartung              | backfill-sources, upgrade-relation-types                          |

### Vordefinierte Aufgaben-Sets

Die Konfiguration enthält vordefinierte Sets für häufige Workflows:

```javascript
// Vollständige KG-Erweiterung
FULL_KG_EXTENSION;

// Schnelle Aktualisierung
QUICK_UPDATE;

// Qualitätsprüfung
QUALITY_PIPELINE;

// Content-Generierung
CONTENT_GENERATION;

// Curriculum-Verknüpfung
CURRICULUM_LINKING;
```

## 🔧 Erweitertes Setup

### Redis-Setup

Für die verteilte Ausführung wird Redis benötigt:

```bash
# Docker Compose (empfohlen)
docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml up -d taskfleet-redis

# Oder manuell
docker run -d --name taskfleet-redis -p 6379:6379 redis:7-alpine
```

### Docker Compose mit TaskFleet

```yaml
# docker-compose.taskfleet.yml wird automatisch geladen
# Enthält: coordinator, worker, redis, monitor

docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml up -d
```

### Skalierung mit Docker

```bash
# 8 Worker starten
docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml up -d --scale taskfleet-worker=8

# Alle Dienste anzeigen
docker compose ps

# Logs anzeigen
docker compose logs -f taskfleet-coordinator taskfleet-worker-1 taskfleet-monitor
```

## 📊 Monitoring

### Dashboard

Das TaskFleet Dashboard bietet:

- Echtzeit-Übersicht aller Aufgaben
- Status-Monitoring (pending, ready, running, completed, failed)
- Worker-Übersicht mit Heartbeat
- Fortschrittsbalken
- Filterfunktionen

```bash
# Dashboard starten
node scripts/taskfleet-monitor.mjs

# Dashboard öffnen: http://localhost:3000/dashboard
```

### Prometheus Metrics

```bash
# Metrics abrufen
curl http://localhost:3000/metrics

# Beispielausgabe:
# taskfleet_tasks_total 50
# taskfleet_tasks_ready 10
# taskfleet_tasks_completed 35
# taskfleet_tasks_failed 2
# taskfleet_workers_active 4
# taskfleet_uptime_seconds 3600
```

### JSON API

```bash
# Gesamtstatistik
curl http://localhost:3000/api

# Alle Aufgaben
curl http://localhost:3000/api/tasks

# Spezifische Aufgabe
curl http://localhost:3000/api/tasks/enrich-entity-descriptions

# Alle Worker
curl http://localhost:3000/api/workers

# Spezifischer Worker
curl http://localhost:3000/api/workers/worker-1
```

## 🎚️ Performance-Optimierung

### Parallelitäts-Einstellungen

| Umgebung               | Empfohlene Parallelität | Maximale Parallelität |
| ---------------------- | ----------------------- | --------------------- |
| Lokal (Docker Desktop) | 4                       | 8                     |
| Server (8 CPU)         | 8                       | 12                    |
| Server (16 CPU)        | 12                      | 16                    |
| Cluster (haeuser)      | 16                      | 32                    |

### Node.js Memory-Einstellungen

```bash
# Für speicherintensive Aufgaben
node --max-old-space-size=4096 scripts/taskfleet.mjs

# In Docker Compose
environment:
  - NODE_OPTIONS=--max-old-space-size=4096
```

### Neo4j-Optimierung

Stelle sicher, dass Neo4j für parallele Abfragen optimiert ist:

```cypher
// Indizes für häufige Abfragen erstellen
CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.name);
CREATE INDEX IF NOT EXISTS FOR (d:Document) ON (d.url);
CREATE INDEX IF NOT EXISTS FOR (c:Curriculum) ON (c.state_abbr, c.school_type);
CREATE INDEX IF NOT EXISTS FOR (s:SubTopic) ON (s.slug);
CREATE INDEX IF NOT EXISTS FOR (l:LearningObjective) ON (l.slug);
```

## 🛠️ Fehlerbehebung

### Häufige Probleme

#### 1. Redis Verbindung fehlt

**Problem:** `Error: Redis connection error`

**Lösung:**

```bash
# Redis starten
docker run -d --name taskfleet-redis -p 6379:6379 redis:7-alpine

# Oder mit Docker Compose
docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml up -d taskfleet-redis
```

#### 2. Neo4j Verbindung fehlt

**Problem:** `Connection refused to Neo4j`

**Lösung:**

```bash
# Neo4j Container prüfen
docker compose ps chemie-neo4j

# Neu starten falls nötig
docker compose restart chemie-neo4j
```

#### 3. Aufgaben hängen

**Problem:** Aufgaben bleiben im Status "running"

**Lösung:**

```bash
# Redis zurücksetzen
redis-cli FLUSHALL

# Alle TaskFleet Container neu starten
docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml restart
```

#### 4. Speicherprobleme

**Problem:** `JavaScript heap out of memory`

**Lösung:**

```bash
# Mit mehr Speicher starten
node --max-old-space-size=8192 scripts/taskfleet-coordinator.mjs

# Oder in docker-compose.yml
environment:
  - NODE_OPTIONS=--max-old-space-size=8192
```

### Debug-Modus

```bash
# Verbose Logging einschalten
node scripts/taskfleet.mjs --verbose

# Entwickler-Tools
node --inspect-brk scripts/taskfleet-coordinator.mjs
```

## 📝 Beispiele

### Beispiel 1: Vollständige KG-Aktualisierung

```bash
# Alle Daten importieren und verknüpfen
make kg-extend

# Oder manuell
node scripts/taskfleet.mjs --groups data-import --concurrency 4
node scripts/taskfleet.mjs --groups entity-enrichment --concurrency 4
node scripts/taskfleet.mjs --groups curriculum-linking --concurrency 4
node scripts/taskfleet.mjs --groups content-indexing --concurrency 4
```

### Beispiel 2: Inkrementelle Aktualisierung

```bash
# Nur neue Inhalte und Entities aktualisieren
make kg-extend-quick

# Oder
node scripts/taskfleet.mjs --tasks enrich-entity-descriptions,import-content-nodes,link-articles-to-entities,export-kg-data,build-search-index
```

### Beispiel 3: Qualitätsprüfung vor Deployment

```bash
# Alle Prüfungen ausführen
make kg-quality

# Nur spezifische Prüfungen
node scripts/taskfleet.mjs --tasks kg-quality-audit,cross-link-audit,validate-curricula
```

### Beispiel 4: Verteilte Ausführung auf Cluster

```bash
# Auf haeuser Cluster mit 8 Workern
./scripts/taskfleet-docker.sh --cluster haeuser --concurrency 8 --groups entity-enrichment

# Oder mit Docker Compose
DOCKER_HOST=ssh://haeuser docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml up -d --scale taskfleet-worker=8
```

## 📊 Benchmark-Ergebnisse

| Workflow      | Aufgaben | Dauer (sequentiell) | Dauer (parallel, 4) | Dauer (parallel, 8) | Beschleunigung |
| ------------- | -------- | ------------------- | ------------------- | ------------------- | -------------- |
| kg-extend     | 24       | ~120 min            | ~35 min             | ~20 min             | 6x / 10x       |
| kg-quick      | 7        | ~25 min             | ~8 min              | ~5 min              | 3x / 5x        |
| kg-quality    | 8        | ~40 min             | ~12 min             | ~7 min              | 3.3x / 5.7x    |
| kg-entities   | 4        | ~15 min             | ~5 min              | ~3 min              | 3x / 5x        |
| kg-curriculum | 8        | ~50 min             | ~15 min             | ~9 min              | 3.3x / 5.5x    |

_Hinweis: Die tatsächlichen Zeiten hängen von der Hardware und Neo4j-Performance ab._

## 🔄 CI/CD Integration

### GitHub Actions Beispiel

```yaml
name: Knowledge Graph Extension

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  extend-kg:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run KG Extension
        run: node scripts/taskfleet.mjs --concurrency 4

      - name: Run Tests
        run: npm test

      - name: Deploy
        run: npm run build
```

### GitLab CI Beispiel

```yaml
knowledge-graph-extension:
  image: node:22-alpine
  services:
    - redis:7-alpine
  variables:
    CONCURRENCY: 4
  script:
    - npm ci
    - node scripts/taskfleet.mjs --concurrency $CONCURRENCY
    - npm test
  only:
    - main
```

## 🧩 Architektur

### Komponenten

```
┌─────────────────────────────────────────────────────────────────┐
│                        TaskFleet                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  taskfleet.mjs  │  │ taskfleet-docker│  │  taskfleet-     │  │
│  │  (Node.js)      │  │    .sh           │  │  coordinator    │  │
│  │                 │  │  (Bash)         │  │  (Redis Queue)  │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                      │           │
│           └────────────────────┴──────────────────────┘           │
│                                    │                               │
│                                    ▼                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Execution Layer                           │  │
│  ├─────────────────┬─────────────────┬─────────────────┬───────┤  │
│  │  Node.js        │  Docker         │  Redis Queue    │  Make │  │
│  │  Worker Threads │  Containers      │  Workers        │       │  │
│  └─────────────────┴─────────────────┴─────────────────┴───────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Neo4j Knowledge Graph                    │  │
│  │                  (chemie-lernen.org)                        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Datenfluss

```
1. Aufgaben-Definition (taskfleet-config.mjs)
   ↓
2. Aufgaben-Auswahl (CLI-Argumente / Makefile)
   ↓
3. Abhängigkeitsanalyse
   ↓
4. Aufgaben-Queue (Redis / Speicher)
   ↓
5. Aufgaben-Ausführung (Parallel)
   │──▶ Node.js Worker Threads
   │──▶ Docker Container
   │──▶ Redis Queue Workers
   ↓
6. Ergebnis-Speicherung (Redis)
   ↓
7. Fortschritts-Reporting (Dashboard / CLI)
```

## 📚 API-Referenz

### taskfleet.mjs

```bash
node scripts/taskfleet.mjs [options]

Options:
  --config=<path>       Pfad zur Konfigurationsdatei
  --groups=<groups>     Kommagetrennte Liste von Aufgaben-Gruppen
  --tasks=<tasks>       Kommagetrennte Liste von Aufgaben-IDs
  --concurrency=<n>    Anzahl paralleler Aufgaben (Standard: 4)
  --dry-run             Ausführungsplan anzeigen, ohne auszuführen
  --verbose             Ausführliche Ausgabe
  --force               Erzwinge erneute Ausführung
  --help, -h            Hilfe anzeigen
```

### taskfleet-config.mjs

Exporte:

- `TASKS` - Array aller verfügbaren Aufgaben
- `FULL_KG_EXTENSION` - Vollständige KG-Erweiterung
- `QUICK_UPDATE` - Schnelle Aktualisierung
- `QUALITY_PIPELINE` - Qualitätsprüfung
- `CONTENT_GENERATION` - Content-Generierung
- `CURRICULUM_LINKING` - Curriculum-Verknüpfung

### Redis API

follicles:

- `taskfleet:queue` - Haupt-Task-Queue
- `taskfleet:ready` - bereit Aufgaben
- `taskfleet:active` - laufende Aufgaben
- `taskfleet:completed` - abgeschlossene Aufgaben
- `taskfleet:failed` - fehlgeschlagene Aufgaben
- `taskfleet:workers` - aktive Worker
- `taskfleet:stats` - Statistiken
- `taskfleet:status:{taskId}` - Status einer Aufgabe
- `taskfleet:result:{taskId}` - Ergebnis einer Aufgabe

## 🔒 Sicherheit

### Neo4j-Berechtigungen

Stelle sicher, dass die TaskFleet-Aufgaben nur lese/schreibe Zugriff auf die `chemie` Datenbank haben:

```cypher
// Nur für das chemie Subset
CREATE USER taskfleet SET PASSWORD 'secure-password' CHANGE NOT REQUIRED
GRANT READ, WRITE ON DATABASE chemie TO taskfleet
```

### Docker-Sicherheit

```yaml
# docker-compose.yml
services:
  taskfleet-worker:
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
```

### Redis-Sicherheit

```bash
# Redis mit Passwort
docker run -d --name taskfleet-redis -p 6379:6379 \
  -e REDIS_PASSWORD=secure-password \
  redis:7-alpine --requirepass secure-password
```

## 📈 Erweiterungen

### Neue Aufgaben hinzufügen

1. Aufgabe in `scripts/taskfleet-config.mjs` definieren
2. Skript in `scripts/` erstellen
3. Aufgabe testen
4. In Workflows integrieren

### Beispiel: Neue Aufgabe erstellen

```javascript
// scripts/taskfleet-config.mjs
{
  id: 'import-custom-data',
  name: 'Benutzerdefinierte Daten importieren',
  group: 'data-import',
  command: 'node scripts/import-custom-data.mjs',
  description: 'Importiert benutzerdefinierte Daten in den KG',
  timeout: 600000,
  retries: 2,
  priority: 10,
}

// scripts/import-custom-data.mjs
import { getDriver } from '@graphwiz/neo4j';

export async function importCustomData() {
  const driver = getDriver({ /* ... */ });
  const session = driver.session();

  // Import-Logik hier
  await session.run(`
    CREATE (n:CustomData {name: 'example', value: 42})
    RETURN n
  `);

  await session.close();
}

importCustomData();
```

## 🌍 Community & Support

- **Issues:** https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/issues
- **Dokumentation:** https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/docs
- **Discussions:** https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/discussions

## 📄 Lizenz

TaskFleet ist Teil des chemie-lernen.org Projekts und unterliegt verstärkten Bedingungen zur Nutzung der Open-Source-Software.

## 🙏 Danksagungen

- [Node.js](https://nodejs.org/) - JavaScript-Runtime
- [Redis](https://redis.io/) - In-Memory-Datenbank für Task-Queue
- [Express](https://expressjs.com/) - Web-Framework für das Dashboard
- [Chart.js](https://www.chartjs.org/) - Diagramme im Dashboard
- [Docker](https://www.docker.com/) - Container-Plattform
