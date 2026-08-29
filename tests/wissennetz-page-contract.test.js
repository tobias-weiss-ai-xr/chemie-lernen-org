/**
 * Source contract tests — Part B Task 3/6.
 *
 * Guards the hub wiring on the Wissensnetz page:
 *  - slugs.js must load BEFORE d3-ego-graph.js (entityHref prefers Slugs)
 *  - the page boots the hub (window.WissennetzHub.init) instead of the
 *    removed wissennetz-graph.js full-graph script
 *  - no remaining reference to the deleted wissennetz-graph.js
 *  - entity links inside the hub must always use Slugs.entityUrl (canonical
 *    slug contract from Part A) — never a raw location assignment.
 */
const fs = require('fs');
const path = require('path');

const LAYOUT = path.resolve(__dirname, '..', 'myhugoapp', 'layouts', '_default', 'wissennetz.html');
const HUB = path.resolve(__dirname, '..', 'myhugoapp', 'static', 'js', 'wissennetz-hub.js');
const D3 = path.resolve(
  __dirname,
  '..',
  'myhugoapp',
  'static',
  'js',
  'visualization',
  'd3-ego-graph.js'
);

describe('wissennetz page — script order (Part B Task 3)', () => {
  const html = fs.readFileSync(LAYOUT, 'utf8');
  const scriptSrcs = [
    ...html.matchAll(/<script\s+src="\{\{\s*"([^"]+)"\s*\|\s*relURL\s*\}\}"/g),
  ].map((m) => m[1]);

  test('loads slugs.js before d3-ego-graph.js', () => {
    const iSlugs = scriptSrcs.findIndex((s) => s.includes('utils/slugs.js'));
    const iD3 = scriptSrcs.findIndex((s) => s.includes('visualization/d3-ego-graph.js'));
    expect(iSlugs).toBeGreaterThanOrEqual(0);
    expect(iD3).toBeGreaterThan(iSlugs);
  });

  test('loads the hub and bootstraps init()', () => {
    expect(scriptSrcs.some((s) => s.includes('wissennetz-hub.js'))).toBe(true);
    expect(html).toMatch(/WissennetzHub\.init/);
  });

  test('no reference to the deleted wissennetz-graph.js remains', () => {
    expect(scriptSrcs.some((s) => s.includes('wissennetz-graph.js'))).toBe(false);
    expect(html).not.toMatch(/wissennetz-graph\.js/);
  });
});

describe('wissennetz hub — entity link contract (Part A + B)', () => {
  const hubSrc = fs.readFileSync(HUB, 'utf8');
  const d3Src = fs.readFileSync(D3, 'utf8');

  test('hub page navigation delegates to D3EgoGraph (no raw /entity/ strings)', () => {
    // The hub itself never builds /entity/ URLs — only the graph renderers do.
    expect(hubSrc).not.toMatch(/['"`]\/entity\//);
  });

  test('d3 entityHref is exported and Slugs-preferring', () => {
    expect(d3Src).toMatch(/function entityHref/);
    expect(d3Src).toMatch(/globalThis\.Slugs/);
    expect(d3Src).toMatch(/entityHref: entityHref/);
  });

  test('page-level init exists after DOM ready (scripts run at end of body)', () => {
    expect(hubSrc).toMatch(/window\.WissennetzHub\s*=\s*\{/);
    expect(hubSrc).toMatch(/init\s*,\s*$/m);
  });
});
