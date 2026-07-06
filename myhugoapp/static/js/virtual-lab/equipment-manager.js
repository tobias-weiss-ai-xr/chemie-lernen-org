/**
 * equipment-manager.js — 3D equipment models
 *
 * Exposes a global EquipmentManager object.
 * Dependencies: THREE (r128)
 */
/* exported EquipmentManager */

var EquipmentManager = (function () {
  'use strict';

  // ── Internal state ────────────────────────────────────────────────────

  /** The scene Group that holds all placed equipment. Set by LabEngine. */
  var _group = null;

  /** Array of all placed equipment meshes/groups, in insertion order. */
  var _placed = [];

  /** Active bubbling animations. */
  var _animations = [];

  /** Monotonic counter for animation handles. */
  var _animIdCounter = 0;

  // ── Geometry helpers ──────────────────────────────────────────────────

  /**
   * Create a burner (Bunsen burner):
   *   - Cylinder fuel tank (orange)
   *   - Cone flame nozzle on top
   */
  function _createBurner() {
    var group = new THREE.Group();

    var tankGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.35, 16);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.6 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.y = 0.175;
    group.add(tank);

    var nozzleGeom = new THREE.ConeGeometry(0.06, 0.12, 8);
    var nozzleMat = new THREE.MeshStandardMaterial({ color: 0xcc4400, roughness: 0.7 });
    var nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzle.position.y = 0.175 + 0.35 / 2 + 0.12 / 2;
    group.add(nozzle);

    group.userData.type = 'burner';
    return group;
  }

  /**
   * Create a beaker:
   *   - Cylinder body, light-blue transparent material
   *   - Slightly flared rim for visual detail
   */
  function _createBeaker() {
    var group = new THREE.Group();

    var bodyGeom = new THREE.CylinderGeometry(0.3, 0.28, 0.5, 24);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.55,
      roughness: 0.15,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.25;
    group.add(body);

    // Rim ring for visual thickness
    var rimGeom = new THREE.TorusGeometry(0.3, 0.015, 8, 24);
    var rimMat = new THREE.MeshStandardMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.6,
    });
    var rim = new THREE.Mesh(rimGeom, rimMat);
    rim.position.y = 0.5;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    group.userData.type = 'beaker';
    return group;
  }

  /**
   * Create an Erlenmeyer flask using LatheGeometry:
   *   - Wide conical body tapering to a narrow neck
   *   - Dark glass material
   */
  function _createFlask() {
    var group = new THREE.Group();

    var pts = [
      new THREE.Vector2(0.005, 0.0),
      new THREE.Vector2(0.32, 0.0),
      new THREE.Vector2(0.32, 0.03),
      new THREE.Vector2(0.18, 0.28),
      new THREE.Vector2(0.08, 0.38),
      new THREE.Vector2(0.07, 0.48),
      new THREE.Vector2(0.09, 0.5),
    ];

    var bodyGeom = new THREE.LatheGeometry(pts, 24);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      transparent: true,
      opacity: 0.45,
      roughness: 0.25,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.25;
    group.add(body);

    group.userData.type = 'flask';
    return group;
  }

  /**
   * Create a graduated cylinder:
   *   - Tall, thin cylinder
   *   - Clear/transparent material
   */
  function _createCylinder() {
    var group = new THREE.Group();

    var bodyGeom = new THREE.CylinderGeometry(0.15, 0.16, 0.55, 24);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.275;
    group.add(body);

    // Small base ring
    var baseGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.01;
    group.add(base);

    group.userData.type = 'cylinder';
    return group;
  }

  /**
   * Create a thermometer:
   *   - Thin cylinder body (white)
   *   - Red sphere at bottom (mercury bulb)
   */
  function _createThermometer() {
    var group = new THREE.Group();

    var bodyGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 12);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.25;
    group.add(body);

    var bulbGeom = new THREE.SphereGeometry(0.04, 12, 12);
    var bulbMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.3 });
    var bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.position.y = 0.01;
    group.add(bulb);

    group.userData.type = 'thermometer';
    return group;
  }

  /**
   * Create a burette:
   *   - Very tall thin cylinder
   *   - Small tap/stopcock at bottom
   */
  function _createBurette() {
    var group = new THREE.Group();

    var bodyGeom = new THREE.CylinderGeometry(0.06, 0.07, 0.7, 20);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0xddddff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.35;
    group.add(body);

    // Tap / stopcock
    var tapGeom = new THREE.BoxGeometry(0.06, 0.03, 0.1);
    var tapMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
    var tap = new THREE.Mesh(tapGeom, tapMat);
    tap.position.set(0.04, 0.02, 0);
    group.add(tap);

    // Small tip at bottom
    var tipGeom = new THREE.CylinderGeometry(0.02, 0.025, 0.04, 8);
    var tipMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var tip = new THREE.Mesh(tipGeom, tipMat);
    tip.position.y = 0.02;
    group.add(tip);

    group.userData.type = 'burette';
    return group;
  }

  // ── Public API ────────────────────────────────────────────────────────

  var API = {
    /**
     * Set the Three.js Group that holds all equipment.
     * Called automatically by LabEngine.init().
     */
    _setGroup: function (group) {
      _group = group;
    },

    /**
     * Create a 3D equipment mesh and add it to the scene group.
     *
     * @param {string} type   — 'burner', 'beaker', 'flask', 'cylinder',
     *                          'thermometer', or 'burette'
     * @param {THREE.Vector3} position  — world-space position (y is usually 0)
     * @returns {THREE.Object3D|null}  — the placed equipment (a Group or Mesh)
     */
    place: function (type, position) {
      if (!_group) return null;

      var mesh;
      switch (type) {
        case 'burner':
          mesh = _createBurner();
          break;
        case 'beaker':
          mesh = _createBeaker();
          break;
        case 'flask':
          mesh = _createFlask();
          break;
        case 'cylinder':
          mesh = _createCylinder();
          break;
        case 'thermometer':
          mesh = _createThermometer();
          break;
        case 'burette':
          mesh = _createBurette();
          break;
        default:
          return null;
      }

      mesh.position.copy(position);
      mesh.userData.type = type;
      _group.add(mesh);
      _placed.push(mesh);
      return mesh;
    },

    /**
     * Remove the most recently placed equipment of the given type.
     */
    remove: function (type) {
      for (var i = _placed.length - 1; i >= 0; i--) {
        if (_placed[i].userData.type === type) {
          var mesh = _placed[i];
          _group.remove(mesh);
          _placed.splice(i, 1);
          return;
        }
      }
    },

    /**
     * Remove ALL equipment from the scene and stop all animations.
     */
    clear: function () {
      // Stop active animations
      while (_animations.length) {
        var anim = _animations.pop();
        cancelAnimationFrame(anim.rafId);
        anim.bubbles.forEach(function (b) {
          if (b.parent) b.parent.remove(b);
        });
      }

      // Remove equipment meshes
      for (var i = 0; i < _placed.length; i++) {
        _group.remove(_placed[i]);
      }
      _placed = [];
    },

    /**
     * Set the material color of every mesh inside an equipment object.
     *
     * @param {THREE.Object3D} mesh  — equipment returned by place()
     * @param {number|string|THREE.Color} color
     */
    setColor: function (mesh, color) {
      mesh.traverse(function (child) {
        if (child.isMesh && child.material) {
          child.material.color.set(color);
        }
      });
    },

    /**
     * Start a bubbling animation on a beaker or flask.
     * Small semi-transparent spheres rise from the liquid and loop.
     *
     * @param {THREE.Object3D} mesh  — equipment returned by place()
     * @returns {object|null}  — animation handle (pass to stopAnimation)
     */
    animateBubbling: function (mesh) {
      if (!mesh || (mesh.userData.type !== 'beaker' && mesh.userData.type !== 'flask')) {
        return null;
      }

      var surfaceY = 0.12;
      var numBubbles = 8;
      var bubbles = [];

      for (var i = 0; i < numBubbles; i++) {
        var radius = 0.012 + Math.random() * 0.012;
        var sphereGeom = new THREE.SphereGeometry(radius, 8, 8);
        var sphereMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5 + Math.random() * 0.2,
        });
        var sphere = new THREE.Mesh(sphereGeom, sphereMat);

        var angle = Math.random() * Math.PI * 2;
        var dist = Math.random() * 0.18 + 0.02;
        sphere.position.set(
          Math.cos(angle) * dist,
          surfaceY + Math.random() * 0.15,
          Math.sin(angle) * dist
        );

        sphere.userData = {
          riseSpeed: 0.25 + Math.random() * 0.2,
          wobbleSpeed: 1.0 + Math.random() * 2.0,
          wobbleAmount: 0.006 + Math.random() * 0.008,
          phase: Math.random() * Math.PI * 2,
          startY: sphere.position.y,
          surfaceY: surfaceY,
        };

        mesh.add(sphere);
        bubbles.push(sphere);
      }

      var animId = ++_animIdCounter;
      var startTime = performance.now() / 1000;

      function tick() {
        var elapsed = performance.now() / 1000 - startTime;

        for (var j = 0; j < bubbles.length; j++) {
          var b = bubbles[j];
          var rise = b.userData.riseSpeed;
          var newY = b.userData.startY + elapsed * rise;

          if (newY > b.userData.surfaceY + 0.5) {
            newY = b.userData.startY;
            var a2 = Math.random() * Math.PI * 2;
            var d2 = Math.random() * 0.18 + 0.02;
            b.position.x = Math.cos(a2) * d2;
            b.position.z = Math.sin(a2) * d2;
            b.userData.startY = b.userData.surfaceY + Math.random() * 0.1;
            startTime = performance.now() / 1000 - elapsed;
          }

          var wobX =
            Math.sin(elapsed * b.userData.wobbleSpeed + b.userData.phase) * b.userData.wobbleAmount;
          var wobZ =
            Math.cos(elapsed * b.userData.wobbleSpeed + b.userData.phase) * b.userData.wobbleAmount;

          b.position.x += wobX;
          b.position.y = newY;
          b.position.z += wobZ;
        }

        for (var k = 0; k < _animations.length; k++) {
          if (_animations[k].id === animId) {
            _animations[k].rafId = requestAnimationFrame(tick);
            break;
          }
        }
      }

      var rafId = requestAnimationFrame(tick);

      _animations.push({
        id: animId,
        rafId: rafId,
        bubbles: bubbles,
        mesh: mesh,
      });

      return { id: animId };
    },

    /**
     * Stop a bubbling animation and remove its bubble spheres.
     *
     * @param {object} handle  — handle returned by animateBubbling()
     */
    stopAnimation: function (handle) {
      if (!handle || typeof handle.id === 'undefined') return;

      for (var i = 0; i < _animations.length; i++) {
        if (_animations[i].id === handle.id) {
          var anim = _animations[i];
          cancelAnimationFrame(anim.rafId);
          for (var j = 0; j < anim.bubbles.length; j++) {
            var b = anim.bubbles[j];
            if (b.parent) b.parent.remove(b);
          }
          _animations.splice(i, 1);
          return;
        }
      }
    },

    /**
     * Return the count of placed equipment (used by lab-engine internally).
     */
    _count: function () {
      return _placed.length;
    },
  };

  return API;
})();
