// The things in the water, built from simple shapes (metres): the cargo ship, the "ghost" of the water it pushes
// aside, a solid steel cylinder of the ship's own mass and the spring balance that weighs them.
//
// The ship's group has its keel at y = 0, the flat stern (transom) at x = +14 and the bow's tip at x = −14; the app
// moves the group down by the draft h, so the water's surface (y = 0 of the world) crosses the hull at y = h. Below the
// deck the hull is a prism (src/reading.js): straight sides, a flat bottom, the bow pointed only when seen from above,
// so the water it pushes aside at any depth is exactly A × h. Paint: anti-fouling red up to the load line (2.5 m), a
// white line there, navy above; the load-line (Plimsoll) mark amidships and draft marks near the stern, on the side
// the camera sees (−z) and on the transom.
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { textMesh } from '@shared/student/materials.js';
import { HULL, LOAD_LINE, MAX_CONTAINERS, STEEL, hullOutline } from './reading.js';

const DECK = HULL.depth; // the deck's height above the keel (4 m)
const BULWARK = 0.9; // the wall round the deck
/** The top of the hull's side: a little higher towards the bow (the sheer). */
const sheer = (x) => DECK + BULWARK + 0.95 * smooth(-3.5, -14, x);
function smooth(a, b, x) {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

/** Outward normals of an outline (x, z) going round anticlockwise: one per segment. */
function segmentNormals(pts) {
  return pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const dx = q[0] - p[0];
    const dz = q[1] - p[1];
    const l = Math.hypot(dx, dz) || 1;
    return [dz / l, -dx / l];
  });
}

/** The outline moved in (d < 0) or out (d > 0) along its normals (smooth at gentle bends, mitred at corners). */
function offsetOutline(pts, d) {
  const ns = segmentNormals(pts);
  return pts.map((p, i) => {
    const a = ns[(i - 1 + pts.length) % pts.length];
    const b = ns[i];
    let nx = a[0] + b[0];
    let nz = a[1] + b[1];
    const l = Math.hypot(nx, nz) || 1;
    nx /= l;
    nz /= l;
    const cos = Math.max(0.35, nx * b[0] + nz * b[1]);
    return [p[0] + (nx * d) / cos, p[1] + (nz * d) / cos];
  });
}

/**
 * A wall standing on an outline, from y0 to y1 (numbers, or functions of x), facing out (or in with `inward`). Normals
 * are smooth along the bow's curve and sharp at the stern's corners.
 */
function wallGeometry(pts, y0, y1, { inward = false } = {}) {
  const lo = typeof y0 === 'function' ? y0 : () => y0;
  const hi = typeof y1 === 'function' ? y1 : () => y1;
  const ns = segmentNormals(pts);
  const n = pts.length;
  const vnormal = (i, seg) => {
    // the normal at point i for segment seg: averaged with the neighbour unless the bend is sharp
    const other = seg === i ? ns[(i - 1 + n) % n] : ns[(i + 1) % n];
    const own = ns[seg];
    if (own[0] * other[0] + own[1] * other[1] < 0.8) return own;
    const x = own[0] + other[0];
    const z = own[1] + other[1];
    const l = Math.hypot(x, z) || 1;
    return [x / l, z / l];
  };
  const pos = [];
  const nor = [];
  const uv = [];
  let run = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = pts[i];
    const b = pts[j];
    const na = vnormal(i, i);
    const nb = vnormal(j, i);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const A0 = [a[0], lo(a[0]), a[1]];
    const A1 = [a[0], hi(a[0]), a[1]];
    const B0 = [b[0], lo(b[0]), b[1]];
    const B1 = [b[0], hi(b[0]), b[1]];
    const s = inward ? -1 : 1;
    const NA = [na[0] * s, 0, na[1] * s];
    const NB = [nb[0] * s, 0, nb[1] * s];
    const tri = inward
      ? [
          [A0, NA, run, A0[1]],
          [B1, NB, run + len, B1[1]],
          [A1, NA, run, A1[1]],
          [A0, NA, run, A0[1]],
          [B0, NB, run + len, B0[1]],
          [B1, NB, run + len, B1[1]],
        ]
      : [
          [A0, NA, run, A0[1]],
          [A1, NA, run, A1[1]],
          [B1, NB, run + len, B1[1]],
          [A0, NA, run, A0[1]],
          [B1, NB, run + len, B1[1]],
          [B0, NB, run + len, B0[1]],
        ];
    for (const [p, nn, u, v] of tri) {
      pos.push(...p);
      nor.push(...nn);
      uv.push(u, v);
    }
    run += len;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** A flat face filling an outline at height y, facing up (or down). */
function capGeometry(pts, y, { down = false } = {}) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, down ? z : -z)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(down ? Math.PI / 2 : -Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/** A strip between two outlines (the rail on top of the wall), at heights given by y(x). */
function ringGeometry(outer, inner, y) {
  const pos = [];
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length;
    const o0 = [outer[i][0], y(outer[i][0]), outer[i][1]];
    const o1 = [outer[j][0], y(outer[j][0]), outer[j][1]];
    const i0 = [inner[i][0], y(inner[i][0]), inner[i][1]];
    const i1 = [inner[j][0], y(inner[j][0]), inner[j][1]];
    pos.push(...o0, ...i1, ...o1, ...o0, ...i0, ...i1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

const paint = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });

/** Stripes for the containers' corrugated sides (white and grey, tinted by the material's colour). */
let ribTexture = null;
function ribs() {
  if (ribTexture) return ribTexture;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 8;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  for (let x = 0; x < 64; x++) {
    const k = 0.78 + 0.22 * Math.cos((x / 64) * Math.PI * 2 * 4);
    const v = Math.round(255 * k);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, 0, 1, 8);
  }
  ribTexture = new THREE.CanvasTexture(c);
  ribTexture.colorSpace = THREE.SRGBColorSpace;
  ribTexture.wrapS = THREE.RepeatWrapping;
  ribTexture.repeat.set(3, 1);
  return ribTexture;
}

/** Container sizes (a 20-foot box) and the slots on the deck, in the order they are loaded. */
export const BOX = { x: 6.06, y: 2.59, z: 2.44 };
const SLOTS = (() => {
  const xs = [9.9, 3.4];
  const order = [
    [0, 0],
    [1, 0],
    [0, -2.5],
    [0, 2.5],
    [1, -2.5],
    [1, 2.5],
  ];
  const out = [];
  for (const tier of [0, 1]) for (const [i, z] of order) out.push(new THREE.Vector3(xs[i], DECK + BOX.y * (tier + 0.5), z));
  return out.slice(0, MAX_CONTAINERS);
})();
const BOX_COLORS = [
  '#1971c2',
  '#f2b705',
  '#c92a2a',
  '#2b8a3e',
  '#0b7285',
  '#dfe3e8',
  '#364fc7',
  '#e0a100',
  '#a61e4d',
  '#1864ab',
  '#5c940d',
  '#d9480f',
];

/** @param {{ N: (x: any) => string }} options N: digits for the draft marks (Bangla or Latin). */
export function createShip({ N }) {
  const root = new THREE.Group();
  root.name = 'Ship';
  const pts = hullOutline(16);
  const inner = offsetOutline(pts, -0.16);

  const red = paint('#b8262b', { roughness: 0.7 });
  const white = paint('#f4f1ea');
  const navy = paint('#1f3768', { roughness: 0.45, metalness: 0.12 });
  const deckPaint = paint('#7b8a84', { roughness: 0.85 });
  const bulwarkIn = paint('#e9e6df', { roughness: 0.7 });
  const hull = new THREE.Group();
  hull.name = 'Hull';
  const add = (geo, mat, name, parent = hull) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  // the outside: red below the load line, a white line, navy up to the rail
  add(wallGeometry(pts, 0, LOAD_LINE), red, 'HullBottomPaint');
  add(wallGeometry(pts, LOAD_LINE, LOAD_LINE + 0.1), white, 'HullLoadLinePaint');
  add(wallGeometry(pts, LOAD_LINE + 0.1, sheer), navy, 'HullTopsides');
  add(capGeometry(pts, 0, { down: true }), red, 'HullBottom');
  // the deck inside the wall, the wall's inside and its rail
  add(capGeometry(inner, DECK), deckPaint, 'Deck');
  add(wallGeometry(inner, DECK, sheer, { inward: true }), bulwarkIn, 'BulwarkInside');
  add(ringGeometry(pts, inner, sheer), white, 'Rail');
  root.add(hull);

  // ── the deckhouse and the bridge, near the bow; funnels; a mast ──────────────
  const house = new THREE.Group();
  house.name = 'Superstructure';
  const box = (sx, sy, sz, x, y, z, mat, name) => {
    const m = add(new THREE.BoxGeometry(sx, sy, sz), mat, name, house);
    m.position.set(x, y, z);
    return m;
  };
  const houseWhite = paint('#f7f5f0', { roughness: 0.5 });
  const glass = paint('#173a5c', { roughness: 0.15, metalness: 0.4 });
  const funnelRed = paint('#d6402f');
  const black = paint('#1d1f22');
  const yellow = paint('#f2b705');
  box(6.5, 2.6, 6.8, -6.75, DECK + 1.3, 0, houseWhite, 'Deckhouse');
  box(4.6, 2.4, 6.4, -7.2, DECK + 3.8, 0, houseWhite, 'Bridge');
  box(5.2, 0.22, 9.0, -7.0, DECK + 5.1, 0, houseWhite, 'BridgeRoof');
  box(0.06, 0.9, 5.6, -4.88, DECK + 4.0, 0, glass, 'BridgeWindows');
  for (const z of [-2.2, -0.75, 0.75, 2.2]) box(0.06, 0.55, 0.9, -3.47, DECK + 1.6, z, glass, 'Porthole');
  for (const z of [-2.6, 2.6]) {
    const f = add(new THREE.CylinderGeometry(0.5, 0.58, 2.8, 20), funnelRed, 'Funnel', house);
    f.position.set(-4.45, DECK + 4.0, z);
    const top = add(new THREE.CylinderGeometry(0.51, 0.51, 0.45, 20), black, 'FunnelTop', house);
    top.position.set(-4.45, DECK + 5.6, z);
    const ring = add(new THREE.TorusGeometry(0.36, 0.09, 8, 20), paint('#f76707'), 'Lifebuoy', house);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-3.43, DECK + 0.95, z * 0.9);
  }
  const mast = add(new THREE.CylinderGeometry(0.12, 0.14, 3.4, 10), houseWhite, 'Mast', house);
  mast.position.set(-7.4, DECK + 6.9, 0);
  box(0.25, 0.2, 2.6, -7.4, DECK + 7.6, 0, black, 'Radar');
  box(0.3, 0.3, 0.3, -7.4, DECK + 8.7, 0, yellow, 'MastLight');
  // a small mast on the bow
  const fore = add(new THREE.CylinderGeometry(0.09, 0.11, 2.6, 8), houseWhite, 'ForeMast', house);
  fore.position.set(-11.5, sheer(-11.5) + 1.2, 0);
  root.add(house);

  // ── paint marks: the load line (Plimsoll mark) amidships and draft marks ────
  const markMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const marks = new THREE.Group();
  marks.name = 'Marks';
  const side = -HULL.beam / 2 - 0.012; // the side the camera sees
  const plimsoll = new THREE.Group();
  plimsoll.name = 'LoadLineMark';
  plimsoll.add(new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 48), markMat));
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.12), markMat);
  plimsoll.add(bar);
  const deckLine = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.12), markMat);
  deckLine.position.y = DECK - 0.06 - LOAD_LINE;
  plimsoll.add(deckLine);
  plimsoll.position.set(2.4, LOAD_LINE, side);
  plimsoll.rotation.y = Math.PI; // facing −z
  marks.add(plimsoll);
  /** Draft marks: ticks every 0.5 m, numbers at whole metres (on the side near the stern, and on the transom). */
  function draftScale(name, place) {
    const g = new THREE.Group();
    g.name = name;
    for (let y = 0.5; y <= 3.5 + 1e-9; y += 0.5) {
      const whole = Math.abs(y - Math.round(y)) < 1e-6;
      const tick = new THREE.Mesh(new THREE.PlaneGeometry(whole ? 0.5 : 0.3, 0.07), markMat);
      tick.position.set(whole ? 0 : -0.1, y, 0);
      g.add(tick);
      if (whole) {
        const label = textMesh(N(String(Math.round(y))), 0.5, { color: '#ffffff', weight: 700 });
        label.position.set(0.62, y, 0);
        g.add(label);
      }
    }
    place(g);
    marks.add(g);
    return g;
  }
  draftScale('DraftMarksSide', (g) => {
    g.rotation.y = Math.PI;
    g.position.set(12.9, 0, side);
  });
  draftScale('DraftMarksStern', (g) => {
    g.rotation.y = Math.PI / 2;
    g.position.set(HULL.stern + 0.012, 0, -2.6);
  });
  root.add(marks);

  // ── containers ──────────────────────────────────────────────────────────────
  const boxGeo = new THREE.BoxGeometry(BOX.x, BOX.y, BOX.z);
  const containers = SLOTS.map((slot, i) => {
    const m = new THREE.Mesh(boxGeo, paint(BOX_COLORS[i % BOX_COLORS.length], { map: ribs(), roughness: 0.6, metalness: 0.15 }));
    m.name = `Container${i + 1}`;
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.copy(slot);
    m.visible = false;
    root.add(m);
    return m;
  });

  return {
    root,
    hull,
    containers,
    slots: SLOTS,
    plimsoll,
    /** Points on the ship (its own coordinates) the app hangs labels and arrows on. */
    spots: {
      loadLine: new THREE.Vector3(2.4 + 0.9, LOAD_LINE, side),
      draftSide: new THREE.Vector3(12.9, 0, side),
      draftStern: new THREE.Vector3(HULL.stern, 0, -2.6),
      deck: DECK,
      top: DECK + 2 * BOX.y,
      mast: DECK + 8.9,
    },
    /** Every mesh of the ship (for picking a tap). */
    meshes() {
      const list = [];
      root.traverse((o) => {
        if (/** @type {THREE.Mesh} */ (o).isMesh && o.visible) list.push(o);
      });
      return list;
    },
  };
}

/** The foam where the water meets the hull: a thin white band just outside the outline, at the water's level. */
export function createFoam() {
  const pts = offsetOutline(hullOutline(16), 0.05);
  const m = new THREE.Mesh(
    wallGeometry(pts, -0.04, 0.07),
    new THREE.MeshBasicMaterial({ color: '#f2fbff', transparent: true, opacity: 0.85, depthWrite: false, fog: false }),
  );
  m.name = 'Foam';
  m.renderOrder = 3;
  m.userData.noExport = true;
  return m;
}

/**
 * The water the hull pushes aside, as a solid of its own: the hull's outline from the keel up to the waterline (the
 * group is 1 m tall; the app scales it by h). Light, see-through water with bright edges.
 */
export function createGhost() {
  const root = new THREE.Group();
  root.name = 'DisplacedWater';
  const pts = offsetOutline(hullOutline(16), 0.04);
  const geo = new THREE.BufferGeometry();
  const parts = [wallGeometry(pts, 0, 1), capGeometry(pts, 1), capGeometry(pts, 0, { down: true })];
  const merged = mergeSimple(parts);
  geo.copy(merged);
  const material = new THREE.MeshStandardMaterial({
    color: '#7fdcff',
    emissive: '#1fa3d6',
    emissiveIntensity: 0.35,
    roughness: 0.2,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const body = new THREE.Mesh(geo, material);
  body.name = 'DisplacedWaterBody';
  body.renderOrder = 6;
  root.add(body);
  // its edges: the outline at the top and the bottom, the stern's corners
  const seg = [];
  for (const y of [0, 1])
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      seg.push(a[0], y, a[1], b[0], y, b[1]);
    }
  for (const p of [pts[0], pts[pts.length - 1]]) seg.push(p[0], 0, p[1], p[0], 1, p[1]);
  const lineGeo = new LineSegmentsGeometry().setPositions(seg);
  const lineMat = new LineMaterial({ color: '#ffffff', linewidth: 2.5, transparent: true, depthWrite: false });
  const edges = new LineSegments2(lineGeo, lineMat);
  edges.name = 'DisplacedWaterEdges';
  edges.renderOrder = 7;
  root.add(edges);
  root.visible = false;
  return {
    root,
    setOpacity(a) {
      material.opacity = 0.5 * a;
      lineMat.opacity = a;
      root.visible = a > 0.001;
    },
  };
}

/** Several plain geometries (position, normal) in one. */
function mergeSimple(list) {
  const pos = [];
  const nor = [];
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

/** A solid steel cylinder with the ship's own mass (src/reading.js STEEL): its centre at the group's origin. */
export function createSteel() {
  const root = new THREE.Group();
  root.name = 'SteelCylinder';
  const steel = new THREE.MeshStandardMaterial({ color: '#a3adb8', metalness: 0.85, roughness: 0.32 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(STEEL.r, STEEL.r, STEEL.h, 48), steel);
  body.name = 'SteelBody';
  body.castShadow = true;
  root.add(body);
  // a lifting eye on top
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 20), paint('#5c636a', { metalness: 0.7, roughness: 0.4 }));
  eye.position.y = STEEL.h / 2 + 0.3;
  eye.name = 'SteelEye';
  root.add(eye);
  root.visible = false;
  return { root, body, top: STEEL.h / 2 + 0.58 };
}

/**
 * A spring balance (like the school one, giant): a grey housing, a white tube with red bands that slides out more
 * the more it holds, a hook. The group's origin is the hook's tip; the cable runs up out of the picture.
 */
export function createBalance() {
  const root = new THREE.Group();
  root.name = 'SpringBalance';
  const grey = paint('#4b5157', { metalness: 0.5, roughness: 0.4 });
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 256;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#e03131';
    ctx.fillRect(0, i * 32, 32, 32);
  }
  ctx.fillStyle = '#1d1f22';
  for (let y = 4; y < 256; y += 8) ctx.fillRect(0, y, y % 32 === 4 ? 16 : 8, 1.5);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 2.2, 28), paint('#ffffff', { map: tex }));
  tube.name = 'BalanceScale';
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.5, 28), grey);
  housing.name = 'BalanceHousing';
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 28), grey);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 10), grey);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 8, 20, Math.PI * 1.5), grey);
  hook.name = 'BalanceHook';
  hook.rotation.z = Math.PI * 0.75;
  hook.position.y = 0.28;
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 60, 6).translate(0, 30, 0), grey);
  cable.name = 'BalanceCable';
  // the hook at 0; the rod above it; the tube slides inside the housing
  rod.position.y = 0.95;
  const slide = new THREE.Group();
  slide.add(tube, rod, hook);
  const top = new THREE.Group();
  top.add(housing, cap, cable);
  housing.position.y = 0;
  cap.position.y = 0.8;
  cable.position.y = 0.9;
  root.add(slide, top);
  let ext = 0;
  /** How far the tube is pulled out (0 … 1). */
  function setPull(k) {
    ext = Math.min(1, Math.max(0, k));
    // the hook hangs where the app puts it; the housing (fixed to the cable) rises as more of the tube shows:
    // 0.6 m of red and white when empty, 1.9 m when pulled out fully
    tube.position.y = 2.35;
    top.position.y = 2.6 + 1.3 * ext;
  }
  setPull(0);
  root.visible = false;
  return {
    root,
    setPull,
    get pull() {
      return ext;
    },
    /** Where the display label goes (just right of the housing), in the group's coordinates. */
    labelAt: () => new THREE.Vector3(0, top.position.y, 0),
  };
}
