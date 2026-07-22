/**
 * Didaktik API Tests
 *
 * Tests for the /api/didaktik endpoint that returns didactic guidelines
 * (KMK standards and teaching guidelines).
 */

const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Guard: skip API-dependent tests unless API is running
const runApiTests = process.env.API_RUNNING === '1' || process.env.CI === 'true';
const describeApi = runApiTests ? describe : describe.skip;

if (!runApiTests) {
  console.warn(
    '⚠ Skipping API-dependent tests — set API_RUNNING=1, CI=true, or API_BASE_URL to enable'
  );
}

/**
 * Helper to make HTTP requests to the API
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data),
              headers: res.headers,
            });
          } catch (err) {
            reject(new Error(`Failed to parse JSON: ${err.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

describeApi('GET /api/didaktik', () => {
  const endpoint = `${API_BASE_URL}/api/didaktik`;

  describe('Basic functionality', () => {
    test('returns 200 status', async () => {
      const response = await fetchJson(endpoint);
      expect(response.status).toBe(200);
    });

    test('returns JSON with expected structure', async () => {
      const response = await fetchJson(endpoint);
      expect(response.data).toHaveProperty('source');
      expect(response.data).toHaveProperty('items');
      expect(response.data).toHaveProperty('count');
      expect(Array.isArray(response.data.items)).toBe(true);
      expect(typeof response.data.count).toBe('number');
    });

    test('count matches items length', async () => {
      const response = await fetchJson(endpoint);
      expect(response.data.count).toBe(response.data.items.length);
    });
  });

  describe('Item structure', () => {
    test('items have required fields', async () => {
      const response = await fetchJson(endpoint);
      if (response.data.items.length > 0) {
        const item = response.data.items[0];
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('sourceType');
        expect(item).toHaveProperty('institution');
        expect(item).toHaveProperty('url');
        expect(item).toHaveProperty('sectionCount');
        expect(typeof item.sectionCount).toBe('number');
      }
    });

    test('items have expected field types', async () => {
      const response = await fetchJson(endpoint);
      if (response.data.items.length > 0) {
        const item = response.data.items[0];
        expect(typeof item.name).toBe('string');
        expect(typeof item.title).toBe('string');
        expect(typeof item.sourceType).toBe('string');
        expect(typeof item.institution).toBe('string');
        expect(typeof item.url).toBe('string');
        expect(typeof item.sectionCount).toBe('number');
      }
    });
  });

  describe('Query parameters', () => {
    test('supports limit parameter', async () => {
      const response = await fetchJson(`${endpoint}?limit=5`);
      expect(response.data.count).toBeLessThanOrEqual(5);
    });

    test('supports institution filter', async () => {
      const response = await fetchJson(`${endpoint}?institution=kmk`);
      // If filtered, count should be <= unfiltered count
      const allResponse = await fetchJson(endpoint);
      expect(response.data.count).toBeLessThanOrEqual(allResponse.data.count);
    });

    test('supports search parameter', async () => {
      const response = await fetchJson(`${endpoint}?search=chemie`);
      const allResponse = await fetchJson(endpoint);
      expect(response.data.count).toBeLessThanOrEqual(allResponse.data.count);
    });

    test('limit parameter is capped at 500', async () => {
      const response = await fetchJson(`${endpoint}?limit=10000`);
      expect(response.data.count).toBeLessThanOrEqual(500);
    });
  });

  describe('Response metadata', () => {
    test('source field indicates data origin', async () => {
      const response = await fetchJson(endpoint);
      expect(response.data.source).toMatch(/^(neo4j|fallback|cache)$/);
    });

    test('response has content-type application/json', async () => {
      const response = await fetchJson(endpoint);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

describeApi('Didaktik data quality', () => {
  test('institutions are non-empty strings', async () => {
    const response = await fetchJson(endpoint);
    response.data.items.forEach((item) => {
      expect(item.institution).toBeTruthy();
      expect(typeof item.institution).toBe('string');
    });
  });

  test('titles are non-empty strings', async () => {
    const response = await fetchJson(endpoint);
    response.data.items.forEach((item) => {
      expect(item.title).toBeTruthy();
      expect(typeof item.title).toBe('string');
    });
  });

  test('section counts are non-negative integers', async () => {
    const response = await fetchJson(endpoint);
    response.data.items.forEach((item) => {
      expect(Number.isInteger(item.sectionCount)).toBe(true);
      expect(item.sectionCount).toBeGreaterThanOrEqual(0);
    });
  });
});
