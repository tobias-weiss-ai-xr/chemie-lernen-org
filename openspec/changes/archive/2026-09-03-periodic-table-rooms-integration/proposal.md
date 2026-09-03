# Change Proposal: periodic-table-rooms-integration

## Why

Die „3D-Räume der Elemente" waren über die selbst gehostete
**Hubs**-Instanz (`hubs.chemie-lernen.org`) beworben und verlinkt
(Startseiten-Promo-Widget, Nav-Menü, Footer, Guides, Manifest-`hubRoomUrl`).
Die Hubs-Räume waren nie vollständig produktionsreif (Host-Memory-Ceiling,
siehe `per-element-learning-rooms`), und die Instanz wird aus Ressourcen- und
Wartungsgründen nicht mehr aktiv beworben — sie bleibt aber erreichbar.

Stattdessen wird der neue, stabile **begehbare 3D-Periodensystem-Raum**
(GitHub Pages, Repo `tobias-weiss-ai-xr/periodic-table`) als werblicher
Einstieg in die 3D-Lernräume genutzt. Er bietet pro Element einen eigenen,
tiefverlinkbaren Raum (`rooms/<NNN>-<name>.html`) sowie einen Gesamtraum
(118 Elemente, Suche, WebXR/VR).

Ziel: Alle Werbe-/Einstiegsflächen von chemie-lernen.org zeigen auf die neue
3D-Oberfläche; Hubs-Links verschwinden aus aktiven Flächen, ohne die
bestehenden (archivierten) Hubs-Seiten zu löschen.

## What Changes

1. **Manifest-Schema**: `hubRoomUrl`/`hubId` entfernt; `roomUrl` zeigt pro
   Element auf den GitHub-Pages-Raum (`rooms/<NNN>-<english-name>.html`).
   Generator liest jetzt das committed Manifest als Metadaten-Quelle
   (deutsche Namen, Gruppen-Taxonomie) statt `hello-webxr`-`elements.ts`
   (`/opt/git/hello-webxr-master` existiert lokal nicht mehr).
2. **`/chemie-raeume/`**: Kacheln ohne „🔗 Hubs"-Badge; Copy aktualisiert
   (Verweis auf den Gesamtraum statt Hubs für Lehrkräfte).
3. **Startseite**: `hubs-promo-widget` → neues `periodic-table-promo-widget`
   (Primary-CTA: GitHub-Pages-Raum; Secondary: `/chemie-raeume/`).
4. **Navigation/Footer**: Menü „Lernräume (3D)" und Footer-Link zeigen auf
   `/chemie-raeume/` statt `/pages/lernraeume-in-hubs/`.
5. **Archivierte Hubs-Seiten**: `lernraeume-in-hubs.md` (inkl. Frontmatter-
   Menüeintrag entfernt) und alle `guides/*` bleiben erreichbar, erhalten
   aber einen einheitlichen Status-Hinweis („nicht mehr aktiv beworben",
   Verweis auf neue Oberfläche).
6. **Tests**: `test-hubs-integration.spec.js` →
   `test-periodic-table-integration.spec.js` (Promo, Kachel-Deep-Links,
   „keine Hubs-Links auf aktiven Flächen", Deprecation-Hinweise,
   GitHub-Pages-Link-Integrität). Unit-Tests (`chemie-raeume.test.js`,
   `manifest.test.js`) auf neues Schema umgestellt.

## Impact

- **Code**: `scripts/generate-chemie-raeume-manifest.mjs`,
  `myhugoapp/static/js/chemie-raeume.js`,
  `myhugoapp/layouts/_default/chemie-raeume.html`,
  `myhugoapp/layouts/shortcodes/periodic-table-promo-widget.html` (neu)
- **Content**: `_index.md`, `chemie-raeume.md`, `lernraeume-in-hubs.md`,
  `guides/*` (9 Dateien, Status-Hinweis)
- **Daten**: `myhugoapp/static/data/chemie-raeume-manifest.json`
- **Tests**: 2 Unit-Tests angepasst, 1 E2E-Spec ersetzt
- **Nicht geändert**: Hubs-Instanz selbst (`docker-compose.hubs.yml`),
  Hubs-Admin-Skripte (`scripts/*hubs*`), `docs/`, `openspec`-Archiv
