class EnhancedPHVisualization {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.currentPH = 7;
    this.targetPH = 7;
    this.indicators = [];
    this.animationId = null;
    this.titrationData = [];
    this.currentPoint = 0;

    this.indicatorColors = [
      { name: 'Phenolphthalein', range: [8.2, 10], color: '#ff69b4' },
      { name: 'Bromthymolblau', range: [6.0, 7.6], color: '#1e90ff' },
      { name: 'Methylorange', range: [3.1, 4.4], color: '#ffa500' },
      { name: 'Lackmus', range: [4.5, 8.3], color: '#9370db' },
    ];

    this.init();
  }

  init() {
    this.createVisualization();
    this.createControls();
    this.initializeIndicators();
    this.startAnimation();
  }

  createVisualization() {
    const container = document.querySelector('.enhanced-ph-viz');
    if (!container) {
      console.warn('Enhanced pH visualization container not found');
      return;
    }

    this.container = container;

    const vizContainer = document.createElement('div');
    vizContainer.className = 'enhanced-ph-container';
    vizContainer.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    `;

    const phScaleDiv = document.createElement('div');
    phScaleDiv.className = 'ph-scale-viz';
    phScaleDiv.innerHTML = `
      <h4>pH-Skala Visualisierung</h4>
      <canvas id="ph-scale-canvas" width="600" height="400" 
              style="border: 2px solid #28a745; border-radius: 8px; background: #f8f9fa; width: 100%; height: auto;"></canvas>
      <div class="ph-scale-controls" style="margin-top: 15px;">
        <input type="range" id="ph-slider" min="0" max="14" step="0.1" value="7" 
               style="width: 100%; margin: 10px 0;">
        <div style="text-align: center;">
          <strong>Aktueller pH: <span id="ph-value">7.0</span></strong>
        </div>
      </div>
    `;

    const titrationDiv = document.createElement('div');
    titrationDiv.className = 'titration-curve-viz';
    titrationDiv.innerHTML = `
      <h4>Titrationkurven</h4>
      <canvas id="titration-canvas" width="600" height="400" 
              style="border: 2px solid #28a745; border-radius: 8px; background: #f8f9fa; width: 100%; height: auto;"></canvas>
      <div class="titration-controls" style="margin-top: 15px;">
        <select id="titration-type" class="form-control" style="margin: 10px 0;">
          <option value="strong-strong">Starke Säure - Starke Base</option>
          <option value="strong-weak">Starke Säure - Schwache Base</option>
          <option value="weak-strong">Schwache Säure - Starke Base</option>
          <option value="weak-weak">Schwache Säure - Schwache Base</option>
        </select>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="start-titration" class="btn btn-success">Titration starten</button>
          <button id="reset-titration" class="btn btn-outline-secondary">Zurücksetzen</button>
          <div style="margin-left: 20px;">
            <span>Aequivalenzpunkt: <strong id="equivalence-point">--</strong> mL</span>
          </div>
        </div>
      </div>
    `;

    vizContainer.appendChild(phScaleDiv);
    vizContainer.appendChild(titrationDiv);
    container.appendChild(vizContainer);

    this.canvas = document.getElementById('ph-scale-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.titrationCanvas = document.getElementById('titration-canvas');
    this.titrationCtx = this.titrationCanvas.getContext('2d');
  }

  createControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'indicator-controls';
    controlsDiv.style.cssText = `
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #dee2e6;
    `;

    controlsDiv.innerHTML = `
      <h4>pH-Indikatoren</h4>
      <div class="indicator-grid" id="indicator-grid">
        <div class="info-message">
          Wählen Sie pH-Werte aus, um zu sehen, welche Indikatoren in diesem Bereich geeignet sind.
        </div>
      </div>
      <div class="substance-examples" style="margin-top: 20px;">
        <h5>Beispiele für pH-Werte:</h5>
        <div class="example-buttons">
          <button class="btn btn-outline-success ph-example" data-ph="1">Zitronensäure (pH ≈ 1)</button>
          <button class="btn btn-outline-success ph-example" data-ph="3">Essig (pH ≈ 3)</button>
          <button class="btn btn-outline-success ph-example" data-ph="5">Kaffee (pH ≈ 5)</button>
          <button class="btn btn-outline-success ph-example" data-ph="7">Reines Wasser (pH = 7)</button>
          <button class="btn btn-outline-success ph-example" data-ph="8">Meerwasser (pH ≈ 8)</button>
          <button class="btn btn-outline-success ph-example" data-ph="10">Backpulver (pH ≈ 10)</button>
          <button class="btn btn-outline-success ph-example" data-ph="13">Bleichmittel (pH ≈ 13)</button>
        </div>
      </div>
    `;

    this.container.appendChild(controlsDiv);
  }

  initializeIndicators() {
    const phSlider = document.getElementById('ph-slider');
    const phValue = document.getElementById('ph-value');
    // eslint-disable-next-line no-unused-vars
    const indicatorGrid = document.getElementById('indicator-grid');

    phSlider.addEventListener('input', () => {
      this.currentPH = parseFloat(phSlider.value);
      phValue.textContent = this.currentPH.toFixed(1);
      this.updateVisualization();
      this.updateIndicators();
    });

    const phExamples = document.querySelectorAll('.ph-example');
    phExamples.forEach((button) => {
      button.addEventListener('click', () => {
        const targetPH = parseFloat(button.dataset.ph);
        this.animateToPH(targetPH);
      });
    });

    const startBtn = document.getElementById('start-titration');
    const resetBtn = document.getElementById('reset-titration');
    const titrationType = document.getElementById('titration-type');

    startBtn.addEventListener('click', () => {
      this.startTitration(titrationType.value);
    });

    resetBtn.addEventListener('click', () => {
      this.resetTitration();
    });

    titrationType.addEventListener('change', () => {
      this.resetTitration();
    });

    this.updateVisualization();
    this.updateIndicators();
  }

  updateVisualization() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    this.drawPHScale(ctx, width, height);
    this.drawPHIndicator(ctx, width, height);
    this.drawSubstances(ctx, width, height);
  }

  drawPHScale(ctx, width, height) {
    const scaleY = height - 80;
    // eslint-disable-next-line no-unused-vars
    const scaleHeight = height - 120;
    const scaleWidth = width - 100;
    const startX = 50;

    const gradient = ctx.createLinearGradient(startX, scaleY, startX + scaleWidth, scaleY);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.2, '#ff3300');
    gradient.addColorStop(0.3, '#ff6600');
    gradient.addColorStop(0.4, '#ffcc00');
    gradient.addColorStop(0.5, '#ccff00');
    gradient.addColorStop(0.6, '#66ff00');
    gradient.addColorStop(0.7, '#00ff00');
    gradient.addColorStop(0.8, '#00ffcc');
    gradient.addColorStop(0.9, '#0099ff');
    gradient.addColorStop(1, '#0066ff');

    ctx.fillStyle = gradient;
    ctx.fillRect(startX, scaleY, scaleWidth, 40);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, scaleY, scaleWidth, 40);

    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';

    for (let i = 0; i <= 14; i++) {
      const x = startX + (i / 14) * scaleWidth;

      ctx.beginPath();
      ctx.moveTo(x, scaleY + 40);
      ctx.lineTo(x, scaleY + 45);
      ctx.stroke();

      ctx.fillText(i.toString(), x, scaleY + 60);

      if (i === 7) {
        ctx.strokeStyle = '#28a745';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, scaleY - 10);
        ctx.lineTo(x, scaleY + 50);
        ctx.stroke();

        ctx.fillStyle = '#28a745';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('NEUTRAL', x, scaleY - 15);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
      }
    }

    const markerX = startX + (this.currentPH / 14) * scaleWidth;
    ctx.strokeStyle = '#dc3545';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(markerX, scaleY - 20);
    ctx.lineTo(markerX, scaleY + 50);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#dc3545';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`pH = ${this.currentPH.toFixed(1)}`, markerX, scaleY - 25);
  }

  drawPHIndicator(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height - 40;
    // eslint-disable-next-line no-unused-vars
    const radius = 25;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 30, centerY);
    ctx.lineTo(centerX - 25, centerY - 60);
    ctx.lineTo(centerX + 25, centerY - 60);
    ctx.lineTo(centerX + 30, centerY);
    ctx.stroke();

    const solutionHeight = 55;
    const solutionColor = this.getSolutionColor(this.currentPH);
    ctx.fillStyle = solutionColor;
    ctx.fillRect(centerX - 24, centerY - solutionHeight, 48, solutionHeight);

    ctx.strokeStyle = solutionColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 24, centerY - solutionHeight);
    ctx.quadraticCurveTo(
      centerX,
      centerY - solutionHeight - 3,
      centerX + 24,
      centerY - solutionHeight
    );
    ctx.stroke();
  }

  drawSubstances(ctx, width, height) {
    const substances = [
      { name: 'Zitronensäure', ph: 1, color: '#ff0000', x: 80, y: height - 140 },
      { name: 'Essig', ph: 3, color: '#ff6600', x: 180, y: height - 140 },
      { name: 'Kaffee', ph: 5, color: '#ffcc00', x: 280, y: height - 140 },
      { name: 'Wasser', ph: 7, color: '#66ff00', x: 380, y: height - 140 },
      { name: 'Seife', ph: 10, color: '#00ffcc', x: 480, y: height - 140 },
      { name: 'Bleichmittel', ph: 13, color: '#0066ff', x: 580, y: height - 140 },
    ];

    substances.forEach((substance) => {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(substance.x - 20, substance.y - 30, 40, 35);
      ctx.strokeStyle = '#666';
      ctx.strokeRect(substance.x - 20, substance.y - 30, 40, 35);

      ctx.fillStyle = substance.color;
      ctx.fillRect(substance.x - 18, substance.y - 15, 36, 20);

      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(substance.name, substance.x, substance.y + 8);
      ctx.fillText(`pH ${substance.ph}`, substance.x, substance.y + 20);
    });
  }

  getSolutionColor(ph) {
    if (ph < 3) return '#ff0000';
    if (ph < 5) return '#ff6600';
    if (ph < 6) return '#ffcc00';
    if (ph < 7) return '#ccff00';
    if (ph < 8) return '#66ff00';
    if (ph < 10) return '#00ff00';
    if (ph < 12) return '#00ffcc';
    return '#0066ff';
  }

  updateIndicators() {
    const indicatorGrid = document.getElementById('indicator-grid');

    const suitableIndicators = this.indicatorColors.filter(
      (indicator) => this.currentPH >= indicator.range[0] && this.currentPH <= indicator.range[1]
    );

    let html = '';
    if (suitableIndicators.length > 0) {
      html = '<div class="suitable-indicators">';
      suitableIndicators.forEach((indicator) => {
        html += `
          <div class="indicator-item" style="background: ${indicator.color}20; 
                    border-left: 4px solid ${indicator.color}; padding: 10px; margin: 5px 0;">
            <strong>${indicator.name}</strong>
            <div style="font-size: 12px; color: #666;">
              Bereich: pH ${indicator.range[0]} - ${indicator.range[1]}
            </div>
          </div>
        `;
      });
      html += '</div>';
    } else {
      html = `
        <div class="no-indicators" style="background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7;">
          <strong>Keine Indikatoren geeignet</strong>
          <div>Bei pH ${this.currentPH.toFixed(1)} sind keine Standardindikatoren im optimalen Bereich.</div>
        </div>
      `;
    }

    indicatorGrid.innerHTML = html;
  }

  animateToPH(targetPH) {
    const startPH = this.currentPH;
    const endPH = targetPH;
    const duration = 1000;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentPH = startPH + (endPH - startPH) * progress;

      this.currentPH = currentPH;
      document.getElementById('ph-slider').value = currentPH;
      document.getElementById('ph-value').textContent = currentPH.toFixed(1);

      this.updateVisualization();
      this.updateIndicators();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  startTitration(type) {
    this.titrationData = this.generateTitrationData(type);
    this.currentPoint = 0;
    this.animateTitration();
  }

  generateTitrationData(type) {
    const data = [];
    const points = 100;

    switch (type) {
      case 'strong-strong':
        for (let i = 0; i < points; i++) {
          const volume = (i / points) * 50;
          const ph = volume < 25 ? 1 + (volume / 25) * 6 : 7 + ((volume - 25) / 25) * 6;
          data.push({ volume, ph });
        }
        break;

      case 'strong-weak':
        for (let i = 0; i < points; i++) {
          const volume = (i / points) * 50;
          const ph = volume < 20 ? 1 + (volume / 20) * 5 : 6 + ((volume - 20) / 30) * 8;
          data.push({ volume, ph });
        }
        break;

      case 'weak-strong':
        for (let i = 0; i < points; i++) {
          const volume = (i / points) * 50;
          const ph = volume < 25 ? 4 + (volume / 25) * 2.5 : 6.5 + ((volume - 25) / 25) * 7.5;
          data.push({ volume, ph });
        }
        break;

      case 'weak-weak':
        for (let i = 0; i < points; i++) {
          const volume = (i / points) * 50;
          const ph = volume < 25 ? 4.5 + (volume / 25) * 1.5 : 6 + ((volume - 25) / 25) * 6;
          data.push({ volume, ph });
        }
        break;
    }

    return data;
  }

  animateTitration() {
    if (this.currentPoint >= this.titrationData.length) {
      document.getElementById('equivalence-point').textContent =
        this.titrationData[Math.floor(this.titrationData.length * 0.5)].volume.toFixed(1);
      return;
    }

    this.drawTitrationCurve();
    this.currentPoint += 2;

    requestAnimationFrame(() => this.animateTitration());
  }

  drawTitrationCurve() {
    const ctx = this.titrationCtx;
    const width = this.titrationCanvas.width;
    const height = this.titrationCanvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    ctx.lineTo(width - 30, height - 50);
    ctx.moveTo(50, height - 50);
    ctx.lineTo(50, 30);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Volumen Titrant (mL)', width / 2, height - 20);

    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('pH-Wert', 0, 0);
    ctx.restore();

    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 3;
    ctx.beginPath();

    this.titrationData.slice(0, this.currentPoint).forEach((point, index) => {
      const x = 50 + (point.volume / 50) * (width - 80);
      const y = height - 50 - (point.ph / 14) * (height - 100);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    for (let i = 0; i <= 14; i++) {
      const y = height - 50 - (i / 14) * (height - 100);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 30, y);
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(i.toString(), 45, y + 3);
      }
    }

    ctx.setLineDash([]);
  }

  resetTitration() {
    this.currentPoint = 0;
    this.titrationData = [];
    this.titrationCtx.clearRect(0, 0, this.titrationCanvas.width, this.titrationCanvas.height);
    document.getElementById('equivalence-point').textContent = '--';
    this.drawTitrationCurve();
  }

  startAnimation() {
    const animate = () => {
      this.updateVisualization();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector('.enhanced-ph-viz')) {
    const enhancedPHViz = new EnhancedPHVisualization();
    window.enhancedPHViz = enhancedPHViz;
  }
});
