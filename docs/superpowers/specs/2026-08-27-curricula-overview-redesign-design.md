# Design: Lehrpläne-Übersicht Redesign

**Datum:** 2026-08-27
**Status:** Implemented (2026-08-29, commit `a15ccafe`)

## Problem

Die `/curricula/`-Seite öffnet direkt mit einem Cytoscape-Graphen — überwältigend als Einstieg. Bundesländer-Liste ist nur ein kleines Sidebar-Element. Kein Vergleichs-Feature.

## Lösung

### Tab-Struktur

- **Übersicht** (default): Karten-Grid 4×4 + Vergleichsfeature
- **Erweitert**: Bestehender Cytoscape-Graph (nur Lehrpläne-Scope)

### Karten-Grid

- Summary-Stats-Leiste (16 Länder, N Lehrpläne, N Themen, N Lernziele)
- 16 Karten: Name, Kürzel, Lehrpläne/Themen/Lernziele, Schulform-Tags
- Klick → `/curricula/XX/` (direkt, kein Dropdown)
- 0-Themen-Karten ausgegraut

### Vergleichs-Feature

- Toggle „Bundesländer vergleichen" → Checkboxen auf Karten
- 2–3 Länder wählen → Vergleichs-Panel mit Themen-Tabelle (gemeinsam/nur-Land-A/nur-Land-B)
- Datenquelle: bestehende `/api/curricula/by-state/:code` (parallel fetch)

### Erweitert-Tab

- Graph default auf Lehrpläne-Scope
- Universitäten-Dropdown nur bei Scope „Alle"

## Technisch

- Template: `layouts/_default/curricula-index.html` (Tabs + Grid-Container)
- Neu: `static/js/curricula-overview.js` (Grid + Vergleich)
- Bestehend: `static/js/curricula-index.js` (Graph-Tab)
- Keine neuen API-Endpunkte
