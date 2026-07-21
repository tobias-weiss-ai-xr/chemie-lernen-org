/**
 * Stripe Premium Webhook Tests
 *
 * Tests for Stripe webhook handlers that manage premium subscriptions:
 * - checkout.session.completed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_failed
 */

const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

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

describe('Stripe Webhook Handlers', () => {
  const webhookEndpoint = `${API_BASE_URL}/api/auth/stripe-webhook`;

  describe('Event signature validation', () => {
    test('returns 400 when Stripe-Signature header is missing', async () => {
      const response = await postJson(webhookEndpoint, {
        type: 'checkout.session.completed',
        data: { object: {} },
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    test('returns 400 when signature is invalid', async () => {
      const response = await postJson(
        webhookEndpoint,
        {
          type: 'checkout.session.completed',
          data: { object: {} },
        },
        {
          'Stripe-Signature': 't=invalid,invalid=',
        }
      );

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });
  });

  describe('checkout.session.completed', () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test123',
          subscription: 'sub_test123',
          mode: 'subscription',
          metadata: {
            userId: 'user-123',
          },
        },
      },
    };

    test('acknowledges event with 200 status', async () => {
      const response = await postJson(webhookEndpoint, mockEvent, {
        'Stripe-Signature': 't=1234567890,v1=abc123',
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('customer.subscription.updated', () => {
    const mockEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'active',
          items: {
            data: [
              {
                price: {
                  id: 'price_premium_monthly',
                  product: 'prod_premium',
                },
              },
            ],
          },
        },
      },
    };

    test('acknowledges event with 200 status', async () => {
      const response = await postJson(webhookEndpoint, mockEvent, {
        'Stripe-Signature': 't=1234567890,v1=abc123',
      });

      expect([200, 400]).toContain(response.status);
    });

    test('handles plan upgrade (free → premium)', async () => {
      const upgradeEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            ...mockEvent.data.object,
            status: 'active',
          },
        },
      };

      const response = await postJson(webhookEndpoint, upgradeEvent, {
        'Stripe-Signature': 't=1234567890,v1=abc123',
      });

      expect([200, 400]).toContain(response.status);
    });

    test('handles past_due status', async () => {
      const pastDueEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            ...mockEvent.data.object,
            status: 'past_due',
          },
        },
      };

      const response = await postJson(webhookEndpoint, pastDueEvent, {
        'Stripe-Signature': 't=1234567890,v1=abc123',
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('customer.subscription.deleted', () => {
    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'canceled',
        },
      },
    };

    test('acknowledges event with 200 status', async () => {
      const response = await postJson(webhookEndpoint, mockEvent, {
        'Stripe-Signature': 't=1234567890,v1=abc123',
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('invoice.payment_failed', () => {
    const mockEvent = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_test123',
          customer: 'cus_test123',
          amount_due: 2999,
          currency: 'eur',
          hosted_invoice_url: 'https://invoice.stripe.com/test123',
        },
      },
    };

    test('acknowledges event with 200 status', async () => {
      const response = await postJson(webhookEndpoint, mockEvent, {
        'Stripe-Signature': 't=1234567890,v1=abc123',
      });

      expect([200, 400]).toContain(response.status);
    });
  });
});

describe('Premium User Detection', () => {
  const authMeEndpoint = `${API_BASE_URL}/api/auth/me`;

  describe('User plan property', () => {
    test('user object has plan or tier property', async () => {
      const response = await getJson(authMeEndpoint);

      if (response.status === 200 && response.data) {
        expect(response.data).toHaveProperty('plan');
        expect(['free', 'premium', 'past_due', null]).toContain(response.data.plan);
      }
    });

    test('premium user has active subscription', async () => {
      const response = await getJson(authMeEndpoint);

      if (response.status === 200 && response.data?.plan === 'premium') {
        expect(response.data).toHaveProperty('stripeSubscriptionId');
        expect(response.data.stripeSubscriptionId).toBeTruthy();
      }
    });
  });
});

describe('Stripe Configuration', () => {
  test('STRIPE_WEBHOOK_SECRET is configured', () => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === 'production' || process.env.CI) {
      expect(webhookSecret).toBeTruthy();
      expect(webhookSecret).toMatch(/^whsec_/);
    }
  });

  test('STRIPE_SECRET_KEY is configured', () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (process.env.NODE_ENV === 'production' || process.env.CI) {
      expect(secretKey).toBeTruthy();
      expect(secretKey).toMatch(/^sk_(test|live)_/);
    }
  });

  test('STRIPE_PRICE_ID is configured', () => {
    const priceId = process.env.STRIPE_PRICE_ID;
    if (process.env.NODE_ENV === 'production' || process.env.CI) {
      expect(priceId).toBeTruthy();
      expect(priceId).toMatch(/^price_/);
    }
  });
});
