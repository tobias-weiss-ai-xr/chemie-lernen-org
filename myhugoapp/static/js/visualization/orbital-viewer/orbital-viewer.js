// orbital-viewer.js — Main entry point for the 3D orbital viewer
// allow: SIZE_OK — orchestrator entry point under 4-file constraint.
// Wires scene, state, animation, electrons, cleanup in one module.
// Creates a Three.js scene with WebGLRenderer, wires orbital data, shape
// generators, and UI controls into an interactive visualization.
//
// Usage:
//   const cleanup = initOrbitalViewer('orbital-container');
//   // ... later: cleanup();

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ORBITALS } from './orbital-data.js';
import {
  createSphereGeometry,
  createDumbbellGeometry,
  createCloverGeometry,
  createDonutGeometry,
  createMultiLobeGeometry,
  getFOrbitalCoefficients,
} from './orbital-shapes.js';
import { OrbitalControls as UIControls } from './orbital-controls.js';

// ── Material constants ───────────────────────────────────────
const ORBITAL_MATERIAL = new THREE.MeshPhongMaterial({
  vertexColors: true,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.75,
  shininess: 30,
  specular: new THREE.Color(0x222244),
});

const ELECTRON_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xffcc00,
  emissive: 0xff6600,
  emissiveIntensity: 0.6,
  roughness: 0.2,
  metalness: 0.1,
});

const ORBITAL_WIREFRAME = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0x4488ff,
  transparent: true,
  opacity: 0.15,
});

// ── Scene state (module-level, not exported) ─────────────────
let scene, camera, renderer, orbitCtrl;
let orbitalMesh = null;
let orbitalWireframe = null;
let electronMeshes = [];
let axisHelper = null;
let gridHelper = null;
let uiControls = null;
let animationId = null;
let clock = new THREE.Clock();
let currentOrbitalId = '1s';
let currentPhase = false;

// Electron animation data: each electron gets { basePos, angle, radius, speed, yOffset }
let electronData = [];

// ── Internal functions ───────────────────────────────────────

/**
 * Dispose of a Three.js mesh and its associated resources.
 */
function disposeMesh(mesh) {
  if (!mesh) return;
  if (mesh.geometry) mesh.geometry.dispose();
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => m.dispose());
    } else {
      mesh.material.dispose();
    }
  }
  if (mesh.parent) mesh.parent.remove(mesh);
}

/**
 * Build geometry for a given orbital ID.
 * @param {string} orbitalId
 * @param {boolean} phase
 * @returns {THREE.BufferGeometry|null}
 */
function buildOrbitalGeometry(orbitalId, phase) {
  const orb = ORBITALS.find((o) => o.id === orbitalId);
  if (!orb) return null;

  switch (orb.shape) {
    case 'sphere':
      return createSphereGeometry(1.0, 32);
    case 'dumbbell': {
      // Determine axis from orbital ID (2px, 2py, 2pz)
      const axis = orbitalId.charAt(2); // 'x', 'y', or 'z'
      return createDumbbellGeometry(axis, phase, 1.2, 0.6);
    }
    case 'clover': {
      // Map orbital ID to axis pair
      const map = {
        '3dxy': ['x', 'y'],
        '3dxz': ['x', 'z'],
        '3dyz': ['y', 'z'],
        '3dx2y2': ['x', 'y'], // d_x²-y² is also in xy-plane but lobes along axes
      };
      const pair = map[orbitalId] || ['x', 'y'];
      return createCloverGeometry(pair[0], pair[1], phase, 1.0);
    }
    case 'donut':
      return createDonutGeometry(1.0);
    case 'multi-lobe': {
      const coeffs = getFOrbitalCoefficients(orbitalId);
      return createMultiLobeGeometry(coeffs, phase, 1.0);
    }
    default:
      return null;
  }
}

/**
 * Load and display the specified orbital.
 * Clears any previously loaded orbital mesh.
 */
function loadOrbital(orbitalId) {
  currentOrbitalId = orbitalId;

  // Dispose previous orbital meshes
  if (orbitalMesh) {
    disposeMesh(orbitalMesh);
    orbitalMesh = null;
  }
  if (orbitalWireframe) {
    disposeMesh(orbitalWireframe);
    orbitalWireframe = null;
  }

  const geo = buildOrbitalGeometry(orbitalId, currentPhase);
  if (!geo) return;

  // Main orbital surface
  orbitalMesh = new THREE.Mesh(geo, ORBITAL_MATERIAL);
  scene.add(orbitalMesh);

  // Wireframe overlay (uses a clone of the geometry for shared-vertex wireframe)
  const wireGeo = geo.clone();
  orbitalWireframe = new THREE.Mesh(wireGeo, ORBITAL_WIREFRAME);
  scene.add(orbitalWireframe);

  // Update description
  const orb = ORBITALS.find((o) => o.id === orbitalId);
  if (orb && uiControls) {
    uiControls.updateDescription(orb.description);
  }

  // Reposition existing electrons to match new orbital
  repositionElectrons();
}

/**
 * Create electron sphere meshes.
 */
function createElectronMesh() {
  const sphereGeo = new THREE.SphereGeometry(0.08, 12, 12);
  const mesh = new THREE.Mesh(sphereGeo, ELECTRON_MATERIAL);
  // Small glow via point light-like addition: use a slightly larger transparent sphere
  // For simplicity, rely on emissive material
  return mesh;
}

/**
 * Reposition all electrons based on current orbital shape.
 */
function repositionElectrons() {
  const count = electronMeshes.length;
  if (count === 0) return;

  const orb = ORBITALS.find((o) => o.id === currentOrbitalId);
  if (!orb) return;

  // Generate positions within the orbital volume
  const positions = generateElectronPositions(count, orb);
  electronData = [];

  for (let i = 0; i < count; i++) {
    const pos = positions[i] || [0, 0, 0];
    electronData.push({
      basePos: new THREE.Vector3(pos[0], pos[1], pos[2]),
      angle: Math.random() * 2 * Math.PI,
      radius: 0.2 + Math.random() * 0.3,
      speed: 0.5 + Math.random() * 1.0,
      yOffset: (Math.random() - 0.5) * 0.3,
    });
    electronMeshes[i].position.set(pos[0], pos[1], pos[2]);
  }
}

/**
 * Generate random positions within an orbital volume for electron placement.
 */
function generateElectronPositions(count, orb) {
  const positions = [];
  if (orb.shape === 'sphere') {
    // Random points on/near sphere surface
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * 2 * Math.PI;
      const r = 0.5 + Math.random() * 0.5; // 0.5 to 1.0 radius
      positions.push([
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.cos(theta),
        r * Math.sin(theta) * Math.sin(phi),
      ]);
    }
  } else if (orb.shape === 'dumbbell') {
    const axis = orb.id.charAt(2); // x, y, or z
    const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const lobe = Math.random() < 0.5 ? -1 : 1;
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * 2 * Math.PI;
      const r = 0.2 + Math.random() * 0.3;
      const offset = lobe * (0.4 + Math.random() * 0.3);
      const pos = [0, 0, 0];
      pos[axisIdx] = offset;
      // Add perpendicular spread
      const perpIdx1 = (axisIdx + 1) % 3;
      const perpIdx2 = (axisIdx + 2) % 3;
      pos[perpIdx1] = r * Math.sin(theta) * Math.cos(phi);
      pos[perpIdx2] = r * Math.sin(theta) * Math.sin(phi);
      positions.push(pos);
    }
  } else {
    // Generic: random points in a sphere
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * 2 * Math.PI;
      const r = 0.2 + Math.random() * 0.6;
      positions.push([
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.cos(theta),
        r * Math.sin(theta) * Math.sin(phi),
      ]);
    }
  }
  return positions;
}

/**
 * Update the number of electron meshes.
 * @param {number} count - desired number of electrons (0-10)
 */
function updateElectrons(count) {
  count = Math.max(0, Math.min(10, count));

  // Remove extra electrons
  while (electronMeshes.length > count) {
    const mesh = electronMeshes.pop();
    scene.remove(mesh);
    disposeMesh(mesh);
  }

  // Add new electrons
  while (electronMeshes.length < count) {
    const mesh = createElectronMesh();
    electronMeshes.push(mesh);
    scene.add(mesh);
  }

  // Reposition all electrons
  repositionElectrons();
}

/**
 * Toggle phase visualization and reload the orbital.
 */
function togglePhase(enabled) {
  currentPhase = enabled;
  loadOrbital(currentOrbitalId);
}

/**
 * Toggle axis helper and grid helper visibility.
 */
function toggleAxisLabels(enabled) {
  if (axisHelper) axisHelper.visible = enabled;
  if (gridHelper) gridHelper.visible = enabled;
}

// ── Animation loop ───────────────────────────────────────────

function animate() {
  animationId = requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Animate electrons: gentle orbital motion
  for (let i = 0; i < electronMeshes.length; i++) {
    const mesh = electronMeshes[i];
    const data = electronData[i];
    if (!mesh || !data) continue;

    data.angle += data.speed * delta;

    // Orbit around the base position
    const offsetX = Math.cos(data.angle) * data.radius;
    const offsetZ = Math.sin(data.angle) * data.radius;
    mesh.position.x = data.basePos.x + offsetX;
    mesh.position.z = data.basePos.z + offsetZ;
    mesh.position.y = data.basePos.y + Math.sin(data.angle * 0.7) * data.yOffset;

    // Gentle rotation
    mesh.rotation.x += delta * 1.5;
    mesh.rotation.y += delta * 2.0;
  }

  orbitCtrl.update();
  renderer.render(scene, camera);
}

// ── Resize handler ───────────────────────────────────────────

function onResize() {
  const canvas = renderer.domElement;
  const parent = canvas.parentElement;
  if (!parent) return;
  const w = parent.clientWidth;
  const h = parent.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

// ── Public entry point ───────────────────────────────────────

/**
 * Initialize the orbital viewer in the given container element.
 * @param {string} containerId - ID of the DOM element to host the viewer
 * @returns {Function} cleanup function — call to dispose all resources
 */
export function initOrbitalViewer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('OrbitalViewer: container element not found:', containerId);
    return function () {};
  }

  // Ensure container has a size
  const containerStyle = window.getComputedStyle(container);
  if (containerStyle.position === 'static') {
    container.style.position = 'relative';
  }

  // ── Scene setup ──────────────────────────────────────────
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);

  // ── Camera ───────────────────────────────────────────────
  const rect = container.getBoundingClientRect();
  const aspect = rect.width / rect.height || 16 / 9;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  camera.position.set(3, 2, 4);
  camera.lookAt(0, 0, 0);

  // ── Renderer ─────────────────────────────────────────────
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(rect.width, rect.height);
  renderer.shadowMap.enabled = false; // not needed for orbitals
  renderer.setClearColor(0x0a0a1a, 1);
  container.appendChild(renderer.domElement);

  // ── Controls ─────────────────────────────────────────────
  orbitCtrl = new OrbitControls(camera, renderer.domElement);
  orbitCtrl.enableDamping = true;
  orbitCtrl.dampingFactor = 0.08;
  orbitCtrl.rotateSpeed = 0.8;
  orbitCtrl.minDistance = 1.5;
  orbitCtrl.maxDistance = 15;
  orbitCtrl.target.set(0, 0, 0);

  // ── Lights ───────────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(4, 6, 3);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
  fillLight.position.set(-3, -1, -4);
  scene.add(fillLight);

  // ── Helpers ──────────────────────────────────────────────
  gridHelper = new THREE.GridHelper(4, 8, 0x4488ff, 0x224488);
  gridHelper.position.y = -1.5;
  scene.add(gridHelper);

  axisHelper = new THREE.AxesHelper(2);
  scene.add(axisHelper);

  // ── UI Controls ──────────────────────────────────────────
  uiControls = new UIControls(container);
  uiControls.createUI(
    // onOrbitalChange
    (orbitalId) => loadOrbital(orbitalId),
    // onElectronChange
    (count) => updateElectrons(count),
    // onPhaseToggle
    (enabled) => togglePhase(enabled),
    // onAxisToggle
    (enabled) => toggleAxisLabels(enabled)
  );

  // ── Load initial orbital ─────────────────────────────────
  loadOrbital('1s');

  // ── Resize observer ──────────────────────────────────────
  const resizeObserver = new ResizeObserver(() => onResize());
  resizeObserver.observe(container);

  // ── Start animation ──────────────────────────────────────
  clock = new THREE.Clock();
  animate();

  // ── Return cleanup function ──────────────────────────────
  return function cleanup() {
    // Stop animation
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    // Disconnect resize observer
    resizeObserver.disconnect();

    // Remove event listeners from OrbitControls
    orbitCtrl.dispose();

    // Dispose orbital meshes
    if (orbitalMesh) {
      disposeMesh(orbitalMesh);
      orbitalMesh = null;
    }
    if (orbitalWireframe) {
      disposeMesh(orbitalWireframe);
      orbitalWireframe = null;
    }

    // Dispose electron meshes
    for (const mesh of electronMeshes) {
      scene.remove(mesh);
      disposeMesh(mesh);
    }
    electronMeshes = [];
    electronData = [];

    // Dispose helpers (LineSegments — dispose geometry and material individually)
    if (axisHelper) {
      scene.remove(axisHelper);
      if (axisHelper.geometry) axisHelper.geometry.dispose();
      if (axisHelper.material) axisHelper.material.dispose();
      axisHelper = null;
    }
    if (gridHelper) {
      scene.remove(gridHelper);
      if (gridHelper.geometry) gridHelper.geometry.dispose();
      if (gridHelper.material) gridHelper.material.dispose();
      gridHelper = null;
    }

    // Dispose renderer
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }

    // Dispose UI controls
    if (uiControls) {
      uiControls.dispose();
      uiControls = null;
    }

    // Release scene
    scene = null;
    camera = null;
    orbitCtrl = null;
  };
}
