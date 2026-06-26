---
title: 'Plattform-Status'
description: 'Übersicht über den Betriebsstatus der chemie-lernen.org Plattform'
layout: 'status'
outputs:
  - html
menu:
  main:
    parent: 'mehr'
    weight: 200
---

## System-Status

| Komponente               | Endpunkt                   | Status           |
| ------------------------ | -------------------------- | ---------------- |
| Webserver (Hugo)         | `/entity/`                 | ✅ Online        |
| KI-Assistent API         | `/api/chat`                | ✅ Online        |
| Health-Check             | `/api/health`              | ✅ Online        |
| Wissensgraph-Statistiken | `/api/kg-stats`            | ✅ Online        |
| Neo4j-Datenbank          | `/api/health` (neo4j)      | _wird geprüft_   |
| Datenqualität            | `/api/kg-stats` (qualität) | _wird berechnet_ |

## API-Smoketests

Bei jedem Deploy laufen 7 automatische Smoketests:

1. `/entity/` liefert HTTP 200
2. `entity-index.js` ist korrekt eingebunden
3. `/js/entity-index.js` lädt mit HTTP 200
4. `/api/health` liefert HTTP 200
5. `/api/health` enthält `status: ok`
6. `/api/kg-stats` liefert valides JSON
7. `/api/chat` validiert Eingabe (HTTP 400 bei leerem Body)
