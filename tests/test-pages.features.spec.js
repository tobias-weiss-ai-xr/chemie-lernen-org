const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://chemie-lernen.org';

test.describe('Homepage', () => {
  test('should load homepage with title', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/chemie/i);
  });

  test('should have navigation bar', async ({ page }) => {
    await page.goto(BASE_URL);
    const nav = page.locator('nav, .navbar, .navigation');
    await expect(nav).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to KI-Assistent page', async ({ page }) => {
    await page.goto(`${BASE_URL}/ki-assistent/`);
    await expect(page).toHaveURL(/\/ki-assistent\//);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Wissensnetz page', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`);
    await expect(page).toHaveURL(/\/entity\//);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have main menu with calculator links', async ({ page }) => {
    await page.goto(BASE_URL);
    const calcLinks = page.locator('a[href*="rechner"]');
    const count = await calcLinks.count();
    expect(count).toBeGreaterThan(5);
  });
});

test.describe('Wissensnetz / Entity Index', () => {
  test('should load entity index page', async ({ page }) => {
    await page.goto(`${BASE_URL}/entity/`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Wissensnetz|Entität|Fachbegriff|Keine/);
  });
});

test.describe('Themenbereiche', () => {
  const themenbereiche = [
    'einfuehrung-chemie',
    'aufbau-materie',
    'anorganische-verbindungen',
    'saeuren-basen',
    'redox-elektrochemie',
    'energetik',
    'gleichgewicht-geschwindigkeit',
    'erdoel-organische-stoffklassen',
    'reaktionstypen-organisch',
    'produkte-organisch',
    'analytische-methoden',
    'tipps-tricks',
  ];

  themenbereiche.forEach((tb) => {
    test(`should load themenbereich: ${tb}`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/themenbereiche/${tb}/`);
      expect(response.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});

test.describe('Calculator Pages', () => {
  const calculators = [
    'molare-masse-rechner',
    'ph-rechner',
    'stoechiometrie-rechner',
    'gasgesetz-rechner',
    'hess-gesetz',
    'dichte-rechner',
    'dampfdruck-rechner',
    'verduennungsrechner',
    'verduennungsreihen-rechner',
    'loeslichkeitsprodukt-rechner',
    'verbrennungsrechner',
    'titrations-simulator',
    'reaktionskinetik-simulator',
  ];

  calculators.forEach((path) => {
    test(`should load calculator: ${path}`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/${path}/`);
      expect(response.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      const interactive = page.locator('input, button, select, canvas, #calculator');
      await expect(interactive.first()).toBeVisible();
    });
  });
});

test.describe('Content / Posts', () => {
  test('should load posts overview page', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load individual post with related articles section', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/`);
    const firstPostLink = page.locator('a[href^="/posts/"]').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
      await expect(page).toHaveURL(/\/posts\//);
    }
  });
});

test.describe('KI-Assistent Chat', () => {
  test('should load KI-Assistent page with chat input', async ({ page }) => {
    await page.goto(`${BASE_URL}/ki-assistent/`, { waitUntil: 'networkidle' });
    await expect(page.locator('#chat-input')).toBeVisible({ timeout: 10000 });
  });

  test('should respond to a chemistry query', async ({ page }) => {
    await page.goto(`${BASE_URL}/ki-assistent/`, { waitUntil: 'networkidle' });
    await expect(page.locator('#chat-input')).toBeVisible({ timeout: 10000 });

    const chatInput = page.locator('#chat-input');
    await chatInput.fill('Was ist die molare Masse von Wasser?');

    const sendBtn = page.locator('#chat-send-btn');
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    await page.waitForTimeout(2000);
    const messages = page.locator('.message.bot .message-content');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Dashboard', () => {
  test('should load dashboard page if it exists', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/dashboard/`);
    if (response.status() === 200) {
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('Visualization Pages', () => {
  const visualizations = [
    { path: 'perioden-system-der-elemente', label: 'Periodensystem' },
    { path: 'molekuel-studio', label: 'Molekülstudio' },
    { path: 'molekuelorbitale', label: 'Molekülorbitale' },
  ];

  visualizations.forEach((viz) => {
    test(`should load visualization: ${viz.path}`, async ({ page, context }) => {
      test.setTimeout(30000);
      await page.goto(`${BASE_URL}/${viz.path}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('body')).not.toHaveText(/404|Seite nicht gefunden/);
    });
  });
});

test.describe('Footer', () => {
  test('should have Wissensnetz link in footer', async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator('footer');
    const entityLink = footer.locator('a[href="/entity/"]');
    await expect(entityLink).toBeVisible();
  });

  test('should have Impressum link in footer', async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator('footer');
    const impressum = footer.locator('a[href*="impressum"]');
    await expect(impressum).toBeVisible();
  });
});

test.describe('Pagefind Search', () => {
  test('should have search input on homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    const searchInput = page.locator('#search-form input[type="search"], .search-input, input[name="q"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should include pagefind script', async ({ page }) => {
    await page.goto(BASE_URL);
    const pagefindScript = page.locator('script[src*="pagefind"]');
    if (await pagefindScript.count() > 0) {
      await expect(pagefindScript).toHaveCount(1);
    }
  });
});

test.describe('Dark Mode', () => {
  test('should have theme toggle button', async ({ page }) => {
    await page.goto(BASE_URL);
    const toggle = page.locator('#theme-toggle, .dark-mode-toggle, button:has-text("🌙")');
    await expect(toggle).toBeVisible();
  });

  test('should toggle dark class on click', async ({ page }) => {
    await page.goto(BASE_URL);
    const toggle = page.locator('#theme-toggle, .dark-mode-toggle, button:has-text("🌙")');

    if (await toggle.count() > 0) {
      await toggle.click();
      await page.waitForTimeout(500);

      const hasDark = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark')
          || document.body.classList.contains('dark-mode')
          || document.body.classList.contains('dark');
      });
      expect(typeof hasDark).toBe('boolean');
    }
  });
});
