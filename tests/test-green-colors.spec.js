/**
 * Green Color Consistency Tests
 * Verifies that all UI elements use green color scheme consistently
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

// Expected green colors
const GREEN_COLORS = {
    primary: 'rgb(76, 175, 80)',      // #4caf50
    dark: 'rgb(56, 142, 60)',          // #388e3c
    light: 'rgb(200, 230, 201)',       // #c8e6c9 (from dark mode CSS)
    darker: 'rgb(200, 230, 201)',      // #c8e6c9 (navbar-brand light green)
    medium: 'rgb(46, 125, 50)'         // #2e7d32
};

// Blue colors that should NOT appear
const BLUE_COLORS = [
    'rgb(0, 123, 255)',    // #007bff
    'rgb(0, 86, 179)',     // #0056b3
    'rgb(59, 130, 246)',   // #3b82f6
    'rgb(96, 165, 250)'    // #60a5fa
];

test.describe('Molekülstudio - Green Color Tests', () => {

    test('Visualisieren button should be green', async ({ page }) => {
        await page.goto(`${BASE_URL}/molekuel-studio/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const visualizeBtn = page.locator('#visualize-btn');
        await expect(visualizeBtn).toBeVisible();

        const bgColor = await visualizeBtn.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });

        expect(bgColor).toBe(GREEN_COLORS.primary);
    });
});

test.describe('Periodensystem - Green Color Tests', () => {

    test('Active button should be green', async ({ page }) => {
        await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const activeButton = page.locator('button.active-mode');
        await expect(activeButton).toBeVisible();

        const bgColor = await activeButton.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });

        expect(bgColor).toBe(GREEN_COLORS.primary);
    });

    test('Element cards should have green shadows', async ({ page }) => {
        await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Wait for 3D to finish transforming
        await page.waitForTimeout(2000);

        const element = page.locator('.element').first();
        await expect(element).toBeVisible();

        const boxShadow = await element.evaluate((el) => {
            return window.getComputedStyle(el).boxShadow;
        });

        // Check for green color in box-shadow (rgba(76,175,80,*))
        expect(boxShadow).toContain('76');
        expect(boxShadow).toContain('175');
        expect(boxShadow).toContain('80');
    });
});

test.describe('Navigation - Green Color Tests', () => {

    test('Navigation links should be green', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const navLinks = page.locator('.navbar-nav > li > a');
        const count = await navLinks.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const link = navLinks.nth(i);
            const color = await link.evaluate((el) => {
                return window.getComputedStyle(el).color;
            });

            // Check for green-ish color (rgb with G value higher than R and B)
            const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
                const [, r, g, b] = rgbMatch.map(Number);
                expect(g).toBeGreaterThan(r);
                expect(g).toBeGreaterThan(b);
            }
        }
    });

    test('Site title should be dark green', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const brand = page.locator('.navbar-brand');
        const color = await brand.evaluate((el) => {
            return window.getComputedStyle(el).color;
        });

        expect(color).toBe(GREEN_COLORS.darker);
    });
});

test.describe('Dark Mode - Green Color Tests', () => {

    test('Dark mode should use green text colors', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Enable dark mode
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
        });
        await page.waitForTimeout(500);

        const body = page.locator('body');
        const color = await body.evaluate((el) => {
            return window.getComputedStyle(el).color;
        });

        // Should be light green
        expect(color).toBe(GREEN_COLORS.light);
    });

    test('Periodensystem dark mode should have green background', async ({ page }) => {
        await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Enable dark mode
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
        });
        await page.waitForTimeout(500);

        const bodyBg = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });

        // Should be dark greenish (rgb(10, 26, 15))
        expect(bodyBg).toBe('rgb(10, 26, 15)');
    });

    test('Molekülstudio dark mode buttons should be green', async ({ page }) => {
        await page.goto(`${BASE_URL}/molekuel-studio/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Enable dark mode
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'dark');
        });
        await page.waitForTimeout(500);

        const visualizeBtn = page.locator('#visualize-btn');
        const bgColor = await visualizeBtn.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });

        expect(bgColor).toBe(GREEN_COLORS.primary);
    });
});

test.describe('Regression Tests - No Blue Colors', () => {

    test('Homepage should not have blue buttons', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const buttons = page.locator('button, .btn');
        const count = await buttons.count();

        for (let i = 0; i < count; i++) {
            const button = buttons.nth(i);
            const bgColor = await button.evaluate((el) => {
                return window.getComputedStyle(el).backgroundColor;
            });

            // Check it's not one of the known blue colors
            BLUE_COLORS.forEach(blue => {
                expect(bgColor).not.toBe(blue);
            });
        }
    });

    test('Molekülstudio should not have blue interactive elements', async ({ page }) => {
        await page.goto(`${BASE_URL}/molekuel-studio/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const interactiveElements = page.locator('button, .suggestion-chip');
        const count = await interactiveElements.count();

        for (let i = 0; i < count; i++) {
            const element = interactiveElements.nth(i);
            const bgColor = await element.evaluate((el) => {
                return window.getComputedStyle(el).backgroundColor;
            });

            // Check it's not one of the known blue colors
            BLUE_COLORS.forEach(blue => {
                expect(bgColor).not.toBe(blue);
            });
        }
    });

    test('Periodensystem buttons should not be blue', async ({ page }) => {
        await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const buttons = page.locator('#menu button');
        const count = await buttons.count();

        for (let i = 0; i < count; i++) {
            const button = buttons.nth(i);
            const bgColor = await button.evaluate((el) => {
                return window.getComputedStyle(el).backgroundColor;
            });

            // Check it's not one of the known blue colors
            BLUE_COLORS.forEach(blue => {
                expect(bgColor).not.toBe(blue);
            });
        }
    });
});
