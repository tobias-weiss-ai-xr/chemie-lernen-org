/**
 * apply-r5-404.mjs — UXF-020: Smart-404
 *
 * Die bestehende 404 (layouts/_default/404.html) hatte einen FATALEN Bug:
 * ihr Suchformular zielte auf /suche/ — das selbst eine 404 ist! Die echte
 * Suche liegt unter /pages/suche/?q=.
 *
 * Neue 404:
 *   1. Suche → /pages/suche/?q= (GET, korrekt)
 *   2. Auto-Redirects (3s, abbrechbar):
 *      - /entity/{slug}/ → /pages/suche/?q={slug}  (alte Bookmarks, schließt
 *        den 404-Kreis aus UXF-011/015: Live-Links sind gefixt, alte Links
 *        im Index/Bookmarks landen jetzt auch in der Suche statt im Nichts)
 *      - /curricula/{xy}/ mit xy ≠ 2-Buchstaben-State → /curricula/
 *      - /curricula/{state}/xyz/... → /curricula/{state}/ (falls State valide)
 *   3. Pagefind-Instanzsuche direkt auf der 404 (max. 5 Treffer)
 *   4. Beliebte Ziele: Startseite, Lehrpläne, Modulhandbücher, Quiz, Rechner
 *
 * Datei: layouts/_default/404.html (kompletter Rewrite — kein anderer
 * Apply-Skript berührt diese Datei; Rewrite ist naturgemäß idempotent).
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
// Kanonischer 404-Layout-Pfad: layouts/404.html (Root). Hugo 0.120 liest
// _default/404.html NICHT, 0.154+ schon — Root funktioniert in BEIDEN.
// Die veraltete _default/404.html wird entfernt (verursachte die tote
// /suche/-Form-Action).
const FILE = path.join(REPO_ROOT, 'myhugoapp/layouts/404.html');
const LEGACY = path.join(REPO_ROOT, 'myhugoapp/layouts/_default/404.html');

const content = `{{ define "title" }}Seite nicht gefunden — {{ .Site.Title }}{{ end }}

{{ define "main" }}
<div class="container" style="margin-top: 2rem; margin-bottom: 3rem;">
  <div class="row">
    <div class="col-md-8 col-md-offset-2">
      <h1 style="text-align:center;">Seite nicht gefunden</h1>
      <p style="font-size: 1.1rem; color: var(--text-muted, #666); text-align:center; margin-bottom: 1.5rem;">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>

      <!-- UXF-020: Auto-Redirect-Hinweis (JS blendet ihn bei Bedarf ein) -->
      <div id="nf-redirect-hint" class="alert alert-info" role="status" style="display:none; margin-bottom: 1.5rem;">
        <i class="fa fa-info-circle" aria-hidden="true"></i>
        <span id="nf-redirect-text"></span>
        <button type="button" class="btn btn-link btn-sm" id="nf-redirect-cancel" style="padding:0 0 0 8px;">Abbrechen</button>
      </div>

      <!-- UXF-020: Suche direkt hier (Pagefind), Fallback-Formular → /pages/suche/ -->
      <div class="nf-search" style="max-width: 560px; margin: 0 auto 1rem;">
        <label for="nf-search-input" style="font-weight:600; display:block; margin-bottom: 6px;">
          Was suchst du? Wir finden es:
        </label>
        <input type="search" id="nf-search-input" class="form-control"
               placeholder="z. B. Essigsäure, pH-Berechnung, Säure-Base …"
               autocomplete="off" aria-describedby="nf-search-hint" />
        <p id="nf-search-hint" style="font-size: 0.85rem; color: var(--text-muted, #777); margin-top: 6px;">
          Oder <a href="/pages/suche/">zur großen Suche wechseln →</a>
        </p>
        <div id="nf-search-results" role="region" aria-live="polite" aria-label="Suchergebnisse"
             style="margin-top: 0.75rem;"></div>
      </div>

      <!-- UXF-020: beliebte Ziele -->
      <div style="text-align:center; margin-top: 2rem;">
        <p style="font-weight:600; margin-bottom: 0.75rem;">Beliebte Ziele</p>
        <p>
          <a href="/">Zur Startseite</a> &middot;
          <a href="/curricula/">Lehrpläne</a> &middot;
          <a href="/modulhandbuecher/">Modulhandbücher</a> &middot;
          <a href="/quiz/">Quiz</a> &middot;
          <a href="/rechner/">Rechner</a> &middot;
          <a href="/wissennetz/">Wissensnetz</a>
        </p>
      </div>
    </div>
  </div>
</div>
{{ end }}

{{ define "js" }}
<script>
(function () {
  'use strict';

  var path = window.location.pathname || '';

  // ── UXF-020a: Auto-Redirects für bekannte tote Muster ─────────────
  function showRedirectHint(target, label) {
    var hint = document.getElementById('nf-redirect-hint');
    var text = document.getElementById('nf-redirect-text');
    var cancel = document.getElementById('nf-redirect-cancel');
    if (!hint || !text || !cancel) return;
    text.textContent = 'Weiterleitung zu „' + label + '“ in 3 Sekunden …';
    hint.style.display = '';
    var t = setTimeout(function () {
      window.location.replace(target);
    }, 3000);
    cancel.addEventListener('click', function () {
      clearTimeout(t);
      hint.style.display = 'none';
    });
  }

  // Alte Entity-Bookmarks: /entity/{irgendwas}/ → Suche mit dem Slug
  var entityMatch = path.match(/^\\/entity\\/([^\\/]+)\\/?$/);
  if (entityMatch && entityMatch[1] && entityMatch[1] !== 'index.html') {
    var q = decodeURIComponent(entityMatch[1].replace(/\\/+$/, ''));
    showRedirectHint('/pages/suche/?q=' + encodeURIComponent(q), 'Suche nach „' + q + '“');
  }

  // Ungültige Curricula-Pfade: /curricula/{xy}/ mit xy ≠ State-Code
  var STATES = ['bb','be','bw','by','hb','he','hh','mv','ni','nw','rp','sh','sl','sn','st','th'];
  var curMatch = path.match(/^\\/curricula\\/([^\\/]+)\\/?$/);
  if (curMatch && curMatch[1] && STATES.indexOf(curMatch[1].toLowerCase()) === -1) {
    showRedirectHint('/curricula/', 'Lehrplan-Übersicht');
  }

  // ── UXF-020b: Pagefind-Instanzsuche ────────────────────────────────
  var input = document.getElementById('nf-search-input');
  var resultsEl = document.getElementById('nf-search-results');
  var debounceT = null;

  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(String(s)));
    return d.innerHTML;
  }

  function renderResults(hits) {
    if (!hits.length) {
      resultsEl.innerHTML =
        '<p style="color: var(--text-muted, #777);">Keine Treffer — probiere es mit der ' +
        '<a href="/pages/suche/">großen Suche</a>.</p>';
      return;
    }
    var h = '<ul class="nf-results" style="list-style:none; padding:0; margin:0;">';
    hits.forEach(function (hit) {
      var excerpt = hit.excerpt ? esc(hit.excerpt.replace(/<[^>]+>/g, '')) : '';
      h +=
        '<li style="padding:8px 0; border-bottom:1px solid var(--border-color, #eee);">' +
        '<a href="' + esc(hit.url) + '" style="font-weight:600;">' + esc(hit.meta.title || hit.url) + '</a>' +
        (excerpt ? '<div style="font-size:0.85rem; color:var(--text-muted, #777);">…' + excerpt + '…</div>' : '') +
        '</li>';
    });
    h += '</ul>';
    resultsEl.innerHTML = h;
  }

  function runSearch(q) {
    if (!q || q.length < 2) {
      resultsEl.innerHTML = '';
      return;
    }
    import('/pagefind/pagefind.js')
      .then(function (pf) {
        return pf.search(q);
      })
      .then(function (res) {
        return Promise.all((res.results || []).slice(0, 5).map(function (r) {
          return r.data();
        }));
      })
      .then(renderResults)
      .catch(function () {
        resultsEl.innerHTML =
          '<p style="color: var(--text-muted, #777);">Suche gerade nicht verfügbar — ' +
          '<a href="/pages/suche/?q=' + encodeURIComponent(q) + '">weiter zur großen Suche</a>.</p>';
      });
  }

  if (input && resultsEl) {
    input.addEventListener('input', function () {
      clearTimeout(debounceT);
      var val = this.value.trim();
      debounceT = setTimeout(function () {
        runSearch(val);
      }, 250);
    });
    // UXF-020c: Falls die 404-URL selbst ein ?q= trägt → vorbelegen + suchen
    try {
      var urlQ = new URLSearchParams(window.location.search).get('q');
      if (urlQ) {
        input.value = urlQ;
        runSearch(urlQ);
      }
    } catch (e) {
      /* noop */
    }
  }
})();
</script>
{{ end }}
`;

fs.writeFileSync(FILE, content);
if (fs.existsSync(LEGACY)) {
  fs.rmSync(LEGACY);
  console.log('[UXF-020] ✓ veraltete _default/404.html entfernt');
}
console.log('[UXF-020] ✓ Smart-404 geschrieben (Suchformular-Fix + Auto-Redirects + Pagefind)');
