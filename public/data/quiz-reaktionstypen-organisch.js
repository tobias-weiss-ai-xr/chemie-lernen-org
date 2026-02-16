/**
 * Quiz Data: Reaktionstypen der Organischen Chemie
 * Interactive quiz questions for Reaktionstypen Organisch topic
 */

const quizData_reaktionstypen_organisch = {
  title: "Quiz: Reaktionstypen der Organischen Chemie",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Welche der folgenden sind KEINE der vier Haupttypen organischer Reaktionen?",
      options: [
        "Substitution",
        "Addition",
        "Elimination",
        "Oxidation"
      ],
      correctAnswer: 3,
      explanation: "Die vier Haupttypen sind: Substitution, Addition, Elimination und Redoxreaktionen. Oxidation allein ist kein eigenständiger Reaktionstyp, sondern Teil von Redoxreaktionen."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Was kennzeichnet den SN2-Mechanismus?",
      options: [
        "Zweizeitiger Prozess mit Carbocation-Zwischenstufe",
        "Einzeitiger Prozess mit Inversion am Kohlenstoff",
        "Bildung eines planaren Carbocations",
        "Kinetik erster Ordnung"
      ],
      correctAnswer: 1,
      explanation: "SN2 ist ein einzeitiger bimolekularer Prozess mit Inversion am Kohlenstoff (Walden-Umkehr). Die Kinetik ist zweiter Ordnung: v = k[R-X][Nu-]."
    },
    {
      id: 3,
      type: "multiple-choice",
      question: "Welche Aussage über den S_N1-Mechanismus ist richtig?",
      options: [
        "Primäre Halogenide reagieren am schnellsten",
        "Es ist ein einzeitiger Prozess",
        "Die Kinetik ist v = k[R-X]",
        "Polare aprotische Lösungsmittel beschleunigen die Reaktion"
      ],
      correctAnswer: 2,
      explanation: "S_N1 ist ein zweizeitiger unimolekularer Prozess mit Kinetik erster Ordnung: v = k[R-X]. Tertiäre Halogenide reagieren bevorzugt und polare protische Lösungsmittel begünstigen die Reaktion."
    },
    {
      id: 4,
      type: "true-false",
      question: "Bei der elektrophilen Substitution reagieren typischerweise Aromaten wie Benzol.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Die elektrophile Substitution (S_E) ist typisch für Aromaten. Ein klassisches Beispiel ist die Nitrierung von Benzol mit HNO₃."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Was besagt die Markownikow-Regel bei der Addition von HX an Alkene?",
      options: [
        "H lagert sich an das C mit weniger H-Atomen",
        "X lagert sich an das C mit mehr H-Atomen",
        "H lagert sich an das C mit mehr H-Atomen",
        "Die Reaktion verläuft immer über ein Carbocation"
      ],
      correctAnswer: 2,
      explanation: "Die Markownikow-Regel besagt: Bei Addition von HX an unsymmetrische Alkene lagert sich H an das Kohlenstoffatom mit mehr Wasserstoffatomen. Bei Propen + HBr entsteht 2-Brompropan."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Was ist das charakteristische Merkmal einer Eliminierungsreaktion?",
      options: [
        "Anlagerung an eine Doppelbindung",
        "Abspaltung unter Bildung einer Doppelbindung",
        "Übertragung von Elektronen",
        "Bildung eines Rings"
      ],
      correctAnswer: 1,
      explanation: "Bei Eliminierungsreaktionen werden Atome oder Gruppen aus benachbarten Kohlenstoffatomen abgespalten, wobei eine Doppelbindung entsteht: R-CH₂-CH₂-X → R-CH=CH₂ + HX"
    },
    {
      id: 7,
      type: "multiple-choice",
      question: "Welcher Mechanismus zeigt Konkurrenz mit S_N1?",
      options: [
        "SN2",
        "E1",
        "E2",
        "S_E"
      ],
      correctAnswer: 1,
      explanation: "E1 zeigt Konkurrenz mit S_N1, da beide über ein Carbocation als Zwischenstufe verlaufen. Das Verhältnis hängt vom Substrat, Base/Lösungsmittel und Temperatur ab."
    },
    {
      id: 8,
      type: "true-false",
      question: "Die Saytzeff-Regel besagt, dass bei Eliminierungen der Wasserstoff vom benachbarten Kohlenstoff mit MEHR Wasserstoffatomen entfernt wird.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 1,
      explanation: "Falsch! Die Saytzeff-Regel besagt das Gegenteil: Wasserstoff wird vom benachbarten Kohlenstoff mit WENIGER Wasserstoffatomen entfernt (dem stärker substituierten Kohlenstoff)."
    },
    {
      id: 9,
      type: "multiple-choice",
      question: "Welche Katalysatoren werden typischerweise bei der katalytischen Hydrierung verwendet?",
      options: [
        "Eisen und Kupfer",
        "Palladium, Platin und Nickel",
        "Aluminium und Silber",
        "Quecksilber und Gold"
      ],
      correctAnswer: 1,
      explanation: "Bei der katalytischen Hydrierung werden typischerweise Pd, Pt oder Ni als Katalysatoren verwendet. Diese ermöglichen die Addition von H₂ an Doppelbindungen unter milden Bedingungen."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Was ist ein radikalischer Substitutions-Mechanismus?",
      options: [
        "Ein einzeitiger Prozess mit Inversion",
        "Eine Kettenreaktion mit Radikalen als Zwischenstufen",
        "Ein Prozess über ein Carbocation",
        "Eine typische Reaktion von Alkenen"
      ],
      correctAnswer: 1,
      explanation: "Die radikalische Substitution ist eine Kettenreaktion mit Radikalen. Sie verläuft in drei Phasen: Initiierung (Bildung von Radikalen), Propagation (Kettenfortpflanzung) und Terminierung (Kettenabbruch)."
    },
    {
      id: 11,
      type: "multiple-choice",
      question: "Welche Aussage über nucleophile Addition ist richtig?",
      options: [
        "Sie verläuft typischerweise bei gesättigten Verbindungen",
        "Ein Beispiel ist die Addition von Wasser an Aldehyde",
        "Sie erfordert immer starke Säuren",
        "Sie ist nur bei Alkanen möglich"
      ],
      correctAnswer: 1,
      explanation: "Die nucleophile Addition verläuft bei Verbindungen mit Doppelbindungen. Ein klassisches Beispiel ist die Addition von Wasser an Aldehyde: R-CHO + H₂O → R-CH(OH)₂."
    },
    {
      id: 12,
      type: "true-false",
      question: "Polymerisationsreaktionen sind Kettenreaktionen, die zur Bildung von Makromolekülen führen.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Polymerisationen sind Kettenreaktionen (Beispiel: Polyethylen aus Ethen) die zur Bildung von Makromolekülen mit hoher molarem Masse führen."
    },
    {
      id: 13,
      type: "multiple-choice",
      question: "Was ist der Unterschied zwischen E1 und E2?",
      options: [
        "E1 ist einzeitiger, E2 ist zweizeitiger",
        "E1 verläuft über ein Carbocation, E2 ist konzertiert",
        "E2 erfordert starke Basen, E1 nicht",
        "Es gibt keinen Unterschied"
      ],
      correctAnswer: 1,
      explanation: "E1 verläuft über ein Carbocation (zweizeitig, unimolekular), während E2 ein konzertierter bimolekularer Prozess ist. E1 zeigt Konkurrenz mit S_N1."
    },
    {
      id: 14,
      type: "multiple-choice",
      question: "Welche Reaktionstypen werden typischerweise bei der Bildung von Cyanhydraten beobachtet?",
      options: [
        "Radikalische Substitution",
        "Elektrophile Addition",
        "Nucleophile Addition",
        "Eliminierung"
      ],
      correctAnswer: 2,
      explanation: "Die Cyanhydrat-Bildung ist eine nucleophile Addition: R-CHO + HCN → R-CH(OH)-CN. Das Nucleophil CN⁻ addiert sich an die Carbonylgruppe."
    },
    {
      id: 15,
      type: "multiple-choice",
      question: "Welche Faktoren beeinflussen die Wahl zwischen S_N1 und S_N2?",
      options: [
        "Nur die Temperatur",
        "Substratstruktur (primär/sekundär/tertiär), Art des Nucleophils, Lösungsmittel",
        "Nur das Nucleophil",
        "Es gibt keine Wahl - beide verlaufen immer gleich"
      ],
      correctAnswer: 1,
      explanation: "Die Wahl zwischen S_N1 und S_N2 hängt von mehreren Faktoren ab: Substratstruktur (primär begünstigt SN2, tertiär begünstigt SN1), Art des Nucleophils (stark vs. schwach), Lösungsmittel (protisch vs. aprotisch) und Temperatur."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('reaktionstypen-organisch', quizData_reaktionstypen_organisch);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_reaktionstypen_organisch;
}
