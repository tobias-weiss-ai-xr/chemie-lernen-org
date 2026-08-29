/**
 * Link audit — the guard that no dead /entity/ link can be introduced.
 * Pure functions: extract hrefs from HTML, resolve against a file tree.
 *
 * Contract (defined here, authoritative):
 *  - extractEntityHrefs: real <a href> values pointing at /entity/…, URL-decoded,
 *    inline <script> bodies stripped (client-side generated anchors must not count).
 *  - findBrokenLinks: hrefs whose canonicalized slug (shared slugify) is NOT a
 *    known entity slug → dead link. Umlaut hrefs count as fine HERE iff their
 *    canonical form exists (they still need a target file — see missingPages).
 *  - missingPages: hrefs whose target file (canonical page OR Hugo alias page)
 *    does not exist in the built tree.
 */
const fs = require('fs');
const path = require('path');

const FIXTURE = path.resolve(__dirname, 'fixtures', 'entity-page-ssr.html');

describe('audit-entity-links (pure functions)', () => {
  let audit;
  beforeAll(async () => {
    audit = await import('../scripts/audit-entity-links.mjs');
  });

  const KNOWN = new Set([
    'essigsaeure',
    'weinsaeure',
    'friedrich-woehler',
    'didaktik-saeure-base-konzept',
    'wasserstoff',
    'gilbert-n-lewis',
  ]);

  it('extracts only real <a href> entity links (no inline scripts, no comments)', () => {
    const html =
      '<!-- Header: loader includes <script src="/js/utils/slugs.js"></script> -->' +
      '<a href="/entity/essigsäure/">x</a><script>var x = "<a href=\'/entity/script-junk/\'>";</script>' +
      '<a href="https://chemie-lernen.org/entity/gilbert-n-lewis/">y</a>' +
      '<a href="/themenbereiche/saeuren-basen/">z</a>' +
      '<a href="/entity/hall-heroult-prozess/">w</a>';
    const hrefs = audit.extractEntityHrefs(html);
    expect(hrefs).toContain('/entity/essigsäure/');
    expect(hrefs).toContain('/entity/gilbert-n-lewis/');
    expect(hrefs).toContain('/entity/hall-heroult-prozess/');
    expect(hrefs).not.toContain('/entity/script-junk/');
    expect(hrefs).not.toContain('/themenbereiche/saeuren-basen/');
  });

  it('flags dead links (canonical form unknown) but resolves umlaut hrefs to known slugs', () => {
    const hrefs = audit.extractEntityHrefs(fs.readFileSync(FIXTURE, 'utf8'));
    expect(hrefs).not.toContain('/entity/script-junk/');
    expect(hrefs).not.toContain('/entity/noch-ein-script-link/');
    const problems = audit.findBrokenLinks(hrefs.concat('/entity/hall-heroult-prozess/'), KNOWN);
    const flagged = problems.map((p) => p.href);
    // truly dead: canonicalized slug not in the known set
    expect(flagged).toContain('/entity/hall-heroult-prozess/');
    // breadcrumb root href is never flagged
    expect(flagged).not.toContain('/entity/');
    // umlaut hrefs are NOT dead — their canonical form exists
    expect(flagged).not.toContain('/entity/essigsäure/');
    expect(flagged).not.toContain('/entity/weinsäure/');
    expect(flagged).not.toContain('/entity/friedrich-wöhler/');
    expect(flagged).not.toContain('/entity/didaktik-säure-base-konzept/');
    // canonical hrefs are never flagged
    expect(flagged).not.toContain('/entity/wasserstoff/');
    expect(flagged).not.toContain('/entity/gilbert-n-lewis/');
  });

  it('reports umlaut hrefs as missing when only canonical pages exist (pre-alias tree)', () => {
    const root = path.join(require('os').tmpdir(), 'audit-tree-' + Date.now());
    for (const s of ['essigsaeure', 'wasserstoff']) {
      fs.mkdirSync(path.join(root, 'entity', s), { recursive: true });
      fs.writeFileSync(path.join(root, 'entity', s, 'index.html'), '<html></html>');
    }
    const hrefs = audit.extractEntityHrefs(fs.readFileSync(FIXTURE, 'utf8'));
    try {
      const missing = audit.missingPages(root, hrefs);
      expect(missing).toContain('/entity/essigsäure/');
      expect(missing).toContain('/entity/friedrich-wöhler/');
      expect(missing).not.toContain('/entity/wasserstoff/');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('accepts canonical + legacy-alias hrefs when pages exist in the tree', () => {
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

  it('regression: a POST-FIX SSR page produces zero problems, zero umlaut hrefs', () => {
    // The fixed single.html renders canonical hrefs only; a legacy alias
    // href (gilbert-n.-lewis) may appear in old content and must pass as
    // long as the alias page exists. Script bodies contain umlaut strings
    // but must not leak into href extraction.
    const fixedHtml = `<main><section>
      <a href="/entity/essigsaeure-ch3cooh/" class="entity-tag" title="Verwandter Begriff">Essigsäure (CH3COOH)</a>
      <a href="/entity/gilbert-n.-lewis/" class="entity-tag" title="Verwandter Begriff">Gilbert N. Lewis</a>
      <a href="/entity/friedrich-woehler/" class="entity-tag" title="Verwandter Begriff">Friedrich Wöhler</a>
      <a href="/entity/" class="entity-breadcrumb">Wissensnetz</a>
    </section>
    <script>
      var kmkHtml = '<a href="/entity/didaktik-säure-base-konzept/">';
      document.write('<a href="/entity/'" + '+esc(kSlug)+'"/">');
    </script></main>`;
    const hrefs = audit.extractEntityHrefs(fixedHtml);
    expect(hrefs).not.toContain('/entity/didaktik-säure-base-konzept/');
    expect(hrefs).not.toContain('/entity/essigsaeure-ch3cooh/'.replace('-ch3cooh', ''));
    const problems = audit.findBrokenLinks(
      hrefs,
      new Set(['essigsaeure-ch3cooh', 'gilbert-n-lewis', 'friedrich-woehler'])
    );
    expect(problems).toEqual([]);
  });
});
