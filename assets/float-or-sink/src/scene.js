// The place: a glass tank of clear water on a teak table by a lake at golden hour. The tank's floor is sand with the
// light's ripples on it, its back wall a blue backing (as in an aquarium) so the water reads rich blue and the arrows
// stand out; above the water the back glass shows the lake and the sky. Everything is built once (no per-frame
// geometry): the water is a box with a vertical colour gradient, its surface the box's top. Metres; the tank's sandy
// floor is y = 0 and the water's surface y = SURFACE.
import * as THREE from 'three';
import { SURFACE } from './reading.js';

export const TANK = { x: 0.4, z: 0.14, top: 0.55, sand: 0.035, glass: 0.006 }; // inner half-sizes and heights (m)

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A small deterministic random (the same pictures every time: the tests compare pixels). */
export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The sky at golden hour over a lake, hills in the haze: the scene's background (fixed to the screen). */
export function backdropTexture() {
  return canvas(512, 512, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, '#1d4fc4');
    sky.addColorStop(0.35, '#3f86e6');
    sky.addColorStop(0.7, '#9cc6f0');
    sky.addColorStop(0.9, '#ffd9a8');
    sky.addColorStop(1, '#ffc27a');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    // the low sun's glow, top right
    const sun = g.createRadialGradient(w * 0.82, h * 0.5, 4, w * 0.82, h * 0.5, w * 0.42);
    sun.addColorStop(0, 'rgba(255,244,214,0.95)');
    sun.addColorStop(0.12, 'rgba(255,214,150,0.55)');
    sun.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = sun;
    g.fillRect(0, 0, w, h);
    // soft clouds
    const r = rng(11);
    g.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 9; i++) {
      const x = r() * w;
      const y = h * (0.12 + r() * 0.3);
      g.beginPath();
      g.ellipse(x, y, 40 + r() * 70, 6 + r() * 7, 0, 0, Math.PI * 2);
      g.fill();
    }
    // two ranges of hills in the haze (violet, then deeper indigo)
    const hills = (base, amp, color, seed) => {
      const q = rng(seed);
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) {
        const y = base - amp * (0.5 + 0.5 * Math.sin(x / 61 + seed) * Math.cos(x / 23 + seed * 2)) - q() * 3;
        g.lineTo(x, y);
      }
      g.lineTo(w, h);
      g.fill();
    };
    hills(h * 0.6, 34, '#a993d6', 3);
    hills(h * 0.64, 24, '#7c6cc0', 5);
    // the lake: deep blue with streaks of the sun on it
    const lake = g.createLinearGradient(0, h * 0.64, 0, h);
    lake.addColorStop(0, '#3b7fd9');
    lake.addColorStop(0.5, '#1f5fbf');
    lake.addColorStop(1, '#16469a');
    g.fillStyle = lake;
    g.fillRect(0, h * 0.64, w, h * 0.36);
    for (let i = 0; i < 70; i++) {
      const y = h * (0.65 + r() * 0.33);
      const x = w * (0.82 + (r() - 0.5) * (0.12 + (y / h - 0.64) * 1.2));
      g.fillStyle = `rgba(255,${200 + Math.round(r() * 40)},150,${0.25 + r() * 0.4})`;
      g.fillRect(x, y, 6 + r() * 26, 1.5);
    }
  });
}

/** Sand with pebbles; the light's ripples (caustics) are drawn on it. */
function sandTexture() {
  const t = canvas(512, 256, (g, w, h) => {
    g.fillStyle = '#e7c58f';
    g.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let i = 0; i < 9000; i++) {
      const v = r();
      g.fillStyle = v < 0.5 ? `rgba(160,110,60,${0.12 + r() * 0.18})` : `rgba(255,240,205,${0.15 + r() * 0.25})`;
      g.fillRect(r() * w, r() * h, 1.5, 1.5);
    }
    const pebble = ['#9c8f84', '#7b6f66', '#c9b8a3', '#b1765a', '#6d7a86'];
    for (let i = 0; i < 70; i++) {
      g.fillStyle = pebble[i % pebble.length];
      g.beginPath();
      g.ellipse(r() * w, r() * h, 2 + r() * 5, 1.5 + r() * 3.5, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    causticLines(g, w, h, 'rgba(255,255,240,0.35)', 2, 9);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A net of bright wavy lines, as sunlight through ripples throws on the floor. */
function causticLines(g, w, h, color, width, seed) {
  const r = rng(seed);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const x0 = r() * w;
    const y0 = r() * h;
    const a = r() * Math.PI;
    const len = 30 + r() * 50;
    g.beginPath();
    g.moveTo(x0, y0);
    g.bezierCurveTo(
      x0 + Math.cos(a) * len * 0.3 + (r() - 0.5) * 20,
      y0 + Math.sin(a) * len * 0.3 + (r() - 0.5) * 20,
      x0 + Math.cos(a) * len * 0.7 + (r() - 0.5) * 20,
      y0 + Math.sin(a) * len * 0.7 + (r() - 0.5) * 20,
      x0 + Math.cos(a) * len,
      y0 + Math.sin(a) * len,
    );
    g.stroke();
  }
}

/** The tank's backing: light near the surface, deep blue at the floor, with ripples of light. */
function backingTexture() {
  return canvas(256, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#8fe3ff');
    grad.addColorStop(0.4, '#35aef2');
    grad.addColorStop(1, '#1262c4');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    causticLines(g, w, h * 0.55, 'rgba(255,255,255,0.18)', 1.6, 21);
  });
}

/** Teak: warm stripes of grain. */
export function teakTexture() {
  const t = canvas(512, 128, (g, w, h) => {
    g.fillStyle = '#a45f2c';
    g.fillRect(0, 0, w, h);
    const r = rng(17);
    for (let i = 0; i < 160; i++) {
      const y = r() * h;
      g.strokeStyle = r() < 0.5 ? `rgba(90,44,16,${0.15 + r() * 0.25})` : `rgba(230,160,95,${0.12 + r() * 0.2})`;
      g.lineWidth = 0.6 + r() * 1.8;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 70 + i) * 2.2);
      g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The tank, the water, the table. Returns { root, water, surface, shadowCasters }. */
export function createScene() {
  const root = new THREE.Group();
  root.name = 'Tank';
  const { x: X, z: Z, top: TOP, sand: SAND, glass: GL } = TANK;

  // the teak table and its legs
  const teak = new THREE.MeshStandardMaterial({ name: 'Teak', map: teakTexture(), roughness: 0.55, metalness: 0 });
  teak.map.repeat.set(2, 1);
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.045, 0.75), teak);
  tableTop.position.set(0, -SAND - 0.012 - 0.0225, 0.05);
  tableTop.name = 'Table';
  tableTop.receiveShadow = true;
  const legMat = teak.clone();
  legMat.color.set('#8a4f24');
  const legs = [-0.7, 0.7].map((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), legMat);
    leg.position.set(x, tableTop.position.y - 0.37, 0.36);
    return leg;
  });
  root.add(tableTop, ...legs);

  // the tank's base and its dark aluminium frame
  const metal = new THREE.MeshStandardMaterial({ name: 'Frame', color: '#2c3440', roughness: 0.35, metalness: 0.8 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2 * X + 0.03, 0.012, 2 * Z + 0.03), metal);
  base.position.y = -SAND - 0.006;
  base.castShadow = true;
  root.add(base);
  const bar = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), metal);
    m.position.set(x, y, z);
    m.castShadow = true;
    root.add(m);
  };
  const E = 0.012;
  const H = TOP + SAND;
  for (const x of [-X - E / 2, X + E / 2]) for (const z of [-Z - E / 2, Z + E / 2]) bar(E, H, E, x, H / 2 - SAND, z);
  for (const z of [-Z - E / 2, Z + E / 2]) bar(2 * X + 2 * E, E, E, 0, TOP, z);
  for (const x of [-X - E / 2, X + E / 2]) bar(E, E, 2 * Z, x, TOP, 0);

  // sand on the floor
  const sandTex = sandTexture();
  sandTex.repeat.set(1.6, 0.6);
  const sandMat = new THREE.MeshStandardMaterial({ name: 'Sand', map: sandTex, roughness: 0.95, metalness: 0 });
  const sand = new THREE.Mesh(new THREE.BoxGeometry(2 * X, SAND, 2 * Z), sandMat);
  sand.position.y = -SAND / 2;
  sand.receiveShadow = true;
  sand.name = 'Sand';
  root.add(sand);

  // the backing on the back glass, as high as the water
  const backing = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * X, SURFACE),
    new THREE.MeshBasicMaterial({ name: 'Backing', map: backingTexture(), toneMapped: false }),
  );
  backing.position.set(0, SURFACE / 2, -Z + 0.001);
  backing.userData.noExport = true;
  root.add(backing);

  // the water: a box that tints what is behind and inside it blue (it multiplies, so a red brick under water stays a
  // deep red-brown, not a grey), deeper blue lower down (vertex colours); its top face is the surface
  const wg = new THREE.BoxGeometry(2 * X - 0.002, SURFACE + SAND, 2 * Z - 0.002, 1, 12, 1);
  wg.translate(0, (SURFACE - SAND) / 2, 0);
  const col = [];
  const pos = wg.attributes.position;
  const shallow = new THREE.Color('#bfe8ff');
  const deep = new THREE.Color('#78a9f2');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const k = THREE.MathUtils.clamp((SURFACE - pos.getY(i)) / (SURFACE + SAND), 0, 1);
    c.copy(shallow).lerp(deep, k);
    col.push(c.r, c.g, c.b);
  }
  wg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const waterMat = new THREE.MeshBasicMaterial({
    name: 'Water',
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.DstColorFactor,
    blendDst: THREE.ZeroFactor,
    toneMapped: false,
  });
  // the surface seen from a little above: a light sheet with the sky's sheen
  const surfMat = new THREE.MeshStandardMaterial({
    name: 'WaterSurface',
    color: '#9fe4ff',
    transparent: true,
    opacity: 0.38,
    roughness: 0.08,
    metalness: 0.2,
    depthWrite: false,
    emissive: '#2fa8f0',
    emissiveIntensity: 0.25,
  });
  // box faces: +x, −x, +y (top: the surface), −y, +z, −z
  const water = new THREE.Mesh(wg, [waterMat, waterMat, surfMat, waterMat, waterMat, waterMat]);
  water.name = 'Water';
  water.renderOrder = 2;
  root.add(water);
  // a bright line where the surface meets the front glass, so the waterline reads at every angle
  const lineMat = new THREE.MeshBasicMaterial({ color: '#e8fbff', transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false });
  const meniscus = new THREE.Mesh(new THREE.BoxGeometry(2 * X, 0.0025, 0.002), lineMat);
  meniscus.position.set(0, SURFACE, Z - 0.002);
  meniscus.renderOrder = 3;
  meniscus.userData.noExport = true;
  root.add(meniscus);

  // the glass: faint, with a soft streak of reflected sky on the front pane
  const glass = new THREE.MeshStandardMaterial({
    name: 'Glass',
    color: '#d8f4ff',
    transparent: true,
    opacity: 0.06,
    roughness: 0.04,
    metalness: 0,
    depthWrite: false,
  });
  const pane = (w, h, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, GL), glass);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.renderOrder = 4;
    root.add(m);
    return m;
  };
  pane(2 * X, H, 0, H / 2 - SAND, Z + GL / 2);
  pane(2 * X, H, 0, H / 2 - SAND, -Z - GL / 2);
  pane(2 * Z, H, -X - GL / 2, H / 2 - SAND, 0, Math.PI / 2);
  pane(2 * Z, H, X + GL / 2, H / 2 - SAND, 0, Math.PI / 2);
  const streak = canvas(128, 128, (g, w, h) => {
    const s = g.createLinearGradient(0, h, w, 0);
    s.addColorStop(0.3, 'rgba(255,255,255,0)');
    s.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    s.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    s.addColorStop(0.56, 'rgba(255,255,255,0.4)');
    s.addColorStop(0.68, 'rgba(255,255,255,0)');
    g.fillStyle = s;
    g.fillRect(0, 0, w, h);
  });
  const shine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, H * 0.9),
    new THREE.MeshBasicMaterial({ map: streak, transparent: true, opacity: 0.26, depthWrite: false, toneMapped: false }),
  );
  shine.position.set(-X + 0.05, H / 2 - SAND, Z + GL + 0.001);
  shine.renderOrder = 5;
  shine.userData.noExport = true;
  root.add(shine);

  return { root, water, waterMat, surfMat };
}
