# Spec: chemie-raeume (per-element learning rooms)

Delta-Spec für die „Chemie Räume" — pro Element ein eigener, auffindbarer
Lernraum mit guter Lernerfahrung.

## ADDED Requirements

### Requirement: Pro-Element-Raum ist tiefverlinkt erreichbar

Jeder Element-Lernraum MUSS über eine stabile URL tiefverlinkt erreichbar sein:
`?room=<SYMBOL>` (und Alias `?element=<SYMBOL>`), die den passenden
`ElementRoom` lädt. Ein unbekannter Symbol-Parameter DARF NICHT still in den
Lobby/Fair redirecten, sondern MUSS im Periodensystem-Pavilion mit einer
klaren „Element nicht gefunden"-Meldung landen.

#### Scenario: Bekanntes Element

- **Given** ein Aufruf mit `?room=H`
- **When** die App mountet
- **Then** wird der Wasserstoff-`ElementRoom` (thematisiert, mit Inhalt) gezeigt.

#### Scenario: Unbekanntes Element

- **Given** ein Aufruf mit `?room=ZZ`
- **When** die App mountet
- **Then** wird das Periodensystem-Pavilion gezeigt + ein „Element ‹ZZ› nicht
  gefunden"-Overlay, KEIN Lobby/Fair-Redirect.

### Requirement: Jedes Element hat ein definiertes Theme

Für alle 121 Elemente MUSS `getThemeForElement(symbol)` ein definiertes,
nicht-`undefined` Theme liefern (spezifisches `THEMES[element.theme]` oder ein
bewusster Gruppen-Fallback). Kein Element darf auf ein nicht existierendes
spezifisches Theme verweisen und dadurch still neutral fallen.

#### Scenario: Spezifisches Theme vorhanden

- **Given** Element H mit `theme: 'cosmic'`
- **When** der Raum gebaut wird
- **Then** wird das `cosmic`-Theme (Farbe + Partikel + Ambience) angewendet.

#### Scenario: Theme-Abdeckung

- **Given** alle 121 Elemente
- **When** ein Audit läuft
- **Then** liefert keines ein `undefined`-Theme.

### Requirement: Jeder Raum hat Inhalt + Rückweg (keine Sackgasse)

Jeder `ElementRoom` MUSS mindestens eine Beschreibung und lesbare
Element-Infos haben sowie einen klaren Rückweg zum Periodensystem (zusätzlich
zu „EXIT → Lobby"). Elemente ohne eigene Experimente MÜSSEN sinnvoll auf
Gruppen-Infos fallbacken (nicht leer bleiben).

#### Scenario: Rückweg

- **Given** ein Lerner im Wasserstoff-Raum
- **When** er „→ Periodensystem" wählt
- **Then** gelangt er ins Pavilion, ohne den Raum neu laden zu müssen.

### Requirement: Auffindbares Verzeichnis aller Elementräume

chemie-lernen.org MUSS eine Verzeichnis-Seite (`/chemie-raeume/`) bereitstellen,
die alle Elemente als Kacheln listet; jede Kachel verlinkt auf den Raum
(App-`roomUrl`, sofern vorhanden auch Hubs-`hubsRoomUrl`).

#### Scenario: Verzeichnis-Einstieg

- **Given** ein Lerner öffnet `/chemie-raeume/`
- **When** er auf die Kachel „H" klickt
- **Then** öffnet sich der Wasserstoff-Raum (App- bzw. Hubs-Deep-Link).

### Requirement: Hubs-Räume embedden tiefverlinkt

Falls Hubs-Räume pro Element existieren, MUSS deren Embed-URL die kanonische
`?room=<SYMBOL>`-Form nutzen, sodass der Lerner im Element-Raum (nicht der
Fair) landet.

#### Scenario: Hubs-Elementraum

- **Given** der Hubs-Raum für Wasserstoff
- **When** ein Lerner ihn betritt
- **Then** lädt die App mit `?room=H` (Wasserstoff-Raum), nicht die Hubs Fair.
