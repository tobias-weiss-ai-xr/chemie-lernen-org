# Sprint 37: Themenbereiche Enhancement

## Why

The 12 Themenbereiche have rich article content (69 articles, 6023 lines) but lack two spec requirements (REQ-TB-4):

- **No quiz widgets** — articles don't include quiz shortcodes or embedded quiz UI
- **No entity cross-links** — articles don't link to entity pages (`/entity/<slug>/`)
- **No entity cloud** — landing pages don't show a visual cloud of related KG entities

Adding these closes the gap between content depth and interactivity.

## What Changes

1. A Hugo partial `quiz-widget.html` that embeds a quiz widget for a given topic
2. A script `scripts/generate-themenbereich-entities.mjs` that maps entities to Themenbereiche based on keyword matching in entity name/description/tags, then generates a `_entity_links.md` partial per area
3. Entity cloud partial `entity-cloud.html` for landing pages
4. Wire quiz widgets into each Themenbereich `_index.md`

## Capabilities

- `themenbereiche` — enhanced with quiz + entity cross-links
- `quiz` — embedded into content pages
- `entity-knowledge-graph` — surfaced in content via entity cloud

## Impact

**New files:**

- `myhugoapp/layouts/partials/quiz-widget.html`
- `myhugoapp/layouts/partials/entity-cloud.html`
- `scripts/generate-themenbereich-entities.mjs`

**Modified files:**

- `myhugoapp/content/themenbereiche/*/_index.md` — add quiz widget + entity cloud partials

**Dependencies:** None (uses existing quiz data + entity pages)

**Rollback:** Remove partials references from \_index.md files; remove new partials.
