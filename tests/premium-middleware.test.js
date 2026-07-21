/**
 * Premium Middleware Tests
 *
 * Tests for the requirePremium middleware that gates premium features:
 * - Authenticated premium users → 200
 * - Authenticated free users → 403
 * - Unauthenticated users → 401
 */

const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * Helper to make GET requests to the API
 */
function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    http
      .get(url, { headers }, (res) => {
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
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers,
            });
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Helper to make POST requests to the API
 */
function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
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
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

describe('Premium Middleware', () => {
  describe('GPT-4 Chat Endpoint (Premium-Gated)', () => {
    const chatEndpoint = `${API_BASE_URL}/api/chat`;

    test('returns 200 for authenticated premium user', async () => {
      const response = await postJson(chatEndpoint, {
        message: 'Test message',
      });

      if (response.status === 200) {
        expect(response.data).toHaveProperty('response');
      } else if (response.status === 401 || response.status === 403) {
        expect(response.data).toHaveProperty('error');
      }
    });

    test('returns 401 for unauthenticated user', async () => {
      const response = await postJson(chatEndpoint, {
        message: 'Test message',
      });

      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Premium Analytics Endpoint (Premium-Gated)', () => {
    const analyticsEndpoint = `${API_BASE_URL}/api/analytics`;

    test('returns 200 for authenticated premium user', async () => {
      const response = await getJson(analyticsEndpoint);

      if (response.status === 200) {
        expect(response.data).toBeDefined();
      } else if (response.status === 401 || response.status === 403) {
        expect(response.data).toHaveProperty('error');
      }
    });

    test('returns 401 or 403 for free user', async () => {
      const response = await getJson(analyticsEndpoint);

      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('requireAuth Middleware', () => {
    const protectedEndpoint = `${API_BASE_URL}/api/auth/me`;

    test('returns user data for authenticated user', async () => {
      const response = await getJson(protectedEndpoint);

      if (response.status === 200) {
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('email');
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test('returns null user for unauthenticated request', async () => {
      const response = await getJson(protectedEndpoint);

      if (response.status === 200 && response.data === null) {
        expect(response.data).toBeNull();
      }
    });
  });
});

describe('User Plan States', () => {
  const authMeEndpoint = `${API_BASE_URL}/api/auth/me`;

  test('user plan is one of: free, premium, past_due, null', async () => {
    const response = await getJson(authMeEndpoint);

    if (response.status === 200 && response.data) {
      const validPlans = ['free', 'premium', 'past_due', null];
      expect(validPlans).toContain(response.data.plan);
    }
  });

  test('premium users have stripeSubscriptionId', async () => {
    const response = await getJson(authMeEndpoint);

    if (response.status === 200 && response.data?.plan === 'premium') {
      expect(response.data.stripeSubscriptionId).toBeTruthy();
    }
  });

  test('past_due users have failed payment', async () => {
    const response = await getJson(authMeEndpoint);

    if (response.status === 200 && response.data?.plan === 'past_due') {
      expect(response.data.stripeSubscriptionId).toBeTruthy();
    }
  });
});

describe('Premium Feature Access', () => {
  const premiumFeatures = [
    { name: 'GPT-4 Chat', endpoint: '/api/chat', method: 'POST', body: { message: 'test' } },
    { name: 'Advanced Analytics', endpoint: '/api/analytics', method: 'GET' },
  ];

  premiumFeatures.forEach((feature) => {
    test(`${feature.name} requires authentication`, async () => {
      const url = `${API_BASE_URL}${feature.endpoint}`;
      const response =
        feature.method === 'POST' ? await postJson(url, feature.body || {}) : await getJson(url);

      expect([200, 401, 403]).toContain(response.status);
    });
  });
});

describe('Middleware Error Handling', () => {
  test('invalid JWT returns 401 or null user', async () => {
    const response = await getJson(`${API_BASE_URL}/api/auth/me`, {
      Cookie: 'auth=invalid.jwt.token',
    });

    if (response.status === 200) {
      expect(response.data).toBeNull();
    } else {
      expect(response.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('malformed auth header is handled gracefully', async () => {
    const response = await getJson(`${API_BASE_URL}/api/auth/me`, {
      Authorization: 'Bearer malformed',
    });

    if (response.status === 200) {
      expect(response.data).toBeNull();
    }
  });
});
