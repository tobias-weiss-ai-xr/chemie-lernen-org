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

_Letzte Aktualisierung: August 2026_
