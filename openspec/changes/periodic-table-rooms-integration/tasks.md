# Tasks: periodic-table-rooms-integration

> Status: implemented (2026-09-03).

## 1. Manifest + Generator

- [x] 1.1 Generator umschreiben: Input = committed Manifest (Metadaten), Output = `rooms/<NNN>-<english-name>.html` Deep-Links auf `https://tobias-weiss-ai-xr.github.io/periodic-table`; `hubRoomUrl`/`hubId` entfernt; Unbekannte-Symbol-Fallback auf Haupt-Raum.
- [x] 1.2 Symbol→(Ordnungszahl, engl. Name)-Map aus `assets/elements-data.js` der GitHub-Pages-Seite abgeleitet und eingebettet (118 Einträge; Cs-Sonderfall `cesium` vs. `Caesium`).
- [x] 1.3 Manifest neu generiert; alle 118 eindeutigen Room-URLs live verifiziert (HTTP 200, inkl. `001-hydrogen` … `118-oganesson`).

## 2. Frontend (/chemie-raeume/)

- [x] 2.1 `chemie-raeume.js`: Hubs-Badge-Logik entfernt (auch bei Legacy-Manifest mit `hubRoomUrl` wird kein Hubs-Link gerendert).
- [x] 2.2 `chemie-raeume.html`: `.cr-hub`/`.no-hub` CSS entfernt.
- [x] 2.3 `chemie-raeume.md`: Hubs-Satz für Lehrkräfte ersetzt durch Verweis auf den begehbaren Gesamtraum.

## 3. Promotion-Flächen

- [x] 3.1 Neues Shortcode `periodic-table-promo-widget.html` (pt-promo-*, Primary → GitHub Pages, Secondary → `/chemie-raeume/`).
- [x] 3.2 Startseite `_index.md`: Hubs-Sektion + Widget ersetzt.
- [x] 3.3 `config.toml`: Menü „Lernräume (3D)" → `/chemie-raeume/`.
- [x] 3.4 `footer.html`: „Lernräume in Hubs" → „3D-Elementräume" (`/chemie-raeume/`).

## 4. Archivierte Hubs-Seiten (bleiben erreichbar, nicht mehr beworben)

- [x] 4.1 `lernraeume-in-hubs.md`: Status-Hinweis + Frontmatter-Menüeintrag entfernt.
- [x] 4.2 `guides/*.md` (9 Dateien): einheitlicher Status-Hinweis nach Frontmatter.

## 5. Tests

- [x] 5.1 `chemie-raeume.test.js`: Badge-Assertion entfernt, neuer Test „kein Hubs-Badge/Link auch bei Legacy-Manifest".
- [x] 5.2 `manifest.test.js`: Generator-Test auf Input-Manifest-Vertrag umgestellt (Legacy-Felder werden gestrippt, Fallback, Sortierung); committed-Manifest-Test prüft „keine Hubs-Felder/URLs".
- [x] 5.3 `test-hubs-integration.spec.js` gelöscht; `test-periodic-table-integration.spec.js` (Promo, Kacheln, Deprecation, Link-Integrität) angelegt.
- [x] 5.4 Volle Unit-Suite grün (2443 passed), ESLint + Prettier grün.
