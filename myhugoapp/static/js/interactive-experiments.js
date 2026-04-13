/**
 * Interactive pH Visualization
 * Visual representation of pH scale with color transitions
 */

class InteractivePHVisualization {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.phScale = null;
    this.currentPH = 7;
    this.targetPH = 7;
    this.isAnimating = false;
    this.colorCache = new Map();

    this.phColors = {
      acid: { r: 255, g: 0, b: 147 },
      neutral: { r: 128, g: 128, b: 128 },
      base: { r: 0, g: 255, b: 0 },
      alkaline: { r: 0, g: 255, b: 255 }
    };

    this.init();
  }

  init() {
    this.createVisualization();
    this.bindEvents();
    this.setupInteractiveControls();
  }

  createVisualization() {
    const container = document.querySelector('.ph-visualization');
    if (!container) {
      console.warn('pH visualization container not found');
      return;
    }

    this.container = container;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.border = '1px solid #ddd';
    canvas.style.borderRadius = '8px';
    canvas.style.background = '#fff';

    const phScale = document.createElement('div');
    phScale.className = 'ph-scale-visual';
    phScale.style.cssText = `
      position: relative;
      background: linear-gradient(to right, #ff6b6b, #ffcccc);
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      display: inline-block;
      vertical-align: middle;
    `;

    const infoPanel = document.createElement('div');
    infoPanel.className = 'ph-info-panel';
    infoPanel.innerHTML = `
      <div class="ph-current">
        <h4>Aktueller pH: <span id="current-ph-display">7.0</span></h4>
        <div class="color-indicator" id="ph-color-indicator"></div>
      </div>
      <div class="ph-controls">
        <label for="ph-slider">pH einstellen:</label>
        <input type="range" id="ph-slider" min="0" max="14" step="0.1" value="7">
        <div class="ph-examples">
          <h5>Beispiele:</h5>
          <div class="example acid" data-ph="1">
            <span class="example-label">Zitronensäure (HCl)</span>
            <span class="ph-value">pH ≈ 1</span>
          </div>
          <div class="example neutral" data-ph="7">
            <span class="example-label">Reines Wasser</span>
            <span class="ph-value">pH ≈ 7</span>
          </div>
          <div class="example base" data-ph="14">
            <span class="example-label">Natronlauge (NaOH)</span>
            <span class="ph-value">pH ≈ 14</span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(canvas);
    container.appendChild(phScale);
    container.appendChild(infoPanel);

    this.canvas = canvas.getContext('2d');
    this.phScale = phScale;

    this.drawVisualization();
  }

  bindEvents() {
    const phSlider = document.getElementById('ph-slider');
    if (phSlider) {
      phSlider.addEventListener('input', () => this.handlePHSliderChange());
    }
  }

  setupInteractiveControls() {
    const phExamples = document.querySelectorAll('.example');
    phExamples.forEach(example => {
      example.addEventListener('click', () => {
        const targetPH = parseFloat(example.dataset.ph);
        this.animateToPH(targetPH);
      });
    });
  }

  handlePHSliderChange() {
    const phSlider = document.getElementById('ph-slider');
    const currentDisplay = document.getElementById('current-ph-display');
    const colorIndicator = document.getElementById('ph-color-indicator');

    if (phSlider && currentDisplay && colorIndicator) {
      const ph = parseFloat(phSlider.value);
      this.currentPH = ph;

      currentDisplay.textContent = ph.toFixed(1);

      this.updateColorIndicator(ph);
      this.animateToPH(ph);
    }
  }

  animateToPH(targetPH) {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const startPH = this.currentPH;
    const endPH = targetPH;
    const duration = 1000;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentPH = startPH + (endPH - startPH) * progress;

      this.currentPH = currentPH;
      this.updateVisualization(currentPH);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.currentPH = endPH;
        this.updateVisualization(endPH);
        this.isAnimating = false;
      }
    };

    requestAnimationFrame(animate);
  }

  updateVisualization(ph) {
    this.currentPH = ph;
    this.updateColorIndicator(ph);
    this.drawPHScale(ph);
  }

  updateColorIndicator(ph) {
    const colorIndicator = document.getElementById('ph-color-indicator');
    if (!colorIndicator) return;

    let color;

    if (ph < 3) {
      color = this.phColors.acid;
    } else if (ph < 7) {
      color = this.phColors.neutral;
    } else if (ph < 11) {
      color = this.phColors.base;
    } else {
      color = this.phColors.alkaline;
    }

    colorIndicator.style.backgroundColor = color;
    colorIndicator.className = `ph-color-indicator ph-${color}`;
  }

  drawPHScale(ph) {
    const ctx = this.canvas;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const scaleWidth = width - 100;
    const scaleHeight = height;
    const scaleStartX = 50;
    const scaleStartY = 50;

    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    ctx.fillRect(scaleStartX, scaleStartY, scaleWidth, scaleHeight);
    ctx.strokeRect(scaleStartX, scaleStartY, scaleWidth, scaleHeight);

    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('pH Skala', scaleStartX + scaleWidth / 2, scaleStartY - 15);

    for (let i = 0; i <= 14; i++) {
      const x = scaleStartX + (i / 14) * scaleWidth;
      const phValue = i;
      const ph = Math.round(this.mapPHToColor(phValue) * 10);
      const y = scaleStartY + scaleHeight;

      ctx.fillStyle = this.getColorForPH(phValue);
      ctx.fillRect(x, y - 10, scaleWidth / 14, 20);

      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ph, x + scaleWidth / 28, y);

      if (i === 7) {
        ctx.strokeStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(x + scaleWidth / 14, y);
        ctx.lineTo(x + scaleWidth / 14, y + scaleHeight);
        ctx.stroke();

        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Neutral', x + 3 * scaleWidth / 14, y + scaleHeight / 2);
      }
    }

    const markY = scaleStartY + scaleHeight + 20;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333';
    ctx.fillText('Aktuell: ' + ph.toFixed(1), scaleStartX, markY);

    const targetMark = Math.round(this.mapPHToPosition(ph) * scaleWidth / 14);
    const targetX = scaleStartX + targetMark;

    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(targetX, markY);
    ctx.lineTo(targetX, markY - 15);
    ctx.lineTo(targetX, markY);
    ctx.lineTo(targetX + 10, markY);
    ctx.stroke();
  }

  mapPHToColor(ph) {
    if (ph <= 0) return '#ff0000';
    if (ph <= 1) return this.interpolateColor('#ff0000', '#330000', 0.5);
    if (ph <= 2) return this.interpolateColor('#330000', '#ff0000', 0.5);
    if (ph <= 3) return this.interpolateColor('#330000', '#ff3300', 0.5);
    if (ph <= 4) return this.interpolateColor('#330000', '#99cc00', 0.5);
    if (ph <= 5) return this.interpolateColor('#99cc00', '#66ff00', 0.5);
    if (ph <= 6) return this.interpolateColor('#66ff00', '#ffcc00', 0.5);
    if (ph <= 7) return this.interpolateColor('#ffcc00', '#ff9900', 0.5);
    if (ph <= 8) return this.interpolateColor('#ff9900', '#ffff00', 0.5);
    if (ph <= 9) return this.interpolateColor('#ffff00', '#ccffcc', 0.5);
    if (ph <= 10) return this.interpolateColor('#ccffcc', '#99ccff', 0.5);
    if (ph <= 11) return this.interpolateColor('#99ccff', '#66ff66', 0.5);
    if (ph <= 12) return this.interpolateColor('#66ff66', '#ffcc66', 0.5);
    if (ph <= 13) return this.interpolateColor('#ffcc66', '#ff3333', 0.5);
    if (ph <= 14) return this.interpolateColor('#ff3333', '#cc0066', 0.5);

    return this.interpolateColor('#cc0066', '#99cc00', 1);
  }

  mapPHToPosition(ph) {
    if (ph <= 0) return 0;
    if (ph <= 1) return 1;
    if (ph <= 2) return 2;
    if (ph <= 3) return 3;
    if (ph <= 4) return 4;
    if (ph <= 5) return 5;
    if (ph <= 6) return 6;
    if (ph <= 7) return 7;
    if (ph <= 8) return 8;
    if (ph <= 9) return 9;
    if (ph <= 10) return 10;
    if (ph <= 11) return 11;
    if (ph <= 12) return 12;
    if (ph <= 13) return 13;
    if (ph <= 14) return 14;
  }

  interpolateColor(color1, color2, factor) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\\d]{6})$/.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}

new InteractivePHVisualization();

window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.ph-rechner')) {
    const phViz = new InteractivePHVisualization();
    window.phVisualization = phViz;
  }
});