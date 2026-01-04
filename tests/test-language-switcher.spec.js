/**
 * Language Switcher Tests
 * Verifies language switching functionality
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Language Switcher', () => {
  test.beforeEach(async ({ page }) => {
    // Set default language before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('should have language switcher on page', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for language switcher dropdown or button
    const languageSelect = page.locator('.language-select');
    const languageButton = page.locator('.language-button');

    const hasSwitcher =
      (await await languageSelect.count()) > 0 || (await languageButton.count()) > 0;
    expect(hasSwitcher).toBeTruthy();
  });

  test('should display German by default', async ({ page }) => {
    await page.goto(BASE_URL);

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('lang', 'de');
  });

  test('should switch to English when selected', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for language dropdown
    const languageSelect = page.locator('.language-select');
    const selectCount = await languageSelect.count();

    if (selectCount > 0) {
      // Select English option
      await languageSelect.selectOption('en');

      // Verify language changed
      const htmlElement = page.locator('html');
      await expect(htmlElement).toHaveAttribute('lang', 'en');
    }
  });

  test('should save language preference to localStorage', async ({ page }) => {
    await page.goto(BASE_URL);

    const languageSelect = page.locator('.language-select');
    const selectCount = await languageSelect.count();

    if (selectCount > 0) {
      await languageSelect.selectOption('en');

      const locale = await page.evaluate(() => localStorage.getItem('locale'));
      expect(locale).toBe('en');
    }
  });

  test('should restore language preference from localStorage', async ({ page }) => {
    // Set English preference
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.setItem('locale', 'en'));

    // Reload page
    await page.reload();

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('lang', 'en');
  });

  test('should have language options available', async ({ page }) => {
    await page.goto(BASE_URL);

    const languageSelect = page.locator('.language-select');
    const selectCount = await languageSelect.count();

    if (selectCount > 0) {
      const options = await languageSelect.locator('option').all();
      expect(options.length).toBeGreaterThan(0);

      // Check for German option
      const germanOption = languageSelect.locator('option[value="de"]');
      await expect(germanOption).toBeAttached();
    }
  });

  test('should translate page content when language changes', async ({ page }) => {
    await page.goto(BASE_URL);

    // Get some German text (e.g., navigation)
    const germanNav = page.locator('nav >> text=/Rechner|Themenbereiche/');

    const languageSelect = page.locator('.language-select');
    const selectCount = await languageSelect.count();

    if (selectCount > 0) {
      await languageSelect.selectOption('en');

      // Wait for translation to apply
      await page.waitForTimeout(500);

      // After switching to English, should have English content
      const englishNav = page.locator('nav >> text=/Calculator|Topics/');
      const hasEnglishContent = (await await englishNav.count()) > 0;
      expect(hasEnglishContent).toBeTruthy();
    }
  });

  test('should maintain language across navigation', async ({ page }) => {
    await page.goto(BASE_URL);

    const languageSelect = page.locator('.language-select');
    const selectCount = await languageSelect.count();

    if (selectCount > 0) {
      // Switch to English
      await languageSelect.selectOption('en');

      // Navigate to calculator page
      await page.goto(`${BASE_URL}/molare-masse-rechner/`);

      // Verify language is maintained
      const htmlElement = page.locator('html');
      await expect(htmlElement).toHaveAttribute('lang', 'en');
    }
  });

  test('should show flags if enabled', async ({ page }) => {
    await page.goto(BASE_URL);

    const languageSelect = page.locator('.language-select');
    const selectCount = await languageSelect.count();

    if (selectCount > 0) {
      // Check if any option contains flag emoji
      const flags = page.locator('.language-select option').filter(async (option) => {
        const text = await option.textContent();
        return text.includes('🇩🇪') || text.includes('🇬🇧');
      });

      const hasFlags = (await await flags.count()) > 0;
      expect(hasFlags).toBeTruthy();
    }
  });
});
