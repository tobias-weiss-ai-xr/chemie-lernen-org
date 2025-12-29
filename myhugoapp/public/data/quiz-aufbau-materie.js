/**
 * Quiz Data: Aufbau der Materie
 * Interactive quiz questions for the Aufbau der Materie topic
 */

const quizData_aufbau_materie = {
  title: "Quiz: Aufbau der Materie",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Aus welchen drei wichtigen Elementarteilchen bestehen Atome?",
      options: [
        "Protonen, Neutronen, Elektronen",
        "Protonen, Ionen, Elektronen",
        "Kerne, Hülle, Elektronen",
        "Atome, Moleküle, Ionen"
      ],
      correctAnswer: 0,
      explanation: "Atome bestehen aus Protonen (positiv), Neutronen (neutral) im Kern und Elektronen (negativ) in der Hülle."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Was bestimmt die Ordnungszahl eines Elements?",
      options: [
        "Die Anzahl der Neutronen",
        "Die Anzahl der Protonen",
        "Die Anzahl der Elektronen",
        "Die Summe aus Protonen und Neutronen"
      ],
      correctAnswer: 1,
      explanation: "Die Ordnungszahl (Protonenzahl Z) bestimmt das Element. Jedes Element hat eine eindeutige Protonenzahl."
    },
    {
      id: 3,
      type: "multiple-choice",
      question: "Wie lautet die Massenzahl A eines Atoms?",
      options: [
        "Anzahl der Protonen",
        "Anzahl der Neutronen",
        "Anzahl der Elektronen",
        "Anzahl der Protonen + Neutronen"
      ],
      correctAnswer: 3,
      explanation: "Die Massenzahl A = Protonenzahl + Neutronenzahl. Bei Kohlenstoff-12: A = 6 + 6 = 12."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Welches Atommodell führte das Konzept der diskreten Elektronenbahnen ein?",
      options: [
        "Daltons Atommodell",
        "Thomsons Atommodell",
        "Bohrsches Atommodell",
        "Orbitalmodell"
      ],
      correctAnswer: 2,
      explanation: "Niels Bohr führte 1913 das Konzept der diskreten Elektronenbahnen (Schalen) ein, auf denen Elektronen ohne Energieabgabe kreisen."
    },
    {
      id: 5,
      type: "true-false",
      question: "Bei der Ionenbindung werden Elektronen vollständig übertragen.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Bei der Ionenbindung gibt ein Metall Elektronen ab (Kation) und ein Nichtmetall nimmt sie auf (Anion)."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was ist ein Isotop?",
      options: [
        "Ein Atom mit anderer Protonenzahl",
        "Ein Atom mit anderer Neutronenzahl",
        "Ein Atom mit anderer Elektronenzahl",
        "Ein geladenes Atom"
      ],
      correctAnswer: 1,
      explanation: "Isotope sind Atome desselben Elements (gleiche Protonenzahl) mit unterschiedlicher Neutronenzahl."
    },
    {
      id: 7,
      type: "multiple-choice",
      question: "Welche Gruppe im Periodensystem nennt man 'Edelgase'?",
      options: [
        "Gruppe 1 (Alkalimetalle)",
        "Gruppe 2 (Erdalkalimetalle)",
        "Gruppe 17 (Halogene)",
        "Gruppe 18 (Edelgase)"
      ],
      correctAnswer: 3,
      explanation: "Edelgase (Gruppe 18) sind sehr reaktionsträge due zu ihrer vollbesetzten äußeren Elektronenschale."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Welche Bindungsart beruht auf der共用 Nutzung von Elektronenpaaren?",
      options: [
        "Ionenbindung",
        "Atombindung (Kovalente Bindung)",
        "Metallische Bindung",
        "Van-der-Waals-Kraft"
      ],
      correctAnswer: 1,
      explanation: "Bei der Atombindung werden Elektronenpaare gemeinsam genutzt (z.B. H-H, H-O-H)."
    },
    {
      id: 9,
      type: "fill-blank",
      question: "Vervollständigen Sie: Das Element mit der Ordnungszahl 6 ist _______.",
      correctAnswer: "Kohlenstoff",
      explanation: "Das Element mit Ordnungszahl 6 ist Kohlenstoff (C)."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Was ist die Oxidationszahl von Sauerstoff in meisten Verbindungen?",
      options: [
        "-2",
        "-1",
        "0",
        "+2"
      ],
      correctAnswer: 0,
      explanation: "Sauerstoff hat in meisten Verbindungen die Oxidationszahl -2 (Ausnahmen: Peroxide mit -1)."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('aufbau-materie', quizData_aufbau_materie);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_aufbau_materie;
}
