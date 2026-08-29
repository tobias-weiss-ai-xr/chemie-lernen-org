/**
 * Integration tests for molecule-hero.js renderMolecule / init.
 *
 * `three` is mapped to tests/three-fake.mjs via the jest moduleNameMapper, so
 * no real WebGL is needed. In Jest's ESM runtime the `jest` global is NOT
 * available, so this file uses only plain globals (`expect`/`describe`/`test`)
 * and records `scene.add` / `scene.remove` calls through the fake's exported
 * `__calls` state.
 */
import * as THREE from 'three';
import { __calls } from 'three';
import { moleculeData } from '../myhugoapp/static/js/molecule-data.js';

let heroMod;
let infoEl;
let canvasEl;
let loadingEl;

beforeAll(async () => {
  // Browser globals the module reads at import time (autoRotate is read from
  // window.matchMedia at module top level) and at runtime.
  window.matchMedia = () => ({ matches: false });

  canvasEl = document.createElement('canvas');
  canvasEl.setAttribute('id', 'molecule-hero-canvas');
  canvasEl.setPointerCapture = () => {};
  canvasEl.listeners = {};
  canvasEl.addEventListener = (ev, cb) => {
    canvasEl.listeners[ev] = cb;
  };
  const wrap = document.createElement('div');
  Object.defineProperty(wrap, 'clientWidth', { value: 800, configurable: true });
  Object.defineProperty(wrap, 'clientHeight', { value: 600, configurable: true });
  wrap.appendChild(canvasEl);
  document.body.appendChild(wrap);

  infoEl = document.createElement('div');
  infoEl.setAttribute('id', 'molecule-hero-info');
  document.body.appendChild(infoEl);

  loadingEl = document.createElement('div');
  loadingEl.setAttribute('id', 'molecule-hero-loading');
  document.body.appendChild(loadingEl);

  window.ResizeObserver = function () {
    return { observe() {}, disconnect() {} };
  };
  window.requestAnimationFrame = () => 0; // stop the render loop from spinning

  // Import AFTER window globals exist (module top level reads matchMedia).
  heroMod = await import('../myhugoapp/static/js/molecule-hero.js');
});

describe('molecule-hero.js renderMolecule', () => {
  beforeEach(() => {
    __calls.add.length = 0;
    __calls.remove.length = 0;
    infoEl.textContent = '';
    canvasEl.setAttribute('aria-label', '');
  });

  test('renders a known molecule: adds exactly one group to the scene', () => {
    heroMod.init('molecule-hero-canvas');
    heroMod.renderMolecule('Wasser');
    // init() adds 2 lights; renderMolecule adds the molecule group.
    expect(__calls.add.length).toBe(3);
  });

  test('renderMolecule alone adds exactly one group (lights come from init)', () => {
    heroMod.init('molecule-hero-canvas');
    __calls.add.length = 0;
    heroMod.renderMolecule('Benzol');
    expect(__calls.add.length).toBe(1);
  });

  test('unknown molecule name is a silent no-op (no throw, no scene change)', () => {
    heroMod.init('molecule-hero-canvas');
    __calls.add.length = 0;
    expect(() => heroMod.renderMolecule('NonExistentMoleculeXYZ')).not.toThrow();
    expect(__calls.add.length).toBe(0);
  });

  test('empty string / undefined / null molecule names are safe no-ops', () => {
    heroMod.init('molecule-hero-canvas');
    __calls.add.length = 0;
    expect(() => heroMod.renderMolecule('')).not.toThrow();
    expect(() => heroMod.renderMolecule(undefined)).not.toThrow();
    expect(() => heroMod.renderMolecule(null)).not.toThrow();
    expect(__calls.add.length).toBe(0);
  });

  test('rendering two molecules removes the previous group (no leak)', () => {
    heroMod.init('molecule-hero-canvas');
    __calls.add.length = 0;
    __calls.remove.length = 0;
    heroMod.renderMolecule('Wasser');
    heroMod.renderMolecule('Benzol');
    expect(__calls.add.length).toBe(2);
    expect(__calls.remove.length).toBe(1);
  });

  test('info text is set to "Name (formula)" for a molecule with formula', () => {
    heroMod.init('molecule-hero-canvas');
    heroMod.renderMolecule('Koffein');
    expect(infoEl.textContent).toContain('Koffein');
    expect(infoEl.textContent).toContain('C₈H₁₀N₄O₂');
  });

  test('info text still contains the name when formula is missing', () => {
    const orig = moleculeData.Methan.formula;
    moleculeData.Methan.formula = '';
    heroMod.init('molecule-hero-canvas');
    heroMod.renderMolecule('Methan');
    expect(infoEl.textContent).toContain('Methan');
    moleculeData.Methan.formula = orig;
  });

  test('canvas aria-label is updated to describe the rendered molecule', () => {
    heroMod.init('molecule-hero-canvas');
    heroMod.renderMolecule('Benzol');
    expect(canvasEl.getAttribute('aria-label')).toContain('Benzol');
  });

  test('rendering every real molecule in the dataset never throws', () => {
    heroMod.init('molecule-hero-canvas');
    for (const name of Object.keys(moleculeData)) {
      expect(() => heroMod.renderMolecule(name)).not.toThrow();
    }
  });

  test('a molecule whose atoms all use unknown elements renders without crash', () => {
    const orig = moleculeData.Wasser.atoms;
    moleculeData.Wasser.atoms = [
      { id: 'X-1', element: 'X', position: [0, 0, 0] },
      { id: 'Y-1', element: 'Y', position: [1, 0, 0] },
    ];
    heroMod.init('molecule-hero-canvas');
    expect(() => heroMod.renderMolecule('Wasser')).not.toThrow();
    moleculeData.Wasser.atoms = orig;
  });

  test('computeCameraDistance uses maxDim * 2.5', () => {
    heroMod.init('molecule-hero-canvas');
    heroMod.renderMolecule('Wasser');
    const dist = heroMod.computeCameraDistance(THREE, new THREE.Group());
    expect(typeof dist).toBe('number');
    expect(dist).toBeCloseTo(2.5, 5); // empty group → maxDim 1 → 2.5
  });
});

describe('molecule-hero.js init', () => {
  test('init with a missing canvas is a safe no-op', () => {
    expect(() => heroMod.init('does-not-exist')).not.toThrow();
  });

  test('init hides the loading indicator when present', () => {
    heroMod.init('molecule-hero-canvas');
    expect(loadingEl.style.display).toBe('none');
  });

  test('init wires drag/zoom listeners on the canvas', () => {
    heroMod.init('molecule-hero-canvas');
    expect(canvasEl.listeners).toBeDefined();
    for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'wheel']) {
      expect(typeof canvasEl.listeners[ev]).toBe('function');
    }
  });
});
