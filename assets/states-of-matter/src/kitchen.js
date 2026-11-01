// The kitchen, in metres: a gas stove on a wooden worktop against a tiled wall lit by the sunset, a steel pan on the
// stove, a glassy ice cube in the pan, the water it melts into, the bubbles when it boils and the steam above it.
// `pose(t)` sets everything from the story's time alone (story.js), so the scene can be drawn at any moment.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './molecules.js';
import { boiling, flame, iceLeft, steam, waterLevel } from './story.js';

export const PAN = { r: 0.1, inner: 0.094, height: 0.036, base: 0.092, floor: 0.0035 };
export const ICE = 0.072; // the cube's side
export const WATER_DEPTH = 0.016; // when all the ice has melted
const PAN_FLOOR = PAN.base + PAN.floor;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The wall behind: glazed tiles washed from a deep evening blue at the top to a sunset orange at the worktop. */
function wallTexture() {
  // the canvas has the wall's own shape (6 m × 1.2 m), so the 12 cm tiles stay square
  return canvasTexture(2048, 410, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#141a52');
    sky.addColorStop(0.3, '#2a2f86');
    sky.addColorStop(0.55, '#6b3a9a');
    sky.addColorStop(0.78, '#d9544a');
    sky.addColorStop(0.92, '#f28f3b');
    sky.addColorStop(1, '#f6a94a');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    const tile = 41;
    const rand = rng(5);
    for (let y = 0; y < h; y += tile)
      for (let x = 0; x < w; x += tile) {
        g.fillStyle = `rgba(255,255,255,${0.025 + rand() * 0.05})`;
        g.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        const shine = g.createLinearGradient(x, y, x + tile, y + tile);
        shine.addColorStop(0, 'rgba(255,255,255,0.10)');
        shine.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.fillStyle = shine;
        g.fillRect(x + 2, y + 2, tile - 4, tile - 4);
      }
    g.strokeStyle = 'rgba(20,10,40,0.35)';
    g.lineWidth = 2;
    for (let x = 0; x <= w; x += tile) g.strokeRect(x - 1, -2, 0, h + 4);
    for (let y = 0; y <= h; y += tile) g.strokeRect(-2, y - 1, w + 4, 0);
  });
}

/** Warm teak worktop: long grain lines. */
function woodTexture() {
  const tex = canvasTexture(1024, 256, (g, w, h) => {
    g.fillStyle = '#9a5528';
    g.fillRect(0, 0, w, h);
    const rand = rng(9);
    for (let i = 0; i < 90; i++) {
      const y = rand() * h;
      const dark = rand() < 0.6;
      g.strokeStyle = dark ? `rgba(70,30,10,${0.12 + rand() * 0.2})` : `rgba(255,200,140,${0.06 + rand() * 0.1})`;
      g.lineWidth = 1 + rand() * 3;
      g.beginPath();
      const amp = 2 + rand() * 6;
      const k = 0.004 + rand() * 0.01;
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * k + i) * amp);
      g.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

function softDisc(inner, outer) {
  return canvasTexture(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, inner);
    r.addColorStop(1, outer);
    g.fillStyle = r;
    g.fillRect(0, 0, w, w);
  });
}

function steamTexture() {
  return canvasTexture(128, 128, (g, w) => {
    const rand = rng(21);
    for (let i = 0; i < 16; i++) {
      const x = w / 2 + (rand() - 0.5) * w * 0.35;
      const y = w / 2 + (rand() - 0.5) * w * 0.35;
      const r = w * (0.16 + rand() * 0.16);
      const p = g.createRadialGradient(x, y, 0, x, y, r);
      p.addColorStop(0, 'rgba(255,255,255,0.5)');
      p.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = p;
      g.fillRect(0, 0, w, w);
    }
  });
}

export function createKitchen({ background = true } = {}) {
  const scene = new THREE.Group();
  scene.name = 'Kitchen';
  /** What the GLB export holds: the stove, the pan, the ice and the water. */
  const model = new THREE.Group();
  model.name = 'StatesOfMatter';
  scene.add(model);

  // ── the room ──────────────────────────────────────────────────────────────
  const worktop = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.04, 1.0),
    new THREE.MeshStandardMaterial({ name: 'Worktop', map: woodTexture(), roughness: 0.55, metalness: 0 }),
  );
  worktop.name = 'Worktop';
  worktop.position.set(0, -0.02, 0.05);
  scene.add(worktop);
  if (background) {
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 1.2),
      new THREE.MeshBasicMaterial({ name: 'Wall', map: wallTexture(), toneMapped: false }),
    );
    wall.name = 'Wall';
    wall.position.set(0, 0.6, -0.45);
    scene.add(wall);
  } else worktop.visible = false;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.48),
    new THREE.MeshBasicMaterial({ map: softDisc('rgba(30,10,0,0.55)', 'rgba(30,10,0,0)'), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.0015;
  shadow.visible = background;
  scene.add(shadow);

  // ── the gas stove ─────────────────────────────────────────────────────────
  const enamel = new THREE.MeshPhysicalMaterial({ name: 'StoveBody', color: '#24262b', metalness: 0.3, roughness: 0.35 });
  const glassTop = new THREE.MeshPhysicalMaterial({ name: 'StoveGlass', color: '#0d0e12', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 });
  const steel = new THREE.MeshPhysicalMaterial({ name: 'Steel', color: '#d5d9df', metalness: 1, roughness: 0.22 });
  const iron = new THREE.MeshStandardMaterial({ name: 'CastIron', color: '#1b1c1f', metalness: 0.6, roughness: 0.55 });
  const brass = new THREE.MeshPhysicalMaterial({ name: 'Brass', color: '#c9a050', metalness: 1, roughness: 0.3 });
  const stove = new THREE.Group();
  stove.name = 'GasStove';
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.06, 0.26, 3, 0.012), enamel);
  body.position.y = 0.03;
  const top = new THREE.Mesh(new RoundedBoxGeometry(0.33, 0.006, 0.25, 2, 0.003), glassTop);
  top.position.y = 0.0605;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.054, 0.012, 40), brass);
  ring.position.y = 0.069;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.038, 0.008, 36), iron);
  cap.position.y = 0.078;
  stove.add(body, top, ring, cap);
  for (let i = 0; i < 4; i++) {
    const prong = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.026, 0.009), iron);
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    prong.position.set(Math.cos(a) * 0.088, 0.077, Math.sin(a) * 0.088);
    prong.rotation.y = -a;
    stove.add(prong);
  }
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.016, 28), steel);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0.115, 0.03, 0.135);
  const knobBar = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.006, 0.006), iron);
  knobBar.position.set(0.115, 0.03, 0.144);
  stove.add(knob, knobBar);
  model.add(stove);

  // the flame: a ring of blue tongues round the burner
  const FLAMES = 20;
  const tongue = new THREE.ConeGeometry(0.006, 1, 10, 1, true);
  tongue.translate(0, 0.5, 0);
  const flameMat = new THREE.MeshBasicMaterial({
    name: 'Flame',
    color: '#4dabf7',
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const flames = new THREE.InstancedMesh(tongue, flameMat, FLAMES);
  flames.name = 'Flame';
  flames.frustumCulled = false;
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.075, 40),
    new THREE.MeshBasicMaterial({
      map: softDisc('rgba(255,150,60,0.9)', 'rgba(255,90,20,0)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.0615;
  scene.add(flames, glow);

  // ── the steel pan ─────────────────────────────────────────────────────────
  const panSteel = new THREE.MeshPhysicalMaterial({ name: 'Pan', color: '#cfd4da', metalness: 1, roughness: 0.18, side: THREE.DoubleSide });
  const { r, inner, height, base, floor } = PAN;
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(r - 0.004, 0),
    new THREE.Vector2(r, 0.004),
    new THREE.Vector2(r, height),
    new THREE.Vector2(r + 0.002, height + 0.002),
    new THREE.Vector2(inner + 0.002, height + 0.003),
    new THREE.Vector2(inner, height),
    new THREE.Vector2(inner, floor + 0.003),
    new THREE.Vector2(inner - 0.003, floor),
    new THREE.Vector2(0, floor),
  ];
  const pan = new THREE.Group();
  pan.name = 'Pan';
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(profile, 72), panSteel);
  const handle = new THREE.Mesh(
    new RoundedBoxGeometry(0.15, 0.014, 0.024, 3, 0.006),
    new THREE.MeshPhysicalMaterial({ name: 'Handle', color: '#2b1b14', roughness: 0.4, clearcoat: 0.5 }),
  );
  handle.position.set(r + 0.075, height - 0.006, 0);
  handle.rotation.z = 0.12;
  pan.add(bowl, handle);
  pan.position.y = base;
  pan.rotation.y = -0.5; // the handle points to the right and a little towards us
  model.add(pan);

  // ── the ice and the water ─────────────────────────────────────────────────
  const ice = new THREE.Group();
  ice.name = 'Ice';
  const iceShell = new THREE.Mesh(
    new RoundedBoxGeometry(1, 1, 1, 4, 0.1),
    new THREE.MeshPhysicalMaterial({
      name: 'Ice',
      color: '#bfe5ff',
      emissive: '#0d3550',
      emissiveIntensity: 0.25,
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.42,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      ior: 1.31,
      specularIntensity: 1,
      envMapIntensity: 1.6,
      depthWrite: false,
    }),
  );
  iceShell.renderOrder = 3;
  const iceCore = new THREE.Mesh(
    new RoundedBoxGeometry(0.5, 0.56, 0.5, 3, 0.2),
    new THREE.MeshStandardMaterial({ name: 'IceCore', color: '#eef8ff', roughness: 0.95, transparent: true, opacity: 0.38, depthWrite: false }),
  );
  iceCore.renderOrder = 2;
  ice.add(iceCore, iceShell);
  ice.rotation.y = 0.55;
  model.add(ice);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 64).translate(0, 0.5, 0),
    new THREE.MeshPhysicalMaterial({
      name: 'Water',
      color: '#2f8fe6',
      roughness: 0.03,
      metalness: 0,
      transparent: true,
      opacity: 0.78,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      ior: 1.33,
      envMapIntensity: 1.4,
      depthWrite: false,
    }),
  );
  water.name = 'Water';
  water.renderOrder = 4;
  water.scale.set(inner - 0.0008, 0.0001, inner - 0.0008);
  water.position.y = PAN_FLOOR;
  model.add(water);

  // bubbles rising through the boiling water
  const BUBBLES = 36;
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    name: 'Bubble',
    color: '#ffffff',
    roughness: 0.1,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), bubbleMat, BUBBLES);
  bubbles.name = 'Bubbles';
  bubbles.renderOrder = 5;
  bubbles.frustumCulled = false;
  scene.add(bubbles);
  const bubbleSeeds = (() => {
    const rand = rng(31);
    return Array.from({ length: BUBBLES }, () => {
      const rr = Math.sqrt(rand()) * (inner - 0.012);
      const th = rand() * Math.PI * 2;
      return { x: rr * Math.cos(th), z: rr * Math.sin(th), phase: rand(), period: 0.5 + rand() * 0.5, size: 0.0022 + rand() * 0.0025 };
    });
  })();

  // steam above the pan: soft puffs that rise, spread and fade
  const STEAM = 40;
  const steamMap = steamTexture();
  const puffs = [];
  const puffSeeds = (() => {
    const rand = rng(41);
    return Array.from({ length: STEAM }, () => {
      const rr = Math.sqrt(rand()) * (inner - 0.02);
      const th = rand() * Math.PI * 2;
      return { x: rr * Math.cos(th), z: rr * Math.sin(th), phase: rand(), drift: (rand() - 0.5) * 0.06, spin: rand() * 6 };
    });
  })();
  for (let i = 0; i < STEAM; i++) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: steamMap, color: '#f6f9ff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    );
    sp.name = 'Steam';
    sp.renderOrder = 6;
    sp.material.rotation = puffSeeds[i].spin;
    scene.add(sp);
    puffs.push(sp);
  }

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();

  /** Points the lens and the labels refer to (world). */
  const points = {
    ice: new THREE.Vector3(),
    water: new THREE.Vector3(),
    steam: new THREE.Vector3(),
    flame: new THREE.Vector3(-0.05, 0.072, 0.07),
  };

  function pose(t) {
    // ice: shrinks as it melts, sitting on the pan's floor
    const left = iceLeft(t);
    const side = ICE * Math.cbrt(Math.max(0, left)) * (0.25 + 0.75 * left ** 0.3);
    ice.visible = side > 0.004;
    ice.scale.setScalar(Math.max(side, 1e-4));
    ice.position.set(0.008, PAN_FLOOR + side / 2 - 0.0006, -0.004);
    points.ice.set(0.008, PAN_FLOOR + side * 0.75, 0.0);

    // water
    const depth = WATER_DEPTH * waterLevel(t) + (left < 1 ? 0.0012 : 0);
    water.visible = depth > 0.0005;
    water.scale.y = Math.max(1e-4, depth);
    const top = PAN_FLOOR + depth;
    points.water.set(-0.035, top, 0.03);
    points.steam.set(-0.03, top + 0.07, 0.0);

    // flame: tongues flicker, longer when the knob is turned up
    const f = flame(t);
    flames.visible = glow.visible = f > 0.01;
    for (let i = 0; i < FLAMES; i++) {
      const a = (i / FLAMES) * Math.PI * 2;
      const flick = 0.85 + 0.15 * Math.sin(t * 23 + i * 2.1) * Math.sin(t * 7.3 + i);
      const len = (0.012 + 0.016 * f) * flick * Math.min(1, f * 3);
      e.set(0, -a, -0.75); // leaning outward
      q.setFromEuler(e);
      v.set(Math.cos(a) * 0.052, 0.07, Math.sin(a) * 0.052);
      sc.set(1, Math.max(len, 1e-4), 1);
      m4.compose(v, q, sc);
      flames.setMatrixAt(i, m4);
    }
    flames.instanceMatrix.needsUpdate = true;
    flameMat.opacity = 0.9 * Math.min(1, f * 2);
    glow.material.opacity = 0.75 * f;

    // bubbles
    const b = boiling(t);
    for (let i = 0; i < BUBBLES; i++) {
      const s = bubbleSeeds[i];
      const age = (((t / s.period + s.phase) % 1) + 1) % 1;
      const size = b > 0.02 && depth > 0.004 ? s.size * (0.6 + age * 0.8) * b : 0;
      v.set(s.x, PAN_FLOOR + 0.002 + age * Math.max(0, depth - 0.003), s.z);
      q.identity();
      sc.setScalar(Math.max(size, 1e-5));
      m4.compose(v, q, sc);
      bubbles.setMatrixAt(i, m4);
    }
    bubbles.instanceMatrix.needsUpdate = true;
    bubbles.visible = b > 0.02;

    // steam
    const st = steam(t);
    const LIFE = 3.4;
    for (let i = 0; i < STEAM; i++) {
      const s = puffSeeds[i];
      const age = ((((t / LIFE + s.phase) % 1) + 1) % 1) * LIFE;
      const k = age / LIFE;
      const p = puffs[i];
      p.visible = st > 0.01;
      p.position.set(s.x + s.drift * k + 0.012 * Math.sin(t * 1.3 + i), top + 0.01 + k * 0.24, s.z * (1 - 0.3 * k));
      p.scale.setScalar(0.05 + k * 0.12);
      p.material.opacity = st * Math.min(1, 1.7 * Math.sin(Math.PI * Math.min(1, k * 1.1)) ** 1.1);
    }
  }

  return { scene, model, points, pose };
}
