/**
 * molecule-hero.js — Lightweight 3D molecule renderer for the homepage hero.
 * Self-contained: imports Three.js + molecule-data, sets up its own scene.
 */
import * as THREE from 'three';
import { moleculeData } from './molecule-data.js';
import { buildMoleculeMeshes, computeBounds, HERO_MOLECULES } from './molecule-geometry.js';

let scene, camera, renderer, moleculeGroup;
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let canvas;

export function renderMolecule(name) {
  const data = moleculeData[name];
  if (!data) return;

  if (moleculeGroup) scene.remove(moleculeGroup);
  moleculeGroup = new THREE.Group();

  const { meshes, positions } = buildMoleculeMeshes(THREE, data);
  meshes.forEach((m) => moleculeGroup.add(m));

  // Center the molecule in view
  const { center } = computeBounds(THREE, moleculeGroup);
  moleculeGroup.position.sub(center);
  scene.add(moleculeGroup);

  // Fit the camera to the molecule's size
  const cameraDistance = computeCameraDistance(THREE, moleculeGroup);
  camera.position.z = cameraDistance;

  // Update DOM
  const info = document.getElementById('molecule-hero-info');
  if (info) info.textContent = name + (data.formula ? ' (' + data.formula + ')' : '');
  if (canvas) canvas.setAttribute('aria-label', '3D-Visualisierung von ' + name);

  return { meshes: meshes.length, positions: positions.size };
}

export function computeCameraDistance(THREEObj, group) {
  const { maxDim } = computeBounds(THREEObj, group);
  return maxDim * 2.5;
}

export function init(canvasId) {
  canvas = document.getElementById(canvasId);
  const wrap = canvas && canvas.parentElement;
  if (!canvas || !wrap) return;
  // Re-init clears any previously rendered molecule so a fresh scene starts clean.
  moleculeGroup = null;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f7f0);

  camera = new THREE.PerspectiveCamera(60, wrap.clientWidth / wrap.clientHeight || 1, 0.1, 1000);
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);

  scene.add(new THREE.AmbientLight(0x404040, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 5, 5);
  scene.add(dir);

  // Drag to rotate
  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!isDragging || !moleculeGroup) return;
    moleculeGroup.rotation.y += (e.clientX - prevMouse.x) * 0.01;
    moleculeGroup.rotation.x += (e.clientY - prevMouse.y) * 0.01;
    prevMouse = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', () => {
    isDragging = false;
  });
  canvas.addEventListener('pointercancel', () => {
    isDragging = false;
  });

  // Zoom
  canvas.addEventListener(
    'wheel',
    (e) => {
      camera.position.z = Math.max(2, Math.min(40, camera.position.z + e.deltaY * 0.01));
      e.preventDefault();
    },
    { passive: false }
  );

  // Resize
  const ro = new ResizeObserver(() => {
    if (!wrap || !renderer || !camera) return;
    camera.aspect = wrap.clientWidth / wrap.clientHeight || 1;
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  });
  ro.observe(wrap);

  // Hide loading
  const loading = document.getElementById('molecule-hero-loading');
  if (loading) loading.style.display = 'none';

  // Animate
  (function animate() {
    requestAnimationFrame(animate);
    if (autoRotate && moleculeGroup && !isDragging) moleculeGroup.rotation.y += 0.005;
    renderer.render(scene, camera);
  })();
}

// Auto-init on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  init('molecule-hero-canvas');
  const name = HERO_MOLECULES[Math.floor(Math.random() * HERO_MOLECULES.length)];
  renderMolecule(name);

  document.addEventListener('click', (e) => {
    const chip = e.target.closest && e.target.closest('.molecule-hero-chip');
    if (!chip) return;
    document.querySelectorAll('.molecule-hero-chip').forEach((b) => b.classList.remove('active'));
    chip.classList.add('active');
    renderMolecule(chip.getAttribute('data-molecule'));
  });

  document.querySelectorAll('.molecule-hero-chip').forEach((b) => {
    if (b.getAttribute('data-molecule') === name) b.classList.add('active');
  });
});
