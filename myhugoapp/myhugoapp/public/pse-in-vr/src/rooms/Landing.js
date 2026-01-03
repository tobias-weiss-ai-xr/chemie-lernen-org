import * as THREE from 'three';

var scene, doorMaterial, doors = [], infoPanels = [];

const WEBXR_ELEMENTS = [
  {
    id: 'controllers',
    name: 'VR Controllers',
    description: 'Learn how VR controllers provide 6DOF (6 Degrees of Freedom) input tracking',
    color: 0x4a90e2,
    icon: '🎮'
  },
  {
    id: 'teleport',
    name: 'Teleportation',
    description: 'Move through VR spaces using ray-casting and point-to-click navigation',
    color: 0x50e3c2,
    icon: '⚡'
  },
  {
    id: 'models',
    name: '3D Models',
    description: 'Display and interact with 3D content in VR: glTF, DRACO compression, materials',
    color: 0xf5a623,
    icon: '🎨'
  },
  {
    id: 'audio',
    name: 'Spatial Audio',
    description: 'Positional audio that creates immersive 3D soundscapes',
    color: 0xe056fd,
    icon: '🔊'
  },
  {
    id: 'interaction',
    name: 'Ray Control',
    description: 'Interact with objects using laser pointers and grab mechanics',
    color: 0xff6b6b,
    icon: '👆'
  }
];

function createDoorMaterial(ctx, color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: {value: 0},
      selected: {value: 0},
      tex: {value: ctx.assets['doorfx_tex']},
      doorColor: {value: new THREE.Color(color)}
    },
    vertexShader: ctx.shaders.basic_vert,
    fragmentShader: ctx.shaders.door_frag
  });
}

function createInfoPanel(element, index, total) {
  const group = new THREE.Group();

  // Calculate position around the room
  const angle = (index / total) * Math.PI * 2;
  const radius = 6;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  // Panel base
  const panelGeo = new THREE.BoxGeometry(2.5, 1.8, 0.1);
  const panelMat = new THREE.MeshBasicMaterial({color: 0x2a2a3a});
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(x, 1.5, z);
  panel.lookAt(0, 1.5, 0);
  group.add(panel);

  // Title plate
  const titleGeo = new THREE.PlaneGeometry(2.3, 0.4);
  const titleMat = new THREE.MeshBasicMaterial({color: element.color});
  const titlePlate = new THREE.Mesh(titleGeo, titleMat);
  titlePlate.position.set(0, 0.6, 0.06);
  panel.add(titlePlate);

  // Description background
  const descGeo = new THREE.PlaneGeometry(2.3, 1.0);
  const descMat = new THREE.MeshBasicMaterial({color: 0x1a1a2a});
  const descPlate = new THREE.Mesh(descGeo, descMat);
  descPlate.position.set(0, -0.2, 0.06);
  panel.add(descPlate);

  // Pedestal
  const pedestalGeo = new THREE.BoxGeometry(1.5, 0.6, 1.5);
  const pedestalMat = new THREE.MeshBasicMaterial({color: 0x1a1a2a});
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(x, 0.3, z);
  group.add(pedestal);

  // Icon placeholder (simple geometric shape representing element)
  const iconGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const iconMat = new THREE.MeshBasicMaterial({color: element.color});
  const icon = new THREE.Mesh(iconGeo, iconMat);
  icon.position.set(x, 0.9, z);
  group.add(icon);

  // Animate icon floating
  icon.userData.baseY = 0.9;
  icon.userData.offset = Math.random() * Math.PI * 2;

  return { group, icon, position: new THREE.Vector3(x, 0, z) };
}

function createDoor(ctx, element, index, total) {
  const angle = (index / total) * Math.PI * 2;
  const radius = 7.5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  const doorGeo = new THREE.BoxGeometry(1.5, 2.5, 0.1);
  const doorMat = createDoorMaterial(ctx, element.color);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(x, 1.25, z);
  door.lookAt(0, 1.25, 0);
  door.name = element.id;
  door.userData.elementId = index + 1; // Room numbers start from 1

  // Door frame
  const frameGeo = new THREE.BoxGeometry(1.7, 2.7, 0.08);
  const frameMat = new THREE.MeshBasicMaterial({color: 0x1a1a1a});
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.copy(door.position);
  frame.position.z += (z < 0 ? -0.05 : 0.05);
  frame.position.x += (x < 0 ? -0.05 : 0.05);
  frame.lookAt(0, 1.25, 0);

  return { door, frame };
}

export function setup(ctx) {
  scene = new THREE.Scene();

  // Floor - large circular platform
  const floorGeo = new THREE.CylinderGeometry(10, 10, 0.2, 64);
  const floorMat = new THREE.MeshBasicMaterial({color: 0x1a1a2e});
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.1;
  scene.add(floor);

  // Center platform
  const centerGeo = new THREE.CylinderGeometry(3, 3, 0.3, 32);
  const centerMat = new THREE.MeshBasicMaterial({color: 0x2a2a4a});
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.position.y = 0.15;
  scene.add(center);

  // Center title column
  const columnGeo = new THREE.CylinderGeometry(0.5, 0.6, 3, 16);
  const columnMat = new THREE.MeshBasicMaterial({color: 0x3a3a5a});
  const column = new THREE.Mesh(columnGeo, columnMat);
  column.position.y = 1.5;
  scene.add(column);

  // Info panels for each element
  WEBXR_ELEMENTS.forEach((element, index) => {
    const { group, icon } = createInfoPanel(element, index, WEBXR_ELEMENTS.length);
    scene.add(group);
    infoPanels.push({ icon, element });

    // Create door for this element
    const { door, frame } = createDoor(ctx, element, index, WEBXR_ELEMENTS.length);
    scene.add(door);
    scene.add(frame);
    doors.push(door);
  });

  // Ceiling dome
  const domeGeo = new THREE.SphereGeometry(10, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshBasicMaterial({
    color: 0x0a0a1a,
    side: THREE.DoubleSide
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  scene.add(dome);

  // Ambient lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // Point lights for atmosphere
  const light1 = new THREE.PointLight(0x4a90e2, 0.5, 10);
  light1.position.set(5, 3, 0);
  scene.add(light1);

  const light2 = new THREE.PointLight(0xe056fd, 0.5, 10);
  light2.position.set(-5, 3, 0);
  scene.add(light2);

  // Teleport floor (invisible)
  const teleportGeo = new THREE.PlaneBufferGeometry(20, 20);
  const teleportMat = new THREE.MeshBasicMaterial({visible: false});
  const teleport = new THREE.Mesh(teleportGeo, teleportMat);
  teleport.rotation.x = -Math.PI / 2;
  teleport.position.y = 0.001;
  scene.add(teleport);

  // Store for execute
  scene.userData.teleport = teleport;
  scene.userData.infoPanels = infoPanels;
  scene.userData.doorMaterials = doors.map(d => d.material);

  // Add door interaction state
  ctx.raycontrol.addState('landingDoors', {
    colliderMesh: doors,
    onHover: (intersection, active) => {
      const door = intersection.object;
      door.scale.z = Math.min(door.scale.z + 0.05 * (2 - door.scale.z), 2);
    },
    onHoverLeave: (intersection) => {},
    onSelectStart: (intersection, e) => {
      ctx.goto = intersection.object.userData.elementId;
    },
    onSelectEnd: (intersection) => {}
  });

  // Add teleport interaction state
  ctx.raycontrol.addState('landingTeleport', {
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
  ctx.raycontrol.activateState('landingDoors');
  ctx.raycontrol.activateState('landingTeleport');
}

export function exit(ctx) {
  ctx.raycontrol.deactivateState('landingDoors');
  ctx.raycontrol.deactivateState('landingTeleport');
  ctx.scene.remove(scene);
}

export function execute(ctx, delta, time) {
  // Animate info panel icons
  infoPanels.forEach(({ icon, element }) => {
    icon.position.y = icon.userData.baseY + Math.sin(time * 2 + icon.userData.offset) * 0.1;
    icon.rotation.y += delta * 0.5;
  });

  // Update door materials
  doors.forEach(door => {
    if (door.material.uniforms) {
      door.material.uniforms.time.value = time;
    }
    if (door.scale.z > 1) {
      door.scale.z = Math.max(door.scale.z - delta * door.scale.z, 1);
    }
  });
}
