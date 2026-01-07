const { test, expect } = require('@playwright/test');

test.describe('Gas Law Simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gasgesetz-simulator/');
    await page.waitForSelector('.gas-law-simulator');
  });

  test('should load simulator correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Gasgesetz-Simulator');
    await expect(page.locator('.gas-law-simulator')).toBeVisible();
  });

  test('should display temperature slider', async ({ page }) => {
    await expect(page.locator('#temp-slider')).toBeVisible();
    await expect(page.locator('#temp-display')).toBeVisible();
  });

  test('should update temperature on slider change', async ({ page }) => {
    const tempSlider = page.locator('#temp-slider');
    const tempDisplay = page.locator('#temp-display');
    
    await tempSlider.fill('400');
    await expect(tempDisplay).toContainText('400 K');
  });

  test('should switch between gas laws', async ({ page }) => {
    const boyleBtn = page.locator('[data-law="boyle"]');
    const gaylussacBtn = page.locator('[data-law="gaylussac"]');
    
    await boyleBtn.click();
    await expect(page.locator('#law-formula')).toContainText('p₁V₁ = p₂V₂');
    
    await gaylussacBtn.click();
    await expect(page.locator('#law-formula')).toContainText('V/T = konstant');
  });

  test('should display calculations', async ({ page }) => {
    await page.locator('#pressure-slider').fill('2.0');
    await expect(page.locator('.calculation-results')).toBeVisible();
    await expect(page.locator('#results-content')).toContainText('Boyle-Mariotte Gesetz');
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.locator('#temp-slider')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#pressure-slider')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#volume-slider')).toBeFocused();
  });
});

test.describe('Molar Mass Visualizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/molare-masse-rechner/');
    await page.waitForSelector('.molar-mass-visualizer');
  });

  test('should load visualizer correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Molare Masse Visualizer');
    await expect(page.locator('.molar-mass-visualizer')).toBeVisible();
  });

  test('should accept formula input', async ({ page }) => {
    const formulaInput = page.locator('#formula-input');
    await formulaInput.fill('H2O');
    await page.locator('#calculate-btn').click();
    
    await expect(page.locator('#result-formula')).toContainText('H2O');
    await expect(page.locator('#result-mass')).toContainText('18.015');
  });

  test('should use quick formula buttons', async ({ page }) => {
    await page.locator('[data-formula="C6H12O6"]').click();
    await expect(page.locator('#formula-input')).toHaveValue('C6H12O6');
    await expect(page.locator('#result-mass')).toContainText('180.156');
  });

  test('should display element breakdown', async ({ page }) => {
    await page.locator('#formula-input').fill('NaCl');
    await page.locator('#calculate-btn').click();
    
    await expect(page.locator('#breakdown-content')).toBeVisible();
    await expect(page.locator('.element-breakdown-item')).toContainText('Na');
    await expect(page.locator('.element-breakdown-item')).toContainText('Cl');
  });

  test('should show error for invalid formula', async ({ page }) => {
    const formulaInput = page.locator('#formula-input');
    await formulaInput.fill('XyZ');
    await page.locator('#calculate-btn').click();
    
    await expect(page.locator('#formula-error')).toBeVisible();
    await expect(page.locator('#formula-error')).toContainText('Unbekanntes Element');
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.locator('#formula-input')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#calculate-btn')).toBeFocused();
  });
});

test.describe('Enhanced pH Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ph-rechner/');
    await page.waitForSelector('.enhanced-ph-viz');
  });

  test('should load visualization correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('pH-Rechner');
    await expect(page.locator('.enhanced-ph-viz')).toBeVisible();
  });

  test('should update pH on slider change', async ({ page }) => {
    const phSlider = page.locator('#ph-slider');
    const phValue = page.locator('#ph-value');
    
    await phSlider.fill('8.5');
    await expect(phValue).toContainText('8.5');
  });

  test('should show suitable indicators', async ({ page }) => {
    const phSlider = page.locator('#ph-slider');
    await phSlider.fill('9.0');
    
    await expect(page.locator('.suitable-indicators')).toBeVisible();
    await expect(page.locator('.indicator-item')).toContainText('Phenolphthalein');
  });

  test('should use example buttons', async ({ page }) => {
    await page.locator('[data-ph="1"]').click();
    await expect(page.locator('#ph-value')).toContainText('1.0');
    
    await page.locator('[data-ph="14"]').click();
    await expect(page.locator('#ph-value')).toContainText('14.0');
  });

  test('should animate titration curves', async ({ page }) => {
    await page.locator('#titration-type').selectOption('strong-strong');
    await page.locator('#start-titration').click();
    
    await page.waitForTimeout(2000);
    await expect(page.locator('#equivalence-point')).not.toContainText('--');
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.locator('#ph-slider')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#start-titration')).toBeFocused();
  });
});

test.describe('Accessibility Compliance', () => {
  test('should have proper semantic HTML', async ({ page }) => {
    await page.goto('/gasgesetz-simulator/');
    
    await expect(page.locator('h1')).toHaveAttribute('role', 'heading');
    await expect(page.locator('label')).toBeVisible();
    await expect(page.locator('button')).toHaveAttribute('aria-label');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/molare-masse-rechner/');
    
    let focusableElements = await page.locator('button, input, select').all();
    for (let i = 0; i < focusableElements.length; i++) {
      await page.keyboard.press('Tab');
      await expect(focusableElements[i]).toBeFocused();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/ph-rechner/');
    
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const styles = await button.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      expect(styles.color).not.toBe('');
      expect(styles.backgroundColor).not.toBe('');
    }
  });
});

test.describe('Responsive Design', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/gasgesetz-simulator/');
    
    await expect(page.locator('.gas-law-simulator')).toBeVisible();
    await expect(page.locator('.enhanced-ph-container')).not.toBeVisible();
  });

  test('should adapt to tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/molare-masse-rechner/');
    
    await expect(page.locator('.molar-mass-visualizer')).toBeVisible();
    const containerWidth = await page.locator('.enhanced-ph-container').evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    
    expect(containerWidth).toContain('1fr');
  });

  test('should maintain functionality on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/ph-rechner/');
    
    await expect(page.locator('.enhanced-ph-viz')).toBeVisible();
    await expect(page.locator('.enhanced-ph-container')).toBeVisible();
  });
});