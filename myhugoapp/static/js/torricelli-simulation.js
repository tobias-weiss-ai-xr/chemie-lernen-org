/**
 * Torricelli's Experiment - Atmospheric Pressure Simulation
 * Interactive visualization of the historical barometer experiment
 */

class TorricelliSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.planetSelect = document.getElementById('planetSelect');
    this.pressureSlider = document.getElementById('atmosphericPressure');
    this.pressureValue = document.getElementById('pressureValue');
    this.mercuryHeight = document.getElementById('mercuryHeight');
    this.pressureMmHg = document.getElementById('pressureMmHg');
    this.pressurePa = document.getElementById('pressurePa');

    // Planet data (gravity in m/s²)
    this.planets = {
      earth: { name: 'Erde', gravity: 9.81, icon: '🌍' },
      moon: { name: 'Mond', gravity: 1.62, icon: '🌑' },
      mars: { name: 'Mars', gravity: 3.71, icon: '🔴' },
      venus: { name: 'Venus', gravity: 8.87, icon: '🟡' },
      mercury: { name: 'Merkur', gravity: 3.7, icon: '⚫' },
      jupiter: { name: 'Jupiter', gravity: 24.79, icon: '🟤' },
    };

    // Constants
    this.mercuryDensity = 13534; // kg/m³
    this.standardPressure = 101325; // Pa (1 atm)
    this.mercuryColumnStandard = 0.76; // m (760 mm)

    // Current state
    this.currentPlanet = 'earth';
    this.currentPressure = 1013; // hPa
    this.currentHeight = 760; // mm

    this.setupCanvas();
    this.addEventListeners();
    this.update();
  }

  setupCanvas() {
    // Set canvas size
    const container = this.canvas.parentElement;
    const width = Math.min(container.clientWidth - 60, 600);
    const height = 500;

    this.canvas.width = width;
    this.canvas.height = height;

    // For high DPI displays
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  addEventListeners() {
    if (this.planetSelect) {
      this.planetSelect.addEventListener('change', (e) => {
        this.currentPlanet = e.target.value;
        this.update();
      });
    }

    if (this.pressureSlider) {
      this.pressureSlider.addEventListener('input', (e) => {
        this.currentPressure = parseInt(e.target.value);
        this.pressureValue.textContent = this.currentPressure + ' hPa';
        this.update();
      });
    }

    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.draw();
    });
  }

  calculateMercuryHeight() {
    // Convert pressure from hPa to Pa
    const pressurePa = this.currentPressure * 100;

    // Calculate mercury column height using p = ρgh
    // h = p / (ρg)
    const planet = this.planets[this.currentPlanet];
    const height = pressurePa / (this.mercuryDensity * planet.gravity);

    // Convert to mm
    return height * 1000;
  }

  update() {
    // Calculate new height based on pressure and planet
    this.currentHeight = this.calculateMercuryHeight();

    // Update display values
    this.mercuryHeight.textContent = Math.round(this.currentHeight) + ' mm';
    this.pressureMmHg.textContent = Math.round(this.currentHeight) + ' mmHg';
    this.pressurePa.textContent = (this.currentPressure * 100).toLocaleString('de-DE') + ' Pa';

    // Redraw canvas
    this.draw();
  }

  draw() {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const tubeWidth = 60;
    const bowlWidth = 200;
    const bowlHeight = 100;
    const tubeHeight = 350;
    const bowlY = height - 80;
    const tubeY = bowlY - bowlHeight + 20;

    // Calculate mercury height in pixels (scale to fit)
    const maxMmHeight = 2000; // Jupiter max height ~1920mm
    const scale = (tubeHeight - 40) / maxMmHeight;
    const mercuryPixels = this.currentHeight * scale;

    // Draw title
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    const planet = this.planets[this.currentPlanet];
    this.ctx.fillText(`${planet.icon} ${planet.name} - Torricelli-Versuch`, centerX, 30);

    // Draw glass tube
    this.drawTube(centerX - tubeWidth / 2, tubeY, tubeWidth, tubeHeight);

    // Draw bowl
    this.drawBowl(centerX - bowlWidth / 2, bowlY - bowlHeight + 20, bowlWidth, bowlHeight);

    // Draw mercury in tube
    const mercuryTubeY = tubeY + tubeHeight - mercuryPixels;
    this.drawMercuryInTube(
      centerX - tubeWidth / 2 + 5,
      mercuryTubeY,
      tubeWidth - 10,
      mercuryPixels
    );

    // Draw mercury in bowl
    this.drawMercuryInBowl(
      centerX - bowlWidth / 2 + 10,
      bowlY - bowlHeight + 30,
      bowlWidth - 20,
      bowlHeight - 30
    );

    // Draw measurements
    this.drawMeasurements(centerX + tubeWidth / 2 + 10, mercuryTubeY, mercuryPixels);

    // Draw vacuum label
    if (mercuryPixels < tubeHeight - 20) {
      this.ctx.fillStyle = '#666';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Vakuum', centerX, tubeY + (tubeHeight - mercuryPixels) / 2);
    }
  }

  drawTube(x, y, width, height) {
    // Glass tube effect
    const gradient = this.ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, 'rgba(200, 220, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(200, 220, 255, 0.3)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width, height);

    // Glass outline
    this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Top of tube (closed)
    this.ctx.fillStyle = 'rgba(150, 180, 220, 0.5)';
    this.ctx.fillRect(x, y - 5, width, 5);
  }

  drawBowl(x, y, width, height) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    // Draw bowl shape
    this.ctx.quadraticCurveTo(x, y + height, x + width / 2, y + height);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width, y);
    this.ctx.closePath();

    // Glass effect
    const gradient = this.ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, 'rgba(200, 220, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(200, 220, 255, 0.3)');

    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Outline
    this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  drawMercuryInTube(x, y, width, height) {
    if (height <= 0) return;

    // Mercury color
    this.ctx.fillStyle = '#C0C0C0';

    // Main mercury column
    this.ctx.fillRect(x, y, width, height);

    // Mercury shine effect
    const gradient = this.ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width, height);

    // Meniscus (curved surface at top)
    this.ctx.beginPath();
    this.ctx.ellipse(x + width / 2, y + 5, width / 2, 5, 0, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#D0D0D0';
    this.ctx.fill();
  }

  drawMercuryInBowl(x, y, width, height) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    // Draw bowl shape filled with mercury
    this.ctx.quadraticCurveTo(x, y + height, x + width / 2, y + height);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width, y);
    this.ctx.closePath();

    // Mercury color
    this.ctx.fillStyle = '#B0B0B0';
    this.ctx.fill();

    // Shine effect
    const gradient = this.ctx.createRadialGradient(
      x + width * 0.3,
      y + height * 0.3,
      0,
      x + width / 2,
      y + height / 2,
      width / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  drawMeasurements(x, topY, height) {
    const mm = Math.round(height);

    this.ctx.fillStyle = '#333';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';

    // Draw measurement line
    this.ctx.strokeStyle = '#667eea';
    this.ctx.lineWidth = 2;

    // Top line
    this.ctx.beginPath();
    this.ctx.moveTo(x, topY);
    this.ctx.lineTo(x + 30, topY);
    this.ctx.stroke();

    // Bottom line
    this.ctx.beginPath();
    this.ctx.moveTo(x, topY + height);
    this.ctx.lineTo(x + 30, topY + height);
    this.ctx.stroke();

    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(x + 15, topY);
    this.ctx.lineTo(x + 15, topY + height);
    this.ctx.stroke();

    // Text
    this.ctx.fillText(`${mm} mm`, x + 40, topY + height / 2 + 5);

    // Arrow indicating pressure
    this.drawArrow(x + 50, topY + height + 30, '↓');
    this.ctx.fillText('Luftdruck', x + 65, topY + height + 35);
  }

  drawArrow(x, y, direction) {
    this.ctx.fillStyle = '#667eea';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(direction, x, y);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TorricelliSimulation('torricelliCanvas');
});
