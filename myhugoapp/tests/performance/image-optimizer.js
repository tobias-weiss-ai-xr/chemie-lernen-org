#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

class ImageOptimizer {
  constructor() {
    this.imageDir = path.join(__dirname, '../../static/images');
    this.outputDir = path.join(__dirname, '../../static/images/optimized');
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
    this.optimizations = 0;
    this.totalSaved = 0;

    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async optimizeImages() {
    console.log(`${colors.cyan}=== Image Optimization with WebP ===${colors.reset}\n`);

    if (!fs.existsSync(this.imageDir)) {
      console.log(`${colors.yellow}⚠${colors.reset} Images directory not found\n`);
      return;
    }

    const imageFiles = this.getAllImages();

    for (const file of imageFiles) {
      await this.optimizeImage(file);
    }

    this.generateReport();
  }

  getAllImages() {
    const imageFiles = [];

    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          if (this.supportedFormats.includes(ext)) {
            imageFiles.push(fullPath);
          }
        }
      }
    };

    scanDirectory(this.imageDir);
    return imageFiles;
  }

  async optimizeImage(imagePath) {
    const ext = path.extname(imagePath);
    const baseName = path.basename(imagePath, ext);
    const relativePath = path.relative(this.imageDir, imagePath);
    const outputDir = path.join(this.outputDir, path.dirname(relativePath));

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const originalSize = fs.statSync(imagePath).size;
    const webpPath = path.join(outputDir, `${baseName}.webp`);

    try {
      const hasWebP = await this.checkWebPSupport();
      if (hasWebP && !fs.existsSync(webpPath)) {
        await this.convertToWebP(imagePath, webpPath);

        if (fs.existsSync(webpPath)) {
          const webpSize = fs.statSync(webpPath).size;
          const savings = originalSize - webpSize;
          const savingsPercent = Math.round((savings / originalSize) * 100);

          if (savingsPercent > 0) {
            this.optimizations++;
            this.totalSaved += savings;

            console.log(
              `${colors.green}✓${colors.reset} ${baseName}${ext}: ${this.formatBytes(originalSize)} → ${this.formatBytes(webpSize)} (-${savingsPercent}%)`
            );

            await this.generateResponsiveImages(webpPath, baseName, outputDir);
          }
        }
      }

      await this.generateAvif(imagePath, path.join(outputDir, `${baseName}.avif`), baseName, ext);
    } catch (error) {
      console.log(
        `${colors.yellow}⚠${colors.reset} Failed to optimize ${baseName}${ext}: ${error.message}`
      );
    }
  }

  async checkWebPSupport() {
    try {
      execSync('cwebp -version', { stdio: 'ignore' });
      return true;
    } catch {
      try {
        execSync('convert -version', { stdio: 'ignore' });
        return true;
      } catch {
        console.log(
          `${colors.yellow}⚠${colors.reset} WebP conversion not available. Install cwebp or ImageMagick`
        );
        return false;
      }
    }
  }

  async convertToWebP(inputPath, outputPath) {
    try {
      execSync(`cwebp -q 80 "${inputPath}" -o "${outputPath}"`, { stdio: 'ignore' });
    } catch {
      try {
        execSync(`convert "${inputPath}" -quality 80 "${outputPath}"`, { stdio: 'ignore' });
      } catch (error) {
        throw new Error('WebP conversion failed');
      }
    }
  }

  async generateResponsiveImages(webpPath, baseName, outputDir) {
    const sizes = [320, 640, 960, 1280, 1920];

    for (const size of sizes) {
      const responsivePath = path.join(outputDir, `${baseName}-${size}.webp`);

      if (!fs.existsSync(responsivePath)) {
        try {
          execSync(`cwebp -q 75 -resize ${size} 0 "${webpPath}" -o "${responsivePath}"`, {
            stdio: 'ignore',
          });
        } catch {
          try {
            execSync(`convert "${webpPath}" -resize ${size}x -quality 75 "${responsivePath}"`, {
              stdio: 'ignore',
            });
          } catch {
            continue;
          }
        }
      }
    }
  }

  async generateAvif(inputPath, avifPath, baseName, ext) {
    try {
      execSync(`avifenc --min 20 --max 80 "${inputPath}" "${avifPath}"`, { stdio: 'ignore' });

      if (fs.existsSync(avifPath)) {
        const originalSize = fs.statSync(inputPath).size;
        const avifSize = fs.statSync(avifPath).size;
        const savingsPercent = Math.round(((originalSize - avifSize) / originalSize) * 100);

        if (savingsPercent > 5) {
          console.log(
            `${colors.blue}→${colors.reset} ${baseName}.avif: ${this.formatBytes(originalSize)} → ${this.formatBytes(avifSize)} (-${savingsPercent}%)`
          );
        }
      }
    } catch {
      try {
        execSync(`convert "${inputPath}" -quality 75 "${avifPath}"`, { stdio: 'ignore' });
      } catch {
        return;
      }
    }
  }

  generatePictureTag(originalPath, relativePath) {
    const baseName = path.basename(originalPath, path.extname(originalPath));
    const ext = path.extname(originalPath);

    return `
<picture>
  <source srcset="/images/optimized/${relativePath}/${baseName}.avif" type="image/avif">
  <source srcset="/images/optimized/${relativePath}/${baseName}.webp" type="image/webp">
  <img src="${originalPath.replace(this.imageDir, '/images')}" alt="${baseName}" loading="lazy">
</picture>
    `.trim();
  }

  generateHTMLReplacements() {
    console.log(`\n${colors.cyan}=== HTML Picture Tag Generation ===${colors.reset}\n`);

    const htmlFiles = [];
    const searchDir = path.join(__dirname, '../../public');

    const findHtmlFiles = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          findHtmlFiles(fullPath);
        } else if (item.endsWith('.html')) {
          htmlFiles.push(fullPath);
        }
      }
    };

    findHtmlFiles(searchDir);

    let totalReplacements = 0;

    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf8');
      const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;

      let newContent = content;
      let match;

      while ((match = imgRegex.exec(content)) !== null) {
        const imgTag = match[0];
        const src = match[1];

        if (src.startsWith('/images/') && !src.includes('.webp') && !src.includes('.avif')) {
          const imagePath = path.join(this.imageDir, src.replace('/images/', ''));

          if (fs.existsSync(imagePath)) {
            const relativePath = path.relative(this.imageDir, imagePath);
            const pictureTag = this.generatePictureTag(imagePath, path.dirname(relativePath));

            newContent = newContent.replace(imgTag, pictureTag);
            totalReplacements++;
          }
        }
      }

      if (newContent !== content) {
        fs.writeFileSync(htmlFile, newContent);
      }
    }

    console.log(
      `${colors.green}✓${colors.reset} Picture tags generated for ${totalReplacements} images`
    );
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  generateReport() {
    console.log(`\n${colors.cyan}=== Image Optimization Report ===${colors.reset}\n`);
    console.log(`${colors.blue}Images optimized:${colors.reset} ${this.optimizations}`);
    console.log(
      `${colors.blue}Total bandwidth saved:${colors.reset} ${this.formatBytes(this.totalSaved)}`
    );
    console.log(
      `${colors.blue}Average savings:${colors.reset} ${Math.round(this.totalSaved / this.optimizations)} bytes per image\n`
    );

    const report = {
      timestamp: new Date().toISOString(),
      optimizedImages: this.optimizations,
      bandwidthSaved: this.totalSaved,
      averageSavings: Math.round(this.totalSaved / this.optimizations),
      recommendations: [
        'Update HTML to use picture tags with WebP/AVIF sources',
        'Implement responsive images with srcset',
        'Add loading="lazy" to non-critical images',
        'Use CDN for optimized image delivery',
      ],
    };

    const reportPath = path.join(__dirname, '../../image-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`${colors.green}✓${colors.reset} Report saved to image-optimization-report.json`);
  }

  async generateImageSprites() {
    console.log(`\n${colors.cyan}=== Image Sprite Generation ===${colors.reset}\n`);

    const iconsPath = path.join(this.imageDir, 'icons');
    if (fs.existsSync(iconsPath)) {
      const iconFiles = fs.readdirSync(iconsPath).filter((file) => file.endsWith('.png'));

      if (iconFiles.length > 1) {
        try {
          const spritePath = path.join(this.outputDir, 'icons-sprite.png');
          execSync(`convert "${iconsPath}/*.png" -append "${spritePath}"`, { stdio: 'ignore' });

          if (fs.existsSync(spritePath)) {
            console.log(
              `${colors.green}✓${colors.reset} Generated sprite with ${iconFiles.length} icons`
            );
          }
        } catch (error) {
          console.log(
            `${colors.yellow}⚠${colors.reset} Sprite generation failed: ${error.message}`
          );
        }
      }
    }
  }
}

async function runImageOptimization() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Image Optimization Suite            ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const optimizer = new ImageOptimizer();
    await optimizer.optimizeImages();
    await optimizer.generateImageSprites();
    optimizer.generateHTMLReplacements();

    console.log(`\n${colors.green}✓${colors.reset} Image optimization completed successfully`);
    console.log(`  ${colors.blue}→${colors.reset} Check /static/images/optimized/`);
    console.log(`  ${colors.blue}→${colors.reset} Review image-optimization-report.json\n`);
  } catch (error) {
    console.error(`${colors.red}Error during optimization:${colors.reset}`, error);
    process.exit(1);
  }
}

runImageOptimization();
