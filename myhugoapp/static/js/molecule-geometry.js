/**
 * molecule-geometry.js — Pure molecule→mesh geometry helpers.
 *
 * Deliberately imports NOTHING: Three.js is passed in as a parameter so this
 * module can be unit-tested with a tiny fake (no WebGL/canvas required) and
 * shared by both the homepage hero and the full studio.
 *
 * API contract (duck-typed subset of THREE used here):
 *   THREE.SphereGeometry(radius, w, h)
 *   THREE.CylinderGeometry(rTop, rBot, h, seg)
 *   THREE.MeshPhongMaterial({color, shininess, specular})
 *   THREE.Mesh(geometry, material)          → { position.set(x,y,z), lookAt(v){}, scale.set(sx,sy,sz){}, rotation{} }
 *   THREE.Group()                            → { add(child){}, children[], position.sub(v){} }
 *   THREE.Vector3(x,y,z)                     → { x,y,z, distanceTo(other){} }
 *   THREE.Box3().setFromObject(group)        → Box3
 *   Box3.getCenter(v) / Box3.getSize(v)      → Vector3
 */

export const BOND_RADIUS = 0.08;
export const BOND_SEGMENTS = 8;
export const ATOM_SPHERE_SEGMENTS = 24;
export const MIN_ATOM_RADIUS = 0.1;
export const MIN_BOND_LENGTH = 0.001;

/** Atom radius by element type (Angstrom, visually). */
export const ELEMENT_RADII = {
  H: 0.3,
  O: 0.6,
  C: 0.7,
  N: 0.65,
  S: 0.9,
  F: 0.5,
};

/** Bond color by bond type. */
export const BOND_COLORS = {
  single: 0x999999,
  double: 0x666666,
  triple: 0x444444,
};

/** Molecule names shown in the homepage hero chip bar. */
export const HERO_MOLECULES = [
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

/**
 * Build a single atom sphere mesh. Returns null for unknown elements so the
 * caller can skip gracefully (an atom whose element is not in `elements`
 * should never crash the whole molecule render).
 */
export function buildAtomMesh(THREE, atom, elements) {
  if (!atom || typeof atom.element !== 'string') return null;
  if (!elements) return null;
  const info = elements[atom.element];
  if (!info) return null;
  if (typeof info.radius !== 'number' || !Number.isFinite(info.radius)) return null;
  const r = Math.max(MIN_ATOM_RADIUS, info.radius);
  const geo = new THREE.SphereGeometry(r, ATOM_SPHERE_SEGMENTS, ATOM_SPHERE_SEGMENTS);
  const color = typeof info.color === 'string' ? parseInt(info.color.replace('#', '0x')) : 0x999999;
  const mat = new THREE.MeshPhongMaterial({ color, shininess: 80, specular: 0x222222 });
  const mesh = new THREE.Mesh(geo, mat);
  if (atom.position) mesh.position.set(...atom.position);
  return mesh;
}

/**
 * Build a single bond cylinder between two atoms. Returns null when either
 * endpoint is missing. Defends against zero-length bonds (a degenerate
 * atom1 === atom2 should render as a tiny stub instead of exploding).
 */
export function buildBondMesh(THREE, bond, positions) {
  const a = positions.get(bond.atom1);
  const b = positions.get(bond.atom2);
  if (!a || !b) return null;
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const dist = Math.max(MIN_BOND_LENGTH, start.distanceTo(end));
  const geo = new THREE.CylinderGeometry(BOND_RADIUS, BOND_RADIUS, 1, BOND_SEGMENTS);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0, 0.5);
  const color = BOND_COLORS[bond.type] || BOND_COLORS.single;
  const mat = new THREE.MeshPhongMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...a);
  mesh.lookAt(end);
  mesh.scale.set(1, 1, dist);
  return mesh;
}

/**
 * Build all meshes for one molecule. Pure and side-effect free:
 *   - skips unknown element atoms (returns null from buildAtomMesh)
 *   - skips bonds whose endpoints are missing
 *   - returns { meshes, positions:Map<atomId,[x,y,z]> }
 */
export function buildMoleculeMeshes(THREE, data) {
  const meshes = [];
  const positions = new Map();
  if (!data || !Array.isArray(data.atoms)) return { meshes, positions };

  // Pass 1: atoms
  data.atoms.forEach((atom) => {
    if (!atom || !atom.position) return;
    positions.set(atom.id, atom.position);
    const mesh = buildAtomMesh(THREE, atom, data.elements);
    if (mesh) meshes.push(mesh);
  });

  // Pass 2: bonds (need a box of positions; skip bonds whose atoms were dropped
  // or whose entry is malformed/null)
  if (Array.isArray(data.bonds)) {
    data.bonds.forEach((bond) => {
      if (!bond) return;
      const mesh = buildBondMesh(THREE, bond, positions);
      if (mesh) meshes.push(mesh);
    });
  }

  return { meshes, positions };
}

/**
 * Compute a group's bounding box center and max dimension.
 * Returns { center, maxDim } where center is a THREE.Vector3 and maxDim is a
 * number. Falls back to { center: origin, maxDim: 1 } for empty groups.
 */
export function computeBounds(THREE, group) {
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  // Empty group (no content) → avoid NaN / zero camera distance. A populated
  // group with degenerate zero-extent geometry still returns its real maxDim.
  if (!group || !group.children || group.children.length === 0 || !Number.isFinite(maxDim)) {
    return { center: new THREE.Vector3(), maxDim: 1 };
  }
  return { center, maxDim };
}
