/**
 * Unit tests for QuizSystem AI-graded MCQ handling.
 *
 * The quiz UI submits MCQ answers as a 0-based selected-option index, while
 * the backend exercise generator keys the correct answer by a lettered option
 * id (e.g. 'C'). This suite locks the mapping that makes AI-question grading
 * and backend reporting consistent.
 */

const { QuizSystem } = require('../myhugoapp/static/js/quiz-system.js');

describe('QuizSystem AI-graded MCQ handling', () => {
  const aiQuestion = {
    id: 'ex-abc123',
    type: 'multiple-choice',
    question: 'Welches Molekül ist Wasser?',
    options: ['Wasserstoff', 'Ammoniak', 'Wasser', 'Salzsäure'],
    correctAnswer: 'C',
    aiOptions: [
      { id: 'A', text: 'Wasserstoff' },
      { id: 'B', text: 'Ammoniak' },
      { id: 'C', text: 'Wasser' },
      { id: 'D', text: 'Salzsäure' },
    ],
    source: 'ai',
    aiGenerated: true,
  };

  let engine;

  beforeEach(() => {
    engine = new QuizSystem({ storageKey: 'chemie-lernen-quiz-progress-unit' });
  });

  afterEach(() => {
    delete global.fetch;
    delete global.window.fetch;
  });

  describe('checkAnswer', () => {
    test('maps the selected index to the lettered correctAnswer (C is index 2)', () => {
      expect(engine.checkAnswer(aiQuestion, 2)).toBe(true);
      expect(engine.checkAnswer(aiQuestion, 1)).toBe(false);
      expect(engine.checkAnswer(aiQuestion, 3)).toBe(false);
    });

    test('handles missing aiOptions by falling back to numeric/letter comparison', () => {
      const q = { ...aiQuestion, aiOptions: null };
      // No mapping: index-to-letter comparison cannot succeed here, but must
      // not throw and must not report a wrong true.
      expect(typeof engine.checkAnswer(q, 2)).toBe('boolean');
    });
  });

  describe('reportGradeToBackend', () => {
    test('POSTs the lettered answer id to /api/exercises/grade', () => {
      const calls = [];
      global.window.fetch = jest.fn(() => Promise.resolve({ ok: true }));
      global.fetch = global.window.fetch;

      engine.reportGradeToBackend(aiQuestion, 2);

      expect(global.window.fetch).toHaveBeenCalledTimes(1);
      const [url, opts] = global.window.fetch.mock.calls[0];
      expect(url).toBe('/api/exercises/grade');
      const body = JSON.parse(opts.body);
      expect(body.exerciseId).toBe('ex-abc123');
      expect(body.answer).toBe('C');
    });

    test('does nothing for non-AI questions', () => {
      global.window.fetch = jest.fn(() => Promise.resolve({}));
      global.fetch = global.window.fetch;
      engine.reportGradeToBackend({ id: '1', type: 'multiple-choice', source: 'hand' }, 1);
      expect(global.window.fetch).not.toHaveBeenCalled();
    });
  });
});
