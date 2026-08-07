/**
 * assessment-dashboard.js — Client-side assessment dashboard.
 *
 * Fetches learner assessment results from the API, renders score trends
 * via Chart.js, identifies weak topics, and displays recommendations.
 *
 * Loaded by assessment-dashboard.html layout.
 */

(function () {
  'use strict';

  var ASSESSMENT_API = '/api/assessment/results';
  var LOADING_EL = 'assessment-loading';
  var CONTENT_EL = 'assessment-content';
  var ERROR_EL = 'assessment-error';

  /**
   * Load assessment data from the API and render the dashboard.
   * Called on page load and on retry.
   */
  window.loadAssessmentData = function () {
    showElement(LOADING_EL);
    hideElement(CONTENT_EL);
    hideElement(ERROR_EL);

    // Return the promise chain so callers can await completion.
    return fetch(ASSESSMENT_API, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        renderDashboard(data);
      })
      .catch(function (err) {
        console.error('[assessment-dashboard] Error:', err);
        showElement(ERROR_EL);
        hideElement(CONTENT_EL);
        hideElement(LOADING_EL);
      });
  };

  /**
   * Show a DOM element by ID.
   */
  function showElement(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = '';
  }

  /**
   * Hide a DOM element by ID.
   */
  function hideElement(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  /**
   * Render the full dashboard from API response data.
   */
  function renderDashboard(data) {
    var results = data.results || [];

    // Calculate overall score
    var overallScore = calculateOverallScore(results);
    document.getElementById('overall-score').textContent = overallScore;

    // Group results by topic for weak/strong analysis
    var topicScores = groupByTopic(results);

    // Identify weak and strong topics
    var weakTopics = getWeakTopics(topicScores);
    var strongTopics = getStrongTopics(topicScores);

    document.getElementById('strong-topics-count').textContent = strongTopics.length;
    document.getElementById('weak-topics-count').textContent = weakTopics.length;

    // Render recent assessments table
    renderRecentAssessments(results);

    // Render weak topics list
    renderWeakTopics(weakTopics);

    // Render recommendations
    renderRecommendations(weakTopics);

    // Render score trend chart (if Chart.js is available)
    renderScoreTrend(results);

    // Show content, hide loading
    showElement(CONTENT_EL);
    hideElement(LOADING_EL);
  }

  /**
   * Calculate overall average score from assessment results.
   */
  function calculateOverallScore(results) {
    if (!results || results.length === 0) return '—';
    var total = 0;
    var count = 0;
    for (var i = 0; i < results.length; i++) {
      if (typeof results[i].score === 'number') {
        total += results[i].score;
        count++;
      }
    }
    return count > 0 ? Math.round(total / count) : '—';
  }

  /**
   * Group assessment results by topic and compute per-topic averages.
   */
  function groupByTopic(results) {
    var topics = {};
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (!r.topic) continue;
      if (!topics[r.topic]) {
        topics[r.topic] = { scores: [], count: 0 };
      }
      if (typeof r.score === 'number') {
        topics[r.topic].scores.push(r.score);
      }
      topics[r.topic].count++;
    }

    var result = [];
    var keys = Object.keys(topics);
    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      var topic = topics[key];
      var avg =
        topic.scores.length > 0
          ? Math.round(
              topic.scores.reduce(function (a, b) {
                return a + b;
              }, 0) / topic.scores.length
            )
          : 0;
      result.push({ topic: key, averageScore: avg, count: topic.count });
    }

    result.sort(function (a, b) {
      return a.averageScore - b.averageScore;
    });
    return result;
  }

  /**
   * Get the bottom 3 topics by average score (weak areas).
   */
  function getWeakTopics(topicScores) {
    return topicScores
      .filter(function (t) {
        return t.averageScore < 60;
      })
      .slice(0, 3);
  }

  /**
   * Get topics with average score >= 80 (strong areas).
   */
  function getStrongTopics(topicScores) {
    return topicScores.filter(function (t) {
      return t.averageScore >= 80;
    });
  }

  /**
   * Render the recent assessments table.
   */
  function renderRecentAssessments(results) {
    var tbody = document.getElementById('recent-assessments-body');
    if (!tbody) return;

    if (!results || results.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Keine Daten verfügbar</td></tr>';
      return;
    }

    var html = '';
    var limit = Math.min(results.length, 10);
    for (var i = 0; i < limit; i++) {
      var r = results[i];
      var date = r.date ? new Date(r.date).toLocaleDateString('de-DE') : '—';
      var score = typeof r.score === 'number' ? r.score : NaN;
      var scoreClass = score >= 60 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger';
      html +=
        '<tr>' +
        '<td><a href="/themenbereiche/' +
        encodeURIComponent(r.topic || '') +
        '/">' +
        escapeHtml(r.topic || '—') +
        '</a></td>' +
        '<td>' +
        escapeHtml(r.difficulty || '—') +
        '</td>' +
        '<td class="' +
        scoreClass +
        '"><strong>' +
        (typeof r.score === 'number' ? r.score + '%' : '—') +
        '</strong></td>' +
        '<td>' +
        date +
        '</td>' +
        '</tr>';
    }
    tbody.innerHTML = html;
  }

  /**
   * Render weak topics as a list with drill-down links.
   */
  function renderWeakTopics(weakTopics) {
    var list = document.getElementById('weak-topics-list');
    if (!list) return;

    if (!weakTopics || weakTopics.length === 0) {
      list.innerHTML = '<li class="list-group-item text-success">Keine Übungsbedarf-Themen</li>';
      return;
    }

    var html = '';
    for (var i = 0; i < weakTopics.length; i++) {
      var t = weakTopics[i];
      html +=
        '<a href="/themenbereiche/' +
        encodeURIComponent(t.topic) +
        '/" class="list-group-item list-group-item-danger">' +
        '<strong>' +
        escapeHtml(t.topic) +
        '</strong>' +
        '<span class="badge">' +
        t.averageScore +
        '%</span>' +
        '</a>';
    }
    list.innerHTML = html;
  }

  /**
   * Render study recommendations based on weak topics.
   */
  function renderRecommendations(weakTopics) {
    var list = document.getElementById('recommendations-list');
    if (!list) return;

    if (!weakTopics || weakTopics.length === 0) {
      list.innerHTML =
        '<li class="list-group-item text-success">Weiter so! Alle Themenbereiche sind solide.</li>';
      return;
    }

    var html = '';
    for (var i = 0; i < weakTopics.length; i++) {
      var t = weakTopics[i];
      html +=
        '<li class="list-group-item">' +
        'Wiederholen Sie <strong>' +
        escapeHtml(t.topic) +
        '</strong> ' +
        '(Durchschnitt: ' +
        t.averageScore +
        '%). ' +
        '<a href="/themenbereiche/' +
        encodeURIComponent(t.topic) +
        '/">Jetzt üben →</a>' +
        '</li>';
    }
    list.innerHTML = html;
  }

  /**
   * Render the score trend chart using Chart.js.
   * Defensive: never let chart-rendering failures block the dashboard
   * (e.g. in environments without canvas support).
   */
  function renderScoreTrend(results) {
    try {
      var canvas = document.getElementById('score-trend-chart');
      if (!canvas) return;

      // Chart.js must be loaded globally
      if (typeof window.Chart === 'undefined') {
        console.warn('[assessment-dashboard] Chart.js not available');
        return;
      }

      var ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) {
        console.warn('[assessment-dashboard] Canvas 2D context not available');
        return;
      }

      // Prepare data: last 10 results in chronological order (reverse)
      var chartData = results.slice(0, 10).reverse();
      var labels = [];
      var scores = [];

      for (var i = 0; i < chartData.length; i++) {
        var r = chartData[i];
        var date = r.date
          ? new Date(r.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
          : '';
        labels.push(date + ' — ' + (r.topic || '').slice(0, 15));
        scores.push(typeof r.score === 'number' ? r.score : 0);
      }

      // Destroy existing chart if any
      if (window._scoreChart) {
        window._scoreChart.destroy();
      }

      window._scoreChart = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Ergebnis (%)',
              data: scores,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#4CAF50',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 100,
              title: { display: true, text: 'Ergebnis (%)' },
            },
            x: {
              ticks: { maxRotation: 45, font: { size: 10 } },
            },
          },
          plugins: {
            legend: { display: false },
          },
        },
      });
    } catch (err) {
      console.warn('[assessment-dashboard] Score chart render failed:', err);
    }
  }

  /**
   * Simple HTML entity escaping.
   */
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // Expose pure helper functions as browser globals (shared-globals pattern)
  // so they can be unit-tested in isolation. These are defined before the
  // auto-load below so they are always available even if auto-load throws.
  window.calculateOverallScore = calculateOverallScore;
  window.groupByTopic = groupByTopic;
  window.getWeakTopics = getWeakTopics;
  window.getStrongTopics = getStrongTopics;

  // Auto-load on DOM ready (only if fetch is available, e.g. not in jsdom)
  var autoLoad = function () {
    if (typeof window.fetch !== 'function') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', window.loadAssessmentData);
    } else {
      window.loadAssessmentData();
    }
  };
  autoLoad();
})();
