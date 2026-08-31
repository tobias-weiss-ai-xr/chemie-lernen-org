/**
 * quiz-questions.js — Chemistry quiz database
 * 120+ questions across all 12 Themenbereiche + general chemistry
 * Question types: multiple-choice, multiple-select, true-false, fill-in-blank
 *
 * Each question has a `topic` (display name) and `slug` (matching Themenbereich URL slug).
 */
(function () {
  'use strict';

  var questions = [
    // ══════════════════════════════════════════════════════════
    // einfuehrung-chemie (Einführung in die Chemie)
    // ══════════════════════════════════════════════════════════
    {
      id: 'ec-1',
      topic: 'Einführung in die Chemie',
      slug: 'einfuehrung-chemie',
      type: 'multiple-choice',
      question: 'Wie viele Protonen hat ein Wasserstoffatom?',
      options: ['0', '1', '2', '3'],
      correctIndex: 1,
      explanation: 'Wasserstoff hat die Ordnungszahl 1 und besitzt daher ein Proton im Atomkern.',
    },
    {
      id: 'ec-2',
      topic: 'Einführung in die Chemie',
      slug: 'einfuehrung-chemie',
      type: 'multiple-choice',
      question: 'Welches ist das häufigste Element im Universum?',
      options: ['Sauerstoff', 'Kohlenstoff', 'Wasserstoff', 'Helium'],
      correctIndex: 2,
      explanation: 'Wasserstoff macht etwa 75 % der baryonischen Masse des Universums aus.',
    },
    {
      id: 'ec-3',
      topic: 'Einführung in die Chemie',
      slug: 'einfuehrung-chemie',
      type: 'true-false',
      question: 'Die molare Masse von Kohlenstoff (C) beträgt etwa 12 g/mol.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: 'Kohlenstoff hat eine relative Atommasse von etwa 12 u, daher 12 g/mol.',
    },
    {
      id: 'ec-4',
      topic: 'Einführung in die Chemie',
      slug: 'einfuehrung-chemie',
      type: 'multiple-choice',
      question: 'Welches Gesetz besagt, dass Masse bei chemischen Reaktionen erhalten bleibt?',
      options: [
        'Gesetz der konstanten Proportionen',
        'Gesetz der Massenerhaltung',
        'Gesetz der multiplen Proportionen',
        'Avogadro-Gesetz',
      ],
      correctIndex: 1,
      explanation:
        'Das Gesetz der Massenerhaltung (Lavoisier) besagt, dass die Gesamtmasse vor und nach einer Reaktion gleich bleibt.',
    },
    {
      id: 'ec-5',
      topic: 'Einführung in die Chemie',
      slug: 'einfuehrung-chemie',
      type: 'multiple-choice',
      question: 'Was beschreibt die Avogadro-Konstante?',
      options: [
        'Die Lichtgeschwindigkeit',
        'Die Anzahl Teilchen in 1 Mol',
        'Die Elementarladung',
        'Die Planck-Konstante',
      ],
      correctIndex: 1,
      explanation:
        'Die Avogadro-Konstante (Nₐ ≈ 6,022 × 10²³ mol⁻¹) gibt die Anzahl der Teilchen in einem Mol an.',
    },
    {
      id: 'ec-6',
      topic: 'Einführung in die Chemie',
      slug: 'einfuehrung-chemie',
      type: 'fill-in-blank',
      question:
        'Die kleinste Einheit eines chemischen Elements, die noch dessen Eigenschaften besitzt, nennt man ________.',
      options: [],
      correctAnswer: 'Atom',
      acceptedAnswers: ['Atom', 'atom', 'Atome', 'atome'],
      explanation:
        'Ein Atom ist die kleinste Einheit eines Elements, die dessen chemische Eigenschaften beibehält.',
    },
    {
      id: 'ec-7',
      topic: 'Einführung in die Chemie',
      slug: 'einfuehrung-chemie',
      type: 'multiple-select',
      question: 'Welche der folgenden sind chemische Elemente?',
      options: ['Kupfer', 'Wasser', 'Eisen', 'Kochsalz', 'Sauerstoff'],
      correctIndices: [0, 2, 4],
      explanation:
        'Kupfer (Cu), Eisen (Fe) und Sauerstoff (O) sind Elemente. Wasser (H₂O) und Kochsalz (NaCl) sind Verbindungen.',
    },
    {
      id: 'ec-8',
      topic: 'Einführung in die Chemie',
      slug: 'einfuehrung-chemie',
      type: 'multiple-choice',
      question: 'Welche Aussage zur Sicherheit im Chemieunterricht ist richtig?',
      options: [
        'Augenschutz ist nur bei Säuren nötig',
        'Beim Arbeiten mit offenen Flammen braucht man keine Haarschutz',
        'Beim Verdünnen von Säure wird Säure zum Wasser gegeben',
        'Man kann Chemikalien blind probieren',
      ],
      correctIndex: 2,
      explanation:
        'Immer erst Wasser, dann Säure! Sonst kann es durch die Reaktionswärme zum Verspritzen kommen.',
    },

    // ══════════════════════════════════════════════════════════
    // aufbau-materie (Aufbau der Materie)
    // ══════════════════════════════════════════════════════════
    {
      id: 'am-1',
      topic: 'Aufbau der Materie',
      slug: 'aufbau-materie',
      type: 'multiple-choice',
      question: 'Wie heißen die drei Elementarteilchen eines Atoms?',
      options: [
        'Proton, Neutron, Elektron',
        'Proton, Positron, Elektron',
        'Kation, Anion, Neutron',
        'Ion, Molekül, Atom',
      ],
      correctIndex: 0,
      explanation:
        'Atome bestehen aus Protonen (+) und Neutronen (0) im Kern sowie Elektronen (−) in der Hülle.',
    },
    {
      id: 'am-2',
      topic: 'Aufbau der Materie',
      slug: 'aufbau-materie',
      type: 'multiple-choice',
      question: 'Wo befinden sich die Elektronen im Bohrschen Atommodell?',
      options: [
        'Im Atomkern',
        'Auf festen Bahnen um den Kern',
        'Frei im Raum',
        'In der Nukleonenhülle',
      ],
      correctIndex: 1,
      explanation:
        'Im Bohrschen Modell bewegen sich Elektronen auf definierten Kreisbahnen (Schalen) um den Kern.',
    },
    {
      id: 'am-3',
      topic: 'Aufbau der Materie',
      slug: 'aufbau-materie',
      type: 'true-false',
      question:
        'Isotope eines Elements haben die gleiche Anzahl Protonen, aber unterschiedliche Anzahl Neutronen.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation:
        'Isotope unterscheiden sich in der Neutronenzahl, haben aber gleiche Protonenzahl (gleiches Element).',
    },
    {
      id: 'am-4',
      topic: 'Aufbau der Materie',
      slug: 'aufbau-materie',
      type: 'multiple-choice',
      question: 'Wie viele Elektronen passen maximal in die 2. Schale (n=2)?',
      options: ['2', '6', '8', '18'],
      correctIndex: 2,
      explanation: 'Die 2. Schale hat die Unterschalen s und p mit insgesamt 2 + 6 = 8 Elektronen.',
    },
    {
      id: 'am-5',
      topic: 'Aufbau der Materie',
      slug: 'aufbau-materie',
      type: 'multiple-choice',
      question: 'Welche Art von chemischer Bindung entsteht durch Elektronenpaar-Bildung?',
      options: [
        'Ionenbindung',
        'Kovalente Bindung (Atombindung)',
        'Metallbindung',
        'Van-der-Waals-Kraft',
      ],
      correctIndex: 1,
      explanation:
        'Kovalente Bindungen entstehen durch das gemeinsame Teilen von Elektronenpaaren zwischen Nichtmetallatomen.',
    },
    {
      id: 'am-6',
      topic: 'Aufbau der Materie',
      slug: 'aufbau-materie',
      type: 'fill-in-blank',
      question:
        'Das Teilchen, das bei einer chemischen Reaktion übertragen wird und die Bindung bestimmt, nennt man ________.',
      options: [],
      correctAnswer: 'Elektron',
      acceptedAnswers: ['Elektron', 'Elektronen', 'elektron'],
      explanation:
        'Elektronen werden bei chemischen Reaktionen übertragen oder geteilt und bestimmen die Bindungsverhältnisse.',
    },
    {
      id: 'am-7',
      topic: 'Aufbau der Materie',
      slug: 'aufbau-materie',
      type: 'multiple-choice',
      question: 'Wie groß ist die ungefähre Größe eines Atoms?',
      options: ['10⁻¹⁵ m', '10⁻¹⁰ m', '10⁻⁵ m', '10⁻² m'],
      correctIndex: 1,
      explanation: 'Atomradien liegen in der Größenordnung von 0,1 nm = 10⁻¹⁰ m (Ångström).',
    },
    {
      id: 'am-8',
      topic: 'Aufbau der Materie',
      slug: 'aufbau-materie',
      type: 'multiple-choice',
      question: 'Welche Aussage zur Metallschicht im Periodensystem ist richtig?',
      options: [
        'Metalle verlieren leicht Elektronen (niedrige Ionisierungsenergie)',
        'Metalle haben hohe Elektronegativität',
        'Metalle bilden kovalente Bindungen untereinander',
        'Metalle sind immer gasförmig',
      ],
      correctIndex: 0,
      explanation:
        'Metalle zeichnen sich durch niedrige Ionisierungsenergien aus — sie geben leicht Elektronen ab.',
    },

    // ══════════════════════════════════════════════════════════
    // anorganische-verbindungen (Anorganische Verbindungen)
    // ══════════════════════════════════════════════════════════
    {
      id: 'av-1',
      topic: 'Anorganische Verbindungen',
      slug: 'anorganische-verbindungen',
      type: 'multiple-choice',
      question: 'Welche Art von Bindung liegt in Natriumchlorid (NaCl) vor?',
      options: ['Ionenbindung', 'Kovalente Bindung', 'Metallbindung', 'Wasserstoffbrücke'],
      correctIndex: 0,
      explanation:
        'NaCl besteht aus Na⁺- und Cl⁻-Ionen, die durch Ionenbindung zusammengehalten werden.',
    },
    {
      id: 'av-2',
      topic: 'Anorganische Verbindungen',
      slug: 'anorganische-verbindungen',
      type: 'multiple-choice',
      question: 'Welches Edelgas hat die kleinste Atommasse?',
      options: ['Helium', 'Neon', 'Argon', 'Krypton'],
      correctIndex: 0,
      explanation: 'Helium (He) hat die Ordnungszahl 2 und ist das leichteste Edelgas.',
    },
    {
      id: 'av-3',
      topic: 'Anorganische Verbindungen',
      slug: 'anorganische-verbindungen',
      type: 'true-false',
      question: 'Schwefelsäure (H₂SO₄) ist eine zweiprotonige Säure.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: 'Schwefelsäure kann zwei Protonen (H⁺) abgeben, daher ist sie zweiprotonig.',
    },
    {
      id: 'av-4',
      topic: 'Anorganische Verbindungen',
      slug: 'anorganische-verbindungen',
      type: 'multiple-choice',
      question: 'Welche Oxidationszahl hat Sauerstoff in den meisten Verbindungen?',
      options: ['-2', '0', '+2', '-1'],
      correctIndex: 0,
      explanation:
        'Sauerstoff hat in den meisten Verbindungen die Oxidationszahl -II (Ausnahme: Peroxide mit -I).',
    },
    {
      id: 'av-5',
      topic: 'Anorganische Verbindungen',
      slug: 'anorganische-verbindungen',
      type: 'fill-in-blank',
      question: 'Die Reaktion zwischen einer Säure und einer Base nennt man ________.',
      options: [],
      correctAnswer: 'Neutralisation',
      acceptedAnswers: ['Neutralisation', 'Neutralisierung', 'neutralisation', 'neutralisierung'],
      explanation: 'Bei der Neutralisation reagieren Säure und Base zu Salz und Wasser.',
    },
    {
      id: 'av-6',
      topic: 'Anorganische Verbindungen',
      slug: 'anorganische-verbindungen',
      type: 'multiple-choice',
      question: 'Welches Element steht im Periodensystem in der 3. Periode und der 5. Hauptgruppe?',
      options: ['Aluminium', 'Silicium', 'Phosphor', 'Schwefel'],
      correctIndex: 2,
      explanation: 'Phosphor (P) steht in der 3. Periode, 5. Hauptgruppe (15. Gruppe).',
    },
    {
      id: 'av-7',
      topic: 'Anorganische Verbindungen',
      slug: 'anorganische-verbindungen',
      type: 'multiple-choice',
      question: 'Welches Salz entsteht bei der Neutralisation von Salzsäure und Natronlauge?',
      options: ['NaCl', 'NaOH', 'HCl', 'Na₂SO₄'],
      correctIndex: 0,
      explanation: 'HCl + NaOH → NaCl + H₂O. Natriumchlorid (Kochsalz) entsteht.',
    },
    {
      id: 'av-8',
      topic: 'Anorganische Verbindungen',
      slug: 'anorganische-verbindungen',
      type: 'multiple-choice',
      question: 'Was beschreibt das Ionenprodukt des Wassers (Kw)?',
      options: ['pKw = 14 bei 25 °C', 'Kw = 1 × 10⁻¹⁴', 'Beides', 'Keines von beiden'],
      correctIndex: 2,
      explanation:
        'Das Ionenprodukt des Wassens ist Kw = [H⁺][OH⁻] = 10⁻¹⁴ mol²/L² bei 25 °C. Daraus folgt pKw = 14.',
    },

    // ══════════════════════════════════════════════════════════
    // saeuren-basen (Säuren und Basen)
    // ══════════════════════════════════════════════════════════
    {
      id: 'sb-1',
      topic: 'Säuren und Basen',
      slug: 'saeuren-basen',
      type: 'multiple-choice',
      question: 'Was ist der pH-Wert einer 0,01 M HCl-Lösung?',
      options: ['1', '2', '3', '7'],
      correctIndex: 1,
      explanation:
        'pH = −log(0,01) = −log(10⁻²) = 2. HCl ist eine starke Säure und dissoziiert vollständig.',
    },
    {
      id: 'sb-2',
      topic: 'Säuren und Basen',
      slug: 'saeuren-basen',
      type: 'multiple-choice',
      question: 'Welcher Indikator wird rot in saurer und blau in basischer Lösung?',
      options: ['Phenolphthalein', 'Bromthymolblau', 'Lackmus', 'Methylorange'],
      correctIndex: 2,
      explanation:
        'Lackmus (Litmus) ist ein klassischer Indikator: rot bei pH < 5, blau bei pH > 8.',
    },
    {
      id: 'sb-3',
      topic: 'Säuren und Basen',
      slug: 'saeuren-basen',
      type: 'true-false',
      question: 'Starke Säuren sind in wässriger Lösung vollständig dissoziiert.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: 'Starke Säuren wie HCl oder H₂SO₄ dissoziieren in Wasser nahezu vollständig.',
    },
    {
      id: 'sb-4',
      topic: 'Säuren und Basen',
      slug: 'saeuren-basen',
      type: 'multiple-choice',
      question: 'Was ist ein Puffer?',
      options: [
        'Eine stark saure Lösung',
        'Eine Mischung, die pH-Schwankungen dämpft',
        'Ein Lösungsmittel für Salze',
        'Ein Katalysator',
      ],
      correctIndex: 1,
      explanation:
        'Puffer (z.B. Essigsäure/Acetat) stabilisieren den pH-Wert gegen Zugabe von Säuren oder Basen.',
    },
    {
      id: 'sb-5',
      topic: 'Säuren und Basen',
      slug: 'saeuren-basen',
      type: 'fill-in-blank',
      question:
        'Der pH-Wert ist definiert als der negative dekadische ________ der H₃O⁺-Ionenkonzentration.',
      options: [],
      correctAnswer: 'Logarithmus',
      acceptedAnswers: ['Logarithmus', 'logarithmus', 'Log', 'log'],
      explanation: 'pH = −lg[H₃O⁺]. Je höher die H₃O⁺-Konzentration, desto niedriger der pH-Wert.',
    },
    {
      id: 'sb-6',
      topic: 'Säuren und Basen',
      slug: 'saeuren-basen',
      type: 'multiple-choice',
      question: 'Welche Säure ist eine schwache Säure?',
      options: [
        'Salzsäure (HCl)',
        'Schwefelsäure (H₂SO₄)',
        'Essigsäure (CH₃COOH)',
        'Salpetersäure (HNO₃)',
      ],
      correctIndex: 2,
      explanation: 'Essigsäure ist eine schwache Säure (pKa ≈ 4,76) und dissoziiert nur teilweise.',
    },
    {
      id: 'sb-7',
      topic: 'Säuren und Basen',
      slug: 'saeuren-basen',
      type: 'multiple-choice',
      question:
        'Was passiert beim Verdünnen einer starken Säure mit dem pH-Wert 1 auf das 10-fache Volumen?',
      options: ['pH wird 2', 'pH wird 10', 'pH wird 0,1', 'pH bleibt 1'],
      correctIndex: 0,
      explanation:
        'Verdünnung auf das 10-fache halbiert die H₃O⁺-Konzentration → pH steigt um 1 (von 1 auf 2).',
    },
    {
      id: 'sb-8',
      topic: 'Säuren und Basen',
      slug: 'saeuren-basen',
      type: 'multiple-select',
      question: 'Welche Stoffe sind typische Basen?',
      options: ['NaOH', 'HCl', 'Ca(OH)₂', 'CH₃COOH', 'NH₃'],
      correctIndices: [0, 2, 4],
      explanation:
        'NaOH (Natronlauge), Ca(OH)₂ (Kalkwasser) und NH₃ (Ammoniak) sind Basen. HCl und CH₃COOH sind Säuren.',
    },

    // ══════════════════════════════════════════════════════════
    // redox-elektrochemie (Redoxreaktionen und Elektrochemie)
    // ══════════════════════════════════════════════════════════
    {
      id: 're-1',
      topic: 'Redoxreaktionen und Elektrochemie',
      slug: 'redox-elektrochemie',
      type: 'multiple-choice',
      question: 'Was bedeutet Oxidation?',
      options: [
        'Aufnahme von Elektronen',
        'Abgabe von Elektronen',
        'Aufnahme von Protonen',
        'Abgabe von Neutronen',
      ],
      correctIndex: 1,
      explanation: 'Oxidation = Abgabe von Elektronen. „Oxidation ist Elektronenabgabe." (OIL RIG)',
    },
    {
      id: 're-2',
      topic: 'Redoxreaktionen und Elektrochemie',
      slug: 'redox-elektrochemie',
      type: 'true-false',
      question:
        'In einer galvanischen Zelle wird elektrische Energie in chemische Energie umgewandelt.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 1,
      explanation:
        'In einer galvanischen Zelle (Batterie) wird chemische Energie in elektrische Energie umgewandelt. Umgekehrt in einer Elektrolysezelle.',
    },
    {
      id: 're-3',
      topic: 'Redoxreaktionen und Elektrochemie',
      slug: 'redox-elektrochemie',
      type: 'multiple-choice',
      question: 'Welches Metall dient als Anode in einer Daniell-Zelle?',
      options: ['Kupfer', 'Zink', 'Platin', 'Gold'],
      correctIndex: 1,
      explanation: 'Zink ist das unedlere Metall und wird oxidiert (Anode): Zn → Zn²⁺ + 2e⁻.',
    },
    {
      id: 're-4',
      topic: 'Redoxreaktionen und Elektrochemie',
      slug: 'redox-elektrochemie',
      type: 'multiple-choice',
      question: 'Wie lautet die Reduktionsgleichung für Kupfer(II)-Ionen?',
      options: ['Cu → Cu²⁺ + 2e⁻', 'Cu²⁺ + 2e⁻ → Cu', 'Cu → Cu⁺ + e⁻', 'Cu²⁺ + e⁻ → Cu⁺'],
      correctIndex: 1,
      explanation:
        'Cu²⁺ + 2e⁻ → Cu: Kupferionen werden durch Elektronenaufnahme zu elementarem Kupfer reduziert.',
    },
    {
      id: 're-5',
      topic: 'Redoxreaktionen und Elektrochemie',
      slug: 'redox-elektrochemie',
      type: 'fill-in-blank',
      question:
        'Die Messgröße für die Tendenz eines Redoxpaares, Elektronen aufzunehmen, ist das ________.',
      options: [],
      correctAnswer: 'Normalpotential',
      acceptedAnswers: [
        'Normalpotential',
        'Standardpotential',
        'Redoxpotential',
        'Elektrodenpotential',
        'normalpotential',
        'standardpotential',
      ],
      explanation: 'Das Normalpotential (E°) gibt an, wie stark die Tendenz zur Reduktion ist.',
    },
    {
      id: 're-6',
      topic: 'Redoxreaktionen und Elektrochemie',
      slug: 'redox-elektrochemie',
      type: 'multiple-choice',
      question: 'Was passiert bei der Elektrolyse von Wasser?',
      options: [
        'Wasser wird kälter',
        'Es entstehen H₂ und O₂',
        'Es entsteht CO₂',
        'Wasser wird zu Eis',
      ],
      correctIndex: 1,
      explanation:
        'Bei der Elektrolyse wird Wasser in Wasserstoff (an der Kathode) und Sauerstoff (an der Anode) zerlegt.',
    },
    {
      id: 're-7',
      topic: 'Redoxreaktionen und Elektrochemie',
      slug: 'redox-elektrochemie',
      type: 'multiple-select',
      question: 'Welche Reaktionen sind Redoxreaktionen?',
      options: [
        'Verbrennung von Methan',
        'Neutralisation',
        'Rostbildung',
        'Lösung von Salz in Wasser',
      ],
      correctIndices: [0, 2],
      explanation:
        'Verbrennung und Rostbildung sind Redoxreaktionen. Neutralisation und Lösen sind keine.',
    },
    {
      id: 're-8',
      topic: 'Redoxreaktionen und Elektrochemie',
      slug: 'redox-elektrochemie',
      type: 'multiple-choice',
      question: 'Was gibt die Nernst-Gleichung an?',
      options: [
        'Die Aktivierungsenergie',
        'Das Potential einer Elektrode in Abhängigkeit von der Konzentration',
        'Die Reaktionsgeschwindigkeit',
        'Die Entropie',
      ],
      correctIndex: 1,
      explanation:
        'Die Nernst-Gleichung berechnet das Elektrodenpotential unter Nicht-Standardbedingungen.',
    },

    // ══════════════════════════════════════════════════════════
    // erdoel-organische-stoffklassen (Erdöl und organische Stoffklassen)
    // ══════════════════════════════════════════════════════════
    {
      id: 'eo-1',
      topic: 'Erdöl und organische Stoffklassen',
      slug: 'erdoel-organische-stoffklassen',
      type: 'multiple-choice',
      question: 'Welche funktionelle Gruppe kennzeichnet Alkohole?',
      options: ['-OH', '-COOH', '-NH₂', '-CHO'],
      correctIndex: 0,
      explanation: 'Alkohole enthalten die Hydroxylgruppe (-OH).',
    },
    {
      id: 'eo-2',
      topic: 'Erdöl und organische Stoffklassen',
      slug: 'erdoel-organische-stoffklassen',
      type: 'multiple-choice',
      question: 'Welcher Kohlenwasserstoff ist der einfachste Vertreter der Alkane?',
      options: ['Ethan', 'Methan', 'Propan', 'Butan'],
      correctIndex: 1,
      explanation:
        'Methan (CH₄) ist das einfachste Alkan mit einer Kohlenstoff-Kohlenstoff-Bindung.',
    },
    {
      id: 'eo-3',
      topic: 'Erdöl und organische Stoffklassen',
      slug: 'erdoel-organische-stoffklassen',
      type: 'true-false',
      question: 'Bei der Additionsreaktion von Ethen (C₂H₄) mit Brom entsteht 1,2-Dibromethan.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation:
        'Ethen + Br₂ → 1,2-Dibromethan. Typische Additionsreaktion an die C=C-Doppelbindung.',
    },
    {
      id: 'eo-4',
      topic: 'Erdöl und organische Stoffklassen',
      slug: 'erdoel-organische-stoffklassen',
      type: 'multiple-choice',
      question: 'Was ist Erdöl hauptsächlich?',
      options: [
        'Ein einzelner Kohlenwasserstoff',
        'Ein Gemisch aus Kohlenwasserstoffen',
        'Ein reines Element',
        'Eine anorganische Verbindung',
      ],
      correctIndex: 1,
      explanation:
        'Erdöl ist ein komplexes Gemisch aus tausenden verschiedenen Kohlenwasserstoffen.',
    },
    {
      id: 'eo-5',
      topic: 'Erdöl und organische Stoffklassen',
      slug: 'erdoel-organische-stoffklassen',
      type: 'multiple-choice',
      question: 'Wie heißt die Reaktion, bei der aus Alkohol und Carbonsäure ein Ester entsteht?',
      options: ['Addition', 'Polymerisation', 'Veresterung', 'Cracking'],
      correctIndex: 2,
      explanation:
        'Bei der Veresterung reagieren Alkohol und Carbonsäure unter Wasserabspaltung zu Ester.',
    },
    {
      id: 'eo-6',
      topic: 'Erdöl und organische Stoffklassen',
      slug: 'erdoel-organische-stoffklassen',
      type: 'multiple-choice',
      question: 'Welches Verfahren trennt Erdöl in Fraktionen?',
      options: ['Filtration', 'Destillation', 'Chromatographie', 'Zentrifugation'],
      correctIndex: 1,
      explanation:
        'Die fraktionierte Destillation nutzt die verschiedenen Siedepunkte der Kohlenwasserstoffe zur Trennung.',
    },
    {
      id: 'eo-7',
      topic: 'Erdöl und organische Stoffklassen',
      slug: 'erdoel-organische-stoffklassen',
      type: 'fill-in-blank',
      question: 'Alkane mit Doppelbindungen nennt man ________.',
      options: [],
      correctAnswer: 'Alkene',
      acceptedAnswers: ['Alkene', 'Alkene (Olefine)', 'Olefine', 'alkene', 'olefine'],
      explanation:
        'Alkene (Olefine) enthalten mindestens eine C=C-Doppelbindung, z.B. Ethen (Ethylen).',
    },
    {
      id: 'eo-8',
      topic: 'Erdöl und organische Stoffklassen',
      slug: 'erdoel-organische-stoffklassen',
      type: 'multiple-select',
      question: 'Welche Verbindungen gehören zu den Kohlenhydraten?',
      options: ['Glucose', 'Ethanol', 'Cellulose', 'Essigsäure', 'Stärke'],
      correctIndices: [0, 2, 4],
      explanation:
        'Glucose, Cellulose und Stärke sind Kohlenhydrate. Ethanol ist ein Alkohol, Essigsäure eine Carbonsäure.',
    },

    // ══════════════════════════════════════════════════════════
    // biochemie
    // ══════════════════════════════════════════════════════════
    {
      id: 'bc-1',
      topic: 'Biochemie',
      slug: 'biochemie',
      type: 'multiple-choice',
      question: 'Welche Moleküle sind die primären Energieträger in Zellen?',
      options: ['Proteine', 'Kohlenhydrate', 'Fette', 'ATP'],
      correctIndex: 3,
      explanation: 'Adenosintriphosphat (ATP) ist der universelle Energieträger in Zellen.',
    },
    {
      id: 'bc-2',
      topic: 'Biochemie',
      slug: 'biochemie',
      type: 'multiple-choice',
      question:
        'Aus wie vielen verschiedenen Aminosäuren bestehen Proteine im menschlichen Körper?',
      options: ['10', '20', '30', '50'],
      correctIndex: 1,
      explanation: 'Es gibt 20 proteinogene Aminosäuren, aus denen Proteine aufgebaut werden.',
    },
    {
      id: 'bc-3',
      topic: 'Biochemie',
      slug: 'biochemie',
      type: 'true-false',
      question: 'Enzyme setzen die Aktivierungsenergie einer Reaktion herab.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: 'Enzyme wirken als Katalysatoren und senken die Aktivierungsenergie.',
    },
    {
      id: 'bc-4',
      topic: 'Biochemie',
      slug: 'biochemie',
      type: 'multiple-choice',
      question: 'Welche Struktur der DNA wurde von Watson und Crick beschrieben?',
      options: ['Einfachhelix', 'Alpha-Helix', 'Doppelhelix', 'Beta-Faltblatt'],
      correctIndex: 2,
      explanation: 'Watson und Crick beschrieben 1953 die Doppelhelix-Struktur der DNA.',
    },
    {
      id: 'bc-5',
      topic: 'Biochemie',
      slug: 'biochemie',
      type: 'fill-in-blank',
      question:
        'Der Vorgang, bei dem Glucose unter Sauerstoffverbrauch zu CO₂ und H₂O abgebaut wird, heißt ________.',
      options: [],
      correctAnswer: 'Zellatmung',
      acceptedAnswers: ['Zellatmung', 'zellatmung'],
      explanation:
        'Bei der Zellatmung wird Glucose zu CO₂ und H₂O abgebaut, wobei Energie (ATP) freigesetzt wird.',
    },
    {
      id: 'bc-6',
      topic: 'Biochemie',
      slug: 'biochemie',
      type: 'multiple-choice',
      question: 'Welches Molekül speichert die genetische Information?',
      options: ['RNA', 'DNA', 'Protein', 'Lipid'],
      correctIndex: 1,
      explanation:
        'Die DNA (Desoxyribonukleinsäure) speichert die genetische Information in Form der Basenfolge.',
    },
    {
      id: 'bc-7',
      topic: 'Biochemie',
      slug: 'biochemie',
      type: 'multiple-choice',
      question: 'Was ist Photosynthese?',
      options: [
        'Abbau von Glucose',
        'Aufbau von Glucose aus CO₂ und H₂O mit Licht',
        'Spaltung von Wasser',
        'Umwandlung von Protein in Zucker',
      ],
      correctIndex: 1,
      explanation:
        '6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂ (mit Lichtenergie). Photosynthese baut Glucose auf.',
    },
    {
      id: 'bc-8',
      topic: 'Biochemie',
      slug: 'biochemie',
      type: 'multiple-select',
      question: 'Welche sind Makromoleküle (Biopolymere)?',
      options: ['DNA', 'Glucose', 'Protein', 'Cellulose', 'Wasser'],
      correctIndices: [0, 2, 3],
      explanation:
        'DNA, Proteine und Cellulose sind Biopolymere. Glucose und Wasser sind kleine Moleküle.',
    },

    // ══════════════════════════════════════════════════════════
    // gleichgewicht-geschwindigkeit (Gleichgewicht und Geschwindigkeit)
    // ══════════════════════════════════════════════════════════
    {
      id: 'gg-1',
      topic: 'Gleichgewicht und Geschwindigkeit',
      slug: 'gleichgewicht-geschwindigkeit',
      type: 'multiple-choice',
      question: 'Welche Zustandsgleichung beschreibt ideale Gase?',
      options: ['pV = nRT', 'E = mc²', 'ΔG = ΔH – TΔS', 'U = Q + W'],
      correctIndex: 0,
      explanation:
        'Das ideale Gasgesetz: pV = nRT (Druck × Volumen = Stoffmenge × Gaskonstante × Temperatur).',
    },
    {
      id: 'gg-2',
      topic: 'Gleichgewicht und Geschwindigkeit',
      slug: 'gleichgewicht-geschwindigkeit',
      type: 'multiple-choice',
      question:
        'Nach Le Chatelier verschiebt sich ein Gleichgewicht bei Temperaturerhöhung in Richtung der…',
      options: [
        'exothermen Reaktion',
        'endothermen Reaktion',
        'Volumenverkleinerung',
        'Druckerhöhung',
      ],
      correctIndex: 1,
      explanation:
        'Temperaturerhöhung → endotherme Richtung (Wärme wird aufgenommen, als wäre Wärme ein Reaktant).',
    },
    {
      id: 'gg-3',
      topic: 'Gleichgewicht und Geschwindigkeit',
      slug: 'gleichgewicht-geschwindigkeit',
      type: 'true-false',
      question: 'Eine exotherme Reaktion gibt Wärme an die Umgebung ab.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: 'Bei exothermen Reaktionen ist ΔH negativ — die Reaktion gibt Wärme ab.',
    },
    {
      id: 'gg-4',
      topic: 'Gleichgewicht und Geschwindigkeit',
      slug: 'gleichgewicht-geschwindigkeit',
      type: 'multiple-choice',
      question: 'Wie beeinflusst ein Katalysator das chemische Gleichgewicht?',
      options: [
        'Verschiebt es auf die Produktseite',
        'Verschiebt es auf die Eduktseite',
        'Verändert es nicht, beschleunigt nur die Einstellung',
        'Erhöht die Temperatur',
      ],
      correctIndex: 2,
      explanation:
        'Ein Katalysator beschleunigt Hin- und Rückreaktion gleichermaßen — das Gleichgewicht bleibt unverändert, wird aber schneller erreicht.',
    },
    {
      id: 'gg-5',
      topic: 'Gleichgewicht und Geschwindigkeit',
      slug: 'gleichgewicht-geschwindigkeit',
      type: 'fill-in-blank',
      question:
        'Die Geschwindigkeit einer chemischen Reaktion wird durch die ________ beschrieben.',
      options: [],
      correctAnswer: 'Reaktionskinetik',
      acceptedAnswers: ['Reaktionskinetik', 'Kinetik', 'reaktionskinetik', 'kinetik'],
      explanation: 'Die Reaktionskinetik untersucht die Geschwindigkeit von chemischen Reaktionen.',
    },
    {
      id: 'gg-6',
      topic: 'Gleichgewicht und Geschwindigkeit',
      slug: 'gleichgewicht-geschwindigkeit',
      type: 'multiple-choice',
      question: 'Was passiert mit der Reaktionsgeschwindigkeit bei Temperaturerhöhung um 10 K?',
      options: [
        'Sie halbiert sich',
        'Sie verdoppelt sich etwa',
        'Sie bleibt gleich',
        'Sie wird null',
      ],
      correctIndex: 1,
      explanation:
        'RGT-Regel: Reaktionsgeschwindigkeit verdoppelt sich etwa bei 10 K Temperaturerhöhung.',
    },
    {
      id: 'gg-7',
      topic: 'Gleichgewicht und Geschwindigkeit',
      slug: 'gleichgewicht-geschwindigkeit',
      type: 'multiple-choice',
      question: 'Was gibt das Massenwirkungsgesetz (MWG) an?',
      options: [
        'Die Reaktionsenthalpie',
        'Das Gleichgewichtsverhältnis der Konzentrationen',
        'Die Aktivierungsenergie',
        'Die Reaktionsordnung',
      ],
      correctIndex: 1,
      explanation:
        'Das MWG: K = Π(cᵢ)ᵛⁱ. Es beschreibt das Verhältnis der Produkt- zur Eduktkonzentration im Gleichgewicht.',
    },
    {
      id: 'gg-8',
      topic: 'Gleichgewicht und Geschwindigkeit',
      slug: 'gleichgewicht-geschwindigkeit',
      type: 'multiple-choice',
      question: 'Welche Größe ist ein Maß für die Unordnung eines Systems?',
      options: ['Enthalpie', 'Entropie', 'Freie Enthalpie', 'Innere Energie'],
      correctIndex: 1,
      explanation:
        'Die Entropie (S) ist ein Maß für die Unordnung bzw. die Anzahl der Mikrozustände eines Systems.',
    },

    // ══════════════════════════════════════════════════════════
    // energetik
    // ══════════════════════════════════════════════════════════
    {
      id: 'en-1',
      topic: 'Energetik',
      slug: 'energetik',
      type: 'multiple-choice',
      question: 'Was beschreibt die Reaktionsenthalpie (ΔH)?',
      options: [
        'Die Temperaturänderung',
        'Die Wärmetönung bei konstantem Druck',
        'Die Geschwindigkeit',
        'Die Entropie',
      ],
      correctIndex: 1,
      explanation:
        'Die Reaktionsenthalpie ΔH ist die Wärme, die bei einer Reaktion bei konstantem Druck auftritt.',
    },
    {
      id: 'en-2',
      topic: 'Energetik',
      slug: 'energetik',
      type: 'true-false',
      question:
        'Der Hesssche Satz besagt, dass die Reaktionsenthalpie unabhängig vom Reaktionsweg ist.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: 'Der Hesssche Satz: ΔH ist eine Zustandsgröße und daher wegunabhängig.',
    },
    {
      id: 'en-3',
      topic: 'Energetik',
      slug: 'energetik',
      type: 'multiple-choice',
      question: 'Wann verläuft eine Reaktion spontan?',
      options: ['Wenn ΔH < 0', 'Wenn ΔG < 0', 'Wenn ΔS < 0', 'Wenn T > 0'],
      correctIndex: 1,
      explanation:
        'Eine Reaktion verläuft spontan, wenn die freie Reaktionsenthalpie ΔG = ΔH − TΔS negativ ist.',
    },
    {
      id: 'en-4',
      topic: 'Energetik',
      slug: 'energetik',
      type: 'multiple-choice',
      question: 'Welche Reaktion hat eine negative Reaktionsenthalpie?',
      options: [
        'Endotherme Reaktion',
        'Exotherme Reaktion',
        'Isotherme Reaktion',
        'Adiabatische Reaktion',
      ],
      correctIndex: 1,
      explanation: 'Exotherme Reaktionen geben Wärme ab → ΔH < 0.',
    },
    {
      id: 'en-5',
      topic: 'Energetik',
      slug: 'energetik',
      type: 'fill-in-blank',
      question: 'Die Energie, die benötigt wird, um eine Reaktion zu starten, heißt ________.',
      options: [],
      correctAnswer: 'Aktivierungsenergie',
      acceptedAnswers: ['Aktivierungsenergie', 'aktivierungsenergie', 'EA'],
      explanation:
        'Die Aktivierungsenergie (Eₐ) ist die Mindestenergie, damit eine Reaktion beginnen kann.',
    },
    {
      id: 'en-6',
      topic: 'Energetik',
      slug: 'energetik',
      type: 'multiple-choice',
      question: 'Was passiert bei der Verbrennung von Methan?',
      options: [
        'Es ist endotherm',
        'Es ist exotherm und setzt Energie frei',
        'ΔH = 0',
        'Es entsteht nur Wasser',
      ],
      correctIndex: 1,
      explanation: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O + Energie. Verbrennung ist stark exotherm.',
    },
    {
      id: 'en-7',
      topic: 'Energetik',
      slug: 'energetik',
      type: 'multiple-choice',
      question: 'Was ist ein exothermer Prozess im Alltag?',
      options: ['Schwitzen', 'Kochen', 'Verdampfen', 'Schmelzen'],
      correctIndex: 0,
      explanation:
        'Schwitzen ist exotherm (Körper gibt Wärme ab). Kochen, Verdampfen und Schmelzen sind endotherm.',
    },
    {
      id: 'en-8',
      topic: 'Energetik',
      slug: 'energetik',
      type: 'multiple-choice',
      question: 'Welche Einheit hat die Enthalpie?',
      options: ['Joule (J)', 'Watt (W)', 'Pascal (Pa)', 'Celsius (°C)'],
      correctIndex: 0,
      explanation:
        'Enthalpie hat die Einheit Joule (J) oder Kiljoule (kJ), wie alle Energieformen.',
    },

    // ══════════════════════════════════════════════════════════
    // analytische-methoden (Analytische Methoden)
    // ══════════════════════════════════════════════════════════
    {
      id: 'anam-1',
      topic: 'Analytische Methoden',
      slug: 'analytische-methoden',
      type: 'multiple-choice',
      question: 'Welches Trennverfahren nutzt unterschiedliche Löslichkeiten?',
      options: ['Chromatographie', 'Spektroskopie', 'Massenspektrometrie', 'Elektrophorese'],
      correctIndex: 0,
      explanation:
        'Chromatographie trennt Stoffe durch unterschiedliche Verteilung zwischen stationärer und mobiler Phase.',
    },
    {
      id: 'anam-2',
      topic: 'Analytische Methoden',
      slug: 'analytische-methoden',
      type: 'multiple-choice',
      question: 'Was misst ein Photometer?',
      options: ['Druck', 'Temperatur', 'Lichtabsorption einer Lösung', 'Elektrische Leitfähigkeit'],
      correctIndex: 2,
      explanation:
        'Ein Photometer misst die Absorption von Licht bei einer bestimmten Wellenlänge (Lambert-Beer-Gesetz).',
    },
    {
      id: 'anam-3',
      topic: 'Analytische Methoden',
      slug: 'analytische-methoden',
      type: 'true-false',
      question: 'Bei der Papierchromatographie ist die stationäre Phase das Papier.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: 'Bei der Papierchromatographie ist das Papier (Cellulose) die stationäre Phase.',
    },
    {
      id: 'anam-4',
      topic: 'Analytische Methoden',
      slug: 'analytische-methoden',
      type: 'multiple-choice',
      question: 'Was beschreibt das Lambert-Beer-Gesetz?',
      options: ['c = n/V', 'A = ε · c · d', 'pV = nRT', 'E = hν'],
      correctIndex: 1,
      explanation:
        'Lambert-Beer: Die Absorption A ist proportional zur Konzentration c und Schichtdicke d.',
    },
    {
      id: 'anam-5',
      topic: 'Analytische Methoden',
      slug: 'analytische-methoden',
      type: 'multiple-choice',
      question: 'Welcher Nachweis weist Chlorid-Ionen (Cl⁻) nach?',
      options: ['Flammenprobe', 'Silbernitrat-Lösung', 'Lackmuspapier', 'Universalindikator'],
      correctIndex: 1,
      explanation:
        'AgNO₃ + Cl⁻ → AgCl↓ (weißer Niederschlag). Der Silbernitrat-Nachweis ist spezifisch für Halogenide.',
    },
    {
      id: 'anam-6',
      topic: 'Analytische Methoden',
      slug: 'analytische-methoden',
      type: 'fill-in-blank',
      question:
        'Bei der ________ wird eine unbekannte Lösung durch Zutropfen einer Standardlösung bis zum Äquivalenzpunkt analysiert.',
      options: [],
      correctAnswer: 'Titration',
      acceptedAnswers: ['Titration', 'titration', 'maßanalytische Titration'],
      explanation:
        'Titration ist eine quantitative Bestimmungsmethode durch Zutropfen einer Maßlösung.',
    },
    {
      id: 'anam-7',
      topic: 'Analytische Methoden',
      slug: 'analytische-methoden',
      type: 'multiple-choice',
      question: 'Welches Spektroskopie-Verfahren nutzt UV-Licht?',
      options: [
        'IR-Spektroskopie',
        'UV-Vis-Spektroskopie',
        'NMR-Spektroskopie',
        'Massenspektrometrie',
      ],
      correctIndex: 1,
      explanation:
        'UV-Vis-Spektroskopie nutzt ultraviolettes und sichtbares Licht zur Analyse von Verbindungen.',
    },
    {
      id: 'anam-8',
      topic: 'Analytische Methoden',
      slug: 'analytische-methoden',
      type: 'multiple-choice',
      question: 'Was zeigt der Äquivalenzpunkt bei einer Säure-Base-Titration an?',
      options: [
        'Die maximale Temperatur',
        'Die neutrale Farbe des Indikators',
        'Die vollständige Neutralisation',
        'Das Ende der Reaktionszeit',
      ],
      correctIndex: 2,
      explanation:
        'Am Äquivalenzpunkt ist genau so viel Säure wie Base zugefügt — vollständige Neutralisation.',
    },

    // ══════════════════════════════════════════════════════════
    // reaktionstypen-organisch (Reaktionstypen der Organischen Chemie)
    // ══════════════════════════════════════════════════════════
    {
      id: 'ro-1',
      topic: 'Reaktionstypen der Organischen Chemie',
      slug: 'reaktionstypen-organisch',
      type: 'multiple-choice',
      question: 'Welche Reaktion ist typisch für Alkene?',
      options: ['Substitution', 'Addition', 'Elimination', 'Kondensation'],
      correctIndex: 1,
      explanation: 'Alkene (mit C=C-Doppelbindung) unterliegen bevorzugt Additionsreaktionen.',
    },
    {
      id: 'ro-2',
      topic: 'Reaktionstypen der Organischen Chemie',
      slug: 'reaktionstypen-organisch',
      type: 'multiple-choice',
      question: 'Was ist ein Nucleophil?',
      options: [
        'Ein Elektronenakzeptor',
        'Ein Elektronendonator',
        'Ein neutrales Molekül',
        'Ein Katalysator',
      ],
      correctIndex: 1,
      explanation:
        'Nucleophile sind Elektronendonatoren (elektronenreich), die positive oder partiell positive Zentren angreifen.',
    },
    {
      id: 'ro-3',
      topic: 'Reaktionstypen der Organischen Chemie',
      slug: 'reaktionstypen-organisch',
      type: 'true-false',
      question: 'Eine SN2-Reaktion verläuft über ein Carbenium-Ion als Zwischenstufe.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 1,
      explanation:
        'SN2 ist ein concerted Mechanismus (in einem Schritt). SN1 verläuft über ein Carbenium-Ion.',
    },
    {
      id: 'ro-4',
      topic: 'Reaktionstypen der Organischen Chemie',
      slug: 'reaktionstypen-organisch',
      type: 'multiple-choice',
      question: 'Welche Verbindung entsteht bei der Oxidation eines primären Alkohols?',
      options: ['Alkan', 'Aldehyd', 'Carbonsäure', 'Keton'],
      correctIndex: 1,
      explanation:
        'Oxidation eines primären Alkohols ergibt zunächst einen Aldehyd (und bei weiterer Oxidation eine Carbonsäure).',
    },
    {
      id: 'ro-5',
      topic: 'Reaktionstypen der Organischen Chemie',
      slug: 'reaktionstypen-organisch',
      type: 'fill-in-blank',
      question:
        'Bei der ________ reagiert ein halogenierter Kohlenwasserstoff mit einem Nucleophilen.',
      options: [],
      correctAnswer: 'Substitution',
      acceptedAnswers: ['Substitution', 'Nucleophile Substitution', 'substitution', 'SN1', 'SN2'],
      explanation:
        'Bei der nucleophilen Substitution (SN1 oder SN2) wird ein Halogenatom durch ein Nucleophil ersetzt.',
    },
    {
      id: 'ro-6',
      topic: 'Reaktionstypen der Organischen Chemie',
      slug: 'reaktionstypen-organisch',
      type: 'multiple-choice',
      question: 'Was ist eine Polykondensation?',
      options: [
        'Polymerisation ohne Abspaltung',
        'Polymerisation mit Abspaltung kleiner Moleküle',
        'Zersetzung',
        'Isomerisierung',
      ],
      correctIndex: 1,
      explanation:
        'Bei der Polykondensation verbinden sich Monomere unter Abspaltung von z.B. H₂O oder HCl.',
    },
    {
      id: 'ro-7',
      topic: 'Reaktionstypen der Organischen Chemie',
      slug: 'reaktionstypen-organisch',
      type: 'multiple-choice',
      question: 'Welcher Reaktionstyp ist die Dehydration eines Alkohols?',
      options: ['Addition', 'Elimination', 'Substitution', 'Umlagerung'],
      correctIndex: 1,
      explanation:
        'Dehydration = Abspaltung von Wasser = Elimination. Der Alkohol verliert H₂O und bildet ein Alken.',
    },
    {
      id: 'ro-8',
      topic: 'Reaktionstypen der Organischen Chemie',
      slug: 'reaktionstypen-organisch',
      type: 'multiple-select',
      question: 'Welche Faktoren beeinflussen die Reaktionsgeschwindigkeit?',
      options: ['Temperatur', 'Katalysator', 'Farbe der Edukte', 'Konzentration', 'Druck'],
      correctIndices: [0, 1, 3, 4],
      explanation:
        'Temperatur, Katalysator, Konzentration und Druck beeinflussen die Geschwindigkeit. Die Farbe ist irrelevant.',
    },

    // ══════════════════════════════════════════════════════════
    // produkte-organisch (Produkte der Organischen Chemie)
    // ══════════════════════════════════════════════════════════
    {
      id: 'po-1',
      topic: 'Produkte der Organischen Chemie',
      slug: 'produkte-organisch',
      type: 'multiple-choice',
      question: 'Aus welchem Monomer besteht Polyethen (PE)?',
      options: ['Ethen', 'Propen', 'Styrol', 'Vinylchlorid'],
      correctIndex: 0,
      explanation: 'Polyethen wird durch Polymerisation von Ethen (Ethylen, CH₂=CH₂) gebildet.',
    },
    {
      id: 'po-2',
      topic: 'Produkte der Organischen Chemie',
      slug: 'produkte-organisch',
      type: 'multiple-choice',
      question: 'Was ist Aspirin (Acetylsalicylsäure) chemisch?',
      options: ['Ein Alkohol', 'Ein Ester', 'Ein Polymer', 'Ein Kohlenhydrat'],
      correctIndex: 1,
      explanation: 'Aspirin ist ein Ester der Salicylsäure mit Essigsäure (Acetylsalicylsäure).',
    },
    {
      id: 'po-3',
      topic: 'Produkte der Organischen Chemie',
      slug: 'produkte-organisch',
      type: 'true-false',
      question: 'PVC (Polyvinylchlorid) ist ein Thermoplast.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation: 'PVC ist ein Thermoplast — er wird bei Erwärmung weich und kann geformt werden.',
    },
    {
      id: 'po-4',
      topic: 'Produkte der Organischen Chemie',
      slug: 'produkte-organisch',
      type: 'multiple-choice',
      question: 'Welcher Stoff ist ein wichtiges Lösungsmittel in der Organischen Chemie?',
      options: ['Wasser', 'Ethanol', 'Quecksilber', 'Natriumchlorid'],
      correctIndex: 1,
      explanation:
        'Ethanol ist ein universelles organisches Lösungsmittel für viele polar-organische Verbindungen.',
    },
    {
      id: 'po-5',
      topic: 'Produkte der Organischen Chemie',
      slug: 'produkte-organisch',
      type: 'multiple-choice',
      question: 'Was ist der häufigste biologisch abbaubare Kunststoff?',
      options: ['PVC', 'Polylactid (PLA)', 'Polystyrol', 'Polyethen'],
      correctIndex: 1,
      explanation:
        'PLA (Polylactid) wird aus Maisstärke oder Zuckerrohr hergestellt und ist biologisch abbaubar.',
    },
    {
      id: 'po-6',
      topic: 'Produkte der Organischen Chemie',
      slug: 'produkte-organisch',
      type: 'fill-in-blank',
      question: 'Farbstoffe mit konjugierten Doppelbindungssystemen heißen ________.',
      options: [],
      correctAnswer: 'Chromophore',
      acceptedAnswers: ['Chromophore', 'chromophore', 'Chromophor', 'chromophor'],
      explanation:
        'Chromophore sind funktionelle Gruppen mit konjugierten Doppelbindungen, die Licht absorbieren und Farbe erzeugen.',
    },
    {
      id: 'po-7',
      topic: 'Produkte der Organischen Chemie',
      slug: 'produkte-organisch',
      type: 'multiple-choice',
      question: 'Woraus besteht Nylon?',
      options: [
        'Nur Kohlenstoff',
        'Proteine',
        'Polyamide aus Diaminen und Dicarbonsäuren',
        'Polysaccharide',
      ],
      correctIndex: 2,
      explanation:
        'Nylon ist ein Polyamid, das aus Diaminen und Dicarbonsäuren durch Polykondensation entsteht.',
    },
    {
      id: 'po-8',
      topic: 'Produkte der Organischen Chemie',
      slug: 'produkte-organisch',
      type: 'multiple-select',
      question: 'Welche sind synthetische Polymere?',
      options: ['Cellulose', 'Polyethen', 'Seide', 'Nylon', 'Gummi (Kautschuk)'],
      correctIndices: [1, 3],
      explanation:
        'Polyethen und Nylon sind synthetische Polymere. Cellulose, Seide und Naturkautschuk sind natürlich.',
    },

    // ══════════════════════════════════════════════════════════
    // tipps-tricks (Tipps und Tricks)
    // ══════════════════════════════════════════════════════════
    {
      id: 'tt-1',
      topic: 'Tipps und Tricks',
      slug: 'tipps-tricks',
      type: 'multiple-choice',
      question: 'Wie merkt man sich die Reihenfolge der Redox-Vorgänge?',
      options: [
        'OIL RIG: Oxidation Is Loss, Reduction Is Gain',
        'REDOX: Random Electrons Dance Often',
        'HOIL: Hydrogen Over Iron Loss',
        'Keine Eselsbrücke bekannt',
      ],
      correctIndex: 0,
      explanation: 'OIL RIG: Oxidation Is Loss (of electrons), Reduction Is Gain (of electrons).',
    },
    {
      id: 'tt-2',
      topic: 'Tipps und Tricks',
      slug: 'tipps-tricks',
      type: 'multiple-choice',
      question: 'Wie merkt man sich die Säure-Base-Reihe?',
      options: [
        'LiNaKCaBa → starke Basen',
        'OFRClBrI → schwache Basen',
        'CHONP → starke Säuren',
        'Alkali-Erdalkali-Edelgas',
      ],
      correctIndex: 0,
      explanation:
        'Die Säure-Base-Reihe: Je weiter links im Periodensystem, desto stärker basisch (Li > Na > K).',
    },
    {
      id: 'tt-3',
      topic: 'Tipps und Tricks',
      slug: 'tipps-tricks',
      type: 'true-false',
      question:
        'Bei der Strichmethode zum Ausgleichen von Reaktionsgleichungen arbeitet man systematisch Element für Element.',
      options: ['Richtig', 'Falsch'],
      correctIndex: 0,
      explanation:
        'Die Strichmethode: Jedes Element wird nacheinander ausgeglichen, zuletzt oft H und O.',
    },
    {
      id: 'tt-4',
      topic: 'Tipps und Tricks',
      slug: 'tipps-tricks',
      type: 'multiple-choice',
      question: 'Welche Lernmethode nutzt die Verteilung des Lernens über mehrere Tage?',
      options: ['Massed Practice', 'Spaced Repetition', 'Rote Faden Methode', 'Mind Mapping'],
      correctIndex: 1,
      explanation:
        'Spaced Repetition verteilt das Wiederholen über wachsende Abstände — ideal für langfristiges Behalten.',
    },
    {
      id: 'tt-5',
      topic: 'Tipps und Tricks',
      slug: 'tipps-tricks',
      type: 'fill-in-blank',
      question:
        'Der Ozon-Kegel zum Vergleichen der Stärke von Oxidationsmitteln lautet: F₂ > Cl₂ > Br₂ > I₂. Das bezeichnet man als ________.',
      options: [],
      correctAnswer: 'Elektrochemische Spannungsreihe',
      acceptedAnswers: [
        'Elektrochemische Spannungsreihe',
        'Spannungsreihe',
        'elektrochemische Spannungsreihe',
        'Redoxreihe',
      ],
      explanation:
        'Die elektrochemische Spannungsreihe ordnet Redoxpaare nach ihrem Normalpotential.',
    },
    {
      id: 'tt-6',
      topic: 'Tipps und Tricks',
      slug: 'tipps-tricks',
      type: 'multiple-choice',
      question: 'Wie merkt man sich die Alkane (C1-C10)?',
      options: [
        'Meth-, Eth-, Prop-, But-, Pent-, Hex-, Hept-, Oct-, Non-, Dec-',
        'Mono-, Di-, Tri-, Tetra-, Penta-',
        'Alpha, Beta, Gamma, Delta',
        'Erst-, Zweit-, Dritt-',
      ],
      correctIndex: 0,
      explanation:
        'Methan(1), Ethan(2), Propan(3), Butan(4), Pentan(5), Hexan(6), Heptan(7), Octan(8), Nonan(9), Decan(10).',
    },
  ];

  // Expose as browser global
  window.quizQuestions = questions;
  window.quizTopics = [
    'Einführung in die Chemie',
    'Aufbau der Materie',
    'Anorganische Verbindungen',
    'Säuren und Basen',
    'Redoxreaktionen und Elektrochemie',
    'Erdöl und organische Stoffklassen',
    'Biochemie',
    'Gleichgewicht und Geschwindigkeit',
    'Energetik',
    'Analytische Methoden',
    'Reaktionstypen der Organischen Chemie',
    'Produkte der Organischen Chemie',
    'Tipps und Tricks',
  ];
})();
