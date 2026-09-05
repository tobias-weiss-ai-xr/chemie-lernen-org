import * as THREE from 'three';
import { catHex } from './theme.js';
export const ELECTRON_HEX = '#eaf4ff';
const geo = {
  nucleus: new THREE.SphereGeometry(0.17, 24, 24),
  electron: new THREE.SphereGeometry(0.055, 10, 10),
  tile: new THREE.PlaneGeometry(2.15, 2.15),
  disc: new THREE.CircleGeometry(0.85, 48),
  rings: [],
};
for (let e = 0; e < 8; e++)
  geo.rings.push(new THREE.RingGeometry(0.5 + 0.3 * e - 0.02, 0.5 + 0.3 * e + 0.02, 64));
export { geo };
export function makeLabel(e, t = {}) {
  const {
      color: o = '#e8ecf4',
      size: a = 44,
      mono: n = !0,
      bg: s = null,
      pad: r = 10,
      scale: i = 0.0065,
    } = t,
    c = document.createElement('canvas'),
    l = c.getContext('2d'),
    E = `${a}px ${n ? 'ui-monospace, Menlo, Consolas, monospace' : 'sans-serif'}`;
  l.font = E;
  const u = Math.ceil(l.measureText(e).width) + 2 * r,
    p = a + 2 * r;
  ((c.width = u),
    (c.height = p),
    (l.font = E),
    s &&
      ((l.fillStyle = s), l.roundRect ? l.roundRect(0, 0, u, p, 8) : l.rect(0, 0, u, p), l.fill()),
    (l.fillStyle = o),
    (l.textBaseline = 'middle'),
    l.fillText(e, r, p / 2 + 1));
  const h = new THREE.CanvasTexture(c);
  h.minFilter = THREE.LinearFilter;
  const d = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: h, transparent: !0, depthWrite: !1, depthTest: !1 })
  );
  return (d.scale.set(u * i, p * i, 1), (d.userData.aspect = u / p), d);
}
let glowTex = null;
function getGlowTex() {
  if (glowTex) return glowTex;
  const e = 128,
    t = document.createElement('canvas');
  t.width = t.height = e;
  const o = t.getContext('2d'),
    a = o.createRadialGradient(64, 64, 0, 64, 64, 64);
  return (
    a.addColorStop(0, 'rgba(255,255,255,1)'),
    a.addColorStop(0.3, 'rgba(255,255,255,0.5)'),
    a.addColorStop(1, 'rgba(255,255,255,0)'),
    (o.fillStyle = a),
    o.fillRect(0, 0, e, e),
    (glowTex = new THREE.CanvasTexture(t)),
    glowTex
  );
}
export function makeGlow(e, t = 1) {
  const o = new THREE.SpriteMaterial({
      map: getGlowTex(),
      color: e,
      transparent: !0,
      blending: THREE.AdditiveBlending,
      depthWrite: !1,
      opacity: 0.85,
    }),
    a = new THREE.Sprite(o);
  return (a.scale.set(t, t, t), a);
}
export function buildAtom(e, t = {}) {
  const { shells: o = e.sh, low: a = !1, electronCap: n = 14 } = t,
    s = new THREE.Color('#' + e.c),
    r = new THREE.Group(),
    i = catHex(e.cat),
    c = new THREE.Mesh(
      geo.nucleus,
      new THREE.MeshStandardMaterial({
        color: s,
        emissive: s,
        emissiveIntensity: 1.15,
        roughness: 0.35,
        metalness: 0.2,
      })
    );
  r.add(c);
  const l = a ? Math.min(o.length, 4) : o.length;
  for (let e = 0; e < l; e++) {
    const t = a ? Math.min(o[e], 6) : Math.min(o[e], n),
      s = new THREE.Group(),
      c = new THREE.Mesh(
        geo.rings[e],
        new THREE.MeshBasicMaterial({
          color: i,
          transparent: !0,
          opacity: a ? 0.55 : 0.8,
          side: THREE.DoubleSide,
        })
      );
    if ((s.add(c), t > 0)) {
      const o = new THREE.InstancedMesh(
          geo.electron,
          new THREE.MeshBasicMaterial({ color: '#eaf4ff', transparent: !0, opacity: 0.95 }),
          t
        ),
        a = new THREE.Matrix4();
      for (let n = 0; n < t; n++) {
        const s = (n / t) * Math.PI * 2;
        (a.makeTranslation(Math.cos(s) * (0.5 + 0.3 * e), Math.sin(s) * (0.5 + 0.3 * e), 0),
          o.setMatrixAt(n, a));
      }
      ((o.instanceMatrix.needsUpdate = !0), s.add(o));
    }
    ((s.userData.speed = 0.45 + 0.14 * e), (s.userData.tilt = (e % 3) * 0.6 - 0.55), r.add(s));
  }
  return ((r.userData.nShells = l), r);
}
export function orbitAtom(e, t) {
  for (const o of e.children)
    o.userData &&
      o.userData.speed &&
      ((o.rotation.z += t * o.userData.speed), (o.rotation.x = o.userData.tilt));
}
export function buildDoor(e = {}) {
  const {
      text: t = 'ENTER ROOM',
      sub: o = '',
      color: a = '#3fe0ff',
      scale: n = 1,
      opacity: s = 1,
    } = e,
    r = new THREE.Group(),
    i = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.05, 10, 48),
      new THREE.MeshBasicMaterial({ color: a, transparent: !0, opacity: s })
    );
  r.add(i);
  const c = new THREE.Mesh(
    new THREE.CircleGeometry(0.97, 48),
    new THREE.MeshBasicMaterial({
      color: a,
      transparent: !0,
      opacity: 0.08 * s,
      side: THREE.DoubleSide,
      depthWrite: !1,
    })
  );
  ((c.position.z = -0.02), r.add(c));
  const l = makeGlow(a, 2.5);
  ((l.position.z = -0.2), (l.material.opacity = 0.55), r.add(l));
  const E = makeLabel(t, { color: a, size: 40, scale: 0.0042 });
  if (((E.position.y = -1.5), r.add(E), o)) {
    const e = makeLabel(o, { color: '#8a93a8', size: 26, scale: 0.0038 });
    ((e.position.y = -2.05), r.add(e));
  }
  return (r.scale.setScalar(n), (r.userData.isPortal = !0), (r.userData.meshes = [i, c, l, E]), r);
}
export function makeStarDust(e = {}) {
  const {
      count: t = 300,
      area: o = { x: 30, y: 18, z: 24 },
      color: a = 11454207,
      size: n = 0.1,
      opacity: s = 0.5,
    } = e,
    r = new Float32Array(3 * t);
  for (let e = 0; e < t; e++)
    ((r[3 * e] = (2 * Math.random() - 1) * o.x),
      (r[3 * e + 1] = Math.random() * o.y),
      (r[3 * e + 2] = (2 * Math.random() - 1) * o.z));
  const i = new THREE.BufferGeometry();
  i.setAttribute('position', new THREE.BufferAttribute(r, 3));
  const c = new THREE.PointsMaterial({
      color: a,
      size: n,
      transparent: !0,
      opacity: s,
      depthWrite: !1,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: !0,
    }),
    l = new THREE.Points(i, c);
  return ((l.userData.isDust = !0), l);
}
const CUBE = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
  ],
  CUBE_EDGES = [
    [0, 1],
    [0, 2],
    [0, 4],
    [1, 3],
    [1, 5],
    [2, 3],
    [2, 6],
    [3, 7],
    [4, 5],
    [4, 6],
    [5, 7],
    [6, 7],
  ];
function hexRing(e, t, o, a, n) {
  for (let n = 0; n < 6; n++) {
    const s = ((o + 60 * n) * Math.PI) / 180;
    a.push([Math.cos(s) * e, t, Math.sin(s) * e]);
  }
  return n + 6;
}
function latticePoints(e) {
  const t = [],
    o = [],
    a = (e) => t.push(e);
  switch (e) {
    case 'atom':
    default:
      t.push([0, 0, 0]);
      break;
    case 'dumbbell':
      (t.push([-0.55, 0, 0], [0.55, 0, 0]), o.push([0, 1]));
      break;
    case 'tetra':
      (t.push([0.55, 0.55, 0.55], [0.55, -0.55, -0.55], [-0.55, 0.55, -0.55], [-0.55, -0.55, 0.55]),
        o.push([0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]));
      break;
    case 'ring8':
      for (let e = 0; e < 8; e++) {
        const o = (45 * e * Math.PI) / 180;
        t.push([0.8 * Math.cos(o), e % 2 ? 0.14 : -0.14, 0.8 * Math.sin(o)]);
      }
      for (let e = 0; e < 8; e++) o.push([e, (e + 1) % 8]);
      break;
    case 'sc':
      (CUBE.forEach(a), o.push(...CUBE_EDGES));
      break;
    case 'bcc':
      (CUBE.forEach(a), t.push([0.5, 0.5, 0.5]), o.push([0, 7], [1, 6], [2, 5], [3, 4]));
      break;
    case 'fcc': {
      (CUBE.forEach(a),
        t.push(
          [1, 0.5, 0.5],
          [0, 0.5, 0.5],
          [0.5, 1, 0.5],
          [0.5, 0, 0.5],
          [0.5, 0.5, 1],
          [0.5, 0.5, 0]
        ));
      const e = (e, t) => o.push([e, t]);
      ([1, 3, 5, 7].forEach((t) => e(t, 8)),
        [0, 2, 4, 6].forEach((t) => e(t, 9)),
        [2, 3, 6, 7].forEach((t) => e(t, 10)),
        [0, 1, 4, 5].forEach((t) => e(t, 11)),
        [4, 5, 6, 7].forEach((t) => e(t, 12)),
        [0, 1, 2, 3].forEach((t) => e(t, 13)));
      break;
    }
    case 'diamond':
      (CUBE.forEach(a),
        t.push(
          [1, 0.5, 0.5],
          [0, 0.5, 0.5],
          [0.5, 1, 0.5],
          [0.5, 0, 0.5],
          [0.5, 0.5, 1],
          [0.5, 0.5, 0]
        ),
        t.push([0.25, 0.25, 0.25], [0.75, 0.75, 0.25], [0.75, 0.25, 0.75], [0.25, 0.75, 0.75]),
        o.push([14, 0], [14, 9], [14, 11], [14, 13]),
        o.push([15, 7], [15, 8], [15, 10], [15, 13]),
        o.push([16, 5], [16, 8], [16, 11], [16, 12]),
        o.push([17, 6], [17, 9], [17, 10], [17, 12]));
      break;
    case 'hcp':
      (t.push([0, 0, 0]),
        hexRing(1, 0, 0, t, 1),
        hexRing(1, 0.8, 30, t, 7),
        t.push([0, 1.6, 0]),
        hexRing(1, 1.6, 0, t, 11));
      for (const e of [1, 11])
        for (let t = 0; t < 6; t++)
          (o.push([e, e + 1 + t]), o.push([e + 1 + t, e + 1 + ((t + 1) % 6)]));
      (o.push([7, 8], [8, 9], [9, 7]),
        o.push([7, 1], [7, 2], [8, 3], [8, 4], [9, 5], [9, 6]),
        o.push([7, 11], [7, 12], [8, 13], [8, 14], [9, 15], [9, 16]));
  }
  return { pts: t, bonds: o };
}
export function buildLattice({
  type: e = 'atom',
  color: t = '#3fe0ff',
  extent: o = 2.4,
  radius: a = 0.3,
} = {}) {
  const { pts: n, bonds: s } = latticePoints(e),
    r = new THREE.Group(),
    i = new THREE.SphereGeometry(a, 20, 14),
    c = new THREE.MeshStandardMaterial({
      color: new THREE.Color(t),
      roughness: 0.35,
      metalness: 0.55,
      emissive: new THREE.Color(t),
      emissiveIntensity: 0.08,
    }),
    l = new THREE.CylinderGeometry(0.035, 0.035, 1, 6),
    E = new THREE.MeshStandardMaterial({ color: 9082029, roughness: 0.6, metalness: 0.3 }),
    u = new THREE.Vector3(0, 1, 0),
    p = new THREE.Vector3(),
    h = 'atom' === e ? 2.2 * a : o;
  for (const e of n) {
    const t = new THREE.Mesh(i, c);
    (t.position.set(e[0] * h, e[1] * h, e[2] * h), r.add(t));
  }
  for (const [e, t] of s) {
    const o = new THREE.Vector3(...n[e]).multiplyScalar(h),
      a = new THREE.Vector3(...n[t]).multiplyScalar(h),
      s = o.clone().add(a).multiplyScalar(0.5),
      i = o.distanceTo(a),
      c = new THREE.Mesh(l, E);
    (c.position.copy(s),
      (c.scale.y = i),
      p.subVectors(a, o).normalize(),
      c.quaternion.setFromUnitVectors(u, p),
      r.add(c));
  }
  if ('atom' === e) {
    const e = makeGlow(t, 3.2 * h);
    ((e.material.opacity = 0.5), r.add(e));
  }
  const d = new THREE.Box3().setFromObject(r).getCenter(new THREE.Vector3());
  return (
    r.children.forEach((e) => e.position.sub(d)),
    (r.userData.isLattice = !0),
    (r.userData.latticeType = e),
    r
  );
}
