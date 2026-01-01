/**
 * Tests for Visualization Tools
 * Tests chart manager, 3D visualizer, and periodic table
 */

// Setup DOM and mocks
const mockGetElementById = jest.fn();
const mockCreateElement = jest.fn((tag) => ({
  className: '',
  id: '',
  style: {},
  textContent: '',
  innerHTML: '',
  appendChild: () => {},
  removeChild: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  getBoundingClientRect: () => ({ width: 800, height: 600 }),
  getContext: () => ({
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillText: () => {},
    strokeText: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    setLineDash: () => {}
  }),
  setAttribute: () => {},
  getAttribute: () => null,
  dataset: {}
}));

const mockDocument = {
  createElement: mockCreateElement,
  getElementById: mockGetElementById,
  head: {
    appendChild: () => {}
  },
  body: {
    appendChild: () => {}
  }
};

global.document = mockDocument;

// Mock THREE
global.THREE = {
  Scene: class {
    constructor() {
      this.children = [];
    }
    background = null;
    add(child) { this.children.push(child); }
  },
  PerspectiveCamera: class {
    constructor() {}
    position = { x: 0, y: 0, z: 0 };
    aspect = 1;
    updateProjectionMatrix() {}
  },
  WebGLRenderer: class {
    constructor() { this.domElement = {}; }
    setSize() {}
    setPixelRatio() {}
    render() {}
  },
  AmbientLight: class {},
  DirectionalLight: class {
    constructor() { this.position = { x: 0, y: 0, z: 0 }; }
  },
  Group: class {
    constructor() { this.children = []; }
    add(child) { this.children.push(child); }
  },
  SphereGeometry: class {},
  CylinderGeometry: class {},
  MeshPhongMaterial: class {
    constructor(options) { this.color = options?.color || 0xffffff; }
    color = { setHex: () => {} };
  },
  MeshBasicMaterial: class {},
  Mesh: class {
    constructor() { this.userData = {}; }
    position = { x: 0, y: 0, z: 0 };
    castShadow = false;
    receiveShadow = false;
  },
  OrbitControls: class {
    constructor() {}
    enableDamping = false;
    dampingFactor = 0;
    autoRotate = false;
    autoRotateSpeed = 0;
    update() {}
  },
  SpriteMaterial: class {},
  Sprite: class {
    constructor() { this.scale = { x: 1, y: 1, z: 1 }; }
  },
  CanvasTexture: class {},
  Vector3: class {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    subVectors() { return this; }
    addVectors() { return this; }
    multiplyScalar(n) { return this; }
    length() { return 10; }
    normalize() { return this; }
    setFromUnitVectors() { return this; }
  },
  Quaternion: class {
    setFromUnitVectors() { return this; }
  }
};

// Mock fetch
global.fetch = jest.fn();

const ChartManager = require('../myhugoapp/static/js/visualization/chart-manager.js');
const Visualizer3D = require('../myhugoapp/static/js/visualization/3d-visualizer.js');
const PeriodicTableViz = require('../myhugoapp/static/js/visualization/periodic-table-viz.js');
const ReactionPathway = require('../myhugoapp/static/js/visualization/reaction-pathway.js');

describe('Chart Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetElementById.mockReset();
  });

  describe('Bar Chart', () => {
    test('creates bar chart with default options', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createBarChart({
        containerId: 'test-container',
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 }
        ]
      });

      expect(chart).toBeDefined();
    });

    test('creates horizontal bar chart', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createBarChart({
        containerId: 'test-container',
        data: [{ label: 'A', value: 10 }],
        horizontal: true
      });

      expect(chart).toBeDefined();
    });

    test('handles empty data', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createBarChart({
        containerId: 'test-container',
        data: []
      });

      expect(chart).toBeDefined();
    });

    test('returns null for missing container', () => {
      mockGetElementById.mockReturnValueOnce(null);

      const chart = ChartManager.createBarChart({
        containerId: 'nonexistent',
        data: [{ label: 'A', value: 10 }]
      });

      expect(chart).toBeNull();
    });

    test('truncates long labels', () => {
      const truncated = ChartManager.truncateText('Very Long Label Text', 10);
      expect(truncated).toBe('Very Long ...');
    });

    test('keeps short labels unchanged', () => {
      const text = ChartManager.truncateText('Short', 10);
      expect(text).toBe('Short');
    });
  });

  describe('Line Chart', () => {
    test('creates line chart with data points', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createLineChart({
        containerId: 'test-container',
        data: [
          { label: 'Jan', value: 10 },
          { label: 'Feb', value: 20 },
          { label: 'Mar', value: 15 }
        ]
      });

      expect(chart).toBeDefined();
    });

    test('creates smooth line chart', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createLineChart({
        containerId: 'test-container',
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 }
        ],
        smooth: true
      });

      expect(chart).toBeDefined();
    });

    test('handles single data point', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createLineChart({
        containerId: 'test-container',
        data: [{ label: 'A', value: 10 }]
      });

      expect(chart).toBeDefined();
    });
  });

  describe('Pie Chart', () => {
    test('creates pie chart with data', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createPieChart({
        containerId: 'test-container',
        data: [
          { label: 'A', value: 30 },
          { label: 'B', value: 70 }
        ]
      });

      expect(chart).toBeDefined();
    });

    test('creates pie chart without legend', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createPieChart({
        containerId: 'test-container',
        data: [{ label: 'A', value: 100 }],
        showLegend: false
      });

      expect(chart).toBeDefined();
    });
  });

  describe('Scatter Plot', () => {
    test('creates scatter plot with data', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createScatterPlot({
        containerId: 'test-container',
        data: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
          { x: 5, y: 6 }
        ]
      });

      expect(chart).toBeDefined();
    });

    test('creates scatter plot with trendline', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createScatterPlot({
        containerId: 'test-container',
        data: [
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 6 }
        ],
        showTrendline: true
      });

      expect(chart).toBeDefined();
    });

    test('handles single data point', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const chart = ChartManager.createScatterPlot({
        containerId: 'test-container',
        data: [{ x: 5, y: 10 }]
      });

      expect(chart).toBeDefined();
    });
  });

  describe('Color Schemes', () => {
    test('returns default color scheme', () => {
      const colors = ChartManager.getColorScheme('default');
      expect(colors).toHaveLength(6);
      expect(colors[0]).toBe('#4CAF50');
    });

    test('returns chemistry color scheme', () => {
      const colors = ChartManager.getColorScheme('chemistry');
      expect(colors).toHaveLength(6);
      expect(colors[0]).toBe('#E91E63');
    });

    test('returns thermal color scheme', () => {
      const colors = ChartManager.getColorScheme('thermal');
      expect(colors).toHaveLength(6);
      expect(colors[0]).toBe('#F44336');
    });

    test('returns default for unknown scheme', () => {
      const colors = ChartManager.getColorScheme('unknown');
      expect(colors).toEqual(ChartManager.getColorScheme('default'));
    });
  });
});

describe('3D Visualizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Molecule Viewer', () => {
    test('creates molecule viewer from formula', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600,
        removeChild: () => {},
        querySelector: () => null
      });

      const viewer = Visualizer3D.createMoleculeViewer({
        containerId: 'test-container',
        formula: 'H2O'
      });

      expect(viewer).toBeDefined();
      if (viewer) {
        expect(viewer.scene).toBeDefined();
        expect(viewer.camera).toBeDefined();
        expect(viewer.renderer).toBeDefined();
        expect(viewer.controls).toBeDefined();
      }
    });

    test('parses H2O molecule', () => {
      const molecule = Visualizer3D.parseMolecule('H2O');

      expect(molecule.atoms).toHaveLength(3);
      expect(molecule.atoms[0].symbol).toBe('H');
      expect(molecule.atoms[2].symbol).toBe('O');
    });

    test('parses complex molecule', () => {
      const molecule = Visualizer3D.parseMolecule('C6H12O6');

      expect(molecule.atoms).toHaveLength(24);
      expect(molecule.atoms.filter(a => a.symbol === 'C')).toHaveLength(6);
      expect(molecule.atoms.filter(a => a.symbol === 'H')).toHaveLength(12);
      expect(molecule.atoms.filter(a => a.symbol === 'O')).toHaveLength(6);
    });

    test('generates unique positions for atoms', () => {
      const positions = [];
      for (let i = 0; i < 10; i++) {
        positions.push(Visualizer3D.generatePosition(i));
      }

      const unique = positions.filter((pos, index, self) =>
        index === self.findIndex(p => p.x === pos.x && p.y === pos.y && p.z === pos.z)
      );

      expect(unique).toHaveLength(10);
    });

    test('calculates distance between positions', () => {
      const pos1 = { x: 0, y: 0, z: 0 };
      const pos2 = { x: 3, y: 4, z: 0 };

      const distance = Visualizer3D.distance(pos1, pos2);
      expect(distance).toBe(5);
    });

    test('generates bonds for close atoms', () => {
      const atoms = [
        { position: { x: 0, y: 0, z: 0 } },
        { position: { x: 2, y: 0, z: 0 } },
        { position: { x: 20, y: 0, z: 0 } }
      ];

      const bonds = Visualizer3D.generateBonds(atoms);

      expect(bonds.length).toBeGreaterThan(0);
      expect(bonds[0].from).toBe(0);
      expect(bonds[0].to).toBe(1);
    });
  });

  describe('Atom Properties', () => {
    test('returns CPK color for carbon', () => {
      const color = Visualizer3D.getAtomColor('C', 'cpk');
      expect(color).toBe(0x333333);
    });

    test('returns CPK color for oxygen', () => {
      const color = Visualizer3D.getAtomColor('O', 'cpk');
      expect(color).toBe(0xFF0D0D);
    });

    test('returns default color for unknown element', () => {
      const color = Visualizer3D.getAtomColor('Xx', 'cpk');
      expect(color).toBe(0xFF69B4);
    });

    test('returns atom radius for hydrogen', () => {
      const radius = Visualizer3D.getAtomRadius('H');
      expect(radius).toBe(1.2);
    });

    test('returns default radius for unknown element', () => {
      const radius = Visualizer3D.getAtomRadius('Xx');
      expect(radius).toBe(1.5);
    });
  });

  describe('Orbital Visualization', () => {
    test('creates s orbital', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const orbital = Visualizer3D.createOrbitalVisualization({
        containerId: 'test-container',
        orbitalType: 's'
      });

      expect(orbital).toBeDefined();
    });

    test('creates p orbital', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const orbital = Visualizer3D.createOrbitalVisualization({
        containerId: 'test-container',
        orbitalType: 'p'
      });

      expect(orbital).toBeDefined();
    });

    test('creates d orbital', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        clientWidth: 800,
        clientHeight: 600
      });

      const orbital = Visualizer3D.createOrbitalVisualization({
        containerId: 'test-container',
        orbitalType: 'd'
      });

      expect(orbital).toBeDefined();
    });
  });
});

describe('Periodic Table Visualizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    PeriodicTableViz.elementData = null;
  });

  describe('Initialization', () => {
    test('initializes with default element data', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await PeriodicTableViz.initElementData();

      expect(PeriodicTableViz.elementData).toBeDefined();
      expect(PeriodicTableViz.elementData.H).toBeDefined();
    });

    test('loads element data from JSON', async () => {
      const mockData = {
        H: { number: 1, name: 'Hydrogen', symbol: 'H', mass: 1.008, category: 'nonmetal' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      await PeriodicTableViz.initElementData();

      expect(PeriodicTableViz.elementData).toEqual(mockData);
    });
  });

  describe('Periodic Table Creation', () => {
    test('creates standard periodic table', async () => {
      await PeriodicTableViz.initElementData();

      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      });

      const table = await PeriodicTableViz.create({
        containerId: 'test-container',
        viewMode: 'standard'
      });

      expect(table).toBeDefined();
    });

    test('creates properties view', async () => {
      await PeriodicTableViz.initElementData();

      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      });

      const table = await PeriodicTableViz.create({
        containerId: 'test-container',
        viewMode: 'properties'
      });

      expect(table).toBeDefined();
    });

    test('returns null for missing container', async () => {
      await PeriodicTableViz.initElementData();

      mockGetElementById.mockReturnValueOnce(null);

      const table = await PeriodicTableViz.create({
        containerId: 'nonexistent'
      });

      expect(table).toBeNull();
    });
  });

  describe('Cell Content', () => {
    test('generates standard cell content', async () => {
      await PeriodicTableViz.initElementData();

      const data = PeriodicTableViz.elementData.H;
      const content = PeriodicTableViz.getCellContent(data, 'standard');

      expect(content).toContain('1');
      expect(content).toContain('H');
      expect(content).toContain('Wasserstoff');
    });

    test('generates properties cell content', async () => {
      await PeriodicTableViz.initElementData();

      const data = PeriodicTableViz.elementData.C;
      const content = PeriodicTableViz.getCellContent(data, 'properties');

      expect(content).toContain('12.01');
    });

    test('generates electronegativity content', async () => {
      await PeriodicTableViz.initElementData();

      const data = PeriodicTableViz.elementData.O;
      const content = PeriodicTableViz.getCellContent(data, 'electronegativity');

      expect(content).toContain('3.44');
    });
  });

  describe('Electronegativity', () => {
    test('returns electronegativity for known elements', () => {
      expect(PeriodicTableViz.getElectronegativity('H')).toBe(2.20);
      expect(PeriodicTableViz.getElectronegativity('O')).toBe(3.44);
      expect(PeriodicTableViz.getElectronegativity('F')).toBe(3.98);
    });

    test('returns null for noble gases', () => {
      expect(PeriodicTableViz.getElectronegativity('He')).toBeNull();
      expect(PeriodicTableViz.getElectronegativity('Ne')).toBeNull();
    });

    test('returns null for unknown elements', () => {
      expect(PeriodicTableViz.getElectronegativity('Xx')).toBeNull();
    });
  });

  describe('Category Names', () => {
    test('returns German category names', () => {
      expect(PeriodicTableViz.getCategoryName('alkali')).toBe('Alkalimetall');
      expect(PeriodicTableViz.getCategoryName('noble')).toBe('Edelgas');
      expect(PeriodicTableViz.getCategoryName('metal')).toBe('Metall');
    });

    test('returns original string for unknown category', () => {
      expect(PeriodicTableViz.getCategoryName('unknown')).toBe('unknown');
    });
  });
});

describe('Reaction Pathway Visualizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pathway Creation', () => {
    test('creates reaction pathway with default options', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      });

      const pathway = ReactionPathway.create({
        containerId: 'test-container',
        reaction: {
          reactants: ['A', 'B'],
          products: ['C'],
          steps: []
        }
      });

      expect(pathway).toBeDefined();
    });

    test('creates pathway without energy diagram', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      });

      const pathway = ReactionPathway.create({
        containerId: 'test-container',
        reaction: { steps: [] },
        showEnergy: false,
        showMechanism: true
      });

      expect(pathway).toBeDefined();
    });

    test('creates pathway without mechanism diagram', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      });

      const pathway = ReactionPathway.create({
        containerId: 'test-container',
        reaction: { steps: [] },
        showEnergy: true,
        showMechanism: false
      });

      expect(pathway).toBeDefined();
    });

    test('returns null for missing container', () => {
      mockGetElementById.mockReturnValueOnce(null);

      const pathway = ReactionPathway.create({
        containerId: 'nonexistent',
        reaction: { steps: [] }
      });

      expect(pathway).toBeNull();
    });
  });

  describe('Energy Profile Calculation', () => {
    test('calculates default energy profile', () => {
      const reaction = { steps: [] };
      const energies = ReactionPathway.calculateEnergyProfile(reaction);

      expect(energies).toHaveLength(3);
      expect(energies[0]).toBe(0); // Reactant
      expect(energies[1]).toBeGreaterThan(0); // TS
      expect(energies[2]).toBeLessThan(0); // Product
    });

    test('uses provided energy values', () => {
      const reaction = {
        steps: [
          { energy: 10 },
          { energy: 50 },
          { energy: -10 }
        ]
      };

      const energies = ReactionPathway.calculateEnergyProfile(reaction);

      expect(energies).toEqual([10, 50, -10]);
    });

    test('calculates profile with mixed step types', () => {
      const reaction = {
        steps: [
          { type: 'reactant' },
          { type: 'transition' },
          { type: 'intermediate' },
          { type: 'product' }
        ]
      };

      const energies = ReactionPathway.calculateEnergyProfile(reaction);

      expect(energies).toHaveLength(4);
      expect(energies[0]).toBe(0);
      expect(energies[1]).toBeGreaterThan(40);
    });
  });

  describe('Reaction Explorer', () => {
    test('creates reaction explorer', () => {
      const reactions = [
        { name: 'Reaction 1', steps: [] },
        { name: 'Reaction 2', steps: [] }
      ];

      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      });

      const explorer = ReactionPathway.createExplorer({
        containerId: 'test-container',
        reactions
      });

      expect(explorer).toBeDefined();
    });

    test('handles empty reaction list', () => {
      mockGetElementById.mockReturnValueOnce({
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      });

      const explorer = ReactionPathway.createExplorer({
        containerId: 'test-container',
        reactions: []
      });

      expect(explorer).toBeDefined();
    });
  });

  describe('Arrow Drawing', () => {
    test('draws horizontal arrow', () => {
      const ctx = {
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        closePath: () => {},
        fill: () => {}
      };

      ReactionPathway.drawArrow(ctx, 0, 0, 100, 0);

      // Should not throw
      expect(true).toBe(true);
    });

    test('draws vertical arrow', () => {
      const ctx = {
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        closePath: () => {},
        fill: () => {}
      };

      ReactionPathway.drawArrow(ctx, 0, 0, 0, 100);

      // Should not throw
      expect(true).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  test('all visualization managers are available', () => {
    expect(ChartManager).toBeDefined();
    expect(Visualizer3D).toBeDefined();
    expect(PeriodicTableViz).toBeDefined();
    expect(ReactionPathway).toBeDefined();
  });

  test('all managers have required methods', () => {
    expect(typeof ChartManager.createBarChart).toBe('function');
    expect(typeof ChartManager.createLineChart).toBe('function');
    expect(typeof ChartManager.createPieChart).toBe('function');
    expect(typeof ChartManager.createScatterPlot).toBe('function');

    expect(typeof Visualizer3D.createMoleculeViewer).toBe('function');
    expect(typeof Visualizer3D.createOrbitalVisualization).toBe('function');

    expect(typeof PeriodicTableViz.create).toBe('function');

    expect(typeof ReactionPathway.create).toBe('function');
    expect(typeof ReactionPathway.createExplorer).toBe('function');
  });
});
