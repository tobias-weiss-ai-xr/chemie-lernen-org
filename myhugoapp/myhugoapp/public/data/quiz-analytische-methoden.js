/**
 * Quiz Data: Analytische Methoden
 * Interactive quiz questions for the Analytische Methoden topic
 */

const quizData_analytische_methoden = {
  title: "Quiz: Analytische Methoden",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Was ist der Hauptunterschied zwischen qualitativer und quantitativer Analyse?",
      options: [
        "Qualitative Analyse misst, quantitative beobachtet",
        "Qualitative Analyse untersucht Stoffe, quantitative Analyse misst Mengen",
        "Qualitative Analyse ist schneller",
        "Es gibt keinen Unterschied"
      ],
      correctAnswer: 1,
      explanation: "Qualitative Analyse identifiziert, welche Stoffe vorhanden sind. Quantitative Analyse bestimmt, wie viel von jedem Stoff vorhanden ist."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Welche Methode eignet sich am besten zum Nachweis von Kohlenstoff in einer organischen Verbindung?",
      options: [
        "Flammenfärbung",
        "Kupferoxidprobe",
        "Liebig-Kupferoxid-Röhrchen",
        "Alle sind geeignet"
      ],
      correctAnswer: 3,
      explanation: "Alle drei Methoden können zum Kohlenstoffnachweis verwendet werden: Flammenfärbung (leuchtend), CuO-Reduktion (Cu entsteht), Liebig-Röhrchen (Kalkfällung)."
    },
    {
      id: 3,
      type: "true-false",
      question: "Der Nachweis von Wasserstoff kann durch die Knallgasprobe durchgeführt werden.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Bei der Knallgasprobe wird das Gas entzündet. Ein 'Knall' deutet auf Wasserstoff hin (2 H₂ + O₂ → 2 H₂O)."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Was ist die purpose eines Indikators bei einer Titration?",
      options: [
        "Die Lösung zu färben",
        "Den Endpunkt der Reaktion anzuzeigen",
        "Die Reaktion zu beschleunigen",
        "Die Lösung zu verdünnen"
      ],
      correctAnswer: 1,
      explanation: "Ein Indikator zeigt durch einen Farbwechsel an, wann die Reaktion beendet ist (z.B. Phenolphthalein bei Säure-Base-Titration)."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Welche Methode wird verwendet, um Kationen im Nachweis zu trennen?",
      options: [
        "Chromatographie",
        "Fällungsreaktionen",
        "Destillation",
        "Extraktion"
      ],
      correctAnswer: 1,
      explanation: "Kationen werden durch Fällungsreaktionen mit charakteristischen Reagenzien nachgewiesen und getrennt (z.B. NaOH, HCl, H₂SO₄)."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was zeigt die Flammpflege an?",
      options: [
        "Die Reinheit eines Stoffes",
        "Ob ein Stoff radioaktiv ist",
        "Die Anwesenheit bestimmter Metall-Ionen durch Flammenfärbung",
        "Den pH-Wert einer Lösung"
      ],
      correctAnswer: 2,
      explanation: "Verschiedene Metall-Ionen färben die Flamme charakteristisch: Natrium (gelb), Kalium (violett), Kupfer (grün), Calcium (orangerot)."
    },
    {
      id: 7,
      type: "fill-blank",
      question: "Bei der Papierchromatographie werden Stoffe aufgrund ihrer unterschiedlichen _______ getrennt.",
      correctAnswer: "Löslichkeit",
      explanation: "Die Papierchromatographie trennt Stoffe aufgrund ihrer unterschiedlichen Löslichkeit in der mobilen Phase (Laufmittel)."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Welches Reagenz wird zum Nachweis von Chlorid-Ionen verwendet?",
      options: [
        "Silbernitrat (AgNO₃)",
        "Bariumchlorid (BaCl₂)",
        "Natriumhydroxid (NaOH)",
        "Salzsäure (HCl)"
      ],
      correctAnswer: 0,
      explanation: "Chlorid-Ionen bilden mit Silbernitrat einen weißen Niederschlag von AgCl, der im Licht dunkel wird."
    },
    {
      id: 9,
      type: "true-false",
      question: "Der pH-Wert ist ein Maß für die Konzentration von Wasserstoffionen in einer Lösung.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Der pH-Wert = -log[H₃O⁺]. Er gibt die Konzentration der Oxoniumionen (Wasserstoffionen) an."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Was ist der Äquivalenzpunkt bei einer Titration?",
      options: [
        "Wenn die Lösung gefärbt ist",
        "Wenn titrierte und Titrator genau im stöchiometrischen Verhältnis reagiert haben",
        "Wenn die Hälfte titriert ist",
        "Wenn der Indikator neutral ist"
      ],
      correctAnswer: 1,
      explanation: "Der Äquivalenzpunkt ist erreicht, wenn die Menge an Titrierstoff genau der Reaktionsgleichung entspricht (z.B. Säure = Base)."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('analytische-methoden', quizData_analytische_methoden);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_analytische_methoden;
}
