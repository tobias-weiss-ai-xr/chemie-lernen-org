/**
 * Quiz Data: Einführung in die Chemie
 * Interactive quiz questions for the Einführung in die Chemie topic
 */

const quizData_einfuehrung_chemie = {
  title: "Quiz: Einführung in die Chemie",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Was ist die einfachste Definition von Chemie?",
      options: [
        "Die Lehre von lebenden Organismen",
        "Die Lehre vom Aufbau, den Eigenschaften und der Umwandlung von Stoffen",
        "Die Lehre von Bewegung und Kräften",
        "Die Lehre von Zahlen und Formeln"
      ],
      correctAnswer: 1,
      explanation: "Die Chemie ist die Lehre vom Aufbau, den Eigenschaften und der Umwandlung der Stoffe sowie den dabei auftretenden Energien."
    },
    {
      id: 2,
      type: "true-false",
      question: "Ein Stoff ist alles, was Masse hat und Raum einnimmt.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Dies ist die grundlegende Definition eines Stoffes in der Chemie."
    },
    {
      id: 3,
      type: "multiple-choice",
      question: "Welcher der folgenden ist kein Aggregatzustand?",
      options: [
        "Fest",
        "Flüssig",
        "Gasförmig",
        "Kristallin"
      ],
      correctAnswer: 3,
      explanation: "Es gibt nur drei Aggregatzustände: fest, flüssig und gasförmig. 'Kristallin' beschreibt eine Struktur, keinen Zustand."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Was ist ein chemisches Element?",
      options: [
        "Ein Stoff, der durch chemische Methoden nicht zerlegt werden kann",
        "Ein Gemisch aus verschiedenen Stoffen",
        "Eine chemische Verbindung",
        "Ein Lösungsmittel"
      ],
      correctAnswer: 0,
      explanation: "Ein chemisches Element ist ein Reinstoff, der durch chemische Methoden nicht in einfachere Stoffe zerlegt werden kann."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Was ist eine chemische Verbindung?",
      options: [
        "Ein Gemisch aus verschiedenen Elementen",
        "Ein Stoff, der aus Atomen zweier oder mehrerer Elemente besteht",
        "Ein reines Element",
        "Ein physikalisches Gemisch"
      ],
      correctAnswer: 1,
      explanation: "Eine chemische Verbindung besteht aus Atomen zweier oder mehrerer Elemente, die in einem festen Massenverhältnis verbunden sind."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Welches ist ein Beispiel für ein physikalisches Gemisch?",
      options: [
        "Wasser (H₂O)",
        "Kochsalz (NaCl)",
        "Luft",
        "Sauerstoff (O₂)"
      ],
      correctAnswer: 2,
      explanation: "Luft ist ein physikalisches Gemisch aus Stickstoff, Sauerstoff, Kohlendioxid und anderen Gasen. Wasser und Kochsalz sind chemische Verbindungen."
    },
    {
      id: 7,
      type: "fill-blank",
      question: "Der kleinste Teil eines chemischen Elements, der noch dessen Eigenschaften besitzt, heißt _______.",
      correctAnswer: "Atom",
      explanation: "Atome sind die kleinsten Teilchen eines Elements, die noch dessen chemische Eigenschaften besitzen."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Was beschreibt das Gesetz der konstanten Proportionen?",
      options: [
        "Stoffe setzen sich immer aus gleichen Teilen zusammen",
        "Bei einer chemischen Verbindung sind die Massenverhältnisse der Elemente konstant",
        "Alle Stoffe mischen sich in jedem Verhältnis",
        "Die Masse eines Stoffes ist immer konstant"
      ],
      correctAnswer: 1,
      explanation: "Das Gesetz der konstanten Proportionen besagt, dass eine chemische Verbindung stets aus gleichen Massenteilen der Elemente besteht."
    },
    {
      id: 9,
      type: "true-false",
      question: "Bei einer physikalischen Veränderung entsteht ein neuer Stoff.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 1,
      explanation: "Falsch! Bei einer physikalischen Veränderung (z.B. Schmelzen) entstehen keine neuen Stoffe. Erst bei einer chemischen Reaktion entstehen neue Stoffe."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Welches Symbol steht für das Element Gold?",
      options: [
        "Go",
        "Gd",
        "Au",
        "Ag"
      ],
      correctAnswer: 2,
      explanation: "Das Symbol für Gold ist Au (vom lateinischen 'Aurum'). Ag ist Silber, Gd ist Gadolinium."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('einfuehrung-chemie', quizData_einfuehrung_chemie);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_einfuehrung_chemie;
}
