/**
 * E2E — Curricula UX (User Stories Epic 19, US-109) across paradigms.
 *
 * Covers the interactive improvements P1–P4 on the live curricula page:
 *   P1  Übersichtsliste sichtbar & standardmäßig offen
 *   P2  Klick auf Lehrplan zoomt in DIESEN Lehrplan (Subtree, nicht BL)
 *   P3  Hierarchie-Daten (Curriculum→Thema→Teilthema→Lernziel) im Drill-down
 *   P4  Ausgewählt-Zustand in Liste + Graph, sauberes Zurücksetzen
 *
 * Runs against the live site (BASE_URL). Verifies behavior via DOM + the
 * actual /api/curricula/graph payload (network interception), not just pixels.
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Curricula UX — P1–P4 (User Stories)', () => {
  test('US-109 / P1: Übersichtsliste sichtbar & standardmäßig offen', async ({ page }) => {
    await page.goto(`${BASE_URL}/curricula/`);

    await expect(page.locator('#curricula-overview')).toBeVisible({ timeout: 15000 });
    // Header mit Gesamtzahl der Lehrpläne
    await expect(page.locator('.curricula-ov-head')).toHaveText(
      /Lehrplan-Übersicht · \d+ Lehrpläne/
    );
    // 16 Bundesländer
    await expect(page.locator('.curricula-ov-state')).toHaveCount(16, { timeout: 15000 });
    // P1: alle Gruppen sind von Anfang an aufgeklappt
    await expect(page.locator('.curricula-ov-state.open')).toHaveCount(16);
    // Lehrpläne ohne Klick sichtbar
    const curCount = await page.locator('.curricula-ov-cur').count();
    expect(curCount).toBeGreaterThan(20);
    await expect(page.locator('.curricula-ov-cur').first()).toBeVisible();
  });

  test('US-109 / P2+P4: Klick auf Lehrplan zoomt in DIESEN Lehrplan (Subtree) + Auswahl', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/curricula/`);
    await page.waitForSelector('.curricula-ov-cur', { timeout: 15000 });

    const firstCur = page.locator('.curricula-ov-cur').first();
    const slug = await firstCur.getAttribute('data-slug');
    expect(slug).toBeTruthy();

    // API-Payload des Drill-downs abfangen
    let drillBody = null;
    page.on('response', async (res) => {
      const u = res.url();
      if (
        u.includes('/api/curricula/graph') &&
        u.includes('curriculum=') &&
        slug &&
        u.includes(encodeURIComponent(slug))
      ) {
        try {
          drillBody = await res.json();
        } catch (_) {
          /* ignore */
        }
      }
    });

    await firstCur.click();

    // P4: angeklickter Lehrplan ist markiert
    await expect(page.locator('.curricula-ov-cur.selected')).toHaveCount(1);

    // P2: Graph-Request enthielt curriculum=<slug> und liefert fokussierten Subtree
    await expect.poll(() => drillBody).toBeTruthy({ timeout: 15000 });
    const curNodes = drillBody.nodes.filter((n) => n.type === 'curriculum');
    expect(curNodes).toHaveLength(1);
    expect(curNodes[0].id).toBe('cur:' + slug);

    // P3: Hierarchie-Daten vorhanden (Themen + Teilthemen/Lernziele)
    const types = {};
    drillBody.nodes.forEach((n) => {
      types[n.type] = (types[n.type] || 0) + 1;
    });
    expect(types.topic || 0).toBeGreaterThan(0);
    expect((types.subtopic || 0) + (types.objective || 0)).toBeGreaterThan(0);

    // Detail-Panel öffnet sich zum Curriculum
    await expect(page.locator('#curricula-node-details')).toBeVisible({ timeout: 15000 });
  });

  test('US-109 / P2: Klick auf Bundesland zeigt das ganze BL (nicht einzelnen Lehrplan)', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/curricula/`);
    await page.waitForSelector('.curricula-ov-state-head', { timeout: 15000 });

    let stateBody = null;
    page.on('response', async (res) => {
      const u = res.url();
      if (
        u.includes('/api/curricula/graph') &&
        u.includes('state=') &&
        !u.includes('curriculum=')
      ) {
        try {
          stateBody = await res.json();
        } catch (_) {
          /* ignore */
        }
      }
    });

    await page.locator('.curricula-ov-state-head').first().click();

    await expect.poll(() => stateBody).toBeTruthy({ timeout: 15000 });
    const curNodes = stateBody.nodes.filter((n) => n.type === 'curriculum');
    // mehrere Lehrpläne des Bundeslandes, nicht nur einer
    expect(curNodes.length).toBeGreaterThan(1);
    // P4: State-Header ist markiert
    await expect(page.locator('.curricula-ov-state-head.selected')).toHaveCount(1);
  });

  test('US-109 / P2+P4: Scope-Wechsel („Alle") leert Curriculum-Auswahl', async ({ page }) => {
    await page.goto(`${BASE_URL}/curricula/`);
    await page.waitForSelector('.curricula-ov-cur', { timeout: 15000 });

    await page.locator('.curricula-ov-cur').first().click();
    await expect(page.locator('.curricula-ov-cur.selected')).toHaveCount(1);

    await page.getByRole('button', { name: 'Alle' }).click();

    // Auswahl wird zurückgesetzt (P4 cleanup)
    await expect(page.locator('.curricula-ov-cur.selected')).toHaveCount(0);
    await expect(page.locator('.curricula-ov-state-head.selected')).toHaveCount(0);
    // Graph zeigt wieder den Gesamt-Scope (kein curriculum=-Filter mehr)
    let allBody = null;
    page.on('response', async (res) => {
      const u = res.url();
      if (u.includes('/api/curricula/graph') && !u.includes('curriculum=')) {
        try {
          allBody = await res.json();
        } catch (_) {
          /* ignore */
        }
      }
    });
    await expect.poll(() => allBody).toBeTruthy({ timeout: 15000 });
  });
});
