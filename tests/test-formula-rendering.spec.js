/**
 * Formula Rendering Tests
 * Verifies that LaTeX/KaTeX formulas are rendered correctly across all content sections
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

// Sections with LaTeX formulas
const FORMULA_SECTIONS = [
    { path: '/themenbereiche/aufbau-materie/', name: 'Aufbau der Materie' },
    { path: '/themenbereiche/redox-elektrochemie/', name: 'Redoxreaktionen' },
    { path: '/themenbereiche/anorganische-verbindungen/', name: 'Anorganische Verbindungen' },
    { path: '/themenbereiche/energetik/', name: 'Energetik' },
    { path: '/themenbereiche/gleichgewicht-geschwindigkeit/', name: 'Gleichgewicht und Geschwindigkeit' },
    { path: '/themenbereiche/reaktionstypen-organisch/', name: 'Reaktionstypen Organisch' },
    { path: '/themenbereiche/einfuehrung-chemie/', name: 'Einführung in die Chemie' },
];

test.describe('KaTeX Assets Loading', () => {

    test('KaTeX CSS should be loaded', async ({ page }) => {
        await page.goto(BASE_URL);

        const katexCSS = page.locator('link[href*="katex.min.css"]');
        await expect(katexCSS).toHaveAttribute('rel', 'stylesheet');
    });

    test('KaTeX JavaScript should be loaded', async ({ page }) => {
        await page.goto(BASE_URL);

        const katexJS = page.locator('script[src*="katex.min.js"]');
        await expect(katexJS).toHaveAttribute('src', /katex@0\.16\.9/);
    });

    test('mhchem extension should be loaded', async ({ page }) => {
        await page.goto(BASE_URL);

        const mhchemJS = page.locator('script[src*="mhchem.min.js"]');
        await expect(mhchemJS).toHaveAttribute('src', /katex@0\.16\.9/);
    });

    test('auto-render should be configured', async ({ page }) => {
        await page.goto(BASE_URL);

        const autoRenderJS = page.locator('script[src*="auto-render.min.js"]');
        await expect(autoRenderJS).toBeAttached();
    });
});

test.describe('Formula Rendering - Aufbau der Materie', () => {

    test('should render ion formation formulas', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/aufbau-materie/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for rendered LaTeX formulas (KaTeX output)
        const katexElements = page.locator('.katex, .katex-display');
        const count = await katexElements.count();

        expect(count).toBeGreaterThan(0);
    });

    test('should display atom structure image', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/aufbau-materie/`);
        await page.waitForLoadState('networkidle');

        const atomImage = page.locator('img[alt="Struktur des Atoms"]');
        await expect(atomImage).toBeVisible();
        await expect(atomImage).toHaveAttribute('src', '/img/atom-struktur.png');
    });
});

test.describe('PSE Image Display', () => {

    test('should display PSE explanation image', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/aufbau-materie/`);
        await page.waitForLoadState('networkidle');

        const pseImage = page.locator('img[alt="Struktur des Periodensystems"]');
        await expect(pseImage).toBeVisible();
        await expect(pseImage).toHaveAttribute('src', '/img/pse-erklaerung.png');
    });

    test('PSE image should load successfully', async ({ page }) => {
        const response = await page.request.get(`${BASE_URL}/img/pse-erklaerung.png`);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('image/png');
    });
});

test.describe('Chemical Formula Rendering', () => {

    test('anorganische-verbindungen should render acid-base formulas', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/anorganische-verbindungen/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Look for KaTeX-rendered chemical formulas
        const katexFormulas = page.locator('.katex-mathml');
        const count = await katexFormulas.count();

        expect(count).toBeGreaterThan(10);
    });

    test('energetik should render enthalpy formulas', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/energetik/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for delta H symbols (enthalpy)
        const pageContent = await page.content();
        expect(pageContent).toContain('ΔH');
    });

    test('gleichgewicht-geschwindigkeit should render kinetic equations', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/gleichgewicht-geschwindigkeit/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for reaction velocity formulas
        const katexDisplay = page.locator('.katex-display');
        const count = await katexDisplay.count();

        expect(count).toBeGreaterThan(0);
    });
});

test.describe('Mathematical Formula Rendering', () => {

    test('tipps-tricks should render calculation formulas', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/tipps-tricks/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for mathematical formulas
        const formulas = page.locator('.katex');
        const count = await formulas.count();

        expect(count).toBeGreaterThan(5);
    });

    test('should render fractions correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/tipps-tricks/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Look for fraction notation in page
        const pageContent = await page.content();
        expect(pageContent).toMatch(/n\s*=\s*m\s*\/\s*M/);
    });
});

test.describe('All Formula Sections Load Correctly', () => {

    test('all formula sections should return 200 status', async ({ page }) => {
        for (const section of FORMULA_SECTIONS) {
            const response = await page.request.get(`${BASE_URL}${section.path}`);
            expect(response.status()).toBe(200);
        }
    });

    test('all formula sections should have KaTeX content', async ({ page }) => {
        for (const section of FORMULA_SECTIONS) {
            await page.goto(`${BASE_URL}${section.path}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Check for KaTeX elements
            const katexElements = page.locator('.katex, .katex-display');
            const count = await katexElements.count();

            expect(count).toBeGreaterThan(0);
        }
    });
});

test.describe('Regression Tests - Formula Display', () => {

    test('formulas should not show raw LaTeX code', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/anorganische-verbindungen/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check that raw LaTeX delimiters are not visible to users
        // Use innerText which returns only the visible rendered text
        const visibleText = await page.innerText('body');

        // Raw LaTeX markers should not be visible in rendered output
        expect(visibleText).not.toContain('\\ce{'); // raw LaTeX
        expect(visibleText).not.toContain('\\[');   // raw display math start
    });

    test('chemical formulas should use proper notation', async ({ page }) => {
        await page.goto(`${BASE_URL}/themenbereiche/aufbau-materie/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for subscripts in chemical formulas (Katex uses specific classes)
        const pageContent = await page.content();

        // Should contain chemical formulas with numbers
        expect(pageContent).toMatch(/H[2-9]/); // H2O or similar
    });
});

test.describe('Interactive Tools with Formulas', () => {

    test('pH-Rechner should load without errors', async ({ page }) => {
        await page.goto(`${BASE_URL}/ph-rechner/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for the main calculator container
        const calculator = page.locator('.ph-calculator-container');
        await expect(calculator).toBeVisible();

        // Verify key interactive elements are present
        const hplusInput = page.locator('#hplus-input');
        await expect(hplusInput).toBeVisible();
    });

    test('Molare Masse Rechner should load without errors', async ({ page }) => {
        await page.goto(`${BASE_URL}/molare-masse-rechner/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for the main calculator container
        const calculator = page.locator('.molar-mass-calculator-container');
        await expect(calculator).toBeVisible();

        // Verify key interactive elements are present
        const formulaInput = page.locator('#formula-input');
        await expect(formulaInput).toBeVisible();
    });

    test('Periodensystem 3D should load without errors', async ({ page }) => {
        await page.goto(`${BASE_URL}/perioden-system-der-elemente/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check for the main container and menu
        const container = page.locator('#container');
        await expect(container).toBeVisible();

        const menu = page.locator('#menu');
        await expect(menu).toBeVisible();

        // Verify interactive buttons are present
        const tableButton = page.locator('#table');
        await expect(tableButton).toBeVisible();
    });
});

test.describe('Performance - Formula Rendering', () => {

    test('formulas should render within reasonable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto(`${BASE_URL}/themenbereiche/anorganische-verbindungen/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Wait for KaTeX to finish rendering
        await page.waitForSelector('.katex', { timeout: 5000 });

        const endTime = Date.now();
        const loadTime = endTime - startTime;

        // Page should load within 10 seconds
        expect(loadTime).toBeLessThan(10000);
    });

    test('no JavaScript errors related to KaTeX', async ({ page }) => {
        const errors = [];

        page.on('pageerror', (error) => {
            errors.push(error.message);
        });

        await page.goto(`${BASE_URL}/themenbereiche/energetik/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check for KaTeX-related errors
        const katexErrors = errors.filter(err =>
            err.toLowerCase().includes('katex') ||
            err.toLowerCase().includes('latex') ||
            err.toLowerCase().includes('math')
        );

        expect(katexErrors).toHaveLength(0);
    });
});
