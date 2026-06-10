# Menu Redesign — No Line Breaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce top-level menu items from 12 to 8 by consolidating Forschung, Roadmap, Unterstützen into a "Mehr" dropdown. Apply `white-space: nowrap` to prevent line breaks.

**Architecture:** Pure Hugo config + CSS change. The template (`header.html`) already renders dropdowns generically from `menu.main` — only `config.toml` and inline CSS need changes.

**Tech Stack:** Hugo (config.toml), Bootstrap 3 navbar, CSS

---

### Task 1: Consolidate Standalones into "Mehr" Dropdown

**Files:**
- Modify: `myhugoapp/config.toml:366-380` (current standalone entries)

- [ ] **Step 1: Add "Mehr" parent entry before Forschung**

Replace the standalone Forschung, Roadmap, Unterstützen entries with a grouped "Mehr" dropdown.

In `config.toml`, replace lines 366-380:

Old:
```toml
# ── Allgemeine Seiten ────────────────────────────────
[[menu.main]]
    name = "Forschung"
    url = "/posts/"
    weight = 90
    icon = "📰"
[[menu.main]]
    name = "Roadmap"
    url = "/pages/roadmap/"
    weight = 95
[[menu.main]]
    name = "Unterstützen"
    url = "/unterstuetzen/"
    weight = 100
    icon = "❤️"
```

New:
```toml
# ── Allgemeine Seiten ────────────────────────────────
[[menu.main]]
    name = "Mehr"
    url = "#"
    weight = 90
    identifier = "mehr"
    icon = "📌"

[[menu.main]]
    name = "Forschung"
    url = "/posts/"
    parent = "mehr"
    weight = 91
    icon = "📰"
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
    icon = "❤️"
```

- [ ] **Step 2: Verify config.toml is valid**

Run: `head -n 390 myhugoapp/config.toml | tail -30`
Expected: Shows the new "Mehr" block with Forschung/Roadmap/Unterstützen as children

---

### Task 2: CSS — Prevent Menu Line Breaks

**Files:**
- Modify: `myhugoapp/layouts/partials/header.html:105-124` (inline `<style>` block)

- [ ] **Step 1: Add white-space: nowrap to desktop navbar items**

In `myhugoapp/layouts/partials/header.html`, inside the existing `@media (min-width: 768px)` block (lines 106-124), add `white-space: nowrap` to `.navbar-nav > li > a`:

Current block (lines 106-124):
```css
@media (min-width: 768px) {
  .navbar-collapse {
    display: flex !important;
    align-items: center;
    width: 100%;
  }

  .navbar-nav {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .navbar-form {
    display: flex;
    align-items: center;
    margin: 0;
  }
}
```

Replace with:
```css
@media (min-width: 768px) {
  .navbar-collapse {
    display: flex !important;
    align-items: center;
    width: 100%;
  }

  .navbar-nav {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .navbar-nav > li > a {
    white-space: nowrap;
  }

  .navbar-form {
    display: flex;
    align-items: center;
    margin: 0;
  }
}
```

- [ ] **Step 2: Add responsive padding for medium screens**

Add after the closing `}` of the `@media (min-width: 768px)` block (after line 124):

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

---

### Task 3: Verify

- [ ] **Step 1: Build the site**

Run: `cd myhugoapp && hugo --minify 2>&1 | tail -5`
Expected: Build succeeds (exit 0), no errors

- [ ] **Step 2: Check rendered menu in output**

Run: `grep -A5 'Mehr' public/index.html | head -20`
Expected: "Mehr" appears in the navigation with `<a href="#" class="dropdown-toggle" ...>`

- [ ] **Step 3: Verify no CSS regression**

Run: `node -e "const fs=require('fs'); const css=fs.readFileSync('public/index.html','utf8'); const hasNowrap=css.includes('white-space: nowrap'); console.log(hasNowrap ? 'OK: nowrap found' : 'FAIL: nowrap missing');"`
Expected: "OK: nowrap found"

---

### Task 4: Commit

- [ ] **Step 1: Commit**

```bash
git add myhugoapp/config.toml myhugoapp/layouts/partials/header.html docs/superpowers/specs/2026-06-10-menu-redesign-no-line-breaks.md docs/superpowers/plans/2026-06-10-menu-redesign-no-line-breaks.md
git commit -m "refactor: consolidate menu standalones into Mehr dropdown

- Reduce top-level nav from 12 to 8 items
- Forschung, Roadmap, Unterstützen grouped under 'Mehr' dropdown
- white-space: nowrap on navbar items to prevent line breaks
- Responsive padding/font adjustment for 992-1199px screens"
```
