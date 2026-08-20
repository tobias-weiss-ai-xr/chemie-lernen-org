# Change Proposal: roadmap-next-epics

## Why

Die Roadmap (`myhugoapp/content/pages/roadmap.md`) listet nahezu alle Features
als **bereits umgesetzt**; einzig **„Rechner ↔ Quiz verknüpfen"** ist offen.
Damit ergibt sich für chemie-lernen.org (Hugo-Site + Mozilla-Hubs-Lernräume)
eine Lücke in der Vorausplanung: es fehlt eine verbindliche Epic-/Sprint-Roadmap
für die nächste Entwicklungsphase.

Verifizierter Ist-Stand (2026-08):

- **Hugo-Site**: 21+ Rechner, Periodensystem 3D, Molekülstudio, Quiz (12
  Themenbereiche, 100+ Fragen), KI-Assistent (SSE), Chemie-Forschung
  (KG-getrieben, CI), erweitertes Assessment, Adaptive Lernpfade (ZPD/Bloom in
  Arbeit via OpenSpec-Changes `bloom-zpd-adaptive-engine`, 5× `zpd-deepdive-*`),
  Premium/Unterstützer-Tarif, Android-Spec, Curricula-Graph-Viz (in Arbeit).
- **Hubs/Reticulum** (`hubs.chemie-lernen.org`): 120 pro-Element-Lernräume
  existieren (KG-getrieben erstellt, Manifest `chemie-raeume-manifest.json`),
  laufen **VPN-only / host-networked** (persistent via Ansible-Role
  `reticulum_vpn`). Sie rendern aktuell aber **HTTP 503**, weil der restliche
  Hubs-Stack (`hubs-admin`/Scene-Service) nicht deployt ist — Reticulum kann
  keine Scene laden.
- **Offen (Roadmap)**: Rechner ↔ Quiz verknüpfen.

Ziel dieser Change: Eine **epic-/sprint-übergreifende Roadmap** festhalten, die
(a) die Hubs-Räume produktiv stellt, (b) das offene Rechner↔Quiz-Item schließt
und (c) die begonnenen Adaptive-/Curricula-Arbeiten zu nutzbaren Dashboards
führt — ohne die bestehende OpenSpec-Struktur zu sprengen.

## What Changes

### Strategische Epics

- **E1 — Hubs-Lernräume produktiv stellen (Hubs)**: 503 → 200; Rest des
  Hubs-Stacks deployen; Scene-Templates aus `hello-webxr` portieren
  (`ElementRoom`, `PeriodicPavilion`, `LabWing`, `ExperimentalRoom`, `Lobby`).
- **E2 — Rechner ↔ Quiz Integration (Hugo)** *(offenes Roadmap-Item)*: jeder
  Rechner zeigt passende Übungen/Quiz; geschlossener Lern-Loop.
- **E3 — Adaptive & personalisierte Lernpfade (Hugo)**: baut auf ZPD/Bloom auf;
  Entity-Level ZPD-Empfehlungen + Schüler-/Lehrer-Dashboards + Fortschritt
  (`assessment-store`).
- **E4 — Chemie-Forschung & Wissensnetz-Maturity (Hugo/KG)**: mehr
  Entitäts-Abdeckung in der Forschungs-Pipeline, Kurations-Workflow, Graph-UX
  (`curricula-graph-viz`).
- **E5 — Mobile & Offline (Android/PWA)**: Feature-Parity (Quiz/Rechner/Pfade)
  + Offline-Cache.
- **E6 — Lehrende-Plattform & Raum-Management (Hugo + Hubs)**: SSO reticulum ↔
  chemie-lernen.org-Accounts, Raum-Verwaltungs-Panel, Einbettung der Räume in
  Themenbereiche/Lehrpläne.
- **E7 — Öffentlichkeit, Performance & Skalierung**: Per-Room Public-Share
  (Token) trotz VPN-only Reticulum, Bundle/Perf-Budgets, Monitoring/Alerting.

### Sprint-Roadmap (2-Wochen-Sprints, ab ~S39)

| Sprint | Epic | Schwerpunkt |
|---|---|---|
| S39 | E1 | Netzwerk-Entscheidung + `hubs-admin`/`postgrest`/`spoke`/`dialog` deployen → 503 behoben |
| S40 | E1 | Scene-Templates portieren; Default-Scene pro Element |
| S41 | E2 | Rechner→Themenbereich→Quiz-Mapping in KG + Quiz-Widget auf Rechner-Seiten |
| S42 | E3 | Entity-Level ZPD-Empfehlungen + Schüler-Dashboard |
| S43 | E3 | Teacher-Dashboard + Fortschrittstracking |
| S44 | E4 | Forschungs-Pipeline-Maturity + KG-Kurations-Workflow |
| S45 | E6 | SSO + Raum-Verwaltungs-Panel |
| S46 | E7 | Per-Room Public-Share + Perf/Monitoring |

**Parallel-Track (S42–S45):** E5 Android/PWA.

### Offene Entscheidungen (vor S39 zu klären — Empfehlungen unten)

1. **Hubs-Netzwerk-Architektur (Blocker E1)**: (A) Full-Stack Host-Networking
   aller Hubs-Services auf distinct Ports, oder (B) Docker-Bridge auf legion
   reparieren (Root-Cause des host→bridge-TCP-Defekts). **Empfehlung: (B),
   falls Bridge-Reparatur in vertretbarem Aufwand möglich; sonst (A).**
2. **Exposition**: Reticulum VPN-only bleiben, oder einzelne Räume gezielt
   öffentlich teilen (E7)? Datenschutz/FGH beachten. **Empfehlung: VPN-only +
   Token-basierter Per-Room-Share (E7).**
3. **SSO-Umfang (E6)**: volle Account-Verknüpfung oder nur Raum-Invite-Tokens?
   **Empfehlung: Invite-Tokens zuerst, Account-Link als Option.**

## Impact

- Betrifft: `hugo-chemie-lernen-org` (Hugo-Site, `roadmap.md`, `scripts/`,
  evtl. `myhugoapp/static/data/chemie-raeume-manifest.json`), `hello-webxr`
  (Scene-Templates), legion Hubs-Stack (Ansible-Role `reticulum_vpn` +
  neue Hubs-Service-Rollen), `ansible`-Repo.
- Keine Breaking Changes an bestehenden Features; reine Erweiterung/Aktivierung.
