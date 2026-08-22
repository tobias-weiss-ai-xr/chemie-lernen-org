# Proposal: Accessibility Theme Switcher + Forschung background fix

## Problem

- The `Chemie-Forschung` (research) listing renders with a **stark white background** that
  clashes with the otherwise green/dark identity of chemie-lernen.org. Root cause: the site has
  **no explicit "light" theme** — `custom.css` sets `--card-bg:#ffffff` and several components hard-code
  `background:#fff`, while `dark-mode.css` only overrides these for `[data-theme='dark']`. Light mode is
  just unstyled Bootstrap white.
- The only control is a single `#theme-toggle` button that flips between **dark** and **unstyled-white**
  (`dark-mode.js` removes the `data-theme` attribute for "light"). Learners cannot pick an
  accessibility-compliant scheme.
- The Forschung listing uses `col-md-4 card` tiles; with 4 items this wraps awkwardly (3 + 1). The user
  wants **4 tiles laid out as a 2×2 matrix**.

## Goal

Give learners a small, accessible **theme chooser with 3 WCAG-compliant themes**, fix the Forschung
white-background by making every theme explicitly defined (no stark white), and lay out 4 Forschung
tiles as 2×2.

## Proposed themes (3, accessibility-compliant)

1. **Hell (Light)** — AA. Warm off-white background (not pure `#fff`), near-black navy text,
   chemie-blue accent. Contrast ≥ 4.5:1 for body text.
2. **Dunkel (Dark)** — AA. The existing greenish dark theme (`dark-mode.css`), refined for consistent
   contrast (text ≥ 4.5:1).
3. **Hoher Kontrast (High-Contrast)** — AAA. Pure black background, pure white text, bright yellow
   accent, underlined links, thick visible focus rings. Contrast ≥ 7:1.

## Scope

- In scope: CSS variable themes (`[data-theme='light'|'dark'|'contrast']`), Forschung background fix,
  3-option accessible chooser in the header, FOUC-safe init, 2×2 tile layout for 4 Forschung items.
- Out of scope (this change): per-component theming of every interactive calculator/reactor visual
  (those keep their own colours); featuring Siggi's videos on the landing page (separate concern).

## Non-goals

- No new visual identity — we reuse the existing chemie palette (blue `#1e63b3`, gold `#e0a82e`,
  green `#388e3c`) and the greenish dark theme already present.
