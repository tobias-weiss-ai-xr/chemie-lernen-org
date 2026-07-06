/* experiments.js — Pre-defined experiment configurations for the virtual chemistry lab
 * chemie-lernen.org (German chemistry education)
 * Exposes a global `experiments` array.
 * (ES5, browser global, sourceType: 'script')
 */
/* exported experiments */

var experiments = [
  {
    id: 'freestyle',
    title: 'Freier Aufbau',
    icon: '🔬',
    description: 'Eigene Experimente zusammenstellen.',
    equipment: ['beaker', 'burner', 'cylinder'],
    chemicals: [],
    steps: [
      { text: 'Wählen Sie Geräte aus der Box aus.', type: 'info' },
      { text: 'Platzieren Sie sie auf der Arbeitsfläche.', type: 'info' },
    ],
    observations: [],
    safety: [],
    onRun: null,
  },
  {
    id: 'titration',
    title: 'Titration (Säure/Base)',
    icon: '🧪',
    description: 'Bestimmung der Konzentration einer Natronlauge mit Salzsäure.',
    equipment: ['beaker', 'burette', 'cylinder', 'burner'],
    chemicals: [
      {
        name: 'Natronlauge (NaOH)',
        formula: 'NaOH',
        concentration: '0,1 mol/L',
        hazardClass: 'caustic',
      },
      {
        name: 'Salzsäure (HCl)',
        formula: 'HCl',
        concentration: '0,1 mol/L',
        hazardClass: 'caustic',
      },
      {
        name: 'Phenolphthalein',
        formula: 'C₂₀H₁₄O₄',
        concentration: '1%',
        hazardClass: 'flammable',
      },
    ],
    steps: [
      {
        text: 'Befüllen Sie die Bürette mit HCl (0,1 mol/L).',
        type: 'info',
      },
      {
        text: 'Geben Sie NaOH in das Becherglas und fügen Sie 3 Tropfen Phenolphthalein hinzu (Lösung wird pink).',
        type: 'info',
      },
      {
        text: 'Lassen Sie langsam HCl aus der Bürette zufließen.',
        type: 'action',
      },
      {
        text: 'Beobachten Sie den Farbumschlag von pink nach farblos am Äquivalenzpunkt.',
        type: 'observation',
      },
      {
        text: 'Notieren Sie den Verbrauch an HCl und berechnen Sie die NaOH-Konzentration.',
        type: 'calculation',
      },
    ],
    observations: [
      {
        time: '0s',
        text: 'NaOH-Lösung (0,1 mol/L) im Becherglas, pH ≈ 13',
        type: 'info',
      },
      {
        time: '5s',
        text: 'Phenolphthalein zugegeben → Lösung färbt sich pink',
        type: 'success',
      },
      { time: '15s', text: 'HCl-Zugabe gestartet...', type: 'info' },
      {
        time: '25s',
        text: 'Farbumschlag bei pH 7 — Lösung wird farblos. Äquivalenzpunkt erreicht!',
        type: 'success',
      },
      {
        time: '30s',
        text: 'Reaktion: NaOH + HCl → NaCl + H₂O (Neutralisation)',
        type: 'info',
      },
    ],
    safety: [
      { text: 'Schutzbrille tragen', class: 'safety-warning' },
      {
        text: 'Säure-/Base-beständige Handschuhe',
        class: 'safety-warning',
      },
      { text: 'Im Abzug arbeiten', class: 'safety-caution' },
    ],
  },
  {
    id: 'co2-nachweis',
    title: 'CO₂-Nachweis',
    icon: '💨',
    description: 'Weisen Sie Kohlenstoffdioxid mit Kalkwasser nach.',
    equipment: ['beaker', 'cylinder', 'flask'],
    chemicals: [
      {
        name: 'Kalkwasser',
        formula: 'Ca(OH)₂',
        concentration: 'gesättigt',
        hazardClass: 'caustic',
      },
      {
        name: 'Kohlenstoffdioxid',
        formula: 'CO₂',
        concentration: 'Gas',
        hazardClass: 'asphyxiant',
      },
    ],
    steps: [
      {
        text: 'Füllen Sie den Kolben zur Hälfte mit Kalkwasser (Ca(OH)₂-Lösung).',
        type: 'info',
      },
      {
        text: 'Leiten Sie vorsichtig CO₂-Gas in die Lösung ein.',
        type: 'action',
      },
      { text: 'Beobachten Sie die Trübung der Lösung.', type: 'observation' },
    ],
    observations: [
      {
        time: '0s',
        text: 'Kalkwasser im Kolben (klare, farblose Lösung)',
        type: 'info',
      },
      { time: '5s', text: 'CO₂-Einleitung gestartet...', type: 'info' },
      {
        time: '10s',
        text: 'Lösung beginnt sich zu trüben — Calciumcarbonat fällt aus!',
        type: 'success',
      },
      {
        time: '15s',
        text: 'Starke Trübung: Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O',
        type: 'info',
      },
      {
        time: '20s',
        text: 'Bei weiterem CO₂-Einleiten: CaCO₃ + CO₂ + H₂O → Ca(HCO₃)₂ (wieder klar)',
        type: 'info',
      },
    ],
    safety: [{ text: 'CO₂ ist ein Atemgift — nur im Abzug!', class: 'safety-warning' }],
  },
  {
    id: 'kupfer-sulfat',
    title: 'Kupfersulfat-Kristallisation',
    icon: '🟦',
    description: 'Kristallisation von Kupfersulfat-Pentahydrat.',
    equipment: ['beaker', 'burner', 'thermometer'],
    chemicals: [
      {
        name: 'Kupfersulfat (wasserfrei)',
        formula: 'CuSO₄',
        concentration: 'fest',
        hazardClass: 'irritant',
      },
      {
        name: 'Destilliertes Wasser',
        formula: 'H₂O',
        concentration: 'rein',
        hazardClass: 'none',
      },
    ],
    steps: [
      {
        text: 'Geben Sie wasserfreies Kupfersulfat (weißes Pulver) in das Becherglas.',
        type: 'info',
      },
      {
        text: 'Fügen Sie langsam Wasser hinzu — beobachten Sie die Farbänderung.',
        type: 'action',
      },
      {
        text: 'Erwärmen Sie die Lösung vorsichtig mit dem Brenner.',
        type: 'action',
      },
      {
        text: 'Lassen Sie die Lösung abkühlen — beobachten Sie die Kristallbildung.',
        type: 'observation',
      },
    ],
    observations: [
      {
        time: '0s',
        text: 'Wasserfreies CuSO₄ (weißes Pulver) im Becherglas',
        type: 'info',
      },
      {
        time: '3s',
        text: 'Wasser zugegeben → sofortige Blaufärbung: CuSO₄ + 5H₂O → CuSO₄·5H₂O',
        type: 'success',
      },
      { time: '8s', text: 'Erwärmen gestartet...', type: 'info' },
      {
        time: '12s',
        text: 'Lösung erwärmt — tiefblaue Farbe bleibt erhalten',
        type: 'info',
      },
      {
        time: '18s',
        text: 'Abkühlphase — erste Kristalle bilden sich!',
        type: 'success',
      },
    ],
    safety: [
      {
        text: 'Kupfersulfat ist reizend — Handschuhe tragen',
        class: 'safety-caution',
      },
      { text: 'Nicht einnehmen', class: 'safety-warning' },
    ],
  },
  {
    id: 'wasserstoff',
    title: 'Knallgasprobe (H₂)',
    icon: '🔥',
    description: 'Nachweis von Wasserstoff durch die charakteristische Knallreaktion.',
    equipment: ['flask', 'burner', 'cylinder'],
    chemicals: [
      {
        name: 'Zink (Zn)',
        formula: 'Zn',
        concentration: 'Granulat',
        hazardClass: 'irritant',
      },
      {
        name: 'Salzsäure',
        formula: 'HCl',
        concentration: '1 mol/L',
        hazardClass: 'caustic',
      },
      {
        name: 'Wasserstoff',
        formula: 'H₂',
        concentration: 'Gas',
        hazardClass: 'flammable',
      },
    ],
    steps: [
      { text: 'Geben Sie Zink-Granulat in den Kolben.', type: 'info' },
      {
        text: 'Fügen Sie Salzsäure hinzu — es entsteht Wasserstoffgas.',
        type: 'action',
      },
      {
        text: 'Halten Sie ein leeres Reagenzglas über die Öffnung, um H₂ aufzufangen.',
        type: 'action',
      },
      {
        text: 'Führen Sie das Reagenzglas an die Brennerflamme.',
        type: 'action',
      },
      {
        text: 'Achten Sie auf den typischen "Knall" — der Wasserstoff verbrennt.',
        type: 'observation',
      },
    ],
    observations: [
      { time: '0s', text: 'Zink-Granulat im Kolben', type: 'info' },
      {
        time: '3s',
        text: 'HCl zugegeben → sofortige Gasentwicklung: Zn + 2HCl → ZnCl₂ + H₂↑',
        type: 'success',
      },
      {
        time: '8s',
        text: 'Wasserstoff sammelt sich über der Lösung',
        type: 'info',
      },
      {
        time: '12s',
        text: 'Reagenzglas mit H₂ an die Flamme geführt...',
        type: 'action',
      },
      {
        time: '15s',
        text: '💥 KNALL! H₂ verbrennt mit der typischen Knallgasreaktion: 2H₂ + O₂ → 2H₂O',
        type: 'success',
      },
    ],
    safety: [
      { text: 'Wasserstoff ist hochexplosiv!', class: 'safety-warning' },
      { text: 'Kleine Menge verwenden', class: 'safety-warning' },
      { text: 'Schutzschild verwenden', class: 'safety-warning' },
      {
        text: 'Keine offenen Flammen in der Nähe (außer zur Prüfung)',
        class: 'safety-caution',
      },
    ],
  },
];
