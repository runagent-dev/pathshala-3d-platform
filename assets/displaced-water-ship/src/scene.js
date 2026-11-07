// The setting and the apparatus, in centimetres (reading.js has the sizes that matter for the sums). A calm deep-blue
// backdrop and a plain sand-coloured table top that sits in it; on it only what the activity needs, as in a school lab:
// a clear glass tank filled to the lip of its spout (an overflow can), a low glass beaker with printed cm³ marks on a
// digital kitchen scale under the spout, a lab stand whose arm holds a digital hanging scale, the bridle (four cords to
// a ring) that the toy ship hangs from, and six toy containers. The water is a level box inside the tank and a level
// cylinder in the beaker; the overflow is a thin tube along the spout and down into the beaker, shown in part with a
// draw range (no fluid simulation, no new geometry per frame). The scales' displays are small canvases redrawn only
// when their number changes.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FONT } from '@shared/student/materials.js';
import { BEAKER, beakerLevel, CENTRE_X, TANK } from './reading.js';
import { EYES } from './ship.js';

export const BG = ['#0b2a5b', '#123d7a'];

/** The backdrop: a vertical gradient (a small power-of-two canvas, made once), used as scene.background. */
export function backdrop() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, BG[0]);
  g.addColorStop(1, BG[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── where things stand (world, cm) ──────────────────────────────────────────────
export const KSCALE = { x: 20.6, z: 0, w: 13, h: 2.4, pan: 0.3 }; // the kitchen scale
/** The hanging scale's body (cm). */
export const HSCALE = { w: 5.4, h: 7.8 };
export const BEAKER_AT = new THREE.Vector3(KSCALE.x, KSCALE.h + KSCALE.pan, KSCALE.z); // the beaker's outer bottom
export const BEAKER_FLOOR = BEAKER_AT.y + BEAKER.base; // its inside bottom (2.9)
export const ROD = { x: -18.5, z: 0, top: 41.5 };
/** The cords' ring above the keel, the arm above the ring (the hanging scale between them). */
export const RING_ABOVE_KEEL = 11.5;
export const ARM_ABOVE_RING = 2.0 + HSCALE.h + 1.0 + 0.45; // the body's bottom, the body, the eye and link, the arm's radius
/** The six containers on the table at first: one row in front of the tank, with a gap between them. */
export const STACK = [
  [-13.25, 10],
  [-7.95, 10],
  [-2.65, 10],
  [2.65, 10],
  [7.95, 10],
  [13.25, 10],
].map(([x, z]) => new THREE.Vector3(x, 1.15, z));

/** The table top: a finite rounded slab, light sand on top and a darker band round its edge (one draw). */
export const TABLE = { x0: -27, x1: 32, z0: -12, z1: 18, r: 3, th: 2.2 };
function createTable() {
  const s = new THREE.Shape();
  const { x0, x1, z0, z1, r } = TABLE;
  s.moveTo(x0 + r, z0);
  s.lineTo(x1 - r, z0);
  s.quadraticCurveTo(x1, z0, x1, z0 + r);
  s.lineTo(x1, z1 - r);
  s.quadraticCurveTo(x1, z1, x1 - r, z1);
  s.lineTo(x0 + r, z1);
  s.quadraticCurveTo(x0, z1, x0, z1 - r);
  s.lineTo(x0, z0 + r);
  s.quadraticCurveTo(x0, z0, x0 + r, z0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: TABLE.th - 0.4,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelSegments: 2,
    curveSegments: 6,
  })
    .rotateX(Math.PI / 2)
    .translate(0, -0.2, 0);
  geo.clearGroups();
  const sand = new THREE.Color(0xc4ab84);
  const band = new THREE.Color(0x8a724f);
  const n = geo.attributes.normal;
  const tint = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) (n.getY(i) > 0.9 ? sand : band).toArray(tint, i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(tint, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'TableTop', vertexColors: true, roughness: 0.85, metalness: 0 }));
  mesh.name = 'Table';
  mesh.receiveShadow = true;
  mesh.userData.noExport = true;
  return mesh;
}

// ── shared materials ─────────────────────────────────────────────────────────────
function glassMaterial(name, opacity = 0.16) {
  return new THREE.MeshPhysicalMaterial({
    name,
    color: '#eaf7f3',
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity,
    depthWrite: false,
    envMapIntensity: 1.4,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
}

/** A geometry with only position and normal, non-indexed (for merging parts of one material). */
function stripped(g) {
  const ng = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(ng.attributes)) if (k !== 'position' && k !== 'normal') ng.deleteAttribute(k);
  return ng;
}

/** Merged copies of geometries (position, normal, uv), non-indexed. */
function merge(list) {
  const pos = [];
  const nor = [];
  const uv = [];
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    if (g.attributes.uv) uv.push(...g.attributes.uv.array);
    else uv.push(...new Array(g.attributes.position.count * 2).fill(0));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// ── the tank (an overflow can) ─────────────────────────────────────────────────
/** The spout: a glass tube through the right-hand wall, sloping down; the water leaves at its outlet. */
export const SPOUT = {
  from: new THREE.Vector3(TANK.x1 - 0.2, TANK.spout + 0.55, 0),
  to: new THREE.Vector3(TANK.x1 + 4.3, TANK.spout - 0.4, 0),
  r: 0.55,
};

function createTank() {
  const root = new THREE.Group();
  root.name = 'Tank';
  const g = TANK.glass;
  const { x0, x1, z0, z1, top } = TANK;
  const L = x1 - x0 + 2 * g;
  const W = z1 - z0 + 2 * g;
  const cx = (x0 + x1) / 2;
  const box = (sx, sy, sz, x, y, z) => new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z);
  const walls = merge([
    box(L, TANK.floor, W, cx, TANK.floor / 2, 0), // the floor
    box(L, top - TANK.floor, g, cx, (top + TANK.floor) / 2, z1 + g / 2), // front
    box(L, top - TANK.floor, g, cx, (top + TANK.floor) / 2, z0 - g / 2), // back
    box(g, top - TANK.floor, z1 - z0, x0 - g / 2, (top + TANK.floor) / 2, 0), // left
    box(g, top - TANK.floor, z1 - z0, x1 + g / 2, (top + TANK.floor) / 2, 0), // right
  ]);
  const glass = glassMaterial('TankGlass', 0.14);
  const body = new THREE.Mesh(walls, glass);
  body.name = 'TankGlass';
  body.renderOrder = 4;
  root.add(body);
  // its edges: thin, faintly green, as the edges of real glass look
  const e = 0.12;
  const X0 = x0 - g;
  const X1 = x1 + g;
  const Z0 = z0 - g;
  const Z1 = z1 + g;
  const edgeParts = [];
  for (const y of [0.02, top - e / 2]) {
    edgeParts.push(box(X1 - X0, e, e, cx, y, Z0), box(X1 - X0, e, e, cx, y, Z1), box(e, e, Z1 - Z0, X0, y, 0), box(e, e, Z1 - Z0, X1, y, 0));
  }
  for (const x of [X0, X1]) for (const z of [Z0, Z1]) edgeParts.push(box(e, top, e, x, top / 2, z));
  // the inner rim (the glass is thick: its top shows as a band)
  edgeParts.push(
    box(X1 - X0, e, e, cx, top - e / 2, z1),
    box(X1 - X0, e, e, cx, top - e / 2, z0),
    box(e, e, z1 - z0, x0, top - e / 2, 0),
    box(e, e, z1 - z0, x1, top - e / 2, 0),
  );
  const edgeMat = new THREE.MeshStandardMaterial({
    name: 'GlassEdge',
    color: '#a9d9c6',
    roughness: 0.2,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  // the spout's lip: a ring round its outlet, in the same faint green
  const sdir = SPOUT.to.clone().sub(SPOUT.from).normalize();
  const lipQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), sdir);
  edgeParts.push(new THREE.TorusGeometry(SPOUT.r, 0.07, 6, 20).applyQuaternion(lipQ).translate(SPOUT.to.x, SPOUT.to.y, SPOUT.to.z));
  const edges = new THREE.Mesh(merge(edgeParts), edgeMat);
  edges.name = 'TankEdges';
  edges.renderOrder = 5;
  root.add(edges);
  // the spout: a glass tube from the wall, sloping down
  const dir = SPOUT.to.clone().sub(SPOUT.from);
  const len = dir.length();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(SPOUT.r, SPOUT.r, len, 20, 1, true), glassMaterial('SpoutGlass', 0.26));
  tube.material.side = THREE.DoubleSide;
  tube.name = 'Spout';
  tube.position.copy(SPOUT.from).addScaledVector(dir, 0.5);
  tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  tube.renderOrder = 5;
  root.add(tube);

  // the water: a box inside the glass, its top at the level
  const waterMat = new THREE.MeshStandardMaterial({
    name: 'TankWater',
    color: '#5fb2ea',
    emissive: '#0d4f86',
    emissiveIntensity: 0.35,
    roughness: 0.1,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
  });
  const water = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 - 0.02, 1, z1 - z0 - 0.02).translate(cx, 0.5, 0), waterMat);
  water.name = 'TankWater';
  water.renderOrder = 3;
  // the surface's edge on the glass: a bright line round the inside
  const lineMat = new THREE.MeshBasicMaterial({ name: 'WaterLine', color: '#dff1ff', transparent: true, opacity: 0.85, depthWrite: false });
  const t = 0.06;
  const line = new THREE.Mesh(
    merge([
      box(x1 - x0, t, t, cx, 0, z1 - 0.02),
      box(x1 - x0, t, t, cx, 0, z0 + 0.02),
      box(t, t, z1 - z0, x0 + 0.02, 0, 0),
      box(t, t, z1 - z0, x1 - 0.02, 0, 0),
    ]),
    lineMat,
  );
  line.name = 'TankWaterLine';
  line.renderOrder = 4;
  line.userData.noExport = true;
  root.add(water, line);
  return {
    root,
    glass: body,
    /** The water's level (cm above the table). */
    setLevel(level) {
      water.scale.y = Math.max(0.001, level - TANK.floor);
      water.position.y = TANK.floor;
      line.position.y = level;
    },
  };
}

// ── the overflow: a thin tube along the spout and down into the beaker ────────────
const STREAM_R = 0.2;
const RAD = 8;
function createStream() {
  // the path: along the spout's bottom, out of the outlet, then falling (a short curve as it leaves)
  const pts = [];
  const from = new THREE.Vector3(TANK.x1 - 0.3, TANK.spout + 0.12, 0);
  const out = SPOUT.to.clone().add(new THREE.Vector3(0.1, -SPOUT.r + 0.16, 0));
  for (let i = 0; i <= 6; i++) pts.push(from.clone().lerp(out, i / 6));
  const drop = out.y - BEAKER_FLOOR + 0.05;
  const N = 28;
  for (let i = 1; i <= N; i++) {
    const d = (i / N) ** 1.15 * drop;
    pts.push(new THREE.Vector3(out.x + 0.75 * (1 - Math.exp(-d / 0.9)), out.y - d, 0));
  }
  const pos = [];
  const nor = [];
  const idx = [];
  const T = new THREE.Vector3();
  const Nn = new THREE.Vector3();
  const B = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    T.subVectors(b, a).normalize();
    Nn.set(0, 0, 1);
    B.crossVectors(T, Nn).normalize();
    // the stream thins as it falls a little (it speeds up)
    const r = STREAM_R * (i < 7 ? 1.25 : 1 - 0.25 * ((i - 7) / N));
    for (let j = 0; j < RAD; j++) {
      const th = (j / RAD) * Math.PI * 2;
      const c = Math.cos(th);
      const s = Math.sin(th);
      const nx = B.x * c + Nn.x * s;
      const ny = B.y * c + Nn.y * s;
      const nz = B.z * c + Nn.z * s;
      pos.push(pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r);
      nor.push(nx, ny, nz);
    }
  }
  for (let i = 0; i < pts.length - 1; i++)
    for (let j = 0; j < RAD; j++) {
      const a = i * RAD + j;
      const b = i * RAD + ((j + 1) % RAD);
      idx.push(a, a + RAD, b, b, a + RAD, b + RAD);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  const mat = new THREE.MeshStandardMaterial({
    name: 'Stream',
    color: '#9fd3f5',
    roughness: 0.08,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    envMapIntensity: 1.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Overflow';
  mesh.renderOrder = 6;
  mesh.frustumCulled = false;
  mesh.userData.noExport = true;
  mesh.visible = false;
  const segs = pts.length - 1;
  const PER = RAD * 6;
  return {
    mesh,
    /** f: 0 … 1, how much flows; rising: the head grows down from the spout, falling: the tail runs out; surface: y of the
     * beaker's water (the stream ends there). */
    set(f, rising, surface) {
      mesh.visible = f > 0.02;
      if (!mesh.visible) return;
      let end = segs;
      for (let i = 1; i < pts.length; i++)
        if (pts[i].y < surface) {
          end = i;
          break;
        }
      const a = rising ? 0 : Math.floor((1 - f) * end);
      const b = rising ? Math.max(1, Math.ceil(f * end)) : end;
      geo.setDrawRange(a * PER, Math.max(0, b - a) * PER);
      mat.opacity = 0.8 * Math.min(1, 0.4 + f);
    },
  };
}

// ── an LCD: a small canvas redrawn only when its text changes ─────────────────────
function createLcd({ w, h, name, unit }) {
  // drawn in a 256-wide space of the display's own proportions, then squeezed into a power-of-two canvas
  const vh = (256 * h) / w;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = vh > 96 ? 128 : 64;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  ctx.setTransform(1, 0, 0, c.height / vh, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({
    name,
    map: tex,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.name = name;
  let last = null;
  function draw(text, on) {
    const key = `${on}|${text}`;
    if (key === last) return false;
    last = key;
    ctx.fillStyle = on ? '#c9d2bd' : '#7d857a';
    ctx.fillRect(0, 0, 256, vh);
    // a soft inner shadow at the top, as under the glass of a display
    const gr = ctx.createLinearGradient(0, 0, 0, vh * 0.25);
    gr.addColorStop(0, 'rgba(0,0,0,0.18)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 256, vh * 0.25);
    if (on) {
      ctx.fillStyle = '#1b2219';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'right';
      ctx.font = `700 ${Math.round(vh * 0.74)}px ${FONT}`;
      ctx.fillText(text, 200, vh * 0.82);
      ctx.font = `700 ${Math.round(vh * 0.38)}px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(unit, 210, vh * 0.82);
    }
    tex.needsUpdate = true;
    return true;
  }
  draw('', false);
  return { mesh, draw };
}

/** A face drawn once (buttons, words): fn(ctx, W, H) with W × H in the plane's own proportions (units of 1/100 cm). */
function faceTexture(wcm, hcm, size, fn) {
  const c = document.createElement('canvas');
  c.width = size[0];
  c.height = size[1];
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const W = wcm * 100;
  const H = hcm * 100;
  ctx.setTransform(size[0] / W, 0, 0, size[1] / H, 0, 0);
  fn(ctx, W, H);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function button(ctx, x, y, r, label, { color = '#d9dde2', text = '#2b2f33', size = 34 } = {}) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (label) {
    ctx.fillStyle = text;
    ctx.font = `700 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 2);
  }
}

// ── the kitchen scale with the beaker ─────────────────────────────────────────────
/** The console's slope at the front: its face leans back toward the viewer (rise over depth). */
const CONSOLE = { w: 10.4, d: 2.4, lo: 0.7 };
function createKitchenScale() {
  const root = new THREE.Group();
  root.name = 'KitchenScale';
  const { w, h, pan } = KSCALE;
  const bodyMat = new THREE.MeshStandardMaterial({ name: 'ScaleBody', color: '#e9ecef', roughness: 0.45, metalness: 0.05 });
  // the body and, along its front, a sloping console (a wedge): one mesh
  const wedgeShape = new THREE.Shape([
    new THREE.Vector2(0, 0),
    new THREE.Vector2(CONSOLE.d, 0),
    new THREE.Vector2(CONSOLE.d, CONSOLE.lo),
    new THREE.Vector2(0, h),
  ]);
  const wedge = new THREE.ExtrudeGeometry(wedgeShape, { depth: CONSOLE.w, bevelEnabled: false })
    .rotateY(-Math.PI / 2)
    .translate(CONSOLE.w / 2, 0, w / 2 - 0.05);
  // (after the turn the shape's x runs along +z: from the body's front out to the console's lip)
  const body = new THREE.Mesh(mergeGeometries([stripped(new RoundedBoxGeometry(w, h, w, 2, 0.45).translate(0, h / 2, 0)), stripped(wedge)]), bodyMat);
  body.name = 'KitchenScaleBody';
  body.castShadow = true;
  body.receiveShadow = true;
  const steel = new THREE.MeshStandardMaterial({ name: 'ScalePan', color: '#cfd4da', metalness: 1, roughness: 0.28, envMapIntensity: 1.1 });
  const plate = new THREE.Mesh(new RoundedBoxGeometry(w - 1.2, pan, w - 1.2, 2, 0.12).translate(0, h + pan / 2, 0), steel);
  plate.name = 'KitchenScalePan';
  plate.castShadow = true;
  plate.receiveShadow = true;
  // the sloping face: a dark panel with the display and two buttons (ON, TARE), leaning back toward the viewer
  const slope = Math.atan2(h - CONSOLE.lo, CONSOLE.d);
  const faceW = CONSOLE.w - 0.6;
  const faceH = Math.hypot(h - CONSOLE.lo, CONSOLE.d) - 0.4;
  const tilt = new THREE.Group();
  tilt.position.set(0, (h + CONSOLE.lo) / 2, w / 2 - 0.05 + CONSOLE.d / 2);
  tilt.rotation.x = -(Math.PI / 2 - slope);
  tilt.translateZ(0.02);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(faceW, faceH),
    new THREE.MeshStandardMaterial({
      name: 'KitchenScaleFace',
      roughness: 0.4,
      map: faceTexture(faceW, faceH, [512, 128], (ctx, W, H) => {
        ctx.fillStyle = '#2c3136';
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, 30);
        ctx.fill();
        button(ctx, W - 250, H / 2, 58, 'ON', { size: 34 });
        button(ctx, W - 100, H / 2, 58, 'TARE', { size: 26 });
      }),
    }),
  );
  face.name = 'KitchenScaleFace';
  const lcd = createLcd({ w: 5.4, h: Math.min(1.7, faceH - 0.3), name: 'KitchenScaleDisplay', unit: 'g' });
  lcd.mesh.position.set(-faceW / 2 + 3.1, 0, 0.01);
  tilt.add(face, lcd.mesh);
  root.add(body, plate, tilt);
  root.position.set(KSCALE.x, 0, KSCALE.z);
  /** The display's centre (world), for its reading's chip. */
  const lcdAt = new THREE.Vector3();
  root.updateMatrixWorld(true);
  lcd.mesh.getWorldPosition(lcdAt);
  return { root, lcd, lcdAt };
}

function createBeaker(N) {
  const root = new THREE.Group();
  root.name = 'Beaker';
  const { r, wall, base, height } = BEAKER;
  const ro = r + wall;
  const V = (x, y) => new THREE.Vector2(x, y);
  // outline: underside, out, up the outside, over the rim with a small pouring lip, down the inside, across
  const prof = [
    V(0, 0),
    V(ro - 0.2, 0),
    V(ro, 0.15),
    V(ro, height - 0.1),
    V(ro + 0.12, height),
    V(r, height),
    V(r, base + 0.15),
    V(r - 0.15, base),
    V(0, base),
  ];
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), glassMaterial('BeakerGlass', 0.2));
  glass.name = 'BeakerGlass';
  glass.renderOrder = 5;
  // the rim shows as a band
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(r + wall / 2, 0.09, 6, 40).rotateX(Math.PI / 2).translate(0, height, 0),
    new THREE.MeshStandardMaterial({ name: 'GlassEdge', color: '#a9d9c6', roughness: 0.2, transparent: true, opacity: 0.8, depthWrite: false }),
  );
  rim.name = 'BeakerRim';
  rim.renderOrder = 5;
  // printed marks: every 50 cm³, numbers every 100 cm³, on the side facing the first view
  const spanDeg = 64;
  const bandH = 6.2;
  const arc = ro * THREE.MathUtils.degToRad(spanDeg);
  const marksTex = faceTexture(arc, bandH, [256, 256], (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 7;
    const yOf = (v) => H - (v / 100) * 100 - 10; // 1 cm per 100 cm³; the band starts 0.1 cm under the inside bottom
    for (let v = 50; v <= 600; v += 50) {
      const whole = v % 100 === 0;
      const y = yOf(v);
      ctx.beginPath();
      ctx.moveTo(W * 0.62 - (whole ? 120 : 60), y);
      ctx.lineTo(W * 0.62, y);
      ctx.stroke();
      if (whole && v <= 500) {
        ctx.font = `700 64px ${FONT}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(N(v), W * 0.62 - 140, y);
      }
    }
    // the unit, just above the top number: "cm" and a raised 3 (the bundled font has no ³)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = `700 50px ${FONT}`;
    ctx.fillText('cm', W * 0.62 - 172, yOf(560));
    ctx.font = `700 32px ${FONT}`;
    ctx.fillText('3', W * 0.62 - 150, yOf(560) - 16);
  });
  const th0 = THREE.MathUtils.degToRad(20 - spanDeg / 2);
  const marks = new THREE.Mesh(
    new THREE.CylinderGeometry(ro + 0.01, ro + 0.01, bandH, 24, 1, true, th0, THREE.MathUtils.degToRad(spanDeg)),
    new THREE.MeshBasicMaterial({ name: 'BeakerMarks', map: marksTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.95 }),
  );
  marks.name = 'BeakerMarks';
  marks.position.y = base - 0.1 + bandH / 2;
  marks.renderOrder = 7;
  // the water caught: a cylinder of height 1, scaled
  const waterMat = new THREE.MeshStandardMaterial({
    name: 'BeakerWater',
    color: '#5fb2ea',
    emissive: '#0d4f86',
    emissiveIntensity: 0.35,
    roughness: 0.1,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.02, r - 0.02, 1, 40).translate(0, 0.5, 0), waterMat);
  water.name = 'BeakerWater';
  water.position.y = base;
  water.renderOrder = 4;
  water.visible = false;
  root.add(water, glass, rim, marks);
  root.position.copy(BEAKER_AT);
  return {
    root,
    water,
    waterMat,
    /** v: cm³ of water in it. */
    setVolume(v) {
      const h = beakerLevel(v);
      water.visible = h > 0.005;
      water.scale.y = Math.max(0.001, h);
    },
    /** y of the water's surface (world). */
    surface: (v) => BEAKER_FLOOR + beakerLevel(v),
  };
}

// ── the lab stand and the hanging scale with its cords ─────────────────────────────
function createStand() {
  const root = new THREE.Group();
  root.name = 'Stand';
  const iron = new THREE.MeshStandardMaterial({ name: 'StandIron', color: '#2f3439', roughness: 0.55, metalness: 0.4 });
  const steel = new THREE.MeshStandardMaterial({ name: 'StandRod', color: '#c3c9d0', roughness: 0.25, metalness: 1, envMapIntensity: 1.1 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(11, 1.0, 8, 2, 0.3).translate(ROD.x - 2.5, 0.5, ROD.z), iron);
  base.name = 'StandBase';
  base.castShadow = true;
  base.receiveShadow = true;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, ROD.top, 16).translate(ROD.x, ROD.top / 2, ROD.z), steel);
  rod.name = 'StandRod';
  rod.castShadow = true;
  // the part that slides: the boss head and the arm
  const arm = new THREE.Group();
  arm.name = 'StandArm';
  const boss = new THREE.Mesh(
    mergeGeometries([
      stripped(new RoundedBoxGeometry(2.0, 2.2, 2.0, 2, 0.25).translate(ROD.x, 0, ROD.z)),
      stripped(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12).rotateX(Math.PI / 2).translate(ROD.x, 0, ROD.z + 1.6)),
    ]),
    iron,
  );
  boss.name = 'StandBoss';
  boss.castShadow = true;
  const len = CENTRE_X + 1.2 - ROD.x;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, len, 16).rotateZ(Math.PI / 2), steel);
  bar.position.set(ROD.x + len / 2, 0, ROD.z);
  bar.castShadow = true;
  arm.add(boss, bar);
  root.add(base, rod, arm);
  return {
    root,
    arm,
    /** The arm's height (cm). */
    setArm(y) {
      arm.position.y = y;
    },
  };
}

function createHangingScale() {
  const root = new THREE.Group();
  root.name = 'HangingScale';
  const dark = new THREE.MeshStandardMaterial({ name: 'HangingScaleBody', color: '#474c52', roughness: 0.4, metalness: 0.15 });
  const steel = new THREE.MeshStandardMaterial({ name: 'Hook', color: '#c3c9d0', roughness: 0.3, metalness: 1, envMapIntensity: 1.1 });
  // the body: rounded, a display at the top and three buttons (as on the reference picture)
  const bw = HSCALE.w;
  const bh = HSCALE.h;
  const y0 = 2.0; // the body's bottom above the ring
  const body = new THREE.Mesh(new RoundedBoxGeometry(bw, bh, 2.0, 2, 0.5), dark);
  body.position.y = y0 + bh / 2;
  body.name = 'HangingScaleBody';
  body.castShadow = true;
  // the hardware, one mesh: the hook through the ring, its shank, the eye on top and a link up to the arm
  const top = y0 + bh;
  const hardware = new THREE.Mesh(
    mergeGeometries([
      stripped(
        new THREE.TorusGeometry(0.42, 0.12, 8, 20, Math.PI * 1.45)
          .rotateZ(-Math.PI * 0.62)
          .rotateY(Math.PI / 2)
          .translate(0, 0.88, 0),
      ),
      stripped(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 8).translate(0, 1.65, 0)),
      stripped(new THREE.TorusGeometry(0.34, 0.1, 8, 16).translate(0, top + 0.35, 0)),
      stripped(new THREE.TorusGeometry(0.34, 0.09, 8, 16).rotateY(Math.PI / 2).translate(0, top + 0.97, 0)),
    ]),
    steel,
  );
  hardware.name = 'HangingScaleHook';
  const fw = bw - 0.6;
  const fh = bh - 0.6;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(fw, fh),
    new THREE.MeshStandardMaterial({
      name: 'HangingScaleFace',
      roughness: 0.4,
      map: faceTexture(fw, fh, [256, 512], (ctx, W, H) => {
        ctx.fillStyle = '#2a2e33';
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, 40);
        ctx.fill();
        // the display's bezel (the display itself is its own plane)
        ctx.fillStyle = '#16191c';
        ctx.beginPath();
        ctx.roundRect(22, 26, W - 44, 236, 18);
        ctx.fill();
        button(ctx, 100, 410, 54, '');
        button(ctx, W - 100, 410, 54, '');
        button(ctx, W / 2, 530, 66, '');
        ctx.fillStyle = '#f1f3f5';
        ctx.font = `700 44px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('UNIT', 100, 498);
        ctx.fillText('TARE', W - 100, 498);
        ctx.fillStyle = '#ffe066';
        ctx.fillText('ON', W / 2, 340);
      }),
    }),
  );
  face.position.set(0, body.position.y, 1.01);
  face.name = 'HangingScaleFace';
  const lcd = createLcd({ w: fw - 0.6, h: 2.0, name: 'HangingScaleDisplay', unit: 'g' });
  lcd.mesh.position.set(0, top - 0.3 - 0.26 - 1.0, 1.02);
  // the bridle: the ring and four cords down to the eyes on the ship's rail (one mesh each)
  const cordMat = new THREE.MeshStandardMaterial({ name: 'Cord', color: '#f1e6cf', roughness: 0.9, transparent: true });
  const cordGeos = EYES.map((e) => {
    const to = new THREE.Vector3(e.x - CENTRE_X, e.y - RING_ABOVE_KEEL, e.z);
    const g = new THREE.CylinderGeometry(0.05, 0.05, 1, 5, 1, true).translate(0, 0.5, 0).scale(1, to.length(), 1);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().normalize()));
    return stripped(g);
  });
  const cords = new THREE.Mesh(mergeGeometries(cordGeos), cordMat);
  cords.name = 'Cords';
  const ringMat = steel.clone();
  ringMat.transparent = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.1, 8, 20), ringMat);
  ring.name = 'BridleRing';
  const bridle = new THREE.Group();
  bridle.name = 'Bridle';
  bridle.add(ring, cords);
  root.add(bridle, hardware, body, face, lcd.mesh);
  return {
    root,
    lcd,
    body,
    /** The display's centre in the scale's own coordinates (for its reading's chip). */
    lcdAt: lcd.mesh.position.clone(),
    /** The cords and their ring: a = 1 on, 0 taken off. */
    setBridle(a) {
      bridle.visible = a > 0.01;
      cordMat.opacity = a;
      cordMat.depthWrite = a > 0.99;
      ringMat.opacity = a;
      ringMat.depthWrite = a > 0.99;
    },
  };
}

export function createScene(N) {
  const table = createTable();
  const tank = createTank();
  const stream = createStream();
  const kscale = createKitchenScale();
  const beaker = createBeaker(N);
  const stand = createStand();
  const hanging = createHangingScale();
  return { table, tank, stream, kscale, beaker, stand, hanging };
}
