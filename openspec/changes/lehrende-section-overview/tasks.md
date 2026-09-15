# Lehrende-Überblick — Tasks

## Implementierung

- [x] **T1** `_default/lehrende.html` Layout mit `css`- (theme-aware cards,
      Dark-/Contrast-Twins) und `main`-Block (hero, `.Content`,
      Didaktik-Grid, Tools-Grid) erstellen.
- [x] **T2** `_index.md` auf `layout: lehrende` umstellen und als schlanken
      Hub (Intro + Einstiegs-Links) umschreiben.
- [x] **T3** Prognose-Child-Icon-Fallback implementieren (MenuEntry hat kein
      `.Icon`); Tools-Karten aus verschachteltem `.Children` des
      „Lehrende“-Menüpunkts rendern.
- [x] **T4** Split-Dropdown in `header.html` (URL-Label navigiert, Caret
      togglet; `url="#"`-Branch unverändert) + CSS in `site-chrome.css`.
- [x] **T5** Deep-Content-Blöcke aus dem Index in Subsections relokalisieren
      (Lesson-Plans, Kognitive Psychologie → `didaktische-methoden`;
      Arbeitsblatt, 20-pt-Matrix → `materialien-und-vorbereitung`).

## Verifikation

- [x] **V1** Hugo-Build grün; `/lehrende/` rendert hero + 5 Didaktik-Cards +
      9 Tools-Cards (14 Cards).
- [x] **V2** Split-Dropdown: Label → `/lehrende/`, Caret öffnet Submenü;
      Interaktiv/Mehr behalten Single-Toggle; Mobile-Nav funktioniert.
- [x] **V3** Kontrast der Cards in Light/Dark/Contrast ≥ AA
      (Didaktik 6.80/8.39/21.00 : 1).
- [x] **V4** Tests: `site-structure`, `contrast-nav`, `contrast-rendered`,
      `ux-rendered`, `mobile-rendered`, `dropdown-init`,
      `auth-client-init-nav` grün.

## Deployment

- [x] **D1** Commit `17ad273a` (deutsch/conventional), Push, Deploy `34942755934` success; Live-Verify der `/lehrende/`-Übersicht in Produktion grün (14 Cards: 5 Didaktik + 9 Tools, Split-Dropdown, Kontrast light 6.80/dark 8.39/contrast 21.00 : 1).
