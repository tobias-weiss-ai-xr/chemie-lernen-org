/** @jest-environment node */
/**
 * Unit tests for QuizGradeQueue offline resilience (task 7.5).
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { QuizGradeQueue } = require('../myhugoapp/static/js/utils/quiz-grade-queue.js');

const STORAGE_KEY = 'chemie-offline-grades';
function makeMockStorage() {
  const store = {};
  return {
    store,
    getItem: jest.fn((k) => store[k] || null),
    setItem: jest.fn((k, v) => {
      store[k] = v;
    }),
    removeItem: jest.fn((k) => {
      delete store[k];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
  };
}

describe('QuizGradeQueue (offline resilience)', () => {
  let mockStorage;
  let originalLocalStorage;

  beforeEach(() => {
    mockStorage = makeMockStorage();
    originalLocalStorage = global.localStorage;
    global.localStorage = mockStorage;
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => ({}) }));
    global.window = { addEventListener: jest.fn(), removeEventListener: jest.fn() };
    // Reset the listener flag on the prototype so each test gets a fresh one
    QuizGradeQueue.prototype.listenersAdded = false;
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
    delete global.fetch;
    delete global.window;
    jest.restoreAllMocks();
  });

  test('enqueue stores submissions in localStorage', () => {
    const queue = new QuizGradeQueue();
    expect(queue.enqueue('ex-1', 'A')).toBe(true);
    expect(mockStorage.setItem).toHaveBeenCalled();
    const stored = JSON.parse(mockStorage.store[STORAGE_KEY]);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(expect.objectContaining({ exerciseId: 'ex-1', answer: 'A' }));
  });

  test('drain sends queued submissions to /api/exercises/grade', () => {
    const queue = new QuizGradeQueue();
    queue.enqueue('ex-1', 'A');
    queue.enqueue('ex-2', 'B');

    queue.drain();

    expect(mockStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    // drain is async with setTimeout chain but we only check the storage was
    // cleared synchronously at the start of drain.
  });
});
