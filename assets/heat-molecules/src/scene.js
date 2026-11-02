// The 3D scene of the heat figure, in centimetres: a lab bench (slate top) in front of a warm beige wall; on a steel
// stand a glass container round 60 molecules (small glossy spheres), a row of burner flames under it, and a
// thermometer beside it. The molecules are one InstancedMesh; the simulation writes their positions straight into
// the instance matrices (no allocation per frame): in a solid each is held to its place in a lattice and shakes, in a
// liquid they roam in the lower part, in a gas they fill the whole container, faster the hotter it is.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BOX, COUNT, LIQUID_TOP, MOLECULE_R, OMEGA, gasness, homeOf, solidness, speedOf } from './reading.js';

export const PLATE_Y = 4.2; // the stand's plate (centre)
export const FLOOR_Y = PLATE_Y + 0.15 + 0.2; // the container's inner floor
export const JAR = { w: BOX.w + 0.4, h: BOX.h + 0.4, d: BOX.d + 0.4 };
export const JAR_TOP = FLOOR_Y - 0.2 + JAR.h;
export const THERMO = { x: 9.7, z: 1.6, yBase: 1.9, span: 12.4 };

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
/** The wall: warm beige, lighter up high where the window light falls, a little deeper behind the bench. */
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
/** The thermometer's backing plate: white enamel. */
function plateTexture() {
  const { c, ctx } = canvas(64, 256);
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, '#f3efe6');
  g.addColorStop(1, '#e2dccd');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  return tex(c);
}

const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

// the flames: five in a row on the burner
export const FLAME_X = [-4, -2, 0, 2, 4];
const FLAME_Y = 1.35;

/** The colour of a molecule at heat h: steel-cobalt blue when cold, through a dusty plum, to vermilion when hot. */
const COLD = new THREE.Color('#2f6bd6');
const MID = new THREE.Color('#9a5fa0');
const HOT = new THREE.Color('#e8501a');
export function heatColor(h, out = new THREE.Color()) {
  const k = Math.min(1, Math.max(0, h));
  return k < 0.5 ? out.copy(COLD).lerp(MID, k * 2) : out.copy(MID).lerp(HOT, k * 2 - 1);
}

export function createScene({ background = true } = {}) {
  const root = new THREE.Group();
  root.name = 'Heat';

  // ── the setting ────────────────────────────────────────────────────────────
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

  // ── the stand, the burner ──────────────────────────────────────────────────
  const steel = new THREE.MeshStandardMaterial({ color: '#8a929c', roughness: 0.38, metalness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2f343b', roughness: 0.5, metalness: 0.5 });
  const brass = new THREE.MeshStandardMaterial({ color: '#b8924f', roughness: 0.35, metalness: 0.85 });
  const legGeo = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) legGeo.push(new THREE.CylinderGeometry(0.2, 0.2, PLATE_Y, 10).translate(sx * 6.1, PLATE_Y / 2, sz * 2.5));
  const legs = new THREE.Mesh(mergeGeometries(legGeo), steel);
  const plate = new THREE.Mesh(box(13, 0.3, 5.6, 0, PLATE_Y, 0), steel);
  const burner = new THREE.Mesh(box(9.6, 1.3, 1.4, 0, 0.65, 0), dark);
  const strip = new THREE.Mesh(box(9.7, 0.14, 1.5, 0, 1.3, 0), brass);
  for (const m of [legs, plate, burner, strip]) m.castShadow = true;
  root.add(legs, plate, burner, strip);

  // ── the flames ─────────────────────────────────────────────────────────────
  // a teardrop for a flame: wide near the burner, a soft point at the top
  const drop = (r, h) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const k = i / 12;
      pts.push(new THREE.Vector2(Math.max(0.001, r * Math.sin(Math.PI * k ** 0.75) * (1 - 0.35 * k)), k * h));
    }
    return new THREE.LatheGeometry(pts, 14);
  };
  const outerGeo = drop(0.55, 2.7);
  const innerGeo = drop(0.28, 1.5);
  const outer = new THREE.InstancedMesh(
    outerGeo,
    new THREE.MeshBasicMaterial({ color: '#ff9a1f', transparent: true, opacity: 0.85, depthWrite: false }),
    FLAME_X.length,
  );
  const inner = new THREE.InstancedMesh(innerGeo, new THREE.MeshBasicMaterial({ color: '#ffe27a' }), FLAME_X.length);
  outer.frustumCulled = inner.frustumCulled = false;
  outer.renderOrder = 2;
  root.add(outer, inner);
  const dummy = new THREE.Object3D();
  let flameLevel = 0;
  let gaugesOn = true;
  function setFlames(level, time = 0) {
    flameLevel = level;
    outer.visible = inner.visible = gaugesOn && level > 0.01;
    for (let i = 0; i < FLAME_X.length; i++) {
      const flick = 1 + 0.07 * Math.sin(time * 13 + i * 2.1) + 0.04 * Math.sin(time * 23 + i * 5.3);
      dummy.position.set(FLAME_X[i], FLAME_Y, 0);
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

  // ── the glass container ────────────────────────────────────────────────────
  const jar = new THREE.Group();
  jar.position.set(0, FLOOR_Y - 0.2, 0);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(JAR.w, JAR.h, JAR.d).translate(0, JAR.h / 2, 0),
    new THREE.MeshPhysicalMaterial({
      color: '#d4e8f0',
      transparent: true,
      opacity: 0.16,
      roughness: 0.05,
      metalness: 0,
      depthWrite: false,
      envMapIntensity: 1.2,
    }),
  );
  glass.renderOrder = 3;
  const e = 0.24;
  const frame = [];
  for (const sy of [0, JAR.h]) {
    for (const sz of [-1, 1]) frame.push(box(JAR.w + e, e, e, 0, sy, sz * JAR.d * 0.5));
    for (const sx of [-1, 1]) frame.push(box(e, e, JAR.d + e, sx * JAR.w * 0.5, sy, 0));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) frame.push(box(e, JAR.h, e, sx * JAR.w * 0.5, JAR.h / 2, sz * JAR.d * 0.5));
  const frameMesh = new THREE.Mesh(mergeGeometries(frame), steel);
  jar.add(glass, frameMesh);
  root.add(jar);

  // ── the molecules ──────────────────────────────────────────────────────────
  const molecules = new THREE.InstancedMesh(
    new THREE.SphereGeometry(MOLECULE_R, 18, 12),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.28, metalness: 0.02 }),
    COUNT,
  );
  molecules.name = 'molecules';
  molecules.frustumCulled = false;
  molecules.position.set(0, FLOOR_Y, 0);
  root.add(molecules);

  const px = new Float32Array(COUNT);
  const py = new Float32Array(COUNT);
  const pz = new Float32Array(COUNT);
  const vx = new Float32Array(COUNT);
  const vy = new Float32Array(COUNT);
  const vz = new Float32Array(COUNT);
  const hx = new Float32Array(COUNT);
  const hy = new Float32Array(COUNT);
  const hz = new Float32Array(COUNT);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < COUNT; i++) {
    const [x, y, z] = homeOf(i);
    hx[i] = px[i] = x;
    hy[i] = py[i] = y;
    hz[i] = pz[i] = z;
    const a = rnd() * Math.PI * 2;
    const b = Math.acos(2 * rnd() - 1);
    vx[i] = Math.sin(b) * Math.cos(a) * 2;
    vy[i] = Math.cos(b) * 2;
    vz[i] = Math.sin(b) * Math.sin(a) * 2;
  }
  const arr = molecules.instanceMatrix.array;
  for (let i = 0; i < COUNT; i++) {
    arr.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, px[i], py[i], pz[i], 1], i * 16);
  }
  const colour = new THREE.Color();
  function setColours(h) {
    heatColor(h, colour);
    for (let i = 0; i < COUNT; i++) molecules.setColorAt(i, colour);
    if (molecules.instanceColor) molecules.instanceColor.needsUpdate = true;
  }
  setColours(0);

  const HX = BOX.w / 2 - MOLECULE_R;
  const HZ = BOX.d / 2 - MOLECULE_R;
  const D2 = (2 * MOLECULE_R) ** 2;
  let heat = 0;

  function step(dt, h) {
    const sS = solidness(h);
    const gm = gasness(h);
    const u = speedOf(h);
    const top = LIQUID_TOP + (BOX.h - LIQUID_TOP) * gm - MOLECULE_R;
    const k = OMEGA * OMEGA * sS;
    const gravity = 12 * (1 - gm) * (1 - sS);
    const noise = 90 + 40 * u;
    const reg = Math.min(1, 6 * dt);
    for (let i = 0; i < COUNT; i++) {
      let x = px[i];
      let y = py[i];
      let z = pz[i];
      let ux = vx[i] + (-k * (x - hx[i]) + (rnd() - 0.5) * noise) * dt;
      let uy = vy[i] + (-k * (y - hy[i]) - gravity + (rnd() - 0.5) * noise) * dt;
      let uz = vz[i] + (-k * (z - hz[i]) + (rnd() - 0.5) * noise) * dt;
      const sp = Math.hypot(ux, uy, uz) || 1e-6;
      const f = 1 + (u / sp - 1) * reg;
      ux *= f;
      uy *= f;
      uz *= f;
      x += ux * dt;
      y += uy * dt;
      z += uz * dt;
      if (x > HX) {
        x = HX;
        ux = -Math.abs(ux);
      } else if (x < -HX) {
        x = -HX;
        ux = Math.abs(ux);
      }
      if (z > HZ) {
        z = HZ;
        uz = -Math.abs(uz);
      } else if (z < -HZ) {
        z = -HZ;
        uz = Math.abs(uz);
      }
      if (y > top) {
        y = top;
        uy = -Math.abs(uy);
      } else if (y < MOLECULE_R) {
        y = MOLECULE_R;
        uy = Math.abs(uy);
      }
      px[i] = x;
      py[i] = y;
      pz[i] = z;
      vx[i] = ux;
      vy[i] = uy;
      vz[i] = uz;
    }
    if (sS < 0.995) {
      // free molecules do not pass through each other: push overlapping pairs apart
      for (let i = 0; i < COUNT; i++)
        for (let j = i + 1; j < COUNT; j++) {
          const dx = px[j] - px[i];
          const dy = py[j] - py[i];
          const dz = pz[j] - pz[i];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 >= D2 || d2 < 1e-9) continue;
          const d = Math.sqrt(d2);
          const push = (MOLECULE_R * 2 - d) / (2 * d);
          px[i] -= dx * push;
          py[i] -= dy * push;
          pz[i] -= dz * push;
          px[j] += dx * push;
          py[j] += dy * push;
          pz[j] += dz * push;
          // swap the velocity along the line of centres (an elastic collision of equal masses)
          const nx = dx / d;
          const ny = dy / d;
          const nz = dz / d;
          const rel = (vx[i] - vx[j]) * nx + (vy[i] - vy[j]) * ny + (vz[i] - vz[j]) * nz;
          if (rel > 0) {
            vx[i] -= rel * nx;
            vy[i] -= rel * ny;
            vz[i] -= rel * nz;
            vx[j] += rel * nx;
            vy[j] += rel * ny;
            vz[j] += rel * nz;
          }
        }
    }
  }

  /** Moves the molecules on by dt seconds at heat h (in sub-steps of at most 1/90 s) and writes the instances. */
  function update(dt, h = heat) {
    const n = Math.max(1, Math.ceil(dt * 90));
    for (let s = 0; s < n; s++) step(dt / n, h);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 16 + 12] = px[i];
      arr[i * 16 + 13] = py[i];
      arr[i * 16 + 14] = pz[i];
    }
    molecules.instanceMatrix.needsUpdate = true;
  }

  // ── the thermometer ────────────────────────────────────────────────────────
  const thermo = new THREE.Group();
  thermo.position.set(THERMO.x, 0, THERMO.z);
  const enamel = new THREE.MeshStandardMaterial({ map: plateTexture(), roughness: 0.5 });
  const foot = new THREE.Mesh(box(2.2, 0.4, 1.5, 0, 0.2, 0), dark);
  const backing = new THREE.Mesh(box(1.7, 15.6, 0.26, 0, 0.4 + 7.8, -0.35), enamel);
  const tickGeo = [];
  for (let i = 0; i <= 10; i++) {
    const long = i % 5 === 0;
    tickGeo.push(box(long ? 0.6 : 0.36, 0.06, 0.05, long ? -0.58 : -0.5, THERMO.yBase + 0.4 + (i / 10) * (THERMO.span - 0.4), -0.2));
  }
  const ticks = new THREE.Mesh(mergeGeometries(tickGeo), new THREE.MeshBasicMaterial({ color: '#4a4f57' }));
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, THERMO.span + 1.3, 16).translate(0, THERMO.yBase + (THERMO.span + 1.3) / 2 - 0.4, 0),
    new THREE.MeshPhysicalMaterial({ color: '#e6f1f6', transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false }),
  );
  const redMat = new THREE.MeshStandardMaterial({ color: '#d62828', roughness: 0.35 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.85, 18, 14).translate(0, THERMO.yBase - 0.35, 0), redMat);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 12).translate(0, 0.5, 0), redMat);
  column.position.y = THERMO.yBase - 0.4;
  tube.renderOrder = 3;
  for (const m of [foot, backing]) m.castShadow = true;
  thermo.add(foot, backing, ticks, bulb, column, tube);
  root.add(thermo);
  function setColumn(h) {
    const len = 1.2 + (THERMO.span - 0.4) * (0.06 + 0.94 * h);
    column.scale.y = len;
  }
  setColumn(0);

  function setHeat(h) {
    heat = h;
    setColours(h);
    setColumn(h);
    setFlames(h < 0.01 ? 0 : 0.3 + 0.7 * h, 0);
  }

  const point = {
    jarTop: () => new THREE.Vector3(0, JAR_TOP, 0),
    jarSide: () => new THREE.Vector3(JAR.w / 2, FLOOR_Y + 8, 0),
    thermoTop: () => new THREE.Vector3(THERMO.x, THERMO.yBase + THERMO.span + 0.8, THERMO.z),
    flame: () => new THREE.Vector3(0, FLAME_Y + 1.3, 0),
  };
  // what the ring of the action marks: the flames (a box round them)
  const flameBox = new THREE.Box3(new THREE.Vector3(-5, 1.2, -1), new THREE.Vector3(5, 3.9, 1));

  return {
    root,
    molecules,
    jar,
    thermo,
    point,
    flameBox,
    setHeat,
    /** Redraws the flames' flicker at `time` seconds, at the level they have. */
    flicker: (time) => gaugesOn && flameLevel > 0.01 && setFlames(flameLevel, time),
    /** Shows or hides the flames and the thermometer (the test hides them: they would tell how hot it is). */
    setGauges(on) {
      gaugesOn = on;
      thermo.visible = on;
      outer.visible = inner.visible = on && flameLevel > 0.01;
    },
    update,
    positions: { x: px, y: py, z: pz },
    get heat() {
      return heat;
    },
  };
}
