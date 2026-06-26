# Sprint 8 — Mega-KG Improvement (3 areas, 1 sprint)

**Created:** 2026-06-26
**Branch:** master
**Status:** planning complete → awaiting user confirmation of sequencing

---

## Sprint goal

Take the chemie-lernen.org knowledge graph from "3 disconnected stubs" to a real, accessible, RAG-backed, multi-hop knowledge engine. Three areas, all interconnected.

## Why this is one sprint

- The D3 ego-graph (Area 1) shows entity data (Area 2) and is a surface for RAG citations (Area 3)
- Data quality (Area 2) is the substrate that makes RAG (Area 3) actually useful
- RAG (Area 3) is the only user-facing reason to care about the KG at all
- Fixing them separately creates rework: a data-quality fix changes entity slugs, which breaks graph links, which changes source chips, which breaks RAG context

## Estimated effort

- **Area 1 (D3 ego-graph):** 6-8h — extract shared module, add a11y + zoom + click-nav + responsive
- **Area 2 (Neo4j data quality):** 8-12h — re-establish pipeline, enrich 48 stub entities, materialize semantic rels, add data-quality tests
- **Area 3 (RAG / AI assistant):** 8-12h — better retrieval, multi-hop, source ranking, fix config drift, add tests
- **Total:** 22-32h (matches the 20-40h user estimate)

---

## Research findings (consolidated, June 2026)

### A. D3 ego-graph (Area 1)

**Current state:** 110-line inline `<script>` in `myhugoapp/layouts/entity/single.html` (lines 772-897), hardcoded `height: 280px`, no `ResizeObserver`, no zoom/drag/tooltip/legend, no a11y (no `role="img"`, no `aria-label`, no keyboard nav, no `<table>` fallback), no `prefers-reduced-motion` handling, no dark-mode adaptation. A parallel implementation in `content/wissennetz.md` is more advanced (zoom, tooltip, legend, filter chips) but inlined verbatim. Local `static/js/vendor/d3.v7.min.js` exists but is unused — both files load from `https://d3js.org/d3.v7.min.js` CDN.

**Data flow:** `entity/single.html` → `fetch('/api/kg-data')` → Traefik → `chemie-chat-api:3001` → `api/server.js` → Neo4j 5.26 (`bolt://chemie-neo4j:7687`, DB `chemie`). The "SSR" build-time hook reads `data/kg_data.json` which is empty (see Area 2). A bug in `single.html` line 311: gates on `.Params.category` but entity markdowns use `kategorie:`, so the SSR branch is dead code.

**Color tokens:** hardcoded JS object literal in 3 files. Not in any CSS custom-property system.

**Important user-facing gap:** clicking a related-entity node does nothing. The user can only navigate via article nodes.

### B. Neo4j KG data (Area 2)

**Schema (consolidated from all code paths):**

- 4 node labels: `:Entity`, `:Document`, `:Tag`, `:Content`
- 10 rel types: `:HAS_TAG`, `:MENTIONS`, `:RELATED_TO`, `:BESTEHT_AUS` (orphan read), `:ERFUELLT`, `:TEIL_VON`, `:GEHOERT_ZU` (orphan read), plus 12 semantic types from `kg-enrich-relations.mjs` (never materialized at scale)
- 9 `kategorie` values: `stoff`, `konzept`, `reaktion`, `methode`, `person`, `quelle`, `lehrplan`, `lernziel`, `didaktik`
- `:Entity` PK is `name` (lowercased)
- 16 state curricula in `data/curricula/*.json`, 12.8 MB `content-links.json`

**Top problems:**

1. **`myhugoapp/data/kg_data.json` is EMPTY** (`{articles:[], entities:[]}`). The Sprint 6 `generate-entity-pages.mjs` script reads ONLY this local file and prints "No entities found" → exits 0. The 54 entity pages currently in `myhugoapp/content/entity/` are **stale leftovers from a prior successful export**.
2. **Quality of entity pages is severely inconsistent.** 3 files have rich element shortcodes (kohlenstoff, palladium, platin). ~3 more have a `kategorie` block. The other 48 are 6-line stubs.
3. **Three relationship types in the schema vocabulary but live pipeline only writes ONE** (`RELATED_TO`). `BESTEHT_AUS` and `GEHOERT_ZU` are queried but never written — orphan rel types.
4. **No `/api/kg-stats` or `/api/graph` endpoints.** Graph stats only via `/api/health` (`entityCount`).
5. **Tests cover UI/API behavior, not data integrity.** 564-line E2E spec asserts shape, not orphan detection, dangling refs, missing descriptions, duplicate names.

**Verbatim Cypher to extend:** see research report §2 (in conversation history, section b1+b2+m0117+m0123).

### C. RAG / AI assistant (Area 3)

**Current pipeline:**

- Frontend: `ki-assistent.js` (790 lines IIFE) + `ki-assistent.optimized.js` (served). SSE via `fetch` + `ReadableStream` reader, 30s `AbortController` timeout, source chips as `<a class="source-chip">` linking to `/entity/{slug}/`.
- Backend: `api/server.js` 2539 lines. `/api/chat` at L143. `getRAGContext` at L502. LLM call to `${LITELLM_URL}/v1/chat/completions` (env-driven, default `http://litellm-proxy:4000`).
- System prompt: hardcoded German, RAG context concatenated directly into the system message (no role separation).

**`getRAGContext` algorithm (verbatim):**

```js
// 1. Tokenize, strip stopwords (~180 entries), dedupe, limit to 5 keywords
// 2. Cypher: MATCH (e:Entity) WHERE ANY(kw IN $keywords WHERE e.name CONTAINS kw)
//    OPTIONAL MATCH (e)-[r:RELATED_TO|ERFUELLT]-(related:Entity)
//    RETURN e.name, e.kategorie, e.state, e.grade, e.school_type,
//           e.objective_count, collect(DISTINCT related.name)
//    ORDER BY e.name LIMIT 30
// 3. Format each line as: `- Name | Kategorie: X | State, Klasse Y, School | N Lernziele | verwandt: r1, r2, ...`
// 4. Concatenate into system message
```

**Top problems:**

1. **Pure substring `CONTAINS` on entity name** — no embeddings, no TF-IDF, no proper keyword scoring. A query for "Säuren" matches "Säuren" but not "Säure" or "saures Verhalten".
2. **No `description` in context** — query returns only name + kategorie + state + grade + school_type + objective_count + related. The actual definition of the entity is never in the prompt.
3. **Single-hop only** — no `MATCH...MATCH...MATCH`, no `[*1..3]` path patterns, no `shortestPath()`.
4. **No source ranking** — alphabetical by `e.name`, no score visible to user.
5. **No page context** — frontend doesn't send `currentPath` or `currentEntity`. The chat doesn't know what page the user is on.
6. **No citation enforcement** — system prompt doesn't tell LLM to cite sources. The user sees source chips but the LLM often doesn't reference them.
7. **No i18n** — always German. `I18nManager` exists (de/en/es/fr/it) but is not wired into the chat.
8. **No tests** for the AI assistant at all. Zero coverage of `/api/chat`, `getRAGContext`, SSE parsing, sanitization, session/rate-limit logic.
9. **Config drift:** `ki-assistent.md` advertises "Gemini 2.5 Flash", `docker-compose.yml` and `server.js` use `gemma-4`. Misleading to users.
10. **Dead code:** `_askAI()` at L445-491 is never called (always uses `askAIStream`).
11. **Latent bug (out of scope but worth flagging):** `/api/kg-data` references undefined variables `whereClause`, `queryParams` (L1443, L1453, L1468, L1470), and `params` in fallback (L1529). Would break search/filter on the KG page (does not affect chat pipeline).

---

## Sprint 8 plan (concrete, sequenced)

### Sprint 8a — D3 ego-graph (6-8h)

**Goal:** extract a shared D3 ego-graph module used by both `entity/single.html` and `content/wissennetz.md`, with a11y, responsive, and click-navigation.

**Tasks:**

1. **Extract shared module** `myhugoapp/static/js/visualization/d3-ego-graph.js` (global `window.D3EgoGraph` API, no ESM). Lift zoom/tooltip/legend code from `wissennetz.md` (lines 101-190).
2. **A11y primitives** in the module:
   - `role="img"`, `aria-label="Wissensgraph für {entity}"` on the SVG
   - `<title>` and `<desc>` inside SVG (native screen-reader tooltips)
   - `tabindex="0"` on each node circle, with focus state equivalent to hover
   - `<table>` fallback (or `<ul>`) under the SVG listing node name + link, hidden with `sr-only` or `display: none` for screen readers
   - `prefers-reduced-motion` check that skips the 200ms `d3.transition` calls and disables force simulation animation
3. **Click-navigation for related-entity nodes** — push to `/entity/{slug}/` (use existing `slugify()` helper at `single.html:562-566`)
4. **Responsive** — `ResizeObserver` that updates simulation center on container resize, container `height: clamp(280px, 50vw, 480px)` instead of fixed 280px, hide labels on small viewports (`@media (max-width: 480px) { .ego-label { display: none; } }`)
5. **Dark mode** for SVG — replace hardcoded `#555` text with `var(--text-muted, #555)`, stroke colors with `var(--border-subtle, #ddd)`. Use existing `prefers-color-scheme: dark` block (lines 254-306 of `single.html`) as a pattern.
6. **Replace CDN load with local** — `static/js/vendor/d3.v7.min.js` (already exists, v7.9.0), add SRI hash, no version pinning.
7. **Unify color tokens** — move `egoColors` object to a shared constants module (or to `visualization/d3-ego-graph.js` as a default export overridable via config). Update `wissennetz.md` to use the same module.
8. **Delete duplicate inline code** in `wissennetz.md` and `entity/single.html` (after both pages consume the new module).
9. **Add unit tests** in `tests/d3-ego-graph.test.js` (Jest, jsdom):
   - Module exports expected API
   - Renders SVG with role=img
   - Calls click handler with correct slug
   - Skips transitions when `prefers-reduced-motion: reduce`
10. **Update `entity-index.html` merge conflict** (lines 12-25) — separate issue surfaced during research, fix as a quick drive-by.

**Files touched (estimate):**

- New: `myhugoapp/static/js/visualization/d3-ego-graph.js`
- New: `tests/d3-ego-graph.test.js`
- Modified: `myhugoapp/layouts/entity/single.html` (replace inline D3 with `<script src>`)
- Modified: `myhugoapp/content/wissennetz.md` (replace inline D3)
- Modified: `myhugoapp/layouts/_default/entity-index.html` (merge conflict)
- Modified: `myhugoapp/layouts/entity/single.html` (color tokens, ResizeObserver)

**Commit message draft:**

```
feat(kg): extract D3 ego-graph module with a11y, responsive, click-nav

Extracts the duplicated D3 force-graph code from entity/single.html and
content/wissennetz.md into a shared myhugoapp/static/js/visualization/
d3-ego-graph.js module. Adds:
- a11y: role=img, aria-label, <title>/<desc>, tabindex on nodes, <ul>
  fallback for screen readers
- prefers-reduced-motion: skips 200ms transitions, freezes force sim
- click-to-navigate: related-entity nodes now push to /entity/{slug}/
- ResizeObserver: graph re-centers on container resize
- responsive: clamp(280px, 50vw, 480px) height, labels hidden <480px
- dark mode: SVG colors via CSS custom properties
- local D3: replaces CDN with existing vendor/d3.v7.min.js + SRI
- color tokens unified across ego-graph and wissennetz

Drive-by: fixes merge conflict in layouts/_default/entity-index.html:12-25

Files: 2 new, 4 modified, ~+450/-200 LOC
```

---

### Sprint 8b — Neo4j data quality (8-12h)

**Goal:** re-establish the data pipeline, enrich the 48 stub entity pages, materialize semantic rel types, add data-quality tests.

**Tasks:**

1. **Re-establish `kg_data.json` export** — fix the broken link. Two options:
   - (A) Wire `scripts/export-kg-data.mjs` as a pre-build step in `.github/workflows/deploy.yml` before Hugo runs
   - (B) Refactor `scripts/generate-entity-pages.mjs` to call Neo4j directly (skip the file round-trip)
   - **Recommended: (A)** — less invasive, preserves the existing separation between "data export" and "page generation"
2. **Lift the `LIMIT 500` and `.slice(0, 100)` ceilings** in `export-kg-data.mjs` (lines 79, 110) to be configurable, default to a high number (e.g. 5000 entities, 10000 articles).
3. **Backfill orphan rel types** — write a new `scripts/backfill-orphan-rels.mjs` that:
   - Computes `:BESTEHT_AUS` from compound→element composition (look at `entity.formel` or component lists)
   - Computes `:GEHOERT_ZU` from `kategorie` (e.g. all `lernziel` `:GEHOERT_ZU` their parent `lehrplan` — already partial via `:TEIL_VON`, but `:GEHOERT_ZU` is a different semantic)
4. **Run `kg-enrich-relations.mjs` on the live DB** with `--force` to materialize the 15 semantic rel types from the typisierungsmatrix. Idempotent: re-running does not create duplicates if the script checks for existing rel types first.
5. **Enrich the 48 stub entity pages** (Tier 3 → Tier 2 minimum):
   - For each entity with no `kategorie`, infer one from related-entity co-occurrence (if a stub entity is RELATED_TO many `stoff` entities, classify as `stoff` too)
   - For each entity with no `description`, generate a German stub from the entity's primary article content (use `description` from the first article that MENTIONS it, or a LLM-generated 1-sentence stub via LiteLLM)
6. **Fix the `kategorie` vs `category` inconsistency** — element entities use `category='Nichtmetall'` (German element class) while everything else uses `kategorie`. Pick ONE key (recommend `kategorie` since it's the dominant pattern) and migrate. The API code at `server.js` only knows `kategorie` and would silently drop element-class info.
7. **Add a real `/api/kg-stats` endpoint** — 5-line Cypher counting by `kategorie` + orphan detection + null-description count. Reuse the LRU cache pattern from `/api/kg-data` (lines 1347-1374 of `server.js`).
8. **Add data-quality tests** to `tests/test-entity-knowledge-graph.spec.js` (or a new `tests/kg-data-quality.test.js`):
   - No orphan entities (all have at least one `RELATED_TO` or `MENTIONS`)
   - All `relatedEntities` references point to existing entities (no dangling refs)
   - No duplicate entity names (case-insensitive)
   - `kategorie` coverage ≥ 80% (excluding `null`)
   - Element entities have non-null `symbol` and `ordnungszahl`
   - `description` coverage ≥ 50% after enrichment
9. **Document the schema** in a new `docs/KNOWLEDGE_GRAPH_SCHEMA.md` (distilled from the research report §4).

**Files touched (estimate):**

- Modified: `.github/workflows/deploy.yml` (pre-build step)
- Modified: `scripts/export-kg-data.mjs` (lift limits)
- New: `scripts/backfill-orphan-rels.mjs`
- New: `scripts/enrich-stub-entities.mjs`
- Modified: `api/server.js` (new `/api/kg-stats` endpoint, fix kategorie/category)
- New: `tests/kg-data-quality.test.js`
- New: `docs/KNOWLEDGE_GRAPH_SCHEMA.md`
- Modified: `myhugoapp/content/entity/**/index.md` (48 stub enrichments, via script)
- Modified: `myhugoapp/data/kg_data.json` (regenerated)

**Commit message draft:**

```
feat(kg): re-establish pipeline, enrich stubs, materialize semantic rels

Re-establishes the broken kg_data.json export pipeline (was empty, causing
generate-entity-pages.mjs to no-op). Adds:

- pre-build export-kg-data step in deploy.yml
- backfill-orphan-rels.mjs: writes :BESTEHT_AUS and :GEHOERT_ZU (previously
  only READ but never written)
- run kg-enrich-relations.mjs to materialize 15 semantic rel types from
  the typisierungsmatrix (was aspirational; only :RELATED_TO existed)
- enrich 48 Tier-3 stub entities with kategorie + description inference
  via related-entity co-occurrence + first-mention article
- lift export LIMIT 500 / 100 ceilings
- migrate element entities from category= to kategorie= (key consistency)
- new /api/kg-stats endpoint with cache layer
- new kg-data-quality.test.js: orphan detection, dangling refs, dup names,
  kategorie coverage, description coverage, element completeness
- new KNOWLEDGE_GRAPH_SCHEMA.md documenting the consolidated schema

Files: 4 new, 4 modified, ~+800/-150 LOC
```

---

### Sprint 8c — RAG / AI assistant (8-12h)

**Goal:** better retrieval, multi-hop reasoning, source ranking, fix config drift, add tests.

**Tasks:**

1. **Fix the `whereClause`/`queryParams` latent bug in `/api/kg-data`** (lines 1443, 1453, 1468, L1470, L1529) — it's broken on the non-lehrplan path. Define the variables or refactor. Required pre-work because the same `parseKGParams()` helper will be reused for `/api/kg-data-stats` and `getRAGContext` filtering.
2. **Add proper keyword scoring** to `getRAGContext` (replace `e.name CONTAINS kw` with TF-IDF-style weighted score):
   - Score = `name_exact * 10 + name_prefix * 6 + name_contains * 3 + description_contains * 2 + tag_contains * 4`
   - Order by score DESC, take top 10 (down from 30)
   - Use the existing stopword list (`STOP_WORDS` at L334-496) and add 50-100 more chemistry-specific terms
3. **Add embeddings-based search** (deferred / optional — requires LiteLLM embedding endpoint). If the LiteLLM proxy supports `/v1/embeddings`, add a vector cache in Neo4j (using the new `vector` index type in 5.26+) and run a hybrid keyword+embedding query. If not supported, skip and document.
4. **Add `description` to the Cypher return** — currently only metadata is pulled. Update query to return `e.description` (when present) and include a short definition in the context line: `- Name | Kategorie: X | Definition: <first 200 chars of description> | verwandt: ...`
5. **Add multi-hop traversal** — when the user asks "what is related to X and Y", do a 2-hop query:
   ```cypher
   MATCH (e:Entity) WHERE any(kw IN $keywords WHERE toLower(e.name) CONTAINS kw)
   OPTIONAL MATCH path = (e)-[:RELATED_TO|ERFUELLT|BESTEHT_AUS*1..2]-(related:Entity)
   WHERE related <> e
   WITH e, related, length(path) as dist
   RETURN e.name, e.kategorie, e.description,
          collect(DISTINCT {name: related.name, kategorie: related.kategorie, dist: dist}) as neighbors
   ORDER BY size([n IN collect(DISTINCT related.name) WHERE n IN $keywords]) DESC, e.name
   LIMIT 10
   ```
6. **Add `currentEntity` to the request** — frontend reads `data-entity` on the page (already set in `single.html:490`) and sends it with the chat. Backend prepends `"Du liest gerade: {entity.name}. Beziehe dich bevorzugt darauf."` to the system prompt.
7. **Source ranking + score visibility** — change source chip rendering to show the score (e.g. `<span class="source-score">92%</span>`) and re-order chips by score DESC. Limit visible chips to top 5, with a "Mehr anzeigen" toggle to expand to all 30.
8. **Citation enforcement** — append to system prompt: `"Wenn du Quellen verwendest, nenne sie namentlich im Text (z.B. 'Laut dem Wissensgraph zu Ammoniak...')."` Then add a regression test that mocks 3 entities in the context and asserts the response includes at least one entity name verbatim.
9. **Add i18n support** — frontend reads `navigator.language`, sends `Accept-Language` header. Backend reads `req.headers['accept-language']` and switches system prompt language. Add an `I18nManager` reference in `ki-assistent.js` (already exists at `static/js/i18n/i18n-manager.js`).
10. **Fix config drift** — pick ONE: (A) update `ki-assistent.md` to say "gemma-4", (B) update `docker-compose.yml` to set `LITELLM_MODEL=` to whatever the proxy actually serves. **Recommended: (A)** since changing the model affects quality and would need user-side testing.
11. **Delete dead code** — `_askAI()` at L445-491, `formatArticleResult`/`findBestMatches` if the client-side fallback is no longer needed (recommend keep for offline resilience, but document).
12. **Add tests:**
    - `tests/rag-context.test.js` (Jest, unit) — test `getRAGContext` with mock Neo4j session, assert scoring, ordering, truncation, stopword handling, multi-hop, description inclusion
    - `tests/chat-api.test.js` (Jest, integration with `supertest`) — test `/api/chat` with mocked LiteLLM, assert streaming envelope shape, source extraction, rate limit, session cookie, message length cap, currentEntity context, citation enforcement
    - `tests/ki-assistent.test.js` (Jest, jsdom) — test frontend chip rendering, follow-up button generation, error fallback
13. **Regenerate `ki-assistent.optimized.js`** after refactor. Document the build step in `package.json` (it currently isn't — only `lazy-loader.js` and `stoichiometry.js` are minified by `npm run minify` per AGENTS.md).

**Files touched (estimate):**

- Modified: `api/server.js` (bug fix, new queries, new prompt, currentEntity, i18n)
- Modified: `myhugoapp/static/js/ki-assistent.js` (send currentEntity, show score, i18n)
- Regenerated: `myhugoapp/static/js/ki-assistent.optimized.js`
- Modified: `myhugoapp/content/ki-assistent.md` (config drift fix)
- Modified: `package.json` (add `minify:ki-assistent` script)
- New: `tests/rag-context.test.js`
- New: `tests/chat-api.test.js`
- New: `tests/ki-assistent.test.js`
- Modified: `tests/knowledge-graph.test.js` (update for new color tokens from 8a)

**Commit message draft:**

```
feat(ai): better RAG, multi-hop, source ranking, fix config drift

Replaces the substring-only RAG with TF-IDF-style scoring over name +
description + tags, ordered by score. Adds:

- scoring: name_exact * 10 + name_prefix * 6 + name_contains * 3 +
  description_contains * 2 + tag_contains * 4
- top-10 entities (down from 30) with first-200-chars of description
  in the context line
- multi-hop: 1-2 hop traversal via [:RELATED_TO|ERFUELLT|BESTEHT_AUS*1..2]
- currentEntity context: frontend sends the entity from data-entity,
  backend prepends "Du liest gerade..." to system prompt
- source score visibility: top-5 chips show score, "Mehr anzeigen" toggle
- citation enforcement: system prompt now requires naming sources
- i18n: navigator.language + Accept-Language header drives system prompt
- bug fix: undefined whereClause/queryParams/params in /api/kg-data
  (latent regression that broke search/filter on the KG page)
- config drift: ki-assistent.md now correctly advertises gemma-4
- dead code: _askAI() removed

Tests: 3 new (rag-context, chat-api, ki-assistent) ~+1200 LOC
Minification: ki-assistent.optimized.js regenerated; new minify script

Files: 3 new, 4 modified, 1 regenerated, ~+1500/-300 LOC
```

---

## Sequencing & dependencies

| Sprint     | Depends on       | Independent?                                                                                                    |
| ---------- | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| 8a (D3)    | —                | ✅ fully independent, can run first                                                                             |
| 8b (Neo4j) | —                | ✅ independent, but ennobled by 8a's new tests as regression baseline                                           |
| 8c (RAG)   | 8b (better data) | ⚠️ partially — 8c's RAG improvements work on existing data, but score much better once 8b enriches descriptions |

**Recommended order:** 8a → 8b → 8c (each builds on the previous). All three can be merged as one feature branch or three atomic commits.

## Risk

- **8a risk:** rewriting the D3 graph affects two pages (`entity/single.html` + `wissennetz.md`). Existing E2E test `test-entity-knowledge-graph.spec.js` (564 lines) covers the index page but not these. Mitigation: add new `d3-ego-graph.test.js` unit tests + visual smoke test on the live site after each commit.
- **8b risk:** modifying `data/kg_data.json` and 48 entity markdowns is a large diff. Mitigation: commit the script + new tests first, then the regenerated data as a separate commit, so the diff for the regeneration is reviewable.
- **8c risk:** changing the system prompt affects LLM output quality. Mitigation: snapshot 10 test prompts + their expected output categories (entity names that should appear), assert in tests. The live LLM is non-deterministic, so tests use mocks.

## Verification

After each sprint, run:

```bash
npm run lint
npm run test:unit
npm run validate          # lint + format:check + test
```

After all 3, run:

```bash
npm run build             # hugo docker build, must succeed
npx playwright test --project=chromium  # E2E sanity (runs against live)
```

Manual smoke test on live:

- `/entity/ammoniak/` — ego-graph renders, click navigates, no console errors, accessible (Lighthouse 100 a11y)
- `/wissennetz/` — full graph still works, filter chips still toggle
- `/ki-assistent/` — chat responds in German, source chips show score, citation works

## Success criteria

Sprint 8 is DONE when:

- [ ] All 3 sub-sprints committed atomically (8a, 8b, 8c as separate commits or 1 mega-commit)
- [ ] `npm run validate` passes (lint + format + 1200+ unit tests, 0 errors)
- [ ] `npm run build` succeeds
- [ ] `npx playwright test --project=chromium` smoke test passes
- [ ] Live site at `/entity/ammoniak/` shows accessible, responsive, clickable D3 graph
- [ ] Live site at `/ki-assistent/` shows German chat with source scores and citation
- [ ] `data/kg_data.json` is populated, not empty
- [ ] `docs/KNOWLEDGE_GRAPH_SCHEMA.md` exists and is accurate
- [ ] All changes pushed to origin/master
- [ ] `<promise>DONE</promise>` output
