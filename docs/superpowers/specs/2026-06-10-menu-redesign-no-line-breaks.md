# Menu Redesign — No Line Breaks

**Date**: 2026-06-10
**Status**: Finalized, awaiting implementation

## Problem

The main navigation has 12 top-level items (5 dropdown groups + 7 standalone links) that overflow the navbar width, causing items to wrap to a second line. The site uses Bootstrap 3 navbar with flexbox overrides.

## Solution: Consolidate Standalone Items Into "Mehr" Dropdown

Move Forschung, Roadmap, and Unterstützen into a new "Mehr" dropdown, reducing top-level items from 12 → 8 + search form. This fits comfortably on one line on desktop (≥992px).

### Menu Structure Change

**Before** (12 top-level):

```
Themenbereiche | KI-Assistent | Wissensnetz | Rechner▾ | Simulationen▾ | Visualisierungen▾ | Lehrende▾ | Forschung | Roadmap | Unterstützen
```

**After** (8 top-level):

```
Themenbereiche | KI-Assistent | Wissensnetz | Rechner▾ | Simulationen▾ | Visualisierungen▾ | Lehrende▾ | Mehr▾
```

Where "Mehr▾" contains:
→ Forschung
→ Roadmap
→ Unterstützen

## Implementation

### 1. config.toml — Menu Definition

Move these three standalone entries under a new `menu.main` entry with `identifier = "mehr"`:

```toml
[[menu.main]]
    name = "Mehr"
    url = "#"
    weight = 95
    identifier = "mehr"
    icon = "📌"

[[menu.main]]
    name = "Forschung"
    url = "/posts/"
    parent = "mehr"
    weight = 91

[[menu.main]]
    name = "Roadmap"
    url = "/pages/roadmap/"
    parent = "mehr"
    weight = 92

[[menu.main]]
    name = "Unterstützen"
    url = "/unterstuetzen/"
    parent = "mehr"
    weight = 93
```

### 2. header.html — No Changes

The template already handles menus generically — parent entries with `identifier` and `url = "#"` plus `parent` children automatically render as dropdowns. No template changes needed.

### 3. CSS — Prevent Line Breaks

Add to the inline `<style>` block in `header.html` (or `navigation.css` if file is created):

```css
/* Prevent top-level menu items from wrapping */
@media (min-width: 768px) {
  .navbar-nav > li > a {
    white-space: nowrap;
  }
}
```

On screens ≥1200px, 8 items + search will fit with current padding.
On 992–1199px, add responsive font-size reduction if needed:

```css
@media (max-width: 1199px) and (min-width: 992px) {
  .navbar-nav > li > a {
    padding-left: 10px;
    padding-right: 10px;
    font-size: 13px;
  }
  .navbar-form .form-control {
    width: 140px;
  }
}
```

### 4. Resilience: Fallback for Very Narrow Screens

On screens 768–991px where 8 items + search might still be tight, the existing `white-space: nowrap` plus flexbox behavior will naturally cause horizontal scroll rather than multi-line wrap. This is acceptable — the alternative would be to collapse more items which hurts usability.

## No Other Changes

- Mobile menu (<768px): Already works with Bootstrap 3 hamburger collapse. The "Mehr" dropdown will render as a submenu in the collapsed list — the existing JS handles `.dropdown-toggle` clicks on mobile.
- Dropdown child menus: No changes needed. Child items render as before.
- Dark mode: No impact. Existing dark mode CSS applies correctly.
- Search form: Stays in its current position (`.navbar-right`, inside `.navbar-collapse`).

## Acceptance Criteria

1. 8 top-level items fit on one line on screens ≥992px
2. "Mehr" dropdown shows Forschung, Roadmap, Unterstützen as children
3. All existing dropdowns (Rechner, Simulationen, Visualisierungen, Lehrende) work unchanged
4. Mobile hamburger menu works with all items, including "Mehr" submenu
5. Dark mode unaffected
6. No regression in existing functionality
