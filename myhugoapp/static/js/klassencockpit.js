/**
 * Klassencockpit
 * Teacher dashboard tracking student progress across modules
 */

(function () {
  'use strict';

  var students = [];

  // --- LocalStorage for student data ---

  function loadStudents() {
    try {
      var data = localStorage.getItem('klassencockpit_students');
      students = data ? JSON.parse(data) : [];
    } catch (_e) {
      students = [];
    }
  }

  function saveStudents() {
    try {
      localStorage.setItem('klassencockpit_students', JSON.stringify(students));
    } catch (_e) {
      console.warn('Could not save student data');
    }
  }

  function getCompletedModules() {
    try {
      var data = localStorage.getItem('progress_completed');
      return data ? JSON.parse(data) : {};
    } catch (_e) {
      return {};
    }
  }

  function getScores() {
    try {
      var data = localStorage.getItem('progress_scores');
      return data ? JSON.parse(data) : [];
    } catch (_e) {
      return [];
    }
  }

  function _getStreak() {
    try {
      return parseInt(localStorage.getItem('progress_streak') || '0', 10);
    } catch (_e) {
      return 0;
    }
  }

  // --- Student CRUD ---

  function addStudent(name) {
    var trimmed = name.trim();
    if (!trimmed) return false;

    var exists = students.some(function (s) {
      return s.name.toLowerCase() === trimmed.toLowerCase();
    });
    if (exists) return false;

    students.push({
      id: Date.now().toString(36),
      name: trimmed,
      created: new Date().toISOString()
    });
    saveStudents();
    return true;
  }

  function removeStudent(id) {
    students = students.filter(function (s) { return s.id !== id; });
    saveStudents();
  }

  // --- Rendering ---

  function renderStudentList() {
    var container = document.getElementById('student-list');
    if (!container) return;

    if (students.length === 0) {
      container.innerHTML = '<p class="text-muted">Noch keine Schüler angelegt. Fügen Sie den ersten Schüler hinzu.</p>';
      return;
    }

    var html = '<table class="table table-hover"><thead><tr><th>Name</th><th>Erstellt</th><th>Aktionen</th></tr></thead><tbody>';
    students.forEach(function (s) {
      html += '<tr>';
      html += '  <td><strong>' + escapeHtml(s.name) + '</strong></td>';
      html += '  <td>' + new Date(s.created).toLocaleDateString('de-DE') + '</td>';
      html += '  <td>';
      html += '    <button class="btn btn-xs btn-danger remove-student" data-id="' + s.id + '"><i class="fa fa-trash"></i></button>';
      html += '  </td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;

    container.querySelectorAll('.remove-student').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (confirm('Schüler entfernen?')) {
          removeStudent(this.getAttribute('data-id'));
          renderAll();
        }
      });
    });
  }

  function renderStats() {
    var statStudents = document.getElementById('stat-students');
    var statTasks = document.getElementById('stat-tasks');
    var statAverage = document.getElementById('stat-average');
    if (!statStudents) return;

    statStudents.textContent = students.length;

    var scores = getScores();
    statTasks.textContent = scores.length;

    if (scores.length > 0) {
      var total = scores.reduce(function (sum, s) { return sum + (s.correct || 0); }, 0);
      var overall = scores.reduce(function (sum, s) { return sum + (s.total || 0); }, 0);
      var avg = overall > 0 ? Math.round((total / overall) * 100) : 0;
      statAverage.textContent = avg + '%';
    } else {
      statAverage.textContent = '0%';
    }
  }

  function renderClassProgress() {
    var container = document.getElementById('class-progress-table');
    if (!container) return;

    var completed = getCompletedModules();
    var _moduleKeys = Object.keys(completed);
    var moduleNames = {
      'uebungsgenerator': 'Übungsgenerator',
      'lueckentexte': 'Lückentexte',
      'lernpfad': 'Lernpfad'
    };

    if (students.length === 0) {
      container.innerHTML = '<p class="text-muted">Keine Daten vorhanden.</p>';
      return;
    }

    var html = '<div class="table-responsive"><table class="table table-striped"><thead><tr><th>Schüler</th>';
    Object.keys(moduleNames).forEach(function (key) {
      html += '<th>' + moduleNames[key] + '</th>';
    });
    html += '<th>Gesamt</th></tr></thead><tbody>';

    students.forEach(function (s) {
      html += '<tr><td>' + escapeHtml(s.name) + '</td>';
      var studentTotal = 0;
      Object.keys(moduleNames).forEach(function (key) {
        var done = completed[s.id + '_' + key] || false;
        html += '<td>' + (done ? '<span class="text-success"><i class="fa fa-check"></i></span>' : '<span class="text-muted"><i class="fa fa-minus"></i></span>') + '</td>';
        if (done) studentTotal++;
      });
      html += '<td>' + studentTotal + '/' + Object.keys(moduleNames).length + '</td></tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  function renderStudentDetail() {
    var select = document.getElementById('detail-student-select');
    var container = document.getElementById('student-detail');
    if (!select || !container) return;

    select.innerHTML = '<option value="">Bitte wählen</option>';
    students.forEach(function (s) {
      select.innerHTML += '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>';
    });

    select.addEventListener('change', function () {
      var id = this.value;
      if (!id) {
        container.innerHTML = '<p class="text-muted">Wählen Sie einen Schüler aus.</p>';
        return;
      }

      var student = students.filter(function (s) { return s.id === id; })[0];
      if (!student) {
        container.innerHTML = '<p class="text-muted">Schüler nicht gefunden.</p>';
        return;
      }

      var completed = getCompletedModules();
      var scores = getScores();
      var studentScores = scores.filter(function (s) { return s.studentId === id; });

      var correct = studentScores.reduce(function (sum, s) { return sum + (s.correct || 0); }, 0);
      var total = studentScores.reduce(function (sum, s) { return sum + (s.total || 0); }, 0);
      var pct = total > 0 ? Math.round((correct / total) * 100) : 0;

      var html = '<div class="student-detail-card">';
      html += '  <h4>' + escapeHtml(student.name) + '</h4>';
      html += '  <p><strong>Richtige Antworten:</strong> ' + correct + '/' + total + ' (' + pct + '%)</p>';
      html += '  <p><strong>Erledigte Module:</strong> ' + Object.keys(completed).filter(function (k) { return completed[k] && k.indexOf(id) !== -1; }).length + '</p>';

      if (studentScores.length > 0) {
        html += '  <h5>Letzte Aktivitäten</h5>';
        html += '  <ul>';
        studentScores.slice(-5).reverse().forEach(function (s) {
          html += '    <li>' + (s.topic || 'Unbekannt') + ': ' + s.correct + '/' + s.total + ' richtig</li>';
        });
        html += '  </ul>';
      }

      html += '</div>';
      container.innerHTML = html;
    });
  }

  // --- Export ---

  function exportCSV() {
    var scores = getScores();
    if (students.length === 0 && scores.length === 0) {
      showToast('Keine Daten zum Exportieren vorhanden.', 'error');
      return;
    }

    var lines = ['Schüler;Modul;Thema;Richtig;Gesamt;Datum'];
    students.forEach(function (s) {
      var studentScores = scores.filter(function (sc) { return sc.studentId === s.id; });
      studentScores.forEach(function (sc) {
        lines.push(s.name + ';' + (sc.module || '') + ';' + (sc.topic || '') + ';' + (sc.correct || 0) + ';' + (sc.total || 0) + ';' + (sc.date || ''));
      });
    });

    if (lines.length === 1) {
      lines.push('Keine Scores vorhanden');
    }

    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'klassencockpit-export-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function resetAllData() {
    if (!confirm('Alle Klassencockpit-Daten wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) return;
    if (!confirm('Sind Sie sicher?')) return;
    students = [];
    saveStudents();
    renderAll();
  }

  // --- Utilities ---

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderAll() {
    renderStudentList();
    renderStats();
    renderClassProgress();
    renderStudentDetail();
  }

  // --- Init ---

  function init() {
    loadStudents();

    var addBtn = document.getElementById('add-student-btn');
    var nameInput = document.getElementById('student-name-input');
    var exportBtn = document.getElementById('export-data-btn');
    var resetBtn = document.getElementById('reset-data-btn');

    if (addBtn && nameInput) {
      addBtn.addEventListener('click', function () {
        if (addStudent(nameInput.value)) {
          nameInput.value = '';
          renderAll();
        } else {
          showToast('Name ungültig oder bereits vorhanden.', 'error');
        }
      });

      nameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') addBtn.click();
      });
    }

    if (exportBtn) exportBtn.addEventListener('click', exportCSV);
    if (resetBtn) resetBtn.addEventListener('click', resetAllData);

    renderAll();
  }

  if (document.getElementById('add-student-btn')) {
    init();
  }

})();
