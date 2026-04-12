/**
 * Bindungspotential Rechner
 * Interactive energy diagrams for chemical bonds with activation barriers
 */

// Constants
const GAS_CONSTANT = 8.314; // J/mol·K
const AVOGADRO = 6.022e23; // molecules/mol

// Bond energy data (kJ/mol)
const BOND_DATA = {
  'h-h': { energy: 436, equilibrium: 0.74, color: '#3498db' },
  'h-cl': { energy: 431, equilibrium: 1.27, color: '#2ecc71' },
  'c-h': { energy: 413, equilibrium: 1.09, color: '#e74c3c' },
  'c-c': { energy: 347, equilibrium: 1.54, color: '#9b59b6' },
  'c=c': { energy: 614, equilibrium: 1.34, color: '#f39c12' },
  'c≡c': { energy: 839, equilibrium: 1.2, color: '#e67e22' },
  'o-h': { energy: 463, equilibrium: 0.96, color: '#1abc9c' },
  'n-h': { energy: 391, equilibrium: 1.01, color: '#e84393' },
};

// Reaction data
const REACTION_DATA = {
  'ch4-combustion': {
    equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    reactants: -1652,
    products: -2422,
    deltaH: -770,
    type: 'exotherm',
  },
  'nh3-synthesis': {
    equation: 'N₂ + 3H₂ → 2NH₃',
    reactants: 0,
    products: -92,
    deltaH: -92,
    type: 'exotherm',
  },
  photosynthesis: {
    equation: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    reactants: -12760,
    products: -12732,
    deltaH: 28,
    type: 'endotherm',
  },
  decomposition: {
    equation: '2H₂O → 2H₂ + O₂',
    reactants: -572,
    products: 0,
    deltaH: 572,
    type: 'endotherm',
  },
};

// DOM element cache
const domCache = {
  binding: {
    typ: null,
    abstand: null,
    abstandDisplay: null,
    bindungsenergie: null,
    gleichgewichtsabstand: null,
    aktuelleEnergie: null,
    canvas: null,
  },
  reaction: {
    typ: null,
    beispiel: null,
    formel: null,
    eduktEnergie: null,
    produktEnergie: null,
    reaktionsenthalpie: null,
    reaktionstypText: null,
    canvas: null,
  },
  activation: {
    temperatur: null,
    tempDisplay: null,
    eaInput: null,
    deltaHInput: null,
    arrheniusFaktor: null,
    reaktionsgeschwindigkeit: null,
    halbwertszeit: null,
    eaDisplay: null,
    dhDisplay: null,
    tempCanvas: null,
    activationCanvas: null,
  },
  catalyst: {
    aktiv: null,
    eaReduction: null,
    canvas: null,
  },
  coordinate: {
    slider: null,
    fortschritt: null,
    canvas: null,
  },
};

let currentBond = BOND_DATA['h-h'];
let showGrid = true;
let animationId = null;

// Initialize DOM cache
function initDOMCache() {
  domCache.binding.typ = document.getElementById('bindungstyp');
  domCache.binding.abstand = document.getElementById('atomabstand');
  domCache.binding.abstandDisplay = document.getElementById('abstand-display');
  domCache.binding.bindungsenergie = document.getElementById('bindungsenergie');
  domCache.binding.gleichgewichtsabstand = document.getElementById('gleichgewichtsabstand');
  domCache.binding.aktuelleEnergie = document.getElementById('aktuelle-energie');
  domCache.binding.canvas = document.getElementById('binding-canvas');

  domCache.reaction.typ = document.getElementById('reaktions-typ');
  domCache.reaktion.beispiel = document.getElementById('beispiel-reaktion');
  domCache.reaktion.formel = document.getElementById('reaktion-formel');
  domCache.reaktion.eduktEnergie = document.getElementById('edukt-energie');
  domCache.reaktion.produktEnergie = document.getElementById('produkt-energie');
  domCache.reaktion.reaktionsenthalpie = document.getElementById('reaktionsenthalpie');
  domCache.reaktion.reaktionstypText = document.getElementById('reaktionstyp-text');
  domCache.reaktion.canvas = document.getElementById('reaction-canvas');

  domCache.activation.temperatur = document.getElementById('temperatur');
  domCache.activation.tempDisplay = document.getElementById('temp-display');
  domCache.activation.eaInput = document.getElementById('aktivierungsenergie-input');
  domCache.activation.deltaHInput = document.getElementById('reaktionsenthalpie-input');
  domCache.activation.arrheniusFaktor = document.getElementById('arrhenius-faktor');
  domCache.activation.reaktionsgeschwindigkeit = document.getElementById(
    'reaktionsgeschwindigkeit'
  );
  domCache.activation.halbwertszeit = document.getElementById('halbwertszeit');
  domCache.activation.eaDisplay = document.getElementById('ea-display');
  domCache.activation.dhDisplay = document.getElementById('dh-display');
  domCache.activation.tempCanvas = document.getElementById('temp-canvas');
  domCache.activation.activationCanvas = document.getElementById('activation-canvas');

  domCache.catalyst.aktiv = document.getElementById('katalysator-aktiv');
  domCache.catalyst.eaReduction = document.getElementById('ea-reduction');
  domCache.catalyst.canvas = document.getElementById('catalyst-canvas');

  domCache.coordinate.slider = document.getElementById('reaktion-slider');
  domCache.coordinate.fortschritt = document.getElementById('reaktion-fortschritt');
  domCache.coordinate.canvas = document.getElementById('coordinate-canvas');
}

// Calculate potential energy using Morse potential
function morsePotential(r, De, re) {
  const a = 1;
  return De * (Math.pow(1 - Math.exp(-a * (r - re)), 2) - 1);
}

// Simple Lennard-Jones potential approximation
function lennardJonesPotential(r, epsilon, sigma) {
  const r6 = Math.pow(sigma / r, 6);
  const r12 = r6 * r6;
  return 4 * epsilon * (r12 - r6);
}

// Update bond data
function updateBindingData() {
  const bondType = domCache.binding.typ.value;
  currentBond = BOND_DATA[bondType] || BOND_DATA['h-h'];

  domCache.binding.bindungsenergie.textContent = `${currentBond.energy} kJ/mol`;
  domCache.binding.gleichgewichtsabstand.textContent = `${currentBond.equilibrium} Å`;

  updateBindingDiagram();
}

function updateBindingDiagram() {
  if (!domCache.binding.abstand) {
    initDOMCache();
  }

  const distance = parseFloat(domCache.binding.abstand.value);
  domCache.binding.abstandDisplay.textContent = `${distance.toFixed(1)} Å`;

  const energy = calculateBondEnergy(distance);
  domCache.binding.aktuelleEnergie.textContent = `${energy.toFixed(0)} kJ/mol`;

  drawBindingDiagram();
}

// Calculate bond energy at given distance
function calculateBondEnergy(r) {
  const De = currentBond.energy;
  const re = currentBond.equilibrium;

  const potentialEnergy = morsePotential(r, De, re);

  return Math.round(potentialEnergy);
}

function drawBindingDiagram() {
  const canvas = domCache.binding.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = 60;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  const maxEnergy = currentBond.energy * 1.2;
  const minEnergy = -currentBond.energy * 1.1;
  const maxDistance = 4.0;
  const minDistance = 0.5;

  function toCanvasX(r) {
    return padding + ((r - minDistance) / (maxDistance - minDistance)) * graphWidth;
  }

  function toCanvasY(E) {
    return height - padding - ((E - minEnergy) / (maxEnergy - minEnergy)) * graphHeight;
  }

  if (showGrid) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * graphWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();

      const y = padding + (i / 10) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = currentBond.color;
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let r = minDistance; r <= maxDistance; r += 0.01) {
    const E = calculateBondEnergy(r);
    const x = toCanvasX(r);
    const y = toCanvasY(E);

    if (r === minDistance) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  const currentDistance = parseFloat(domCache.binding.abstand.value);
  const currentEnergy = calculateBondEnergy(currentDistance);
  const currentX = toCanvasX(currentDistance);
  const currentY = toCanvasY(currentEnergy);

  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(currentX, currentY);
  ctx.lineTo(currentX, toCanvasY(0));
  ctx.stroke();

  ctx.font = '14px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('E', toCanvasX(currentDistance), toCanvasY(currentEnergy) - 15);
  ctx.fillText('r', toCanvasX(currentDistance), toCanvasY(0) + 20);

  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.fillText('Atomabstand (Å)', width / 2, height - 15);

  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Potentielle Energie (kJ/mol)', 0, 0);
  ctx.restore();
}

// Animate bond formation
function animateBondFormation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  const startDistance = 4.0;
  const endDistance = currentBond.equilibrium;
  const duration = 2000;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentDistance = startDistance - (startDistance - endDistance) * easeProgress;

    domCache.binding.abstand.value = currentDistance;
    updateBindingDiagram();

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  }

  animationId = requestAnimationFrame(animate);
}

function resetBindingDiagram() {
  domCache.binding.abstand.value = 2.5;
  updateBindingDiagram();
}

function toggleGrid() {
  showGrid = !showGrid;
  drawBindingDiagram();
}

function updateReactionData() {
  const reactionType = domCache.reaktion.typ.value;

  const typeText = {
    exotherm: 'Exotherm - Energie wird freigesetzt',
    endotherm: 'Endotherm - Energie wird aufgenommen',
    neutral: 'Thermoneutral - Keine Energieänderung',
  };

  domCache.reaktion.reaktionstypText.textContent = typeText[reactionType];
  drawReactionDiagram();
}

function loadExampleReaction() {
  const reactionKey = domCache.reaktion.beispiel.value;
  const reaction = REACTION_DATA[reactionKey];

  if (reaction) {
    domCache.reaktion.formel.textContent = reaction.equation;
    domCache.reaktion.eduktEnergie.textContent = `${reaction.reactants} kJ/mol`;
    domCache.reaktion.produktEnergie.textContent = `${reaction.products} kJ/mol`;
    domCache.reaktion.reaktionsenthalpie.textContent = `${reaction.deltaH} kJ/mol`;
    domCache.reaktion.reaktionsenthalpie.className =
      reaction.deltaH < 0 ? 'value large highlight' : 'value large';

    const typeText =
      reaction.type === 'exotherm'
        ? 'Exotherm - Energie wird freigesetzt'
        : reaction.type === 'endotherm'
          ? 'Endotherm - Energie wird aufgenommen'
          : 'Thermoneutral - Keine Energieänderung';
    domCache.reaktion.reaktionstypText.textContent = typeText;

    drawReactionDiagram();
  }
}

function drawReactionDiagram() {
  const canvas = domCache.reaktion.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = 60;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  const exampleKey = domCache.reaktion.beispiel.value;
  const reaction = REACTION_DATA[exampleKey] || REACTION_DATA['ch4-combustion'];

  const reactantEnergy = reaction.reactants;
  const productEnergy = reaction.products;
  const deltaH = reaction.deltaH;

  const maxEnergy = Math.max(reactantEnergy, productEnergy) + 200;
  const minEnergy = Math.min(reactantEnergy, productEnergy) - 200;

  function toCanvasY(E) {
    return height - padding - ((E - minEnergy) / (maxEnergy - minEnergy)) * graphHeight;
  }

  if (showGrid) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    for (let i = 0; i <= 4; i++) {
      const x = padding + (i / 4) * graphWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
  }

  const reactantY = toCanvasY(reactantEnergy);
  const productY = toCanvasY(productEnergy);

  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(padding - 30, reactantY - 20, 60, 40);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Edukte', padding, reactantY + 5);

  ctx.fillStyle = '#4ecdc4';
  ctx.fillRect(width - padding - 30, productY - 20, 60, 40);
  ctx.fillStyle = '#fff';
  ctx.fillText('Produkte', width - padding, productY + 5);

  const midX = width / 2;
  const activationY = toCanvasY(Math.max(reactantEnergy, productEnergy) + 100);

  ctx.fillStyle = '#ffe66d';
  ctx.beginPath();
  ctx.arc(midX, activationY, 15, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.fillText('TS', midX, activationY + 5);

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.moveTo(padding, reactantY);
  ctx.quadraticCurveTo(padding + 50, activationY, midX, activationY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(midX, activationY);
  ctx.quadraticCurveTo(width - padding - 50, activationY, width - padding, productY);
  ctx.stroke();

  ctx.setLineDash([]);

  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.fillText('Energie (kJ/mol)', width / 2, height - 15);
}

function drawActivationDiagram() {
  const canvas = domCache.activation.activationCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = 60;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  const ea = parseFloat(domCache.activation.eaInput.value);
  const deltaH = parseFloat(domCache.activation.deltaHInput.value);

  const reactantEnergy = 0;
  const productEnergy = deltaH;
  const transitionEnergy = ea;

  const maxEnergy = Math.max(reactantEnergy, productEnergy, transitionEnergy) + 50;
  const minEnergy = Math.min(reactantEnergy, productEnergy) - 50;

  function toCanvasY(E) {
    return height - padding - ((E - minEnergy) / (maxEnergy - minEnergy)) * graphHeight;
  }

  if (showGrid) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  }

  const reactantX = padding + graphWidth * 0.25;
  const productX = padding + graphWidth * 0.75;
  const transitionX = width / 2;

  const reactantY = toCanvasY(reactantEnergy);
  const productY = toCanvasY(productEnergy);
  const transitionY = toCanvasY(transitionEnergy);

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.moveTo(reactantX, reactantY);
  ctx.quadraticCurveTo(reactantX + 30, transitionY, transitionX, transitionY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(transitionX, transitionY);
  ctx.quadraticCurveTo(productX - 30, transitionY, productX, productY);
  ctx.stroke();

  ctx.setLineDash([]);

  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(reactantX - 25, reactantY - 15, 50, 30);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Edukte', reactantX, reactantY + 5);

  ctx.fillStyle = '#4ecdc4';
  ctx.fillRect(productX - 25, productY - 15, 50, 30);
  ctx.fillStyle = '#fff';
  ctx.fillText('Produkte', productX, productY + 5);

  ctx.fillStyle = '#ffe66d';
  ctx.beginPath();
  ctx.arc(transitionX, transitionY, 12, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillText('TS', transitionX, transitionY + 5);

  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(transitionX, transitionY);
  ctx.lineTo(transitionX, toCanvasY(0));
  ctx.stroke();

  ctx.font = '12px Arial';
  ctx.fillStyle = '#e74c3c';
  ctx.fillText('Ea', transitionX + 15, toCanvasY(transitionEnergy / 2));

  ctx.fillStyle = '#666';
  ctx.fillText('Energie (kJ/mol)', width / 2, height - 15);
}

function drawTemperatureComparison() {
  const canvas = domCache.activation.tempCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = 50;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  const ea = parseFloat(domCache.activation.eaInput.value);

  function toCanvasX(T) {
    return padding + ((T - 200) / (1000 - 200)) * graphWidth;
  }

  function toCanvasY(k) {
    const maxLogK = Math.log10(calculateRateConstant(298, ea));
    const minLogK = Math.log10(calculateRateConstant(200, ea));
    return height - padding - ((Math.log10(k) - minLogK) / (maxLogK - minLogK)) * graphHeight;
  }

  if (showGrid) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let T = 200; T <= 1000; T += 200) {
      const x = toCanvasX(T);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${T}K`, x, height - 30);
    }
  }

  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let T = 200; T <= 1000; T += 10) {
    const k = calculateRateConstant(T, ea);
    const x = toCanvasX(T);
    const y = toCanvasY(k);

    if (T === 200) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.fillText('Temperatur (K)', width / 2, height - 15);

  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('log(k)', 0, 0);
  ctx.restore();
}

function updateCatalystDemo() {
  const hasCatalyst = domCache.catalyst.aktiv.checked;
  const reduction = hasCatalyst ? 50 : 0;

  domCache.catalyst.eaReduction.textContent = reduction;

  drawCatalystDiagram();
}

function drawCatalystDiagram() {
  const canvas = domCache.catalyst.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = 50;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  const ea = parseFloat(domCache.activation.eaInput.value);
  const hasCatalyst = domCache.catalyst.aktiv.checked;
  const reduction = hasCatalyst ? 0.5 : 1.0;

  const reactantEnergy = 0;
  const productEnergy = ea * 0.5;
  const transitionEnergy = ea * reduction;

  const maxEnergy = Math.max(reactantEnergy, productEnergy, transitionEnergy) + 50;
  const minEnergy = Math.min(reactantEnergy, productEnergy) - 50;

  function toCanvasY(E) {
    return height - padding - ((E - minEnergy) / (maxEnergy - minEnergy)) * graphHeight;
  }

  const reactantX = padding + graphWidth * 0.3;
  const productX = padding + graphWidth * 0.7;
  const transitionX = width / 2;

  const reactantY = toCanvasY(reactantEnergy);
  const productY = toCanvasY(productEnergy);
  const transitionY = toCanvasY(transitionEnergy);

  ctx.strokeStyle = hasCatalyst ? '#27ae60' : '#e74c3c';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.moveTo(reactantX, reactantY);
  ctx.quadraticCurveTo(reactantX + 20, transitionY, transitionX, transitionY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(transitionX, transitionY);
  ctx.quadraticCurveTo(productX - 20, transitionY, productX, productY);
  ctx.stroke();

  ctx.setLineDash([]);

  if (hasCatalyst) {
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(transitionX - 15, transitionY - 5, 30, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Kat', transitionX, transitionY + 3);
  }

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(transitionX, transitionY);
  ctx.lineTo(transitionX, toCanvasY(0));
  ctx.stroke();
}

// Update reaction coordinate
function updateReactionCoordinate() {
  const progress = parseInt(domCache.coordinate.slider.value);
  domCache.coordinate.fortschritt.textContent = progress;

  drawCoordinateDiagram(progress);
}

// Draw coordinate diagram
function drawCoordinateDiagram(progress) {
  const canvas = domCache.coordinate.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = 50;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  const ea = parseFloat(domCache.activation.eaInput.value);
  const deltaH = parseFloat(domCache.activation.deltaHInput.value);

  const progressRatio = progress / 100;

  const currentEnergy = calculateEnergyAtProgress(progressRatio, ea, deltaH);

  const reactantEnergy = 0;
  const productEnergy = deltaH;
  const transitionEnergy = ea;

  const maxEnergy = Math.max(reactantEnergy, productEnergy, transitionEnergy) + 50;
  const minEnergy = Math.min(reactantEnergy, productEnergy) - 50;

  function toCanvasX(p) {
    return padding + p * graphWidth;
  }

  function toCanvasY(E) {
    return height - padding - ((E - minEnergy) / (maxEnergy - minEnergy)) * graphHeight;
  }

  if (showGrid) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * graphWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let p = 0; p <= 1; p += 0.01) {
    const E = calculateEnergyAtProgress(p, ea, deltaH);
    const x = toCanvasX(p);
    const y = toCanvasY(E);

    if (p === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  const currentX = toCanvasX(progressRatio);
  const currentY = toCanvasY(currentEnergy);

  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(currentX, currentY, 10, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Reaktion', width / 2, height - 15);
}

function calculateEnergyAtProgress(p, Ea, deltaH) {
  if (p <= 0.5) {
    return 4 * Ea * p * (1 - p);
  } else {
    const p2 = 1 - p;
    return deltaH + 4 * Ea * p2 * (1 - p2);
  }
}

// Arrhenius equation: k = A * exp(-Ea / (R * T))
function calculateRateConstant(temperature, activationEnergy) {
  const A = 1e10; // Pre-exponential factor (simplified)
  const R = 8.314; // Gas constant J/(mol·K)
  const Ea = activationEnergy * 1000; // Convert kJ to J
  return A * Math.exp(-Ea / (R * temperature));
}

// Update the activation energy diagram on the canvas
function updateActivationDiagram() {
  drawActivationDiagram();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  initDOMCache();
  updateBindingData();
  loadExampleReaction();
  updateActivationDiagram();
  updateCatalystDemo();
  updateReactionCoordinate();
});
