// The toy cargo ship (cm), in the colours of buoyancy-ship's ship: a navy hull with a red bottom up to the load line, a
// white line there, a white deckhouse and bridge with red funnels, and a deck for six toy containers. Its group has the
// keel at y = 0, the flat stern (transom) at x = +11 and the bow's tip at x = −11; the app moves it so the water's
// surface crosses the hull at the draft. Below the deck the hull is a prism (src/reading.js), so the water it pushes aside
// at any depth is exactly A × h. Unlike the big ship, the bridge is aft: the containers then sit over the waterplane's
// centre (x = 0.95), so the model floats level with any even number of them. Draft marks every 0.5 cm (numbers at whole
// cm) near the stern and on the transom, and the load line (Plimsoll) mark amidships, on the side the camera sees (+z).
// Four lifting eyes on the rail, round the same centre, take the cords to the hanging scale.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { CENTRE_X, HULL, hullOutline, LOAD_LINE } from './reading.js';

export const DECK = HULL.depth; // 6 cm above the keel
const BULWARK = HULL.bulwark;
/** The top of the hull's side: a little higher towards the bow (the sheer). */
export const sheer = (x) => DECK + BULWARK + 0.55 * smooth(-3, -11, x);
function smooth(a, b, x) {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

function segmentNormals(pts) {
  return pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const dx = q[0] - p[0];
    const dz = q[1] - p[1];
    const l = Math.hypot(dx, dz) || 1;
    return [dz / l, -dx / l];
  });
}

/** The outline moved in (d < 0) or out (d > 0) along its normals. */
export function offsetOutline(pts, d) {
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

/** A wall standing on an outline from y0 to y1 (numbers or functions of x), facing out (or in). */
export function wallGeometry(pts, y0, y1, { inward = false } = {}) {
  const lo = typeof y0 === 'function' ? y0 : () => y0;
  const hi = typeof y1 === 'function' ? y1 : () => y1;
  const ns = segmentNormals(pts);
  const n = pts.length;
  const vnormal = (i, seg) => {
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
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = pts[i];
    const b = pts[j];
    const na = vnormal(i, i);
    const nb = vnormal(j, i);
    const A0 = [a[0], lo(a[0]), a[1]];
    const A1 = [a[0], hi(a[0]), a[1]];
    const B0 = [b[0], lo(b[0]), b[1]];
    const B1 = [b[0], hi(b[0]), b[1]];
    const s = inward ? -1 : 1;
    const NA = [na[0] * s, 0, na[1] * s];
    const NB = [nb[0] * s, 0, nb[1] * s];
    const tri = inward
      ? [
          [A0, NA],
          [B1, NB],
          [A1, NA],
          [A0, NA],
          [B0, NB],
          [B1, NB],
        ]
      : [
          [A0, NA],
          [A1, NA],
          [B1, NB],
          [A0, NA],
          [B1, NB],
          [B0, NB],
        ];
    for (const [p, nn] of tri) {
      pos.push(...p);
      nor.push(...nn);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

/** A flat face filling an outline at height y, facing up (or down). */
export function capGeometry(pts, y, { down = false } = {}) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, down ? z : -z)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(down ? Math.PI / 2 : -Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/** A strip between two outlines (the rail on top of the wall), at heights y(x). */
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
    const k = 0.8 + 0.2 * Math.cos((x / 64) * Math.PI * 2 * 4);
    const v = Math.round(255 * k);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, 0, 1, 8);
  }
  ribTexture = new THREE.CanvasTexture(c);
  ribTexture.colorSpace = THREE.SRGBColorSpace;
  ribTexture.wrapS = THREE.RepeatWrapping;
  ribTexture.repeat.set(2, 1);
  return ribTexture;
}

/** A toy container (a 10-foot box at this scale) and the six slots on the deck, in the order they are loaded. */
export const BOX = { x: 3.85, y: 2.3, z: 2.3 };
export const SLOTS = (() => {
  const xs = [CENTRE_X, CENTRE_X - 3.95, CENTRE_X + 3.95];
  const z = BOX.z / 2 + 0.04;
  // the middle pair first, then the ends: level after every second one
  const order = [
    [0, z],
    [0, -z],
    [1, z],
    [2, z],
    [1, -z],
    [2, -z],
  ];
  return order.map(([i, zz]) => new THREE.Vector3(xs[i], DECK + BOX.y / 2, zz));
})();
const BOX_COLORS = ['#1971c2', '#f2b705', '#c92a2a', '#2b8a3e', '#0b7285', '#dfe3e8'];

/** The four lifting eyes on the rail (ship's coordinates), round the waterplane's centre. */
export const EYES = [-4.6, 4.6].flatMap((dx) => [-1, 1].map((sz) => new THREE.Vector3(CENTRE_X + dx, 0, sz * (HULL.beam / 2 - 0.12))));
for (const e of EYES) e.y = sheer(e.x) + 0.2;

/** @param {{ N: (x: any) => string, boxLabel: string }} options N: digits for the marks; boxLabel: "৫০ g". */
export function createShip({ N, boxLabel }) {
  const root = new THREE.Group();
  root.name = 'Ship';
  const pts = hullOutline(12);
  const inner = offsetOutline(pts, -0.13);

  const red = paint('#b8262b', { roughness: 0.7 });
  const white = paint('#f4f1ea');
  const navy = paint('#1f3768', { roughness: 0.45, metalness: 0.12 });
  const deckPaint = paint('#7b8a84', { roughness: 0.85 });
  const bulwarkIn = paint('#e9e6df', { roughness: 0.7 });
  const hull = new THREE.Group();
  hull.name = 'Hull';
  const add = (geo, mat, name, parent = hull, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  add(wallGeometry(pts, 0, LOAD_LINE), red, 'HullBottomPaint');
  add(wallGeometry(pts, LOAD_LINE, LOAD_LINE + 0.1), white, 'HullLoadLinePaint', hull, false);
  add(wallGeometry(pts, LOAD_LINE + 0.1, sheer), navy, 'HullTopsides');
  add(capGeometry(pts, 0, { down: true }), red, 'HullBottom', hull, false);
  add(capGeometry(inner, DECK), deckPaint, 'Deck', hull, false);
  add(wallGeometry(inner, DECK, sheer, { inward: true }), bulwarkIn, 'BulwarkInside', hull, false);
  add(ringGeometry(pts, inner, sheer), white, 'Rail', hull, false);
  root.add(hull);

  // ── the deckhouse and the bridge, aft; funnels; a mast ──────────────────────
  const house = new THREE.Group();
  house.name = 'Superstructure';
  const box = (sx, sy, sz, x, y, z, mat, name, shadow = true) => {
    const m = add(new THREE.BoxGeometry(sx, sy, sz), mat, name, house, shadow);
    m.position.set(x, y, z);
    return m;
  };
  const houseWhite = paint('#f7f5f0', { roughness: 0.5 });
  const glass = paint('#173a5c', { roughness: 0.15, metalness: 0.4 });
  const funnelRed = paint('#d6402f');
  const black = paint('#1d1f22');
  box(3.0, 2.2, 4.1, 8.95, DECK + 1.1, 0, houseWhite, 'Deckhouse');
  box(2.3, 1.7, 3.9, 8.7, DECK + 3.05, 0, houseWhite, 'Bridge');
  box(2.6, 0.14, 4.9, 8.7, DECK + 3.97, 0, houseWhite, 'BridgeRoof');
  box(0.05, 0.6, 3.5, 7.53, DECK + 3.2, 0, glass, 'BridgeWindows', false);
  for (const z of [-1.3, -0.45, 0.45, 1.3]) box(0.05, 0.38, 0.5, 7.43, DECK + 1.35, z, glass, 'Porthole', false);
  for (const z of [-1.0, 1.0]) {
    const f = add(new THREE.CylinderGeometry(0.34, 0.4, 2.0, 16), funnelRed, 'Funnel', house);
    f.position.set(10.0, DECK + 3.2, z);
    const top = add(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16), black, 'FunnelTop', house, false);
    top.position.set(10.0, DECK + 4.35, z);
  }
  const buoy = paint('#f76707');
  for (const z of [-1, 1]) {
    const ring = add(new THREE.TorusGeometry(0.26, 0.07, 6, 16), buoy, 'Lifebuoy', house, false);
    ring.position.set(8.95, DECK + 1.0, z * 2.07);
  }
  const mast = add(new THREE.CylinderGeometry(0.07, 0.08, 2.0, 8), houseWhite, 'Mast', house, false);
  mast.position.set(8.6, DECK + 5.0, 0);
  box(0.16, 0.12, 1.6, 8.6, DECK + 5.6, 0, black, 'Radar', false);
  const fore = add(new THREE.CylinderGeometry(0.06, 0.07, 2.0, 8), houseWhite, 'ForeMast', house, false);
  fore.position.set(-9.0, sheer(-9.0) + 0.9, 0);
  root.add(house);

  // ── lifting eyes on the rail ────────────────────────────────────────────────
  const eyeMat = paint('#9aa3ad', { metalness: 0.8, roughness: 0.35 });
  const eyeGeo = new THREE.TorusGeometry(0.18, 0.05, 6, 12);
  for (const e of EYES) {
    const m = new THREE.Mesh(eyeGeo, eyeMat);
    m.name = 'LiftingEye';
    m.position.copy(e);
    root.add(m);
  }

  // ── paint marks: the load line (Plimsoll) amidships and draft marks ────────
  const markMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const marks = new THREE.Group();
  marks.name = 'Marks';
  const side = HULL.beam / 2 + 0.01; // the side the camera sees (+z)
  const plimsoll = new THREE.Group();
  plimsoll.name = 'LoadLineMark';
  plimsoll.add(new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 32), markMat));
  plimsoll.add(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.1), markMat));
  plimsoll.position.set(CENTRE_X - 1, LOAD_LINE, side);
  marks.add(plimsoll);
  /** Ticks every 0.5 cm, numbers at whole cm (1 … 5). */
  function draftScale(name, place) {
    const g = new THREE.Group();
    g.name = name;
    const parts = [];
    for (let y = 0.5; y <= 5 + 1e-9; y += 0.5) {
      const whole = Math.abs(y - Math.round(y)) < 1e-6;
      parts.push(new THREE.PlaneGeometry(whole ? 0.5 : 0.28, 0.07).translate(whole ? 0 : 0.11, y, 0));
      if (whole) {
        const label = textMesh(N(String(Math.round(y))), 0.5, { color: '#ffffff', weight: 700 });
        label.position.set(-0.62, y, 0);
        g.add(label);
      }
    }
    const ticks = new THREE.Mesh(mergePlanes(parts), markMat);
    ticks.name = `${name}Ticks`;
    g.add(ticks);
    place(g);
    marks.add(g);
    return g;
  }
  draftScale('DraftMarksSide', (g) => g.position.set(6.4, 0, side));
  draftScale('DraftMarksStern', (g) => {
    g.rotation.y = Math.PI / 2;
    g.position.set(HULL.stern + 0.01, 0, 1.4);
  });
  root.add(marks);

  // ── containers: made here, kept by the app (they start on the table) ─────────
  const boxGeo = new THREE.BoxGeometry(BOX.x, BOX.y, BOX.z);
  const containers = BOX_COLORS.map((color, i) => {
    const g = new THREE.Group();
    g.name = `Container${i + 1}`;
    const m = new THREE.Mesh(boxGeo, paint(color, { map: ribs(), roughness: 0.6, metalness: 0.15 }));
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    // "৫০ g" on the side that faces the camera (+z), dark on the light box
    const label = textMesh(boxLabel, 0.72, { color: i === 5 || i === 1 ? '#1d2733' : '#ffffff', weight: 700 });
    label.position.set(0, -0.05, BOX.z / 2 + 0.01);
    label.name = 'ContainerLabel';
    g.add(label);
    return g;
  });

  return {
    root,
    hull,
    containers,
    /** Points on the ship (its own coordinates) the app hangs labels and arrows on. */
    spots: {
      loadLine: new THREE.Vector3(CENTRE_X - 1, LOAD_LINE, side),
      draftSide: new THREE.Vector3(6.4, 0, side),
      stern: new THREE.Vector3(HULL.stern, 0, 0),
      bow: new THREE.Vector3(-HULL.stern, 0, 0),
    },
    meshes() {
      const list = [];
      root.traverse((o) => {
        if (/** @type {THREE.Mesh} */ (o).isMesh && o.visible) list.push(o);
      });
      return list;
    },
  };
}

/** Plane geometries (position, normal, uv) in one. */
function mergePlanes(list) {
  const pos = [];
  const nor = [];
  const idx = [];
  let base = 0;
  for (const g of list) {
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    for (const i of g.index.array) idx.push(base + i);
    base += g.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/** The foam where the water meets the hull: a thin white band just outside the outline (app puts it at the level). */
export function createFoam() {
  const pts = offsetOutline(hullOutline(12), 0.04);
  const m = new THREE.Mesh(
    wallGeometry(pts, -0.05, 0.05),
    new THREE.MeshBasicMaterial({ color: '#f2fbff', transparent: true, opacity: 0.8, depthWrite: false, fog: false }),
  );
  m.name = 'Foam';
  m.renderOrder = 3;
  m.userData.noExport = true;
  return m;
}
