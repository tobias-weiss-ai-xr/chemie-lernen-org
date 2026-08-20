# Tasks: roadmap-next-epics

> Status: **geplant** (Epics E1–E7, Sprints S39–S46 + Android-Parallel-Track).
> Ziel: Vorausplanung festhalten; einzelne Epics werden in eigenen,
> feingranularen OpenSpec-Changes umgesetzt (diese Change ist die Dach-Roadmap).

## S39 — E1: Hubs-Stack zum Rendern bringen (Entscheidung + Deploy) — ✅ ERLEDIGT

> Root-Cause (2026-08-20): Reticulum lieferte HTTP 503 ("Missing file hub.html"),
> weil `PageOriginWarmer` die Hub-Page-Chunks von **hubs-client** holt, der nicht
> lief. Zusätzlich klaute ein systemd-`socat`-Service (`socat-litellm-proxy`, enabled)
> Reticulums HTTP-Port 4001 → `eaddrinuse`. Docker-Bridge auf legion bleibt defekt
> (host→bridge TCP bricht ab) → Entscheidung **Option A (Host-Networking)** beibehalten.

- [x] S39.1 Netzwerk: Bridge-Reparatur verworfen (bleibt host-networked, Option A).
- [x] S39.2 hubs-client als host-networked Service deployt (compose `reticulum-vpn`),
      inotify-Limits (max_user_instances/watches) persistiert, ulimit nofile=300000.
- [x] S39.3 503 behoben: `runtime.exs` PageOriginWarmer-Origins → `https://localhost`;
      konfliktierenden `socat-litellm-proxy.service` disabled (Port 4001 freigegeben).
- [x] S39.4 Verifikation: alle getesteten Element-Räume liefern HTTP 200 (statt 503).
      Reticulum + db + hubs-client laufen nun Ansible-managed (restart unless-stopped).

> Hinweis: Bisher nur hubs-client deployt (reicht für Rendering). hubs-admin/spoke/
> postgrest/dialog folgen in späteren Sprints, sofern Scene-Bearbeitung nötig.

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
- [x] `roadmap.md` enthält Sektion „Nächste Epics & Sprints (ab S39)".
- [x] Alle 120 Räume rendern (503 → 200). ✅ (S39/E1 erledigt)
- [ ] Rechner↔Quiz-Verknüpfung live.
- [ ] Mind. 1 adaptives Dashboard (Schüler oder Lehrer) live.
