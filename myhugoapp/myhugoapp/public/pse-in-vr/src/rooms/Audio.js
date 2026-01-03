import * as THREE from 'three';

var scene, doorMaterial, door, audioSpheres = [];

const AUDIO_INFO = [
  {title: "Positional Audio", desc: "Sound sources have 3D positions", color: 0xe056fd},
  {title: "Distance Decay", desc: "Volume decreases with distance", color: 0x4a90e2},
  {title: "Spatial Effects", desc: "HRTF for realistic 3D sound", color: 0x50e3c2},
  {title: "Multiple Sources", desc: "Many sounds can play simultaneously", color: 0xf5a623}
];

function createDoorMaterial(ctx) {
  return new THREE.ShaderMaterial({
    uniforms: {time: {value: 0}, selected: {value: 0}, tex: {value: ctx.assets['doorfx_tex']}},
    vertexShader: ctx.shaders.basic_vert,
    fragmentShader: ctx.shaders.door_frag
  });
}

function createAudioSphere(x, y, z, color) {
  const group = new THREE.Group();

  // Sound source sphere
  const sphereGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const sphereMat = new THREE.MeshBasicMaterial({color: color, transparent: true, opacity: 0.7});
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.set(x, y, z);
  group.add(sphere);

  // Pulsing ring
  const ringGeo = new THREE.RingGeometry(0.4, 0.5, 32);
  const ringMat = new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.5});
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(x, y, z);
  ring.lookAt(x, y + 1, z);
  group.add(ring);

  group.userData.animOffset = Math.random() * Math.PI * 2;
  audioSpheres.push({sphere, ring, offset: group.userData.animOffset});

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

  // Create audio spheres
  const positions = [[-3, 1.5, -3], [3, 1.5, -3], [-3, 1.5, 3], [3, 1.5, 3]];
  positions.forEach(([x, y, z], i) => {
    createAudioSphere(x, y, z, AUDIO_INFO[i].color);

    // Info panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.1), new THREE.MeshBasicMaterial({color: 0x2a2a3a}));
    panel.position.set(x, 2.5, z);
    scene.add(panel);

    const title = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.25), new THREE.MeshBasicMaterial({color: AUDIO_INFO[i].color}));
    title.position.set(0, 0.3, 0.06);
    panel.add(title);
  });

  // Center visualization of sound waves
  const waveGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const wave = new THREE.Mesh(
      new THREE.RingGeometry(0.5 + i * 0.3, 0.6 + i * 0.3, 32),
      new THREE.MeshBasicMaterial({color: 0xe056fd, side: THREE.DoubleSide, transparent: true, opacity: 0.3 - i * 0.05})
    );
    wave.rotation.x = -Math.PI / 2;
    waveGroup.add(wave);
  }
  waveGroup.position.set(0, 0.1, 0);
  scene.add(waveGroup);
  scene.userData.waves = waveGroup;

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

  ctx.raycontrol.addState('audioDoor', {
    colliderMesh: door,
    onHover: (intersection, active) => { door.scale.z = Math.min(door.scale.z + 0.05 * (2 - door.scale.z), 2); },
    onHoverLeave: () => {},
    onSelectStart: (intersection, e) => { ctx.goto = 0; },
    onSelectEnd: (intersection) => {}
  });

  ctx.raycontrol.addState('audioTeleport', {
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
  ctx.raycontrol.activateState('audioDoor');
  ctx.raycontrol.activateState('audioTeleport');
}

export function exit(ctx) {
  ctx.raycontrol.deactivateState('audioDoor');
  ctx.raycontrol.deactivateState('audioTeleport');
  ctx.scene.remove(scene);
}

export function execute(ctx, delta, time) {
  doorMaterial.uniforms.time.value = time;

  // Animate audio spheres
  audioSpheres.forEach(({sphere, ring, offset}) => {
    const scale = 1 + Math.sin(time * 3 + offset) * 0.2;
    sphere.scale.set(scale, scale, scale);
    const ringScale = 1 + Math.sin(time * 2 + offset) * 0.3;
    ring.scale.set(ringScale, ringScale, 1);
  });

  // Animate center waves
  if (scene.userData.waves) {
    scene.userData.waves.children.forEach((wave, i) => {
      wave.scale.set(1 + Math.sin(time * 2 - i * 0.5) * 0.5, 1 + Math.sin(time * 2 - i * 0.5) * 0.5, 1);
    });
  }

  if (door.scale.z > 1) door.scale.z = Math.max(door.scale.z - delta * door.scale.z, 1);
}
