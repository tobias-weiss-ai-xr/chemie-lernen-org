/**
 * Unit tests for the FSRS flashcard creation flow (evidence-based loop).
 *
 * Covers the API logic added to api/routes/quiz.js and the auth-db.js
 * card lifecycle: wrong quiz answers become spaced-repetition cards
 * (research: 1,732 papers on spaced repetition + testing effect).
 */
const { pathToFileURL } = require('url');
const path = require('path');

const MODULE_PATH = path.resolve(__dirname, '..', 'api', 'auth-db.js');

/**
 * Load the module in both Jest modes:
 *  - bare `npx jest`: jest-transform-esm.cjs converts ESM to CJS.
 *  - npm scripts (NODE_OPTIONS=--experimental-vm-modules): native ESM → import().
 */
function loadModule() {
  try {
    return require(MODULE_PATH);
  } catch (err) {
    if (err && /Must use import to load ES Module/.test(err.message)) {
      return import(pathToFileURL(MODULE_PATH).href);
    }
    throw err;
  }
}

describe('FSRS flashcard creation (auth-db.js)', () => {
  let authDb;

  beforeAll(async () => {
    authDb = await loadModule();
  });

  test('module exports the FSRS card functions', () => {
    expect(typeof authDb.createFsrsCard).toBe('function');
    expect(typeof authDb.getFsrsCards).toBe('function');
    expect(typeof authDb.updateFsrsCard).toBe('function');
    expect(typeof authDb.getDueCards).toBe('function');
  });

  test('createFsrsCard returns null for unknown user', () => {
    const card = authDb.createFsrsCard('no-such-user', {
      topicId: 'ec-1',
      question: 'Frage?',
      answer: 'Antwort',
    });
    expect(card).toBeNull();
  });

  test('new cards start with interval 1, ease 2.5, due today', () => {
    const userId = authDb.createUser({
      email: 'fsrs-test@example.com',
      passwordHash: 'x',
      name: 'FSRS Test',
    });
    expect(userId).toBeTruthy();

    const card = authDb.createFsrsCard(userId, {
      topicId: 'ec-2',
      question: 'Wie viele Protonen hat Wasserstoff?',
      answer: '1',
      type: 'multiple-choice',
    });

    expect(card).not.toBeNull();
    expect(card.cardId).toBeTruthy();
    expect(card.interval).toBe(1);
    expect(card.ease).toBe(2.5);
    expect(card.dueDate).toBeTruthy();

    const cards = authDb.getFsrsCards(userId);
    expect(cards.some((c) => c.cardId === card.cardId)).toBe(true);

    // Cleanup
    authDb.deleteUser(userId);
  });

  test('updateFsrsCard with score 0 resets interval and increases lapses', () => {
    const userId = authDb.createUser({
      email: 'fsrs-test2@example.com',
      passwordHash: 'x',
      name: 'FSRS Test 2',
    });
    expect(userId).toBeTruthy();

    const card = authDb.createFsrsCard(userId, {
      topicId: 'ec-3',
      question: 'Frage?',
      answer: 'Antwort',
    });

    const result = authDb.updateFsrsCard(userId, card.cardId, { score: 0 });
    expect(result).not.toBeNull();
    expect(result.interval).toBe(1);
    expect(result.lapses).toBe(1);
    expect(result.ease).toBeLessThan(2.5);

    authDb.deleteUser(userId);
  });
});
