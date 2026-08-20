# Tasks: roadmap-next-epics

> Status: **geplant** (Epics E1–E7, Sprints S39–S46 + Android-Parallel-Track).
> Ziel: Vorausplanung festhalten; einzelne Epics werden in eigenen,
> feingranularen OpenSpec-Changes umgesetzt (diese Change ist die Dach-Roadmap).

## S39 — E1: Hubs-Stack zum Rendern bringen (Entscheidung + Deploy)
- [ ] S39.1 Netzwerk-Spike: Docker-Bridge auf legion reparieren (Option B) — max. 1 Sprint Budget; sonst Fallback Option A.
- [ ] S39.2 Bei Option A: Ansible-Role für `hubs-admin`/`postgrest`/`spoke`/`dialog` (host-networked, distinct Ports) anlegen; bei Option B: originalen `hubs-compose`-Stack nutzen.
- [ ] S39.3 Reticulum-503 beheben: Scene-Service erreichbar → Räume laden mit Default-Scene.
- [ ] S39.4 Verifikation: ≥1 Element-Raum (`hubs.chemie-lernen.org/<hubId>/…`) liefert HTTP 200 (nicht mehr 503).

## S40 — E1: Scene-Templates portieren
- [ ] S40.1 `ElementRoom`, `PeriodicPavilion`, `LabWing`, `ExperimentalRoom`, `Lobby` aus `hello-webxr` als Hubs-Scenes übernehmen.
- [ ] S40.2 Pro Element-Raum Default-Scene setzen (Mapping via `chemie-raeume-manifest.json`).
- [ ] S40.3 Multi-User/Spacial-Audio Smoke-Test in einem Raum.

## S41 — E2: Rechner ↔ Quiz Integration (offenes Roadmap-Item)
- [ ] S41.1 KG-Beziehung `Calculator --uses--> QuizQuestion` anlegen + befüllen.
- [ ] S41.2 Hugo-Quiz-Widget auf Rechner-Seiten einbetten (lädt passende Fragen via `/api/quiz`).
- [ ] S41.3 „Übung generieren"-Button pro Rechner (bestehender `exercise-generator`).

## S42 — E3: Entity-ZPD + Schüler-Dashboard
- [ ] S42.1 Entity-Level ZPD-Empfehlungen aus `learning-engine`/`assessment-store` exponieren.
- [ ] S42.2 Schüler-Dashboard-Template (Fortschritt, Empfehlungen).
- [ ] S42.3 (Parallel) E5: Android — Quiz/Rechner/Pfade Feature-Parity.

## S43 — E3: Teacher-Dashboard + Fortschritt
- [ ] S43.1 Klassen-/Lehrer-Dashboard (Aggregation aus Assessment-Store).
- [ ] S43.2 Fortschrittstracking persistenzfest machen.
- [ ] S43.3 (Parallel) E5: PWA Offline-Cache.

## S44 — E4: Forschung & Wissensnetz-Maturity
- [ ] S44.1 Mehr Entitäts-Abdeckung in Chemie-Forschung (CI-Pipeline erweitern).
- [ ] S44.2 KG-Kurations-Workflow (Review/Publish-Gate für Forschungs-Artikel).
- [ ] S44.3 Graph-UX verbessern (`curricula-graph-viz` finalisieren).

## S45 — E6: SSO + Raum-Verwaltung
- [ ] S45.1 Raum-Invite-Tokens (Reticulum ↔ chemie-lernen.org-Accounts).
- [ ] S45.2 Raum-Verwaltungs-Panel (Lehrende: Räume erstellen/managen).
- [ ] S45.3 Räume in Themenbereiche/Lehrpläne einbetten.

## S46 — E7: Public-Share, Performance, Monitoring
- [ ] S46.1 Signierter Per-Room Share-Token via Traefik-Reverse-Proxy (Reticulum bleibt VPN-only).
- [ ] S46.2 Bundle/Perf-Budgets (bestehende `npm run analyze:bundle` nutzen).
- [ ] S46.3 Monitoring/Alerting für Reticulum (Health + 503-Wachstum).

## Acceptance
- [ ] `roadmap.md` enthält Sektion „Nächste Epics & Sprints (ab S39)".
- [ ] Alle 120 Räume rendern (503 → 200).
- [ ] Rechner↔Quiz-Verknüpfung live.
- [ ] Mind. 1 adaptives Dashboard (Schüler oder Lehrer) live.
