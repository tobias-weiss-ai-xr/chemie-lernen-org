// Quiz data structure for article integration
const quizDatabase = {
  'organische-stoffklassen': {
    'alkohole-und-ether-quiz': {
      title: 'Alkohole und Ether',
      questions: [
        {
          id: 1,
          question: 'Was ist die funktionelle Gruppe von Alkoholen?',
          options: ['-OH', '-COOH', '-NH2', '-CHO'],
          correct: 0,
          explanation: 'Alkohole enthalten die Hydroxylgruppe -OH.'
        },
        {
          id: 2,
          question: 'Wie unterscheiden sich Ether von Alkoholen chemisch?',
          options: ['Ether haben keine Hydroxylgruppe', 'Ether sind saurer', 'Ether haben mehr C-Atome', 'Ether sind unlöslich in Wasser'],
          correct: 0,
          explanation: 'Im Gegensatz zu Alkoholen enthalten Ether keine Hydroxylgruppe.'
        },
        {
          id: 3,
          question: 'Die allgemeine Formel von Alkoholen ist:',
          options: ['R-OH', 'R-COOH', 'R-NH2', 'R-CHO'],
          correct: 0,
          explanation: 'Alkohole haben die allgemeine Formel R-OH.'
        }
      ]
    },
    'carbonsaeuren-und-ester-quiz': {
      title: 'Carbonsäuren und Ester',
      questions: [
        {
          id: 1,
          question: 'Was ist die Säurefunktion in Carbonsäuren?',
          options: ['-COOH', '-OH', '-COOR', '-CHO'],
          correct: 0,
          explanation: 'Carbonsäuren enthalten die Carboxylgruppe -COOH.'
        },
        {
          id: 2,
          question: 'Ester entstehen durch die Veresterungsreaktion zwischen:',
          options: ['Carbonsäure und Alkohol', 'Aldehyd und Keton', 'Amin und Säure', 'Aldehyd und Alkohol'],
          correct: 0,
          explanation: 'Ester entstehen aus Carbonsäure und Alkohol unter Wasserabspaltung.'
        }
      ]
    },
    'amine-und-amide-quiz': {
      title: 'Amine und Amide',
      questions: [
        {
          id: 1,
          question: 'Was ist die charakteristische Gruppe von Aminen?',
          options: ['-NH2', '-OH', '-COOH', '-CHO'],
          correct: 0,
          explanation: 'Amine enthalten die Aminogruppe -NH2.'
        }
      ]
    }
  },
  'reaktionstypen': {
    'elektrophile-aromatische-substitution-quiz': {
      title: 'Elektrophile aromatische Substitution',
      questions: [
        {
          id: 1,
          question: 'Bei elektrophiler aromatischer Substitution greift ein Elektrophil an:',
          options: ['an den π-Elektronen des Benzolringes', 'an die σ-Bindungen', 'an die Kohlenstoffketten', 'an die H-Atome'],
          correct: 0,
          explanation: 'Das Elektrophil greift an den delokalisierten π-Elektronen des Benzolringes an.'
        }
      ]
    },
    'radikalreaktionen-im-detail-quiz': {
      title: 'Radikalreaktionen',
      questions: [
        {
          id: 1,
          question: 'Radikalreaktionen verlaufen in drei Phasen:',
          options: ['Initiation, Propagation, Termination', 'Oxidation, Reduktion, Neutralisation', 'Start, Fortsetzung, Ende', 'Einleiten, Fortführen, Abschließen'],
          correct: 0,
          explanation: 'Radikalreaktionen bestehen aus Initiation, Propagation und Termination.'
        }
      ]
    },
    'redoxreaktionen-elektrochemie-quiz': {
      title: 'Redoxreaktionen und Elektrochemie',
      questions: [
        {
          id: 1,
          question: 'Bei einer Redoxreaktion findet statt:',
          options: ['gleichzeitig eine Oxidation und eine Reduktion', 'nur eine Oxidation', 'nur eine Reduktion', 'weder Oxidation noch Reduktion'],
          correct: 0,
          explanation: 'Redoxreaktionen sind gekoppelte Oxidations- und Reduktionsprozesse.'
        }
      ]
    }
  },
  'energetik': {
    'thermodynamik-gesetze-quiz': {
      title: 'Thermodynamik Gesetze',
      questions: [
        {
          id: 1,
          question: 'Der erste Hauptsatz der Thermodynamik beschreibt:',
          options: ['Energieerhaltung', 'Entropiezunahme', 'Gleichgewicht', 'Reaktionsgeschwindigkeit'],
          correct: 0,
          explanation: 'Der erste Hauptsatz ist der Energieerhaltungssatz.'
        }
      ]
    },
    'gibbs-energie-und-spontaneitaet-quiz': {
      title: 'Gibbs-Energie',
      questions: [
        {
          id: 1,
          question: 'Eine Reaktion ist spontan, wenn ΔG < 0 bedeutet:',
          options: ['freie Energie nimmt ab', 'freie Energie nimmt zu', 'Energie bleibt konstant', 'Reaktion ist nicht spontan'],
          correct: 0,
          explanation: 'Negatives ΔG bedeutet, dass die freie Energie abnimmt und die Reaktion spontan verläuft.'
        }
      ]
    },
    'enthalpie-und-entropie-praktisch-quiz': {
      title: 'Enthalpie und Entropie',
      questions: [
        {
          id: 1,
          question: 'Enthalpie beschreibt:',
          options: ['den Wärmeinhalt eines Systems', 'die Unordnung eines Systems', 'die Reaktionsgeschwindigkeit', 'das Gleichgewicht'],
          correct: 0,
          explanation: 'Enthalpie ist ein Maß für den Wärmeinhalt oder Energiegehalt eines Systems.'
        }
      ]
    }
  },
  'analytik': {
    'spektroskopische-methoden-quiz': {
      title: 'Spektroskopische Methoden',
      questions: [
        {
          id: 1,
          question: 'Die UV-Vis-Spektroskopie nutzt:',
          options: ['Absorption von Licht im UV und sichtbaren Bereich', 'Infrarotstrahlung', 'Kernresonanz', 'Massenspektrometrie'],
          correct: 0,
          explanation: 'UV-Vis-Spektroskopie misst die Absorption von UV- und sichtbarem Licht.'
        }
      ]
    },
    'chromatographie-grundlagen-quiz': {
      title: 'Chromatographie',
      questions: [
        {
          id: 1,
          question: 'Das Prinzip der Chromatographie basiert auf:',
          options: ['unterschiedlichen Verteilungskoeffizienten', 'chemischen Reaktionen', 'elektrischen Feldern', 'Temperaturunterschieden'],
          correct: 0,
          explanation: 'Chromatographie trennt Stoffe basierend auf unterschiedlichen Verteilungskoeffizienten zwischen zwei Phasen.'
        }
      ]
    },
    'elektroanalytische-verfahren-quiz': {
      title: 'Elektroanalytische Verfahren',
      questions: [
        {
          id: 1,
          question: 'Die Potentiometrie misst:',
          options: ['Elektrodenpotentiale', 'Stromstärke', 'Leitfähigkeit', 'Widerstand'],
          correct: 0,
          explanation: 'Potentiometrie misst Elektrodenpotentiale, die proportional zur Ionenkonzentration sind.'
        }
      ]
    }
  },
  'anorganik': {
    'ionenkristalle-und-gitter-quiz': {
      title: 'Ionenkristalle',
      questions: [
        {
          id: 1,
          question: 'Ionenkristalle bestehen aus:',
          options: ['kationischen und anionischen Gitterteilchen', 'nur Kationen', 'nur Anionen', 'neutralen Atomen'],
          correct: 0,
          explanation: 'Ionenkristalle sind aus Kationen und Anionen aufgebaut, die sich in einem Gitter anordnen.'
        }
      ]
    },
    'uebergangsmetalle-komplexe-quiz': {
      title: 'Übergangsmetalle',
      questions: [
        {
          id: 1,
          question: 'Komplexe von Übergangsmetallen enthalten:',
          options: ['Zentralatom und Liganden', 'nur Zentralatom', 'nur Liganden', 'nicht-bindende Elektronen'],
          correct: 0,
          explanation: 'Komplexe bestehen aus einem Zentralatom (meist ein Übergangsmetall) und mehreren Liganden.'
        }
      ]
    },
    'hauptgruppen-elemente-quiz': {
      title: 'Hauptgruppen-Elemente',
      questions: [
        {
          id: 1,
          question: 'Hauptgruppen-Elemente zeichnen sich durch:',
          options: ['ähnliche chemische Eigenschaften innerhalb einer Gruppe', 'identische Eigenschaften', 'übergreifende Eigenschaften', 'keine Gemeinsamkeiten'],
          correct: 0,
          explanation: 'Elemente derselben Hauptgruppe zeigen ähnliche chemische Eigenschaften.'
        }
      ]
    }
  }
};

// Function to get quiz by ID
function getQuizById(quizId) {
  for (const topic in quizDatabase) {
    if (quizDatabase[topic][quizId]) {
      return quizDatabase[topic][quizId];
    }
  }
  return null;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { quizDatabase, getQuizById };
}