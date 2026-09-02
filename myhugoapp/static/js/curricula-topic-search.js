/**
 * curricula-topic-search.js — UXF-001: Live-Suche über alle Lehrplan-Themen
 *
 * Durchsucht ALLE Bundesländer via GET /api/curricula/topics?search=…
 * (debounced 300ms). Ergebnisse: Titel + Bundesland-Badge + Klasse +
 * Lernzielanzahl. Klick → Konzeptseite. ↑/↓/Enter-Tastaturnavigation.
 *
 * Erwartet im DOM:
 *   <input id="curricula-topic-search">
 *   <div id="curricula-topic-results" aria-live="polite"></div>
 */
(function () {
  'use strict';

  var input = document.getElementById('curricula-topic-search');
  var resultsEl = document.getElementById('curricula-topic-results');
  if (!input || !resultsEl) return;

  var STATE_NAMES = {
    BB: 'Brandenburg',
    BE: 'Berlin',
    BW: 'Baden-Württemberg',
    BY: 'Bayern',
    HB: 'Bremen',
    HE: 'Hessen',
    HH: 'Hamburg',
    MV: 'Mecklenburg-Vorpommern',
    NI: 'Niedersachsen',
    NW: 'Nordrhein-Westfalen',
    RP: 'Rheinland-Pfalz',
    SH: 'Schleswig-Holstein',
    SL: 'Saarland',
    SN: 'Sachsen',
    ST: 'Sachsen-Anhalt',
    TH: 'Thüringen',
  };

  var activeIndex = -1;
  var currentQuery = '';
  var currentTotal = 0; // UXF-014: für „Mehr laden"
  var currentToken = 0; // bricht veraltete Antworten ab
  var debounceTimer = null;
  var MIN_CHARS = 2;
  var LIMIT = 30;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getItems() {
    return Array.prototype.slice.call(resultsEl.querySelectorAll('.cts-item'));
  }

  function setActive(idx) {
    var items = getItems();
    if (!items.length) return;
    if (idx >= items.length) idx = 0;
    if (idx < 0) idx = items.length - 1;
    activeIndex = idx;
    items.forEach(function (it, i) {
      it.classList.toggle('active', i === activeIndex);
      it.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
    });
  }

  function reset() {
    activeIndex = -1;
  }

  function clear() {
    resultsEl.innerHTML = '';
    currentTotal = 0;
    currentQuery = '';
    reset();
  }

  function renderLoading() {
    resultsEl.innerHTML = '<div class="cts-status" role="status">Suche läuft…</div>';
  }

  function renderEmpty(q) {
    resultsEl.innerHTML =
      '<div class="cts-status">Keine Themen für „' + escapeHtml(q) + '“ gefunden.</div>';
  }

  function renderError(retry) {
    var html = '<div class="cts-status cts-error">⚠️ Themensuche momentan nicht erreichbar.';
    if (retry) {
      html +=
        ' <button type="button" class="btn btn-primary ux-retry-btn">Erneut versuchen</button>';
    }
    html += '</div>';
    resultsEl.innerHTML = html;
    var btn = resultsEl.querySelector('.ux-retry-btn');
    if (btn && retry) {
      btn.addEventListener('click', function () {
        run(input.value.trim());
      });
    }
  }

  // UXF-014: „Mehr laden"-Button, wenn noch Treffer übrig sind
  function buildMoreButton(shownTotal) {
    if (currentTotal > shownTotal) {
      return (
        '<button type="button" class="btn btn-secondary cts-more" id="cts-more-btn">' +
        'Mehr laden (' +
        (currentTotal - shownTotal) +
        ' weitere)</button>'
      );
    }
    return '';
  }

  function renderResults(topics, q, append) {
    if (!topics.length && !append) {
      renderEmpty(q);
      return;
    }
    // UXF-014: bei append nur Items bauen (Meta/Liste stehen schon)
    var loaded = resultsEl.querySelectorAll('.cts-item').length;
    var shownTotal = loaded + topics.length;
    var html = '';
    if (!append)
      html =
        '<div class="cts-meta" role="status">' +
        shownTotal +
        (currentTotal > shownTotal ? ' von ' + currentTotal : '') +
        ' Treffer</div>';
    html += '<ul class="cts-list" role="listbox" aria-label="Themen-Treffer">';
    topics.forEach(function (t) {
      var stateName = STATE_NAMES[(t.state || '').toUpperCase()] || t.state;
      // UXF-001: Topic-Slugs sind KEINE Entity-URLs (Führte zu 404).
      // Titel → Pagefind-Volltextsuche; Bundesland-Badge → State-Seite.
      var searchUrl = '/pages/suche/?q=' + encodeURIComponent(t.title || t.slug);
      var stateUrl = '/curricula/' + encodeURIComponent((t.state || '').toLowerCase()) + '/';
      html +=
        '<li class="cts-item" role="option" data-slug="' +
        escapeHtml(t.slug) +
        '">' +
        '<a href="' +
        searchUrl +
        '">' +
        '<span class="cts-title">' +
        escapeHtml(t.title) +
        '</span>' +
        '<span class="cts-badges">' +
        (stateName
          ? '<span class="cts-badge cts-state" title="' +
            escapeHtml(stateName) +
            '">' +
            escapeHtml(t.state) +
            '</span>'
          : '') +
        (t.grade ? '<span class="cts-badge">Kl. ' + escapeHtml(t.grade) + '</span>' : '') +
        (t.objectiveCount
          ? '<span class="cts-badge cts-obj">' + t.objectiveCount + ' Lernziele</span>'
          : '') +
        '</span>' +
        '</a>' +
        (stateName
          ? '<a class="cts-state-link" href="' +
            stateUrl +
            '" aria-label="Thema im Lehrplan ' +
            escapeHtml(stateName) +
            ' ansehen" title="Im Lehrplan ' +
            escapeHtml(stateName) +
            '">Lehrplan →</a>'
          : '') +
        '</li>';
    });
    if (append) {
      // UXF-014: neue Items in bestehende Liste einfügen, Button erneuern
      var list = resultsEl.querySelector('.cts-list');
      if (list) list.insertAdjacentHTML('beforeend', html);
      var oldMore = document.getElementById('cts-more-btn');
      if (oldMore) oldMore.remove();
      resultsEl.insertAdjacentHTML('beforeend', buildMoreButton(shownTotal));
      reset();
      return;
    }
    html += '</ul>';
    html += buildMoreButton(shownTotal);
    resultsEl.innerHTML = html;
    reset();

    // Clicks via delegation (Links navigieren nativ)
    resultsEl.querySelectorAll('.cts-item').forEach(function (item, i) {
      item.addEventListener('mouseenter', function () {
        setActive(i);
      });
    });
  }

  function run(q, offset) {
    if (q.length < MIN_CHARS) {
      clear();
      return;
    }
    // UXF-014: offset für „Mehr laden"-Pagination
    offset = offset || 0;
    currentQuery = q;
    if (offset === 0) renderLoading();
    var token = ++currentToken;
    fetch(
      '/api/curricula/topics?search=' +
        encodeURIComponent(q) +
        '&limit=' +
        LIMIT +
        '&offset=' +
        offset,
      {
        signal: AbortSignal.timeout(10000),
      }
    )
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (token !== currentToken) return; // veraltet
        currentTotal = d.total || 0;
        renderResults(d.topics || [], q, offset > 0);
      })
      .catch(function () {
        if (token !== currentToken) return;
        if (offset === 0) renderError(true);
      });
  }

  // UXF-014: „Mehr laden"
  resultsEl.addEventListener('click', function (ev) {
    if (ev.target && ev.target.id === 'cts-more-btn') {
      ev.target.disabled = true;
      ev.target.textContent = 'Lade…';
      run(currentQuery, resultsEl.querySelectorAll('.cts-item').length);
    }
  });

  input.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    var val = this.value.trim();
    if (val.length < MIN_CHARS) {
      clear();
      return;
    }
    debounceTimer = setTimeout(function () {
      run(val);
    }, 300);
  });

  input.addEventListener('keydown', function (e) {
    var items = getItems();
    if (!items.length) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(activeIndex + 1 >= items.length ? 0 : activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(activeIndex - 1 < 0 ? items.length - 1 : activeIndex - 1);
        break;
      case 'Enter': {
        var idx = activeIndex >= 0 ? activeIndex : 0;
        var link = items[idx] && items[idx].querySelector('a');
        if (link) {
          e.preventDefault();
          window.location.href = link.href;
        }
        break;
      }
      case 'Escape':
        input.value = '';
        clear();
        break;
    }
  });

  // Input leeren, wenn Seite verlassen (bfcache-Fall)
  window.addEventListener('pageshow', function () {
    clear();
  });
})();
