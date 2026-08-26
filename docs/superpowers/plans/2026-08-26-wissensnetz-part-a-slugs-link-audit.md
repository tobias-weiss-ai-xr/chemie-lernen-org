# Wissensnetz Part A — Canonical Slugs, Entity-Link-Fix & CI Link-Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all 20 dead `/entity/` links (17 umlaut + 3 special-character slug bugs) on chemie-lernen.org by introducing one canonical slug utility used by every link producer, and make CI fail on any dead entity link.

**Architecture:** A shared browser module `static/js/utils/slugs.js` (IIFE on `globalThis.Slugs`) is the single source of truth. A Node ESM mirror `scripts/lib/slugs.mjs` re-exports the same functions for build-time generators via `createRequire`, so client and build tooling cannot drift. The Hugo SSR tag links (currently `{{ . | urlize }}` which keeps umlauts → the `%C3%A4` bug) are rewritten to use per-name slug maps emitted into entity frontmatter by `generate-entity-pages.mjs`; the same generator emits Hugo alias pages for all legacy umlaut URLs plus a small override map for the 3 special-character URLs. A new build-stage audit script walks the built `public/` tree and fails the Docker build on any unresolvable `/entity/` href. Jest tests (jsdom, existing infra) lock in slug rules, SSR regressions and the audit logic.

**Tech Stack:** Plain browser JS (IIFE), Node 22 ESM (`createRequire`), Hugo 0.154.5 (aliases, frontmatter), Jest + jsdom (existing), Docker multi-stage build (new audit stage), existing `deploy.yml` GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-26-wissensnetz-slugs-and-graph-redesign.md` (Part A; Part B is a follow-up plan).

---

## File Structure

- Create: `myhugoapp/static/js/utils/slugs.js` — canonical `slugify`, `entityUrl`, `rawSlug`, `Slugs` global (browser).
- Create: `scripts/lib/slugs.mjs` — ESM mirror re-exporting the browser module (build-time).
- Modify: `myhugoapp/static/js/visualization/d3-ego-graph.js` — click navigation via `Slugs.entityUrl` with local fallback.
- Modify: `scripts/generate-entity-pages.mjs` — weight-sorted caps, `relatedSlugs`/`componentSlugs` maps, legacy `aliases`.
- Modify: `myhugoapp/layouts/entity/single.html` — SSR tag links via `relatedSlugs` (fix `urlize`), new "✅ Voraussetzungen" card, chip caps, tooltips; client-fallback cap.
- Create: `scripts/audit-entity-links.mjs` — walks built tree, fails on dead `/entity/` hrefs.
- Modify: `Dockerfile` — new audit stage between Hugo build and Pagefind.
- Modify: `.github/workflows/deploy.yml` — legacy-URL smoke check after deploy.
- Tests: `tests/slugs.test.js`, `tests/slugs-parity.test.js`, `tests/link-audit.test.js` (Create); `tests/d3-ego-graph.test.js` stays green (Modify only if needed).

---

### Task 1: Canonical slug utility (browser module)

**Files:**

- Create: `myhugoapp/static/js/utils/slugs.js`
- Test: `tests/slugs.test.js`

- [ ] **Step 1: Write the failing test**

`tests/slugs.test.js`:

```js
/**
 * Unit tests for the canonical slug utility (myhugoapp/static/js/utils/slugs.js).
 * The IIFE assigns globalThis.Slugs when required in Node.
 */
const SLUGS_PATH = require('path').resolve(
  __dirname,
  '..',
  'myhugoapp',
  'static',
  'js',
  'utils',
  'slugs.js'
);
require(SLUGS_PATH); // executes IIFE in Node context

const { slugify, entityUrl, rawSlug } = globalThis.Slugs;

describe('Slugs.slugify', () => {
  it('transliterates German umlauts the established way', () => {
    expect(slugify('Essigsäure')).toBe('essigsaeure');
    expect(slugify('Hämoglobin')).toBe('haemoglobin');
    expect(slugify('Größe')).toBe('groesse');
    expect(slugify('Übersäuerung')).toBe('uebersaeuerung');
  });

  it('strips general diacritics via NFD', () => {
    expect(slugify('Hall-Héroult-Prozess')).toBe('hall-heroult-prozess');
    expect(slugify('Déjà-vu')).toBe('deja-vu');
  });

  it('maps subscript digits to plain digits', () => {
    expect(slugify('Fe₂O₃')).toBe('fe2o3');
    expect(slugify('H₂O')).toBe('h2o');
  });

  it('normalizes punctuation, spaces and separators to single dashes', () => {
    expect(slugify('Gilbert N. Lewis')).toBe('gilbert-n-lewis');
    expect(slugify('Eisen (I)')).toBe('eisen-i');
    expect(slugify('pH-Wert')).toBe('ph-wert');
    expect(slugify('Säure + Base')).toBe('saeure-base');
    expect(slugify('  doppelt--Leerzeichen  ')).toBe('doppelt-leerzeichen');
  });

  it('is idempotent', () => {
    const names = ['Essigsäure', 'Fe₂O₃', 'Gilbert N. Lewis', 'pH-Wert', 'Größe'];
    for (const n of names) expect(slugify(slugify(n))).toBe(slugify(n));
  });

  it('handles null/empty input without throwing', () => {
    expect(slugify(null)).toBe('');
    expect(slugify('')).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});

describe('Slugs.entityUrl', () => {
  it('builds canonical entity URLs', () => {
    expect(entityUrl('Essigsäure')).toBe('/entity/essigsaeure/');
    expect(entityUrl('Kohlendioxid (CO₂)')).toBe('/entity/kohlendioxid-co2/');
  });
});

describe('Slugs.rawSlug (legacy umlaut aliases)', () => {
  it('keeps umlauts, replaces only spaces/punctuation', () => {
    expect(rawSlug('Essigsäure')).toBe('essigsäure');
    expect(rawSlug('Fe₂O₃')).toBe('fe-o');
    expect(rawSlug('Martin-Luther-Universität Halle-Wittenberg')).toBe(
      'martin-luther-universität-halle-wittenberg'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/slugs.test.js`
Expected: FAIL with `globalThis.Slugs is undefined` (module missing).

- [ ] **Step 3: Write the minimal implementation**

`myhugoapp/static/js/utils/slugs.js`:

```js
/* global globalThis */
/**
 * Canonical slug utilities — SINGLE SOURCE OF TRUTH for entity URLs.
 * Shared by the browser (plain script via globalThis.Slugs) and by Node
 * build scripts (scripts/lib/slugs.mjs re-exports this file).
 *
 * Rules (see spec "Part A1"): lowercase, ä→ae ö→oe ü→ue ß→ss, other
 * diacritics stripped via NFD, subscript digits mapped to plain digits,
 * every run of non [a-z0-9] becomes a single dash, edges trimmed.
 */
(function (root) {
  'use strict';

  var SUBSCRIPT_MAP = {
    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',
  };

  function slugify(name) {
    var s = String(name === null || name === undefined ? '' : name);
    // German transliteration FIRST (before NFD would strip the umlaut marker)
    s = s.replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss');
    // General diacritics: decompose and drop combining marks
    s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    s = s.toLowerCase();
    s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, function (ch) {
      return SUBSCRIPT_MAP[ch];
    });
    s = s.replace(/[^a-z0-9]+/g, '-');
    return s.replace(/^-+|-+$/g, '');
  }

  function entityUrl(name) {
    return '/entity/' + slugify(name) + '/';
  }

  /**
   * Legacy-alias slug: lowercase, keep German umlauts, replace all other
   * runs of non [a-z0-9äöüß] with a dash. Used ONLY to emit redirect pages
   * for old umlaut URLs; never for building current links.
   */
  function rawSlug(name) {
    var s = String(name === null || name === undefined ? '' : name).toLowerCase();
    s = s.replace(/[^a-z0-9äöüß]+/g, '-');
    return s.replace(/^-+|-+$/g, '');
  }

  root.Slugs = { slugify: slugify, entityUrl: entityUrl, rawSlug: rawSlug };
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/slugs.test.js`
Expected: PASS (6 describe blocks).

- [ ] **Step 5: Commit**

```bash
git add myhugoapp/static/js/utils/slugs.js tests/slugs.test.js
git commit -m "feat(slugs): canonical slugify/entityUrl utility with tests"
```

---

### Task 2: Node mirror for build scripts + parity test

**Files:**

- Create: `scripts/lib/slugs.mjs`
- Test: `tests/slugs-parity.test.js`

- [ ] **Step 1: Write the failing test**

`tests/slugs-parity.test.js`:

```js
/**
 * Parity: the Node ESM mirror must expose the exact same functions as the
 * browser module (same underlying implementation, same references).
 */
const fs = require('fs');
const path = require('path');

const BROWSER_PATH = path.resolve(
  __dirname,
  '..',
  'myhugoapp',
  'static',
  'js',
  'utils',
  'slugs.js'
);
require(BROWSER_PATH);

const CORPUS = [
  'Essigsäure',
  'Hämoglobin',
  'Größe',
  'Übersäuerung',
  'Hall-Héroult-Prozess',
  'Fe₂O₃',
  'H₂O',
  'Gilbert N. Lewis',
  'Eisen (I)',
  'pH-Wert',
  'Martin-Luther-Universität Halle-Wittenberg',
  'Kohlendioxid (CO₂)',
  'Aminosäuren',
  'Benzoesäure',
  'Weinsäure',
  'Hydrathülle',
  'Luftstabilität',
];

describe('Slugs parity (browser ⇄ Node mirror)', () => {
  it('mirror exposes the identical function references', async () => {
    const mirror = await import('../scripts/lib/slugs.mjs');
    expect(mirror.slugify).toBe(globalThis.Slugs.slugify);
    expect(mirror.entityUrl).toBe(globalThis.Slugs.entityUrl);
    expect(mirror.rawSlug).toBe(globalThis.Slugs.rawSlug);
    expect(typeof mirror.Slugs).toBe('object');
  });

  it('mirror output matches browser module over real-name corpus', async () => {
    const mirror = await import('../scripts/lib/slugs.mjs');
    for (const name of CORPUS) {
      expect(mirror.slugify(name)).toBe(globalThis.Slugs.slugify(name));
      expect(mirror.rawSlug(name)).toBe(globalThis.Slugs.rawSlug(name));
      expect(mirror.entityUrl(name)).toBe(globalThis.Slugs.entityUrl(name));
    }
  });

  it('parity corpus canonical slugs match the previously dead links', async () => {
    const mirror = await import('../scripts/lib/slugs.mjs');
    // The 17 umlaut + 3 special-character legacy URLs, canonicalized:
    expect(mirror.slugify('Aminosäuren')).toBe('aminosaeuren');
    expect(mirror.slugify('Hydrathülle')).toBe('hydrathuelle');
    expect(mirror.slugify('Gilbert N. Lewis')).toBe('gilbert-n-lewis');
    expect(mirror.slugify('Eisen (I)')).toBe('eisen-i');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/slugs-parity.test.js`
Expected: FAIL with `Cannot find module '../scripts/lib/slugs.mjs'`.

- [ ] **Step 3: Write the minimal implementation**

`scripts/lib/slugs.mjs`:

```js
#!/usr/bin/env node
/**
 * Node ESM mirror of the browser slug utility. Re-exports the exact same
 * function references by executing the shared IIFE via createRequire, so
 * client and build tooling cannot drift.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Execute the shared IIFE in this process → sets globalThis.Slugs
const SHARED = path.resolve(
  __dirname,
  '..',
  '..',
  'myhugoapp',
  'static',
  'js',
  'utils',
  'slugs.js'
);
require(SHARED);

export const { slugify, entityUrl, rawSlug, Slugs } = globalThis.Slugs;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/slugs-parity.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/slugs.mjs tests/slugs-parity.test.js
git commit -m "feat(slugs): Node ESM mirror with parity tests"
```

---

### Task 3: Route graph navigation through the canonical util

**Files:**

- Modify: `myhugoapp/static/js/visualization/d3-ego-graph.js` (slugify region ~line 71-79 and click handler ~line 396)
- Test: `tests/d3-ego-graph.test.js` (existing — must stay green)

- [ ] **Step 1: Write the failing test**

Extend `tests/d3-ego-graph.test.js` — add inside the existing describe block that exercises `createFullGraph`/`createEgoGraph` clicks (find the existing click-navigation test, e.g. one asserting `global.location.href` after click; add this sibling test):

```js
it('navigates via Slugs.entityUrl when Slugs is available', () => {
  // Ensure the global Slugs module is present (as it is on the live site)
  const path = require('path');
  require(path.resolve(__dirname, '..', 'myhugoapp', 'static', 'js', 'utils', 'slugs.js'));

  const container = document.createElement('div');
  const data = { articles: [], entities: [{ name: 'Essigsäure', category: 'stoff' }] };
  D3EgoGraph.createFullGraph(container, data, { height: 300 });

  // Click the first rendered node
  const node = container.querySelector('.node') || container.querySelector('circle');
  expect(node).toBeTruthy();
  node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

  expect(global.location.href).toContain('/entity/essigsaeure/');
});
```

(If the graph module renders nodes as `<circle class="node">` SVs — inspect the rendered container in the existing tests to match the real selector; adjust the selector if needed.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/d3-ego-graph.test.js`
Expected: FAIL — current click handler builds `'/entity/' + slugify(d.label) + '/'` which already transliterates German umlauts, so this test may already pass. If it passes, additionally assert that an accented non-German name (`Hall-Héroult-Prozess`) resolves to `hall-heroult-prozess`:

```js
it('navigates accented names via the canonical util', () => {
  const data = { articles: [], entities: [{ name: 'Hall-Héroult-Prozess', category: 'reaktion' }] };
  const container = document.createElement('div');
  D3EgoGraph.createFullGraph(container, data, { height: 300 });
  const node = container.querySelector('.node') || container.querySelector('circle');
  node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  expect(global.location.href).toContain('/entity/hall-heroult-prozess/'); // é→e, not é→''
});
```

Use both tests; the second one must fail before the fix (local `slugify` does not strip `é`).

- [ ] **Step 3: Implement the fix**

In `myhugoapp/static/js/visualization/d3-ego-graph.js`:

Replace the click handler line that builds the entity URL (currently `global.location.href = '/entity/' + slugify(d.label) + '/' ;`) with a call through a new helper, and add the helper next to the existing local `slugify` (keep `slugify` as fallback so the module still works if `Slugs` is not loaded):

```js
function entityHref(name) {
  if (globalThis.Slugs && typeof globalThis.Slugs.entityUrl === 'function') {
    return globalThis.Slugs.entityUrl(name);
  }
  return '/entity/' + slugify(name) + '/';
}
```

and in the click handler:

```js
// Navigate to entity detail (canonical slug — see Slugs util)
global.location.href = entityHref(d.label);
```

- [ ] **Step 4: Run tests**

Run: `npx jest tests/d3-ego-graph.test.js tests/slugs.test.js`
Expected: PASS (both files, including the two new navigation tests).

- [ ] **Step 5: Commit**

```bash
git add myhugoapp/static/js/visualization/d3-ego-graph.js tests/d3-ego-graph.test.js
git commit -m "feat(graph): navigate entity clicks via canonical Slugs.entityUrl"
```

---

### Task 4: Generator — weight-sorted caps, slug maps, legacy aliases

**Files:**

- Modify: `scripts/generate-entity-pages.mjs`
- Test: none new (covered end-to-end by Task 6 audit + CI build); verify locally by running the generator's pure helpers.

- [ ] **Step 1: Write the failing check (logic probe)**

The generator currently reads `myhugoapp/data/kg_data.json`, which is exported from Neo4j. Write a tiny probe that proves the local `slugify` is the problem against a real corpus:

```bash
node -e "
import('./scripts/lib/slugs.mjs').then((mirror) => {
  const legacy = ['Essigsäure','Aminosäuren','Lloyd−Sauerstoff','Hydrathülle','Gilbert N. Lewis','Eisen (I)','Martin-Luther-Universität Halle-Wittenberg'];
  for (const n of legacy) console.log(n, '->', mirror.slugify(n));
});
"
```

Expected output: `Essigsäure -> essigsaeure`, `Aminosäuren -> aminosaeuren`, `Hydrathülle -> hydrathuelle`, `Gilbert N. Lewis -> gilbert-n-lewis`, `Eisen (I) -> eisen-i` (this is the behavior the generator must produce).

- [ ] **Step 2: Modify the generator**

In `scripts/generate-entity-pages.mjs`:

a) Replace the local `slugify` (the function at the top, `function slugify(name) { return name.toLowerCase()... }`) with an import:

```js
import { slugify, rawSlug } from './lib/slugs.mjs';
```

(Delete the old local `slugify` function body entirely.)

b) Replace the `relatedNames` block with a weight-sorted, capped version:

```js
const relatedNames = (entity.relatedEntities || [])
  .map((r) =>
    typeof r === 'string' ? { name: r, weight: 0 } : { name: r.name, weight: r.weight || 0 }
  )
  .filter((r) => r.name)
  .sort((a, b) => b.weight - a.weight)
  .slice(0, 10) // didactic cap: max 10 "Verwandte Begriffe"
  .map((r) => r.name);
const relatedSlugs = {};
relatedNames.forEach((n) => {
  relatedSlugs[n] = slugify(n);
});
const componentSlugs = {};
(entity.components || []).slice(0, 10).forEach((c) => {
  componentSlugs[typeof c === 'string' ? c : c.name] = slugify(typeof c === 'string' ? c : c.name);
});
// Legacy redirect pages: umlaut variant + known special-character overrides
const ALIAS_OVERRIDES = {
  'eisen-i': ['/entity/eiseni/'],
  'gilbert-n-lewis': ['/entity/gilbert-n.-lewis/'],
  'eiseniii-oxid': ['/entity/eiseniii-oxid-fe2o3/'],
};
const slug = slugify(entity.name);
const aliases = [];
if (rawSlug(entity.name) !== slug) {
  aliases.push('/entity/' + rawSlug(entity.name) + '/');
}
(ALIAS_OVERRIDES[slug] || []).forEach((a) => aliases.push(a));
```

c) Extend the emitted frontmatter (before the closing `'---'`), after the `components:` line:

```js
      components.length > 0
        ? `components:\n${components.map((c) => `  - "${escapeYaml(c)}"`).join('\n')}`
        : 'components: []',
      Object.keys(relatedSlugs).length > 0
        ? `relatedSlugs:\n${relatedNames.map((n) => `  "${escapeYaml(n)}": "${relatedSlugs[n]}"`).join('\n')}`
        : '',
      Object.keys(componentSlugs).length > 0
        ? `componentSlugs:\n${Object.keys(componentSlugs)
            .map((c) => `  "${escapeYaml(c)}": "${componentSlugs[c]}"`)
            .join('\n')}`
        : '',
      aliases.length > 0
        ? `aliases:\n${aliases.map((a) => `  - "${a}"`).join('\n')}`
        : '',
```

(`relatedSlugs`/`componentSlugs` are objects — use `Object.keys(...).length` in the guards.)

- [ ] **Step 3: Verify the change against real data**

```bash
# Sanity: slugify via the mirror on the fallback corpus (132 entities)
node -e "
import('./scripts/lib/slugs.mjs').then((m) => {
  const d = JSON.parse(require('fs').readFileSync('data/kg_fallback.json','utf8'));
  const slugs = d.entities.map((e) => m.slugify(e.name));
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  const nonAscii = slugs.filter((s) => /[^a-z0-9-]/.test(s));
  console.log('entities:', d.entities.length, '| duplicates:', dupes.length, '| non-ascii:', nonAscii.length);
  console.log('sample:', d.entities.slice(0,5).map((e) => [e.name, m.slugify(e.name)]));
});
"
```

Expected: `entities: 132 | duplicates: 0 | non-ascii: 0` and clean sample pairs.

- [ ] **Step 4: Verify Hugo template consumption (frontmatter shape)**

```bash
# Quick standalone check of the frontmatter snippet the generator emits for a sample entity:
node -e "
import('./scripts/lib/slugs.mjs').then((m) => {
  const entity = { name: 'Essigsäure', category: 'stoff', relatedEntities: [{ name: 'Carbonsäuren', weight: 0.9 }, 'Säure-Base-Reaktion'], components: ['Wasserstoff', 'Kohlenstoff'] };
  const relatedNames = entity.relatedEntities.map((r) => typeof r === 'string' ? {name:r, weight:0} : {name:r.name, weight:r.weight||0}).sort((a,b)=>b.weight-a.weight).slice(0,10).map((r)=>r.name);
  const slugs = {}; relatedNames.forEach((n) => slugs[n] = m.slugify(n));
  const cs = {}; entity.components.forEach((c) => cs[c] = m.slugify(c));
  console.log(JSON.stringify({ name: entity.name, canonical: m.slugify(entity.name), aliases: ['/entity/' + m.rawSlug(entity.name) + '/'], relatedSlugs: slugs, componentSlugs: cs }, null, 2));
});
"
```

Expected: canonical `essigsaeure`, alias `/entity/essigsäure/`, `Carbonsäuren -> carbonsaeuren` first (weight 0.9), `Säure-Base-Reaktion -> saeure-base-reaktion`.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-entity-pages.mjs
git commit -m "feat(entities): canonical slug maps, weight caps and legacy aliases in page generator"
```

---

### Task 5: entity/single.html — SSR link fix, Voraussetzungen card, caps, tooltips

**Files:**

- Modify: `myhugoapp/layouts/entity/single.html`
- Test: `tests/link-audit.test.js` (fixture-based, written in Task 6 — the fixture here drives it)

- [ ] **Step 1: Write the failing fixture (regression capture)**

Create `tests/fixtures/entity-page-ssr.html` — a minimal, representative snippet of the SSR refs region **as it is today (buggy `urlize`)** — to prove the audit detects it later:

```html
<!doctype html>
<html>
  <body>
    <!-- KMK-Standards -->
    <div class="entity-card">
      <div class="entity-card-header">📋 KMK-Standards</div>
      <div class="entity-card-body">
        <div class="entity-rel-tags">
          <a href="/entity/didaktik-säure-base-konzept/" class="entity-tag entity-tag-kmk"
            >didaktik-säure-base-konzept</a
          >
        </div>
      </div>
    </div>
    <!-- Quellen -->
    <div class="entity-card">
      <div class="entity-card-header">📚 Quellen</div>
      <div class="entity-card-body">
        <div class="entity-rel-tags">
          <a href="/entity/friedrich-wöhler/" class="entity-tag entity-tag-quelle"
            >Friedrich Wöhler</a
          >
        </div>
      </div>
    </div>
    <!-- Verwandte Begriffe -->
    <div class="entity-card">
      <div class="entity-card-header">🔗 Verwandte Begriffe</div>
      <div class="entity-card-body">
        <div class="entity-rel-tags">
          <a href="/entity/essigsäure/" class="entity-tag">Essigsäure</a>
          <a href="/entity/weinsäure/" class="entity-tag">Weinsäure</a>
        </div>
      </div>
    </div>
    <!-- Bestandteile (vor Fix: span ohne Link) -->
    <div class="entity-card">
      <div class="entity-card-header">Bestandteile</div>
      <div class="entity-card-body">
        <div class="entity-rel-tags">
          <span class="entity-tag">Wasserstoff</span>
        </div>
      </div>
    </div>
  </body>
</html>
```

(The audit in Task 6 must flag every non-canonical href: `essigsäure`, `weinsäure`, `friedrich-wöhler`, `didaktik-säure-base-konzept`.)

- [ ] **Step 2: Apply the template fix**

In `myhugoapp/layouts/entity/single.html`, replace the **three** SSR tag blocks (`{{ if $kmkRefs }}`, `{{ if $quelleRefs }}`, `{{ if $otherRefs }}`) so each uses `relatedSlugs` with `urlize` only as a never-hit safety fallback:

```html
{{ if $kmkRefs }}
<div class="entity-card">
  <div class="entity-card-header">📋 KMK-Standards</div>
  <div class="entity-card-body">
    <div class="entity-rel-tags">
      {{ range $kmkRefs }} {{ $rSlug := index $.Params.relatedSlugs . | default (. | urlize) }} {{
      if $rSlug }}<a
        href="/entity/{{ $rSlug }}/"
        class="entity-tag entity-tag-kmk"
        title="Didaktischer Standard"
        >{{ . }}</a
      >{{ end }} {{ end }}
    </div>
  </div>
</div>
{{ end }} {{ if $quelleRefs }}
<div class="entity-card">
  <div class="entity-card-header">📚 Quellen</div>
  <div class="entity-card-body">
    <div class="entity-rel-tags">
      {{ range first 8 $quelleRefs }} {{ $rSlug := index $.Params.relatedSlugs . | default (. |
      urlize) }} {{ if $rSlug }}<a
        href="/entity/{{ $rSlug }}/"
        class="entity-tag entity-tag-quelle"
        title="Quelle"
        >{{ . }}</a
      >{{ end }} {{ end }}
    </div>
  </div>
</div>
{{ end }} {{ if $otherRefs }}
<div class="entity-card">
  <div class="entity-card-header">🔗 Verwandte Begriffe</div>
  <div class="entity-card-body">
    <div class="entity-rel-tags">
      {{ range first 10 $otherRefs }} {{ $rSlug := index $.Params.relatedSlugs . | default (. |
      urlize) }} {{ if $rSlug }}<a
        href="/entity/{{ $rSlug }}/"
        class="entity-tag"
        title="Verwandter Begriff"
        >{{ . }}</a
      >{{ end }} {{ end }}
    </div>
  </div>
</div>
{{ end }}
```

Replace the `{{ if $entity.components }}` card (currently a span-only "🧩 Bestandteile" card) with the didactic "✅ Voraussetzungen" card that links where a canonical slug exists and sits ABOVE "🔗 Verwandte Begriffe":

```html
{{ if $entity.components }}
<div class="entity-card entity-card-prereq">
  <div class="entity-card-header">✅ Voraussetzungen</div>
  <div class="entity-card-body">
    <div class="entity-rel-tags">
      {{ range first 10 $entity.components }} {{ $cSlug := index $.Params.componentSlugs . }} {{ if
      $cSlug }}<a
        href="/entity/{{ $cSlug }}/"
        class="entity-tag entity-tag-prereq"
        title="Voraussetzung / Bestandteil"
        >{{ . }}</a
      >{{ else }}<span class="entity-tag entity-tag-prereq" title="Voraussetzung / Bestandteil"
        >{{ . }}</span
      >{{ end }} {{ end }}
    </div>
  </div>
</div>
{{ end }}
```

(The Voraussetzungen card replaces the old Bestandteile card position — place it between "Verwandte Begriffe"…, i.e., directly before the `{{ if $otherRefs }}` card so it renders above it; delete the old components card block.)

Add the CSS next to the existing `.entity-tag-*` rules (~line 187-201 in the file):

```css
.entity-tag-prereq {
  background: #e8f5e9;
  color: #2e7d32;
  border-color: #a5d6a7;
}
.entity-tag-prereq:hover {
  background: #c8e6c9;
}
.entity-card-prereq .entity-card-header {
  color: #2e7d32;
}
```

and inside the `@media(prefers-color-scheme:dark)` block (near the existing dark tag rules):

```css
.entity-tag-prereq {
  background: #1b3a24;
  color: #a5d6a7;
  border-color: #2e7d32;
}
```

- [ ] **Step 3: Cap the client-side fallback tag list**

In the same file, the client-side fallback renderer (the `if (!isSSR)` path, function `render(data)`) builds the "🔗 Verwandte Begriffe" tags in a loop over `g`. Add a cap and use the shared util:

```js
for (_ = 0; _ < Math.min(g.length, 10); _++) {
  D = globalThis.Slugs
    ? globalThis.Slugs.slugify(g[_])
    : g[_].toLowerCase()
        .replace(/[üÜ]/g, 'ue')
        .replace(/[öÖ]/g, 'oe')
        .replace(/[äÄ]/g, 'ae')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
  o +=
    '<a href="/entity/' +
    D +
    '/" class="entity-tag" title="Verwandter Begriff">' +
    e(g[_]) +
    '</a>';
}
```

(after this edit, remove the old un-capped loop that built the same tags).

- [ ] **Step 4: Verify template renders (Hugo build)**

```bash
npm run hugo:build 2>&1 | tail -5
```

Expected: hugo succeeds; then check one generated page has no `%C3%A4`-style entity hrefs and has the Voraussetzungen card:

```bash
grep -o 'href="/entity/[^"]*"' myhugoapp/public/entity/saeure-base-reaktion/index.html | head -20
grep -c 'entity-card-prereq' myhugoapp/public/entity/saeure-base-reaktion/index.html
```

(These may be run against any generated entity page; if `public/` contains pages built earlier, re-run hugo first. The page `saeure-base-reaktion` must exist after generation — if the local `kg_data.json` is empty, use `data/kg_fallback.json` as provisional input, note that CI regenerates properly.)

Expected: only `[a-z0-9-]` slugs; `entity-card-prereq` present on pages with components.

- [ ] **Step 5: Commit**

```bash
git add myhugoapp/layouts/entity/single.html tests/fixtures/entity-page-ssr.html
git commit -m "feat(entity): canonical SSR link slugs, Voraussetzungen card, chip caps"
```

---

### Task 6: Link-audit script + Jest audit tests

**Files:**

- Create: `scripts/audit-entity-links.mjs`
- Test: `tests/link-audit.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/link-audit.test.js`:

```js
/**
 * Link audit — the guard that no dead /entity/ link can be introduced.
 * Pure functions: extract hrefs from HTML, resolve against a file tree.
 */
const fs = require('fs');
const path = require('path');

const FIXTURE = path.resolve(__dirname, 'fixtures', 'entity-page-ssr.html');

describe('audit-entity-links (pure functions)', () => {
  let audit;
  beforeAll(async () => {
    audit = await import('../scripts/audit-entity-links.mjs');
  });

  it('extracts only real <a href> entity links (no inline scripts)', () => {
    const html =
      '<a href="/entity/essigsäure/">x</a><script>var x = "<a href=\'/entity/script-junk/\'>";</script><a href="https://chemie-lernen.org/entity/gilbert-n-lewis/">y</a><a href="/themenbereiche/saeuren-basen/">z</a><a href="/entity/hall-heroult-prozess/">w</a>';
    const hrefs = audit.extractEntityHrefs(html);
    expect(hrefs).toContain('/entity/essigsäure/');
    expect(hrefs).toContain('/entity/gilbert-n-lewis/');
    expect(hrefs).toContain('/entity/hall-heroult-prozess/');
    expect(hrefs).not.toContain('/entity/script-junk/');
    expect(hrefs).not.toContain('/themenbereiche/saeuren-basen/');
  });

  it('flags every non-canonical href in the buggy fixture', () => {
    const html = fs.readFileSync(FIXTURE, 'utf8');
    const hrefs = audit.extractEntityHrefs(html);
    // "Known entity set" — canonical slugs that DO exist
    const knownSlugs = new Set([
      'essigsaeure',
      'weinsaeure',
      'friedrich-woehler',
      'didaktik-saeure-base-konzept',
      'wasserstoff',
    ]);
    const problems = audit.findBrokenLinks(hrefs, knownSlugs);
    expect(problems.length).toBeGreaterThanOrEqual(4); // 4 canonicalizable umlaut links
    expect(problems.some((p) => p.href === '/entity/essigsäure/')).toBe(true);
  });

  it('accepts canonical and legacy-alias hrefs when pages exist in the tree', () => {
    // simulate a built tree: canonical page + alias redirect page
    const root = path.join(require('os').tmpdir(), 'audit-tree-' + Date.now());
    const p1 = path.join(root, 'entity', 'essigsaeure', 'index.html');
    const p2 = path.join(root, 'entity', 'essigsäure', 'index.html'); // Hugo alias page
    fs.mkdirSync(path.dirname(p1), { recursive: true });
    fs.mkdirSync(path.dirname(p2), { recursive: true });
    fs.writeFileSync(p1, '<html></html>');
    fs.writeFileSync(p2, '<html><meta http-equiv="refresh"></html>');
    const missing = audit.missingPages(root, [
      '/entity/essigsaeure/',
      '/entity/essigsäure/',
      '/entity/gilbert-n-lewis/',
    ]);
    try {
      expect(missing).toEqual(['/entity/gilbert-n-lewis/']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/link-audit.test.js`
Expected: FAIL — `Cannot find module '../scripts/audit-entity-links.mjs'`.

- [ ] **Step 3: Implement the audit script**

`scripts/audit-entity-links.mjs`:

```js
#!/usr/bin/env node
/**
 * Link audit — walks a built Hugo public/ tree and fails on any /entity/
 * href that resolves to neither a canonical entity page nor a legacy alias
 * (redirect) page. Runs as a Docker build stage and as `node scripts/audit-entity-links.mjs [publicDir]`.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_RE = /<script[^>]*>[\s\S]*?<\/script>/gi;
const HREF_RE = /<a[^>]+href=([^\s>]+)/gi;

/** Extract real <a href> values pointing at /entity/… (absolute or same-origin), URL-decoded. */
export function extractEntityHrefs(html) {
  const stripped = html.replace(SCRIPT_RE, '');
  const out = [];
  let m;
  while ((m = HREF_RE.exec(stripped)) !== null) {
    let href = m[1]
      .replace(/^["']|["']$/g, '')
      .split('#')[0]
      .split('?')[0];
    if (href.startsWith('//')) continue;
    if (href.startsWith('http')) {
      try {
        const u = new URL(href);
        if (u.hostname !== 'chemie-lernen.org') continue;
        href = u.pathname;
      } catch {
        continue;
      }
    }
    if (href.startsWith('/entity/')) {
      try {
        out.push(decodeURIComponent(href));
      } catch {
        out.push(href);
      }
    }
  }
  return out;
}

/** Which hrefs do NOT map to a known canonical slug? */
export function findBrokenLinks(hrefs, knownSlugs) {
  const problems = [];
  for (const href of hrefs) {
    const slug = href.replace(/^\/entity\//, '').replace(/\/+$/, '');
    const canonical = slug
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!knownSlugs.has(canonical)) {
      problems.push({ href, canonical });
    }
  }
  return problems;
}

/** Missing page files for the given hrefs inside a built tree (canonical + alias pages). */
export function missingPages(root, hrefs) {
  const missing = [];
  for (const href of hrefs) {
    const rel = href.replace(/^\/+/, '');
    const file = join(root, rel, 'index.html'); // href ends with '/'
    if (!existsSync(file)) missing.push(href);
  }
  return missing;
}

function collectHrefs(root, out = []) {
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== 'pagefind') collectHrefs(full, out);
    } else if (entry.endsWith('.html')) {
      try {
        out.push(...extractEntityHrefs(readFileSync(full, 'utf8')));
      } catch {
        /* skip unreadable */
      }
    }
  }
  return out;
}

function main() {
  const root = resolve(process.argv[2] || 'myhugoapp/public');
  if (!existsSync(root)) {
    console.error('[audit] public dir not found: ' + root);
    process.exit(1);
  }
  const hrefs = [...new Set(collectHrefs(root))];
  console.log('[audit] /entity/ hrefs found: ' + hrefs.length);

  // Known slugs: every directory directly under public/entity/
  const entityDir = join(root, 'entity');
  const knownSlugs = existsSync(entityDir)
    ? readdirSync(entityDir).filter((e) => statSync(join(entityDir, e)).isDirectory())
    : [];
  const canonicalBroken = findBrokenLinks(hrefs, new Set(knownSlugs));
  const missing = missingPages(root, hrefs);

  console.log('[audit] canonical-mismatch: ' + canonicalBroken.length);
  for (const p of canonicalBroken)
    console.log('  ✗ ' + p.href + ' → canonical ' + p.canonical + ' (missing)');
  console.log('[audit] missing files: ' + missing.length);
  for (const p of missing) console.log('  ✗ ' + p);

  if (canonicalBroken.length > 0 || missing.length > 0) {
    console.error('[audit] FAIL: dead /entity/ links detected');
    process.exit(1);
  }
  console.log('[audit] OK: all entity links resolvable');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 4: Run tests + audit against the fixture tree**

Run: `npx jest tests/link-audit.test.js`
Expected: PASS (3 tests).

Then run the CLI against the fixture to see the failure mode (must exit 1):

```bash
FIX=$(mktemp -d); mkdir -p "$FIX/entity/essigsaeure" "$FIX/entity/weinsaeure" "$FIX/entity/friedrich-woehler" "$FIX/entity/didaktik-saeure-base-konzept" "$FIX/entity/wasserstoff"; cp tests/fixtures/entity-page-ssr.html "$FIX/entity/essigsaeure/index.html"; node scripts/audit-entity-links.mjs "$FIX"; echo "exit=$?"; rm -rf "$FIX"
```

Expected: exit=1 with `essigsäure`, `weinsäure`, `friedrich-wöhler`, `didaktik-säure-base-konzept` listed as canonical-mismatch (the fixture must NOT contain `index.html` files at the umlaut paths — that proves canonicalization is required).

Then a green tree (alias redirect pages present):

```bash
FIX=$(mktemp -d); for s in essigsaeure weinsaeure friedrich-woehler didaktik-saeure-base-konzept wasserstoff; do mkdir -p "$FIX/entity/$s"; echo "<html></html>" > "$FIX/entity/$s/index.html"; done; mkdir -p "$FIX/entity/essigsäure" "$FIX/entity/weinsäure" "$FIX/entity/friedrich-wöhler" "$FIX/entity/didaktik-säure-base-konzept"; for s in "essigsäure" "weinsäure" "friedrich-wöhler" "didaktik-säure-base-konzept"; do echo "<html><meta http-equiv=refresh content='0;url=/entity/essigsaeure/'></html>" > "$FIX/entity/$s/index.html"; done; cp tests/fixtures/entity-page-ssr.html "$FIX/entity/essigsaeure/index.html"; node scripts/audit-entity-links.mjs "$FIX"; echo "exit=$?"; rm -rf "$FIX"
```

Expected: exit=0, `OK: all entity links resolvable`.

- [ ] **Step 5: Commit**

```bash
git add scripts/audit-entity-links.mjs tests/link-audit.test.js
git commit -m "feat(audit): link-audit script + jest tests for dead entity links"
```

---

### Task 7: CI — Docker audit stage + deploy smoke check for legacy URLs

**Files:**

- Modify: `Dockerfile`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the failing check (Docker build must fail before the fix is enforced)**

Run the current build locally to confirm the audit would catch a regression only once wired in — first wire it in, then verify:

- [ ] **Step 2: Add the audit stage to the Dockerfile**

Modify `Dockerfile`: insert a new stage between the Hugo build and Pagefind; Pagefind now copies from the audit stage:

```dockerfile
# ---- Stage 1: Hugo Build ----
FROM hugomods/hugo:0.154.5 AS hugo
COPY myhugoapp /src
WORKDIR /src
RUN hugo --minify --baseURL https://chemie-lernen.org && \
    echo "Hugo build complete: $(ls -la public/ | wc -l) entries"

# ---- Stage 1b: Entity Link Audit ----
FROM node:22-alpine AS audit
COPY --from=hugo /src/public /site
COPY scripts /scripts
RUN node /scripts/audit-entity-links.mjs /site && \
    echo "Entity link audit passed"

# ---- Stage 2: Pagefind Search Index ----
FROM node:22-alpine AS pagefind
RUN npm install -g pagefind
COPY --from=audit /site /site
RUN npx pagefind --site /site && \
    echo "Pagefind indexing complete"
```

(Diff: add the audit stage; change `COPY --from=hugo /src/public /site` to `COPY --from=audit /site /site` in the pagefind stage.)

- [ ] **Step 3: Build the image locally to verify audit runs**

Run: `docker build -t chemie-audit-check . 2>&1 | tail -25`
Expected: image builds; output contains `Entity link audit passed`; if any `/entity/` href is currently broken in the built tree the build FAILS with the audit listing (that is the intended fail-fast; fix data/generator accordingly — the generator aliases in Task 4 should make the current tree green).

- [ ] **Step 4: Add the legacy-URL smoke check to deploy.yml**

In `.github/workflows/deploy.yml`, inside the Deploy-via-SSH step's script block, after the existing smoke checks (e.g. after check #6 `/api/kg-stats`), append:

```bash
            # 7. Legacy umlaut URL redirects to its canonical entity page
            LEGACY_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "$SITE/entity/essigs%C3%A4ure/")
            if [ "$LEGACY_CODE" != "200" ]; then echo "❌ SMOKE FAIL: legacy /entity/essigsäure/ returned $LEGACY_CODE"; exit 1; fi
            echo "  ✓ legacy umlaut entity URL redirects (200)"
```

- [ ] **Step 5: Verify the workflow file is valid YAML**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml')); print('deploy.yml OK')"`
Expected: `deploy.yml OK` (if PyYAML is unavailable, use `ruby -ryaml -e 'YAML.load_file(".github/workflows/deploy.yml"); puts "OK"'`).

- [ ] **Step 6: Run the full unit suite**

Run: `npm test`
Expected: all tests pass (existing + new slugs/parity/link-audit tests).

- [ ] **Step 7: Commit**

```bash
git add Dockerfile .github/workflows/deploy.yml
git commit -m "ci: entity link audit build stage + legacy umlaut URL smoke check"
```

---

## Self-Review (against spec)

**Spec coverage (Part A):**

- A1 shared slug module → Task 1; Node mirror + parity → Task 2 ✓
- A2 all link producers → Task 3 (graph), Task 4+5 (generator + entity/single.html SSR + client fallback) ✓
- A3 CI link-audit → Task 6 (script + jest) + Task 7 (Docker stage) ✓
- A4 legacy redirects → Task 4 (rawSlug aliases + ALIAS_OVERRIDES) + Task 7 smoke check ✓
- Didactic sharpening (chip caps ≤10, Voraussetzungen card, tooltips) → Task 5 ✓ (Quellen cap 8, Verwandte 10, Voraussetzungen 10)

**Placeholder scan:** No TBD/TODO; all steps carry real code and commands. Task 3 contains a conditional about the exact node selector in d3-ego-graph tests (existing tests must be inspected; the second test provably fails pre-fix, so implementation is deterministic).

**Type consistency:** `Slugs.slugify/entityUrl/rawSlug` defined in Task 1, re-exported identically in Task 2 (`export const { ... } = globalThis.Slugs`), consumed in Task 3 (`entityHref`), Task 4 (`slugify, rawSlug` import), Task 5 (`globalThis.Slugs.slugify`), Task 6 (own canonicalizer for audit — same rules). `componentSlugs`/`relatedSlugs` maps defined in Task 4 and consumed in Task 5 templates; `ALIAS_OVERRIDES` keys (`eisen-i`, `gilbert-n-lewis`, `eiseniii-oxid`) must be verified against real kg_data in Task 4 Step 4 — if a key does not match the canonical entity slug, the engineer adjusts the override to the actual slug, and the Task 6 audit + Task 7 build verify it.

**Known risk:** The `ALIAS_OVERRIDES` canonical slugs (`eisen-i`, `eiseniii-oxid`) are inferred from the live site; if the real entity names in kg_data differ, adjust the override keys (verified by the green Docker build in Task 7 Step 3 — the audit lists any still-broken legacy URL as canonical-mismatch, which the override list then covers).

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-26-wissensnetz-part-a-slugs-link-audit.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?** (Part B — Themen-Portal Graph — gets its own plan after Part A ships.)
