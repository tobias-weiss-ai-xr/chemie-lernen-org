/**
 * PSE in VR Screenshot Capture Script
 *
 * This script captures screenshots of the VR experience using Playwright
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseURL: 'http://localhost:9999',
  screenshotsDir: './myhugoapp/static/screenshots/vr',
  viewport: { width: 1920, height: 1080 },
  timeout: 10000
};

// Ensure screenshots directory exists
if (!fs.existsSync(CONFIG.screenshotsDir)) {
  fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
  console.log(`✅ Created directory: ${CONFIG.screenshotsDir}`);
}

async function captureScreenshots() {
  let browser = null;
  let server = null;

  try {
    console.log('🚀 Starting screenshot capture process...\n');

    // Start simple HTTP server
    console.log('📡 Starting HTTP server...');
    const { spawn } = require('child_process');

    // Kill any existing process on port 9999
    try {
      spawn('pkill', ['-f', 'python3 -m http.server 9999']);
    } catch (e) {
      // Ignore if no process found
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start server
    server = spawn('python3', ['-m', 'http.server', '9999'], {
      cwd: path.join(__dirname, 'myhugoapp/public'),
      stdio: 'pipe'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Server started on http://localhost:9999\n');

    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: CONFIG.viewport,
      deviceScaleFactor: 2 // Retina quality
    });

    const page = await context.newPage();
    page.setDefaultTimeout(CONFIG.timeout);

    // Screenshot 1: VR Feature Page Hero
    console.log('📸 Capturing: VR Feature Page...');
    await page.goto(`${CONFIG.baseURL}/pages/pse-in-vr/`, {
      waitUntil: 'networkidle'
    });
    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-feature-page.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: vr-feature-page.png');

    // Screenshot 2: VR Feature Page Hero Section (cropped)
    console.log('📸 Capturing: VR Hero Section...');
    await page.evaluate(() => {
      const hero = document.querySelector('.vr-hero') || document.querySelector('h1').closest('div');
      if (hero) {
        hero.scrollIntoView({ top: 0, behavior: 'instant' });
      }
    });
    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-hero-screenshot.png'),
      clip: {
        x: 0,
        y: 0,
        width: CONFIG.viewport.width,
        height: 600
      }
    });
    console.log('   ✅ Saved: vr-hero-screenshot.png');

    // Screenshot 3: VR Application (if it loads)
    console.log('📸 Capturing: VR Application...');
    try {
      await page.goto(`${CONFIG.baseURL}/pse-in-vr/index.html`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      // Wait for the VR app to initialize
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: path.join(CONFIG.screenshotsDir, 'vr-headset-view.png'),
        fullPage: false
      });
      console.log('   ✅ Saved: vr-headset-view.png');
    } catch (error) {
      console.log('   ⚠️  VR app screenshot skipped (requires WebGL/WebXR):', error.message);
    }

    // Screenshot 4: Desktop Mode (Feature cards section)
    console.log('📸 Capturing: Desktop Mode / Features...');
    await page.goto(`${CONFIG.baseURL}/pages/pse-in-vr/`, {
      waitUntil: 'networkidle'
    });

    // Scroll to features section
    await page.evaluate(() => {
      const featuresSection = document.querySelector('.feature-grid');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'instant' });
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-desktop-mode.png'),
      clip: {
        x: 100,
        y: 800,
        width: CONFIG.viewport.width - 200,
        height: 500
      }
    });
    console.log('   ✅ Saved: vr-desktop-mode.png');

    // Screenshot 5: Element Details / Tutorial Section
    console.log('📸 Capturing: Tutorial Section...');
    await page.evaluate(() => {
      const tutorial = document.querySelector('.tutorial-section') ||
                      document.querySelectorAll('h2')[3]; // 4th heading
      if (tutorial) {
        tutorial.scrollIntoView({ behavior: 'instant' });
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-element-detail.png'),
      clip: {
        x: 100,
        y: 1200,
        width: CONFIG.viewport.width - 200,
        height: 400
      }
    });
    console.log('   ✅ Saved: vr-element-detail.png');

    // Screenshot 6: Roadmap with VR
    console.log('📸 Capturing: Roadmap with VR...');
    await page.goto(`${CONFIG.baseURL}/pages/roadmap/`, {
      waitUntil: 'networkidle'
    });

    // Find VR section in roadmap
    await page.evaluate(() => {
      const content = document.querySelector('.post-content');
      if (content) {
        const vrSection = Array.from(content.querySelectorAll('h2, h3')).find(h =>
          h.textContent.includes('VR') || h.textContent.includes('Immersive')
        );
        if (vrSection) {
          vrSection.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CONFIG.screenshotsDir, 'vr-roadmap-integration.png'),
      clip: {
        x: 100,
        y: 400,
        width: CONFIG.viewport.width - 200,
        height: 500
      }
    });
    console.log('   ✅ Saved: vr-roadmap-integration.png');

    console.log('\n✨ All screenshots captured successfully!\n');

    // List captured files
    const files = fs.readdirSync(CONFIG.screenshotsDir);
    console.log(`📁 Screenshots saved to: ${CONFIG.screenshotsDir}`);
    console.log(`   Total files: ${files.length}\n`);

    files.forEach(file => {
      const filePath = path.join(CONFIG.screenshotsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   - ${file} (${sizeKB} KB)`);
    });

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }

    if (server) {
      server.kill();
      console.log('✅ Server stopped');
    }

    console.log('\n🎉 Screenshot capture complete!\n');
  }
}

// Run the capture
captureScreenshots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
