// The two feet that press on the clay, each a lower leg in a shoe (procedural, metres). Each foot's own frame: x along
// the shoe (the toe at +x), y up, z across; y = 0 is the bottom of the sole where it touches the ground. Each also says
// where it touches the ground (its footprint, a signed distance in the ground plane, for the clay to give way under it)
// and where along its middle line the pressure arrows go.
//   a high heel (cobalt blue, a woman in a magenta salwar): it touches with the front of the sole and the heel's tip;
//   a flat sneaker (sunflower yellow, a man in rolled-up jeans): it touches with the whole sole.
import * as THREE from 'three';
import { lerpTable, loft, spread } from './loft.js';

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** A small canvas texture. */
function canvasTexture(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.anisotropy = 4;
  return tex;
}

/** A tube of rings round a vertical axis (x, z) from y0 to y1: for legs, socks and trouser legs. */
function tube(axis, y0, y1, radius, { seg = 36, rows = 24, lean = 0 } = {}) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= rows; i++) {
    const k = i / rows;
    const y = y0 + (y1 - y0) * k;
    const r = typeof radius === 'function' ? radius(k, y) : radius;
    const cx = axis.x + lean * (y - y0);
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      // a leg is a little deeper (x) than wide (z)
      pos.push(cx + Math.cos(a) * r * 1.06, y, axis.z + Math.sin(a) * r * 0.94);
      uv.push(j / seg, k);
    }
  }
  const row = seg + 1;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * row + j;
      idx.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The radius of a lower leg at height y above the ankle bone (m). */
const LEG_R = [
  [0, 0.031],
  [0.06, 0.03],
  [0.14, 0.036],
  [0.26, 0.047],
  [0.34, 0.049],
  [0.46, 0.043],
  [0.6, 0.046],
  [1, 0.05],
];

const mesh = (geo, mat, name, { shadow = true } = {}) => {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
};

// ── the high heel ────────────────────────────────────────────────────────────
// The bottom of its sole: high on the heel's post, an S down the arch, flat under the ball and toes, the tip lifted.
export const HEEL = { seat: 0.083, post: -0.097, padFrom: 0.03, padTo: 0.106 };
export function heelSoleY(x) {
  if (x <= -0.074) return HEEL.seat;
  if (x >= HEEL.padFrom) return x > HEEL.padTo ? (x - HEEL.padTo) ** 2 * 9 : 0;
  const k = (x + 0.074) / (HEEL.padFrom + 0.074);
  return HEEL.seat * (1 - smooth(0, 1, k) ** 0.85);
}
const HEEL_W = [
  [-0.124, 0.006],
  [-0.12, 0.02],
  [-0.112, 0.026],
  [-0.085, 0.028],
  [-0.04, 0.024],
  [0.0, 0.029],
  [0.045, 0.037],
  [0.08, 0.036],
  [0.108, 0.027],
  [0.124, 0.013],
  [0.134, 0.003],
];
// where it touches: the pad under the ball and toes (an ellipse) and the heel's tip (a small disc)
const HEEL_PAD = { x: 0.068, a: 0.04, b: 0.038 };
const HEEL_TIP = { x: HEEL.post, r: 0.009 };
export const HEEL_FOOTPRINT = {
  /** Signed distance (m) from the footprint's edge, in the foot's frame: < 0 inside. */
  sdf(x, z) {
    const e = (Math.hypot((x - HEEL_PAD.x) / HEEL_PAD.a, z / HEEL_PAD.b) - 1) * Math.min(HEEL_PAD.a, HEEL_PAD.b);
    const c = Math.hypot(x - HEEL_TIP.x, z) - HEEL_TIP.r;
    return Math.min(e, c);
  },
  box: { x0: HEEL_TIP.x - 0.02, x1: HEEL_PAD.x + HEEL_PAD.a + 0.02, z: HEEL_PAD.b + 0.02 },
  /** Its outline as shapes in (x, z) (for the area drawn in the print). */
  shapes() {
    const pad = new THREE.Shape();
    pad.absellipse(HEEL_PAD.x, 0, HEEL_PAD.a, HEEL_PAD.b, 0, Math.PI * 2, false, 0);
    const tip = new THREE.Shape();
    tip.absarc(HEEL_TIP.x, 0, HEEL_TIP.r, 0, Math.PI * 2, false);
    return [pad, tip];
  },
};

export function createHeelShoe() {
  const root = new THREE.Group();
  root.name = 'HighHeel';
  const shoeMat = new THREE.MeshPhysicalMaterial({ color: '#1f45c9', roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12 });
  const liningMat = new THREE.MeshStandardMaterial({ color: '#e9c9a6', roughness: 0.8, side: THREE.BackSide });
  const soleMat = new THREE.MeshStandardMaterial({ color: '#2a1d1a', roughness: 0.6 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#c98b62', roughness: 0.52 });
  const capMat = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.5 });

  const xs = spread(-0.124, 0.134, 64);
  // the sole: a thin dark strip under the shoe
  const sole = loft(
    xs.map((x) => ({ p: V(x, heelSoleY(x)), w: lerpTable(HEEL_W, x), h: 0.006, n: 6 })),
    { seg: 24 },
  );
  root.add(mesh(sole, soleMat, 'Sole'));

  // the foot inside: from the back of the heel (on the seat) to the toes
  const footTop = (x) => 0.006 + heelSoleY(x);
  const footXs = spread(-0.121, 0.104, 48);
  const FOOT_W = [
    [-0.121, 0.006],
    [-0.116, 0.019],
    [-0.1, 0.024],
    [-0.04, 0.023],
    [0.02, 0.031],
    [0.06, 0.034],
    [0.085, 0.029],
    [0.1, 0.017],
    [0.104, 0.006],
  ];
  const FOOT_H = [
    [-0.121, 0.012],
    [-0.116, 0.046],
    [-0.095, 0.07],
    [-0.06, 0.078],
    [-0.02, 0.06],
    [0.02, 0.042],
    [0.06, 0.03],
    [0.09, 0.022],
    [0.104, 0.008],
  ];
  const foot = loft(
    footXs.map((x) => ({ p: V(x, footTop(x)), w: lerpTable(FOOT_W, x), h: lerpTable(FOOT_H, x), n: 2.3 })),
    { seg: 36 },
  );
  root.add(mesh(foot, skinMat, 'Foot'));

  // the shoe's upper: round the foot, closed over the toes, low at the sides of the arch, a cup round the heel
  const upXs = spread(-0.124, 0.134, 64);
  const UP_H = [
    [-0.124, 0.014],
    [-0.12, 0.05],
    [-0.1, 0.07],
    [-0.06, 0.078],
    [-0.02, 0.062],
    [0.02, 0.045],
    [0.06, 0.034],
    [0.1, 0.026],
    [0.124, 0.014],
    [0.134, 0.004],
  ];
  const OPEN = [
    [-0.124, 0.0],
    [-0.12, 1.15],
    [-0.1, 1.45],
    [-0.06, 2.05],
    [-0.02, 2.1],
    [0.025, 1.6],
    [0.042, 0.55],
    [0.05, 0],
  ];
  const upper = loft(
    upXs.map((x) => ({
      p: V(x, footTop(x) - 0.001),
      w: lerpTable(HEEL_W, x) + 0.002,
      h: lerpTable(UP_H, x) + 0.004,
      open: lerpTable(OPEN, x),
      n: 2.4,
    })),
    { seg: 40 },
  );
  root.add(mesh(upper, shoeMat, 'Upper'));
  root.add(mesh(upper, liningMat, 'Lining', { shadow: false }));

  // the heel's post: from under the seat down to its tip, thinner at the bottom, a black cap on the tip
  const postTop = V(HEEL.post - 0.004, HEEL.seat + 0.002);
  const postSt = [];
  for (const k of spread(0, 1, 16)) {
    const y = postTop.y * (1 - k);
    const x = HEEL.post - 0.004 * (1 - k) - 0.003 * Math.sin(Math.PI * k);
    const w = 0.0165 - 0.0075 * smooth(0, 1, k ** 0.8);
    postSt.push({ p: V(x + w, y), w, h: 2 * w, n: 2.6 });
  }
  // a vertical path: the rings lie flat; their "bottom" is at +x, so the stations are shifted by w to centre them
  root.add(mesh(loft(postSt.reverse(), { seg: 28 }), shoeMat, 'HeelPost'));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0092, 0.009, 0.008, 28), capMat);
  cap.position.set(HEEL.post, 0.004, 0);
  cap.name = 'HeelTip';
  cap.castShadow = true;
  root.add(cap);

  // the leg: from the ankle up, into a magenta salwar with a golden border
  const ankle = V(-0.088, 0.105);
  const leg = tube(ankle, ankle.y, 0.95, (_k, y) => lerpTable(LEG_R, y - ankle.y - 0.03), { lean: 0.03 });
  root.add(mesh(leg, skinMat, 'Leg'));
  const cloth = canvasTexture(64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c2185b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2b632';
    ctx.fillRect(0, 0, w, 22);
    ctx.fillStyle = '#ffde7a';
    ctx.fillRect(0, 7, w, 4);
    ctx.fillStyle = '#a3124a';
    for (let y = 30; y < h; y += 26) ctx.fillRect(0, y, w, 2);
  });
  const salwarMat = new THREE.MeshStandardMaterial({ map: cloth, roughness: 0.85 });
  const salwar = tube(ankle, 0.37, 0.95, (k) => 0.064 + k * 0.02, { lean: 0.03, rows: 8 });
  root.add(mesh(salwar, salwarMat, 'Salwar'));

  const footprint = HEEL_FOOTPRINT;
  // the pressure arrows along the middle line: one on the heel's tip, three under the ball and toes
  const arrows = [HEEL_TIP.x, HEEL_PAD.x - 0.026, HEEL_PAD.x, HEEL_PAD.x + 0.026];
  return {
    root,
    footprint,
    arrows,
    /** Where the force on the shoe is drawn: down the leg onto the instep. */
    forceAt: V(-0.03, 0.11),
    /** A point on the sole for the area's label. */
    padAt: V(HEEL_PAD.x, 0, HEEL_PAD.b),
    tipAt: V(HEEL_TIP.x, 0, 0),
    body: [sole, foot, upper],
    meshes: root.children,
  };
}

// ── the sneaker ──────────────────────────────────────────────────────────────
// Flat under the whole sole, the toe and the back of the heel turned up a little.
export const SNEAKER = { from: -0.118, to: 0.105 };
export function sneakerSoleY(x) {
  if (x < -0.11) return (x + 0.11) ** 2 * 18;
  if (x > 0.095) return (x - 0.095) ** 2 * 22;
  return 0;
}
// half the width of the sole where it touches the clay (m) along the shoe
const SNEAKER_W = [
  [-0.136, 0.0064],
  [-0.13, 0.0277],
  [-0.118, 0.0372],
  [-0.09, 0.0415],
  [-0.045, 0.0372],
  [-0.005, 0.0415],
  [0.045, 0.05],
  [0.085, 0.0479],
  [0.112, 0.0372],
  [0.13, 0.0213],
  [0.138, 0.0043],
];
export const SNEAKER_FOOTPRINT = {
  sdf(x, z) {
    const w = lerpTable(SNEAKER_W, x);
    return Math.max(Math.abs(z) - w, SNEAKER.from - x, x - SNEAKER.to - 0.012);
  },
  box: { x0: SNEAKER.from - 0.02, x1: SNEAKER.to + 0.03, z: 0.07 },
  shapes() {
    const sh = new THREE.Shape();
    const xs = spread(SNEAKER.from, SNEAKER.to + 0.012, 48);
    sh.moveTo(xs[0], 0);
    for (const x of xs) sh.lineTo(x, lerpTable(SNEAKER_W, x));
    for (const x of [...xs].reverse()) sh.lineTo(x, -lerpTable(SNEAKER_W, x));
    sh.closePath();
    return [sh];
  },
};
const MID_H = [
  [-0.138, 0.02],
  [-0.12, 0.03],
  [-0.06, 0.029],
  [0.04, 0.022],
  [0.11, 0.02],
  [0.138, 0.016],
];

export function createSneaker() {
  const root = new THREE.Group();
  root.name = 'Sneaker';
  const xs = spread(-0.138, 0.138, 70);
  const outsoleMat = new THREE.MeshStandardMaterial({ color: '#1d2b5c', roughness: 0.75 });
  const midMat = new THREE.MeshStandardMaterial({ color: '#f6efe2', roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#8a5434', roughness: 0.5 });
  // the upper: sunflower yellow canvas with a navy swoosh on each side and a navy toe cap stripe
  const upperTex = canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffc61a';
    ctx.fillRect(0, 0, w, h);
    // a fine canvas weave
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#7a4a00';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    for (let x = 0; x < w; x += 3) ctx.fillRect(x, 0, 1, h);
    ctx.globalAlpha = 1;
    // the swoosh on each side (v = 0.25 and 0.75 are the two sides where the ring is closed)
    for (const v of [0.27, 0.73]) {
      ctx.fillStyle = '#1d2b5c';
      ctx.beginPath();
      const y = v * h;
      const dir = v < 0.5 ? 1 : -1;
      ctx.moveTo(w * 0.3, y - dir * 4);
      ctx.quadraticCurveTo(w * 0.55, y + dir * 26, w * 0.86, y - dir * 22);
      ctx.quadraticCurveTo(w * 0.58, y + dir * 6, w * 0.3, y - dir * 4);
      ctx.fill();
    }
    // a navy band round the bottom of the upper
    ctx.fillStyle = '#1d2b5c';
    ctx.fillRect(0, h * 0.47, w, h * 0.06);
  });
  const upperMat = new THREE.MeshStandardMaterial({ map: upperTex, roughness: 0.8 });
  const navyMat = new THREE.MeshStandardMaterial({ color: '#1d2b5c', roughness: 0.7 });
  const laceMat = new THREE.MeshStandardMaterial({ color: '#fff4dc', roughness: 0.6 });
  const liningMat = new THREE.MeshStandardMaterial({ color: '#2b3a6e', roughness: 0.9, side: THREE.BackSide });

  const outsole = loft(
    xs.map((x) => ({ p: V(x, sneakerSoleY(x)), w: lerpTable(SNEAKER_W, x) + 0.002, h: 0.008, n: 5 })),
    { seg: 28 },
  );
  root.add(mesh(outsole, outsoleMat, 'Outsole'));
  const midsole = loft(
    xs.map((x) => ({ p: V(x, sneakerSoleY(x) + 0.006), w: lerpTable(SNEAKER_W, x) + 0.004, h: lerpTable(MID_H, x) - 0.006, n: 5 })),
    { seg: 28 },
  );
  root.add(mesh(midsole, midMat, 'Midsole'));

  // the upper: closed over the toes and the instep, open round the ankle at the back (the collar)
  const midTop = (x) => sneakerSoleY(x) + lerpTable(MID_H, x) - 0.004;
  const UP_H = [
    [-0.136, 0.02],
    [-0.13, 0.062],
    [-0.11, 0.074],
    [-0.07, 0.08],
    [-0.03, 0.083],
    [0.02, 0.064],
    [0.07, 0.048],
    [0.11, 0.036],
    [0.13, 0.024],
    [0.138, 0.008],
  ];
  const OPEN = [
    [-0.136, 0],
    [-0.13, 0.5],
    [-0.11, 0.85],
    [-0.07, 1.0],
    [-0.045, 0.75],
    [-0.03, 0],
  ];
  const upXs = spread(-0.136, 0.138, 64);
  const upper = loft(
    upXs.map((x) => ({ p: V(x, midTop(x)), w: lerpTable(SNEAKER_W, x) - 0.001, h: lerpTable(UP_H, x), open: lerpTable(OPEN, x), n: 2.6 })),
    { seg: 44 },
  );
  root.add(mesh(upper, upperMat, 'Upper'));
  root.add(mesh(upper, liningMat, 'Lining', { shadow: false }));

  // the tongue and the laces over the instep
  const topAt = (x) => midTop(x) + lerpTable(UP_H, x);
  const tongue = loft(
    spread(-0.062, 0.035, 20).map((x) => ({ p: V(x, topAt(x) - 0.008 + Math.max(0, -0.03 - x) * 0.55), w: 0.019, h: 0.011, n: 3 })),
    { seg: 20 },
  );
  root.add(mesh(tongue, navyMat, 'Tongue'));
  const laceGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 10);
  laceGeo.rotateX(Math.PI / 2);
  for (const x of spread(-0.026, 0.04, 6)) {
    const lace = new THREE.Mesh(laceGeo, laceMat);
    lace.name = 'Lace';
    const y = topAt(x) + 0.004;
    lace.position.set(x, y, 0);
    lace.scale.set(1, 1, lerpTable(SNEAKER_W, x) * 1.25);
    lace.rotation.y = 0.18;
    lace.castShadow = true;
    root.add(lace);
  }
  // a navy tab at the back of the collar
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.02), navyMat);
  tab.position.set(-0.137, midTop(-0.136) + 0.064, 0);
  tab.rotation.z = -0.15;
  tab.name = 'HeelTab';
  root.add(tab);

  // the leg: an ankle sock with stripes, then the shin, then rolled-up blue jeans
  const ankle = V(-0.072, 0.05);
  const leg = tube(ankle, 0.06, 0.95, (_k, y) => lerpTable(LEG_R, y - 0.075) * 1.04, { lean: 0.02 });
  root.add(mesh(leg, skinMat, 'Leg'));
  const sockTex = canvasTexture(64, 128, (ctx, w, h) => {
    ctx.fillStyle = '#fbf3e4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d6336c';
    ctx.fillRect(0, h * 0.62, w, h * 0.1);
    ctx.fillStyle = '#1d2b5c';
    ctx.fillRect(0, h * 0.78, w, h * 0.08);
  });
  const sock = tube(ankle, 0.055, 0.135, (_k, y) => lerpTable(LEG_R, y - 0.075) * 1.04 + 0.003, { lean: 0.02, rows: 6 });
  root.add(mesh(sock, new THREE.MeshStandardMaterial({ map: sockTex, roughness: 0.9 }), 'Sock'));
  const denim = canvasTexture(
    128,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#2c4f8f';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(10,20,50,0.12)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1);
      }
      // the rolled-up cuff: lighter, with a seam
      ctx.fillStyle = '#6f93cf';
      ctx.fillRect(0, 0, w, 40);
      ctx.fillStyle = '#e8a33a';
      ctx.fillRect(0, 38, w, 2);
    },
    {},
  );
  const jeans = tube(ankle, 0.31, 0.95, (k) => 0.066 + k * 0.016, { lean: 0.02, rows: 8 });
  root.add(mesh(jeans, new THREE.MeshStandardMaterial({ map: denim, roughness: 0.92 }), 'Jeans'));

  const footprint = SNEAKER_FOOTPRINT;
  // the pressure arrows along the middle line, evenly under the whole sole
  const arrows = spread(SNEAKER.from + 0.012, SNEAKER.to - 0.004, 9);
  return {
    root,
    footprint,
    arrows,
    forceAt: V(-0.0, 0.1),
    padAt: V(0.03, 0, 0.045),
    tipAt: null,
    body: [outsole, midsole, upper],
    meshes: root.children,
  };
}

/** The area inside a footprint (cm²), counted on a fine grid (for the tests: it should match SHOES in reading.js). */
export function footprintArea(fp, step = 0.0005) {
  let n = 0;
  for (let x = fp.box.x0; x <= fp.box.x1; x += step) for (let z = -fp.box.z; z <= fp.box.z; z += step) if (fp.sdf(x, z) < 0) n++;
  return n * step * step * 10000;
}
