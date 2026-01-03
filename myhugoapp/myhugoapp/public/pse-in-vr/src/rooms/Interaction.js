import * as THREE from 'three';

var scene, doorMaterial, door, interactiveCubes = [];

const INTERACTION_INFO = [
  {title: "Ray Casting", desc: "Laser pointer for distant selection", color: 0xff6b6b},
  {title: "Hover States", desc: "Visual feedback on look/hover", color: 0x4a90e2},
  {title: "Grab & Throw", desc: "Pick up and manipulate objects", color: 0x50e3c2},
  {title: "UI Interaction", desc: "Buttons, sliders, menus in VR", color: 0xf5a623}
];

function createDoorMaterial(ctx) {
  return new THREE.ShaderMaterial({
    uniforms: {time: {value: 0}, selected: {value: 0}, tex: {value: ctx.assets['doorfx_tex']}},
    vertexShader: ctx.shaders.basic_vert,
    fragmentShader: ctx.shaders.door_frag
  });
}

function createInteractiveCube(x, y, z, color) {
  const group = new THREE.Group();

  // Interactive cube
  const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const cubeMat = new THREE.MeshBasicMaterial({color: color, wireframe: true});
  const cube = new THREE.Mesh(cubeGeo, cubeMat);
  cube.position.set(x, y, z);
  cube.userData.hovered = false;
  group.add(cube);
  interactiveCubes.push(cube);

  // Target ring
  const ringGeo = new THREE.RingGeometry(0.4, 0.5, 32);
  const ringMat = new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide});
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.01, z);
  group.add(ring);

  // Pedestal
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, y, 8),
    new THREE.MeshBasicMaterial({color: 0x1a1a2a})
  );
  pedestal.position.set(x, y / 2, z);
  group.add(pedestal);

  return group;
}

function createLaserVisual() {
  const group = new THREE.Group();

  // Laser beam
  const laserGeo = new THREE.CylinderGeometry(0.005, 0.005, 3, 8);
  const laserMat = new THREE.MeshBasicMaterial({color: 0xff6b6b, transparent: true, opacity: 0.7});
  const laser = new THREE.Mesh(laserGeo, laserMat);
  laser.position.set(0, 1.5, 0);
  laser.rotation.x = Math.PI / 2;
  group.add(laser);

  // Controller
  const controller = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.12, 0.04),
    new THREE.MeshBasicMaterial({color: 0x4a90e2})
  );
  controller.position.set(0, 1.5, 0);
  group.add(controller);

  return group;
}

export function setup(ctx) {
  scene = new THREE.Scene();
  const roomSize = 10;

  // Floor
  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    new THREE.MeshBasicMaterial({color: 0x1a1a2e})
  ).rotateX(-Math.PI / 2));

  // Walls
  const wallMat = new THREE.MeshBasicMaterial({color: 0x2a3a4a});
  const wallHeight = 4;
  [[0, wallHeight/2, -roomSize/2, 0], [-roomSize/2, wallHeight/2, 0, Math.PI/2], [roomSize/2, wallHeight/2, 0, -Math.PI/2]].forEach(([x, y, z, rot]) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMat);
    wall.position.set(x, y, z);
    wall.rotation.y = rot;
    scene.add(wall);
  });

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), new THREE.MeshBasicMaterial({color: 0x0a0a1e}));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallHeight;
  scene.add(ceiling);

  // Create interactive cubes
  const positions = [[-3, 1.5, -3], [3, 1.5, -3], [-3, 1.5, 3], [3, 1.5, 3]];
  positions.forEach(([x, y, z], i) => {
    createInteractiveCube(x, y, z, INTERACTION_INFO[i].color);

    // Info panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.1), new THREE.MeshBasicMaterial({color: 0x2a2a3a}));
    panel.position.set(x, 2.8, z - 1.5);
    panel.lookAt(x, 2.8, z);
    scene.add(panel);

    const title = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.25), new THREE.MeshBasicMaterial({color: INTERACTION_INFO[i].color}));
    title.position.set(0, 0.3, 0.06);
    panel.add(title);
  });

  // Center laser demonstration
  const laserVisual = createLaserVisual();
  scene.add(laserVisual);
  scene.userData.laserVisual = laserVisual;

  // Door
  doorMaterial = createDoorMaterial(ctx);
  door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.1), doorMaterial);
  door.position.set(0, 1.25, 4.9);
  scene.add(door);

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.7, 0.08), new THREE.MeshBasicMaterial({color: 0x1a1a1a}));
  doorFrame.position.set(0, 1.25, 5);
  scene.add(doorFrame);

  // Teleport
  const teleport = new THREE.Mesh(new THREE.PlaneBufferGeometry(roomSize, roomSize), new THREE.MeshBasicMaterial({visible: false}));
  teleport.rotation.x = -Math.PI / 2;
  teleport.position.y = 0.001;
  scene.add(teleport);

  ctx.raycontrol.addState('interactionDoor', {
    colliderMesh: door,
    onHover: (intersection, active) => { door.scale.z = Math.min(door.scale.z + 0.05 * (2 - door.scale.z), 2); },
    onHoverLeave: () => {},
    onSelectStart: (intersection, e) => { ctx.goto = 0; },
    onSelectEnd: (intersection) => {}
  });

  ctx.raycontrol.addState('interactionTeleport', {
    colliderMesh: teleport,
    onHover: (intersection, active) => { ctx.teleport.onHover(intersection.point, active); },
    onHoverLeave: () => { ctx.teleport.onHoverLeave(); },
    onSelectStart: (intersection, e) => { ctx.teleport.onSelectStart(e); },
    onSelectEnd: (intersection) => { ctx.teleport.onSelectEnd(intersection.point); }
  });
}

export function enter(ctx) {
  ctx.renderer.setClearColor(0x0a0a1a);
  ctx.scene.add(scene);
  ctx.raycontrol.activateState('interactionDoor');
  ctx.raycontrol.activateState('interactionTeleport');
}

export function exit(ctx) {
  ctx.raycontrol.deactivateState('interactionDoor');
  ctx.raycontrol.deactivateState('interactionTeleport');
  ctx.scene.remove(scene);
}

export function execute(ctx, delta, time) {
  doorMaterial.uniforms.time.value = time;

  // Animate interactive cubes
  interactiveCubes.forEach((cube, i) => {
    cube.rotation.x += delta * 0.3;
    cube.rotation.y += delta * 0.5;

    // Simulate hover effect
    const hovered = Math.sin(time * 2 + i) > 0;
    if (hovered && !cube.userData.hovered) {
      cube.material.color.setHex(0xffffff);
      cube.userData.hovered = true;
    } else if (!hovered && cube.userData.hovered) {
      cube.material.color.setHex(INTERACTION_INFO[i].color);
      cube.userData.hovered = false;
    }
  });

  // Animate laser visual
  if (scene.userData.laserVisual) {
    scene.userData.laserVisual.rotation.y += delta * 0.5;
    const laser = scene.userData.laserVisual.children[0];
    laser.material.opacity = 0.5 + Math.sin(time * 5) * 0.3;
  }

  if (door.scale.z > 1) door.scale.z = Math.max(door.scale.z - delta * door.scale.z, 1);
}
