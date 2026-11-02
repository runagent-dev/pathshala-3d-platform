// The 3D scene of the density figure, in centimetres: a lab bench with a slate-blue top in front of a warm apricot
// wall; three clear glass tanks of water side by side; three balls of the same size (a golden cork ball, a varnished
// wooden one with grain, a polished iron one), each on a small ring on the bench in front of its tank; and, further
// along the bench, a glass box round 24 red particles that can be squeezed smaller (the same particles, the same
// mass, less volume). Modest geometry, no per-frame rebuilds: moving a ball, raising the water and squeezing the box
// only change transforms.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BALL_IDS, BOX_START, boxSide, capVolume, particleLayout, radiusOf, V_BALL } from './reading.js';

export const TANK = { R: 6, H: 17, base: 0.6, wall: 0.25, depth: 11 }; // cm: inner radius, height, glass, water depth
export const TANK_X = { cork: -15, wood: 0, iron: 15 };
export const BALL_R = radiusOf(V_BALL); // 2.88 cm
export const TABLE_Z = 12; // where the balls wait on the bench, in front of their tanks
export const BOX_X = 46; // the box of particles, further along the bench
export const PARTICLE_R = 0.36;
const RING = { r: 1.6, tube: 0.32 };
/** The height of a ball's centre (radius r) sitting on its ring on the bench. */
export const restOnRing = (r) => RING.tube + Math.sqrt((r + RING.tube) ** 2 - RING.r ** 2);
export const REST_Y = restOnRing(BALL_R);
export const WATER_LEVEL = TANK.base + TANK.depth; // the water's top before a ball goes in
const AREA = Math.PI * TANK.R ** 2;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')) };
}
function seeded(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function tex(c, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  return t;
}

/** Cork: warm golden with dark pores and pale flecks. */
function corkTexture() {
  const { c, ctx } = canvas(512, 256);
  const r = seeded(5);
  ctx.fillStyle = '#d9a556';
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 2600; i++) {
    const x = r() * 512;
    const y = r() * 256;
    const s = 0.6 + r() * 2.6;
    const dark = r() < 0.55;
    ctx.fillStyle = dark
      ? `rgba(${110 + r() * 40},${62 + r() * 25},${20 + r() * 15},${0.35 + r() * 0.45})`
      : `rgba(255,${215 + r() * 30},${150 + r() * 40},${0.25 + r() * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(x, y, s * (1 + r()), s, r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return tex(c);
}

/** Varnished wood: wavy bands of grain round the ball. */
function woodTexture() {
  const { c, ctx } = canvas(512, 256);
  const r = seeded(9);
  ctx.fillStyle = '#a8692f';
  ctx.fillRect(0, 0, 512, 256);
  for (let y = 0; y < 256; y += 1) {
    const k = Math.sin(y * 0.21 + Math.sin(y * 0.05) * 3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(${92 + k * 40},${50 + k * 22},${18 + k * 10},${0.25 + k * 0.4})`;
    ctx.fillRect(0, y, 512, 1);
  }
  for (let i = 0; i < 70; i++) {
    const y0 = r() * 256;
    ctx.strokeStyle = `rgba(70,36,12,${0.25 + r() * 0.35})`;
    ctx.lineWidth = 0.8 + r() * 1.8;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y = y0 + Math.sin((x / 512) * Math.PI * 2 * 2 + i) * (3 + r() * 1.5) + Math.sin(x * 0.03 + i * 0.7) * 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return tex(c);
}

/** The bench top: slate blue with a faint speckle. */
function benchTexture() {
  const { c, ctx } = canvas(256, 256);
  const r = seeded(3);
  ctx.fillStyle = '#3e5577';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    const g = r() < 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${g},${g},${g},${0.03 + r() * 0.05})`;
    ctx.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2);
  }
  return tex(c, { repeat: [6, 3] });
}

/** The wall: a soft apricot backdrop, lighter up high where the window light falls, deeper behind the bench. */
function wallTexture() {
  const { c, ctx } = canvas(512, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#f4cfa8');
  g.addColorStop(0.6, '#eebb8f');
  g.addColorStop(1, '#e3a172');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const glow = ctx.createRadialGradient(170, 170, 10, 170, 170, 330);
  glow.addColorStop(0, 'rgba(255,236,210,0.45)');
  glow.addColorStop(1, 'rgba(255,248,232,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);
  const r = seeded(13);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(150,90,50,${0.015 + r() * 0.025})`;
    ctx.fillRect(r() * 512, r() * 512, 2, 2);
  }
  return tex(c, { repeat: [1, 1] });
}

/** A soft round shadow: dark in the middle, clear at the edge. */
function contactTexture() {
  const { c, ctx } = canvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(8,30,60,1)');
  g.addColorStop(0.45, 'rgba(8,30,60,0.6)');
  g.addColorStop(1, 'rgba(8,30,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return tex(c);
}

function makeMaterials() {
  const cork = new THREE.MeshStandardMaterial({ map: corkTexture(), roughness: 0.92, metalness: 0 });
  cork.bumpMap = cork.map;
  cork.bumpScale = 0.6;
  return {
    cork,
    wood: new THREE.MeshPhysicalMaterial({ map: woodTexture(), roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    iron: new THREE.MeshStandardMaterial({ color: '#d4d9e0', metalness: 1, roughness: 0.16 }),
    paint: new THREE.MeshPhysicalMaterial({ color: '#7048e8', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }),
    ring: new THREE.MeshStandardMaterial({ color: '#f1f3f5', roughness: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#eaf6ff',
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
      clearcoat: 1,
    }),
    rim: new THREE.MeshPhysicalMaterial({ color: '#a9c4d8', roughness: 0.1, transparent: true, opacity: 0.8, clearcoat: 1 }),
    water: new THREE.MeshStandardMaterial({ color: '#1e88f0', roughness: 0.1, transparent: true, opacity: 0.52, depthWrite: false }),
    surface: new THREE.MeshStandardMaterial({ color: '#6cc0ff', roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false }),
    floor: new THREE.MeshStandardMaterial({ color: '#cfe6f7', roughness: 0.2, transparent: true, opacity: 0.35, depthWrite: false }),
    contact: new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false, toneMapped: false }),
    meniscus: new THREE.MeshBasicMaterial({ color: '#1c7ed6', transparent: true, opacity: 0.9, toneMapped: false }),
    particle: new THREE.MeshStandardMaterial({ color: '#d42a2a', roughness: 0.28, metalness: 0.05 }),
    boxGlass: new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.05,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    edge: new THREE.MeshStandardMaterial({ color: '#e8590c', roughness: 0.4, emissive: '#7a2a00', emissiveIntensity: 0.25 }),
    ghost: new THREE.LineBasicMaterial({ color: '#c2410c', transparent: true, opacity: 0.45 }),
  };
}

/** A glass tank of water. `setLevel(y)` raises the water (a ball pushes some aside). */
function createTank(mat, name) {
  const root = new THREE.Group();
  root.name = name;
  const { R, H, base, wall } = TANK;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(R + wall, R + wall, H, 48, 1, true), mat.glass);
  glass.position.y = H / 2;
  glass.renderOrder = 3;
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(R + wall, 48), mat.floor);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = base;
  bottom.renderOrder = -1;
  // the rim on top and the foot below, one mesh (the same glass)
  const rimGeo = new THREE.TorusGeometry(R + wall / 2, wall * 0.75, 8, 64).rotateX(Math.PI / 2).translate(0, H, 0);
  const footGeo = new THREE.TorusGeometry(R + wall / 2, wall * 0.9, 8, 64).rotateX(Math.PI / 2).translate(0, wall * 0.9, 0);
  const rim = new THREE.Mesh(mergeGeometries([rimGeo, footGeo]), mat.rim);
  rimGeo.dispose();
  footGeo.dispose();
  // the water: a body (its height set by scale) with a lighter top and a bright blue line where it meets the glass
  const water = new THREE.Group();
  water.name = `${name}Water`;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, 1, 48, 1, true), mat.water);
  body.renderOrder = 1;
  const top = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 48), mat.surface);
  top.rotation.x = -Math.PI / 2;
  top.renderOrder = 2;
  const line = new THREE.Mesh(new THREE.TorusGeometry(R - 0.03, 0.07, 6, 64), mat.meniscus);
  line.rotation.x = Math.PI / 2;
  line.renderOrder = 2;
  water.add(body, top, line);
  // a soft dark patch on the floor under a ball that rests there
  const contact = new THREE.Mesh(new THREE.CircleGeometry(BALL_R * 1.15, 32), mat.contact.clone());
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = base + 0.03;
  contact.renderOrder = 0;
  contact.visible = false;
  contact.userData.noExport = true;
  root.add(glass, bottom, rim, water, contact);
  let level = 0;
  function setLevel(y) {
    level = y;
    const h = y - base;
    body.scale.y = h;
    body.position.y = base + h / 2;
    top.position.y = y;
    line.position.y = y;
  }
  setLevel(WATER_LEVEL);
  /** The patch under a ball at height y (radius r): darkest when it rests on the floor. */
  function setContact(y, r = BALL_R) {
    const k = Math.max(0, 1 - (y - r - base) / (r * 1.2));
    contact.visible = k > 0.01;
    contact.scale.setScalar(r / BALL_R);
    contact.material.opacity = 0.8 * k;
  }
  return { root, setLevel, setContact, level: () => level, hit: glass };
}

/** A ball on its ring. */
function createBall(material, name, r = BALL_R) {
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), material);
  ball.name = name;
  ball.scale.setScalar(r);
  ball.castShadow = true;
  ball.receiveShadow = true;
  ball.rotation.set(0.4, 0.8, 0.2);
  return ball;
}

/**
 * Builds the scene. Returns { root, tanks, balls, rings, quizBalls, box, materials, waterLevelFor }.
 */
export function createScene({ background = true } = {}) {
  const mat = makeMaterials();
  const root = new THREE.Group();
  root.name = 'Density';

  // the bench and the wall
  const room = new THREE.Group();
  room.name = 'Room';
  if (background) {
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(420, 3, 90),
      new THREE.MeshStandardMaterial({ map: benchTexture(), roughness: 0.38, metalness: 0.05 }),
    );
    top.position.set(15, -1.5, 10);
    top.receiveShadow = true;
    const edge = new THREE.Mesh(new THREE.BoxGeometry(420, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: '#2b3d58', roughness: 0.35 }));
    edge.position.set(15, -0.3, 55);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(520, 160), new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.95 }));
    wall.position.set(15, 78, -35);
    wall.receiveShadow = true;
    const lineM = new THREE.MeshStandardMaterial({ color: '#1f7a86', roughness: 0.4 });
    const band = new THREE.Mesh(new THREE.BoxGeometry(520, 1, 0.5), lineM);
    band.position.set(15, 0.5, -34.7);
    room.add(top, edge, wall, band);
  }
  root.add(room);
  // the tanks and everything on the bench in front of them (the box of particles is the other part)
  const ballsPart = new THREE.Group();
  ballsPart.name = 'TanksAndBalls';
  root.add(ballsPart);

  const tanks = {};
  const balls = {};
  const rings = {};
  for (const id of BALL_IDS) {
    const tank = createTank(mat, `Tank_${id}`);
    tank.root.position.x = TANK_X[id];
    ballsPart.add(tank.root);
    tanks[id] = tank;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RING.r, RING.tube, 10, 32), mat.ring);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(TANK_X[id], RING.tube, TABLE_Z);
    ring.castShadow = true;
    ring.receiveShadow = true;
    ring.name = `Ring_${id}`;
    ballsPart.add(ring);
    rings[id] = ring;
    const ball = createBall(mat[id], `Ball_${id}`);
    ball.position.set(TANK_X[id], REST_Y, TABLE_Z);
    ballsPart.add(ball);
    balls[id] = ball;
  }

  // the test's painted balls (hidden until a question needs them)
  const quizBalls = Array.from({ length: 4 }, (_, i) => {
    const b = createBall(mat.paint, `QuizBall_${i}`);
    b.visible = false;
    b.userData.noExport = true;
    ballsPart.add(b);
    return b;
  });
  const quizRings = Array.from({ length: 4 }, (_, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RING.r, RING.tube, 10, 32), mat.ring);
    ring.rotation.x = Math.PI / 2;
    ring.visible = false;
    ring.userData.noExport = true;
    ring.name = `QuizRing_${i}`;
    ballsPart.add(ring);
    return ring;
  });

  // the box of particles
  const box = createParticleBox(mat);
  box.root.position.set(BOX_X, 0, 0);
  root.add(box.root);

  /** The water's top in a tank holding a ball whose centre is at y (radius r): it rises by the volume under water. */
  function waterLevelFor(y, r = BALL_R) {
    let level = WATER_LEVEL;
    for (let i = 0; i < 3; i++) {
      const under = Math.min(2 * r, Math.max(0, level - (y - r)));
      level = WATER_LEVEL + capVolume(r, under) / AREA;
    }
    return level;
  }

  return { root, ballsPart, tanks, balls, rings, quizBalls, quizRings, box, materials: mat, waterLevelFor };
}

/** The glass box round the particles; `setVolume(V)` scales the box and moves the particles with it. */
function createParticleBox(mat) {
  const root = new THREE.Group();
  root.name = 'ParticleBox';
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat.boxGlass);
  glass.renderOrder = 3;
  // the 12 edges and the 8 corners, each one instanced mesh
  const edges = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.075, 0.075, 1, 8), mat.edge, 12);
  edges.name = 'BoxEdges';
  edges.castShadow = true;
  const corners = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 10, 8), mat.edge, 8);
  corners.name = 'BoxCorners';
  // the starting box, faint, so a squeezed box can be compared with it
  const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), mat.ghost);
  const s0 = boxSide(BOX_START);
  ghost.scale.setScalar(s0);
  ghost.position.y = s0 / 2;
  ghost.userData.noExport = true;
  ghost.name = 'StartingBox';
  const layout = particleLayout(24, 0.27, 11);
  const particles = new THREE.InstancedMesh(new THREE.SphereGeometry(PARTICLE_R, 18, 12), mat.particle, layout.length);
  particles.name = 'Particles';
  particles.castShadow = true;
  root.add(glass, edges, corners, ghost, particles);

  const m4 = new THREE.Matrix4();
  const v = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const sc = new THREE.Vector3();
  const qZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  let side = 0;
  function setVolume(V) {
    side = boxSide(V);
    const h = side / 2;
    glass.scale.setScalar(side);
    glass.position.y = h;
    // the 12 edges: 4 upright, 4 along x, 4 along z
    let i = 0;
    const put = (mesh, x, y, z, rot, len) => {
      v.set(x, y, z);
      sc.set(1, len, 1);
      m4.compose(v, rot, sc);
      mesh.setMatrixAt(i++, m4);
    };
    for (const x of [-h, h]) for (const z of [-h, h]) put(edges, x, h, z, q, side);
    for (const y of [0, side]) for (const z of [-h, h]) put(edges, 0, y, z, qZ, side);
    for (const y of [0, side]) for (const x of [-h, h]) put(edges, x, y, 0, qX, side);
    i = 0;
    for (const x of [-h, h]) for (const y of [0, side]) for (const z of [-h, h]) put(corners, x, y, z, q, 1);
    edges.instanceMatrix.needsUpdate = true;
    corners.instanceMatrix.needsUpdate = true;
    edges.computeBoundingSphere();
    corners.computeBoundingSphere();
    const inner = side - 2 * PARTICLE_R - 0.12;
    layout.forEach((p, j) => {
      v.set(p[0] * inner, h + p[1] * inner, p[2] * inner);
      m4.compose(v, q, one);
      particles.setMatrixAt(j, m4);
    });
    particles.instanceMatrix.needsUpdate = true;
    particles.computeBoundingSphere();
    ghost.visible = V < BOX_START - 1e-6;
  }
  setVolume(BOX_START);
  return { root, setVolume, side: () => side, particles, glass, count: layout.length };
}
