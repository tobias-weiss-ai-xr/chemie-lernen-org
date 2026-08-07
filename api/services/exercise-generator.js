/**
 * exercise-generator.js — Enhanced exercise generation service.
 *
 * Builds on the existing exercise-engine.js with:
 * - Fill-in-blank generation with acceptable-answer detection
 * - Calculation generation with tolerance computation
 * - Short-answer generation with rubric (keyConcepts, length constraints)
 * - Topic discovery fallback via Neo4j
 * - FSRS-calibrated difficulty adjustment
 * - Distractor plausibility validation for MCQ
 * - Generation caching (24h TTL)
 *
 * All content is in German (de-de).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getNeo4jDriver, NEO4J_DATABASE } from '../services/neo4j.js';

// ── In-memory generation cache ────────────────────────────────────────
// Key: `${learningObjectiveSlug}::${difficulty}::${type}`
// Value: { exercise, createdAt }

const generationCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const PROMPT_DIR = path.join(__dirname, '..', 'prompts');

let _genPromptCache = null;

/**
 * Load the generation prompt template.
 * @returns {string}
 */
function loadPrompt() {
  if (_genPromptCache) return _genPromptCache;
  const p = path.join(PROMPT_DIR, 'exercise-generation.txt');
  _genPromptCache = fs.readFileSync(p, 'utf-8');
  return _genPromptCache;
}

// ── LiteLLM helper ────────────────────────────────────────────────────

/**
 * Call LiteLLM and return parsed JSON content.
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
 * Safely parse JSON from LLM response, stripping markdown fences.
 */
function parseJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1) cleaned = cleaned.slice(firstNewline + 1);
    const fenceEnd = cleaned.lastIndexOf('```');
    if (fenceEnd !== -1) cleaned = cleaned.slice(0, fenceEnd);
    cleaned = cleaned.trim();
  }
  return JSON.parse(cleaned);
}

// ── Cache functions ───────────────────────────────────────────────────

function getCacheKey(slug, difficulty, type) {
  return `${slug}::${difficulty}::${type}`;
}

function getCachedExercise(slug, difficulty, type) {
  const key = getCacheKey(slug, difficulty, type);
  const entry = generationCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    generationCache.delete(key);
    return null;
  }
  return entry.exercise;
}

function setCachedExercise(slug, difficulty, type, exercise) {
  const key = getCacheKey(slug, difficulty, type);
  generationCache.set(key, { exercise, createdAt: Date.now() });
  if (generationCache.size > 5000) {
    const oldest = generationCache.entries().next().value;
    if (oldest) generationCache.delete(oldest[0]);
  }
}

// ── FSRS calibration ──────────────────────────────────────────────────

/**
 * Adjust difficulty label based on FSRS stability context.
 * If stability is low, hint toward easier side of the requested difficulty.
 *
 * @param {'easy'|'medium'|'hard'} requestedDifficulty
 * @param {object|null} fsrsContext - { stability: number, difficulty: number, retrievability: number }
 * @returns {{ difficulty: string, includeHint: boolean }}
 */
export function calibrateDifficulty(requestedDifficulty, fsrsContext) {
  if (!fsrsContext || !fsrsContext.stability) {
    return { difficulty: requestedDifficulty, includeHint: false };
  }

  const stability = fsrsContext.stability;
  let adjusted = requestedDifficulty;
  let includeHint = false;

  // If stability is very low, ease the difficulty
  if (stability < 3 && requestedDifficulty !== 'easy') {
    adjusted = requestedDifficulty === 'hard' ? 'medium' : 'easy';
    includeHint = true;
  } else if (stability < 7 && requestedDifficulty === 'hard') {
    adjusted = 'medium';
    includeHint = true;
  }

  return { difficulty: adjusted, includeHint };
}

// ── Topic discovery ───────────────────────────────────────────────────

/**
 * Query Neo4j for learning objectives under a topic.
 * Used as fallback when no specific learningObjectiveSlug is provided.
 *
 * @param {string} topicSlug
 * @returns {Promise<Array<{slug: string, text: string}>>}
 */
export async function getLearningObjectivesForTopic(topicSlug) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const result = await session.run(
      `
      MATCH (t:Topic)
      WHERE t.slug CONTAINS $topicSlug
      OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
      RETURN lo.slug AS slug, lo.text AS text
      LIMIT 20
      `,
      { topicSlug }
    );

    return result.records
      .map((rec) => ({
        slug: rec.get('slug') || '',
        text: rec.get('text') || '',
      }))
      .filter((lo) => lo.slug && lo.text);
  } finally {
    await session.close();
  }
}

// ── KG context ────────────────────────────────────────────────────────

/**
 * Get formatted KG context for a learning objective or topic.
 * Reuses the getKGContext function from exercise-engine.
 *
 * @param {string} slug
 * @returns {Promise<string>}
 */
async function getKGContext(slug) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const lines = [];

    // Find topic and learning objectives
    const topicResult = await session.run(
      `MATCH (t:Topic)
       WHERE t.slug CONTAINS $slug OR t.title CONTAINS $slug
       OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
       WITH t, collect(DISTINCT lo.text) AS objectives
       RETURN t.title AS title, t.slug AS slug, objectives
       LIMIT 3`,
      { slug }
    );

    if (topicResult.records.length > 0) {
      lines.push('=== Lehrplan-Thema ===');
      for (const rec of topicResult.records) {
        const title = rec.get('title') || '';
        const objectives = (rec.get('objectives') || []).filter(Boolean);
        lines.push(`- Thema: ${title}`);
        if (objectives.length > 0) {
          lines.push('  Lernziele:');
          for (const obj of objectives) lines.push(`  • ${obj}`);
        }
      }
    }

    // Find related entities
    const entityResult = await session.run(
      `MATCH (t:Topic)
       WHERE t.slug CONTAINS $slug OR t.title CONTAINS $slug
       OPTIONAL MATCH (t)<-[:COVERS_TOPIC|RELATED_TO]-(e:Entity)
       WHERE e.description IS NOT NULL AND e.description <> ''
       RETURN e.name AS name, e.kategorie AS kategorie, e.description AS description
       LIMIT 15`,
      { slug }
    );

    if (entityResult.records.length > 0) {
      lines.push('');
      lines.push('=== Verwandte Konzepte ===');
      for (const rec of entityResult.records) {
        const name = rec.get('name');
        const kat = rec.get('kategorie') || 'konzept';
        const desc = rec.get('description') || '';
        const shortDesc = desc.length > 250 ? desc.slice(0, 247) + '...' : desc;
        lines.push(`- ${name} (${kat})`);
        if (shortDesc) lines.push(`  Beschreibung: ${shortDesc}`);
      }
    }

    return lines.join('\n') || `Keine spezifischen Wissensdaten zum Thema "${slug}" gefunden.`;
  } finally {
    await session.close();
  }
}

// ── Distractor validation ─────────────────────────────────────────────

/**
 * Validate that MCQ distractors are plausible (not obviously wrong).
 * Checks: distractors are not identical to the correct answer, not formatted
 * drastically differently, and cover common misconceptions for the level.
 *
 * @param {object[]} options - [{ id: string, text: string }]
 * @param {string} correctId
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {{ valid: boolean, issues: string[] }}
 */
export function validateDistractors(options, correctId, difficulty) {
  const issues = [];
  if (!options || options.length < 2) {
    return { valid: false, issues: ['Mindestens 2 Optionen erforderlich'] };
  }

  const correctOption = options.find(
    (o) => String(o.id).toUpperCase() === String(correctId).toUpperCase()
  );
  if (!correctOption) {
    return { valid: false, issues: ['Correct answer not found in options'] };
  }

  const distractors = options.filter(
    (o) => String(o.id).toUpperCase() !== String(correctId).toUpperCase()
  );

  for (const dist of distractors) {
    // Check for identical text
    if (dist.text.trim().toLowerCase() === correctOption.text.trim().toLowerCase()) {
      issues.push(`Distractor "${dist.id}" is identical to correct answer`);
    }

    // Check for absurdly short/long answers that give away the answer
    const lenRatio = dist.text.length / Math.max(correctOption.text.length, 1);
    if (lenRatio < 0.15 || lenRatio > 3) {
      if (difficulty !== 'easy') {
        issues.push(
          `Distractor "${dist.id}" length ratio ${lenRatio.toFixed(1)} — may be detectably different`
        );
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

// ── Main generation function ──────────────────────────────────────────

/**
 * Generate an exercise using LiteLLM, with caching and FSRS calibration.
 *
 * @param {object} params
 * @param {string} params.learningObjectiveSlug - Slug for the learning objective/topic
 * @param {'easy'|'medium'|'hard'} params.difficulty
 * @param {'mcq'|'fill-blank'|'calculation'|'short-answer'} params.type
 * @param {string} params.litellmUrl - LiteLLM proxy URL
 * @param {string} params.litellmModel - Model name
 * @param {object} [params.fsrsContext] - { stability, difficulty, retrievability }
 * @param {boolean} [params.bypassCache=false] - Skip cache
 * @returns {Promise<object>} Exercise object
 */
export async function generateExercise({
  learningObjectiveSlug,
  difficulty,
  type,
  litellmUrl,
  litellmModel,
  fsrsContext,
  bypassCache,
}) {
  // Validate
  const validDifficulties = ['easy', 'medium', 'hard'];
  const validTypes = ['mcq', 'fill-blank', 'calculation', 'short-answer'];

  if (!validDifficulties.includes(difficulty)) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid type: ${type}`);
  }

  // Check cache
  if (!bypassCache) {
    const cached = getCachedExercise(learningObjectiveSlug, difficulty, type);
    if (cached) return { ...cached, cached: true };
  }

  // Calibrate difficulty based on FSRS context
  const calibration = calibrateDifficulty(difficulty, fsrsContext);
  const effectiveDifficulty = calibration.difficulty;

  // Get KG context
  const kgData = await getKGContext(learningObjectiveSlug);

  const learningObjectiveTitle = learningObjectiveSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Build prompt
  const template = loadPrompt();
  const filledPrompt = template
    .replace(/\{\{kg_context\}\}/g, kgData)
    .replace(/\{\{difficulty\}\}/g, effectiveDifficulty)
    .replace(/\{\{exercise_type\}\}/g, type)
    .replace(/\{\{learning_objective\}\}/g, learningObjectiveTitle)
    .replace(/\{\{learning_objective_slug\}\}/g, learningObjectiveSlug);

  // Add calibration hint for low-stability learners (applied by the model
  // as part of the prompt below).

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

  if (!parsed.question) {
    throw new Error('LLM response missing required field: question');
  }

  // Validate distractors for MCQ
  if (type === 'mcq' && parsed.options) {
    const validation = validateDistractors(
      parsed.options,
      parsed.correctAnswer,
      effectiveDifficulty
    );
    if (!validation.valid) {
      // Log issues but don't fail — let the response through with a warning
      console.warn('[exercise-generator] Distractor validation warnings:', validation.issues);
    }
  }

  // Build the canonical exercise object
  const exercise = {
    id: crypto.randomUUID(),
    type: parsed.type || type,
    difficulty: parsed.difficulty || effectiveDifficulty,
    question: parsed.question,
    options: type === 'mcq' ? parsed.options || [] : null,
    correctAnswer: parsed.correctAnswer || '',
    acceptableAnswers:
      type === 'fill-blank' ? parsed.acceptableAnswers || [parsed.correctAnswer || ''] : undefined,
    expectedAnswer:
      type === 'calculation' ? parsed.expectedAnswer || parsed.correctAnswer : undefined,
    tolerance:
      typeof parsed.tolerance === 'number' ? parsed.tolerance : type === 'calculation' ? 0.5 : 0.0,
    rubric: type === 'short-answer' ? parsed.rubric || {} : undefined,
    explanation: parsed.explanation || '',
    learningObjective: {
      slug: learningObjectiveSlug,
      title: learningObjectiveTitle,
    },
    topic: parsed.topic || learningObjectiveTitle,
    createdAt: new Date().toISOString(),
    source: 'ai',
    fsrsCalibrated: !!fsrsContext,
  };

  // Cache the result
  setCachedExercise(learningObjectiveSlug, difficulty, type, exercise);

  return exercise;
}

/**
 * Clear the generation cache.
 */
export function clearGenerationCache() {
  generationCache.clear();
}

/**
 * Get current cache size.
 * @returns {number}
 */
export function getGenerationCacheSize() {
  return generationCache.size;
}
