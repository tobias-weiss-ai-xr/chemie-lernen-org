/**
 * Edge-case tests for molecule-hero.js renderer.
 * Mocks Three.js, tests pure renderMolecule logic.
 */
import { renderMolecule } from '../myhugoapp/static/js/molecule-hero.js';
import { moleculeData } from '../myhugoapp/static/js/molecule-data.js';

// ── Mock Three.js ─────────────────────────────────────────────
const mockGroup = {
  children: [],
  remove: jest.fn(),
  add: jest.fn((child) => mockGroup.children.push(child)),
  position: { x: 0, y: 0, z: 0 },
  sub: jest.fn().mockReturnThis(),
};

let mockSceneAddCalls = [];

const createVector3 = () => {
  const v = { x: 0, y: 0, z: 0 };
  v.copy = jest.fn().mockReturnValue(v);
  v.distanceTo = jest.fn().mockReturnValue(3);
  return v;
};

jest.mock('three', () => {
  const Vector3 = jest.fn((x, y, z) => {
    const v = createVector3();
    if (x != null) v.x = x;
    if (y != null) v.y = y;
    if (z != null) v.z = z;
    return v;
  });

  class Box3 {
    setFromObject() {
      const v = createVector3();
      v.getSize = jest.fn().mockReturnValue(createVector3());
      return v;
    }
  }

  class Group {
    constructor() { return mockGroup; }
  }
  class SphereGeometry {}
  class CylinderGeometry {
    rotateX() { return this; }
    translate() { return this; }
  }
  class MeshPhongMaterial {}
  class Mesh {
    position = createVector3();
    lookAt() {}
    scale = { set: jest.fn().mockReturnThis() };
  }
  class PerspectiveCamera {
    position = createVector3();
    aspect = 1;
    updateProjectionMatrix = jest.fn();
  }
  class WebGLRenderer {
    setPixelRatio() {}
    setSize() {}
    render() {}
  }
  class AmbientLight {}
  class DirectionalLight {
    position = createVector3();
  }
  class Color {}

  return {
    __esModule: true;

    // Module-level state (set by init)
    let scene, camera, renderer, moleculeGroup;
    default: null,
    Scene: jest.fn(() => ({
      add: jest.fn((c) => mockSceneAddCalls.push(c)),
      remove: jest.fn(),
    })),
    Vector3,
    Box3,
    Group,
    SphereGeometry,
    CylinderGeometry,
    MeshPhongMaterial,
    Mesh,
    PerspectiveCamera,
    WebGLRenderer,
    AmbientLight,
    DirectionalLight,
    Color,
  };
});

// Minimal DOM
const mockInfo = { textContent: '' };
const mockCanvas = { setAttribute: jest.fn(), parentElement: { clientWidth: 800, clientHeight: 400 } };
document.getElementById = jest.fn((id) => {
  if (id === 'molecule-hero-canvas') return mockCanvas;
  if (id === 'molecule-hero-info') return mockInfo;
  if (id === 'molecule-hero-loading') return { style: {} };
  return null;
});
window.ResizeObserver = jest.fn().mockImplementation(() => ({ observe: jest.fn(), disconnect: jest.fn() }));
Object.defineProperty(window, 'matchMedia', { value: jest.fn(() => ({ matches: false }), writable: true, configurable: true });

describe('molecule-hero.js edge cases', () => {
  beforeEach(() => {
    mockGroup.children = [];
    mockGroup.remove.mockClear();
    mockGroup.add.mockClear();
    mockGroup.sub.mockClear();
    mockSceneAddCalls = [];
  });

  it('renderMolecule with non-existent name does not throw', () => {
    expect(() => renderMolecule('NonExistentMolecule')).not.toThrow();
  });

  it('renderMolecule with non-existent name does not add to scene', () => {
    renderMolecule('NonExistentMolecule');
    expect(mockSceneAddCalls.length).toBe(0);
  });

  it('renderMolecule with empty string does not throw', () => {
    expect(() => renderMolecule('')).not.toThrow();
  });

  it('renderMolecule with Wasser (3 atoms, 2 bonds) renders correct mesh count', () => {
    renderMolecule('Wasser');
    expect(mockSceneAddCalls.length).toBe(1);
    expect(mockGroup.add.mock.calls.length).toBe(5); // 3 atoms + 2 bonds
  });

  it('renderMolecule with Wasserstoff (2 atoms, 1 bond, smallest molecule)', () => {
    renderMolecule('Wasserstoff');
    expect(mockSceneAddCalls.length).toBe(1);
    expect(mockGroup.add.mock.calls.length).toBe(3); // 2 atoms + 1 bond
  });

  it('renderMolecule with Koffein (largest molecule) renders without crash', () => {
    renderMolecule('Koffein');
    expect(mockSceneAddCalls.length).toBe(1);
    expect(mockGroup.add.mock.calls.length).toBeGreaterThan(0);
  });

  it('renderMolecule with Schwefelhexafluorid (7 atoms, 6 bonds, no H)', () => {
    renderMolecule('Schwefelhexafluorid');
    expect(mockSceneAddCalls.length).toBe(1);
    expect(mockGroup.add.mock.calls.length).toBe(14); // 7 atoms + 6 bonds + 1 sulfur
  });

  it('renderMolecule with Ozon (3 atoms, 2 bonds, bent molecule)', () => {
    renderMolecule('Ozon');
    expect(mockSceneAddCalls.length).toBe(1);
    expect(mockGroup.add.mock.calls.length).toBe(5);
  });

  it('consecutive renderMolecule calls remove previous molecule', () => {
    renderMolecule('Wasser');
    renderMolecule('Benzol');
    expect(mockGroup.remove).toHaveBeenCalledTimes(1);
    expect(mockSceneAddCalls.length).toBe(2);
  });

  it('renderMolecule updates molecule-hero-info text', () => {
    renderMolecule('Koffein');
    expect(mockInfo.textContent).toContain('Koffein');
  });

  it('renderMolecule updates canvas aria-label', () => {
    renderMolecule('Benzol');
    expect(mockCanvas.setAttribute).toHaveBeenCalledWith('aria-label', expect.stringContaining('Benzol'));
  });

  it('renderMolecule updates info with formula', () => {
    renderMolecule('Wasser');
    expect(mockInfo.textContent).toContain('H₂O');
  });

  it('renderMolecule with self-referencing bond does not throw', () => {
    const orig = moleculeData.Wasser.bonds;
    moleculeData.Wasser.bonds = [{ atom1: 'H-1', atom2: 'H-1', type: 'single' }];
    expect(() => renderMolecule('Wasser')).not.toThrow();
    moleculeData.Wasser.bonds = orig;
  });

  it('renderMolecule handles molecule with no bonds (isolated atoms)', () => {
    const origBonds = moleculeData.Wasserstoff.bonds;
    moleculeData.Wasserstoff.bonds = [];
    expect(() => renderMolecule('Wasserstoff')).not.toThrow();
    expect(mockGroup.add.mock.calls.length).toBe(2);
    moleculeData.Wasserstoff.bonds = origBonds;
  });
});
