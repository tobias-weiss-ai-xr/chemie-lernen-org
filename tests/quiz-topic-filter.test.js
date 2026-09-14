/**
 * UXF-056 — Quiz-Themen-Auswahl drift-sicher:
 * Vorher waren Kategorien („Anorganische Chemie" etc.) hardcodiert, die
 * Frage-DB nutzt aber andere Topics („Anorganische Verbindungen" etc.)
 * → exakter String-Match fiel leer → „Keine Fragen verfügbar".
 * Jetzt: Optionen dynamisch aus window.quizQuestions.
 */

import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8');

describe('UXF-056: Quiz-Topic-Filter', () => {
  const quizHtml = read('myhugoapp/layouts/_default/quiz.html');
  const questionsJs = read('myhugoapp/static/js/quiz-questions.js');

  test('keine hardcodierten Kategorien-Optionen mehr', () => {
    for (const cat of [
      'Allgemeine Chemie',
      'Anorganische Chemie',
      'Organische Chemie',
      'Physikalische Chemie',
    ]) {
      expect(quizHtml).not.toContain(`value="${cat}"`);
    }
  });

  test('dynamische Befüllung vorhanden (UXF-056)', () => {
    expect(quizHtml).toContain('UXF-056');
    expect(quizHtml).toContain('populateQuizTopics');
    expect(quizHtml).toMatch(/topics\.sort/);
  });

  test('verbliebene statische Optionen sind nur Platzhalter und „alle"', () => {
    const options = [...quizHtml.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]);
    for (const v of options) {
      expect(['', 'alle']).toContain(v);
    }
    expect(options).toContain('alle');
  });

  test('Frage-DB liefert Topics, die per exaktem Match erreichbar sind', () => {
    const topicMatches = [...questionsJs.matchAll(/topic:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(topicMatches.length).toBeGreaterThan(100);
    const unique = [...new Set(topicMatches)];
    expect(unique.length).toBeGreaterThanOrEqual(10);
    // die Populate-Logik erzeugt value = topic exakt → === -Match greift
    expect(quizHtml).toMatch(/opt\.value = t;/);
  });
});
