# Content Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand chemie-lernen.org content from ~53 to ~60+ unique articles, resolve duplicate articles, improve cross-linking, and polish existing calculators.

**Architecture:** Content-only work (Markdown articles + Hugo templates/partials + JS polish). No new calculators, no offline-first. Existing calculators get UX/bugfix/i18n improvements. Cross-linking uses `teilgebiet` taxonomy and dedicated partials.

**Tech Stack:** Markdown (Hugo), JavaScript (calculator polish), Neo4j (cross-link data existing), Hugo templates/partials

---

## Content Audit Context

### Current state per Themenbereich (unique articles after dedup)

| Bereich                        | Raw Files | Unique Articles | Gap to 5 |
| ------------------------------ | --------- | --------------- | -------- |
| einfuehrung-chemie             | 4         | 4               | +1       |
| aufbau-materie                 | 4         | 4               | +1       |
| saeuren-basen                  | 4         | 4               | +1       |
| redox-elektrochemie            | 4         | 4               | +1       |
| energetik                      | 4         | 4               | +1       |
| gleichgewicht-geschwindigkeit  | 5         | 5               | 0        |
| erdoel-organische-stoffklassen | 4         | 4               | +1       |
| reaktionstypen-organisch       | 4         | 3\*             | +2       |
| produkte-organisch             | 4         | 3\*             | +2       |
| analytische-methoden           | 5         | 5               | 0        |
| anorganische-verbindungen      | 5         | 4\*             | +1       |
| tipps-tricks                   | 5         | 5               | 0        |

\* After deduplication: reaktionstypen-organisch (eliminierung-umlagerung + eliminierungsreaktionen overlap), produkte-organisch (waschmittel-tenside + tenside-waschmittel duplicate), anorganische-verbindungen (komplexchemie + komplexverbindungen overlap)

### New articles needed: ~12 to bring all areas to ≥5

### Existing interactive calculators (14)

- pH-Rechner, Molare-Masse-Rechner, Konzentrationsumrechner, Dichte-Rechner, Gasgesetz-Rechner, Löslichkeitsprodukt-Rechner, Redox-Potenzial-Rechner, Verbrennungsrechner, Verdünnungsrechner, Verdünnungsreihen-Rechner, Lösungsrechner, Einheitenumrechner, Druck-Flächen-Rechner, Dampfdruck-Rechner
- 4 Simulators: Titrations-Simulator, Spektroskopie-Simulator, Reaktionskinetik-Simulator, Gasgesetz-Simulator

---

## Task 1: Resolve Content Duplicates

**Files:**

- Modify: `myhugoapp/content/themenbereiche/produkte-organisch/waschmittel-tenside.md`
- Delete: `myhugoapp/content/themenbereiche/produkte-organisch/tenside-waschmittel.md`
- Modify: `myhugoapp/content/themenbereiche/anorganische-verbindungen/komplexchemie.md`
- Delete: `myhugoapp/content/themenbereiche/anorganische-verbindungen/komplexverbindungen.md`
- Verify: `myhugoapp/content/themenbereiche/reaktionstypen-organisch/eliminierung-umlagerung.md` and `eliminierungsreaktionen.md` — determine if both are distinct enough to keep

- [ ] **Step 1: Compare waschmittel-tenside vs tenside-waschmittel**

Read both articles fully. Check if they cover distinct content angles or are true duplicates.

- [ ] **Step 2: Merge tenside content or delete duplicate**

If duplicate: delete `tenside-waschmittel.md`, update `waschmittel-tenside.md` frontmatter to include any unique tags. Reconcile aliases.
If distinct: rename one to clarify focus (e.g., `waschmittel-umweltaspekte.md`).

- [ ] **Step 3: Compare komplexchemie vs komplexverbindungen**

Read both fully. Determine if crystal field theory (komplexchemie) vs nomenclature/applications (komplexverbindungen) justifies two articles.

- [ ] **Step 4: Merge komplex content or delete duplicate**

If overlapping: merge unique sections into `komplexchemie.md`, delete `komplexverbindungen.md`.
If distinct: rename to clarify (e.g., `komplexchemie-kristallfeld.md` and `komplexverbindungen-nomenklatur.md`).

- [ ] **Step 5: Evaluate eliminierung-umlagerung vs eliminierungsreaktionen**

`eliminierungsreaktionen.md` (123 lines, detailed E1/E2 mechanisms) vs `eliminierung-umlagerung.md` (58 lines, brief overview + Umlagerung). These are distinct enough to keep both. Verify no content overlap in the Umlagerung section.

---

## Task 2: Write New Articles (~12)

**Files (create):** `myhugoapp/content/themenbereiche/<bereich>/<artikel>.md`

**Template:** `myhugoapp/content/_article-template.md`

- [ ] **Step 1: einfuehrung-chemie — Laborgeräte und ihre Handhabung**

Create: `myhugoapp/content/themenbereiche/einfuehrung-chemie/laborgeraete-handhabung.md`
Content: Common lab equipment (Bunsen burner, graduated cylinder, pipette, volumetric flask, balance), proper usage, safety considerations. 300-500 words.
Tags: `['chemie', 'einführung', 'labor', 'geräte', 'sicherheit']`

- [ ] **Step 2: aufbau-materie — Isotope und ihre Anwendungen**

Create: `myhugoapp/content/themenbereiche/aufbau-materie/isotope-anwendungen.md`
Content: Definition of isotopes, stable vs radioactive, C-14 dating, medical isotopes, isotope patterns in mass spec. 400-600 words.
Tags: `['chemie', 'aufbau-materie', 'isotope', 'radioaktivität', 'datierung']`

- [ ] **Step 3: saeuren-basen — Säurestärke und pKs-Werte**

Create: `myhugoapp/content/themenbereiche/saeuren-basen/saeurestaerke-pks.md`
Content: Strong vs weak acids, pKa values, relationship to pH, comparing acid strength, examples. 300-500 words.
Tags: `['chemie', 'säuren-basen', 'pKs', 'säurestärke', 'gleichgewicht']`

- [ ] **Step 4: redox-elektrochemie — Elektrolyse und Galvanik**

Create: `myhugoapp/content/themenbereiche/redox-elektrochemie/elektrolyse-galvanik.md`
Content: Electrolysis vs galvanic cells, Faraday's laws, industrial applications (aluminum production, electroplating). 400-600 words.
Tags: `['chemie', 'redox', 'elektrochemie', 'elektrolyse', 'galvanik']`

- [ ] **Step 5: energetik — Kalorimetrie und Enthalpiemessung**

Create: `myhugoapp/content/themenbereiche/energetik/kalorimetrie.md`
Content: Calorimetry principles, bomb calorimeter, coffee cup calorimeter, measuring enthalpy changes, specific heat capacity. 300-500 words.
Tags: `['chemie', 'energetik', 'kalorimetrie', 'enthalpie', 'messung']`

- [ ] **Step 6: erdoel-organische-stoffklassen — Funktionelle Gruppen in der Organik**

Create: `myhugoapp/content/themenbereiche/erdoel-organische-stoffklassen/funktionelle-gruppen.md`
Content: Overview of key functional groups (hydroxyl, carbonyl, carboxyl, amino, etc.), their properties, nomenclature rules. 400-600 words.
Tags: `['chemie', 'organik', 'funktionelle gruppen', 'nomenklatur', 'stoffklassen']`

- [ ] **Step 7: reaktionstypen-organisch — Nukleophile Substitution (SN1/SN2)**

Create: `myhugoapp/content/themenbereiche/reaktionstypen-organisch/nukleophile-substitution.md`
Content: SN1 vs SN2 mechanisms, kinetics, stereochemistry, solvent effects, leaving groups. 400-600 words.
Tags: `['chemie', 'organik', 'substitution', 'SN1', 'SN2', 'mechanismus']`

- [ ] **Step 8: reaktionstypen-organisch — Addition an Doppelbindungen**

Create: `myhugoapp/content/themenbereiche/reaktionstypen-organisch/addition-doppelbindungen.md`
Content: Electrophilic addition to alkenes, Markovnikov's rule, hydrogenation, halogenation, hydration. 300-500 words.
Tags: `['chemie', 'organik', 'addition', 'alkene', 'markovnikov']`

- [ ] **Step 9: produkte-organisch — Kunststoffe im Alltag (Ergänzung)**

Create: `myhugoapp/content/themenbereiche/produkte-organisch/kunststoffe-alltag.md`
Content: Common plastics (PE, PP, PVC, PET, PS), their properties, recycling codes, environmental impact. 400-600 words. (This supplements `kunststoffe-und-polymere.md` which focuses on polymerization chemistry.)
Tags: `['chemie', 'organik', 'kunststoffe', 'recycling', 'umwelt']`

- [ ] **Step 10: anorganische-verbindungen — Halogene und Edelgase**

Create: `myhugoapp/content/themenbereiche/anorganische-verbindungen/halogene-edelgase.md`
Content: Group 17/18 elements, trends in reactivity, halogen displacement reactions, noble gas compounds (XeF2, etc.). 300-500 words.
Tags: `['chemie', 'anorganisch', 'halogene', 'edelgase', 'hauptgruppen']`

- [ ] **Step 11: einfuehrung-chemie — Wissenschaftliche Methoden in der Chemie**

Create: `myhugoapp/content/themenbereiche/einfuehrung-chemie/wissenschaftliche-methoden.md`
Content: Scientific method applied to chemistry, hypothesis testing, experimental design, observation vs inference, reproducibility. 300-500 words.
Tags: `['chemie', 'einführung', 'methoden', 'wissenschaft', 'experiment']`

- [ ] **Step 12: aufbau-materie — Periodische Trends**

Create: `myhugoapp/content/themenbereiche/aufbau-materie/periodische-trends-artikel.md`
Content: Atomic radius, ionization energy, electronegativity, electron affinity — trends across periods and groups. (Note: `periodische-trends.md` exists as interactive page at root level — this article is the companion text within the themenbereich.) 400-600 words.
Tags: `['chemie', 'aufbau-materie', 'periodensystem', 'trends', 'ionisierungsenergie']`

---

## Task 3: Update OpenSpec Spec & Changes

**Files:**

- Modify: `openspec/changes/sprint-4/proposal.md` — update to include calculator polish scope
- Modify: `openspec/changes/sprint-4/tasks.md` — add new tasks, mark dedup tasks

- [ ] **Step 1: Update sprint-4 tasks.md**

Add new tasks for article writing (Task 2), deduplication (Task 1), and calculator polish (Task 5-7).

- [ ] **Step 2: Update sprint-4 proposal.md**

Extend scope to include: "Resolve content duplicates, calculator polish (UX/bugfix/i18n), cross-linking automation."

---

## Task 4: Cross-Linking Improvements

**Files:**

- Modify: `myhugoapp/layouts/partials/` — add cross-link badge partial
- Modify: `myhugoapp/layouts/_default/` — include badge partial in article footer
- Modify: `scripts/link-content.mjs` — verify teilgebiet coverage
- Modify: `api/server.js` — add cross-link-stats endpoint

- [ ] **Step 1: Create cross-link badge partial**

Create: `myhugoapp/layouts/partials/cross-link-badges.html`
Content: Hugo partial that reads `.Params.teilgebiet`, queries related articles in same or adjacent teilgebiete, renders "Verwandte Themen" and "Geeignete Rechner" badge lists.

- [ ] **Step 2: Add badge partial to article footer**

Modify: `myhugoapp/layouts/_default/single.html` or relevant article template.
Add `{{ partial "cross-link-badges.html" . }}` after article content.

- [ ] **Step 3: Run link-content.mjs + generate-cross-links.mjs**

Execute: `node scripts/link-content.mjs` followed by `node scripts/generate-cross-links.mjs`
Verify teilgebiet coverage is complete. Fix any gaps found.

- [ ] **Step 4: Add `last_reviewed` frontmatter to all existing articles**

Bulk-add `last_reviewed: 2026-07-09` to all article `.md` files in `myhugoapp/content/themenbereiche/`. Use ast_grep_replace or script.

- [ ] **Step 5: Create content freshness audit script**

Create: `scripts/audit-content-freshness.mjs`
Logic: Read all articles, check `last_reviewed` frontmatter, flag articles with date > 6 months old. Output JSON report.

- [ ] **Step 6: Create GET /api/content/cross-link-stats endpoint**

Modify: `myhugoapp/api/server.js`
Add route that returns: total articles, articles with ≥3 cross-links, orphan articles (0 cross-links), coverage percentage per teilgebiet.

---

## Task 5: Calculator Polish — pH-Rechner

**Files:**

- Modify: `myhugoapp/static/js/ph-rechner.js`
- Modify: `myhugoapp/static/js/ph-rechner-framework.js`
- Test: run Hugo dev server and verify manual

- [ ] **Step 1: Audit pH-Rechner for bugs and UX issues**

Read both `ph-rechner.js` and `ph-rechner-framework.js`. Check:

- Input validation (edge cases: negative pH, extreme values)
- UI responsiveness on mobile
- Error messages (are they in German?)
- Result display clarity
- Console errors

- [ ] **Step 2: Fix identified issues**

Apply fixes: input validation, German error messages, mobile UX, result formatting.

- [ ] **Step 3: Verify visually with Hugo dev server**

Run `hugo server -D` and test pH-Rechner manually. Confirm all interactions work.

---

## Task 6: Calculator Polish — Molare-Masse-Rechner

**Files:**

- Modify: `myhugoapp/static/js/molare-masse-rechner.js`
- Depend on: `myhugoapp/static/js/utils/chemistry-utils.js` (shared globals)

- [ ] **Step 1: Audit Molare-Masse-Rechner for bugs and UX**

Read `molare-masse-rechner.js`. Check:

- Formula parsing robustness (parentheses, hydration water like `CuSO4·5H2O`)
- Error feedback quality
- Mobile layout
- Console errors

- [ ] **Step 2: Fix identified issues**

Apply fixes: improved formula parsing, better error messages, mobile UI adjustments.

- [ ] **Step 3: Verify with Hugo dev server**

Test various formulas. Check error cases. Validate output accuracy against known molar masses.

---

## Task 7: Calculator Polish — Titrations-Simulator

**Files:**

- Modify: `myhugoapp/static/js/titrations-simulator.js` (if exists) or locate correct JS file
- Modify: `myhugoapp/layouts/_default/titrations-simulator.html` (if template exists)

- [ ] **Step 1: Locate and audit Titrations-Simulator**

Search for the JS file powering the titration simulator. Check: curve rendering accuracy, interaction points (dragging), data labels, mobile zoom.

- [ ] **Step 2: Fix identified issues**

Improve: curve labeling, mobile touch handling, initial state clarity.

- [ ] **Step 3: Verify with Hugo dev server**

Run simulator. Test different acid/base combinations. Verify curve shape and equivalence point marker.

---

## Task 8: i18n Audit & Improvements

**Files (read):** `myhugoapp/static/js/i18n/` (find all locale files)

- [ ] **Step 1: Find and read i18n files**

List files in `myhugoapp/static/js/i18n/`. Check which calculators use i18n and which have hardcoded German strings.

- [ ] **Step 2: Audit each calculator for hardcoded strings**

Search for hardcoded German strings in calculator JS files. Flag for extraction to i18n.

- [ ] **Step 3: Add missing i18n keys (if i18n system exists)**

Extract hardcoded strings from audited calculators into locale files. Only if i18n system already exists — no new i18n architecture.

---

## Task 9: Final Verification

**Files (read):** Hugo config, test output

- [ ] **Step 1: Run Hugo build**

Run: `npm run build` or `hugo --minify` in `myhugoapp/`. Confirm no build errors.

- [ ] **Step 2: Run tests**

Run: `npm test`. Confirm all existing tests pass.

- [ ] **Step 3: Run lint**

Run: `npm run lint`. Confirm no new lint errors.

- [ ] **Step 4: Update sprint-4 tasks**

Mark all completed tasks in `openspec/changes/sprint-4/tasks.md`. Confirm checklist completeness.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: content expansion sprint — new articles, dedup, cross-linking, calculator polish"
git push origin master
```
