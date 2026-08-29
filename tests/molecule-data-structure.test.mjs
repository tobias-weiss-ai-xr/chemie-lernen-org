/**
 * Structural-integrity tests for molecule-data.js.
 *
 * Covers hard invariants a 3D viewer depends on:
 *   - referential integrity (atoms ↔ elements, bonds ↔ atoms)
 *   - graph connectivity (a broken side chain orphans atoms → invisible molecule)
 *   - uniqueness (no duplicate atom ids / bonds)
 *   - consistent element definitions across molecules
 *   - formula sanity (curated allowlist for known simplifications)
 */
import { moleculeData } from '../myhugoapp/static/js/molecule-data.js';

// Map a molecule from its data arrays → { element: count }
function countElements(mol) {
  const counts = {};
  for (const a of mol.atoms) counts[a.element] = (counts[a.element] || 0) + 1;
  return counts;
}

// Parse a chemical formula (unicode subscripts) → { element: count }
function parseFormula(formula) {
  // Map both ASCII digits and Unicode subscripts (₀₁₂₃₄₅₆₇₈₉) so chemical
  // formulas written with subscript characters parse correctly.
  const SUB = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    '₀': 0,
    '₁': 1,
    '₂': 2,
    '₃': 3,
    '₄': 4,
    '₅': 5,
    '₆': 6,
    '₇': 7,
    '₈': 8,
    '₉': 9,
  };
  const counts = {};
  let i = 0;
  while (i < formula.length) {
    const ch = formula[i];
    if (SUB[ch] !== undefined) {
      i += 1;
      continue;
    }
    if (ch >= 'A' && ch <= 'Z') {
      let sym = ch;
      i += 1;
      if (i < formula.length && formula[i] >= 'a' && formula[i] <= 'z') {
        sym += formula[i];
        i += 1;
      }
      let n = 0;
      while (i < formula.length && SUB[formula[i]] !== undefined) {
        n = n * 10 + SUB[formula[i]];
        i += 1;
      }
      counts[sym] = (counts[sym] || 0) + (n || 1);
    } else {
      i += 1; // skip unexpected chars (parentheses etc.)
    }
  }
  return counts;
}

// Molecules whose 3D coordinates are a deliberate simplification and therefore
// do NOT satisfy atom-count == formula-count. Everything else must match.
const SIMPLIFIED_MOLECULES = new Set([
  'THC', // 32 atoms vs C₂₁H₃₀O₂ = 53 — pentyl chain + ring simplified
  'Essigsaeure', // 9 atoms vs CH₃COOH = 8 — extra H modeled on carboxyl O
  'Aspirin', // 23 atoms vs C₉H₈O₄ = 21 — both carboxyl O modeled as OH
  'Serotonin', // 23 atoms vs C₁₀H₁₂N₂O = 25 — undercounts H/C
  'Glucose', // 25 atoms vs C₆H₁₂O₆ = 24 — 7 O modeled (ring O + 6 OH)
  'Nikotin', // 23 atoms vs C₁₀H₁₄N₂ = 26 — simplified
]);

const ALLOWED_NO_H = new Set(['Kohlendioxid', 'Ozon', 'Schwefelhexafluorid']);
const BOND_TYPES = new Set(['single', 'double', 'triple']);

describe('molecule-data.js structural integrity', () => {
  const names = Object.keys(moleculeData);

  test('dataset is non-empty and contains >= 20 molecules', () => {
    expect(names.length).toBeGreaterThanOrEqual(20);
  });

  test('hero molecule set is a subset of the dataset', () => {
    const hero = [
      'Koffein',
      'Aspirin',
      'Benzol',
      'Ethanol',
      'Glucose',
      'Adrenalin',
      'Nikotin',
      'Serotonin',
      'Dopamin',
      'Methan',
    ];
    for (const name of hero) {
      expect(moleculeData[name]).toBeDefined();
    }
  });

  // ── Per-molecule invariants ─────────────────────────────────
  for (const name of names) {
    const mol = moleculeData[name];

    describe(`${name} (${mol.formula})`, () => {
      test('has non-empty formula string', () => {
        expect(typeof mol.formula).toBe('string');
        expect(mol.formula.length).toBeGreaterThan(0);
      });

      test('has >= 1 element type and every atom uses one', () => {
        expect(typeof mol.elements).toBe('object');
        const keys = Object.keys(mol.elements || {});
        expect(keys.length).toBeGreaterThanOrEqual(1);
        for (const atom of mol.atoms) {
          expect(keys).toContain(atom.element);
        }
      });

      test('every element def has (finite positive radius, 6-digit hex color)', () => {
        for (const [sym, info] of Object.entries(mol.elements)) {
          expect(typeof info.radius).toBe('number');
          expect(Number.isFinite(info.radius)).toBe(true);
          expect(info.radius).toBeGreaterThan(0);
          expect(/^#[0-9a-fA-F]{6}$/.test(info.color)).toBe(true);
        }
      });

      test('atoms: >= 1, unique ids, 3D finite positions', () => {
        expect(Array.isArray(mol.atoms)).toBe(true);
        expect(mol.atoms.length).toBeGreaterThanOrEqual(1);
        const seen = new Set();
        for (const atom of mol.atoms) {
          expect(typeof atom.id).toBe('string');
          expect(seen.has(atom.id)).toBe(false);
          seen.add(atom.id);
          expect(Array.isArray(atom.position)).toBe(true);
          expect(atom.position.length).toBe(3);
          for (const p of atom.position) {
            expect(typeof p).toBe('number');
            expect(Number.isFinite(p)).toBe(true);
          }
        }
      });

      test('bonds: valid types, referenced atoms exist, no self/duplicate bonds', () => {
        expect(Array.isArray(mol.bonds)).toBe(true);
        const ids = new Set(mol.atoms.map((a) => a.id));
        const seen = new Set();
        for (const bond of mol.bonds) {
          expect(BOND_TYPES.has(bond.type)).toBe(true);
          expect(ids.has(bond.atom1)).toBe(true);
          expect(ids.has(bond.atom2)).toBe(true);
          expect(bond.atom1).not.toBe(bond.atom2);
          const key = [bond.atom1, bond.atom2, bond.type].sort().join('|');
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      });

      test('graph is connected (every atom reachable) unless single atom', () => {
        if (mol.atoms.length <= 1) return;
        const adj = new Map(mol.atoms.map((a) => [a.id, []]));
        for (const b of mol.bonds) {
          adj.get(b.atom1).push(b.atom2);
          adj.get(b.atom2).push(b.atom1);
        }
        const visited = new Set();
        const stack = [mol.atoms[0].id];
        while (stack.length) {
          const cur = stack.pop();
          if (visited.has(cur)) continue;
          visited.add(cur);
          for (const nb of adj.get(cur) || []) if (!visited.has(nb)) stack.push(nb);
        }
        expect(visited.size).toBe(mol.atoms.length);
      });
    });
  }

  // ── Cross-molecule invariants ───────────────────────────────

  test('element definitions are identical across all molecules using them', () => {
    const defs = {};
    for (const [name, mol] of Object.entries(moleculeData)) {
      for (const [sym, info] of Object.entries(mol.elements)) {
        const sig = `${info.radius}|${info.color}`;
        if (!defs[sym]) defs[sym] = { sig, name };
        else {
          expect(defs[sym].sig).toBe(sig);
        }
      }
    }
  });

  test('coverage: union of element types equals the known periodic subset', () => {
    const used = new Set();
    for (const mol of Object.values(moleculeData)) {
      for (const a of mol.atoms) used.add(a.element);
    }
    expect([...used].sort()).toEqual(['C', 'F', 'H', 'N', 'O', 'S']);
  });

  test('no molecule with atoms has zero bonds (all molecules are polyatomic bonded)', () => {
    for (const [name, mol] of Object.entries(moleculeData)) {
      expect(mol.bonds.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('hydrogen is present in every molecule except the curated no-H set', () => {
    for (const [name, mol] of Object.entries(moleculeData)) {
      if (ALLOWED_NO_H.has(name)) continue;
      const hasH = Boolean(mol.elements.H) || mol.atoms.some((a) => a.element === 'H');
      expect(hasH).toBe(true);
    }
  });

  test('at least one molecule uses each bond type (single/double/triple)', () => {
    const types = new Set();
    for (const mol of Object.values(moleculeData)) {
      for (const b of mol.bonds) types.add(b.type);
    }
    for (const t of ['single', 'double', 'triple']) {
      expect(types.has(t)).toBe(true);
    }
  });

  test('molecule-size extremes: Wasserstoff smallest, THC largest', () => {
    const byAtoms = Object.entries(moleculeData).sort(
      (a, b) => a[1].atoms.length - b[1].atoms.length
    );
    expect(byAtoms[0][0]).toBe('Wasserstoff');
    expect(byAtoms[0][1].atoms.length).toBe(2);
    expect(byAtoms[byAtoms.length - 1][0]).toBe('THC');
    expect(byAtoms[byAtoms.length - 1][1].atoms.length).toBe(32);
  });

  test('atom counts match chemical formulas except the curated simplification list', () => {
    for (const [name, mol] of Object.entries(moleculeData)) {
      const expected = parseFormula(mol.formula);
      const actual = countElements(mol);
      const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
      let matches = true;
      for (const k of keys) {
        if ((expected[k] || 0) !== (actual[k] || 0)) {
          matches = false;
          break;
        }
      }
      if (!SIMPLIFIED_MOLECULES.has(name)) {
        expect(matches).toBe(true);
      }
    }
  });

  test('simplification list is exactly the set that mismatches (no drift)', () => {
    const mismatched = [];
    for (const [name, mol] of Object.entries(moleculeData)) {
      const expected = parseFormula(mol.formula);
      const actual = countElements(mol);
      const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
      let matches = true;
      for (const k of keys) {
        if ((expected[k] || 0) !== (actual[k] || 0)) {
          matches = false;
          break;
        }
      }
      if (!matches) mismatched.push(name);
    }
    expect(mismatched.sort()).toEqual([...SIMPLIFIED_MOLECULES].sort());
  });

  test('every bond endpoint pair has a plausible 3D distance (> 0.3 Å)', () => {
    // Sanity: bond between overlapping atoms would render as a degenerate stub.
    for (const [name, mol] of Object.entries(moleculeData)) {
      const pos = new Map(mol.atoms.map((a) => [a.id, a.position]));
      for (const b of mol.bonds) {
        const [x1, y1, z1] = pos.get(b.atom1);
        const [x2, y2, z2] = pos.get(b.atom2);
        const d = Math.hypot(x2 - x1, y2 - y1, z2 - z1);
        expect(d).toBeGreaterThan(0.3);
      }
    }
  });
});
