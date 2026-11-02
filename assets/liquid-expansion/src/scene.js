// The 3D scene of the figure, in centimetres: a lab bench with a slate-blue top in front of a warm apricot wall,
// and one of two rigs on it (only one is drawn at a time):
//  - the flask of the book's Fig 6.06: a round glass bulb with a long narrow neck, held by a clamp on a stand, with
//    the marks A, B, C round the neck, the liquid inside, and a spirit lamp with its flame under the bulb;
//  - the fever thermometer of Fig 6.05: a glass tube with mercury, the narrow bend (constriction) at its foot and a
//    scale behind the column, held by a clamp, over a beaker of warm water.
// Modest geometry; nothing is rebuilt per frame: the liquid is a cylinder that is only scaled, the flame only scaled.
import * as THREE from 'three';
import { NECK_AREA, THERMO } from './reading.js';

export const BENCH_Y = -10.5;
export const FLASK_GEO = { R: 4.2, neckOuter: 1.0, neckInner: Math.sqrt(NECK_AREA / Math.PI), neckBottom: 3.4, neckTop: 12.2, A: 8.0 };
/** Thermometer geometry: where the 35 °C mark is and how far one degree is drawn (cm). */
export const THERMO_GEO = { y35: 3.0, perDeg: 0.9, pinchY: 2.0, stemTop: 11.6, bulbR: 0.9, bulbRy: 1.3, stemR: 0.62, dip: -4.6, rest: BENCH_Y + 6.9 };
export const thermoY = (T) => THERMO_GEO.y35 + (T - THERMO.T0) * THERMO_GEO.perDeg;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')) };
}
function seeded(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function tex(c, repeat = [1, 1]) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  return t;
}
/** The bench top: slate blue with a faint speckle. */
function benchTexture() {
  const { c, ctx } = canvas(256, 256);
  const r = seeded(3);
  ctx.fillStyle = '#3e5577';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    const g = r() < 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${g},${g},${g},${0.03 + r() * 0.05})`;
    ctx.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2);
  }
  return tex(c, [6, 2]);
}
/** The wall: soft apricot, lighter up high where the window light falls. */
function wallTexture() {
  const { c, ctx } = canvas(512, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#f4cfa8');
  g.addColorStop(0.6, '#eebb8f');
  g.addColorStop(1, '#e3a172');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const glow = ctx.createRadialGradient(256, 150, 10, 256, 150, 330);
  glow.addColorStop(0, 'rgba(255,236,210,0.5)');
  glow.addColorStop(1, 'rgba(255,248,232,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);
  const r = seeded(13);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(150,90,50,${0.015 + r() * 0.025})`;
    ctx.fillRect(r() * 512, r() * 512, 2, 2);
  }
  return tex(c);
}
/** The strip behind the thermometer's column: white enamel with the scale's ticks (35 to 42 °C, every 0.5). */
function scaleTexture() {
  const W = 64;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = '#fbfaf5';
  ctx.fillRect(0, 0, W, H);
  const y0 = THERMO_GEO.y35 - 0.8; // the strip spans y0 … y1 in cm
  const y1 = THERMO_GEO.stemTop - 0.6;
  const toPx = (y) => H - ((y - y0) / (y1 - y0)) * H;
  ctx.fillStyle = '#26303b';
  for (let k = 0; k <= (THERMO.TMAX - THERMO.T0) * 2; k++) {
    const T = THERMO.T0 + k / 2;
    const long = Number.isInteger(T);
    const y = toPx(thermoY(T));
    ctx.fillRect(long ? 6 : 16, y - 1.5, long ? 28 : 18, 3);
  }
  ctx.fillStyle = '#c9302c'; // the fever mark, 37.0 °C, as on a real thermometer
  ctx.fillRect(4, toPx(thermoY(37)) - 2, 32, 4);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return { map: t, y0, y1 };
}

function makeMaterials() {
  const glass = (opacity, color = '#e6f3ff') =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    });
  return {
    glass: glass(0.2),
    glassThin: glass(0.36, '#cfe6fb'),
    glassEdge: new THREE.MeshPhysicalMaterial({ color: '#a9c8dc', roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 1 }),
    liquid: new THREE.MeshStandardMaterial({ color: '#2f8fe0', roughness: 0.1, transparent: true, opacity: 0.62, depthWrite: false }),
    surface: new THREE.MeshStandardMaterial({ color: '#8fd0ff', roughness: 0.05, transparent: true, opacity: 0.85, depthWrite: false }),
    mark: new THREE.MeshStandardMaterial({ color: '#d03030', roughness: 0.45 }),
    steel: new THREE.MeshStandardMaterial({ color: '#566270', metalness: 0.85, roughness: 0.35 }),
    black: new THREE.MeshStandardMaterial({ color: '#27303a', roughness: 0.55 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c8963e', metalness: 0.9, roughness: 0.3 }),
    wick: new THREE.MeshStandardMaterial({ color: '#efe3c4', roughness: 0.9 }),
    fuel: new THREE.MeshStandardMaterial({ color: '#d9c06a', roughness: 0.2, transparent: true, opacity: 0.55, depthWrite: false }),
    flameOuter: new THREE.MeshBasicMaterial({ color: '#ff8a1f', transparent: true, opacity: 0.88, depthWrite: false }),
    flameInner: new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: 0.95, depthWrite: false }),
    mercury: new THREE.MeshStandardMaterial({ color: '#5a6672', metalness: 1, roughness: 0.16 }),
    water: new THREE.MeshStandardMaterial({ color: '#58aef0', roughness: 0.08, transparent: true, opacity: 0.55, depthWrite: false }),
  };
}

/** A teardrop flame (a lathe), tip up, base at y = 0, height h, widest r. */
function flameGeometry(h, r) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const k = i / 14; // 0 base … 1 tip
    pts.push(new THREE.Vector2(Math.max(0.001, r * Math.sin(Math.PI * k ** 0.7) * (1 - 0.15 * k)), h * k));
  }
  return new THREE.LatheGeometry(pts, 20);
}

/** The retort stand: a base plate, a rod, and an arm with a clamp that ends at (reachX, armY). */
function createStand(mat, { x, armY, reachX, rodTop }) {
  const g = new THREE.Group();
  g.name = 'Stand';
  const base = new THREE.Mesh(new THREE.BoxGeometry(9, 0.9, 6), mat.black);
  base.position.set(x, BENCH_Y + 0.45, -1);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, rodTop - BENCH_Y, 16), mat.steel);
  rod.position.set(x - 2, BENCH_Y + (rodTop - BENCH_Y) / 2, -1);
  const arm = new THREE.Group();
  const len = Math.abs(reachX - (x - 2));
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, len, 14), mat.steel);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(x - 2 + len / 2, 0, -0.5);
  const boss = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), mat.black);
  boss.position.set(x - 2, 0, -1);
  arm.add(bar, boss);
  arm.position.y = armY;
  g.add(base, rod, arm);
  for (const m of [base, rod, bar, boss]) m.castShadow = true;
  base.receiveShadow = true;
  return { root: g, arm };
}

export function createScene({ background = true } = {}) {
  const mat = makeMaterials();
  const root = new THREE.Group();
  root.name = 'LiquidExpansion';

  if (background) {
    const room = new THREE.Group();
    room.name = 'Room';
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(260, 3, 60),
      new THREE.MeshStandardMaterial({ map: benchTexture(), roughness: 0.38, metalness: 0.05 }),
    );
    top.position.set(0, BENCH_Y - 1.5, 6);
    top.receiveShadow = true;
    const edge = new THREE.Mesh(new THREE.BoxGeometry(260, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: '#2b3d58', roughness: 0.35 }));
    edge.position.set(0, BENCH_Y - 0.25, 36);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(320, 100), new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.95 }));
    wall.position.set(0, BENCH_Y + 49, -24);
    wall.receiveShadow = true;
    const band = new THREE.Mesh(new THREE.BoxGeometry(320, 0.8, 0.4), new THREE.MeshStandardMaterial({ color: '#1f7a86', roughness: 0.4 }));
    band.position.set(0, BENCH_Y + 0.4, -23.8);
    room.add(top, edge, wall, band);
    room.userData.noExport = true; // the GLB is the apparatus only
    root.add(room);
  }

  // ════ the flask (Fig 6.06) ═══════════════════════════════════════════════════
  const F = FLASK_GEO;
  const flask = new THREE.Group();
  flask.name = 'Flask';
  root.add(flask);
  const glassBulb = new THREE.Group(); // the bulb grows a little when it is heated
  const bulbGlass = new THREE.Mesh(new THREE.SphereGeometry(F.R, 48, 32), mat.glass);
  const bulbLiquid = new THREE.Mesh(new THREE.SphereGeometry(F.R - 0.12, 40, 28), mat.liquid);
  bulbLiquid.castShadow = true;
  glassBulb.add(bulbGlass, bulbLiquid);
  flask.add(glassBulb);
  const neckLen = F.neckTop - F.neckBottom;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(F.neckOuter, F.neckOuter, neckLen, 32, 1, true), mat.glass);
  neck.position.y = F.neckBottom + neckLen / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(F.neckOuter - 0.05, 0.13, 10, 32), mat.glassEdge);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = F.neckTop;
  // the liquid in the neck: a unit cylinder from the bulb's top to the level, only scaled
  const column = new THREE.Mesh(new THREE.CylinderGeometry(F.neckInner, F.neckInner, 1, 28, 1, true), mat.liquid);
  const surface = new THREE.Mesh(new THREE.CylinderGeometry(F.neckInner, F.neckInner, 0.07, 28), mat.surface);
  flask.add(neck, rim, column, surface);
  const COL_BOTTOM = F.R - 0.4; // inside the bulb's top, so the two liquids join
  /** Puts the liquid's top at height y (cm above the bulb's centre) and the bulb at scale k. */
  function setFlask(y, k = 1) {
    glassBulb.scale.setScalar(k);
    const h = Math.max(0.01, y - COL_BOTTOM);
    column.scale.y = h;
    column.position.y = COL_BOTTOM + h / 2;
    surface.position.y = y;
  }
  // the marks A, B, C: thin red rings round the neck, drawn a little outside the glass like the book's lines
  const marks = {};
  const markGeo = new THREE.TorusGeometry(F.neckOuter + 0.04, 0.05, 8, 40).rotateX(Math.PI / 2);
  for (const id of ['A', 'B', 'C']) {
    const m = new THREE.Mesh(markGeo, mat.mark);
    m.name = `Mark_${id}`;
    m.visible = id === 'A';
    flask.add(m);
    marks[id] = m;
  }
  function setMarks(AB, BC, show = { A: true, B: false, C: false }) {
    marks.A.position.y = F.A;
    marks.B.position.y = F.A - AB;
    marks.C.position.y = F.A - AB + BC;
    for (const id of ['A', 'B', 'C']) marks[id].visible = Boolean(show[id]);
  }
  // two bars beside the neck: AB (the bulb's expansion, teal) and BC (the liquid's real expansion, orange), each with
  // a white edge so it reads on the wall and on the glass
  const bars = {};
  const barGeo = new THREE.BoxGeometry(0.2, 1, 0.2);
  const edgeGeo = new THREE.BoxGeometry(0.34, 1, 0.12);
  const barX = { VB: -F.neckOuter - 0.62, VL: -F.neckOuter - 1.22 };
  const barColor = { VB: '#0c8599', VL: '#d9480f' };
  for (const id of ['VB', 'VL']) {
    const g = new THREE.Group();
    g.name = `Bar_${id}`;
    const edge = new THREE.Mesh(edgeGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    edge.position.z = -0.06;
    const bar = new THREE.Mesh(barGeo, new THREE.MeshStandardMaterial({ color: barColor[id], roughness: 0.4 }));
    g.add(edge, bar);
    g.position.x = barX[id];
    g.visible = false;
    flask.add(g);
    bars[id] = g;
  }
  /** Puts the bars where AB and BC are, and shows them (or not). */
  function setBars(AB, BC, show = { VB: false, VL: false }) {
    bars.VB.scale.y = AB;
    bars.VB.position.y = F.A - AB / 2;
    bars.VL.scale.y = BC;
    bars.VL.position.y = F.A - AB + BC / 2;
    bars.VB.visible = Boolean(show.VB);
    bars.VL.visible = Boolean(show.VL);
  }
  // the stand and clamp holding the neck, and a spirit lamp with its flame under the bulb
  const flaskStand = createStand(mat, { x: -7.5, armY: 5.0, reachX: -F.neckOuter - 0.2, rodTop: 8.2 });
  const clampF = new THREE.Mesh(new THREE.TorusGeometry(F.neckOuter + 0.18, 0.2, 8, 24), mat.black);
  clampF.rotation.x = Math.PI / 2;
  clampF.position.y = 5.0;
  flask.add(flaskStand.root, clampF);
  const lamp = new THREE.Group();
  lamp.name = 'SpiritLamp';
  const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.7, 2.6, 28), mat.glass);
  lampBody.position.y = BENCH_Y + 1.3;
  const fuel = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.55, 1.5, 28), mat.fuel);
  fuel.position.y = BENCH_Y + 0.85;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.1, 0.6, 20), mat.brass);
  cap.position.y = BENCH_Y + 2.9;
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 10), mat.wick);
  wick.position.y = BENCH_Y + 3.45;
  lamp.add(fuel, lampBody, cap, wick);
  lampBody.castShadow = true;
  const FLAME_BASE = BENCH_Y + 3.7;
  const flame = new THREE.Group();
  flame.name = 'Flame';
  const flameOut = new THREE.Mesh(flameGeometry(3.0, 0.75), mat.flameOuter);
  const flameIn = new THREE.Mesh(flameGeometry(1.7, 0.4), mat.flameInner);
  flame.add(flameOut, flameIn);
  flame.position.y = FLAME_BASE;
  flame.visible = false;
  lamp.add(flame);
  flask.add(lamp);
  /** The flame's height: 0 hides it. */
  function setFlame(k) {
    flame.visible = k > 0.01;
    flame.scale.set(1, Math.max(0.01, k), 1);
  }

  // ════ the thermometer (Fig 6.05) ══════════════════════════════════════════════
  const T = THERMO_GEO;
  const thermoRig = new THREE.Group();
  thermoRig.name = 'ThermometerRig';
  root.add(thermoRig);
  const thermo = new THREE.Group(); // the thermometer itself: lowered into the water, shaken
  thermo.name = 'Thermometer';
  thermoRig.add(thermo);
  // the glass in one lathe: bulb, the narrow bend, the stem, a rounded top
  const SR = T.stemR; // a fever thermometer is a long thin stem with a bulb only a little wider
  const profile = [new THREE.Vector2(0.001, -T.bulbRy)];
  for (let i = 1; i <= 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * (Math.PI / 2 + 0.95);
    profile.push(new THREE.Vector2(T.bulbR * Math.cos(a), T.bulbRy * Math.sin(a)));
  }
  const yb = profile[profile.length - 1].y;
  const rb = profile[profile.length - 1].x;
  for (let i = 1; i <= 8; i++) {
    const k = i / 8; // into the pinch
    profile.push(new THREE.Vector2(rb + (SR * 0.5 - rb) * Math.sin((k * Math.PI) / 2), yb + (T.pinchY - yb) * k));
  }
  for (let i = 1; i <= 8; i++) {
    const k = i / 8; // out of the pinch to the stem
    profile.push(new THREE.Vector2(SR * 0.5 + (SR - SR * 0.5) * (1 - Math.cos((k * Math.PI) / 2)), T.pinchY + 1.1 * k));
  }
  profile.push(new THREE.Vector2(SR, T.stemTop - SR));
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    profile.push(new THREE.Vector2(SR * Math.cos(a), T.stemTop - SR + SR * Math.sin(a)));
  }
  const tGlass = new THREE.Mesh(new THREE.LatheGeometry(profile, 36), mat.glassThin);
  tGlass.renderOrder = 2;
  const scale = scaleTexture();
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.0, scale.y1 - scale.y0), new THREE.MeshStandardMaterial({ map: scale.map, roughness: 0.6 }));
  strip.position.set(0, (scale.y0 + scale.y1) / 2, -0.36);
  const hgBulb = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mat.mercury);
  hgBulb.scale.set(T.bulbR - 0.14, T.bulbRy - 0.14, T.bulbR - 0.14);
  const unit = new THREE.CylinderGeometry(0.17, 0.17, 1, 12);
  const hgFoot = new THREE.Mesh(unit, mat.mercury); // the mercury from the bulb up to the narrow bend
  const hgColumn = new THREE.Mesh(unit, mat.mercury); // the thread in the stem
  thermo.add(strip, hgBulb, hgFoot, hgColumn, tGlass);
  const FOOT = { y0: 0.7, y1: T.pinchY - 0.15 }; // cm
  const COLUMN_FROM = { joined: T.pinchY - 0.15, split: T.pinchY + 0.45 };
  /** Puts the top of the thread at the temperature Tc (°C); gap: 0 joined … 1 the thread is cut at the bend. */
  function setThermo(Tc, gap = 0) {
    const top = thermoY(Tc);
    const from = COLUMN_FROM.joined + (COLUMN_FROM.split - COLUMN_FROM.joined) * gap;
    const h = Math.max(0.02, top - from);
    hgColumn.scale.y = h;
    hgColumn.position.y = from + h / 2;
    const footTop = FOOT.y1 - 0.4 * gap; // the mercury left in the bulb draws back from the bend
    hgFoot.scale.y = footTop - FOOT.y0;
    hgFoot.position.y = FOOT.y0 + (footTop - FOOT.y0) / 2;
    const s = 1 - 0.035 * gap;
    hgBulb.scale.set((T.bulbR - 0.14) * s, (T.bulbRy - 0.14) * s, (T.bulbR - 0.14) * s);
  }
  const thermoStand = createStand(mat, { x: -7.5, armY: T.rest + T.stemTop - 2.4, reachX: -0.8, rodTop: T.rest + T.stemTop - 0.4 });
  const clampT = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.2, 8, 24), mat.black);
  clampT.rotation.x = Math.PI / 2;
  clampT.position.y = T.stemTop - 2.4;
  thermo.add(clampT);
  thermoRig.add(thermoStand.root);
  /** The thermometer's height offset: 0 hanging in the air, T.dip with its bulb in the water; and a sideways shake. */
  function setDip(k, shake = 0) {
    thermo.position.set(shake, T.rest + T.dip * k, 0);
    thermo.rotation.z = shake * 0.12;
    thermoStand.arm.position.y = T.rest + T.stemTop - 2.4 + T.dip * k;
  }
  // the beaker of warm water under the bulb, standing on the bench
  const beaker = new THREE.Group();
  beaker.name = 'Beaker';
  const bh = 4.6;
  const beakerGlass = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.1, bh, 36, 1, true), mat.glass);
  beakerGlass.position.y = BENCH_Y + bh / 2;
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(3.1, 36), mat.glass);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = BENCH_Y + 0.02;
  const waterH = 3.6;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.05, waterH, 36), mat.water);
  water.position.y = BENCH_Y + waterH / 2;
  const beakerRim = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.12, 8, 40), mat.glassEdge);
  beakerRim.rotation.x = Math.PI / 2;
  beakerRim.position.y = BENCH_Y + bh;
  beaker.add(beakerGlass, bottom, water, beakerRim);
  thermoRig.add(beaker);

  setFlask(F.A, 1);
  setMarks(1.5, 3);
  setThermo(THERMO.T0, 0);
  setDip(0);
  thermoRig.visible = false;

  return {
    root,
    flask,
    thermoRig,
    thermo,
    setFlask,
    setMarks,
    setBars,
    setFlame,
    setThermo,
    setDip,
    /** World points the figure's labels and rings aim at (the caller passes the vector to fill). */
    flaskNeckAt: (y, out) => out.set(F.neckOuter, y, 0),
    barAt: (id, y, out) => out.set(barX[id], y, 0.1),
    lampAt: (out) => out.set(0, FLAME_BASE + 1.5, 0),
    thermoAt: (Tc, out) => out.set(T.stemR, thermo.position.y + thermoY(Tc), 0),
    bulbAt: (out) => out.set(T.bulbR, thermo.position.y, 0),
    pinchAt: (out) => out.set(T.stemR * 0.5, thermo.position.y + T.pinchY, 0),
    beakerAt: (out) => out.set(3.3, BENCH_Y + 1.8, 0),
    pickable: { flask: [lampBody, bulbGlass, neck], thermo: [tGlass, beakerGlass] },
    show(which) {
      flask.visible = which === 'flask';
      thermoRig.visible = which === 'thermo';
    },
    casters() {
      const list = [];
      root.traverse((m) => {
        if (m.isMesh && m.castShadow) list.push(m);
      });
      return list;
    },
  };
}
