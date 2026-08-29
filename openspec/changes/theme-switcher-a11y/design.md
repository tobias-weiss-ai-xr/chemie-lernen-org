# Design: Accessibility Theme Switcher

## 1. CSS variable architecture

Centralise all surface/text colours behind CSS custom properties. Three theme scopes set the same
variable names; components reference only the variables (never hard-coded colours).

```
:root, [data-theme='light'] {            /* explicit light theme (no stark white) */
  --bg-primary:   #f6f4ee;              /* warm off-white */
  --bg-secondary: #efece4;
  --card-bg:      #ffffff;
  --text-primary: #16202e;              /* near-black navy */
  --text-secondary:#46505f;
  --text-muted:   #6b7280;
  --border-color: #d9d4c8;
  --accent-color: #1e63b3;              /* chemie blue */
  --accent-hover: #15529a;
  --navbar-bg:    #f6f4ee;
  --footer-bg:    #efece4;
  --input-bg:     #ffffff;
  --code-bg:      #f2efe9;
  --table-bg:     #ffffff;
  --table-hover:  #efece4;
  --shadow:       rgba(20,30,40,0.12);
  color-scheme: light;
}
[data-theme='dark'] {                    /* existing greenish dark theme, kept */
  --bg-primary:#0a1a0f; --bg-secondary:#0d2a1a; --card-bg:#0d2a1a;
  --text-primary:#c8e6c9; --text-secondary:#a5d6a7; --text-muted:#81c784;
  --border-color:#1b5e20; --accent-color:#4caf50; --accent-hover:#66bb6a;
  --navbar-bg:#0a1a0f; --footer-bg:#0a1a0f; --input-bg:#123d25; --code-bg:#0d2a1a;
  --table-bg:#0d2a1a; --table-hover:#123d25; --shadow:rgba(0,50,0,0.3);
  color-scheme: dark;
}
[data-theme='contrast'] {                /* AAA high-contrast */
  --bg-primary:#000000; --bg-secondary:#000000; --card-bg:#0a0a0a;
  --text-primary:#ffffff; --text-secondary:#ffffff; --text-muted:#e6e6e6;
  --border-color:#ffffff; --accent-color:#ffd400; --accent-hover:#ffe34d;
  --navbar-bg:#000000; --footer-bg:#000000; --input-bg:#000000; --code-bg:#0a0a0a;
  --table-bg:#0a0a0a; --table-hover:#1a1a1a; --shadow:none;
  color-scheme: dark;
}
```

Contrast checks (target): Light text `#16202e` on `#f6f4ee` ≈ 13:1; Dark `#c8e6c9` on `#0a1a0f` ≈ 11:1;
Contrast `#ffffff` on `#000000` = 21:1, accent `#ffd400` on `#000000` ≈ 19:1. All meet AA (≥4.5) and
Contrast meets AAA (≥7). Links in contrast theme get `text-decoration:underline`.

## 2. Forschung white-background fix

- In `static/css/custom.css`: keep the `:root` block but repoint its values to the light theme above
  (so the _default_ light mode is the warm off-white, never pure white). Replace the current
  `--card-bg:#ffffff` / `--bg-primary:#f8f9fa` with the new light values.
- Replace the three hard-coded `background:#fff` (custom.css lines ~154, 555; and `#fff3f0` at 614) with
  `var(--card-bg)` / `var(--bg-secondary)`.
- The Forschung templates already use `.card`, `.panel`, `.panel-default`, `.panel-body`, `.panel-title`.
  Ensure those use the variables in both light (custom.css) and dark (`dark-mode.css` already does; add a
  `[data-theme='contrast']` block mirroring the dark block). The `.panel` fixes already use `!important`
  in dark-mode.css — replicate for contrast.
- Forschung thumbnail gradient placeholders (teal/purple) are decorative (emoji + `aria-hidden`); leave as-is
  (white text on the gradient passes for large decorative text). Optional: darken gradient slightly for AA.

## 3. Theme chooser UI (header)

Replace the single `#theme-toggle` button in `layouts/partials/header.html` with an accessible 3-option
control. Recommended: a `role="radiogroup"` with three `<button role="radio">` segments
(Hell / Dunkel / Kontrast), each `aria-checked`, keyboard arrow-navigable, with a visible focus ring and a
group `aria-label="Farbschema wählen"`. (A labelled `<select>` is an acceptable simpler alternative.)

## 4. FOUC-safe initialisation

- Add a tiny **inline** script in `<head>` of `layouts/_default/baseof.html` (before CSS paint) that reads
  `localStorage.theme` (values `light|dark|contrast`) and sets `document.documentElement.dataset.theme`
  (default `light` if unset, or honour `prefers-color-scheme` on first visit). This prevents a flash of the
  wrong scheme.
- Extend/replace `static/js/dark-mode.js` → `static/js/theme-switcher.js`: set `data-theme` for all three
  values (no longer _remove_ the attribute for light), persist choice, update `aria-checked`/`title`, and
  reflect the saved selection on load. Keep the same `localStorage` key (`theme`) for continuity.
- Update `baseof.html` script tag to load `theme-switcher.js` instead of `dark-mode.js`.

## 5. 2×2 tile layout for 4 Forschung items

In `layouts/section/chemie-forschung.html` (and `posts.html`), change the tile wrapper from Bootstrap
`col-md-4` (3-up) to a responsive grid that yields **2 columns when there are exactly 4 tiles**:

- Use `col-sm-6 col-md-6` on the tile (2 per row ≥ small screens → 4 items = 2×2). On large screens this
  stays 2-up (acceptable for a research overview); if a wider 4-up is ever wanted it can be revisited.
- Keep `pack`/`card` classes; they already carry hover/animation styling. Ensure `gap`/spacing looks right
  at 2 columns.
- Interpretation note: "4 tiles" = the Forschung article cards. If the user meant a different tile group,
  this rule is trivially portable (same CSS class).

## 6. Accessibility details

- All three themes meet their stated WCAG level; verify with a quick axe/Lighthouse pass after build.
- Chooser: keyboard operable, `:focus-visible` outline (3px in contrast theme), `aria-checked` state,
  label in German.
- Respect `prefers-reduced-motion` (existing `a11y-reduced-motion.css`); keep theme transitions ≤0.3s.
- `color-scheme` per theme so native scrollbars/inputs match.

## 7. Files touched

- `static/css/custom.css` (`:root` light values; replace hard-coded `#fff`)
- `static/css/dark-mode.css` → keep, plus add `[data-theme='contrast']` block (or new `contrast-theme.css`)
- `static/js/dark-mode.js` → `static/js/theme-switcher.js`
- `layouts/partials/header.html` (chooser)
- `layouts/_default/baseof.html` (inline FOUC script; script src)
- `layouts/section/chemie-forschung.html`, `layouts/section/posts.html` (2×2 tiles)
