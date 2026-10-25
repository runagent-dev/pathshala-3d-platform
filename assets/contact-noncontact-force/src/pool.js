// The test's new cases (not on the page), each a small scene that keeps moving: update(t) draws it at time t (s),
// looping. Real size, metres.
//  - rope: a student pulls a cart with a rope (the student never touches the cart; the rope does).
//  - parachute: a student comes down under an open parachute; the air below the canopy holds it back.
//  - comb: a comb rubbed on dry hair, brought near bits of paper, lifts them without touching them.
import * as THREE from 'three';
import { createArrow } from './arrow.js';
import { createPerson } from './person.js';
import { V, box, canvasTexture, castShadows, groundPatch, mat, placeTube, tube, wheel } from './parts.js';

const frac = (x) => x - Math.floor(x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

// ── a student pulls a cart with a rope ───────────────────────────────────────────────────────────────────────
export function createRopeScene({ colors, materials }) {
  const root = new THREE.Group();
  root.name = 'RopeScene';
  const model = new THREE.Group();
  model.name = 'StudentPullingCart';
  root.add(model);
  const SPEED = 0.8; // m/s
  const CART_X = -0.72;
  const PERSON_X = 0.62;

  const cart = new THREE.Group();
  cart.position.x = CART_X;
  model.add(cart);
  box(0.66, 0.3, 0.44, materials.wood, 0, 0.36, 0, cart);
  box(0.7, 0.05, 0.48, mat('#6b4a2b', { roughness: 0.7 }), 0, 0.22, 0, cart);
  const wheels = [];
  for (const x of [-0.22, 0.22])
    for (const z of [0.27, -0.27]) {
      const w = wheel(0.11, 0.05, { rim: '#9aa3ad' });
      w.position.set(x, 0.11, z);
      cart.add(w);
      wheels.push(w);
    }
  const steel = mat('#9aa3ad', { roughness: 0.35, metalness: 0.7 });
  const RING = V(0.37, 0.3, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 18), steel);
  ring.position.copy(RING);
  ring.rotation.y = Math.PI / 2;
  cart.add(ring);
  // a sack in the cart
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat('#d8c39a', { roughness: 0.95 }));
  sack.scale.set(1.2, 0.7, 0.9);
  sack.position.set(0, 0.55, 0);
  cart.add(sack);

  const person = createPerson({ shirt: '#f4f6f8' });
  person.root.position.x = PERSON_X;
  model.add(person.root);
  const ropeMat = mat('#b08a4a', { roughness: 0.85, name: 'Rope' });
  const rope = tube(V(0, 0, 0), V(1, 0, 0), 0.009, ropeMat, model);

  // a path of flagstones that slides back under them (they stay in the middle of the picture)
  const tiles = canvasTexture(
    256,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = '#e6e2da';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(120,110,95,0.35)';
      ctx.lineWidth = 3;
      for (let x = 0; x <= w; x += w / 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    },
    { repeat: [5, 1] },
  );
  const ground = groundPatch(5, 1.6, { color: '#e6e2da' });
  ground.material.map = tiles;
  ground.material.needsUpdate = true;
  root.add(ground);
  castShadows(model);

  const arrow = createArrow({ color: colors.force, radius: 0.014, head: 0.085, headRadius: 0.036 });
  root.add(arrow.root);
  const hand = new THREE.Vector3();
  const ringW = new THREE.Vector3();
  const dir = new THREE.Vector3();

  function update(t, { arrowOn = false } = {}) {
    const d = t * SPEED;
    tiles.offset.x = frac(d / 1) * 1; // 1 m per tile column … repeat 5 over 5 m
    for (const w of wheels) w.rotation.z = -d / 0.11;
    person.pose({ lean: 0.2, hands: [V(-0.24, 0.88, 0.22), null], walk: (d / 0.3) * Math.PI, stride: 0.24, spread: 0.1 });
    hand.copy(person.handAt(0)).add(person.root.position);
    ringW.copy(RING).add(cart.position);
    placeTube(rope, ringW, hand, 0.009);
    arrow.setOpacity(arrowOn ? 1 : 0);
    if (arrowOn) arrow.set(ringW, dir.subVectors(hand, ringW).normalize(), 0.36);
  }

  return {
    id: 'rope',
    root,
    model,
    hits: [],
    arrow,
    fit: { min: V(-1.2, -0.02, -0.4), max: V(1.0, 1.7, 0.4) },
    views: { front: V(0.15, 0.18, 1).normalize(), '3d': V(0.75, 0.5, 0.8).normalize() },
    shadow: { center: V(0, 0, 0), r: 2 },
    update,
    marker: () => ({ kind: 'contact', at: ringW.clone() }),
    bodies: () => [
      { min: V(CART_X - 0.35, 0, -0.25), max: V(CART_X + 0.35, 0.7, 0.25) },
      { min: V(PERSON_X - 0.3, 0, -0.25), max: V(PERSON_X + 0.3, 1.62, 0.25) },
    ],
    actor: (out) => out.copy(ringW),
  };
}

// ── a student under an open parachute ────────────────────────────────────────────────────────────────────────
export function createParachuteScene({ colors }) {
  const root = new THREE.Group();
  root.name = 'ParachuteScene';
  const model = new THREE.Group();
  model.name = 'Parachute';
  root.add(model);
  const R = 1.35; // canopy radius
  const RIM_Y = 3.05;
  const GORES = 12;

  const canopy = new THREE.Group();
  canopy.position.y = RIM_Y;
  model.add(canopy);
  const colorsGore = ['#f08c00', '#fafafa'];
  for (let i = 0; i < GORES; i++) {
    const geo = new THREE.SphereGeometry(R, 4, 10, (i * Math.PI * 2) / GORES, (Math.PI * 2) / GORES, 0, Math.PI * 0.42);
    const g = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colorsGore[i % 2], roughness: 0.7, side: THREE.DoubleSide }));
    g.scale.y = 0.62;
    g.position.y = -R * Math.cos(Math.PI * 0.42) * 0.62;
    canopy.add(g);
  }
  const rimR = R * Math.sin(Math.PI * 0.42);
  const top = R * 0.62 * (1 - Math.cos(Math.PI * 0.42));

  const person = createPerson({ shirt: '#f4f6f8' });
  person.root.rotation.y = -Math.PI / 2; // facing the viewer
  model.add(person.root);
  const lineMat = mat('#4b5563', { roughness: 0.6 });
  const lines = [];
  const anchors = [];
  for (let i = 0; i < GORES; i += 1) {
    const a = (i * Math.PI * 2) / GORES;
    anchors.push(V(Math.cos(a) * rimR, RIM_Y, Math.sin(a) * rimR));
    lines.push(tube(V(0, 0, 0), V(0, 1, 0), 0.005, lineMat, model));
  }
  // air rushing past (it comes down, so the air goes up past it)
  const airMat = new THREE.MeshBasicMaterial({ color: '#9fb3c8', transparent: true, opacity: 0.55, depthWrite: false });
  const air = Array.from({ length: 9 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.42, 0.012), airMat);
    m.userData.noExport = true;
    m.userData.x = -1.5 + (i * 3) / 8 + (i % 2 ? 0.12 : -0.08);
    m.userData.p = (i * 0.37) % 1;
    root.add(m);
    return m;
  });
  castShadows(model);

  const arrow = createArrow({ color: colors.force, radius: 0.028, head: 0.17, headRadius: 0.07 });
  root.add(arrow.root);
  const hands = [V(0.05, 1.72, 0.2), V(0.05, 1.72, -0.2)];
  const handW = new THREE.Vector3();
  const v = new THREE.Vector3();

  function update(t, { arrowOn = false } = {}) {
    const sway = Math.sin(t * 1.3) * 0.035;
    model.rotation.z = sway;
    person.pose({ lean: 0, hands, walk: Math.PI / 2, stride: 0.06, spread: 0.08, lift: 0.03 });
    model.updateMatrixWorld(true);
    for (let i = 0; i < lines.length; i++) {
      handW.copy(person.handAt(i % 2 ? 1 : 0));
      person.root.localToWorld(handW);
      model.worldToLocal(handW);
      placeTube(lines[i], anchors[i], handW, 0.005);
    }
    for (const a of air) {
      const p = frac(a.userData.p + t * 0.55);
      a.position.set(a.userData.x, -0.2 + p * 3.8, -0.6);
      a.material.opacity = 0.55;
      a.visible = Math.abs(a.position.x) > rimR * 0.9 || a.position.y < RIM_Y - 0.4;
    }
    arrow.setOpacity(arrowOn ? 1 : 0);
    if (arrowOn)
      arrow.set(v.set(-Math.sin(sway) * (RIM_Y + top), Math.cos(sway) * (RIM_Y + top) + 0.02, 0), V(-Math.sin(sway), Math.cos(sway), 0), 0.75);
  }

  return {
    id: 'parachute',
    root,
    model,
    hits: [],
    arrow,
    fit: { min: V(-1.5, -0.05, -0.5), max: V(1.5, RIM_Y + top + 0.85, 0.5) },
    views: { front: V(0.1, 0.05, 1).normalize(), '3d': V(0.7, 0.3, 0.8).normalize() },
    shadow: { center: V(0, 1.5, 0), r: 2.5 },
    update,
    /** The canopy's underside, where the air pushes on it. */
    marker: () => ({ kind: 'contact', at: V(0, RIM_Y + top * 0.35, rimR * 0.5).applyMatrix4(model.matrixWorld) }),
    bodies: () => [
      { min: V(-rimR, RIM_Y - 0.1, -rimR), max: V(rimR, RIM_Y + top, rimR) },
      { min: V(-0.3, 0, -0.3), max: V(0.3, 1.75, 0.3) },
    ],
    actor: (out) => out.set(0, RIM_Y + top * 0.5, rimR),
  };
}

// ── a comb lifts bits of paper ───────────────────────────────────────────────────────────────────────────────
export function createCombScene({ colors }) {
  const root = new THREE.Group();
  root.name = 'CombScene';
  const model = new THREE.Group();
  model.name = 'CombAndPaper';
  root.add(model);
  const LOOP = 4.4;
  const COMB = { len: 0.13, h: 0.026, d: 0.005 };

  const plastic = mat('#2f4f8f', { roughness: 0.35, name: 'CombPlastic' });
  const comb = new THREE.Group();
  comb.name = 'Comb';
  model.add(comb);
  box(COMB.len, 0.008, COMB.d, plastic, 0, COMB.h / 2 - 0.004, 0, comb);
  const teeth = 26;
  const toothGeo = new THREE.BoxGeometry(0.0022, COMB.h - 0.008, COMB.d * 0.8);
  const toothMesh = new THREE.InstancedMesh(toothGeo, plastic, teeth);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < teeth; i++) {
    m4.makeTranslation(-COMB.len / 2 + 0.004 + (i * (COMB.len - 0.008)) / (teeth - 1), -0.004, 0);
    toothMesh.setMatrixAt(i, m4);
  }
  comb.add(toothMesh);
  // the hand holding the comb's end, coming in from the right
  const skin = mat('#b98057', { roughness: 0.7, name: 'Skin' });
  const sleeve = mat('#f4f6f8', { roughness: 0.85, name: 'Shirt' });
  // a hand holding the comb's end: a rounded fist round the spine, the thumb along its near side, the wrist going
  // up and back out of the picture
  const end = COMB.len / 2;
  const fist = new THREE.Mesh(new THREE.SphereGeometry(0.017, 20, 14), skin);
  fist.scale.set(1.15, 0.95, 1.05);
  fist.position.set(end + 0.006, COMB.h * 0.42, -0.003);
  comb.add(fist);
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.016, 4, 12), skin);
  thumb.rotation.z = Math.PI / 2;
  thumb.position.set(end - 0.011, COMB.h * 0.5, 0.0075);
  comb.add(thumb);
  tube(V(end + 0.012, COMB.h * 0.5 + 0.008, -0.006), V(end + 0.07, COMB.h * 0.5 + 0.075, -0.035), 0.012, skin, comb);
  tube(V(end + 0.066, COMB.h * 0.5 + 0.07, -0.033), V(end + 0.14, COMB.h * 0.5 + 0.15, -0.07), 0.019, sleeve, comb);

  // bits of paper on the table
  const paper = new THREE.MeshStandardMaterial({ color: '#fbfbf8', roughness: 0.9, side: THREE.DoubleSide, name: 'Paper' });
  const bits = [
    [-0.035, -0.006, 0.4],
    [-0.012, 0.012, -0.6],
    [0.008, -0.01, 1.1],
    [0.03, 0.008, 0.2],
    [-0.024, 0.02, 2.0],
    [0.02, -0.022, -1.2],
    [0.046, -0.004, 0.9],
  ].map(([x, z, r], i) => {
    const s = 0.012 + (i % 3) * 0.0025;
    const geo = new THREE.PlaneGeometry(s, s * 0.8);
    const mesh = new THREE.Mesh(geo, paper);
    mesh.userData = { x, z, r, order: [2, 0, 4, 1, 6, 3, 5][i] };
    model.add(mesh);
    return mesh;
  });

  const table = groundPatch(0.3, 0.2, {
    color: '#d6b994', // a plain table top, dark enough for the white bits of paper to show
    draw: (ctx, w, h) => {
      for (let i = 0; i < 12; i++) {
        ctx.strokeStyle = `rgba(150,110,70,${0.04 + Math.random() * 0.04})`;
        ctx.lineWidth = 2 + Math.random() * 3;
        ctx.beginPath();
        const y = Math.random() * h;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.33, y + 6, w * 0.66, y - 6, w, y + 3);
        ctx.stroke();
      }
    },
  });
  root.add(table);
  castShadows(model);

  const arrow = createArrow({ color: colors.force, radius: 0.0011, head: 0.0062, headRadius: 0.0028 });
  root.add(arrow.root);
  const v = new THREE.Vector3();
  let combY = 0.1;
  let watched = bits[0]; // the bit the arrow is on

  /** Height of a bit (its order in the jumping) at loop time u. */
  function bitY(order, u, teethY) {
    const jump = 0.95 + order * 0.24; // when it jumps up
    if (u < jump) return 0.0006;
    if (u < 3.4) return 0.0006 + (teethY - 0.0006) * smooth((u - jump) / 0.22);
    // the comb goes up again: the bits fall back
    return Math.max(0.0006, teethY - 4.9 * (u - 3.4) ** 2);
  }

  function update(t, { arrowOn = false } = {}) {
    const u = frac(t / LOOP) * LOOP;
    const lower = smooth(u / 0.8);
    const raise = smooth((u - 3.4) / 0.6);
    combY = 0.105 - 0.05 * lower + 0.05 * raise; // the comb's middle above the table
    comb.position.set(0, combY, 0);
    const teethY = combY - COMB.h / 2 - 0.0012;
    let next = null;
    for (const b of bits) {
      const { x, z, r, order } = b.userData;
      const y = bitY(order, u, teethY);
      b.position.set(x * (y > 0.002 ? 0.7 : 1), y, z * (y > 0.002 ? 0.3 : 1));
      b.rotation.set(y > 0.002 ? -Math.PI / 2 + 0.6 : -Math.PI / 2, 0, r);
      if (y < 0.002 && (!next || order < next.userData.order)) next = b;
    }
    watched = next || bits.find((b) => b.userData.order === 6);
    arrow.setOpacity(arrowOn && next ? 1 : 0);
    if (arrowOn && next) arrow.set(v.set(next.position.x, next.position.y + 0.002, next.position.z), V(0, 1, 0), 0.024);
  }

  return {
    id: 'comb',
    root,
    model,
    hits: [],
    arrow,
    fit: { min: V(-0.072, -0.002, -0.026), max: V(0.1, 0.12, 0.026) },
    views: { front: V(0.05, 0.3, 1).normalize(), '3d': V(0.7, 0.5, 0.8).normalize() },
    shadow: { center: V(0, 0, 0), r: 0.2 },
    update,
    /** The empty space between a bit still on the table and the comb's teeth. */
    marker: () => ({
      kind: 'gap',
      a: V(watched.position.x - 0.012, watched.position.y, watched.position.z + 0.006),
      b: V(watched.position.x - 0.012, combY - COMB.h / 2, watched.position.z + 0.006),
    }),
    bodies: () => [{ min: V(-COMB.len / 2, combY - COMB.h / 2, -0.01), max: V(COMB.len / 2 + 0.05, combY + COMB.h / 2, 0.01) }],
    actor: (out) => out.set(0, combY, 0.01),
  };
}
