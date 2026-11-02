// The 3D scene of the heat-units figure, in centimetres: a lab bench (slate top) in front of a warm beige wall; on a steel
// stand a small glass beaker with a little water ("১ গ্রাম পানি"), three burner flames under it, and a big thermometer
// beside it whose scale counts how many °C the water has risen (0 … 5). Each calorie of heat flares the flames and
// lifts the red column by one degree. Nothing else.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MAX_STEPS } from './reading.js';

export const PLATE_Y = 3.4; // the stand's plate (centre)
export const BEAKER = { x: -3.9, r: 3.3, h: 7.2, water: 3.2 };
export const THERMO = { x: 5.7, z: 0.4, yBase: 2.3, span: 9.6 }; // the scale: 0 at yBase + 0.8, 5 at yBase + 0.8 + span
export const SCALE_Y0 = THERMO.yBase + 0.8;
export const degY = (d) => SCALE_Y0 + (d / MAX_STEPS) * THERMO.span;
export const FLAME_X = [-1.9, 0, 1.9];
const FLAME_Y = 1.35;

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
function benchTexture() {
  const { c, ctx } = canvas(256, 256);
  const r = seeded(3);
  ctx.fillStyle = '#41587a';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    const g = r() < 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${g},${g},${g},${0.03 + r() * 0.05})`;
    ctx.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2);
  }
  return tex(c, [6, 3]);
}
function wallTexture() {
  const { c, ctx } = canvas(512, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#eadbc4');
  g.addColorStop(0.6, '#dcc7a8');
  g.addColorStop(1, '#cbb08c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const glow = ctx.createRadialGradient(330, 150, 10, 330, 150, 330);
  glow.addColorStop(0, 'rgba(255,244,226,0.5)');
  glow.addColorStop(1, 'rgba(255,248,232,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);
  const r = seeded(13);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(120,90,50,${0.015 + r() * 0.025})`;
    ctx.fillRect(r() * 512, r() * 512, 2, 2);
  }
  return tex(c);
}
/** The thermometer's white enamel plate with its scale: ticks every half degree, the numbers 0 … 5 and °C, drawn once. */
function plateTexture(digits) {
  const W = 256;
  const H = 1024;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = '#f2eee4';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // the plate is PLATE_H cm tall; the scale runs from SCALE_Y0 to SCALE_Y0 + span (plate bottom at y = 0.4)
  const plateTop = 0.4 + PLATE_H;
  const yOf = (cm) => ((plateTop - cm) / PLATE_H) * H;
  ctx.fillStyle = '#3a3f47';
  ctx.strokeStyle = '#3a3f47';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= MAX_STEPS * 2; i++) {
    const d = i / 2;
    const y = yOf(degY(d));
    const whole = i % 2 === 0;
    ctx.lineWidth = whole ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(W * 0.4, y);
    ctx.lineTo(W * (whole ? 0.66 : 0.56), y);
    ctx.stroke();
    if (whole) {
      ctx.font = '700 104px "Noto Sans Bengali", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(digits(d), W * 0.7, y + 4);
    }
  }
  ctx.font = '700 70px "Noto Sans Bengali", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('°C', W * 0.5, yOf(degY(MAX_STEPS) + 1.4));
  const t = tex(c);
  t.anisotropy = 8;
  return t;
}
const PLATE_H = 13.4;

const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

export function createScene({ background = true, digits = (x) => String(x) } = {}) {
  const root = new THREE.Group();
  root.name = 'CalorieJoule';

  if (background) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(220, 120), new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 1 }));
    wall.position.set(0, 40, -13);
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(110, 1.6, 40),
      new THREE.MeshStandardMaterial({ map: benchTexture(), roughness: 0.55, metalness: 0.05 }),
    );
    bench.position.set(0, -0.8, 7);
    bench.receiveShadow = true;
    bench.name = 'bench';
    wall.userData.noExport = bench.userData.noExport = true; // the setting stays out of the GLB
    root.add(wall, bench);
  }

  // ── the stand and the burner ───────────────────────────────────────────────
  const steel = new THREE.MeshStandardMaterial({ color: '#8a929c', roughness: 0.38, metalness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2f343b', roughness: 0.5, metalness: 0.5 });
  const brass = new THREE.MeshStandardMaterial({ color: '#b8924f', roughness: 0.35, metalness: 0.85 });
  const legGeo = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) legGeo.push(new THREE.CylinderGeometry(0.2, 0.2, PLATE_Y, 10).translate(BEAKER.x + sx * 4.2, PLATE_Y / 2, sz * 3));
  const legs = new THREE.Mesh(mergeGeometries(legGeo), steel);
  const plate = new THREE.Mesh(box(9.6, 0.3, 7.2, BEAKER.x, PLATE_Y, 0), steel);
  // a ribbon burner: base, tapered body, brass cap with port rings, gas pipe and a knob at the front
  const bx = BEAKER.x;
  const burner = new THREE.Mesh(
    mergeGeometries([box(7.4, 0.3, 2.4, bx, 0.15, 0), box(6.4, 0.55, 1.4, bx, 0.575, 0), box(6.0, 0.25, 0.95, bx, 1.0, 0)]),
    dark,
  );
  const brassGeo = [box(6.2, 0.1, 1.2, bx, 1.15, 0)];
  for (const x of FLAME_X) brassGeo.push(new THREE.CylinderGeometry(0.4, 0.44, 0.2, 18).translate(bx + x, 1.25, 0));
  brassGeo.push(new THREE.CylinderGeometry(0.28, 0.28, 1.3, 12).rotateX(Math.PI / 2).translate(bx - 2.2, 0.5, 1.7));
  brassGeo.push(new THREE.CylinderGeometry(0.56, 0.56, 0.3, 20).rotateX(Math.PI / 2).translate(bx - 2.2, 0.5, 2.45));
  const strip = new THREE.Mesh(mergeGeometries(brassGeo), brass);
  for (const m of [legs, plate, burner, strip]) m.castShadow = true;
  root.add(legs, plate, burner, strip);
  // a wire gauze under the beaker: a thin grey disc with a fine grid
  const gauzeTex = (() => {
    const { c, ctx } = canvas(128, 128);
    ctx.fillStyle = '#9aa1ab';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#5a616b';
    ctx.lineWidth = 2;
    for (let k = 0; k <= 128; k += 8) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, 128);
      ctx.moveTo(0, k);
      ctx.lineTo(128, k);
      ctx.stroke();
    }
    return tex(c, [2, 2]);
  })();
  const gauze = new THREE.Mesh(
    new THREE.CylinderGeometry(BEAKER.r + 0.7, BEAKER.r + 0.7, 0.06, 40).translate(bx, PLATE_Y + 0.18, 0),
    new THREE.MeshStandardMaterial({ map: gauzeTex, roughness: 0.6, metalness: 0.5, transparent: true, opacity: 0.8 }),
  );
  root.add(gauze);

  // ── the flames ─────────────────────────────────────────────────────────────
  const drop = (r, h) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const k = i / 12;
      pts.push(new THREE.Vector2(Math.max(0.001, r * Math.sin(Math.PI * k ** 0.75) * (1 - 0.35 * k)), k * h));
    }
    return new THREE.LatheGeometry(pts, 14);
  };
  const outer = new THREE.InstancedMesh(
    drop(0.5, 2.0),
    new THREE.MeshBasicMaterial({ color: '#ff9a1f', transparent: true, opacity: 0.85, depthWrite: false }),
    FLAME_X.length,
  );
  const inner = new THREE.InstancedMesh(drop(0.26, 1.1), new THREE.MeshBasicMaterial({ color: '#ffe27a' }), FLAME_X.length);
  outer.frustumCulled = inner.frustumCulled = false;
  outer.renderOrder = 2;
  root.add(outer, inner);
  const dummy = new THREE.Object3D();
  let flameLevel = 0;
  function setFlames(level, time = 0) {
    flameLevel = level;
    outer.visible = inner.visible = level > 0.01;
    for (let i = 0; i < FLAME_X.length; i++) {
      const flick = 1 + 0.07 * Math.sin(time * 13 + i * 2.1) + 0.04 * Math.sin(time * 23 + i * 5.3);
      dummy.position.set(BEAKER.x + FLAME_X[i], FLAME_Y, 0);
      dummy.scale.set(0.55 + 0.45 * level, level * flick, 0.55 + 0.45 * level);
      dummy.updateMatrix();
      outer.setMatrixAt(i, dummy.matrix);
      dummy.scale.set(0.55 + 0.45 * level, level * (1 + 0.1 * Math.sin(time * 17 + i)), 0.55 + 0.45 * level);
      dummy.updateMatrix();
      inner.setMatrixAt(i, dummy.matrix);
    }
    outer.instanceMatrix.needsUpdate = inner.instanceMatrix.needsUpdate = true;
  }
  setFlames(0);

  // ── the beaker with a little water ─────────────────────────────────────────
  const beaker = new THREE.Group();
  beaker.position.set(BEAKER.x, PLATE_Y + 0.21, 0);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#d4e8f0',
    transparent: true,
    opacity: 0.2,
    roughness: 0.05,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.2,
  });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(BEAKER.r, BEAKER.r - 0.05, BEAKER.h, 40, 1, true).translate(0, BEAKER.h / 2, 0), glassMat);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(BEAKER.r - 0.05, BEAKER.r - 0.05, 0.25, 40).translate(0, 0.125, 0), glassMat);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(BEAKER.r, 0.12, 8, 40).rotateX(Math.PI / 2).translate(0, BEAKER.h, 0), glassMat);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(BEAKER.r - 0.15, BEAKER.r - 0.2, BEAKER.water, 40).translate(0, 0.25 + BEAKER.water / 2, 0),
    new THREE.MeshPhysicalMaterial({ color: '#3f9bd8', transparent: true, opacity: 0.62, roughness: 0.08, metalness: 0, depthWrite: false }),
  );
  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(BEAKER.r - 0.15, 40).rotateX(-Math.PI / 2).translate(0, 0.25 + BEAKER.water + 0.01, 0),
    new THREE.MeshStandardMaterial({ color: '#9fd3f2', roughness: 0.2, transparent: true, opacity: 0.8 }),
  );
  // graduation marks on the front of the beaker (every 1/8 of the height; the long ones at the quarters)
  const marks = [];
  for (let i = 1; i <= 7; i++) {
    const long = i % 2 === 0;
    const w = long ? 1.6 : 0.9;
    const a = -0.5;
    const g = new THREE.BoxGeometry(w, 0.06, 0.05).rotateY(a);
    g.translate(Math.sin(a) * (BEAKER.r + 0.02), 0.25 + (i / 8) * (BEAKER.h - 0.6), Math.cos(a) * (BEAKER.r + 0.02));
    marks.push(g);
  }
  const markMesh = new THREE.Mesh(mergeGeometries(marks), new THREE.MeshBasicMaterial({ color: '#46515c' }));
  const spout = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 0.5, 10, 1, true)
      .rotateZ(Math.PI / 2)
      .rotateY(0)
      .translate(BEAKER.r + 0.1, BEAKER.h - 0.1, 0),
    glassMat,
  );
  spout.renderOrder = 3;
  for (const m of [wall, base, lip]) m.renderOrder = 3;
  water.renderOrder = 2;
  beaker.add(water, surface, wall, base, lip, markMesh, spout);
  root.add(beaker);

  // ── the thermometer: an enamel plate with a numbered scale, a glass tube and a red column ─
  const thermo = new THREE.Group();
  thermo.position.set(THERMO.x, 0, THERMO.z);
  const enamel = new THREE.MeshStandardMaterial({ map: plateTexture(digits), roughness: 0.5 });
  const foot = new THREE.Mesh(box(3.4, 0.4, 1.8, 0, 0.2, 0), dark);
  const backing = new THREE.Mesh(box(3.2, PLATE_H, 0.26, 0, 0.4 + PLATE_H / 2, -0.35), enamel);
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, THERMO.span + 1.9, 16).translate(0, SCALE_Y0 - 0.5 + (THERMO.span + 1.9) / 2, 0),
    new THREE.MeshPhysicalMaterial({ color: '#e6f1f6', transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false }),
  );
  tube.position.x = -0.55;
  const redMat = new THREE.MeshStandardMaterial({ color: '#d62828', roughness: 0.35 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.85, 18, 14).translate(0, THERMO.yBase - 0.2, 0), redMat);
  bulb.position.x = -0.55;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 12).translate(0, 0.5, 0), redMat);
  column.position.set(-0.55, THERMO.yBase - 0.2, 0);
  tube.renderOrder = 3;
  for (const m of [foot, backing]) m.castShadow = true;
  thermo.add(foot, backing, bulb, column, tube);
  root.add(thermo);
  /** Raises the red column to d degrees (a fraction is fine while it moves). */
  function setRise(d) {
    column.scale.y = Math.max(0.2, SCALE_Y0 - (THERMO.yBase - 0.2) + (d / MAX_STEPS) * THERMO.span);
  }
  setRise(0);

  const point = {
    thermoTop: () => new THREE.Vector3(THERMO.x - 0.55, degY(MAX_STEPS) + 1.9, THERMO.z),
    rim: () => new THREE.Vector3(BEAKER.x, PLATE_Y + 0.15 + BEAKER.h, 0),
    flame: () => new THREE.Vector3(BEAKER.x, FLAME_Y + 1.6, 0),
    column: (d) => new THREE.Vector3(THERMO.x - 0.55, degY(d), THERMO.z),
  };
  const flameBox = new THREE.Box3(new THREE.Vector3(BEAKER.x - 3.2, 1.1, -1), new THREE.Vector3(BEAKER.x + 3.2, 3.3, 1));

  return {
    root,
    beaker,
    thermo,
    point,
    flameBox,
    setRise,
    /** Sets the flames' strength (0 … 1). */
    setFlames: (level) => setFlames(level, 0),
    flicker: (time) => flameLevel > 0.01 && setFlames(flameLevel, time),
    get flame() {
      return flameLevel;
    },
  };
}
