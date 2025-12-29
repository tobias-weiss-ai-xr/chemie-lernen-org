/**
 * Quiz Data: Gleichgewicht und Geschwindigkeit
 * Interactive quiz questions for the Gleichgewicht und Geschwindigkeit topic
 */

const quizData_gleichgewicht_geschwindigkeit = {
  title: "Quiz: Gleichgewicht und Geschwindigkeit",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Was beschreibt die Reaktionsgeschwindigkeit?",
      options: [
        "Die Änderung der Konzentration pro Zeiteinheit",
        "Die Änderung der Temperatur pro Zeiteinheit",
        "Die Änderung des Drucks pro Zeiteinheit",
        "Die Änderung des Volumens pro Zeiteinheit"
      ],
      correctAnswer: 0,
      explanation: "Die Reaktionsgeschwindigkeit v = -Δc(Reaktand)/Δt beschreibt, wie schnell sich die Konzentration ändert."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Was besagt die RGT-Regel?",
      options: [
        "Eine Temperaturerhöhung um 10 R verdoppelt die Geschwindigkeit",
        "Eine Temperaturerhöhung um 10 K verdoppelt bis vervierfacht die Geschwindigkeit",
        "Eine Temperaturerhöhung um 10 °C halbiert die Geschwindigkeit",
        "Die Geschwindigkeit ist temperaturunabhängig"
      ],
      correctAnswer: 1,
      explanation: "Die RGT-Regel (Raoult-Guldberg-van't Hoff): Eine Erhöhung um 10 K verdoppelt bis vervierfacht die Geschwindigkeit."
    },
    {
      id: 3,
      type: "true-false",
      question: "Ein Katalysator verschiebt das chemische Gleichgewicht.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 1,
      explanation: "Falsch! Ein Katalysator beschleunigt Hin- und Rückreaktion gleichermaßen, verschiebt also NICHT das Gleichgewicht."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Was besagt das Prinzip von Le Chatelier?",
      options: [
        "Das Gleichgewicht verschiebt sich, um eine Störung zu kompensieren",
        "Die Reaktion stoppt bei Störung",
        "Das Gleichgewicht kann nie verschoben werden",
        "Katalysatoren verschieben das Gleichgewicht"
      ],
      correctAnswer: 0,
      explanation: "Le Chatelier: Wenn ein System im Gleichgewicht gestört wird, verschiebt es sich, um die Störung zu kompensieren."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Was passiert bei Druckerhöhung in einem Gleichgewicht mit Gasen?",
      options: [
        "Verschiebung zur Seite mit mehr Gasmolekülen",
        "Verschiebung zur Seite mit weniger Gasmolekülen",
        "Keine Veränderung",
        "Das Gleichgewicht wird zerstört"
      ],
      correctAnswer: 1,
      explanation: "Höherer Druck begünstigt die Seite mit weniger Gasmolekülen (z.B. N₂ + 3H₂ ⇌ 2NH₃)."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was ist die Aktivierungsenergie?",
      options: [
        "Die Energie, die bei der Reaktion freigesetzt wird",
        "Die minimale Energie, die Teilchen für eine Reaktion benötigen",
        "Die Energie, die ein Katalysator liefert",
        "Die Energiedifferenz zwischen Produkten und Reaktanden"
      ],
      correctAnswer: 1,
      explanation: "Die Aktivierungsenergie Ea ist die minimale Energie, die Reaktanten benötigen, um zu reagieren."
    },
    {
      id: 7,
      type: "fill-blank",
      question: "Im chemischen Gleichgewicht sind die Geschwindigkeiten von Hin- und Rückreaktion _______.",
      correctAnswer: "gleich",
      explanation: "Im Gleichgewicht ist v(hin) = v(rück). Die Konzentrationen ändern sich nicht mehr (makroskopisch)."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Was ist eine Reaktion erster Ordnung?",
      options: [
        "v = k (unabhängig von Konzentration)",
        "v = k · c(A)",
        "v = k · c(A) · c(B)",
        "v = k · c²(A)"
      ],
      correctAnswer: 1,
      explanation: "Bei einer Reaktion erster Ordnung ist die Geschwindigkeit proportional zur Konzentration eines Reaktanden: v = k · c(A)."
    },
    {
      id: 9,
      type: "multiple-choice",
      question: "Welcher Faktor beeinflusst die Reaktionsgeschwindigkeit NICHT?",
      options: [
        "Konzentration der Reaktanden",
        "Temperatur",
        "Katalysator",
        "Druck bei Feststoffreaktionen"
      ],
      correctAnswer: 3,
      explanation: "Druck beeinflusst nur Gasreaktionen (durch Konzentrationsänderung). Bei Feststoffen hat Druck keinen direkten Einfluss."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Was optimiert das Haber-Bosch-Verfahren für die Ammoniaksynthese?",
      options: [
        "Hoher Druck, niedrige Temperatur",
        "Hoher Druck, mittlere Temperatur, Katalysator",
        "Niedriger Druck, hohe Temperatur",
        "Druck und Temperatur haben keinen Einfluss"
      ],
      correctAnswer: 1,
      explanation: "Haber-Bosch: Hoher Druck (200-300 bar) verschiebt Gleichgewicht, mittlere Temperatur (400-500°C) für Geschwindigkeit, Eisen-Katalysator."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('gleichgewicht-geschwindigkeit', quizData_gleichgewicht_geschwindigkeit);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_gleichgewicht_geschwindigkeit;
}
