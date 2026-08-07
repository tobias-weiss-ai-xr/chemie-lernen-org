/**
 * @jest-environment node
 *
 * Unit tests for FileBackedSessionStore#getSession — the missing method that
 * learning-engine and the exercise routes call. Regresses the root-cause bug
 * where sessionStore.getSession was `is not a function`.
 */

import { describe, test, expect } from '@jest/globals';
import FileBackedSessionStore from '../api/session-store.js';

describe('FileBackedSessionStore.getSession', () => {
  test('get-or-creates a session keyed by user id', () => {
    const store = new FileBackedSessionStore();
    const session = store.getSession('user-42');

    expect(session).toBeDefined();
    expect(session.userId).toBe('user-42');
    expect(session.progress).toBeDefined();

    // Same id returns the same object (no duplicate).
    expect(store.getSession('user-42')).toBe(session);
    // Different id produces a distinct session.
    expect(store.getSession('user-99')).not.toBe(session);
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
