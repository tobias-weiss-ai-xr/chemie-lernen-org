/**
 * Quiz Data: Anorganische Verbindungen
 * Interactive quiz questions for the Anorganische Verbindungen topic
 */

const quizData_anorganische_verbindungen = {
  title: "Quiz: Anorganische Verbindungen",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Was entsteht bei einer Neutralisationsreaktion?",
      options: [
        "Nur Salz",
        "Nur Wasser",
        "Salz und Wasser",
        "Säure und Base"
      ],
      correctAnswer: 2,
      explanation: "Bei der Neutralisation reagieren Säure und Base zu Salz und Wasser: Säure + Base → Salz + Wasser."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Welcher Stoff ist ein starkes Elektrolyt?",
      options: [
        "Essigsäure (CH₃COOH)",
        "Salzsäure (HCl)",
        "Kohlensäure (H₂CO₃)",
        "Ammoniak (NH₃)"
      ],
      correctAnswer: 1,
      explanation: "Salzsäure (HCl) ist eine starke Säure und dissoziiert in Wasser vollständig zu einem starken Elektrolyten."
    },
    {
      id: 3,
      type: "true-false",
      question: "Alle Nitrate sind in Wasser gut löslich.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Alle Nitrate (NO₃⁻) sind in Wasser gut löslich, unabhängig vom Kation."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Was ist ein Kation?",
      options: [
        "Ein positiv geladenes Ion",
        "Ein negativ geladenes Ion",
        "Ein neutrales Teilchen",
        "Ein Molekül"
      ],
      correctAnswer: 0,
      explanation: "Ein Kation ist ein positiv geladenes Ion (z.B. Na⁺, Ca²⁺, Al³⁺), das durch Abgabe von Elektronen entsteht."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Welche Reaktion entsteht bei der Fällung von Silberchlorid?",
      options: [
        "Ag⁺ + Cl⁻ → AgCl (farblos)",
        "Ag⁺ + Cl⁻ → AgCl (weißer Niederschlag)",
        "Ag⁺ + Cl⁻ → AgCl₂ (gelb)",
        "Ag + Cl → AgCl (grün)"
      ],
      correctAnswer: 1,
      explanation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃. Silberchlorid fällt als weißer Niederschlag aus."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was ist die Lewis-Formel von Wasser?",
      options: [
        "H-O-H",
        "H=O=H",
        "H-O-H mit zwei freien Elektronenpaaren am Sauerstoff",
        "H≡O≡H"
      ],
      correctAnswer: 2,
      explanation: "Wasser (H-O-H) hat zwei freie Elektronenpaare am Sauerstoff, was zu einer gewinkelten Struktur führt."
    },
    {
      id: 7,
      type: "fill-blank",
      question: "Die chemische Formel von Kochsalz ist _______.",
      correctAnswer: "NaCl",
      explanation: "Kochsalz ist Natriumchlorid mit der Formel NaCl."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Welche Aussage über Komplexe ist richtig?",
      options: [
        "Komplexe haben nur ein Zentralatom",
        "Komplexe haben nur Liganden",
        "Komplexe bestehen aus Zentralatom und Liganden",
        "Komplexe sind immer unlöslich"
      ],
      correctAnswer: 2,
      explanation: "Komplexe bestehen aus einem Zentralatom (meist Metall) und umgebenden Liganden (Moleküle oder Ionen)."
    },
    {
      id: 9,
      type: "multiple-choice",
      question: "Welches Gas entsteht bei der Reaktion von Carbonat mit Säure?",
      options: [
        "Wasserstoff (H₂)",
        "Sauerstoff (O₂)",
        "Kohlendioxid (CO₂)",
        "Stickstoff (N₂)"
      ],
      correctAnswer: 2,
      explanation: "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑. Carbonate reagieren mit Säuren unter CO₂-Entwicklung."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Was ist das Haber-Bosch-Verfahren?",
      options: [
        "Herstellung von Schwefelsäure",
        "Herstellung von Ammoniak",
        "Herstellung von Salpetersäure",
        "Herstellung von Natronlauge"
      ],
      correctAnswer: 1,
      explanation: "Das Haber-Bosch-Verfahren synthesiert Ammoniak aus Stickstoff und Wasserstoff: N₂ + 3H₂ ⇌ 2NH₃."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('anorganische-verbindungen', quizData_anorganische_verbindungen);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_anorganische_verbindungen;
}
