import * as THREE from 'three';

var scene, doorMaterial, door, teleportRings = [];

const TELEPORT_INFO = [
  {
    title: "Ray Casting",
    description: "Cast invisible ray from controller to find destination",
    color: 0x50e3c2
  },
  {
    title: "Point & Click",
    description: "Simple point-to-teleport interaction model",
    color: 0x4a90e2
  },
  {
    title: "Valid Targets",
    description: "Only teleport to walkable surfaces (floors, ground)",
    color: 0xf5a623
  },
  {
    title: "Smooth Transition",
    description: "Fade effect and camera movement for comfort",
    color: 0xe056fd
  }
];

function createDoorMaterial(ctx) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: {value: 0},
      selected: {value: 0},
      tex: {value: ctx.assets['doorfx_tex']}
    },
    vertexShader: ctx.shaders.basic_vert,
    fragmentShader: ctx.shaders.door_frag
  });
}

function createTeleportRing(x, z, color) {
  const group = new THREE.Group();

  // Outer ring
  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1, 32),
    new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide})
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.01;
  group.add(outerRing);

  // Inner ring
  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.5, 32),
    new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide})
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.02;
  group.add(innerRing);

  // Center marker
  const marker = new THREE.Mesh(
    new THREE.CircleGeometry(0.1, 16),
    new THREE.MeshBasicMaterial({color: color})
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.03;
  group.add(marker);

  group.position.set(x, 0, z);
  group.userData.animOffset = Math.random() * Math.PI * 2;

  return group;
}

function createInfoPanel(info, x, y, z) {
  const panelGeo = new THREE.BoxGeometry(2.5, 1.5, 0.1);
  const panelMat = new THREE.MeshBasicMaterial({color: 0x2a2a3a});
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(x, y, z);

  // Title bar
  const titleGeo = new THREE.PlaneGeometry(2.3, 0.4);
  const titleMat = new THREE.MeshBasicMaterial({color: info.color});
  const title = new THREE.Mesh(titleGeo, titleMat);
  title.position.set(0, 0.5, 0.06);
  panel.add(title);

  return panel;
}

export function setup(ctx) {
  scene = new THREE.Scene();

  const roomSize = 10;

  // Floor with teleport target areas
  const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
  const floorMat = new THREE.MeshBasicMaterial({color: 0x1a1a2e});
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Walls
  const wallMat = new THREE.MeshBasicMaterial({color: 0x2a3a4a});
  const wallHeight = 4;

  const walls = [
    {pos: [0, wallHeight/2, -roomSize/2], rot: [0, 0, 0]},
    {pos: [-roomSize/2, wallHeight/2, 0], rot: [0, Math.PI/2, 0]},
    {pos: [roomSize/2, wallHeight/2, 0], rot: [0, -Math.PI/2, 0]},
  ];

  walls.forEach(wall => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMat);
    mesh.position.set(...wall.pos);
    mesh.rotation.set(...wall.rot);
    scene.add(mesh);
  });

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), new THREE.MeshBasicMaterial({color: 0x0a0a1e}));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallHeight;
  scene.add(ceiling);

  // Create teleport demonstration rings
  const ringPositions = [
    {x: -3, z: -3, color: 0x50e3c2},
    {x: 3, z: -3, color: 0x4a90e2},
    {x: -3, z: 3, color: 0xf5a623},
    {x: 3, z: 3, color: 0xe056fd}
  ];

  ringPositions.forEach(pos => {
    const ring = createTeleportRing(pos.x, pos.z, pos.color);
    scene.add(ring);
    teleportRings.push(ring);

    // Info panel above each ring
    const info = TELEPORT_INFO[teleportRings.length - 1];
    const panel = createInfoPanel(info, pos.x, 2, pos.z - 1.5);
    scene.add(panel);
  });

  // Center demonstration area with laser visualization
  const laserGeo = new THREE.CylinderGeometry(0.01, 0.01, 4, 8);
  const laserMat = new THREE.MeshBasicMaterial({color: 0x50e3c2, transparent: true, opacity: 0.5});
  const laser = new THREE.Mesh(laserGeo, laserMat);
  laser.position.set(0, 2, 0);
  laser.rotation.x = Math.PI / 4;
  scene.add(laser);
  scene.userData.laser = laser;

  // Laser origin (controller)
  const controllerGeo = new THREE.BoxGeometry(0.1, 0.15, 0.05);
  const controllerMat = new THREE.MeshBasicMaterial({color: 0x4a90e2});
  const controller = new THREE.Mesh(controllerGeo, controllerMat);
  controller.position.set(0, 3, 0);
  scene.add(controller);
  scene.userData.controller = controller;

  // Door
  doorMaterial = createDoorMaterial(ctx);
  const doorGeo = new THREE.BoxGeometry(1.5, 2.5, 0.1);
  door = new THREE.Mesh(doorGeo, doorMaterial);
  door.position.set(0, 1.25, 4.9);
  scene.add(door);

  const frameGeo = new THREE.BoxGeometry(1.7, 2.7, 0.08);
  const frameMat = new THREE.MeshBasicMaterial({color: 0x1a1a1a});
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 1.25, 5);
  scene.add(frame);

  // Teleport floor
  const teleportGeo = new THREE.PlaneBufferGeometry(roomSize, roomSize);
  const teleportMat = new THREE.MeshBasicMaterial({visible: false});
  const teleport = new THREE.Mesh(teleportGeo, teleportMat);
  teleport.rotation.x = -Math.PI / 2;
  teleport.position.y = 0.001;
  scene.add(teleport);

  // Interaction states
  ctx.raycontrol.addState('teleportDoor', {
    colliderMesh: door,
    onHover: (intersection, active) => {
      door.scale.z = Math.min(door.scale.z + 0.05 * (2 - door.scale.z), 2);
    },
    onHoverLeave: () => {},
    onSelectStart: (intersection, e) => {
      ctx.goto = 0;
    },
    onSelectEnd: (intersection) => {}
  });

  ctx.raycontrol.addState('teleportRoomTeleport', {
    colliderMesh: teleport,
    onHover: (intersection, active) => {
      ctx.teleport.onHover(intersection.point, active);
    },
    onHoverLeave: () => {
      ctx.teleport.onHoverLeave();
    },
    onSelectStart: (intersection, e) => {
      ctx.teleport.onSelectStart(e);
    },
    onSelectEnd: (intersection) => {
      ctx.teleport.onSelectEnd(intersection.point);
    }
  });
}

export function enter(ctx) {
  ctx.renderer.setClearColor(0x0a0a1a);
  ctx.scene.add(scene);
  ctx.raycontrol.activateState('teleportDoor');
  ctx.raycontrol.activateState('teleportRoomTeleport');
}

export function exit(ctx) {
  ctx.raycontrol.deactivateState('teleportDoor');
  ctx.raycontrol.deactivateState('teleportRoomTeleport');
  ctx.scene.remove(scene);
}

export function execute(ctx, delta, time) {
  doorMaterial.uniforms.time.value = time;

  // Animate teleport rings
  teleportRings.forEach(ring => {
    const scale = 1 + Math.sin(time * 3 + ring.userData.animOffset) * 0.1;
    ring.children[0].scale.set(scale, scale, 1);
    ring.children[1].scale.set(scale * 0.8, scale * 0.8, 1);
  });

  // Animate laser
  if (scene.userData.laser && scene.userData.controller) {
    scene.userData.controller.rotation.y += delta * 0.3;
    scene.userData.laser.rotation.y = scene.userData.controller.rotation.y;
    scene.userData.laser.rotation.x = Math.PI / 4 + Math.sin(time * 2) * 0.3;
  }

  if (door.scale.z > 1) {
    door.scale.z = Math.max(door.scale.z - delta * door.scale.z, 1);
  }
}
