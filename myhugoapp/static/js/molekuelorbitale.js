(function () {
  let scene, camera, renderer, controls;
  let moleculeGroup;
  let orbitalMeshes = [];
  let rotationEnabled = false;
  let currentMolecule = 'methane';
  let currentOrbitalType = 'sigma';
  let orbitalsVisible = false;

  const moleculeData = {
    methane: {
      formula: 'CH₄',
      structure: 'Tetraedrisch',
      hybrid: 'sp³',
      angle: 109.5,
      sigma: 4,
      pi: 0,
      bondOrder: 1,
      atoms: [
        { element: 'C', position: { x: 0, y: 0, z: 0 }, color: 0x333333 },
        { element: 'H', position: { x: 0, y: 1.2, z: 0 }, color: 0xffffff },
        { element: 'H', position: { x: 1.1, y: -0.4, z: 0 }, color: 0xffffff },
        { element: 'H', position: { x: -0.55, y: -0.4, z: 0.95 }, color: 0xffffff },
        { element: 'H', position: { x: -0.55, y: -0.4, z: -0.95 }, color: 0xffffff },
      ],
      bonds: [
        { from: 0, to: 1, order: 1, type: 'sigma' },
        { from: 0, to: 2, order: 1, type: 'sigma' },
        { from: 0, to: 3, order: 1, type: 'sigma' },
        { from: 0, to: 4, order: 1, type: 'sigma' },
      ],
    },
    ethene: {
      formula: 'C₂H₄',
      structure: 'Eben (trigonal planar)',
      hybrid: 'sp²',
      angle: 120,
      sigma: 6,
      pi: 1,
      bondOrder: 1,
      atoms: [
        { element: 'C', position: { x: -0.67, y: 0, z: 0 }, color: 0x333333 },
        { element: 'C', position: { x: 0.67, y: 0, z: 0 }, color: 0x333333 },
        { element: 'H', position: { x: -1.2, y: 1.0, z: 0 }, color: 0xffffff },
        { element: 'H', position: { x: -1.2, y: -1.0, z: 0 }, color: 0xffffff },
        { element: 'H', position: { x: 1.2, y: 1.0, z: 0 }, color: 0xffffff },
        { element: 'H', position: { x: 1.2, y: -1.0, z: 0 }, color: 0xffffff },
      ],
      bonds: [
        { from: 0, to: 1, order: 2, type: 'sigma/pi' },
        { from: 0, to: 2, order: 1, type: 'sigma' },
        { from: 0, to: 3, order: 1, type: 'sigma' },
        { from: 1, to: 4, order: 1, type: 'sigma' },
        { from: 1, to: 5, order: 1, type: 'sigma' },
      ],
    },
    acetylene: {
      formula: 'C₂H₂',
      structure: 'Linear',
      hybrid: 'sp',
      angle: 180,
      sigma: 4,
      pi: 2,
      bondOrder: 3,
      atoms: [
        { element: 'C', position: { x: -0.6, y: 0, z: 0 }, color: 0x333333 },
        { element: 'C', position: { x: 0.6, y: 0, z: 0 }, color: 0x333333 },
        { element: 'H', position: { x: -1.2, y: 0, z: 0 }, color: 0xffffff },
        { element: 'H', position: { x: 1.2, y: 0, z: 0 }, color: 0xffffff },
      ],
      bonds: [
        { from: 0, to: 1, order: 3, type: 'sigma/2pi' },
        { from: 0, to: 2, order: 1, type: 'sigma' },
        { from: 1, to: 3, order: 1, type: 'sigma' },
      ],
    },
    water: {
      formula: 'H₂O',
      structure: 'Angular (V-förmig)',
      hybrid: 'sp³',
      angle: 104.5,
      sigma: 2,
      pi: 0,
      bondOrder: 1,
      atoms: [
        { element: 'O', position: { x: 0, y: 0, z: 0 }, color: 0xff0000 },
        { element: 'H', position: { x: 0.94, y: 0.31, z: 0 }, color: 0xffffff },
        { element: 'H', position: { x: -0.94, y: 0.31, z: 0 }, color: 0xffffff },
      ],
      bonds: [
        { from: 0, to: 1, order: 1, type: 'sigma' },
        { from: 0, to: 2, order: 1, type: 'sigma' },
      ],
    },
  };

  function init() {
    const container = document.getElementById('three-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(3, 2, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);

    loadMolecule('methane');

    // Responsive: use ResizeObserver instead of just window resize
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(function () {
        onWindowResize();
      });
      ro.observe(container);
    } else {
      window.addEventListener('resize', onWindowResize, false);
    }

    animate();
  }

  function loadMolecule(moleculeKey) {
    clearMolecule();

    const mol = moleculeData[moleculeKey];
    currentMolecule = moleculeKey;

    mol.atoms.forEach((atom) => {
      const geometry = new THREE.SphereGeometry(0.3, 64, 64);
      const material = new THREE.MeshPhongMaterial({
        color: atom.color,
        shininess: 100,
        transparent: true,
        opacity: 0.9,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(atom.position.x, atom.position.y, atom.position.z);
      moleculeGroup.add(sphere);
      atoms.push(sphere);
    });

    mol.bonds.forEach((bond) => {
      const fromAtom = mol.atoms[bond.from];
      const toAtom = mol.atoms[bond.to];

      const direction = new THREE.Vector3(
        toAtom.position.x - fromAtom.position.x,
        toAtom.position.y - fromAtom.position.y,
        toAtom.position.z - fromAtom.position.z
      );

      const bondGeometry = new THREE.CylinderGeometry(0.1, 0.1, direction.length(), 32, 1);
      const bondMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        shininess: 100,
      });
      const bondMesh = new THREE.Mesh(bondGeometry, bondMaterial);
      bondMesh.position.copy(fromAtom.position);
      bondMesh.position.add(direction.clone().multiplyScalar(0.5));
      bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      moleculeGroup.add(bondMesh);
      bonds.push(bondMesh);

      if (bond.order === 1) {
        if (currentOrbitalType === 'sigma' || currentOrbitalType === 'bonding') {
          createSigmaOrbital(fromAtom.position, toAtom.position, mol.formula);
        }
      }

      if (bond.order === 2) {
        if (currentOrbitalType === 'sigma' || currentOrbitalType === 'bonding') {
          createSigmaOrbital(fromAtom.position, toAtom.position, mol.formula);
        }
        if (currentOrbitalType === 'pi' || currentOrbitalType === 'bonding') {
          createPiOrbital(fromAtom.position, toAtom.position, mol.formula, 'pi1');
        }
      }

      if (bond.order === 3) {
        if (currentOrbitalType === 'sigma' || currentOrbitalType === 'bonding') {
          createSigmaOrbital(fromAtom.position, toAtom.position, mol.formula);
        }
        if (currentOrbitalType === 'pi' || currentOrbitalType === 'bonding') {
          createPiOrbital(fromAtom.position, toAtom.position, mol.formula, 'pi1');
          createPiOrbital(fromAtom.position, toAtom.position, mol.formula, 'pi2');
        }
      }
    });

    updateMoleculeInfo(mol);

    if (rotationEnabled) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.0;
    }
  }

  function createSigmaOrbital(from, to, _formula) {
    const midPoint = new THREE.Vector3(
      (from.x + to.x) / 2,
      (from.y + to.y) / 2,
      (from.z + to.z) / 2
    );

    const direction = new THREE.Vector3(to.x - from.x, to.y - from.y, to.z - from.z).normalize();

    const sigmaGeometry = new THREE.TorusGeometry(0.2, 0.06, 16, 64);

    const sigmaMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x004400,
      transparent: true,
      opacity: orbitalsVisible ? 0.6 : 0,
    });

    const sigmaMesh = new THREE.Mesh(sigmaGeometry, sigmaMaterial);
    sigmaMesh.position.copy(midPoint);

    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, direction);
    sigmaMesh.quaternion.copy(quaternion);

    moleculeGroup.add(sigmaMesh);
    orbitalMeshes.push(sigmaMesh);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00ff00 })
    );
    dot.position.copy(midPoint);
    moleculeGroup.add(dot);
    orbitalMeshes.push(dot);
  }

  function createPiOrbital(from, to, formula, piType) {
    const midPoint = new THREE.Vector3(
      (from.x + to.x) / 2,
      (from.y + to.y) / 2,
      (from.z + to.z) / 2
    );

    const direction = new THREE.Vector3(to.x - from.x, to.y - from.y, to.z - from.z).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    const piGeometry = new THREE.TorusGeometry(0.3, 0.04, 16, 64);

    const piMaterial1 = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0x440044,
      transparent: true,
      opacity: orbitalsVisible ? 0.5 : 0,
      side: THREE.DoubleSide,
    });
    const piMaterial2 = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x004444,
      transparent: true,
      opacity: orbitalsVisible ? 0.5 : 0,
      side: THREE.DoubleSide,
    });

    const piMesh1 = new THREE.Mesh(piGeometry, piMaterial1);
    piMesh1.position.copy(midPoint);
    piMesh1.rotation.set(0, 0, piType === 'pi1' ? 0 : Math.PI / 2);

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, direction);
    piMesh1.quaternion.copy(quaternion);

    moleculeGroup.add(piMesh1);
    orbitalMeshes.push(piMesh1);

    const piMesh2 = new THREE.Mesh(piGeometry, piMaterial2);
    const right = new THREE.Vector3().crossVectors(direction, up).normalize();
    const quaternion2 = new THREE.Quaternion();
    quaternion2.setFromUnitVectors(up, right);
    piMesh2.quaternion.copy(quaternion2);
    piMesh2.position.copy(midPoint);

    moleculeGroup.add(piMesh2);
    orbitalMeshes.push(piMesh2);
  }

  function clearMolecule() {
    while (moleculeGroup.children.length > 0) {
      moleculeGroup.remove(moleculeGroup.children[0]);
    }

    atoms = [];
    bonds = [];
    orbitalMeshes = [];
  }

  function updateMoleculeInfo(mol) {
    document.getElementById('mol-formula').textContent = mol.formula;
    document.getElementById('mol-structure').textContent = mol.structure;
    document.getElementById('mol-hybrid').textContent = mol.hybrid;
    document.getElementById('mol-angle').textContent = mol.angle + '°';
    document.getElementById('mol-sigma').textContent = mol.sigma;
    document.getElementById('mol-pi').textContent = mol.pi;
    document.getElementById('mol-bond-order').textContent = mol.bondOrder;
  }

  function onWindowResize() {
    const container = document.getElementById('three-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  }

  function animate() {
    requestAnimationFrame(animate);

    controls.update();

    if (rotationEnabled) {
      moleculeGroup.rotation.y += 0.002;
    }

    renderer.render(scene, camera);
  }

  window.changeMolecule = function () {
    currentMolecule = document.getElementById('molecule-selector').value;
    loadMolecule(currentMolecule);
  };

  window.changeOrbitalType = function () {
    currentOrbitalType = document.getElementById('orbital-type').value;
    loadMolecule(currentMolecule);
  };

  window.changeViewAngle = function () {
    const angle = document.getElementById('view-angle').value;

    switch (angle) {
      case 'default':
        camera.position.set(3, 2, 5);
        break;
      case 'top':
        camera.position.set(0, 6, 0.1);
        break;
      case 'side':
        camera.position.set(6, 0, 0);
        break;
      case 'end':
        camera.position.set(0, 0.1, 6);
        break;
    }

    camera.lookAt(0, 0, 0);
  };

  window.toggleRotation = function () {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !rotationEnabled) {
      const btn = document.getElementById('rotation-therapy');
      if (btn) {
        btn.innerHTML = '<i class="fa fa-sync"></i> Rotation deaktiviert (Reduced Motion)';
      }
      return;
    }
    rotationEnabled = !rotationEnabled;
    controls.autoRotate = rotationEnabled;

    const btn = document.getElementById('rotation-therapy');
    btn.classList.toggle('active');

    if (rotationEnabled) {
      btn.innerHTML = '<i class="fa fa-sync"></i> Rotation stoppen';
    } else {
      btn.innerHTML = '<i class="fa fa-sync"></i> Rotation aktivieren';
    }
  };

  window.showOrbitals = function () {
    orbitalsVisible = !orbitalsVisible;

    orbitalMeshes.forEach((mesh) => {
      mesh.material.opacity = orbitalsVisible
        ? mesh.material.emissive.getHex() === 0x004400
          ? 0.6
          : 0.5
        : 0;
    });
  };

  window.showBondOrder = function () {
    const mol = moleculeData[currentMolecule];
    showToast(
      `Bindungsordnung: ${mol.bondOrder}\nσ-Bindungen: ${mol.sigma}\nπ-Bindungen: ${mol.pi}`,
      'info'
    );
  };

  window.resetView = function () {
    camera.position.set(3, 2, 5);
    camera.lookAt(0, 0, 0);
    controls.reset();
    moleculeGroup.rotation.set(0, 0, 0);

    if (orbitalsVisible) {
      orbitalsVisible = false;
      orbitalMeshes.forEach((mesh) => {
        mesh.material.opacity = 0;
      });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    init();
  });
})();
