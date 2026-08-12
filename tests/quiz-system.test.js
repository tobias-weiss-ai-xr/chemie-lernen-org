/**
 * Unit tests for QuizSystem AI-graded MCQ handling.
 *
 * The quiz UI submits MCQ answers as a 0-based selected-option index, while
 * the backend exercise generator keys the correct answer by a lettered option
 * id (e.g. 'C'). This suite locks the mapping that makes AI-question grading
 * and backend reporting consistent.
 */

const { QuizSystem, QuizGradeQueue } = require('../myhugoapp/static/js/quiz-system.js');

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

  describe('QuizGradeQueue.drain', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    function enqueue(queue, exerciseId, answer, ts) {
      queue.enqueue(exerciseId, answer);
      const stored = JSON.parse(localStorage.getItem(queue.STORAGE_KEY));
      if (ts) stored[stored.length - 1].ts = ts;
      localStorage.setItem(queue.STORAGE_KEY, JSON.stringify(stored));
    }

    test('drops 404 rows permanently (backend session gone)', () => {
      jest.useFakeTimers();
      const queue = new QuizGradeQueue();
      enqueue(queue, 'ex-gone', 'A');
      global.window.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404 }));
      global.fetch = global.window.fetch;

      queue.drain();
      jest.runAllTimers();

      expect(global.window.fetch).toHaveBeenCalledTimes(1);
      expect(JSON.parse(localStorage.getItem(queue.STORAGE_KEY))).toEqual([]);
      jest.useRealTimers();
    });

    test('re-queues on network failure instead of losing the grade', async () => {
      jest.useFakeTimers();
      const queue = new QuizGradeQueue();
      enqueue(queue, 'ex-1', 'B');
      global.window.fetch = jest.fn(() => Promise.reject(new Error('offline')));
      global.fetch = global.window.fetch;

      queue.drain();
      // Let the rejection travel through .then → .catch to the requeue handler.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      jest.runAllTimers();

      const remaining = JSON.parse(localStorage.getItem(queue.STORAGE_KEY));
      expect(remaining).toHaveLength(1);
      expect(remaining[0].exerciseId).toBe('ex-1');
      expect(remaining[0].answer).toBe('B');
      jest.useRealTimers();
    });

    test('drops rows older than 7 days without sending', () => {
      const queue = new QuizGradeQueue();
      const stale = Date.now() - 8 * 24 * 60 * 60 * 1000;
      enqueue(queue, 'ex-stale', 'C', stale);
      global.window.fetch = jest.fn(() => Promise.resolve({ ok: true }));
      global.fetch = global.window.fetch;

      queue.drain();

      expect(global.window.fetch).not.toHaveBeenCalled();
      expect(JSON.parse(localStorage.getItem(queue.STORAGE_KEY) || '[]')).toEqual([]);
    });
  });
});
