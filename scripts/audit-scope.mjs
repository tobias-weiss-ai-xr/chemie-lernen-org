import { chromium } from 'playwright';

const BASE = 'https://chemie-lernen.org';

// Test which pages actually render their own content vs homepage
const testPages = [
  '/', '/ph-rechner/', '/molmasse-rechner/', '/konzentrationsumrechner/',
  '/stoechiometrie-rechner/', '/gasgesetz-rechner/', '/verbrennungsrechner/',
  '/titrations-simulator/', '/strassenszene/', '/fortschritt/',
  '/ki-assistent/', '/wissennetz/',
  '/themenbereiche/stoichiometrie/', '/themenbereiche/chemische-bindungen/',
  '/themenbereiche/saeuren-basen/', '/themenbereiche/elektrochemie/',
  '/themenbereiche/organische-chemie/', '/themenbereiche/thermodynamik/',
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
const p = await context.newPage();

const homepageH1 = 'chemie-lernen.org - interaktiv und quelloffen';

for (const url of testPages) {
  try {
    await p.goto(BASE + url, { waitUntil: 'networkidle', timeout: 15000 });
    await p.waitForTimeout(1000);
    const h1 = await p.$eval('h1', (el) => el.innerText.trim()).catch(() => '(no h1)');
    const title = await p.title();
    const status = h1 === homepageH1 ? 'BROKEN (shows homepage)' : 'OK';
    console.log(`${status.padEnd(25)} | ${url.padEnd(50)} | h1="${h1.substring(0, 60)}" | title="${title.substring(0, 60)}"`);
  } catch (err) {
    console.log(`ERROR                  | ${url.padEnd(50)} | ${err.message.substring(0, 60)}`);
  }
}

await context.close();
await browser.close();
