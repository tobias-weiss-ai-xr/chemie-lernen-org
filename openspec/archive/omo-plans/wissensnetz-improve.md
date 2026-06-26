# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

# wissensnetz-improve - Work Plan

## TL;DR (For humans)

**What you'll get:** The Wissensnetz (chemistry knowledge graph) gets a comprehensive overhaul: entity detail pages load faster because they're server-rendered with pre-loaded data instead of fetching from the API; the card grid looks cleaner with smoother animations and hover effects; search is more responsive (debounced, clearable) and keyboard-navigable; tooltips work better; dark mode is more polished; screen readers and keyboard users get proper ARIA labels and focus management; entity pages include JSON-LD structured data for search engines.

**Why this approach:** We work in layers from the data layer outward — fix content matching and performance first (foundation), then visual and UX polish (surface), then accessibility and SEO (reach). SSR for entity detail pages eliminates the API round-trip for the most common entity page loads while keeping the interactive graph client-side. No new build tools, no ESM migration, no new dependencies.

**What it will NOT do:** No ESM/build tool migration. No new pages or routes. No changes to the Neo4j API. No virtual scrolling. No i18n changes. No changes to the curricula/lehrplan features. The interactive full Wissensnetz graph page stays CDN-based for d3.

**Effort:** Large (6 areas, 12-14 todos)
**Risk:** Low - incremental changes to existing patterns; SSR touches build pipeline but is additive (falls back to client-side rendering if data is missing)
**Decisions to sanity-check:** SSR approach (inject data at build time via Hugo data files vs. pre-rendered HTML); d3 bundling strategy for ego graph

Your next move: Approve the plan so execution begins. Full execution detail follows below.

---

> TL;DR (machine): Large effort, low risk. 6 improvement areas executed sequentially: (1) content fix, (2) performance, (3) visual redesign, (4) UX, (5) accessibility, (6) SSR/SEO. entity-index.js, entity-index.html, entity/single.html, generate-entity-pages.mjs modified. Tests updated.

## Scope

### Must have

- C1: Visual redesign: modernized card grid (subtle animations, better hover/active states, category color accents, spacing/typography polish), detail page layout polish, loading state transitions, dark mode consistency across all entity elements
- C2: Performance: debounced search input (300ms), local d3-force module for ego graph (no CDN dependency), optimize \_renderImpl to batch DOM updates, add AbortSignal cleanup for kg-data fetch
- C3: UX: clear search button (× icon), keyboard navigation (Escape to clear search, arrow keys in grid), smooth CSS transitions for filter/sort changes, improved tooltip positioning (viewport boundary detection), richer empty states with suggestions
- C4: Content/data quality: fuzzy slug matching for entity detail page (fallback if exact slug not found), show article types and dates in card metadata, better error messages when API fails
- C5: SEO/SSR: server-render entity detail page content (name, category, description, articles list, related entities) from Hugo data files generated at build time; JSON-LD structured data (Schema.org/Thing, CreativeWork for articles); canonical URLs and meta description tags; client JS only for ego graph
- C6: Accessibility: ARIA labels on search (aria-label="Begriff suchen"), sort (aria-label="Sortierung"), filter buttons (aria-pressed), pagination (aria-label="Seite X"), view mode buttons (aria-pressed); focus management on filter/sort changes (move focus to first card or result count); screen reader live region (aria-live="polite") for search results count; minimum color contrast 4.5:1 for all text elements; keyboard-accessible tooltips (focus/blur events matching mouseover/mouseout)

### Must NOT have (guardrails, anti-slop, scope boundaries)

- No ESM module migration (keep IIFE pattern)
- No new npm packages (d3 stays CDN for main graph; local d3-force mini-bundle only for ego graph)
- No Neo4j API changes
- No changes to other pages (curricula, calculators, KI-Assistent remain untouched)
- No virtual scrolling or infinite scroll
- No i18n or language changes
- No new routes or pages

## Verification strategy

- Test decision: tests-after for JS changes; update existing Playwright tests in test-entity-knowledge-graph.spec.js
- Evidence: .omo/evidence/task-\*-wissensnetz-improve.txt
- LSP diagnostics must be clean on all changed JS files
- Pre-commit hook must pass (ESLint + Prettier)

## Execution strategy

### Parallel execution waves

Wave 1 (Todos 1-2): Foundation - content fix + performance improvements (can parallelize)
Wave 2 (Todo 3): Visual redesign (depends on nothing)
Wave 3 (Todo 4): UX improvements (depends on nothing structural)
Wave 4 (Todo 5): Accessibility (depends on visual being stable)
Wave 5 (Todos 6-7): SSR/SEO - build data generation + template rendering (sequential within wave)
Wave 6 (Todo 8): Test updates (parallel with wave 5, depends on waves 1-4 being stable)
Wave 7 (F1-F4): Final verification

### Dependency matrix

| Todo                      | Depends on              | Blocks                                  | Can parallelize with |
| ------------------------- | ----------------------- | --------------------------------------- | -------------------- |
| 1. Content fix            | none                    | none                                    | 2                    |
| 2. Performance            | none                    | none                                    | 1                    |
| 3. Visual redesign        | none                    | none                                    | -                    |
| 4. UX improvements        | none                    | 5 (accessibility touches same elements) | -                    |
| 5. Accessibility          | 3, 4 (visual/UX stable) | none                                    | -                    |
| 6. SSR data generation    | none                    | 7                                       | 1-5                  |
| 7. SSR template rendering | 6                       | none                                    | 8                    |
| 8. Test updates           | 1-5, 7                  | F1-F4                                   | 6-7                  |

## Todos

> Impl + Test = ONE todo.

<!-- APPEND TASK BATCHES BELOW THIS LINE - never rewrite the headers above. -->

### Wave 1: Foundation (Content + Performance)

- [ ] 1. entity-index.js: Improve entity detail slug matching (fuzzy fallback) and enhance card metadata
     What to do:
  1. Modify entity detail page logic (entity/single.html inline `<script>`) to add fuzzy slug fallback: if exact slug match fails, iterate entities and compute Levenshtein-like distance on slugified names, pick the closest match with a warning banner "Meinten Sie: [entity]?"
  1. Add article type badges (Artikel, Rechner, Grundlage) and publication dates to entity card tooltips and detail page article list
  1. Show component count and relation type breakdown in card metadata
     Must NOT do: Do not add npm dependencies. Keep slugify logic consistent with toSlug() in entity-index.js.
     References: entity/single.html:354-367 (slug matching), entity-index.js:125-153 (tooltip HTML), entity-index.js:286-290 (card metadata)
     Acceptance criteria: Typing an entity slug that doesn't exactly match (e.g. /entity/wasserstoff/ instead of /entity/wasserstoff-1/) shows the entity with a "Meinten Sie" hint. Card tooltips show article types. Page renders without console errors.
     QA scenarios:
     Happy: Navigate to exact entity slug → page renders full detail
     Edge: Navigate to approximate slug → fuzzy fallback matches closest entity, shows hint
     Failure: Navigate to non-existent slug → shows "Keine Daten" with sensible message
     Commit: Y | feat(wissensnetz): add fuzzy slug matching and enhanced card metadata

- [ ] 2. entity-index.js + entity/single.html: Performance optimizations
     What to do:
  1. Add debounce (300ms) to search input handler in entity-index.js (currently fires on every keystroke)
  1. Replace d3.v7 CDN in entity/single.html with a tiny local d3-force bundle or inline a minimal force layout (the ego graph uses ~5% of d3's features). Best approach: create myhugoapp/static/js/vendor/d3-force-ego.min.js that re-exports only the force simulation + select/enter/append functions needed. Alternative: implement ego graph as a minimal standalone force simulation without d3 dependency entirely (vanilla JS canvas or SVG).
  1. Add AbortController cleanup for the kg-data fetch in both entity-index.js and entity/single.html (cancel in-flight requests when component unmounts / page navigates away)
  1. In entity-index.js \_renderImpl, batch innerHTML writes into one assignment (already done) and consider requestAnimationFrame for the d3 force simulation start
     Must NOT do: Do not convert to ESM. Do not add npm packages. The d3-force mini bundle should be a standalone pre-minified file.
     References: entity-index.js:386-392 (raw input handler), entity-index.js:26-51 (fetch with AbortSignal.timeout), entity/single.html:540-660 (d3 ego graph), entity-index.js:341-383 (\_renderImpl)
     Acceptance criteria: Search feels responsive (no visible lag on typing). Entity detail page loads without d3 CDN dependency (ego graph renders from local code). Network tab shows no d3js.org requests on entity detail page.
     QA scenarios:
     Happy: Type "säure" rapidly → only one re-render after 300ms
     Happy: Navigate entity detail → ego graph renders, no d3 CDN request in devtools network tab
     Failure: API fetch times out → graceful error message shown, no uncaught rejections
     Commit: Y | perf(wissensnetz): debounce search, local d3-force for ego graph, AbortController cleanup

### Wave 2: Visual Redesign

- [ ] 3. entity-index.html + entity-index.js + entity/single.html: Visual redesign
     What to do:
  1. Card grid improvements (entity-index.html):
     a. Add smooth transition on card hover (scale + shadow: already has translateY(-3px), enhance with a subtle border-color transition matching category color)
     b. Add subtle entrance animation for cards when they appear (CSS animation on .entity-card, staggered via animation-delay using nth-child)
     c. Improve card spacing (increase gap to 1.25rem, add more padding inside cards)
     d. Enhance category badge styling (add icon/emoji before label, make slightly larger)
     e. Add a subtle category color accent to card border-left (not just top)
  1. Detail page polish (entity/single.html):
     a. Improve header card (add subtle shadow, slightly larger title, better description spacing)
     b. Make article list more readable (add type icon, better date formatting, hover background)
     c. Improve tag styling (add subtle shadow, better spacing, category-colored left border)
     d. Add smooth scroll behavior
  1. Loading state transitions:
     a. Add fade-in animation when skeleton disappears and content appears
     b. Add subtle transition when filter/search changes (CSS opacity transition)
  1. Dark mode consistency:
     a. Audit all entity elements for dark mode coverage (currently entity-index.html has inline dark mode at lines 245-293; ensure every element is covered)
     b. Use CSS custom properties where possible for theme colors
     c. Add dark mode support for any missing elements (entity tooltip, skeleton, tag cloud items)
  1. View mode toggle polish:
     a. Improve cloud view tag styling (add hover scale effect, better color matching)
     b. Add icon-only view toggle buttons with accessible labels
     Must NOT do: Do not change the global dark-mode.css variables. Do not introduce a new color palette. All changes stay within the entity pages' inline `<style>` blocks.
     References: entity-index.html:66-148 (cards, grid, tags), entity-index.html:245-293 (dark mode), entity/single.html:33-306 (detail page CSS), entity-index.html:295-302 (mobile)
     Acceptance criteria: Visual inspection shows smooth card animations, consistent dark mode, polished detail page. Lighthouse Performance score does not decrease from current baseline.
     QA scenarios:
     Happy: Load entity index → cards animate in with staggered entrance
     Happy: Toggle dark mode → all elements correctly styled
     Happy: Navigate to entity detail → polished header with proper spacing
     Mobile: View at 375px → cards stack correctly, no overflow
     Commit: Y | style(wissensnetz): redesign card grid, detail page, loading animations, dark mode audit

### Wave 3: UX Improvements

- [ ] 4. entity-index.js + entity-index.html: UX and interactivity improvements
     What to do:
  1. Search UX:
     a. Add a clear (×) button inside the search input when it has text (position: absolute within a wrapper)
     b. Show result count below search: "X von Y Begriffen angezeigt"
     c. Add search placeholder hint text rotation or a subtle search icon inside the input
  1. Keyboard navigation:
     a. Add keyboard event listener: Escape key clears search and resets filter
     b. Allow arrow key navigation between entity cards in grid view (up/down/left/right with focus visible)
     c. Ensure all interactive elements (buttons, links) are keyboard-focusable with visible focus styles
  1. Tooltip improvements:
     a. Fix tooltip viewport boundary detection (currently checks right/bottom, add top/left boundary checks)
     b. Add a small delay (200ms) before tooltip appears to avoid flickering on fast mouse movements
     c. Increase tooltip max-width to 350px, improve typography
     d. Add smooth fade-in/out for tooltip (CSS opacity transition)
  1. Pagination UX:
     a. Add "Seite X von Y" label next to pagination buttons
     b. Add first/last page buttons (⟪ ⟫) in addition to prev/next (‹ ›)
     c. Disable prev/next buttons with proper disabled styling
  1. Empty state improvements:
     a. Add contextual suggestions: "Versuchen Sie: Stoff, Säure, Wasser" when search returns no results
     b. Add a "Filter zurücksetzen" button when filters are active but no results
  1. Smooth transitions:
     a. Add CSS transition on grid items when filter/sort changes (opacity + transform)
     b. Use requestAnimationFrame for heavy compute operations
     Must NOT do: Do not add jQuery or any UI library. Keep everything vanilla JS.
     References: entity-index.js:102-123 (filteredAndSorted), entity-index.js:386-426 (event handlers), entity-index.js:428-461 (tooltip), entity-index.js:311-339 (pagination), entity-index.html:295-302 (mobile)
     Acceptance criteria: Search shows clear button when typing, result count updates. Escape clears search. Arrow keys navigate cards. Tooltips don't overflow viewport. Pagination shows page count with first/last buttons.
     QA scenarios:
     Happy: Type in search → × button appears on right, result count updates
     Happy: Press Escape → search clears, all entities shown
     Happy: Hover card slowly → tooltip fades in after 200ms
     Happy: Navigate to last page → last page button disabled
     Failure: Search "zzz" → shows "Keine Begriffe gefunden" with suggestions
     Commit: Y | feat(wissensnetz): search UX, keyboard navigation, tooltip improvements, pagination UX

### Wave 4: Accessibility

- [ ] 5. entity-index.html + entity-index.js + entity/single.html: Accessibility audit and fixes
     What to do:
  1. ARIA attributes:
     a. Search input: `aria-label="Begriff suchen"`, `role="searchbox"`, `aria-describedby` for result count
     b. Sort select: `aria-label="Sortierung"`
     c. Filter buttons: `role="button"`, `aria-pressed` (true/false based on active state)
     d. View mode buttons: `aria-label="Kachelansicht"` / `aria-label="Schlagwortwolke"`, `aria-pressed`
     e. Pagination buttons: `aria-label="Seite X"`, `aria-current="page"` for active page, `aria-disabled` for disabled
     f. Entity card links: `aria-label="Details zu [entity name]"`
     g. Main entity app region: `role="region"`, `aria-label="Wissensnetz"`
  1. Focus management:
     a. When filter/sort/view changes, move focus to first entity card or to the search result count
     b. When pagination changes, move focus to first card on new page
     c. When search clears via × button, return focus to search input
     d. Ensure tab order follows visual order (search → sort → view toggle → filters → cards → pagination)
  1. Screen reader:
     a. Add `aria-live="polite"` region for search result count updates
     b. Add `aria-live="polite"` for filter/sort announcements ("Zeige X von Y Begriffen")
     c. Add `aria-hidden="true"` on decorative elements (spinner, emoji icons in empty states)
  1. Color contrast:
     a. Audit all text elements against WCAG AA 4.5:1 minimum contrast using browser devtools
     b. Fix any contrast issues (particularly muted text like .entity-card-meta at #888 on light bg = ~3.5:1, bump to #767676)
     c. Ensure focus indicators have minimum 3:1 contrast against adjacent colors
  1. Entity detail page (entity/single.html):
     a. Add `role="navigation"` and `aria-label="Breadcrumb"` to breadcrumb nav
     b. Add `aria-label="Artikel zu [entity]"` to article section
     c. Add `aria-label="Verwandte Begriffe"` to relation sections
     d. Ensure the ego graph container has a fallback message when WebGL/SVG is not supported
  1. Keyboard accessibility:
     a. Entity cards: ensure they have `tabindex="0"` and keyboard event handlers matching click handlers
     b. Tooltip: trigger on focus/blur events in addition to mouseover/mouseout for keyboard users
     c. Tag cloud items: already links (`<a>`), ensure visible focus styles
     Must NOT do: Do not add aria-\* attributes that conflict with native HTML semantics (e.g., don't add role="button" to `<button>` elements).
     References: entity-index.html (all interactive elements), entity-index.js:386-426 (event handlers), entity-index.js:428-461 (tooltip), entity/single.html:312-318 (breadcrumb), entity/single.html:331-682 (detail page JS), dark-mode.css:1-80 (theme)
     Acceptance criteria: Running axe DevTools or Lighthouse Accessibility audit on both entity index and entity detail pages shows 0 violations. All interactive elements are keyboard-accessible. Screen reader announces search results count on update.
     QA scenarios:
     Happy: Navigate to entity index → axe audit passes with 0 violations
     Happy: Tab through all interactive elements → visible focus ring on each element
     Happy: Use screen reader (VoiceOver/NVDA) → search, filters, sort, cards, pagination announced correctly
     Happy: Tab to card → tooltip appears, Tab away → tooltip hides
     Commit: Y | a11y(wissensnetz): add ARIA labels, focus management, screen reader support, contrast fixes

### Wave 5: SSR/SEO

- [ ] 6. generate-entity-pages.mjs: Export entity data for Hugo SSR
     What to do:
  1. Modify generate-entity-pages.mjs (or create a companion script) to also export entity data to `myhugoapp/data/wissensnetz/entity-data.json` during build
  1. The exported data should be a mapping: `{ "<slug>": { name, category, description, articles: [...], relatedEntities: [...], components: [...], articleCount, slug } }` - one entry per entity
  1. Read from `myhugoapp/data/kg_data.json` (the existing static data dump) for the entity data
  1. Run the script as part of the build pipeline: add to `package.json` scripts if needed
  1. Add `entity-data.json` to version control (it's a generated data file, like kg_data.json)
  1. Ensure the script is idempotent (safe to re-run)
     Must NOT do: Do not modify the Neo4j import scripts. Do not change the existing entity-index.js or the kg-data API. The data export is _supplementary_ for SSR.
     References: generate-entity-pages.mjs:1-61 (existing entity page generation), server.js:1409-1432 (entity data shape), myhugoapp/data/kg_data.json (data source)
     Acceptance criteria: Running `node scripts/generate-entity-pages.mjs` produces `myhugoapp/data/wissensnetz/entity-data.json` with one entry per entity. The JSON is valid and contains name, category, articles, relatedEntities, components for each entity.
     QA scenarios:
     Happy: Run script → entity-data.json created with 500+ entries
     Happy: Run script again → no duplicates, idempotent
     Failure: kg_data.json missing → script exits with clear error
     Commit: Y | feat(build): export entity data for Hugo SSR

- [ ] 7. entity/single.html + entity-index.html: Server-side render entity detail content, JSON-LD, meta tags
     What to do:
  1. Modify entity/single.html template to read from `.Site.Data.wissensnetz.entity_data` for the current entity (matched by page slug):
     a. Render entity name, category badge, article count, relation count server-side in the initial HTML
     b. Render article list (title + url + type) server-side
     c. Render related entity tags (KMK, Quelle, other) server-side with proper links
     d. Render components list server-side
     e. The template should gracefully handle missing data (entity not found in data file) by showing static content and falling back to client JS fetch
  1. Add JSON-LD structured data:
     a. In the entity/single.html `<head>` (via `{{ define "css" }}` or a new `{{ define "jsonld" }}` block), inject JSON-LD of type Schema.org/Thing for the entity
     b. Include: name, description, url, sameAs (if available), mainEntityOfPage, mentions (articles as CreativeWork)
  1. Add SEO meta tags:
     a. Ensure `<title>` includes entity name + " – chemie-lernen.org"
     b. Add `<meta name="description">` with entity summary
     c. Add `<link rel="canonical" href="...">`
     d. Add Open Graph tags (og:title, og:description, og:url, og:type=article)
  1. Client-side JS (entity/single.html inline `<script>`):
     a. Check if the server already rendered content — if yes, skip the full data fetch and only load the ego graph
     b. If server data is incomplete/missing, fall back to full fetch (backward compatible)
     c. The ego graph still loads via the local d3-force bundle (from Todo 2)
  1. Update \_index.md for entity index page with SEO meta tags and JSON-LD for the index page
     Must NOT do: Do not remove the client-side JS — it powers the ego graph and serves as fallback. Do not change the entity-index.js (index page) rendering — it stays fully client-side (interactive search/filter).
     References: entity/single.html:310-683 (current template), config.toml:60-69 (menu config), myhugoapp/data/wissensnetz/entity-data.json (generated in Todo 6)
     Acceptance criteria: Entity detail page shows name, category, articles, relations in initial HTML without waiting for API. No API fetch for the entity data (only for ego graph). JSON-LD script tag present with valid Schema.org markup. Lighthouse SEO score 100.
     QA scenarios:
     Happy: Navigate to /entity/wasser/ → full content visible immediately, no /api/kg-data fetch in network tab
     Happy: View page source → JSON-LD present, server-rendered content visible
     Happy: Share on social media → og:title and og:description preview correctly
     Failure: entity-data.json missing → client-side fallback kicks in, entity renders from API as before
     Commit: Y | feat(wissensnetz): SSR entity detail pages with JSON-LD and SEO meta tags

### Wave 6: Test Updates

- [ ] 8. tests/test-entity-knowledge-graph.spec.js: Update tests for new features
     What to do:
  1. Add test for search clear button (×) visibility and functionality
  1. Add test for debounced search (rapid typing produces single re-render or use waitFor with proper assertion)
  1. Add test for keyboard navigation (Escape clears search, Tab moves through elements)
  1. Add test for tooltip appearance on hover (waitFor tooltip element to become visible)
  1. Add test for pagination first/last page buttons
  1. Add test for empty state suggestions
  1. Add test for fuzzy slug matching on entity detail page (navigate to approximate slug, verify content appears)
  1. Add test for SSR content on entity detail page (verify content is in initial HTML, not just rendered by JS)
  1. Add test for JSON-LD structured data presence on entity detail page
  1. Add test for ARIA attributes on filter/sort/search/pagination elements
  1. Add test for result count display "X von Y Begriffen angezeigt"
  1. Verify existing tests still pass with the new changes
     Must NOT do: Do not modify tests unrelated to the entity/wissensnetz feature. Do not add flaky timeouts.
     References: tests/test-entity-knowledge-graph.spec.js:1-443 (existing tests), entity-index.js (all changes from todos 1-5), entity/single.html (SSR changes), entity-index.html (all changes)
     Acceptance criteria: All existing tests pass. New tests cover all new features. `npm test` passes with clean output.
     QA scenarios:
     Happy: Run `npx playwright test test-entity-knowledge-graph.spec.js` → all tests pass
     Happy: Run `npx jest` → all unit tests pass
     Commit: Y | test(wissensnetz): add tests for search UX, keyboard nav, SSR, JSON-LD, ARIA

## Final verification wave

> Runs in parallel after ALL todos. ALL must APPROVE.

- [ ] F1. Plan compliance audit: Verify every Must have in the Scope section has a corresponding todo, and no todos exceed scope
- [ ] F2. Code quality review: Run `npm run lint` clean, `lsp_diagnostics` clean on changed JS files, verify no `as any` or `@ts-ignore`
- [ ] F3. Real manual QA: Run the full Playwright test suite for entity pages: `npx playwright test test-entity-knowledge-graph.spec.js`. Confirm all tests pass.
- [ ] F4. Scope fidelity: Confirm no changes outside entity-index.js, entity-index.html, entity/single.html, entity/\_index.md, generate-entity-pages.mjs

## Commit strategy

One commit per todo, with conventional commit format. All commits pushed together after the final verification wave. Squash not needed — each todo is an independent logical change.

## Success criteria

1. Entity detail pages load with server-rendered content (no API fetch for detail data)
2. Search is debounced and responsive with visible clear button
3. Keyboard navigation works throughout both entity pages (Tab, Escape, arrow keys)
4. Tooltips appear smoothly with viewport boundary detection
5. Pagination includes first/last page buttons and "Seite X von Y" label
6. Empty states show contextual suggestions
7. Dark mode is consistent across all entity elements
8. ARIA labels and roles properly annotate all interactive elements
9. axe/Lighthouse accessibility audit passes with 0 violations
10. JSON-LD structured data present on entity detail pages
11. All existing and new Playwright tests pass
12. ESLint and pre-commit hooks pass cleanly
