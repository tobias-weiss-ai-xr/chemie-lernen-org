/**
 * Atmosphärendruck im Alltag - Interactive Simulations
 * Demonstrates atmospheric pressure in everyday situations
 */

// Constants
const NORMAL_ATMOSPHERIC_PRESSURE = 101325; // Pa
const GRAVITY = 9.81; // m/s²

// Liquid densities (kg/m³)
const LIQUID_DENSITIES = {
  water: 1000,
  juice: 1050,
  oil: 920,
  honey: 1420,
};

// Surface friction coefficients
const SURFACE_FRICTION = {
  glass: 0.95,
  wood: 0.75,
  concrete: 0.5,
  tile: 0.9,
};

// ===== STROHHALM SIMULATION =====
let strohhalmState = {
  suctionPercent: 0,
  liquidHeight: 0.1, // meters
  liquidType: 'water',
  mouthPressure: NORMAL_ATMOSPHERIC_PRESSURE,
};

function updateStrohhalmSimulation() {
  strohhalmState.suctionPercent = parseInt(document.getElementById('strohhalm-suction').value);
  strohhalmState.liquidHeight =
    parseInt(document.getElementById('strohhalm-liquid-height').value) / 100;
  strohhalmState.liquidType = document.getElementById('strohhalm-liquid').value;

  // Calculate pressure reduction in mouth
  const pressureReduction = (strohhalmState.suctionPercent / 100) * 50000; // max 50 kPa reduction
  strohhalmState.mouthPressure = NORMAL_ATMOSPHERIC_PRESSURE - pressureReduction;

  // Update display values
  document.getElementById('strohhalm-suction-value').textContent =
    strohhalmState.suctionPercent + '%';
  document.getElementById('strohhalm-height-value').textContent =
    (strohhalmState.liquidHeight * 100).toFixed(0) + ' cm';

  const mouthPressureKPa = strohhalmState.mouthPressure / 1000;
  const outsidePressureKPa = NORMAL_ATMOSPHERIC_PRESSURE / 1000;
  const pressureDiffKPa = pressureReduction / 1000;

  document.getElementById('strohhalm-mouth-pressure').textContent =
    mouthPressureKPa.toFixed(1) + ' kPa';
  document.getElementById('strohhalm-outside-pressure').textContent =
    outsidePressureKPa.toFixed(1) + ' kPa';
  document.getElementById('strohhalm-pressure-diff').textContent =
    pressureDiffKPa.toFixed(1) + ' kPa';

  // Draw simulation
  drawStrohhalmSimulation();
}

function drawStrohhalmSimulation() {
  const canvas = document.getElementById('strohhalm-canvas');
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw glass
  const glassX = 150;
  const glassY = 150;
  const glassWidth = 150;
  const glassHeight = 200;

  // Liquid in glass
  const liquidLevel = glassY + glassHeight - strohhalmState.liquidHeight * 500;

  ctx.fillStyle = getLiquidColor(strohhalmState.liquidType);
  ctx.fillRect(glassX, liquidLevel, glassWidth, glassY + glassHeight - liquidLevel);

  // Glass outline
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.strokeRect(glassX, glassY, glassWidth, glassHeight);

  // Liquid level line in glass
  ctx.strokeStyle = getLiquidColor(strohhalmState.liquidType);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(glassX - 10, liquidLevel);
  ctx.lineTo(glassX + glassWidth + 10, liquidLevel);
  ctx.stroke();

  // Draw straw
  const strawX = glassX + glassWidth / 2;
  const strawY = glassY - 50;
  const strawWidth = 20;
  const strawHeight = 250;

  // Straw body
  ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.fillRect(strawX - strawWidth / 2, strawY, strawWidth, strawHeight);

  // Straw outline
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.strokeRect(strawX - strawWidth / 2, strawY, strawWidth, strawHeight);

  // Liquid in straw
  const liquidInStrawY = liquidLevel - strohhalmState.suctionPercent * 1.5;
  if (liquidInStrawY > strawY) {
    ctx.fillStyle = getLiquidColor(strohhalmState.liquidType);
    ctx.fillRect(
      strawX - strawWidth / 2 + 2,
      liquidInStrawY,
      strawWidth - 4,
      strawY + strawHeight - liquidInStrawY
    );
  }

  // Draw air pressure arrows (outside)
  ctx.strokeStyle = '#007bff';
  ctx.fillStyle = '#007bff';
  ctx.lineWidth = 2;

  // Air pressure from above (pushing down on liquid)
  for (let i = 0; i < 3; i++) {
    const arrowX = glassX + 30 + i * 50;
    drawArrow(ctx, arrowX, glassY - 30, arrowX, glassY - 10);
  }

  // Reduced pressure in mouth (shown with smaller arrows if suctioning)
  const mouthArrowSize = 1 - strohhalmState.suctionPercent / 200;
  ctx.strokeStyle = '#ff6b6b';
  ctx.fillStyle = '#ff6b6b';

  if (strohhalmState.suctionPercent > 0) {
    // Upward arrows showing reduced pressure
    for (let i = 0; i < 2; i++) {
      const arrowX = strawX + 30 + i * 40;
      drawArrow(ctx, arrowX, strawY - 80, arrowX, strawY - 60, mouthArrowSize);
    }
  }

  // Labels
  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Glas', glassX + glassWidth / 2, glassY + glassHeight + 20);
  ctx.fillText('Strohhalm', strawX + strawWidth + 30, strawY + 50);

  // Draw mouth/person representation
  ctx.fillStyle = '#ffdbac';
  ctx.beginPath();
  ctx.arc(400, 200, 60, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.ellipse(400, 230, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pressure indicator above person
  const indicatorY = 120;
  const indicatorWidth = strohhalmState.suctionPercent;

  ctx.fillStyle = '#e7f3ff';
  ctx.fillRect(350, indicatorY - 20, 100, 40);
  ctx.strokeStyle = '#007bff';
  ctx.strokeRect(350, indicatorY - 20, 100, 40);

  // Pressure bar
  const barWidth = (indicatorWidth / 100) * 80;
  const barColor = indicatorWidth > 70 ? '#dc3545' : indicatorWidth > 30 ? '#ffc107' : '#28a745';

  ctx.fillStyle = barColor;
  ctx.fillRect(355, indicatorY, barWidth, 40);

  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Luftdruck', 400, indicatorY + 5);
  ctx.fillText(strohhalmState.suctionPercent + '% Saugen', 400, indicatorY + 25);
}

// ===== BALLON SIMULATION =====
let ballonState = {
  airAmount: 10, // pumps
  temperature: 20, // Celsius
  tension: 'medium',
  volume: 2.5, // liters
  isPopped: false,
};

function updateBallonSimulation() {
  ballonState.airAmount = parseInt(document.getElementById('ballon-air').value);
  ballonState.temperature = parseInt(document.getElementById('ballon-temperature').value);
  ballonState.tension = document.getElementById('ballon-tension').value;

  // Calculate volume based on air amount and temperature
  const baseVolume = 0.5; // minimum volume
  const volumePerPump = 0.3;
  const temperatureFactor = (ballonState.temperature + 273.15) / 293.15; // relative to 20°C

  ballonState.volume = baseVolume + ballonState.airAmount * volumePerPump * temperatureFactor;

  // Calculate internal pressure
  const tensionMultiplier = {
    low: 1.05,
    medium: 1.1,
    high: 1.2,
  };

  const temperaturePressureEffect = ((ballonState.temperature + 273.15) / 293.15 - 1) * 2000;
  ballonState.internalPressure =
    NORMAL_ATMOSPHERIC_PRESSURE * tensionMultiplier[ballonState.tension] +
    temperaturePressureEffect;

  // Update display
  document.getElementById('ballon-air-value').textContent = ballonState.airAmount;
  document.getElementById('ballon-temperature-value').textContent = ballonState.temperature + '°C';

  const insidePressureKPa = ballonState.internalPressure / 1000;
  const outsidePressureKPa = NORMAL_ATMOSPHERIC_PRESSURE / 1000;

  document.getElementById('ballon-inside-pressure').textContent =
    insidePressureKPa.toFixed(1) + ' kPa';
  document.getElementById('ballon-outside-pressure').textContent =
    outsidePressureKPa.toFixed(1) + ' kPa';
  document.getElementById('ballon-volume').textContent = ballonState.volume.toFixed(1) + ' L';

  // Check for pop
  const popThreshold = {
    low: 150000, // Pa
    medium: 130000,
    high: 160000,
  };

  const dangerElement = document.getElementById('ballon-danger');
  if (ballonState.internalPressure > popThreshold[ballonState.tension]) {
    dangerElement.textContent = 'GEFÄHR - Platzt!';
    dangerElement.className = 'value danger';
    ballonState.isPopped = true;
  } else {
    const dangerLevel = (ballonState.internalPressure / popThreshold[ballonState.tension]) * 100;
    if (dangerLevel > 80) {
      dangerElement.textContent = 'Vorsichtig!';
      dangerElement.className = 'value warning';
    } else if (dangerLevel > 60) {
      dangerElement.textContent = 'Erhöht';
      dangerElement.className = 'value caution';
    } else {
      dangerElement.textContent = 'Sicher';
      dangerElement.className = 'value safe';
    }
    ballonState.isPopped = false;
  }

  drawBallonSimulation();
}

function resetBallon() {
  document.getElementById('ballon-air').value = 0;
  document.getElementById('ballon-temperature').value = 20;
  updateBallonSimulation();
}

function drawBallonSimulation() {
  const canvas = document.getElementById('ballon-canvas');
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (ballonState.isPopped) {
    // Draw popped balloon
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;

    // Shredded pieces
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = 250 + Math.cos(angle) * 40;
      const y = 200 + Math.sin(angle) * 40;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30);
      ctx.stroke();
    }

    ctx.fillStyle = '#dc3545';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💥 PLATZ!', 250, 320);

    return;
  }

  // Calculate balloon size based on volume
  const balloonRadius = 30 + Math.pow(ballonState.volume, 0.5) * 15;

  // Balloon color based on temperature
  const tempRatio = (ballonState.temperature + 20) / 80; // -20 to 60°C
  const red = Math.floor(255 * tempRatio);
  const blue = Math.floor(255 * (1 - tempRatio));
  const balloonColor = `rgb(${red}, 100, ${blue})`;

  // Draw balloon
  const gradient = ctx.createRadialGradient(250, 200, balloonRadius * 0.3, 250, 200, balloonRadius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, balloonColor);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(250, 200, balloonRadius, 0, Math.PI * 2);
  ctx.fill();

  // Balloon outline
  ctx.strokeStyle = balloonColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Balloon knot
  ctx.fillStyle = balloonColor;
  ctx.beginPath();
  ctx.moveTo(250, 200 + balloonRadius);
  ctx.lineTo(245, 200 + balloonRadius + 10);
  ctx.lineTo(255, 200 + balloonRadius + 10);
  ctx.closePath();
  ctx.fill();

  // Air molecules (number based on air amount)
  const moleculeCount = Math.min(ballonState.airAmount, 30);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

  for (let i = 0; i < moleculeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * (balloonRadius - 20);
    const x = 250 + Math.cos(angle) * r;
    const y = 200 + Math.sin(angle) * r;
    const size = 2 + Math.random() * 2;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Air pressure arrows (outside pressing in)
  ctx.strokeStyle = '#007bff';
  ctx.fillStyle = '#007bff';
  ctx.lineWidth = 2;

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const startX = 250 + Math.cos(angle) * (balloonRadius + 30);
    const startY = 200 + Math.sin(angle) * (balloonRadius + 30);
    const endX = 250 + Math.cos(angle) * (balloonRadius + 5);
    const endY = 200 + Math.sin(angle) * (balloonRadius + 5);

    drawArrow(ctx, startX, startY, endX, endY);
  }

  // Internal pressure indicator (center)
  const pressureIntensity = Math.min(
    (ballonState.internalPressure - NORMAL_ATMOSPHERIC_PRESSURE) / 30000,
    1
  );
  const innerColor =
    pressureIntensity > 0.7 ? '#dc3545' : pressureIntensity > 0.4 ? '#ffc107' : '#28a745';

  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.arc(250, 200, 10, 0, Math.PI * 2);
  ctx.fill();

  // Labels
  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';

  if (ballonState.airAmount > 0) {
    ctx.fillText(ballonState.volume.toFixed(1) + ' L', 250, 200);
  }

  // Temperature indicator
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.fillText('🌡️ ' + ballonState.temperature + '°C', 250, 380);

  // Pump visualization
  ctx.fillStyle = '#ffc107';
  ctx.fillRect(380, 280, 80, 60);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(380, 280, 80, 60);

  ctx.fillStyle = '#333';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎈 Pumpe', 420, 295);
  ctx.fillText('×' + ballonState.airAmount, 420, 315);

  // Pump hose
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(380, 310);
  ctx.lineTo(310, 250);
  ctx.stroke();
}

// ===== SAUGNAPF SIMULATION =====
let saugnapfState = {
  diameter: 0.1, // meters (10 cm)
  outsidePressure: NORMAL_ATMOSPHERIC_PRESSURE,
  insidePressure: NORMAL_ATMOSPHERIC_PRESSURE / 2,
  surfaceType: 'wood',
  isAttached: false,
};

function updateSaugnapfSimulation() {
  saugnapfState.diameter = parseInt(document.getElementById('saugnapf-size').value) / 100;
  const pressurePercent = parseInt(document.getElementById('saugnapf-air-pressure').value);
  saugnapfState.outsidePressure = (pressurePercent / 100) * NORMAL_ATMOSPHERIC_PRESSURE;
  saugnapfState.surfaceType = document.getElementById('saugnapf-surface').value;

  // Calculate inside pressure (vacuum effect)
  saugnapfState.insidePressure = saugnapfState.outsidePressure * 0.5;

  // Calculate holding force
  const area = Math.PI * Math.pow(saugnapfState.diameter / 2, 2);
  const pressureDiff = saugnapfState.outsidePressure - saugnapfState.insidePressure;
  const holdingForce = pressureDiff * area * SURFACE_FRICTION[saugnapfState.surfaceType];
  const loadCapacity = holdingForce / GRAVITY;

  // Update display
  document.getElementById('saugnapf-size-value').textContent =
    (saugnapfState.diameter * 100).toFixed(0) + ' cm Durchmesser';

  const outsidePressureKPa = saugnapfState.outsidePressure / 1000;
  document.getElementById('saugnapf-pressure-value').textContent =
    outsidePressureKPa.toFixed(1) + ' kPa';

  const insidePressureKPa = saugnapfState.insidePressure / 1000;
  document.getElementById('saugnapf-inside-pressure').textContent =
    insidePressureKPa.toFixed(1) + ' kPa';

  document.getElementById('saugnapf-holding-force').textContent = Math.round(holdingForce) + ' N';
  document.getElementById('saugnapf-load-capacity').textContent =
    '~' + Math.round(loadCapacity) + ' kg';

  saugnapfState.isAttached = pressurePercent > 10;

  drawSaugnapfSimulation();
}

function toggleSaugnapf() {
  if (saugnapfState.isAttached) {
    // Release
    document.getElementById('saugnapf-air-pressure').value = 0;
    updateSaugnapfSimulation();
  } else {
    // Attach
    document.getElementById('saugnapf-air-pressure').value = 101;
    updateSaugnapfSimulation();
  }
}

function drawSaugnapfSimulation() {
  const canvas = document.getElementById('saugnapf-canvas');
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw wall/surface
  const wallX = 300;
  const wallHeight = 350;

  const surfaceColors = {
    glass: '#e3f2fd',
    wood: '#d7ccc8',
    concrete: '#9e9e9e',
    tile: '#fafafa',
  };

  ctx.fillStyle = surfaceColors[saugnapfState.surfaceType];
  ctx.fillRect(wallX, 50, 15, wallHeight);

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(wallX, 50, 15, wallHeight);

  // Surface texture
  if (saugnapfState.surfaceType === 'wood') {
    // Wood grain
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1;
    for (let y = 60; y < 400; y += 15) {
      ctx.beginPath();
      ctx.moveTo(wallX, y);
      ctx.lineTo(wallX + 15, y + 5);
      ctx.stroke();
    }
  } else if (saugnapfState.surfaceType === 'concrete') {
    // Concrete texture
    ctx.fillStyle = '#757575';
    for (let i = 0; i < 50; i++) {
      const x = wallX + Math.random() * 15;
      const y = 60 + Math.random() * wallHeight;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Draw suction cup
  const cupRadius = (saugnapfState.diameter * 100) / 2; // Convert to pixels for display

  // Cup body (side view)
  ctx.fillStyle = '#ff7043';
  ctx.beginPath();
  ctx.moveTo(wallX - cupRadius - 20, 150);
  ctx.lineTo(wallX - cupRadius - 5, 120);
  ctx.lineTo(wallX - cupRadius - 5, 250);
  ctx.lineTo(wallX - cupRadius - 20, 280);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top of cup
  ctx.fillStyle = '#ff8a65';
  ctx.fillRect(wallX - cupRadius - 20, 150, cupRadius * 2 + 40, 20);

  // Cup handle
  ctx.fillStyle = '#ff5722';
  ctx.fillRect(wallX - cupRadius - 60, 180, 40, 15);

  // Air pressure arrows
  if (saugnapfState.isAttached) {
    // Outside pressure (pushing cup against wall)
    ctx.strokeStyle = '#007bff';
    ctx.fillStyle = '#007bff';

    for (let i = 0; i < 4; i++) {
      const y = 170 + i * 30;
      drawArrow(ctx, wallX - cupRadius - 50, y, wallX - cupRadius - 10, y);
    }

    // Inside vacuum (showing reduced pressure)
    ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.beginPath();
    ctx.ellipse(wallX - cupRadius, 200, cupRadius - 5, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Force indicator
    const forceIntensity = Math.min(
      (saugnapfState.outsidePressure - saugnapfState.insidePressure) / 50000,
      1
    );

    ctx.fillStyle = `rgba(40, 167, 69, ${0.3 + forceIntensity * 0.7})`;
    ctx.beginPath();
    ctx.ellipse(wallX - cupRadius, 300, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#28a745';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Haltekraft', wallX - cupRadius, 300);
  } else {
    // Cup not attached - show it falling or loose
    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.arc(wallX - cupRadius, 300, cupRadius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#999';
    ctx.font = 'italic 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('(nicht angeheftet)', wallX - cupRadius, 350);
  }

  // Labels
  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';

  const surfaceNames = {
    glass: 'Glas',
    wood: 'Holz',
    concrete: 'Beton',
    tile: 'Fliese',
  };

  ctx.fillText('Oberfläche: ' + surfaceNames[saugnapfState.surfaceType], 20, 100);
  ctx.fillText('Durchmesser: ' + (saugnapfState.diameter * 100).toFixed(0) + ' cm', 20, 130);
}

// ===== UTILITY FUNCTIONS =====

function getLiquidColor(type) {
  const colors = {
    water: 'rgba(33, 150, 243, 0.6)',
    juice: 'rgba(255, 152, 0, 0.6)',
    oil: 'rgba(255, 235, 59, 0.6)',
    honey: 'rgba(230, 126, 34, 0.6)',
  };
  return colors[type];
}

function drawArrow(ctx, fromX, fromY, toX, toY, scale = 1) {
  const headLen = 10 * scale;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
  // Initialize all simulations
  updateStrohhalmSimulation();
  updateBallonSimulation();
  updateSaugnapfSimulation();

  // Add tab change listeners to redraw simulations
  const tabLinks = document.querySelectorAll('a[data-toggle="tab"]');
  tabLinks.forEach(function (link) {
    link.addEventListener('shown', function (e) {
      const targetId = e.target.getAttribute('href').substring(1);
      if (targetId === 'strohhalm') {
        updateStrohhalmSimulation();
      } else if (targetId === 'ballon') {
        updateBallonSimulation();
      } else if (targetId === 'saugnapf') {
        updateSaugnapfSimulation();
      }
    });
  });
});
