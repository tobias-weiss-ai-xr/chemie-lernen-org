/**
 * three-fake.cjs — a dependency-free stand-in for the `three` npm package.
 *
 * Loaded by the molecule-hero render tests via the jest `moduleNameMapper`
 * (`^three$` → this file). The site's molecule modules are `.js` and are
 * transpiled to CommonJS by jest-transform-esm.cjs, so `import * as THREE
 * from 'three'` becomes `require('three')` — therefore the fake MUST be a CJS
 * module (`.cjs`) that a CJS `require` can load.
 *
 * In Jest's ESM runtime the `jest` global is NOT available, so this fake tracks
 * `scene.add` / `scene.remove` calls with plain mutable module state exported
 * as `__calls`.
 */
const __calls = { add: [], remove: [] };

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
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
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

class Mesh {
  constructor(geo, mat) {
    this.geometry = geo;
    this.material = mat;
    this.position = new Vector3();
    this.scale = { set: () => {} };
    this.lookAt = () => {};
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
        minX = Math.min(minX, o.position.x);
        maxX = Math.max(maxX, o.position.x);
        minY = Math.min(minY, o.position.y);
        maxY = Math.max(maxY, o.position.y);
        minZ = Math.min(minZ, o.position.z);
        maxZ = Math.max(maxZ, o.position.z);
      }
      (o.children || []).forEach(visit);
    };
    visit(g);
    this.min = new Vector3(minX, minY, minZ);
    this.max = new Vector3(maxX, maxY, maxZ);
    return this;
  }
  getCenter(out) {
    return out.copy(
      new Vector3(
        (this.min.x + this.max.x) / 2,
        (this.min.y + this.max.y) / 2,
        (this.min.z + this.max.z) / 2
      )
    );
  }
  getSize(out) {
    return out.copy(
      new Vector3(this.max.x - this.min.x, this.max.y - this.min.y, this.max.z - this.min.z)
    );
  }
}

class Scene {
  constructor() {
    this.background = null;
    this.children = [];
  }
  add(c) {
    this.children.push(c);
    __calls.add.push(c);
    return this;
  }
  remove(c) {
    const i = this.children.indexOf(c);
    if (i >= 0) this.children.splice(i, 1);
    __calls.remove.push(c);
    return this;
  }
}

class Color {}
class PerspectiveCamera {
  constructor() {
    this.position = new Vector3();
    this.aspect = 1;
  }
  updateProjectionMatrix() {}
}
class WebGLRenderer {
  setPixelRatio() {}
  setSize() {}
  render() {}
}
class AmbientLight {}
class DirectionalLight {
  constructor() {
    this.position = new Vector3();
  }
}
class SphereGeometry {}
class CylinderGeometry {
  constructor() {
    this.rotateX = () => this;
    this.translate = () => this;
  }
}
class MeshPhongMaterial {
  constructor(params) {
    this.params = params;
  }
}

module.exports = {
  __calls,
  Vector3,
  Group,
  Mesh,
  Box3,
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  SphereGeometry,
  CylinderGeometry,
  MeshPhongMaterial,
};
