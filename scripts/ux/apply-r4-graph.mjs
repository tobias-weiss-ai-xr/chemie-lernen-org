/**
 * apply-r4-graph.mjs — UXF-015: Graph-Detailpanel 404-sichere Links
 *
 * curricula-index.js baute im Node-Detailpanel weiterhin rohe
 * /entity/{toSlug(label)}/-Links für entity/topic/subtopic/objective —
 * fast immer 404 (nur 644 Entitäten existieren als Seiten).
 *
 * Neu:
 *   - Topic/Subtopic-Nodes (haben meta.state): „Im Lehrplan {STATE} ansehen"
 *     → /curricula/{state}/
 *   - Konzept-Link: Search-Fallback (/pages/suche/?q=) + data-entity-name;
 *     renderDetail ruft CurriculaEntityLinks.rewriteWhenReady() auf, damit
 *     echte Entitäten nach Manifest-Load das /entity/-href bekommen.
 *   - toSlug() wird unbenutzt → entfernt (eslint no-unused-vars).
 *
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/curricula-index.js');

function fail(anchor) {
  throw new Error(`[UXF-015] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-015')) {
  console.log('[UXF-015] bereits angewendet');
  process.exit(0);
}

// ── 1. detailLinks: 404-sichere Links ────────────────────────────────
const a1 = `    if (type === 'entity' || type === 'topic' || type === 'subtopic' || type === 'objective') {
      links.push('<a href="/entity/' + toSlug(node.data('label')) + '/">Konzept-Seite öffnen</a>');
    }`;
if (!src.includes(a1)) fail(a1);
src = src.replace(
  a1,
  `    if (type === 'entity' || type === 'topic' || type === 'subtopic' || type === 'objective') {
      // UXF-015: 404-sicher — Topic-Nodes verlinken den State-Lehrplan
      // (meta.state), Konzept-Links bekommen Search-Fallback +
      // data-entity-name für das Manifest-Rewrite (in renderDetail).
      var label = node.data('label');
      if ((type === 'topic' || type === 'subtopic') && meta.state) {
        links.push(
          '<a href="/curricula/' +
            encodeURIComponent(String(meta.state).toLowerCase()) +
            '/">Im Lehrplan ' +
            escapeHtml(String(meta.state).toUpperCase()) +
            ' ansehen</a>'
        );
      }
      links.push(
        '<a href="/pages/suche/?q=' +
          encodeURIComponent(label) +
          '" data-entity-name="' +
          escapeHtml(label) +
          '">Konzept-Seite öffnen</a>'
      );
    }`
);

// ── 2. toSlug entfernen (unbenutzt) ──────────────────────────────────
const a2 = `  function toSlug(name) {
    return String(name)
      .toLowerCase()
      .replace(/[üÜ]/g, 'ue')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[äÄ]/g, 'ae')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

`;
if (!src.includes(a2)) fail(a2);
src = src.replace(a2, '');

// ── 3. renderDetail: Manifest-Rewrite nach dem Rendern ───────────────
const a3 = `    if (content) content.innerHTML = detailHtml(node);
    if (panel) panel.style.display = 'block';`;
if (!src.includes(a3)) fail(a3);
src = src.replace(
  a3,
  `    if (content) content.innerHTML = detailHtml(node);
    // UXF-015: existierende Entity-Seiten via Manifest auflösen
    if (window.CurriculaEntityLinks && content && content.querySelector('a[data-entity-name]')) {
      window.CurriculaEntityLinks.rewriteWhenReady(content);
    }
    if (panel) panel.style.display = 'block';`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-015] ✓ 3 Edits in curricula-index.js');
