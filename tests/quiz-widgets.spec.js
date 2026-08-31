/**
 * E2E — Quiz-Widgets haben Fragen (Regression 2026-08-31).
 *
 * Vorher zeigte JEDES eingebettete Quiz "Quiz-Fragen nicht verfügbar.":
 * quiz-widget.html griff auf quizQuestions.questions zu, obwohl
 * quiz-questions.js die Bank als Array expos't. Zudem resolvierten
 * historische teilgebiet-Slugs (thermodynamik, physikalische-chemie, …)
 * zu keinen Fragen — der Alias-Fix mappt sie auf echte Themen.
 *
 * Läuft gegen die Live-Site (BASE_URL).
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

async function widgetState(page) {
  return page.evaluate(() => {
    const body = document.querySelector('[id^="quiz-body-"]');
    return {
      vorhanden: !!body,
      kaputt: body ? body.textContent.includes('nicht verfügbar') : null,
      hatFrage: body ? body.textContent.trim().length > 40 : false,
    };
  });
}

test.describe('Quiz-Widgets (Regression 2026-08-31)', () => {
  test('Rechner-Seite mit direktem Themen-Slug zeigt Fragen', async ({ page }) => {
    await page.goto(`${BASE_URL}/molare-masse-rechner/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const s = await widgetState(page);
    expect(s.vorhanden).toBe(true);
    expect(s.kaputt).toBe(false);
    expect(s.hatFrage).toBe(true);
  });

  test('Rechner-Seite mit Alias-Slug (physikalische-chemie → energetik) zeigt Fragen', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/gasgesetz-rechner/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const s = await widgetState(page);
    expect(s.vorhanden).toBe(true);
    expect(s.kaputt).toBe(false);
    expect(s.hatFrage).toBe(true);
  });

  test('zentrale /quiz/-Seite lädt die Fragenbank', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz/?e2e=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const questions = await page.evaluate(() => {
      // quiz.html nutzt window.quizQuestions (Array) direkt
      return Array.isArray(window.quizQuestions) ? window.quizQuestions.length : 0;
    });
    expect(questions).toBeGreaterThan(50);
  });
});
