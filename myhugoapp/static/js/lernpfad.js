/* lernpfad.js — Guided learning paths */

const LEARNING_PATHS = [
  {
    id: 'redox',
    title: 'Redoxreaktionen und Elektrochemie',
    description: 'Vom Rost zur Batterie — verstehe Elektronenübertragungen und elektrochemische Prozesse.',
    difficulty: 'mittel',
    estimatedHours: 6,
    steps: [
      { title: 'Was sind Redoxreaktionen?', desc: 'Grundlagen der Oxidation und Reduktion', type: 'page', url: '/themenbereiche/redox-elektrochemie/', mins: 20 },
      { title: 'Oxidationszahlen', desc: 'Bestimme Oxidationszahlen in Verbindungen', type: 'page', url: '/themenbereiche/redox-elektrochemie/', mins: 25 },
      { title: 'Aufstellen von Redoxgleichungen', desc: 'Teilreaktionen und Gesamtgleichung', type: 'exercise', url: '/uebungsgenerator/', mins: 30 },
      { title: 'Galvanische Zellen', desc: 'Von Daniell-Element zur Batterie', type: 'page', url: '/themenbereiche/redox-elektrochemie/', mins: 30 },
      { title: 'Spannungsreihe', desc: 'Standardpotentiale vergleichen', type: 'page', url: '/themenbereiche/redox-elektrochemie/', mins: 20 },
      { title: 'Nernst-Gleichung', desc: 'pH- und Konzentrationsabhängigkeit', type: 'calculator', url: '/redox-potenzial-rechner/', mins: 30 },
      { title: 'Elektrochemie auf Teilchenebene', desc: 'Interaktive Visualisierung', type: 'calculator', url: '/elektrochemie-teilchenebene/', mins: 30 },
      { title: 'Redox-Titrationen', desc: 'Permanganat und Cer(IV)-Verfahren', type: 'calculator', url: '/redox-titrationen/', mins: 35 },
      { title: 'Übungen: Redox', desc: 'Teste dein Wissen', type: 'exercise', url: '/uebungsgenerator/', mins: 20 }
    ]
  },
  {
    id: 'saeuren-basen',
    title: 'Säuren und Basen',
    description: 'pH-Wert, Neutralisation, Puffer und Titration — von der Theorie zur Praxis.',
    difficulty: 'mittel',
    estimatedHours: 5,
    steps: [
      { title: 'Säure-Base-Theorien', desc: 'Brønsted, Lewis und Arrhenius', type: 'page', url: '/themenbereiche/saeuren-basen/', mins: 20 },
      { title: 'pH-Wert und pOH', desc: 'Berechnung von pH und pOH', type: 'page', url: '/themenbereiche/saeuren-basen/', mins: 25 },
      { title: 'Starke und schwache Säuren', desc: 'Unterschiede und Berechnungen', type: 'page', url: '/themenbereiche/saeuren-basen/', mins: 25 },
      { title: 'pH-Rechner', desc: 'Interaktiver pH-Rechner', type: 'calculator', url: '/ph-rechner/', mins: 20 },
      { title: 'Säure-Base-Titrationen', desc: 'Titrationssimulator', type: 'calculator', url: '/titrations-simulator/', mins: 30 },
      { title: 'Pufferlösungen', desc: 'Henderson-Hasselbalch-Gleichung', type: 'page', url: '/themenbereiche/saeuren-basen/', mins: 25 },
      { title: 'Übungen: Säuren & Basen', desc: 'Teste dein Wissen', type: 'exercise', url: '/uebungsgenerator/', mins: 20 }
    ]
  },
  {
    id: 'stoechiometrie',
    title: 'Stöchiometrie',
    description: 'Richtig rechnen in der Chemie — molare Massen, Stoffmengen und Reaktionsgleichungen.',
    difficulty: 'leicht',
    estimatedHours: 4,
    steps: [
      { title: 'Das Mol', desc: 'Stoffmenge und Avogadro-Konstante', type: 'page', url: '/themenbereiche/einfuehrung-chemie/', mins: 20 },
      { title: 'Molare Masse', desc: 'Berechnung der molaren Masse', type: 'page', url: '/themenbereiche/einfuehrung-chemie/', mins: 20 },
      { title: 'Stoffmengenberechnungen', desc: 'Umrechnung zwischen Masse und Stoffmenge', type: 'page', url: '/themenbereiche/einfuehrung-chemie/', mins: 25 },
      { title: 'Reaktionsgleichungen', desc: 'Ausgleichen und interpretieren', type: 'page', url: '/themenbereiche/einfuehrung-chemie/', mins: 25 },
      { title: 'Übungen: Stöchiometrie', desc: 'Übungsgenerator', type: 'exercise', url: '/uebungsgenerator/', mins: 30 },
      { title: 'Lückentexte: Grundlagen', desc: 'Wiederhole die Konzepte', type: 'calculator', url: '/lueckentexte/', mins: 20 }
    ]
  },
  {
    id: 'organik',
    title: 'Organische Chemie',
    description: 'Von Alkanen zu funktionellen Gruppen — die Chemie des Kohlenstoffs.',
    difficulty: 'schwer',
    estimatedHours: 8,
    steps: [
      { title: 'Kohlenwasserstoffe', desc: 'Einführung in die organische Chemie', type: 'page', url: '/themenbereiche/erdoel-organische-stoffklassen/', mins: 25 },
      { title: 'Alkane', desc: 'Struktur, Nomenklatur und Eigenschaften', type: 'page', url: '/themenbereiche/erdoel-organische-stoffklassen/', mins: 30 },
      { title: 'Alkene und Alkine', desc: 'Doppel- und Dreifachbindungen', type: 'page', url: '/themenbereiche/erdoel-organische-stoffklassen/', mins: 30 },
      { title: 'Funktionelle Gruppen', desc: 'Alkohole, Aldehyde, Ketone, Säuren', type: 'page', url: '/themenbereiche/reaktionstypen-organisch/', mins: 35 },
      { title: 'Isomerie', desc: 'Struktur-, Stereo- und optische Isomerie', type: 'page', url: '/themenbereiche/reaktionstypen-organisch/', mins: 25 },
      { title: 'Organische Reaktionen', desc: 'Substitution, Addition, Eliminierung', type: 'page', url: '/themenbereiche/reaktionstypen-organisch/', mins: 30 },
      { title: 'Übungen: Organik', desc: 'Teste dein Wissen', type: 'exercise', url: '/uebungsgenerator/', mins: 20 }
    ]
  },
  {
    id: 'atommodelle',
    title: 'Atommodelle und Periodensystem',
    description: 'Vom Kern zu den Elementen — Atombau, Orbitale und das Periodensystem.',
    difficulty: 'mittel',
    estimatedHours: 5,
    steps: [
      { title: 'Geschichte der Atommodelle', desc: 'Von Dalton zum Quantenmodell', type: 'page', url: '/themenbereiche/aufbau-materie/', mins: 20 },
      { title: 'Aufbau des Atoms', desc: 'Kern, Hülle, Protonen, Neutronen, Elektronen', type: 'page', url: '/themenbereiche/aufbau-materie/', mins: 20 },
      { title: 'Elektronenkonfiguration', desc: 'Schalen, Orbitale und Quantenzahlen', type: 'page', url: '/themenbereiche/aufbau-materie/', mins: 25 },
      { title: 'Periodensystem', desc: 'Periodische Trends visualisiert', type: 'calculator', url: '/periodische-trends/', mins: 25 },
      { title: 'Molekülorbitale', desc: '3D-Visualisierung von Orbitalen', type: 'calculator', url: '/molekuelorbitale/', mins: 30 },
      { title: 'Isotope', desc: 'Variationen der Elemente', type: 'page', url: '/themenbereiche/aufbau-materie/', mins: 15 },
      { title: 'Übungen: Atome & PSE', desc: 'Lückentexte', type: 'calculator', url: '/lueckentexte/', mins: 20 }
    ]
  },
  {
    id: 'bindungen',
    title: 'Chemische Bindungen',
    description: 'Ionenbindung, Elektronenpaarbindung, Metallbindung — die Kräfte zwischen Atomen.',
    difficulty: 'mittel',
    estimatedHours: 4,
    steps: [
      { title: 'Edelgasregel', desc: 'Warum gehen Atome Bindungen ein?', type: 'page', url: '/themenbereiche/anorganische-verbindungen/', mins: 15 },
      { title: 'Ionenbindung', desc: 'Salze und Ionengitter', type: 'page', url: '/themenbereiche/anorganische-verbindungen/', mins: 25 },
      { title: 'Elektronenpaarbindung', desc: 'Atombindung und polare Bindungen', type: 'page', url: '/themenbereiche/anorganische-verbindungen/', mins: 25 },
      { title: 'Metallbindung', desc: 'Elektronengas und metallische Eigenschaften', type: 'page', url: '/themenbereiche/anorganische-verbindungen/', mins: 20 },
      { title: 'Zwischenmolekulare Kräfte', desc: 'Van-der-Waals, Dipole, Wasserstoffbrücken', type: 'page', url: '/themenbereiche/anorganische-verbindungen/', mins: 25 },
      { title: 'Molekülbaukasten', desc: '3D-Moleküle bauen', type: 'calculator', url: '/molekuel-studio/', mins: 30 },
      { title: 'Lückentexte: Bindungen', desc: 'Wiederhole die Konzepte', type: 'calculator', url: '/lueckentexte/', mins: 20 }
    ]
  }
];

let currentPathId = null;

function renderPathList() {
  const list = document.getElementById('path-list');
  list.innerHTML = LEARNING_PATHS.map((p) => {
    const completed = getPathProgress(p.id);
    const total = p.steps.length;
    const pct = Math.round((completed / total) * 100);
    return `<a href="#" class="list-group-item" data-path-id="${p.id}" onclick="selectPath('${p.id}'); return false;">
      <h4 class="list-group-item-heading">${p.title}</h4>
      <p class="list-group-item-text">${p.description.substring(0, 60)}...</p>
      <div class="progress" style="height: 6px; margin-top: 8px;">
        <div class="progress-bar progress-bar-success" style="width: ${pct}%;"></div>
      </div>
      <small class="text-muted">${completed}/${total} Schritte (${pct}%)</small>
    </a>`;
  }).join('');
}

function selectPath(pathId) {
  currentPathId = pathId;
  const path = LEARNING_PATHS.find((p) => p.id === pathId);
  if (!path) return;

  const completed = getPathProgress(pathId);
  const labels = { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' };
  const badge = { leicht: 'success', mittel: 'warning', schwer: 'danger' };

  document.getElementById('path-title').textContent = path.title;
  document.getElementById('path-meta').innerHTML =
    `<span class="label label-${badge[path.difficulty]}">${labels[path.difficulty]}</span>
     <span class="label label-default">~${path.estimatedHours}h</span>
     <span class="label label-success">${completed}/${path.steps.length} Schritte</span>`;

  const detail = document.getElementById('path-detail');
  detail.innerHTML = `
    <p>${path.description}</p>
    <div class="path-steps">
      ${path.steps.map((step, idx) => {
        const done = completed > idx;
        const current = completed === idx;
        const iconMap = { page: 'fa-book', calculator: 'fa-calculator', exercise: 'fa-pencil-square-o' };
        const icon = iconMap[step.type] || 'fa-chevron-circle-right';
        const statusClass = done ? 'step-done' : current ? 'step-current' : 'step-pending';
        return `<div class="path-step ${statusClass}" data-step-idx="${idx}">
          <div class="step-marker">
            <i class="fa ${icon}"></i>
            ${idx + 1}
          </div>
          <div class="step-content">
            <h4>${step.title}</h4>
            <p>${step.desc}</p>
            <div class="step-meta">
              <span class="label label-default"><i class="fa fa-clock-o"></i> ${step.mins} min</span>
              <span class="label label-info">${step.type}</span>
              ${done
                ? '<span class="label label-success"><i class="fa fa-check"></i> Erledigt</span>'
                : current
                  ? '<span class="label label-primary"><i class="fa fa-arrow-right"></i> Nächster Schritt</span>'
                  : '<span class="label label-default">Offen</span>'}
              ${step.url && !done
                ? `<a href="${step.url}" class="btn btn-xs btn-primary pull-right" onclick="markStepDone('${pathId}', ${idx}); return true;">
                    <i class="fa fa-external-link"></i> Öffnen</a>`
                : ''}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;

  updateProgressSummary();
}

function markStepDone(pathId, stepIdx) {
  const key = `lernpfad-${pathId}`;
  let done = [];
  try {
    done = JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) { /* ignore */ }
  if (!done.includes(stepIdx)) {
    done.push(stepIdx);
    localStorage.setItem(key, JSON.stringify(done));
  }
  if (typeof ProgressTracker !== 'undefined') {
    ProgressTracker.saveExerciseProgress('lernpfad', pathId, {
      total: LEARNING_PATHS.find((p) => p.id === pathId).steps.length,
      correct: done.length,
      completed: true
    });
  }
}

function getPathProgress(pathId) {
  try {
    const done = JSON.parse(localStorage.getItem(`lernpfad-${pathId}`)) || [];
    return done.length;
  } catch (e) { return 0; }
}

function updateProgressSummary() {
  let totalSteps = 0;
  let totalDone = 0;
  LEARNING_PATHS.forEach((p) => {
    totalSteps += p.steps.length;
    totalDone += getPathProgress(p.id);
  });
  const pct = totalSteps > 0 ? Math.round((totalDone / totalSteps) * 100) : 0;
  const summary = document.getElementById('path-progress-summary');
  summary.innerHTML = `
    <div class="panel panel-success">
      <div class="panel-heading"><strong><i class="fa fa-tasks"></i> Gesamtfortschritt</strong></div>
      <div class="panel-body text-center">
        <h2>${totalDone}/${totalSteps}</h2>
        <div class="progress" style="height: 18px;">
          <div class="progress-bar progress-bar-success" style="width: ${pct}%;">${pct}%</div>
        </div>
        <p class="text-muted">Schritte erledigt</p>
        <button class="btn btn-xs btn-danger" onclick="resetAllPathProgress()">
          <i class="fa fa-trash"></i> Zurücksetzen
        </button>
      </div>
    </div>
  `;
}

function resetAllPathProgress() {
  if (!confirm('Wirklich alle Lernpfad-Fortschritte zurücksetzen?')) return;
  LEARNING_PATHS.forEach((p) => {
    localStorage.removeItem(`lernpfad-${p.id}`);
  });
  renderPathList();
  if (currentPathId) selectPath(currentPathId);
  updateProgressSummary();
}

document.addEventListener('DOMContentLoaded', function () {
  renderPathList();
  updateProgressSummary();
});
