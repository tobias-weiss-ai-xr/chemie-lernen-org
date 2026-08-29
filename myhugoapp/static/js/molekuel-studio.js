import * as THREE from 'three';
import { moleculeData } from './molecule-data.js';

const __debug = {
  log(...args) {
    if (console && console.log) console.log('[Molekülstudio]', ...args);
  },
};

// Set loaded flag immediately to prevent timeout
__debug.log('Molekülstudio script loaded');
window.moleculeStudioLoaded = true;

// Error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  // Don't set moleculeStudioLoaded to false on global errors
  // The script is loaded, even if there's a runtime error
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// Global flag to track initialization
window.moleculeStudioInitialized = false;
window.moleculeStudioError = null;

// Globale Variablen (Modul-Scope)
let scene, camera, renderer;
let moleculeGroup = null;
// A11Y: Honor prefers-reduced-motion (WCAG 2.2.2) — auto-rotate is
// a non-essential motion. Initialize based on user preference.
let autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// DOM Elemente werden beim Initialisieren gesetzt
let container, canvas, moleculeInput, visualizeBtn, moleculeInfo;
let errorMessage, welcomeScreen, loadingScreen, controlsInfo, autoRotateCheckbox;
function init() {
  __debug.log('Init function called');

  // Hide loading message
  const loadingMsg = document.getElementById('js-loading');
  if (loadingMsg) {
    loadingMsg.style.display = 'none';
  }

  // DOM Elemente abrufen
  container = document.getElementById('molecule-studio-container');
  canvas = document.getElementById('molecule-canvas');
  moleculeInput = document.getElementById('molecule-input');
  visualizeBtn = document.getElementById('visualize-btn');
  moleculeInfo = document.getElementById('molecule-info');
  errorMessage = document.getElementById('error-message');
  welcomeScreen = document.getElementById('welcome-screen');
  loadingScreen = document.getElementById('loading-screen');
  controlsInfo = document.getElementById('controls-info');
  autoRotateCheckbox = document.getElementById('auto-rotate');

  __debug.log('DOM elements:', { container, canvas, moleculeInput, visualizeBtn });

  if (!container || !canvas || !moleculeInput || !visualizeBtn) {
    console.error('Ein oder mehrere Elemente nicht gefunden!');
    showError(
      'Die erforderlichen HTML-Elemente wurden nicht gefunden. Bitte laden Sie die Seite neu.'
    );
    return;
  }

  try {
    __debug.log('Molekülstudio wird initialisiert...');
    window.moleculeStudioInitialized = true;
    window.moleculeStudioLoaded = true; // Ensure this is set

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8f5e9);

    // Camera
    camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight || 1,
      0.1,
      1000
    );
    camera.position.z = 10;

    // Renderer
    __debug.log('Creating WebGL renderer...');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    updateRendererSize();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    __debug.log('Renderer created:', renderer);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Event Listeners
    setupEventListeners();

    // Setup ResizeObserver for better responsiveness
    setupResizeObserver();

    // Animation
    animate();
  } catch (error) {
    console.error('Fehler bei der Initialisierung:', error);
    window.moleculeStudioError = error;
    showError('Fehler beim Laden der 3D-Grafik: ' + error.message);
  }
}

function showError(message) {
  console.error('showError called:', message);

  // Hide loading screen
  if (loadingScreen && loadingScreen.parentNode) {
    loadingScreen.style.display = 'none';
  }

  // Hide welcome screen
  if (welcomeScreen && welcomeScreen.parentNode) {
    welcomeScreen.style.display = 'none';
  }

  // Show error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 20px;
        border-radius: 8px;
        margin: 20px;
        border: 2px solid #f5c6cb;
        text-align: center;
    `;
  errorDiv.innerHTML = `
        <h3>⚠️ Fehler</h3>
        <p>${message}</p>
        <p><small>Bitte stellen Sie sicher, dass JavaScript aktiviert ist und versuchen Sie es erneut.</small></p>
        <button class="btn btn-primary" onclick="location.reload()">Neu laden</button>
    `;

  if (container) {
    container.appendChild(errorDiv);
  }

  // Also try to show in error-message element if it exists
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
}

function updateRendererSize() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (width > 0 && height > 0) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
}

function setupResizeObserver() {
  const resizeObserver = new ResizeObserver(() => {
    updateRendererSize();
  });
  resizeObserver.observe(container);
}

function setupEventListeners() {
  __debug.log('Setting up event listeners...');

  // Visualize button
  visualizeBtn.addEventListener('click', () => {
    __debug.log('Visualize button clicked');
    const moleculeName = moleculeInput.value.trim();
    if (moleculeName) {
      visualizeMolecule(moleculeName);
    }
  });

  // Enter key
  moleculeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const moleculeName = moleculeInput.value.trim();
      if (moleculeName) {
        visualizeMolecule(moleculeName);
      }
    }
  });

  // Suggestion chips - only add listeners if not already added by early-init script
  const chipsWithoutListeners = Array.from(document.querySelectorAll('.suggestion-chip')).filter(
    (chip) => !chip.hasAttribute('data-listener-attached')
  );

  chipsWithoutListeners.forEach((chip) => {
    chip.addEventListener('click', () => {
      const molecule = chip.dataset.molecule;
      moleculeInput.value = molecule;
      visualizeMolecule(molecule);
    });
    chip.setAttribute('data-listener-attached', 'true');
  });

  // Auto-rotate toggle
  autoRotateCheckbox.addEventListener('change', (e) => {
    autoRotate = e.target.checked;
  });

  // Mouse controls
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('wheel', onWheel);

  // Window resize
  window.addEventListener('resize', onWindowResize);
}

function onMouseDown(event) {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
  autoRotate = false;
  autoRotateCheckbox.checked = false;
}

function onMouseUp() {
  isDragging = false;
}

function onMouseMove(event) {
  if (!isDragging || !moleculeGroup) return;

  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  moleculeGroup.rotation.y += deltaX * 0.01;
  moleculeGroup.rotation.x += deltaY * 0.01;

  previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onWheel(event) {
  event.preventDefault();
  camera.position.z += event.deltaY * 0.01;
  camera.position.z = Math.max(3, Math.min(30, camera.position.z));
}

function onWindowResize() {
  updateRendererSize();
}

function visualizeMolecule(name) {
  showError('');
  const data = moleculeData[name];

  if (!data) {
    showError(
      `Molekül "${name}" nicht gefunden. Versuchen Sie: Wasser, Methan, Ammoniak, Kohlendioxid, Ethen, Ethanol, Essigsäure, Benzol, Acetylen, Koffein, Aspirin, Serotonin, Ozon, Schwefelhexafluorid oder Glucose.`
    );
    if (canvas) {
      canvas.setAttribute('aria-label', '3D-Visualisierung fehlgeschlagen: ' + name);
    }
    return;
  }

  showLoading(true);

  setTimeout(() => {
    renderMolecule(data);
    showMoleculeInfo(data);
    showLoading(false);
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (controlsInfo) controlsInfo.style.display = 'block';
    if (canvas) {
      canvas.setAttribute(
        'aria-label',
        '3D-Visualisierung von ' + name + ' (' + (data.formula || '') + ')'
      );
    }
  }, 500);
}

function renderMolecule(data) {
  // Clear previous molecule
  if (moleculeGroup) {
    scene.remove(moleculeGroup);
  }

  moleculeGroup = new THREE.Group();

  // Create atom map
  const atomMap = new Map();

  // Create atoms
  data.atoms.forEach((atom) => {
    const elementInfo = data.elements[atom.element];
    if (!elementInfo) return;

    const color = parseInt(elementInfo.color.replace('#', '0x'));
    const radius = elementInfo.radius;

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshLambertMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.set(...atom.position);
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    moleculeGroup.add(sphere);
    atomMap.set(atom.id, atom);
  });

  // Create bonds
  data.bonds.forEach((bond) => {
    const atom1 = atomMap.get(bond.atom1);
    const atom2 = atomMap.get(bond.atom2);

    if (!atom1 || !atom2) return;

    const start = new THREE.Vector3(...atom1.position);
    const end = new THREE.Vector3(...atom2.position);
    const direction = new THREE.Vector3().subVectors(end, start);
    const distance = direction.length();

    if (bond.type === 'single') {
      const cylinder = createBondCylinder(start, end, distance, 0.05);
      moleculeGroup.add(cylinder);
    } else if (bond.type === 'double') {
      const offset = 0.08;
      const perpendicular = calculatePerpendicular(direction);
      // eslint-disable-next-line no-unused-vars
      const midpoint = new THREE.Vector3().copy(start).add(end).divideScalar(2);

      const cylinder1 = createBondCylinder(
        start.clone().add(perpendicular.clone().multiplyScalar(offset / distance)),
        end.clone().add(perpendicular.clone().multiplyScalar(offset / distance)),
        distance,
        0.04
      );
      const cylinder2 = createBondCylinder(
        start.clone().sub(perpendicular.clone().multiplyScalar(offset / distance)),
        end.clone().sub(perpendicular.clone().multiplyScalar(offset / distance)),
        distance,
        0.04
      );
      moleculeGroup.add(cylinder1);
      moleculeGroup.add(cylinder2);
    } else if (bond.type === 'triple') {
      const offset = 0.1;
      const perpendicular = calculatePerpendicular(direction);

      // Central bond
      const centerCylinder = createBondCylinder(start, end, distance, 0.04);
      moleculeGroup.add(centerCylinder);

      // Two outer bonds
      const cylinder1 = createBondCylinder(
        start.clone().add(perpendicular.clone().multiplyScalar(offset / distance)),
        end.clone().add(perpendicular.clone().multiplyScalar(offset / distance)),
        distance,
        0.03
      );
      const cylinder2 = createBondCylinder(
        start.clone().sub(perpendicular.clone().multiplyScalar(offset / distance)),
        end.clone().sub(perpendicular.clone().multiplyScalar(offset / distance)),
        distance,
        0.03
      );
      moleculeGroup.add(cylinder1);
      moleculeGroup.add(cylinder2);
    }
  });

  scene.add(moleculeGroup);

  // Center and fit to view
  const box = new THREE.Box3().setFromObject(moleculeGroup);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  moleculeGroup.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const distance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.5;

  camera.position.set(0, 0, Math.max(distance, 5));
  camera.lookAt(0, 0, 0);

  // Reset rotation
  moleculeGroup.rotation.set(0, 0, 0);
  autoRotate = true;
  autoRotateCheckbox.checked = true;
}

function createBondCylinder(start, end, distance, radius) {
  const geometry = new THREE.CylinderGeometry(radius, radius, distance, 8);
  const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
  const cylinder = new THREE.Mesh(geometry, material);

  cylinder.position.copy(start).add(end).divideScalar(2);
  cylinder.lookAt(end);
  cylinder.rotateX(Math.PI / 2);

  return cylinder;
}

function calculatePerpendicular(direction) {
  if (Math.abs(direction.y) < 0.9) {
    return new THREE.Vector3(0, 1, 0).cross(direction).normalize();
  } else {
    return new THREE.Vector3(1, 0, 0).cross(direction).normalize();
  }
}

function showLoading(show) {
  if (loadingScreen) loadingScreen.style.display = show ? 'flex' : 'none';
  if (visualizeBtn) visualizeBtn.disabled = show;
}

function showMoleculeInfo(data) {
  let infoHtml =
    'Formel: ' +
    data.formula +
    ' • Atome: ' +
    data.atoms.length +
    ' • Bindungen: ' +
    data.bonds.length;

  // Add Wikipedia link if available
  if (data.wikipedia) {
    infoHtml +=
      '<br><a href="' +
      data.wikipedia +
      '" target="_blank" rel="noopener noreferrer" style="color: #4caf50; text-decoration: none; font-size: 0.9em;">📚 Wikipedia: ' +
      data.formula +
      '</a>';
  }

  moleculeInfo.innerHTML = infoHtml;
  moleculeInfo.style.display = 'block';
}

function animate() {
  requestAnimationFrame(animate);

  if (autoRotate && moleculeGroup) {
    moleculeGroup.rotation.y += 0.01;
  }

  renderer.render(scene, camera);
}

__debug.log('Animation loop function defined');

// Warte bis DOM geladen ist, dann initialisiere
__debug.log('Document ready state:', document.readyState);

// Warte bis DOM geladen ist, dann initialisiere
if (document.readyState === 'loading') {
  __debug.log('Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    __debug.log('DOMContentLoaded fired, calling init()');
    init();
  });
} else {
  __debug.log('DOM already loaded, calling init() immediately');
  init();
}

// Process any molecules that were queued before the module loaded
setTimeout(() => {
  if (window.moleculeStudioQueue && window.moleculeStudioQueue.length > 0) {
    __debug.log('Processing queued molecules:', window.moleculeStudioQueue);

    // Process each queued molecule
    window.moleculeStudioQueue.forEach((molecule) => {
      if (moleculeData[molecule]) {
        __debug.log('Visualizing queued molecule:', molecule);
        visualizeMolecule(molecule);
      }
    });

    // Clear the queue
    window.moleculeStudioQueue = [];
  }
}, 100);

// Export visualizeMolecule to window for early-init access
window.visualizeMolecule = visualizeMolecule;

// Export moleculeData for testing
window.moleculeData = moleculeData;

// Process any molecules that were queued before the module loaded
function processQueue() {
  if (window.moleculeStudioQueue && window.moleculeStudioQueue.length > 0) {
    __debug.log('Processing queued molecules:', window.moleculeStudioQueue);

    // Process each queued molecule
    while (window.moleculeStudioQueue.length > 0) {
      const molecule = window.moleculeStudioQueue.shift();
      if (moleculeData[molecule]) {
        __debug.log('Visualizing queued molecule:', molecule);
        visualizeMolecule(molecule);
      } else {
        console.warn('Molecule not found in data:', molecule);
      }
    }
  }
}

// Process queue immediately
processQueue();

// Also set up an interval to process any new queue items (for clicks during init)
let queueChecker = setInterval(() => {
  if (
    window.moleculeStudioInitialized &&
    window.moleculeStudioQueue &&
    window.moleculeStudioQueue.length > 0
  ) {
    processQueue();
  }
}, 100);

// Clear interval after 5 seconds
setTimeout(() => {
  clearInterval(queueChecker);
}, 5000);

// Cleanup on page navigation to prevent memory leaks
window.addEventListener('beforeunload', () => {
  clearInterval(queueChecker);
});
