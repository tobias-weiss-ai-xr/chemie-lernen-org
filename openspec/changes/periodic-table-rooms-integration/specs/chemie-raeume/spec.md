# Spec: chemie-raeume (per-element learning rooms)

Delta-Spec: Die „Chemie Räume" verweisen auf das begehbare 3D-Periodensystem
(GitHub Pages) statt auf die Hubs-Instanz.

## MODIFIED Requirements

### Requirement: Element-Kacheln verlinken die aktuelle 3D-Oberfläche

Jede Element-Kachel des Verzeichnisses (`/chemie-raeume/`) MUSS auf den
per-Element-Raum des begehbaren 3D-Periodensystems verlinken:
`https://tobias-weiss-ai-xr.github.io/periodic-table/rooms/<NNN>-<name>.html`
(`<NNN>` = 3-stellige Ordnungszahl, `<name>` = englischer Elementname in
Kleinbuchstaben, Dateinamen-Schreibweise der GitHub-Pages-App). Für Symbole
ohne Zuordnung MUSS auf den Hauptraum (`…/periodic-table/`) gefallen werden.
Die Hubs-Instanz (`hubs.chemie-lernen.org`) DARF auf aktiven Werbeflächen
nicht mehr verlinkt werden.

#### Scenario: Bekanntes Element

- **Given** das Manifest enthält Silber (`Ag`, Ordnungszahl 47)
- **When** `/chemie-raeume/` das Manifest lädt und die Kacheln rendert
- **Then** verlinkt die Ag-Kachel auf
  `…/periodic-table/rooms/047-silver.html` (target `_blank`).

#### Scenario: Kein Hubs-Link auf aktiven Flächen

- **Given** die Startseite oder `/chemie-raeume/` ist geladen
- **When** alle `<a href>` geprüft werden
- **Then** enthält keiner `hubs.chemie-lernen.org`.

## ADDED Requirements

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
