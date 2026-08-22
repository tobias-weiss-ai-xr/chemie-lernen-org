/**
 * @jest-environment node
 *
 * Unit tests for checkScopedQuota — the daily per-scope quota used to bound
 * LLM-backed hint requests (/api/chat/hint) independently of the 50/day
 * chat message quota.
 */

import { describe, test, expect } from '@jest/globals';
import { checkScopedQuota } from '../api/services/session.js';

describe('checkScopedQuota', () => {
  test('allows requests up to the limit and reports remaining', () => {
    // 3/day quota
    expect(checkScopedQuota('hint', 'client-a', 3)).toEqual({ allowed: true, remaining: 2 });
    expect(checkScopedQuota('hint', 'client-a', 3)).toEqual({ allowed: true, remaining: 1 });
    expect(checkScopedQuota('hint', 'client-a', 3)).toEqual({ allowed: true, remaining: 0 });
  });

  test('rejects with remaining 0 once the daily limit is exceeded', () => {
    checkScopedQuota('hint', 'client-b', 2);
    checkScopedQuota('hint', 'client-b', 2);
    expect(checkScopedQuota('hint', 'client-b', 2)).toEqual({ allowed: false, remaining: 0 });
    expect(checkScopedQuota('hint', 'client-b', 2)).toEqual({ allowed: false, remaining: 0 });
  });

  test('scopes are independent: hint quota does not consume chat quota', () => {
    // Same subject, different scope
    checkScopedQuota('hint', 'client-c', 1);
    expect(checkScopedQuota('chat', 'client-c', 1)).toEqual({ allowed: true, remaining: 0 });
  });

  test('subjects are independent: IP rotation does not drain another IP', () => {
    checkScopedQuota('hint', 'client-d', 1);
    expect(checkScopedQuota('hint', 'client-e', 1)).toEqual({ allowed: true, remaining: 0 });
    // Logged-in users are keyed with a 'u:' prefix so user id and IP are distinct.
    expect(checkScopedQuota('hint', 'u:42', 1)).toEqual({ allowed: true, remaining: 0 });
  });
});
