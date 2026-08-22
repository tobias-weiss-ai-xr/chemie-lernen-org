/**
 * Arbeitsblatt-Generator
 * Creates printable chemistry worksheets with configurable parameters
 */

(function () {
  'use strict';

  var state = {
    theme: 'mixed',
    difficulty: 2,
    count: 10,
    type: 'mixed',
    solution: 'separate',
    problems: [],
    solutions: [],
  };

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function roundTo(v, decimals) {
    var f = Math.pow(10, decimals);
    return Math.round(v * f) / f;
  }

  // --- Problem Generators ---

  function genStoichiometry(diff) {
    var elements = [
      { name: 'Wasserstoff', symbol: 'H2', mass: 2.016 },
      { name: 'Sauerstoff', symbol: 'O2', mass: 32.0 },
      { name: 'Kohlenstoffdioxid', symbol: 'CO2', mass: 44.01 },
      { name: 'Wasser', symbol: 'H2O', mass: 18.015 },
      { name: 'Methan', symbol: 'CH4', mass: 16.04 },
      { name: 'Ammoniak', symbol: 'NH3', mass: 17.03 },
      { name: 'Schwefelsäure', symbol: 'H2SO4', mass: 98.09 },
      { name: 'Natriumchlorid', symbol: 'NaCl', mass: 58.44 },
      { name: 'Ethanol', symbol: 'C2H5OH', mass: 46.07 },
      { name: 'Calciumcarbonat', symbol: 'CaCO3', mass: 100.09 },
    ];

    var sub = pick(elements);
    var moles, mass;

    if (diff === 1) {
      moles = rand(1, 5);
      mass = roundTo(moles * sub.mass, 2);
      return {
        question:
          'Berechnen Sie die Masse von ' + moles + ' mol ' + sub.name + ' (' + sub.symbol + ').',
        answer: mass + ' g',
        steps: 'm = n × M = ' + moles + ' mol × ' + sub.mass + ' g/mol = ' + mass + ' g',
      };
    } else if (diff === 2) {
      mass = rand(10, 100);
      moles = roundTo(mass / sub.mass, 3);
      return {
        question:
          'Wie viel mol ' + sub.name + ' (' + sub.symbol + ') sind in ' + mass + ' g enthalten?',
        answer: moles + ' mol',
        steps: 'n = m / M = ' + mass + ' g / ' + sub.mass + ' g/mol = ' + moles + ' mol',
      };
    } else {
      var sub2 = pick(
        elements.filter(function (e) {
          return e.symbol !== sub.symbol;
        })
      );
      var massGiven = rand(5, 50);
      var molesGiven = roundTo(massGiven / sub.mass, 3);
      var ratio = roundTo(rand(1, 4) / rand(1, 4), 2);
      var mass2 = roundTo(molesGiven * ratio * sub2.mass, 2);
      return {
        question:
          massGiven +
          ' g ' +
          sub.name +
          ' (' +
          sub.symbol +
          ') reagieren im Verhältnis 1:' +
          ratio +
          ' mit ' +
          sub2.name +
          ' (' +
          sub2.symbol +
          '). Welche Masse an ' +
          sub2.name +
          ' wird benötigt?',
        answer: mass2 + ' g',
        steps:
          'n(' +
          sub.symbol +
          ') = ' +
          massGiven +
          ' g / ' +
          sub.mass +
          ' g/mol = ' +
          molesGiven +
          ' mol\nn(' +
          sub2.symbol +
          ') = ' +
          molesGiven +
          ' × ' +
          ratio +
          ' = ' +
          roundTo(molesGiven * ratio, 3) +
          ' mol\nm(' +
          sub2.symbol +
          ') = ' +
          roundTo(molesGiven * ratio, 3) +
          ' × ' +
          sub2.mass +
          ' g/mol = ' +
          mass2 +
          ' g',
      };
    }
  }

  function genBalancing(_diff) {
    var equations = [
      { left: 'H2 + O2', right: 'H2O', balanced: '2 H2 + O2 -> 2 H2O' },
      { left: 'Fe + O2', right: 'Fe2O3', balanced: '4 Fe + 3 O2 -> 2 Fe2O3' },
      { left: 'N2 + H2', right: 'NH3', balanced: 'N2 + 3 H2 -> 2 NH3' },
      { left: 'CH4 + O2', right: 'CO2 + H2O', balanced: 'CH4 + 2 O2 -> CO2 + 2 H2O' },
      { left: 'Na + Cl2', right: 'NaCl', balanced: '2 Na + Cl2 -> 2 NaCl' },
      { left: 'Mg + O2', right: 'MgO', balanced: '2 Mg + O2 -> 2 MgO' },
      { left: 'C + O2', right: 'CO2', balanced: 'C + O2 -> CO2' },
      { left: 'Zn + HCl', right: 'ZnCl2 + H2', balanced: 'Zn + 2 HCl -> ZnCl2 + H2' },
    ];

    var eq = pick(equations);
    return {
      question: 'Gleichen Sie folgende Reaktionsgleichung aus:\n' + eq.left + ' → ' + eq.right,
      answer: eq.balanced,
      steps: 'Ausgeglichene Gleichung: ' + eq.balanced,
    };
  }

  function genMolarMass(_diff) {
    var compounds = [
      { formula: 'H2O', name: 'Wasser', mass: 18.015 },
      { formula: 'CO2', name: 'Kohlenstoffdioxid', mass: 44.01 },
      { formula: 'NaOH', name: 'Natronlauge', mass: 40.0 },
      { formula: 'H2SO4', name: 'Schwefelsäure', mass: 98.09 },
      { formula: 'NaCl', name: 'Natriumchlorid', mass: 58.44 },
      { formula: 'C6H12O6', name: 'Glucose', mass: 180.16 },
      { formula: 'NH3', name: 'Ammoniak', mass: 17.03 },
      { formula: 'CaCO3', name: 'Calciumcarbonat', mass: 100.09 },
      { formula: 'C2H5OH', name: 'Ethanol', mass: 46.07 },
      { formula: 'HNO3', name: 'Salpetersäure', mass: 63.01 },
    ];

    var c = pick(compounds);
    return {
      question: 'Berechnen Sie die molare Masse von ' + c.name + ' (' + c.formula + ').',
      answer: c.mass + ' g/mol',
      steps: 'M(' + c.formula + ') = ' + c.mass + ' g/mol',
    };
  }

  function genPh(diff) {
    var acids = [
      { name: 'Salzsäure', pka: -6.3, strong: true },
      { name: 'Essigsäure', pka: 4.76, strong: false },
      { name: 'Ameisensäure', pka: 3.75, strong: false },
      { name: 'Schwefelsäure', pka: -3.0, strong: true },
      { name: 'Kohlensäure', pka: 6.35, strong: false },
      { name: 'Milchsäure', pka: 3.86, strong: false },
    ];

    var acid = pick(acids);
    var conc, phValue;

    if (diff <= 2) {
      conc = rand(1, 100);
      if (acid.strong) {
        phValue = roundTo(-Math.log10(conc / 1000), 2);
      } else {
        phValue = roundTo(0.5 * acid.pka - 0.5 * Math.log10(conc / 1000), 2);
      }
      return {
        question:
          'Berechnen Sie den pH-Wert einer ' +
          conc +
          ' mM ' +
          acid.name +
          ' (pKa = ' +
          acid.pka +
          ').',
        answer: phValue + '',
        steps: acid.strong
          ? 'pH = -log[H+] = -log(' + conc / 1000 + ') = ' + phValue
          : 'pH = 0.5 × pKa - 0.5 × log(c) = 0.5 × ' +
            acid.pka +
            ' - 0.5 × log(' +
            conc / 1000 +
            ') = ' +
            phValue,
      };
    } else {
      conc = rand(1, 100);
      if (acid.strong) {
        phValue = roundTo(14 + Math.log10(conc / 1000), 2);
      } else {
        var pkb = 14 - acid.pka;
        var oh = roundTo(Math.sqrt(Math.pow(10, -pkb) * (conc / 1000)), 4);
        phValue = roundTo(14 + Math.log10(oh), 2);
      }
      return {
        question:
          'Berechnen Sie den pH-Wert einer ' +
          conc +
          ' mM Lösung der Base ' +
          acid.name +
          ' (pKa = ' +
          acid.pka +
          ').',
        answer: phValue + '',
        steps: 'pOH = 14 - pH → pH = ' + phValue,
      };
    }
  }

  function genRedox(_diff) {
    var redoxPairs = [
      { ox: 'Fe2+', red: 'Fe3+', e0: 0.77, name: 'Eisen(II)/Eisen(III)' },
      { ox: 'Zn', red: 'Zn2+', e0: -0.76, name: 'Zink/Zink(II)' },
      { ox: 'Cu', red: 'Cu2+', e0: 0.34, name: 'Kupfer/Kupfer(II)' },
      { ox: 'Mg', red: 'Mg2+', e0: -2.37, name: 'Magnesium/Magnesium(II)' },
      { ox: 'Ag', red: 'Ag+', e0: 0.8, name: 'Silber/Silber(I)' },
    ];

    var pair1 = pick(redoxPairs);
    var pair2 = pick(
      redoxPairs.filter(function (p) {
        return p.ox !== pair1.ox;
      })
    );
    var cellVoltage = roundTo(Math.abs(pair1.e0 - pair2.e0), 2);

    return {
      question:
        'Berechnen Sie die Zellspannung eines galvanischen Elements aus ' +
        pair1.name +
        ' (E°=' +
        pair1.e0 +
        ' V) und ' +
        pair2.name +
        ' (E°=' +
        pair2.e0 +
        ' V).',
      answer: cellVoltage + ' V',
      steps:
        'ΔE° = |E°(Kathode) - E°(Anode)| = |' +
        Math.max(pair1.e0, pair2.e0) +
        ' - ' +
        Math.min(pair1.e0, pair2.e0) +
        '| = ' +
        cellVoltage +
        ' V',
    };
  }

  function genMixed(diff) {
    var gens = [genStoichiometry, genBalancing, genMolarMass, genPh, genRedox];
    return pick(gens)(diff);
  }

  // --- Generator Selection ---

  function generateProblem(theme, difficulty) {
    switch (theme) {
      case 'stoichiometry':
        return genStoichiometry(difficulty);
      case 'balancing':
        return genBalancing(difficulty);
      case 'molar-mass':
        return genMolarMass(difficulty);
      case 'ph':
        return genPh(difficulty);
      case 'redox':
        return genRedox(difficulty);
      default:
        return genMixed(difficulty);
    }
  }

  // --- Worksheet Generation ---

  function generateWorksheet() {
    state.theme = document.getElementById('ws-theme').value;
    state.difficulty = parseInt(document.getElementById('ws-difficulty').value, 10);
    state.count = parseInt(document.getElementById('ws-count').value, 10);
    state.type = document.getElementById('ws-type').value;
    state.solution = document.getElementById('ws-solution').value;

    state.problems = [];
    state.solutions = [];

    for (var i = 0; i < state.count; i++) {
      var p = generateProblem(state.theme, state.difficulty);
      state.problems.push({
        number: i + 1,
        question: p.question,
        answer: p.answer,
        steps: p.steps,
      });
      state.solutions.push({
        number: i + 1,
        answer: p.answer,
        steps: p.steps,
      });
    }

    renderWorksheet();
    renderSolutions();
  }

  function renderWorksheet() {
    var container = document.getElementById('ws-preview');
    var problemsDiv = document.getElementById('ws-problems');
    var titleEl = document.getElementById('ws-title');
    var metaEl = document.getElementById('ws-meta');

    var themeNames = {
      stoichiometry: 'Stöchiometrie',
      balancing: 'Reaktionsgleichungen',
      'molar-mass': 'Molare Massen',
      ph: 'pH-Berechnungen',
      redox: 'Redox-Gleichungen',
      mixed: 'Gemischt',
    };

    var diffNames = { 1: 'Leicht', 2: 'Mittel', 3: 'Schwer' };

    titleEl.textContent = 'Arbeitsblatt: ' + themeNames[state.theme];
    metaEl.textContent =
      'Schwierigkeit: ' + diffNames[state.difficulty] + ' | ' + state.count + ' Aufgaben';

    var html = '';
    state.problems.forEach(function (prob) {
      html += '<div class="ws-problem">';
      html += '  <h4>Aufgabe ' + prob.number + '</h4>';
      html += '  <p class="ws-question">' + prob.question.replace(/\n/g, '<br>') + '</p>';
      html += '  <div class="ws-answer-space"></div>';
      html += '</div>';
    });

    problemsDiv.innerHTML = html;
    container.style.display = 'block';

    if (state.solution === 'separate' || state.solution === 'inline') {
      renderSolutions();
    }

    document.getElementById('print-ws-btn').style.display = 'inline-block';
  }

  function renderSolutions() {
    var container = document.getElementById('ws-solutions');
    var answerKey = document.getElementById('ws-answer-key');

    if (state.solution === 'none') {
      container.style.display = 'none';
      return;
    }

    var html = '';
    state.solutions.forEach(function (sol) {
      html += '<div class="ws-solution">';
      html += '  <h4>Lösung ' + sol.number + '</h4>';
      html += '  <p><strong>Antwort:</strong> ' + sol.answer + '</p>';
      if (state.solution === 'separate') {
        html +=
          '  <p class="ws-steps"><strong>Rechenweg:</strong><br>' +
          sol.steps.replace(/\n/g, '<br>') +
          '</p>';
      }
      html += '</div>';
    });

    answerKey.innerHTML = html;
    container.style.display = 'block';
  }

  // --- Print Branding ---

  function addPrintBranding() {
    var existing = document.getElementById('ws-print-branding');
    if (existing) return;

    var branding = document.createElement('div');
    branding.id = 'ws-print-branding';
    branding.innerHTML = [
      '<div class="ws-print-header">',
      '  <div class="ws-print-header-left">',
      '    <img src="/img/chemie-lernen-logo_dark.webp" alt="chemie-lernen.org" class="ws-print-logo" height="40">',
      '  </div>',
      '  <div class="ws-print-header-center">',
      '    <div class="ws-print-site-name">chemie-lernen.org</div>',
      '    <div class="ws-print-subtitle">Chemie interaktiv lernen und ueben</div>',
      '  </div>',
      '  <div class="ws-print-header-right">',
      '    <div class="ws-print-date" id="ws-print-date"></div>',
      '  </div>',
      '</div>',
      '<div class="ws-print-footer">',
      '  <div class="ws-print-footer-left">chemie-lernen.org - Arbeitsblatt-Generator</div>',
      '  <div class="ws-print-footer-right">Seite <span class="ws-page-number"></span></div>',
      '</div>',
      '<div class="ws-print-watermark">chemie-lernen.org</div>',
    ].join('\n');

    document.getElementById('ws-print-date').textContent = new Date().toLocaleDateString('de-DE');
    document.body.appendChild(branding);
  }

  function removePrintBranding() {
    var branding = document.getElementById('ws-print-branding');
    if (branding) {
      branding.parentNode.removeChild(branding);
    }
  }
  // --- Init ---

  function init() {
    document.getElementById('generate-ws-btn').addEventListener('click', generateWorksheet);

    document.getElementById('print-ws-btn').addEventListener('click', function () {
      addPrintBranding();
      setTimeout(function () {
        window.print();
      }, 100);
    });

    if (window.matchMedia) {
      var mediaQuery = window.matchMedia('print');
      mediaQuery.addListener(function (mql) {
        if (!mql.matches) {
          removePrintBranding();
        }
      });
    }
    window.addEventListener('afterprint', removePrintBranding);
  }

  if (document.getElementById('generate-ws-btn')) {
    init();
  }
})();
