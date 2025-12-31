/**
 * Quiz Data: Erdöl und Organische Stoffklassen
 * Interactive quiz questions for the Erdöl und Organische Stoffklassen topic
 */

const quizData_erdoel_organische_stoffklassen = {
  title: "Quiz: Erdöl und Organische Stoffklassen",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Was ist der Hauptbestandteil von Erdöl?",
      options: [
        "Kohlenwasserstoffe",
        "Alkohole",
        "Säuren",
        "Salze"
      ],
      correctAnswer: 0,
      explanation: "Erdöl besteht hauptsächlich aus Kohlenwasserstoffen (Alkanen, Cycloalkanen, aromatischen Kohlenwasserstoffen)."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Welches ist die einfachste organische Verbindung?",
      options: [
        "Methan (CH₄)",
        "Ethan (C₂H₆)",
        "Ethen (C₂H₄)",
        "Benzol (C₆H₆)"
      ],
      correctAnswer: 0,
      explanation: "Methan (CH₄) ist der einfachste Kohlenwasserstoff mit nur einem Kohlenstoffatom."
    },
    {
      id: 3,
      type: "true-false",
      question: "Alkane sind gesättigte Kohlenwasserstoffe.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Alkane sind gesättigte Kohlenwasserstoffe mit nur Einfachbindungen (CnH2n+2)."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Was ist der Unterschied zwischen Alkanen und Alkenen?",
      options: [
        "Alkane haben Doppelbindungen, Alkene nicht",
        "Alkene haben mindestens eine Doppelbindung, Alkane nur Einfachbindungen",
        "Alkene sind cyclisch, Alkane nicht",
        "Es gibt keinen Unterschied"
      ],
      correctAnswer: 1,
      explanation: "Alkene sind ungesättigte Kohlenwasserstoffe mit mindestens einer C=C-Doppelbindung. Alkane haben nur Einfachbindungen."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Welche funktionelle Gruppe hat die Formel -OH?",
      options: [
        "Aldehyde",
        "Ketone",
        "Alkohole",
        "Carbonsäuren"
      ],
      correctAnswer: 2,
      explanation: "Die Hydroxylgruppe (-OH) charakterisiert Alkohole (z.B. Ethanol C₂H₅OH)."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was sind Aromaten?",
      options: [
        "Duftstoffe",
        "Cyclische Kohlenwasserstoffe mit konjugierten Doppelbindungen",
        "Gesättigte Kohlenwasserstoffe",
        "Aliphatische Verbindungen"
      ],
      correctAnswer: 1,
      explanation: "Aromaten sind cyclische Kohlenwasserstoffe mit einem System aus konjugierten Doppelbindungen (z.B. Benzol C₆H₆)."
    },
    {
      id: 7,
      type: "fill-blank",
      question: "Die allgemeine Formel für Alkane ist _______.",
      correctAnswer: "CnH2n+2",
      explanation: "Alkane haben die allgemeine Summenformel CnH2n+2 (z.B. Methan CH₄, Ethan C₂H₆, Propan C₃H₈)."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Welches ist ein wichtiges Produkt der Erdölraffinerie?",
      options: [
        "Sauerstoff",
        "Benzin",
        "Wasser",
        "Kochsalz"
      ],
      correctAnswer: 1,
      explanation: "Benzin ist ein wichtiges Produkt der Erdölraffinerie, gewonnen durch Destillation von Erdöl."
    },
    {
      id: 9,
      type: "multiple-choice",
      question: "Was sind Ester?",
      options: [
        "Verbindungen mit einer C=O Doppelbindung und einer OH-Gruppe",
        "Verbindungen aus Säure und Alkohol",
        "Salze der Carbonsäuren",
        "Alkohole mit Doppelbindungen"
      ],
      correctAnswer: 1,
      explanation: "Ester entstehen aus der Reaktion einer Carbonsäure mit einem Alkohol (Veresterung). Sie haben die funktionelle Gruppe -COO-."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Welches ist die charakteristische Gruppe von Carbonsäuren?",
      options: [
        "-OH (Hydroxyl)",
        "-COOH (Carboxyl)",
        "-CHO (Aldehyd)",
        "-CO- (Keton)"
      ],
      correctAnswer: 1,
      explanation: "Carbonsäuren enthalten die Carboxylgruppe -COOH (z.B. Essigsäure CH₃COOH)."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('erdoel-organische-stoffklassen', quizData_erdoel_organische_stoffklassen);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_erdoel_organische_stoffklassen;
}
