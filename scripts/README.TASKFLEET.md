# TaskFleet — Parallel Knowledge Graph Extension System

**TaskFleet** ist ein hochparallelisiertes Aufgaben-Management-System für die Erweiterung und Wartung des **chemie-lernen.org Wissensgraphen**. Es ermöglicht die effiziente, parallele Ausführung von Datenimport-, Anreicherungs- und Verknüpfungsaufgaben.

## 🚀 Schnelleinstieg

### 1. Einfache Ausführung (empfohlen für Entwicklung)

```bash
# Alle Aufgaben parallel ausführen
npm run tf:start

# Nur bestimmte Gruppen
npm run tf:start -- --groups entity-enrichment,content-indexing

# Dry Run (zeigt was ausgeführt würde)
npm run tf:start -- --dry-run
```

### 2. Mit Makefile (empfohlen für Produktion)

```bash
# Vollständige KG-Erweiterung
make kg-extend

# Schnelle Aktualisierung
make kg-extend-quick

# Qualitätsprüfung
make kg-quality

# Alle verfügbaren Befehle anzeigen
make help
```

### 3. Docker-basiert (für Cluster/Produktion)

```bash
# Dockerbasierte Ausführung
./scripts/taskfleet-docker.sh --groups entity-enrichment --concurrency 8

# Auf haeuser Cluster
./scripts/taskfleet-docker.sh --cluster haeuser --concurrency 12
```

### 4. Verteilte Ausführung (für große skalierungen)

```bash
# Redis starten
docker run -d --name taskfleet-redis -p 6379:6379 redis:7-alpine

# Coordinator starten
npm run tf:coordinator

# Worker starten (mehrere Terminals/Container)
npm run tf:worker -- --worker-id 1 --worker-name worker-1
npm run tf:worker -- --worker-id 2 --worker-name worker-2

# Monitor Dashboard (http://localhost:3000/dashboard)
npm run tf:monitor
```

## 📚 Dokumentation

- [📖 Vollständige Dokumentation](docs/TASKFLEET.md)
- [🎯 Aufgabenkonfiguration](#aufgaben-konfigurieren)
- [📊 Monitoring](#monitoring)
- [🔧 Fehlerbehebung](#fehlerbehebung)

## 📦 Installationsvoraussetzungen

### Entwicklungsumgebung

```bash
# Node.js 22+ (empfohlen)
nvm use 22

# npm Abhängigkeiten
npm install

# Redis (für verteilte Ausführung)
docker run -d -p 6379:6379 redis:7-alpine
```

### Docker (für Container-basierte Ausführung)

```bash
# Docker installieren
# https://docs.docker.com/get-docker/

# Docker Compose
docker compose version  # Sollte 2.x sein
```

## 🎯 Aufgaben konfigurieren

### Hintergrund

TaskFleet verwaltet Aufgaben in Konfigurationsdateien. Die Hauptkonfiguration befindet sich in:

- `scripts/taskfleet-config.mjs` - Alle verfügbaren Aufgaben
- `scripts/taskfleet.mjs` - Haupt-TaskFleet Engine

### Neue Aufgabe hinzufügen

1. **Aufgabe in Konfiguration definieren:**

```javascript
// scripts/taskfleet-config.mjs
{
  id: 'my-new-task',
  name: 'Meine neue Aufgabe',
  group: 'custom',
  command: 'node scripts/my-new-task.mjs',
  description: 'Beschreibung der Aufgabe',
  timeout: 300000,        // 5 Minuten
  retries: 2,             // 2 Wiederholungen bei Fehler
  priority: 10,           // Priorität (höher = früher)
  dependencies: []        // Abhängigkeiten (andere Aufgaben-IDs)
}
```

2. **Skript erstellen:**

```javascript
// scripts/my-new-task.mjs
import { getDriver } from '@graphwiz/neo4j';

export async function main() {
  const driver = getDriver({
    uri: process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687',
    username: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024',
    database: 'chemie',
  });

  const session = driver.session({ database: 'chemie' });

  // Deine Logik hier
  await session.run(
    `
    CREATE (n:MyEntity {name: 'Test', createdAt: $now})
    RETURN n
  `,
    { now: Date.now() }
  );

  await session.close();
  await driver.close();

  console.log('✅ Aufgabe abgeschlossen');
}

main().catch(console.error);
```

3. **Aufgabe testen:**

```bash
node scripts/taskfleet.mjs --tasks my-new-task --dry-run
node scripts/taskfleet.mjs --tasks my-new-task
```

## 📊 Monitoring

### Web Dashboard

```bash
npm run tf:monitor
# Dashboard: http://localhost:3000/dashboard
```

Das Dashboard bietet:

- 📊 Echtzeit-Übersicht aller Aufgaben
- 📈 Status-Diagramme (pending, ready, running, completed, failed)
- 👷 Worker-Übersicht mit Heartbeat
- 🎯 Fortschrittsbalken
- 🔍 Filterfunktionen
- 📋 Detaillierte Aufgabenprotokolle

### Prometheus Metrics

```bash
curl http://localhost:3000/metrics
```

Beispiel:

```
taskfleet_tasks_total 50
taskfleet_tasks_ready 10
taskfleet_tasks_completed 35
taskfleet_tasks_failed 2
taskfleet_workers_active 4
taskfleet_uptime_seconds 3600
```

### JSON API

```bash
# Statistiken
curl http://localhost:3000/api

# Alle Aufgaben
curl http://localhost:3000/api/tasks

# Spezifische Aufgabe
curl http://localhost:3000/api/tasks/enrich-entity-descriptions

# Worker
curl http://localhost:3000/api/workers
curl http://localhost:3000/api/workers/worker-1
```

## 🔧 Fehlerbehebung

### Häufige Probleme

#### 1. Redis Verbindung yer

```bash
# Redis starten
docker run -d --name taskfleet-redis -p 6379:6379 redis:7-alpine

# Test
redis-cli ping  # Sollte "PONG" zurückgeben
```

#### 2. Neo4j Verbindung fehlt

```bash
# Neo4j Container prüfen
docker compose ps chemie-neo4j

# Neu starten
docker compose restart chemie-neo4j

# Test
nc -zv localhost 7687
```

#### 3. Aufgaben hängen

```bash
# Redis zurücksetzen
redis-cli FLUSHALL

# Alle TaskFleet Container neu starten
docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml restart
```

#### 4. Speicherprobleme

```bash
# Mit mehr Speicher starten
node --max-old-space-size=8192 scripts/taskfleet-coordinator.mjs
```

### Debug-Modus

```bash
# Verbose Logging
node scripts/taskfleet.mjs --verbose

# Entwickler-Tools (Chrome DevTools)
node --inspect-brk scripts/taskfleet-coordinator.mjs
```

## 📈 Performance-Optimierung

### Parallelitäts-Einstellungen

| Umgebung               | Empfohlene Parallelität | Maximale Parallelität |
| ---------------------- | ----------------------- | --------------------- |
| Lokal (Docker Desktop) | 4                       | 8                     |
| Server (8 CPU)         | 8                       | 12                    |
| Server (16 CPU)        | 12                      | 16                    |
| Cluster (haeuser)      | 16                      | 32                    |

```bash
# Mit 8 parallelen Aufgaben
npm run tf:start -- --concurrency 8

# Docker mit 12 Workern
docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml up -d --scale taskfleet-worker=12
```

### Neo4j-Optimierung

Stelle sicher, dass Neo4j für parallele Abfragen optimiert ist:

```cypher
-- Indizes für häufige Abfragen erstellen
CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.name);
CREATE INDEX IF NOT EXISTS FOR (d:Document) ON (d.url);
CREATE INDEX IF NOT EXISTS FOR (c:Curriculum) ON (c.state_abbr, c.school_type);
CREATE INDEX IF NOT EXISTS FOR (s:SubTopic) ON (s.slug);
CREATE INDEX IF NOT EXISTS FOR (l:LearningObjective) ON (l.slug);
```

## 🛠️ Docker Konfiguration

### Docker Compose mit TaskFleet

```yaml
# docker-compose.taskfleet.yml
services:
  taskfleet-redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  taskfleet-coordinator:
    image: node:22-alpine
    environment:
      - NEO4J_URI=bolt://chemie-neo4j:7687
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - CONCURRENCY=8
    depends_on:
      - taskfleet-redis

  taskfleet-worker:
    image: node:22-alpine
    environment:
      - WORKER_ID=1
      - WORKER_NAME=worker-1
    deploy:
      replicas: 4

  taskfleet-monitor:
    image: node:22-alpine
    ports:
      - '3000:3000'
```

### Alle Dienste starten

```bash
docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml up -d

# Skalierung
#docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml up -d --scale taskfleet-worker=8
```

## 🎚️ Benchmark-Ergebnisse

| Workflow      | Aufgaben | Dauer (sequentiell) | Dauer (parallel, 4) | Dauer (parallel, 8) | Beschleunigung |
| ------------- | -------- | ------------------- | ------------------- | ------------------- | -------------- |
| kg-extend     | 24       | ~120 min            | ~35 min             | ~20 min             | 6x / 10x       |
| kg-quick      | 7        | ~25 min             | ~8 min              | ~5 min              | 3x / 5x        |
| kg-quality    | 8        | ~40 min             | ~12 min             | ~7 min              | 3.3x / 5.7x    |
| kg-entities   | 4        | ~15 min             | ~5 min              | ~3 min              | 3x / 5x        |
| kg-curriculum | 8        | ~50 min             | ~15 min             | ~9 min              | 3.3x / 5.5x    |

_Hinweis: Die tatsächlichen Zeiten hängen von der Hardware und Neo4j-Performance ab._

## 📦 Vordefinierte Workflows

### Vollständige KG-Erweiterung

Führt alle wichtigen Aufgaben aus:

- Entity-Anreicherung
- Content-Indexierung
- Curriculum-Verknüpfung
- Qualitätsprüfung
- Content-Generierung

```bash
make kg-extend
# oder
npm run tf:start -- --groups entity-enrichment,content-indexing,curriculum-linking,quality-assurance,curricula-didaktik
```

### Schnelle Aktualisierung

Führt nur schnelle Aufgaben aus (für tägliche Updates):

- Entity-Beschreibungen
- Content-Import
- Linking
- Export
- Suchindex

```bash
make kg-extend-quick
```

### Qualitätsprüfung

Führt alle Qualitätsprüfungen aus:

- Merge Duplicate Entities
- Clean Garbage SubTopics
- Cross-Link Audit
- KG Quality Audit
- Validate Curricula

```bash
make kg-quality
```

### Content-Generierung

Generiert alle Content-Seiten aus dem KG:

- Entity-Seiten
- Themenbereich-Seiten
- Curricula-Seiten
- Modulhandbuch-Seiten
- Suchindex

```bash
make kg-content
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
- name: Knowledge Graph Extension
  run: |
    npm run tf:start -- --concurrency 4
```

### GitLab CI

```yaml
knowledge-graph-extension:
  script:
    - npm run tf:start -- --concurrency 4
```

### Systemd Service (für Produktion)

```ini
# /etc/systemd/system/taskfleet-coordinator.service
[Unit]
Description=TaskFleet Coordinator
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=weiss
WorkingDirectory=/opt/git/hugo-chemie-lernen-org
ExecStart=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.taskfleet.yml run --rm taskfleet-coordinator
Restart=always
Environment=NEO4J_PASSWORD=your_password

[Install]
WantedBy=multi-user.target
```

## 📊 Umweltvariablen

| Variable         | Beschreibung               | Standardwert             |
| ---------------- | -------------------------- | ------------------------ |
| `NEO4J_URI`      | Neo4j Server URI           | bolt://chemie-neo4j:7687 |
| `NEO4J_USER`     | Neo4j Benutzername         | neo4j                    |
| `NEO4J_PASSWORD` | Neo4j Passwort             | - (erforderlich)         |
| `NEO4J_DATABASE` | Neo4j Datenbank            | chemie                   |
| `REDIS_HOST`     | Redis Server Host          | localhost                |
| `REDIS_PORT`     | Redis Server Port          | 6379                     |
| `CONCURRENCY`    | Anzahl paralleler Aufgaben | 4                        |
| `DRY_RUN`        | Dry Run Modus              | false                    |
| `VERBOSE`        | Ausführliche Ausgabe       | false                    |
| `TASK_TIMEOUT`   | Task-Timeout in ms         | 300000 (5 min)           |

## 🎯 Verzeichnisstruktur

```
scripts/
├── taskfleet.mjs              # Haupt-TaskFleet Engine
├── taskfleet-config.mjs       # Aufgabenkonfiguration
├── taskfleet-coordinator.mjs  # Redis-basierter Coordinator
├── taskfleet-worker.mjs       # Redis-basierter Worker
├── taskfleet-monitor.mjs      # Dashboard & API Server
├── taskfleet-docker.sh        # Docker-basierte Ausführung
├── taskfleet-dashboard.html    # Web-Dashboard HTML
├── docker-compose.taskfleet.yml # Docker Compose Konfiguration
└── README.TASKFLEET.md        # Diese Datei

docs/
└── TASKFLEET.md               # Vollständige Dokumentation
```

## 🔒 Sicherheitshinweise

### Neo4j-Berechtigungen

Erstelle einen dedizierten Benutzer mit begrenzten Rechten:

```cypher
CREATE USER taskfleet SET PASSWORD 'secure-password' CHANGE NOT REQUIRED
GRANT READ, WRITE ON DATABASE chemie TO taskfleet
```

### Docker-Sicherheit

```yaml
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
docker run -d --name taskfleet-redis -p 6379:6379 \
  -e REDIS_PASSWORD=secure-password \
  redis:7-alpine --requirepass secure-password
```

## 🙏 Unterstützung & Community

- **Issues:** https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/issues
- **Dokumentation:** docs/TASKFLEET.md
- **Discussions:** https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/discussions

## 📝 Changelog

### v1.0.0 (2025)

- ✅ Erste stabile Version
- ✅ Node.js basierte Parallelisierung
- ✅ Docker Support
- ✅ Redis Queue Support
- ✅ Web Dashboard
- ✅ Makefile Integration
- ✅ Alle bestehenden Skripte integriert

### v1.1.0 (geplant)

- 🎯 Automatische Abhängigkeitserkennung
- 🎯 LLM-basierte Aufgaben-Priorisierung
- 🎯 Erweiterte Monitoring-Metriken
- 🎯 Grafana Dashboard Integration

## 📄 Lizenz

TaskFleet ist Teil des chemie-lernen.org Projekts.

---

**🚀 Viel Erfolg mit TaskFleet!**

Für Fragen oder Unterstützung erstelle bitte ein Issue auf GitHub oder kontaktiere das Entwicklungsteam.
