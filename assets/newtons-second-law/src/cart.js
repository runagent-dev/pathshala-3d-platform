// The handcart (ঠেলাগাড়ি) and its load, real size in metres: a wooden bed of planks (1.3 m × 0.8 m, top 0.5 m above
// the floor) with low side boards, on four rubber wheels (0.2 m radius) with steel spokes, and two wooden handles
// that rise behind it to a steel crossbar at 0.88 m, where the people push. Sacks of rice (50 kg each, jute) lie
// across the bed. Origin: on the floor under the front edge of the bed, +x forward (the way it is pushed), +y up.
// The parts that never move against each other are merged into one mesh per material (merge.js), the plain colours
// into one in vertex colours; each wheel is one mesh in the same vertex colours; one sack geometry serves every sack.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStatic } from './merge.js';

export const CART = {
  length: 1.3, // the bed, from its front edge (x = 0) back
  width: 0.8,
  bed: 0.5, // top of the bed
  wheel: 0.2,
  wheelX: [-0.24, -1.06],
  wheelZ: 0.45,
  grip: { x: -1.82, y: 0.88, half: 0.42 }, // the crossbar the people hold
  rail: { x: -0.03, y: 0.88 }, // the front rail (the person in front pushes back on it)
};
export const SACK = { x: 0.5, y: 0.26, z: 0.74 }; // a sack lying across the bed

const mat = (name, color, roughness = 0.7, metalness = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness, metalness, ...extra });

function canvasTexture(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  return tex;
}

/** Jute: a coarse weave in warm beige, with a darker printed stripe (the sack's band). */
function juteTexture() {
  let seed = 11;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#cdb489';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 4) {
      ctx.fillStyle = `rgba(120,90,50,${0.1 + rnd() * 0.12})`;
      ctx.fillRect(i, 0, 1.5, h);
      ctx.fillRect(0, i, w, 1.5);
    }
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(255,240,210,${rnd() * 0.18})`;
      ctx.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 1);
    }
    // the band across the sack
    ctx.fillStyle = 'rgba(150,62,40,0.75)';
    ctx.fillRect(0, h * 0.42, w, h * 0.05);
    ctx.fillRect(0, h * 0.53, w, h * 0.05);
  });
}

/** A geometry painted one colour (vertex colours), position/normal/uv only, non-indexed. */
function paintGeo(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  const c = new THREE.Color(color);
  const rgb = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < rgb.length; i += 3) c.toArray(rgb, i);
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  return g;
}

/**
 * The four wheels, each one mesh in vertex colours (a black tyre, a yellow rim, six steel spokes and an iron hub)
 * sharing one geometry, placed at `spots` (the wheels' centres) and turned together about z by roll(angle).
 */
function createWheels(M, spots) {
  const R = CART.wheel;
  const parts = [
    paintGeo(new THREE.TorusGeometry(R - 0.035, 0.035, 10, 32), '#25282d'),
    paintGeo(new THREE.TorusGeometry(R - 0.07, 0.012, 6, 28), '#ffbf36'),
  ];
  for (let i = 0; i < 6; i++)
    parts.push(paintGeo(new THREE.CylinderGeometry(0.007, 0.007, R - 0.07, 6).translate(0, (R - 0.07) / 2, 0).rotateZ((i * Math.PI) / 3), '#aab2bb'));
  parts.push(paintGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 14).rotateX(Math.PI / 2), '#3b4048'));
  const geo = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  const meshes = spots.map((p) => {
    const w = new THREE.Mesh(geo, M.painted);
    w.name = 'Wheel';
    w.position.copy(p);
    return w;
  });
  return {
    meshes,
    roll(angle) {
      for (const w of meshes) w.rotation.z = angle;
    },
  };
}

/** Wood grain for parts measured in metres (each face of a plank shows one tile). */
function woodTexture() {
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  return canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#c99257';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) {
      const y0 = rnd() * h;
      const amp = 1 + rnd() * 3;
      const f = 0.01 + rnd() * 0.03;
      const ph = rnd() * 10;
      ctx.strokeStyle = `rgba(${96 + rnd() * 30},${54 + rnd() * 20},24,${0.12 + rnd() * 0.26})`;
      ctx.lineWidth = 0.6 + rnd() * 1.6;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = y0 + Math.sin(x * f + ph) * amp;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  });
}

/** One sack of rice (50 kg), lying with its long side across the cart. */
let SACK_GEO = null;
export function createSack(M) {
  const mesh = new THREE.Mesh(sackGeometry(), M.jute);
  mesh.name = 'RiceSack';
  return mesh;
}
/** The sack's shape (made once, shared). */
export function sackGeometry() {
  if (SACK_GEO) return SACK_GEO;
  const geo = new RoundedBoxGeometry(SACK.x, SACK.y, SACK.z, 3, 0.09);
  // a little sag: the middle of the top is lower, the ends fuller
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const z = p.getZ(i) / (SACK.z / 2);
    if (y > 0) p.setY(i, y - 0.03 * (1 - z * z));
    p.setX(i, p.getX(i) * (1 + 0.06 * (1 - z * z)));
  }
  geo.computeVertexNormals();
  SACK_GEO = geo;
  return geo;
}

/** The cart's materials (shared by both carts and the pile of sacks); `paint` takes the plain colours, merged. */
export function createCartMaterials() {
  const grain = woodTexture();
  grain.anisotropy = 4;
  const wood = new THREE.MeshStandardMaterial({ name: 'CartWood', map: grain, roughness: 0.72, metalness: 0 });
  const darkWood = wood.clone();
  darkWood.name = 'CartWoodDark';
  darkWood.color.set('#cf3b47');
  return {
    wood,
    darkWood,
    painted: new THREE.MeshStandardMaterial({ name: 'CartPaint', vertexColors: true, roughness: 0.48, metalness: 0.12 }),
    paint: mat('CoralWagon', '#f43b4d', 0.36),
    steel: mat('CartSteel', '#9aa3ad', 0.35, 0.8),
    dark: mat('CartIron', '#3b4048', 0.5, 0.6),
    jute: new THREE.MeshStandardMaterial({ name: 'Jute', map: juteTexture(), roughness: 0.95, metalness: 0 }),
  };
}

/**
 * The cart with room for up to three sacks (two side by side on the bed, one on top). setLoad(n) shows n sacks;
 * roll(d) turns the wheels for d m travelled. `body` is the visible cart (for the action's ring), `hit` an invisible
 * box a finger finds easily.
 */
export function createCart(M) {
  const root = new THREE.Group();
  root.name = 'Handcart';
  const body = new THREE.Group();
  body.name = 'CartBody';
  root.add(body);
  const { length: L, width: W, bed: B } = CART;
  const add = (geo, m, x, y, z, parent = body) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  // the bed: five planks along the cart, with small gaps, on two beams
  const plankW = W / 5;
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(L, 0.04, plankW - 0.008), M.wood, -L / 2, B - 0.02, -W / 2 + plankW * (i + 0.5));
  for (const z of [-0.28, 0.28]) add(new THREE.BoxGeometry(L - 0.04, 0.07, 0.07), M.darkWood, -L / 2, B - 0.075, z);
  // low side boards and a front board
  for (const z of [-W / 2 + 0.015, W / 2 - 0.015]) add(new THREE.BoxGeometry(L, 0.1, 0.03), M.paint, -L / 2, B + 0.05, z);
  add(new THREE.BoxGeometry(0.03, 0.12, W), M.paint, -0.015, B + 0.06, 0);
  // axles and their brackets
  for (const x of CART.wheelX) {
    add(new THREE.CylinderGeometry(0.018, 0.018, 2 * CART.wheelZ + 0.02, 10).rotateX(Math.PI / 2), M.dark, x, CART.wheel, 0);
    for (const z of [-0.28, 0.28]) add(new THREE.BoxGeometry(0.06, B - 0.11 - CART.wheel + 0.02, 0.04), M.dark, x, (B - 0.11 + CART.wheel) / 2, z);
  }
  // the handles: from the back corners of the bed, back and up to the crossbar
  const g = CART.grip;
  const tmp = new THREE.Vector3();
  for (const z of [-0.3, 0.3]) {
    const a = new THREE.Vector3(-L + 0.1, B - 0.04, z);
    const b = new THREE.Vector3(g.x + 0.04, g.y, z);
    const len = a.distanceTo(b);
    const pole = add(new THREE.CylinderGeometry(0.022, 0.026, len, 10), M.darkWood, 0, 0, 0);
    pole.position.addVectors(a, b).multiplyScalar(0.5);
    pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tmp.subVectors(b, a).normalize());
  }
  add(new THREE.CylinderGeometry(0.02, 0.02, 2 * g.half, 12).rotateX(Math.PI / 2), M.steel, g.x, g.y, 0);
  // the front rail: two posts and a crossbar
  const r = CART.rail;
  for (const z of [-0.36, 0.36]) add(new THREE.CylinderGeometry(0.017, 0.017, r.y - B, 8), M.steel, r.x, (r.y + B) / 2, z);
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.76, 10).rotateX(Math.PI / 2), M.steel, r.x, r.y, 0);
  for (const z of [-g.half, g.half]) add(new THREE.SphereGeometry(0.026, 10, 8), M.dark, g.x, g.y, z);

  // Rear seat leaves the front of the bed free for stacked cargo.
  add(new RoundedBoxGeometry(0.32, 0.055, 0.64, 2, 0.02), M.paint, -0.98, 0.77, 0);
  for (const z of [-0.25, 0.25]) add(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), M.steel, -1.1, 0.65, z);
  add(new RoundedBoxGeometry(0.045, 0.24, 0.66, 2, 0.02), M.paint, -1.15, 0.91, 0);
  const spotsW = [];
  for (const x of CART.wheelX) for (const z of [-CART.wheelZ, CART.wheelZ]) spotsW.push(new THREE.Vector3(x, CART.wheel, z));
  const wheels = createWheels(M, spotsW);
  for (const w of wheels.meshes) body.add(w);

  // the load: two sacks side by side across the bed, a third on top of them
  const sacks = [];
  const spots = [
    [-0.3, B + SACK.y / 2],
    [-0.3, B + SACK.y * 1.5],
    [-0.3, B + SACK.y * 2.5],
  ];
  for (const [x, y] of spots) {
    const s = createSack(M);
    s.position.set(x, y, 0);
    s.visible = false;
    body.add(s);
    sacks.push(s);
  }

  // the still parts, one mesh per material: the plain colours (paint, iron) share one in vertex colours
  mergeStatic(body, { keep: [...wheels.meshes, ...sacks], paint: { from: [M.paint, M.dark, M.steel], material: M.painted } });
  for (const o of body.children) if (/** @type {any} */ (o).isMesh) o.castShadow = true;

  const hit = new THREE.Mesh(new THREE.BoxGeometry(L + 0.8, 1.5, W + 0.3), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(-L / 2 - 0.25, 0.7, 0);
  hit.userData.noExport = true;
  root.add(hit);

  let load = 0;
  return {
    root,
    body,
    hit,
    sacks,
    get load() {
      return load;
    },
    /** n sacks on the cart (0–3); drop: 0…1 how far the newest have still to fall (an animation). */
    setLoad(n, drop = 0) {
      load = n;
      sacks.forEach((s, i) => {
        s.visible = i < n;
        s.position.y = spots[i][1] + (i < n ? drop * 0.5 : 0);
      });
    },
    roll(d) {
      wheels.roll(-d / CART.wheel);
    },
    /** The top of the load (m above the floor). */
    top: () => Math.max(1.34, B + load * SACK.y),
  };
}
