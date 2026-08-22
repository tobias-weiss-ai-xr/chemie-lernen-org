(function () {
  const canvas = document.getElementById('convection-canvas');
  const ctx = canvas.getContext('2d');
  let animationId = null;
  let particles = [];
  let simulationRunning = false;
  let elapsedTime = 0;
  let numParticles = 80;

  const fluids = {
    water: {
      name: 'Wasser',
      density: 1.0,
      viscosity: 1.0,
      buoyancy: 3.0,
      particleRadius: 8,
      particleCount: 80,
    },
    air: {
      name: 'Luft',
      density: 0.0012,
      viscosity: 0.1,
      buoyancy: 1.5,
      particleRadius: 5,
      particleCount: 60,
    },
    oil: {
      name: 'Öl',
      density: 0.9,
      viscosity: 2.5,
      buoyancy: 2.5,
      particleRadius: 8,
      particleCount: 70,
    },
    glycerin: {
      name: 'Glycerin',
      density: 1.26,
      viscosity: 5.0,
      buoyancy: 1.5,
      particleRadius: 8,
      particleCount: 50,
    },
  };

  let currentFluid = 'water';
  let sourceTemp = 80;
  let ambientTemp = 20;
  let viscosityMultiplier = 1.0;

  function initializeParticles() {
    const fluid = fluids[currentFluid];
    numParticles = fluid.particleCount;
    particles = [];

    for (let i = 0; i < numParticles; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      let temperature;
      if (y > canvas.height * 0.8) {
        temperature = 0.5 + Math.random() * 0.5;
      } else {
        temperature = Math.random() * 0.3;
      }

      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        radius: fluid.particleRadius,
        temperature: temperature,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHeatSource();
    drawColdSurface();

    particles.forEach((p) => {
      drawParticle(p);
    });

    drawConvectionArrows();
  }

  function drawHeatSource() {
    const gradient = ctx.createLinearGradient(0, canvas.height * 0.8, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(255, ${255 - sourceTemp * 2.5}, 0, 0.3)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);

    ctx.fillStyle = '#ff6b6b';
    ctx.font = '16px Arial';
    ctx.fillText('Temperatur: ' + sourceTemp + '°C', 10, canvas.height - 10);
  }

  function drawColdSurface() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.15);
    gradient.addColorStop(0, `rgba(0, 100, 200, 0.3)`);
    gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.15);

    ctx.fillStyle = '#4a90d9';
    ctx.font = '16px Arial';
    ctx.fillText('Temperatur: ' + ambientTemp + '°C', 10, 25);
  }

  function drawParticle(p) {
    const color = getTemperatureColor(p.temperature);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = darkenColor(color, 30);
    ctx.stroke();
  }

  function getTemperatureColor(temp) {
    const r = Math.floor(temp * 255 * 1.5);
    const g = Math.floor((1 - temp) * 100);
    const b = Math.floor((1 - temp) * 255);

    const clampedR = Math.max(0, Math.min(255, r));
    const clampedG = Math.max(0, Math.min(255, g));
    const clampedB = Math.max(0, Math.min(255, b));

    return `rgb(${clampedR}, ${clampedG}, ${clampedB})`;
  }

  function darkenColor(color, percent) {
    const rgb = color.match(/\d+/g);
    if (!rgb) return color;

    const r = Math.max(0, Math.min(255, parseInt(rgb[0]) - percent));
    const g = Math.max(0, Math.min(255, parseInt(rgb[1]) - percent));
    const b = Math.max(0, Math.min(255, parseInt(rgb[2]) - percent));

    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawConvectionArrows() {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;

    for (let i = 1; i < 4; i++) {
      const x = canvas.width * (i / 4);
      const pathY1 = canvas.height * 0.9;
      const pathY2 = canvas.height * 0.1;

      ctx.beginPath();
      ctx.moveTo(x, pathY1);

      const midX = x + (x < canvas.width / 2 ? -50 : 50);
      ctx.lineTo(midX, (pathY1 + pathY2) / 2);
      ctx.lineTo(x, pathY2);

      ctx.stroke();

      ctx.beginPath();
      ctx.arc(midX, (pathY1 + pathY2) / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();
    }
  }

  function updateParticles() {
    const fluid = fluids[currentFluid];
    const effectiveViscosity = fluid.viscosity * viscosityMultiplier;

    particles.forEach((p) => {
      const buoyancyForce = fluidBuoyancy(p.temperature, fluid.buoyancy);
      const viscosityDrag = -p.vy * effectiveViscosity * 0.1;

      p.vy += buoyancyForce + viscosityDrag;
      p.vy *= 0.98;

      const flowX = Math.sin((p.y / canvas.height) * Math.PI * 2 + elapsedTime * 0.02) * 0.5;
      p.vx += flowX * 0.1;
      p.vx *= 0.95;

      p.x += p.vx;
      p.y += p.vy;

      const bounce = 0.7;

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
        p.temperature *= 0.95;
      }
      if (p.y > canvas.height - p.radius) {
        p.y = canvas.height - p.radius;
        p.vy *= -1 * bounce;
        p.temperature += 0.02;
      }

      for (let other of particles) {
        if (other === p) continue;

        const dx = other.x - p.x;
        const dy = other.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const minDist = p.radius + other.radius;

        if (dist < minDist && dist > 0) {
          const avgTemp = (p.temperature + other.temperature) / 2;
          const transferRate = 0.02 / effectiveViscosity;

          p.temperature += (avgTemp - p.temperature) * transferRate;
          other.temperature += (avgTemp - other.temperature) * transferRate;

          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          p.x -= (nx * overlap) / 2;
          p.y -= (ny * overlap) / 2;
          other.x += (nx * overlap) / 2;
          other.y += (ny * overlap) / 2;

          const restitution = 0.8;
          const dvx = p.vx - other.vx;
          const dvy = p.vy - other.vy;
          const dvDotN = dvx * nx + dvy * ny;

          if (dvDotN > 0) {
            const impulse = dvDotN / 2;
            p.vx -= impulse * nx * restitution;
            p.vy -= impulse * ny * restitution;
            other.vx += impulse * nx * restitution;
            other.vy += impulse * ny * restitution;
          }
        }
      }

      p.temperature = Math.max(0, Math.min(1, p.temperature));
    });
  }

  function fluidBuoyancy(temperature, buoyancyFactor) {
    const buoyancyStrength = (sourceTemp - ambientTemp) / 80;
    return -temperature * buoyancyFactor * buoyancyStrength * 0.1;
  }

  function updateParameters() {
    const fluid = fluids[currentFluid];
    const viscosityText =
      fluid.viscosity < 1.5 ? 'niedrig' : fluid.viscosity < 3.0 ? 'mittel' : 'hoch';

    document.getElementById('param-material').textContent = fluid.name;
    document.getElementById('param-density').textContent = fluid.density;
    document.getElementById('param-viscosity').textContent = viscosityText;
    document.getElementById('param-source').textContent = sourceTemp;
    document.getElementById('param-ambient').textContent = ambientTemp;
    document.getElementById('param-time').textContent = elapsedTime.toFixed(1);
  }

  function animate() {
    if (simulationRunning) {
      updateParticles();
      elapsedTime += 0.1;
      updateParameters();
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
    elapsedTime = 0;
    initializeParticles();
    draw();
    updateParameters();
  }

  function changeFluid() {
    currentFluid = document.getElementById('fluid-selector').value;
    resetSimulation();
    updateParameters();
  }

  function updateTemperature() {
    sourceTemp = parseInt(document.getElementById('temperature-source').value);
    document.getElementById('temp-source-display').textContent = sourceTemp + '°C';
    updateParameters();
  }

  function updateSpeed() {
    const speedValue = parseInt(document.getElementById('convection-speed').value);
    const speedLabels = ['Sehr langsam', 'Langsam', 'Normal', 'Schnell', 'Sehr schnell'];

    viscosityMultiplier = 2.0 - speedValue / 50;

    const labelIndex = Math.min(Math.floor(speedValue / 20), speedLabels.length - 1);
    document.getElementById('speed-display').textContent = speedLabels[labelIndex];
    updateParameters();
  }

  function init() {
    initializeParticles();
    updateParameters();
    draw();
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
  });

  window.startSimulation = startSimulation;
  window.stopSimulation = stopSimulation;
  window.resetSimulation = resetSimulation;
  window.changeFluid = changeFluid;
  window.updateTemperature = updateTemperature;
  window.updateSpeed = updateSpeed;
})();
