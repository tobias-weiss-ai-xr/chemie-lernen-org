(function() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  const distCanvas = document.getElementById('distribution-canvas');
  const distCtx = distCanvas.getContext('2d');

  let animationId = null;
  let particles = [];
  let simulationRunning = false;
  let numParticles = 100;

  const gasTypes = {
    light: { mass: 4, name: 'Helium' },
    medium: { mass: 28, name: 'Stickstoff' },
    heavy: { mass: 32, name: 'Sauerstoff' },
    xheavy: { mass: 131, name: 'Xenon' }
  };

  let temperature = 20;
  let absoluteTemp = 293;
  let currentGas = 'heavy';

  function calculateAverageVelocity(tempK, massAU) {
    const R = 8.314;
    const v = Math.sqrt((8 * R * tempK) / (Math.PI * massAU / 1000));
    return v;
  }

  function maxwellBoltzmannDistribution(v, tempK, massAU) {
    const kB = 1.380649e-23;
    const m = massAU * 1.66054e-27;
    const exponent = (-m * v * v) / (2 * kB * tempK);
    return v * v * Math.exp(exponent);
  }

  function initializeParticles() {
    particles = [];

    const avgVelocity = calculateAverageVelocity(absoluteTemp, gasTypes[currentGas].mass);

    for (let i = 0; i < numParticles; i++) {
      const v = avgVelocity * (0.8 + Math.random() * 0.4);
      const theta = Math.random() * Math.PI * 2;

      particles.push({
        x: Math.random() * (canvas.width - 20) + 10,
        y: Math.random() * (canvas.height - 20) + 10,
        vx: v * Math.cos(theta) * 0.1,
        vy: v * Math.sin(theta) * 0.1,
        radius: 6 + Math.random() * 4,
        velocity: v,
        color: getVelocityColor(v, avgVelocity)
      });
    }

    updateDistributionCurve();
  }

  function getVelocityColor(v, avgV) {
    const ratio = v / avgV;
    const r = Math.min(255, Math.max(0, ratio * 255 * 0.8));
    const g = Math.min(255, Math.max(0, (2 - ratio) * 255 * 0.6));
    const b = Math.min(255, Math.max(0, (1 - ratio) * 200));
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawContainer();

    particles.forEach(p => {
      drawParticle(p);
    });

    drawVelocityScale();
  }

  function drawContainer() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f8f9fa';
    ctx.font = '14px Arial';
    ctx.fillText('Gas-Behälter (V = konstant)', canvas.width / 2 - 90, 20);
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = darkenColor(p.color, 30);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function darkenColor(color, percent) {
    const rgb = color.match(/\d+/g);
    if (!rgb) return color;
    const r = Math.max(0, Math.min(255, parseInt(rgb[0]) - percent));
    const g = Math.max(0, Math.min(255, parseInt(rgb[1]) - percent));
    const b = Math.max(0, Math.min(255, parseInt(rgb[2]) - percent));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawVelocityScale() {
    const scaleWidth = 200;
    const scaleHeight = 20;
    const scaleX = canvas.width - scaleWidth - 10;
    const scaleY = canvas.height - scaleHeight - 10;

    const gradient = ctx.createLinearGradient(scaleX, 0, scaleX + scaleWidth, 0);
    gradient.addColorStop(0, '#8888ff');
    gradient.addColorStop(0.5, '#ffaa88');
    gradient.addColorStop(1, '#ff4444');

    ctx.fillStyle = gradient;
    ctx.fillRect(scaleX, scaleY, scaleWidth, scaleHeight);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(scaleX, scaleY, scaleWidth, scaleHeight);

    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText('Langsam', scaleX - 10, scaleY + 15);
    ctx.fillText('Schnell', scaleX + scaleWidth - 15, scaleY + 15);

    const avgV = calculateAverageVelocity(absoluteTemp, gasTypes[currentGas].mass);
    const ratio = 0.5;
    const markerX = scaleX + ratio * scaleWidth;

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(markerX, scaleY - 5);
    ctx.lineTo(markerX, scaleY + scaleHeight + 5);
    ctx.stroke();

    ctx.fillText('Ø=' + avgV.toFixed(0) + ' m/s', markerX - 30, scaleY - 10);
  }

  function updateDistributionCurve() {
    distCtx.clearRect(0, 0, distCanvas.width, distCanvas.height);

    const avgV = calculateAverageVelocity(absoluteTemp, gasTypes[currentGas].mass);
    const width = distCanvas.width;
    const height = distCanvas.height;

    distCtx.strokeStyle = '#007bff';
    distCtx.lineWidth = 2;
    distCtx.beginPath();

    const maxVDisplay = avgV * 3;
    let started = false;

    const massAU = gasTypes[currentGas].mass;
    const kB = 1.380649e-23;
    const m = massAU * 1.66054e-27;
    const normalizationConstant = Math.sqrt((4 * m) / (Math.PI * kB * absoluteTemp));

    for (let i = 0; i <= 100; i++) {
      const ratio = i / 100;
      const v = ratio * maxVDisplay;

      const factor = maxwellBoltzmannDistribution(v, absoluteTemp, massAU) * normalizationConstant;
      const y = height * 0.9 - factor * height * 0.8;
      const x = width * 0.1 + ratio * width * 0.8;

      if (!started) {
        distCtx.moveTo(x, y);
        started = true;
      } else {
        distCtx.lineTo(x, y);
      }
    }

    distCtx.stroke();

    distCtx.fillStyle = 'rgba(0, 123, 255, 0.1)';
    distCtx.lineTo(width * 0.9, height * 0.9);
    distCtx.lineTo(width * 0.1, height * 0.9);
    distCtx.closePath();
    distCtx.fill();

    distCtx.fillStyle = '#333';
    distCtx.font = '10px Arial';
    distCtx.fillText('0', width * 0.1, height * 0.95);
    distCtx.fillText(maxVDisplay.toFixed(0) + ' m/s', width * 0.9 - 30, height * 0.95);
    distCtx.fillText('f(v)', width * 0.02, height * 0.2);
  }

  function updateParticles() {
    const avgV = calculateAverageVelocity(absoluteTemp, gasTypes[currentGas].mass);

    particles.forEach(p => {
      const thermalScaling = Math.sqrt(absoluteTemp / 293);
      p.vx = (p.vx / thermalScaling) * thermalScaling;
      p.vy = (p.vy / thermalScaling) * thermalScaling;

      p.x += p.vx;
      p.y += p.vy;

      const bounce = 1.0;

      if (p.x < p.radius) {
        p.x = p.radius;
        p.vx *= -1 * bounce;
      }
      if (p.x > canvas.width - p.radius) {
        p.x = canvas.width - p.radius;
        p.vx *= -1 * bounce;
      }
      if (p.y < p.radius) {
        p.y = p.radius;
        p.vy *= -1 * bounce;
      }
      if (p.y > canvas.height - p.radius) {
        p.y = canvas.height - p.radius;
        p.vy *= -1 * bounce;
      }

      const currentV = Math.sqrt(p.vx ** 2 + p.vy ** 2) * 10;
      p.velocity = currentV;
      p.color = getVelocityColor(currentV, avgV);

      const _nearWall = Math.abs(p.x - p.radius) < 2 || Math.abs(p.x - (canvas.width - p.radius)) < 2 || Math.abs(p.y - p.radius) < 2 || Math.abs(p.y - (canvas.height - p.radius)) < 2;
    });
  }

  function updateThermodynamicParameters() {
    const avgV = calculateAverageVelocity(absoluteTemp, gasTypes[currentGas].mass);
    const avgEkPerMol = 1.5 * 8.314 * absoluteTemp;
    const collisionRate = Math.round(Math.sqrt(avgV / 400) * 1.2e9);

    document.getElementById('temp-display-celsius').textContent = `${temperature}°C`;
    document.getElementById('temp-display-kelvin').textContent = `${Math.round(absoluteTemp)}K`;

    let tempClass;
    if (temperature < 0) tempClass = 'Tief';
    else if (temperature < 25) tempClass = 'Kalt';
    else if (temperature < 100) tempClass = 'Raumtemperatur';
    else if (temperature < 250) tempClass = 'Heiß';
    else tempClass = 'Extrem heiß';
    document.getElementById('temp-display-class').textContent = tempClass;

    document.getElementById('param-temp').textContent = temperature;
    document.getElementById('param-abs-temp').textContent = Math.round(absoluteTemp);
    document.getElementById('param-particles').textContent = numParticles;
    document.getElementById('param-mass').textContent = gasTypes[currentGas].mass;
    document.getElementById('param-velocity').textContent = avgV.toFixed(0);
    document.getElementById('param-energy').textContent = avgEkPerMol.toFixed(0);
    document.getElementById('param-collisions').textContent = collisionRate.toExponential(1);
  }

  function animate() {
    if (simulationRunning) {
      updateParticles();
    }

    draw();

    if (simulationRunning) {
      animationId = requestAnimationFrame(animate);
    }
  }

  function startSimulation() {
    if (!simulationRunning) {
      if (particles.length === 0) {
        initializeParticles();
      }
      simulationRunning = true;
      animate();
    }
  }

  function stopSimulation() {
    simulationRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function resetSimulation() {
    stopSimulation();
    initializeParticles();
    draw();
    updateThermodynamicParameters();
  }

  function updateTemperature() {
    temperature = parseInt(document.getElementById('temperature-slider').value);
    absoluteTemp = temperature + 273.15;
    updateThermodynamicParameters();
    updateDistributionCurve();
  }

  function updateParticleCount() {
    const newCount = parseInt(document.getElementById('particle-count').value);
    numParticles = Math.max(10, Math.min(300, newCount));
    resetSimulation();
  }

  function updateGasType() {
    currentGas = document.getElementById('gas-mass').value;
    resetSimulation();
  }

  function init() {
    initializeParticles();
    updateThermodynamicParameters();
    draw();
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
  });

  window.startSimulation = startSimulation;
  window.stopSimulation = stopSimulation;
  window.resetSimulation = resetSimulation;
  window.updateTemperature = updateTemperature;
  window.updateParticleCount = updateParticleCount;
  window.updateGasType = updateGasType;

})();