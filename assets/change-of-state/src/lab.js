// The apparatus: a spirit lamp under a tripod and wire gauze, a glass beaker with ice, water or steam in it, and a
// rod thermometer, on a lab bench in front of a tiled wall. Everything is built once; update(u) only moves a few
// instances and sets a few scales (u is the position along the heating curve, see reading.js). Units: centimetres,
// the bench top is y = 0, the beaker stands on the gauze at x = 0, z = 0.
import * as THREE from 'three';
import { BOIL, T_MAX, T_MIN, boiled, heatTemp, melted, phaseAt } from './reading.js';

export const BEAKER = { r: 4.6, h: 10, y0: 10.6 }; // outer radius, height, and the height of its base
export const FLOOR_Y = BEAKER.y0 + 0.22; // the inside bottom
export const WATER_H = 4.4; // depth of the water when all the ice has melted
export const WALL_Z = -10.5;
const RIM_Y = BEAKER.y0 + BEAKER.h;
const THERMO = { x: 3.2, z: -0.9, y0: BEAKER.y0 + 1, top: BEAKER.y0 + 13.4, s0: BEAKER.y0 + 2, s1: BEAKER.y0 + 12.2 }; // stem, scale ends
const PLATE_H = 12.4;
const PLATE_TOP = BEAKER.y0 + 12.9; // the scale plate's top

/** A small deterministic random (the same pictures every time: the tests compare pixels). */
function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTexture(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });

/** A rod between two points. */
function rod(a, b, radius, material) {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 10), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

const lathe = (pts, seg = 28) =>
  new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r, y)),
    seg,
  );

// ── the room ──────────────────────────────────────────────────────────────────────────────────────────
function benchTexture() {
  return canvasTexture(
    512,
    256,
    (g, w, h) => {
      g.fillStyle = '#c9985f';
      g.fillRect(0, 0, w, h);
      const r = rng(3);
      for (let i = 0; i < 90; i++) {
        const y = r() * h;
        g.strokeStyle = `rgba(${r() < 0.5 ? '120,70,30' : '235,200,150'},${0.1 + r() * 0.18})`;
        g.lineWidth = 1 + r() * 2.2;
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 8, w * 0.7, y + (r() - 0.5) * 8, w, y + (r() - 0.5) * 6);
        g.stroke();
      }
      g.fillStyle = 'rgba(90,50,20,0.28)'; // the joints between boards
      for (let y = 0; y < h; y += 64) g.fillRect(0, y, w, 2);
    },
    { repeat: [5, 3] },
  );
}

function wallTexture() {
  return canvasTexture(
    512,
    512,
    (g, w, h) => {
      const r = rng(9);
      const n = 4;
      const s = w / n;
      g.fillStyle = '#a9c1cf';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const k = r();
          g.fillStyle = `rgb(${Math.round(104 + k * 14)},${Math.round(140 + k * 14)},${Math.round(165 + k * 12)})`;
          g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
          const gl = g.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
          gl.addColorStop(0, 'rgba(255,255,255,0.16)');
          gl.addColorStop(0.5, 'rgba(255,255,255,0)');
          gl.addColorStop(1, 'rgba(0,0,0,0.08)');
          g.fillStyle = gl;
          g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        }
    },
    { repeat: [10, 4.5] },
  );
}

function thermometerPlate() {
  const W = 128;
  const H = 1024;
  return canvasTexture(W, H, (g) => {
    g.fillStyle = '#fffbea';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#1d2733';
    g.strokeStyle = '#1d2733';
    const plateH = PLATE_H;
    const yOf = (T) => ((PLATE_TOP - (THERMO.s0 + ((THERMO.s1 - THERMO.s0) * (T - T_MIN)) / (T_MAX - T_MIN))) / plateH) * H;
    for (let T = T_MIN; T <= T_MAX; T += 10) {
      const y = yOf(T);
      const long = T % 20 === 0;
      g.lineWidth = long ? 4 : 2.5;
      g.beginPath();
      g.moveTo(W * 0.5 + 9, y);
      g.lineTo(W - (long ? 6 : 24), y);
      g.stroke();
    }
    g.font = '700 30px "Noto Sans Bengali", Arial, sans-serif';
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    for (const T of [0, 100]) g.fillText(String(T), 6, yOf(T));
  });
}

// ── the parts ─────────────────────────────────────────────────────────────────────────────────────────
function makeLamp(M) {
  const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({
    color: 0xe3f2fa,
    transparent: true,
    opacity: 0.3,
    roughness: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.6,
  });
  const body = new THREE.Mesh(
    lathe([
      [0, 0],
      [2.5, 0],
      [3.0, 0.5],
      [3.15, 1.6],
      [2.9, 2.9],
      [2.0, 4.1],
      [1.25, 4.7],
      [1.2, 5.4],
    ]),
    glass,
  );
  body.renderOrder = 3;
  const spirit = new THREE.Mesh(
    lathe([
      [0, 0.12],
      [2.35, 0.12],
      [2.85, 0.55],
      [3.0, 1.5],
      [2.75, 2.5],
      [0, 2.5],
    ]),
    std(0xd99a3a, { transparent: true, opacity: 0.55, roughness: 0.2 }),
  );
  spirit.renderOrder = 2;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.45, 0.95, 20), M.brass);
  collar.position.y = 5.65;
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 1.1, 10), std(0xeadfc4, { roughness: 0.9 }));
  wick.position.y = 6.6;
  const flame = new THREE.Group();
  flame.position.y = 7.1;
  const outer = new THREE.Mesh(
    lathe(
      [
        [0, 0],
        [0.62, 0.14],
        [1.05, 0.9],
        [0.92, 2.1],
        [0.5, 3.5],
        [0, 5.1],
      ],
      16,
    ),
    new THREE.MeshBasicMaterial({ color: 0xffa21f, transparent: true, opacity: 0.82, depthWrite: false, toneMapped: false }),
  );
  const core = new THREE.Mesh(
    lathe(
      [
        [0, 0],
        [0.4, 0.1],
        [0.6, 0.7],
        [0.42, 1.8],
        [0, 2.9],
      ],
      12,
    ),
    new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }),
  );
  const foot = new THREE.Mesh(
    lathe(
      [
        [0, 0],
        [0.3, 0.05],
        [0.42, 0.6],
        [0, 1.2],
      ],
      12,
    ),
    new THREE.MeshBasicMaterial({ color: 0x3f7fe0, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }),
  );
  flame.add(outer, core, foot);
  flame.renderOrder = 4;
  g.add(body, spirit, collar, wick, flame);
  g.traverse((m) => {
    if (m instanceof THREE.Mesh && (m === collar || m === wick)) m.castShadow = true;
  });
  return { root: g, flame };
}

function makeStand() {
  const g = new THREE.Group();
  const iron = std(0x2f353d, { roughness: 0.45, metalness: 0.6 });
  const ringY = BEAKER.y0 - 0.5;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.3, 8, 40), iron);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = ringY;
  g.add(ring);
  for (const deg of [-90, 30, 150]) {
    const a = THREE.MathUtils.degToRad(deg);
    const top = new THREE.Vector3(Math.cos(a) * 5.6, ringY, Math.sin(a) * 5.6);
    const foot = new THREE.Vector3(Math.cos(a) * 8.2, 0.3, Math.sin(a) * 8.2);
    const leg = rod(top, foot, 0.3, iron);
    leg.castShadow = true;
    g.add(leg);
  }
  const gauze = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.14, 10),
    new THREE.MeshStandardMaterial({
      color: 0x9aa3ad,
      roughness: 0.6,
      metalness: 0.5,
      map: canvasTexture(128, 128, (c, w, h) => {
        c.fillStyle = '#9aa3ad';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#59616b';
        c.lineWidth = 2;
        for (let i = 0; i <= w; i += 8) {
          c.beginPath();
          c.moveTo(i, 0);
          c.lineTo(i, h);
          c.moveTo(0, i);
          c.lineTo(w, i);
          c.stroke();
        }
        c.fillStyle = '#e8e6df'; // the asbestos-free centre pad
        c.beginPath();
        c.arc(w / 2, h / 2, 40, 0, Math.PI * 2);
        c.fill();
      }),
    }),
  );
  gauze.position.y = BEAKER.y0 - 0.07;
  gauze.castShadow = true;
  g.add(gauze);
  return g;
}

function makeThermometer() {
  const g = new THREE.Group();
  g.position.set(THERMO.x, 0, THERMO.z);
  const glass = new THREE.MeshStandardMaterial({
    color: 0xe9f6ff,
    transparent: true,
    opacity: 0.38,
    roughness: 0.05,
    depthWrite: false,
    envMapIntensity: 1.6,
  });
  const len = THERMO.top - THERMO.y0;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, len, 14), glass);
  stem.position.y = THERMO.y0 + len / 2;
  stem.renderOrder = 5;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), glass);
  bulb.position.y = THERMO.y0;
  bulb.renderOrder = 5;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.6, PLATE_H), new THREE.MeshBasicMaterial({ map: thermometerPlate(), toneMapped: false }));
  plate.position.set(0, PLATE_TOP - PLATE_H / 2, -0.38);
  const redMat = std(0xd62f25, { roughness: 0.25 });
  const bulbRed = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), redMat);
  bulbRed.position.y = THERMO.y0;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1, 10), redMat);
  g.add(plate, bulbRed, column, stem, bulb);
  return { root: g, column };
}

/** Soft white puffs rising from the water and over the rim, moved entirely in the vertex shader (no per-frame work). */
function makeSteam() {
  const N = 90;
  const r = rng(21);
  const seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    seed[i * 4] = r() * Math.PI * 2;
    seed[i * 4 + 1] = Math.sqrt(r());
    seed[i * 4 + 2] = 0.16 + r() * 0.12;
    seed[i * 4 + 3] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const uniforms = {
    uTime: { value: 0 },
    uInt: { value: 0 },
    uSurf: { value: FLOOR_Y },
    uRim: { value: RIM_Y },
    uScale: { value: 600 },
    uSize: { value: 3.4 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute vec4 aSeed;
      uniform float uTime, uInt, uSurf, uRim, uScale, uSize;
      varying float vA;
      void main() {
        float life = fract(uTime * aSeed.z + aSeed.w);
        float shown = step(fract(aSeed.w * 7.31), uInt);
        float y = mix(uSurf + 0.3, uRim + 9.0, life);
        float rad = aSeed.y * (3.5 + max(0.0, y - uRim) * 0.5);
        float ang = aSeed.x + life * 1.6;
        vec4 mv = modelViewMatrix * vec4(cos(ang) * rad, y, sin(ang) * rad, 1.0);
        vA = shown * smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.5, 1.0, life));
        gl_PointSize = uSize * mix(0.9, 2.3, life) * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.04, d) * vA * 0.55;
        if (a < 0.01) discard;
        gl_FragColor = vec4(0.98, 0.99, 1.0, a);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 6;
  points.userData.noExport = true;
  points.onBeforeRender = (renderer, _scene, camera) => {
    uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  };
  return { points, uniforms };
}

export function createLab({ materials: M }) {
  const root = new THREE.Group();
  root.name = 'lab';
  const set = new THREE.Group(); // the apparatus (what the GLB export holds)
  root.add(set);

  // the room
  const bench = new THREE.Mesh(new THREE.BoxGeometry(160, 4, 28), std(0xffffff, { map: benchTexture(), roughness: 0.62 }));
  bench.position.set(10, -2, 3.5);
  bench.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(190, 72), std(0xffffff, { map: wallTexture(), roughness: 0.78 }));
  wall.position.set(10, 33, WALL_Z);
  wall.receiveShadow = true;
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(160, 1.1, 0.8), std(0x6b4a2e, { roughness: 0.6 }));
  skirt.position.set(10, 0.55, WALL_Z + 0.4);
  root.add(bench, wall, skirt);
  bench.userData.noExport = wall.userData.noExport = skirt.userData.noExport = true;

  const lamp = makeLamp(M);
  lamp.root.scale.setScalar(0.82);
  set.add(lamp.root, makeStand());

  // the beaker and what is in it
  const glass = new THREE.MeshStandardMaterial({
    color: 0xe3f2fa,
    transparent: true,
    opacity: 0.27,
    roughness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.8,
  });
  const beaker = new THREE.Mesh(
    lathe(
      [
        [0, BEAKER.y0],
        [BEAKER.r - 0.5, BEAKER.y0],
        [BEAKER.r - 0.12, BEAKER.y0 + 0.12],
        [BEAKER.r, BEAKER.y0 + 0.55],
        [BEAKER.r, RIM_Y],
        [BEAKER.r + 0.32, RIM_Y + 0.26],
      ],
      40,
    ),
    glass,
  );
  beaker.renderOrder = 4;
  const rimMat = std(0xf2fbff, { transparent: true, opacity: 0.7, roughness: 0.1, depthWrite: false });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(BEAKER.r + 0.18, 0.13, 8, 48), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = RIM_Y + 0.14;
  rim.renderOrder = 4;
  const foot = new THREE.Mesh(new THREE.TorusGeometry(BEAKER.r - 0.2, 0.12, 8, 48), rimMat);
  foot.rotation.x = Math.PI / 2;
  foot.position.y = BEAKER.y0 + 0.2;
  foot.renderOrder = 4;
  // a few graduation marks on the glass (an engraved scale: 3 short lines at the front)
  const marks = new THREE.Group();
  const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false });
  for (let i = 1; i <= 5; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(i % 2 ? 1.1 : 1.8, 0.07), markMat);
    m.position.set(-2.4 - (i % 2 ? 0 : 0.35), BEAKER.y0 + 0.5 + i * 1.7, BEAKER.r - 0.05);
    m.renderOrder = 4;
    marks.add(m);
  }
  set.add(beaker, rim, foot, marks);

  const waterSide = std(0x2f86d4, { transparent: true, opacity: 0.58, roughness: 0.12, depthWrite: false, envMapIntensity: 1.2 });
  const waterTop = std(0x9fd3f7, { transparent: true, opacity: 0.8, roughness: 0.08, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(BEAKER.r - 0.22, BEAKER.r - 0.22, 1, 40), [waterSide, waterTop, waterSide]);
  water.renderOrder = 1;
  water.visible = false;
  set.add(water);

  // ice: three layers of cubes, shrinking and floating as they melt
  const cubes = [];
  const R = rng(5);
  const layer = (n, radius, phase, edge, level) => {
    for (let i = 0; i < n; i++) {
      const a = phase + (i / n) * Math.PI * 2;
      cubes.push({
        x: Math.cos(a) * radius + (R() - 0.5) * 0.3,
        z: Math.sin(a) * radius + (R() - 0.5) * 0.3,
        edge: edge * (0.92 + R() * 0.16),
        level,
        yaw: R() * Math.PI,
        tilt: (R() - 0.5) * 0.35,
        tilt2: (R() - 0.5) * 0.35,
      });
    }
  };
  layer(5, 1.6, 0.2, 2.0, 0.5);
  layer(5, 1.5, 0.2 + Math.PI / 5, 2.0, 1.5);
  layer(4, 1.0, 0.4, 1.8, 2.45);
  const iceMat = std(0xc9ecff, { transparent: true, opacity: 0.78, roughness: 0.1, envMapIntensity: 1.4 });
  const ice = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), iceMat, cubes.length);
  ice.renderOrder = 2;
  ice.frustumCulled = false;
  set.add(ice);

  // bubbles in boiling water
  const NB = 34;
  const bub = [];
  const rb = rng(13);
  for (let i = 0; i < NB; i++) bub.push({ a: rb() * 6.28, r: Math.sqrt(rb()) * 3.7, speed: 0.55 + rb() * 0.6, off: rb(), size: 0.17 + rb() * 0.16 });
  const bubbles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    std(0xffffff, { transparent: true, opacity: 0.8, roughness: 0.05, depthWrite: false }),
    NB,
  );
  bubbles.renderOrder = 3;
  bubbles.frustumCulled = false;
  set.add(bubbles);

  const thermo = makeThermometer();
  set.add(thermo.root);
  const steam = makeSteam();
  set.add(steam.points);

  // a warm glow from the flame on the gauze and the lamp (intensity only: no change of shader)
  const glow = new THREE.PointLight(0xffa244, 0, 24, 2);
  glow.position.set(0, 9, 2.5);
  set.add(glow);

  const dummy = new THREE.Object3D();
  const state = { u: 0, flow: 'heat', time: 0, water: 0, steam: 0, bubbleN: 0, hasFlame: true };

  function placeIce(u) {
    const f = melted(u);
    const sc = (1 - f) ** (1 / 3);
    ice.visible = f < 1;
    const sm = THREE.MathUtils.smoothstep(f, 0, 0.6);
    const hw = WATER_H * f;
    for (let i = 0; i < cubes.length; i++) {
      const c = cubes[i];
      const e = c.edge * sc;
      const rest = FLOOR_Y + c.level * 2.0 * sc;
      const floatY = FLOOR_Y + hw - 0.35 * e;
      dummy.position.set(c.x * (1 - 0.35 * f), THREE.MathUtils.lerp(rest, Math.max(floatY, FLOOR_Y + e * 0.5), sm), c.z * (1 - 0.35 * f));
      dummy.rotation.set(c.tilt, c.yaw, c.tilt2);
      dummy.scale.setScalar(Math.max(e, 0.0001));
      dummy.updateMatrix();
      ice.setMatrixAt(i, dummy.matrix);
    }
    ice.instanceMatrix.needsUpdate = true;
  }

  function placeBubbles() {
    const top = FLOOR_Y + state.water;
    for (let i = 0; i < NB; i++) {
      const b = bub[i];
      if (i >= state.bubbleN || state.water < 0.5) {
        dummy.scale.setScalar(0.0001);
        dummy.position.set(0, FLOOR_Y, 0);
      } else {
        const life = (state.time * b.speed + b.off) % 1;
        dummy.position.set(Math.cos(b.a) * b.r, FLOOR_Y + 0.35 + life * (top - FLOOR_Y - 0.35), Math.sin(b.a) * b.r);
        dummy.scale.setScalar(b.size * (0.7 + life * 0.7));
      }
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      bubbles.setMatrixAt(i, dummy.matrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
  }

  function flameLook() {
    const k = state.time;
    const fl = 1 + 0.07 * Math.sin(k * 23) + 0.05 * Math.sin(k * 37 + 1);
    lamp.flame.scale.set(1 - 0.03 * Math.sin(k * 29), fl, 1 - 0.03 * Math.sin(k * 31 + 2));
    lamp.flame.rotation.z = 0.035 * Math.sin(k * 11);
  }

  /** The scene at position u along the heating curve; `lit`: the flame is burning (heating, once it has started). */
  function update(u, flow, lit = flow === 'heat') {
    state.u = u;
    state.flow = flow;
    const f = melted(u);
    const g = boiled(u);
    const ph = phaseAt(u);
    state.water = WATER_H * f * (1 - g);
    water.visible = state.water > 0.03;
    water.scale.y = Math.max(state.water, 0.001);
    water.position.y = FLOOR_Y + state.water / 2;
    placeIce(u);
    // the boiling bubbles; steam grows from a little at 90 °C to a full cloud
    const near = THREE.MathUtils.smoothstep(u, 4.2, 5);
    state.bubbleN = ph === 'boil' ? NB : Math.round(NB * 0.22 * near);
    if (u >= 7) state.bubbleN = 0;
    steam.uniforms.uInt.value = u >= 7 ? 1 : ph === 'boil' ? 0.5 + 0.4 * g : 0.16 * near;
    steam.uniforms.uSurf.value = FLOOR_Y + state.water;
    placeBubbles();
    // the thermometer
    const T = heatTemp(u);
    const bottom = THERMO.y0;
    const top = THERMO.s0 + ((THERMO.s1 - THERMO.s0) * (T - T_MIN)) / (T_MAX - T_MIN);
    thermo.column.scale.y = Math.max(top - bottom, 0.01);
    thermo.column.position.y = bottom + (top - bottom) / 2;
    // the flame
    lamp.flame.visible = lit;
    glow.intensity = lit ? 28 : 0;
    flameLook();
  }

  /** Called every frame while something moves: the flame, the bubbles and the steam. */
  function tick(dt) {
    state.time += dt;
    steam.uniforms.uTime.value = state.time;
    flameLook();
    placeBubbles();
  }

  root.updateMatrixWorld(true);
  return {
    root,
    set,
    update,
    tick,
    state,
    lamp,
    /** World points for labels and rings. */
    anchors: {
      thermoTop: new THREE.Vector3(THERMO.x, THERMO.top + 0.5, THERMO.z),
      beakerLeft: new THREE.Vector3(-BEAKER.r, BEAKER.y0 + 6, 0),
      flame: new THREE.Vector3(0, 8.5, 0),
      lamp: new THREE.Vector3(0, 2.5, 2.5),
    },
    /** The glass beaker as a Box3 for a ring. */
    beakerBox: new THREE.Box3(new THREE.Vector3(-BEAKER.r, BEAKER.y0, -BEAKER.r), new THREE.Vector3(BEAKER.r, RIM_Y, BEAKER.r)),
    lampBox: new THREE.Box3(new THREE.Vector3(-3, 0, -3), new THREE.Vector3(3, 9.4, 3)),
    /** Things a tap can land on (the lamp and its flame, to start the heating). */
    pickable: [lamp.root, beaker],
    BOIL,
  };
}
