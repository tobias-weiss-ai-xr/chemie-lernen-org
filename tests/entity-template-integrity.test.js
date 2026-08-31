/**
 * Entity-Template-Integrity — Regressionsschutz für den /entity/-Ausfall
 * vom 2026-08-31.
 *
 * Was kaputt ging (und hier verhindert werden soll):
 *  1. Commit 2f90ae41 verlor das führende '<' von zwei <script>-Tags in
 *     layouts/_default/entity-index.html -> Tags wurden als Text gerendert,
 *     loadD3AndEgoGraph existierte nicht, slugs.js lud nie.
 *  2. lunr kam von unpkg (CDN) mit falschem Timing -> "lunr is not defined",
 *     Suche tot, sobald das CDN blockiert/hakt.
 *  3. entity-index.js wurde doppelt eingebunden (?v=8 + ?v=3) -> Code lief 2x.
 *  4. Cache-Busting-Vergessen bei custom.css -> Besucher sahen wochenlang
 *     alte Styles (home.css-Debakel, 2. Mal).
 *
 * Alle Prüfungen sind offline (Dateisystem), laufen in jedem `npm test`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MYHUGO = path.join(ROOT, 'myhugoapp');
const LAYOUTS = path.join(MYHUGO, 'layouts');
const ENTITY_INDEX_HTML = path.join(LAYOUTS, '_default', 'entity-index.html');
const ENTITY_INDEX_JS = path.join(MYHUGO, 'static', 'js', 'entity-index.js');
const VENDOR = path.join(MYHUGO, 'static', 'js', 'vendor');
const SW_JS = path.join(MYHUGO, 'static', 'sw.js');

function walk(dir, ext, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, ext, acc);
    else if (entry.name.endsWith(ext)) acc.push(p);
  }
  return acc;
}

describe('Entity-Template-Integrity (Regression 2026-08-31)', () => {
  test('kein Layout enthält Script-Tags mit verlorenem "<"', () => {
    const broken = [];
    for (const file of walk(LAYOUTS, '.html')) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        // Zeile beginnt mit "script" + Leerzeichen/Tab/">" -> Tag ohne "<"
        if (/^\s*script[\s>]/.test(line)) {
          broken.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 80)}`);
        }
      });
    }
    expect(broken).toEqual([]);
  });

  test('entity-index.html: <script>-Auf- und -Zugänge sind ausgeglichen', () => {
    const html = fs.readFileSync(ENTITY_INDEX_HTML, 'utf8');
    const opens = (html.match(/<script\b/g) || []).length;
    const closes = (html.match(/<\/script>/g) || []).length;
    expect(opens).toBeGreaterThan(0);
    expect(opens).toBe(closes);
  });

  test('entity-index.html: entity-index.js wird genau EINMAL geladen', () => {
    const html = fs.readFileSync(ENTITY_INDEX_HTML, 'utf8');
    const includes = html.match(/entity-index\.js/g) || [];
    // 1 Kommentar-Erwähnung ist erlaubt; <script src>-Tags dürfen nur 1x sein
    const scriptTags = html.match(/<script[^>]*entity-index\.js/g) || [];
    expect(scriptTags).toHaveLength(1);
    expect(includes.length).toBeGreaterThanOrEqual(scriptTags.length);
  });

  test('entity-index.html: lunr ist self-hosted, kein CDN-Script', () => {
    const html = fs.readFileSync(ENTITY_INDEX_HTML, 'utf8');
    const srcs = html.match(/<script[^>]+src="([^"]+)"/g) || [];
    for (const tag of srcs) {
      expect(tag).not.toMatch(/https?:\/\//); // keine externen Scripts
    }
    expect(html).toMatch(/\/js\/vendor\/lunr\.min\.js/);
  });

  test('entity-index.html: alle referenzierten /js/-Dateien existieren in static/', () => {
    const html = fs.readFileSync(ENTITY_INDEX_HTML, 'utf8');
    const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) {
      const rel = src
        .split('?')[0]
        .replace(/^\{\{[^}]*\}\}/, '')
        .trim();
      const clean = rel.startsWith('/') ? rel.slice(1) : rel;
      // Hugo-Pipes ({{ ... }}) überspringen — hier nur reine Pfade prüfen
      if (rel.includes('{{')) continue;
      expect(fs.existsSync(path.join(MYHUGO, 'static', clean))).toBe(true);
    }
  });

  test('entity-index.js: ensureLunr-Selbstheilung vorhanden', () => {
    const js = fs.readFileSync(ENTITY_INDEX_JS, 'utf8');
    expect(js).toMatch(/function ensureLunr/);
    expect(js).toMatch(/\/js\/vendor\/lunr\.min\.js/);
    // lunr.Index.load darf nur NACH ensureLunr() aufgerufen werden
    const ensurePos = js.indexOf('ensureLunr().then');
    const loadPos = js.indexOf('lunr.Index.load');
    expect(ensurePos).toBeGreaterThan(-1);
    expect(loadPos).toBeGreaterThan(ensurePos);
  });

  test('vendor/lunr.min.js existiert und ist lunr 2.x (kompatibel mit Index.load)', () => {
    const p = path.join(VENDOR, 'lunr.min.js');
    expect(fs.existsSync(p)).toBe(true);
    const head = fs.readFileSync(p, 'utf8').slice(0, 200);
    expect(head).toMatch(/lunr/i);
    expect(head).toMatch(/2\.\d+\.\d+/);
  });

  test('config.toml: custom_css trägt Cache-Busting (?v=)', () => {
    // Ohne ?v= behalten Browser altes CSS bis zu einer Stunde -> unsichtbare
    // Style-Deploys (passierte 2x: home.css, custom.css).
    const cfg = fs.readFileSync(path.join(MYHUGO, 'config.toml'), 'utf8');
    const m = cfg.match(/custom_css\s*=\s*\[([^\]]*)\]/);
    expect(m).not.toBeNull();
    const entries = m[1].split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry).toMatch(/\?v=\d+/);
    }
  });

  test('sw.js: SW_VERSION folgt dem Schema vX-YYYY-MM', () => {
    const sw = fs.readFileSync(SW_JS, 'utf8');
    const m = sw.match(/const SW_VERSION = '([^']+)'/);
    expect(m).not.toBeNull();
    expect(m[1]).toMatch(/^v\d+-\d{4}-\d{2}$/);
  });

  test('sw.js: alle /css/- und /js/-Precache-Einträge existieren in static/', () => {
    // Precache-Fehltreffer lassen die SW-Installation fehlschlagen -> gar
    // kein Offline-Support. Statische Assets lassen sich verifizieren;
    // generierte Seiten (/) ignorieren wir hier.
    const sw = fs.readFileSync(SW_JS, 'utf8');
    const listMatch = sw.match(/PRECACHE_FILES = \[([\s\S]*?)\]/);
    expect(listMatch).not.toBeNull();
    const entries = [...listMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(entries.length).toBeGreaterThan(5);
    for (const entry of entries) {
      if (!/^\/(css|js)\//.test(entry)) continue;
      const clean = entry.split('?')[0];
      expect(fs.existsSync(path.join(MYHUGO, 'static', clean))).toBe(true);
    }
  });
});
