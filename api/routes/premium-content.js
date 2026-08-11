/**
 * Premium Content route handlers — lesson plan + worksheet generation.
 *
 * Routes (all require premium):
 *   POST /api/premium/lesson-plan
 *   POST /api/premium/worksheet
 */

import { Router } from 'express';
import pino from 'pino';
import { requirePremium } from '../auth.js';
import { getNeo4jDriver, NEO4J_DATABASE } from '../services/neo4j.js';
import { checkScopedQuota } from '../services/session.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm-proxy:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL_PREMIUM || process.env.LITELLM_MODEL || 'gemma-4';

/** Grade levels accepted */
const VALID_GRADES = ['8', '9', '10', '11', '12', '13'];
/** Duration options */
const VALID_DURATIONS = ['15', '30', '45', '60', '90'];
/** Difficulty levels */
const VALID_DIFFICULTIES = ['einfach', 'mittel', 'fortgeschritten'];
/** Exercise types */
const VALID_EXERCISE_TYPES = ['multiple-choice', 'lueckentext', 'berechnung', 'kurzantwort'];

// ── Lesson Plan ───────────────────────────────────────────────

/**
 * Build a structured prompt for lesson plan generation.
 * Includes KG context (learning objectives, related entities).
 */
function buildLessonPlanPrompt({ topic, klassenstufe, duration, difficulty }) {
  return `Du bist ein erfahrener Chemie-Lehrer. Erstelle einen detaillierten Unterrichtsplan für eine ${duration}-Minuten-Stunde zum Thema "${topic}" für die Klassenstufe ${klassenstufe} (Schwierigkeit: ${difficulty}).

Der Unterrichtsplan MUSS als JSON-Objekt zurückgegeben werden (kein Markdown, nur rohes JSON) mit folgender Struktur:
{
  "title": "Titel der Unterrichtsstunde",
  "klassenstufe": "${klassenstufe}",
  "duration": "${duration}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "objectives": ["Lernziel 1", "Lernziel 2", "Lernziel 3"],
  "priorKnowledge": ["Voraussetzung 1", "Voraussetzung 2"],
  "materials": ["Material 1", "Material 2"],
  "phases": [
    {
      "name": "Einstieg",
      "duration": "5 Min.",
      "activity": "Beschreibung der Aktivität",
      "teacherAction": "Was die Lehrkraft tut",
      "studentAction": "Was die Schüler tun"
    },
    {
      "name": "Erarbeitung",
      "duration": "20 Min.",
      "activity": "...",
      "teacherAction": "...",
      "studentAction": "..."
    },
    {
      "name": "Sicherung",
      "duration": "10 Min.",
      "activity": "...",
      "teacherAction": "...",
      "studentAction": "..."
    },
    {
      "name": "Übungsphase",
      "duration": "15 Min.",
      "activity": "...",
      "teacherAction": "...",
      "studentAction": "..."
    }
  ],
  "assessment": {
    "formative": "Wie wird during der Stunde überprüft?",
    "summative": "Hausaufgabe oder Abschlussaufgabe"
  },
  "homework": "Hausaufgabe",
  "differentiation": {
    "stronger": "Erweiterung für stärkere Schüler",
    "weaker": "Unterstützung für schwächere Schüler"
  },
  "tips": "Tipps für die Lehrkraft"
}`;
}

/**
 * POST /api/premium/lesson-plan
 * Body: { topic, klassenstufe, duration, difficulty }
 */
router.post('/api/premium/lesson-plan', requirePremium, async (req, res) => {
  try {
    const { topic, klassenstufe = '10', duration = '45', difficulty = 'mittel' } = req.body;

    // LLM cost bound: 10 lesson plans / day / user (premium route hits LiteLLM).
    const quota = checkScopedQuota('lesson-plan', 'u:' + req.user.id, 10);
    if (!quota.allowed) {
      return res.status(429).json({
        error: 'Tageslimit für Unterrichtsentwürfe erreicht',
        message: 'Maximal 10 Unterrichtsentwürfe pro Tag.',
        remaining: 0,
      });
    }

    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return res.status(400).json({ error: 'topic ist erforderlich (min. 2 Zeichen)' });
    }
    if (!VALID_GRADES.includes(String(klassenstufe))) {
      return res.status(400).json({ error: 'Ungültige Klassenstufe. Erlaubt: 8-13' });
    }
    if (!VALID_DURATIONS.includes(String(duration))) {
      return res.status(400).json({ error: 'Ungültige Dauer. Erlaubt: 15, 30, 45, 60, 90' });
    }
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res
        .status(400)
        .json({ error: 'Ungültige Schwierigkeit. Erlaubt: einfach, mittel, fortgeschritten' });
    }

    // Try to fetch KG context for this topic
    let kgContext = '';
    try {
      const driver = getNeo4jDriver();
      const session = driver.session({ database: NEO4J_DATABASE });
      try {
        const result = await session.run(
          `MATCH (e:Entity)
           WHERE toLower(e.name) CONTAINS toLower($topic)
              OR ANY(tag IN e.tags WHERE toLower(tag) CONTAINS toLower($topic))
           RETURN e.name AS name, e.description AS description, e.category AS category
           LIMIT 5`,
          { topic: topic.trim() }
        );
        if (result.records.length > 0) {
          kgContext =
            '\n\nKontext aus dem Wissensnetz:\n' +
            result.records
              .map(
                (r) =>
                  `- ${r.get('name')} (${r.get('category')}): ${(r.get('description') || '').slice(0, 150)}`
              )
              .join('\n');
        }
      } finally {
        await session.close();
      }
    } catch (err) {
      logger.warn(
        { err: err, message: err.message || String(err) },
        '[lesson-plan] KG lookup failed (non-fatal)'
      );
    }

    const prompt = buildLessonPlanPrompt({ topic, klassenstufe, duration, difficulty }) + kgContext;

    const llmRes = await fetch(LITELLM_URL + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (process.env.LITELLM_API_KEY || ''),
      },
      body: JSON.stringify({
        model: LITELLM_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein Chemie-Didaktik-Experte. Antworte AUSSCHLIESSLICH mit gültigem JSON, kein Markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!llmRes.ok) {
      const errBody = await llmRes.text();
      logger.error({ status: llmRes.status, errBody, message: '[lesson-plan] LiteLLM error' });
      return res
        .status(502)
        .json({ error: 'KI-Modell nicht verfügbar. Bitte später erneut versuchen.' });
    }

    const llmJson = await llmRes.json();
    const content = llmJson.choices?.[0]?.message?.content || '';

    // Parse JSON from response (handle markdown code blocks)
    let lessonPlan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      lessonPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseErr) {
      logger.error({
        err: parseErr,
        raw: content.slice(0, 200),
        message: '[lesson-plan] JSON parse error',
      });
      return res
        .status(502)
        .json({ error: 'KI-Antwort konnte nicht verarbeitet werden.', raw: content });
    }

    res.json({ lessonPlan, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[lesson-plan] error');
    res.status(500).json({ error: 'Unterrichtsplan konnte nicht erstellt werden' });
  }
});

// ── Worksheet ─────────────────────────────────────────────────

/**
 * POST /api/premium/worksheet
 * Body: { topic, exerciseCount, types }
 */
router.post('/api/premium/worksheet', requirePremium, async (req, res) => {
  try {
    const { topic, exerciseCount = 5, types = ['multiple-choice', 'berechnung'] } = req.body;

    // LLM cost bound: 10 worksheets / day / user (premium route hits LiteLLM).
    const quota = checkScopedQuota('worksheet', 'u:' + req.user.id, 10);
    if (!quota.allowed) {
      return res.status(429).json({
        error: 'Tageslimit für Arbeitsblätter erreicht',
        message: 'Maximal 10 Arbeitsblätter pro Tag.',
        remaining: 0,
      });
    }

    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return res.status(400).json({ error: 'topic ist erforderlich (min. 2 Zeichen)' });
    }

    const count = Math.max(1, Math.min(20, Number(exerciseCount) || 5));
    const validTypes = (Array.isArray(types) ? types : [types]).filter((t) =>
      VALID_EXERCISE_TYPES.includes(t)
    );
    if (validTypes.length === 0) {
      return res.status(400).json({
        error: 'Ungültige Aufgabentypen. Erlaubt: ' + VALID_EXERCISE_TYPES.join(', '),
      });
    }

    const prompt = `Du bist ein Chemie-Lehrer. Erstelle ${count} Übungen zum Thema "${topic}".

Aufgabentypen: ${validTypes.join(', ')}.

Die Übungen MÜSSEN als JSON-Array zurückgegeben werden (kein Markdown):
[
  {
    "type": "multiple-choice",
    "question": "Fragetext",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Erklärung der Lösung"
  },
  {
    "type": "berechnung",
    "question": "Berechne...",
    "givenValues": {"substanz": "...", "menge": "...", "einheit": "..."},
    "formula": "Formel",
    "solution": "Lösungsweg",
    "answer": "Ergebnis mit Einheit",
    "explanation": "Erklärung"
  },
  {
    "type": "lueckentext",
    "text": "Text mit _____ Lücken",
    "blanks": ["Antwort1", "Antwort2"],
    "explanation": "Erklärung"
  },
  {
    "type": "kurzantwort",
    "question": "Offene Frage",
    "keyPoints": ["Punkt1", "Punkt2"],
    "sampleAnswer": "Musterantwort"
  }
]

Variiere die Aufgabentypen gleichmäßig über die ${count} Aufgaben.`;

    const llmRes = await fetch(LITELLM_URL + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (process.env.LITELLM_API_KEY || ''),
      },
      body: JSON.stringify({
        model: LITELLM_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein Chemie-Lehrer. Antworte AUSSCHLIESSLICH mit gültigem JSON, kein Markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!llmRes.ok) {
      const errBody = await llmRes.text();
      logger.error({ status: llmRes.status, errBody, message: '[worksheet] LiteLLM error' });
      return res.status(502).json({ error: 'KI-Modell nicht verfügbar.' });
    }

    const llmJson = await llmRes.json();
    const content = llmJson.choices?.[0]?.message?.content || '';

    let exercises;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      exercises = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseErr) {
      logger.error(
        { err: parseErr, message: parseErr.message || String(parseErr) },
        '[worksheet] JSON parse error'
      );
      return res
        .status(502)
        .json({ error: 'Übungen konnten nicht verarbeitet werden.', raw: content });
    }

    if (!Array.isArray(exercises)) {
      return res.status(502).json({ error: 'Unerwartetes Format der KI-Antwort.' });
    }

    res.json({
      exercises: exercises.slice(0, count),
      topic,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[worksheet] error');
    res.status(500).json({ error: 'Arbeitsblatt konnte nicht erstellt werden' });
  }
});

export default router;
