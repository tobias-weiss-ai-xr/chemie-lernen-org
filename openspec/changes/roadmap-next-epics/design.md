# Design: roadmap-next-epics

## Architektur-Entscheidung Hubs-Netzwerk (Blocker E1)

Legion (192.168.42.42) hat einen **defekten Docker-Bridge** (host→bridge TCP
schlägt fehl, nur ICMP geht). Deshalb läuft Reticulum aktuell `network_mode:
host` (VPN-only, persistent via Ansible-Role `reticulum_vpn`).

Für E1 (Räume rendern = 503 fix) muss der Rest des Hubs-Stacks erreichbar sein:

### Option A — Full-Stack Host-Networking
Alle Hubs-Services (`hubs-admin`, `hubs-client`, `spoke`, `postgrest`,
`dialog`, ggf. `haproxy`) mit `network_mode: host` auf distinct Host-Ports
deployen. Baut auf dem existierenden Ansible-Role auf, braucht **keine
Bridge-Reparatur**. Nachteil: Port-Management wird messy, jedes Service braucht
eindeutige Host-Ports; Service-Discovery untereinander über `localhost:<port>`
(statt Container-Namen).

### Option B — Docker-Bridge auf legion reparieren
Root-Cause-Fix des host→bridge-TCP-Defekts (vermutlich iptables/forwarding
oder korrupte Bridge). Ermöglicht den sauberen, originalen `hubs-compose`-
Stack (Bridge-Netzwerk, Service-Discovery via DNS). Nachteil: Debugging-Aufwand
unklar; Risiko, weitere Netzwerk-Seiteneffekte zu triggern.

**Empfehlung**: Erst Versuch B (sauber, langfristig korrekt). Scheitert B oder
ist Aufwand > 1 Sprint, Pragmatik A. S39 enthält explizit die
Entscheidungs-/Spiking-Aufgabe.

## Scene-Templates (E1/S40)
`hello-webxr` liefert bereits: `ElementRoom` (pro Element, `?room=<SYMBOL>`),
`PeriodicPavilion` (PSE-Plaza), `LabWing`, `ExperimentalRoom`, `Lobby`,
`RoomManager`. Diese als Hubs-Scenes portieren (Babylon.js → Hubs-Spoke-Scene)
und pro Element-Raum als Default-Scene setzen. Reticulum-Scenes werden in
Postgres (`hubs`/`scenes`) gespeichert; `hubId` → Scene-Mapping via
`chemie-raeume-manifest.json` bleibt bestehen.

## Rechner ↔ Quiz (E2/S41)
Mapping-Reuse: Rechner-Seiten sind bereits `themenbereiche`-/Entity-verknüpft.
Quiz-Fragen liegen in KG (`Quiz`-Entities) und pro Themenbereich vor. Neue
Beziehung `Calculator --uses--> QuizQuestion` in KG; Hugo-Widget lädt passende
Fragen via bestehende `/api/quiz`-Endpunkte. Kein neuer Service nötig.

## Adaptive Dashboards (E3/S42–S43)
Baut auf `bloom-zpd-adaptive-engine` + `zpd-deepdive-*` auf. Entity-Level
ZPD-Empfehlungen aus `learning-engine`/`assessment-store`; Dashboards als
Hugo-Templates (Schüler: Fortschritt; Lehrer: Klassenübersicht). Datenquelle:
bereits persistierende Assessment-Store-Tabellen.

## Public-Share vs. VPN-only (E7/S46)
Reticulum bleibt VPN-only (Firewall: 4000/4001 nur für 192.168.42.0/24 +
localhost). Öffentlicher Zugriff auf einzelne Räume via **signierter
Share-Token-URL**, die Traefik (auf chemie-lernen.org-Host) als Reverse-Proxy
für genau diesen Raum freischaltet — ohne Reticulum selbst öffentlich zu machen.
