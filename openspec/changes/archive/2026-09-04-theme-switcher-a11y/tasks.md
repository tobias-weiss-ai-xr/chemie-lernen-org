# Tasks: theme-switcher-a11y

## Spec & design

- [x] OpenSpec change + proposal (problem: Forschung white bg, only dark/white toggle)
- [x] Design (3 themes via CSS vars, Forschung fix, chooser UI, FOUC init, 2×2 tiles)

## CSS themes

- [x] Add explicit light theme to `custom.css` `:root` (warm off-white, not pure `#fff`);
      define `[data-theme='light']`, `[data-theme='dark']` (refine), `[data-theme='contrast']`
- [x] Repoint `--card-bg` / `--bg-primary` in `:root` to light-theme values
- [x] Replaced hard-coded `background:#fff` usages with `var(--card-bg)` / `var(--bg-primary)`
      (light-theme page-chrome block: body/card/panel/well/list-group/table/form-control)
- [x] Add `[data-theme='contrast']` block (WCAG AAA black/yellow) mirroring dark-mode fixes
- [x] Contrast ratios: Light AA, Dark AA, Contrast AAA (black #000 bg / #fff text ≈ 21:1, yellow #ff0 accents)

## Forschung background fix

- [x] Forschung `.card` / `.panel` / `.panel-body` / `.panel-title` use theme variables in all 3 themes
      (light via `custom.css` `:root`/`[data-theme='light']`; dark + contrast via `dark-mode.css`)
- [x] Build + check: Forschung listing no longer stark white under Light theme (warm `--bg-primary:#f4f2ec`)

## Theme chooser

- [x] Replace `#theme-toggle` button in `header.html` with accessible 3-option radiogroup
      (Hell / Dunkel / Kontrast), `role=radiogroup`, native radios (keyboard + SR), focus ring
- [x] Rewrite `dark-mode.js` → `theme-switcher.js`: set `data-theme` for light|dark|contrast,
      persist `localStorage.theme`, sync radios; removed obsolete `dark-mode.js`
- [x] `baseof.html`: inline FOUC script in `<head>` applying saved/default theme pre-paint;
      swap script src to `theme-switcher.js`; updated `config.toml` + `sw.js` precache refs

## 2×2 tile layout

- [x] Forschung `chemie-forschung.html` + `posts.html`: 4 tiles → 2×2 (`col-sm-6 col-md-6`);
      Forschung has exactly 4 posts → true 2×2 matrix

## Verify

- [x] `hugo` build succeeds (no template errors) — built to temp dest, 2322 pages OK
- [x] Generated output check: FOUC script present, radiogroup present, `theme-switcher.js` linked,
      `col-sm-6 col-md-6 card` ×4 on Forschung, 0 stale `dark-mode.js` references
- [x] `node --check` on `theme-switcher.js` passes
- [ ] (optional) Lighthouse a11y pass on Forschung + home

## Notes

- Default theme = `dark` (preserves existing appearance for returning visitors; FOUC sets `data-theme`
  before first paint so no light-flash).
- `dark-mode.css` stylesheet is KEPT (now holds both dark + contrast variants); only the old JS was removed.
