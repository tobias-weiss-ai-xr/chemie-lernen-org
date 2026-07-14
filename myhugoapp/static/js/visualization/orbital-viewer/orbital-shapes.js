// orbital-shapes.js — Parametric surface generators for atomic orbital visualization
// allow: SIZE_OK — 5 shared generators + helpers + f-orbital coefficient table
// under 4-file constraint. Single responsibility: all orbital geometry construction.
// Each function returns a THREE.BufferGeometry with vertex colors.
// Lobe sign convention: positive (blue #4488ff), negative (red #ff4444 when phase toggled)

import * as THREE from 'three';

// ── Color constants ──────────────────────────────────────────
const POS_COLOR = [0x44 / 255, 0x88 / 255, 0xff / 255]; // #4488ff blue
const NEG_COLOR = [0xff / 255, 0x44 / 255, 0x44 / 255]; // #ff4444 red

// ── Internal helpers ─────────────────────────────────────────

/**
 * Generate vertices for a single parametric lobe (stretched sphere).
 * @param {number[]} center - [cx, cy, cz]
 * @param {number[]} stretchDir - unit vector along which to stretch (length 1)
 * @param {number[]} perp1 - first perpendicular unit vector
 * @param {number[]} perp2 - second perpendicular unit vector
 * @param {number} radius - base sphere radius
 * @param {number} stretch - stretch factor along stretchDir
 * @param {number} detail - subdivision count
 * @param {number[]} color - [r, g, b] in 0-1 range
 * @param {number[]} positions - accumulated positions array (pushed by ref)
 * @param {number[]} colors - accumulated colors array (pushed by ref)
 */
function addLobe(
  center,
  stretchDir,
  perp1,
  perp2,
  radius,
  stretch,
  detail,
  color,
  positions,
  colors
) {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = stretchDir;
  const [p1x, p1y, p1z] = perp1;
  const [p2x, p2y, p2z] = perp2;

  for (let i = 0; i <= detail; i++) {
    const theta = (i / detail) * Math.PI;
    for (let j = 0; j <= detail; j++) {
      const phi = (j / detail) * 2 * Math.PI;
      const st = Math.sin(theta);
      const ct = Math.cos(theta);
      const sp = Math.sin(phi);
      const cp = Math.cos(phi);

      // Point on unit sphere: (st*cp, ct, st*sp)
      // Transform: stretch along stretchDir, then scale by radius, then translate
      const u = st * cp;
      const v = ct;
      const w = st * sp;

      const x = cx + radius * (u * stretch * sx + v * p1x + w * p2x);
      const y = cy + radius * (u * stretch * sy + v * p1y + w * p2y);
      const z = cz + radius * (u * stretch * sz + v * p1z + w * p2z);

      positions.push(x, y, z);
      colors.push(color[0], color[1], color[2]);
    }
  }
}

/**
 * Generate triangle-strip indices for a (detail+1) x (detail+1) grid.
 * Returns index array suitable for BufferGeometry.setIndex().
 */
function gridIndices(detail, vertexOffset) {
  const idx = [];
  for (let i = 0; i < detail; i++) {
    for (let j = 0; j < detail; j++) {
      const a = vertexOffset + i * (detail + 1) + j;
      const b = vertexOffset + i * (detail + 1) + j + 1;
      const c = vertexOffset + (i + 1) * (detail + 1) + j;
      const d = vertexOffset + (i + 1) * (detail + 1) + j + 1;
      idx.push(a, b, c);
      idx.push(b, d, c);
    }
  }
  return idx;
}

/**
 * Build a THREE.BufferGeometry from accumulated position/color/index data.
 */
function buildGeometry(positions, colors, indices) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Return two perpendicular unit vectors to a given direction.
 */
function perpendicularBasis(dir) {
  const [dx, dy, dz] = dir;
  // Find a vector not parallel to dir
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const absZ = Math.abs(dz);
  let up;
  if (absX <= absY && absX <= absZ) {
    up = [1, 0, 0];
  } else if (absY <= absZ) {
    up = [0, 1, 0];
  } else {
    up = [0, 0, 1];
  }
  // perp1 = cross(dir, up)
  const p1 = [dy * up[2] - dz * up[1], dz * up[0] - dx * up[2], dx * up[1] - dy * up[0]];
  const len1 = Math.sqrt(p1[0] * p1[0] + p1[1] * p1[1] + p1[2] * p1[2]);
  if (len1 < 1e-10) {
    // Fallback: use a different up vector
    up = [0, 0, 1];
    p1[0] = dy * up[2] - dz * up[1];
    p1[1] = dz * up[0] - dx * up[2];
    p1[2] = dx * up[1] - dy * up[0];
  }
  const l1 = Math.sqrt(p1[0] * p1[0] + p1[1] * p1[1] + p1[2] * p1[2]);
  const invL1 = 1 / l1;
  p1[0] *= invL1;
  p1[1] *= invL1;
  p1[2] *= invL1;

  // perp2 = cross(dir, perp1)
  const p2 = [dy * p1[2] - dz * p1[1], dz * p1[0] - dx * p1[2], dx * p1[1] - dy * p1[0]];
  // Already unit since dir and p1 are orthogonal unit vectors
  return [p1, p2];
}

// ── Shape helpers for axis-based lobes ───────────────────────

/**
 * Get a unit direction vector for a given axis name.
 * @param {'x'|'y'|'z'} axis
 * @returns {number[]} [dx, dy, dz]
 */
function axisDir(axis) {
  if (axis === 'x') return [1, 0, 0];
  if (axis === 'y') return [0, 1, 0];
  return [0, 0, 1];
}

// ── Exported geometry generators ─────────────────────────────

/**
 * Create a spherical orbital geometry (s orbitals).
 * @param {number} [radius=1] - sphere radius
 * @param {number} [detail=32] - subdivision count
 * @returns {THREE.BufferGeometry}
 */
export function createSphereGeometry(radius = 1, detail = 32) {
  const positions = [];
  const colors = [];
  // Single sphere, all positive phase — always blue
  addLobe(
    [0, 0, 0], // center
    [1, 0, 0], // stretch dir (no actual stretch)
    [0, 1, 0], // perp1
    [0, 0, 1], // perp2
    radius, // radius
    1, // stretch factor (none)
    detail, // detail
    POS_COLOR, // color
    positions,
    colors
  );
  const allIdx = gridIndices(detail, 0);
  return buildGeometry(positions, colors, allIdx);
}

/**
 * Create a dumbbell orbital geometry (p orbitals).
 * Two lobes offset along the specified axis, stretched 1.5x along that axis.
 * @param {'x'|'y'|'z'} axis - lobe axis
 * @param {boolean} phase - if true, color lobes with alternating sign
 * @param {number} [length=1.2] - total length (center-to-center offset)
 * @param {number} [width=0.6] - lobe radius
 * @returns {THREE.BufferGeometry}
 */
export function createDumbbellGeometry(axis, phase, length = 1.2, width = 0.6) {
  const positions = [];
  const colors = [];
  const dir = axisDir(axis);
  const [p1, p2] = perpendicularBasis(dir);
  const offset = length * 0.5;
  const detail = 24;

  // Negative lobe (along -axis)
  const negColor = phase ? NEG_COLOR : POS_COLOR;
  addLobe(
    [-dir[0] * offset, -dir[1] * offset, -dir[2] * offset],
    dir,
    p1,
    p2,
    width,
    1.5,
    detail,
    negColor,
    positions,
    colors
  );

  // Positive lobe (along +axis)
  addLobe(
    [dir[0] * offset, dir[1] * offset, dir[2] * offset],
    dir,
    p1,
    p2,
    width,
    1.5,
    detail,
    POS_COLOR,
    positions,
    colors
  );

  const vertsPerLobe = (detail + 1) * (detail + 1);
  const idx0 = gridIndices(detail, 0);
  const idx1 = gridIndices(detail, vertsPerLobe);
  const allIdx = idx0.concat(idx1);

  return buildGeometry(positions, colors, allIdx);
}

/**
 * Create a clover (four-lobe) orbital geometry (d orbitals).
 * Four lobes in the specified plane at 90-degree intervals.
 * @param {'x'|'y'|'z'} axis1 - first axis of the plane
 * @param {'x'|'y'|'z'} axis2 - second axis of the plane
 * @param {boolean} phase - if true, color lobes with alternating sign
 * @param {number} [size=1.0] - overall scale
 * @returns {THREE.BufferGeometry}
 */
export function createCloverGeometry(axis1, axis2, phase, size = 1.0) {
  const positions = [];
  const colors = [];
  const detail = 20;
  const lobeRadius = 0.4 * size;
  const lobeOffset = 0.7 * size;

  // Determine the plane normal
  const d1 = axisDir(axis1);
  const d2 = axisDir(axis2);

  // Four lobes at 0, 90, 180, 270 degrees
  for (let k = 0; k < 4; k++) {
    const angle = (k / 4) * 2 * Math.PI;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    // Direction of this lobe in the plane
    const lobeDir = [d1[0] * ca + d2[0] * sa, d1[1] * ca + d2[1] * sa, d1[2] * ca + d2[2] * sa];

    // Center position of this lobe
    const center = [lobeDir[0] * lobeOffset, lobeDir[1] * lobeOffset, lobeDir[2] * lobeOffset];

    // Perpendicular vectors for the lobe
    const [p1, p2] = perpendicularBasis(lobeDir);

    // Color: alternating if phase is on
    const color = phase && k % 2 === 1 ? NEG_COLOR : POS_COLOR;

    addLobe(center, lobeDir, p1, p2, lobeRadius, 2.0, detail, color, positions, colors);
  }

  const vertsPerLobe = (detail + 1) * (detail + 1);
  const allIdx = [];
  for (let k = 0; k < 4; k++) {
    const lobeIdx = gridIndices(detail, k * vertsPerLobe);
    for (let n = 0; n < lobeIdx.length; n++) {
      allIdx.push(lobeIdx[n]);
    }
  }

  return buildGeometry(positions, colors, allIdx);
}

/**
 * Create a donut (torus) geometry for the dz^2 equatorial ring.
 * Also includes two small lobes along z for the complete dz^2 shape.
 * @param {number} [size=1.0] - overall scale
 * @returns {THREE.BufferGeometry}
 */
export function createDonutGeometry(size = 1.0) {
  const positions = [];
  const colors = [];
  const detail = 24;
  const tubeDetail = 16;

  // Major radius of the torus (ring), minor radius (tube thickness)
  const majorR = 0.7 * size;
  const minorR = 0.2 * size;

  // Parametric torus for the equatorial ring
  for (let i = 0; i <= detail; i++) {
    const u = (i / detail) * 2 * Math.PI;
    for (let j = 0; j <= tubeDetail; j++) {
      const v = (j / tubeDetail) * 2 * Math.PI;
      const x = (majorR + minorR * Math.cos(v)) * Math.cos(u);
      const y = (majorR + minorR * Math.cos(v)) * Math.sin(u);
      const z = minorR * Math.sin(v);

      positions.push(x, y, z);
      colors.push(POS_COLOR[0], POS_COLOR[1], POS_COLOR[2]);
    }
  }

  // Two small lobes along the z-axis to complete dz^2 shape
  const lobeDir = [0, 0, 1];
  const [p1, p2] = perpendicularBasis(lobeDir);
  const zOffset = 0.65 * size;
  const lobeR = 0.25 * size;

  // Top lobe
  addLobe([0, 0, zOffset], lobeDir, p1, p2, lobeR, 1.5, 16, POS_COLOR, positions, colors);
  // Bottom lobe (same sign for dz^2 both along z)
  addLobe([0, 0, -zOffset], lobeDir, p1, p2, lobeR, 1.5, 16, POS_COLOR, positions, colors);

  // Indices: torus grid + two lobes
  const torusVerts = (detail + 1) * (tubeDetail + 1);
  const lobeVerts = (16 + 1) * (16 + 1); // detail=16

  const allIdx = [];
  // Torus indices (different grid pattern since it's a tube, not a sphere)
  for (let i = 0; i < detail; i++) {
    for (let j = 0; j < tubeDetail; j++) {
      const a = i * (tubeDetail + 1) + j;
      const b = i * (tubeDetail + 1) + j + 1;
      const c = (i + 1) * (tubeDetail + 1) + j;
      const d = (i + 1) * (tubeDetail + 1) + j + 1;
      allIdx.push(a, b, c);
      allIdx.push(b, d, c);
    }
  }

  // Lobe indices
  const idx1 = gridIndices(16, torusVerts);
  const idx2 = gridIndices(16, torusVerts + lobeVerts);
  for (let n = 0; n < idx1.length; n++) allIdx.push(idx1[n]);
  for (let n = 0; n < idx2.length; n++) allIdx.push(idx2[n]);

  return buildGeometry(positions, colors, allIdx);
}

/**
 * Create a multi-lobe orbital geometry (f orbitals).
 * @param {Array<{offset:number[], dir:number[], sign:number}>} coefficients
 *   Array of lobe descriptor objects.
 *   - offset: [x, y, z] lobe center position
 *   - dir: [x, y, z] lobe stretch direction (unit vector)
 *   - sign: 1 for positive phase, -1 for negative
 * @param {boolean} phase - if true, color lobes by sign
 * @param {number} [size=1.0] - overall scale factor
 * @returns {THREE.BufferGeometry}
 */
export function createMultiLobeGeometry(coefficients, phase, size = 1.0) {
  const positions = [];
  const colors = [];
  const detail = 16;
  const lobeRadius = 0.3 * size;

  const allIdx = [];
  const vertsPerLobe = (detail + 1) * (detail + 1);

  for (let k = 0; k < coefficients.length; k++) {
    const c = coefficients[k];
    const center = [c.offset[0] * size, c.offset[1] * size, c.offset[2] * size];
    const dir = c.dir;
    const [p1, p2] = perpendicularBasis(dir);
    const color = phase && c.sign < 0 ? NEG_COLOR : POS_COLOR;

    addLobe(center, dir, p1, p2, lobeRadius, 1.8, detail, color, positions, colors);

    const lobeIdx = gridIndices(detail, k * vertsPerLobe);
    for (let n = 0; n < lobeIdx.length; n++) allIdx.push(lobeIdx[n]);
  }

  return buildGeometry(positions, colors, allIdx);
}

/**
 * Convenience: return a coefficient array for a given f-orbital by ID.
 * @param {string} orbitalId - e.g. '4fz3', '4fxz2', '4fxyz', '4fy3x2'
 * @returns {Array<{offset:number[], dir:number[], sign:number}>}
 */
export function getFOrbitalCoefficients(orbitalId) {
  const s = 1; // scale factor (applied later)
  const d = 1 / Math.sqrt(3); // diagonal normalization

  const maps = {
    '4fz3': [
      // Two large lobes along z with smaller ring lobes
      { offset: [0, 0, 1.0], dir: [0, 0, 1], sign: 1 },
      { offset: [0, 0, -1.0], dir: [0, 0, -1], sign: 1 },
      // Equatorial ring lobes
      { offset: [0.7, 0, 0], dir: [1, 0, 0], sign: -1 },
      { offset: [-0.7, 0, 0], dir: [-1, 0, 0], sign: -1 },
      { offset: [0, 0.7, 0], dir: [0, 1, 0], sign: -1 },
      { offset: [0, -0.7, 0], dir: [0, -1, 0], sign: -1 },
    ],
    '4fxz2': [
      // Four lobes in xz-plane, two above/below x-axis
      { offset: [0.6, 0, 0.6], dir: [d, 0, d], sign: 1 },
      { offset: [-0.6, 0, -0.6], dir: [-d, 0, -d], sign: 1 },
      { offset: [0.6, 0, -0.6], dir: [d, 0, -d], sign: -1 },
      { offset: [-0.6, 0, 0.6], dir: [-d, 0, d], sign: -1 },
      // Additional lobes along axes
      { offset: [0.4, 0, 0], dir: [1, 0, 0], sign: 1 },
      { offset: [-0.4, 0, 0], dir: [-1, 0, 0], sign: -1 },
    ],
    '4fxyz': [
      // Eight lobes at 45-degree angles (corners of a cube)
      { offset: [0.7, 0.7, 0.7], dir: [d, d, d], sign: 1 },
      { offset: [-0.7, -0.7, 0.7], dir: [-d, -d, d], sign: 1 },
      { offset: [0.7, -0.7, -0.7], dir: [d, -d, -d], sign: 1 },
      { offset: [-0.7, 0.7, -0.7], dir: [-d, d, -d], sign: 1 },
      { offset: [0.7, 0.7, -0.7], dir: [d, d, -d], sign: -1 },
      { offset: [-0.7, -0.7, -0.7], dir: [-d, -d, -d], sign: -1 },
      { offset: [0.7, -0.7, 0.7], dir: [d, -d, d], sign: -1 },
      { offset: [-0.7, 0.7, 0.7], dir: [-d, d, d], sign: -1 },
    ],
    '4fy3x2': [
      // Complex 6-lobe shape in xy-plane with z components
      { offset: [0.8, 0, 0], dir: [1, 0, 0], sign: 1 },
      { offset: [-0.8, 0, 0], dir: [-1, 0, 0], sign: 1 },
      { offset: [0, 0.6, 0.4], dir: [0, d, d], sign: -1 },
      { offset: [0, -0.6, -0.4], dir: [0, -d, -d], sign: -1 },
      { offset: [0.4, 0.5, -0.3], dir: [d, d, -d], sign: 1 },
      { offset: [-0.4, -0.5, 0.3], dir: [-d, -d, d], sign: 1 },
      { offset: [0.4, -0.5, 0.3], dir: [d, -d, d], sign: -1 },
      { offset: [-0.4, 0.5, -0.3], dir: [-d, d, -d], sign: -1 },
    ],
  };

  return maps[orbitalId] || maps['4fz3'];
}
