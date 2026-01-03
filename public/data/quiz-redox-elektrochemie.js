/**
 * Quiz Data: Redoxreaktionen und Elektrochemie
 * Interactive quiz questions for the Redoxreaktionen und Elektrochemie topic
 */

const quizData_redox_elektrochemie = {
  title: "Quiz: Redoxreaktionen und Elektrochemie",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Was bedeutet Oxidation?",
      options: [
        "Aufnahme von Elektronen",
        "Abgabe von Elektronen",
        "Aufnahme von Protonen",
        "Abgabe von Protonen"
      ],
      correctAnswer: 1,
      explanation: "Oxidation bedeutet Abgabe von Elektronen. Eine Erinnerung: 'OIL RIG' = Oxidation Is Loss."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Welches Metall ist das stärkste Reduktionsmittel?",
      options: [
        "Kupfer (Cu)",
        "Silber (Ag)",
        "Gold (Au)",
        "Natrium (Na)"
      ],
      correctAnswer: 3,
      explanation: "Natrium (Na) gibt sehr leicht Elektronen ab und ist daher ein starkes Reduktionsmittel."
    },
    {
      id: 3,
      type: "true-false",
      question: "In einer galvanischen Zelle wird chemische Energie in elektrische Energie umgewandelt.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Galvanische Zellen (Batterien) wandeln chemische Energie in elektrische Energie um."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Was passiert an der Anode einer galvanischen Zelle?",
      options: [
        "Reduktion",
        "Oxidation",
        "Neutralisation",
        "Fällung"
      ],
      correctAnswer: 1,
      explanation: "An der Anode findet immer Oxidation statt (Elektronenabgabe). Merkregel: 'Anode Oxidation'."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Welche Reaktion describes Rosten von Eisen?",
      options: [
        "2Fe + O₂ → 2FeO",
        "4Fe + 3O₂ → 2Fe₂O₃",
        "Fe + O₂ → FeO₂",
        "2Fe + 2O₂ → 2FeO₃"
      ],
      correctAnswer: 1,
      explanation: "Rosten ist die Oxidation von Eisen: 4Fe + 3O₂ → 2Fe₂O₃ (Eisen(III)-oxid, Rost)."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was ist die Nernst-Gleichung?",
      options: [
        "Berechnung der Reaktionsgeschwindigkeit",
        "Berechnung der Zellspannung unter Nicht-Standardbedingungen",
        "Berechnung der Entropie",
        "Berechnung der Enthalpie"
      ],
      correctAnswer: 1,
      explanation: "Die Nernst-Gleichung E = E° - (RT/nF)·ln(Q) berechnet die Zellspannung unter realen Bedingungen."
    },
    {
      id: 7,
      type: "fill-blank",
      question: "Bei der Elektrolyse wird _______ Energie zugeführt, um eine chemische Reaktion zu erzwingen.",
      correctAnswer: "elektrische",
      explanation: "Bei der Elektrolyse wird elektrische Energie zugeführt, um eine nicht-spontane Reaktion zu erzwingen."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Welcher Akku-Typ wird in den meisten Handys verwendet?",
      options: [
        "Blei-Akku",
        "Nickel-Cadmium-Akku",
        "Lithium-Ionen-Akku",
        "Zink-Kohle-Element"
      ],
      correctAnswer: 2,
      explanation: "Lithium-Ionen-Akkus werden in Handys, Laptops und E-Autos verwendet (hohe Energiedichte)."
    },
    {
      id: 9,
      type: "multiple-choice",
      question: "Was ist die Funktion eines Katalysators?",
      options: [
        "Erhöht die Aktivierungsenergie",
        "Senkt die Aktivierungsenergie",
        "Verbraucht sich bei der Reaktion",
        "Verschiebt das Gleichgewicht"
      ],
      correctAnswer: 1,
      explanation: "Ein Katalysator senkt die Aktivierungsenergie und beschleunigt die Reaktion, ohne selbst verbraucht zu werden."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Welche Stoffe entstehen bei der Elektrolyse von Wasser?",
      options: [
        "Wasserstoff und Sauerstoff",
        "Nur Wasserstoff",
        "Nur Sauerstoff",
        "Wasserstoff und Stickstoff"
      ],
      correctAnswer: 0,
      explanation: "2H₂O → 2H₂ + O₂. Bei der Elektrolyse wird Wasser in Wasserstoff (Kathode) und Sauerstoff (Anode) zerlegt."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('redox-elektrochemie', quizData_redox_elektrochemie);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_redox_elektrochemie;
}
