/**
 * Dark Mode Tests
 * Verifies dark mode toggle functionality
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Dark Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('should have theme toggle button', async ({ page }) => {
    await page.goto(BASE_URL);

    const toggleBtn = page.locator('#theme-toggle');
    await expect(toggleBtn).toBeVisible();
  });

  test('should default to dark theme', async ({ page }) => {
    await page.goto(BASE_URL);

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
  });

  test('should toggle to light theme when clicked', async ({ page }) => {
    await page.goto(BASE_URL);

    const toggleBtn = page.locator('#theme-toggle');
    await toggleBtn.click();

    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveAttribute('data-theme', 'dark');
  });

  test('should toggle back to dark theme when clicked twice', async ({ page }) => {
    await page.goto(BASE_URL);

    const toggleBtn = page.locator('#theme-toggle');
    await toggleBtn.click();
    await toggleBtn.click();

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
  });

  test('should save theme preference to localStorage', async ({ page }) => {
    await page.goto(BASE_URL);

    const toggleBtn = page.locator('#theme-toggle');
    await toggleBtn.click();

    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('light');
  });

  test('should restore theme from localStorage on page load', async ({ page }) => {
    await page.goto(BASE_URL);

    // Set to light theme
    await page.evaluate(() => localStorage.setItem('theme', 'light'));

    // Reload page
    await page.reload();

    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveAttribute('data-theme', 'dark');
  });

  test('should update button icon on toggle', async ({ page }) => {
    await page.goto(BASE_URL);

    const toggleBtn = page.locator('#theme-toggle');
    const icon = toggleBtn.locator('i');

    // Initially should have sun icon (in dark mode)
    await expect(icon).toHaveClass(/fa-sun-o/);

    // After toggle should have moon icon
    await toggleBtn.click();
    await expect(icon).toHaveClass(/fa-moon-o/);
  });

  test('should update button title attribute', async ({ page }) => {
    await page.goto(BASE_URL);

    const toggleBtn = page.locator('#theme-toggle');

    // In dark mode, title should be "Zu hell wechseln"
    await expect(toggleBtn).toHaveAttribute('title', 'Zu hell wechseln');

    // After toggle, title should be "Zu dunkel wechseln"
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('title', 'Zu dunkel wechseln');
  });

  test('should maintain theme across navigation', async ({ page }) => {
    await page.goto(BASE_URL);

    const toggleBtn = page.locator('#theme-toggle');
    await toggleBtn.click();

    // Navigate to another page
    await page.goto(`${BASE_URL}/molare-masse-rechner/`);

    const htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveAttribute('data-theme', 'dark');
  });
});
