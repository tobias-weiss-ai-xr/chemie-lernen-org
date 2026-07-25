/**
 * Premium Lesson Plan & Worksheet UI
 */

(function () {
  'use strict';

  var API_BASE = window.API_BASE || '';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindLessonPlan();
    bindWorksheet();
  }

  // ── Lesson Plan ────────────────────────────────────────────

  function bindLessonPlan() {
    document.getElementById('lp-generate').addEventListener('click', generateLessonPlan);
    document.getElementById('lp-print').addEventListener('click', function () {
      window.print();
    });
    document.getElementById('lp-new').addEventListener('click', function () {
      document.getElementById('lp-result').style.display = 'none';
      document.getElementById('lp-topic').focus();
    });
  }

  function generateLessonPlan() {
    var topic = document.getElementById('lp-topic').value.trim();
    if (!topic) {
      document.getElementById('lp-topic').classList.add('input-error');
      return;
    }
    document.getElementById('lp-topic').classList.remove('input-error');

    var grade = document.getElementById('lp-grade').value;
    var duration = document.getElementById('lp-duration').value;
    var difficulty = document.getElementById('lp-difficulty').value;

    show('lp-loading');
    hide('lp-error');
    hide('lp-result');

    postJson(API_BASE + '/api/premium/lesson-plan', {
      topic: topic,
      klassenstufe: grade,
      duration: duration,
      difficulty: difficulty,
    })
      .then(function (data) {
        hide('lp-loading');
        renderLessonPlan(data.lessonPlan, grade, duration, difficulty);
        show('lp-result');
      })
      .catch(function (err) {
        hide('lp-loading');
        document.getElementById('lp-error-msg').textContent = err.message || 'Fehler';
        show('lp-error');
      });
  }

  function renderLessonPlan(plan, grade, duration, difficulty) {
    document.getElementById('lp-result-title').textContent = plan.title || 'Unterrichtsplan';
    document.getElementById('lp-result-meta').innerHTML =
      'Klasse ' + grade + ' · ' + duration + ' Min. · ' + difficulty;

    // Objectives
    renderList('lp-objectives', plan.objectives);

    // Prerequisites
    if (plan.priorKnowledge && plan.priorKnowledge.length) {
      show('lp-prerequisites-section');
      renderList('lp-prerequisites', plan.priorKnowledge);
    } else {
      hide('lp-prerequisites-section');
    }

    // Materials
    renderList('lp-materials', plan.materials);

    // Phases (timeline)
    var phasesHtml = '';
    if (plan.phases && plan.phases.length) {
      plan.phases.forEach(function (phase, i) {
        phasesHtml +=
          '<div class="lp-phase">' +
          '<div class="lp-phase-header">' +
          '<span class="lp-phase-num">' +
          (i + 1) +
          '</span>' +
          '<span class="lp-phase-name">' +
          escapeHtml(phase.name || '') +
          '</span>' +
          '<span class="lp-phase-duration">' +
          escapeHtml(phase.duration || '') +
          '</span>' +
          '</div>' +
          '<div class="lp-phase-body">' +
          '<p><strong>Aktivität:</strong> ' +
          escapeHtml(phase.activity || '') +
          '</p>' +
          '<p><strong>Lehrkraft:</strong> ' +
          escapeHtml(phase.teacherAction || '') +
          '</p>' +
          '<p><strong>Schüler:</strong> ' +
          escapeHtml(phase.studentAction || '') +
          '</p>' +
          '</div>' +
          '</div>';
      });
    }
    document.getElementById('lp-phases').innerHTML = phasesHtml;

    // Assessment
    if (plan.assessment) {
      document.getElementById('lp-assessment').innerHTML =
        '<p><strong>Formativ:</strong> ' +
        escapeHtml(plan.assessment.formative || '') +
        '</p>' +
        '<p><strong>Summativ:</strong> ' +
        escapeHtml(plan.assessment.summative || '') +
        '</p>' +
        (plan.homework
          ? '<p><strong>Hausaufgabe:</strong> ' + escapeHtml(plan.homework) + '</p>'
          : '');
    }

    // Differentiation
    if (plan.differentiation) {
      document.getElementById('lp-differentiation').innerHTML =
        '<p><strong>Stärkere Schüler:</strong> ' +
        escapeHtml(plan.differentiation.stronger || '') +
        '</p>' +
        '<p><strong>Schwächere Schüler:</strong> ' +
        escapeHtml(plan.differentiation.weaker || '') +
        '</p>';
    }

    // Tips
    if (plan.tips) {
      show('lp-tips-section');
      document.getElementById('lp-tips').textContent = plan.tips;
    } else {
      hide('lp-tips-section');
    }
  }

  // ── Worksheet ─────────────────────────────────────────────

  function bindWorksheet() {
    document.getElementById('ws-generate').addEventListener('click', generateWorksheet);
    document.getElementById('ws-print').addEventListener('click', function () {
      window.print();
    });
  }

  function generateWorksheet() {
    var topic = document.getElementById('ws-topic').value.trim();
    if (!topic) {
      document.getElementById('ws-topic').classList.add('input-error');
      return;
    }
    document.getElementById('ws-topic').classList.remove('input-error');

    var count = document.getElementById('ws-count').value;
    var types = [];
    document.querySelectorAll('.checkbox-group input:checked').forEach(function (cb) {
      types.push(cb.value);
    });
    if (types.length === 0) types = ['multiple-choice', 'berechnung'];

    show('ws-loading');
    hide('ws-error');
    hide('ws-result');

    postJson(API_BASE + '/api/premium/worksheet', {
      topic: topic,
      exerciseCount: count,
      types: types,
    })
      .then(function (data) {
        hide('ws-loading');
        renderWorksheet(data.exercises, data.topic);
        show('ws-result');
      })
      .catch(function (err) {
        hide('ws-loading');
        document.getElementById('ws-error-msg').textContent = err.message || 'Fehler';
        show('ws-error');
      });
  }

  function renderWorksheet(exercises, topic) {
    document.getElementById('ws-result-title').textContent = 'Arbeitsblatt: ' + topic;
    var html = '';
    exercises.forEach(function (ex, i) {
      html += '<div class="ws-exercise">';
      html +=
        '<div class="ws-exercise-num">Aufgabe ' +
        (i + 1) +
        ' <span class="ws-type-badge">' +
        (ex.type || '') +
        '</span></div>';

      if (ex.type === 'multiple-choice') {
        html += '<p class="ws-question">' + escapeHtml(ex.question) + '</p>';
        html += '<div class="ws-options">';
        (ex.options || []).forEach(function (opt, j) {
          html +=
            '<div class="ws-option"><span class="ws-option-letter">' +
            String.fromCharCode(65 + j) +
            ')</span> ' +
            escapeHtml(opt) +
            '</div>';
        });
        html += '</div>';
      } else if (ex.type === 'lueckentext') {
        var text = escapeHtml(ex.text || '').replace(
          /_{2,}/g,
          '<span class="ws-blank">________</span>'
        );
        html += '<p>' + text + '</p>';
      } else if (ex.type === 'berechnung') {
        html += '<p class="ws-question">' + escapeHtml(ex.question) + '</p>';
        if (ex.givenValues) {
          html += '<div class="ws-given">';
          for (var key in ex.givenValues) {
            html +=
              '<span class="ws-given-item"><strong>' +
              escapeHtml(key) +
              ':</strong> ' +
              escapeHtml(ex.givenValues[key]) +
              '</span>';
          }
          html += '</div>';
        }
        if (ex.formula)
          html += '<p class="ws-formula"><em>Formel: ' + escapeHtml(ex.formula) + '</em></p>';
      } else {
        html += '<p class="ws-question">' + escapeHtml(ex.question) + '</p>';
      }

      html += '</div>';
    });

    html +=
      '<div class="ws-footer"><em>Erstellt von chemie-lernen.org Premium · ' +
      new Date().toLocaleDateString('de-DE') +
      '</em></div>';
    document.getElementById('ws-exercises').innerHTML = html;
  }

  // ── Helpers ──────────────────────────────────────────────────

  function show(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = '';
  }
  function hide(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
  function renderList(id, items) {
    if (!items || !items.length) return;
    document.getElementById(id).innerHTML = items
      .map(function (item) {
        return '<li>' + escapeHtml(item) + '</li>';
      })
      .join('');
  }

  function postJson(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
        return data;
      });
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }
})();
