#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

class DependencyOptimizer {
  constructor() {
    this.staticDir = path.join(__dirname, '../../static');
    this.vendorDir = path.join(this.staticDir, 'vendor');
    this.dependencies = [
      {
        name: 'bootstrap-css',
        url: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
        localPath: 'css/bootstrap.min.css',
        integrity: 'sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u',
      },
      {
        name: 'bootstrap-js',
        url: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js',
        localPath: 'js/bootstrap.min.js',
        integrity: 'sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCja7b2sAyOlpjmtmEEO9IUHwB',
      },
      {
        name: 'font-awesome-css',
        url: 'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
        localPath: 'css/font-awesome.min.css',
        integrity: 'sha384-wvfXpqm44lGJScwFxsLvNhGLNQpmwKKZPQAijqcoAnNw4RTKGUsGPduuNoKvnWUK7Tm',
      },
      {
        name: 'jquery',
        url: 'https://code.jquery.com/jquery-3.6.0.min.js',
        localPath: 'js/jquery.min.js',
        integrity: 'sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=28hUOaFN',
      },
      {
        name: 'katex-css',
        url: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
        localPath: 'css/katex.min.css',
      },
      {
        name: 'katex-js',
        url: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
        localPath: 'js/katex.min.js',
      },
      {
        name: 'katex-fonts',
        url: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/fonts/KaTeX_Main-Regular.woff2',
        localPath: 'fonts/KaTeX_Main-Regular.woff2',
      },
    ];

    this.downloadedFiles = 0;
    this.totalSizeSaved = 0;

    this.ensureVendorDir();
  }

  ensureVendorDir() {
    if (!fs.existsSync(this.vendorDir)) {
      fs.mkdirSync(this.vendorDir, { recursive: true });
    }
  }

  async optimizeDependencies() {
    console.log(`${colors.cyan}=== External Dependency Optimization ===${colors.reset}\n`);

    for (const dep of this.dependencies) {
      await this.downloadDependency(dep);
    }

    await this.generateBundles();
    this.generateHugoTemplate();
    this.generateReport();
  }

  async downloadDependency(dependency) {
    const localPath = path.join(this.vendorDir, dependency.localPath);
    const dirPath = path.dirname(localPath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (fs.existsSync(localPath)) {
      const localStat = fs.statSync(localPath);
      const lastModified = new Date(localStat.mtime);
      const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceModified < 7) {
        console.log(`${colors.blue}○${colors.reset} ${dependency.name}: already cached`);
        return;
      }
    }

    try {
      console.log(`${colors.yellow}↓${colors.reset} Downloading ${dependency.name}...`);

      const data = await this.downloadFile(dependency.url);
      fs.writeFileSync(localPath, data);

      const size = Buffer.byteLength(data, 'utf8');
      this.downloadedFiles++;

      console.log(
        `${colors.green}✓${colors.reset} ${dependency.name}: ${this.formatBytes(size)} downloaded`
      );

      if (dependency.integrity) {
        await this.verifyIntegrity(localPath, dependency.integrity, dependency.name);
      }
    } catch (error) {
      console.error(
        `${colors.red}❌${colors.reset} Failed to download ${dependency.name}: ${error.message}`
      );
    }
  }

  downloadFile(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;

      protocol
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }

          const data = [];
          response.on('data', (chunk) => data.push(chunk));
          response.on('end', () => resolve(Buffer.concat(data)));
        })
        .on('error', reject);
    });
  }

  async verifyIntegrity(filePath, expectedIntegrity, name) {
    try {
      const { createHash } = await import('crypto');
      const data = fs.readFileSync(filePath);
      const hash = createHash('sha384').update(data).digest('base64');

      if (hash === expectedIntegrity) {
        console.log(`${colors.green}✓${colors.reset} ${name}: integrity verified`);
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} ${name}: integrity mismatch`);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠${colors.reset} ${name}: integrity check failed`);
    }
  }

  async generateBundles() {
    console.log(`\n${colors.cyan}=== Bundle Generation ===${colors.reset}\n`);

    const cssBundle = [];
    const jsBundle = [];

    for (const dep of this.dependencies) {
      const localPath = path.join(this.vendorDir, dep.localPath);

      if (fs.existsSync(localPath)) {
        if (dep.localPath.endsWith('.css')) {
          const content = fs.readFileSync(localPath, 'utf8');
          cssBundle.push(`/* ${dep.name} */\n${content}`);
        } else if (dep.localPath.endsWith('.js')) {
          const content = fs.readFileSync(localPath, 'utf8');
          jsBundle.push(`/* ${dep.name} */\n${content}`);
        }
      }
    }

    if (cssBundle.length > 0) {
      const vendorCSS = cssBundle.join('\n\n');
      const cssPath = path.join(this.vendorDir, 'css/bundle.min.css');
      fs.writeFileSync(cssPath, vendorCSS);
      console.log(
        `${colors.green}✓${colors.reset} CSS bundle created: ${this.formatBytes(Buffer.byteLength(vendorCSS, 'utf8'))}`
      );
    }

    if (jsBundle.length > 0) {
      const vendorJS = jsBundle.join('\n\n;\n');
      const jsPath = path.join(this.vendorDir, 'js/bundle.min.js');
      fs.writeFileSync(jsPath, vendorJS);
      console.log(
        `${colors.green}✓${colors.reset} JS bundle created: ${this.formatBytes(Buffer.byteLength(vendorJS, 'utf8'))}`
      );
    }
  }

  generateHugoTemplate() {
    const template = `
{{- $vendorCSS := resources.Get "vendor/css/bundle.min.css" -}}
{{- $vendorJS := resources.Get "vendor/js/bundle.min.js" -}}

{{- if $vendorCSS -}}
  {{- $css := $vendorCSS | minify | fingerprint -}}
  <link rel="stylesheet" href="{{ $css.RelPermalink }}" integrity="{{ $css.Data.Integrity }}">
{{- end -}}

{{- if $vendorJS -}}
  {{- $js := $vendorJS | minify | fingerprint -}}
  <script src="{{ $js.RelPermalink }}" integrity="{{ $js.Data.Integrity }}"></script>
{{- end -}}

<!-- Individual fallbacks if bundle fails -->
<noscript>
  <link rel="stylesheet" href="/vendor/css/bootstrap.min.css">
  <link rel="stylesheet" href="/vendor/css/font-awesome.min.css">
  <link rel="stylesheet" href="/vendor/css/katex.min.css">
  <script src="/vendor/js/jquery.min.js"></script>
  <script src="/vendor/js/bootstrap.min.js"></script>
  <script src="/vendor/js/katex.min.js"></script>
</noscript>

<!-- Progressive enhancement for critical CSS -->
<style>
  .bootstrap-fallback { display: none; }
  .no-js .bootstrap-fallback { display: block; }
</style>

<script>
  if (typeof window.bootstrap === 'undefined') {
    document.documentElement.className += ' bootstrap-fallback';
  }
  if (typeof window.jQuery === 'undefined') {
    document.documentElement.className += ' jquery-fallback';
  }
  if (typeof window.katex === 'undefined') {
    document.documentElement.className += ' katex-fallback';
  }
</script>
    `.trim();

    const templatePath = path.join(__dirname, '../../layouts/partials/vendor-dependencies.html');
    fs.writeFileSync(templatePath, template);
    console.log(`${colors.green}✓${colors.reset} Hugo template created: vendor-dependencies.html`);
  }

  generateReport() {
    console.log(`\n${colors.cyan}=== Optimization Report ===${colors.reset}\n`);

    let totalSize = 0;
    for (const dep of this.dependencies) {
      const localPath = path.join(this.vendorDir, dep.localPath);
      if (fs.existsSync(localPath)) {
        const size = fs.statSync(localPath).size;
        totalSize += size;
      }
    }

    const report = {
      timestamp: new Date().toISOString(),
      downloadedFiles: this.downloadedFiles,
      totalSize: totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      dependencies: this.dependencies.map((dep) => ({
        name: dep.name,
        cached: fs.existsSync(path.join(this.vendorDir, dep.localPath)),
        localPath: dep.localPath,
        originalUrl: dep.url,
      })),
      recommendations: [
        'Use Hugo resources.Get() for fingerprinting',
        'Implement integrity attributes for security',
        'Add Service Worker caching for vendor files',
        'Consider tree-shaking for unused components',
      ],
    };

    const reportPath = path.join(__dirname, '../../dependency-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(
      `${colors.green}✓${colors.reset} Report saved: dependency-optimization-report.json`
    );
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  generateCriticalCSS() {
    const criticalCSS = `
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.navbar { background: #2c3e50; }
.btn-primary { background: #3498db; }
.container { max-width: 1200px; margin: 0 auto; }
    `.trim();

    const criticalPath = path.join(this.vendorDir, 'css/critical.min.css');
    fs.writeFileSync(criticalPath, criticalCSS);
    console.log(`${colors.green}✓${colors.reset} Critical CSS generated`);
  }
}

async function runDependencyOptimization() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Dependency Optimization Suite        ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const optimizer = new DependencyOptimizer();
    await optimizer.optimizeDependencies();
    optimizer.generateCriticalCSS();

    console.log(`\n${colors.green}✓${colors.reset} Dependency optimization completed`);
    console.log(`  ${colors.blue}→${colors.reset} Check /static/vendor/ directory`);
    console.log(
      `  ${colors.blue}→${colors.reset} Use {{ partial "vendor-dependencies.html" . }} in templates`
    );
    console.log(`  ${colors.blue}→${colors.reset} Review dependency-optimization-report.json\n`);
  } catch (error) {
    console.error(`${colors.red}Error during optimization:${colors.reset}`, error);
    process.exit(1);
  }
}

runDependencyOptimization();
