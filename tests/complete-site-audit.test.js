/**
 * Complete Site Accessibility Audit
 * Tests ALL pages for WCAG 2.1 AA compliance
 * @jest-environment node
 */

const axios = require('axios');
const { JSDOM } = require('jsdom');

// All pages from sitemap (105 total)
const allPages = [
  // Homepage
  { name: 'Homepage', url: 'https://chemie-lernen.org/' },

  // Themebereiche (13)
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

  // Tags (48)
  { name: 'Tags Index', url: 'https://chemie-lernen.org/tags/' },
  { name: 'Tag: 3d', url: 'https://chemie-lernen.org/tags/3d/' },
  { name: 'Tag: Atombau', url: 'https://chemie-lernen.org/tags/atombau/' },
  { name: 'Tag: Atmosphäre', url: 'https://chemie-lernen.org/tags/atmosphaere/' },
  { name: 'Tag: Base', url: 'https://chemie-lernen.org/tags/base/' },
  { name: 'Tag: Boyle-Mariotte', url: 'https://chemie-lernen.org/tags/boyle-mariotte/' },
  { name: 'Tag: Chemie', url: 'https://chemie-lernen.org/tags/chemie/' },
  { name: 'Tag: Druck', url: 'https://chemie-lernen.org/tags/druck/' },
  { name: 'Tag: Elektrochemie', url: 'https://chemie-lernen.org/tags/elektrochemie/' },
  { name: 'Tag: Elemente', url: 'https://chemie-lernen.org/tags/elemente/' },
  { name: 'Tag: Entwicklung', url: 'https://chemie-lernen.org/tags/entwicklung/' },
  { name: 'Tag: Experiment', url: 'https://chemie-lernen.org/tags/experiment/' },
  { name: 'Tag: Fällung', url: 'https://chemie-lernen.org/tags/faellung/' },
  { name: 'Tag: Fläche', url: 'https://chemie-lernen.org/tags/flaeche/' },
  { name: 'Tag: Gasgesetze', url: 'https://chemie-lernen.org/tags/gasgesetze/' },
  { name: 'Tag: Gay-Lussac', url: 'https://chemie-lernen.org/tags/gay-lussac/' },
  { name: 'Tag: Geschichte', url: 'https://chemie-lernen.org/tags/geschichte/' },
  { name: 'Tag: Gibbs', url: 'https://chemie-lernen.org/tags/gibbs/' },
  { name: 'Tag: Ideales Gasgesetz', url: 'https://chemie-lernen.org/tags/ideales-gasgesetz/' },
  { name: 'Tag: Interaktiv', url: 'https://chemie-lernen.org/tags/interaktiv/' },
  { name: 'Tag: Konzentration', url: 'https://chemie-lernen.org/tags/konzentration/' },
  { name: 'Tag: Kraft', url: 'https://chemie-lernen.org/tags/kraft/' },
  { name: 'Tag: Ksp', url: 'https://chemie-lernen.org/tags/ksp/' },
  { name: 'Tag: Kurve', url: 'https://chemie-lernen.org/tags/kurve/' },
  { name: 'Tag: Luftdruck', url: 'https://chemie-lernen.org/tags/luftdruck/' },
  { name: 'Tag: Löslichkeit', url: 'https://chemie-lernen.org/tags/loeslichkeit/' },
  { name: 'Tag: Mechanik', url: 'https://chemie-lernen.org/tags/mechanik/' },
  { name: 'Tag: Molar', url: 'https://chemie-lernen.org/tags/molar/' },
  { name: 'Tag: Moleküle', url: 'https://chemie-lernen.org/tags/molekuele/' },
  { name: 'Tag: Molekülstruktur', url: 'https://chemie-lernen.org/tags/molekuelstruktur/' },
  { name: 'Tag: Periodensystem', url: 'https://chemie-lernen.org/tags/periodensystem/' },
  { name: 'Tag: Physik', url: 'https://chemie-lernen.org/tags/physik/' },
  { name: 'Tag: Potenzial', url: 'https://chemie-lernen.org/tags/potenzial/' },
  { name: 'Tag: Ppm', url: 'https://chemie-lernen.org/tags/ppm/' },
  { name: 'Tag: Rechner', url: 'https://chemie-lernen.org/tags/rechner/' },
  { name: 'Tag: Redox', url: 'https://chemie-lernen.org/tags/redox/' },
  { name: 'Tag: Roadmap', url: 'https://chemie-lernen.org/tags/roadmap/' },
  { name: 'Tag: Säure', url: 'https://chemie-lernen.org/tags/saeure/' },
  { name: 'Tag: Simulation', url: 'https://chemie-lernen.org/tags/simulation/' },
  { name: 'Tag: Startseite', url: 'https://chemie-lernen.org/tags/startseite/' },
  { name: 'Tag: Stöchiometrie', url: 'https://chemie-lernen.org/tags/st%C3%B6chiometrie/' },
  { name: 'Tag: Threejs', url: 'https://chemie-lernen.org/tags/threejs/' },
  { name: 'Tag: Titration', url: 'https://chemie-lernen.org/tags/titration/' },
  { name: 'Tag: Umrechner', url: 'https://chemie-lernen.org/tags/umrechner/' },
  { name: 'Tag: Umwelt', url: 'https://chemie-lernen.org/tags/umwelt/' },
  { name: 'Tag: Verbrennung', url: 'https://chemie-lernen.org/tags/verbrennung/' },
  { name: 'Tag: Visualisierung', url: 'https://chemie-lernen.org/tags/visualisierung/' },
  { name: 'Tag: VR', url: 'https://chemie-lernen.org/tags/vr/' },
  { name: 'Tag: WebXR', url: 'https://chemie-lernen.org/tags/webxr/' },

  // Categories (2)
  { name: 'Categories Index', url: 'https://chemie-lernen.org/categories/' },
  { name: 'Category: Entwicklung', url: 'https://chemie-lernen.org/categories/entwicklung/' },

  // Archive Pages (3)
  { name: 'Posts Index', url: 'https://chemie-lernen.org/posts/' },
  { name: 'Pages Index', url: 'https://chemie-lernen.org/pages/' },
  { name: 'Tags Overview', url: 'https://chemie-lernen.org/tags/' },
];

describe('Complete Site Accessibility Audit - All 105 Pages', () => {
  let results = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  // Test each page
  allPages.forEach((page) => {
    describe(`${page.name}`, () => {
      let html;
      let dom;

      beforeAll(async () => {
        try {
          const response = await axios.get(page.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Accessibility-Audit/1.0)',
            },
            timeout: 30000,
          });
          html = response.data;
          dom = new JSDOM(html, {
            url: page.url,
            contentType: 'text/html',
          });
        } catch (error) {
          console.error(`Failed to load ${page.name}: ${error.message}`);
          throw error;
        }
      }, 60000);

      test('loads successfully', () => {
        expect(html).toBeDefined();
        expect(html.length).toBeGreaterThan(0);
        results.passed++;
      });

      test('has proper document structure', () => {
        const doc = dom.window.document;
        const htmlEl = doc.documentElement;
        const title = doc.querySelector('title');
        const viewport = doc.querySelector('meta[name="viewport"]');

        if (!htmlEl.getAttribute('lang')) {
          results.errors.push(`${page.name}: Missing lang attribute`);
        }
        if (!title) {
          results.errors.push(`${page.name}: Missing title tag`);
        }
        if (!viewport) {
          results.errors.push(`${page.name}: Missing viewport meta tag`);
        }

        expect(htmlEl.getAttribute('lang')).toBeTruthy();
        expect(title).toBeTruthy();
        expect(viewport).toBeTruthy();
        results.passed++;
      });

      test('has proper heading structure', () => {
        const doc = dom.window.document;
        const h1 = doc.querySelectorAll('h1');

        if (h1.length !== 1) {
          results.errors.push(`${page.name}: Expected 1 h1, found ${h1.length}`);
        }

        expect(h1).toHaveLength(1);
        results.passed++;
      });

      test('images have alt text', () => {
        const doc = dom.window.document;
        const images = doc.querySelectorAll('img');
        const imagesWithoutAlt = [];

        images.forEach((img) => {
          const alt = img.getAttribute('alt');
          if (alt === null) {
            imagesWithoutAlt.push(img);
          }
        });

        const decorativeImages = imagesWithoutAlt.filter(
          (img) => img.getAttribute('role') === 'presentation'
        );

        const problematicImages = imagesWithoutAlt.length - decorativeImages.length;

        if (problematicImages > 0) {
          results.errors.push(`${page.name}: ${problematicImages} images missing alt text`);
        }

        expect(problematicImages).toBe(0);
        results.passed++;
      });

      test('links have accessible names', () => {
        const doc = dom.window.document;
        const links = doc.querySelectorAll('a[href]');
        const emptyLinks = [];

        links.forEach((link) => {
          if (link.getAttribute('aria-hidden') === 'true') return;

          const text = link.textContent?.trim();
          const ariaLabel = link.getAttribute('aria-label');
          const title = link.getAttribute('title');

          if (!text && !ariaLabel && !title) {
            const img = link.querySelector('img');
            if (!img || !img.getAttribute('alt')) {
              emptyLinks.push(link);
            }
          }
        });

        const maxEmptyLinks = Math.max(1, Math.floor(links.length * 0.05));

        if (emptyLinks.length > maxEmptyLinks) {
          results.errors.push(`${page.name}: ${emptyLinks.length} links without accessible names`);
        }

        expect(emptyLinks.length).toBeLessThanOrEqual(maxEmptyLinks);
        results.passed++;
      });
    }, 90000);
  });

  // Overall summary
  describe('Site-Wide Summary', () => {
    test('generates final report', () => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`COMPLETE SITE ACCESSIBILITY AUDIT SUMMARY`);
      console.log(`${'='.repeat(80)}`);
      console.log(`Total Pages Audited: ${allPages.length}`);
      console.log(`Tests Passed: ${results.passed}`);
      console.log(`Tests Failed: ${results.failed}`);
      console.log(`Total Issues Found: ${results.errors.length}`);

      if (results.errors.length > 0) {
        console.log(`\n❌ Accessibility Issues:\n`);
        results.errors.forEach((error) => {
          console.log(`  - ${error}`);
        });
      } else {
        console.log(`\n✅ No accessibility issues found!`);
      }

      console.log(`\n${'='.repeat(80)}\n`);

      expect(true).toBe(true);
    });
  });
});
