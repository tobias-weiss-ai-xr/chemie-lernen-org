/**
 * KI-Assistent
 * Chemistry Q&A chatbot with simulated KG-backed responses
 */

(function () {
  'use strict';

  var knowledgeBase = [
    // Allgemeine Chemie
    { q: ['molare masse', 'molmasse', 'molekülmasse'], a: 'Die molare Masse (M) ist die Masse eines Mols eines Stoffes. Einheit: g/mol. Sie wird berechnet, indem man die Atommassen aller Atome in der Summenformel addiert. Beispiel: H2O: 2×1.008 + 16.00 = 18.016 g/mol. Der Rechner für molare Massen ist unter <a href="/molare-masse-rechner/">/molare-masse-rechner/</a> verfügbar.' },
    { q: ['stöchiometrie', 'stochiometrie', 'verhältnis'], a: 'Die Stöchiometrie beschreibt die quantitativen Verhältnisse bei chemischen Reaktionen. Grundlage sind die molaren Massen und die Reaktionsgleichung. Der Stöchiometrie-Rechner hilft bei der Berechnung: <a href="/stoechiometrie-rechner/">/stoechiometrie-rechner/</a>.' },
    { q: ['redox', 'oxidation', 'reduktion'], a: 'Redox-Reaktionen (Reduktion/Oxidation) sind Elektronenübertragungsreaktionen. Die Oxidation ist die Abgabe von Elektronen, die Reduktion die Aufnahme. Der Redox-Äquivalenzrechner hilft bei der Analyse: <a href="/redox-titrationen/">/redox-titrationen/</a>.' },

    // Periodensystem
    { q: ['periodensystem', 'elementsymbol', 'atommasse', 'pse'], a: 'Das Periodensystem der Elemente (PSE) ordnet alle chemischen Elemente nach ihrer Ordnungszahl. Hauptgruppen und Perioden geben Aufschluss über die Eigenschaften. Unser interaktives Periodensystem: <a href="/perioden-system-der-elemente/">/perioden-system-der-elemente/</a>.' },
    { q: ['atomradius', 'ionisierungsenergie', 'elektronegativität', 'trends'], a: 'Periodische Trends: Der Atomradius nimmt innerhalb einer Periode ab und innerhalb einer Gruppe zu. Die Ionisierungsenergie nimmt innerhalb einer Periode zu. Die Elektronegativität (EN) nimmt im PSE von links unten nach rechts oben zu. Mehr dazu: <a href="/periodische-trends/">/periodische-trends/</a>.' },

    // Säuren & Basen
    { q: ['säure', 'base', 'ph', 'puffer'], a: 'Säuren sind Protonendonatoren (H⁺-Donatoren), Basen sind Protonenakzeptoren nach Brønsted. Der pH-Wert gibt die Konzentration der H⁺-Ionen an. pH = -log[H⁺]. Rechner: <a href="/ph-rechner/">/ph-rechner/</a>. Titrationen: <a href="/titrations-simulator/">/titrations-simulator/</a>.' },
    { q: ['titration', 'äquivalenzpunkt', 'indikator'], a: 'Bei der Titration wird die Konzentration einer unbekannten Lösung durch Zugabe einer Maßlösung bestimmt. Der Äquivalenzpunkt ist erreicht, wenn die Stoffmengen äquivalent sind. Simulator: <a href="/titrations-simulator/">/titrations-simulator/</a>. Für Redox-Titrationen: <a href="/redox-titrationen/">/redox-titrationen/</a>.' },

    // Thermodynamik
    { q: ['wärmeleitung', 'konvektion', 'wärme', 'thermodynamik'], a: 'Wärmeleitung ist der Energietransport durch direkten Teilchenkontakt. Konvektion ist der Energietransport durch Strömung in Flüssigkeiten/Gasen. Interaktive Visualisierungen: <a href="/waermeleitung/">/waermeleitung/</a>, <a href="/konvektion/">/konvektion/</a>, <a href="/temperatur-teilchenbewegung/">/temperatur-teilchenbewegung/</a>.' },

    // Übungen
    { q: ['übung', 'aufgabe', 'training', 'lernen'], a: 'Auf der Plattform gibt es verschiedene Übungsmöglichkeiten: Der <a href="/uebungsgenerator/">Übungsgenerator</a> erstellt Aufgaben, die <a href="/aufgabensammlung/">Aufgabensammlung</a> durchsucht alle Übungen, und der <a href="/lernpfad/">Lernpfad</a> führt durch strukturierte Lerneinheiten.' },
    { q: ['lückentext', 'lueckentext', 'cloze'], a: 'Lückentexte sind eine effektive Methode zum Lernen von Chemie. Im <a href="/lueckentexte/">Lückentext-Modul</a> können Sie verschiedene Themen mit unterschiedlichen Schwierigkeitsgraden üben.' },

    // Spektroskopie
    { q: ['spektrum', 'ir', 'nmr', 'massenspektrum', 'spektroskopie'], a: 'Die Spektroskopie hilft bei der Strukturaufklärung von Molekülen. IR zeigt funktionelle Gruppen, NMR zeigt die Wasserstoff-Umgebung, MS zeigt die Molekülmasse. Simulator: <a href="/spektroskopie-simulator/">/spektroskopie-simulator/</a>.' },

    // Gefahrstoffe
    { q: ['gefahrstoff', 'ghs', 'piktogramm', 'h-satz', 'p-satz', 'sicherheit'], a: 'GHS-Piktogramme kennzeichnen Gefahren von Chemikalien. H-Sätze beschreiben die Gefahren, P-Sätze geben Sicherheitsmaßnahmen. Übersicht: <a href="/gefahrstoffkennzeichnung/">/gefahrstoffkennzeichnung/</a>.' },

    // Labor
    { q: ['labor', 'gerät', 'glasgerät', 'bürette', 'pipette'], a: 'Laborgeräte wie Bechergläser, Büretten und Pipetten sind unverzichtbar im Chemielabor. Der <a href="/laborgeraete-explorer/">Laborgeräte-Explorer</a> bietet eine Übersicht mit Beschreibungen und Verwendungszwecken.' }
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
          '<a href="/redox-titrationen/">Redox-Titration</a>',
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
