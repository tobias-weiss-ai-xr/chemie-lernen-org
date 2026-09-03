/**
 * lab-engine.js — Three.js scene orchestrator
 *
 * Dependencies: THREE (r128), EquipmentManager, ReactionEngine
 */
/* global EquipmentManager, ReactionEngine, THREE */

var LabEngine = {
  // ── Internal state ────────────────────────────────────────────────────

  _scene: null,
  _camera: null,
  _renderer: null,
  _controls: null,
  _equipmentGroup: null,
  _groundPlane: null,
  _dragState: null,
  _currentExperimentId: null,
  _isRunning: false,
  _animFrameId: null,
  _onResize: null,
  _simpleControls: null,

  // ── Initialisation ────────────────────────────────────────────────────

  /**
   * Set up the Three.js scene, camera, lights, controls, and animation loop.
   *
   * @param {string} canvasId   — id of the <canvas> element
   * @param {string} loadingId  — id of the loading indicator element
   */
  init: function (canvasId, loadingId) {
    var self = this;

    var canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error('LabEngine.init: canvas element "' + canvasId + '" not found');
      return;
    }

    var container = canvas.parentElement;
    var width = container ? container.clientWidth : window.innerWidth;
    var height = container ? container.clientHeight || 400 : 400;

    // ── Scene ───────────────────────────────────────────────────────
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x1a1a2e);

    // ── Camera ──────────────────────────────────────────────────────
    this._camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this._camera.position.set(2, 1.5, 3);

    // ── Renderer ────────────────────────────────────────────────────
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ── Lights ──────────────────────────────────────────────────────

    // Ambient — soft fill from all directions
    var ambient = new THREE.AmbientLight(0x404060, 0.5);
    this._scene.add(ambient);

    // Key light — directional from top-right
    var keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(2, 3, 2);
    keyLight.castShadow = true;
    this._scene.add(keyLight);

    // Fill light — cool from left
    var fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-1, 1.5, 1);
    this._scene.add(fillLight);

    // Small rim light from behind
    var rimLight = new THREE.DirectionalLight(0xffffff, 0.15);
    rimLight.position.set(0, 0.5, -2);
    this._scene.add(rimLight);

    // ── Ground reference plane (invisible, used for raycasting) ─────
    this._groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // ── Equipment group ─────────────────────────────────────────────
    this._equipmentGroup = new THREE.Group();
    this._scene.add(this._equipmentGroup);

    // Wire up EquipmentManager
    if (
      typeof EquipmentManager !== 'undefined' &&
      typeof EquipmentManager._setGroup === 'function'
    ) {
      EquipmentManager._setGroup(this._equipmentGroup);
    }

    // ── Controls ────────────────────────────────────────────────────
    if (typeof THREE.OrbitControls !== 'undefined') {
      this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
      this._controls.target.set(0, 0.3, 0);
      this._controls.update();
    } else {
      this._setupSimpleControls();
    }

    // ── Resize handler ──────────────────────────────────────────────
    this._onResize = function () {
      var w = container ? container.clientWidth : window.innerWidth;
      var h = container ? container.clientHeight || 400 : 400;
      self._camera.aspect = w / h;
      self._camera.updateProjectionMatrix();
      self._renderer.setSize(w, h);
    };
    window.addEventListener('resize', this._onResize);

    // ── Start animation loop ────────────────────────────────────────
    this._animate();

    // ── Hide loading indicator ──────────────────────────────────────
    var loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }

    // ── UXF-037: Initiales Experiment laden ────────────────────────
    // Vorher blieb die Szene leer (dunkler Hintergrund + unsichtbare
    // Bodenebene = „black plane"), bis der Nutzer das Dropdown änderte.
    var select = document.getElementById('experiment-select');
    var initialId =
      select && select.value
        ? select.value
        : window.experiments && window.experiments.freestyle
          ? 'freestyle'
          : null;
    if (initialId) {
      self.loadExperiment(initialId);
    }
  },

  // ── Animation loop ────────────────────────────────────────────────────

  /** Internal requestAnimationFrame loop — just renders the scene. */
  _animate: function () {
    var self = this;

    function loop() {
      self._animFrameId = requestAnimationFrame(loop);

      if (self._controls && typeof self._controls.update === 'function') {
        self._controls.update();
      }

      self._renderer.render(self._scene, self._camera);
    }

    loop();
  },

  // ── Simple orbit fallback (when THREE.OrbitControls is unavailable) ──

  /** Mouse-drag + scroll-wheel orbit controls using primitive events. */
  _setupSimpleControls: function () {
    var self = this;
    var canvas = this._renderer.domElement;
    var isOrbiting = false;
    var prev = { x: 0, y: 0 };
    var state = { theta: 0, phi: Math.PI / 4, radius: 3.5 };

    function updateCamera() {
      var r = state.radius;
      var sinPhi = Math.sin(state.phi);
      var x = r * sinPhi * Math.sin(state.theta);
      var y = r * Math.cos(state.phi);
      var z = r * sinPhi * Math.cos(state.theta);
      self._camera.position.set(x, y + 0.3, z);
      self._camera.lookAt(0, 0.3, 0);
    }

    canvas.addEventListener('mousedown', function (e) {
      if (self._dragState && self._dragState.active) return;
      isOrbiting = true;
      prev.x = e.clientX;
      prev.y = e.clientY;
    });

    window.addEventListener('mousemove', function (e) {
      if (!isOrbiting) return;
      var dx = e.clientX - prev.x;
      var dy = e.clientY - prev.y;
      state.theta -= dx * 0.008;
      state.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, state.phi + dy * 0.008));
      prev.x = e.clientX;
      prev.y = e.clientY;
      updateCamera();
    });

    window.addEventListener('mouseup', function () {
      isOrbiting = false;
    });

    canvas.addEventListener(
      'wheel',
      function (e) {
        e.preventDefault();
        state.radius = Math.max(1.0, Math.min(8.0, state.radius + e.deltaY * 0.004));
        updateCamera();
      },
      { passive: false }
    );

    updateCamera();
    this._simpleControls = { state: state, updateCamera: updateCamera };
  },

  // ── Experiment management ─────────────────────────────────────────────

  /**
   * Load an experiment configuration from the window.experiments global.
   * Clears existing equipment and shows the experiment info.
   *
   * @param {string} experimentId  — key into window.experiments
   */
  loadExperiment: function (experimentId) {
    this._currentExperimentId = experimentId;

    // Clear existing state
    if (typeof EquipmentManager !== 'undefined') {
      EquipmentManager.clear();
    }

    this._clearObservations();
    this.hideInfo();

    // Load config
    var config =
      window.experiments && window.experiments[experimentId]
        ? window.experiments[experimentId]
        : null;

    if (!config) {
      this.addObservation('Experiment "' + experimentId + '" nicht gefunden.', 'warning');
      return;
    }

    this.addObservation('Experiment geladen: ' + (config.name || experimentId), 'info');

    // Pre-place equipment listed in config
    if (config.equipment && Array.isArray(config.equipment)) {
      for (var i = 0; i < config.equipment.length; i++) {
        var eqType = config.equipment[i];
        var offsetX = (i - (config.equipment.length - 1) / 2) * 0.6;
        var pos = new THREE.Vector3(offsetX, 0, 0);
        var mesh = EquipmentManager.place(eqType, pos);
        if (mesh) {
          this.addObservation('Gerät bereitgestellt: ' + eqType, 'info');
        }
      }
    }

    // Show info if available
    if (config.info) {
      this.showInfo(
        config.info.title || 'Experiment',
        config.info.content || '',
        config.info.safety || []
      );
    }
  },

  /**
   * Run the current experiment's reaction simulation.
   * Disables the run button during the reaction, re-enables when done.
   */
  runExperiment: function () {
    if (this._isRunning) return;
    if (!this._currentExperimentId) {
      this.addObservation('Kein Experiment geladen.', 'warning');
      return;
    }

    var self = this;
    var config =
      window.experiments && window.experiments[this._currentExperimentId]
        ? window.experiments[this._currentExperimentId]
        : null;

    this._isRunning = true;
    this._setRunButtonDisabled(true);

    this.addObservation('Reaktion gestartet...', 'info');

    // If the experiment config provides its own reaction runner, call it
    if (config && typeof config.run === 'function') {
      try {
        config.run(self);
      } catch (err) {
        this.addObservation('Fehler: ' + (err.message || String(err)), 'warning');
        this._finishReaction();
      }
    } else {
      // Fallback: generic reaction simulation
      this._runDefaultReaction();
    }
  },

  /** Internal: disable or re-enable the run button. */
  _setRunButtonDisabled: function (disabled) {
    var btn = document.getElementById('run-btn') || document.getElementById('runButton');
    if (btn) {
      btn.disabled = disabled;
    }
  },

  /** Internal: mark the reaction as finished and restore button state. */
  _finishReaction: function () {
    this._isRunning = false;
    this._setRunButtonDisabled(false);
    this.addObservation('Reaktion beendet.', 'success');
  },

  /**
   * Default reaction simulation when the experiment config has no
   * custom `run` function. Uses color changes and bubbling animation.
   */
  _runDefaultReaction: function () {
    var self = this;

    // Find a beaker or flask among placed equipment
    var vessel = null;
    var children = this._equipmentGroup.children;
    for (var i = 0; i < children.length; i++) {
      var t = children[i].userData.type;
      if (t === 'beaker' || t === 'flask') {
        vessel = children[i];
        break;
      }
    }

    if (!vessel) {
      this.addObservation('Kein Reaktionsgefäß (Becherglas/Kolben) vorhanden.', 'warning');
      this._finishReaction();
      return;
    }

    // Phase 1 — colour shift
    this.addObservation('Flüssigkeit verfärbt sich...', 'info');
    if (typeof EquipmentManager.setColor === 'function') {
      EquipmentManager.setColor(vessel, 0xff8844);
    }

    setTimeout(function () {
      self.addObservation('Farbe wechselt zu orange — Reaktion läuft.', 'success');
      self.showInfo(
        'Reaktionsverlauf',
        'Die chemische Reaktion hat begonnen. Beobachten Sie die Farbänderung und Gasentwicklung.',
        []
      );

      // Phase 2 — bubbling
      var bubbleHandle = null;
      if (typeof EquipmentManager.animateBubbling === 'function') {
        bubbleHandle = EquipmentManager.animateBubbling(vessel);
      }

      if (bubbleHandle) {
        self.addObservation('Gasblasen aufsteigend...', 'info');
      }

      setTimeout(function () {
        // Phase 3 — second colour shift
        if (typeof EquipmentManager.setColor === 'function') {
          EquipmentManager.setColor(vessel, 0x4488ff);
        }
        self.addObservation('Farbumschlag nach blau. Zwischenstufe erreicht.', 'info');

        setTimeout(function () {
          // Phase 4 — final colour (completion)
          if (bubbleHandle && typeof EquipmentManager.stopAnimation === 'function') {
            EquipmentManager.stopAnimation(bubbleHandle);
          }

          if (typeof EquipmentManager.setColor === 'function') {
            EquipmentManager.setColor(vessel, 0x66cc88);
          }
          self.addObservation(
            'Reaktion abgeschlossen. Grüne Färbung zeigt neutralen pH-Wert.',
            'success'
          );
          self._finishReaction();
        }, 2500);
      }, 2000);
    }, 1200);
  },

  /**
   * Reset the scene: remove all equipment, clear observations, hide info.
   */
  reset: function () {
    var hadExperiment = this._currentExperimentId;
    if (typeof EquipmentManager !== 'undefined') {
      EquipmentManager.clear();
    }
    this._clearObservations();
    this.hideInfo();
    this._isRunning = false;
    this._setRunButtonDisabled(false);
    // UXF-038: Szene wiederherstellen — vorher blieb nach dem Reset die
    // leere Szene stehen („black plane") bis zur Neu-Auswahl.
    if (hadExperiment) {
      this.loadExperiment(hadExperiment);
    }
  },

  // ── Drag-and-drop (2D panel → 3D scene) ───────────────────────────────

  /**
   * Called on mousedown of an equipment-item in the 2D panel.
   * Initiates a drag: tracks mouse movement and places equipment on the
   * ground plane on mouseup using THREE.Raycaster.
   *
   * @param {Event} e              — the mousedown event
   * @param {string} equipmentType — 'burner', 'beaker', etc.
   */
  startDrag: function (e, equipmentType) {
    if (this._isRunning) return;

    // In some setups OrbitControls consumes the event first.
    // Disable controls while dragging from the panel.
    if (this._controls && typeof this._controls.enabled !== 'undefined') {
      this._controls.enabled = false;
    }

    var self = this;
    var canvas = this._renderer.domElement;

    this._dragState = {
      type: equipmentType,
      active: true,
    };

    // Optional: show a ghost/preview (a small ring) on the ground
    var preview = null;

    function onMouseMove(event) {
      // Update preview position
      var pos = self._getGroundIntersection(event, canvas);
      if (!pos) return;

      if (!preview) {
        var ringGeom = new THREE.RingGeometry(0.05, 0.12, 24);
        var ringMat = new THREE.MeshBasicMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        preview = new THREE.Mesh(ringGeom, ringMat);
        preview.rotation.x = -Math.PI / 2;
        preview.position.y = 0.005;
        self._scene.add(preview);
      }
      preview.position.x = pos.x;
      preview.position.z = pos.z;
    }

    function onMouseUp(event) {
      // Remove preview
      if (preview) {
        self._scene.remove(preview);
        preview = null;
      }

      // Place equipment on the ground plane
      var pos = self._getGroundIntersection(event, canvas);
      if (pos) {
        var clamped = new THREE.Vector3(
          Math.max(-2.0, Math.min(2.0, pos.x)),
          0,
          Math.max(-2.0, Math.min(2.0, pos.z))
        );

        if (typeof EquipmentManager !== 'undefined') {
          EquipmentManager.place(self._dragState.type, clamped);
        }
      }

      // Clean up listeners
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Re-enable controls
      if (self._controls && typeof self._controls.enabled !== 'undefined') {
        self._controls.enabled = true;
      }

      self._dragState = null;
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  },

  /**
   * Project a mouse event onto the ground plane via THREE.Raycaster.
   *
   * @param {Event} event   — mouse event
   * @param {HTMLCanvasElement} canvas
   * @returns {THREE.Vector3|null}
   */
  _getGroundIntersection: function (event, canvas) {
    if (!canvas) canvas = this._renderer.domElement;
    var rect = canvas.getBoundingClientRect();

    var mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this._camera);

    var target = new THREE.Vector3();
    var hit = raycaster.ray.intersectPlane(this._groundPlane, target);
    return hit ? target.clone() : null;
  },

  // ── UI helpers ────────────────────────────────────────────────────────

  /**
   * Append a timestamped line to the #observation-log element.
   *
   * @param {string} text  — observation text
   * @param {string} type  — CSS class: 'warning', 'success', 'info' (optional)
   */
  addObservation: function (text, type) {
    var log = document.getElementById('observation-log');
    if (!log) return;

    var now = new Date();
    var timestamp =
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0') +
      ':' +
      String(now.getSeconds()).padStart(2, '0');

    var line = document.createElement('div');
    line.className = 'observation-line' + (type ? ' observation-' + type : '');
    line.textContent = '[' + timestamp + '] ' + text;

    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  },

  /** Clear all observation lines. */
  _clearObservations: function () {
    var log = document.getElementById('observation-log');
    if (log) {
      log.innerHTML = '';
    }
  },

  /**
   * Show the info panel with experiment details.
   *
   * @param {string} title         — panel heading
   * @param {string} content       — description / instructions (HTML-safe text)
   * @param {Array} safetyBadges   — [{ text, class }, ...]
   */
  showInfo: function (title, content, safetyBadges) {
    var panel = document.getElementById('info-panel');
    if (!panel) return;

    var titleEl = document.getElementById('info-title') || panel.querySelector('h3');
    if (titleEl) {
      titleEl.textContent = title;
    }

    var contentEl = document.getElementById('info-content') || panel.querySelector('.info-content');
    if (contentEl) {
      contentEl.textContent = content;
    }

    var safetyEl = document.getElementById('info-safety') || panel.querySelector('.safety-badges');
    if (safetyEl) {
      safetyEl.innerHTML = '';

      if (safetyBadges && Array.isArray(safetyBadges)) {
        for (var i = 0; i < safetyBadges.length; i++) {
          var badge = document.createElement('span');
          badge.className =
            'safety-badge' + (safetyBadges[i].class ? ' ' + safetyBadges[i].class : '');
          badge.textContent = safetyBadges[i].text || '';
          safetyEl.appendChild(badge);
        }
      }
    }

    panel.style.display = 'block';
  },

  /** Hide the info panel. */
  hideInfo: function () {
    var panel = document.getElementById('info-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  },

  // ── Cleanup ───────────────────────────────────────────────────────────

  /**
   * Tear down the engine (remove event listeners, stop animations).
   * Called when the page unloads or the virtual lab is destroyed.
   */
  dispose: function () {
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }

    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }

    if (typeof EquipmentManager !== 'undefined') {
      EquipmentManager.clear();
    }

    if (this._renderer) {
      this._renderer.dispose();
    }

    this._scene = null;
    this._camera = null;
    this._renderer = null;
    this._controls = null;
    this._equipmentGroup = null;
    this._dragState = null;
  },
};
// UXF-039: Dual-Export für Tests (Browser behält das globale var LabEngine)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LabEngine;
}
