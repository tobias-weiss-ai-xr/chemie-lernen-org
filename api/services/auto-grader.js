/**
 * auto-grader.js — Two-tier grading service for chemistry exercises.
 *
 * Tier 1 — Deterministic: MCQ (exact match), calculation (numeric tolerance),
 *            fill-in-blank (case-insensitive, formula variants)
 * Tier 2 — AI-assisted: short-answer/free-text via LiteLLM with rubric
 *
 * All content is in German (de-de).
 */

/**
 * Normalize chemical formula strings to allow common variant matching.
 * E.g., "H2O", "H₂O", "H20" → normalized equivalents.
 *
 * @param {string} str - Input string
 * @returns {string} Normalized string
 */
export function normalizeFormula(str) {
  if (!str) return '';
  return (
    str
      .trim()
      .toLowerCase()
      // Replace subscript digits with regular digits
      .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (m) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(m).toString())
      // Replace superscript digits
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (m) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(m).toString())
      // Strip charge signs that differ only by formatting (e.g., "Na+" ~ "Na⁺")
      .replace(/[\u207a\u2795+]/g, '+')
      .replace(/[\u207b\u2796-]/g, '-')
      .replace(/\s+/g, '')
      // Standardize common patterns: H2O ↔ H2O
      .normalize('NFKC')
  );
}

/**
 * Strip common unit annotations from a numeric answer.
 * E.g., "44.01 g/mol" → "44.01"
 *
 * @param {string} str
 * @returns {string} Numeric part only
 */
function stripUnits(str) {
  if (!str) return '';
  return str
    .replace(/,/g, '.') // German decimal comma → dot
    .replace(/[^\d.\-+eE]/g, ' ') // Replace non-numeric chars with space
    .trim()
    .split(/\s+/)[0]; // Take first numeric token
}

// ── Grading functions ─────────────────────────────────────────────────

/**
 * Grade an MCQ answer by exact match.
 *
 * @param {string} userAnswer - The student's answer (e.g., "A")
 * @param {string} correctAnswer - The correct answer ID (e.g., "C")
 * @returns {{ correct: boolean, score: number, gradedBy: string }}
 */
export function gradeMCQ(userAnswer, correctAnswer) {
  const correct =
    String(userAnswer).trim().toUpperCase() === String(correctAnswer).trim().toUpperCase();
  return { correct, score: correct ? 100 : 0, gradedBy: 'deterministic' };
}

/**
 * Grade a calculation answer by numeric tolerance.
 *
 * @param {string|number} userAnswer
 * @param {string|number} expectedAnswer
 * @param {number} [tolerance=0.5]
 * @returns {{ correct: boolean, score: number, gradedBy: string }}
 */
export function gradeCalculation(userAnswer, expectedAnswer, tolerance) {
  tolerance = typeof tolerance === 'number' && tolerance > 0 ? tolerance : 0.5;

  const userNum = parseFloat(stripUnits(String(userAnswer)));
  if (isNaN(userNum)) {
    return { correct: false, score: 0, gradedBy: 'deterministic' };
  }

  const correctNum = parseFloat(String(expectedAnswer).replace(',', '.'));
  if (isNaN(correctNum)) {
    return { correct: false, score: 0, gradedBy: 'deterministic' };
  }

  const diff = Math.abs(userNum - correctNum);
  const correct = diff <= tolerance;

  // Partial credit: score based on how close the answer is within tolerance
  let score;
  if (correct) {
    const ratio = diff / tolerance;
    score = ratio <= 0.3 ? 100 : ratio <= 0.85 ? 80 : 60;
  } else {
    score = 0;
  }

  return { correct, score, gradedBy: 'deterministic' };
}

/**
 * Grade a fill-in-blank answer with case-insensitive match,
 * formula normalization, and acceptable-answer list support.
 *
 * @param {string} userAnswer
 * @param {string|string[]} acceptableAnswers - Single string or array of valid answers
 * @returns {{ correct: boolean, score: number, gradedBy: string }}
 */
export function gradeFillInBlank(userAnswer, acceptableAnswers) {
  if (!userAnswer || !acceptableAnswers) {
    return { correct: false, score: 0, gradedBy: 'deterministic' };
  }

  const answers = Array.isArray(acceptableAnswers) ? acceptableAnswers : [acceptableAnswers];
  const normalizedUser = normalizeFormula(String(userAnswer));

  const correct = answers.some((ans) => normalizeFormula(String(ans)) === normalizedUser);

  return { correct, score: correct ? 100 : 0, gradedBy: 'deterministic' };
}

/**
 * Grade a short-answer using LiteLLM with rubric evaluation.
 *
 * @param {string} userAnswer - Student's free-text answer
 * @param {string} question - The exercise question
 * @param {object} rubric - { keyConcepts: string[], minLength: number, maxLength: number }
 * @param {object} litellm - { url: string, model: string }
 * @returns {Promise<{ correct: boolean, score: number, gradedBy: string, feedback: string }>}
 */
export async function gradeShortAnswer(userAnswer, question, rubric, litellm) {
  if (!userAnswer || String(userAnswer).trim().length < (rubric?.minLength || 1)) {
    return {
      correct: false,
      score: 0,
      gradedBy: 'ai',
      feedback: 'Bitte gib eine ausführlichere Antwort.',
    };
  }

  const systemMessage =
    'Du bist eine Chemie-Lehrkraft, die Schülerantworten fair und nachvollziehbar bewertet. ' +
    'Antworte NUR mit einem validen JSON-Objekt. Keine zusätzlichen Erklärungen.';

  const userMessage = [
    `Frage: ${question}`,
    `Erwartete Schlüsselkonzepte: ${(rubric?.keyConcepts || []).join(', ')}`,
    `Minimale Länge: ${rubric?.minLength || 20} Zeichen`,
    `Maximale Länge: ${rubric?.maxLength || 200} Zeichen`,
    '',
    `Schülerantwort: ${String(userAnswer)}`,
    '',
    'Bewerte die Antwort auf einer Skala von 0-100. Gib ein JSON zurück: {"score": <0-100>, "correct": <true/false>, "feedback": "<Erklärung auf Deutsch>"}',
  ].join('\n');

  try {
    const res = await fetch(`${litellm.url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (process.env.LITELLM_API_KEY || ''),
      },
      body: JSON.stringify({
        model: litellm.model || 'gemma-4',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 512,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      throw new Error(`LiteLLM error ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    if (!content) throw new Error('Empty response');

    // Parse JSON from LLM response (strip markdown fences if present)
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      const firstNewline = cleaned.indexOf('\n');
      if (firstNewline !== -1) cleaned = cleaned.slice(firstNewline + 1);
      const fenceEnd = cleaned.lastIndexOf('```');
      if (fenceEnd !== -1) cleaned = cleaned.slice(0, fenceEnd);
      cleaned = cleaned.trim();
    }

    const grade = JSON.parse(cleaned);
    const score = Math.max(0, Math.min(100, typeof grade.score === 'number' ? grade.score : 50));
    const correct = !!grade.correct;

    return { correct, score, gradedBy: 'ai', feedback: grade.feedback || '' };
  } catch {
    // Graceful fallback on grading error
    return {
      correct: false,
      score: 50,
      gradedBy: 'ai',
      feedback:
        'Die Antwort konnte nicht automatisch bewertet werden. Ein Lehrer wird sie überprüfen.',
    };
  }
}

/**
 * Main grading dispatcher — routes to the correct grading function based on exercise type.
 *
 * @param {object} exercise - The exercise object
 *   Must have: { id, type, correctAnswer, question, ... }
 *   For type 'mcq': also has options, correctAnswer is the correct option ID
 *   For type 'calculation': also has expectedAnswer, tolerance
 *   For type 'fill-in-blank': correctAnswer or acceptableAnswers
 *   For type 'short-answer': question, rubric
 * @param {string|number} userAnswer
 * @param {object} [options]
 * @param {object} [options.litellm] - { url, model } for AI-assisted grading
 * @returns {Promise<{ correct: boolean, score: number, gradedBy: string, feedback?: string }>}
 */
export async function gradeExercise(exercise, userAnswer, options = {}) {
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return {
      correct: false,
      score: 0,
      gradedBy: 'deterministic',
      feedback: 'Bitte gib eine Antwort ein.',
    };
  }

  switch (exercise.type) {
    case 'mcq': {
      const result = gradeMCQ(userAnswer, exercise.correctAnswer);
      return result;
    }

    case 'calculation': {
      const result = gradeCalculation(
        userAnswer,
        exercise.expectedAnswer || exercise.correctAnswer,
        exercise.tolerance
      );
      return result;
    }

    case 'fill-in-blank': {
      const acceptable = exercise.acceptableAnswers || exercise.correctAnswer || [];
      const result = gradeFillInBlank(userAnswer, acceptable);
      return result;
    }

    case 'short-answer': {
      if (!options.litellm) {
        return {
          correct: false,
          score: 0,
          gradedBy: 'ai',
          feedback: 'KI-Bewertung nicht verfügbar.',
        };
      }
      return await gradeShortAnswer(
        userAnswer,
        exercise.question,
        exercise.rubric || {},
        options.litellm
      );
    }

    default:
      return {
        correct: false,
        score: 0,
        gradedBy: 'deterministic',
        feedback: `Unbekannter Aufgabentyp: ${exercise.type}`,
      };
  }
}
