import * as THREE from 'three';

var scene, doorMaterial, door, modelPedestals = [];

const MODEL_INFO = [
  {title: "glTF Format", desc: "Standard runtime format for WebXR", color: 0xf5a623},
  {title: "DRACO Compression", desc: "Geometry compression for smaller files", color: 0x4a90e2},
  {title: "Materials & Textures", desc: "PBR materials for realistic rendering", color: 0x50e3c2},
  {title: "Animations", desc: "Skeletal and vertex animations", color: 0xe056fd}
];

function createDoorMaterial(ctx) {
  return new THREE.ShaderMaterial({
    uniforms: {time: {value: 0}, selected: {value: 0}, tex: {value: ctx.assets['doorfx_tex']}},
    vertexShader: ctx.shaders.basic_vert,
    fragmentShader: ctx.shaders.door_frag
  });
}

function createPedestal(x, z, color) {
  const group = new THREE.Group();

  // Base
  const baseGeo = new THREE.BoxGeometry(1.5, 0.1, 1.5);
  const baseMat = new THREE.MeshBasicMaterial({color: 0x1a1a2a});
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(x, 0.05, z);
  group.add(base);

  // Column
  const columnGeo = new THREE.BoxGeometry(0.8, 1, 0.8);
  const columnMat = new THREE.MeshBasicMaterial({color: 0x2a2a3a});
  const column = new THREE.Mesh(columnGeo, columnMat);
  column.position.set(x, 0.6, z);
  group.add(column);

  // Top platform
  const topGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.1, 16);
  const topMat = new THREE.MeshBasicMaterial({color: color});
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.set(x, 1.15, z);
  group.add(top);

  // Rotating model placeholder (cube)
  const cubeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const cubeMat = new THREE.MeshBasicMaterial({color: color, wireframe: true});
  const cube = new THREE.Mesh(cubeGeo, cubeMat);
  cube.position.set(x, 1.5, z);
  cube.userData.rotating = true;
  group.add(cube);
  modelPedestals.push(cube);

  return group;
}

function createInfoPanel(info, x, y, z, lookAt) {
  const group = new THREE.Group();

  const panelGeo = new THREE.BoxGeometry(2, 1.2, 0.1);
  const panelMat = new THREE.MeshBasicMaterial({color: 0x2a2a3a});
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(x, y, z);
  panel.lookAt(lookAt);
  group.add(panel);

  const titleGeo = new THREE.PlaneGeometry(1.8, 0.3);
  const titleMat = new THREE.MeshBasicMaterial({color: info.color});
  const title = new THREE.Mesh(titleGeo, titleMat);
  title.position.set(0, 0.3, 0.06);
  panel.add(title);

  return group;
}

export function setup(ctx) {
  scene = new THREE.Scene();
  const roomSize = 10;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    new THREE.MeshBasicMaterial({color: 0x1a1a2e})
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

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
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    new THREE.MeshBasicMaterial({color: 0x0a0a1e})
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallHeight;
  scene.add(ceiling);

  // Create model display pedestals
  const positions = [[-3, -3], [3, -3], [-3, 3], [3, 3]];
  positions.forEach(([x, z], i) => {
    createPedestal(x, z, MODEL_INFO[i].color);
    const panel = createInfoPanel(MODEL_INFO[i], x, 2.5, z - 2.5, {x, y: 2.5, z: z});
    scene.add(panel);
  });

  // Door
  doorMaterial = createDoorMaterial(ctx);
  door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.1), doorMaterial);
  door.position.set(0, 1.25, 4.9);
  scene.add(door);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.7, 0.08), new THREE.MeshBasicMaterial({color: 0x1a1a1a}));
  frame.position.set(0, 1.25, 5);
  scene.add(frame);

  // Teleport
  const teleport = new THREE.Mesh(new THREE.PlaneBufferGeometry(roomSize, roomSize), new THREE.MeshBasicMaterial({visible: false}));
  teleport.rotation.x = -Math.PI / 2;
  teleport.position.y = 0.001;
  scene.add(teleport);

  // Interaction
  ctx.raycontrol.addState('modelsDoor', {
    colliderMesh: door,
    onHover: (intersection, active) => { door.scale.z = Math.min(door.scale.z + 0.05 * (2 - door.scale.z), 2); },
    onHoverLeave: () => {},
    onSelectStart: (intersection, e) => { ctx.goto = 0; },
    onSelectEnd: (intersection) => {}
  });

  ctx.raycontrol.addState('modelsTeleport', {
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
  ctx.raycontrol.activateState('modelsDoor');
  ctx.raycontrol.activateState('modelsTeleport');
}

export function exit(ctx) {
  ctx.raycontrol.deactivateState('modelsDoor');
  ctx.raycontrol.deactivateState('modelsTeleport');
  ctx.scene.remove(scene);
}

export function execute(ctx, delta, time) {
  doorMaterial.uniforms.time.value = time;
  modelPedestals.forEach(cube => { cube.rotation.x += delta * 0.5; cube.rotation.y += delta * 0.3; });
  if (door.scale.z > 1) door.scale.z = Math.max(door.scale.z - delta * door.scale.z, 1);
}
