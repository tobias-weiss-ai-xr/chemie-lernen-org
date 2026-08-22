# Design: per-element-learning-rooms

## Context

Zwei Repos sind beteiligt:

- **`hello-webxr-master`** (Babylon.js WebXR-App „Chemie Räume"): liefert den
  pro-Element-Raum (`ElementRoom`) inkl. Theme, Partikeln, Trivia, Experimenten.
  Embeddable in Hubs (Hubs kann Web-Inhalte einbetten).
- **`hugo-chemie-lernen-org`** (chemie-lernen.org): Dokumentation, Hubs-Widget,
  künftig das Element-Raum-Verzeichnis.

Aktuelle Raum-Architektur (`embed/mount.ts`):

- `ROOM_LOBBY = 0`, `ROOM_ELEMENTS_START = 1`, `ROOM_PERIODIC_PAVILION = 128`,
  `ROOM_EXP_START = ROOM_ELEMENTS_END + 1`.
- `mount()` liest `roomName = options.startRoom || urlParams.get('room')`;
  Element-Symbol → `ROOM_ELEMENTS_START + index`. Unbekanntes Symbol → bleibt
  `ROOM_LOBBY` (die „Fair"). **Das ist die Umleitung.**
- `PeriodicPavilion.onElementClick` setzt `ctx.goto = elementIndex + 1` →
  ElementRaum (Nav in-app ok).

## Architektur-Entscheidung

**Die WebXR-App ist der kanonische „Lernraum" pro Element.** Hubs-Räume
betten die App tiefverlinkt ein (`?room=<SYMBOL>`). Damit entsteht pro Element
ein eigener Hubs-Raum, ohne eine parallele Szenen-Welt zu bauen.

### Deep-Link-Konvention (App)

`mount.ts` akzeptiert (case-insensitiv, normalisiert):

- `?room=H` / `?element=H` → ElementRaum von H.
- `?group=alkali` → erstes Element der Gruppe bzw. Pavilion mit Gruppenfilter.
- Unbekanntes Symbol → `ROOM_PERIODIC_PAVILION` + Freundlichkeits-Overlay
  „Element ‹X› nicht gefunden — wähle im Periodensystem", Event
  `pse:room-not-found`. **Kein** stiller Lobby-Redirect mehr.

### Theme-/Daten-Audit (App)

- Skript/Test, der für jedes der 121 `ELEMENTS` prüft: `element.theme` ist in
  `THEMES` definiert ODER es greift bewusst der Gruppen-Fallback. Fehlende
  spezifische Themen (z. B. `aerospace`, `biological`, `gem`, `volcano`,
  `welding`, …) werden in `themes.ts` als echte `makeTheme(...)`-Einträge
  angelegt (Farbe + Partikeltyp + Ambience), statt still auf Gruppe zu fallen.
- Jedes Element: `description` + `color` + `group` Pflicht. `experiments`/
  Trivia nachrüsten, wo leer (Schwerpunkt Lanthanoide/Actinoide/synthetisch).

### Hubs-Embed + Manifest (chemie-lernen.org)

- Kanonische Embed-URL: `<APP_BASE_URL>?room=<SYMBOL>` (APP_BASE_URL = deployte
  App-URL, z. B. Subdomain/PFAD — im Plan als Platzhalter, zur Deploy-Zeit
  befüllen).
- `static/data/chemie-raeume-manifest.json`:
  `{ "elements": [ { "symbol", "name", "group", "roomUrl": "<APP_BASE_URL>?room=<SYMBOL>", "hubsRoomUrl": "<HUB_ROOM>"|null } ] }`
  wird aus `ELEMENTS` generiert (Script in `hello-webxr-master` oder
  `chemie-lernen.org/scripts`).
- Hubs-Räume: falls Hubs-API+Creds → Script erzeugt/aktualisiert pro Element
  einen Hubs-Raum, dessen Embed die korrekte `?room=<SYMBOL>`-URL nutzt. Sonst:
  Manifest + dokumentierte manuelle Schritte (`lernraeume-in-hubs.md`).

### Verzeichnis-Seite (chemie-lernen.org)

- Neue Seite `/chemie-raeume/` (Layout `chemie-raeume.html`, JS
  `chemie-raeume.js`): lädt das Manifest, rendert ein responsives Grid aller
  Elemente (Symbol-Farbe aus `GROUP_COLORS`), jede Kachel verlinkt auf
  `roomUrl` (App) und — falls vorhanden — `hubsRoomUrl` (Hubs).
- Einbindung: Periodensystem-Seiten (`perioden-system-der-elemente.html`),
  Themenbereiche, `hubs-promo-widget.html` (Button „Elementräume entdecken" →
  `/chemie-raeume/` statt nur Fair).
- `lernraeume-in-hubs.md` erwähnt pro-Element-Räume + Verzeichnis.

## UX-Prinzipien („gute Lernerfahrung")

- **Keine Sackgassen**: jeder ElementRaum hat „→ Periodensystem" +
  „EXIT → Lobby".
- **Konsistenz**: gleiches UI/Particle/Theme-System pro Raum; Admin-Override
  wirkt live weiter.
- **Auffindbarkeit**: Verzeichnis ist der Einstieg; von dort kommt jeder Lerner
  direkt in den Raum seines Elements.
- **Robustheit**: unbekannter Link → klare Meldung, nicht die Fair.
- **Performance**: Räume werden lazy pro `setupRoom` gebaut und bei `exitRoom`
  disposed (bereits so) — bei 121 Elementen kein Massen-Aufbau.

## Risiken

- Hubs-Raum-Anlage braucht Server-Creds (Abhängigkeit, siehe proposal.md).
- APP_BASE_URL muss zum Deploy-Zeitpunkt korrekt sein (sonst Embed bricht).
- Sehr alte/synthetische Elemente haben wenig Inhalt → Trivia/Experimente
  müssen sinnvoll generisch fallbacken (Gruppen-Info), nicht leer bleiben.
