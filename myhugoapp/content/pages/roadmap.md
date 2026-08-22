---
title: 'Roadmap: Ausbaustrategie'
date: 2026-06-15
last_reviewed: 2026-08-16
description: 'Die zukünftige Entwicklungsstrategie für chemie-lernen.org'
tags: ['roadmap', 'entwicklung']
---

chemie-lernen.org ist eine **kostenlose, quelloffene Lernplattform** für Chemie. Kernfeatures sind Rechner, Visualisierungen, interaktive Quiz und ein Wissensnetz. Der freiwillige **Unterstützer-Tarif** ergänzt das Angebot für Lehrende.

---

## ✅ Bereits umgesetzt

| Feature                                              | Status                 |
| ---------------------------------------------------- | ---------------------- |
| 21 Chemie-Rechner & Spezialrechner                   | ✅ seit 2025           |
| Periodensystem 3D, Molekülstudio                     | ✅ kostenlos verfügbar |
| Titrations-Simulator                                 | ✅ kostenlos verfügbar |
| Wissensnetz mit 685+ Fachbegriffen                   | ✅                     |
| 12 Themenbereiche mit Quiz (100+ Fragen)             | ✅                     |
| KI-Assistent (KG-Suche)                              | ✅                     |
| Lehrplankopplung (KMK, 4 Bundesländer)               | ✅                     |
| Unterstützer-Seite & Stripe-Integration              | ✅                     |
| Analytics-Dashboard (Supporter)                      | ✅ Sprint 36           |
| Themenbereiche: Quiz-Widget + Fachbegriff-Wolke      | ✅ Sprint 37           |
| Unterrichtsplan-Generator + Arbeitsblatt (Supporter) | ✅ Sprint 38           |
| Chemie Räume: Admin-Theme-Overrides (Backend-Sync)     | ✅ API `/api/theme-overrides` + WebXR-Admin-Panel, geräteübergreifend |
| KI-Assistent: SSE-Streaming        | ✅ Chat-Antworten per Server-Sent-Events (Live verifiziert)         |
| Erweitertes Assessment             | ✅ /api/exercises generate·grade·feedback, Auto-Benotung, indiv. Feedback, Dashboards |
| Premium-Content-Bibliothek        | ✅ Katalog + Lesson-Plan-/Worksheet-/Exam-Simulator-Endpoints (Unterstützer) |
| LLM-Chat                           | ✅ echte Konversation via LiteLLM-Proxy (chat.js)                  |
| Konversationsgedächtnis            | ✅ Session-basiertes Chat-Gedächtnis (/api/chat/history)            |
| Themenbereiche ausbauen            | ✅ 12 Bereiche, je 6–7 Artikel                                   |
| Adaptive Lernpfade                 | ✅ KG/ZPD-Empfehlungen (/api/adaptive/recommendations)             |
| Barrierefreiheit (WCAG 2.1 AA)     | ✅ Audit + Template-Fixes (sprint-7)                              |
| Automatische Neo4j-Backups        | ✅ Timer `neo4j-backup.timer` aktiv, Runbook vorhanden             |

---

## 🚀 Status der Roadmap (Stand August 2026)

Die zuvor als „Nächste Schritte" gelisteten Features sind **bereits alle
umgesetzt** (siehe Tabelle „Bereits umgesetzt" oben) — geliefert in
abgeschlossenen OpenSpec-Changes und in `master` committed. Einzig
**Rechner ↔ Quiz verknüpfen** ist noch offen.

### Noch offen

| Feature                       | Beschreibung                                    | Status |
| ----------------------------- | ----------------------------------------------- | ------ |
| **Rechner ↔ Quiz verknüpfen** | Jeder Rechner zeigt passende Übungen/Quizfragen | ⏳ offen |

> Hinweis: „Automatische Neo4j-Backups" steht ebenfalls oben in der
> Erledigt-Liste (Timer aktiv, Runbook vorhanden).

---

## 💚 Unterstützer-Tarif

Das gesamte Angebot ist **kostenlos**. Der Unterstützer-Tarif ergänzt optionale Lehrende-Tools:

- **Unterrichtsplan-Generator** (KI-gestützt)
- **Arbeitsblatt-Generator** (4 Aufgabentypen)
- **Analytics-Dashboard** (Klassenfortschritt)

[Lern mehr über das Unterstützer-Angebot →](/unterstuetzen/)

---

## 🗺 Nächste Epics & Sprints (ab ~S39)

Die Roadmap oben ist nahezu vollständig umgesetzt. Die **nächste Phase** fokussiert
auf (1) die Hubs-Lernräume produktiv zu stellen, (2) das letzte offene Item
(Rechner ↔ Quiz) zu schließen und (3) die begonnenen Adaptive-/Curricula-Arbeiten
zu nutzbaren Dashboards zu führen.

### Epics

| Epic | Bereich | Ziel |
| ---- | ------- | ----- |
| **E1** — Hubs-Lernräume produktiv | Hubs | 120 Räume rendern wirklich (503 → 200); Scene-Templates aus `hello-webxr` portieren |
| **E2** — Rechner ↔ Quiz | Hugo | offenes Roadmap-Item: jeder Rechner zeigt passende Übungen/Quiz (geschlossener Lern-Loop) |
| **E3** — Adaptive Lernpfade | Hugo | baut auf ZPD/Bloom auf: Entity-ZPD + Schüler-/Lehrer-Dashboards + Fortschritt |
| **E4** — Forschung & Wissensnetz | Hugo/KG | mehr Entitäts-Abdeckung, Kurations-Workflow, Graph-UX |
| **E5** — Mobile & Offline | Android/PWA | Feature-Parity + Offline-Cache (Parallel-Track) |
| **E6** — Lehrende & Raum-Management | Hugo+Hubs | SSO/Invite-Tokens, Raum-Verwaltungs-Panel, Einbettung in Themenbereiche |
| **E7** — Öffentlichkeit & Skalierung | Plattform | Per-Room Public-Share (Token), Perf-Budgets, Monitoring |

### Sprints (2-Wochen)

| Sprint | Epic | Schwerpunkt |
| ------ | ---- | ----------- |
| **S39** | E1 | Netzwerk-Entscheidung + Hubs-Stack deployen → 503 behoben |
| **S40** | E1 | Scene-Templates portieren; Default-Scene pro Element |
| **S41** | E2 | Rechner→Quiz-Mapping in KG + Quiz-Widget auf Rechner-Seiten |
| **S42** | E3 | Entity-ZPD + Schüler-Dashboard _(parallel: E5 Android)_
| **S43** | E3 | Teacher-Dashboard + Fortschritt _(parallel: E5 PWA Offline)_
| **S44** | E4 | Forschungs-Pipeline-Maturity + KG-Kuration |
| **S45** | E6 | SSO/Invite-Tokens + Raum-Verwaltung |
| **S46** | E7 | Per-Room Public-Share + Perf/Monitoring |

### Offene Entscheidungen (vor S39)

1. **Hubs-Netzwerk**: Docker-Bridge auf legion reparieren (Root-Cause) **oder**
   Full-Stack Host-Networking (pragmatisch). _Empfehlung: Bridge reparieren, sonst Host-Net._
2. **Exposition**: Reticulum VPN-only bleiben + Token-basierter Per-Room-Share.
3. **SSO-Umfang**: zuerst Invite-Tokens, Account-Link als Option.

> Detaillierte Planung: OpenSpec-Change `roadmap-next-epics`
> (`openspec/changes/roadmap-next-epics/`).

---

_Letzte Aktualisierung: August 2026 (Nächste-Epics-Sektion ergänzt)_
