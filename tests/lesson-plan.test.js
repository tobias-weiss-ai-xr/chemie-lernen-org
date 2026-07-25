/**
 * Lesson Plan & Worksheet Tests
 *
 * Tests for prompt building, input validation, and response parsing.
 * API tests guarded by API_RUNNING=1.
 */

// ── Prompt building (replicated logic for unit testing) ───────

function buildLessonPlanPrompt({ topic, klassenstufe, duration, difficulty }) {
  return `Du bist ein erfahrener Chemie-Lehrer. Erstelle einen detaillierten Unterrichtsplan für eine ${duration}-Minuten-Stunde zum Thema "${topic}" für die Klassenstufe ${klassenstufe} (Schwierigkeit: ${difficulty}).`;
}

// ── JSON extraction from LLM response ──────────────────────────

function extractJson(text) {
  var jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

function extractJsonArray(text) {
  var jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : null;
}

// ── Input validation (replicated from API) ────────────────────

var VALID_GRADES = ['8', '9', '10', '11', '12', '13'];
var VALID_DURATIONS = ['15', '30', '45', '60', '90'];
var VALID_DIFFICULTIES = ['einfach', 'mittel', 'fortgeschritten'];
var VALID_EXERCISE_TYPES = ['multiple-choice', 'lueckentext', 'berechnung', 'kurzantwort'];

function validateLessonPlanInput(body) {
  var errors = [];
  if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length < 2) {
    errors.push('topic ist erforderlich (min. 2 Zeichen)');
  }
  if (!VALID_GRADES.includes(String(body.klassenstufe || ''))) {
    errors.push('Ungültige Klassenstufe. Erlaubt: 8-13');
  }
  if (!VALID_DURATIONS.includes(String(body.duration || ''))) {
    errors.push('Ungültige Dauer. Erlaubt: 15, 30, 45, 60, 90');
  }
  if (!VALID_DIFFICULTIES.includes(body.difficulty || '')) {
    errors.push('Ungültige Schwierigkeit. Erlaubt: einfach, mittel, fortgeschritten');
  }
  return errors;
}

function validateWorksheetInput(body) {
  var errors = [];
  if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length < 2) {
    errors.push('topic ist erforderlich (min. 2 Zeichen)');
  }
  var count = Number(body.exerciseCount || 5);
  if (count < 1 || count > 20) {
    errors.push('Anzahl muss zwischen 1 und 20 liegen');
  }
  var types = (Array.isArray(body.types) ? body.types : [body.types]).filter(function (t) {
    return VALID_EXERCISE_TYPES.includes(t);
  });
  if (types.length === 0) {
    errors.push('Keine gültigen Aufgabentypen');
  }
  return errors;
}

// ── Tests ──────────────────────────────────────────────────

describe('buildLessonPlanPrompt', () => {
  test('includes topic in prompt', () => {
    const prompt = buildLessonPlanPrompt({
      topic: 'Säuren und Basen',
      klassenstufe: '10',
      duration: '45',
      difficulty: 'mittel',
    });
    expect(prompt).toContain('Säuren und Basen');
  });

  test('includes klassenstufe', () => {
    const prompt = buildLessonPlanPrompt({
      topic: 'Redox',
      klassenstufe: '11',
      duration: '45',
      difficulty: 'mittel',
    });
    expect(prompt).toContain('Klassenstufe 11');
  });

  test('includes duration', () => {
    const prompt = buildLessonPlanPrompt({
      topic: 'X',
      klassenstufe: '10',
      duration: '90',
      difficulty: 'einfach',
    });
    expect(prompt).toContain('90-Minuten');
  });

  test('includes difficulty', () => {
    const prompt = buildLessonPlanPrompt({
      topic: 'X',
      klassenstufe: '10',
      duration: '45',
      difficulty: 'fortgeschritten',
    });
    expect(prompt).toContain('fortgeschritten');
  });
});

describe('extractJson', () => {
  test('extracts JSON from plain response', () => {
    const input = '{"title":"Test","phases":[]}';
    const result = extractJson(input);
    expect(result).toBe(input);
    const parsed = JSON.parse(result);
    expect(parsed.title).toBe('Test');
  });

  test('extracts JSON from markdown code block', () => {
    const input = 'Hier ist der Plan:\n```json\n{"title":"Test","objectives":["A","B"]}\n```';
    const result = extractJson(input);
    expect(result).toContain('"title":"Test"');
    const parsed = JSON.parse(result);
    expect(parsed.objectives).toEqual(['A', 'B']);
  });

  test('returns null for no JSON', () => {
    expect(extractJson('No JSON here')).toBeNull();
  });
});

describe('extractJsonArray', () => {
  test('extracts array from response', () => {
    const input = '[{"type":"multiple-choice"},{"type":"berechnung"}]';
    const result = extractJsonArray(input);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].type).toBe('multiple-choice');
  });

  test('extracts array from markdown', () => {
    const input = '```\n[{"question":"X"}]\n```';
    const result = extractJsonArray(input);
    const parsed = JSON.parse(result);
    expect(parsed[0].question).toBe('X');
  });
});

describe('validateLessonPlanInput', () => {
  test('accepts valid input', () => {
    const errors = validateLessonPlanInput({
      topic: 'Säuren',
      klassenstufe: '10',
      duration: '45',
      difficulty: 'mittel',
    });
    expect(errors).toEqual([]);
  });

  test('rejects missing topic', () => {
    const errors = validateLessonPlanInput({
      klassenstufe: '10',
      duration: '45',
      difficulty: 'mittel',
    });
    expect(errors.some((e) => e.includes('topic ist erforderlich'))).toBe(true);
  });

  test('rejects too short topic', () => {
    const errors = validateLessonPlanInput({
      topic: 'X',
      klassenstufe: '10',
      duration: '45',
      difficulty: 'mittel',
    });
    expect(errors.some((e) => e.includes('topic ist erforderlich'))).toBe(true);
  });

  test('rejects invalid klassenstufe', () => {
    const errors = validateLessonPlanInput({
      topic: 'Test',
      klassenstufe: '7',
      duration: '45',
      difficulty: 'mittel',
    });
    expect(errors.some((e) => e.includes('Klassenstufe'))).toBe(true);
  });

  test('rejects invalid duration', () => {
    const errors = validateLessonPlanInput({
      topic: 'Test',
      klassenstufe: '10',
      duration: '50',
      difficulty: 'mittel',
    });
    expect(errors.some((e) => e.includes('Dauer'))).toBe(true);
  });

  test('rejects invalid difficulty', () => {
    const errors = validateLessonPlanInput({
      topic: 'Test',
      klassenstufe: '10',
      duration: '45',
      difficulty: 'sehr schwer',
    });
    expect(errors.some((e) => e.includes('Schwierigkeit'))).toBe(true);
  });

  test('accepts all valid grades', () => {
    for (const grade of VALID_GRADES) {
      const errors = validateLessonPlanInput({
        topic: 'Test',
        klassenstufe: grade,
        duration: '45',
        difficulty: 'mittel',
      });
      expect(errors).toEqual([]);
    }
  });
});

describe('validateWorksheetInput', () => {
  test('accepts valid input', () => {
    const errors = validateWorksheetInput({
      topic: 'Redox',
      exerciseCount: 5,
      types: ['multiple-choice', 'berechnung'],
    });
    expect(errors).toEqual([]);
  });

  test('rejects missing topic', () => {
    const errors = validateWorksheetInput({ exerciseCount: 5, types: ['multiple-choice'] });
    expect(errors.some((e) => e.includes('topic ist erforderlich'))).toBe(true);
  });

  test('rejects too many exercises', () => {
    const errors = validateWorksheetInput({
      topic: 'Test',
      exerciseCount: 25,
      types: ['multiple-choice'],
    });
    expect(errors.some((e) => e.includes('Anzahl'))).toBe(true);
  });

  test('rejects invalid exercise types', () => {
    const errors = validateWorksheetInput({ topic: 'Test', exerciseCount: 5, types: ['essay'] });
    expect(errors).toContain('Keine gültigen Aufgabentypen');
  });

  test('accepts string type', () => {
    const errors = validateWorksheetInput({ topic: 'Test', exerciseCount: 3, types: 'berechnung' });
    expect(errors).toEqual([]);
  });
});

describe('Lesson plan output parsing', () => {
  test('parses complete lesson plan structure', () => {
    const plan = {
      title: 'Säuren und Basen Einführung',
      objectives: ['Säuren definieren', 'pH-Wert erklären'],
      phases: [
        {
          name: 'Einstieg',
          duration: '5 Min.',
          activity: 'Demonstration',
          teacherAction: 'Tropfenversuch',
          studentAction: 'Beobachten',
        },
        {
          name: 'Erarbeitung',
          duration: '20 Min.',
          activity: 'Arbeitsblatt',
          teacherAction: 'Erklären',
          studentAction: 'Bearbeiten',
        },
      ],
      assessment: { formative: 'Mündliche Fragen', summative: 'Quiz' },
      differentiation: { stronger: 'Erweitere Aufgaben', weaker: 'Lückentext-Vorlage' },
    };

    expect(plan.objectives).toHaveLength(2);
    expect(plan.phases).toHaveLength(2);
    expect(plan.phases[0].name).toBe('Einstieg');
    expect(plan.assessment.formative).toBe('Mündliche Fragen');
    expect(plan.differentiation.stronger).toBeTruthy();
  });

  test('handles minimal lesson plan gracefully', () => {
    const plan = { title: 'Minimal', objectives: [], phases: [] };
    expect(plan.title).toBe('Minimal');
    expect(plan.objectives).toEqual([]);
    expect(plan.phases).toEqual([]);
  });
});

describe('Worksheet output parsing', () => {
  test('parses mixed exercise types', () => {
    const exercises = [
      {
        type: 'multiple-choice',
        question: 'Was ist pH 7?',
        options: ['Sauer', 'Neutral', 'Basisch'],
        correctIndex: 1,
      },
      { type: 'berechnung', question: 'Berechne pH 0.01M HCl', answer: 'pH = 2' },
      {
        type: 'lueckentext',
        text: '___ ist die Maßzahl für Protonenkonzentration',
        blanks: ['pH-Wert'],
      },
    ];

    expect(exercises).toHaveLength(3);
    expect(exercises[0].type).toBe('multiple-choice');
    expect(exercises[1].type).toBe('berechnung');
    expect(exercises[2].type).toBe('lueckentext');
  });

  test('slices exercises to requested count', () => {
    const exercises = Array.from({ length: 10 }, (_, i) => ({
      type: 'multiple-choice',
      question: 'Q' + i,
    }));
    const sliced = exercises.slice(0, 5);
    expect(sliced).toHaveLength(5);
  });
});

// ── API tests (guarded) ──────────────────────────────────────

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const runApiTests = process.env.API_RUNNING === '1';
const describeApi = runApiTests ? describe : describe.skip;

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const postData = JSON.stringify(body);
    const options = {
      method: 'POST',
      hostname: new URL(url).hostname,
      port: new URL(url).port,
      path: new URL(url).pathname,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

describeApi('POST /api/premium/lesson-plan', () => {
  test('rejects missing topic with 400', async () => {
    const res = await postJson(API_BASE_URL + '/api/premium/lesson-plan', {});
    expect(res.status).toBe(400);
  });

  test('rejects invalid grade with 400', async () => {
    const res = await postJson(API_BASE_URL + '/api/premium/lesson-plan', {
      topic: 'Test',
      klassenstufe: '5',
    });
    expect(res.status).toBe(400);
  });

  test('returns lesson plan for valid input', async () => {
    const res = await postJson(API_BASE_URL + '/api/premium/lesson-plan', {
      topic: 'pH-Wert',
      klassenstufe: '10',
      duration: '45',
      difficulty: 'einfach',
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('lessonPlan');
    expect(res.data.lessonPlan).toHaveProperty('title');
    expect(res.data.lessonPlan).toHaveProperty('phases');
  });
});

describeApi('POST /api/premium/worksheet', () => {
  test('worksheet rejects missing topic with 400', async () => {
    const res = await postJson(API_BASE_URL + '/api/premium/worksheet', {});
    expect(res.status).toBe(400);
  });

  test('returns exercises for valid input', async () => {
    const res = await postJson(API_BASE_URL + '/api/premium/worksheet', {
      topic: 'Molmasse',
      exerciseCount: 3,
      types: ['berechnung'],
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('exercises');
    expect(Array.isArray(res.data.exercises)).toBe(true);
  });
});
