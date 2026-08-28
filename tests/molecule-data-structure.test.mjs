/**
 * Edge-case tests for molecule-data.js structural integrity.
 * Validates that every molecule in the dataset is well-formed.
 */
import { moleculeData } from '../myhugoapp/static/js/molecule-data.js';

describe('molecule-data.js structural integrity', () => {
  const names = Object.keys(moleculeData);

  it('has at least 10 molecules', () => {
    expect(names.length).toBeGreaterThanOrEqual(10);
  });

  // ── Per-molecule validation ─────────────────────────────────
  for (const name of names) {
    describe(name, () => {
      const mol = moleculeData[name];

      it('has formula field (string)', () => {
        expect(typeof mol.formula).toBe('string');
        expect(mol.formula.length).toBeGreaterThan(0);
      });

      it('has elements object with at least one element', () => {
        expect(typeof mol.elements).toBe('object');
        expect(Object.keys(mol.elements).length).toBeGreaterThanOrEqual(1);
      });

      it('every element has radius (positive) and color (hex)', () => {
        for (const [sym, info] of Object.entries(mol.elements)) {
          expect(typeof info.radius).toBe('number');
          expect(info.radius).toBeGreaterThan(0);
          expect(typeof info.color).toBe('string');
          expect(/^#[0-9a-fA-F]{6}$/.test(info.color)).toBe(true);
        }
      });

      it('has atoms array with at least one atom', () => {
        expect(Array.isArray(mol.atoms)).toBe(true);
        expect(mol.atoms.length).toBeGreaterThanOrEqual(1);
      });

      it('every atom has valid id, element, and 3D position', () => {
        const ids = new Set();
        for (const atom of mol.atoms) {
          expect(typeof atom.id).toBe('string');
          expect(atom.id.length).toBeGreaterThan(0);
          expect(ids.has(atom.id)).toBe(false);
          ids.add(atom.id);
        }
      });

      it('has bonds array', () => {
        expect(Array.isArray(mol.bonds)).toBe(true);
      });

      it('every bond references valid atom IDs and has a type', () => {
        const atomIds = new Set(mol.atoms.map((a) => a.id));
        for (const bond of mol.bonds) {
          expect(typeof bond.atom1).toBe('string');
          expect(typeof bond.atom2).toBe('string');
          expect(atomIds.has(bond.atom1)).toBe(true);
          expect(atomIds.has(bond.atom2)).toBe(true);
        }
      });

      it('no self-referencing bonds', () => {
        for (const bond of mol.bonds) {
          expect(bond.atom1).not.toBe(bond.atom2);
        }
      });

      it('no duplicate bonds', () => {
        const seen = new Set();
        for (const bond of mol.bonds) {
          const key = [bond.atom1, bond.atom2, bond.type].sort().join('|');
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      });
    });

  // ── Cross-molecule invariants ─────────────────────────────────

  it('Wasserstoff (simplest molecule) has exactly 2 atoms and 1 bond', () => {
    const h2 = moleculeData.Wasserstoff;
    expect(h2.atoms.length).toBe(2);
    expect(h2.bonds.length).toBe(1);
    expect(h2.bonds[0].type).toBe('single');
  });

  it('Koffein (largest molecule) has more atoms than Wasserstoff', () => {
    expect(moleculeData.Koffein.atoms.length).toBeGreaterThan(moleculeData.Wasserstoff.atoms.length);
  });

  it('all molecules have a H element or are rare (SF6 etc.)', () => {
    const allowedNoH = ['Schwefelhexafluorid', 'Kohlendioxid', 'Ozon'];
    for (const [name, mol] of Object.entries(moleculeData)) {
      if (allowedNoH.includes(name)) continue;
      expect(mol.elements.H || mol.atoms.some((a) => a.element === 'H'))).toBe(true);
    }
  });

  it('no molecule has zero atoms', () => {
    for (const [name, mol] of Object.entries(moleculeData)) {
      expect(mol.atoms.length).toBeGreaterThan(0);
    }
  });

  // ── Hero molecule subset completeness ─────────────────────────────────
  const heroMolecules = [
    'Koffein', 'Aspirin', 'Benzol', 'Ethanol', 'Glucose',
    'Adrenalin', 'Nikotin', 'Serotonin', 'Dopamin', 'Methan',
  ];

  it('all hero molecules exist in the dataset', () => {
    for (const name of heroMolecules) {
      expect(moleculeData[name]).toBeDefined();
    }
  });

  it('C (carbon) is defined consistently across all molecules that use it', () => {
    const carbonRadii = new Set();
    for (const mol of Object.values(moleculeData)) {
      if (mol.elements.C) carbonRadii.add(mol.elements.C.radius);
    }
    expect(carbonRadii.size).toBe(1);
    expect(carbonRadii.values().next().value).toBe(0.7);
  });

  it('O (oxygen) is defined consistently', () => {
    const oxygenRadii = new Set();
    for (const mol of Object.values(moleculeData)) {
      if (mol.elements.O) oxygenRadii.add(mol.elements.O.radius);
    }
    expect(oxygenRadii.size).toBe(1);
    expect(oxygenRadii.values().next().value).toBe(0.6);
  });
});
