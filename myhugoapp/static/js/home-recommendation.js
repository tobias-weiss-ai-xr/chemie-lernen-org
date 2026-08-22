/**
 * home-recommendation.js — Home page "Dein Lernpfad" widget
 * Fetches /api/gamification/profile and /api/learning-paths
 * Shows next recommended learning objective or fallback
 * sourceType: 'script' (no ESM imports)
 */

(function () {
  'use strict';

  var API_BASE = '/api';
  var WIDGET_SEL = '#next-recommendation';
  var CONTENT_SEL = '#recommendation-content';

  function apiFetch(url) {
    return fetch(API_BASE + url, {
      credentials: 'same-origin',
      signal: AbortSignal.timeout(8000),
    }).then(function (r) {
      if (r.status === 401) throw new Error('unauthorized');
      if (!r.ok) throw new Error('API error ' + r.status);
      return r.json();
    });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showWidget() {
    var el = document.querySelector(WIDGET_SEL);
    if (el) el.style.display = 'block';
  }

  function hideWidget() {
    var el = document.querySelector(WIDGET_SEL);
    if (el) el.style.display = 'none';
  }

  function setContent(html) {
    var el = document.querySelector(CONTENT_SEL);
    if (el) el.innerHTML = html;
  }

  /* Fallback path tree for anonymous users */
  var FALLBACK_PATHS = [
    { id: 'redox', title: 'Redoxreaktionen', icon: 'fa-bolt' },
    { id: 'saeuren-basen', title: 'Säuren & Basen', icon: 'fa-flask' },
    { id: 'stoechiometrie', title: 'Stöchiometrie', icon: 'fa-calculator' },
    { id: 'atommodelle', title: 'Atombau & PSE', icon: 'fa-atom' },
  ];

  function renderAnonymousPaths() {
    var items = FALLBACK_PATHS.map(function (p) {
      return (
        '<li><a href="/lernpfade/"><i class="fa ' +
        p.icon +
        '"></i> ' +
        escHtml(p.title) +
        '</a></li>'
      );
    }).join('');
    setContent(
      '<p>Entdecke unsere Lernpfade und finde den passenden für dich:</p>' +
        '<ul class="path-list-mini">' +
        items +
        '</ul>' +
        '<a href="/lernpfade/" class="btn btn-success">Lernpfade entdecken →</a>'
    );
  }

  function renderRecommended(objective) {
    if (objective) {
      setContent(
        '<p><strong>' +
          escHtml(objective.title) +
          '</strong></p>' +
          (objective.description ? '<p>' + escHtml(objective.description) + '</p>' : '') +
          '<a href="/lernpfade/" class="btn btn-primary">Weiter lernen →</a>'
      );
    } else {
      setContent(
        '<p>🎉 Alle Themen abgeschlossen! Entdecke neue Lernpfade.</p>' +
          '<a href="/lernpfade/" class="btn btn-success">Lernpfade durchstöbern</a>'
      );
    }
  }

  function findNextFromProfile(profile, paths) {
    if (!profile || !paths || paths.length === 0) return null;
    var completedObjectives = profile.completedObjectives || [];

    for (var i = 0; i < paths.length; i++) {
      var p = paths[i];
      if (p.progress >= 100) continue;
      if (!p.topics) continue;

      for (var j = 0; j < p.topics.length; j++) {
        var t = p.topics[j];
        if (t.progress >= 100) continue;
        if (!t.objectives) continue;

        for (var k = 0; k < t.objectives.length; k++) {
          var o = t.objectives[k];
          if (o.completed) continue;

          var prereqsMet = true;
          if (o.prerequisites && o.prerequisites.length > 0) {
            for (var m = 0; m < o.prerequisites.length; m++) {
              if (completedObjectives.indexOf(o.prerequisites[m]) === -1) {
                prereqsMet = false;
                break;
              }
            }
          }

          if (prereqsMet) {
            return {
              id: o.id,
              title: o.title,
              description: o.description || t.description || '',
            };
          }
        }

        if (t.objectives.length > 0) {
          for (var k2 = 0; k2 < t.objectives.length; k2++) {
            if (!t.objectives[k2].completed) {
              return {
                id: t.objectives[k2].id,
                title: t.objectives[k2].title,
                description: t.objectives[k2].description || t.description || '',
              };
            }
          }
        }
      }

      if (p.progress > 0 && p.progress < 100) {
        return { id: p.id, title: p.title, description: p.description || '' };
      }
    }

    return null;
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* Fetch profile + paths in parallel */
    Promise.all([
      apiFetch('/gamification/profile').catch(function () {
        return null;
      }),
      apiFetch('/learning-paths').catch(function () {
        return null;
      }),
    ])
      .then(function (results) {
        var profile = results[0];
        var pathsData = results[1];
        var paths = (pathsData && pathsData.paths) || [];

        if (!profile) {
          /* Not logged in — show generic widget with path list */
          showWidget();
          renderAnonymousPaths();
          return;
        }

        showWidget();
        var next = findNextFromProfile(profile, paths);
        renderRecommended(next);
      })
      .catch(function () {
        /* API completely unavailable — hide widget gracefully */
        hideWidget();
      });
  });
})();
