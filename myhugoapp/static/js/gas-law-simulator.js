class InteractiveGasLawSimulator {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.temperature = 300;
    this.pressure = 1.0;
    this.volume = 22.4;
    this.animationId = null;
    this.selectedLaw = 'boyle';

    this.R = 0.08206;
    this.n = 1.0;

    this.particleCount = 50;
    this.maxSpeed = 2;
    this.containerSize = { width: 600, height: 400 };

    this.init();
  }

  init() {
    this.createVisualization();
    this.createControls();
    this.initializeParticles();
    this.startAnimation();
  }

  createVisualization() {
    const container = document.querySelector('.gas-law-simulator');
    if (!container) {
      console.warn('Gas law simulator container not found');
      return;
    }

    this.container = container;

    const canvas = document.createElement('canvas');
    canvas.width = this.containerSize.width;
    canvas.height = this.containerSize.height;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.border = '2px solid #28a745';
    canvas.style.borderRadius = '8px';
    canvas.style.backgroundColor = '#f8f9fa';
    canvas.style.margin = '20px 0';

    container.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  createControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'gas-law-controls';
    controlsDiv.style.cssText = `
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #dee2e6;
    `;

    controlsDiv.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h4>Gasgesetz wählen:</h4>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-success" data-law="boyle">
              Boyle-Mariotte
            </button>
            <button type="button" class="btn btn-outline-success" data-law="gaylussac">
              Gay-Lussac
            </button>
            <button type="button" class="btn btn-outline-success" data-law="ideal">
              Ideales Gasgesetz
            </button>
          </div>
        </div>
        <div class="col-md-6">
          <h4>Zustandsgrößen:</h4>
          <div class="state-display">
            <div class="state-item">
              <label>Temperatur:</label>
              <input type="range" id="temp-slider" min="200" max="500" value="300" step="10">
              <span id="temp-display">300 K</span>
            </div>
            <div class="state-item">
              <label>Druck:</label>
              <input type="range" id="pressure-slider" min="0.5" max="3.0" value="1.0" step="0.1">
              <span id="pressure-display">1.0 atm</span>
            </div>
            <div class="state-item">
              <label>Volumen:</label>
              <input type="range" id="volume-slider" min="10" max="40" value="22.4" step="0.5">
              <span id="volume-display">22.4 L</span>
            </div>
          </div>
        </div>
      </div>
      <div class="row" style="margin-top: 20px;">
        <div class="col-md-12">
          <div class="formula-display" style="background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center;">
            <h5 id="law-formula">p₁V₁ = p₂V₂ (T = konstant)</h5>
            <p id="law-explanation">Bei konstanter Temperatur sind Druck und Volumen umgekehrt proportional.</p>
          </div>
        </div>
      </div>
      <div class="row" style="margin-top: 15px;">
        <div class="col-md-12">
          <div class="calculation-results" id="calculation-results">
            <h5>Berechnungen:</h5>
            <div id="results-content"></div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(controlsDiv);

    // Add event listeners
    this.attachControlListeners();
    this.updateDisplay();
  }

  attachControlListeners() {
    const lawButtons = document.querySelectorAll('[data-law]');
    lawButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        lawButtons.forEach((btn) => {
          btn.classList.remove('btn-success');
          btn.classList.add('btn-outline-success');
        });
        e.target.classList.remove('btn-outline-success');
        e.target.classList.add('btn-success');

        this.selectedLaw = e.target.dataset.law;
        this.updateLawDisplay();
        this.updateCalculations();
      });
    });

    const tempSlider = document.getElementById('temp-slider');
    const pressureSlider = document.getElementById('pressure-slider');
    const volumeSlider = document.getElementById('volume-slider');

    tempSlider.addEventListener('input', (e) => {
      this.temperature = parseFloat(e.target.value);
      this.updateDisplay();
      this.applyGasLaw();
      this.updateCalculations();
    });

    pressureSlider.addEventListener('input', (e) => {
      this.pressure = parseFloat(e.target.value);
      this.updateDisplay();
      this.applyGasLaw();
      this.updateCalculations();
    });

    volumeSlider.addEventListener('input', (e) => {
      this.volume = parseFloat(e.target.value);
      this.updateDisplay();
      this.applyGasLaw();
      this.updateCalculations();
    });
  }

  initializeParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.maxSpeed,
        vy: (Math.random() - 0.5) * this.maxSpeed,
        radius: 4,
        color: this.getParticleColor(),
      });
    }
  }

  getParticleColor() {
    const tempNormalized = (this.temperature - 200) / 300;
    const r = Math.round(255 * tempNormalized);
    const b = Math.round(255 * (1 - tempNormalized));
    return `rgb(${r}, 100, ${b})`;
  }

  updateDisplay() {
    document.getElementById('temp-display').textContent = `${this.temperature} K`;
    document.getElementById('pressure-display').textContent = `${this.pressure.toFixed(1)} atm`;
    document.getElementById('volume-display').textContent = `${this.volume.toFixed(1)} L`;
  }

  updateLawDisplay() {
    const formulaEl = document.getElementById('law-formula');
    const explanationEl = document.getElementById('law-explanation');

    switch (this.selectedLaw) {
      case 'boyle':
        formulaEl.textContent = 'p₁V₁ = p₂V₂ (T = konstant)';
        explanationEl.textContent =
          'Bei konstanter Temperatur sind Druck und Volumen umgekehrt proportional.';
        break;
      case 'gaylussac':
        formulaEl.textContent = 'V/T = konstant (p = konstant) oder p/T = konstant (V = konstant)';
        explanationEl.textContent =
          'Bei konstantem Druck sind Volumen und Temperatur direkt proportional.';
        break;
      case 'ideal':
        formulaEl.textContent = 'pV = nRT';
        explanationEl.textContent =
          'Das ideale Gasgesetz beschreibt den Zusammenhang aller Zustandsgrößen.';
        break;
    }
  }

  applyGasLaw() {
    const tempFactor = this.temperature / 300;
    const pressureFactor = this.pressure;
    const volumeFactor = 22.4 / this.volume;

    this.maxSpeed = 2 * tempFactor;

    const targetCount = Math.round(this.particleCount * pressureFactor * volumeFactor);
    while (this.particles.length < targetCount) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.maxSpeed,
        vy: (Math.random() - 0.5) * this.maxSpeed,
        radius: 4,
        color: this.getParticleColor(),
      });
    }
    while (this.particles.length > targetCount) {
      this.particles.pop();
    }

    this.particles.forEach((particle) => {
      particle.color = this.getParticleColor();
    });
  }

  updateCalculations() {
    const resultsDiv = document.getElementById('results-content');
    let html = '';

    switch (this.selectedLaw) {
      case 'boyle':
        const p1V1 = this.pressure * this.volume;
        const newPressure1 = p1V1 / (this.volume * 0.8);
        const newPressure2 = p1V1 / (this.volume * 1.2);
        html = `
          <div class="calc-item">
            <strong>Boyle-Mariotte Gesetz:</strong>
            <br>p₁V₁ = p₂V₂ = ${p1V1.toFixed(2)} L·atm
          </div>
          <div class="calc-item">
            <strong>Bei Volumenreduktion um 20%:</strong>
            <br>p₂ = ${newPressure1.toFixed(2)} atm
          </div>
          <div class="calc-item">
            <strong>Bei Volumenvergrößerung um 20%:</strong>
            <br>p₂ = ${newPressure2.toFixed(2)} atm
          </div>
        `;
        break;

      case 'gaylussac':
        const constVT = this.volume / this.temperature;
        const constPT = this.pressure / this.temperature;
        const newVolume1 = constVT * (this.temperature + 50);
        const newPressureGayLussac = constPT * (this.temperature + 50);
        html = `
          <div class="calc-item">
            <strong>Gay-Lussac Gesetz:</strong>
            <br>V/T = ${constVT.toFixed(4)} L/K (bei p = konstant)
            <br>p/T = ${constPT.toFixed(4)} atm/K (bei V = konstant)
          </div>
          <div class="calc-item">
            <strong>Bei Temperaturerhöhung auf ${this.temperature + 50} K:</strong>
            <br>V₂ = ${newVolume1.toFixed(2)} L (bei p = konstant)
            <br>p₂ = ${newPressureGayLussac.toFixed(2)} atm (bei V = konstant)
          </div>
        `;
        break;

      case 'ideal':
        const pv = this.pressure * this.volume;
        const nrt = this.n * this.R * this.temperature;
        const nCalculated = pv / (this.R * this.temperature);
        html = `
          <div class="calc-item">
            <strong>Ideales Gasgesetz:</strong>
            <br>pV = ${pv.toFixed(2)} L·atm
            <br>nRT = ${nrt.toFixed(2)} L·atm
            <br>n = ${nCalculated.toFixed(4)} mol
          </div>
          <div class="calc-item">
            <strong>Bei Normbedingungen (273.15 K, 1 atm):</strong>
            <br>V = ${(22.414 * nCalculated).toFixed(2)} L
          </div>
        `;
        break;
    }

    resultsDiv.innerHTML = html;
  }

  startAnimation() {
    const animate = () => {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  update() {
    this.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x - particle.radius <= 0 || particle.x + particle.radius >= this.canvas.width) {
        particle.vx = -particle.vx;
        particle.x = Math.max(
          particle.radius,
          Math.min(this.canvas.width - particle.radius, particle.x)
        );
      }
      if (particle.y - particle.radius <= 0 || particle.y + particle.radius >= this.canvas.height) {
        particle.vy = -particle.vy;
        particle.y = Math.max(
          particle.radius,
          Math.min(this.canvas.height - particle.radius, particle.y)
        );
      }

      particle.vx += (Math.random() - 0.5) * 0.1;
      particle.vy += (Math.random() - 0.5) * 0.1;

      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      if (speed > this.maxSpeed) {
        particle.vx = (particle.vx / speed) * this.maxSpeed;
        particle.vy = (particle.vy / speed) * this.maxSpeed;
      }
    });
  }

  draw() {
    this.ctx.fillStyle = '#f8f9fa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#28a745';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle) => {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();

      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = particle.color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    this.ctx.strokeStyle = 'rgba(40, 167, 69, 0.2)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 50) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector('.gas-law-simulator')) {
    const gasSimulator = new InteractiveGasLawSimulator();
    window.gasSimulator = gasSimulator;
  }
});
