/**
 * Aufgabensammlung
 * Searchable, filterable exercise database
 */

(function () {
  'use strict';

  var taskDatabase = [];

  var filters = {
    search: '',
    theme: 'all',
    difficulty: 'all',
    type: 'all'
  };

  function generateTaskDatabase() {
    var tasks = [];

    var stoichiometryTasks = [
      { id: 's1', text: 'Berechnen Sie die Masse von 3 mol Wasser (H2O).', theme: 'stoichiometry', difficulty: '1', type: 'calculation', answer: '54.045 g' },
      { id: 's2', text: 'Wie viel mol CO2 sind in 88 g enthalten? (M = 44.01 g/mol)', theme: 'stoichiometry', difficulty: '1', type: 'calculation', answer: '2 mol' },
      { id: 's3', text: '5 g Wasserstoff (H2) reagieren mit Sauerstoff. Welche Masse an Wasser entsteht?', theme: 'stoichiometry', difficulty: '2', type: 'calculation', answer: '44.6 g' },
      { id: 's4', text: 'Wie viel Gramm wiegen 0.5 mol Schwefelsäure (H2SO4, M = 98.09 g/mol)?', theme: 'stoichiometry', difficulty: '1', type: 'calculation', answer: '49.045 g' },
      { id: 's5', text: 'Ein Experiment benötigt 0.25 mol NaCl. Wie viel Gramm sind das? (M = 58.44 g/mol)', theme: 'stoichiometry', difficulty: '1', type: 'calculation', answer: '14.61 g' }
    ];

    var balancingTasks = [
      { id: 'b1', text: 'Gleichen Sie aus: H2 + O2 → H2O', theme: 'balancing', difficulty: '1', type: 'equation', answer: '2 H2 + O2 → 2 H2O' },
      { id: 'b2', text: 'Gleichen Sie aus: Fe + O2 → Fe2O3', theme: 'balancing', difficulty: '2', type: 'equation', answer: '4 Fe + 3 O2 → 2 Fe2O3' },
      { id: 'b3', text: 'Gleichen Sie aus: N2 + H2 → NH3', theme: 'balancing', difficulty: '1', type: 'equation', answer: 'N2 + 3 H2 → 2 NH3' },
      { id: 'b4', text: 'Gleichen Sie aus: CH4 + O2 → CO2 + H2O', theme: 'balancing', difficulty: '2', type: 'equation', answer: 'CH4 + 2 O2 → CO2 + 2 H2O' },
      { id: 'b5', text: 'Gleichen Sie aus: Zn + HCl → ZnCl2 + H2', theme: 'balancing', difficulty: '2', type: 'equation', answer: 'Zn + 2 HCl → ZnCl2 + H2' },
      { id: 'b6', text: 'Gleichen Sie aus: Mg + O2 → MgO', theme: 'balancing', difficulty: '1', type: 'equation', answer: '2 Mg + O2 → 2 MgO' }
    ];

    var molarMassTasks = [
      { id: 'm1', text: 'Berechnen Sie die molare Masse von H2SO4.', theme: 'molar-mass', difficulty: '1', type: 'calculation', answer: '98.09 g/mol' },
      { id: 'm2', text: 'Berechnen Sie die molare Masse von Glucose (C6H12O6).', theme: 'molar-mass', difficulty: '1', type: 'calculation', answer: '180.16 g/mol' },
      { id: 'm3', text: 'Welche molare Masse hat CaCO3?', theme: 'molar-mass', difficulty: '1', type: 'calculation', answer: '100.09 g/mol' },
      { id: 'm4', text: 'Berechnen Sie die molare Masse von Ethanol (C2H5OH).', theme: 'molar-mass', difficulty: '1', type: 'calculation', answer: '46.07 g/mol' },
      { id: 'm5', text: 'Vergleichen Sie die molaren Massen von NH3 und HNO3.', theme: 'molar-mass', difficulty: '2', type: 'calculation', answer: 'NH3: 17.03 g/mol, HNO3: 63.01 g/mol' }
    ];

    var phTasks = [
      { id: 'p1', text: 'Berechnen Sie den pH-Wert einer 10 mM Salzsäure (stark).', theme: 'ph', difficulty: '1', type: 'calculation', answer: '2.0' },
      { id: 'p2', text: 'Welchen pH hat eine 50 mM Essigsäure? (pKa = 4.76)', theme: 'ph', difficulty: '2', type: 'calculation', answer: '2.98' },
      { id: 'p3', text: 'Berechnen Sie den pH einer 0.1 M NaOH-Lösung.', theme: 'ph', difficulty: '1', type: 'calculation', answer: '13.0' },
      { id: 'p4', text: 'Eine Lösung hat pH = 3. Wie hoch ist die H+-Konzentration?', theme: 'ph', difficulty: '1', type: 'calculation', answer: '1 × 10⁻³ mol/L' },
      { id: 'p5', text: 'Berechnen Sie den pH einer 25 mM Ameisensäure (pKa = 3.75).', theme: 'ph', difficulty: '2', type: 'calculation', answer: '2.57' }
    ];

    var redoxTasks = [
      { id: 'r1', text: 'Berechnen Sie die Zellspannung: Zn/Zn2+ (E0=-0.76 V) und Cu/Cu2+ (E0=0.34 V).', theme: 'redox', difficulty: '1', type: 'calculation', answer: '1.10 V' },
      { id: 'r2', text: 'Welche Spannung liefert ein Ag/Ag+ (E0=0.80 V) und Mg/Mg2+ (E0=-2.37 V) Element?', theme: 'redox', difficulty: '1', type: 'calculation', answer: '3.17 V' },
      { id: 'r3', text: 'Ist die Reaktion Fe2+ + Zn → Fe + Zn2+ spontan? (E0(Fe2+/Fe)=-0.44 V, E0(Zn2+/Zn)=-0.76 V)', theme: 'redox', difficulty: '2', type: 'calculation', answer: 'Ja, ΔE0 = 0.32 V > 0' },
      { id: 'r4', text: 'Bestimmen Sie Oxidationszahlen: KMnO4', theme: 'redox', difficulty: '2', type: 'calculation', answer: 'K: +1, Mn: +7, O: -2' },
      { id: 'r5', text: 'Welches Element wird oxidiert? 2 Mg + O2 → 2 MgO', theme: 'redox', difficulty: '1', type: 'calculation', answer: 'Mg (0 → +2)' }
    ];

    tasks = tasks.concat(stoichiometryTasks);
    tasks = tasks.concat(balancingTasks);
    tasks = tasks.concat(molarMassTasks);
    tasks = tasks.concat(phTasks);
    tasks = tasks.concat(redoxTasks);

    return tasks;
  }

  function filterTasks() {
    return taskDatabase.filter(function (task) {
      var matchesSearch = filters.search === '' ||
        task.text.toLowerCase().indexOf(filters.search) !== -1 ||
        task.answer.toLowerCase().indexOf(filters.search) !== -1;

      var matchesTheme = filters.theme === 'all' || task.theme === filters.theme;
      var matchesDifficulty = filters.difficulty === 'all' || task.difficulty === filters.difficulty;
      var matchesType = filters.type === 'all' || task.type === filters.type;

      return matchesSearch && matchesTheme && matchesDifficulty && matchesType;
    });
  }

  function renderTaskList() {
    var results = filterTasks();
    var container = document.getElementById('task-list');
    var countEl = document.getElementById('result-count');

    var themeNames = {
      'stoichiometry': 'Stöchiometrie',
      'balancing': 'Reaktionsgleichungen',
      'molar-mass': 'Molare Massen',
      'ph': 'pH-Berechnungen',
      'redox': 'Redox-Gleichungen'
    };

    var difficultyNames = { '1': 'Leicht', '2': 'Mittel', '3': 'Schwer' };
    var typeNames = { 'calculation': 'Rechnung', 'equation': 'Gleichung', 'multiple-choice': 'Multiple Choice' };

    countEl.textContent = results.length + ' Aufgaben gefunden';

    if (results.length === 0) {
      container.innerHTML = '<div class="alert alert-info">Keine Aufgaben gefunden. Versuchen Sie andere Filter.</div>';
      return;
    }

    var html = '';
    results.forEach(function (task) {
      html += '<div class="task-card">';
      html += '  <div class="task-meta">';
      html += '    <span class="badge badge-theme" data-theme="' + task.theme + '">' + themeNames[task.theme] + '</span>';
      html += '    <span class="badge badge-difficulty" data-difficulty="' + task.difficulty + '">' + difficultyNames[task.difficulty] + '</span>';
      html += '    <span class="badge badge-type" data-type="' + task.type + '">' + typeNames[task.type] + '</span>';
      html += '  </div>';
      html += '  <p class="task-text">' + task.text + '</p>';
      html += '  <div class="task-answer" style="display:none;">';
      html += '    <p><strong>Lösung:</strong> ' + task.answer + '</p>';
      html += '  </div>';
      html += '  <button class="btn btn-sm btn-default toggle-answer">Lösung anzeigen</button>';
      html += '</div>';
    });

    container.innerHTML = html;

    container.querySelectorAll('.toggle-answer').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var answerDiv = this.previousElementSibling;
        if (answerDiv.style.display === 'none') {
          answerDiv.style.display = 'block';
          this.textContent = 'Lösung verbergen';
        } else {
          answerDiv.style.display = 'none';
          this.textContent = 'Lösung anzeigen';
        }
      });
    });
  }

  function init() {
    taskDatabase = generateTaskDatabase();

    var searchInput = document.getElementById('task-search');
    var themeFilter = document.getElementById('filter-theme');
    var diffFilter = document.getElementById('filter-difficulty');
    var typeFilter = document.getElementById('filter-type');

    function updateFilters() {
      filters.search = searchInput.value.toLowerCase().trim();
      filters.theme = themeFilter.value;
      filters.difficulty = diffFilter.value;
      filters.type = typeFilter.value;
      renderTaskList();
    }

    searchInput.addEventListener('input', updateFilters);
    themeFilter.addEventListener('change', updateFilters);
    diffFilter.addEventListener('change', updateFilters);
    typeFilter.addEventListener('change', updateFilters);

    renderTaskList();
  }

  if (document.getElementById('task-search')) {
    init();
  }

})();
