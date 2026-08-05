/**
 * Pure helpers extracted from api/server.js for unit testing.
 * Keep this in sync with the corresponding logic in server.js.
 */

var SYSTEM_PROMPTS = {
  de: [
    'Du bist ein hilfreicher Chemie-Assistent für Schüler (Klasse 8-13) auf chemie-lernen.org.',
    'Antworte kurz, praezise und auf Deutsch.',
    'Gib einen lesbaren Klartext ohne Markdown, ohne Formatierung und ohne LaTeX/Sonderzeichen aus.',
    'Verwende keine Ueberschriften, keine Aufzaehlungspunkte, kein Fettdruck, keine $...$-Formeln.',
    'Maximale Laenge: 100-150 Woerter, es sei denn der Schueler bittet explizit um ausfuehrliche Erklaerung.',
    'Schreibe chemische Formeln als Klartext wie H2O, CO2, NH3 (ohne Index, ohne LaTeX).',
    'Antworte in wenigen kurzen Saetzen direkt und ohne Umschweife.',
  ].join(' '),
  en: [
    'You are a helpful chemistry assistant for students (grades 8-13) on chemie-lernen.org.',
    'Answer concisely, precisely, and in English.',
    'Output plain readable text without Markdown, without formatting, and without LaTeX symbols.',
    'Do not use headings, bullet points, bold, $...$ formulas.',
    'Max length: 100-150 words unless the student explicitly asks for a detailed explanation.',
    'Write chemical formulas as plain text like H2O, CO2, NH3 (no subscripts, no LaTeX).',
  ].join(' '),
};

function pickSystemPromptLang(acceptLanguageHeader) {
  if (!acceptLanguageHeader || typeof acceptLanguageHeader !== 'string') return 'de';
  var primary = acceptLanguageHeader.split(',')[0].trim().toLowerCase();
  if (primary.indexOf('en') === 0) return 'en';
  return 'de';
}

var LEARNING_LEVEL_PROMPTS = {
  beginner:
    'Der Schüler ist Anfänger (Klassenstufe 8-10). Verwende einfache Sprache und kurze Sätze. Erkläre jedes Fachwort beim ersten Gebrauch.',
  intermediate:
    'Der Schüler hat Grundkenntnisse (Klassenstufe 10-12). Du kannst Fachbegriffe voraussetzen, aber bleib kurz und klar.',
  advanced:
    'Der Schüler ist fortgeschritten (Oberstufe / Studium). Du kannst präzise fachliche Erklärungen geben, aber weiterhin kurz und ohne Markdown.',
};

var STYLE_PROMPTS = {
  simple: 'Antworte besonders kurz. 2-4 Saetze.',
  detailed:
    'Der Schueler wuenscht eine ausfuehrliche Erklaerung. Du darfst dann bis ca. 300 Woerter gehen, aber bleib Klartext ohne Markdown.',
  visual: 'Erklaere anschaulich mit Analogien und bildhafter Sprache, aber in Klartext und kurz.',
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
        parts.push(
          'The user struggles with: ' +
            weakList +
            '. Pay extra attention when these topics come up.'
        );
      } else {
        parts.push(
          'Der Schüler hat Schwierigkeiten mit: ' +
            weakList +
            '. Erkläre diese Themen besonders sorgfältig.'
        );
      }
    }

    // Interest-based boosting
    if (lp.interests && lp.interests.length > 0) {
      var interests = lp.interests.slice(0, 5).join(', ');
      if (lang === 'en') {
        parts.push(
          'The user is particularly interested in: ' +
            interests +
            '. Prioritize examples and explanations from these areas when possible.'
        );
      } else {
        parts.push(
          'Der Schüler interessiert sich besonders für: ' +
            interests +
            '. Bevorzuge Beispiele und Erklärungen aus diesen Bereichen.'
        );
      }
    }
  }

  if (
    opts.conversationMemory &&
    opts.conversationMemory.conversations &&
    opts.conversationMemory.conversations.length > 0
  ) {
    var summaries = opts.conversationMemory.conversations
      .map((c) => c.topicSummary)
      .filter(Boolean)
      .join(', ');
    if (summaries) {
      parts.push('Bisherige Themen: ' + summaries + '. Knüpfe an bekannte Konzepte an.');
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
    // Token-Gating: Kontext auf ~2000 Zeichen begrenzen, um Prompt-Tokens zu sparen.
    var ctxLimited =
      opts.ragContext.length > 2000 ? opts.ragContext.slice(0, 1997) + '...' : opts.ragContext;
    if (lang === 'en') parts.push('\n\nContext from the knowledge graph:\n' + ctxLimited);
    else parts.push('\n\nKontext aus dem Wissensgraph:\n' + ctxLimited);
  }

  // Injected entity context (Sprint 30)
  if (opts.entities && opts.entities.length > 0) {
    var entityNames = opts.entities
      .map(function (e) {
        return e.name;
      })
      .join(', ');
    var relatedNames = opts.entities
      .slice(0, 3)
      .map(function (e) {
        return e.name;
      })
      .join(', ');
    if (lang === 'en') {
      parts.push('The user is asking about: ' + entityNames + '.');
      parts.push('Related concepts: ' + relatedNames + '.');
    } else {
      parts.push('Der Nutzer fragt über: ' + entityNames + '.');
      parts.push('Verwandte Konzepte: ' + relatedNames + '.');
    }
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
