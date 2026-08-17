# Tasks: per-element-learning-rooms

> Status: implemented (app + directory + manifest + reproducible Hubs script).
> Remaining: live Hubs-room creation needs `HUB_API_TOKEN` (Task 4.3/4.4).

## 1. App — robuste + aliasierte Tiefverlinkung (`hello-webxr-master`)

- [x] 1.1 `mount.ts`: `?room=<SYMBOL>` (wie bisher) + Alias `?element=<SYMBOL>` + `?group=<GRUPPE>`; Symbol case-normalisiert (`toUpperCase`).
- [x] 1.2 Unbekanntes Symbol/Gruppe: nicht mehr still `ROOM_LOBBY`, sondern `ROOM_PERIODIC_PAVILION` + `pse:room-not-found`-Event + Banner im Pavilion.
- [x] 1.3 Regression-Logik via `tsc`/Build + `chemie-raeume.test.js` (render); Deep-Link-Pfad im Code geprüft.
- [x] 1.4 Build (`tsc --noEmit && vite build`) grün; Image rebuild + Container restart auf Host.

## 2. App — Theme- + Daten-Vollständigkeit (121 Elemente)

- [x] 2.1 Audit: alle 44 verwendeten `element.theme` sind in `THEMES` definiert (kein stiller Fallback).
- [x] 2.2 Spezifische Themen (`cosmic`, `solar`, `nuclear`, `forge`, …) alle vorhanden.
- [ ] 2.3 Pflichtfelder `description`/`color`/`group`: größtenteils vorhanden, Rest bei Bedarf nachfüllen.
- [ ] 2.4 `experiments`/Trivia für Lücken (Lanthanoide/Actinoide/synthetisch) nachrüsten.
- [ ] 2.5 Dedizierter Unit-Test für Theme-Coverage (Audit bisher als Ad-hoc-Skript).

## 3. App — Lerner-Navigation + UX-Politur

- [x] 3.1 `Lobby` → „→ Periodensystem"-Eintrag (ROOM_PERIODIC_PAVILION); `ElementRoom` → „→ Periodensystem"-Button. Keine Sackgasse mehr.
- [x] 3.2 Konsistenz: Partikel/Theme pro Raum; Admin-Override wirkt weiter.
- [ ] 3.3 Barrierefreiheit: Labels vorhanden; Audio-Cue pro Element optional offen.
- [x] 3.4 `exitRoom` disposed (bestehend); keine Leaks bei 121 Räumen.

## 4. Hubs — pro Element ein Raum (`chemie-lernen.org` + Hubs)

- [x] 4.1 Kanonische Embed-URL: `https://tobias-weiss.org/hello-webxr/?room=<SYMBOL>`.
- [x] 4.2 Manifest generiert `myhugoapp/static/data/chemie-raeume-manifest.json` (120 Elemente) via `scripts/generate-chemie-raeume-manifest.mjs`.
- [x] 4.3 `scripts/create-hubs-element-rooms.mjs`: `list` (reproducible, keine Creds) + `create` (env `HUB_API_TOKEN`, idempotent, schreibt `hubRoomUrl` zurück).
- [ ] 4.4 Live-Verifikation: Hubs-Räume anlegen sobald `HUB_API_TOKEN` vorhanden (behebt „H room → fair").

## 5. Auffindbarkeit — Verzeichnis (`chemie-lernen.org`)

- [x] 5.1 Neue Seite `/chemie-raeume/`: Layout + `chemie-raeume.js` rendert Manifest-Grid (Symbol-Farbe nach Gruppe), jede Kachel → `roomUrl`.
- [x] 5.2 Einbinden: `hubs-promo-widget.html` (Button „Elementräume entdecken"), Periodensystem-Seiten, Themenbereiche.
- [x] 5.3 `lernraeume-in-hubs.md` + Widget aktualisiert (generischer Fair-Link → Verzeichnis/Pro-Element).

## 6. Tests + Deploy

- [x] 6.1 `tests/chemie-raeume.test.js` (render + escape) + `tests/quiz-integration.test.js` (Rechner↔Quiz-Mapping, Fallback).
- [x] 6.2 `npm test` (neue Tests grün); `hugo --minify` + `vite build` grün.
- [ ] 6.3 Live-Check: `/chemie-raeume/` erreichbar; `?room=H` zeigt H-Raum (thema cosmic), nicht Fair.
