/**
 * KI-Assistent
 * Chemistry Q&A chatbot backed by Knowledge Graph data.
 * Queries the kg-data.json content embedded in the page.
 */
(function () {
  'use strict';

  var kgData = null;

  /**
   * Parse KG data from the embedded script tag.
   */
  function loadKgData() {
    var el = document.getElementById('kg-data');
    if (!el) return null;
    try {
      var parsed = JSON.parse(el.textContent);
      if (parsed && Array.isArray(parsed.articles)) {
        return parsed;
      }
    } catch (_) { /* ignore */ }
    return null;
  }

  /**
   * Score an article against a user query.
   * Matches against title, tags, entities, description.
   * Returns a relevance score (higher = better match).
   */
  function scoreArticle(article, queryWords) {
    var score = 0;
    var titleLow = (article.title || '').toLowerCase();
    var descLow = (article.description || '').toLowerCase();
    var tags = (article.tags || []).map(function (t) { return t.toLowerCase(); });
    var entities = (article.entities || []).map(function (e) { return e.toLowerCase(); });

    for (var w = 0; w < queryWords.length; w++) {
      var word = queryWords[w];
      if (word.length < 2) continue;

      // Title match (highest weight)
      if (titleLow.indexOf(word) !== -1) score += 10;

      // Tag match
      for (var t = 0; t < tags.length; t++) {
        if (tags[t].indexOf(word) !== -1) score += 8;
      }

      // Entity match
      for (var e = 0; e < entities.length; e++) {
        if (entities[e].indexOf(word) !== -1) score += 6;
      }

      // Description match
      if (descLow.indexOf(word) !== -1) score += 3;
    }

    return score;
  }

  /**
   * Find the best matching articles for a query.
   */
  function findBestMatches(query, limit) {
    limit = limit || 3;
    if (!kgData || !kgData.articles || kgData.articles.length === 0) return [];

    var queryWords = query.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1; });

    var scored = [];
    for (var i = 0; i < kgData.articles.length; i++) {
      var article = kgData.articles[i];
      var score = scoreArticle(article, queryWords);
      if (score > 0) {
        scored.push({ article: article, score: score });
      }
    }

    // Sort by score descending
    scored.sort(function (a, b) { return b.score - a.score; });

    return scored.slice(0, limit).map(function (s) { return s.article; });
  }

  /**
   * Get a fallback thematic answer from a curated set.
   * Used when KG data is unavailable or no matches found.
   */
  var fallbackKnowledge = [
    { q: ['molare masse', 'molmasse', 'molekülmasse'], a: 'Die molare Masse (M) ist die Masse eines Mols eines Stoffes. Einheit: g/mol. Beispiel: H2O: 2×1.008 + 16.00 = 18.016 g/mol. Zum Berechnen: <a href="/molare-masse-rechner/">Molare-Masse-Rechner</a>.' },
    { q: ['stöchiometrie', 'verhältnis', 'reaktionsgleichung'], a: 'Die Stöchiometrie beschreibt die quantitativen Verhältnisse bei chemischen Reaktionen. Nutze den <a href="/stoechiometrie-rechner/">Stöchiometrie-Rechner</a> oder <a href="/reaktionsgleichungen-ausgleichen/">Reaktionsgleichungen-Ausgleichen</a>.' },
    { q: ['redox', 'oxidation', 'reduktion', 'elektrochemie'], a: 'Redox-Reaktionen sind Elektronenübertragungen. Oxidation = Elektronenabgabe, Reduktion = Elektronenaufnahme. Tools: <a href="/redox-titrationen/">Redox-Titrationen</a>, <a href="/redox-potenzial-rechner/">Redox-Potenzial-Rechner</a>.' },
    { q: ['periodensystem', 'pse', 'elementsymbol'], a: 'Das Periodensystem (PSE) ordnet Elemente nach Ordnungszahl. Unser interaktives System: <a href="/perioden-system-der-elemente/">3D-PSE</a>, auch als <a href="/pse-vr/">VR-Version</a>.' },
    { q: ['säure', 'base', 'ph-wert', 'ph', 'puffer'], a: 'Der pH-Wert gibt die H⁺-Ionenkonzentration an. pH = -log[H⁺]. Rechner: <a href="/ph-rechner/">pH-Rechner</a>, <a href="/saeuren-basen-gleichgewicht/">Säuren-Basen-Gleichgewicht</a>.' },
    { q: ['titration', 'äquivalenzpunkt', 'indikator'], a: 'Bei der Titration wird die Konzentration einer Lösung bestimmt. Simulator: <a href="/titrations-simulator/">Titrationssimulator</a>, <a href="/redox-titrationen/">Redox-Titrationen</a>.' },
    { q: ['gasgesetz', 'ideales gas', 'p v n t', 'boyle'], a: 'Ideales Gasgesetz: p·V = n·R·T. Simulator: <a href="/gasgesetz-simulator/">Gasgesetz-Simulator</a>, Rechner: <a href="/gasgesetz-rechner/">Gasgesetz-Rechner</a>.' },
    { q: ['hess', 'enthalpie', 'thermochemie'], a: 'Der Satz von Hess: Die Reaktionsenthalpie ist unabhängig vom Reaktionsweg. Rechner: <a href="/hess-gesetz/">Hess-Gesetz-Rechner</a>.' },
    { q: ['gleichgewicht', 'massenwirkungsgesetz', 'mwg', 'le chatelier'], a: 'Das chemische Gleichgewicht: MWG beschreibt das Konzentrationsverhältnis. Simulator: <a href="/chemisches-gleichgewicht/">Gleichgewichts-Simulator</a>.' },
    { q: ['kinetik', 'reaktionsgeschwindigkeit', 'arrhenius'], a: 'Die Reaktionskinetik beschreibt Reaktionsgeschwindigkeiten. Simulator: <a href="/reaktionskinetik-simulator/">Kinetik-Simulator</a>.' },
    { q: ['atom', 'orbital', 'energieniveau', 'bohr'], a: 'Atome bestehen aus Kern und Hülle. Visualisierung: <a href="/atomenergieniveaus/">Atom-Energieniveaus</a>, <a href="/molekuelorbitale/">Molekülorbitale</a>.' },
    { q: ['molekül', 'molekülgeometrie', '3d', 'vsepr'], a: 'Molekülgeometrien visualisieren: <a href="/molekuel-studio/">Molekülstudio</a>, <a href="/molar-mass-visualizer/">Molar Mass Visualizer</a>.' },
    { q: ['übung', 'aufgabe', 'training', 'lernen', 'quiz'], a: 'Übungsmöglichkeiten: <a href="/uebungsgenerator/">Übungsgenerator</a>, <a href="/aufgabensammlung/">Aufgabensammlung</a>, <a href="/lernpfad/">Lernpfad</a>.' },
    { q: ['spektrum', 'ir', 'nmr', 'spektroskopie'], a: 'Spektroskopie zur Strukturaufklärung: <a href="/spektroskopie-simulator/">Spektroskopie-Simulator</a>.' },
    { q: ['gefahrstoff', 'ghs', 'sicherheit', 'labor'], a: 'GHS-Piktogramme und Sicherheit: <a href="/gefahrstoffkennzeichnung/">Gefahrstoffkennzeichnung</a>, <a href="/laborgeraete-explorer/">Laborgeräte-Explorer</a>.' }
  ];

  function findFallbackAnswer(query) {
    var q = query.toLowerCase().trim();
    for (var i = 0; i < fallbackKnowledge.length; i++) {
      var entry = fallbackKnowledge[i];
      for (var j = 0; j < entry.q.length; j++) {
        if (q.indexOf(entry.q[j]) !== -1) {
          return entry.a;
        }
      }
    }
    return null;
  }

  function formatArticleResult(articles) {
    if (articles.length === 0) return null;

    var html = 'Ich habe passende Artikel aus unserer Wissensdatenbank gefunden:<br><br>';
    for (var i = 0; i < articles.length; i++) {
      var a = articles[i];
      html += '📄 <strong><a href="' + a.url + '">' + a.title + '</a></strong><br>';
      if (a.description) {
        html += '<small>' + a.description.slice(0, 150) + '</small><br>';
      }
      if (a.tags && a.tags.length > 0) {
        html += '<small>🏷️ ' + a.tags.join(', ') + '</small>';
      }
      html += '<br><br>';
    }
    html += '<em>Die Antworten basieren auf KI-generierten Zusammenfassungen aktueller Forschung.</em>';
    return html;
  }

  function formatNoResult(query) {
    // Try fallback thematic answers
    var fallback = findFallbackAnswer(query);
    if (fallback) {
      return fallback + '<br><br><em>Diese Antwort stammt aus unserer Wissensdatenbank. Für aktuelle Forschungsergebnisse versuche einen spezifischeren Begriff.</em>';
    }

    var html = 'Tut mir leid, ich habe nichts Passendes gefunden. Versuche es mit einem anderen Begriff, z.B.:<ul>';
    var suggestions = [
      '<a href="/molare-masse-rechner/">Molare Masse</a>',
      '<a href="/ph-rechner/">pH-Wert</a>',
      '<a href="/gasgesetz-simulator/">Gasgesetze</a>',
      '<a href="/perioden-system-der-elemente/">Periodensystem</a>',
      '<a href="/uebungsgenerator/">Übungen</a>'
    ];
    for (var s = 0; s < suggestions.length; s++) {
      html += '<li>' + suggestions[s] + '</li>';
    }
    html += '</ul>';
    return html;
  }

  function handleQuery(query) {
    query = query.trim();
    if (!query) return;

    addMessage(query, true);
    document.getElementById('chat-input').value = '';
    showTyping();

    setTimeout(function () {
      hideTyping();

      // Try KG data first
      var matches = findBestMatches(query);
      var answer = null;

      if (matches.length > 0) {
        answer = formatArticleResult(matches);
      }

      if (!answer) {
        answer = formatNoResult(query);
      }

      addMessage(answer, false);
      addMessage('Hast du noch weitere Fragen?', false);
    }, 600);
  }

  // --- Chat UI (unchanged) ---

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

  function init() {
    kgData = loadKgData();

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
