import { chromium } from 'playwright';

const BASE = 'https://chemie-lernen.org';
const pages = [
  { url: '/themenbereiche/stoichiometrie/', name: 'stoichiometrie' },
  { url: '/themenbereiche/chemische-bindungen/', name: 'bindungen' },
  { url: '/molmasse-rechner/', name: 'molmasse' },
  { url: '/strassenszene/', name: 'strassenszene' },
  { url: '/fortschritt/', name: 'fortschritt' },
  { url: '/ki-assistent/', name: 'ki-assistent' },
  { url: '/wissennetz/', name: 'wissennetz' },
  { url: '/', name: 'homepage' },
];

const browser = await chromium.launch({ headless: true });

for (const page of pages) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    locale: 'de-DE',
  });
  const p = await context.newPage();

  try {
    await p.goto(BASE + page.url, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(2000);

    // Get page title
    const title = await p.title();
    console.log(`\n=== ${page.name} (${page.url}) ===`);
    console.log(`  Title: "${title}"`);

    // Check if <h1> exists and what it says
    const h1 = await p.$eval('h1', (el) => el.innerText.trim()).catch(() => '(no h1)');
    console.log(`  H1: "${h1}"`);

    // Get all headings
    const headings = await p.$$eval('h1, h2, h3', (els) =>
      els.map((el) => `${el.tagName}: ${el.innerText.trim().substring(0, 80)}`)
    );
    console.log(`  Headings: ${headings.join(' | ')}`);

    // Check what the main/article content actually contains (first 600 chars)
    const mainHtml = await p
      .$eval('main, article, .content, #content', (el) => {
        return el.innerHTML.substring(0, 1000);
      })
      .catch(() => '(no main element found)');
    console.log(`  Main HTML (first 1000 chars): ${mainHtml.substring(0, 400)}`);

    // Check for 404 indicators
    const pageText = await p.$eval('body', (el) => el.innerText);
    const is404 =
      pageText.toLowerCase().includes('404') ||
      pageText.toLowerCase().includes('seite nicht gefunden') ||
      pageText.toLowerCase().includes('page not found');
    console.log(`  Is 404: ${is404}`);

    // Check if the page is just showing the homepage (same title as homepage?)
    const navLinks = await p.$$eval('nav a, header a', (els) =>
      els
        .slice(0, 20)
        .map((el) => ({
          text: el.innerText.trim().substring(0, 30),
          href: el.getAttribute('href'),
        }))
    );
    const hasOwnNav = navLinks.some((l) => l.href && l.href.includes(page.url.replace(/\/$/, '')));
    console.log(
      `  Navigation links: ${navLinks
        .slice(0, 5)
        .map((l) => `${l.text}(${l.href})`)
        .join(', ')}`
    );
    console.log(`  Has own nav link: ${hasOwnNav}`);

    // For themenbereiche, check if there's actual educational content
    if (page.name.includes('stoichiometrie') || page.name.includes('bindungen')) {
      const contentSections = await p.$$eval('main p, main .card, main section', (els) =>
        els.map((el) => ({
          tag: el.tagName,
          text: el.innerText.trim().substring(0, 120),
          children: el.children.length,
        }))
      );
      console.log(`  Content sections (${contentSections.length}):`);
      contentSections
        .slice(0, 5)
        .forEach((s) =>
          console.log(`    <${s.tag}> (${s.children}ch) "${s.text.substring(0, 80)}"`)
        );
    }

    // Check the actual page URL (redirects?)
    const finalUrl = p.url();
    console.log(`  Final URL: ${finalUrl}`);

    // Check if pagefind search element exists
    const pagefindEl = await p.$('[id*="search"], [class*="search"], [class*="pagefind"]');
    console.log(`  Pagefind search element: ${!!pagefindEl}`);

    // For fortschritt, get more detail on the error
    if (page.name === 'fortschritt') {
      const scripts = await p.$$eval('script', (els) =>
        els.map((el) => ({
          src: el.src || '(inline)',
          hasGamification: el.textContent.includes('GamificationEngine'),
          textSnippet: el.textContent.substring(0, 200),
        }))
      );
      const gamScripts = scripts.filter((s) => s.hasGamification);
      console.log(`  GamificationEngine scripts: ${gamScripts.length}`);
      gamScripts.forEach((s) =>
        console.log(`    src: ${s.src}, snippet: ${s.textSnippet.substring(0, 100)}`)
      );
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
  }

  await context.close();
}

await browser.close();
console.log('\n=== DEEP AUDIT COMPLETE ===');
