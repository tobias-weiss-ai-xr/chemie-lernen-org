/**
 * Simple Screenshot Tests
 * Takes screenshots of all main pages
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Screenshot Tests', () => {

    test('Homepage - full page screenshot', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });
    });

    test('Periodensystem - full page screenshot', async ({ page }) => {
        await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for 3D to load
        await page.screenshot({ path: 'screenshots/periodensystem.png', fullPage: true });
    });

    test('Molekülstudio - full page screenshot', async ({ page }) => {
        await page.goto(`${BASE_URL}/molekuel-studio/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/molekuel-studio.png', fullPage: true });
    });

    test('Molekülstudio - with molecule loaded', async ({ page }) => {
        await page.goto(`${BASE_URL}/molekuel-studio/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Click on Wasser button
        const wasserChip = page.locator('.suggestion-chip').filter({ hasText: 'Wasser' });
        await wasserChip.click();
        await page.waitForTimeout(2000); // Wait for molecule to render

        await page.screenshot({ path: 'screenshots/molekuel-studio-wasser.png', fullPage: true });
    });

    test('Periodensystem - dark mode', async ({ page }) => {
        await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Enable dark mode
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
        });
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'screenshots/periodensystem-dark.png', fullPage: true });
    });

    test('Mobile view - homepage', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/mobile-homepage.png', fullPage: true });
    });

    test('Mobile view - Periodensystem', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/mobile-periodensystem.png', fullPage: true });
    });

    test('Mobile view - Molekülstudio', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}/molekuel-studio/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/mobile-molekuel-studio.png', fullPage: true });
    });
});
