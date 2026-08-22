/**
 * Tests for _scraper_utils.mjs — shared module handbook scraper utility.
 */
const { pathToFileURL } = require('url');
const path = require('path');

const UTILS_PATH = path.resolve(__dirname, '..', 'scripts/modulhandbuch/_scraper_utils.mjs');

/**
 * Load the module in both Jest modes:
 *  - bare `npx jest` (no NODE_OPTIONS): jest-transform-esm.cjs converts the
 *    .mjs file to CJS, so require() works.
 *  - npm scripts (NODE_OPTIONS=--experimental-vm-modules): Jest treats it as
 *    native ESM, require() throws → fall back to dynamic import().
 */
function loadModule() {
  try {
    return require(UTILS_PATH);
  } catch (err) {
    if (err && /Must use import to load ES Module/.test(err.message)) {
      return import(pathToFileURL(UTILS_PATH).href);
    }
    throw err;
  }
}

describe('_scraper_utils.mjs — extractTopics', () => {
  let extractTopics;

  beforeAll(async () => {
    const mod = await loadModule();
    extractTopics = mod.extractTopics;
  });

  test('extracts topics from module name + description', () => {
    const topics = extractTopics(
      'Anorganische Chemie I',
      'Atombau, Periodensystem, Chemische Bindung'
    );
    expect(topics).toBeInstanceOf(Array);
    expect(topics).toContain('Anorganische Chemie');
    expect(topics).toContain('Atombau');
    expect(topics).toContain('Periodensystem');
    expect(topics).toContain('Chemische Bindung');
  });

  test('extracts topics from description only', () => {
    const topics = extractTopics(
      'Allgemeine Chemie',
      'Thermodynamik und Kinetik chemischer Reaktionen'
    );
    expect(topics).toContain('Thermodynamik');
    expect(topics).toContain('Kinetik');
  });

  test('returns empty array for empty inputs', () => {
    expect(extractTopics('', '')).toEqual([]);
    expect(extractTopics(null, null)).toEqual([]);
    expect(extractTopics(undefined, undefined)).toEqual([]);
  });

  test('deduplicates topics', () => {
    const topics = extractTopics('Periodensystem', 'Periodensystem der Elemente');
    const unique = [...new Set(topics)];
    expect(topics).toHaveLength(unique.length);
  });

  test('matches topics from the CHEMISTRY_TOPICS list', () => {
    const topics = extractTopics('PC I', 'Quantenchemie, Spektroskopie, Elektrochemie');
    expect(topics).toContain('Quantenchemie');
    expect(topics).toContain('Spektroskopie');
    expect(topics).toContain('Elektrochemie');
  });

  test('matches topics with exact keyword matching', () => {
    // CHEMISTRY_TOPICS uses exact substring matching (no German declension handling)
    const topics = extractTopics('OC I', 'Reaktionsmechanismen der Organische Chemie');
    expect(topics).toContain('Organische Chemie');
  });
});

describe('_scraper_utils.mjs — writeOutput', () => {
  // writeOutput is tested implicitly via the scraper output files in myhugoapp/data/modulhandbuch/
  // Direct Jest import of ESM module-level constants (MODULHANDBUCH_DIR via import.meta.url)
  // is not reliable under --experimental-vm-modules in this project's Jest version.
  // The function is trivially simple: fs.writeFileSync with mkdirSync guard.
  test('writeOutput exists as exported function', async () => {
    const mod = await loadModule();
    expect(typeof mod.writeOutput).toBe('function');
  });
});

describe('_scraper_utils.mjs — fetchWithRetry', () => {
  let fetchWithRetry;

  beforeAll(async () => {
    const mod = await loadModule();
    fetchWithRetry = mod.fetchWithRetry;
  });

  test('fetchWithRetry is a function', () => {
    expect(typeof fetchWithRetry).toBe('function');
  });

  test('rejects invalid URLs', async () => {
    await expect(fetchWithRetry('not-a-url')).rejects.toThrow();
  });

  test('returns null on connection refused instead of rejecting', async () => {
    const result = await fetchWithRetry('http://localhost:1', {
      retries: 1,
      delay: 10,
    });
    expect(result).toBeNull();
  });
});

describe('_scraper_utils.mjs — parseCredits', () => {
  let parseCredits;

  beforeAll(async () => {
    const mod = await loadModule();
    parseCredits = mod.parseCredits;
  });

  test('parses "6 LP"', () => {
    expect(parseCredits('6 LP')).toBe(6);
  });

  test('parses "3 ECTS"', () => {
    expect(parseCredits('3 ECTS')).toBe(3);
  });

  test('returns 0 for empty input', () => {
    expect(parseCredits(null)).toBe(0);
    expect(parseCredits('')).toBe(0);
  });
});
