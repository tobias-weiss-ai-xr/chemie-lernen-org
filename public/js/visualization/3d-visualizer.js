/**
 * 3D Visualizer
 * Enhanced 3D molecular visualizations and animations
 */

const Visualizer3D = {
  scenes: new Map(),

  /**
   * Create an interactive 3D molecule viewer
   */
  createMoleculeViewer(options = {}) {
    const {
      containerId,
      formula = '',
      data = null,
      autoRotate = true,
      showLabels = true,
      showBonds = true,
      colorScheme = 'cpk'
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    // Clear previous scene
    if (this.scenes.has(containerId)) {
      const oldScene = this.scenes.get(containerId);
      if (oldScene.renderer) {
        container.removeChild(oldScene.renderer.domElement);
      }
    }

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-50, -50, -50);
    scene.add(backLight);

    // Parse formula or use provided data
    const moleculeData = data || this.parseMolecule(formula);

    // Create molecule
    const moleculeGroup = this.createMolecule(moleculeData, {
      showLabels,
      showBonds,
      colorScheme
    });
    scene.add(moleculeGroup);

    // Add controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;

    // Store scene
    this.scenes.set(containerId, {
      scene,
      camera,
      renderer,
      controls,
      moleculeGroup,
      autoRotate
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const sceneData = this.scenes.get(containerId);
      if (sceneData && sceneData.controls) {
        sceneData.controls.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
      const sceneData = this.scenes.get(containerId);
      if (sceneData) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        sceneData.camera.aspect = width / height;
        sceneData.camera.updateProjectionMatrix();
        sceneData.renderer.setSize(width, height);
      }
    });

    this.add3DStyles();

    return {
      scene,
      camera,
      renderer,
      controls,
      updateColorScheme: (scheme) => {
        this.updateMoleculeColors(containerId, scheme);
      },
      toggleRotation: () => {
        const sceneData = this.scenes.get(containerId);
        if (sceneData) {
          sceneData.controls.autoRotate = !sceneData.controls.autoRotate;
        }
      }
    };
  },

  /**
   * Parse molecule from formula
   */
  parseMolecule(formula) {
    // Simple parser for chemical formulas
    const elements = [];
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;

    while ((match = regex.exec(formula)) !== null) {
      const element = match[1];
      const count = parseInt(match[2]) || 1;

      for (let i = 0; i < count; i++) {
        elements.push({
          symbol: element,
          position: this.generatePosition(elements.length)
        });
      }
    }

    return {
      atoms: elements,
      bonds: this.generateBonds(elements)
    };
  },

  /**
   * Generate 3D position for atom
   */
  generatePosition(index) {
    // Simple spiral arrangement
    const angle = index * 0.5;
    const radius = 5 + index * 2;
    const height = index * 3;

    return {
      x: Math.cos(angle) * radius,
      y: height - 20,
      z: Math.sin(angle) * radius
    };
  },

  /**
   * Generate bonds between atoms
   */
  generateBonds(atoms) {
    const bonds = [];
    const maxDistance = 8;

    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dist = this.distance(atoms[i].position, atoms[j].position);

        if (dist < maxDistance) {
          bonds.push({
            from: i,
            to: j,
            order: 1
          });
        }
      }
    }

    return bonds;
  },

  /**
   * Calculate distance between two positions
   */
  distance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  /**
   * Create 3D molecule
   */
  createMolecule(data, options = {}) {
    const { showLabels = true, showBonds = true, colorScheme = 'cpk' } = options;
    const group = new THREE.Group();

    // Add bonds first
    if (showBonds && data.bonds) {
      data.bonds.forEach(bond => {
        const bondMesh = this.createBond(
          data.atoms[bond.from].position,
          data.atoms[bond.to].position,
          bond.order
        );
        group.add(bondMesh);
      });
    }

    // Add atoms
    data.atoms.forEach((atom, index) => {
      const atomMesh = this.createAtom(atom.symbol, colorScheme);
      atomMesh.position.set(
        atom.position.x,
        atom.position.y,
        atom.position.z
      );
      atomMesh.userData = { symbol: atom.symbol, index };
      group.add(atomMesh);

      // Add label
      if (showLabels) {
        const label = this.createAtomLabel(atom.symbol);
        label.position.set(
          atom.position.x,
          atom.position.y + 3,
          atom.position.z
        );
        group.add(label);
      }
    });

    return group;
  },

  /**
   * Create atom sphere
   */
  createAtom(symbol, colorScheme = 'cpk') {
    const color = this.getAtomColor(symbol, colorScheme);
    const radius = this.getAtomRadius(symbol);

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 100,
      specular: 0x444444
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  },

  /**
   * Create bond cylinder
   */
  createBond(pos1, pos2, order = 1) {
    const start = new THREE.Vector3(pos1.x, pos1.y, pos1.z);
    const end = new THREE.Vector3(pos2.x, pos2.y, pos2.z);

    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    const geometry = new THREE.CylinderGeometry(0.3, 0.3, length, 8);
    const material = new THREE.MeshPhongMaterial({
      color: 0x888888,
      shininess: 50
    });

    const cylinder = new THREE.Mesh(geometry, material);

    // Position and orient cylinder
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cylinder.position.copy(midpoint);
    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    return cylinder;
  },

  /**
   * Create atom label
   */
  createAtomLabel(symbol) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;

    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'bold 48px Arial';
    context.fillStyle = '#333';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(symbol, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 2, 1);

    return sprite;
  },

  /**
   * Get atom color by scheme
   */
  getAtomColor(symbol, scheme = 'cpk') {
    const colors = {
      cpk: {
        H: 0xFFFFFF, C: 0x333333, N: 0x3050F8, O: 0xFF0D0D,
        F: 0x90E050, Cl: 0x1FF01F, Br: 0xA62929, I: 0x940094,
        S: 0xFFFF30, P: 0xFF8000, Fe: 0xE06633, Na: 0xAB5CF2,
        Mg: 0x8AFF00, Ca: 0x3DFF00
      },
      jmol: {
        H: 0xFFFFFF, C: 0x909090, N: 0x3050F8, O: 0xFF0D0D,
        F: 0x90E050, Cl: 0x1FF01F, Br: 0xA62929, I: 0x940094
      },
      rasmol: {
        H: 0xFFFFFF, C: 0xAAAAAA, N: 0x0000FF, O: 0xFF0000,
        F: 0x00FF00, Cl: 0x00FF00, Br: 0xA52A2A, I: 0x800080
      }
    };

    return colors[scheme]?.[symbol] || 0xFF69B4;
  },

  /**
   * Get atom radius
   */
  getAtomRadius(symbol) {
    const radii = {
      H: 1.2, C: 1.7, N: 1.55, O: 1.52, F: 1.47,
      Cl: 1.75, Br: 1.85, I: 1.98, S: 1.8, P: 1.8,
      Fe: 1.8, Na: 2.27, Mg: 1.73, Ca: 2.0
    };

    return radii[symbol] || 1.5;
  },

  /**
   * Update molecule colors
   */
  updateMoleculeColors(containerId, colorScheme) {
    const sceneData = this.scenes.get(containerId);
    if (!sceneData) return;

    sceneData.moleculeGroup.children.forEach(child => {
      if (child.userData.symbol) {
        const newColor = this.getAtomColor(child.userData.symbol, colorScheme);
        child.material.color.setHex(newColor);
      }
    });
  },

  /**
   * Create orbital visualization
   */
  createOrbitalVisualization(options = {}) {
    const {
      containerId,
      orbitalType = 's',
      principal = 1,
      azimuthal = 0,
      magnetic = 0
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // Create orbital
    const orbitalGroup = this.createOrbital(orbitalType, principal, azimuthal, magnetic);
    scene.add(orbitalGroup);

    // Add nucleus
    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    scene.add(nucleus);

    // Add controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Animation
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);

      time += 0.01;
      orbitalGroup.rotation.y = time;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    this.add3DStyles();

    return { scene, camera, renderer, controls };
  },

  /**
   * Create orbital shape
   */
  createOrbital(type, n, l, m) {
    const group = new THREE.Group();

    const material = new THREE.MeshPhongMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    if (type === 's') {
      // Spherical orbital
      const geometry = new THREE.SphereGeometry(n * 3, 32, 32);
      const sphere = new THREE.Mesh(geometry, material);
      group.add(sphere);
    } else if (type === 'p') {
      // Dumbbell orbital
      const geometry = new THREE.SphereGeometry(n * 2, 32, 32);
      const lobe1 = new THREE.Mesh(geometry, material);
      lobe1.position.set(n * 3, 0, 0);
      group.add(lobe1);

      const lobe2 = new THREE.Mesh(geometry, material);
      lobe2.position.set(-n * 3, 0, 0);
      group.add(lobe2);
    } else if (type === 'd') {
      // Clover orbital
      const geometry = new THREE.SphereGeometry(n * 1.5, 32, 32);

      const positions = [
        [n * 3, 0, 0], [-n * 3, 0, 0],
        [0, n * 3, 0], [0, -n * 3, 0]
      ];

      positions.forEach(pos => {
        const lobe = new THREE.Mesh(geometry, material);
        lobe.position.set(...pos);
        group.add(lobe);
      });
    }

    return group;
  },

  /**
   * Add 3D visualizer styles
   */
  add3DStyles() {
    if (document.getElementById('visualizer-3d-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'visualizer-3d-styles';
    style.textContent = `
      .molecule-viewer {
        width: 100%;
        height: 500px;
        position: relative;
        background: #f5f5f5;
        border-radius: 8px;
        overflow: hidden;
      }

      .molecule-viewer canvas {
        width: 100% !important;
        height: 100% !important;
      }

      .molecule-controls {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 10;
      }

      .molecule-controls button {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
      }

      .molecule-controls button:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        .molecule-viewer {
          background: #2c2c2c;
        }

        .molecule-controls button {
          background: rgba(60, 60, 60, 0.9);
          border-color: #555;
          color: #fff;
        }
      }
    `;

    document.head.appendChild(style);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Visualizer3D;
}

// Expose to global scope
if (typeof window !== 'undefined') {
  window.Visualizer3D = Visualizer3D;
}
