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
        var label = STATE_NAMES[s.state] || s.stateName || s.state;
        html +=
          '<option value="' +
          escapeHtml(s.state) +
          '"' +
          (selectedState === s.state ? ' selected' : '') +
          '>' +
          escapeHtml(s.state.toUpperCase() + ' – ' + label) +
          ' (' +
          s.topicCount +
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
              '<div class="state-topic-name"><a href="/entity/' +
              toSlug(topic.title || topic.slug) +
              '/">' +
              escapeHtml(topic.title || topic.slug) +
              '</a></div>';
            html +=
              '<div class="state-topic-meta">' + (topic.objectiveCount || 0) + ' Lernziele</div>';
            // Objectives
            if (topic.objectives && topic.objectives.length > 0) {
              html += '<div style="margin-top:0.3rem;">';
              topic.objectives.slice(0, 10).forEach(function (obj) {
                var objText = typeof obj === 'string' ? obj : obj.text || obj.name;
                html +=
                  '<span class="objective-chip" title="' +
                  escapeHtml(objText) +
                  '">' +
                  escapeHtml(objText) +
                  '</span>';
              });
              if (topic.objectives.length > 10) {
                html +=
                  '<span class="objective-chip" style="background:#eee;color:#666;">+' +
                  (topic.objectives.length - 10) +
                  '</span>';
              }
              html += '</div>';
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

  function _attachEvents() {
    var select = document.getElementById('state-select');
    if (select) {
      select.addEventListener('change', function () {
        loadTree(this.value);
      });
    }
  }

  loadStates();
})();
