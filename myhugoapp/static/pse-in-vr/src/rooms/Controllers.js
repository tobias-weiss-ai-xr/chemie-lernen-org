import * as THREE from 'three';

var scene, doorMaterial, door, controllerModels = [];

const CONTROLLER_INFO = [
  {
    title: "6DOF Tracking",
    description: "Position (X,Y,Z) and Rotation (Pitch,Yaw,Roll) tracking",
    color: 0x4a90e2
  },
  {
    title: "Buttons & Triggers",
    description: "Trigger, Grip, A/B/X/Y buttons, Joystick, Menu",
    color: 0x50e3c2
  },
  {
    title: "Haptic Feedback",
    description: "Vibration pulses for tactile feedback",
    color: 0xf5a623
  },
  {
    title: "Ray Casting",
    description: "Laser pointer for distant object interaction",
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

function createInfoPanel(info, x, y, z) {
  const group = new THREE.Group();

  // Panel background
  const panelGeo = new THREE.BoxGeometry(2, 1.2, 0.1);
  const panelMat = new THREE.MeshBasicMaterial({color: 0x2a2a3a});
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(x, y, z);
  group.add(panel);

  // Title bar
  const titleGeo = new THREE.PlaneGeometry(1.9, 0.3);
  const titleMat = new THREE.MeshBasicMaterial({color: info.color});
  const title = new THREE.Mesh(titleGeo, titleMat);
  title.position.set(x, y + 0.4, z + 0.06);
  group.add(title);

  return group;
}

function createControllerDisplay(ctx, x, z) {
  const group = new THREE.Group();

  // Pedestal
  const pedestalGeo = new THREE.BoxGeometry(1.5, 0.8, 1.5);
  const pedestalMat = new THREE.MeshBasicMaterial({color: 0x1a1a2a});
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(x, 0.4, z);
  group.add(pedestal);

  // Rotating platform
  const platformGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.1, 32);
  const platformMat = new THREE.MeshBasicMaterial({color: 0x3a3a5a});
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.set(x, 0.85, z);
  group.add(platform);

  // Try to load controller model
  if (ctx.assets['generic_controller_model']) {
    const controller = ctx.assets['generic_controller_model'].scene.clone();
    controller.position.set(x, 1.2, z);
    controller.scale.set(2, 2, 2);
    controller.userData.rotating = true;
    group.add(controller);
    controllerModels.push(controller);
  } else {
    // Fallback: simple controller shape
    const controllerGeo = new THREE.BoxGeometry(0.15, 0.25, 0.08);
    const controllerMat = new THREE.MeshBasicMaterial({color: 0x4a90e2});
    const controller = new THREE.Mesh(controllerGeo, controllerMat);
    controller.position.set(x, 1.2, z);
    controller.userData.rotating = true;
    group.add(controller);
    controllerModels.push(controller);

    // Add trigger
    const triggerGeo = new THREE.BoxGeometry(0.03, 0.08, 0.03);
    const triggerMat = new THREE.MeshBasicMaterial({color: 0x2a2a2a});
    const trigger = new THREE.Mesh(triggerGeo, triggerMat);
    trigger.position.set(0, 0.05, 0.055);
    controller.add(trigger);
  }

  return group;
}

export function setup(ctx) {
  const assets = ctx.assets;
  scene = new THREE.Scene();

  // Room dimensions
  const roomSize = 10;

  // Floor
  const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
  const floorMat = new THREE.MeshBasicMaterial({color: 0x1a1a2e});
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Walls
  const wallMat = new THREE.MeshBasicMaterial({color: 0x2a3a4a});
  const wallHeight = 4;

  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMat);
  backWall.position.set(0, wallHeight/2, -roomSize/2);
  scene.add(backWall);

  // Side walls
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMat);
  leftWall.position.set(-roomSize/2, wallHeight/2, 0);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, wallHeight), wallMat);
  rightWall.position.set(roomSize/2, wallHeight/2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), new THREE.MeshBasicMaterial({color: 0x0a0a1e}));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallHeight;
  scene.add(ceiling);

  // Title banner
  const bannerGeo = new THREE.PlaneGeometry(6, 1);
  const bannerMat = new THREE.MeshBasicMaterial({color: 0x4a90e2});
  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.set(0, 3.5, -4.9);
  scene.add(banner);

  // Create controller displays along walls
  createControllerDisplay(ctx, -3, -2);
  createControllerDisplay(ctx, 3, -2);
  createControllerDisplay(ctx, -3, 2);
  createControllerDisplay(ctx, 3, 2);

  // Info panels
  CONTROLLER_INFO.forEach((info, index) => {
    const positions = [
      [-4, 1.5, -3],
      [4, 1.5, -3],
      [-4, 1.5, 3],
      [4, 1.5, 3]
    ];
    const panel = createInfoPanel(info, ...positions[index]);
    scene.add(panel);
  });

  // Center info display
  const centerDisplayGeo = new THREE.BoxGeometry(3, 2, 0.2);
  const centerDisplayMat = new THREE.MeshBasicMaterial({color: 0x2a2a3a});
  const centerDisplay = new THREE.Mesh(centerDisplayGeo, centerDisplayMat);
  centerDisplay.position.set(0, 1.5, 0);
  scene.add(centerDisplay);

  // Animated ring showing controller position tracking
  const ringGeo = new THREE.RingGeometry(0.5, 0.6, 32);
  const ringMat = new THREE.MeshBasicMaterial({color: 0x4a90e2, side: THREE.DoubleSide});
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 2.5, 0);
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  scene.userData.trackingRing = ring;

  // Door back to landing
  doorMaterial = createDoorMaterial(ctx);
  const doorGeo = new THREE.BoxGeometry(1.5, 2.5, 0.1);
  door = new THREE.Mesh(doorGeo, doorMaterial);
  door.position.set(0, 1.25, 4.9);
  scene.add(door);

  // Door frame
  const frameGeo = new THREE.BoxGeometry(1.7, 2.7, 0.08);
  const frameMat = new THREE.MeshBasicMaterial({color: 0x1a1a1a});
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 1.25, 5);
  scene.add(frame);

  // Teleport plane
  const teleportGeo = new THREE.PlaneBufferGeometry(roomSize, roomSize);
  const teleportMat = new THREE.MeshBasicMaterial({visible: false});
  const teleport = new THREE.Mesh(teleportGeo, teleportMat);
  teleport.rotation.x = -Math.PI / 2;
  teleport.position.y = 0.001;
  scene.add(teleport);

  // Add interaction states
  ctx.raycontrol.addState('controllersDoor', {
    colliderMesh: door,
    onHover: (intersection, active) => {
      door.scale.z = Math.min(door.scale.z + 0.05 * (2 - door.scale.z), 2);
    },
    onHoverLeave: () => {},
    onSelectStart: (intersection, e) => {
      ctx.goto = 0; // Back to landing
    },
    onSelectEnd: (intersection) => {}
  });

  ctx.raycontrol.addState('controllersTeleport', {
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
  ctx.raycontrol.activateState('controllersDoor');
  ctx.raycontrol.activateState('controllersTeleport');
}

export function exit(ctx) {
  ctx.raycontrol.deactivateState('controllersDoor');
  ctx.raycontrol.deactivateState('controllersTeleport');
  ctx.scene.remove(scene);
}

export function execute(ctx, delta, time) {
  doorMaterial.uniforms.time.value = time;

  // Rotate controller models
  controllerModels.forEach(controller => {
    controller.rotation.y += delta * 0.5;
  });

  // Animate tracking ring
  if (scene.userData.trackingRing) {
    const scale = 1 + Math.sin(time * 3) * 0.2;
    scene.userData.trackingRing.scale.set(scale, scale, 1);
    scene.userData.trackingRing.rotation.z += delta * 0.5;
  }

  if (door.scale.z > 1) {
    door.scale.z = Math.max(door.scale.z - delta * door.scale.z, 1);
  }
}
