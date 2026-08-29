/**
 * Edge-case tests for molecule-geometry.js (pure, dependency-injected).
 *
 * A small fake THREE provides just the duck-typed surface used by the module,
 * so no WebGL / canvas / real three is needed. The fake is instrumented to
 * assert call arguments.
 */
import {
  buildAtomMesh,
  buildBondMesh,
  buildMoleculeMeshes,
  computeBounds,
  BOND_COLORS,
  ELEMENT_RADII,
  HERO_MOLECULES,
  MIN_ATOM_RADIUS,
  MIN_BOND_LENGTH,
} from '../myhugoapp/static/js/molecule-geometry.js';
import { moleculeData } from '../myhugoapp/static/js/molecule-data.js';

// ── Instrumented fake THREE ───────────────────────────────────
function makeFakeTHREE() {
  const calls = { sphere: [], cylinder: [], material: [], lookAt: [], scale: [], sub: [] };
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    set(...v) {
      [this.x, this.y, this.z] = v;
      return this;
    }
    copy(v) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    }
    distanceTo(o) {
      return Math.hypot(this.x - o.x, this.y - o.y, this.z - o.z);
    }
  }
  class Group {
    constructor() {
      this.children = [];
      this.position = new Vector3();
      this.rotation = { x: 0, y: 0, z: 0 };
    }
    add(c) {
      this.children.push(c);
      return this;
    }
  }
  class MeshPoint {
    constructor(geo, mat) {
      this.geometry = geo;
      this.material = mat;
      this.position = new Vector3();
      this.scale = { set: (sx, sy, sz) => calls.scale.push([sx, sy, sz]) };
      this.lookAt = (v) => calls.lookAt.push(v);
    }
  }
  class Box3 {
    setFromObject(g) {
      let minX = Infinity,
        minY = Infinity,
        minZ = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity,
        maxZ = -Infinity;
      const visit = (o) => {
        if (o.position) {
          const p = o.position;
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
          minZ = Math.min(minZ, p.z);
          maxZ = Math.max(maxZ, p.z);
        }
        (o.children || []).forEach(visit);
      };
      visit(g);
      this.min = new Vector3(minX, minY, minZ);
      this.max = new Vector3(maxX, maxY, maxZ);
      return this;
    }
    getCenter(out) {
      const c = new Vector3(
        (this.min.x + this.max.x) / 2,
        (this.min.y + this.max.y) / 2,
        (this.min.z + this.max.z) / 2
      );
      if (out && typeof out.copy === 'function') return out.copy(c);
      return c;
    }
    getSize(out) {
      const s = new Vector3(
        Math.max(0, this.max.x - this.min.x),
        Math.max(0, this.max.y - this.min.y),
        Math.max(0, this.max.z - this.min.z)
      );
      if (out && typeof out.copy === 'function') return out.copy(s);
      return s;
    }
  }
  return {
    THREE: {
      Vector3,
      Group,
      Box3,
      SphereGeometry: function (r, w, h) {
        calls.sphere.push([r, w, h]);
        return { type: 'sphere' };
      },
      CylinderGeometry: function (rt, rb, h, seg) {
        return {
          type: 'cylinder',
          rotateX: () => this,
          translate: () => this,
        };
      },
      MeshPhongMaterial: function (params) {
        calls.material.push(params);
        return { params };
      },
      Mesh: MeshPoint,
    },
    calls,
  };
}

const { THREE, calls } = makeFakeTHREE();

describe('molecule-geometry.js', () => {
  beforeEach(() => {
    calls.sphere.length = 0;
    calls.material.length = 0;
    calls.lookAt.length = 0;
    calls.scale.length = 0;
    calls.sub.length = 0;
  });

  // ── buildAtomMesh ───────────────────────────────────────────
  describe('buildAtomMesh', () => {
    test('creates a mesh for a known element with correct radius/color', () => {
      const mesh = buildAtomMesh(
        THREE,
        { id: 'H-1', element: 'H', position: [1, 2, 3] },
        { H: { radius: 0.3, color: '#FFFFFF' } }
      );
      expect(mesh).toBeTruthy();
      expect(calls.sphere[0][0]).toBe(0.3);
      expect(calls.material[0].color).toBe(0xffffff);
      expect(mesh.position.x).toBe(1);
      expect(mesh.position.y).toBe(2);
      expect(mesh.position.z).toBe(3);
    });

    test('returns null for unknown element (graceful, no crash)', () => {
      const mesh = buildAtomMesh(
        THREE,
        { id: 'X-1', element: 'X', position: [0, 0, 0] },
        { H: { radius: 0.3, color: '#fff' } }
      );
      expect(mesh).toBeNull();
      expect(calls.sphere.length).toBe(0);
    });

    test('returns null when element exists but radius is not a finite number', () => {
      const mesh = buildAtomMesh(
        THREE,
        { id: 'H-1', element: 'H', position: [0, 0, 0] },
        { H: { radius: 'big', color: '#fff' } }
      );
      expect(mesh).toBeNull();
    });

    test('returns null when radius is NaN', () => {
      const mesh = buildAtomMesh(
        THREE,
        { id: 'H-1', element: 'H', position: [0, 0, 0] },
        { H: { radius: NaN, color: '#fff' } }
      );
      expect(mesh).toBeNull();
    });

    test('clamps a non-positive/zero radius up to MIN_ATOM_RADIUS', () => {
      buildAtomMesh(
        THREE,
        { id: 'H-1', element: 'H', position: [0, 0, 0] },
        { H: { radius: 0, color: '#fff' } }
      );
      expect(calls.sphere[0][0]).toBe(MIN_ATOM_RADIUS);
      buildAtomMesh(
        THREE,
        { id: 'H-2', element: 'H', position: [0, 0, 0] },
        { H: { radius: -5, color: '#fff' } }
      );
      expect(calls.sphere[1][0]).toBe(MIN_ATOM_RADIUS);
    });

    test('uses fallback grey for a malformed (non-string) color', () => {
      const mesh = buildAtomMesh(
        THREE,
        { id: 'C-1', element: 'C', position: [0, 0, 0] },
        { C: { radius: 0.7, color: 12345 } }
      );
      expect(mesh).toBeTruthy();
      expect(calls.material[0].color).toBeGreaterThanOrEqual(0);
    });

    test('handles missing elements object without throwing', () => {
      expect(() =>
        buildAtomMesh(THREE, { id: 'H-1', element: 'H', position: [0, 0, 0] }, undefined)
      ).not.toThrow();
      expect(
        buildAtomMesh(THREE, { id: 'H-1', element: 'H', position: [0, 0, 0] }, undefined)
      ).toBeNull();
    });

    test('handles missing position array (degenerate atom)', () => {
      // Missing position → mesh is still produced (no throw); the fake's Mesh
      // defaults position to the origin, which is fine for a degenerate atom.
      const mesh = buildAtomMesh(
        THREE,
        { id: 'H-1', element: 'H', position: undefined },
        { H: { radius: 0.3, color: '#fff' } }
      );
      expect(mesh).toBeTruthy();
      expect(mesh.position).toBeDefined();
    });
  });

  // ── buildBondMesh ───────────────────────────────────────────
  describe('buildBondMesh', () => {
    const positions = new Map([
      ['A', [0, 0, 0]],
      ['B', [3, 4, 0]],
    ]);

    test('creates a cylinder between two atoms, scaled to their distance', () => {
      const mesh = buildBondMesh(THREE, { atom1: 'A', atom2: 'B', type: 'single' }, positions);
      expect(mesh).toBeTruthy();
      // distance 5 (3-4-5 triangle)
      expect(calls.scale[0][2]).toBeCloseTo(5, 5);
      expect(calls.lookAt.length).toBe(1);
    });

    test('returns null when atom1 is missing from positions', () => {
      const p = new Map([['B', [3, 4, 0]]]);
      expect(buildBondMesh(THREE, { atom1: 'A', atom2: 'B', type: 'single' }, p)).toBeNull();
    });

    test('returns null when atom2 is missing from positions', () => {
      const p = new Map([['A', [0, 0, 0]]]);
      expect(buildBondMesh(THREE, { atom1: 'A', atom2: 'B', type: 'single' }, p)).toBeNull();
    });

    test('handles a degenerate zero-length bond by clamping to MIN_BOND_LENGTH', () => {
      const p = new Map([
        ['A', [1, 1, 1]],
        ['B', [1, 1, 1]],
      ]);
      const mesh = buildBondMesh(THREE, { atom1: 'A', atom2: 'B', type: 'single' }, p);
      expect(mesh).toBeTruthy();
      expect(calls.scale[0][2]).toBe(MIN_BOND_LENGTH);
    });

    test('falls back to single color for an unknown bond type', () => {
      buildBondMesh(THREE, { atom1: 'A', atom2: 'B', type: 'quadruple' }, positions);
      expect(calls.material[0].color).toBe(BOND_COLORS.single);
    });

    test('uses distinct colors for single/double/triple', () => {
      buildBondMesh(THREE, { atom1: 'A', atom2: 'B', type: 'single' }, positions);
      buildBondMesh(THREE, { atom1: 'A', atom2: 'B', type: 'double' }, positions);
      buildBondMesh(THREE, { atom1: 'A', atom2: 'B', type: 'triple' }, positions);
      const colors = calls.material.map((m) => m.color);
      expect(new Set(colors).size).toBe(3);
    });
  });

  // ── buildMoleculeMeshes ─────────────────────────────────────
  describe('buildMoleculeMeshes', () => {
    test('builds atoms + bonds for a real molecule (Wasser: 3 atoms + 2 bonds)', () => {
      const { meshes, positions } = buildMoleculeMeshes(THREE, moleculeData.Wasser);
      expect(meshes.length).toBe(5);
      expect(positions.size).toBe(3);
    });

    test('Wasserstoff is smallest (2 atoms + 1 bond)', () => {
      const { meshes } = buildMoleculeMeshes(THREE, moleculeData.Wasserstoff);
      expect(meshes.length).toBe(3);
    });

    test('Schwefelhexafluorid has 7 atoms + 6 bonds (no H)', () => {
      const { meshes } = buildMoleculeMeshes(THREE, moleculeData.Schwefelhexafluorid);
      expect(meshes.length).toBe(13);
    });

    test('every real molecule produces at least one mesh', () => {
      for (const [name, mol] of Object.entries(moleculeData)) {
        const { meshes } = buildMoleculeMeshes(THREE, mol);
        expect(meshes.length).toBeGreaterThan(0);
      }
    });

    test('returns empty collections for undefined / null / non-array data', () => {
      for (const bad of [undefined, null, {}, { atoms: 'nope' }]) {
        const { meshes, positions } = buildMoleculeMeshes(THREE, bad);
        expect(meshes.length).toBe(0);
        expect(positions.size).toBe(0);
      }
    });

    test('skips atoms with missing positions instead of throwing', () => {
      const data = {
        elements: { H: { radius: 0.3, color: '#FFFFFF' } },
        atoms: [
          { id: 'H-1', element: 'H', position: [0, 0, 0] },
          { id: 'H-2', element: 'H', position: undefined },
        ],
        bonds: [],
      };
      const { meshes, positions } = buildMoleculeMeshes(THREE, data);
      expect(meshes.length).toBe(1);
      expect(positions.size).toBe(1);
    });

    test('skips bonds whose atoms were dropped (missing positions)', () => {
      const data = {
        elements: { H: { radius: 0.3, color: '#FFFFFF' } },
        atoms: [{ id: 'H-1', element: 'H', position: [0, 0, 0] }],
        bonds: [{ atom1: 'H-1', atom2: 'H-2', type: 'single' }],
      };
      const { meshes } = buildMoleculeMeshes(THREE, data);
      expect(meshes.length).toBe(1); // only the atom, bond dropped
    });

    test('does not crash on bonds array containing null entries', () => {
      const data = {
        elements: { H: { radius: 0.3, color: '#FFFFFF' } },
        atoms: [{ id: 'H-1', element: 'H', position: [0, 0, 0] }],
        bonds: [null, { atom1: 'H-1', atom2: 'H-2', type: 'single' }],
      };
      expect(() => buildMoleculeMeshes(THREE, data)).not.toThrow();
    });
  });

  // ── computeBounds ───────────────────────────────────────────
  describe('computeBounds', () => {
    test('computes center and max dimension for a populated group', () => {
      const g = new THREE.Group();
      const m = new THREE.Mesh();
      m.position.set(0, 0, 0);
      g.add(m);
      const { center, maxDim } = computeBounds(THREE, g);
      expect(center.x).toBe(0);
      expect(maxDim).toBe(0);
    });

    test('falls back to maxDim 1 for an empty group (no NaN)', () => {
      const g = new THREE.Group();
      const { center, maxDim } = computeBounds(THREE, g);
      expect(maxDim).toBe(1);
      expect(center.x).toBe(0);
    });
  });

  // ── Constants / exported data ───────────────────────────────
  describe('exported constants & hero set', () => {
    test('ELEMENT_RADII covers every element used in molecule-data', () => {
      const used = new Set();
      for (const mol of Object.values(moleculeData)) {
        for (const a of mol.atoms) used.add(a.element);
      }
      for (const sym of used) {
        expect(ELEMENT_RADII[sym]).toBeDefined();
      }
    });

    test('HERO_MOLECULES is a real array of existing molecules', () => {
      expect(Array.isArray(HERO_MOLECULES)).toBe(true);
      expect(HERO_MOLECULES.length).toBeGreaterThanOrEqual(5);
      for (const name of HERO_MOLECULES) {
        expect(moleculeData[name]).toBeDefined();
      }
    });

    test('HERO_MOLECULES contains no duplicates', () => {
      expect(new Set(HERO_MOLECULES).size).toBe(HERO_MOLECULES.length);
    });
  });
});
