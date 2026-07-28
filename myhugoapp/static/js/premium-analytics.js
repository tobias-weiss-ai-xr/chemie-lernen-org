/**
 * Premium Analytics Dashboard — Teacher-facing class analytics.
 * Loads data from /api/analytics/* endpoints.
 */

(function () {
  'use strict';

  var API_BASE = window.API_BASE || '';
  var PAGE_SIZE = 20;
  var currentSort = 'xp';
  var currentOrder = 'desc';
  var currentSearch = '';
  var currentOffset = 0;
  var cachedStudents = null;
  var totalStudents = 0;

  // ── Init ───────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    loadDashboard();
    bindEvents();
  });

  function bindEvents() {
    // Sort headers
    document.querySelectorAll('#student-table .sortable').forEach(function (th) {
      th.addEventListener('click', function () {
        var field = th.getAttribute('data-sort');
        if (currentSort === field) {
          currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
        } else {
          currentSort = field;
          currentOrder = 'desc';
        }
        currentOffset = 0;
        updateSortIndicators();
        renderStudentTable();
      });
    });

    // Search
    var searchInput = document.getElementById('student-search');
    var debounceTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          currentSearch = searchInput.value.trim();
          currentOffset = 0;
          renderStudentTable();
        }, 300);
      });
    }

    // Export
    var exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        window.location.href = API_BASE + '/api/analytics/export?format=csv';
      });
    }
  }

  function updateSortIndicators() {
    document.querySelectorAll('#student-table .sortable').forEach(function (th) {
      var icon = th.querySelector('i');
      var field = th.getAttribute('data-sort');
      if (field === currentSort) {
        icon.className = currentOrder === 'asc' ? 'fa fa-sort-asc' : 'fa fa-sort-desc';
      } else {
        icon.className = 'fa fa-sort';
      }
    });
  }

  // ── Data Loading ───────────────────────────────────────────

  function loadDashboard() {
    var loading = document.getElementById('analytics-loading');
    var errorDiv = document.getElementById('analytics-error');
    var content = document.getElementById('analytics-content');

    Promise.all([
      fetchJson(API_BASE + '/api/analytics/class-overview'),
      fetchJson(API_BASE + '/api/analytics/topic-breakdown'),
      fetchJson(API_BASE + '/api/analytics/engagement-timeline?weeks=12'),
    ])
      .then(function (results) {
        loading.style.display = 'none';
        content.style.display = 'block';

        renderOverview(results[0]);
        renderEngagementChart(results[0].weeklyActiveUsers || []);
        renderTopicBreakdown(results[1]);
      })
      .catch(function (err) {
        loading.style.display = 'none';
        document.getElementById('analytics-error-msg').textContent =
          'Fehler beim Laden: ' + (err.message || err);
        errorDiv.style.display = 'block';
      });
  }

  // ── Overview Cards ────────────────────────────────────────

  function renderOverview(data) {
    setText('ov-students', data.totalStudents || 0);
    setText('ov-active', (data.activeThisWeek || 0) + ' / ' + (data.totalStudents || 0));
    setText('ov-xp', (data.avgXp || 0).toLocaleString('de-DE'));
    setText('ov-streak', (data.avgStreak || 0) + ' Tage');
  }

  // ── Engagement Sparkline (pure SVG) ─────────────────────────

  function renderEngagementChart(weeklyData) {
    var container = document.getElementById('engagement-chart');
    if (!weeklyData.length) {
      container.innerHTML = '<p class="text-muted">Keine Aktivitätsdaten verfügbar.</p>';
      return;
    }

    var maxCount = Math.max(
      1,
      Math.max.apply(
        null,
        weeklyData.map(function (d) {
          return d.count;
        })
      )
    );
    var width = Math.max(400, weeklyData.length * 40);
    var height = 120;
    var barWidth = Math.max(8, (width / weeklyData.length) * 0.6);
    var gap = (width - barWidth * weeklyData.length) / weeklyData.length;

    var svgParts = [
      '<svg width="100%" height="' +
        height +
        '" viewBox="0 0 ' +
        width +
        ' ' +
        height +
        '" preserveAspectRatio="xMidYMid meet">',
    ];

    weeklyData.forEach(function (d, i) {
      var barHeight = Math.max(2, (d.count / maxCount) * (height - 30));
      var x = i * (barWidth + gap) + gap / 2;
      var y = height - barHeight - 20;
      svgParts.push(
        '<rect x="' +
          x +
          '" y="' +
          y +
          '" width="' +
          barWidth +
          '" height="' +
          barHeight +
          '" rx="3" fill="' +
          (i === weeklyData.length - 1 ? '#2196f3' : '#90caf9') +
          '" title="' +
          d.week +
          ': ' +
          d.count +
          ' aktive">'
      );
      svgParts.push(
        '<text x="' +
          (x + barWidth / 2) +
          '" y="' +
          (height - 4) +
          '" text-anchor="middle" font-size="9" fill="#666">' +
          d.week.split('-W')[1] +
          '</text>'
      );
      svgParts.push(
        '<text x="' +
          (x + barWidth / 2) +
          '" y="' +
          (y - 3) +
          '" text-anchor="middle" font-size="10" fill="#333" font-weight="600">' +
          d.count +
          '</text>'
      );
    });

    svgParts.push('</svg>');
    container.innerHTML = svgParts.join('');
  }

  // ── Student Table (server-side paginated) ──────────────────

  function renderStudentTable() {
    var params =
      'sort=' +
      currentSort +
      '&order=' +
      currentOrder +
      '&limit=' +
      PAGE_SIZE +
      '&offset=' +
      currentOffset +
      '&search=' +
      encodeURIComponent(currentSearch);

    fetchJson(API_BASE + '/api/analytics/students?' + params)
      .then(function (data) {
        cachedStudents = data.students || [];
        totalStudents = data.total || 0;
        renderStudentRows(cachedStudents);
        renderPagination();
      })
      .catch(function (err) {
        console.error('[analytics] student table error:', err);
      });
  }

  function renderStudentRows(students) {
    var tbody = document.getElementById('student-tbody');
    if (!students.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-muted">Keine Schüler gefunden.</td></tr>';
      return;
    }

    var rows = students.map(function (s) {
      var lastActive = s.lastActive
        ? formatDate(s.lastActive)
        : '<span class="text-muted">Nie</span>';
      var scoreColor = s.avgQuizScore < 50 ? 'danger' : s.avgQuizScore < 70 ? 'warning' : 'success';

      return (
        '<tr>' +
        '<td><strong>' +
        escapeHtml(s.name) +
        '</strong></td>' +
        '<td>' +
        (s.xp || 0).toLocaleString('de-DE') +
        '</td>' +
        '<td>' +
        (s.level || 0) +
        '</td>' +
        '<td>' +
        (s.streak || 0) +
        'd</td>' +
        '<td>' +
        (s.quizCount || 0) +
        '</td>' +
        '<td><span class="label label-' +
        scoreColor +
        '">' +
        (s.avgQuizScore || 0) +
        '%</span></td>' +
        '<td>' +
        lastActive +
        '</td>' +
        '</tr>'
      );
    });

    tbody.innerHTML = rows.join('');
  }

  function renderPagination() {
    var container = document.getElementById('student-pagination');
    if (!container) return;
    var pages = Math.ceil(totalStudents / PAGE_SIZE);
    var currentPage = Math.floor(currentOffset / PAGE_SIZE);

    if (pages <= 1) {
      container.innerHTML = '';
      return;
    }

    var html = '<div class="text-center">';
    html += '<small class="text-muted">' + totalStudents + ' Schüler</small> ';
    html += '<div class="btn-group">';

    // Prev
    html +=
      '<button class="btn btn-xs btn-default" ' +
      (currentPage === 0 ? 'disabled' : '') +
      ' data-page="' +
      (currentPage - 1) +
      '">&laquo;</button>';

    // Page numbers
    for (var i = 0; i < pages && i < 7; i++) {
      var pageNum =
        i < 3 ? i : pages - (7 - i) < currentPage + 2 ? pages - (7 - i) : currentPage - 1 + (i - 2);
      if (pageNum < 0) pageNum = i;
      if (pageNum >= pages) continue;
      html +=
        '<button class="btn btn-xs ' +
        (pageNum === currentPage ? 'btn-primary' : 'btn-default') +
        '" data-page="' +
        pageNum +
        '">' +
        (pageNum + 1) +
        '</button>';
    }

    // Next
    html +=
      '<button class="btn btn-xs btn-default" ' +
      (currentPage >= pages - 1 ? 'disabled' : '') +
      ' data-page="' +
      (currentPage + 1) +
      '">&raquo;</button>';

    html += '</div></div>';
    container.innerHTML = html;

    // Bind pagination clicks
    container.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var page = Number(btn.getAttribute('data-page'));
        currentOffset = page * PAGE_SIZE;
        renderStudentTable();
        window.scrollTo(0, document.getElementById('student-table').offsetTop - 80);
      });
    });
  }

  // ── Topic Breakdown ────────────────────────────────────────

  function renderTopicBreakdown(data) {
    var container = document.getElementById('topic-breakdown');
    var topics = data.topics || [];

    if (!topics.length) {
      container.innerHTML = '<p class="text-muted">Noch keine Quiz-Daten verfügbar.</p>';
      return;
    }

    var html = topics.map(function (t) {
      var scoreColor = t.avgScore < 50 ? '#f44336' : t.avgScore < 70 ? '#ff9800' : '#4caf50';
      var width = Math.max(3, Math.min(100, t.avgScore));
      var isWeak = (data.weakAreas || []).indexOf(t.topic) !== -1;
      var warningBadge = isWeak ? ' <span class="label label-warning">Schwachbereich</span>' : '';

      return (
        '<div class="topic-row">' +
        '<div class="topic-info">' +
        '<span class="topic-name">' +
        escapeHtml(t.topic) +
        warningBadge +
        '</span>' +
        '<span class="topic-meta">' +
        t.students +
        ' Schüler, ' +
        t.attempts +
        ' Versuche</span>' +
        '</div>' +
        '<div class="topic-bar">' +
        '<div class="topic-bar-fill" style="width:' +
        width +
        '%; background:' +
        scoreColor +
        ';">' +
        '<span class="topic-bar-label">' +
        t.avgScore +
        '%</span>' +
        '</div>' +
        '</div>' +
        '</div>'
      );
    });

    container.innerHTML = html.join('');
  }

  // ── Helpers ────────────────────────────────────────────────

  function fetchJson(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function formatDate(isoStr) {
    var d = new Date(isoStr);
    var now = new Date();
    var diffMs = now - d;
    var diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return 'vor ' + diffDays + ' Tagen';

    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
