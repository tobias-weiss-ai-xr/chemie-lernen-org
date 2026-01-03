/**
 * Additional VR Screenshots - Simplified Capture
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseURL: 'http://localhost:9999',
  screenshotsDir: './myhugoapp/static/screenshots/vr',
  viewport: { width: 1920, height: 1080 }
};

async function captureAdditionalScreenshots() {
  let browser = null;
  let server = null;

  try {
    console.log('🚀 Capturing additional screenshots...\n');

    // Start server
    const { spawn } = require('child_process');
    server = spawn('python3', ['-m', 'http.server', '9999'], {
      cwd: path.join(__dirname, 'myhugoapp/public'),
      stdio: 'pipe'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Server started\n');

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: CONFIG.viewport,
      deviceScaleFactor: 2
    });

    const page = await context.newPage();
    page.setDefaultTimeout(10000);

    // Screenshot: Element Details / Controls Section
    console.log('📸 Capturing: Element Details / Controls...');
    await page.goto(`${CONFIG.baseURL}/pages/pse-in-vr/`, {
      waitUntil: 'networkidle'
    });

    // Scroll to controls section
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-element-detail.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: vr-element-detail.png');

    // Screenshot: Requirements Section
    console.log('📸 Capturing: Requirements Section...');
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-requirements.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: vr-requirements.png');

    // Screenshot: Tutorial/Steps
    console.log('📸 Capturing: Tutorial Steps...');
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-tutorial.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: vr-tutorial.png');

    // Screenshot: Full page (for reference)
    console.log('📸 Capturing: Full VR Feature Page...');
    await page.goto(`${CONFIG.baseURL}/pages/pse-in-vr/`, {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-full-page.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: vr-full-page.png');

    // Screenshot: VR App Loading Screen
    console.log('📸 Capturing: VR App Entry...');
    await page.goto(`${CONFIG.baseURL}/pse-in-vr/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-app-loading.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: vr-app-loading.png');

    console.log('\n✨ Additional screenshots captured!\n');

    // List all screenshots
    const files = fs.readdirSync(CONFIG.screenshotsDir);
    console.log(`📁 All screenshots in ${CONFIG.screenshotsDir}:\n`);

    files.forEach(file => {
      const filePath = path.join(CONFIG.screenshotsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ✓ ${file} (${sizeKB} KB)`);
    });

    console.log(`\n   Total: ${files.length} screenshots\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
    console.log('✅ Cleanup complete\n');
  }
}

captureAdditionalScreenshots().catch(console.error);
