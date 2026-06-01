/**
 * KI-Assistent
 * Chemistry Q&A chatbot with simulated KG-backed responses
 */

(function () {
  'use strict';

  var knowledgeBase = [
    // Allgemeine Chemie
    { q: ['molare masse', 'molmasse', 'molekülmasse'], a: 'Die molare Masse (M) ist die Masse eines Mols eines Stoffes. Einheit: g/mol. Sie wird berechnet, indem man die Atommassen aller Atome in der Summenformel addiert. Beispiel: H2O: 2×1.008 + 16.00 = 18.016 g/mol. Der Rechner für molare Massen ist unter <a href="/molare-masse-rechner/">/molare-masse-rechner/</a> verfügbar.' },
    { q: ['stöchiometrie', 'stochiometrie', 'verhältnis', 'reaktionsgleichung'], a: 'Die Stöchiometrie beschreibt die quantitativen Verhältnisse bei chemischen Reaktionen. Grundlage sind die molaren Massen und die Reaktionsgleichung. Der Stöchiometrie-Rechner hilft bei der Berechnung: <a href="/stoechiometrie-rechner/">/stoechiometrie-rechner/</a>. Zum Ausgleichen von Reaktionsgleichungen: <a href="/reaktionsgleichungen-ausgleichen/">/reaktionsgleichungen-ausgleichen/</a>.' },
    { q: ['redox', 'oxidation', 'reduktion', 'elektrochemie'], a: 'Redox-Reaktionen (Reduktion/Oxidation) sind Elektronenübertragungsreaktionen. Die Oxidation ist die Abgabe von Elektronen, die Reduktion die Aufnahme. Der Redox-Äquivalenzrechner hilft bei der Analyse: <a href="/redox-titrationen/">/redox-titrationen/</a>. Zum Redox-Potenzial: <a href="/redox-potenzial-rechner/">/redox-potenzial-rechner/</a>. Visualisierung auf Teilchenebene: <a href="/elektrochemie-teilchenebene/">/elektrochemie-teilchenebene/</a>.' },

    // Periodensystem
    { q: ['periodensystem', 'elementsymbol', 'atommasse', 'pse'], a: 'Das Periodensystem der Elemente (PSE) ordnet alle chemischen Elemente nach ihrer Ordnungszahl. Hauptgruppen und Perioden geben Aufschluss über die Eigenschaften. Unser interaktives Periodensystem: <a href="/perioden-system-der-elemente/">/perioden-system-der-elemente/</a>. Auch als VR-Version: <a href="/pse-vr/">/pse-vr/</a>.' },
    { q: ['atomradius', 'ionisierungsenergie', 'elektronegativität', 'trends'], a: 'Periodische Trends: Der Atomradius nimmt innerhalb einer Periode ab und innerhalb einer Gruppe zu. Die Ionisierungsenergie nimmt innerhalb einer Periode zu. Die Elektronegativität (EN) nimmt im PSE von links unten nach rechts oben zu. Mehr dazu: <a href="/periodische-trends/">/periodische-trends/</a>.' },

    // Säuren & Basen
    { q: ['säure', 'base', 'ph', 'puffer', 'ph-wert'], a: 'Säuren sind Protonendonatoren (H⁺-Donatoren), Basen sind Protonenakzeptoren nach Brønsted. Der pH-Wert gibt die Konzentration der H⁺-Ionen an. pH = -log[H⁺]. Rechner: <a href="/ph-rechner/">/ph-rechner/</a> mit visualisierter pH-Skala: <a href="/enhanced-ph-visualization/">/enhanced-ph-visualization/</a>. Titrationen: <a href="/titrations-simulator/">/titrations-simulator/</a>. Säuren-Basen-Gleichgewicht: <a href="/saeuren-basen-gleichgewicht/">/saeuren-basen-gleichgewicht/</a>.' },
    { q: ['titration', 'äquivalenzpunkt', 'indikator'], a: 'Bei der Titration wird die Konzentration einer unbekannten Lösung durch Zugabe einer Maßlösung bestimmt. Der Äquivalenzpunkt ist erreicht, wenn die Stoffmengen äquivalent sind. Simulator: <a href="/titrations-simulator/">/titrations-simulator/</a>. Für Redox-Titrationen: <a href="/redox-titrationen/">/redox-titrationen/</a>.' },

    // Thermodynamik
    { q: ['wärmeleitung', 'konvektion', 'wärme', 'thermodynamik'], a: 'Wärmeleitung ist der Energietransport durch direkten Teilchenkontakt. Konvektion ist der Energietransport durch Strömung in Flüssigkeiten/Gasen. Interaktive Visualisierungen: <a href="/waermeleitung/">/waermeleitung/</a>, <a href="/konvektion/">/konvektion/</a>, <a href="/temperatur-teilchenbewegung/">/temperatur-teilchenbewegung/</a>.' },
    { q: ['hess', 'reaktionsenthalpie', 'enthalpie'], a: 'Der Satz von Hess besagt, dass die Reaktionsenthalpie einer Reaktion unabhängig vom Reaktionsweg ist. Sie kann aus den Bildungsenthalpien der Produkte minus der Edukte berechnet werden. Rechner: <a href="/hess-gesetz/">/hess-gesetz/</a>.' },

    // Gasgesetze
    { q: ['gasgesetz', 'ideales gas', 'boyle', 'mariotte', 'p v n t'], a: 'Die Gasgesetze beschreiben das Verhalten idealer Gase. Boyle-Mariotte: p·V = const (bei konst. T). Ideales Gasgesetz: p·V = n·R·T. Simulator: <a href="/gasgesetz-simulator/">/gasgesetz-simulator/</a>. Rechner: <a href="/gasgesetz-rechner/">/gasgesetz-rechner/</a>. Atmosphärendruck: <a href="/atmosphaerendruck-alltag/">/atmosphaerendruck-alltag/</a>.' },
    { q: ['atmosphärendruck', 'luftdruck', 'torricelli'], a: 'Der Atmosphärendruck (Luftdruck) ist der Druck, den die Luft auf die Erdoberfläche ausübt. Normaldruck: 1013,25 hPa. Interaktive Beispiele: <a href="/atmosphaerendruck-alltag/">/atmosphaerendruck-alltag/</a>, <a href="/torricelli-versuch/">/torricelli-versuch/</a>. Druck-Flächen-Rechner: <a href="/druck-flaechen-rechner/">/druck-flaechen-rechner/</a>.' },

    // Chemisches Gleichgewicht
    { q: ['gleichgewicht', 'massenwirkungsgesetz', 'mwg', 'le chatelier'], a: 'Das chemische Gleichgewicht ist der Zustand, in dem Hin- und Rückreaktion gleich schnell ablaufen. Das Massenwirkungsgesetz (MWG) beschreibt das Verhältnis der Konzentrationen. Simulator: <a href="/chemisches-gleichgewicht/">/chemisches-gleichgewicht/</a>. Löslichkeitsprodukt: <a href="/loeslichkeitsprodukt-rechner/">/loeslichkeitsprodukt-rechner/</a>.' },

    // Reaktionskinetik
    { q: ['kinetik', 'reaktionsgeschwindigkeit', 'aktivierungsenergie', 'arrhenius'], a: 'Die Reaktionskinetik beschreibt die Geschwindigkeit chemischer Reaktionen. Die Arrhenius-Gleichung beschreibt den Zusammenhang zwischen Temperatur und Reaktionsgeschwindigkeit. Simulator: <a href="/reaktionskinetik-simulator/">/reaktionskinetik-simulator/</a>.' },

    // Atombau & Orbitale
    { q: ['atom', 'atomkern', 'orbital', 'energieniveau', 'schale'], a: 'Atome bestehen aus Atomkern (Protonen + Neutronen) und der Elektronenhülle. Die Elektronen besetzen verschiedene Energieniveaus (Schalen). Visualisierung: <a href="/atomenergieniveaus/">/atomenergieniveaus/</a>. Molekülorbitale: <a href="/molekuelorbitale/">/molekuelorbitale/</a>. Bindungspotential: <a href="/bindungspotential/">/bindungspotential/</a>.' },
    { q: ['molekülorbital', 'mo', 'bindung', 'antibindung'], a: 'Molekülorbitale entstehen durch die Linearkombination von Atomorbitalen. Dabei entstehen bindende und antibindende Orbitale. Visualisierung: <a href="/molekuelorbitale/">/molekuelorbitale/</a>. Molekülbaukasten: <a href="/molekuel-studio/">/molekuel-studio/</a>.' },

    // Lösungen & Konzentration
    { q: ['lösung', 'konzentration', 'löslichkeit', 'lösen', 'verdünnung'], a: 'Die Konzentration einer Lösung gibt die Stoffmenge pro Volumen an (mol/L). Konzentrationsumrechner: <a href="/konzentrationsumrechner/">/konzentrationsumrechner/</a>. Lösungsrechner: <a href="/loesungsrechner/">/loesungsrechner/</a>. Löslichkeitsprodukt: <a href="/loeslichkeitsprodukt-rechner/">/loeslichkeitsprodukt-rechner/</a>.' },

    // Übungen
    { q: ['übung', 'aufgabe', 'training', 'lernen'], a: 'Auf der Plattform gibt es verschiedene Übungsmöglichkeiten: Der <a href="/uebungsgenerator/">Übungsgenerator</a> erstellt Aufgaben, die <a href="/aufgabensammlung/">Aufgabensammlung</a> durchsucht alle Übungen, und der <a href="/lernpfad/">Lernpfad</a> führt durch strukturierte Lerneinheiten.' },
    { q: ['lückentext', 'lueckentext', 'cloze'], a: 'Lückentexte sind eine effektive Methode zum Lernen von Chemie. Im <a href="/lueckentexte/">Lückentext-Modul</a> können Sie verschiedene Themen mit unterschiedlichen Schwierigkeitsgraden üben.' },
    { q: ['arbeitsblatt', 'generator', 'blatt'], a: 'Der <a href="/arbeitsblatt-generator/">Arbeitsblatt-Generator</a> erstellt individualisierte Chemie-Arbeitsblätter für den Unterricht.' },

    // Spektroskopie
    { q: ['spektrum', 'ir', 'nmr', 'massenspektrum', 'spektroskopie'], a: 'Die Spektroskopie hilft bei der Strukturaufklärung von Molekülen. IR zeigt funktionelle Gruppen, NMR zeigt die Wasserstoff-Umgebung, MS zeigt die Molekülmasse. Simulator: <a href="/spektroskopie-simulator/">/spektroskopie-simulator/</a>.' },

    // Gefahrstoffe
    { q: ['gefahrstoff', 'ghs', 'piktogramm', 'h-satz', 'p-satz', 'sicherheit'], a: 'GHS-Piktogramme kennzeichnen Gefahren von Chemikalien. H-Sätze beschreiben die Gefahren, P-Sätze geben Sicherheitsmaßnahmen. Übersicht: <a href="/gefahrstoffkennzeichnung/">/gefahrstoffkennzeichnung/</a>.' },

    // Labor
    { q: ['labor', 'gerät', 'glasgerät', 'bürette', 'pipette'], a: 'Laborgeräte wie Bechergläser, Büretten und Pipetten sind unverzichtbar im Chemielabor. Der <a href="/laborgeraete-explorer/">Laborgeräte-Explorer</a> bietet eine Übersicht mit Beschreibungen und Verwendungszwecken.' },

    // Verbrennung
    { q: ['verbrennung', 'verbrennungsrechner', 'feuer', 'brand'], a: 'Verbrennungsreaktionen sind exotherme Oxidationsreaktionen. Der <a href="/verbrennungsrechner/">Verbrennungsrechner</a> hilft bei der Berechnung von Reaktionsenthalpien und Produkten von Verbrennungsreaktionen.' },

    // Einheiten
    { q: ['einheit', 'umrechnen', 'umrechnung'], a: 'Der <a href="/einheitenumrechner/">Einheitenumrechner</a> hilft bei der Umrechnung zwischen verschiedenen physikalischen Einheiten – nützlich für den Chemie- und Physikunterricht.' },

    // PWA / Offline
    { q: ['offline', 'pwa', 'app', 'installieren'], a: 'Chemie-lernen.org ist eine Progressive Web App (PWA). Sie können die Seite auf Ihrem Gerät installieren und viele Funktionen auch offline nutzen. Mehr dazu: <a href="/pwa-offline-modus/">/pwa-offline-modus/</a>.' },

    // Molar Mass Visualizer
    { q: ['molar visualizer', 'molekül visualisierung', '3d molekül'], a: 'Der <a href="/molar-mass-visualizer/">Molar Mass Visualizer</a> zeigt Moleküle in 3D-Ansicht mit den molaren Massen der Atome.' },

    // pH-Visualisierung
    { q: ['ph-skala', 'ph visualisierung', 'ph farbe'], a: 'Die <a href="/enhanced-ph-visualization/">pH-Visualisierung</a> zeigt die pH-Skala von stark sauer bis stark alkalisch mit allen wichtigen Referenzwerten aus dem Alltag.' },

    // Fortschritt
    { q: ['fortschritt', 'statistik', 'erfolg', 'level'], a: 'Im <a href="/fortschritt/">Fortschritts-Tracker</a> können Sie Ihren Lernfortschritt verfolgen, erreichte Erfolge einsehen und Ihre Motivation durch Gamification steigern.' },

    // Klassenstufen
    { q: ['klasse', 'klassenstufe', 'jahrgang'], a: 'Die Inhalte sind nach Klassenstufen geordnet – von Klasse 5 bis 13. Wählen Sie Ihre Klassenstufe: <a href="/klassenstufen/klasse-5/">Klasse 5</a>, <a href="/klassenstufen/klasse-6/">Klasse 6</a>, <a href="/klassenstufen/klasse-7/">Klasse 7</a>, <a href="/klassenstufen/klasse-8/">Klasse 8</a>, <a href="/klassenstufen/klasse-9/">Klasse 9</a>, <a href="/klassenstufen/klasse-10/">Klasse 10</a>, <a href="/klassenstufen/klasse-11/">Klasse 11</a>, <a href="/klassenstufen/klasse-12/">Klasse 12</a> oder <a href="/klassenstufen/klasse-13/">Klasse 13</a>.' },

    // Klassencockpit (Lehrkräfte)
    { q: ['lehrer', 'lehrkraft', 'klassencockpit', 'unterricht'], a: 'Für Lehrkräfte bietet das <a href="/klassencockpit/">Klassencockpit</a> eine Übersicht über die Klasse. Im Bereich <a href="/lehrende/">Lehrende</a> finden Sie didaktische Methoden, Materialien und Vorbereitungshilfen.' },

    // Themenbereiche
    { q: ['themen', 'themenbereich', 'bereich'], a: 'Die Themenbereiche auf chemie-lernen.org umfassen: Einführung in die Chemie, Aufbau der Materie, Anorganische Verbindungen, Säuren & Basen, Redox & Elektrochemie, Energetik, Gleichgewicht & Geschwindigkeit, Organische Stoffklassen und Analytische Methoden. <a href="/themenbereiche/">Alle Themenbereiche</a>.' }
  ];

  function findAnswer(query) {
    var q = query.toLowerCase().trim();

    for (var i = 0; i < knowledgeBase.length; i++) {
      var entry = knowledgeBase[i];
      for (var j = 0; j < entry.q.length; j++) {
        if (q.indexOf(entry.q[j]) !== -1) {
          return entry.a;
        }
      }
    }

    // Check for individual words
    var words = q.split(/\s+/);
    for (var k = 0; k < words.length; k++) {
      if (words[k].length < 3) continue;
      for (var m = 0; m < knowledgeBase.length; m++) {
        for (var n = 0; n < knowledgeBase[m].q.length; n++) {
          if (q.indexOf(knowledgeBase[m].q[n]) !== -1) {
            return knowledgeBase[m].a;
          }
        }
      }
    }

    return null;
  }

  // --- Chat UI ---

  function addMessage(text, isUser) {
    var container = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'message ' + (isUser ? 'user' : 'bot');
    div.innerHTML = '<div class="message-content">' + text + '</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    var container = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'message bot typing';
    div.id = 'typing-indicator';
    div.innerHTML = '<div class="message-content"><i class="fa fa-spinner fa-spin"></i> Denke nach...</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function handleQuery(query) {
    query = query.trim();
    if (!query) return;

    addMessage(query, true);
    document.getElementById('chat-input').value = '';
    showTyping();

    setTimeout(function () {
      hideTyping();

      var answer = findAnswer(query);
      if (answer) {
        addMessage(answer, false);

        // Add suggestion
        addMessage('Hast du noch weitere Fragen? Versuche es mit einem verwandten Thema.', false);
      } else {
        var sorry = 'Tut mir leid, ich habe keine passende Antwort in meiner Wissensdatenbank gefunden. Versuche es mit einem anderen Begriff, z.B.:';
        var suggestions = [
          '<a href="/molare-masse-rechner/">Molare Masse</a>',
          '<a href="/ph-rechner/">pH-Wert</a>',
          '<a href="/gasgesetz-simulator/">Gasgesetze</a>',
          '<a href="/uebungsgenerator/">Übungen</a>'
        ];
        addMessage(sorry + '<ul>' + suggestions.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>', false);
      }
    }, 600);
  }

  // --- Init ---

  function init() {
    var input = document.getElementById('chat-input');
    var sendBtn = document.getElementById('chat-send-btn');

    if (input && sendBtn) {
      sendBtn.addEventListener('click', function () {
        handleQuery(input.value);
      });

      input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleQuery(input.value);
        }
      });
    }
  }

  if (document.getElementById('chat-input')) {
    init();
  }

})();
