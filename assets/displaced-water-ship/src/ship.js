// The toy cargo ship (cm), in the colours of buoyancy-ship's ship: a navy hull with a red bottom up to the load line, a
// white line there, a white deckhouse and bridge with red funnels, and a deck for six toy containers. Its group has the
// keel at y = 0, the flat stern (transom) at x = +11 and the bow's tip at x = −11; the app moves it so the water's
// surface crosses the hull at the draft. Below the deck the hull is a prism (src/reading.js), so the water it pushes aside
// at any depth is exactly A × h. Unlike the big ship, the bridge is aft: the containers then sit over the waterplane's
// centre (x = 0.95), so the model floats level with any even number of them. Draft marks every 0.5 cm (numbers at whole
// cm) near the stern and on the transom, and the load line (Plimsoll) mark amidships, on the side the camera sees (+z).
// Four lifting eyes on the rail, round the same centre, take the cords to the hanging scale.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FONT } from '@shared/student/materials.js';
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

/** Geometries of one material in one: position and normal only, non-indexed (a ship's parts share few materials). */
function mergeAll(list) {
  const parts = list.map((g) => {
    const ng = g.index ? g.toNonIndexed() : g.clone();
    if (!ng.attributes.normal) ng.computeVertexNormals();
    for (const k of Object.keys(ng.attributes)) if (k !== 'position' && k !== 'normal') ng.deleteAttribute(k);
    return ng;
  });
  return mergeGeometries(parts);
}
const at = (g, x, y, z) => g.translate(x, y, z);

/** A canvas texture drawn in a plane's own proportions: fn(ctx, W, H) with W × H in hundredths of a cm. */
function planeTexture(wcm, hcm, size, fn) {
  const c = document.createElement('canvas');
  c.width = size[0];
  c.height = size[1];
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  ctx.setTransform(size[0] / (wcm * 100), 0, 0, size[1] / (hcm * 100), 0, 0);
  fn(ctx, wcm * 100, hcm * 100);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** A toy container (a 10-foot box at this scale) and the six slots on the deck, in the order they are filled. */
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
export const BOX_COLORS = ['#1971c2', '#f2b705', '#c92a2a', '#2b8a3e', '#0b7285', '#ced4da'];

/** The four lifting eyes on the rail (ship's coordinates), round the waterplane's centre. */
export const EYES = [-4.6, 4.6].flatMap((dx) => [-1, 1].map((sz) => new THREE.Vector3(CENTRE_X + dx, 0, sz * (HULL.beam / 2 - 0.12))));
for (const e of EYES) e.y = sheer(e.x) + 0.2;

/** Where the load line's label points (ship's coordinates): the white line, on the near side, amidships. */
export const LOAD_LINE_AT = new THREE.Vector3(CENTRE_X + 2.6, LOAD_LINE + 0.05, HULL.beam / 2 + 0.02);

/** @param {{ N: (x: any) => string }} options N: digits for the draft marks (Bangla or Latin). */
export function createShip({ N }) {
  const root = new THREE.Group();
  root.name = 'Ship';
  const pts = hullOutline(12);
  const inner = offsetOutline(pts, -0.13);
  const red = paint('#b8262b', { roughness: 0.7 });
  const white = paint('#f4f1ea', { roughness: 0.55 });
  const navy = paint('#1f3768', { roughness: 0.45, metalness: 0.12 });
  const deckPaint = paint('#7b8a84', { roughness: 0.85 });
  const glass = paint('#173a5c', { roughness: 0.15, metalness: 0.4 });
  const funnelRed = paint('#d6402f');
  const black = paint('#1d1f22');
  const buoyOrange = paint('#f76707');
  const steel = paint('#9aa3ad', { metalness: 0.8, roughness: 0.35 });
  // the load line: its own white band, lit when the water reaches it (six containers)
  const lineMat = paint('#f4f1ea', { emissive: '#ffd43b', emissiveIntensity: 0 });
  const add = (geos, mat, name, shadow = true) => {
    const m = new THREE.Mesh(mergeAll(geos), mat);
    m.name = name;
    m.castShadow = shadow;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };
  // the hull: red below the load line, the white line, navy up to the rail; the deck; the bulwark's inside and the rail
  add([wallGeometry(pts, 0, LOAD_LINE), capGeometry(pts, 0, { down: true })], red, 'HullBottom');
  const loadLine = add([wallGeometry(pts, LOAD_LINE, LOAD_LINE + 0.1)], lineMat, 'HullLoadLine', false);
  add([wallGeometry(pts, LOAD_LINE + 0.1, sheer)], navy, 'HullTopsides');
  add([capGeometry(inner, DECK)], deckPaint, 'Deck', false);
  // the white parts: the bulwark's inside, the rail, the deckhouse, the bridge and its roof, the masts
  const box = (sx, sy, sz, x, y, z) => at(new THREE.BoxGeometry(sx, sy, sz), x, y, z);
  const cyl = (r0, r1, h, seg, x, y, z) => at(new THREE.CylinderGeometry(r0, r1, h, seg), x, y, z);
  add(
    [
      wallGeometry(inner, DECK, sheer, { inward: true }),
      ringGeometry(pts, inner, sheer),
      box(3.0, 2.2, 4.1, 8.95, DECK + 1.1, 0),
      box(2.3, 1.7, 3.9, 8.7, DECK + 3.05, 0),
      box(2.6, 0.14, 4.9, 8.7, DECK + 3.97, 0),
      cyl(0.07, 0.08, 2.0, 8, 8.6, DECK + 5.0, 0),
      cyl(0.06, 0.07, 2.0, 8, -9.0, sheer(-9.0) + 0.9, 0),
    ],
    white,
    'Superstructure',
  );
  add(
    [box(0.05, 0.6, 3.5, 7.53, DECK + 3.2, 0), ...[-1.3, -0.45, 0.45, 1.3].map((z) => box(0.05, 0.38, 0.5, 7.43, DECK + 1.35, z))],
    glass,
    'Windows',
    false,
  );
  add([cyl(0.34, 0.4, 2.0, 16, 10.0, DECK + 3.2, -1.0), cyl(0.34, 0.4, 2.0, 16, 10.0, DECK + 3.2, 1.0)], funnelRed, 'Funnels');
  add(
    [cyl(0.35, 0.35, 0.3, 16, 10.0, DECK + 4.35, -1.0), cyl(0.35, 0.35, 0.3, 16, 10.0, DECK + 4.35, 1.0), box(0.16, 0.12, 1.6, 8.6, DECK + 5.6, 0)],
    black,
    'FunnelTops',
    false,
  );
  add(
    [-1, 1].map((z) => at(new THREE.TorusGeometry(0.26, 0.07, 6, 16), 8.95, DECK + 1.0, z * 2.07)),
    buoyOrange,
    'Lifebuoys',
    false,
  );
  add(
    EYES.map((e) => at(new THREE.TorusGeometry(0.18, 0.05, 6, 12), e.x, e.y, e.z)),
    steel,
    'LiftingEyes',
    false,
  );

  // ── paint marks: the load line (Plimsoll) mark and the draft marks, white ────────
  const markMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const side = HULL.beam / 2 + 0.01; // the side the camera sees (+z)
  add(
    [at(new THREE.RingGeometry(0.42, 0.52, 32), CENTRE_X - 1, LOAD_LINE, side), at(new THREE.PlaneGeometry(1.4, 0.1), CENTRE_X - 1, LOAD_LINE, side)],
    markMat,
    'LoadLineMark',
    false,
  );
  // the draft marks: ticks every 0.5 cm and the numbers 1 … 5, drawn once into one small canvas; two planes, one draw
  const DW = 1.4;
  const DH = 5.4;
  const draftTex = planeTexture(DW, DH, [128, 512], (ctx, _W, H) => {
    ctx.fillStyle = '#ffffff';
    const yOf = (cm) => H - (cm - 0.1) * 100;
    for (let k = 1; k <= 10; k++) {
      const cm = k / 2;
      const whole = k % 2 === 0;
      ctx.fillRect(whole ? 90 : 102, yOf(cm) - 4, whole ? 50 : 28, 8);
      if (whole) {
        ctx.font = `700 46px ${FONT}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(N(String(cm)), 80, yOf(cm) + 2);
      }
    }
  });
  const draftMat = new THREE.MeshBasicMaterial({
    name: 'DraftMarks',
    map: draftTex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const plane = () => new THREE.PlaneGeometry(DW, DH).translate(0, DH / 2 + 0.1, 0);
  const sideScale = plane().translate(6.4 - 0.2, 0, side);
  const sternScale = plane()
    .rotateY(Math.PI / 2)
    .translate(HULL.stern + 0.01, 0, 1.2);
  const draft = new THREE.Mesh(mergeGeometries([sideScale, sternScale]), draftMat);
  draft.name = 'DraftMarks';
  draft.renderOrder = 2;
  root.add(draft);

  return {
    root,
    hull: root.children[0],
    loadLine,
    /** The load line lit (0 … 1): glows when the water reaches it. */
    lightLoadLine(k) {
      lineMat.emissiveIntensity = 0.9 * k;
    },
    spots: {
      loadLine: LOAD_LINE_AT,
      draftSide: new THREE.Vector3(6.4, 0, side),
      stern: new THREE.Vector3(HULL.stern, 0, 0),
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

/**
 * The six toy containers as one instanced mesh (one draw): a grey ribbed box tinted per container, "৫০ g" on the side
 * facing the camera. `place(i, position)` moves one; `glow(i, k)` lightens one (the next to take, pulsing gently).
 */
export function createContainers({ label }) {
  // one canvas: the left half plain ribs, the right half ribs with the label (dark, so the tint keeps it readable)
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  for (let x = 0; x < 256; x++) {
    const k = 0.82 + 0.18 * Math.cos((x / 128) * Math.PI * 2 * 7);
    const v = Math.round(255 * k);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, 0, 1, 64);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.fillRect(152, 14, 80, 36);
  ctx.fillStyle = '#1d2733';
  ctx.font = `700 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 192, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const geo = new THREE.BoxGeometry(BOX.x, BOX.y, BOX.z);
  // faces in order +x, −x, +y, −y, +z, −z (four vertices each): +z gets the labelled half, the others the plain half
  const uv = geo.attributes.uv;
  for (let f = 0; f < 6; f++)
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setX(i, f === 4 ? 0.5 + uv.getX(i) * 0.5 : uv.getX(i) * 0.5);
    }
  const mat = new THREE.MeshStandardMaterial({ name: 'Containers', map: tex, roughness: 0.6, metalness: 0.15 });
  const mesh = new THREE.InstancedMesh(geo, mat, BOX_COLORS.length);
  mesh.name = 'Containers';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const base = BOX_COLORS.map((x) => new THREE.Color(x));
  const tint = new THREE.Color();
  const WHITE = new THREE.Color('#ffffff');
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < base.length; i++) mesh.setColorAt(i, base[i]);
  return {
    mesh,
    count: base.length,
    place(i, p) {
      m4.makeTranslation(p.x, p.y, p.z);
      mesh.setMatrixAt(i, m4);
      mesh.instanceMatrix.needsUpdate = true;
    },
    glow(i, k) {
      mesh.setColorAt(i, tint.copy(base[i]).lerp(WHITE, 0.45 * k));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    done() {
      mesh.computeBoundingSphere();
    },
  };
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

/**
 * The waterplane, A = 100 cm²: the hull's outline at the water's surface as a translucent mint sheet with a bright edge,
 * drawn over the hull so it shows through it (the app puts it at the level, under the ship).
 */
export function createWaterplane() {
  const pts = hullOutline(12);
  const outer = offsetOutline(pts, 0.14);
  const fill = capGeometry(pts, 0);
  fill.deleteAttribute('uv');
  const flat = (color, opacity, order, name) => {
    const m = new THREE.Mesh(
      undefined,
      new THREE.MeshBasicMaterial({
        name,
        color,
        transparent: true,
        opacity,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    m.name = name;
    m.renderOrder = order;
    return m;
  };
  // mint: apart from the water's blue and the hull's red and navy; a dark teal edge
  const sheet = flat('#38d9a9', 0.6, 24, 'WaterplaneSheet');
  sheet.geometry = fill;
  const edge = flat('#087f5b', 1, 25, 'WaterplaneEdge');
  edge.geometry = ringGeometry(outer, pts, () => 0);
  const mesh = new THREE.Group();
  mesh.name = 'Waterplane';
  mesh.add(sheet, edge);
  mesh.userData.noExport = true;
  mesh.visible = false;
  return { mesh };
}

/**
 * A dimension line for h, from the keel up to the waterline, with a tick at each end: dark, over the glass and water.
 * `set(x, y0, y1, z)` rewrites its few vertices in place.
 */
export function createDimension(color = '#212529') {
  const w = 0.09;
  const tick = 0.9;
  const parts = [
    [new THREE.BoxGeometry(w, 1, w).translate(0, 0.5, 0), 0],
    [new THREE.BoxGeometry(tick, w, w), 1],
    [new THREE.BoxGeometry(tick, w, w), 2],
  ];
  const base = [];
  const flag = [];
  for (const [g, f] of parts) {
    const p = g.toNonIndexed().attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      base.push(p[i], p[i + 1], p[i + 2]);
      flag.push(f);
    }
  }
  const pos = new THREE.BufferAttribute(new Float32Array(base.length), 3);
  pos.setUsage(THREE.DynamicDrawUsage);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', pos);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ name: 'Dimension', color, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }),
  );
  mesh.name = 'DimensionH';
  mesh.renderOrder = 26;
  mesh.frustumCulled = false;
  mesh.userData.noExport = true;
  mesh.visible = false;
  return {
    mesh,
    set(x, y0, y1, z) {
      const h = Math.max(0.01, y1 - y0);
      const a = pos.array;
      for (let i = 0; i < flag.length; i++) {
        const f = flag[i];
        a[i * 3] = x + base[i * 3];
        a[i * 3 + 1] = y0 + (f === 0 ? base[i * 3 + 1] * h : f === 2 ? h + base[i * 3 + 1] : base[i * 3 + 1]);
        a[i * 3 + 2] = z + base[i * 3 + 2];
      }
      pos.needsUpdate = true;
    },
  };
}
