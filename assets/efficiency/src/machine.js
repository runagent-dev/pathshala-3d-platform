// The winch of the book's example (page 121): a 1000 W electric motor, fed from a battery through a red (+) and a blue
// (−) cable, turns a steel worm; the worm turns a bronze worm wheel (20 teeth, single start: 20 motor turns for one
// turn of the wheel); a 14-tooth pinion on the wheel's shaft turns a 42-tooth gear, and a yellow drum on that gear's
// shaft winds the rope. The rope runs over a pulley at the end of a jib and lifts a pallet of bricks (the load).
// Every tooth is an involute tooth and the gears turn exactly at their ratios, in mesh: set(height) puts every part
// where it is when `height` m of rope has been wound on. Metres; +x to the right, +y up, the camera looks from +z.
import * as THREE from 'three';
import { TRAIN } from './reading.js';

// ── where things are ─────────────────────────────────────────────────────────────────────────────────────────────────
const MOD = 0.012; // m: the gears' module
const SHAFT_Y = 0.72; // the motor's and the worm's axis
const WORM = { x: -0.24, r: 0.04, length: 0.2 };
const WHEEL = { r: (MOD * TRAIN.wheel) / 2, face: 0.04 };
const PINION = { r: (MOD * TRAIN.pinion) / 2, face: 0.05, z: 0.085 };
const GEAR = { r: (MOD * TRAIN.gear) / 2, face: 0.045 };
const MESH_ANGLE = THREE.MathUtils.degToRad(-15); // from the pinion's centre to the big gear's
export const AT = {
  wheel: new THREE.Vector3(WORM.x, SHAFT_Y - WORM.r - WHEEL.r, 0),
  gear: new THREE.Vector3(),
  drum: { z0: 0.15, z1: 0.43, r: TRAIN.drum, flange: 0.175 },
  pulley: new THREE.Vector3(0.76, 1.24, 0.29),
  pulleyR: 0.075,
  motor: { x0: -0.98, x1: -0.5, r: 0.115 },
  battery: { x0: -1.52, x1: -1.13, z0: -0.48, z1: -0.08, h: 0.46 },
  edge: 0.5, // x of the roof's edge on the right (the load comes up past it)
};
AT.gear.set(AT.wheel.x + (PINION.r + GEAR.r) * Math.cos(MESH_ANGLE), AT.wheel.y + (PINION.r + GEAR.r) * Math.sin(MESH_ANGLE), PINION.z);
export const ROPE_X = AT.pulley.x + AT.pulleyR; // where the rope hangs down to the load
const ROPE_R = 0.0075; // m: the rope's radius
const ROPE_PITCH = 0.0165; // m: one turn of rope on the drum
const SPARE = 1.8; // m of rope left on the drum with the load on the ground
export const LOAD = { w: 0.42, d: 0.3, pallet: 0.1, sling: 0.42, hook: 0.16 };

// ── materials ────────────────────────────────────────────────────────────────────────────────────────────────────────
function noiseTexture(size, paint) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  paint(g, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
/** A seeded random (the same picture every time). */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
/** Fine lengthwise wire on the copper windings. */
function windingTexture() {
  const tex = noiseTexture(128, (g, n) => {
    g.fillStyle = '#c8733f';
    g.fillRect(0, 0, n, n);
    for (let y = 0; y < n; y += 4) {
      g.fillStyle = y % 8 ? '#e59a5f' : '#a85a2c';
      g.fillRect(0, y, n, 2);
      g.fillStyle = 'rgba(255,220,170,0.45)';
      g.fillRect(0, y + 1, n, 1);
    }
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(1, 3);
  return tex;
}
/** Brushed lines for steel (as a roughness map). */
function brushedTexture() {
  const r = rng(7);
  return noiseTexture(256, (g, n) => {
    g.fillStyle = '#8a8a8a';
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 900; i++) {
      const v = 100 + r() * 90;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(0, r() * n, n, 0.6 + r());
    }
  });
}
/** A canvas plate with text (nameplates, the battery's display): redraw with draw(g, w, h). */
function plate(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const redraw = (fn = draw) => {
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    g.clearRect(0, 0, w, h);
    fn(g, w, h);
    tex.needsUpdate = true;
  };
  redraw();
  return { tex, redraw };
}

function makeMaterials() {
  const brushed = brushedTexture();
  const steel = new THREE.MeshPhysicalMaterial({ name: 'Steel', color: '#d5dbe2', metalness: 1, roughness: 0.32, roughnessMap: brushed });
  const darkSteel = new THREE.MeshPhysicalMaterial({ name: 'DarkSteel', color: '#6e7782', metalness: 0.9, roughness: 0.4 });
  const gearSteel = new THREE.MeshPhysicalMaterial({ name: 'GearSteel', color: '#c9d0d8', metalness: 1, roughness: 0.26, emissive: '#000000' });
  const bronze = new THREE.MeshPhysicalMaterial({ name: 'Bronze', color: '#d39b4a', metalness: 1, roughness: 0.27, emissive: '#000000' });
  const wormSteel = new THREE.MeshPhysicalMaterial({ name: 'WormSteel', color: '#e3e8ee', metalness: 1, roughness: 0.18, emissive: '#000000' });
  const motorPaint = new THREE.MeshPhysicalMaterial({
    name: 'MotorPaint',
    color: '#1f63c9',
    metalness: 0.25,
    roughness: 0.38,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
  });
  const motorEnd = new THREE.MeshPhysicalMaterial({ name: 'MotorEnd', color: '#cfd5db', metalness: 0.9, roughness: 0.35 });
  const copper = new THREE.MeshPhysicalMaterial({
    name: 'Windings',
    map: windingTexture(),
    color: '#ffffff',
    metalness: 0.85,
    roughness: 0.32,
    emissive: '#000000',
  });
  const lamination = new THREE.MeshPhysicalMaterial({ name: 'Rotor', color: '#59626c', metalness: 0.95, roughness: 0.3 });
  const frame = new THREE.MeshPhysicalMaterial({ name: 'FramePaint', color: '#f08c00', metalness: 0.2, roughness: 0.45, clearcoat: 0.4 });
  const yellow = new THREE.MeshPhysicalMaterial({ name: 'DrumPaint', color: '#fcc419', metalness: 0.15, roughness: 0.4, clearcoat: 0.5 });
  const red = new THREE.MeshPhysicalMaterial({ name: 'RedPaint', color: '#e03131', metalness: 0.15, roughness: 0.4, clearcoat: 0.5 });
  const gearWeb = new THREE.MeshPhysicalMaterial({ name: 'GearWeb', color: '#c92a2a', metalness: 0.2, roughness: 0.42, clearcoat: 0.5 });
  const rope = new THREE.MeshStandardMaterial({ name: 'Rope', color: '#e9ecef', roughness: 0.75, metalness: 0.3 });
  const cableRed = new THREE.MeshPhysicalMaterial({ name: 'CableRed', color: '#e8222b', roughness: 0.35, clearcoat: 0.6 });
  const cableBlue = new THREE.MeshPhysicalMaterial({ name: 'CableBlue', color: '#1c58e8', roughness: 0.35, clearcoat: 0.6 });
  const rubber = new THREE.MeshStandardMaterial({ name: 'Rubber', color: '#25282c', roughness: 0.8 });
  const batteryCase = new THREE.MeshPhysicalMaterial({ name: 'BatteryCase', color: '#2b3138', roughness: 0.5, metalness: 0.2, clearcoat: 0.3 });
  const batteryTop = new THREE.MeshPhysicalMaterial({ name: 'BatteryTop', color: '#ffd43b', roughness: 0.4, clearcoat: 0.5 });
  const brick = new THREE.MeshStandardMaterial({ name: 'Brick', color: '#b5452b', roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ name: 'PalletWood', color: '#c49a5a', roughness: 0.85 });
  const chain = new THREE.MeshPhysicalMaterial({ name: 'Chain', color: '#9aa3ad', metalness: 1, roughness: 0.4 });
  const lampOff = new THREE.MeshStandardMaterial({ name: 'Lamp', color: '#2f6b35', emissive: '#000000', roughness: 0.3 });
  return {
    steel,
    darkSteel,
    gearSteel,
    bronze,
    wormSteel,
    motorPaint,
    motorEnd,
    copper,
    lamination,
    frame,
    yellow,
    red,
    gearWeb,
    rope,
    cableRed,
    cableBlue,
    rubber,
    batteryCase,
    batteryTop,
    brick,
    wood,
    chain,
    lampOff,
  };
}

// ── gears ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const PRESSURE = THREE.MathUtils.degToRad(20);
const inv = (a) => Math.tan(a) - a;
/**
 * The outline of an involute spur gear (z teeth, module m), tooth 0 pointing along +x, with a bore and optional round
 * holes in the web.
 */
function gearShape(z, m, { bore = 0.012, holes = 0, holeR = 0, holeAt = 0 } = {}) {
  const r = (m * z) / 2;
  const ra = r + m;
  const rf = r - 1.25 * m;
  const rb = r * Math.cos(PRESSURE);
  const half = Math.PI / (2 * z) + inv(PRESSURE); // + inv at the pitch circle, − inv(α(ρ)) at radius ρ
  const psi = (rho) => half - inv(Math.acos(Math.min(1, rb / rho)));
  const flank = [];
  const r0 = Math.max(rb, rf);
  for (let i = 0; i <= 5; i++) {
    const rho = r0 + ((ra - r0) * i) / 5;
    flank.push([rho, Math.max(0.004, psi(rho))]);
  }
  const shape = new THREE.Shape();
  const at = (rho, a) => [rho * Math.cos(a), rho * Math.sin(a)];
  for (let k = 0; k < z; k++) {
    const c = (2 * Math.PI * k) / z;
    const gap = c - Math.PI / z;
    const pts = [at(rf, gap), at(rf, c - flank[0][1])];
    for (const [rho, a] of flank) pts.push(at(rho, c - a));
    for (let i = flank.length - 1; i >= 0; i--) pts.push(at(flank[i][0], c + flank[i][1]));
    pts.push(at(rf, c + flank[0][1]));
    for (const [x, y] of pts) {
      if (k === 0 && x === pts[0][0] && y === pts[0][1]) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  }
  shape.closePath();
  const hole = (cx, cy, rr) => {
    const p = new THREE.Path();
    p.absarc(cx, cy, rr, 0, Math.PI * 2, true);
    shape.holes.push(p);
  };
  if (bore) hole(0, 0, bore);
  for (let i = 0; i < holes; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / holes;
    hole(holeAt * Math.cos(a), holeAt * Math.sin(a), holeR);
  }
  return shape;
}
function extrude(shape, depth, bevel = 0.0015) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 1,
    curveSegments: 10,
  });
  geo.translate(0, 0, -depth / 2 + bevel);
  return geo;
}

/** A single-start worm along x: a core and a trapezoid thread on a helix of axial pitch π·m. */
function wormGeometry() {
  const p = Math.PI * MOD;
  const ro = WORM.r + MOD;
  const rr = WORM.r - 1.1 * MOD;
  const wRoot = p * 0.32;
  const wTip = p * 0.12;
  const profile = [
    [rr - 0.002, -wRoot],
    [ro, -wTip],
    [ro, wTip],
    [rr - 0.002, wRoot],
  ];
  const turns = WORM.length / p;
  const steps = Math.ceil(turns * 40);
  const u0 = -Math.PI * turns;
  const pos = [];
  const idx = [];
  for (let i = 0; i <= steps; i++) {
    const u = u0 + (2 * Math.PI * turns * i) / steps;
    for (const [rho, dx] of profile) pos.push((p * u) / (2 * Math.PI) + dx, rho * Math.cos(u), rho * Math.sin(u));
  }
  for (let i = 0; i < steps; i++)
    for (let j = 0; j < 3; j++) {
      const a = i * 4 + j;
      const b = a + 4;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ── small parts ──────────────────────────────────────────────────────────────────────────────────────────────────────
const cyl = (r, len, mat, seg = 24) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
/** A cylinder along x, z (as named), centred at (x, y, z). */
function rod(axis, r, len, mat, x, y, z, seg = 24) {
  const m = cyl(r, len, mat, seg);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}
/** A pillow-block bearing: a cast foot and a round housing round a shaft along `axis`. */
function pillow(mats, axis, x, y, z, base = 0.1) {
  const g = new THREE.Group();
  const hh = y - base;
  const foot = box(axis === 'z' ? 0.13 : 0.05, hh, axis === 'z' ? 0.05 : 0.13, mats.darkSteel);
  foot.position.set(x, base + hh / 2, z);
  const housing = rod(axis, 0.032, 0.05, mats.darkSteel, x, y, z, 28);
  const cap = rod(axis, 0.022, 0.056, mats.steel, x, y, z, 24);
  const sole = box(axis === 'z' ? 0.19 : 0.07, 0.02, axis === 'z' ? 0.07 : 0.19, mats.darkSteel);
  sole.position.set(x, base + 0.01, z);
  g.add(foot, housing, cap, sole);
  return g;
}
/** A tube through points (cables, braces). */
function tube(points, r, mat, seg = 64) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), mat);
  m.userData.curve = curve;
  return m;
}
/** A box from a to b (beams), w × d across. */
function beam(a, b, w, d, mat) {
  const len = a.distanceTo(b);
  const m = box(w, len, d, mat);
  m.position.copy(a).lerp(b, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

/** The rope on the drum: one layer back and forth, `s` m from its fixed end. */
class DrumCoil extends THREE.Curve {
  constructor(length) {
    super();
    this.length = length;
    this.perLayer = Math.floor((AT.drum.z1 - AT.drum.z0 - 0.03) / ROPE_PITCH);
  }
  /** Where the rope is `s` m from its fixed end, in the drum's own frame (before it turns). */
  at(s, out = new THREE.Vector3()) {
    const turn = s / (2 * Math.PI * AT.drum.r);
    const layer = Math.min(3, Math.floor(turn / this.perLayer));
    const inLayer = turn - layer * this.perLayer;
    const along = layer % 2 ? this.perLayer - inLayer : inLayer;
    const r = AT.drum.r + layer * ROPE_PITCH * 0.9;
    const a = Math.PI / 2 + (SPARE - s) / AT.drum.r;
    return out.set(r * Math.cos(a), r * Math.sin(a), AT.drum.z0 + 0.015 + ROPE_PITCH * (along + 0.5));
  }
  getPoint(t, out = new THREE.Vector3()) {
    return this.at(t * this.length, out);
  }
}

/**
 * The machine. Labels drawn on it (the motor's plate, the battery's display, the load's tag) come from the app:
 * `text` = { motorPlate, mass(m) }; `display(g, w, h)` draws the battery's screen.
 */
export function createMachine({ maxHeight = 20 } = {}) {
  const mats = makeMaterials();
  const root = new THREE.Group();
  root.name = 'Winch';

  // ── the base: an orange steel skid on the roof ──
  const skid = new THREE.Group();
  skid.name = 'Skid';
  for (const z of [-0.2, 0.52]) {
    const rail = box(1.55, 0.1, 0.07, mats.frame);
    rail.position.set(-0.33, 0.05, z);
    skid.add(rail);
  }
  for (const x of [-1.08, -0.55, 0, 0.42]) {
    const cross = box(0.07, 0.08, 0.66, mats.frame);
    cross.position.set(x, 0.05, 0.16);
    skid.add(cross);
  }
  const deck = box(1.55, 0.012, 0.72, mats.darkSteel);
  deck.position.set(-0.33, 0.104, 0.16);
  skid.add(deck);
  root.add(skid);

  // ── the battery (IN): a big 48 V pack, yellow lid, + and − terminals, a display, a rotary switch ──
  const battery = new THREE.Group();
  battery.name = 'Battery';
  const B = AT.battery;
  const bw = B.x1 - B.x0;
  const bd = B.z1 - B.z0;
  const bcase = box(bw, B.h - 0.05, bd, mats.batteryCase);
  bcase.position.set((B.x0 + B.x1) / 2, (B.h - 0.05) / 2, (B.z0 + B.z1) / 2);
  const lid = box(bw + 0.012, 0.05, bd + 0.012, mats.batteryTop);
  lid.position.set(bcase.position.x, B.h - 0.025, bcase.position.z);
  battery.add(bcase, lid);
  for (const dz of [-0.13, 0.13]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 20, Math.PI), mats.rubber);
    handle.position.set(bcase.position.x, B.h, bcase.position.z + dz);
    battery.add(handle);
  }
  const terminals = { plus: new THREE.Vector3(B.x0 + 0.08, B.h + 0.03, B.z0 + 0.12), minus: new THREE.Vector3(B.x1 - 0.08, B.h + 0.03, B.z0 + 0.12) };
  for (const [k, p] of Object.entries(terminals)) {
    const post = cyl(0.016, 0.05, mats.steel);
    post.position.copy(p).add(new THREE.Vector3(0, -0.015, 0));
    const cap = cyl(0.03, 0.03, k === 'plus' ? mats.cableRed : mats.cableBlue);
    cap.position.copy(p);
    battery.add(post, cap);
  }
  // the front: a display (P and t) and the switch
  const screen = plate(512, 256, () => {});
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  display.position.set(bcase.position.x, 0.31, B.z1 + 0.002);
  const bezel = box(0.26, 0.14, 0.01, mats.rubber);
  bezel.position.set(bcase.position.x, 0.31, B.z1 - 0.003);
  battery.add(bezel, display);
  const switchPlate = box(0.13, 0.11, 0.012, mats.batteryTop);
  switchPlate.position.set(bcase.position.x - 0.05, 0.13, B.z1 + 0.006);
  const knob = new THREE.Group();
  knob.position.set(bcase.position.x - 0.05, 0.13, B.z1 + 0.012);
  const knobBase = rod('z', 0.03, 0.02, mats.rubber, 0, 0, 0.01, 24);
  const knobBar = box(0.085, 0.022, 0.03, mats.red);
  knobBar.position.z = 0.026;
  knob.add(knobBase, knobBar);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), mats.lampOff);
  lamp.position.set(bcase.position.x + 0.08, 0.13, B.z1 + 0.006);
  battery.add(switchPlate, knob, lamp);
  root.add(battery);

  // ── the motor: blue finned body, a window cut in its side shows the copper windings and the rotor ──
  const motor = new THREE.Group();
  motor.name = 'Motor';
  const M = AT.motor;
  const mLen = M.x1 - M.x0;
  const mx = (M.x0 + M.x1) / 2;
  // angles round the motor's axis are measured from +z (towards the camera) up towards +y
  const WIN = { from: Math.PI * 0.05, to: Math.PI * 0.42 }; // the window in the body, on its upper front
  const PLATE_A = -Math.PI * 0.3; // the nameplate, on its lower front
  // body: an open cylinder round x with the window left out (the cylinder's own angle θ runs the other way: y = −r sin θ)
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(M.r, M.r, mLen * 0.86, 48, 1, true, -WIN.from, Math.PI * 2 - (WIN.to - WIN.from)),
    mats.motorPaint,
  );
  shell.material = mats.motorPaint.clone();
  shell.material.side = THREE.DoubleSide;
  shell.rotation.z = -Math.PI / 2;
  shell.position.set(mx, SHAFT_Y, 0);
  motor.add(shell);
  // cooling fins along the body, not over the window
  const finGeo = new THREE.BoxGeometry(mLen * 0.8, 0.026, 0.008);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 - Math.PI;
    if (a > WIN.from - 0.12 && a < WIN.to + 0.12) continue;
    if (Math.abs(a - PLATE_A) < 0.32) continue;
    const fin = new THREE.Mesh(finGeo, mats.motorPaint);
    fin.position.set(mx, SHAFT_Y + (M.r + 0.008) * Math.sin(a), (M.r + 0.008) * Math.cos(a));
    fin.rotation.x = -a + Math.PI / 2;
    motor.add(fin);
  }
  // end bells, the fan cowl behind, feet
  const front = rod('x', M.r + 0.012, 0.05, mats.motorEnd, M.x1 - 0.02, SHAFT_Y, 0, 40);
  const back = rod('x', M.r + 0.012, 0.05, mats.motorEnd, M.x0 + 0.02, SHAFT_Y, 0, 40);
  const cowl = rod('x', M.r + 0.006, 0.08, mats.motorPaint, M.x0 - 0.04, SHAFT_Y, 0, 40);
  const grille = new THREE.Mesh(new THREE.CircleGeometry(M.r - 0.01, 40), mats.darkSteel);
  grille.rotation.y = -Math.PI / 2;
  grille.position.set(M.x0 - 0.081, SHAFT_Y, 0);
  motor.add(front, back, cowl, grille);
  // a steel plinth bolted to the skid, the motor's feet on it
  const footTop = SHAFT_Y - M.r - 0.012;
  const plinth = box(mLen - 0.02, footTop - 0.03 - 0.1, 0.3, mats.darkSteel);
  plinth.position.set(mx, 0.1 + (footTop - 0.13) / 2, 0);
  motor.add(plinth);
  for (const x of [M.x0 + 0.09, M.x1 - 0.09]) {
    const foot = box(0.07, 0.05, 0.24, mats.motorPaint);
    foot.position.set(x, footTop - 0.005, 0);
    const pad = box(0.09, 0.02, 0.28, mats.steel);
    pad.position.set(x, footTop - 0.04, 0);
    motor.add(foot, pad);
    for (const dz of [-0.11, 0.11]) motor.add(rod('y', 0.009, 0.03, mats.steel, x, footTop - 0.02, dz, 10));
  }
  // inside: the stator's copper windings (end turns and the slots seen through the window) and the turning rotor
  const windings = new THREE.Group();
  windings.name = 'Windings';
  for (const x of [M.x0 + 0.075, M.x1 - 0.075]) {
    const endTurns = new THREE.Mesh(new THREE.TorusGeometry(M.r - 0.03, 0.022, 12, 40), mats.copper);
    endTurns.rotation.y = Math.PI / 2;
    endTurns.position.set(x, SHAFT_Y, 0);
    windings.add(endTurns);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const slot = box(mLen * 0.62, 0.02, 0.026, mats.copper);
    slot.position.set(mx, SHAFT_Y + (M.r - 0.026) * Math.sin(a), (M.r - 0.026) * Math.cos(a));
    slot.rotation.x = -a + Math.PI / 2;
    windings.add(slot);
  }
  motor.add(windings);
  const rotor = new THREE.Group();
  rotor.position.set(mx, SHAFT_Y, 0);
  const core = rod('x', M.r - 0.05, mLen * 0.6, mats.lamination, 0, 0, 0, 36);
  rotor.add(core);
  for (let i = 0; i < 8; i++) {
    const bar = box(mLen * 0.6, 0.008, 0.012, mats.copper);
    const a = (i / 8) * Math.PI * 2;
    bar.position.set(0, (M.r - 0.05) * Math.sin(a), (M.r - 0.05) * Math.cos(a));
    bar.rotation.x = -a + Math.PI / 2;
    rotor.add(bar);
  }
  motor.add(rotor);
  // the terminal box on top, where the cables come in, and the plate "1000 W"
  const tbox = box(0.12, 0.07, 0.1, mats.motorPaint);
  tbox.position.set(mx - 0.06, SHAFT_Y + M.r + 0.045, -0.02);
  const tlid = box(0.13, 0.012, 0.11, mats.motorEnd);
  tlid.position.set(tbox.position.x, SHAFT_Y + M.r + 0.085, -0.02);
  motor.add(tbox, tlid);
  const glands = {
    plus: new THREE.Vector3(tbox.position.x - 0.065, tbox.position.y, -0.035),
    minus: new THREE.Vector3(tbox.position.x - 0.065, tbox.position.y - 0.012, 0.005),
  };
  for (const p of Object.values(glands)) motor.add(rod('x', 0.014, 0.02, mats.rubber, p.x + 0.004, p.y, p.z, 16));
  const nameplate = plate(512, 160, () => {});
  const plateMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.05),
    new THREE.MeshStandardMaterial({ map: nameplate.tex, roughness: 0.4, metalness: 0.3 }),
  );
  const plateN = new THREE.Vector3(0, Math.sin(PLATE_A), Math.cos(PLATE_A));
  plateMesh.position.set(mx, SHAFT_Y, 0).addScaledVector(plateN, M.r + 0.004);
  plateMesh.lookAt(plateMesh.position.clone().add(plateN));
  motor.add(plateMesh);
  root.add(motor);

  // ── shafts, the coupling, bearings ──
  const motorShaft = new THREE.Group();
  motorShaft.position.set(0, SHAFT_Y, 0);
  motorShaft.add(rod('x', 0.014, 0.5, mats.steel, -0.31 + 0.02, 0, 0));
  const coupling = new THREE.Group();
  coupling.add(
    rod('x', 0.03, 0.035, mats.frame, -0.47, 0, 0, 24),
    rod('x', 0.03, 0.035, mats.frame, -0.425, 0, 0, 24),
    rod('x', 0.031, 0.012, mats.rubber, -0.448, 0, 0, 24),
  );
  motorShaft.add(coupling);
  const worm = new THREE.Mesh(wormGeometry(), mats.wormSteel);
  worm.name = 'Worm';
  worm.position.x = WORM.x;
  const wormCore = rod('x', WORM.r - 1.1 * MOD, WORM.length + 0.01, mats.wormSteel, WORM.x, 0, 0, 32);
  motorShaft.add(worm, wormCore);
  root.add(motorShaft);
  root.add(pillow(mats, 'x', -0.39, SHAFT_Y, 0), pillow(mats, 'x', -0.09, SHAFT_Y, 0));

  // the worm wheel (bronze) and the pinion on one shaft along z
  const wheelShaft = new THREE.Group();
  wheelShaft.position.copy(AT.wheel).setZ(0);
  const wheel = new THREE.Mesh(extrude(gearShape(TRAIN.wheel, MOD, { bore: 0.014, holes: 5, holeR: 0.017, holeAt: 0.06 }), WHEEL.face), mats.bronze);
  wheel.name = 'WormWheel';
  const pinion = new THREE.Mesh(extrude(gearShape(TRAIN.pinion, MOD, { bore: 0.014 }), PINION.face), mats.gearSteel);
  pinion.name = 'Pinion';
  pinion.position.z = PINION.z;
  const wheelGroup = new THREE.Group();
  wheelGroup.add(wheel, pinion, rod('z', 0.018, 0.3, mats.steel, 0, 0, 0.03), rod('z', 0.026, 0.03, mats.steel, 0, 0, -0.035, 24));
  wheelShaft.add(wheelGroup);
  root.add(wheelShaft);
  root.add(pillow(mats, 'z', AT.wheel.x, AT.wheel.y, -0.1));

  // the big gear and the drum on one shaft along z
  const drumShaft = new THREE.Group();
  drumShaft.position.copy(AT.gear).setZ(0);
  const gearGroup = new THREE.Group();
  const D = AT.drum;
  const gear = new THREE.Mesh(extrude(gearShape(TRAIN.gear, MOD, { bore: 0.02, holes: 6, holeR: 0.045, holeAt: 0.16 }), GEAR.face), mats.gearSteel);
  gear.name = 'BigGear';
  gear.position.z = PINION.z;
  // a red painted web inside the teeth
  const webShape = new THREE.Shape();
  webShape.absarc(0, 0, GEAR.r - 1.5 * MOD, 0, Math.PI * 2, false);
  for (let i = 0; i < 6; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / 6;
    const p = new THREE.Path();
    p.absarc(0.16 * Math.cos(a), 0.16 * Math.sin(a), 0.047, 0, Math.PI * 2, true);
    webShape.holes.push(p);
  }
  const hubHole = new THREE.Path();
  hubHole.absarc(0, 0, 0.02, 0, Math.PI * 2, true);
  webShape.holes.push(hubHole);
  for (const side of [-1, 1]) {
    const web = new THREE.Mesh(new THREE.ShapeGeometry(webShape, 24), mats.gearWeb);
    web.position.z = PINION.z + side * (GEAR.face / 2 + 0.0008);
    if (side < 0) web.rotation.y = Math.PI;
    gearGroup.add(web);
  }
  const hub = rod('z', 0.04, GEAR.face + 0.03, mats.steel, 0, 0, PINION.z, 32);
  gearGroup.add(gear, hub);
  // the drum: barrel, flanges, spokes on the front flange so its turning shows
  const drumLen = D.z1 - D.z0;
  const barrel = rod('z', D.r - ROPE_R, drumLen, mats.yellow, 0, 0, (D.z0 + D.z1) / 2, 48);
  const flangeGeo = new THREE.CylinderGeometry(D.flange, D.flange, 0.014, 56);
  const f0 = new THREE.Mesh(flangeGeo, mats.yellow);
  f0.rotation.x = Math.PI / 2;
  f0.position.z = D.z0;
  const f1 = f0.clone();
  f1.position.z = D.z1;
  gearGroup.add(barrel, f0, f1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const rib = box(D.flange - 0.03, 0.016, 0.012, i % 3 ? mats.frame : mats.red);
    rib.position.set(Math.cos(a) * (D.flange / 2 + 0.01), Math.sin(a) * (D.flange / 2 + 0.01), D.z1 + 0.012);
    rib.rotation.z = a;
    gearGroup.add(rib);
  }
  const boss = rod('z', 0.035, 0.03, mats.red, 0, 0, D.z1 + 0.015, 32);
  gearGroup.add(boss, rod('z', 0.022, D.z1 + 0.2, mats.steel, 0, 0, (D.z1 + 0.2) / 2 - 0.06));
  // the rope wound on the drum (drawn up to how much is wound)
  const coilLength = SPARE + maxHeight + 0.5;
  const coilCurve = new DrumCoil(coilLength);
  const coilSegs = Math.ceil((coilLength / (2 * Math.PI * D.r)) * 28);
  const coilGeo = new THREE.TubeGeometry(coilCurve, coilSegs, ROPE_R, 6, false);
  const coil = new THREE.Mesh(coilGeo, mats.rope);
  coil.name = 'RopeOnDrum';
  gearGroup.add(coil);
  drumShaft.add(gearGroup);
  root.add(drumShaft);
  root.add(pillow(mats, 'z', AT.gear.x, AT.gear.y, -0.04), pillow(mats, 'z', AT.gear.x, AT.gear.y, D.z1 + 0.09));

  // ── the jib: a yellow post behind the rope, an arm out over the edge, the pulley ──
  const jib = new THREE.Group();
  jib.name = 'Jib';
  const postBase = new THREE.Vector3(0.36, 0, -0.16);
  const postTop = new THREE.Vector3(0.36, AT.pulley.y + 0.22, -0.16);
  const armEnd = new THREE.Vector3(AT.pulley.x, AT.pulley.y + 0.16, AT.pulley.z);
  jib.add(beam(postBase, postTop, 0.08, 0.08, mats.yellow));
  jib.add(beam(postTop.clone().add(new THREE.Vector3(0, -0.03, 0)), armEnd.clone().add(new THREE.Vector3(0.06, 0, 0)), 0.07, 0.07, mats.yellow));
  jib.add(
    beam(new THREE.Vector3(0.36, AT.pulley.y - 0.45, -0.16), armEnd.clone().add(new THREE.Vector3(-0.12, -0.02, -0.03)), 0.035, 0.035, mats.frame),
  );
  const basePlate = box(0.24, 0.02, 0.24, mats.darkSteel);
  basePlate.position.set(postBase.x, 0.01, postBase.z);
  jib.add(basePlate);
  for (const dz of [-0.022, 0.022]) {
    const cheek = box(0.05, 0.2, 0.008, mats.frame);
    cheek.position.set(AT.pulley.x, AT.pulley.y + 0.07, AT.pulley.z + dz);
    jib.add(cheek);
  }
  const pulley = new THREE.Group();
  pulley.position.copy(AT.pulley);
  const sheave = new THREE.Mesh(new THREE.TorusGeometry(AT.pulleyR, 0.012, 10, 40), mats.red);
  const sheaveDisc = new THREE.Mesh(new THREE.CylinderGeometry(AT.pulleyR - 0.006, AT.pulleyR - 0.006, 0.02, 36), mats.darkSteel);
  sheaveDisc.rotation.x = Math.PI / 2;
  pulley.add(sheave, sheaveDisc, rod('z', 0.012, 0.06, mats.steel, 0, 0, 0, 16));
  for (let i = 0; i < 4; i++) {
    const spoke = box(AT.pulleyR * 1.6, 0.01, 0.024, mats.steel);
    spoke.rotation.z = (i * Math.PI) / 4;
    pulley.add(spoke);
  }
  jib.add(pulley);
  root.add(jib);

  // ── the rope off the drum: to the pulley, round it, and down to the hook ──
  const ropeUp = rod('y', ROPE_R, 1, mats.rope, 0, 0, 0, 8);
  ropeUp.name = 'Rope';
  const ropeDown = rod('y', ROPE_R, 1, mats.rope, 0, 0, 0, 8);
  const ropeArc = new THREE.Mesh(new THREE.TorusGeometry(AT.pulleyR, ROPE_R, 6, 24, Math.PI / 2), mats.rope);
  ropeArc.position.copy(AT.pulley);
  const ropes = new THREE.Group();
  ropes.name = 'RopeFree';
  ropes.add(ropeUp, ropeDown, ropeArc);
  root.add(ropes);

  // ── the load: a hook block, four chain slings, a pallet of red bricks with a mass tag ──
  const load = new THREE.Group();
  load.name = 'Load';
  const hookBlock = new THREE.Group();
  const blockBody = box(0.07, 0.09, 0.05, mats.red);
  blockBody.position.y = LOAD.pallet + 0.3 + LOAD.sling + 0.075;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 10, 24, Math.PI * 1.5), mats.steel);
  hook.position.y = LOAD.pallet + 0.3 + LOAD.sling;
  hook.rotation.z = Math.PI * 0.75;
  hookBlock.add(blockBody, hook);
  load.add(hookBlock);
  const pallet = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const slat = box(LOAD.w, 0.018, 0.05, mats.wood);
    slat.position.set(0, LOAD.pallet - 0.009, -LOAD.d / 2 + 0.025 + (i * (LOAD.d - 0.05)) / 4);
    pallet.add(slat);
  }
  for (const x of [-LOAD.w / 2 + 0.03, 0, LOAD.w / 2 - 0.03]) {
    const runner = box(0.05, LOAD.pallet - 0.018, LOAD.d, mats.wood);
    runner.position.set(x, (LOAD.pallet - 0.018) / 2, 0);
    pallet.add(runner);
  }
  load.add(pallet);
  // 72 bricks at most (200 kg): layers of 3 × 4, each layer a little offset from the one below
  const brickGeo = new THREE.BoxGeometry(0.128, 0.064, 0.07);
  const bricks = new THREE.InstancedMesh(brickGeo, mats.brick, 72);
  bricks.name = 'Bricks';
  const tint = new THREE.Color();
  const r = rng(3);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 72; i++) {
    const layer = Math.floor(i / 12);
    const k = i % 12;
    const shift = layer % 2 ? 0.01 : -0.01;
    m4.makeTranslation(((k % 3) - 1) * 0.134 + shift, LOAD.pallet + 0.033 + layer * 0.068, (Math.floor(k / 3) - 1.5) * 0.074);
    bricks.setMatrixAt(i, m4);
    const v = 0.78 + r() * 0.34;
    bricks.setColorAt(i, tint.setRGB(v, v * (0.86 + r() * 0.14), v * (0.82 + r() * 0.16)));
  }
  bricks.instanceMatrix.needsUpdate = true;
  load.add(bricks);
  const slings = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const sling = rod('y', 0.004, 1, mats.chain, 0, 0, 0, 6);
      sling.userData.corner = new THREE.Vector3((sx * LOAD.w) / 2 - sx * 0.02, LOAD.pallet, (sz * LOAD.d) / 2 - sz * 0.02);
      slings.push(sling);
      load.add(sling);
    }
  const tag = plate(256, 128, () => {});
  const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.075), new THREE.MeshBasicMaterial({ map: tag.tex, toneMapped: false }));
  tagMesh.position.set(0, LOAD.pallet + 0.07, 0.152);
  load.add(tagMesh);
  load.position.set(ROPE_X, -10, AT.pulley.z);
  root.add(load);

  // the cables, from the battery's terminals into the motor's terminal box (redrawn by setCables at build)
  const cables = new THREE.Group();
  cables.name = 'Cables';
  const T = terminals;
  const redCable = tube(
    [
      T.plus,
      T.plus.clone().add(new THREE.Vector3(0.02, 0.2, 0.02)),
      new THREE.Vector3(-1.15, 0.98, -0.02),
      new THREE.Vector3(-0.98, 0.98, -0.04),
      glands.plus.clone().add(new THREE.Vector3(-0.08, 0.06, 0)),
      glands.plus,
    ],
    0.011,
    mats.cableRed,
  );
  const blueCable = tube(
    [
      T.minus,
      T.minus.clone().add(new THREE.Vector3(0.01, 0.1, 0.05)),
      new THREE.Vector3(-1.06, 0.62, 0.1),
      new THREE.Vector3(-0.98, 0.88, 0.07),
      glands.minus.clone().add(new THREE.Vector3(-0.06, 0.03, 0.01)),
      glands.minus,
    ],
    0.011,
    mats.cableBlue,
  );
  cables.add(redCable, blueCable);
  root.add(cables);

  // ── where parts are, for the app's effects, labels and rings ──
  const points = {
    wormMesh: new THREE.Vector3(WORM.x, SHAFT_Y - WORM.r, 0),
    gearMesh: new THREE.Vector3(
      AT.wheel.x + PINION.r * Math.cos(MESH_ANGLE),
      AT.wheel.y + PINION.r * Math.sin(MESH_ANGLE),
      PINION.z + PINION.face / 2,
    ),
    motor: new THREE.Vector3(mx, SHAFT_Y, 0),
    motorTop: new THREE.Vector3(mx, SHAFT_Y + M.r + 0.02, 0),
    window: new THREE.Vector3(mx, SHAFT_Y + M.r * Math.sin((WIN.from + WIN.to) / 2), M.r * Math.cos((WIN.from + WIN.to) / 2)),
    gears: new THREE.Vector3(AT.wheel.x + 0.12, AT.wheel.y + 0.02, 0.1),
    battery: new THREE.Vector3((B.x0 + B.x1) / 2, B.h, B.z1),
    switch: knob.position,
    drumTop: new THREE.Vector3(),
    hook: new THREE.Vector3(),
  };

  // ── moving it: everything follows from the rope wound on, h ──
  const v = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const state = { height: 0, liftTo: 10, hookY: LOAD.pallet + 0.3 + LOAD.sling };
  let coilShown = -1;
  /** h: rope wound on since the load left the ground (m); liftTo: the whole lift (the load starts liftTo m down). */
  function set(height, liftTo = state.liftTo) {
    state.height = height;
    state.liftTo = liftTo;
    const drumTurn = height / D.r; // radians: positive winds the rope on (the drum's top moves towards the jib)
    const shaftTurn = -drumTurn * (TRAIN.gear / TRAIN.pinion);
    const motorTurn = shaftTurn * TRAIN.wheel;
    // the worm turns with the motor; the wheel follows it a twentieth as fast, tooth in a gap of the thread
    motorShaft.rotation.x = motorTurn;
    rotor.rotation.x = motorTurn;
    const wheelAngle = Math.PI / 2 + motorTurn / TRAIN.wheel;
    wheelGroup.rotation.z = wheelAngle;
    // the big gear: its gap faces the pinion's tooth along the line of centres
    const pinionAngle = wheelAngle;
    const gearAngle = MESH_ANGLE + Math.PI - Math.PI / TRAIN.gear - (pinionAngle - MESH_ANGLE) * (TRAIN.pinion / TRAIN.gear);
    gearGroup.rotation.z = gearAngle;
    // the rope wound on the drum, up to where it leaves the top (in the drum's frame that point is where the drum
    // has turned it to the top: the coil is drawn in the drum's frame at gearAngle = 0 plus the wound part)
    const wound = SPARE + height;
    const segs = Math.min(coilSegs, Math.ceil((wound / coilLength) * coilSegs));
    if (segs !== coilShown) {
      coilGeo.setDrawRange(0, segs * 6 * 6);
      coilShown = segs;
    }
    // the coil is built for a drum at rest; the drum's own turn is gearAngle − its value at height 0
    coilCurve.at(wound, v);
    v.applyAxisAngle(zAxis, drumTurn);
    // leaving point on the drum's top (world)
    points.drumTop.set(AT.gear.x + v.x, AT.gear.y + v.y, v.z);
    // to the pulley: the upper tangent from the leaving point to the sheave
    const P = AT.pulley;
    const dx = points.drumTop.x - P.x;
    const dy = points.drumTop.y - P.y;
    const d = Math.hypot(dx, dy);
    const gamma = Math.atan2(dy, dx);
    const off = Math.acos(Math.min(1, AT.pulleyR / d));
    const a1 = gamma + off;
    const a2 = gamma - off;
    const ta = Math.sin(a1) > Math.sin(a2) ? a1 : a2;
    tangent.set(P.x + AT.pulleyR * Math.cos(ta), P.y + AT.pulleyR * Math.sin(ta), P.z);
    stretch(ropeUp, points.drumTop, tangent);
    ropeArc.geometry.dispose();
    ropeArc.geometry = new THREE.TorusGeometry(AT.pulleyR, ROPE_R, 6, 16, Math.max(0.01, ta));
    pulley.rotation.z = -height / AT.pulleyR;
    // the load: its pallet's bottom from liftTo m below the roof up to the roof's level
    const bottom = -liftTo + height;
    load.position.y = bottom;
    points.hook.set(ROPE_X, bottom + state.hookY + 0.12, P.z);
    stretch(ropeDown, new THREE.Vector3(ROPE_X, P.y, P.z), points.hook);
    hookBlock.position.y = state.hookY - (LOAD.pallet + 0.3 + LOAD.sling);
    for (const s of slings) stretch(s, s.userData.corner, new THREE.Vector3(0, state.hookY, 0));
  }
  // the coil is drawn for the drum at height 0; turn it back by the gear's own angle there
  coil.rotation.z = -(MESH_ANGLE + Math.PI - Math.PI / TRAIN.gear - (Math.PI / 2 - MESH_ANGLE) * (TRAIN.pinion / TRAIN.gear));
  const up = new THREE.Vector3(0, 1, 0);
  function stretch(mesh, a, b) {
    const len = Math.max(1e-4, a.distanceTo(b));
    mesh.position.copy(a).lerp(b, 0.5);
    mesh.scale.set(1, len, 1);
    mesh.quaternion.setFromUnitVectors(up, v.copy(b).sub(a).normalize());
  }

  /** How many bricks: about m / 2.8 kg, whole layers of 12 where possible. */
  function setMass(m) {
    const n = Math.max(6, Math.min(72, Math.round(m / 2.78)));
    bricks.count = n;
    state.hookY = LOAD.pallet + Math.max(0.3, Math.ceil(n / 12) * 0.068 + 0.02) + LOAD.sling;
    set(state.height, state.liftTo);
  }

  /** The switch: on (turned a quarter, the lamp green) or off. */
  function setSwitch(on) {
    knob.rotation.z = on ? -Math.PI / 2 : 0;
    mats.lampOff.emissive.set(on ? '#3dff62' : '#000000');
    mats.lampOff.color.set(on ? '#9dffa9' : '#2f6b35');
  }

  /**
   * Heat on the parts: the motor's windings and the gears glow from dull to orange (0…1), the gears tinted as they
   * warm. Friction: how rough the gears look (worn: rusty and dull; oiled: glossy and dark with oil).
   */
  const glow = new THREE.Color();
  function setHeat({ motor: hm = 0, gears: hg = 0 }) {
    mats.copper.emissive.copy(glow.setRGB(1, 0.25 + 0.2 * hm, 0.02).multiplyScalar(hm * 1.1));
    for (const m of [mats.bronze, mats.gearSteel, mats.wormSteel]) m.emissive.copy(glow.setRGB(1, 0.3, 0.05).multiplyScalar(hg * 0.35));
  }
  const LOOK = {
    book: { gear: '#c9d0d8', bronze: '#d39b4a', rough: 0.26 },
    oiled: { gear: '#b9c2cc', bronze: '#c08a3c', rough: 0.1 },
    worn: { gear: '#a88f7b', bronze: '#a57a46', rough: 0.62 },
  };
  function setCondition(cond) {
    const look = LOOK[cond] || LOOK.book;
    mats.gearSteel.color.set(look.gear);
    mats.wormSteel.color.set(cond === 'worn' ? '#b39a86' : cond === 'oiled' ? '#d2d9e0' : '#e3e8ee');
    mats.bronze.color.set(look.bronze);
    for (const m of [mats.gearSteel, mats.bronze, mats.wormSteel]) {
      m.roughness = look.rough;
      m.clearcoat = cond === 'oiled' ? 1 : 0;
      m.clearcoatRoughness = 0.05;
    }
  }

  /** The motor's nameplate and the load's mass tag (text from the app, in Bangla). */
  function setTexts({ plateText, plateSub, massText }) {
    nameplate.redraw((g, w, h) => {
      g.fillStyle = '#e9ecef';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#495057';
      g.lineWidth = 8;
      g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#1b1e22';
      g.font = `700 78px "Noto Sans Bengali", sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(plateText, w / 2, h * 0.42);
      g.font = `500 34px "Noto Sans Bengali", sans-serif`;
      g.fillText(plateSub, w / 2, h * 0.8);
    });
    tag.redraw((g, w, h) => {
      g.fillStyle = '#ffd43b';
      g.beginPath();
      g.roundRect(4, 4, w - 8, h - 8, 16);
      g.fill();
      g.lineWidth = 6;
      g.strokeStyle = '#1b1e22';
      g.stroke();
      g.fillStyle = '#1b1e22';
      g.font = `700 64px "Noto Sans Bengali", sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(massText, w / 2, h / 2 + 4);
    });
  }
  /** The battery's display: draw(g, w, h) paints it. */
  const setDisplay = (draw) => screen.redraw(draw);

  set(0, 10);
  setSwitch(false);
  setCondition('book');

  return {
    root,
    parts: { battery, cables, motor, windings, worm, wheel, pinion, gear, gearGroup, drum: gearGroup, rope: ropes, coil, load, jib, pulley },
    points,
    curves: { red: redCable.userData.curve, blue: blueCable.userData.curve },
    set,
    setMass,
    setSwitch,
    setHeat,
    setCondition,
    setTexts,
    setDisplay,
    get height() {
      return state.height;
    },
  };
}
