(function() {
  const canvas = document.getElementById('simulation-canvas');
  const ctx = canvas.getContext('2d');
  let animationId = null;
  let particles = [];
  let simulationRunning = false;
  let elapsedTime = 0;
  let numParticles = 100;

  const materials = {
    copper: { name: 'Kupfer', conductivity: 400, color: '#b87333', particleCount: 150, speed: 8 },
    iron: { name: 'Eisen', conductivity: 80, color: '#9e3816', particleCount: 120, speed: 4 },
    silicon: { name: 'Silizium', conductivity: 150, color: '#7af9c2', particleCount: 100, speed: 6 },
    glass: { name: 'Glas', conductivity: 1, color: '#90caf9', particleCount: 60, speed: 0.5 },
    wood: { name: 'Holz', conductivity: 0.15, color: '#8d6e63', particleCount: 40, speed: 0.2 },
    air: { name: 'Luft', conductivity: 0.025, color: '#e1f5fe', particleCount: 20, speed: 0.1 }
  };

  let currentMaterial = 'copper';
  let temperatureDiff = 100;
  let animationSpeed = 50;

  function initializeParticles() {
    const material = materials[currentMaterial];
    numParticles = material.particleCount;

    particles = [];

    for (let i = 0; i < numParticles; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;

      const temperature = x < canvas.width / 4 ? 1 : 0;

      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * material.speed * animationSpeed / 100,
        vy: (Math.random() - 0.5) * material.speed * animationSpeed / 100,
        radius: 5 + Math.random() * 5,
        temperature: temperature
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawHeatSource();
    drawColdSink();

    particles.forEach(p => {
      drawParticle(p);
    });

    drawGradient();
  }

  function drawHeatSource() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width / 4, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width / 4, canvas.height);

    ctx.fillStyle = '#ff0000';
    ctx.font = '16px Arial';
    ctx.fillText('Wärmequelle (Heiß)', 10, 25);
  }

  function drawColdSink() {
    const gradient = ctx.createLinearGradient(canvas.width * 0.75, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 255, 0)');
    gradient.addColorStop(1, '#0000ff');

    ctx.fillStyle = gradient;
    ctx.fillRect(canvas.width * 0.75, 0, canvas.width / 4, canvas.height);

    ctx.fillStyle = '#0000ff';
    ctx.font = '16px Arial';
    ctx.fillText('Kältesenke (Kalt)', canvas.width * 0.77, 25);
  }

  function drawParticle(p) {
    const color = getParticleColor(p.temperature);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = darkenColor(color, 20);
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText(`${(p.temperature * temperatureDiff).toFixed(0)}K`, p.x - 15, p.y - p.radius - 5);
  }

  function getParticleColor(temperature) {
    const r = Math.floor(temperature * 255);
    const g = 0;
    const b = Math.floor((1 - temperature) * 255);

    return `rgb(${r}, ${g}, ${b})`;
  }

  function darkenColor(color, percent) {
    const rgb = color.match(/\d+/g);

    if (!rgb) return color;

    const r = Math.max(0, Math.min(255, parseInt(rgb[0]) - percent));
    const g = Math.max(0, Math.min(255, parseInt(rgb[1]) - percent));
    const b = Math.max(0, Math.min(255, parseInt(rgb[2]) - percent));

    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawGradient() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);

    particles.forEach(p => {
      if (p.temperature > 0 && p.temperature < 1) {
        gradient.addColorStop(p.x / canvas.width, getParticleColor(p.temperature));
      }
    });

    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }

  function updateParticles() {
    const material = materials[currentMaterial];
    const speedMultiplier = material.speed * animationSpeed / 100;

    particles.forEach(p => {
      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;

      const bounce = 0.9;

      if (p.x < p.radius) {
        p.x = p.radius;
        p.vx *= -1 * bounce;

        if (p.x < p.radius * 2) {
          p.temperature = Math.min(1, p.temperature + 0.01);
        }
      }

      if (p.x > canvas.width - p.radius) {
        p.x = canvas.width - p.radius;
        p.vx *= -1 * bounce;

        if (p.x > canvas.width - p.radius * 2) {
          p.temperature = Math.max(0, p.temperature - 0.01);
        }
      }

      if (p.y < p.radius) {
        p.y = p.radius;
        p.vy *= -1 * bounce;
      }

      if (p.y > canvas.height - p.radius) {
        p.y = canvas.height - p.radius;
        p.vy *= -1 * bounce;
      }
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const minDistance = p1.radius + p2.radius;

        if (distance < minDistance) {
          const avgTemp = (p1.temperature + p2.temperature) / 2;

          const transferRate = material.conductivity / 500;

          if (Math.random() < transferRate) {
            p1.temperature = avgTemp;
            p2.temperature = avgTemp;
          }

          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minDistance - distance;

          p1.x -= nx * overlap / 2;
          p1.y -= ny * overlap / 2;
          p2.x += nx * overlap / 2;
          p2.y += ny * overlap / 2;

          const dvx = p1.vx - p2.vx;
          const dvy = p1.vy - p2.vy;
          const dvDotN = dvx * nx + dvy * ny;

          const restitution = 0.95;

          if (dvDotN > 0) {
            p1.vx -= dvDotN * nx / 2 * restitution;
            p1.vy -= dvDotN * ny / 2 * restitution;
            p2.vx += dvDotN * nx / 2 * restitution;
            p2.vy += dvDotN * ny / 2 * restitution;
          }
        }
      }
    }
  }

  function updateParameters() {
    const material = materials[currentMaterial];
    const sourceTemp = 300 + temperatureDiff;
    const ambientTemp = 300;

    document.getElementById('param-material').textContent = material.name;
    document.getElementById('param-conductivity').textContent = material.conductivity;
    document.getElementById('param-temperature').textContent = ambientTemp;
    document.getElementById('param-source').textContent = sourceTemp;
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

  function changeMaterial() {
    currentMaterial = document.getElementById('material-selector').value;
    resetSimulation();
    updateParameters();
  }

  function updateTemperature() {
    temperatureDiff = parseInt(document.getElementById('temperature-diff').value);
    document.getElementById('temp-display').textContent = temperatureDiff + ' K';
    updateParameters();
  }

  function updateSpeed() {
    animationSpeed = parseInt(document.getElementById('animation-speed').value);
    document.getElementById('speed-display').textContent = animationSpeed + '%';
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
  window.changeMaterial = changeMaterial;
  window.updateTemperature = updateTemperature;
  window.updateSpeed = updateSpeed;

})();