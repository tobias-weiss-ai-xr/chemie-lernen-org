/* lernpfad.js — Guided learning paths (API-driven) */

var API_BASE = '/api';

var FALLBACK_PATHS = [
  {
    id: 'redox',
    title: 'Redoxreaktionen und Elektrochemie',
    description:
      'Vom Rost zur Batterie — verstehe Elektronenübertragungen und elektrochemische Prozesse.',
    difficulty: 'mittel',
    estimatedHours: 6,
  },
  {
    id: 'saeuren-basen',
    title: 'Säuren und Basen',
    description: 'pH-Wert, Neutralisation, Puffer und Titration — von der Theorie zur Praxis.',
    difficulty: 'mittel',
    estimatedHours: 5,
  },
  {
    id: 'stoechiometrie',
    title: 'Stöchiometrie',
    description:
      'Richtig rechnen in der Chemie — molare Massen, Stoffmengen und Reaktionsgleichungen.',
    difficulty: 'leicht',
    estimatedHours: 4,
  },
  {
    id: 'organik',
    title: 'Organische Chemie',
    description: 'Von Alkanen zu funktionellen Gruppen — die Chemie des Kohlenstoffs.',
    difficulty: 'schwer',
    estimatedHours: 8,
  },
  {
    id: 'atommodelle',
    title: 'Atommodelle und Periodensystem',
    description: 'Vom Kern zu den Elementen — Atombau, Orbitale und das Periodensystem.',
    difficulty: 'mittel',
    estimatedHours: 5,
  },
  {
    id: 'bindungen',
    title: 'Chemische Bindungen',
    description: 'Ionenbindung, Elektronenpaarbindung, Metallbindung — die Kräfte zwischen Atomen.',
    difficulty: 'mittel',
    estimatedHours: 4,
  },
];

var paths = [];
var currentPathId = null;
var isLoggedIn = false;

function apiFetch(url, opts) {
  return fetch(API_BASE + url, opts).then(function (r) {
    if (!r.ok) throw new Error('API: ' + r.status);
    return r.json();
  });
}

function checkLoginStatus() {
  var cookie = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  isLoggedIn = !!cookie;
}

async function fetchPaths() {
  checkLoginStatus();
  try {
    var data = await apiFetch('/learning-paths', { signal: AbortSignal.timeout(8000) });
    if (data && data.paths && data.paths.length > 0) {
      paths = data.paths;
      return;
    }
  } catch (_e) {
    console.warn('[lernpfad] API unavailable, using fallback paths');
  }
  paths = FALLBACK_PATHS;
}

function getLocalProgress(pathId) {
  try {
    var done = JSON.parse(localStorage.getItem('lernpfad-' + pathId)) || [];
    return done.length;
  } catch (_e) {
    return 0;
  }
}

function renderPathList() {
  var list = document.getElementById('path-list');
  list.innerHTML = paths
    .map(function (p) {
      var steps = p.steps || [];
      var completed = isLoggedIn ? p.userProgress || 0 : getLocalProgress(p.id);
      var total = steps.length || p.estimatedHours || 1;
      var pct = Math.round((completed / total) * 100);
      var enrolledClass = p.isEnrolled ? 'list-group-item-success' : '';
      return (
        '<a href="#" class="list-group-item ' +
        enrolledClass +
        '" data-path-id="' +
        p.id +
        '" onclick="selectPath(\'' +
        p.id +
        '\'); return false;">' +
        '<h4 class="list-group-item-heading">' +
        p.title +
        '</h4>' +
        '<p class="list-group-item-text">' +
        (p.description || '').substring(0, 60) +
        '...</p>' +
        '<div class="progress" style="height: 6px; margin-top: 8px;">' +
        '<div class="progress-bar progress-bar-success" style="width: ' +
        pct +
        '%;"></div></div>' +
        '<small class="text-muted">' +
        completed +
        '/' +
        total +
        ' Schritte (' +
        pct +
        '%)</small>' +
        (p.isEnrolled ? ' <span class="label label-success">Eingeschrieben</span>' : '') +
        '</a>'
      );
    })
    .join('');
}

async function fetchPathDetail(pathId) {
  try {
    var data = await apiFetch('/learning-paths/' + encodeURIComponent(pathId), {
      signal: AbortSignal.timeout(8000),
    });
    if (data && data.path) return data.path;
  } catch (_e) {
    console.warn('[lernpfad] Detail fetch failed, using cached data');
  }
  return null;
}

function stepStatusLabel(done, current) {
  if (done) return '<span class="label label-success"><i class="fa fa-check"></i> Erledigt</span>';
  if (current)
    return '<span class="label label-primary"><i class="fa fa-arrow-right"></i> Nächster Schritt</span>';
  return '<span class="label label-default">Offen</span>';
}

function stepIcon(stepType) {
  var map = { page: 'fa-book', calculator: 'fa-calculator', exercise: 'fa-pencil-square-o' };
  return map[stepType] || 'fa-chevron-circle-right';
}

function renderStepHtml(step, idx, completed, pathId) {
  var done = completed > idx;
  var current = completed === idx;
  var icon = stepIcon(step.type);
  var statusClass = done ? 'step-done' : current ? 'step-current' : 'step-pending';
  var openBtn =
    step.url && !done
      ? '<a href="' +
        step.url +
        '" class="btn btn-xs btn-primary pull-right" onclick="markStepDone(\'' +
        pathId +
        "', " +
        idx +
        '); return true;"><i class="fa fa-external-link"></i> Öffnen</a>'
      : '';
  return (
    '<div class="path-step ' +
    statusClass +
    '" data-step-idx="' +
    idx +
    '">' +
    '<div class="step-marker"><i class="fa ' +
    icon +
    '"></i> ' +
    (idx + 1) +
    '</div>' +
    '<div class="step-content">' +
    '<h4>' +
    step.title +
    '</h4>' +
    '<p>' +
    (step.desc || step.description || '') +
    '</p>' +
    '<div class="step-meta">' +
    '<span class="label label-default"><i class="fa fa-clock-o"></i> ' +
    (step.mins || step.estimatedMinutes || 15) +
    ' min</span>' +
    '<span class="label label-info">' +
    step.type +
    '</span>' +
    stepStatusLabel(done, current) +
    openBtn +
    '</div></div></div>'
  );
}

async function selectPath(pathId) {
  currentPathId = pathId;
  var path = paths.find(function (p) {
    return p.id === pathId;
  });
  if (!path) return;

  var detail = await fetchPathDetail(pathId);
  if (detail) {
    var idx = paths.findIndex(function (p) {
      return p.id === pathId;
    });
    if (idx !== -1) paths[idx] = detail;
    path = detail;
  }

  var steps = path.steps || [];
  var completed = isLoggedIn ? path.userProgress || 0 : getLocalProgress(pathId);
  var labels = { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' };
  var badge = { leicht: 'success', mittel: 'warning', schwer: 'danger' };
  var diff = path.difficulty || 'mittel';

  document.getElementById('path-title').textContent = path.title;
  document.getElementById('path-meta').innerHTML =
    '<span class="label label-' +
    (badge[diff] || 'default') +
    '">' +
    (labels[diff] || diff) +
    '</span>' +
    '<span class="label label-default">~' +
    (path.estimatedHours || '?') +
    'h</span>' +
    '<span class="label label-success">' +
    completed +
    '/' +
    steps.length +
    ' Schritte</span>';

  var enrollmentHtml = '';
  if (!path.isEnrolled && isLoggedIn) {
    enrollmentHtml =
      '<button class="btn btn-primary btn-sm" onclick="enrollInPath(\'' +
      pathId +
      '\')">' +
      '<i class="fa fa-plus-circle"></i> In diesen Lernpfad einschreiben</button>';
  } else if (path.isEnrolled) {
    enrollmentHtml =
      '<span class="label label-success"><i class="fa fa-check"></i> Eingeschrieben</span>';
  }

  var detailEl = document.getElementById('path-detail');
  detailEl.innerHTML =
    '<p>' +
    (path.description || '') +
    '</p>' +
    enrollmentHtml +
    '<div class="path-steps">' +
    steps
      .map(function (step, idx) {
        return renderStepHtml(step, idx, completed, pathId);
      })
      .join('') +
    '</div>';

  updateProgressSummary();
}

async function enrollInPath(pathId) {
  try {
    var data = await apiFetch('/learning-paths/' + encodeURIComponent(pathId) + '/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10000),
    });
    if (data && data.success) {
      var path = paths.find(function (p) {
        return p.id === pathId;
      });
      if (path) path.isEnrolled = true;
      renderPathList();
      if (currentPathId === pathId) selectPath(pathId);
    }
  } catch (_e) {
    console.error('[lernpfad] Enrollment failed');
    alert('Einschreibung fehlgeschlagen. Bitte versuche es später erneut.');
  }
}

function markStepDone(pathId, stepIdx) {
  var key = 'lernpfad-' + pathId;
  var done = [];
  try {
    done = JSON.parse(localStorage.getItem(key)) || [];
  } catch (_e) {
    void 0;
  }
  if (done.indexOf(stepIdx) === -1) {
    done.push(stepIdx);
    localStorage.setItem(key, JSON.stringify(done));
  }
  if (typeof ProgressTracker !== 'undefined') {
    var path = paths.find(function (p) {
      return p.id === pathId;
    });
    var total = path && path.steps ? path.steps.length : 1;
    ProgressTracker.saveExerciseProgress('lernpfad', pathId, {
      total: total,
      correct: done.length,
      completed: true,
    });
  }
  renderPathList();
  if (currentPathId) selectPath(currentPathId);
  updateProgressSummary();
}

function getPathProgress(pathId) {
  if (isLoggedIn) {
    var p = paths.find(function (p) {
      return p.id === pathId;
    });
    return (p && p.userProgress) || 0;
  }
  return getLocalProgress(pathId);
}

function updateProgressSummary() {
  var sum = { steps: 0, done: 0 };
  paths.forEach(function (p) {
    var steps = p.steps || [];
    sum.steps += steps.length;
    sum.done += getPathProgress(p.id);
  });
  var pct = sum.steps > 0 ? Math.round((sum.done / sum.steps) * 100) : 0;
  var summary = document.getElementById('path-progress-summary');
  summary.innerHTML =
    '<div class="panel panel-success">' +
    '<div class="panel-heading"><strong><i class="fa fa-tasks"></i> Gesamtfortschritt</strong></div>' +
    '<div class="panel-body text-center">' +
    '<h2>' +
    sum.done +
    '/' +
    sum.steps +
    '</h2>' +
    '<div class="progress" style="height: 18px;">' +
    '<div class="progress-bar progress-bar-success" style="width: ' +
    pct +
    '%;">' +
    pct +
    '%</div></div>' +
    '<p class="text-muted">Schritte erledigt</p>' +
    (isLoggedIn
      ? ''
      : '<button class="btn btn-xs btn-danger" onclick="resetAllPathProgress()"><i class="fa fa-trash"></i> Zurücksetzen</button>') +
    '</div></div>';
}

function resetAllPathProgress() {
  if (!confirm('Wirklich alle Lernpfad-Fortschritte zurücksetzen?')) return;
  paths.forEach(function (p) {
    localStorage.removeItem('lernpfad-' + p.id);
  });
  renderPathList();
  if (currentPathId) selectPath(currentPathId);
  updateProgressSummary();
}

document.addEventListener('DOMContentLoaded', async function () {
  await fetchPaths();
  renderPathList();
  updateProgressSummary();
});
