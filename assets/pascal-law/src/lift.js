// The hydraulic car lift, cut open along its middle (the plane z = 0) so the amber oil inside shows: a small pump
// cylinder on the left with a T-handle on its rod, a pipe along the floor, and a wide lift cylinder on the right whose
// ram carries a platform with a yellow car. The front halves of the cylinders and the pipe are cut away; their cut
// walls are drawn hatched. Three lift cylinders are built (A₂ = 10, 50 and 100 × A₁) and one is shown at a time, so
// changing it never rebuilds geometry. Metres; the floor is y = 0. Sizes of the cylinders are true to each other
// (A₂/A₁ exact); the car is drawn smaller than life next to them (the figure says so).
import * as THREE from 'three';
import { A1 } from './reading.js';
import { mergeStatic } from './merge.js';

const TAU = Math.PI * 2;
const r1 = Math.sqrt(A1 / Math.PI); // 0.0564 m: the small bore
/** The shape of the lift. Heights are inner surfaces; pistons are given by their bottom face. */
export const GEO = {
  xS: -0.56, // the small cylinder's axis
  xB: 0.46, // the lift cylinder's axis
  r1,
  t1: 0.016, // the small cylinder's wall
  t2: 0.03, // the lift cylinder's wall
  YB: 0.07, // the inside of the vessel's floor
  BASE: 0.035, // the vessel stands on a base plate this thick
  PIPE: 0.16, // the top of the pipe's inside (its bottom is YB)
  Y1TOP: 0.68, // the small cylinder's top
  Y1HIGH: 0.54, // the small piston's bottom with the handle up
  P1H: 0.05, // the small piston's height
  ROD1: 0.27, // from the small piston's top to the handle
  Y2TOP: 0.78, // the lift cylinder's top
  Y2LOW: 0.42, // the big piston's bottom with the car down
  P2H: 0.08,
  ROD2: 0.36, // from the big piston's top to the platform's underside
  PLAT_W: 1.44,
  PLAT_H: 0.06,
  PLAT_D: 0.9,
  CAR_L: 1.32,
  CAR_H: 0.5,
  CAR_W: 0.62,
};
export const r2For = (ratio) => Math.sqrt((A1 * ratio) / Math.PI);

function canvasTexture(w, h, paint, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}

/** The materials of the lift (shared by the three lift cylinders). */
function liftMaterials() {
  const hatch = canvasTexture(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = '#c4cad3';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#7d8693';
      g.lineWidth = 7;
      for (let k = -h; k < w + h; k += 32) {
        g.beginPath();
        g.moveTo(k, h);
        g.lineTo(k + h, 0);
        g.stroke();
      }
    },
    { repeat: [1, 1] },
  );
  // world-space hatching: the cut faces' UVs are set from x, y (see shapeUV), 1 repeat per 6 cm
  return {
    steel: new THREE.MeshStandardMaterial({ name: 'PolishedSteel', color: '#d5dae2', metalness: 1, roughness: 0.2 }),
    steelIn: new THREE.MeshStandardMaterial({ name: 'SteelInside', color: '#8a929d', metalness: 0.85, roughness: 0.35, side: THREE.BackSide }),
    cut: new THREE.MeshStandardMaterial({ name: 'CutWall', map: hatch, metalness: 0.3, roughness: 0.55 }),
    chrome: new THREE.MeshStandardMaterial({ name: 'Chrome', color: '#f2f4f7', metalness: 1, roughness: 0.08 }),
    piston: new THREE.MeshStandardMaterial({ name: 'Piston', color: '#4a5260', metalness: 0.8, roughness: 0.32 }),
    pistonCut: new THREE.MeshStandardMaterial({ name: 'PistonCut', color: '#3d4553', metalness: 0.4, roughness: 0.5 }),
    edge: new THREE.MeshStandardMaterial({ name: 'PistonEdge', color: '#ffffff', emissive: '#e8edf3', emissiveIntensity: 0.5, roughness: 0.3 }),
    seal: new THREE.MeshStandardMaterial({ name: 'Seal', color: '#1d1f24', roughness: 0.6 }),
    oil: new THREE.MeshStandardMaterial({
      name: 'HydraulicOil',
      vertexColors: true,
      roughness: 0.18,
      metalness: 0,
      emissive: '#b86a00',
      emissiveIntensity: 0.26,
    }),
    base: new THREE.MeshStandardMaterial({ name: 'BasePaint', color: '#1d4fa3', metalness: 0.25, roughness: 0.45 }),
    grip: new THREE.MeshStandardMaterial({ name: 'Grip', color: '#e8222c', roughness: 0.55 }),
    rubber: new THREE.MeshStandardMaterial({ name: 'Rubber', color: '#1b1c20', roughness: 0.85 }),
  };
}

/** Planar UVs from x, y (metres) so textures keep their size on shapes of any size. */
function shapeUV(geo, scale) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / scale;
    uv[i * 2 + 1] = pos.getY(i) / scale;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** A plane in z = 0 from (x0, y0) to (x1, y1) with a golden gradient (amber at the bottom, light gold at the top). */
function oilPlane(x0, x1, y0, y1, mat) {
  const geo = new THREE.PlaneGeometry(x1 - x0, 1).translate((x0 + x1) / 2, 0.5, 0);
  const deep = new THREE.Color('#e39516');
  const gold = new THREE.Color('#ffd665');
  const col = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i < geo.attributes.position.count; i++) {
    const c = geo.attributes.position.getY(i) > 0.5 ? gold : deep;
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y0;
  m.scale.y = Math.max(1e-4, y1 - y0);
  m.renderOrder = 1;
  return m;
}
/** Sets an oil plane's top. */
const setOilTop = (m, top) => {
  m.scale.y = Math.max(1e-4, top - m.position.y);
};

/** The back half of a tube (outer shell, inner shell, the lip on top), axis vertical at x, from y0 to y1. */
function halfTube(x, r, t, y0, y1, m, { lip = true } = {}) {
  const g = new THREE.Group();
  const h = y1 - y0;
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(r + t, r + t, h, 56, 1, true, Math.PI / 2, Math.PI), m.steel);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 56, 1, true, Math.PI / 2, Math.PI), m.steelIn);
  outer.position.set(x, y0 + h / 2, 0);
  inner.position.copy(outer.position);
  outer.castShadow = true;
  outer.receiveShadow = true;
  g.add(outer, inner);
  if (lip) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + t, 56, 1, 0, Math.PI).rotateX(-Math.PI / 2), m.steel);
    ring.position.set(x, y1, 0);
    ring.castShadow = true; // with the shell: one mesh
    ring.receiveShadow = true;
    g.add(ring);
  }
  return g;
}

/** The back half of a piston (a closed half cylinder) with its cut face in front and two seals; bottom at y = 0. */
function halfPiston(r, h, m) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 56, 1, false, Math.PI / 2, Math.PI), m.piston);
  body.position.y = h / 2; // inside its cylinder: no shadow to cast
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, h), m.pistonCut);
  face.position.set(0, h / 2, 0.0005);
  g.add(body, face);
  for (const y of [h * 0.3, h * 0.7]) {
    const seal = new THREE.Mesh(new THREE.PlaneGeometry(2 * r + 0.002, Math.min(0.008, h * 0.12)), m.seal);
    seal.position.set(0, y, 0.001);
    g.add(seal);
  }
  // a bright line along the top edge of the cut face, so the piston's top reads against the scale
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 0.0016).translate(0, -0.0008, 0), m.edge);
  edge.position.set(0, h, 0.0012);
  g.add(edge);
  return g;
}

/**
 * The section of the vessel's walls in z = 0: the outer outline less the cavity (the small cylinder, the pipe and
 * the lift cylinder, open at the tops), hatched.
 */
function cutFace(r2, m) {
  const { xS, xB, t1, t2, YB, BASE, PIPE, Y1TOP, Y2TOP } = GEO;
  const pipeTop = PIPE + 0.016;
  const sx0 = xS - r1 - t1;
  const sx1 = xS + r1 + t1;
  const bx0 = xB - r2 - t2;
  const bx1 = xB + r2 + t2;
  // the outline, then the cavity, both open at the top: one shape that goes round both (a U with walls)
  const s = new THREE.Shape();
  s.moveTo(sx0, BASE);
  s.lineTo(bx1, BASE);
  s.lineTo(bx1, Y2TOP);
  s.lineTo(xB + r2, Y2TOP);
  s.lineTo(xB + r2, YB);
  s.lineTo(xS - r1, YB);
  s.lineTo(xS - r1, Y1TOP);
  s.lineTo(sx0, Y1TOP);
  s.closePath();
  // the cavity's other side: the small cylinder's right wall, the pipe's top, the lift cylinder's left wall
  const top = new THREE.Shape();
  top.moveTo(xS + r1, Y1TOP);
  top.lineTo(sx1, Y1TOP);
  top.lineTo(sx1, pipeTop);
  top.lineTo(bx0, pipeTop);
  top.lineTo(bx0, Y2TOP);
  top.lineTo(xB - r2, Y2TOP);
  top.lineTo(xB - r2, PIPE);
  top.lineTo(xS + r1, PIPE);
  top.closePath();
  const geo = shapeUV(new THREE.ShapeGeometry([s, top]), 0.06);
  const mesh = new THREE.Mesh(geo, m.cut);
  mesh.name = 'CutWalls';
  mesh.position.z = 0.0008;
  mesh.renderOrder = 2;
  return mesh;
}

/** The back half of the pipe between the two cylinders, from x0 to x1. */
function halfPipe(x0, x1, m) {
  const { YB, PIPE } = GEO;
  const r = (PIPE - YB) / 2 + 0.016;
  // the back half (z ≤ 0): after turning the axis to x, θ from π/2 to 3π/2 is the half behind the cut
  const geo = new THREE.CylinderGeometry(r, r, x1 - x0, 32, 1, true, Math.PI / 2, Math.PI).rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, m.steel);
  mesh.position.set((x0 + x1) / 2, (YB + PIPE) / 2, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * The millimetre scale on the lift cylinder's cut wall (cm numbers from the big piston's lowest top): one mesh, made
 * once and shared by the three lift cylinders. The ticks are thin quads (sharp at the closest look, where a painted
 * scale would need a 4096 px texture) and the numbers are quads cut from a small atlas of the ten digits; the cream
 * face and the ink are two plain cells of the same atlas, so it is all one draw call.
 */
function createRuler(num) {
  const W = GEO.t2 * 0.86; // the plane: t2 × 0.86 wide, 30 cm tall, its 0 (RULER0) 2 cm above its bottom
  const H = 0.3;
  const CELL = 80;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 128;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  g.fillStyle = '#fbf6e9';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#1b1b1b';
  g.fillRect(11 * CELL, 0, CELL, c.height); // the ink cell (cell 10 is the cream face)
  g.font = '600 104px "Noto Sans Bengali", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const widths = [];
  for (let d = 0; d < 10; d++) {
    const ch = num(d);
    widths.push(Math.min(CELL - 4, g.measureText(ch).width + 4));
    g.fillText(ch, d * CELL + CELL / 2, 70);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  const pos = [];
  const uv = [];
  const idx = [];
  const u = (px) => px / c.width;
  /** A quad from (x0, y0) to (x1, y1) at depth z, with the atlas rectangle (u0, v0)–(u1, v1). */
  const quad = (x0, y0, x1, y1, z, u0, v0, u1, v1) => {
    const i = pos.length / 3;
    pos.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z);
    uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  };
  const solid = (cell) => [u(cell * CELL + CELL / 2), 0.5, u(cell * CELL + CELL / 2), 0.5];
  const cream = solid(10);
  const ink = solid(11);
  const x0 = -W / 2;
  quad(x0, -H / 2, W / 2, H / 2, 0, cream[0], cream[1], cream[2], cream[3]);
  const mm = 0.001;
  const lineH = 0.00026;
  const digitH = 5.2 * mm; // a glyph cell's height on the scale (the digit itself is about 4.2 mm)
  for (let k = 0; k <= 300; k++) {
    const y = -H / 2 + k * mm;
    const n = k - 20; // mm from the scale's 0
    const len = n % 10 === 0 ? 0.5 : n % 5 === 0 ? 0.36 : 0.24;
    // ticks from the right edge, next to the piston
    quad(W / 2 - W * len, y - lineH / 2, W / 2, y + lineH / 2, 0.0001, ink[0], ink[1], ink[2], ink[3]);
    if (n % 10 !== 0 || n < 0) continue;
    let x = x0 + W * 0.08;
    for (const ch of String(n / 10)) {
      const d = Number(ch);
      const w = (widths[d] / CELL) * digitH * (CELL / 128);
      const cu = d * CELL + CELL / 2;
      quad(x, y - digitH / 2, x + w, y + digitH / 2, 0.0001, u(cu - widths[d] / 2), 0, u(cu + widths[d] / 2), 1);
      x += w;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(
      new Float32Array(pos.length).map((_, i) => (i % 3 === 2 ? 1 : 0)),
      3,
    ),
  );
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return { geo, material: new THREE.MeshStandardMaterial({ name: 'Scale', map: tex, roughness: 0.7 }), height: H };
}
/** Where the scale's 0 is: the big piston's top with the car down. */
export const RULER0 = GEO.Y2LOW + GEO.P2H;

/** The yellow car: an extruded side profile with window openings, glass, wheels and lamps. Bottom at y = 0. */
function createCar() {
  const { CAR_L: L, CAR_W: W } = GEO;
  const car = new THREE.Group();
  car.name = 'Car';
  const paint = new THREE.MeshStandardMaterial({ name: 'CarPaint', color: '#ffc61a', metalness: 0.35, roughness: 0.22 });
  const glass = new THREE.MeshStandardMaterial({ name: 'Glass', color: '#1e3346', metalness: 0.6, roughness: 0.08 });
  const black = new THREE.MeshStandardMaterial({ name: 'Trim', color: '#17181c', roughness: 0.6 });
  const rim = new THREE.MeshStandardMaterial({ name: 'Rim', color: '#dfe3ea', metalness: 1, roughness: 0.18 });
  const lampW = new THREE.MeshStandardMaterial({ name: 'Headlamp', color: '#fffbe8', emissive: '#fff4c0', emissiveIntensity: 0.7 });
  const lampR = new THREE.MeshStandardMaterial({ name: 'TailLamp', color: '#e01b24', emissive: '#c0101a', emissiveIntensity: 0.5 });
  const x = (k) => k * L; // profile in parts of the length, from the back (−0.5) to the front (+0.5)
  const wheelX = 0.33 * L;
  const wr = 0.12;
  const s = new THREE.Shape();
  s.moveTo(x(-0.5), 0.1);
  s.lineTo(x(-0.505), 0.22);
  s.quadraticCurveTo(x(-0.5), 0.33, x(-0.47), 0.37);
  s.lineTo(x(-0.44), 0.455);
  s.quadraticCurveTo(x(-0.42), 0.49, x(-0.36), 0.495);
  s.lineTo(x(0.06), 0.495);
  s.quadraticCurveTo(x(0.12), 0.49, x(0.16), 0.45);
  s.lineTo(x(0.29), 0.33);
  s.quadraticCurveTo(x(0.44), 0.31, x(0.49), 0.27);
  s.quadraticCurveTo(x(0.515), 0.2, x(0.5), 0.1);
  s.lineTo(wheelX + wr + 0.03, 0.08);
  s.absarc(wheelX, 0.13, wr + 0.03, 0, Math.PI, false);
  s.lineTo(-wheelX + wr + 0.03, 0.08);
  s.absarc(-wheelX, 0.13, wr + 0.03, 0, Math.PI, false);
  s.lineTo(x(-0.5), 0.1);
  // the side windows: two openings with a pillar between
  const win1 = new THREE.Path();
  win1.moveTo(x(-0.425), 0.375);
  win1.lineTo(x(-0.395), 0.455);
  win1.quadraticCurveTo(x(-0.38), 0.47, x(-0.35), 0.47);
  win1.lineTo(x(-0.12), 0.47);
  win1.lineTo(x(-0.12), 0.375);
  win1.closePath();
  const win2 = new THREE.Path();
  win2.moveTo(x(-0.09), 0.375);
  win2.lineTo(x(-0.09), 0.47);
  win2.lineTo(x(0.05), 0.47);
  win2.quadraticCurveTo(x(0.1), 0.468, x(0.135), 0.44);
  win2.lineTo(x(0.215), 0.375);
  win2.closePath();
  s.holes.push(win1, win2);
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(s, {
      depth: W - 0.06,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.022,
      bevelSegments: 4,
      curveSegments: 18,
    }).translate(0, 0, -(W - 0.06) / 2),
    paint,
  );
  body.castShadow = true;
  body.name = 'CarBody';
  car.add(body);
  // glass in the openings (a little inside the sides) and over the windscreen and the back
  const gw = new THREE.Shape();
  gw.moveTo(x(-0.44), 0.36);
  gw.lineTo(x(-0.4), 0.475);
  gw.lineTo(x(0.07), 0.475);
  gw.lineTo(x(0.23), 0.36);
  gw.closePath();
  const pane = new THREE.Mesh(new THREE.ExtrudeGeometry(gw, { depth: W - 0.02, bevelEnabled: false }).translate(0, 0, -(W - 0.02) / 2), glass);
  car.add(pane);
  const slope = (x0, y0, x1, y1, w) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const geo = new THREE.PlaneGeometry(len * 0.86, w).rotateX(-Math.PI / 2).rotateZ(Math.atan2(y1 - y0, x1 - x0));
    const m = new THREE.Mesh(geo, glass);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    m.position.y += 0.006;
    return m;
  };
  car.add(slope(x(0.16), 0.452, x(0.29), 0.335, W - 0.1)); // windscreen
  car.add(slope(x(-0.47), 0.372, x(-0.44), 0.458, W - 0.1)); // rear window
  // bumpers, lamps
  const bumper = (xc) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, W + 0.02), black);
    b.position.set(xc, 0.135, 0);
    return b;
  };
  car.add(bumper(x(-0.5) - 0.01), bumper(x(0.5) + 0.005));
  for (const z of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10).scale(0.6, 0.7, 1.4), lampW);
    hl.position.set(x(0.49), 0.245, z * (W / 2 - 0.08));
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.1), lampR);
    tl.position.set(x(-0.505), 0.3, z * (W / 2 - 0.07));
    car.add(hl, tl);
  }
  // wheels
  const tyreGeo = new THREE.CylinderGeometry(wr, wr, 0.11, 32).rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(wr * 0.62, wr * 0.62, 0.115, 24).rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(wr * 0.2, wr * 0.2, 0.12, 12).rotateX(Math.PI / 2);
  for (const xs of [-wheelX, wheelX])
    for (const z of [-1, 1]) {
      const tyre = new THREE.Mesh(tyreGeo, black);
      tyre.castShadow = true;
      const r = new THREE.Mesh(rimGeo, rim);
      const hub = new THREE.Mesh(hubGeo, black);
      const wheel = new THREE.Group();
      wheel.add(tyre, r, hub);
      wheel.position.set(xs, wr, z * (W / 2 - 0.04));
      car.add(wheel);
    }
  // the black parts (tyres, hubs, bumpers) all cast: one mesh per material
  car.traverse((o) => {
    if (/** @type {THREE.Mesh} */ (o).material === black) o.castShadow = true;
  });
  mergeStatic(car);
  return car;
}

/** The platform the car stands on: diamond plate on top, a yellow-and-black edge in front. Top at y = 0. */
function createPlatform() {
  const { PLAT_W: w, PLAT_H: h, PLAT_D: d } = GEO;
  const plate = canvasTexture(256, 256, (g, W, H) => {
    g.fillStyle = '#9aa3ae';
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const cx = (x + (y % 2) * 0.5) * 32 + 8;
        const cy = y * 32 + 16;
        g.fillStyle = '#c3cad3';
        g.beginPath();
        g.ellipse(cx, cy, 10, 3.4, (y % 2 ? 1 : -1) * 0.8, 0, TAU);
        g.fill();
      }
  });
  plate.repeat.set(6, 3.5);
  const stripes = canvasTexture(512, 32, (g, W, H) => {
    g.fillStyle = '#ffd21a';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#17181c';
    for (let k = -2; k < 26; k++) {
      g.beginPath();
      g.moveTo(k * 24, H);
      g.lineTo(k * 24 + 12, H);
      g.lineTo(k * 24 + 12 + H, 0);
      g.lineTo(k * 24 + H, 0);
      g.closePath();
      g.fill();
    }
  });
  stripes.repeat.set(1.8, 1);
  const top = new THREE.MeshStandardMaterial({ name: 'DiamondPlate', map: plate, metalness: 0.75, roughness: 0.4 });
  const edge = new THREE.MeshStandardMaterial({ name: 'HazardEdge', map: stripes, roughness: 0.5 });
  const side = new THREE.MeshStandardMaterial({ name: 'PlatformSide', color: '#3b4250', metalness: 0.5, roughness: 0.45 });
  // BoxGeometry faces: +x, −x, +y, −y, +z, −z; the four plain sides are put together, so it is 3 draw calls, not 6
  const boxGeo = new THREE.BoxGeometry(w, h, d);
  const face = (f) => Array.from(boxGeo.index.array.slice(f * 6, f * 6 + 6));
  boxGeo.setIndex([...face(0), ...face(1), ...face(3), ...face(5), ...face(2), ...face(4)]);
  boxGeo.clearGroups();
  boxGeo.addGroup(0, 24, 0);
  boxGeo.addGroup(24, 6, 1);
  boxGeo.addGroup(30, 6, 2);
  const box = new THREE.Mesh(boxGeo, [side, top, edge]);
  box.position.y = -h / 2;
  box.castShadow = true;
  box.receiveShadow = true;
  const g = new THREE.Group();
  g.name = 'Platform';
  g.add(box);
  // two wheel ramps' stops (low yellow kerbs at both ends)
  for (const sx of [-1, 1]) {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, d * 0.9), edge);
    kerb.position.set(sx * (w / 2 - 0.03), 0.02, 0);
    g.add(kerb);
  }
  mergeStatic(g, { keep: [box] });
  return g;
}

/**
 * The lift. `num(n)` writes a number on the scale (Bangla or Latin digits). Returns the parts and setters: the ratio
 * A₂/A₁ (which lift cylinder shows), the small piston's bottom y1 and the car's rise h.
 */
export function createLift({ ratios, num }) {
  const { xS, xB, t1, t2, YB, BASE, PIPE, Y1TOP, Y1HIGH, P1H, ROD1, Y2TOP, Y2LOW, P2H, ROD2 } = GEO;
  const m = liftMaterials();
  const root = new THREE.Group();
  root.name = 'HydraulicLift';

  // the base plate under the vessel
  const base = new THREE.Mesh(new THREE.BoxGeometry(xB - xS + 1.45, BASE, 0.95), m.base);
  base.position.set((xS + xB) / 2 + 0.1, BASE / 2, -0.2);
  base.receiveShadow = true;
  base.castShadow = true;
  root.add(base);

  // the small (pump) cylinder: its shell, oil, piston, rod and the T-handle
  const small = new THREE.Group();
  small.name = 'PumpCylinder';
  small.add(halfTube(xS, r1, t1, BASE, Y1TOP, m));
  const smallOil = oilPlane(xS - r1, xS + r1, YB, Y1HIGH, m.oil);
  smallOil.name = 'OilInPump';
  small.add(smallOil);
  const piston1 = new THREE.Group();
  piston1.name = 'SmallPiston';
  piston1.add(halfPiston(r1 - 0.001, P1H, m));
  const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, ROD1, 20), m.chrome);
  rod1.position.y = P1H + ROD1 / 2;
  rod1.castShadow = true;
  const handle = new THREE.Group();
  handle.name = 'Handle';
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.26, 20).rotateZ(Math.PI / 2), m.chrome);
  bar.castShadow = true;
  handle.add(bar);
  for (const sx of [-1, 1]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.085, 20).rotateZ(Math.PI / 2), m.grip);
    grip.position.x = sx * 0.09;
    grip.castShadow = true;
    handle.add(grip);
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), m.chrome);
  handle.add(knob);
  handle.position.y = P1H + ROD1;
  piston1.add(rod1, handle);
  piston1.position.set(xS, Y1HIGH, 0);
  small.add(piston1);
  // the gland on top, where the rod goes in
  const gland = new THREE.Mesh(new THREE.CylinderGeometry(r1 + t1 + 0.006, r1 + t1 + 0.006, 0.022, 40, 1, false, Math.PI / 2, Math.PI), m.steel);
  gland.position.set(xS, Y1TOP + 0.011, 0);
  gland.castShadow = gland.receiveShadow = true;
  small.add(gland);
  // the oil comes in from the tank under the floor: a thin pipe down into the base, behind the cylinder
  const inlet = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 10, 24, Math.PI / 2), m.steel);
  inlet.position.set(xS - r1 - t1 - 0.06, YB + 0.03, -0.03);
  inlet.rotation.z = -Math.PI / 2;
  inlet.castShadow = inlet.receiveShadow = true;
  small.add(inlet);
  root.add(small);
  // one mesh per material: the cylinder's still parts, and the piston with its rod and handle (they move together)
  mergeStatic(small, { keep: [smallOil, piston1] });
  mergeStatic(piston1);

  // the three lift cylinders (one scale shared by all three)
  const scale = createRuler(num);
  const variants = new Map();
  for (const k of ratios) {
    const r2 = r2For(k);
    const g = new THREE.Group();
    g.name = `LiftCylinder_x${k}`;
    g.add(halfTube(xB, r2, t2, BASE, Y2TOP, m));
    g.add(halfPipe(xS + r1, xB - r2, m));
    g.add(cutFace(r2, m));
    const pipeOil = oilPlane(xS + r1, xB - r2, YB, PIPE, m.oil);
    pipeOil.name = 'OilInPipe';
    const bigOil = oilPlane(xB - r2, xB + r2, YB, Y2LOW, m.oil);
    bigOil.name = 'OilInLift';
    g.add(pipeOil, bigOil);
    const piston = new THREE.Group();
    piston.name = 'BigPiston';
    piston.add(halfPiston(r2 - 0.002, P2H, m));
    const rodR = Math.min(0.16, Math.max(0.05, r2 * 0.36));
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(rodR, rodR, ROD2, 40), m.chrome);
    rod.position.y = P2H + ROD2 / 2;
    piston.add(rod);
    piston.position.set(xB, Y2LOW, 0);
    g.add(piston);
    // the scale on the cut of its left wall
    const ruler = new THREE.Mesh(scale.geo, scale.material);
    ruler.name = 'Scale';
    ruler.position.set(xB - r2 - t2 / 2, RULER0 - 0.02 + scale.height / 2, 0.0016);
    ruler.renderOrder = 3;
    g.add(ruler);
    mergeStatic(piston);
    mergeStatic(g, { keep: [bigOil, piston] });
    g.visible = false;
    root.add(g);
    variants.set(k, { group: g, r2, rodR, bigOil, pipeOil, piston });
  }

  // the platform and the car on it
  const top = new THREE.Group();
  top.name = 'PlatformAndCar';
  const platform = createPlatform();
  const car = createCar();
  car.position.set(0, 0, 0);
  top.add(platform, car);
  top.position.set(xB + 0.04, Y2LOW + P2H + ROD2 + GEO.PLAT_H, 0);
  root.add(top);

  const s = { ratio: ratios[ratios.length - 1], y1: Y1HIGH, h: 0 };
  function setRatio(k) {
    s.ratio = k;
    for (const [kk, v] of variants) v.group.visible = kk === k;
    apply();
  }
  function apply() {
    piston1.position.y = s.y1;
    setOilTop(smallOil, s.y1);
    const v = variants.get(s.ratio);
    v.piston.position.y = Y2LOW + s.h;
    setOilTop(v.bigOil, Y2LOW + s.h);
    top.position.y = Y2LOW + s.h + P2H + ROD2 + GEO.PLAT_H;
  }
  setRatio(s.ratio);

  return {
    root,
    car,
    platform,
    top,
    piston1,
    materials: m,
    /** The meshes a tap on the pump hits (the handle, its rod and the small piston: merged into a few meshes). */
    pumpMeshes: piston1.children,
    get ratio() {
      return s.ratio;
    },
    get r2() {
      return variants.get(s.ratio).r2;
    },
    variant: (k = s.ratio) => variants.get(k),
    setRatio,
    /** The small piston's bottom (m): Y1HIGH with the handle up, 10 cm lower pushed in. */
    setSmall(y1) {
      s.y1 = y1;
      apply();
    },
    /** How far the car has risen (m). */
    setRise(h) {
      s.h = h;
      apply();
    },
    /** The car's top and the platform's top (world y). */
    carTop: () => top.position.y + GEO.CAR_H,
    platTop: () => top.position.y,
    handleY: () => s.y1 + P1H + ROD1,
  };
}
