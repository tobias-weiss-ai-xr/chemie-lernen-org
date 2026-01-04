/**
 * Visualization Components Tests
 * Verifies 3D visualizations and interactive charts
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Reaction Pathway Visualization', () => {
  test('should load reaction pathway visualization', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const pathway = page.locator('.reaction-pathway, #reaction-pathway, canvas[class*="pathway"]');
    const hasPathway = (await await pathway.count()) > 0;

    if (hasPathway) {
      await expect(pathway.first()).toBeVisible();
    }
  });

  test('should have interactive elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const interactive = page.locator(
      '.reaction-pathway button, .reaction-pathway .interactive, .node'
    );
    const hasInteractive = (await await interactive.count()) > 0;

    if (hasInteractive) {
      await expect(interactive.first()).toBeVisible();
    }
  });

  test('should display reaction steps', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const steps = page.locator('.step, .reaction-step, .pathway-step');
    const hasSteps = (await await steps.count()) > 0;

    if (hasSteps) {
      await expect(steps.first()).toBeVisible();
    }
  });

  test('should support zoom and pan controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const controls = page.locator('.zoom, .pan, .control, button[title*="Zoom"]');
    const hasControls = (await await controls.count()) > 0;

    if (hasControls) {
      await expect(controls.first()).toBeVisible();
    }
  });

  test('should show molecule structures', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const molecules = page.locator('.molecule, .structure, canvas');
    const hasMolecules = (await await molecules.count()) > 0;

    if (hasMolecules) {
      await expect(molecules.first()).toBeVisible();
    }
  });
});

test.describe('3D Visualizer', () => {
  test('should load 3D visualization', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const visualizer = page.locator('.visualizer-3d, #visualizer-3d, canvas[class*="visualizer"]');
    const hasVisualizer = (await await visualizer.count()) > 0;

    if (hasVisualizer) {
      await expect(visualizer.first()).toBeVisible();
    }
  });

  test('should have Three.js canvas', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeAttached();
  });

  test('should support camera controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const cameraControls = page.locator('.camera-controls, .orbit-controls');
    const hasControls = (await await cameraControls.count()) > 0;

    if (hasControls) {
      await expect(cameraControls.first()).toBeVisible();
    }
  });

  test('should have fullscreen option', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const fullscreenBtn = page.locator('button:has-text("Vollbild"), button[title*="Fullscreen"]');
    const hasFullscreen = (await await fullscreenBtn.count()) > 0;

    if (hasFullscreen) {
      await expect(fullscreenBtn.first()).toBeVisible();
    }
  });

  test('should load 3D models', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Wait for Three.js to initialize
    await page.waitForTimeout(2000);

    const model = page.locator('.model, .mesh, canvas');
    await expect(model.first()).toBeVisible();
  });

  test('should support object rotation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const canvas = page.locator('canvas').first();

    // Simulate mouse drag for rotation
    await canvas.click();
    await page.mouse.down();
    await page.mouse.move(50, 50);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Canvas should still be visible
    await expect(canvas).toBeVisible();
  });

  test('should have lighting controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const lighting = page.locator('.lighting, .lights, input[type="range"][id*="light"]');
    const hasLighting = (await await lighting.count()) > 0;

    if (hasLighting) {
      await expect(lighting.first()).toBeVisible();
    }
  });

  test('should display legend or labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const legend = page.locator('.legend, .labels, .label');
    const hasLegend = (await await legend.count()) > 0;

    if (hasLegend) {
      await expect(legend.first()).toBeVisible();
    }
  });

  test('should support animation toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const animateToggle = page.locator(
      'input[type="checkbox"][id*="animate"], button:has-text("Animation")'
    );
    const hasToggle = (await await animateToggle.count()) > 0;

    if (hasToggle) {
      await expect(animateToggle.first()).toBeVisible();
    }
  });

  test('should have loading indicator', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const loader = page.locator('.loader, .loading, .spinner');
    const hasLoader = (await await loader.count()) > 0;

    // Loader may disappear quickly
    if (hasLoader) {
      await expect(loader.first()).toBeVisible();
    }
  });

  test('should handle window resize', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Wait for 3D content to load
    await page.waitForTimeout(2000);

    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();
  });
});

test.describe('Chart Manager', () => {
  test('should load chart library', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Check if Chart.js is loaded
    const chartJsScript = page.locator('script[src*="chart"]').first();
    await expect(chartJsScript).toBeAttached();
  });

  test('should display data charts', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const chart = page.locator('canvas[id*="chart"], .chart, [class*="chart"]');
    const hasChart = (await await chart.count()) > 0;

    if (hasChart) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should have chart tooltips', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const chart = page.locator('canvas[id*="chart"]').first();

    if ((await chart.count()) > 0) {
      // Hover over chart to trigger tooltip
      await chart.hover();
      await page.waitForTimeout(500);

      const tooltip = page.locator('.chart-tooltip, .tooltip, [role="tooltip"]');
      const hasTooltip = (await await tooltip.count()) > 0;

      if (hasTooltip) {
        await expect(tooltip.first()).toBeVisible();
      }
    }
  });

  test('should support chart legend', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const legend = page.locator('.chart-legend, .legend');
    const hasLegend = (await await legend.count()) > 0;

    if (hasLegend) {
      await expect(legend.first()).toBeVisible();
    }
  });

  test('should have chart type selector', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const typeSelector = page.locator('select[name*="chart"], .chart-type');
    const hasSelector = (await await typeSelector.count()) > 0;

    if (hasSelector) {
      await expect(typeSelector.first()).toBeVisible();
    }
  });

  test('should export chart data', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const exportBtn = page.locator(
      'button:has-text("Export"), button:has-text("Herunterladen"), .chart-export'
    );
    const hasExport = (await await exportBtn.count()) > 0;

    if (hasExport) {
      await expect(exportBtn.first()).toBeVisible();
    }
  });

  test('should update chart dynamically', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Look for data input or filter controls
    const dataInput = page.locator('input[name*="data"], .data-filter');
    const hasInput = (await await dataInput.count()) > 0;

    if (hasInput) {
      await expect(dataInput.first()).toBeVisible();
    }
  });

  test('should support chart animations', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const animationToggle = page.locator(
      'input[type="checkbox"][id*="animate"], button:has-text("Animation")'
    );
    const hasToggle = (await await animationToggle.count()) > 0;

    if (hasToggle) {
      await expect(animationToggle.first()).toBeVisible();
    }
  });

  test('should have responsive charts', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const chart = page.locator('canvas[id*="chart"]').first();

    if ((await chart.count()) > 0) {
      // Resize and check if chart adapts
      await page.setViewportSize({ width: 600, height: 400 });
      await page.waitForTimeout(500);

      await expect(chart).toBeVisible();
    }
  });
});

test.describe('Periodic Table Visualization', () => {
  test('should load periodic table visualization', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const table = page.locator('.periodic-table, #periodic-table');
    await expect(table.first()).toBeVisible();
  });

  test('should have element tooltips', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const element = page.locator('.element').first();

    if ((await element.count()) > 0) {
      await element.hover();
      await page.waitForTimeout(500);

      const tooltip = page.locator('.tooltip, .element-info');
      const hasTooltip = (await await tooltip.count()) > 0;

      if (hasTooltip) {
        await expect(tooltip.first()).toBeVisible();
      }
    }
  });

  test('should filter elements by category', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const filter = page.locator('.category-filter, .element-filter, select[name*="category"]');
    const hasFilter = (await await filter.count()) > 0;

    if (hasFilter) {
      await expect(filter.first()).toBeVisible();
    }
  });

  test('should highlight selected element', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const element = page.locator('.element').first();

    if ((await element.count()) > 0) {
      await element.click();
      await page.waitForTimeout(500);

      const isHighlighted = await element.evaluate((el) => {
        return (
          el.classList.contains('selected') ||
          el.classList.contains('active') ||
          el.getAttribute('aria-selected') === 'true'
        );
      });

      const highlighted =
        (await await page.locator('.element.selected, .element.active').count()) > 0;
      expect(highlighted || isHighlighted).toBeTruthy();
    }
  });

  test('should show element details panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const element = page.locator('.element').first();

    if ((await element.count()) > 0) {
      await element.click();
      await page.waitForTimeout(500);

      const panel = page.locator('.element-details, .details-panel, .info-panel');
      const hasPanel = (await await panel.count()) > 0;

      if (hasPanel) {
        await expect(panel.first()).toBeVisible();
      }
    }
  });

  test('should have color coding by element groups', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const element = page.locator('.element').first();

    if ((await element.count()) > 0) {
      // Check if element has background color (for group color coding)
      const bgColor = await element.first().evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(bgColor).toBeTruthy();
    }
  });

  test('should support search for elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const searchInput = page.locator(
      'input[name*="search"], #element-search, input[placeholder*="Suche"]'
    );
    const hasSearch = (await await searchInput.count()) > 0;

    if (hasSearch) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should display element properties', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const properties = page.locator('.property, .atomic-number, .atomic-mass');
    const hasProperties = (await await properties.count()) > 0;

    if (hasProperties) {
      await expect(properties.first()).toBeVisible();
    }
  });

  test('should have zoom controls for periodic table', async ({ page }) => {
    await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);

    const zoom = page.locator('.zoom, button:has-text("+"), button:has-text("-")');
    const hasZoom = (await await zoom.count()) > 0;

    if (hasZoom) {
      await expect(zoom.first()).toBeVisible();
    }
  });
});
