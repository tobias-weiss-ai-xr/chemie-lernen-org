/* eslint-disable no-unused-vars */
/* Elektrochemie auf Teilchenebene
 * Visualizes galvanic cells, electrolysis, electron transitions, and Nernst equation
 */

// Configuration
const COLORS = {
  background: '#f8f9fa',
  container: '#ffffff',
  anode: '#e74c3c',
  cathode: '#3498db',
  electron: '#f1c40f',
  cation: '#9b59b6',
  anion: '#2ecc71',
  electronPath: '#f39c12',
  ionPathBridge: '#e67e22',
  liquid: '#bdc3c7'
};

// Animation state
const animationState = {
  galvanic: {
    isActive: false,
    frameCount: 0,
    electrons: [],
    cations: [],
    anions: []
  },
  electrolysis: {
    isActive: false,
    voltage: 5.0,
    electrons: [],
    anions: []
  },
  electronTransition: {
    isPlaying: false,
    particles: []
  }
};

// Canvas contexts
let galvanicCtx, electrolysisCtx, electronCtx;

// ===== INITIALIZATION =====

function initCanvases() {
  galvanicCtx = document.getElementById('galvanic-cell-canvas').getContext('2d');
  electrolysisCtx = document.getElementById('electrolysis-canvas').getContext('2d');
  electronCtx = document.getElementById('electron-canvas').getContext('2d');
}

document.addEventListener('DOMContentLoaded', function() {
  initCanvases();
  drawGalvanicCellStatic();
  drawElectrolysisStatic();
  drawElectronTransitionStatic();
});

// ===== GALVANIC CELL ANIMATION =====

function startGalvanicAnimation() {
  animationState.galvanic.isActive = true;
  animationState.galvanic.frameCount = 0;

  // Initialize particles
  animationState.galvanic.electrons = [];
  animationState.galvanic.cations = [];
  animationState.galvanic.anions = [];

  animateGalvanicCell();
}

function stopGalvanicAnimation() {
  animationState.galvanic.isActive = false;
  drawGalvanicCellStatic();
}

function animateGalvanicCell() {
  if (!animationState.galvanic.isActive) return;

  const ctx = galvanicCtx;
  const canvas = ctx.canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGalvanicCellStructure(ctx);
  updateGalvanicParticles(ctx);

  animationState.galvanic.frameCount++;
  requestAnimationFrame(animateGalvanicCell);
}

function drawGalvanicCellStatic() {
  const ctx = galvanicCtx;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawGalvanicCellStructure(ctx);
}

function drawGalvanicCellStructure(ctx) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Anode (left) - Zn electrode
  ctx.fillStyle = COLORS.anode;
  ctx.fillRect(80, 150, 20, 200);
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Zn', 90, 140);
  ctx.fillText('(Anode)', 90, 160);
  ctx.fillText('Oxidation', 90, 375);

  // Cathode (right) - Cu electrode
  ctx.fillStyle = COLORS.cathode;
  ctx.fillRect(700, 150, 20, 200);
  ctx.fillStyle = '#2980b9';
  ctx.fillText('Cu', 710, 140);
  ctx.fillText('(Kathode)', 710, 160);
  ctx.fillText('Reduktion', 710, 375);

  // Electrolyte solutions
  // Left solution (ZnSO4)
  ctx.fillStyle = COLORS.liquid;
  ctx.fillRect(100, 150, 200, 200);
  ctx.fillStyle = '#34495e';
  ctx.fillText('ZnSO₄-Lsung', 200, 370);

  // Right solution (CuSO4)
  ctx.fillRect(500, 150, 200, 200);
  ctx.fillText('CuSO₄-Lsung', 600, 370);

  // Salt bridge
  ctx.strokeStyle = COLORS.ionPathBridge;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(300, 200);
  ctx.lineTo(300, 100);
  ctx.lineTo(500, 100);
  ctx.lineTo(500, 200);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.ionPathBridge;
  ctx.fillText('Salzbrcke', 400, 120);

  // Electron circuit (outside)
  ctx.strokeStyle = COLORS.electronPath;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(100, 180); // Top of anode
  ctx.lineTo(100, 50); // To top wire
  ctx.lineTo(700, 50); // To cathode top wire
  ctx.lineTo(700, 180); // To top of cathode
  ctx.stroke();

  ctx.fillStyle = COLORS.electronPath;
  ctx.font = 'bold 12px Arial';
  ctx.fillText('e⁻-Fluss', 400, 45);

  // Return wire (bottom)
  ctx.beginPath();
  ctx.moveTo(700, 320);
  ctx.lineTo(700, 450);
  ctx.lineTo(100, 450);
  ctx.lineTo(100, 320);
  ctx.stroke();

  // Load indicator
  ctx.fillStyle = '#f39c12';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Consumer [Last]', 400, 465);
}

function updateGalvanicParticles(ctx) {
  const canvas = ctx.canvas;

  // Add new electron occasionally
  if (animationState.galvanic.frameCount % 30 === 0) {
    animationState.galvanic.electrons.push({
      x: 100,
      y: 180,
      vx: 0.3,
      state: 'anode-to-cathode'
    });

    // Add salt bridge ion pairs
    if (animationState.galvanic.frameCount % 45 === 0) {
      animationState.galvanic.cations.push({
        x: 310,
        y: 180,
        vx: 0.15,
        type: 'cation'
      });

      animationState.galvanic.anions.push({
        x: 490,
        y: 180,
        vx: -0.15,
        type: 'anion'
      });
    }
  }

  // Update and draw electrons
  animationState.galvanic.electrons.forEach((electron, index) => {
    // Current segment progress
    const progress = animationState.galvanic.frameCount % 240;

    let x, y;

    if (progress < 40) {
      x = 100;
      y = 180 - (progress / 40) * 130;
    } else if (progress < 120) {
      x = 100 + ((progress - 40) / 80) * 600;
      y = 50;
    } else if (progress < 160) {
      x = 700;
      y = 50 + ((progress - 120) / 40) * 130;
    } else {
      x = 100 + (240 - progress) / 80 * 600;
      y = 450;
    }

    ctx.fillStyle = COLORS.electron;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('e⁻', x, y);
  });

  // Update and draw salt bridge ions
  animationState.galvanic.cations.forEach((ion) => {
    ion.x += ion.vx;
    if (ion.x > 490) ion.x = 310;

    ctx.fillStyle = COLORS.cation;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Zn²⁺', ion.x, ion.y);
  });

  animationState.galvanic.anions.forEach((ion) => {
    ion.x += ion.vx;
    if (ion.x < 310) ion.x = 490;

    ctx.fillStyle = COLORS.anion;
    ctx.fillText('SO₄²⁻', ion.x, ion.y);
  });

  // Show ions in solutions
  drawSolutionIons(ctx, 200, 250, 'Zn²⁺', 3, COLORS.cation);
  drawSolutionIons(ctx, 200, 275, 'SO₄²⁻', 3, COLORS.anion);
  drawSolutionIons(ctx, 600, 250, 'Cu²⁺', 3, COLORS.cation);
  drawSolutionIons(ctx, 600, 275, 'SO₄²⁻', 3, COLORS.anion);
}

function drawSolutionIons(ctx, x, y, label, count, color) {
  ctx.fillStyle = color;
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';

  const spacing = 30;
  for (let i = 0; i < count; i++) {
    ctx.fillText(label, x + (i % 3) * spacing, y + Math.floor(i / 3) * 20);
  }
}

// ===== ELECTROLYSIS ANIMATION =====

function startElectrolysisAnimation() {
  animationState.electrolysis.isActive = true;
  animationState.electrolysis.electrons = [];
  animationState.electrolysis.anions = [];

  animateElectrolysis();
}

function stopElectrolysisAnimation() {
  animationState.electrolysis.isActive = false;
  drawElectrolysisStatic();
}

function updateElectrolysisVoltage() {
  animationState.electrolysis.voltage = parseFloat(
    document.getElementById('electrolysis-voltage').value
  );
  document.getElementById('voltage-display').textContent =
    animationState.electrolysis.voltage.toFixed(1) + ' V';
}

function drawElectrolysisStatic() {
  const ctx = electrolysisCtx;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawElectrolysisStructure(ctx);
}

function animateElectrolysis() {
  if (!animationState.electrolysis.isActive) return;

  const ctx = electrolysisCtx;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawElectrolysisStructure(ctx);
  updateElectrolysisParticles(ctx);

  requestAnimationFrame(animateElectrolysis);
}

function drawElectrolysisStructure(ctx) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Electrolysis container
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.strokeRect(150, 150, 500, 250);

  // Electrolyte solution
  ctx.fillStyle = COLORS.liquid;
  ctx.fillRect(150, 150, 500, 250);
  ctx.fillStyle = '#34495e';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Elektrolyt (NaCl', 400, 280);

  // Anode (left)
  ctx.fillStyle = COLORS.anode;
  ctx.fillRect(200, 120, 20, 210);
  ctx.fillStyle = '#c0392b';
  ctx.fillText('Anode (+)', 210, 110);
  ctx.fillText('Oxidation', 210, 350);

  // Cathode (right)
  ctx.fillStyle = COLORS.cathode;
  ctx.fillRect(580, 120, 20, 210);
  ctx.fillStyle = '#2980b9';
  ctx.fillText('Kathode (-)', 590, 110);
  ctx.fillText('Reduktion', 590, 350);

  // External power source
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(50, 200, 80, 60);
  ctx.fillStyle = '#d35400';
  ctx.textAlign = 'center';
  ctx.fillText('Power', 90, 210);
  ctx.fillText('Source', 90, 230);
  ctx.fillText('■ +', 90, 250);

  // Wire to anode
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(130, 230);
  ctx.lineTo(200, 150);
  ctx.stroke();

  // Wire to cathode
  ctx.beginPath();
  ctx.moveTo(600, 150);
  ctx.lineTo(670, 200);
  ctx.lineTo(670, 230);
  ctx.stroke();

  // External circuit electron flow
  ctx.fillStyle = COLORS.electron;
  ctx.font = 'bold 12px Arial';
  ctx.fillText('e⁻', 470, 210);
}

function updateElectrolysisParticles(ctx) {
  const speed = animationState.electrolysis.voltage * 0.05;

  // Anode: 2Cl⁻ → Cl₂ + 2e⁻
  // Show Cl⁻ approaching anode, then Cl₂ leaving
  ctx.fillStyle = COLORS.anion;
  ctx.font = 'bold 10px Arial';

  const anodeX = 210;
  const frame = animationState.electrolysis.frameCount || 0;

  // Chloride ions moving to anode
  for (let i = 0; i < 3; i++) {
    const x = 400 - Math.sin((frame + i * 60) * 0.01) * 200;
    ctx.fillText('Cl⁻', x, 250);
  }

  // Chlorine gas leaving anode
  if (frame % 120 > 60) {
    ctx.fillText('Cl₂↑', anodeX, 380);
  }

  // Cathode: 2H₂O + 2e⁻ → H₂ + 2OH⁻
  // Show electrons, H₂ gas, OH⁻
  ctx.fillStyle = COLORS.electron;
  ctx.fillText('e⁻', 350, 200);

  // Hydrogen gas bubbles
  ctx.fillStyle = '#bdc3c7';
  if (frame % 80 < 40) {
    ctx.fillText('H₂', 590, 380);
  }

  // Hydroxide ions
  ctx.fillStyle = COLORS.anion;
  for (let i = 0; i < 2; i++) {
    const y = 250 + Math.sin((frame + i * 40) * 0.02) * 30;
    ctx.fillText('OH⁻', 550 + i * 40, y);
  }
}

// ===== ELECTRON TRANSITIONS =====

function updateElectronTransition() {
  drawElectronTransitionStatic();
}

function drawElectronTransitionStatic() {
  const ctx = electronCtx;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawElectronTransitionStructure(ctx);
}

function drawElectronTransitionStructure(ctx) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Reactant (left)
  ctx.fillStyle = COLORS.anode;
  ctx.beginPath();
  ctx.arc(150, height / 2, 40, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Zn', 150, height / 2 + 5);
  ctx.fillText('REAKTANT', 150, height / 2 + 60);

  // Product (right)
  ctx.fillStyle = COLORS.cation;
  ctx.beginPath();
  ctx.arc(650, height / 2, 40, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#8e44ad';
  ctx.fillText('Zn²⁺', 650, height / 2 + 5);
  ctx.fillText('PRODUKT', 650, height / 2 + 60);

  // Arrow
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(200, height / 2);
  ctx.lineTo(600, height / 2);
  ctx.stroke();

  ctx.fillStyle = '#2c3e50';
  ctx.fillText('→', 400, height / 2 + 5);

  // Electrons in transition
  ctx.fillStyle = COLORS.electron;
  for (let i = 0; i < 2; i++) {
    const x = 250 + i * 80;
    ctx.fillText('e⁻', x, height / 2 - 20);
  }

  // Charge display
  ctx.fillStyle = '#34495e';
  ctx.font = '14px Arial';
  ctx.fillText('Ladungserhaltung:', width / 2, 380);
  ctx.fillText('2e⁻ werden bertragen → Zn → Zn²⁺ + 2e⁻', width / 2, 400);
}

function playElectronTransition() {
  const ctx = electronCtx;
  let frame = 0;

  function animate() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw static structure
    drawElectronTransitionStructure(ctx);

    // Animate electrons
    if (frame < 60) {
      const x = 200 + (frame / 60) * 400;
      ctx.fillStyle = COLORS.electron;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('e⁻', x, 100);
    }

    frame++;
    if (frame < 120) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

// ===== NERNST EQUATION =====

function calculateNernst() {
  const E0 = parseFloat(document.getElementById('standard-potential').value);
  const n = parseInt(document.getElementById('electrons-n').value);
  const Q = parseFloat(document.getElementById('quotient-q').value);

  if (isNaN(E0) || isNaN(n) || isNaN(Q)) {
    showToast('Bitte geben Sie gltige Werte ein.', 'error');
    return;
  }

  if (n < 1 || n > 10) {
    showToast('Anzahl der Elektronen muss zwischen 1 und 10 liegen.', 'error');
    return;
  }

  if (Q < 0) {
    showToast('Reaktionsquotient Q muss positiv sein.', 'error');
    return;
  }

  // Nernst equation: E = E0 - (0.0592 / n) * log10(Q)
  const NernstFactor = 0.0592 / n;
  const logQ = Math.log10(Q === 0 ? 1e-10 : Q);
  const E = E0 - NernstFactor * logQ;

  document.getElementById('nernst-result').style.display = 'block';
  document.getElementById('nernst-potential').textContent = E.toFixed(4) + ' V';

  displayNernstSteps(E0, n, Q, E, NernstFactor, logQ);
  displayNernstInterpretation(E, E0, Q);
}

function displayNernstSteps(E0, n, Q, E, factor, logQ) {
  const display = document.getElementById('nernst-steps');
  const logQFormatted = logQ < 0 ? logQ.toFixed(3) : '+' + logQ.toFixed(3);

  display.innerHTML = `
    <p><span class="step">1.</span> Gegeben: E° = ${E0.toFixed(2)} V, n = ${n}, Q = ${Q}</p>
    <p><span class="step">2.</span> Nernst-Faktor = 0.0592 / ${n} = ${factor.toFixed(4)} V</p>
    <p><span class="step">3.</span> log₁₀(Q) = log₁₀(${Q}) = ${logQFormatted}</p>
    <p><span class="step">4.</span> \u0394E = (${factor.toFixed(4)}) × (${logQFormatted}) = ${(factor * logQ).toFixed(4)} V</p>
    <p><span class="step">5.</span> E = ${E0.toFixed(2)} - (${(factor * logQ).toFixed(4)}) = ${E.toFixed(4)} V</p>
  `;
}

function displayNernstInterpretation(E, E0, Q) {
  const display = document.getElementById('nernst-interpretation-text');
  let interpretation;

  if (Math.abs(E - E0) < 0.001) {
    interpretation = '<p><strong>Standardbedingungen (Q ≈ 1):</strong> Das Zellpotential ist gleich dem Standardpotential. Keine Konzentrationseffekte.</p>';
  } else if (E > E0) {
    interpretation = '<p><strong>Hohes Q-Wert (Produkte angereichert):</strong> Das Zellpotential ist höher als E°. Die Reaktion wird weniger spontan.</p>';
  } else {
    interpretation = '<p><strong>Niedriges Q-Wert (Edukt angereichert):</strong> Das Zellpotential ist niedriger als E°. Die Reaktion ist spontaner.</p>';
  }

  if (E > 0) {
    interpretation += '<p><strong>Reaktion ist spontan:</strong> E > 0 V, positive Reaktion treibend.</p>';
  } else if (E < 0) {
    interpretation += '<p><strong>Reaktion ist nicht spontan:</strong> E < 0 V, negative Reaktion nicht treibend.</p>';
  } else {
    interpretation += '<p><strong>Gleichgewicht:</strong> E = 0 V, kein treibend.</p>';
  }

  display.innerHTML = interpretation;
}