// Calculator cross-linking database
const calculatorLinks = {
  'organische-stoffklassen': [
    {
      topic: 'Alkohole und Ether',
      calculators: [
        { id: 'ph-rechner', name: 'pH-Rechner', relevance: 'für Untersuchung alkoholischer Lösungen' },
        { id: 'concentration-calculator', name: 'Konzentrationsrechner', relevance: 'für Bestimmung moler Konzentrationen' }
      ]
    },
    {
      topic: 'Carbonsäuren und Ester',
      calculators: [
        { id: 'ph-rechner', name: 'pH-Rechner', relevance: 'für Untersuchung carboxydischer Säuren' },
        { id: 'loesungsrechner', name: 'Löslichkeitsrechner', relevance: 'für Untersuchung organischer Verbindungen' }
      ]
    },
    {
      topic: 'Amine und Amide',
      calculators: [
        { id: 'ph-rechner', name: 'pH-Rechner', relevance: 'für Untersuchung basischer Amine' },
        { id: 'verduennungsrechner', name: 'Verdünnungsrechner', relevance: 'für Verdünnen von Aminlösungen' }
      ]
    }
  ],
  'reaktionstypen': [
    {
      topic: 'Elektrophile aromatische Substitution',
      calculators: [
        { id: 'equilibrium-calculator', name: 'Gleichgewichtsrechner', relevance: 'für Untersuchung chemischer Gleichgewichte' },
        { id: 'redox-potenzial-rechner', name: 'Redox-Potenzial-Rechner', relevance: 'für Untersuchung Redoxreaktionen' }
      ]
    },
    {
      topic: 'Radikalreaktionen im Detail',
      calculators: [
        { id: 'energetics-calculator', name: 'Energetik-Rechner', relevance: 'für Untersuchung Reaktionsenthalpie' },
        { id: 'verbrennungsrechner', name: 'Verbrennungsrechner', relevance: 'für Untersuchung Verbrennungsreaktionen' }
      ]
    },
    {
      topic: 'Redoxreaktionen und Elektrochemie',
      calculators: [
        { id: 'redox-potenzial-rechner', name: 'Redox-Potenzial-Rechner', relevance: 'für Berechnung Redox-Potentiale' },
        { id: 'electrochemistry-calculator', name: 'Elektrochemie-Rechner', relevance: 'für Untersuchung elektrochemischer Zellen' }
      ]
    }
  ],
  'energetik': [
    {
      topic: 'Thermodynamik Gesetze',
      calculators: [
        { id: 'enthalpy-calculator', name: 'Enthalpie-Rechner', relevance: 'für Berechnung Reaktionsenthalpie' },
        { id: 'entropy-calculator', name: 'Entropie-Rechner', relevance: 'für Berechnung Reaktionsentropie' }
      ]
    },
    {
      topic: 'Gibbs-Energie und Spontaneität',
      calculators: [
        { id: 'gibbs-calculator', name: 'Gibbs-Energie-Rechner', relevance: 'für Berechnung freier Energie' },
        { id: 'equilibrium-constant', name: 'Gleichgewichtskonstanten-Rechner', relevance: 'für Verbindung zwischen ΔG und K' }
      ]
    },
    {
      topic: 'Enthalpie und Entropie Praktisch',
      calculators: [
        { id: 'thermochemistry-calculator', name: 'Thermochemie-Rechner', relevance: 'für Untersuchung thermochemischer Prozesse' },
        { id: 'heat-capacity-calculator', name: 'Wärmekapazitäts-Rechner', relevance: 'für Berechnung Wärmemengen' }
      ]
    }
  ],
  'analytik': [
    {
      topic: 'Spektroskopische Methoden',
      calculators: [
        { id: 'spectroscopy-calculator', name: 'Spektroskopie-Rechner', relevance: 'für Interpretation spektroskopischer Daten' },
        { id: 'wavelength-calculator', name: 'Wellenlängen-Rechner', relevance: 'für Untersuchung elektromagnetischer Strahlung' }
      ]
    },
    {
      topic: 'Chromatographie Grundlagen',
      calculators: [
        { id: 'retention-time-calculator', name: 'Retentionszeit-Rechner', relevance: 'für Berechnung chromatographischer Parameter' },
        { id: 'separation-efficiency', name: 'Trenneffizienz-Rechner', relevance: 'für Bewertung chromatographischer Trennungen' }
      ]
    },
    {
      topic: 'Elektroanalytische Verfahren',
      calculators: [
        { id: 'potentiometry-calculator', name: 'Potentiometrie-Rechner', relevance: 'für Untersuchung und Auswertung potentiometrischer Messungen' },
        { id: 'electrochemical-cells', name: 'Elektrochemische Zellen-Rechner', relevance: 'für Berechnung Potentiale und Konzentrationen' }
      ]
    }
  ],
  'anorganik': [
    {
      topic: 'Ionenkristalle und Gitter',
      calculators: [
        { id: 'lattice-energy-calculator', name: 'Gitterenergie-Rechner', relevance: 'für Berechnung Gitterenergien' },
        { id: 'ionic-radius-calculator', name: 'Ionenradius-Rechner', relevance: 'für Untersuchung ionischer Strukturen' }
      ]
    },
    {
      topic: 'Übergangsmetalle Komplexe',
      calculators: [
        { id: 'complex-formation', name: 'Komplexbildungs-Rechner', relevance: 'für Untersuchung Komplexbildungsgleichgewichte' },
        { id: 'coordination-number', name: 'Koordinationszahl-Rechner', relevance: 'für Bestimmung Koordinationszahlen' }
      ]
    },
    {
      topic: 'Hauptgruppen-Elemente',
      calculators: [
        { id: 'periodic-trends', name: 'Periodensystem-Trends-Rechner', relevance: 'für Untersuchung periodischer Trends' },
        { id: 'atomic-properties', name: 'Atomare Eigenschaften-Rechner', relevance: 'für Vergleich atomarer Eigenschaften' }
      ]
    }
  ]
};

function getCalculatorsForTopic(topic) {
  return calculatorLinks[topic] || [];
}

function getCalculatorsForArticle(topic, articleTitle) {
  const topicCalculators = calculatorLinks[topic] || [];
  const articleCalculators = topicCalculators.find(tc => tc.topic === articleTitle);
  return articleCalculators ? articleCalculators.calculators : [];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculatorLinks, getCalculatorsForTopic, getCalculatorsForArticle };
}