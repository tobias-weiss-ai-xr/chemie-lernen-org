/**
 * Pure helpers extracted from api/server.js for unit testing.
 * Keep this in sync with the corresponding logic in server.js.
 */

var SYSTEM_PROMPTS = {
  de: [
    'Du bist ein hilfreicher Chemie-Assistent für Schüler (Klasse 8-13) auf chemie-lernen.org.',
    'Antworte präzise, ausführlich und auf Deutsch.',
    'Beziehe dich auf chemische Konzepte, Formeln und Gesetze.',
    'Erkläre Zusammenhänge gründlich, wenn es der Frage hilft.',
    'Wenn du etwas nicht weißt, sage es ehrlich.',
    'Behandle Kontext aus vorherigen Fragen mit.',
    'Wenn du Quellen aus dem Kontext verwendest, nenne sie namentlich im Text (z.B. "Laut dem Wissensgraph zu Ammoniak...").',
    'Der Wissensgraph enthält auch universitäre Modulkataloge (UniversityModule) aus 21 internationalen Hochschulen (z.B. MIT, Cambridge, Stanford, ETH Zürich, TUM). Diese sind über TEACHES-Beziehungen mit den Schulinhalten verknüpft. Du kannst sie nutzen, um vertiefende oder weiterführende Informationen auf Universitätsniveau zu geben.',
  ].join(' '),
  en: [
    'You are a helpful chemistry assistant for students (grades 8-13) on chemie-lernen.org.',
    'Respond precisely, thoroughly, and in English.',
    'Refer to chemical concepts, formulas, and laws.',
    'Explain relationships in depth when it helps the question.',
    "If you don't know something, say so honestly.",
    'Treat context from previous questions as part of the conversation.',
    'When using sources from the context, name them explicitly in the text (e.g. "According to the knowledge graph entry on Ammonia...").',
    'The knowledge graph also contains university module catalogs (UniversityModule) from 21 international institutions (e.g. MIT, Cambridge, Stanford, ETH Zurich, TUM). These are linked to school content via TEACHES relationships. Use them to provide in-depth or university-level information.',
  ].join(' '),
};

function pickSystemPromptLang(acceptLanguageHeader) {
  if (!acceptLanguageHeader || typeof acceptLanguageHeader !== 'string') return 'de';
  var primary = acceptLanguageHeader.split(',')[0].trim().toLowerCase();
  if (primary.indexOf('en') === 0) return 'en';
  return 'de';
}

var LEARNING_LEVEL_PROMPTS = {
  beginner: 'Der Schüler ist Anfänger (Klassenstufe 8-10). Verwende einfache Sprache, viele Beispiele und vermeide komplexe Formeln. Erkläre jedes Fachwort beim ersten Gebrauch.',
  intermediate: 'Der Schüler hat Grundkenntnisse (Klassenstufe 10-12). Du kannst Fachbegriffe voraussetzen, aber erkläre komplexe Zusammenhänge ausführlich.',
  advanced: 'Der Schüler ist fortgeschritten (Oberstufe / Studium). Du kannst detaillierte fachliche Erklärungen geben, Formeln und Reaktionsmechanismen verwenden.',
};

var STYLE_PROMPTS = {
  simple: 'Antworte kurz und prägnant. Fasse dich auf das Wesentliche.',
  detailed: 'Antworte sehr ausführlich. Erkläre Hintergründe, nenne Beispiele und gehe auf verwandte Konzepte ein.',
  visual: 'Verwende anschauliche Beschreibungen. Erkläre mit Analogien und bildhafter Sprache, als ob du etwas an die Tafel zeichnen würdest.',
};

function buildSystemPrompt(opts) {
  opts = opts || {};
  var lang = pickSystemPromptLang(opts.lang);
  var parts = [SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.de];
  var lp = opts.learningProfile;

  if (lp) {
    // Learning level
    var levelPrompt = LEARNING_LEVEL_PROMPTS[lp.level];
    if (levelPrompt) parts.push(levelPrompt);

    // Explanation style
    var stylePrompt = STYLE_PROMPTS[lp.preferred_explanation_style];
    if (stylePrompt) parts.push(stylePrompt);

    // Weak areas
    if (lp.weak_areas && lp.weak_areas.length > 0) {
      var weakList = lp.weak_areas.slice(0, 3).join(', ');
      if (lang === 'en') {
        parts.push('The user struggles with: ' + weakList + '. Pay extra attention when these topics come up.');
      } else {
        parts.push('Der Schüler hat Schwierigkeiten mit: ' + weakList + '. Erkläre diese Themen besonders sorgfältig.');
      }
    }

    // Interest-based boosting
    if (lp.interests && lp.interests.length > 0) {
      var interests = lp.interests.slice(0, 5).join(', ');
      if (lang === 'en') {
        parts.push('The user is particularly interested in: ' + interests + '. Prioritize examples and explanations from these areas when possible.');
      } else {
        parts.push('Der Schüler interessiert sich besonders für: ' + interests + '. Bevorzuge Beispiele und Erklärungen aus diesen Bereichen.');
      }
    }
  }

  if (opts.currentEntity && typeof opts.currentEntity === 'string') {
    var safe = opts.currentEntity.slice(0, 120).replace(/[\r\n]+/g, ' ');
    if (lang === 'en') {
      parts.push(
        'The user is currently reading the page about "' +
          safe +
          '". Prefer to relate your answer to that entity.'
      );
    } else {
      parts.push(
        'Du liest gerade die Seite zu „' + safe + '". Beziehe dich bevorzugt auf diesen Begriff.'
      );
    }
  }
  if (opts.ragContext) {
    if (lang === 'en') parts.push('\n\nContext from the knowledge graph:\n' + opts.ragContext);
    else parts.push('\n\nKontext aus dem Wissensgraph:\n' + opts.ragContext);
  }
  return parts.join(' ');
}

function extractSourceNames(contextStr) {
  if (!contextStr) return [];
  var lines = contextStr.split('\n');
  var sources = [];
  var seenNames = {};
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.indexOf('- ') === 0) {
      var parts = line.slice(2).split(' | ');
      if (parts.length > 0) {
        var name = parts[0].trim();
        if (name && !seenNames[name]) {
          seenNames[name] = true;
          var source = { name: name, nameDisplay: name.replace(/-/g, ' ') };
          for (var p = 1; p < parts.length; p++) {
            var part = parts[p].trim();
            if (part.indexOf('Kategorie: ') === 0) {
              source.category = part.slice('Kategorie: '.length);
            } else if (part.indexOf('Score: ') === 0) {
              var scoreStr = part.slice('Score: '.length);
              var parsed = parseFloat(scoreStr);
              if (!isNaN(parsed)) source.score = parsed;
            } else if (part.indexOf('Klasse ') === 0) {
              source.grade = part;
            } else if (part.indexOf('Definition: ') === 0) {
              source.definition = part.slice('Definition: '.length);
            }
          }
          sources.push(source);
        }
      }
    }
  }
  return sources;
}

module.exports = {
  SYSTEM_PROMPTS: SYSTEM_PROMPTS,
  pickSystemPromptLang: pickSystemPromptLang,
  buildSystemPrompt: buildSystemPrompt,
  extractSourceNames: extractSourceNames,
};
