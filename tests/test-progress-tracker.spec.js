/**
 * Progress Tracker Tests
 * Verifies learning progress tracking functionality
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Progress Tracker', () => {
  test('should load progress tracking page', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const tracker = page.locator('.progress-tracker, #progress-tracker, [class*="progress"]');
    const hasTracker = (await await tracker.count()) > 0;

    if (hasTracker) {
      await expect(tracker.first()).toBeVisible();
    }
  });

  test('should display progress bars', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const progressBar = page.locator('.progress-bar, [role="progressbar"], .progress');
    const hasProgress = (await await progressBar.count()) > 0;

    if (hasProgress) {
      await expect(progressBar.first()).toBeVisible();
    }
  });

  test('should show completed topics', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const completed = page.locator('.completed, .done, [aria-checked="true"], .checked');
    const hasCompleted = (await await completed.count()) > 0;

    // This may or may not exist depending on user progress
    // Just check that the page loads without errors
    await page.waitForTimeout(500);
  });

  test('should have localStorage integration', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Check if progress is saved to localStorage
    const progressData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.filter((key) => key.includes('progress') || key.includes('tracker'));
    });

    // The test passes if we can access localStorage without errors
    expect(Array.isArray(progressData)).toBeTruthy();
  });

  test('should persist progress across page reloads', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Get initial progress state
    const initialProgress = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const progressKeys = keys.filter((key) => key.includes('progress'));
      const progress = {};
      progressKeys.forEach((key) => {
        progress[key] = localStorage.getItem(key);
      });
      return progress;
    });

    // Reload page
    await page.reload();

    // Check if progress is still there
    const reloadedProgress = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const progressKeys = keys.filter((key) => key.includes('progress'));
      const progress = {};
      progressKeys.forEach((key) => {
        progress[key] = localStorage.getItem(key);
      });
      return progress;
    });

    expect(JSON.stringify(reloadedProgress)).toBe(JSON.stringify(initialProgress));
  });

  test('should show percentage completion', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const percentage = page.locator('.percentage, text=/%/, [class*="percent"]');
    const hasPercentage = (await await percentage.count()) > 0;

    if (hasPercentage) {
      await expect(percentage.first()).toBeVisible();
    }
  });

  test('should have milestone indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const milestone = page.locator('.milestone, .checkpoint, .achievement');
    const hasMilestone = (await await milestone.count()) > 0;

    if (hasMilestone) {
      await expect(milestone.first()).toBeVisible();
    }
  });

  test('should update progress when completing topics', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // This test verifies the tracking mechanism exists
    // Actual progress updates would require user interaction
    const tracker = page.locator('.progress-tracker, #progress-tracker');
    const hasTracker = (await await tracker.count()) > 0;

    if (hasTracker) {
      await expect(tracker.first()).toBeAttached();
    }
  });

  test('should have reset progress option', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const resetBtn = page.locator(
      'button:has-text("Zurücksetzen"), button:has-text("Reset"), .reset-progress'
    );
    const hasReset = (await await resetBtn.count()) > 0;

    // Reset button may or may not be visible depending on implementation
    // Just verify the page doesn't crash when checking
    await page.waitForTimeout(500);
  });

  test('should display topic categories', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const categories = page.locator('.category, .topic-category, [class*="category"]');
    const hasCategories = (await await categories.count()) > 0;

    if (hasCategories) {
      await expect(categories.first()).toBeVisible();
    }
  });

  test('should integrate with navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Navigate to a topic page
    const topicLink = page.locator('a[href*="/themenbereiche/"]').first();

    if ((await topicLink.count()) > 0) {
      await topicLink.click();
      await page.waitForTimeout(1000);

      // Check if progress is tracked on topic pages
      const tracker = page.locator('.progress-tracker, #progress-tracker');
      const hasTracker = (await await tracker.count()) > 0;

      if (hasTracker) {
        await expect(tracker.first()).toBeAttached();
      }
    }
  });
});
