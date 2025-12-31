/**
 * Quiz Data: Tipps und Tricks
 * Interactive quiz questions for Tipps und Tricks topic
 */

const quizData_tipps_tricks = {
  title: "Quiz: Tipps und Tricks",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Was besagt die 'OIL RIG' Merkregel?",
      options: [
        "Oxidation ist Gewinn, Reduktion ist Verlust",
        "Oxidation ist Verlust, Reduktion ist Gewinn",
        "Öl ist eine organische Verbindung",
        "Redoxreaktionen brauchen Öl"
      ],
      correctAnswer: 1,
      explanation: "OIL RIG: Oxidation Is Loss (Elektronenverlust), Reduction Is Gain (Elektronengewinn). Oxidation = Elektronen abgeben, Reduktion = Elektronen aufnehmen."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Wie lautet die Merkhilfe 'OPFER' für die Bestimmung von Oxidationszahlen?",
      options: [
        "O=-2, P=+1..+5, F=-1, E=0, R=Ionenladung",
        "O=+2, P=-1, F=0, E=-1, R=neutral",
        "O=-1, P=0, F=+1, E=-2, R=positiv",
        "O=0, P=-2, F=+1, E=positiv, R=negativ"
      ],
      correctAnswer: 0,
      explanation: "OPFER: O=-2 (Sauerstoff), P=+1 bis +5 (je nach Bindung), F=-1 (Fluor), E=0 (Elemente), R=Ionenladung (einfache Ionen)."
    },
    {
      id: 3,
      type: "true-false",
      question: "Nach der Ebbinghaus-Vergessenskurve sind nach 1 Woche etwa 80% des gelernten Materials vergessen.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Die Ebbinghaus-Vergessenskurve zeigt: Nach 1 Stunde 60%, nach 1 Tag 70%, nach 1 Woche 80% vergessen. Spaced Repetition hilft dagegen."
    },
    {
      id: 4,
      type: "multiple-choice",
      question: "Was ist die 'Lehrer-Methode' beim Lernen?",
      options: [
        "Sich von einem Lehrer unterrichten lassen",
        "Den Stoff einem imaginären Zuhörer erklären",
        "Lehrbücher von vorne bis hinten lesen",
        "Alles auswendig lernen wie ein Lehrbuch"
      ],
      correctAnswer: 1,
      explanation: "Die Lehrer-Methode: Stellen Sie sich vor, Sie müssen das Thema jemand anderem erklären. Wenn Sie es nicht einfach erklären können, haben Sie es noch nicht verstanden."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Wie erinnert man sich an den Unterschied zwischen Kationen und Anionen?",
      options: [
        "Kationen sind negativ wie Katzen",
        "Kationen = Katzen = positiv, Anionen = Angst = negativ",
        "Kationen sind immer größer als Anionen",
        "Es gibt keinen Merkspruch dafür"
      ],
      correctAnswer: 1,
      explanation: "Kat**ionen** = **Katzen** = **positiv** (Katzen schnurren positiv). **An**ionen = **A**ngst = **negativ** (Angst ist negativ)."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was ist bei der Berechnung von pH-Werten ein häufiger Fehler?",
      options: [
        "Die Einheit anzugeben",
        "Statt [H3O+] die [OH-] Konzentration zu verwenden",
        "Das Ergebnis zu runden",
        "Ein Taschenrechner zu verwenden"
      ],
      correctAnswer: 1,
      explanation: "Ein häufiger Fehler: pH = -log[OH-] ist falsch! Für Basen erst pOH berechnen, dann pH = 14 - pOH verwenden."
    },
    {
      id: 7,
      type: "multiple-choice",
      question: "Was bedeutet 'SMART' bei der Zielsetzung?",
      options: [
        "Sehr_meistens_richtig_tippen",
        "Spezifisch, Messbar, Attribuiert, Realistisch, Terminiert",
        "Schnell, Mehrfach, Aktiv, Richtig, Toll",
        "Studieren, Machen, Auswerten, Repetieren, Testen"
      ],
      correctAnswer: 1,
      explanation: "SMART-Ziele: Spezifisch (konkret), Messbar (überprüfbar), Attribuiert (eigene Anstrengung), Realistisch (machbar), Terminiert (mit Frist)."
    },
    {
      id: 8,
      type: "true-false",
      question: "Ein Katalysator verschiebt das chemische Gleichgewicht zugunsten der Produkte.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 1,
      explanation: "Falsch! Ein Katalysator beschleunigt Hin- und Rückreaktion gleichermaßen. Er erreicht das Gleichgewicht schneller, verschiebt es aber nicht."
    },
    {
      id: 9,
      type: "multiple-choice",
      question: "Was ist die richtige Reihenfolge der Alkane?",
      options: [
        "Methan, Ethan, Propan, Butan, Pentan, Hexan",
        "Methan, Propan, Ethan, Butan, Pentan, Hexan",
        "Ethan, Methan, Propan, Butan, Hexan, Pentan",
        "Methan, Butan, Propan, Ethan, Hexan, Pentan"
      ],
      correctAnswer: 0,
      explanation: "Die korrekte Reihenfolge: Methan (C1), Ethan (C2), Propan (C3), Butan (C4), Pentan (C5), Hexan (C6). Merkspruch: 'Meine Esel brüllen nie laut'."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Was ist bei der Prüfungsvorbereitung in der letzten Phase (1 Tag vor der Prüfung) zu tun?",
      options: [
        "Neue, schwierige Themen lernen",
        "Nur wiederholen, leichtes Üben, früh schlafen",
        "Die ganze Nacht durchlernen",
        "Alte Klausuren zum ersten Mal lösen"
      ],
      correctAnswer: 1,
      explanation: "In der letzten Phase nur noch wiederholen, nichts Neues lernen. Leichte Aufgaben zur Beruhigung lösen und früh schlafen gehen."
    },
    {
      id: 11,
      type: "multiple-choice",
      question: "Welche Aussage über Spaced Repetition ist richtig?",
      options: [
        "Alles am letzten Tag lernen",
        "Sofort wiederholen: nach 10 Minuten, dann nach 1 Tag, 3 Tagen, 1 Woche",
        "Nur einmal lernen und nie wiederholen",
        "Alle 6 Monate wiederholen"
      ],
      correctAnswer: 1,
      explanation: "Spaced Repetition: Sofort nach 10 Minuten, dann nach 1 Tag, nach 3 Tagen und nach 1 Woche wiederholen. Dies bekämpft die Vergessenskurve effektiv."
    },
    {
      id: 12,
      type: "multiple-choice",
      question: "Was ist ein typischer Fehler bei Molberechnungen?",
      options: [
        "Die Formel n = m/M zu verwenden",
        "Einheiten zu vergessen (z.B. g statt g/mol)",
        "Ein Taschenrechner zu benutzen",
        "Die Masse in Gramm anzugeben"
      ],
      correctAnswer: 1,
      explanation: "Ein häufiger Fehler: Einheiten vergessen! Richtig ist: n = (5 g) / (58.44 g/mol) = 0.086 mol. Die Einheiten müssen mit angegeben werden."
    },
    {
      id: 13,
      type: "true-false",
      question: "Die Umrechnung von 250 mL in Liter ergibt 250 L.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 1,
      explanation: "Falsch! 250 mL = 0.250 L (nicht 250 L). 1 L = 1000 mL, also durch 1000 teilen: 250 / 1000 = 0.25."
    },
    {
      id: 14,
      type: "multiple-choice",
      question: "Was besagt die Merkregel 'Laugen Leuchten Lila'?",
      options: [
        "Laugen fluoreszieren im Dunkeln",
        "Laugen färben Lackmuspapier blau, Säuren rot",
        "Laugen sind immer lila gefärbt",
        "Säuren und Laugen färben Lackmuspapier gleich"
      ],
      correctAnswer: 1,
      explanation: "Laugen (Basen) färben Lackmuspapier blau (lila-blau), Säuren färben Lackmuspapier rot. Dies ist ein wichtiger Indikator für den pH-Wert."
    },
    {
      id: 15,
      type: "multiple-choice",
      question: "Welche Strategie ist bei Multiple-Choice-Fragen am effektivsten?",
      options: [
        "Immer die erste Antwort wählen",
        "Falsche Antworten streichen, auf absolute Wörter ('immer', 'nie') achten",
        "Nie lesen, nur raten",
        "Immer die längste Antwort wählen"
      ],
      correctAnswer: 1,
      explanation: "Effektive Strategie: Falsche Antworten ausschließen. Auf absolute Wörter wie 'immer', 'nie', 'alle' achten (meist falsch!). Alle Antworten lesen."
    }
  ]
};

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_tipps_tricks;
}
