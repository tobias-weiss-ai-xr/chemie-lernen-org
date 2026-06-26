# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

# Multi-Sprint Plan: Curriculum & Content Platform

## TL;DR (For humans)

**5 Sprints back-to-back** to transform chemie-lernen.org from a static chemistry learning site into a curriculum-aware intelligent learning platform.

- **Sprint A** (~3 days): Link 1788 curriculum topics to existing articles, calculators, and tools
- **Sprint B** (~4 days): RAG-powered KI-Assistent with real LLM + Neo4j context
- **Sprint C** (~3 days): Expand thin content, quizzes, cross-linking
- **Sprint D** (~3 days): Advanced curriculum explorer (compare, search, KMK matrix)
- **Sprint E** (~2 days): Data quality, backups, monitoring, pipeline fixes

Total: ~15 days of focused work. Each sprint is sequential with clear deliverables.

---

## Sprint A: Curriculum-Content-Verknüpfung

### Goal

Connect all 1788 curriculum topics in Neo4j to existing platform content (articles, calculators, simulators, quizzes). When a student views a curriculum topic (e.g., "Redoxreaktionen"), they see relevant articles and interactive tools.

### Implementation Plan

#### A1: Content Mapping Script

- `scripts/curricula/link-content.mjs`
- Reads all articles from `myhugoapp/content/**/*.md` (frontmatter + title)
- Reads all calculators (layout files in `layouts/_default/`, JS files in `static/js/calculators/`)
- Normalizes names and matches to curriculum topics via keyword overlap
- Creates `[:MENTIONS]` relationships in Neo4j: `(topic:Entity {kategorie:'lehrplan'})-[:MENTIONS]->(content:Content {type:'article'|'calculator'})`
- Fallback: writes JSON mapping file `myhugoapp/data/curricula/content-links.json`
- `--dry-run` flag

#### A2: Existing content scan

- Inventory: list all markdown files in `content/` with topics/keywords
- Extract `Title`, `Description`, and first H2 sections for keyword extraction
- Map to curriculum topics by normalized name match
- Map to calculators by keyword overlap (calculator titles + descriptions)
- Output: `data/curricula/content-links.json` with `{topicName: [{type, title, url}]}`

#### A3: API Extension

- `/api/kg-data` already returns curriculum entities with `curriculumMeta`
- Add `contentLinks` field to curriculum entity detail (`/api/entity/:slug`)
- Query Neo4j MENTIONS relationships or fall back to JSON map
- Frontend: curriculum entity detail pages show "Zugehörige Inhalte" section with article + calculator cards

#### A4: Show curriculum context on article pages

- Hugo template extension: add `{{ $curricula := where $.Site.Data.curricula.contentLinks "article" .RelPermalink }}`
- Show "Lehrplan-Bezug" box on article pages with linked curriculum topics
- Wire through `partials/curricula-mention.html`

#### A5: Re-import script

- Run `link-content.mjs` against Neo4j
- Verify MENTIONS links exist in knowledge graph
- Commit + deploy

### Deliverables

- [ ] A1: `scripts/curricula/link-content.mjs` (Neo4j + JSON fallback)
- [ ] A2: `myhugoapp/data/curricula/content-links.json` (generated mapping)
- [ ] A3: API returns `contentLinks` on entity detail + `/api/kg-data`
- [ ] A4: Artikel-Seiten zeigen "Lehrplan-Bezug" mit curriculum topics
- [ ] A5: Neo4j MENTIONS relationships created + committed

### Test Strategy

- `node --check scripts/curricula/link-content.mjs`
- `node scripts/curricula/link-content.mjs --dry-run` validates all matches
- API endpoint returns correct contentLinks for test topics
- E2E: visit `/entity/redoxreaktionen/` → see "Zugehörige Inhalte" section

### Commit Strategy

- Commit 1: A1 (script scaffold + dry-run)
- Commit 2: A2 (content-links.json generated)
- Commit 3: A3 + A4 (API + templates)
- Commit 4: A5 (re-import + verify)

---

## Sprint B: KI-Assistent + RAG

### Goal

Transform the existing chat API into a real RAG-powered chemistry tutor. Uses Neo4j knowledge graph + curriculum data to generate accurate, curriculum-aware answers.

### Implementation Plan

#### B1: LLM Integration

- Add LiteLLM or direct OpenAI API call to the existing `/api/session` endpoint
- Currently: `api/server.js` has chat logic that sends messages to a LiteLLM endpoint
- Need: verify LiteLLM is running, test completion endpoint
- Add fallback: if no LLM available, use template-based responses
- Add system prompt with chemistry context: "You are a Chemie Tutor für..."
- Add rate limiting: 10 requests/minute per IP

#### B2: RAG Pipeline

- Query Neo4j for relevant entities before answering
- On message receive:
  1. Extract keywords from user message (simple: noun-phrase extraction or use LLM)
  2. Query Neo4j: `MATCH (e:Entity) WHERE e.name CONTAINS $keyword RETURN e`
  3. Query for curriculum context: `MATCH (e:Entity {kategorie:'lehrplan'}) WHERE e.name CONTAINS $keyword RETURN e`
  4. Build context string: "Wissen aus dem Chemie-Lexikon: entity1, entity2..."
  5. Prepend to LLM prompt
- Cache: store frequent queries in memory (LRU, 100 entries)

#### B3: Curriculum-Aware Responses

- When user asks about a curriculum topic, include:
  - Which states cover this topic
  - Grade level
  - Learning objectives
  - Related KMK standards
- System prompt includes: "If a topic is part of a Lehrplan, mention the state and grade level"
- Add `/api/chat/curricula` endpoint: dedicated endpoint for curriculum-only queries

#### B4: Chat UI Enhancements

- `myhugoapp/static/js/chat.js` — add curriculum-aware features
- Show "Quelle: [entity name]" for factual statements
- Add "Im Lehrplan von [state], Klasse [grade]" for curriculum topics
- Style: source chips below each assistant message
- Loading indicator for RAG queries

#### B5: Admin Dashboard

- Basic chat log viewer at `/klassencockpit/` — show recent chat sessions
- Track: question count, curriculum context used, response time
- Simple stats: most-asked topics, coverage gaps

### Deliverables

- [ ] B1: LLM integration with fallback + rate limiting
- [ ] B2: Neo4j RAG pipeline (keyword extraction → context → response)
- [ ] B3: Curriculum-aware responses with state/grade/KMK info
- [ ] B4: Enhanced chat UI with source chips
- [ ] B5: Chat log viewer in klassencockpit

### Test Strategy

- Unit: RAG query returns expected Neo4j results
- Unit: Context string formed correctly
- E2E: Send message via Chat API → expect curriculum-aware response
- Load: 20 concurrent requests → no timeout

### Commit Strategy

- Commit 1: B1 (LLM integration + fallback)
- Commit 2: B2 (RAG pipeline)
- Commit 3: B3 (curriculum-aware prompts)
- Commit 4: B4 (chat UI enhancements)
- Commit 5: B5 (admin dashboard)

---

## Sprint C: Content-Tiefe & Cross-Linking

### Goal

Expand thin Themenbereiche (2-4 articles), add curriculum-topic-specific content, and create cross-links between all platform content types.

### Implementation Plan

#### C1: Content Gap Analysis

- Script: `scripts/analyze-content.mjs`
- For each curriculum topic (1788): does it have linked content?
- For each Themenbereich (12): how many articles? Which curriculum topics?
- For each calculator (20): which curriculum topics does it cover?
- Output: `data/curricula/content-gaps.json`

#### C2: Thin Themenbereiche Expansion

- Target: each Themenbereich needs 5+ articles
- Current: average 2-4 articles per Themenbereich
- For each thin Bereich:
  - Add 2-3 new markdown articles in `content/themenbereiche/<slug>/`
  - Content generated from curriculum learning objectives
  - Reference calculators where applicable
  - Add interactive elements (Übungen, Lückentexte)

#### C3: Curriculum-Topic Landing Pages

- For top-100 curriculum topics (most linked), create:
  - Kurze Zusammenfassung (2-3 sentences)
  - Lernziele (from Neo4j)
  - Links to articles/calculators (from Sprint A)
  - Link to explorer for full state context
- Hugo template: `layouts/partials/curriculum-topic-card.html`
- Injected into entity detail pages

#### C4: Cross-Linking Pass

- Add related-topic links at bottom of every article
- Add "Passende Übungen" links from articles to calculators
- Add "Theoretische Grundlagen" links from calculators to articles
- All links are data-driven (from Neo4j or content-links.json)
- Hugo partial: `partials/cross-links.html`

#### C5: Quiz Integration

- Connect existing Lückentexte to curriculum topics
- For each curriculum topic, suggest relevant Lückentexte from `/lueckentexte/`
- Add "Übungen zu diesem Thema" on entity detail pages (curriculum topics only)

### Deliverables

- [ ] C1: `scripts/analyze-content.mjs` + content-gaps.json
- [ ] C2: 15-20 new articles across thin Themenbereiche
- [ ] C3: Topic landing pages for top-100 curriculum topics
- [ ] C4: Cross-linking partial on all content pages
- [ ] C5: Quiz integration with curriculum topics

### Test Strategy

- Content validation: all new articles pass Hugo build
- Links: no broken internal links from cross-linking pass
- Count: N new articles verifiable in git diff
- E2E: visit article → see cross-links section

---

## Sprint D: Curriculum-Explorer Frontend

### Goal

Advanced explorer UI with topic search, cross-state comparison, KMK compliance matrix, and grade-level navigation.

### Implementation Plan

#### D1: Topic Search with Autocomplete

- On `/entity/` page (entity-index.js), enhance the explorer's "Suche" input
- Add autocomplete dropdown that searches all 1788 curriculum topics
- On select: filter to show matching topic across all states
- Debounce: 300ms, min 2 chars
- Source: `window.__CURRICULA_TOPICS` injected from API

#### D2: Multi-State Comparison Table

- New tab in entity-index.js: "Vergleichen"
- Select a topic → show table: rows=states, columns=grade/school_type/objectives/didaktik
- Use `/api/curricula/compare?name=X` backend
- Render: sortable table with state abbreviations as row headers
- Highlight: matching states in green, non-matching in gray

#### D3: KMK Compliance Matrix

- New tab: "KMK-Standards"
- Pivot table: rows=curriculum topics, columns=KMK standards (MSA 2004, MSA 2024, AHR 2020)
- Cell: ✓ or ✗ — shows which KMK standards each topic fulfills
- Data: from didaktik entities + RELATED_TO links
- Use `/api/kg-data` with filter `didaktik` + reverse-lookup

#### D4: Grade-Level Navigation

- In explorer, add "Klasse" filter (5-13) next to state/school
- Group topics by grade: "Klasse 5-7", "Klasse 8-10", "Klasse 11-13"
- Show grade distribution chart (simple bar chart, CSS-only)
- On grade select: show all topics for that grade across all states

#### D5: Explorer Polish

- Loading skeletons for API data
- URL state: `?state=NW&school=Gymnasium&grade=8-10`
- Shareable explorer links
- "Zurück zu den Suchergebnissen" after navigating to detail
- Responsive: collapse filters to accordion on mobile

### Deliverables

- [ ] D1: Autocomplete search with topic dropdown
- [ ] D2: Multi-state comparison table in "Vergleichen" tab
- [ ] D3: KMK compliance matrix tab
- [ ] D4: Grade-level filters + distribution
- [ ] D5: URL state, loading states, responsive polish

---

## Sprint E: Data Quality & Plattform

### Goal

Fix weak state data (HE, BB, BE), establish Neo4j backup pipeline, implement data quality scoring, and add platform monitoring.

### Implementation Plan

#### E1: Fix HE (Hessen) Curriculum Data

- Current: 50% garbled text (PDF extraction artifacts)
- Options:
  - Re-scrape from HE source PDF (if URL still valid)
  - Manual curation: extract clean topics from existing data
  - Fallback: use KMK standards as proxy
- Run scraper with improved PDF extraction
- Validate: at least 20 clean topics with learning objectives

#### E2: Fix BB (Brandenburg) + BE (Berlin)

- Current: 1 topic each (essentially empty)
- These use joint curriculum (BB + BE)
- Find source PDFs and re-scrape
- Validate: at least 20 clean topics per state

#### E3: Neo4j Backup Pipeline

- Docker cron job: daily Neo4j dump
- Script: `scripts/neo4j-backup.sh`
  ```bash
  docker exec neo4j neo4j-admin dump --database=chemie --to=/backups/chemie-$(date +%Y%m%d).dump
  ```
- Keep 30 days of backups
- S3/Git: store compressed backup artifact
- Restore procedure documented in `scripts/neo4j-restore.sh`

#### E4: Data Quality Scoring

- Script: `scripts/grade-data-quality.mjs`
- Score each state on: topic count, objective count, garbled ratio, linked content ratio
- Output: CSV with scores + recommendations
- Grade thresholds: A (>80%), B (>60%), C (>40%), D (<40%)
- Commit to `data/curricula/quality-report.json`

#### E5: Platform Monitoring

- Health check: `/api/health` → verify Neo4j connectivity
- Add: entity count, topic count, link count to health response
- Docker-compose: add healthcheck for neo4j service
- Simple dashboard: `https://chemie-lernen.org/status`
  - Neo4j online/offline
  - Entity counts
  - Last curriculum import date
  - Data quality scores (from E4)

### Deliverables

- [ ] E1: HE data fixed (20+ clean topics)
- [ ] E2: BB + BE data fixed (20+ topics each)
- [ ] E3: Neo4j daily backup pipeline
- [ ] E4: Data quality scores for all 16 states
- [ ] E5: Platform status page + Neo4j health check

---

## Dependency Matrix

```
Sprint     Depends On     Blocking
─────────────────────────────────────
Sprint A   None           Sprint C (content linking), D (explorer)
Sprint B   None           (independent)
Sprint C   Sprint A       Sprint D (rich explorer), E (quality)
Sprint D   Sprint A, C    (none)
Sprint E   Sprint C       (none — independent cleanup)
```

Parallel execution possible: Sprint A + B can run in parallel. Sprint C + E can partially overlap. Sprint D needs A + C done first.

## Execution Order (back-to-back via /ralph)

```
Phase 1: Sprint A (Curriculum-Content-Linking)
Phase 2: Sprint B (KI-Assistent + RAG)  ← parallel-ish, can start after A commits
Phase 3: Sprint C (Content-Tiefe)
Phase 4: Sprint D (Explorer Frontend)
Phase 5: Sprint E (Data Quality)
```

## Risk Assessment

| Risk                              | Impact           | Likelihood | Mitigation                              |
| --------------------------------- | ---------------- | ---------- | --------------------------------------- |
| LLM API auth/key not available    | Sprint B blocked | Medium     | Template fallback first, add key later  |
| Neo4j MENTIONS label needs CREATE | Sprint A blocked | Low        | `CREATE CONSTRAINT` if needed           |
| Weak states unresolvable          | Sprint E partial | Medium     | Accept current data, flag as "limited"  |
| Explo rate limit on LLM           | Sprint B slow    | Medium     | Request queuing + batch processing      |
| Hugo build time with more content | Sprint C slow    | Low        | Incremental builds, skip unused content |

## Success Metrics

After all sprints:

- [ ] Every curriculum topic (1788) linked to ≥1 content item
- [ ] KI-Assistent answers with curriculum context
- [ ] Each Themenbereich has 5+ articles
- [ ] All 16 states have quality-scored curriculum data
- [ ] Daily Neo4j backups running
- [ ] Platform status page live
