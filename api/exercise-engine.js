/**
 * exercise-engine.js — Exercise generation & grading engine for chemie-lernen.org
 *
 * Generates chemistry exercises (MCQ, fill-blank, calculation, short-answer)
 * via LiteLLM, grades answers, and queries Neo4j for curriculum context.
 *
 * All exercise content is in German (de-de).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ── Prompt loading (cached) ──────────────────────────────────

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const PROMPT_DIR = path.join(__dirname, 'prompts');

let _genPrompt = null;
let _gradePrompt = null;

/**
 * Load a prompt template from disk, cached after first read.
 * @param {'generation'|'grading'} which
 * @returns {string}
 */
function loadPrompt(which) {
  if (which === 'generation') {
    if (_genPrompt) return _genPrompt;
    const p = path.join(PROMPT_DIR, 'exercise-generation.txt');
    _genPrompt = fs.readFileSync(p, 'utf-8');
    return _genPrompt;
  }
  if (which === 'grading') {
    if (_gradePrompt) return _gradePrompt;
    const p = path.join(PROMPT_DIR, 'exercise-grading.txt');
    _gradePrompt = fs.readFileSync(p, 'utf-8');
    return _gradePrompt;
  }
  throw new Error(`Unknown prompt type: ${which}`);
}

// ── LiteLLM helper ───────────────────────────────────────────

/**
 * Call LiteLLM chat completions and return parsed content.
 * @param {string} systemMsg
 * @param {string} userMsg
 * @param {string} litellmUrl
 * @param {string} litellmModel
 * @param {number} [temperature=0.7]
 * @returns {Promise<string>} response text
 */
async function callLiteLLM(systemMsg, userMsg, litellmUrl, litellmModel, temperature) {
  temperature = temperature ?? 0.7;
  const res = await fetch(`${litellmUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (process.env.LITELLM_API_KEY || ''),
    },
    body: JSON.stringify({
      model: litellmModel,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      max_tokens: 2048,
      temperature,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LiteLLM error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  if (!content) throw new Error('LiteLLM returned empty response');

  return content;
}

/**
 * Safely parse JSON from LLM response, stripping markdown fences if present.
 * @param {string} text
 * @returns {object}
 */
function parseJSON(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    // Remove opening fence (possibly with language hint)
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    }
    // Remove closing fence
    const fenceEnd = cleaned.lastIndexOf('```');
    if (fenceEnd !== -1) {
      cleaned = cleaned.slice(0, fenceEnd);
    }
    cleaned = cleaned.trim();
  }

  return JSON.parse(cleaned);
}

// ── Core exports ─────────────────────────────────────────────

/**
 * Generate a chemistry exercise using LiteLLM.
 *
 * @param {string} learningObjectiveSlug - Slug for the learning objective/topic
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {'mcq'|'fill-blank'|'calculation'|'short-answer'} type
 * @param {string} litellmUrl - LiteLLM proxy URL
 * @param {string} litellmModel - Model name (e.g. 'gemma-4')
 * @param {string} kgData - Formatted context string from getKGContext()
 * @returns {Promise<object>} Exercise object
 *
 * @throws {Error} If LLM call fails or response cannot be parsed
 */
export async function generateExercise(
  learningObjectiveSlug,
  difficulty,
  type,
  litellmUrl,
  litellmModel,
  kgData
) {
  const validDifficulties = ['easy', 'medium', 'hard'];
  const validTypes = ['mcq', 'fill-blank', 'calculation', 'short-answer'];

  if (!validDifficulties.includes(difficulty)) {
    throw new Error(
      `Invalid difficulty: ${difficulty}. Must be one of: ${validDifficulties.join(', ')}`
    );
  }
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
  }

  // The learningObjective slug also serves as the "title" display
  const learningObjectiveTitle = learningObjectiveSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const template = loadPrompt('generation');

  // Replace all placeholders
  const filledPrompt = template
    .replace(/\{\{kg_context\}\}/g, kgData || 'Keine spezifischen Wissensdaten verfügbar.')
    .replace(/\{\{difficulty\}\}/g, difficulty)
    .replace(/\{\{exercise_type\}\}/g, type)
    .replace(/\{\{learning_objective\}\}/g, learningObjectiveTitle)
    .replace(/\{\{learning_objective_slug\}\}/g, learningObjectiveSlug);

  const systemMessage =
    'Du bist eine erfahrene Chemie-Lehrkraft, die Übungsaufgaben für Schüler*innen erstellt. ' +
    'Antworte NUR mit einem validen JSON-Objekt. Keine zusätzlichen Erklärungen.';

  const raw = await callLiteLLM(systemMessage, filledPrompt, litellmUrl, litellmModel, 0.8);

  let parsed;
  try {
    parsed = parseJSON(raw);
  } catch (parseErr) {
    throw new Error(
      `Failed to parse exercise JSON from LLM response: ${parseErr.message}\nRaw: ${raw.slice(0, 500)}`,
      { cause: parseErr }
    );
  }

  // Validate required fields
  if (!parsed.question) {
    throw new Error('LLM response missing required field: question');
  }

  // Build the canonical exercise object
  const exercise = {
    id: crypto.randomUUID(),
    type: parsed.type || type,
    difficulty: parsed.difficulty || difficulty,
    question: parsed.question,
    options: type === 'mcq' ? parsed.options || [] : null,
    correctAnswer: parsed.correctAnswer || '',
    tolerance:
      typeof parsed.tolerance === 'number' ? parsed.tolerance : type === 'calculation' ? 0.5 : 0.0,
    explanation: parsed.explanation || '',
    learningObjective: {
      slug: learningObjectiveSlug,
      title: learningObjectiveTitle,
    },
    topic: parsed.topic || learningObjectiveTitle,
    createdAt: new Date().toISOString(),
  };

  return exercise;
}

/**
 * Grade a user's answer to an exercise.
 *
 * @param {object} exercise - The exercise object (from generateExercise)
 * @param {string|number} userAnswer - The student's answer
 * @param {string} litellmUrl - LiteLLM proxy URL
 * @param {string} litellmModel - Model name
 * @returns {Promise<{correct: boolean, score: number, feedback: string}>}
 */
export async function gradeAnswer(exercise, userAnswer, litellmUrl, litellmModel) {
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return {
      correct: false,
      score: 0,
      feedback: 'Bitte gib eine Antwort ein.',
    };
  }

  const type = exercise.type;

  // Direct comparison for MCQ
  if (type === 'mcq') {
    const correct =
      String(userAnswer).trim().toUpperCase() ===
      String(exercise.correctAnswer).trim().toUpperCase();
    const correctOption = (exercise.options || []).find(
      (o) => o.id.toUpperCase() === String(exercise.correctAnswer).trim().toUpperCase()
    );
    var baseMsg;
    if (correct) {
      baseMsg = 'Richtig! ' + (exercise.explanation || '');
    } else {
      var wrongMsg =
        exercise.explanation || 'Die richtige Antwort ist ' + exercise.correctAnswer + '.';
      baseMsg = 'Leider nicht richtig. ' + wrongMsg;
      if (correctOption) {
        baseMsg += ' (' + correctOption.text + ')';
      }
    }
    return {
      correct: correct,
      score: correct ? 100 : 0,
      feedback: baseMsg,
    };
  }

  // Numeric comparison for calculation
  if (type === 'calculation') {
    const userNum = parseFloat(String(userAnswer).replace(',', '.'));
    if (isNaN(userNum)) {
      return {
        correct: false,
        score: 0,
        feedback: 'Bitte gib eine gültige Zahl ein (z. B. 0.5 oder 1,23).',
      };
    }
    const correctNum = parseFloat(String(exercise.correctAnswer).replace(',', '.'));
    const tolerance =
      typeof exercise.tolerance === 'number' && exercise.tolerance > 0 ? exercise.tolerance : 0.5;
    const diff = Math.abs(userNum - correctNum);
    const correct = diff <= tolerance;

    // Partial credit: score based on how close the answer is
    let score;
    if (correct) {
      score = diff <= tolerance * 0.25 ? 100 : diff <= tolerance * 0.5 ? 80 : 60;
    } else {
      score = 0;
    }

    return {
      correct,
      score,
      feedback: correct
        ? 'Richtig! ' +
          (exercise.explanation ||
            `Die Antwort ${correctNum} ist korrekt (Toleranz: ±${tolerance}).`)
        : `Deine Antwort (${userNum}) weicht zu stark von der erwarteten Lösung (${correctNum} ± ${tolerance}) ab. ` +
          (exercise.explanation || 'Überprüfe deine Berechnung und Einheiten.'),
    };
  }

  // Fill-blank: direct comparison (case-insensitive, trimmed)
  if (type === 'fill-blank') {
    const userStr = String(userAnswer).trim().toLowerCase();
    const correctStr = String(exercise.correctAnswer).trim().toLowerCase();
    const correct = userStr === correctStr;
    return {
      correct,
      score: correct ? 100 : 0,
      feedback: correct
        ? 'Richtig! ' + (exercise.explanation || '')
        : 'Leider nicht richtig. Die korrekte Antwort ist "' +
          exercise.correctAnswer +
          '". ' +
          (exercise.explanation || ''),
    };
  }

  // Short-answer: use LiteLLM grading prompt
  if (type === 'short-answer') {
    const template = loadPrompt('grading');
    const filledPrompt = template
      .replace(/\{\{question\}\}/g, exercise.question)
      .replace(/\{\{model_answer\}\}/g, String(exercise.correctAnswer))
      .replace(/\{\{student_answer\}\}/g, String(userAnswer))
      .replace(/\{\{difficulty\}\}/g, exercise.difficulty || 'medium');

    const systemMessage =
      'Du bist eine Chemie-Lehrkraft, die Schülerantworten fair und nachvollziehbar bewertet. ' +
      'Antworte NUR mit einem validen JSON-Objekt.';

    const raw = await callLiteLLM(systemMessage, filledPrompt, litellmUrl, litellmModel, 0.3);

    let grade;
    try {
      grade = parseJSON(raw);
    } catch {
      return {
        correct: false,
        score: 50,
        feedback:
          'Die Antwort konnte nicht automatisch bewertet werden. Ein Lehrer wird sie überprüfen.',
      };
    }

    return {
      correct: !!grade.correct,
      score: typeof grade.score === 'number' ? Math.max(0, Math.min(100, grade.score)) : 50,
      feedback: grade.feedback || 'Kein Feedback verfügbar.',
    };
  }

  throw new Error(`Unknown exercise type: ${type}`);
}

/**
 * Query Neo4j for KG context related to a learning objective slug.
 * Returns a formatted string suitable for the prompt template.
 *
 * @param {string} slug - Learning objective or topic slug
 * @param {object} neo4jSession - An open Neo4j session (READ mode)
 * @returns {Promise<string>} Formatted context or empty string
 */
export async function getKGContext(slug, neo4jSession) {
  if (!slug || !neo4jSession) return '';

  const lines = [];

  try {
    // 1. Find the topic and its learning objectives by slug
    const topicResult = await neo4jSession.run(
      `MATCH (t:Topic)
       WHERE t.slug CONTAINS $slug OR t.title CONTAINS $slug
       OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
       WITH t, collect(DISTINCT lo.text) AS objectives
       RETURN t.title AS title, t.slug AS slug,
              t.grade AS grade, objectives
       LIMIT 3`,
      { slug }
    );

    if (topicResult.records.length > 0) {
      lines.push('=== Lehrplan-Thema ===');
      for (const rec of topicResult.records) {
        const title = rec.get('title') || '';
        const grade = rec.get('grade') || '';
        const objectives = (rec.get('objectives') || []).filter(Boolean);
        lines.push(`- Thema: ${title}${grade ? ' (Klasse ' + grade + ')' : ''}`);
        if (objectives.length > 0) {
          lines.push('  Lernziele:');
          for (const obj of objectives) {
            lines.push(`  • ${obj}`);
          }
        }
      }
    }

    // 2. Find entities related to this topic/learning objective
    const entityResult = await neo4jSession.run(
      `MATCH (t:Topic)
       WHERE t.slug CONTAINS $slug OR t.title CONTAINS $slug
       OPTIONAL MATCH (t)<-[:COVERS_TOPIC|RELATED_TO]-(e:Entity)
       WHERE e.description IS NOT NULL AND e.description <> ''
       WITH e, coalesce(e.kategorie, 'konzept') AS kat
       RETURN e.name AS name, kat AS kategorie,
              e.description AS description
       LIMIT 15`,
      { slug }
    );

    if (entityResult.records.length > 0) {
      lines.push('');
      lines.push('=== Verwandte Konzepte aus dem Wissensgraph ===');
      for (const rec of entityResult.records) {
        const name = rec.get('name');
        const kat = rec.get('kategorie') || 'konzept';
        const desc = rec.get('description') || '';
        const shortDesc = desc.length > 250 ? desc.slice(0, 247) + '...' : desc;
        lines.push(`- ${name} (${kat})`);
        if (shortDesc) lines.push(`  Beschreibung: ${shortDesc}`);
      }
    }

    // 3. Try learning objective direct match (if slug refers to a LO, not a Topic)
    if (topicResult.records.length === 0) {
      const loResult = await neo4jSession.run(
        `MATCH (lo:LearningObjective)
         WHERE lo.slug CONTAINS $slug OR lo.text CONTAINS $slug
         OPTIONAL MATCH (t:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo)
         RETURN lo.text AS text, t.title AS topicTitle
         LIMIT 3`,
        { slug }
      );

      if (loResult.records.length > 0) {
        lines.push('=== Lernziel ===');
        for (const rec of loResult.records) {
          const text = rec.get('text') || '';
          const topicTitle = rec.get('topicTitle') || '';
          lines.push(`- Lernziel: ${text}`);
          if (topicTitle) lines.push(`  (Thema: ${topicTitle})`);
        }
      }
    }

    if (lines.length === 0) {
      lines.push(`Keine spezifischen Wissensdaten zum Thema "${slug}" gefunden.`);
    }

    return lines.join('\n');
  } catch (err) {
    console.error('[exercise-engine] getKGContext error:', err.message);
    return `Fehler beim Abrufen des Wissenskontexts: ${err.message}`;
  }
}
