// The bench and the things on it: a 3 litre glass beaker of water with a pen thermometer in it, and, on the left, what
// is going to be added: a mug of cold water, a piece of ice on a saucer, a hot piece of iron on a tile. Nothing else.
// Everything is built once; the figure moves them (src/choreo.js) and never builds geometry again. Centimetres; the
// bench top is y = 0 and the beaker stands at the origin.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FONT } from '@shared/student/materials.js';

export const BEAKER = { R: 9, wall: 0.4, H: 14.5, perLitre: 1000 / (Math.PI * 9 * 9) }; // inner radius, glass, height; cm of water per litre
export const STATION_X = -16.5; // the saucer, the tile and the mug
export const MUG = { R: 5, H: 12.8, litres: 1 };
export const ICE = { side: 4.8 };
export const IRON = { r: 0.75, h: 1.1 };
export const THERMO = { x: 4.4, z: -3.2, lean: 0.12, stem: 15.2, headW: 3.7, headH: 6.6 };

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, g, c };
}

/** A small deterministic random (the same pictures every time: the tests compare pixels). */
function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The warm wall behind the bench, fixed to the screen: a soft light from the window side. */
export function backdropTexture() {
  return canvas(256, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#c9b497');
    grad.addColorStop(0.55, '#dcc8a8');
    grad.addColorStop(1, '#b89b78');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    const glow = g.createRadialGradient(w * 0.2, h * 0.25, 4, w * 0.2, h * 0.25, w * 0.7);
    glow.addColorStop(0, 'rgba(255,240,214,0.55)');
    glow.addColorStop(1, 'rgba(255,240,214,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
  }).tex;
}

/** Glazed wall tiles: sand-coloured with a darker joint, a little uneven. */
function tileTexture() {
  const { tex } = canvas(512, 512, (g, w, h) => {
    g.fillStyle = '#cdb691';
    g.fillRect(0, 0, w, h);
    const r = rng(3);
    const n = 8;
    const s = w / n;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = 0.97 + r() * 0.05;
        g.fillStyle = `rgb(${Math.round(222 * v)},${Math.round(200 * v)},${Math.round(165 * v)})`;
        g.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
        const sheen = g.createLinearGradient(x * s, y * s, x * s + s, y * s + s);
        sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
        sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.fillStyle = sheen;
        g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
      }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** The bench top: slate blue-grey laminate with a fine speckle. */
function benchTexture() {
  const { tex } = canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#46607a';
    g.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(20,34,50,0.22)' : 'rgba(190,215,240,0.16)';
      g.fillRect(r() * w, r() * h, 1.5, 1.5);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 3);
  tex.anisotropy = 4;
  return tex;
}

/** The glow round a hot piece of iron (additive, no light of its own). */
function glowTexture() {
  return canvas(64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,200,120,1)');
    grad.addColorStop(0.3, 'rgba(255,120,40,0.65)');
    grad.addColorStop(1, 'rgba(255,60,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }).tex;
}

const STOPS = [
  [0, new THREE.Color('#3b95e0')],
  [30, new THREE.Color('#4aa6dc')],
  [50, new THREE.Color('#98b8c4')],
  [75, new THREE.Color('#ee9a5c')],
  [100, new THREE.Color('#e8744e')],
];
/** The water's tint at T °C: cool blue, neutral in the middle, warm peach when hot (the thermometer carries the number). */
export function waterColor(T, out = new THREE.Color()) {
  if (T <= STOPS[0][0]) return out.copy(STOPS[0][1]);
  for (let i = 1; i < STOPS.length; i++) {
    if (T <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1];
      const [b, cb] = STOPS[i];
      return out.copy(ca).lerp(cb, (T - a) / (b - a));
    }
  }
  return out.copy(STOPS[STOPS.length - 1][1]);
}

/**
 * @param {{ N: (x: string | number) => string, unitL: string }} options digits for the beaker's marks, the word "L"
 */
export function createBench({ N, unitL = 'L' }) {
  const root = new THREE.Group();
  root.name = 'Bench';
  /** @type {THREE.Mesh[]} meshes that cast shadows */
  const casters = [];

  // ── the room: bench top and tiled wall ──
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(120, 3, 70),
    new THREE.MeshStandardMaterial({ name: 'Bench', map: benchTexture(), roughness: 0.55, metalness: 0.05 }),
  );
  bench.position.set(0, -1.5, 8);
  bench.receiveShadow = true;
  const wallMap = tileTexture();
  wallMap.repeat.set(4, 1.6);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 60),
    new THREE.MeshStandardMaterial({ name: 'Wall', map: wallMap, roughness: 0.4, metalness: 0 }),
  );
  wall.position.set(0, 26, -27);
  wall.receiveShadow = true;
  root.add(bench, wall);

  // ── the beaker: a glass lathe (rim, wall, thick floor), marks for 1, 2 and 3 litres, the water ──
  const { R, wall: W, H } = BEAKER;
  const glassMat = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: '#e8f4fb',
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.6,
    clearcoat: 1,
  });
  const profile = [
    [0, 0],
    [R + W - 0.4, 0],
    [R + W, 0.35],
    [R + W, H],
    [R + W + 0.25, H + 0.15],
    [R + W + 0.25, H + 0.4],
    [R + 0.05, H + 0.4],
    [R, H],
    [R, W + 0.4],
    [0, W + 0.4],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = new THREE.Mesh(new THREE.LatheGeometry(profile, 56), glassMat);
  glass.name = 'Beaker';
  glass.renderOrder = 3;

  const gradW = 0.9;
  const marks = canvas(256, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#243447';
    g.fillStyle = '#243447';
    g.lineCap = 'round';
    g.font = `700 54px ${FONT}`;
    g.textBaseline = 'middle';
    for (const litres of [0.5, 1, 1.5, 2, 2.5, 3]) {
      const hh = W + 0.4 + litres * BEAKER.perLitre;
      const y = h * (1 - hh / H);
      const whole = Number.isInteger(litres);
      g.lineWidth = whole ? 9 : 6;
      g.beginPath();
      g.moveTo(w - (whole ? 130 : 70), y);
      g.lineTo(w - 8, y);
      g.stroke();
      if (whole) g.fillText(`${N(litres)} ${unitL}`, 8, y - 34);
    }
  });
  const markMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(R + W + 0.03, R + W + 0.03, H, 24, 1, true, (-gradW * 0.5 * 50 * Math.PI) / 180 / gradW / 1.0, (50 * Math.PI) / 180),
    new THREE.MeshBasicMaterial({ map: marks.tex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  markMesh.geometry.translate(0, H / 2, 0);
  markMesh.renderOrder = 4;

  const waterGeo = new THREE.CylinderGeometry(R - 0.02, R - 0.02, 1, 56);
  waterGeo.translate(0, 0.5, 0);
  const waterMat = new THREE.MeshPhysicalMaterial({
    name: 'Water',
    color: '#79bfe4',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    envMapIntensity: 1.0,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.name = 'Water';
  water.position.y = W + 0.4;
  water.renderOrder = 2;
  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(R - 0.05, 56),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, depthWrite: false }),
  );
  surface.rotation.x = -Math.PI / 2;
  surface.renderOrder = 2;
  const beaker = new THREE.Group();
  beaker.name = 'BeakerGroup';
  beaker.add(water, surface, glass, markMesh);
  root.add(beaker);

  // ── the pen thermometer: a stem in the water, a head above the rim with a small screen ──
  const { x: tx, z: tz, lean, stem: stemLen, headW, headH } = THERMO;
  const pen = new THREE.Group();
  pen.name = 'Thermometer';
  pen.position.set(tx, W + 0.9, tz);
  pen.rotation.z = -lean;
  const stemMat = new THREE.MeshStandardMaterial({ name: 'Stem', color: '#c6ccd3', metalness: 0.85, roughness: 0.28 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, stemLen, 16), stemMat);
  stem.position.y = stemLen / 2;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10), stemMat);
  const bodyMat = new THREE.MeshStandardMaterial({ name: 'Pen', color: '#2c3a47', roughness: 0.4, metalness: 0.1 });
  const head = new THREE.Mesh(new RoundedBoxGeometry(headW, headH, 1.5, 3, 0.5), bodyMat);
  head.position.y = stemLen + headH / 2 - 0.2;
  const screen = canvas(256, 128, () => {});
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(headW - 0.7, (headW - 0.7) / 2),
    new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }),
  );
  screenMesh.position.set(0, stemLen + headH * 0.62, 0.77);
  const band = new THREE.Mesh(new THREE.BoxGeometry(headW + 0.04, 0.5, 1.54), new THREE.MeshStandardMaterial({ color: '#e8590c', roughness: 0.5 }));
  band.position.y = stemLen + 0.9;
  pen.add(stem, tip, head, screenMesh, band);
  root.add(pen);
  let lcdText = '';
  /** The screen shows the temperature (text already in the student's digits); written only when it changes. */
  function setScreen(text) {
    if (text === lcdText) return;
    lcdText = text;
    const { g, c } = screen;
    g.fillStyle = '#d3dee3';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#16222c';
    g.font = `700 74px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(`${text}°C`, c.width / 2, c.height / 2 + 4);
    screen.tex.needsUpdate = true;
  }
  setScreen('');

  // ── the station on the left: a saucer for the ice, a tile for the iron, a mug of cold water ──
  const ceramic = new THREE.MeshStandardMaterial({ name: 'Saucer', color: '#f1ede6', roughness: 0.35 });
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 5.2, 0.7, 40), ceramic);
  saucer.position.set(STATION_X, 0.35, 0);
  saucer.receiveShadow = true;
  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.9, 5.6),
    new THREE.MeshStandardMaterial({ name: 'Tile', color: '#7a6f66', roughness: 0.85 }),
  );
  tile.position.set(STATION_X, 0.45, 0);
  tile.receiveShadow = true;
  root.add(saucer, tile);

  const ice = new THREE.Mesh(
    new RoundedBoxGeometry(ICE.side, ICE.side, ICE.side, 3, 0.55),
    new THREE.MeshPhysicalMaterial({
      name: 'Ice',
      color: '#d4eefb',
      roughness: 0.16,
      metalness: 0,
      transparent: true,
      opacity: 0.82,
      envMapIntensity: 1.5,
      clearcoat: 0.8,
    }),
  );
  ice.name = 'Ice';
  ice.castShadow = true;
  casters.push(ice);

  const ironMat = new THREE.MeshStandardMaterial({
    name: 'Iron',
    color: '#59606a',
    metalness: 0.9,
    roughness: 0.42,
    emissive: new THREE.Color('#ff5a1f'),
    emissiveIntensity: 0,
  });
  const iron = new THREE.Mesh(new THREE.CylinderGeometry(IRON.r, IRON.r, IRON.h, 20), ironMat);
  iron.name = 'Iron';
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }),
  );
  glow.scale.setScalar(5.4);
  glow.renderOrder = 6;
  iron.add(glow);

  // the mug: opaque enamel, a handle, water seen from above while it stands
  const mugGroup = new THREE.Group(); // origin at the lip (the edge nearest the beaker), so it pours about the lip
  mugGroup.name = 'Mug';
  const enamel = new THREE.MeshStandardMaterial({ name: 'Mug', color: '#2f6fb0', roughness: 0.32, metalness: 0.05, side: THREE.DoubleSide });
  const mugProfile = [
    [0, 0],
    [MUG.R - 0.5, 0],
    [MUG.R - 0.2, 0.25],
    [MUG.R + 0.15, 1.4],
    [MUG.R + 0.4, MUG.H],
    [MUG.R + 0.4, MUG.H + 0.3],
    [MUG.R - 0.25, MUG.H + 0.3],
    [MUG.R - 0.25, MUG.H - 0.1],
    [MUG.R - 0.45, 1.2],
    [0, 0.45],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const mug = new THREE.Mesh(new THREE.LatheGeometry(mugProfile, 40), enamel);
  mug.position.set(-MUG.R - 0.4, -MUG.H, 0);
  mug.castShadow = true;
  casters.push(mug);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.55, 10, 24, Math.PI), enamel);
  handle.rotation.z = Math.PI / 2; // an arch opening toward the mug, on its far side
  handle.position.set(-2 * MUG.R - 0.5, -MUG.H * 0.5 - 0.2, 0);
  handle.scale.set(1.15, 0.8, 1);
  const mugWater = new THREE.Mesh(
    new THREE.CircleGeometry(MUG.R - 0.45, 36),
    new THREE.MeshStandardMaterial({ name: 'MugWater', color: '#79bfe4', roughness: 0.05, transparent: true, opacity: 0.9 }),
  );
  mugWater.rotation.x = -Math.PI / 2;
  mugWater.position.set(-MUG.R - 0.4, -1.3, 0);
  mugGroup.add(mug, handle, mugWater);

  // the poured stream (a thin tube, stretched between the lip and the surface)
  const streamGeo = new THREE.CylinderGeometry(0.34, 0.3, 1, 12, 1, true);
  streamGeo.translate(0, -0.5, 0); // hangs down from its origin
  const stream = new THREE.Mesh(
    streamGeo,
    new THREE.MeshPhysicalMaterial({
      name: 'Stream',
      color: '#79bfe4',
      roughness: 0.05,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  stream.visible = false;
  stream.renderOrder = 5;

  // bubbles round the hot iron (one instanced mesh)
  const BUBBLES = 14;
  const bubbles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    new THREE.MeshStandardMaterial({ name: 'Bubble', color: '#ffffff', roughness: 0.1, transparent: true, opacity: 0.7, depthWrite: false }),
    BUBBLES,
  );
  bubbles.visible = false;
  bubbles.frustumCulled = false;
  bubbles.renderOrder = 5;

  root.add(ice, iron, mugGroup, stream, bubbles);
  ice.position.set(STATION_X, 0.7 + ICE.side / 2, 0);
  iron.position.set(STATION_X, 0.9 + IRON.h / 2, 0);
  mugGroup.position.set(STATION_X + MUG.R + 0.4, MUG.H, 0);

  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(110, 60), new THREE.ShadowMaterial({ opacity: 0.18 }));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.02, 4);
  shadowPlane.receiveShadow = true;
  root.add(shadowPlane);
  for (const part of [bench, wall, shadowPlane]) part.userData.noExport = true; // the GLB is the apparatus, not the room
  head.castShadow = true;
  saucer.castShadow = true;
  casters.push(head, saucer);

  return {
    root,
    casters,
    ice,
    iron,
    ironMat,
    glow,
    mugGroup,
    mugWater,
    stream,
    bubbles,
    bubbleCount: BUBBLES,
    water,
    surface,
    waterMat,
    glass,
    beaker,
    pen,
    head,
    saucer,
    tile,
    setScreen,
    /** The world point of the screen (where the temperature label points). */
    screenPoint: (out = new THREE.Vector3()) => pen.localToWorld(out.set(-headW / 2 - 0.1, stemLen + headH * 0.62, 0.8)),
    /** Everything that should be removed from the GLB: shadow plane, wall. */
    noExport: [shadowPlane, wall],
  };
}
