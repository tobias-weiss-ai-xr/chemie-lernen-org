/**
 * Tests for the collab-engine quiz challenge functions.
 * Uses an isolated working directory so file persistence writes
 * to a temp dir instead of the repo's data/collab.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  createSession,
  postQuizChallenge,
  getChallenges,
  reactToChallenge,
} from '../api/collab-engine.js';

/* eslint-disable jest/no-standalone-expect */
describe('collab quiz challenges', () => {
  let tmpDir;
  let sessionId;
  let oldCwd;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-test-'));
    oldCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterAll(() => {
    if (oldCwd) process.chdir(oldCwd);
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    const session = createSession('Testgruppe', 'Redox', 'user-1', 'Anna');
    sessionId = session.id;
    expect(session).toBeTruthy();
  });

  test('creates a challenge with score and percentage', () => {
    const result = postQuizChallenge(sessionId, 'user-1', {
      topic: 'Redoxreaktionen',
      score: 8,
      total: 10,
      percentage: 80,
      note: 'Geschafft!',
    });
    expect(result.success).toBe(true);
    expect(result.challenge.score).toBe(8);
    expect(result.challenge.total).toBe(10);
    expect(result.challenge.percentage).toBe(80);
    expect(result.challenge.displayName).toBe('Anna');
  });

  test('rejects challenges from non-participants', () => {
    const result = postQuizChallenge(sessionId, 'user-99', {
      topic: 'X',
      score: 5,
      total: 10,
    });
    expect(result.error).toBeTruthy();
  });

  test('lists challenges in order', () => {
    postQuizChallenge(sessionId, 'user-1', { topic: 'A', score: 5, total: 10 });
    postQuizChallenge(sessionId, 'user-1', { topic: 'B', score: 9, total: 10 });
    const challenges = getChallenges(sessionId);
    expect(challenges).toHaveLength(2);
    expect(challenges[0].topic).toBe('A');
    expect(challenges[1].topic).toBe('B');
  });

  test('adds reactions to a challenge', () => {
    const created = postQuizChallenge(sessionId, 'user-1', {
      topic: 'C',
      score: 7,
      total: 10,
    });
    const chal = created.challenge;
    const react1 = reactToChallenge(sessionId, chal.id, 'user-1', '👍');
    expect(react1.success).toBe(true);
    expect(react1.reactions['👍']).toBe(1);
    const react2 = reactToChallenge(sessionId, chal.id, 'user-1', '👍');
    expect(react2.reactions['👍']).toBe(2);
    const react3 = reactToChallenge(sessionId, chal.id, 'user-1', '🎉');
    expect(react3.reactions['🎉']).toBe(1);
  });

  test('defaults percentage when not provided', () => {
    const result = postQuizChallenge(sessionId, 'user-1', {
      topic: 'D',
      score: 3,
      total: 4,
    });
    expect(result.challenge.percentage).toBe(75);
  });
});
