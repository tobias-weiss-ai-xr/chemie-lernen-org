/**
 * Quiz Data: Säuren und Basen
 * Interactive quiz questions for the Säuren und Basen topic
 */

const quizData_saeuren_basen = {
  title: "Quiz: Säuren und Basen",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Was ist die Definition einer Säure nach Brønsted?",
      options: [
        "Ein Stoff, der Protonen (H⁺) abgeben kann",
        "Ein Stoff, der Protonen (H⁺) aufnehmen kann",
        "Ein Stoff, der Elektronen abgeben kann",
        "Ein Stoff, der Elektronen aufnehmen kann"
      ],
      correctAnswer: 0,
      explanation: "Nach Brønsted ist eine Säure ein Stoff, der Protonen (H⁺) abgeben kann."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Welchen pH-Wert hat eine 0.01 mol/L Salzsäure (HCl) Lösung?",
      options: [
        "pH = 1",
        "pH = 2",
        "pH = 3",
        "pH = 12"
      ],
      correctAnswer: 1,
      explanation: "HCl ist eine starke Säure und dissoziiert vollständig: [H₃O⁺] = 0.01 mol/L. pH = -log(0.01) = 2."
    },
    {
      id: 3,
      type: "true-false",
      question: "Bei einer Neutralisation reagieren Säure und Base zu Salz und Wasser.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Die Neutralisationsgleichung lautet: Säure + Base → Salz + Wasser."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Was ist ein Puffer?",
      options: [
        "Eine Lösung, die ihren pH-Wert bei Zugabe von Säuren oder Basen nur wenig ändert",
        "Eine sehr starke Säure",
        "Eine sehr starke Base",
        "Ein Indikator für pH-Werte"
      ],
      correctAnswer: 0,
      explanation: "Ein Puffer ist eine Lösung, die ihren pH-Wert bei Zugabe von Säuren oder Basen stabil hält."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Welcher Indikator zeigt von farblos nach rot im basischen Bereich an?",
      options: [
        "Methylorange",
        "Bromthymolblau",
        "Phenolphthalein",
        "Universalindikator"
      ],
      correctAnswer: 2,
      explanation: "Phenolphthalein ist farblos im sauren Bereich und wird rot im basischen Bereich (pH 8.3-10.0)."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was ist der pKa-Wert?",
      options: [
        "Ein Maß für die Säurestärke",
        "Ein Maß für die Basenstärke",
        "Ein Maß für die Pufferkapazität",
        "Ein Maß für die Ionenstärke"
      ],
      correctAnswer: 0,
      explanation: "Der pKa-Wert (pKa = -log Ka) gibt die Stärke einer Säure an. Je kleiner der pKa, desto stärker die Säure."
    },
    {
      id: 7,
      type: "fill-blank",
      question: "Vervollständigen Sie: Neutralisationsreaktionen sind fast immer _______ (wärmeabgebend).",
      correctAnswer: "exotherm",
      explanation: "Neutralisationsreaktionen sind fast immer exotherm mit ΔH = -57.6 kJ/mol für H⁺ + OH⁻ → H₂O."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Welche der folgenden ist eine starke Säure?",
      options: [
        "Essigsäure (CH₃COOH)",
        "Salzsäure (HCl)",
        "Kohlensäure (H₂CO₃)",
        "Phosphorsäure (H₃PO₄)"
      ],
      correctAnswer: 1,
      explanation: "HCl ist eine starke Säure, die in Wasser vollständig dissoziiert. Die anderen sind schwache Säuren."
    },
    {
      id: 9,
      type: "true-false",
      question: "Die pH-Skala ist logarithmisch: Ein pH-Unterschied von 1 bedeutet einen zehnfachen Unterschied in der H₃O⁺-Konzentration.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Die pH-Skala ist logarithmisch. pH 3 hat z.B. die 10-fache H₃O⁺-Konzentration von pH 4."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Was passiert bei Zugabe von Säure zu einem Acetat-Puffer?",
      options: [
        "Das Acetat-Ion bindet die zugefügten Protonen",
        "Die Essigsäure gibt Protonen ab",
        "Der pH-Wert ändert sich stark",
        "Der Puffer wird zerstört"
      ],
      correctAnswer: 0,
      explanation: "Bei Zugabe von Säure reagiert das Acetat-Ion (CH₃COO⁻) mit den Protonen zu Essigsäure (CH₃COOH), wodurch der pH-Wert stabil bleibt."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('saeuren-basen', quizData_saeuren_basen);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_saeuren_basen;
}
