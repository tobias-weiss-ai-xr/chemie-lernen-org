(function () {
  var app = document.getElementById('curricula-state-app');
  if (!app) return;
  var skeleton = document.getElementById('state-skeleton');

  var selectedState = '';
  var statesData = null;
  var treeData = null;
  var loading = false;
  var error = null;

  var STATE_NAMES = {
    bb: 'Brandenburg',
    be: 'Berlin',
    bw: 'Baden-Württemberg',
    by: 'Bayern',
    hb: 'Bremen',
    he: 'Hessen',
    hh: 'Hamburg',
    mv: 'Mecklenburg-Vorpommern',
    ni: 'Niedersachsen',
    nw: 'Nordrhein-Westfalen',
    rp: 'Rheinland-Pfalz',
    sh: 'Schleswig-Holstein',
    sl: 'Saarland',
    sn: 'Sachsen',
    st: 'Sachsen-Anhalt',
    th: 'Thüringen',
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toSlug(name) {
    return name
      .toLowerCase()
      .replace(/[üÜ]/g, 'ue')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[äÄ]/g, 'ae')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // ── Part B Task 5 ────────────────────────────────────────────────────
  // Canonical entity links: prefer globalThis.Slugs (loaded before this
  // script on the page); toSlug is only the no-Slugs fallback.
  function entityHref(name) {
    if (globalThis.Slugs && typeof globalThis.Slugs.entityUrl === 'function') {
      return globalThis.Slugs.entityUrl(name);
    }
    return '/entity/' + toSlug(name) + '/';
  }

  // KMK operator verbs (didactic pass): highlight the action verb of each
  // Lernziel rather than relying on colour alone.
  var KMK_OPERATORS = [
    'nennen',
    'benennen',
    'beschreiben',
    'erklären',
    'erläutern',
    'begründen',
    'untersuchen',
    'vergleichen',
    'beurteilen',
    'bewerten',
    'ableiten',
    'deuten',
    'vorhersagen',
    'planen',
    'darstellen',
    'zuordnen',
    'berechnen',
    'protokollieren',
  ];

  // Wraps the FIRST operator verb occurrence in <strong class="kg-operator">
  // (word-boundary, case-insensitive). Applied AFTER HTML escaping.
  function highlightOperators(text) {
    if (typeof text !== 'string' || !text) return text;
    for (var i = 0; i < KMK_OPERATORS.length; i++) {
      var re = new RegExp('\\b' + KMK_OPERATORS[i] + '\\b', 'i');
      var m = text.match(re);
      if (m && m.index !== undefined) {
        return (
          text.slice(0, m.index) +
          '<strong class="kg-operator">' +
          m[0] +
          '</strong>' +
          text.slice(m.index + m[0].length)
        );
      }
    }
    return text;
  }

  function loadStates() {
    loading = true;
    error = null;
    fetch('/api/curricula/states', { signal: AbortSignal.timeout(10000) })
      .then(function (r) {
        if (!r.ok) {
          throw new Error(r.status);
        }
        return r.json();
      })
      .then(function (d) {
        statesData = (d.states || []).sort(function (a, b) {
          return a.state < b.state ? -1 : 1;
        });
        loading = false;
        _render();
      })
      .catch(function (err) {
        loading = false;
        error = err.message;
        _render();
      });
  }

  function loadTree(state) {
    selectedState = state;
    if (!state) {
      treeData = null;
      _render();
      return;
    }
    loading = true;
    error = null;
    treeData = null;
    _render();
    fetch('/api/curricula/by-state/' + encodeURIComponent(state), {
      signal: AbortSignal.timeout(20000),
    })
      .then(function (r) {
        if (!r.ok) {
          throw new Error(r.status);
        }
        return r.json();
      })
      .then(function (d) {
        treeData = d;
        loading = false;
        _render();
      })
      .catch(function (err) {
        loading = false;
        error = err.message;
        _render();
      });
  }

  function _render() {
    var html = '';
    if (skeleton) skeleton.style.display = 'none';

    // State picker
    html += '<div class="state-picker">';
    html += '<select id="state-select" aria-label="Bundesland auswählen">';
    html += '<option value="">— Bundesland auswählen —</option>';
    if (statesData) {
      statesData.forEach(function (s) {
        var st = s.state || s.state_abbr || s.stateName || '';
        var label = STATE_NAMES[st] || s.stateName || st;
        html +=
          '<option value="' +
          escapeHtml(st) +
          '"' +
          (selectedState === st ? ' selected' : '') +
          '>' +
          escapeHtml((st || '?').toUpperCase() + ' – ' + label) +
          ' (' +
          (s.topicCount || 0) +
          ' Themen)</option>';
      });
    }
    html += '</select>';
    html += '</div>';

    if (loading) {
      html += '<div class="curricula-loading"><em>Lade Daten…</em></div>';
      app.innerHTML = html;
      _attachEvents();
      return;
    }

    if (error && !treeData) {
      html +=
        '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Fehler beim Laden: ' +
        escapeHtml(error) +
        '</p></div>';
      app.innerHTML = html;
      _attachEvents();
      return;
    }

    if (treeData && treeData.topics) {
      // Group by school_type → grade
      var grouped = {};
      treeData.topics.forEach(function (t) {
        var school = t.schoolType || 'Allgemein';
        var grade = t.grade || '-';
        if (!grouped[school]) grouped[school] = {};
        if (!grouped[school][grade]) grouped[school][grade] = [];
        grouped[school][grade].push(t);
      });

      var schoolOrder = Object.keys(grouped).sort();
      var totalTopics = treeData.topics.length;
      var totalObjectives = 0;
      treeData.topics.forEach(function (t) {
        totalObjectives += t.objectiveCount || 0;
      });

      html +=
        '<div class="curricula-stats" style="background:var(--bg-card,#f8f9fa);padding:1rem;border-radius:8px;margin-bottom:1.5rem;">';
      html +=
        '<strong>' +
        totalTopics +
        '</strong> Themen, <strong>' +
        totalObjectives +
        '</strong> Lernziele';
      html += '</div>';

      schoolOrder.forEach(function (school) {
        html += '<div class="school-type-group">';
        html += '<h2>' + escapeHtml(school) + '</h2>';
        var gradeKeys = Object.keys(grouped[school]).sort();
        gradeKeys.forEach(function (grade) {
          html += '<div class="grade-group">';
          html += '<h3>Klasse ' + escapeHtml(grade) + '</h3>';
          grouped[school][grade].forEach(function (topic) {
            html += '<div class="state-topic-card">';
            html +=
              '<div class="state-topic-name"><a href="' +
              entityHref(topic.title || topic.slug) +
              '">' +
              escapeHtml(topic.title || topic.slug) +
              '</a></div>';
            html +=
              '<div class="state-topic-meta">' + (topic.objectiveCount || 0) + ' Lernziele</div>';
            // Objectives (didactic pass: max 8 visible, operator verbs highlighted)
            if (topic.objectives && topic.objectives.length > 0) {
              html += '<div style="margin-top:0.3rem;">';
              topic.objectives.slice(0, 8).forEach(function (obj) {
                var objText = typeof obj === 'string' ? obj : obj.text || obj.name;
                html +=
                  '<span class="objective-chip" title="' +
                  escapeHtml(objText) +
                  '">' +
                  highlightOperators(escapeHtml(objText)) +
                  '</span>';
              });
              if (topic.objectives.length > 8) {
                html +=
                  '<span class="objective-chip" style="background:#eee;color:#666;">+' +
                  (topic.objectives.length - 8) +
                  '</span>';
              }
              html += '</div>';
            }
            // Topic graph toggle (Part B Task 5) — lazy, one kg-data fetch
            if (topic.entities && topic.entities.length > 0) {
              html +=
                '<div style="margin-top:0.4rem;"><button type="button" class="kg-graph-toggle" data-topic-slug="' +
                escapeHtml(topic.slug) +
                '">📊 Grafik anzeigen</button></div>';
              html +=
                '<div class="kg-topic-graph" data-topic-slug="' +
                escapeHtml(topic.slug) +
                '" style="display:none;height:420px;border:1px solid #ddd;border-radius:8px;background:#fafafa;margin-top:0.4rem;position:relative;"></div>';
            }
            // Content links
            if (topic.contentLinks && topic.contentLinks.length > 0) {
              html += '<div style="margin-top:0.3rem;">';
              topic.contentLinks.slice(0, 5).forEach(function (cl) {
                html +=
                  '<a href="' +
                  escapeHtml(cl.url) +
                  '" class="content-link-mini" target="_blank" rel="noopener">' +
                  escapeHtml(cl.title || cl.url) +
                  '</a>';
              });
              html += '</div>';
            }
            html += '</div>';
          });
          html += '</div>';
        });
        html += '</div>';
      });
    } else if (selectedState) {
      html +=
        '<div class="empty-state"><div class="empty-state-icon">📡</div><p>Keine Daten für dieses Bundesland gefunden.</p></div>';
    } else {
      html +=
        '<div class="empty-state"><div class="empty-state-icon">🗺️</div><p>Wähle ein Bundesland aus, um den Lehrplan einzusehen.</p></div>';
    }

    app.innerHTML = html;
    _attachEvents();
  }

  // Part B Task 5 — lazy „Grafik anzeigen“: one kg-data fetch (cached),
  // then a bounded topic graph seeded by the API-provided entity list.
  var kgDataPromise = null;
  function fetchKgData() {
    if (!kgDataPromise) {
      kgDataPromise = fetch('/api/kg-data?limit=550', { signal: AbortSignal.timeout(15000) })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .catch(function (err) {
          kgDataPromise = null; // allow retry on next toggle
          throw err;
        });
    }
    return kgDataPromise;
  }

  function slugifyFor(name) {
    if (globalThis.Slugs && typeof globalThis.Slugs.slugify === 'function') {
      return globalThis.Slugs.slugify(name);
    }
    return toSlug(name);
  }

  function topicBySlug(slug) {
    if (!treeData || !treeData.topics) return null;
    for (var i = 0; i < treeData.topics.length; i++) {
      if (treeData.topics[i].slug === slug) return treeData.topics[i];
    }
    return null;
  }

  function toggleTopicGraph(btn) {
    var slug = btn.getAttribute('data-topic-slug');
    var target = app.querySelector('.kg-topic-graph[data-topic-slug="' + slug + '"]');
    if (!target) return;
    if (target.style.display === 'block') {
      target.style.display = 'none';
      btn.textContent = '📊 Grafik anzeigen';
      return;
    }
    if (target.getAttribute('data-rendered') === '1') {
      target.style.display = 'block';
      btn.textContent = '📊 Grafik ausblenden';
      return;
    }
    if (typeof globalThis.D3EgoGraph === 'undefined' || !globalThis.D3EgoGraph.createTopicGraph)
      return;
    var topic = topicBySlug(slug);
    if (!topic) return;
    btn.disabled = true;
    btn.textContent = '⏳ Lädt Grafik…';
    fetchKgData()
      .then(function (data) {
        var slugs = (topic.entities || []).map(function (name) {
          return slugifyFor(name);
        });
        if (!slugs.length) slugs = [slugifyFor(topic.title || topic.slug)];
        return globalThis.D3EgoGraph.createTopicGraph(target, data, {
          topic: topic.title || topic.slug,
          topicSlugs: slugs,
          cap: 30,
          height: 420,
        });
      })
      .then(function () {
        target.setAttribute('data-rendered', '1');
        target.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '📊 Grafik ausblenden';
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = '📊 Grafik anzeigen (fehlgeschlagen)';
      });
  }

  function _attachEvents() {
    var select = document.getElementById('state-select');
    if (select) {
      select.addEventListener('change', function () {
        loadTree(this.value);
      });
    }
    // Delegated so freshly rendered toggle buttons work without rebinding
    app.addEventListener('click', function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest('.kg-graph-toggle') : null;
      if (btn) toggleTopicGraph(btn);
    });
  }

  loadStates();

  // Auto-load the curriculum tree for the state encoded in the URL
  // (e.g. /curricula/by/ -> "by") so state pages display their plan
  // directly instead of requiring a manual dropdown selection.
  var urlState = (window.location.pathname || '').match(/\/curricula\/([a-z]{2})\/?$/);
  if (urlState) {
    loadTree(urlState[1]);
  }

  // Exported pure helpers for unit tests (Part B Task 5)
  window.CurriculaState = {
    toSlug: toSlug,
    entityHref: entityHref,
    KMK_OPERATORS: KMK_OPERATORS,
    highlightOperators: highlightOperators,
  };
})();
