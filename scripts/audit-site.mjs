import { chromium } from 'playwright';

const BASE = 'https://chemie-lernen.org';
const OUT = '/tmp/audit-screenshots';

const pages = [
  { url: '/', name: 'homepage', label: 'Homepage' },
  { url: '/wissennetz/', name: 'wissennetz', label: 'Knowledge Graph (Wissennetz)' },
  { url: '/ki-assistent/', name: 'ki-assistent', label: 'KI-Assistent' },
  { url: '/fortschritt/', name: 'fortschritt', label: 'Progress Dashboard' },
  { url: '/strassenszene/', name: 'strassenszene', label: 'Roadmap (Strassenszene)' },
  { url: '/ph-rechner/', name: 'ph-rechner', label: 'pH-Rechner Calculator' },
  { url: '/molmasse-rechner/', name: 'molmasse-rechner', label: 'Molmasse Calculator' },
  {
    url: '/themenbereiche/stoichiometrie/',
    name: 'themenbereiche-stoichiometrie',
    label: 'Themenbereich: Stoichiometrie',
  },
  {
    url: '/themenbereiche/chemische-bindungen/',
    name: 'themenbereiche-bindungen',
    label: 'Themenbereich: Bindungen',
  },
  { url: '/titrations-simulator/', name: 'titrations-simulator', label: 'Titrations Simulator' },
];

const browser = await chromium.launch({ headless: true });

for (const page of pages) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    locale: 'de-DE',
  });
  const p = await context.newPage();

  const consoleLogs = [];
  p.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    }
  });

  const networkErrors = [];
  p.on('requestfailed', (req) => {
    networkErrors.push({ url: req.url(), error: req.failure()?.errorText });
  });

  try {
    console.log(`\n=== AUDITING: ${page.label} (${page.url}) ===`);
    const response = await p.goto(BASE + page.url, { waitUntil: 'networkidle', timeout: 30000 });

    if (response) {
      console.log(`  Status: ${response.status()} ${response.statusText()}`);
    } else {
      console.log(`  Status: NO RESPONSE`);
    }

    await p.waitForTimeout(2500);

    await p.screenshot({ path: `${OUT}/${page.name}-desktop.png`, fullPage: true });
    console.log(`  Screenshot saved`);

    // Broken images
    const images = await p.$$eval('img', (imgs) =>
      imgs.map((img) => ({
        src: (img.src || img.getAttribute('data-src') || '(empty)').substring(0, 120),
        alt: (img.alt || '(no alt)').substring(0, 50),
        naturalWidth: img.naturalWidth,
        broken: img.naturalWidth === 0 || !img.complete || img.naturalWidth === undefined,
      }))
    );
    const brokenImages = images.filter((i) => i.broken);
    console.log(`  Images: ${images.length} total, ${brokenImages.length} broken`);
    if (brokenImages.length > 0) {
      brokenImages.forEach((i) => console.log(`    BROKEN: ${i.src}`));
    }

    // Placeholder text
    const bodyText = await p.$eval('body', (el) => el.innerText);
    const placeholderPatterns = [
      /lorem ipsum/i,
      /placeholder/i,
      /coming soon/i,
      /in bearbeitung/i,
      /under construction/i,
      /dummy/i,
      /beispiel.*text/i,
      /TODO/i,
      /FIXME/i,
      /wird bald.*hinzugefügt/i,
      /no content available/i,
      /inhalt folgt/i,
      /dieser bereich wird/i,
      /noch nicht verfügbar/i,
    ];
    const foundPlaceholders = placeholderPatterns
      .map((pat) => ({ pattern: pat.source, matches: bodyText.match(new RegExp(pat, 'g')) }))
      .filter((r) => r.matches && r.matches.length > 0);
    if (foundPlaceholders.length > 0) {
      console.log(`  PLACEHOLDER TEXT FOUND:`);
      foundPlaceholders.forEach((r) =>
        console.log(`    Pattern "${r.pattern}": ${r.matches.length} matches`)
      );
    }

    // Main content size
    const mainContent = await p
      .$eval('main, .content, article, #content', (el) => ({
        textLength: el.innerText.trim().length,
        childCount: el.children.length,
      }))
      .catch(() => ({ textLength: 0, childCount: 0, error: 'no main element' }));
    console.log(
      `  Main content: ${mainContent.textLength} chars, ${mainContent.childCount} children ${mainContent.error ? `(${mainContent.error})` : ''}`
    );

    // Empty visible sections
    const emptySections = await p.$$eval(
      'section, .card, .container, div[class*="section"], div[class*="card"]',
      (els) =>
        els
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            const text = el.innerText.trim();
            const hasImages = el.querySelectorAll('img').length > 0;
            const hasInteractive = el.querySelectorAll('input, button, canvas, svg').length > 0;
            return text.length < 10 && !hasImages && !hasInteractive && rect.height > 50;
          })
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            class: el.className.substring(0, 100),
            text: el.innerText.trim().substring(0, 50),
            height: Math.round(el.getBoundingClientRect().height),
          }))
          .slice(0, 5)
    );
    if (emptySections.length > 0) {
      console.log(`  EMPTY VISIBLE SECTIONS (${emptySections.length}):`);
      emptySections.forEach((s) =>
        console.log(`    <${s.tag} class="${s.class}"> h=${s.height}px text="${s.text}"`)
      );
    }

    // Stuck loaders
    const spinners = await p.$$eval(
      '[class*="loading"], [class*="spinner"], [class*="skeleton"]',
      (els) =>
        els
          .filter((el) => el.getBoundingClientRect().height > 0)
          .map((el) => el.className.substring(0, 80))
    );
    if (spinners.length > 0) {
      console.log(`  STUCK LOADING INDICATORS (${spinners.length}):`);
      spinners.forEach((s) => console.log(`    "${s}"`));
    }

    // Page-specific checks
    if (page.name === 'wissennetz') {
      const svgOrCanvas = await p.$('svg');
      const d3Nodes = await p.$$eval('.node, circle, .graph-node', (els) => els.length);
      const searchInput = await p.$(
        'input[type="search"], input[placeholder*="Such"], input[placeholder*="search"], input'
      );
      const filters = await p.$$eval('[class*="filter"], [class*="category"]', (els) =>
        els.slice(0, 10).map((el) => el.innerText.trim().substring(0, 50))
      );
      console.log(`  [Wissennetz] SVG present: ${!!svgOrCanvas}`);
      console.log(`  [Wissennetz] Graph nodes: ${d3Nodes}`);
      console.log(`  [Wissennetz] Search input: ${!!searchInput}`);
      console.log(`  [Wissennetz] Filters: ${filters.join(', ') || 'none'}`);
    }

    if (page.name === 'ki-assistent') {
      const chatInput = await p.$('input[type="text"], textarea, [contenteditable]');
      const sendButton = await p.$('button');
      const chatMessages = await p.$$eval(
        '[class*="chat"], [class*="message"], [class*="response"]',
        (els) => ({
          count: els.length,
          texts: els.slice(0, 3).map((el) => el.innerText.trim().substring(0, 80)),
        })
      );
      console.log(`  [KI] Chat input: ${!!chatInput}`);
      console.log(`  [KI] Send button: ${!!sendButton}`);
      console.log(`  [KI] Messages: ${JSON.stringify(chatMessages)}`);
    }

    if (page.name === 'fortschritt') {
      const progressBars = await p.$$eval(
        '[class*="progress"], [role="progressbar"]',
        (els) => els.length
      );
      const charts = await p.$$eval('canvas, svg', (els) => els.length);
      const snippet = bodyText.substring(0, 300);
      console.log(`  [Fortschritt] Progress bars: ${progressBars}`);
      console.log(`  [Fortschritt] Charts: ${charts}`);
      console.log(`  [Fortschritt] Body start: "${snippet.substring(0, 200)}"`);
    }

    if (page.name === 'strassenszene') {
      const roadmapItems = await p.$$eval(
        '[class*="roadmap"], [class*="stage"], [class*="milestone"], [class*="phase"]',
        (els) => els.length
      );
      const listItems = await p.$$eval('li', (els) => els.length);
      const svgs = await p.$$eval('svg', (els) => els.length);
      console.log(
        `  [Strassenszene] Roadmap elements: ${roadmapItems}, list items: ${listItems}, SVGs: ${svgs}`
      );
    }

    if (page.name.includes('rechner') || page.name.includes('simulator')) {
      const inputs = await p.$$eval('input, select', (els) => els.length);
      const outputs = await p.$$eval('[class*="result"], [class*="output"]', (els) => els.length);
      console.log(`  [Calculator] Inputs: ${inputs}, Output elements: ${outputs}`);
    }

    // Console errors
    if (consoleLogs.length > 0) {
      console.log(`  CONSOLE ERRORS/WARNINGS (${consoleLogs.length}):`);
      consoleLogs
        .slice(0, 10)
        .forEach((log) => console.log(`    [${log.type}] ${log.text.substring(0, 150)}`));
    }

    // Network errors
    if (networkErrors.length > 0) {
      console.log(`  NETWORK ERRORS (${networkErrors.length}):`);
      networkErrors.forEach((err) =>
        console.log(`    ${err.url.substring(0, 80)} -> ${err.error}`)
      );
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    await p.screenshot({ path: `${OUT}/${page.name}-error.png` }).catch(() => {});
  }

  await context.close();
}

await browser.close();
console.log('\n=== AUDIT COMPLETE ===');
