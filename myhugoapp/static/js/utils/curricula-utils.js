/**
 * curricula-utils.js — Pure Functions für funktionale Curricula-UX (UXF Runde 2)
 *
 * Browser-global: window.CurriculaUtils
 * Node/CommonJS (Tests): module.exports
 */
(function () {
  'use strict';

  /**
   * Liest den Curricula-URL-State aus Location (UXF-002 + UXF-012).
   * Unterstützt: ?tab=overview|advanced, ?schulform=, ?klasse=,
   *              ?sort=az|topics|objectives, #vergleich=BB,BY (auch ?vergleich=)
   * @param {string} [search] - Location.search (Default: window)
   * @param {string} [hash]   - Location.hash   (Default: window)
   * @returns {{tab: string|null, schulform: string|null, klasse: string|null, vergleich: string[]}}
   */
  function parseUrlState(search, hash) {
    if (typeof window !== 'undefined' && arguments.length === 0) {
      search = window.location.search;
      hash = window.location.hash;
    }
    var out = { tab: null, schulform: null, klasse: null, vergleich: [], sort: null };
    try {
      var qs = new URLSearchParams(search || '');
      var tab = qs.get('tab');
      if (tab === 'overview' || tab === 'advanced') out.tab = tab;
      var sf = qs.get('schulform');
      if (sf) out.schulform = sf;
      var kl = qs.get('klasse');
      if (kl) out.klasse = kl;
      var so = qs.get('sort');
      if (so === 'az' || so === 'topics' || so === 'objectives') out.sort = so;
      var vg = qs.get('vergleich') || (hash || '').replace(/^#vergleich=/, '');
      if (vg) {
        out.vergleich = vg
          .split(',')
          .map(function (s) {
            return s.trim().toUpperCase();
          })
          .filter(Boolean)
          .slice(0, 3);
      }
    } catch (e) {
      /* malformed URL — defaults */
    }
    return out;
  }

  /**
   * Erzeugt eine URL mit Curricula-Query-Parametern (UXF-002).
   * Bestehende curricula-Parameter werden ersetzt, fremde bleiben erhalten.
   * Parameter mit null/''/[] werden entfernt.
   * @param {Object} state - {tab, schulform, klasse, vergleich}
   * @param {string} [url] - Basis-URL (Default: aktuelle)
   * @returns {string}
   */
  function buildUrl(state, url) {
    if (typeof window !== 'undefined' && arguments.length < 2) {
      url = window.location.href;
    }
    var base = String(url || '')
      .split('#')[0]
      .split('?')[0];
    var qs = new URLSearchParams((String(url || '').split('?')[1] || '').split('#')[0]);
    ['tab', 'schulform', 'klasse'].forEach(function (k) {
      qs.delete(k);
    });
    qs.delete('vergleich');
    qs.delete('sort');
    if (state.tab) qs.set('tab', state.tab);
    if (state.sort) qs.set('sort', state.sort);
    if (state.schulform) qs.set('schulform', state.schulform);
    if (state.klasse) qs.set('klasse', String(state.klasse));
    if (state.vergleich && state.vergleich.length >= 2) {
      qs.set('vergleich', state.vergleich.join(','));
    }
    var s = qs.toString();
    return base + (s ? '?' + s : '');
  }

  /**
   * Baut eine CSV aus der Vergleichstabelle (UXF-007).
   * Erste Spalte: Thema, dann je Bundesland ✓/–.
   * @param {Array<{code: string, labels: string[]}>} sets
   * @param {Array<string>} allLabels - sortierte Vereinigung aller Labels
   * @param {Function} nameFor - code → Bundesland-Name
   * @returns {string} CSV mit ; (Excel-DE-kompatibel) und CRLF
   */
  function buildCompareCsv(sets, allLabels, nameFor) {
    var esc = function (v) {
      v = String(v == null ? '' : v);
      if (/[";\n\r]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
      return v;
    };
    var rows = [
      ['Thema'].concat(
        sets.map(function (s) {
          return nameFor ? nameFor(s.code) : s.code;
        })
      ),
    ];
    allLabels.forEach(function (label) {
      rows.push(
        [label].concat(
          sets.map(function (s) {
            return s.labels.indexOf(label) !== -1 ? '✓' : '–';
          })
        )
      );
    });
    return rows
      .map(function (r) {
        return r.map(esc).join(';');
      })
      .join('\r\n');
  }

  /**
   * Löst einen CSV-Download aus (UXF-007). No-op ohne Browser.
   * @param {string} filename
   * @param {string} csv
   */
  function downloadCsv(filename, csv) {
    if (typeof document === 'undefined' || !document.createElement) return;
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 100);
  }

  var api = {
    parseUrlState: parseUrlState,
    buildUrl: buildUrl,
    buildCompareCsv: buildCompareCsv,
    downloadCsv: downloadCsv,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.CurriculaUtils = api;
  }
})();
