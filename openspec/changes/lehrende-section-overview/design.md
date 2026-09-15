# Lehrende-Überblick — Design

## Layout-Strategie

Dediziertes Seiten-Layout `myhugoapp/layouts/_default/lehrende.html`
(angebunden via `layout: "lehrende"` im `_index.md`-Frontmatter), analog zum
bestätigten `curricula-index`-Muster. Liefert die `css`- und `main`-Blocks
von `baseof.html`.

## Struktur des Layouts

1. **`define "css"`**: Theme-bewusste CSS-Variablen `--card-bg`/`--card-border`
   mit Light- (weiß), Dark- (`#2b2b2b`) und Contrast-Zwillingen (`#000`/weiß/
   gelb). Cards als responsives Grid (`repeat(auto-fill, minmax(260px,1fr))`),
   Tools-Reihe kompakter (horizontal).
2. **`define "main"`**:
   - `.lehrende-hero` (`.Title` + `.Params.subtitle`)
   - `{{ .Content }}` (Intro aus `_index.md`)
   - **„Didaktische Grundlagen“**: `range sort .Sections "Params.weight"` +
     `range .RegularPages` (fängt `mayers-prinzipien`).
   - **„Werkzeuge für Lehrkräfte“** (`id="werkzeuge"`): iteriert `site.Menus.main`,
     findet den Eintrag `eq .Name "Lehrende"` und rendert dessen `.Children`.

> **Hugo-Menü-Falle:** Mit `where site.Menus.main.ByWeight "Parent" "lehrende"`
> matcht nichts, weil Menü-Kinder in Hugo **genestet** unter `.Children` liegen,
> nicht als Top-Level mit `.Parent`. Korrekt ist das verschachtelte
> `range site.Menus.main → if eq .Name "Lehrende" → range .Children`.
> Zudem haben MenuEntry-Kinder **kein** `.Icon`/`.Params`-Feld in dieser
> Hugo-Version — daher statisches Fallback-Icon `🔧`.

## Split-Dropdown (Header)

`layouts/partials/header.html`, Branch `{{ if .HasChildren }}`:

- `{{ if ne .URL "#" }}` → neuer Split-Branch:
  - `<a href="{{ .URL }}" class="dropdown-label" aria-label="{{ .Name }}">`
  - `<a href="#" class="dropdown-toggle dropdown-caret" role="button"
aria-haspopup="true" aria-expanded="false" aria-label="{{ .Name }} Menü anzeigen">`
    - Submenü (Kinder + ggf. `dropdown-submenu`).
- `{{ else }}` → bisheriger `<a href="#" class="dropdown-toggle">`-Branch
  (unverändert für Interaktiv/Mehr/Rechner).

CSS in `static/css/site-chrome.css` (vor `/* Dropdown menu styling */`):
flex-float für `.dropdown-label`/`.dropdown-caret` mit
992–1199px-Medienquery zur Padding-Balance.

## Content-Relokalisierung (nichts löschen)

Original-`_index.md` via `git show HEAD:` aus dem Git-Verlauf gerettet
(`/tmp/lehrende-index.orig.md`); schwere Blöcke verschoben:

- **Lesson-Plans (3 Stundenentwürfe)** + **Kognitive Psychologie** →
  `lehrende/didaktische-methoden/_index.md`.
- **Neutralisations-Arbeitsblatt** + **20-Punkte-Bewertungsmatrix** →
  `lehrende/materialien-und-vorbereitung/_index.md`.
- **Rechner-nach-Jahrgangstufe-Tabelle** verworfen als Duplikat
  (bereits in `medien-didaktik` vorhanden).
- Neuer `_index.md` = schlanker Hub mit Einstiegs-Links.

## Zusammengefasste Änderungen

| Datei                                                     | Rolle                                    |
| --------------------------------------------------------- | ---------------------------------------- |
| `layouts/_default/lehrende.html`                          | NEU — overview Layout (css+main)         |
| `content/lehrende/_index.md`                              | lean Hub, `layout: lehrende`, `subtitle` |
| `layouts/partials/header.html`                            | Split-Dropdown-Branch                    |
| `static/css/site-chrome.css`                              | Split-Dropdown-CSS + Contrast            |
| `content/lehrende/didaktische-methoden/_index.md`         | relokalisierte Inhalte                   |
| `content/lehrende/materialien-und-vorbereitung/_index.md` | relokalisierte Inhalte                   |
