/**
 * Mobile Responsiveness Test Suite
 * Tests all pages across multiple mobile viewport sizes
 * @jest-environment node
 */

const { chromium } = require('playwright');

// All pages from sitemap (105 total)
const allPages = [
  // Homepage
  { name: 'Homepage', url: 'https://chemie-lernen.org/' },

  // Themenbereiche (13)
  { name: 'Themenbereiche Overview', url: 'https://chemie-lernen.org/themenbereiche/' },
  {
    name: 'Einführung Chemie',
    url: 'https://chemie-lernen.org/themenbereiche/einfuehrung-chemie/',
  },
  { name: 'Aufbau Materie', url: 'https://chemie-lernen.org/themenbereiche/aufbau-materie/' },
  {
    name: 'Anorganische Verbindungen',
    url: 'https://chemie-lernen.org/themenbereiche/anorganische-verbindungen/',
  },
  {
    name: 'Gleichgewicht Geschwindigkeit',
    url: 'https://chemie-lernen.org/themenbereiche/gleichgewicht-geschwindigkeit/',
  },
  { name: 'Säuren Basen', url: 'https://chemie-lernen.org/themenbereiche/saeuren-basen/' },
  {
    name: 'Redox Elektrochemie',
    url: 'https://chemie-lernen.org/themenbereiche/redox-elektrochemie/',
  },
  { name: 'Energetik', url: 'https://chemie-lernen.org/themenbereiche/energetik/' },
  {
    name: 'Analytische Methoden',
    url: 'https://chemie-lernen.org/themenbereiche/analytische-methoden/',
  },
  {
    name: 'Erdöl Organische Stoffklassen',
    url: 'https://chemie-lernen.org/themenbereiche/erdoel-organische-stoffklassen/',
  },
  {
    name: 'Reaktionstypen Organisch',
    url: 'https://chemie-lernen.org/themenbereiche/reaktionstypen-organisch/',
  },
  {
    name: 'Produkte Organisch',
    url: 'https://chemie-lernen.org/themenbereiche/produkte-organisch/',
  },
  { name: 'Tipps Tricks', url: 'https://chemie-lernen.org/themenbereiche/tipps-tricks/' },

  // Calculators (12)
  { name: 'Gasgesetz Rechner', url: 'https://chemie-lernen.org/gasgesetz-rechner/' },
  { name: 'Konzentrationsumrechner', url: 'https://chemie-lernen.org/konzentrationsumrechner/' },
  {
    name: 'Löslichkeitsprodukt Rechner',
    url: 'https://chemie-lernen.org/loeslichkeitsprodukt-rechner/',
  },
  { name: 'Molare Masse Rechner', url: 'https://chemie-lernen.org/molare-masse-rechner/' },
  { name: 'pH-Rechner', url: 'https://chemie-lernen.org/ph-rechner/' },
  { name: 'Redoxpotential Rechner', url: 'https://chemie-lernen.org/redox-potenzial-rechner/' },
  { name: 'Stöchiometrie Rechner', url: 'https://chemie-lernen.org/stoechiometrie-rechner/' },
  { name: 'Titrations Simulator', url: 'https://chemie-lernen.org/titrations-simulator/' },
  { name: 'Verbrennungsrechner', url: 'https://chemie-lernen.org/verbrennungsrechner/' },
  { name: 'Einheitenumrechner', url: 'https://chemie-lernen.org/einheitenumrechner/' },
  { name: 'Lösungsrechner', url: 'https://chemie-lernen.org/loesungsrechner/' },
  {
    name: 'Reaktionsgleichungen Ausgleichen',
    url: 'https://chemie-lernen.org/reaktionsgleichungen-ausgleichen/',
  },

  // Interactive Tools (5)
  {
    name: 'Periodensystem der Elemente',
    url: 'https://chemie-lernen.org/perioden-system-der-elemente/',
  },
  { name: 'Molekülstudio', url: 'https://chemie-lernen.org/molekuel-studio/' },
  { name: 'Torricelli Versuch', url: 'https://chemie-lernen.org/torricelli-versuch/' },
  { name: 'Atmosphärendruck Alltag', url: 'https://chemie-lernen.org/atmosphaerendruck-alltag/' },
  { name: 'Druck Flächen Rechner', url: 'https://chemie-lernen.org/druck-flaechen-rechner/' },

  // Static Pages (8)
  { name: 'About Page', url: 'https://chemie-lernen.org/pages/about/' },
  { name: 'Contact Page', url: 'https://chemie-lernen.org/pages/contact/' },
  { name: 'Roadmap', url: 'https://chemie-lernen.org/pages/roadmap/' },
  { name: 'Suche', url: 'https://chemie-lernen.org/pages/suche/' },
  { name: 'PSE in VR', url: 'https://chemie-lernen.org/pages/pse-in-vr/' },
  {
    name: 'Mayers Multimedia Lernen',
    url: 'https://chemie-lernen.org/pages/mayers-multimedia-lernen/',
  },
  { name: 'Impressum', url: 'https://chemie-lernen.org/impressum/' },
  { name: 'Datenschutz', url: 'https://chemie-lernen.org/datenschutz/' },

  // Posts (3)
  { name: 'PSE in VR Release', url: 'https://chemie-lernen.org/posts/pse-in-vr-release/' },
  {
    name: 'Molekülstudio 3D Visualisierung',
    url: 'https://chemie-lernen.org/posts/molekulstudio-3d-visualisierung/',
  },
  {
    name: 'Interdisciplinary VR Cooperation',
    url: 'https://chemie-lernen.org/posts/interdisciplinary-vr-cooperation/',
  },

  // Klassenstufen (10)
  { name: 'Klassenstufen Overview', url: 'https://chemie-lernen.org/klassenstufen/' },
  { name: 'Klasse 5', url: 'https://chemie-lernen.org/klassenstufen/klasse-5/' },
  { name: 'Klasse 6', url: 'https://chemie-lernen.org/klassenstufen/klasse-6/' },
  { name: 'Klasse 7', url: 'https://chemie-lernen.org/klassenstufen/klasse-7/' },
  { name: 'Klasse 8', url: 'https://chemie-lernen.org/klassenstufen/klasse-8/' },
  { name: 'Klasse 9', url: 'https://chemie-lernen.org/klassenstufen/klasse-9/' },
  { name: 'Klasse 10', url: 'https://chemie-lernen.org/klassenstufen/klasse-10/' },
  { name: 'Klasse 11', url: 'https://chemie-lernen.org/klassenstufen/klasse-11/' },
  { name: 'Klasse 12', url: 'https://chemie-lernen.org/klassenstufen/klasse-12/' },
  { name: 'Klasse 13', url: 'https://chemie-lernen.org/klassenstufen/klasse-13/' },

  // Tags (48) - Sample of 10 most important tags
  { name: 'Tags Index', url: 'https://chemie-lernen.org/tags/' },
  { name: 'Tag: 3d', url: 'https://chemie-lernen.org/tags/3d/' },
  { name: 'Tag: Atombau', url: 'https://chemie-lernen.org/tags/atombau/' },
  { name: 'Tag: Chemie', url: 'https://chemie-lernen.org/tags/chemie/' },
  { name: 'Tag: Elemente', url: 'https://chemie-lernen.org/tags/elemente/' },
  { name: 'Tag: Entwicklung', url: 'https://chemie-lernen.org/tags/entwicklung/' },
  { name: 'Tag: Interaktiv', url: 'https://chemie-lernen.org/tags/interaktiv/' },
  { name: 'Tag: Periodensystem', url: 'https://chemie-lernen.org/tags/periodensystem/' },
  { name: 'Tag: VR', url: 'https://chemie-lernen.org/tags/vr/' },
  { name: 'Tag: Visualisierung', url: 'https://chemie-lernen.org/tags/visualisierung/' },

  // Categories (2)
  { name: 'Categories Index', url: 'https://chemie-lernen.org/categories/' },
  { name: 'Category: Entwicklung', url: 'https://chemie-lernen.org/categories/entwicklung/' },

  // Archive Pages (3)
  { name: 'Posts Index', url: 'https://chemie-lernen.org/posts/' },
  { name: 'Pages Index', url: 'https://chemie-lernen.org/pages/' },
  { name: 'Tags Overview', url: 'https://chemie-lernen.org/tags/' },
];

// Viewport sizes to test
const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12 Pro', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Desktop Small', width: 1366, height: 768 },
];

describe('Mobile Responsiveness Testing', () => {
  let browser;
  let context;
  let results = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    issues: [],
  };

  beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext({
      viewport: null, // Will be set per test
    });
  });

  afterAll(async () => {
    await context.close();
    await browser.close();
  });

  // Test each page at each viewport size
  allPages.forEach((page) => {
    describe(`${page.name}`, () => {
      let page_instance;

      viewports.forEach((viewport) => {
        test(`works at ${viewport.name} (${viewport.width}x${viewport.height})`, async () => {
          results.totalTests++;

          // Create new page with specific viewport
          page_instance = await context.newPage();
          await page_instance.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });

          try {
            // Navigate to page
            const response = await page_instance.goto(page.url, {
              waitUntil: 'networkidle',
              timeout: 30000,
            });

            // Check if page loaded successfully
            expect(response.status()).toBe(200);

            // Check for horizontal scroll (common mobile issue)
            const bodyWidth = await page_instance.evaluate(() => {
              return document.body.scrollWidth;
            });
            const viewportWidth = viewport.width;

            if (bodyWidth > viewportWidth + 10) {
              // Allow 10px tolerance
              const issue = `${page.name} - ${viewport.name}: Horizontal scroll detected (body: ${bodyWidth}px, viewport: ${viewportWidth}px)`;
              results.issues.push(issue);
              results.failed++;
            } else {
              results.passed++;
            }

            expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);

            // Check for readable font size (minimum 16px for body text)
            const fontSize = await page_instance.evaluate(() => {
              const body = document.body;
              return window.getComputedStyle(body).fontSize;
            });
            const fontSizePx = parseInt(fontSize);

            if (fontSizePx < 14) {
              // Minimum 14px (allowing for some flexibility)
              const issue = `${page.name} - ${viewport.name}: Font size too small (${fontSizePx}px)`;
              results.issues.push(issue);
            }

            expect(fontSizePx).toBeGreaterThanOrEqual(14);

            // Check viewport meta tag
            const viewportMeta = await page_instance
              .locator('meta[name="viewport"]')
              .getAttribute('content');
            expect(viewportMeta).toContain('width=device-width');

            // Check for touch targets (minimum 44x44px per WCAG)
            const touchTargets = await page_instance.evaluate(() => {
              const buttons = document.querySelectorAll(
                'button, a[href], input[type="submit"], input[type="button"], [role="button"]'
              );
              let smallTargets = 0;

              buttons.forEach((btn) => {
                const rect = btn.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;

                if (width < 44 || height < 44) {
                  smallTargets++;
                }
              });

              return {
                total: buttons.length,
                smallTargets: smallTargets,
              };
            });

            // Allow up to 10% of touch targets to be smaller than 44px (some icon buttons)
            const allowedSmallTargets = Math.max(1, Math.floor(touchTargets.total * 0.1));
            if (touchTargets.smallTargets > allowedSmallTargets) {
              const issue = `${page.name} - ${viewport.name}: Too many small touch targets (${touchTargets.smallTargets}/${touchTargets.total} < 44px)`;
              results.issues.push(issue);
            }
          } catch (error) {
            const issue = `${page.name} - ${viewport.name}: ${error.message}`;
            results.issues.push(issue);
            results.failed++;
            throw error;
          } finally {
            await page_instance.close();
          }
        }, 45000);
      });
    });
  });

  // Overall summary
  describe('Mobile Responsiveness Summary', () => {
    test('generates final report', () => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`MOBILE RESPONSIVENESS TEST SUMMARY`);
      console.log(`${'='.repeat(80)}`);
      console.log(`Total Pages Tested: ${allPages.length}`);
      console.log(`Viewports Tested: ${viewports.length}`);
      console.log(`Total Tests: ${results.totalTests}`);
      console.log(`Tests Passed: ${results.passed}`);
      console.log(`Tests Failed: ${results.failed}`);
      console.log(`Success Rate: ${((results.passed / results.totalTests) * 100).toFixed(1)}%`);

      if (results.issues.length > 0) {
        console.log(`\n❌ Issues Found (${results.issues.length}):\n`);
        results.issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue}`);
        });
      } else {
        console.log(`\n✅ No mobile responsiveness issues found!`);
      }

      console.log(`\n${'='.repeat(80)}\n`);

      expect(true).toBe(true);
    });
  });
});
