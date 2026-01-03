/**
 * Quiz Data: Energetik
 * Interactive quiz questions for the Energetik topic
 */

const quizData_energetik = {
  title: "Quiz: Energetik",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Was ist eine exotherme Reaktion?",
      options: [
        "Eine Reaktion, die Energie aufnimmt",
        "Eine Reaktion, die Energie abgibt",
        "Eine Reaktion ohne Energieänderung",
        "Eine Reaktion, die nur bei hohen Temperaturen läuft"
      ],
      correctAnswer: 1,
      explanation: "Exotherme Reaktionen geben Energie ab (meist als Wärme). ΔH < 0."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Was ist die Reaktionsenthalpie ΔH?",
      options: [
        "Die Aktivierungsenergie",
        "Die Änderung der Enthalpie bei einer Reaktion",
        "Die Reaktionsgeschwindigkeit",
        "Die Gleichgewichtskonstante"
      ],
      correctAnswer: 1,
      explanation: "Die Reaktionsenthalpie ΔH ist die Änderung der Enthalpie bei einer Reaktion bei konstantem Druck."
    },
    {
      id: 3,
      type: "true-false",
      question: "Der Hesssche Satz erlaubt die Berechnung von Reaktionsenthalpien aus已知 Werten.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Der Hesssche Satz besagt, dass die Reaktionsenthalpie unabhängig vom Reaktionsweg ist."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Was ist die Aktivierungsenergie?",
      options: [
        "Die Energie, die bei der Reaktion freigesetzt wird",
        "Die Energiedifferenz zwischen Produkten und Reaktanden",
        "Die minimale Energie, die für eine Reaktion benötigt wird",
        "Die Energie, die ein Katalysator liefert"
      ],
      correctAnswer: 2,
      explanation: "Die Aktivierungsenergie Ea ist die Energiedifferenz zwischen Reaktanden und dem Übergangszustand."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Welche Aussage zur Spontaneität von Reaktionen ist richtig?",
      options: [
        "Exotherme Reaktionen sind immer spontan",
        "Endotherme Reaktionen sind nie spontan",
        "Spontaneität hängt von ΔG (freie Enthalpie) ab",
        "Spontaneität hängt nur von der Temperatur ab"
      ],
      correctAnswer: 2,
      explanation: "Eine Reaktion ist spontan, wenn ΔG < 0. ΔG = ΔH - T·ΔS berücksichtigt Enthalpie und Entropie."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was bewirkt ein Katalysator?",
      options: [
        "Erhöht die Aktivierungsenergie",
        "Senkt die Aktivierungsenergie",
        "Verändert die Reaktionsenthalpie",
        "Verschiebt das Gleichgewicht"
      ],
      correctAnswer: 1,
      explanation: "Ein Katalysator senkt die Aktivierungsenergie, beschleunigt die Reaktion, wird aber nicht verbraucht."
    },
    {
      id: 7,
      type: "fill-blank",
      question: "Die Verbrennung von Methan (CH₄ + 2O₂ → CO₂ + 2H₂O) ist eine _______ Reaktion.",
      correctAnswer: "exotherme",
      explanation: "Die Verbrennung von Methan gibt ca. -890 kJ/mol ab und ist daher exotherm."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Was ist die Bindungsenthalpie?",
      options: [
        "Die Energie, die beim Brechen einer Bindung frei wird",
        "Die Energie, die benötigt wird, um eine Bindung zu brechen",
        "Die Energieänderung bei einer Reaktion",
        "Die Aktivierungsenergie"
      ],
      correctAnswer: 1,
      explanation: "Die Bindungsenthalpie ist die Energie, die benötigt wird, um eine chemische Bindung zu brechen."
    },
    {
      id: 9,
      type: "multiple-choice",
      question: "Was besagt der Hesssche Satz?",
      options: [
        "Die Reaktionsenthalpie ist wegabhängig",
        "Die Reaktionsenthalpie ist wegunabhängig",
        "Die Reaktionsenthalpie ist immer null",
        "Die Reaktionsenthalpie kann nicht berechnet werden"
      ],
      correctAnswer: 1,
      explanation: "Hessscher Satz: Die Reaktionsenthalpie ist wegunabhängig (Zustandsgröße)."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Welche Gleichung beschreibt die Gibbs-Energie?",
      options: [
        "ΔG = ΔH + T·ΔS",
        "ΔG = ΔH - T·ΔS",
        "ΔG = -ΔH + T·ΔS",
        "ΔG = ΔH · T·ΔS"
      ],
      correctAnswer: 1,
      explanation: "Die Gibbs-Energie (freie Enthalpie) ist ΔG = ΔH - T·ΔS. Eine Reaktion ist spontan wenn ΔG < 0."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('energetik', quizData_energetik);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_energetik;
}
