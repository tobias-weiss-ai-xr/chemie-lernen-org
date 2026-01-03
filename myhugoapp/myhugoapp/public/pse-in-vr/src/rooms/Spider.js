import * as THREE from 'three';
var scene, doorMaterial, door, spider, ambientSound, lamp1Light, lamp2Light;

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

export function setup(ctx) {
  const assets = ctx.assets;
  scene = new THREE.Scene();

  // Create cozy bedroom

  // Floor - warm wood texture
  const floorGeo = new THREE.PlaneGeometry(8, 8);
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0x4a3728,
    side: THREE.DoubleSide
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // Walls
  const wallMat = new THREE.MeshBasicMaterial({color: 0x2d3a4a});
  const wallHeight = 4;

  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(8, wallHeight), wallMat);
  backWall.position.set(0, wallHeight/2, -4);
  scene.add(backWall);

  // Front wall with door opening
  const frontWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(3, wallHeight), wallMat);
  frontWallLeft.position.set(-2.5, wallHeight/2, 4);
  frontWallLeft.rotation.y = Math.PI;
  scene.add(frontWallLeft);

  const frontWallRight = new THREE.Mesh(new THREE.PlaneGeometry(3, wallHeight), wallMat);
  frontWallRight.position.set(2.5, wallHeight/2, 4);
  frontWallRight.rotation.y = Math.PI;
  scene.add(frontWallRight);

  const frontWallTop = new THREE.Mesh(new THREE.PlaneGeometry(2, wallHeight - 2.2), wallMat);
  frontWallTop.position.set(0, 3.1, 4);
  frontWallTop.rotation.y = Math.PI;
  scene.add(frontWallTop);

  // Side walls
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8, wallHeight), wallMat);
  leftWall.position.set(-4, wallHeight/2, 0);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(8, wallHeight), wallMat);
  rightWall.position.set(4, wallHeight/2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({color: 0x1a1a2e}));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallHeight;
  scene.add(ceiling);

  // Window on back wall with moonlight
  const windowFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.2, 0.1),
    new THREE.MeshBasicMaterial({color: 0x2a2a2a})
  );
  windowFrame.position.set(0, 2, -3.9);
  scene.add(windowFrame);

  const windowGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({
      color: 0x1a3a5c,
      transparent: true,
      opacity: 0.6
    })
  );
  windowGlass.position.set(0, 2, -3.85);
  scene.add(windowGlass);

  // Moonlight glow
  const moonlight = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({
      color: 0x4a6a9a,
      transparent: true,
      opacity: 0.2
    })
  );
  moonlight.position.set(0, 1.5, -2);
  moonlight.rotation.y = Math.PI;
  scene.add(moonlight);

  // Bed frame
  const bedFrameMat = new THREE.MeshBasicMaterial({color: 0x3d2b1f});
  const bedBase = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 3.5), bedFrameMat);
  bedBase.position.set(0, 0.2, -2);
  scene.add(bedBase);

  // Headboard
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 0.15), bedFrameMat);
  headboard.position.set(0, 0.8, -3.65);
  scene.add(headboard);

  // Mattress
  const mattressMat = new THREE.MeshBasicMaterial({color: 0xf5f5dc});
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 3.3), mattressMat);
  mattress.position.set(0, 0.55, -2);
  scene.add(mattress);

  // Pillows
  const pillowMat = new THREE.MeshBasicMaterial({color: 0xfaf0e6});
  const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.5), pillowMat);
  pillow1.position.set(-0.5, 0.85, -3);
  pillow1.rotation.x = -0.2;
  scene.add(pillow1);

  const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.5), pillowMat);
  pillow2.position.set(0.5, 0.85, -3);
  pillow2.rotation.x = -0.2;
  scene.add(pillow2);

  // Blanket
  const blanketMat = new THREE.MeshBasicMaterial({color: 0x4a6082});
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 2.5), blanketMat);
  blanket.position.set(0, 0.77, -1.8);
  scene.add(blanket);

  // Nightstands
  const nightstandMat = new THREE.MeshBasicMaterial({color: 0x5d4037});
  const nightstand1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), nightstandMat);
  nightstand1.position.set(-2, 0.3, -3);
  scene.add(nightstand1);

  const nightstand2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), nightstandMat);
  nightstand2.position.set(2, 0.3, -3);
  scene.add(nightstand2);

  // Lamps on nightstands
  const lampBaseMat = new THREE.MeshBasicMaterial({color: 0x8d6e63});
  const lampShadeMat = new THREE.MeshBasicMaterial({
    color: 0xffe0b2,
    transparent: true,
    opacity: 0.7
  });

  // Left lamp
  const lamp1Base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 16), lampBaseMat);
  lamp1Base.position.set(-2, 0.7, -3);
  scene.add(lamp1Base);

  const lamp1Shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 16, 1, true), lampShadeMat);
  lamp1Shade.position.set(-2, 0.95, -3);
  scene.add(lamp1Shade);

  // Lamp glow
  lamp1Light = new THREE.PointLight(0xffaa00, 0.8, 3);
  lamp1Light.position.set(-2, 0.9, -3);
  scene.add(lamp1Light);

  // Right lamp
  const lamp2Base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 16), lampBaseMat);
  lamp2Base.position.set(2, 0.7, -3);
  scene.add(lamp2Base);

  const lamp2Shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 16, 1, true), lampShadeMat);
  lamp2Shade.position.set(2, 0.95, -3);
  scene.add(lamp2Shade);

  // Lamp glow
  lamp2Light = new THREE.PointLight(0xffaa00, 0.8, 3);
  lamp2Light.position.set(2, 0.9, -3);
  scene.add(lamp2Light);

  // Rug under spider
  const rugGeo = new THREE.CircleGeometry(1.5, 32);
  const rugMat = new THREE.MeshBasicMaterial({color: 0x6d5a4a});
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.01, 1);
  scene.add(rug);

  // Load and setup spider model
  spider = assets['spider_model'].scene;
  spider.position.y = 1.0;
  spider.position.z = -2;
  spider.scale.set(0.4, 0.4, 0.4);

  // Apply materials to spider if available
  if (assets['spider_tex']) {
    spider.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          map: assets['spider_tex'],
          side: THREE.DoubleSide
        });
      }
    });
  }

  scene.add(spider);

  // Add door
  doorMaterial = createDoorMaterial(ctx);
  const doorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.1);
  door = new THREE.Mesh(doorGeo, doorMaterial);
  door.position.set(0, 1.1, 3);
  scene.add(door);

  // Add door frame
  const frameGeo = new THREE.BoxGeometry(1.4, 2.4, 0.08);
  const frameMat = new THREE.MeshBasicMaterial({color: 0x444444});
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 1.1, 3.06);
  scene.add(frame);

  // Add teleport plane (invisible)
  const teleportGeo = new THREE.PlaneBufferGeometry(10, 10);
  const teleportMat = new THREE.MeshBasicMaterial({visible: false});
  const teleport = new THREE.Mesh(teleportGeo, teleportMat);
  teleport.rotation.x = -Math.PI / 2;
  teleport.position.y = 0.001;
  scene.add(teleport);

  // Setup ambient sound
  ambientSound = new THREE.PositionalAudio(ctx.audioListener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('assets/ogg/wind.ogg', buffer => {
    ambientSound.setBuffer(buffer);
    ambientSound.setLoop(true);
    ambientSound.setVolume(0.3);
    ambientSound.setRefDistance(5);
  });

  scene.add(ambientSound);

  // Add door interaction state
  ctx.raycontrol.addState('doorSpider', {
    colliderMesh: door,
    onHover: (intersection, active) => {
      const scale = door.scale;
      scale.z = Math.min(scale.z + 0.05 * (2 - door.scale.z), 1.5);
    },
    onHoverLeave: () => {},
    onSelectStart: (intersection, e) => {
      ctx.goto = 0;
    },
    onSelectEnd: (intersection) => {}
  });

  // Add teleport interaction state
  ctx.raycontrol.addState('teleportSpider', {
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
  ctx.renderer.setClearColor(0x0a0a15);
  ctx.scene.add(scene);
  ctx.raycontrol.activateState('doorSpider');
  ctx.raycontrol.activateState('teleportSpider');

  // Start ambient sound
  if (ambientSound && !ambientSound.isPlaying) {
    ambientSound.play();
  }
}

export function exit(ctx) {
  ctx.raycontrol.deactivateState('doorSpider');
  ctx.raycontrol.deactivateState('teleportSpider');
  ctx.scene.remove(scene);

  // Stop ambient sound
  if (ambientSound && ambientSound.isPlaying) {
    ambientSound.stop();
  }
}

export function execute(ctx, delta, time) {
  doorMaterial.uniforms.time.value = time;

  // Animate spider walking on the bed
  if (spider) {
    // Spider walks in a figure-8 pattern on the bed
    const walkSpeed = 0.5;
    const walkRadius = 0.6;

    // Figure-8 motion using Lissajous curve
    spider.position.x = Math.sin(time * walkSpeed) * walkRadius;
    spider.position.z = -2 + Math.sin(time * walkSpeed * 2) * walkRadius * 0.5;
    spider.position.y = 1.0 + Math.abs(Math.sin(time * walkSpeed * 4)) * 0.1;

    // Rotate spider to face walking direction
    const targetRotation = Math.atan2(
      Math.cos(time * walkSpeed) * walkRadius,
      Math.cos(time * walkSpeed * 2) * walkRadius * 0.5
    );
    spider.rotation.y = targetRotation;

    // Subtle leg wiggle
    spider.rotation.x = Math.sin(time * 10) * 0.05;
    spider.rotation.z = Math.cos(time * 8) * 0.03;
  }

  // Gentle lamp flickering
  const flickerIntensity = 0.7 + Math.sin(time * 3) * 0.1 + Math.sin(time * 7) * 0.05;
  if (lamp1Light) lamp1Light.intensity = flickerIntensity;
  if (lamp2Light) lamp2Light.intensity = flickerIntensity;

  if (door.scale.z > 0.5) {
    door.scale.z = Math.max(door.scale.z - delta * door.scale.z, 0.5);
  }
}
