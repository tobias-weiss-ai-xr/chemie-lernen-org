/**
 * UXF-060: Sitewite Struktur-Checks über den GESAMTEN Hugo-Build
 * (jede gerenderte HTML-Datei, nicht nur Stichproben-Seiten).
 *
 * Rein statisch (Regex über gerenderte HTML-Strings — kein DOM nötig):
 *  - duplicateIds:        doppelte id="…" pro Seite (brechen Labels, JS, ARIA)
 *  - deadAnchors:         href="#x" ohne zugehöriges id="x" auf der Seite
 *  - danglingAriaRefs:    aria-labelledby/describedby zeigen auf fehlende IDs
 *  - deadInternalLinks:   href/src auf interne Pfade, die im Build nicht existieren
 *
 * Deckt auch Posts, Tag-Seiten, Curricula-/Modulhandbuch-Detailseiten ab —
 * die der 14-Seiten-Render-Scan aus UXF-059 nicht sieht.
 * Skipped ohne hugo-extended (Build braucht SCSS — wie contrast-rendered).
 */

import { describe, beforeAll, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SITE_ROOT = path.resolve('node_modules/.cache/hugo-struct');
const OWN_ORIGIN = 'https://chemie-lernen.org';
// /pagefind/ = Suchindex, der erst im Deploy gebaut wird — lokal nie im Build
const SKIP_PREFIX = [
  'mailto:',
  'tel:',
  'javascript:',
  'data:',
  'sms:',
  '/pagefind/',
  '/api/',
  '/api',
  '#',
  '//',
];
const HREF_RE = /\shref="([^"]*)"/g;
const SRC_RE = /\ssrc="([^"]*)"/g;
const ID_RE = /\sid="([^"]+)"/g;

let skipped = false;

function hugoExtendedAvailable() {
  try {
    const r = spawnSync('hugo', ['version'], { timeout: 10000 });
    return r.status === 0 && /extended/i.test(String(r.stdout));
  } catch {
    return false;
  }
}

function walkHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function fileExistsForUrl(u) {
  let p = u.split('#')[0].split('?')[0];
  if (!p) return true;
  let f = path.join(SITE_ROOT, decodeURIComponent(p));
  if (p.endsWith('/')) return fs.existsSync(path.join(f, 'index.html'));
  if (fs.existsSync(f)) {
    if (fs.statSync(f).isFile()) return true;
    // Verzeichnis ohne Slash: /login -> /login/index.html
    return fs.existsSync(path.join(f, 'index.html'));
  }
  // Erweiterungslose Pfade: /foo -> /foo.html
  return fs.existsSync(f + '.html');
}

function analyze(relPath, htmlRaw) {
  const findings = [];
  // <script>/<style>/Kommentare raus — enthaltene href/id-Strings sind kein Markup
  const html = htmlRaw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const page = '/' + relPath.split(path.sep).slice(0, -1).join('/') + '/';

  // 1) Doppelte IDs
  const ids = [...html.matchAll(ID_RE)].map((m) => m[1]);
  const idSet = new Set();
  for (const id of ids) {
    if (idSet.has(id)) findings.push({ page, key: 'duplicateIds', item: `id="${id}" mehrfach` });
    idSet.add(id);
  }

  // 2) Tote Anker (href="#x" ohne id="x" — ohne Hash-Routen #/…)
  for (const m of html.matchAll(HREF_RE)) {
    const href = m[1];
    if (!href.startsWith('#') || href.length < 2 || href.startsWith('#/')) continue;
    const id = href.slice(1);
    if (!idSet.has(id))
      findings.push({ page, key: 'deadAnchors', item: `href="#${id}" ohne Ziel-id` });
  }

  // 3) ARIA-Referenzen auf fehlende IDs
  const ariaRe = /\saria-(?:labelledby|describedby)="([^"]+)"/g;
  for (const m of html.matchAll(ariaRe)) {
    for (const id of m[1].split(/\s+/)) {
      if (id && !idSet.has(id))
        findings.push({ page, key: 'danglingAriaRefs', item: `aria-…by="${id}" ohne Ziel-id` });
    }
  }

  // 4) Tote interne Links/Assets
  for (const re of [HREF_RE, SRC_RE]) {
    for (const m of html.matchAll(re)) {
      let url = m[1];
      if (!url) continue;
      if (url.startsWith(OWN_ORIGIN)) url = url.slice(OWN_ORIGIN.length);
      if (/^https?:/i.test(url) && !url.startsWith('/')) continue; // extern
      if (SKIP_PREFIX.some((p) => url.startsWith(p))) continue;
      if (!url.startsWith('/')) continue; // relative Assets (selbes Verzeichnis) — Build-generiert, i.d.R. konsistent
      if (!fileExistsForUrl(url))
        findings.push({
          page,
          key: 'deadInternalLinks',
          item: `${re === HREF_RE ? 'href' : 'src'}="${url}" fehlt im Build`,
        });
    }
  }
  return findings;
}

beforeAll(() => {
  if (!hugoExtendedAvailable()) {
    skipped = true;
    return;
  }
  fs.rmSync(SITE_ROOT, { recursive: true, force: true });
  const build = spawnSync(
    'hugo',
    ['--source', 'myhugoapp', '--destination', SITE_ROOT, '--quiet'],
    {
      timeout: 180000,
      stdio: 'pipe',
    }
  );
  if (build.status !== 0)
    throw new Error('Hugo-Build fehlgeschlagen: ' + String(build.stderr).slice(0, 500));
}, 240000);

describe('Sitewite Struktur (Build komplett: IDs, Anker, ARIA, interne Links)', () => {
  it('0 Struktur-Findings über alle gerenderten Seiten', (ctx) => {
    if (skipped) return ctx.skip();
    const files = walkHtml(SITE_ROOT);
    expect(files.length, 'Seiten im Build').toBeGreaterThan(50);
    const findings = [];
    for (const f of files) {
      findings.push(...analyze(path.relative(SITE_ROOT, f), fs.readFileSync(f, 'utf8')));
    }
    const report = findings
      .map((f) => `[${f.page}] ${f.key}: ${f.item}`)
      .slice(0, 80)
      .join('\n');
    expect(
      findings,
      `${findings.length} Struktur-Findings (von ${findings.length > 80 ? '>80 gezeigt' : findings.length}):\n${report}`
    ).toEqual([]);
  }, 240000);
});
