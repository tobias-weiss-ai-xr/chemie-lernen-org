/**
 * tests/virtual-lab-lab-engine.test.js — TDD für UXF-037/038
 *
 * UXF-037: init() lud KEIN initiales Experiment → die Szene blieb leer
 *   (nur dunkler Hintergrund 0x1a1a2e = „black plane"), bis der Nutzer
 *   das Experiment-Dropdown manuell änderte.
 * UXF-038: reset() leerte die Szene, OHNE das aktuelle Experiment
 *   wiederherzustellen → nach Reset wieder leere Szene.
 *
 * Quelle: myhugoapp/static/js/virtual-lab/lab-engine.js
 * (Dual-Export via module.exports; THREE/EquipmentManager werden gestubbt)
 */

describe('LabEngine (virtuelles Labor)', () => {
  let LabEngine;
  let equipmentCalls;

  /** Minimale THREE-Stubs — lab-engine nutzt nur Konstruktoren + set(). */
  function installThreeStub() {
    class Vec3 {
      constructor() {}
      set() {
        return this;
      }
    }
    class Light {
      constructor() {
        this.position = new Vec3();
        this.castShadow = false;
      }
    }
    global.THREE = {
      Scene: class {
        constructor() {
          this.background = null;
          this.children = [];
        }
        add(...items) {
          this.children.push(...items);
        }
      },
      Color: class {
        constructor(hex) {
          this.hex = hex;
        }
      },
      PerspectiveCamera: class {
        constructor() {
          this.position = new Vec3();
          this.aspect = 1;
        }
        updateProjectionMatrix() {}
      },
      WebGLRenderer: class {
        constructor() {
          this.domElement = global.document.createElement('canvas');
          this.shadowMap = { enabled: false, type: null };
        }
        setSize() {}
        setPixelRatio() {}
        render() {}
        setClearColor() {}
      },
      AmbientLight: Light,
      DirectionalLight: Light,
      Plane: class {
        constructor() {}
      },
      Vector3: Vec3,
      Group: class {
        constructor() {
          this.children = [];
        }
        add(...items) {
          this.children.push(...items);
        }
      },
      OrbitControls: class {
        constructor() {
          this.target = new Vec3();
        }
        update() {}
      },
      Raycaster: class {},
      GridHelper: class {
        constructor() {
          this.isGridHelper = true;
          this.position = new Vec3();
        }
      },
      PlaneGeometry: class {
        constructor() {}
      },
      MeshStandardMaterial: class {
        constructor() {}
      },
      Mesh: class {
        constructor() {
          this.isMesh = true;
          this.rotation = new Vec3();
        }
      },
      DoubleSide: 2,
    };
  }

  function installDom({ selectValue = 'titration', withSelect = true } = {}) {
    document.body.innerHTML = `
      <canvas id="lab-canvas"></canvas>
      ${withSelect ? `<select id="experiment-select"><option value="freestyle">Frei</option><option value="titration" selected>Titration</option></select>` : ''}
      <div id="observation-log"></div>
      <button id="run-btn"></button>
    `;
  }

  function installStubs() {
    equipmentCalls = { clear: 0, place: [] };
    global.EquipmentManager = {
      _setGroup: () => {},
      clear: () => {
        equipmentCalls.clear += 1;
      },
      place: (type, pos) => {
        equipmentCalls.place.push(type);
        return { type, pos };
      },
    };
    global.ReactionEngine = { run: () => {} };
    global.requestAnimationFrame = () => 1;
    global.cancelAnimationFrame = () => {};
    global.window.experiments = {
      freestyle: { name: 'Freier Aufbau', equipment: [] },
      titration: { name: 'Titration', equipment: ['beaker', 'burner'] },
    };
  }

  beforeEach(() => {
    vi.resetModules();
    installThreeStub();
    installStubs();
  });

  test('Dual-Export: init/loadExperiment/reset sind aus dem Modul erreichbar', () => {
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    expect(typeof LabEngine.init).toBe('function');
    expect(typeof LabEngine.loadExperiment).toBe('function');
    expect(typeof LabEngine.reset).toBe('function');
    expect(typeof LabEngine.runExperiment).toBe('function');
  });

  test('UXF-037: init() lädt das vorausgewählte Experiment automatisch', () => {
    installDom({ selectValue: 'titration' });
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    LabEngine.init('lab-canvas', 'loading-lab');
    // Vor dem Fix: place() wurde NIE gerufen → leere Szene (black plane)
    expect(LabEngine._currentExperimentId).toBe('titration');
    expect(equipmentCalls.place).toEqual(['beaker', 'burner']);
  });

  test('UXF-037: init() ohne Select fällt auf "freestyle" zurück', () => {
    installDom({ withSelect: false });
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    LabEngine.init('lab-canvas', 'loading-lab');
    expect(LabEngine._currentExperimentId).toBe('freestyle');
  });

  test('UXF-037: init() ohne Katalog crasht nicht und lädt nichts', () => {
    installDom();
    delete global.window.experiments;
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    expect(() => LabEngine.init('lab-canvas', 'loading-lab')).not.toThrow();
    // 'titration' existiert nicht im (gelöschten) Katalog → kein Place
    expect(equipmentCalls.place).toEqual([]);
  });

  test('UXF-038: reset() stellt das aktuelle Experiment wieder her', () => {
    installDom();
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    LabEngine.init('lab-canvas', 'loading-lab');
    const placedAfterInit = equipmentCalls.place.length;
    expect(placedAfterInit).toBeGreaterThan(0);
    LabEngine.reset();
    // Vor dem Fix: place bleibt nach reset bei 0 → Szene leer
    expect(equipmentCalls.place.length).toBeGreaterThan(placedAfterInit);
    expect(LabEngine._currentExperimentId).toBe('titration');
  });

  test('loadExperiment mit unbekannter ID: Warnung, kein Crash', () => {
    installDom();
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    LabEngine.init('lab-canvas', 'loading-lab');
    expect(() => LabEngine.loadExperiment('gibts-nicht')).not.toThrow();
    expect(LabEngine._currentExperimentId).toBe('gibts-nicht');
  });

  test('reset() ohne geladenes Experiment bleibt sicher', () => {
    installDom();
    delete global.window.experiments;
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    LabEngine.init('lab-canvas', 'loading-lab');
    expect(() => LabEngine.reset()).not.toThrow();
  });

  test('UXF-040: init() rendert einen sichtbaren Boden (kein Void)', () => {
    installDom({ selectValue: 'freestyle' });
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    LabEngine.init('lab-canvas', 'loading-lab');
    const children = LabEngine._scene.children;
    expect(children.some((c) => c && c.isGridHelper)).toBe(true);
    expect(children.some((c) => c && c.isMesh)).toBe(true);
  });

  test('UXF-040: init() schreibt einen Bedien-Hinweis ins Log', () => {
    installDom({ selectValue: 'freestyle' });
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    LabEngine.init('lab-canvas', 'loading-lab');
    const log = document.getElementById('observation-log');
    expect(log.children.length).toBeGreaterThan(0);
    const texts = [...log.children].map((c) => c.textContent || '');
    expect(texts.some((t) => t.includes('ziehe') || t.includes('Wähle'))).toBe(true);
  });

  test('UXF-041: Katalog als ARRAY (produktive experiments.js) wird aufgelöst', () => {
    installDom({ selectValue: 'titration' });
    global.window.experiments = [
      { id: 'freestyle', name: 'Freier Aufbau', equipment: [] },
      { id: 'titration', name: 'Titration', equipment: ['beaker', 'burner'] },
    ];
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    LabEngine.init('lab-canvas', 'loading-lab');
    // Vor dem Fix: window.experiments['titration'] === undefined → „nicht gefunden"
    expect(LabEngine._currentExperimentId).toBe('titration');
    expect(equipmentCalls.place).toEqual(['beaker', 'burner']);
  });

  test('UXF-041: loadExperiment findet Array-Eintrag auch nachträglich', () => {
    installDom({ selectValue: 'freestyle' });
    global.window.experiments = [{ id: 'freestyle', name: 'Frei', equipment: [] }];
    LabEngine = require('../myhugoapp/static/js/virtual-lab/lab-engine.js');
    LabEngine.init('lab-canvas', 'loading-lab');
    expect(() => LabEngine.loadExperiment('freestyle')).not.toThrow();
    expect(LabEngine._currentExperimentId).toBe('freestyle');
  });
});
