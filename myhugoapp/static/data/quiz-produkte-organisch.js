/**
 * Quiz Data: Produkte der Organischen Chemie
 * Interactive quiz questions for Produkte Organisch topic
 */

const quizData_produkte_organisch = {
  title: "Quiz: Produkte der Organischen Chemie",
  passingScore: 70,
  questions: [
    {
      id: 1,
      type: "multiple-choice",
      question: "Welches der folgenden ist KEIN Thermoplast?",
      options: [
        "Polyethylen (PE)",
        "Polypropylen (PP)",
        "Phenolharz (Duroplast)",
        "Polystyrol (PS)"
      ],
      correctAnswer: 2,
      explanation: "Phenolharze sind Duroplaste (duroplastische Kunststoffe), die nach dem Aushärten nicht mehr verformbar sind. PE, PP und PS sind Thermoplaste."
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Was ist der Hauptunterschied zwischen LDPE und HDPE?",
      options: [
        "LDPE ist härter als HDPE",
        "LDPE hat eine höhere Dichte",
        "HDPE hat eine höhere Dichte und ist härter",
        "Es gibt keinen Unterschied"
      ],
      correctAnswer: 2,
      explanation: "HDPE (High Density Polyethylene) hat eine höhere Dichte und ist härter, verwendet für Flaschen. LDPE (Low Density) ist weicher, verwendet für Folien."
    },
    {
      id: 3,
      type: "multiple-choice",
      question: "Aus welchem Monomer wird Polypropylen (PP) hergestellt?",
      options: [
        "Ethen (CH₂=CH₂)",
        "Propen (CH₂=CH-CH₃)",
        "Styrol (C₆H₅-CH=CH₂)",
        "Vinylchlorid (CH₂=CHCl)"
      ],
      correctAnswer: 1,
      explanation: "Polypropylen wird durch Polymerisation von Propen (CH₂=CH-CH₃) hergestellt: n CH₂=CH-CH₃ → -(CH₂-CH(CH₃))ₙ-"
    },
    {
      id: 4,
      type: "true-false",
      question: "PVC (Polyvinylchlorid) gilt als besonders umweltfreundlicher Kunststoff.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 1,
      explanation: "Falsch! PVC enthält Chlor und gilt als umweltbedenklich. Bei der Verbrennung können giftige Stoffe entstehen. Es ist jedoch langlebig und weit verbreitet."
    },
    {
      id: 5,
      type: "multiple-choice",
      question: "Wofür wird PET vorwiegend verwendet?",
      options: [
        "Rohre und Fensterprofile",
        "Getränkeflaschen und Textilfasern",
        "Spielzeug und Müllsäcke",
        "Dämmstoffe"
      ],
      correctAnswer: 1,
      explanation: "PET (Polyethylenterephthalat) wird vorwiegend für Getränkeflaschen, Textilfasern (Polyester) und Lebensmittelverpackungen verwendet."
    },
    {
      id: 6,
      type: "multiple-choice",
      question: "Welche Eigenschaften machen Polycarbonate besonders geeignet für Sicherheitsgläser?",
      options: [
        "Es ist weich und flexibel",
        "Es ist transparent und schlagzäh",
        "Es ist leicht entflammbar",
        "Es ist wasserlöslich"
      ],
      correctAnswer: 1,
      explanation: "Polycarbonate sind transparent, schlagzäh und hitzebeständig - ideale Eigenschaften für Sicherheitsgläser, CDs/DVDs und Gehäuse."
    },
    {
      id: 7,
      type: "multiple-choice",
      question: "Was ist ein Elastomer?",
      options: [
        "Ein Kunststoff, der sich nur einmal verformen lässt",
        "Ein gummiartiger, elastischer Kunststoff",
        "Ein Kunststoff, der bei Hitze schmilzt",
        "Ein harter, spröder Kunststoff"
      ],
      correctAnswer: 1,
      explanation: "Elastomere sind gummiartige, elastische Kunststoffe (z.B. Kautschuk). Sie kehren nach Deformation zu ihrer ursprünglichen Form zurück."
    },
    {
      id: 8,
      type: "multiple-choice",
      question: "Welcher Kunststoff wird für Styropor (Schaumstoff) verwendet?",
      options: [
        "Polyethylen (PE)",
        "Polypropylen (PP)",
        "Polystyrol (PS)",
        "Polyvinylchlorid (PVC)"
      ],
      correctAnswer: 2,
      explanation: "Polystyrol (PS) wird als Schaumstoff (Styropor) für Dämmmaterial verwendet. Es ist leicht, isoliert gut und ist transparent in fester Form."
    },
    {
      id: 9,
      type: "true-false",
      question: "Polyamide (Nylon) zeichnen sich durch besonders hohe Festigkeit und Abriebfestigkeit aus.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 0,
      explanation: "Richtig! Polyamide sind sehr fest, abriebfest und elastisch. Sie werden für Textilien, Zahnräder, Gleitelemente und Seile verwendet."
    },
    {
      id: 10,
      type: "multiple-choice",
      question: "Was ist der grundlegende Unterschied zwischen Farbstoffen und Pigmenten?",
      options: [
        "Es gibt keinen Unterschied",
        "Farbstoffe sind löslich, Pigmente sind unlöslich",
        "Pigmente sind löslich, Farbstoffe sind unlöslich",
        "Pigmente sind immer organischer Natur"
      ],
      correctAnswer: 1,
      explanation: "Farbstoffe sind in ihrem Anwendungsmedium löslich, Pigmente sind unlöslich und fein verteilt. Pigmente benötigen ein Bindemittel."
    },
    {
      id: 11,
      type: "multiple-choice",
      question: "Welche Aussage über Nylon (Polyamid) ist richtig?",
      options: [
        "Es ist ein Duroplast",
        "Es wird durch Polykondensation hergestellt",
        "Es ist wasserlöslich",
        "Es hat keine mechanische Festigkeit"
      ],
      correctAnswer: 1,
      explanation: "Nylon (Polyamid) wird durch Polykondensation von Diaminen und Dicarbonsäuren hergestellt. Es ist sehr fest, abriebfest und elastisch."
    },
    {
      id: 12,
      type: "multiple-choice",
      question: "Welche Eigenschaft macht Polypropylen (PP) besonders für Autoteile geeignet?",
      options: [
        "Niedrige Hitzebeständigkeit",
        "Geringe chemische Beständigkeit",
        "Hitzebeständigkeit und Chemikalienresistenz",
        "Hohe Dichte bei gleichzeitiger Weichheit"
      ],
      correctAnswer: 2,
      explanation: "PP ist hitzebeständig und chemikalienresistent, was es ideal für Autoteile, Medizingeräte und Lebensmittelverpackungen macht."
    },
    {
      id: 13,
      type: "true-false",
      question: "Die Polymerisation von Ethen zu Polyethylen ist eine Polykondensation.",
      options: [
        "Wahr",
        "Falsch"
      ],
      correctAnswer: 1,
      explanation: "Falsch! Die Polymerisation von Ethen zu PE ist eine Additionspolymerisation (Kettenwachstum ohne Abspaltung von kleinen Molekülen). PET wird durch Polykondensation hergestellt."
    },
    {
      id: 14,
      type: "multiple-choice",
      question: "Welcher Kunststoff ist besonders problematisch für die Umwelt wegen seines Chlorgehalts?",
      options: [
        "Polyethylen (PE)",
        "Polypropylen (PP)",
        "Polystyrol (PS)",
        "Polyvinylchlorid (PVC)"
      ],
      correctAnswer: 3,
      explanation: "PVC enthält Chlor und gilt als umweltbedenklich. Bei der Verbrennung können Dioxine und andere giftige Stoffe entstehen. Es ist schwer zu recyceln."
    },
    {
      id: 15,
      type: "multiple-choice",
      question: "Was kennzeichnet Duroplaste im Vergleich zu Thermoplasten?",
      options: [
        "Sie sind nach dem Aushärten nicht mehr formbar",
        "Sie sind bei Raumtemperatur flüssig",
        "Sie sind immer transparent",
        "Sie können mehrfach geschmolzen werden"
      ],
      correctAnswer: 0,
      explanation: "Duroplaste (duroplastische Kunststoffe) werden nach dem Aushärten nicht mehr formbar und sind dreidimensional vernetzt. Beispiele: Phenolharze, Epoxidharze."
    }
  ]
};

// Register quiz if quiz system is loaded
if (typeof chemieQuiz !== 'undefined') {
  chemieQuiz.registerQuiz('produkte-organisch', quizData_produkte_organisch);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quizData_produkte_organisch;
}
