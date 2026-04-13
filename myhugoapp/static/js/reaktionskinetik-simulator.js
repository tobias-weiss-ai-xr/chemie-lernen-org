/**
 * Reaktionskinetik Simulator
 * Particle simulations and collision theory visualization
 */

const GAS_CONSTANT = 8.314;
// eslint-disable-next-line no-unused-vars
const BOLTZMANN = 1.380649e-23;
const MASS_AMU = 1.660539e-27;

let temperature = 300;
let particleCount = 200;
let collisionThreshold = 0.5;
let concentration = 1.0;
let isKineticsAnimating = false;
let isCollisionAnimating = false;

const domCache = {
  temperature: {
    slider: null,
    display: null,
    countSlider: null,
    countDisplay: null,
    btn: null,
    btnText: null,
    avgVelocity: null,
    collisionFreq: null,
    canvas: null,
  },
  collision: {
    thresholdSlider: null,
    thresholdDisplay: null,
    concSlider: null,
    concDisplay: null,
    crossSlider: null,
    crossDisplay: null,
    btn: null,
    btnText: null,
    totalCollisions: null,
    effectiveCollisions: null,
    reactionRate: null,
    canvas: null,
  },
  arrhenius: {
    ea: null,
    preexp: null,
    tempMin: null,
    tempMax: null,
    tempSteps: null,
    k300: null,
    k600: null,
    factor: null,
    canvas: null,
  },
};

const particles = [];
// eslint-disable-next-line no-unused-vars
const MAX_PARTICLES = 500;

class Particle {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 3;
    this.mass = 1;
    this.color = this.getRandomColor();
  }

  getRandomColor() {
    const colors = ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(temperature) {
    const velocityScale = Math.sqrt(temperature / 300);
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) * velocityScale;
    const angle = Math.atan2(this.vy, this.vx);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  draw(ctx, _width, _height) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function initDOMCache() {
  domCache.temperature.slider = document.getElementById('temperature-slider');
  domCache.temperature.display = document.getElementById('temp-kinetics-display');
  domCache.temperature.countSlider = document.getElementById('particle-count');
  domCache.temperature.countDisplay = document.getElementById('particle-count-display');
  domCache.temperature.btn = document.getElementById('start-kinetics');
  domCache.temperature.btnText = document.getElementById('kinetics-btn-text');
  domCache.temperature.avgVelocity = document.getElementById('avg-velocity');
  domCache.temperature.collisionFreq = document.getElementById('collision-frequency');
  domCache.temperature.canvas = document.getElementById('temperature-canvas');

  domCache.collision.thresholdSlider = document.getElementById('collision-threshold');
  domCache.collision.thresholdDisplay = document.getElementById('collision-threshold-display');
  domCache.collision.concSlider = document.getElementById('concentration-slider');
  domCache.collision.concDisplay = document.getElementById('concentration-display');
  domCache.collision.crossSlider = document.getElementById('cross-section-slider');
  domCache.collision.crossDisplay = document.getElementById('cross-section-display');
  domCache.collision.btn = document.getElementById('start-collision');
  domCache.collision.btnText = document.getElementById('collision-btn-text');
  domCache.collision.totalCollisions = document.getElementById('total-collisions');
  domCache.collision.effectiveCollisions = document.getElementById('effective-collisions');
  domCache.collision.reactionRate = document.getElementById('reaction-rate');
  domCache.collision.canvas = document.getElementById('collision-canvas');

  domCache.arrhenius.ea = document.getElementById('arrhenius-ea');
  domCache.arrhenius.preexp = document.getElementById('arrhenius-preexp');
  domCache.arrhenius.tempMin = document.getElementById('temp-min');
  domCache.arrhenius.tempMax = document.getElementById('temp-max');
  domCache.arrhenius.tempSteps = document.getElementById('temp-steps');
  domCache.arrhenius.k300 = document.getElementById('arrhenius-k-300');
  domCache.arrhenius.k600 = document.getElementById('arrhenius-k-600');
  domCache.arrhenius.factor = document.getElementById('arrhenius-factor');
  domCache.arrhenius.canvas = document.getElementById('arrhenius-plot-canvas');
}

function calculateAverageVelocity(T) {
  const m = MASS_AMU * 28;
  const vAvg = Math.sqrt((8 * GAS_CONSTANT * T) / (Math.PI * m));
  return vAvg;
}

function calculateCollisionFrequency(T, conc, crossSection) {
  const vAvg = calculateAverageVelocity(T);
  const frequency = vAvg * conc * crossSection * 1e-15;
  return frequency;
}

function calculateRateConstant(T, Ea, A) {
  const EaJ = Ea * 1000;
  const k = A * Math.exp(-EaJ / (GAS_CONSTANT * T));
  return k;
}

function initParticles() {
  particles.length = 0;

  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * 600 + 50;
    const y = Math.random() * 300 + 50;
    const v = calculateAverageVelocity(temperature) / 10;
    const angle = Math.random() * 2 * Math.PI;
    const vx = Math.cos(angle) * v;
    const vy = Math.sin(angle) * v;
    particles.push(new Particle(x, y, vx, vy));
  }
}

function updateTemperatureSimulation() {
  temperature = parseInt(domCache.temperature.slider.value);
  particleCount = parseInt(domCache.temperature.countSlider.value);

  domCache.temperature.display.textContent = `${temperature} K`;
  domCache.temperature.countDisplay.textContent = particleCount;

  const vAvg = calculateAverageVelocity(temperature);
  domCache.temperature.avgVelocity.textContent = `${vAvg.toFixed(0)} m/s`;

  const freq = calculateCollisionFrequency(temperature, concentration, 0.1);
  const freqDisplay = formatScientific(freq);
  domCache.temperature.collisionFreq.textContent = freqDisplay;

  initParticles();
  drawTemperatureCanvas();
}

function drawTemperatureCanvas() {
  const canvas = domCache.temperature.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const _speedScale = Math.sqrt(temperature / 300);

  particles.forEach((particle) => {
    particle.update(temperature);
    particle.draw(ctx, width, height);
  });

  const vAvg = calculateAverageVelocity(temperature);

  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Mittlere Geschwindigkeit: ${vAvg.toFixed(0)} m/s`, 10, 30);
  ctx.fillText(`Anzahl Teilchen: ${particleCount}`, 10, 50);
  ctx.fillText(`Temperatur: ${temperature} K (${temperature - 273}°C)`, 10, 70);
}

// eslint-disable-next-line no-unused-vars
function toggleKineticsAnimation() {
  isKineticsAnimating = !isKineticsAnimating;

  if (isKineticsAnimating) {
    domCache.temperature.btnText.textContent = 'Stopp';
    domCache.temperature.btn.className = 'btn btn-danger';
    animateTemperature();
  } else {
    domCache.temperature.btnText.textContent = 'Start';
    domCache.temperature.btn.className = 'btn btn-primary';
  }
}

function animateTemperature() {
  if (!isKineticsAnimating) return;

  function animate() {
    if (!isKineticsAnimating) return;

    const _time = Date.now() * 0.001;

    particles.forEach((particle) => {
      particle.update(temperature);
    });

    const canvas = domCache.temperature.canvas;
    if (canvas) {
      drawTemperatureCanvas();
    }

    requestAnimationFrame(animate);
  }

  animate();
}

function updateCollisionSimulation() {
  collisionThreshold = parseFloat(domCache.collision.thresholdSlider.value);
  concentration = parseFloat(domCache.collision.concSlider.value);
  const crossSection = parseFloat(domCache.collision.crossSlider.value);

  domCache.collision.thresholdDisplay.textContent = `${collisionThreshold} eV`;
  domCache.collision.concDisplay.textContent = `${concentration} mol/L`;
  domCache.collision.crossDisplay.textContent = `${crossSection} Å²`;

  initParticles();
  drawCollisionCanvas();
}

function drawCollisionCanvas() {
  const canvas = domCache.collision.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const effectiveThreshold = collisionThreshold;
  const _velocityScale = Math.sqrt(temperature / 300);

  particles.forEach((particle) => {
    particle.update(temperature);
    particle.draw(ctx, width, height);
  });

  let totalCollisions = 0;
  let effectiveCollisions = 0;

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[j].x - particles[i].x;
      const dy = particles[j].y - particles[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < particles[i].radius + particles[j].radius) {
        totalCollisions++;

        const relativeVelocity = Math.sqrt(
          Math.pow(particles[i].vx - particles[j].vx, 2) +
            Math.pow(particles[i].vy - particles[j].vy, 2)
        );

        const kineticEnergy = 0.5 * relativeVelocity * relativeVelocity;

        if (kineticEnergy > effectiveThreshold) {
          effectiveCollisions++;
        }
      }
    }
  }

  const reactionRate = calculateCollisionFrequency(temperature, concentration, 0.1);
  const rateDisplay = formatScientific(reactionRate);

  domCache.collision.totalCollisions.textContent = totalCollisions;
  domCache.collision.effectiveCollisions.textContent = effectiveCollisions;
  domCache.collision.reactionRate.textContent = rateDisplay;
}

// eslint-disable-next-line no-unused-vars
function toggleCollisionAnimation() {
  isCollisionAnimating = !isCollisionAnimating;

  if (isCollisionAnimating) {
    domCache.collision.btnText.textContent = 'Stopp';
    domCache.collision.btn.className = 'btn btn-danger';
    animateCollision();
  } else {
    domCache.collision.btnText.textContent = 'Start';
    domCache.collision.btn.className = 'btn btn-success';
  }
}

function animateCollision() {
  if (!isCollisionAnimating) return;

  function animate() {
    if (!isCollisionAnimating) return;

    particles.forEach((particle, _i) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      const canvas = domCache.collision.canvas;
      const width = canvas.width;
      const height = canvas.height;

      if (particle.x < particle.radius) {
        particle.vx = Math.abs(particle.vx);
        particle.x = particle.radius;
      } else if (particle.x > width - particle.radius) {
        particle.vx = -Math.abs(particle.vx);
        particle.x = width - particle.radius;
      }

      if (particle.y < particle.radius) {
        particle.vy = Math.abs(particle.vy);
        particle.y = particle.radius;
      } else if (particle.y > height - particle.radius) {
        particle.vy = -Math.abs(particle.vy);
        particle.y = height - particle.radius;
      }
    });

    drawCollisionCanvas();

    requestAnimationFrame(animate);
  }

  animate();
}

function updateArrheniusPlot() {
  const Ea = parseFloat(domCache.arrhenius.ea.value);
  const preexp = parseFloat(domCache.arrhenius.preexp.value);
  const tempMin = parseInt(domCache.arrhenius.tempMin.value);
  const tempMax = parseInt(domCache.arrhenius.tempMax.value);
  const tempSteps = parseInt(domCache.arrhenius.tempSteps.value);

  const k300 = calculateRateConstant(300, Ea, preexp);
  const k600 = calculateRateConstant(600, Ea, preexp);
  const factor = k600 / k300;

  domCache.arrhenius.k300.textContent = formatScientific(k300);
  domCache.arrhenius.k600.textContent = formatScientific(k600);
  domCache.arrhenius.factor.textContent = factor.toFixed(0);

  drawArrheniusPlot(Ea, preexp, tempMin, tempMax, tempSteps);
}

function drawArrheniusPlot(Ea, A, tempMin, tempMax, steps) {
  const canvas = domCache.arrhenius.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = 60;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  function toCanvasX(T) {
    return padding + ((T - tempMin) / (tempMax - tempMin)) * graphWidth;
  }

  function toCanvasY(k) {
    const maxLogK = Math.log10(A * Math.exp(-Ea / (GAS_CONSTANT * tempMin)));
    const minLogK = Math.log10(calculateRateConstant(tempMax, Ea, A));
    return height - padding - ((Math.log10(k) - minLogK) / (maxLogK - minLogK)) * graphHeight;
  }

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, padding);
  ctx.stroke();

  ctx.strokeStyle = '#e0e0e0';
  ctx.beginPath();

  for (let i = 0; i <= 10; i++) {
    const y = padding + (i / 10) * graphHeight;
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    const T = tempMin + (i / 10) * (tempMax - tempMin);
    const labelTemp = Math.round(T);
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${labelTemp} K`, padding, y + 15);
  }

  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 3;
  ctx.beginPath();

  const temperatureValues = [];
  for (let i = 0; i <= steps; i++) {
    const T = tempMin + (i / steps) * (tempMax - tempMin);
    temperatureValues.push(T);
  }

  const dataPoints = temperatureValues.map((T) => {
    const k = calculateRateConstant(T, Ea, A);
    return { T, k };
  });

  dataPoints.sort((a, b) => a.T - b.T);

  let firstPoint = true;
  dataPoints.forEach((point, _index) => {
    const x = toCanvasX(point.T);
    const y = toCanvasY(point.k);

    if (firstPoint) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      firstPoint = false;
    } else {
      ctx.lineTo(x, y);
    }

    const kDisplay = formatScientific(point.k);
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(kDisplay, x, y - 15);
  });

  ctx.stroke();

  ctx.fillStyle = '#666';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ln(k)', width / 2, height - 20);

  ctx.fillStyle = '#666';
  ctx.textAlign = 'center';
  ctx.fillText('1/T', 15, height / 2);
}

function formatScientific(num) {
  if (num === 0) return '0';

  const exponent = Math.floor(Math.log10(Math.abs(num)));
  const mantissa = num / Math.pow(10, exponent);

  return `${mantissa.toFixed(2)} × 10${superscript(exponent)}`;
}

function superscript(n) {
  const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const minus = '⁻';

  let result = '';
  const numStr = Math.abs(n).toString();

  if (n < 0) result += minus;

  for (let i = 0; i < numStr.length; i++) {
    const digit = parseInt(numStr[i]);
    if (digit >= 0 && digit <= 9) {
      result += superscripts[digit];
    }
  }

  return result;
}

document.addEventListener('DOMContentLoaded', function () {
  initDOMCache();
  updateTemperatureSimulation();
  updateCollisionSimulation();
  updateArrheniusPlot();
});
