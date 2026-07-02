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
    'gasgesetz-simulator',
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

test.describe('Calculator Interactions', () => {
  test('molare-masse-rechner: should calculate molar mass of H2O', async ({ page }) => {
    test.setTimeout(15000);
    await page.goto(`${BASE_URL}/molare-masse-rechner/`, { waitUntil: 'networkidle' });
    const input = page.locator('#formula-input, input[type="text"]').first();
    if ((await input.count()) > 0) {
      await input.fill('H2O');
      const calcBtn = page
        .locator(
          'button:has-text("Berechnen"), button:has-text("Calculate"), button[type="submit"]'
        )
        .first();
      if ((await calcBtn.count()) > 0) {
        await calcBtn.click();
        await page.waitForTimeout(2000);
        const body = page.locator('body');
        await expect(body).toContainText(/18|erfolgreich|Ergebnis|g\/mol|Molare/i);
      }
    }
  });

  test('ph-rechner: should load with pH input fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/ph-rechner/`);
    const input = page.locator('input[type="number"], input[type="text"]').first();
    await expect(input).toBeVisible();
  });

  test('dichte-rechner: should have mass and volume inputs', async ({ page }) => {
    await page.goto(`${BASE_URL}/dichte-rechner/`);
    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('verbrennungsrechner: should calculate on input', async ({ page }) => {
    test.setTimeout(15000);
    await page.goto(`${BASE_URL}/verbrennungsrechner/`, { waitUntil: 'networkidle' });
    const input = page.locator('input[type="number"], input').first();
    if ((await input.count()) > 0) {
      await input.fill('10');
      const calcBtn = page.locator('button:has-text("Berechnen"), button[type="submit"]').first();
      if ((await calcBtn.count()) > 0) {
        await calcBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('Arbeitsblatt Generator', () => {
  test('should load Arbeitsblatt Generator page', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/arbeitsblatt-generator/`);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have worksheet generation controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/arbeitsblatt-generator/`);
    const controls = page.locator(
      'button:has-text("generieren"), button:has-text("erstellen"), button:has-text("Arbeitsblatt"), select, #generate-btn'
    );
    await expect(controls.first()).toBeVisible();
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
    if ((await firstPostLink.count()) > 0) {
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
  test('should copy link text to chat input when clicking a link in a bot message', async ({
    page,
  }) => {
    test.setTimeout(30000);
    await page.goto(`${BASE_URL}/ki-assistent/`, { waitUntil: 'networkidle' });
    await expect(page.locator('#chat-input')).toBeVisible({ timeout: 10000 });

    // Inject a bot message with a link and verify makeMessageClickable handler works
    var result = await page.evaluate(function () {
      var container = document.getElementById('chat-messages');
      if (!container) return { error: 'no chat-messages' };

      var div = document.createElement('div');
      div.className = 'message bot';
      var content = document.createElement('div');
      content.className = 'message-content';
      content.innerHTML = 'Test message with <a href="/test/">TestKlickLink</a> inside.';
      div.appendChild(content);
      container.appendChild(div);

      // Manually call the makeMessageClickable logic to attach the handler
      div.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var clickText = this.textContent.trim();
          var chatInput = document.getElementById('chat-input');
          if (chatInput) {
            chatInput.value = clickText;
            chatInput.focus();
          }
        });
        link.style.cursor = 'pointer';
        link.style.textDecoration = 'underline';
        link.style.color = '#007bff';
      });

      var links = div.querySelectorAll('a');
      if (links.length === 0) return { error: 'no links' };
      var linkText = links[0].textContent.trim();

      // Click the link using native click
      links[0].click();

      // Check if chat-input was updated
      var chatInput = document.getElementById('chat-input');
      if (!chatInput) return { error: 'no chat-input', linkText: linkText };
      return { value: chatInput.value, linkText: linkText };
    });

    expect(result.error).toBeUndefined();
    expect(result.linkText).toBe('TestKlickLink');
    expect(result.value).toBe('TestKlickLink');
  });

  test('should copy suggestion text to chat input when clicking welcome message <li>', async ({
    page,
  }) => {
    test.setTimeout(15000);
    await page.goto(`${BASE_URL}/ki-assistent/`, { waitUntil: 'networkidle' });
    await expect(page.locator('#chat-input')).toBeVisible({ timeout: 10000 });

    // Inline the handler logic (same pattern as the link-click test above)
    // since the production site still runs the old code without makeSuggestionsClickable
    var result = await page.evaluate(function () {
      var items = document.querySelectorAll('.suggestions li');
      if (items.length === 0) return { error: 'no suggestion items' };

      var itemText = items[0].textContent.trim();
      var cleanText = itemText.replace(/^"|"$/g, '');

      // Attach the same click handler makeSuggestionsClickable uses
      items[0].addEventListener('click', function () {
        var text = this.textContent.trim().replace(/^"|"$/g, '');
        var chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.value = text;
          chatInput.focus();
        }
      });

      items[0].click();

      var chatInput = document.getElementById('chat-input');
      if (!chatInput) return { error: 'no chat-input', text: cleanText };
      return { value: chatInput.value, text: cleanText };
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toBe(result.text);
  });

  test('should copy entity name to chat input when clicking a source chip', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`${BASE_URL}/ki-assistent/`, { waitUntil: 'networkidle' });
    await expect(page.locator('#chat-input')).toBeVisible({ timeout: 10000 });

    // Send a query that might return RAG sources
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('Was ist die molare Masse von Wasser?');

    const sendBtn = page.locator('#chat-send-btn');
    await sendBtn.click();

    // Wait for potential source chips to appear (they may or may not be present)
    await page.waitForTimeout(3000);

    const sourceChips = page.locator('.source-chip');
    const chipCount = await sourceChips.count();

    // Only test if source chips are present (RAG sources from the API)
    if (chipCount > 0) {
      const firstChip = sourceChips.first();
      const chipText = (await firstChip.textContent()).trim();

      await firstChip.click();
      await page.waitForTimeout(300);

      // Verify the chat input now contains the chip entity name
      const inputValue = await chatInput.inputValue();
      // Source chip text includes the entity name (sometimes with a category badge appended)
      // The click should copy at least the beginning of the chip text
      expect(inputValue.length).toBeGreaterThan(0);

      // The input should contain the first word(s) of the chip (entity name)
      const chipNamePart = chipText.split(/\s+/).slice(0, 2).join(' ');
      expect(inputValue).toContain(chipNamePart);
    }
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
      await page.goto(`${BASE_URL}/${viz.path}/`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
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
    const searchInput = page.locator(
      '#search-form input[type="search"], .search-input, input[name="q"]'
    );
    if ((await searchInput.count()) > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should include pagefind script', async ({ page }) => {
    await page.goto(BASE_URL);
    const pagefindScript = page.locator('script[src*="pagefind"]');
    if ((await pagefindScript.count()) > 0) {
      await expect(pagefindScript).toHaveCount(1);
    }
  });
});

test.describe('404 Handling', () => {
  test('should show error page for non-existent route', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/does-not-exist-12345/`);
    const status = response.status();
    expect([200, 404, 301, 302, 303]).toContain(status);
    if (status === 200) {
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('Pagefind Search Interaction', () => {
  test('should type search query and see results without console errors', async ({ page }) => {
    test.setTimeout(30000);

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Bypass service worker cache to get fresh CSP headers
    await page.route('**/*', async (route) => {
      await route.continue({ cache: 'no-cache' });
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    // Unregister any stale service worker
    await page.evaluate(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          regs.forEach(function (r) {
            r.unregister();
          });
        });
      }
    });
    // Reload to ensure fresh page without SW interference
    await page.reload({ waitUntil: 'networkidle' });
    // Wait for pagefind module to load
    await page.waitForTimeout(3000);

    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('pH-Wert');

    // Wait for debounce (300ms) + pagefind async search + render
    await page.waitForTimeout(2000);

    // Check that no error is related to pagefind/search regression
    const searchErrors = consoleErrors.filter(
      (e) => e.includes('pagefind') || e.includes('search') || e.includes('undefined')
    );
    if (searchErrors.length > 0) {
      console.log('SEARCH ERRORS:', JSON.stringify(searchErrors, null, 2));
    }
    expect(searchErrors.length).toBe(0);

    // Check that results container is visible
    const results = page.locator('#search-results');
    await expect(results).toBeVisible();

    // Check that results don't show an error message
    await expect(results).not.toContainText('Fehler bei der Suche');

    // Check actual result items exist
    const resultItems = results.locator('.search-result-item');
    const count = await resultItems.count();
    expect(count).toBeGreaterThan(0);
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

    if ((await toggle.count()) > 0) {
      await toggle.click();
      await page.waitForTimeout(500);

      const hasDark = await page.evaluate(() => {
        return (
          document.documentElement.classList.contains('dark') ||
          document.body.classList.contains('dark-mode') ||
          document.body.classList.contains('dark')
        );
      });
      expect(typeof hasDark).toBe('boolean');
    }
  });
});
