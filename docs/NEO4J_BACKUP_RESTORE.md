# Neo4j Backup & Restore — Runbook

Automatische Sicherung der Neo4j-Wissensgraphen für chemie-lernen.org.

## Was gesichert wird

Das Skript `scripts/neo4j-backup.sh` sichert **beide** Container mit der
Datenbank `chemie`:

| Container     | Rolle                                  |
| ------------- | -------------------------------------- |
| `chemie-neo4j`| Legacy-Graph                           |
| `chemie-kg`    | Live API-Wissensgraph (von der API genutzt) |

Pro Container wird ein `neo4j-admin database dump` erzeugt, geprüft (nicht leer,
≥1 KB) und unter `backups/neo4j/` abgelegt. Es gilt eine Rotation von
**7 täglichen Dumps** pro Container; zusätzlich wird ein
`*-latest.dump`-Symlink gepflegt.

> Hinweis: Der Dump stoppt Neo4j im Container kurzzeitig und startet den
> Container danach neu. Für `chemie-kg` bedeutet das wenige Sekunden
> API-Downtime — der Timer läuft nachts um **03:00** (mit 15 min Zufalls-Jitter).

## Automatisierung aktivieren (einmalig)

```bash
sudo bash scripts/neo4j-backup-enable.sh
```

Das kopiert `scripts/neo4j-backup.service` + `scripts/neo4j-backup.timer` nach
`/etc/systemd/system`, führt `systemctl daemon-reload` aus und aktiviert den
Timer (`systemctl enable --now neo4j-backup.timer`). Das Skript ist idempotent
(sicheres Wiederholen).

Status prüfen:

```bash
systemctl status neo4j-backup.timer
systemctl list-timers --all | grep neo4j
```

## Manuelles Backup

```bash
sudo NEO4J_PASSWORD='<pw>' bash scripts/neo4j-backup.sh
```

Logs landen in `backups/logs/neo4j-backup_*.log`.

## Wiederherstellen (Restore)

`scripts/restore-neo4j.sh` spielt einen `.dump` ein. **Trockenlauf** ohne
`--confirm` zeigt nur, was passieren würde:

```bash
sudo bash scripts/restore-neo4j.sh \
  --container chemie-kg --database chemie \
  --dump backups/neo4j/chemie-kg-chemie-20260816_030000.dump
# echoes the plan, does NOT restore

sudo bash scripts/restore-neo4j.sh \
  --container chemie-kg --database chemie \
  --dump backups/neo4j/chemie-kg-chemie-20260816_030000.dump --confirm
```

Container-Auswahl: `chemie-neo4j` oder `chemie-kg`.

## Aufbewahrung (Retention)

- 7 tägliche Dumps pro Container (automatisch rotiert durch `neo4j-backup.sh`).
- Logs in `backups/logs/`.

## Offsite-Kopie (empfohlen)

Die Dumps liegen lokal auf dem Server. Für echten Schutz regelmäßig
off-host kopieren, z. B.:

```bash
# Beispiel: neuesten Dump beider Container wegkopieren
rsync -a backups/neo4j/chemie-neo4j-chemie-latest.dump  backup-host:/srv/neo4j-backups/
rsync -a backups/neo4j/chemie-kg-chemie-latest.dump     backup-host:/srv/neo4j-backups/
```

Oder an Object Storage (S3/MinIO) anhängen — unabhängig vom Server-Lebenszyklus.

## Datei-Überblick

| Pfad                                | Zweck                                  |
| ----------------------------------- | -------------------------------------- |
| `scripts/neo4j-backup.sh`           | Täglicher Backup-Entrypoint (beide Container) |
| `scripts/neo4j-backup.service`      | systemd Unit (oneshot)                 |
| `scripts/neo4j-backup.timer`        | systemd Timer (tägl. 03:00)            |
| `scripts/neo4j-backup-enable.sh`    | Installiert/aktiviert den Timer        |
| `scripts/restore-neo4j.sh`          | Wiederherstellung (mit `--confirm`)    |
| `backups/neo4j/*.dump`              | Die Dumps                              |
| `backups/logs/neo4j-backup_*.log`   | Backup-Logs                            |
