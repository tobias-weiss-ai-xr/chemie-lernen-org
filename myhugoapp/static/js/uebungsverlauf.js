/**
 * uebungsverlauf.js — Exercise History Dashboard
 * Browser global (sourceType: 'script'), loaded via <script> tag
 */
(function () {
  'use strict';

  var API = '/api/exercises/history';
  var QUIZ_BASE = '/quiz/?topic=';

  // ── DOM refs ───────────────────────────────────────────
  var elLoading = document.getElementById('uv-loading');
  var elContent = document.getElementById('uv-content');
  var elError = document.getElementById('uv-error');
  var elErrorMsg = document.getElementById('uv-error-msg');
  var elAccuracyPct = document.getElementById('uv-accuracy-correct-pct');
  var elAccuracyCount = document.getElementById('uv-accuracy-correct-count');
  var elWrongPct = document.getElementById('uv-accuracy-wrong-pct');
  var elWrongCount = document.getElementById('uv-accuracy-wrong-count');
  var elTotalNum = document.getElementById('uv-accuracy-total-num');
  var elAccuracyBar = document.getElementById('uv-accuracy-bar');
  var elTopicsList = document.getElementById('uv-topics-list');
  var elRecentList = document.getElementById('uv-recent-list');
  var elRecommendations = document.getElementById('uv-recommendations-list');

  // ── Init ───────────────────────────────────────────────
  function init() {
    fetchHistory();
  }

  // ── Fetch ──────────────────────────────────────────────
  function fetchHistory() {
    showLoading();
    fetch(API, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then(function (res) {
        if (res.status === 401) {
          window.location.href =
            '/account/login/?next=' + encodeURIComponent(window.location.pathname);
          return null;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        render(data);
      })
      .catch(function (err) {
        showError(err.message);
      });
  }

  // ── Render ──────────────────────────────────────────────
  function render(data) {
    var accuracy = data.accuracy || {};
    var perTopic = accuracy.perTopic || {};
    var attempts = data.attempts || [];
    var totalCorrect = 0;
    var totalWrong = 0;

    // Calculate totals from per-topic
    Object.keys(perTopic).forEach(function (topic) {
      var t = perTopic[topic];
      totalCorrect += t.correct || 0;
      totalWrong += (t.total || 0) - (t.correct || 0);
    });

    var total = totalCorrect + totalWrong;
    var correctPct = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

    // Accuracy overview
    elAccuracyPct.textContent = correctPct + '%';
    elAccuracyCount.textContent = totalCorrect;
    elWrongPct.textContent = 100 - correctPct + '%';
    elWrongCount.textContent = totalWrong;
    elTotalNum.textContent = total;
    elAccuracyBar.style.width = correctPct + '%';
    elAccuracyBar.className = 'uv-accuracy-bar uv-bar-' + barColorClass(correctPct);

    // Topic breakdown
    renderTopicBreakdown(perTopic);

    // Recent attempts
    renderRecentAttempts(attempts);

    // Recommendations
    renderRecommendations(perTopic);

    showContent();
  }

  // ── Topic Breakdown ───────────────────────────────────
  function renderTopicBreakdown(perTopic) {
    if (Object.keys(perTopic).length === 0) {
      elTopicsList.innerHTML = '<p class="uv-empty-text">Keine Themendaten verfügbar.</p>';
      return;
    }

    var html = '';
    Object.keys(perTopic).forEach(function (topic) {
      var t = perTopic[topic];
      var pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
      var colorClass = barColorClass(pct);

      html +=
        '<div class="uv-topic-card">' +
        '<div class="uv-topic-header">' +
        '<span class="uv-topic-name">' +
        escapeHtml(topic) +
        '</span>' +
        '<span class="uv-topic-pct uv-pct-' +
        colorClass +
        '">' +
        pct +
        '%</span>' +
        '</div>' +
        '<div class="uv-bar-container">' +
        '<div class="uv-bar uv-bar-' +
        colorClass +
        '" style="width:' +
        pct +
        '%;"></div>' +
        '</div>' +
        '<div class="uv-topic-meta">' +
        t.correct +
        ' / ' +
        t.total +
        ' richtig</div>' +
        '<a class="uv-btn-small" href="' +
        QUIZ_BASE +
        encodeURIComponent(topic) +
        '">Quiz starten</a>' +
        '</div>';
    });

    elTopicsList.innerHTML = html;
  }

  // ── Recent Attempts ────────────────────────────────────
  function renderRecentAttempts(attempts) {
    if (attempts.length === 0) {
      elRecentList.innerHTML = '<p class="uv-empty-text">Noch keine Versuche aufgezeichnet.</p>';
      return;
    }

    var recent = attempts.slice(0, 20);
    var html = '';
    recent.forEach(function (a) {
      var date = a.date ? new Date(a.date).toLocaleDateString('de-DE') : '';
      var score = a.score != null ? a.score : a.percentage != null ? a.percentage : 0;
      var colorClass = barColorClass(score);

      html +=
        '<div class="uv-recent-item">' +
        '<div class="uv-recent-date">' +
        escapeHtml(date) +
        '</div>' +
        '<div class="uv-recent-topic">' +
        escapeHtml(a.topic || '') +
        '</div>' +
        '<div class="uv-recent-score uv-pct-' +
        colorClass +
        '">' +
        score +
        '%</div>' +
        (a.feedback
          ? '<div class="uv-recent-feedback">' + escapeHtml(a.feedback).substring(0, 100) + '</div>'
          : '') +
        '</div>';
    });

    elRecentList.innerHTML = html;
  }

  // ── Recommendations ───────────────────────────────────
  function renderRecommendations(perTopic) {
    var weak = [];
    Object.keys(perTopic).forEach(function (topic) {
      var t = perTopic[topic];
      var pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 100;
      if (pct < 60 && t.total > 0) {
        weak.push({ topic: topic, pct: pct, total: t.total });
      }
    });

    weak.sort(function (a, b) {
      return a.pct - b.pct;
    });

    if (weak.length === 0) {
      elRecommendations.innerHTML =
        '<p class="uv-empty-text">Keine Empfehlungen — gut gemacht!</p>';
      return;
    }

    var html = '';
    weak.slice(0, 5).forEach(function (w) {
      html +=
        '<div class="uv-recommendation-card">' +
        '<div class="uv-rec-topic">' +
        escapeHtml(w.topic) +
        '</div>' +
        '<div class="uv-rec-score uv-pct-red">' +
        w.pct +
        '% (' +
        w.total +
        ' Versuche)</div>' +
        '<a class="uv-btn-primary" href="' +
        QUIZ_BASE +
        encodeURIComponent(w.topic) +
        '">Quiz starten</a>' +
        '</div>';
    });

    elRecommendations.innerHTML = html;
  }

  // ── Helpers ───────────────────────────────────────────
  function barColorClass(pct) {
    if (pct >= 80) return 'green';
    if (pct >= 60) return 'yellow';
    return 'red';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function showLoading() {
    elLoading.style.display = '';
    elContent.style.display = 'none';
    elError.style.display = 'none';
  }

  function showContent() {
    elLoading.style.display = 'none';
    elContent.style.display = '';
    elError.style.display = 'none';
  }

  function showError(msg) {
    elLoading.style.display = 'none';
    elContent.style.display = 'none';
    elError.style.display = '';
    elErrorMsg.textContent = msg;
  }

  // ── Expose ─────────────────────────────────────────────
  window.Uebungsverlauf = {
    fetchHistory: fetchHistory,
  };

  // ── Boot ───────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
