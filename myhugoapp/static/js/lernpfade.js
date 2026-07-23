/**
 * lernpfade.js — Learning Paths & Gamification Dashboard
 * Browser global: window.lernpfadeInit, window.lernpfadeCheckIn
 * API endpoints: /api/learning-paths, /api/gamification/profile, /api/gamification/checkin
 * sourceType: 'script' (no ESM imports)
 */
/* global showBadgeToast */

(function () {
  'use strict';

  /* ── State ── */
  var API_BASE = '/api';
  var paths = [];
  var profile = null;
  var pathTreeExpanded = {};
  var stateList = []; /* [{state, name, grade, topicCount}] from /api/learning-paths */
  var currentState = ''; /* currently selected state code */

  /* ── Helpers ── */
  function apiFetch(url, opts) {
    opts = opts || {};
    opts.credentials = 'same-origin';
    return fetch(API_BASE + url, opts).then(function (r) {
      if (r.status === 401) {
        throw new Error('unauthorized');
      }
      if (!r.ok) {
        return r.json().then(function (d) {
          var err = new Error(d.error || 'API error ' + r.status);
          err.status = r.status;
          throw err;
        });
      }
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

  function getEl(id) {
    return document.getElementById(id);
  }

  /* ── Public entry point ── */
  window.lernpfadeInit = function () {
    loadPaths();
    loadProfile();
  };

  window.lernpfadeCheckIn = function () {
    checkIn();
  };

  /* ── Data Loading ── */
  function loadPaths() {
    getEl('path-tree').innerHTML =
      '<p class="text-muted"><i class="fa fa-spinner fa-spin"></i> Lade Lernpfade...</p>';

    apiFetch('/learning-paths', { signal: AbortSignal.timeout(8000) })
      .then(function (data) {
        paths = data.paths || [];
        /* Populate state selector from the states field */
        if (data.states && data.states.length > 0) {
          stateList = data.states;
          populateStateSelector(stateList);
        }
        renderPathTree(paths);
      })
      .catch(function (err) {
        if (err.message === 'unauthorized') {
          getEl('path-tree').innerHTML =
            '<p class="text-muted">Melde dich an, um deine Lernpfade zu sehen.</p>';
          return;
        }
        getEl('path-tree').innerHTML =
          '<p class="text-muted">Lernpfade konnten nicht geladen werden.</p>';
        console.warn('[lernpfade] loadPaths error:', err);
      });
  }

  function loadProfile() {
    apiFetch('/gamification/profile', { signal: AbortSignal.timeout(8000) })
      .then(function (data) {
        profile = data;
        renderXpBar(profile);
        renderStreak(profile);
        renderBadgeGrid(profile.badges || []);
        renderXpLog(profile.xpLog || []);
        renderRecommendations(profile);
      })
      .catch(function (err) {
        if (err.message === 'unauthorized') {
          /* Hide gamification elements, show login prompt */
          var els = document.querySelectorAll(
            '.xp-section, .streak-section, .badge-section, .xp-log-section'
          );
          for (var i = 0; i < els.length; i++) {
            els[i].style.display = 'none';
          }
          var rec = getEl('recommendation-card');
          if (rec) {
            rec.innerHTML =
              '<div class="recommendation-login-prompt">' +
              '<h3><i class="fa fa-user"></i> Dein Lernpfad</h3>' +
              '<p>Melde dich an, um personalisierte Lernempfehlungen zu erhalten.</p>' +
              '<a href="/login/" class="btn btn-primary">Anmelden</a>' +
              '</div>';
          }
          return;
        }
        console.warn('[lernpfade] loadProfile error:', err);
      });
  }

  /* ── State Selector ── */
  function populateStateSelector(states) {
    var sel = getEl('state-selector');
    if (!sel) return;
    /* Keep the "Alle" option */
    sel.innerHTML = '<option value="">— Alle Bundesländer —</option>';
    for (var i = 0; i < states.length; i++) {
      var s = states[i];
      var option = document.createElement('option');
      option.value = s.state || '';
      option.textContent = (s.name || s.state || '') + ' (' + (s.topicCount || 0) + ' Themen)';
      if (s.state === currentState) option.selected = true;
      sel.appendChild(option);
    }
  }

  window.lernpfadeChangeState = function (stateCode) {
    currentState = stateCode || '';
    if (!currentState) {
      /* Reset to full path list */
      loadPaths();
      return;
    }
    /* Fetch per-state path */
    getEl('path-tree').innerHTML =
      '<p class="text-muted"><i class="fa fa-spinner fa-spin"></i> Lade Lernpfad...</p>';

    apiFetch('/learning-paths?state=' + encodeURIComponent(currentState), {
      signal: AbortSignal.timeout(8000),
    })
      .then(function (data) {
        if (data && data.current) {
          renderStatePath(data.current);
        } else {
          getEl('path-tree').innerHTML =
            '<p class="text-muted">Kein Lernpfad für dieses Bundesland verfügbar.</p>';
        }
      })
      .catch(function (err) {
        getEl('path-tree').innerHTML =
          '<p class="text-muted">Lernpfad konnte nicht geladen werden.</p>';
        console.warn('[lernpfade] changeState error:', err);
      });
  };

  /* ── Render: Per-State Path ── */
  function renderStatePath(pathData) {
    var container = getEl('path-tree');
    if (!pathData || !pathData.topics || pathData.topics.length === 0) {
      container.innerHTML = '<p class="text-muted">Keine Themen für dieses Bundesland.</p>';
      return;
    }

    var html = '<div class="state-path-header">';
    html += '<h3>' + escHtml(pathData.name || pathData.state + ' Chemie Lehrplan') + '</h3>';
    html +=
      '<span class="state-path-meta">Klasse ' +
      escHtml(pathData.grade || '?') +
      ' | ' +
      pathData.topics.length +
      ' Themen</span>';
    html += '</div>';

    html += '<ul class="path-tree-list">';
    for (var i = 0; i < pathData.topics.length; i++) {
      var t = pathData.topics[i];
      var topicId = 'state-topic-' + i;
      html += '<li class="path-tree-item path-in-progress" data-path-id="' + topicId + '">';
      html += '<div class="path-tree-header" onclick="lernpfadeTogglePath(\'' + topicId + '\')">';
      html += '<span class="path-toggle-icon"><i class="fa fa-chevron-right"></i></span>';
      html += '<span class="path-title">' + escHtml(t.name || '') + '</span>';
      if (t.grade) {
        html += '<span class="path-grade">Kl. ' + escHtml(t.grade) + '</span>';
      }
      html += '<span class="path-pct">' + (t.objectives || 0) + ' Ziele</span>';
      html += '</div>';

      /* Objectives */
      if (t.objectiveTexts && t.objectiveTexts.length > 0) {
        html += '<ul class="path-topics">';
        for (var j = 0; j < t.objectiveTexts.length; j++) {
          html += '<li class="path-topic-item topic-locked">';
          html += '<span class="topic-title">' + escHtml(t.objectiveTexts[j]) + '</span>';
          html += '</li>';
        }
        html += '</ul>';
      }

      /* Article links */
      if (t.articles && t.articles.length > 0) {
        html += '<ul class="path-topics">';
        for (var k = 0; k < t.articles.length; k++) {
          var articleTitle = (t.articleTitles && t.articleTitles[k]) || t.articles[k];
          html += '<li class="path-topic-item topic-in-progress">';
          html +=
            '<a href="' +
            escHtml(t.articles[k]) +
            '" class="topic-article-link">' +
            '<i class="fa fa-file-text-o"></i> ' +
            escHtml(articleTitle) +
            '</a>';
          html += '</li>';
        }
        html += '</ul>';
      }

      html += '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
  }

  /* ── Render: Path Tree ── */
  function renderPathTree(paths) {
    var container = getEl('path-tree');
    if (!paths || paths.length === 0) {
      container.innerHTML = '<p class="text-muted">Keine Lernpfade verfügbar.</p>';
      return;
    }

    var html = '<ul class="path-tree-list">';
    for (var i = 0; i < paths.length; i++) {
      var p = paths[i];
      var pct = p.progress || 0;
      var statusClass;
      if (pct >= 100) {
        statusClass = 'path-completed';
      } else if (pct > 0) {
        statusClass = 'path-in-progress';
      } else {
        statusClass = 'path-locked';
      }
      var expanded = pathTreeExpanded[p.id] ? ' expanded' : '';

      html +=
        '<li class="path-tree-item ' +
        statusClass +
        expanded +
        '" data-path-id="' +
        escHtml(p.id) +
        '">';
      html +=
        '<div class="path-tree-header" onclick="lernpfadeTogglePath(\'' + escHtml(p.id) + '\')">';
      html += '<span class="path-toggle-icon"><i class="fa fa-chevron-right"></i></span>';
      html += '<span class="path-title">' + escHtml(p.title) + '</span>';
      html += '<span class="path-pct">' + pct + '%</span>';
      html += '</div>';
      html +=
        '<div class="path-tree-progress"><div class="path-tree-progress-bar" style="width:' +
        pct +
        '%"></div></div>';
      html += '<span class="path-topic-count">' + (p.topicCount || 0) + ' Themen</span>';

      if (p.topics && p.topics.length > 0) {
        html += '<ul class="path-topics">';
        for (var j = 0; j < p.topics.length; j++) {
          var t = p.topics[j];
          var tStatus;
          if (t.progress >= 100) {
            tStatus = 'topic-completed';
          } else if (t.progress > 0) {
            tStatus = 'topic-in-progress';
          } else {
            tStatus = 'topic-locked';
          }
          html +=
            '<li class="path-topic-item ' +
            tStatus +
            '" data-path-id="' +
            escHtml(p.id) +
            '" data-topic-id="' +
            escHtml(t.id) +
            '">';
          html +=
            '<div class="topic-header" onclick="lernpfadeToggleTopic(\'' +
            escHtml(p.id) +
            "','" +
            escHtml(t.id) +
            '\')">';
          html += '<span class="topic-toggle-icon"><i class="fa fa-chevron-right"></i></span>';
          html += '<span class="topic-title">' + escHtml(t.title) + '</span>';
          html += '<span class="topic-pct">' + (t.progress || 0) + '%</span>';
          html += '</div>';
          html +=
            '<div class="path-tree-progress"><div class="path-tree-progress-bar" style="width:' +
            (t.progress || 0) +
            '%"></div></div>';

          if (t.objectives && t.objectives.length > 0) {
            html += '<ul class="topic-objectives">';
            for (var k = 0; k < t.objectives.length; k++) {
              var o = t.objectives[k];
              var checkClass = o.completed ? 'obj-completed' : 'obj-pending';
              var checkIcon = o.completed ? 'fa-check-circle' : 'fa-circle-o';
              html += '<li class="objective-item ' + checkClass + '">';
              html += '<i class="fa ' + checkIcon + '"></i> ';
              html += '<span>' + escHtml(o.title) + '</span>';
              html += '</li>';
            }
            html += '</ul>';
          }

          html += '</li>';
        }
        html += '</ul>';
      }

      html += '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
  }

  /* ── Toggle path expand ── */
  window.lernpfadeTogglePath = function (pathId) {
    pathTreeExpanded[pathId] = !pathTreeExpanded[pathId];
    var item = document.querySelector('.path-tree-item[data-path-id="' + pathId + '"]');
    if (item) {
      item.classList.toggle('expanded');
    }
    /* Reload from API to get fresh topic data if first expansion */
    if (pathTreeExpanded[pathId]) {
      var hasTopics = false;
      for (var i = 0; i < paths.length; i++) {
        if (paths[i].id === pathId && paths[i].topics && paths[i].topics.length > 0) {
          hasTopics = true;
          break;
        }
      }
      if (!hasTopics) {
        apiFetch('/learning-paths/' + encodeURIComponent(pathId), {
          signal: AbortSignal.timeout(8000),
        })
          .then(function (data) {
            if (data && data.path) {
              for (var i = 0; i < paths.length; i++) {
                if (paths[i].id === pathId) {
                  paths[i].topics = data.path.topics || [];
                  break;
                }
              }
              renderPathTree(paths);
              /* Re-expand the toggled path */
              var item = document.querySelector('.path-tree-item[data-path-id="' + pathId + '"]');
              if (item) item.classList.add('expanded');
            }
          })
          .catch(function () {
            console.warn('[lernpfade] Topic detail fetch failed');
          });
      }
    }
  };

  /* ── Toggle topic expand ── */
  window.lernpfadeToggleTopic = function (pathId, topicId) {
    var item = document.querySelector(
      '.path-topic-item[data-path-id="' + pathId + '"][data-topic-id="' + topicId + '"]'
    );
    if (item) {
      item.classList.toggle('expanded');
    }
  };

  /* ── Render: XP Bar ── */
  function renderXpBar(profile) {
    if (!profile) return;

    var current = profile.xp || 0;
    var currentLevelXp = profile.xpForCurrentLevel || 0;
    var nextLevelXp = profile.xpForNextLevel || 500;
    var level = profile.level || 1;
    var levelTitle = profile.levelTitle || 'Chemie-Anfänger';

    /* Calculate progress within level */
    var levelRange = nextLevelXp - currentLevelXp;
    var progressInLevel = current - currentLevelXp;
    var pct = levelRange > 0 ? Math.round((progressInLevel / levelRange) * 100) : 0;
    if (pct > 100) pct = 100;
    if (pct < 0) pct = 0;

    getEl('xp-current').textContent = current;
    getEl('xp-next').textContent = nextLevelXp;
    getEl('level-number').textContent = level;
    getEl('level-title').textContent = levelTitle;

    var bar = getEl('xp-bar-fill');
    bar.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', pct);
  }

  /* ── Render: Streak ── */
  function renderStreak(profile) {
    if (!profile) return;
    getEl('streak-count').textContent = profile.streak || 0;
  }

  /* ── Render: Badge Grid ── */
  function renderBadgeGrid(badges) {
    var grid = getEl('badge-grid');
    if (!badges || badges.length === 0) {
      grid.innerHTML = '<p class="text-muted">Noch keine Erfolge freigeschaltet.</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < badges.length; i++) {
      var b = badges[i];
      var earned = b.earned;
      var cardClass = earned ? 'badge-card earned' : 'badge-card locked';
      var iconClass = b.icon || 'fa-star';
      var iconStyle = earned ? '' : ' style="filter:grayscale(1);opacity:0.5"';

      html += '<div class="' + cardClass + '"';
      if (!earned && b.condition) {
        html += ' title="' + escHtml(b.condition) + '"';
      }
      html += '>';
      html += '<div class="badge-icon"' + iconStyle + '>';
      if (earned) {
        html += '<i class="fa ' + iconClass + '"></i>';
      } else {
        html += '<i class="fa ' + iconClass + '" style="filter:grayscale(1);opacity:0.5"></i>';
      }
      html += '</div>';
      html += '<div class="badge-name">' + escHtml(b.name) + '</div>';
      if (earned && b.earnedAt) {
        html += '<div class="badge-date">' + escHtml(formatDate(b.earnedAt)) + '</div>';
      }
      if (!earned && b.condition) {
        html += '<div class="badge-condition">' + escHtml(b.condition) + '</div>';
      }
      html += '</div>';
    }

    grid.innerHTML = html;
  }

  /* ── Render: XP Log ── */
  function renderXpLog(xpLog) {
    var logEl = getEl('xp-log');
    if (!xpLog || xpLog.length === 0) {
      logEl.innerHTML = '<p class="text-muted">Noch keine Aktivitäten.</p>';
      return;
    }

    var html = '<ul class="xp-log-list">';
    var maxItems = Math.min(xpLog.length, 10);
    for (var i = 0; i < maxItems; i++) {
      var entry = xpLog[i];
      var dateStr = entry.date ? formatDate(entry.date) : '';
      html += '<li class="xp-log-item">';
      html +=
        '<span class="xp-log-action">' +
        escHtml(entry.action || entry.text || 'Aktivität') +
        '</span>';
      html += '<span class="xp-log-date">' + dateStr + '</span>';
      html += '<span class="xp-log-amount">+' + (entry.xp || 0) + ' XP</span>';
      html += '</li>';
    }
    html += '</ul>';
    logEl.innerHTML = html;
  }

  /* ── Render: Recommendations ── */
  function renderRecommendations(profile) {
    var card = getEl('recommendation-card');
    if (!card) return;

    /* If no profile or no learning paths, show generic */
    if (!profile || !paths || paths.length === 0) {
      card.innerHTML =
        '<div class="recommendation-placeholder">' +
        '<h3><i class="fa fa-lightbulb-o"></i> Nächstes empfohlenes Thema</h3>' +
        '<p>Wähle einen Lernpfad aus, um personalisierte Empfehlungen zu erhalten.</p>' +
        '</div>';
      return;
    }

    /* Find first uncompleted objective with prerequisites met */
    var nextTopic = findNextRecommendedTopic();
    if (nextTopic) {
      card.innerHTML =
        '<div class="recommendation-content">' +
        '<h3><i class="fa fa-lightbulb-o"></i> Nächstes empfohlenes Thema</h3>' +
        '<div class="recommendation-topic">' +
        '<h4>' +
        escHtml(nextTopic.title) +
        '</h4>' +
        (nextTopic.description ? '<p>' + escHtml(nextTopic.description) + '</p>' : '') +
        '<a href="' +
        (nextTopic.url || '/lernpfade/') +
        '" class="btn btn-primary">' +
        '<i class="fa fa-graduation-cap"></i> Lernen</a>' +
        '</div>' +
        '</div>';
    } else {
      card.innerHTML =
        '<div class="recommendation-content">' +
        '<h3><i class="fa fa-check-circle"></i> Nächstes empfohlenes Thema</h3>' +
        '<p>Alle verfügbaren Themen sind abgeschlossen! 🎉</p>' +
        '<a href="/lernpfade/" class="btn btn-success">Lernpfade durchstöbern</a>' +
        '</div>';
    }
  }

  /* ── Find next recommended topic ── */
  function findNextRecommendedTopic() {
    if (!paths || paths.length === 0) return null;
    var completedObjectives = (profile && profile.completedObjectives) || [];

    for (var i = 0; i < paths.length; i++) {
      var p = paths[i];
      if (p.progress >= 100) continue; /* skip completed paths */
      if (!p.topics) continue;

      for (var j = 0; j < p.topics.length; j++) {
        var t = p.topics[j];
        if (t.progress >= 100) continue; /* skip completed topics */
        if (!t.objectives) continue;

        for (var k = 0; k < t.objectives.length; k++) {
          var o = t.objectives[k];
          if (o.completed) continue;

          /* Check prerequisites met */
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
              url: '/lernpfade/',
              pathId: p.id,
              topicId: t.id,
            };
          }
        }

        if (t.objectives.length > 0) {
          var firstUncompleted = null;
          for (var k2 = 0; k2 < t.objectives.length; k2++) {
            if (!t.objectives[k2].completed) {
              firstUncompleted = t.objectives[k2];
              break;
            }
          }
          if (firstUncompleted) {
            return {
              id: firstUncompleted.id,
              title: firstUncompleted.title,
              description: firstUncompleted.description || t.description || '',
              url: '/lernpfade/',
              pathId: p.id,
              topicId: t.id,
            };
          }
        }
      }

      /* If no uncompleted objectives found but path is in-progress, recommend the path itself */
      if (p.progress > 0 && p.progress < 100) {
        return {
          id: p.id,
          title: p.title,
          description: p.description || '',
          url: '/lernpfade/',
        };
      }
    }

    return null;
  }

  /* ── Check-in ── */
  function checkIn() {
    var btn = getEl('btn-checkin');
    if (!btn || btn.disabled) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Wird eingetragen...';

    apiFetch('/gamification/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
      .then(function (data) {
        btn.innerHTML = '<i class="fa fa-check"></i> Erledigt';
        btn.className = 'btn btn-default btn-checkin disabled-checkin';
        /* Show bonus XP toast */
        if (data && data.xpGained) {
          if (typeof showBadgeToast === 'function') {
            showBadgeToast({ name: 'Täglicher Check-in', xpBonus: data.xpGained });
          }
        }
        /* Reload profile to update streak/xp */
        loadPaths();
        loadProfile();
      })
      .catch(function (err) {
        if (err.message === 'unauthorized') {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa fa-check-circle"></i> Check-in';
          return;
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fa fa-check-circle"></i> Check-in';
        console.warn('[lernpfade] checkin error:', err);
      });
  }

  /* ── Format date helper ── */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_e) {
      return dateStr;
    }
  }
})();
