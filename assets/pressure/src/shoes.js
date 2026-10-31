// The two feet that press on the clay (procedural, metres). Each foot's own frame: x along the shoe (the toe at +x),
// y up, z across; y = 0 is the bottom of the sole where it touches the ground. Each also says where it touches the
// ground (its footprint, a signed distance in the ground plane, for the clay to give way under it) and where along its
// middle line the pressure arrows go.
//   a high heel: a woman's foot in a glossy cobalt pump with a pointed toe and a slim heel, a magenta salwar with a
//   golden border down to the ankle; it touches with the front of the sole and the heel's tip;
//   a flat sneaker: white with a yellow stripe and navy trim, criss-cross laces, a man's blue jeans down over its
//   collar; it touches with the whole sole.
// Bodies are built from rings (src/surface.js) and painted per vertex, so they are smooth and have no seams.
import * as THREE from 'three';
import { body, column, lerpTable, openFor, rim, ringAt, roundEnds, spread, tube } from './surface.js';

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** A small canvas texture. */
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** A seeded random number generator, so the cloth looks the same every time. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mesh = (geo, mat, name, { shadow = true } = {}) => {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
};

/** The radius of a lower leg at height y above the ankle bone (m). */
const LEG_R = [
  [0, 0.03],
  [0.06, 0.03],
  [0.14, 0.037],
  [0.26, 0.047],
  [0.34, 0.049],
  [0.46, 0.043],
  [0.6, 0.046],
  [1, 0.05],
];

// ── the high heel ────────────────────────────────────────────────────────────
// The bottom of its sole: high on the heel's post, an S down the arch, flat under the ball and toes, the tip lifted.
export const HEEL = { seat: 0.083, post: -0.097, padFrom: 0.03, padTo: 0.106 };
export function heelSoleY(x) {
  if (x <= -0.074) return HEEL.seat;
  if (x >= HEEL.padFrom) return x > HEEL.padTo ? (x - HEEL.padTo) ** 2 * 9 : 0;
  const k = (x + 0.074) / (HEEL.padFrom + 0.074);
  return HEEL.seat * (1 - smooth(0, 1, k) ** 0.85);
}
/** Half the width of the pump's sole along it (m): a round heel cup, a narrow waist, the ball, a pointed toe. */
const HEEL_W = [
  [-0.125, 0.004],
  [-0.122, 0.016],
  [-0.115, 0.024],
  [-0.095, 0.027],
  [-0.06, 0.024],
  [-0.02, 0.025],
  [0.02, 0.033],
  [0.055, 0.0375],
  [0.08, 0.036],
  [0.1, 0.029],
  [0.118, 0.018],
  [0.13, 0.008],
  [0.136, 0.002],
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
// the shoe's last: how high it stands over the insole, and how high its sides come up (the topline)
const PUMP_H = [
  [-0.125, 0.03],
  [-0.12, 0.058],
  [-0.1, 0.072],
  [-0.06, 0.078],
  [-0.02, 0.066],
  [0.02, 0.05],
  [0.05, 0.039],
  [0.08, 0.03],
  [0.105, 0.021],
  [0.125, 0.012],
  [0.136, 0.004],
];
const PUMP_TOP = [
  [-0.125, 0.046],
  [-0.115, 0.054],
  [-0.095, 0.046],
  [-0.07, 0.03],
  [-0.04, 0.022],
  [-0.005, 0.021],
  [0.02, 0.028],
  [0.034, 0.042],
  [0.042, 0.06],
];
// the foot: the top of the skin, from the toes over the instep up to the ankle (m above the ground)
const FOOT_TOP = [
  [-0.121, 0.11],
  [-0.112, 0.162],
  [-0.095, 0.176],
  [-0.075, 0.172],
  [-0.055, 0.152],
  [-0.035, 0.124],
  [-0.015, 0.096],
  [0.005, 0.072],
  [0.025, 0.052],
  [0.05, 0.04],
  [0.08, 0.031],
  [0.1, 0.022],
  [0.112, 0.012],
];

export function createHeelShoe() {
  const root = new THREE.Group();
  root.name = 'HighHeel';
  const patent = new THREE.MeshPhysicalMaterial({ color: '#1640c8', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06 });
  const lining = new THREE.MeshStandardMaterial({ color: '#e7b49a', roughness: 0.75 });
  const soleMat = new THREE.MeshStandardMaterial({ color: '#24160f', roughness: 0.55 });
  const skin = new THREE.MeshStandardMaterial({ color: '#9a5634', roughness: 0.48 });
  const tipMat = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.5 });
  const W = (x) => lerpTable(HEEL_W, x);

  // the sole: a thin dark layer under the whole shoe, up the arch to under the heel cup
  const sole = body(spread(-0.1255, 0.1365, 90), (x) => ({ y: heelSoleY(x), w: W(x) + 0.0008, h: 0.0055, taper: 0.98, nt: 6, nb: 6 }), { seg: 40 });
  root.add(mesh(sole.geometry, soleMat, 'Sole'));

  // the foot inside: from the heel over the instep to the toes; the leg goes up from its ankle
  const footY = (x) => heelSoleY(x) + 0.0055;
  const foot = body(
    spread(-0.1215, 0.1125, 90),
    (x) => ({
      y: footY(x),
      w: Math.max(0.002, W(x) - 0.0022) * roundEnds(x, -0.1215, 0.1125, 0.006, 0.012),
      h: Math.max(0.002, lerpTable(FOOT_TOP, x) - footY(x)),
      taper: 0.5,
      nt: 2.1,
      nb: 3,
    }),
    { seg: 48 },
  );
  root.add(mesh(foot.geometry, skin, 'Foot'));
  const ankle = V(-0.084, 0.13);
  const leg = tube(ankle, 0.13, 0.95, (_k, y) => lerpTable(LEG_R, y - 0.13), { lean: 0.03 });
  root.add(mesh(leg, skin, 'Leg'));

  // the pump: a glossy shell round the last, its sides cut down to the topline; a nude lining inside; a rolled edge
  const shellXs = spread(-0.1252, 0.1362, 110);
  const pump = (x) => {
    const sec = { y: heelSoleY(x) + 0.0048, w: W(x) + 0.0016, h: lerpTable(PUMP_H, x), taper: 0.72, nt: 2.0, nb: 3.4 };
    return { ...sec, open: openFor(sec, lerpTable(PUMP_TOP, x)) };
  };
  const outer = body(shellXs, pump, { seg: 64 });
  const inner = body(shellXs, pump, { seg: 64, inset: 0.0013, flip: true });
  root.add(mesh(outer.geometry, patent, 'Upper'));
  root.add(mesh(inner.geometry, lining, 'Lining', { shadow: false }));
  const edge = new THREE.Mesh(
    rim(outer.rows, inner.rows),
    new THREE.MeshPhysicalMaterial({ color: '#1640c8', roughness: 0.3, clearcoat: 1, side: THREE.DoubleSide }),
  );
  edge.name = 'TopEdge';
  root.add(edge);

  // the heel: a slim post under the heel cup, its back nearly straight, its front curved in, a black tip
  const seatTop = HEEL.seat + 0.004;
  const levels = spread(0, 1, 24).map((k) => ({
    x: -0.1012 + 0.0042 * k,
    y: seatTop * (1 - k) + 0.008 * k,
    rx: 0.0076 + 0.0128 * (1 - k) ** 2.2,
    rz: 0.0066 + 0.0104 * (1 - k) ** 1.8,
  }));
  const post = mesh(
    column(levels),
    new THREE.MeshPhysicalMaterial({ color: '#1640c8', roughness: 0.22, clearcoat: 1, side: THREE.DoubleSide }),
    'HeelPost',
  );
  root.add(post);
  const tipGeo = new THREE.CylinderGeometry(1, 0.95, 0.0085, 28);
  const tip = mesh(tipGeo, tipMat, 'HeelTip');
  tip.scale.set(0.0086, 1, 0.0078);
  tip.position.set(HEEL.post, 0.00425, 0);
  root.add(tip);

  // the salwar: magenta cotton with a golden embroidered border, gathered at the ankle, soft folds above
  const rand = rng(17);
  const cloth = canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c41a62';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(80,0,30,0.08)';
      ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 3);
    }
    // small white flowers printed on it
    ctx.fillStyle = 'rgba(255,240,245,0.7)';
    for (let y = 80; y < h; y += 34)
      for (let x = ((y / 34) % 2) * 16; x < w; x += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    // the border at the hem (the bottom of the texture is v = 0)
    const g = ctx.createLinearGradient(0, h - 60, 0, h);
    g.addColorStop(0, '#e0a526');
    g.addColorStop(0.5, '#ffd866');
    g.addColorStop(1, '#c98a14');
    ctx.fillStyle = g;
    ctx.fillRect(0, h - 58, w, 58);
    ctx.fillStyle = '#8e1048';
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, h - 46);
      ctx.lineTo(x + 8, h - 30);
      ctx.lineTo(x + 16, h - 46);
      ctx.fill();
    }
    ctx.fillStyle = '#8e1048';
    ctx.fillRect(0, h - 60, w, 3);
    ctx.fillRect(0, h - 10, w, 3);
  });
  cloth.flipY = true;
  const salwar = tube(
    ankle,
    (a) => 0.152 + 0.006 * Math.cos(a),
    0.95,
    (_k, y, a) => {
      const r = 0.047 + 0.032 * smooth(0.16, 0.45, y);
      return r * (1 + 0.035 * smooth(0.17, 0.3, y) * Math.sin(7 * a + y * 9));
    },
    { lean: 0.03, rows: 40, seg: 64 },
  );
  const salwarMat = new THREE.MeshStandardMaterial({ map: cloth, roughness: 0.9, side: THREE.DoubleSide });
  root.add(mesh(salwar, salwarMat, 'Salwar'));

  const footprint = HEEL_FOOTPRINT;
  // the pressure arrows along the middle line: one on the heel's tip, three under the ball and toes
  const arrows = [HEEL_TIP.x, HEEL_PAD.x - 0.026, HEEL_PAD.x, HEEL_PAD.x + 0.026];
  return {
    root,
    footprint,
    arrows,
    /** Where the force on the shoe is drawn: down onto the instep. */
    forceAt: V(-0.03, lerpTable(FOOT_TOP, -0.03) + 0.002),
    /** A point on the sole for the area's label. */
    padAt: V(HEEL_PAD.x, 0, HEEL_PAD.b),
    tipAt: V(HEEL_TIP.x, 0, 0),
    meshes: root.children,
  };
}

// ── the sneaker ──────────────────────────────────────────────────────────────
// Flat under the whole sole, the toe and the back of the heel turned up a little.
export const SNEAKER = { from: -0.118, to: 0.105 };
export function sneakerSoleY(x) {
  if (x < -0.11) return (x + 0.11) ** 2 * 10;
  if (x > 0.095) return (x - 0.095) ** 2 * 9;
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
// the sole's height (outsole and midsole together) and the upper's height over it
const SOLE_H = [
  [-0.14, 0.031],
  [-0.06, 0.029],
  [0.04, 0.023],
  [0.14, 0.021],
];
const UPPER_H = [
  [-0.138, 0.03],
  [-0.13, 0.05],
  [-0.11, 0.058],
  [-0.08, 0.061],
  [-0.05, 0.063],
  [-0.02, 0.062],
  [0.01, 0.056],
  [0.04, 0.048],
  [0.07, 0.04],
  [0.1, 0.031],
  [0.12, 0.022],
  [0.138, 0.008],
];
const EYE_TH = 0.46; // the eyelets: this angle each side of the top middle of the upper's rings
const LACE_X = spread(-0.03, 0.05, 5);

export function createSneaker() {
  const root = new THREE.Group();
  root.name = 'Sneaker';
  const SW = (x) => lerpTable(SNEAKER_W, x);
  const X0 = -0.1395;
  const X1 = 0.1395;
  const C = { white: new THREE.Color('#f6f3ee'), gum: new THREE.Color('#1b2a5e') };

  // the sole: a navy outsole and a white midsole in one, wrapping up a little at the toe and the heel
  const soleSec = (x) => {
    const e = roundEnds(x, X0, X1, 0.012, 0.018);
    return { y: sneakerSoleY(x), w: (SW(x) + 0.003) * e, h: lerpTable(SOLE_H, x) * (0.45 + 0.55 * e), taper: 0.96, nt: 7, nb: 6 };
  };
  const sole = body(spread(X0, X1, 110), soleSec, {
    seg: 56,
    color: (c, x, _th, k) => {
      const up = k * soleSec(x).h;
      c.copy(up < 0.0065 ? C.gum : C.white);
    },
  });
  root.add(mesh(sole.geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 }), 'Sole'));

  // the upper: white leather, a yellow stripe rising backwards along each side, navy round the laces and at the heel;
  // closed all round (the jeans come down over the collar)
  const soleTop = (x) => sneakerSoleY(x) + lerpTable(SOLE_H, x) - 0.0025;
  const upperSec = (x) => {
    const e = roundEnds(x, X0 + 0.0015, X1 - 0.0015, 0.012, 0.03);
    return { y: soleTop(x), w: (SW(x) + 0.0008) * e, h: lerpTable(UPPER_H, x) * (0.35 + 0.65 * e), taper: 0.5, nt: 2.3, nb: 3.2 };
  };
  const UX0 = X0 + 0.0015;
  const UX1 = X1 - 0.0015;
  const upper = body(spread(UX0, UX1, 130), upperSec, { seg: 72, uv: true });
  // its panels, painted in (u along the shoe, v from the top middle down each side): smooth edges, stitched
  const upperTex = canvasTexture(1024, 512, (ctx, w, h) => {
    const U = (x) => ((x - UX0) / (UX1 - UX0)) * w;
    ctx.fillStyle = '#f6f3ee';
    ctx.fillRect(0, 0, w, h);
    // a faint leather grain
    const r = rng(4);
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.5)';
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
    const stitch = (path) => {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(40,40,60,0.45)';
      path();
      ctx.stroke();
      ctx.restore();
    };
    // the heel counter: navy, its front edge curving forward at the bottom
    const heel = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(U(-0.112), 0);
      ctx.bezierCurveTo(U(-0.1), h * 0.35, U(-0.096), h * 0.7, U(-0.078), h);
      ctx.lineTo(0, h);
      ctx.closePath();
    };
    ctx.fillStyle = '#1b2a5e';
    heel();
    ctx.fill();
    stitch(() => {
      ctx.beginPath();
      ctx.moveTo(U(-0.108), 0);
      ctx.bezierCurveTo(U(-0.096), h * 0.35, U(-0.092), h * 0.7, U(-0.074), h);
    });
    // the toe bumper: cream, low round the toe
    ctx.fillStyle = '#ece2cf';
    ctx.beginPath();
    ctx.moveTo(w, h * 0.55);
    ctx.bezierCurveTo(U(0.12), h * 0.78, U(0.1), h * 0.86, U(0.085), h);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    // the stripe: a yellow sweep along each side, thin at the toe, rising and widening to the back, outlined in navy
    const sweep = () => {
      ctx.beginPath();
      ctx.moveTo(U(0.088), h * 0.74);
      ctx.bezierCurveTo(U(0.04), h * 0.7, U(-0.02), h * 0.52, U(-0.078), h * 0.36);
      ctx.lineTo(U(-0.084), h * 0.55);
      ctx.bezierCurveTo(U(-0.03), h * 0.7, U(0.03), h * 0.78, U(0.088), h * 0.74);
      ctx.closePath();
    };
    ctx.fillStyle = '#ffb703';
    sweep();
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1b2a5e';
    sweep();
    ctx.stroke();
    // round the laces: a navy eyestay on each side and the tongue between them
    ctx.fillStyle = '#1b2a5e';
    ctx.beginPath();
    ctx.moveTo(U(-0.075), 0);
    ctx.lineTo(U(0.05), 0);
    ctx.bezierCurveTo(U(0.068), 0, U(0.072), h * 0.1, U(0.066), h * 0.2);
    ctx.lineTo(U(-0.075), h * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2d4f96';
    ctx.fillRect(0, 0, U(0.056), h * 0.075);
    stitch(() => {
      ctx.beginPath();
      ctx.moveTo(U(-0.075), h * 0.215);
      ctx.lineTo(U(0.06), h * 0.185);
    });
    // a small yellow tab at the back of the collar
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(0, 0, U(-0.13), h * 0.12);
  });
  upperTex.wrapS = THREE.ClampToEdgeWrapping;
  upperTex.flipY = false; // canvas row 0 is v = 0, the top of the shoe
  root.add(mesh(upper.geometry, new THREE.MeshStandardMaterial({ map: upperTex, roughness: 0.55 }), 'Upper'));

  // the laces: criss-cross between the eyelets, a little above the tongue
  const eyelet = (x, side) => {
    const sec = upperSec(x);
    const [z, up] = ringAt(sec, side > 0 ? EYE_TH : Math.PI * 2 - EYE_TH);
    return V(x, sec.y + up + 0.0012, z);
  };
  const laceMat = new THREE.MeshStandardMaterial({ color: '#fffdf8', roughness: 0.65 });
  const ringMat = new THREE.MeshStandardMaterial({ color: '#c9ced8', roughness: 0.3, metalness: 0.8 });
  const span = (a, b, lift) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += lift;
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  };
  for (let i = 0; i < LACE_X.length; i++) {
    for (const side of [1, -1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0026, 0.0009, 6, 14), ringMat);
      ring.position.copy(eyelet(LACE_X[i], side));
      ring.rotation.x = Math.PI / 2 - side * 0.5;
      root.add(ring);
    }
    if (i === LACE_X.length - 1) break;
    for (const side of [1, -1]) {
      const a = eyelet(LACE_X[i], side);
      const b = eyelet(LACE_X[i + 1], -side);
      const lace = mesh(new THREE.TubeGeometry(span(a, b, 0.004), 12, 0.0017, 8), laceMat, 'Lace');
      root.add(lace);
    }
  }
  // a bow at the top lace: two loops and the ends
  const top = [eyelet(LACE_X[0], 1), eyelet(LACE_X[0], -1)];
  const knot = top[0]
    .clone()
    .add(top[1])
    .multiplyScalar(0.5)
    .add(V(0, 0.005, 0));
  for (const s of [1, -1]) {
    const loop = new THREE.CatmullRomCurve3([knot, knot.clone().add(V(-0.008, 0.006, s * 0.012)), knot.clone().add(V(0.004, 0.009, s * 0.02)), knot]);
    root.add(mesh(new THREE.TubeGeometry(loop, 16, 0.0017, 8), laceMat, 'Bow'));
    const end = new THREE.CatmullRomCurve3([knot, knot.clone().add(V(0.012, -0.004, s * 0.008)), knot.clone().add(V(0.02, -0.012, s * 0.016))]);
    root.add(mesh(new THREE.TubeGeometry(end, 10, 0.0016, 8), laceMat, 'LaceEnd'));
  }

  // the jeans: indigo denim down over the shoe's collar, the hem a little lower at the back, with a slight break
  const rand = rng(9);
  const denim = canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#284a8a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(5,15,45,0.13)';
      ctx.fillRect(rand() * w, rand() * h, 1, 2 + rand() * 3);
    }
    // the outer seam's orange stitching and the hem's
    ctx.fillStyle = 'rgba(232,150,50,0.9)';
    for (let y = 0; y < h; y += 7) ctx.fillRect(w * 0.25, y, 2, 4);
    for (let x = 0; x < w; x += 7) ctx.fillRect(x, h - 22, 4, 2);
  });
  const ankle = V(-0.076, 0.07);
  const jeans = tube(
    ankle,
    (a) => 0.07 + 0.013 * Math.cos(a),
    0.95,
    (_k, y, a) => {
      const r = 0.06 + 0.012 * smooth(0.1, 0.6, y);
      // the break: soft folds just above the shoe
      return r * (1 + 0.04 * (1 - smooth(0.08, 0.2, y)) * Math.sin(5 * a + y * 40) + 0.015 * Math.sin(9 * a + y * 7));
    },
    { lean: 0.02, rows: 44, seg: 64 },
  );
  const jeansMat = new THREE.MeshStandardMaterial({ map: denim, roughness: 0.95, side: THREE.DoubleSide });
  root.add(mesh(jeans, jeansMat, 'Jeans'));

  const footprint = SNEAKER_FOOTPRINT;
  // the pressure arrows along the middle line, evenly under the whole sole
  const arrows = spread(SNEAKER.from + 0.012, SNEAKER.to - 0.004, 9);
  return {
    root,
    footprint,
    arrows,
    forceAt: V(0.0, soleTop(0) + lerpTable(UPPER_H, 0) + 0.008),
    padAt: V(0.03, 0, 0.045),
    tipAt: null,
    meshes: root.children,
  };
}

/** The area inside a footprint (cm²), counted on a fine grid (for the tests: it should match SHOES in reading.js). */
export function footprintArea(fp, step = 0.0005) {
  let n = 0;
  for (let x = fp.box.x0; x <= fp.box.x1; x += step) for (let z = -fp.box.z; z <= fp.box.z; z += step) if (fp.sdf(x, z) < 0) n++;
  return n * step * step * 10000;
}
