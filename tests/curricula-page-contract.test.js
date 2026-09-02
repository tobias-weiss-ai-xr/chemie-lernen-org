/**
 * Source contract tests — Part B Task 5/6.
 *
 * Curricula-Landkarte page: slugs.js + d3-ego-graph.js must precede
 * curricula-state.js (entity links prefer Slugs.entityUrl), the rendered
 * topic titles must not build raw /entity/ + toSlug URLs, operator verbs
 * highlight via .kg-operator, and the topic graph toggle caps at 30.
 */
const fs = require('fs');
const path = require('path');

const LAYOUT = path.resolve(
  __dirname,
  '..',
  'myhugoapp',
  'layouts',
  '_default',
  'curricula-state.html'
);
const SCRIPT = path.resolve(__dirname, '..', 'myhugoapp', 'static', 'js', 'curricula-state.js');

describe('curricula-state page — script order (Part B Task 5)', () => {
  const html = fs.readFileSync(LAYOUT, 'utf8');
  const scriptSrcs = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);

  test('loads slugs.js before d3-ego-graph.js before curricula-state.js', () => {
    const iSlugs = scriptSrcs.findIndex((s) => s.includes('utils/slugs.js'));
    const iD3 = scriptSrcs.findIndex((s) => s.includes('visualization/d3-ego-graph.js'));
    const iState = scriptSrcs.findIndex((s) => s.includes('curricula-state.js'));
    expect(iSlugs).toBeGreaterThanOrEqual(0);
    expect(iD3).toBeGreaterThan(iSlugs);
    expect(iState).toBeGreaterThan(iD3);
  });

  test('defines .kg-operator and .kg-graph-toggle styles', () => {
    expect(html).toMatch(/\.kg-operator/);
    expect(html).toMatch(/\.kg-graph-toggle/);
  });
});

describe('curricula-state.js — entity link + KMK contracts (Part B Task 5)', () => {
  const src = fs.readFileSync(SCRIPT, 'utf8');

  test('topic links are 404-safe (UXF-011a: searchHref-Fallback + Entity-Rewrite)', () => {
    // Seit UXF-011a: Fallback ist die Pagefind-Suche (Topic-Slugs sind keine
    // Entity-URLs); existierende Entity-Seiten werden nach dem Rendern durch
    // utils/entity-links.js (Manifest) in hrefs umgeschrieben.
    expect(src).toMatch(/searchHref\(topic\.title \|\| topic\.slug\)/);
    expect(src).toMatch(/data-entity-name=/);
    expect(src).toMatch(/CurriculaEntityLinks/);
    // Kein rohes /entity/-String-Building mehr
    expect(src).not.toMatch(/href="\/entity\/"\s*\+/);
    expect(src).not.toMatch(/href='\/entity\/'\s*\+/);
  });

  test('caps visible Lernziele at 8 (didactic pass)', () => {
    expect(src).toMatch(/slice\(0, 8\)/);
    expect(src).not.toMatch(/slice\(0, 10\)/);
  });

  test('highlights KMK operator verbs', () => {
    expect(src).toMatch(/KMK_OPERATORS/);
    expect(src).toMatch(/highlightOperators\(escapeHtml\(objText\)\)/);
  });

  test('graph toggle fetches kg-data once and caps at 30', () => {
    expect(src).toMatch(/api\/kg-data\?limit=550/);
    expect(src).toMatch(/kgDataPromise/);
    expect(src).toMatch(/cap:\s*30/);
    expect(src).toMatch(/abort/i);
  });
});
