/**
 * Chemisches Gleichgewicht Rechner
 * Dynamic equilibrium and Le Chatelier's principle visualization
 */

const AS_CONSTANT = 8.314;

let equilibriumState = {
  concA: 1.0,
  concB: 1.0,
  concC: 1.0,
  concD: 1.0,
  quotient: 1.0,
  progress: 0,
  reactionQuotient: 1.0,
  direction: 'equilibrium',
};

let isAnimating = false;

const domCache = {
  equilibrium: {
    canvas: null,
    concA: null,
    concB: null,
    concC: null,
    concD: null,
    kcValue: null,
    progressDisplay: null,
    directionBadge: null,
    startBtn: null,
  },
};

function initDOMCache() {
  domCache.equilibrium.canvas = document.getElementById('equilibrium-canvas');
  domCache.equilibrium.concA = document.getElementById('conc-a');
  domCache.equilibrium.concB = document.getElementById('conc-b');
  domCache.equilibrium.concC = document.getElementById('conc-c');
  domCache.equilibrium.concD = document.getElementById('conc-d');
  domCache.equilibrium.kcValue = document.getElementById('kc-value');
  domCache.equilibrium.progressDisplay = document.getElementById('reaction-direction');
  domCache.equilibrium.directionBadge = document.getElementById('reaction-direction');
  domCache.equilibrium.startBtn = document.getElementById('start-equilibrium');
}

function calculateKc() {
  const Q =
    (equilibriumState.concC * equilibriumState.concD) /
    (equilibriumState.concA * equilibriumState.concB);
  equilibriumState.direction = Q === 1 ? 'equilibrium' : Q > 1 ? 'products' : 'reactants';
  domCache.equilibrium.directionBadge.textContent =
    Q === 1 ? 'Gleichgewicht' : Q > 1 ? 'Produkte' : 'Edukte';
  domCache.equilibrium.progressDisplay.textContent = `Reaktionsfortschritt: 0%`;
}

function updateEquilibrium() {
  const concA = parseFloat(domCache.equilibrium.concA.value) || 0;
  const concB = parseFloat(domCache.equilibrium.concB.value) || 0;
  const concC = parseFloat(domCache.equilibrium.concC.value) || 0;
  const concD = parseFloat(domCache.equilibrium.concD.value) || 0;

  equilibriumState.concA = concA;
  equilibriumState.concB = concB;
  equilibriumState.concC = concC;
  equilibriumState.concD = concD;

  const Q = (concC * concD) / (concA * concB);
  equilibriumState.quotient = Q;
  equilibriumState.progress = 0;

  calculateKc();
  drawEquilibriumCanvas();
}

function drawEquilibriumCanvas() {
  const canvas = domCache.equilibrium.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = 60;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(graphWidth, graphHeight) * 0.35;

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();

  const labels = [
    { label: '[A]', y: centerY - radius, color: '#3498db' },
    { label: '[B]', x: centerX, y: centerY - radius, color: '#e74c3c' },
    { label: '[C]', x: centerX, y: centerY - radius, color: '#f39c12' },
    { label: '[D]', x: centerX + radius, y: centerY, color: '#9b59b6' },
  ];

  labels.forEach((item) => {
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, item.x, item.y);
  });

  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Reaktionsfortschritt: 0%', centerX, height - 30);
}

function startEquilibriumSimulation() {
  if (isAnimating) {
    isAnimating = false;
    domCache.equilibrium.startBtn.textContent = 'Start';
    domCache.equilibrium.startBtn.className = 'btn btn-primary';
    return;
  }

  isAnimating = true;
  domCache.equilibrium.startBtn.textContent = 'Stopp';
  domCache.equilibrium.startBtn.className = 'btn btn-danger';

  animateEquilibrium();
}

function animateEquilibrium() {
  if (!isAnimating) return;

  const duration = 10000;
  const steps = 200;
  let step = 0;

  function animate() {
    if (!isAnimating || step >= steps) return;

    equilibriumState.progress = step / steps;
    calculateKc();
    drawEquilibriumCanvas();

    step++;
    requestAnimationFrame(animate);
  }

  animate();
}

document.addEventListener('DOMContentLoaded', function () {
  initDOMCache();
  updateEquilibrium();
});
