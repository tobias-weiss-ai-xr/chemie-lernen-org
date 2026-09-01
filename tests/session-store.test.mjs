/**
 * @vitest-environment node
 *
 * Unit tests for FileBackedSessionStore#getSession — the missing method that
 * learning-engine and the exercise routes call. Regresses the root-cause bug
 * where sessionStore.getSession was `is not a function`.
 */

import { describe, test, expect } from 'vitest';
import FileBackedSessionStore from '../api/session-store.js';

describe('FileBackedSessionStore.getSession', () => {
  test('get-or-creates a session keyed by user id', () => {
    const store = new FileBackedSessionStore();
    const session = store.getSession('user-42');

    expect(session).toBeDefined();
    expect(session.userId).toBe('user-42');
    // Chat pushes into session.messages — must be an array even for newly
    // created sessions. Regression: exercise/session flow must not crash chat.
    expect(Array.isArray(session.messages)).toBe(true);
    // Progress is NOT pre-initialized here: a partial `progress: {}` would
    // bypass learning-engine.getProgress()'s full defaulting and crash
    // addXpEntry (xpHistory.unshift) on the first grade.
    expect('progress' in session).toBe(false);

    // Same id returns the same object (no duplicate).
    expect(store.getSession('user-42')).toBe(session);
    // Different id produces a distinct session.
    expect(store.getSession('user-99')).not.toBe(session);
  });

  test('fills missing messages on restored legacy sessions', () => {
    const store = new FileBackedSessionStore();
    store.set('legacy-1', { userId: 'legacy-1' });
    const session = store.getSession('legacy-1');
    expect(Array.isArray(session.messages)).toBe(true);
  });

  test('set() and get() remain Map-compatible', () => {
    const store = new FileBackedSessionStore();
    const s = { messages: [] };
    store.set('sid-1', s);
    expect(store.get('sid-1')).toBe(s);
    expect(store.has('sid-1')).toBe(true);
    store.delete('sid-1');
    expect(store.has('sid-1')).toBe(false);
  });
});
