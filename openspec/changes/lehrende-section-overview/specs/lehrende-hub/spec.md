# Lehrende-Hub — Delta Spec

## ADDED Requirements

### Requirement: R1: Hub-Seite `/lehrende/`

Die Seite `/lehrende/` rendert eine übersichtliche Einstiegsseite mit Hero,
Kurz-Intro und automatischen Card-Grids für Sektionen und Werkzeuge.

#### Scenario: Hub enthält alle Lehrende-Inhalte

- **WHEN** eine Lehrkraft `/lehrende/` im Browser öffnet
- **THEN** wird die Seite im Browser gerendert
- **AND** zeigt sie einen Hero mit Titel „Lehrende“ und Untertitel
- **AND** zeigt sie eine Card-Liste „Didaktische Grundlagen“ mit allen
  Lehrende-Sektionen und der Meyers-Prinzipien-Seite
- **AND** zeigt sie eine Card-Liste „Werkzeuge für Lehrkräfte“ mit den 9
  Kindern des Lehrende-Menüpunkts

### Requirement: R2: Split-Dropdown-Navigation

Hauptmenüpunkte mit Kindern und echter URL rendern einen Label-Link zur
Sektion plus ein separates Caret zum Öffnen des Submenüs; `url="#"`-Punkte
behalten den bisherigen Toggle.

#### Scenario: Klick auf Label navigiert zur Sektion

- **WHEN** eine nutzer_in in der Navbar auf das Label „Lehrende“ klickt
- **THEN** wird der Browser zu `/lehrende/` navigiert
- **AND** öffnet sich dabei nicht das Submenü

#### Scenario: Klick auf Caret öffnet das Submenü

- **WHEN** eine nutzer_in in der Navbar auf das Caret neben „Lehrende“ klickt
- **THEN** wird das Dropdown-Submenü mit den Werkzeug-Links geöffnet
- **AND** navigiert der Browser nicht von der aktuellen Seite weg

#### Scenario: Punkte mit `url="#"` bleiben unverändert

- **WHEN** eine nutzer_in den Menüpunkt „Interaktiv“ oder „Mehr“ antippt
- **THEN** funktioniert der bisherige Single-Toggle weiter als Dropdown

### Requirement: R3: Kontrast der Lehrende-Cards

Die Karten auf `/lehrende/` erfüllen die WCAG-Kontrast-Vorgaben in allen
Themes.

#### Scenario: Kontrast in Light/Dark/Contrast

- **WHEN** die Seite im Light-, Dark- und Contrast-Theme geladen wird
- **THEN** erfüllen Titel und Beschreibungstext der Cards das
  WCAG-Kontrastverhältnis (AA: normal ≥ 4.5:1, groß ≥ 3:1)
- **AND** ist kein Text unlesbar (keine „gelb auf weiß“-Kollision)
