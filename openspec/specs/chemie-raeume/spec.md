# chemie-raeume Specification

## Purpose

Das Verzeichnis der per-Element-3D-Lernräume (`/chemie-raeume/`) und sein
Manifest: Jedes Element bekommt eine Kachel mit Deep-Link in den eigenen
Raum des begehbaren 3D-Periodensystems (GitHub Pages,
tobias-weiss-ai-xr/periodic-table). Die Hubs-Instanz wird nicht mehr
beworben; archivierte Hubs-Seiten bleiben mit Status-Hinweis erreichbar.

## Requirements

### Requirement: Manifest-Schema ohne Hubs-Felder

Das Manifest (`/data/chemie-raeume-manifest.json`) MUSS je Element
`symbol`, `name`, `group`, `period`, `groupNumber`, `theme` und `roomUrl`
tragen und DARF die Felder `hubRoomUrl`/`hubId` nicht mehr enthalten. Es MUSS
ein `roomsBaseUrl` auf den GitHub-Pages-Raum ausweisen.

#### Scenario: Generator strippt Legacy-Felder

- **Given** ein Eingabe-Manifest mit `hubRoomUrl`/`hubId`
- **When** `generate-chemie-raeume-manifest.mjs` läuft
- **Then** enthält das Ausgabe-Manifest diese Felder nicht und alle
  `roomUrl` zeigen auf `roomsBaseUrl`.

### Requirement: Archivierte Hubs-Seiten mit Status-Hinweis

Die Hubs-Konzeptseite (`/pages/lernraeume-in-hubs/`) und die Guides
(`/guides/`) bleiben erreichbar, MÜSSEN aber oben einen Status-Hinweis
tragen, dass die Hubs-Instanz nicht mehr aktiv beworben wird, mit Verweis
auf das 3D-Periodensystem und `/chemie-raeume/`. Die Konzeptseite DARF im
Hauptmenü nicht mehr verlinkt sein.

#### Scenario: Hinweis sichtbar

- **Given** `/pages/lernraeume-in-hubs/` oder `/guides/` ist geladen
- **When** der Seiteninhalt geprüft wird
- **Then** enthält er den Hinweis „nicht mehr aktiv beworben" und einen
  Link auf das 3D-Periodensystem.
