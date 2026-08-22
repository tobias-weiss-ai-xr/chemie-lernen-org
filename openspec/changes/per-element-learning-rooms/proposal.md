# Change Proposal: per-element-learning-rooms

## Why

Die „Chemie Räume" (WebXR-App in `hello-webxr-master`, Babylon.js) haben pro
Element bereits einen eigenen, thematisch gefärbten Raum (`ElementRoom`), der
tief verlinkt werden kann: `?room=<SYMBOL>` (z. B. `?room=H` → Wasserstoff-Raum).
In **Hubs** (`hubs.chemie-lernen.org`) gibt es davon aber nichts — der
Hubs-Promo auf chemie-lernen.org verlinkt nur auf den generischen
`hubs.chemie-lernen.org/` (die „Hubs Fair"). Wenn ein Lernender also den
Hubs-Raum eines Elements (z. B. „H") betritt, lädt dieser die App **ohne**
`?room=H` und landet im `Lobby`/Pavilion (= der „Fair") statt im
Wasserstoff-Raum. Das ist die gemeldete „H room → hubs fair"-Umleitung.

Ziel: **Jedes Element bekommt seinen eigenen Lernraum**, und zwar mit einer
guten Lernerfahrung — nicht nur technisch erreichbar, sondern auffindbar,
konsistent thematisiert und ohne Sackgassen.

Verifizierter Ist-Stand (2026-08):

- `mount.ts` liest `?room=<symbol>` und navigiert zum `ElementRoom` des Elements
  (ROOM_ELEMENTS_START + index). Funktioniert grundsätzlich.
- `ElementRoom.getThemeForElement` löst `THEMES[element.theme]` (spezifisch)
  auf, sonst Gruppen-Fallback (alkali/halogen/…), sonst `NEUTRAL`.
- `themes.ts` definiert spezifische Themen (`cosmic`, `solar`, `nuclear`,
  `technology`, …) **und** 12 Gruppen-Themen.
- `PeriodicPavilion` (room 128) = die „Fair"/Periodensystem-Plaza; Klick auf
  Element → `ctx.goto = elementIndex + 1` → ElementRaum (Nav ok).
- `hubs-promo-widget.html` verlinkt NUR auf `https://hubs.chemie-lernen.org/`.
- 121 Elemente in `ELEMENTS`; 120 haben `theme`, einige evtl. ohne passendes
  `THEMES`-Entry (stiller Gruppen-Fallback); nicht alle haben `description`/
  `experiments`.

## What Changes

### A. App (`hello-webxr-master`) — robuste, vollständige Element-Räume

- **Tiefverlinkung härten + aliasen**: `?room=<SYMBOL>`, `?element=<SYMBOL>`,
  `?group=<GRUPPE>`; case-normalisiert; unbekannter Symbol → freundliches
  „Element nicht gefunden"-Overlay im Pavilion (KEIN stiller Redirect zur Fair).
- **Theme-/Daten-Vollständigkeit**: jedes der 121 `element.theme` muss ein
  definiertes `THEMES`-Entry haben (fehlende spezifische Themen anlegen oder
  sauber auf Gruppe/definiertes Theme mappen). Jedes Element braucht
  `description`, `color`, `group`; Experimente/Trivia für Elemente nachrüsten,
  die keine haben (v. a. Lanthanoide/Actinoide/synthetische).
- **Lerner-Navigation + UX**: aus jedem ElementRaum klarer „→ Periodensystem"-
  Rückweg (zusätzlich zu EXIT→Lobby); keine Sackgassen; konsistente Partikel/
  Theme; Admin-Override bleibt wirksam; Barrierefreiheit (Labels, Tastatur,
  optional Audio-Cue pro Element).

### B. Hubs (`chemie-lernen.org` + Hubs-Instanz) — pro Element ein Raum

- **Kanonische Embed-URL**: `<APP_BASE_URL>?room=<SYMBOL>`.
- **Manifest** `chemie-raeume-manifest.json` (Symbol → Embed-URL + Anzeigename)
  für alle 118/121 Elemente.
- **Hubs-Räume erzeugen**: falls Hubs-API/Creds vorhanden, Script zum Anlegen/
  Aktualisieren eines Hubs-Raums pro Element mit korrekter Embed-URL (behebt
  „H room → fair"). Sonst: Manifest + dokumentierte manuelle Hubs-Schritte.
- Verifikation: Element-H-Raum in Hubs lädt den H-Raum (nicht die Fair).

### C. Auffindbarkeit (`chemie-lernen.org`)

- **Neue Verzeichnis-Seite** `/chemie-raeume/` (oder `/lernraeume/`): Grid aller
  Elemente; jede Kachel → dessen Raum (Hubs-Deep-Link + App-Link). Das ist der
  Lerner-Einstieg, der „jedes Element hat einen eigenen Raum" garantiert.
- Einbinden aus Periodensystem-Seiten + Themenbereichen + `hubs-promo-widget`.
- `lernraeume-in-hubs.md` + Widget aktualisieren (generischen Fair-Link durch
  Verzeichnis/Pro-Element ersetzen).

## Nicht im Scope

- Native Hubs/Spoke-Szenen pro Element (wir embedden die bestehende WebXR-App,
  bauen keine parallele Szenen-Welt).
- Änderungen am Hubs-Server-Code selbst (nur Embed-URLs/Raum-Metadaten via API
  oder Manifest).

## Abhängigkeit (user/secrets)

Das **Anlegen der echten Hubs-Räume** auf `hubs.chemie-lernen.org` braucht
Hubs-Server-Zugriff/API-Credentials (nicht in diesen Repos). Falls vorhanden:
Script in Task 4.3. Falls nicht: Manifest + manuelle Schritte, vom User auf
dem Hubs-Server angewendet. Die App-Härtung (A) und das Verzeichnis (C) sind
voll aus diesen Repos lieferbar und allein schon die Korrektur der
„Fair"-Umleitung (App-Raum statt Hubs-Fair).
