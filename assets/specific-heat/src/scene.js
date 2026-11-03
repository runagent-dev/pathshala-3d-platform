// The 3D scene of the specific-heat figure, in centimetres: an oak lab bench in front of a soft blue-grey wall; on it a
// two-plate electric stove (the book's চুলা) with the same cast-iron plate under each thing; on the left a steel pot
// holding 10 kg of water (10 litres: 16.2 cm deep in a pot 29 cm across); on the right a 10 kg gold bar (19.3 gm/cc:
// about 500 cc); between them two glass thermometers with the same scale, a blue line at the starting 30 °C. Nothing
// else. Heating only changes the plates' glow, the red columns and a warm tint on the gold: no per-frame work.
import * as THREE from 'three';

export const PLATE_X = { water: -22, gold: 22 };
export const POT = { R: 14.5, H: 20, wall: 0.5, base: 0.6, water: 16.2 }; // water: 10 kg = 10,000 cc over its floor
export const STOVE_TOP = 6;
export const PLATE_TOP = 7;
export const THERMO_X = { water: -3.4, gold: 3.4 };
// the thermometers' scale: 20 … 110 °C along the tube
export const T_MIN = 20;
export const T_MAX = 110;
const BULB_Y = STOVE_TOP + 1.7;
const TUBE0 = STOVE_TOP + 4;
const K = 0.34; // cm per °C
export const thermoY = (T) => TUBE0 + (Math.min(T_MAX, Math.max(T_MIN, T)) - T_MIN) * K;
export const THERMO_TOP = thermoY(T_MAX) + 2.6;
export const KNOB = new THREE.Vector3(0, 3.1, 19.6);

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
function tex(c, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  return t;
}

/** The bench top: light oak with long grain. */
function oakTexture() {
  const { c, ctx } = canvas(512, 256);
  const r = seeded(21);
  ctx.fillStyle = '#cdb089';
  ctx.fillRect(0, 0, 512, 256);
  for (let y = 0; y < 256; y++) {
    const k = Math.sin(y * 0.33 + Math.sin(y * 0.07) * 4) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(${126 + k * 34},${92 + k * 26},${58 + k * 18},${0.1 + k * 0.2})`;
    ctx.fillRect(0, y, 512, 1);
  }
  for (let i = 0; i < 90; i++) {
    const y0 = r() * 256;
    ctx.strokeStyle = `rgba(112,82,50,${0.1 + r() * 0.2})`;
    ctx.lineWidth = 0.6 + r() * 1.2;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 10) {
      const y = y0 + Math.sin(x * 0.012 + i) * 2.2 + Math.sin(x * 0.04 + i * 0.7) * 0.8;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // plank joints
  ctx.fillStyle = 'rgba(80,48,22,0.35)';
  ctx.fillRect(0, 0, 512, 2);
  ctx.fillRect(0, 128, 512, 2);
  return tex(c, { repeat: [2, 1.4] });
}

/** The wall: a calm blue-grey, lighter high up. */
function wallTexture() {
  const { c, ctx } = canvas(256, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#c9d8e6');
  g.addColorStop(0.55, '#a9bdd1');
  g.addColorStop(1, '#8fa6bd');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);
  const r = seeded(4);
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.01 + r() * 0.02})`;
    ctx.fillRect(r() * 256, r() * 512, 1 + r() * 3, 1 + r() * 3);
  }
  return tex(c);
}

/** Subway tiles for the splash-back: slate blue, a little lighter at the grout, a faint gloss at the top of each. */
function tileTexture() {
  const { c, ctx } = canvas(512, 256);
  const r = seeded(33);
  ctx.fillStyle = '#9fb4c6';
  ctx.fillRect(0, 0, 512, 256);
  const tw = 128;
  const th = 64;
  for (let row = 0; row < 4; row++)
    for (let col = -1; col < 5; col++) {
      const x = col * tw + (row % 2 ? tw / 2 : 0);
      const y = row * th;
      const k = r();
      ctx.fillStyle = `rgb(${112 + k * 10},${140 + k * 10},${164 + k * 10})`;
      ctx.fillRect(x + 3, y + 3, tw - 6, th - 6);
      const g = ctx.createLinearGradient(0, y, 0, y + th);
      g.addColorStop(0, 'rgba(255,255,255,0.16)');
      g.addColorStop(0.4, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + 3, y + 3, tw - 6, th - 6);
    }
  return tex(c, { repeat: [4, 1.2] });
}

/** The cast-iron plate's emissive pattern: a glowing edge band and faint rings, so the heat shows round the pot. */
function plateGlowTexture() {
  const { c, ctx } = canvas(256, 256);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, '#5a1a08');
  g.addColorStop(0.55, '#8a2a0c');
  g.addColorStop(0.8, '#ffffff');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  for (const rr of [30, 52, 74, 96]) {
    ctx.beginPath();
    ctx.arc(128, 128, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  return tex(c);
}

/** A bar with a smaller top face (a gold ingot): length x, depth z, height y; its base on y = 0. */
function ingotGeometry({ lx, lz, hy, tx, tz }) {
  const b = [
    [-lx / 2, 0, -lz / 2],
    [lx / 2, 0, -lz / 2],
    [lx / 2, 0, lz / 2],
    [-lx / 2, 0, lz / 2],
  ];
  const u = [
    [-tx / 2, hy, -tz / 2],
    [tx / 2, hy, -tz / 2],
    [tx / 2, hy, tz / 2],
    [-tx / 2, hy, tz / 2],
  ];
  const quads = [
    [u[0], u[3], u[2], u[1]], // top
    [b[0], b[1], b[2], b[3]], // bottom
    [b[3], b[2], u[2], u[3]], // front
    [b[1], b[0], u[0], u[1]], // back
    [b[0], b[3], u[3], u[0]], // left
    [b[2], b[1], u[1], u[2]], // right
  ];
  const pos = [];
  for (const [a, bb, cc, d] of quads) pos.push(...a, ...bb, ...cc, ...a, ...cc, ...d);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export function createScene({ background = true } = {}) {
  const root = new THREE.Group();
  root.name = 'SpecificHeat';
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });

  // ── the bench and the wall ──────────────────────────────────────────────────
  if (background) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(150, 8, 100), std('#ffffff', { map: oakTexture(), roughness: 0.62 }));
    bench.position.set(0, -4, 5);
    bench.receiveShadow = true;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(420, 220), new THREE.MeshBasicMaterial({ map: wallTexture() }));
    wall.position.set(0, 100, -45);
    const splash = new THREE.Mesh(
      new THREE.PlaneGeometry(190, 58),
      new THREE.MeshStandardMaterial({ map: tileTexture(), roughness: 0.35, metalness: 0 }),
    );
    splash.position.set(0, 29, -44.6);
    splash.receiveShadow = true;
    root.add(bench, wall, splash);
  }

  // ── the stove: a dark body, a black top, two cast-iron plates, one knob and a lamp ──────────────────
  const stove = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(86, STOVE_TOP, 40), std('#3a3f47', { roughness: 0.5, metalness: 0.25 }));
  body.position.set(0, STOVE_TOP / 2, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(84, 0.4, 38), std('#1d2024', { roughness: 0.35, metalness: 0.35 }));
  top.position.set(0, STOVE_TOP + 0.05, 0);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(36, 3.6, 0.3), std('#d4d8dd', { roughness: 0.4, metalness: 0.3 }));
  panel.position.set(0, 3.1, 20.1);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 1.8, 28), std('#f1f3f5', { metalness: 1, roughness: 0.22 }));
  knob.rotation.x = Math.PI / 2;
  knob.position.set(KNOB.x, KNOB.y, 20.9);
  const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.2), std('#e8590c'));
  pointer.position.set(0, KNOB.y + 0.7, 21.85);
  const lampMat = new THREE.MeshStandardMaterial({ color: '#4a2a10', emissive: '#ff9a1f', emissiveIntensity: 0, roughness: 0.3 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), lampMat);
  lamp.position.set(10, 3.1, 20.4);
  stove.add(body, top, panel, knob, pointer, lamp);
  root.add(stove);

  const plateGlow = plateGlowTexture();
  const plates = {};
  const glowMats = {}; // each plate has its own materials: only the plate under something that is heated glows
  for (const id of Object.keys(PLATE_X)) {
    const top = new THREE.MeshStandardMaterial({
      color: '#2b2c30',
      roughness: 0.5,
      metalness: 0.5,
      emissive: new THREE.Color('#ff4a12'),
      emissiveMap: plateGlow,
      emissiveIntensity: 0,
    });
    const side = new THREE.MeshStandardMaterial({
      color: '#2b2c30',
      roughness: 0.5,
      metalness: 0.5,
      emissive: new THREE.Color('#ff4a12'),
      emissiveIntensity: 0,
    });
    glowMats[id] = { top, side };
    const p = new THREE.Mesh(new THREE.CylinderGeometry(16, 16.4, PLATE_TOP - STOVE_TOP, 56), [side, top, side]);
    p.position.set(PLATE_X[id], (STOVE_TOP + PLATE_TOP) / 2, 0);
    p.receiveShadow = true;
    root.add(p);
    plates[id] = p;
  }

  // ── the pot with 10 litres of water ────────────────────────────────────────
  const potMat = std('#c3c8cf', { metalness: 1, roughness: 0.3, side: THREE.DoubleSide });
  const R = POT.R;
  const prof = [
    [0, 0],
    [R - 0.6, 0],
    [R, 0.5],
    [R, POT.H],
    [R + 0.35, POT.H + 0.2],
    [R + 0.35, POT.H + 0.55],
    [R - 0.15, POT.H + 0.45],
    [R - POT.wall, POT.H],
    [R - POT.wall, POT.base],
    [0, POT.base],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(prof, 56), potMat);
  pot.position.set(PLATE_X.water, PLATE_TOP, 0);
  pot.castShadow = true;
  pot.receiveShadow = true;
  const handleGeo = new THREE.TorusGeometry(2.3, 0.55, 8, 20, Math.PI);
  const handleMat = std('#2a2d33', { roughness: 0.5 });
  for (const sx of [-1, 1]) {
    const h = new THREE.Mesh(handleGeo, handleMat);
    h.rotation.set(0, 0, sx > 0 ? -Math.PI / 2 : Math.PI / 2);
    h.position.set(sx * (R + 0.2), POT.H - 4.2, 0);
    pot.add(h);
  }
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#4f9fe0',
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.8,
  });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(R - POT.wall - 0.1, R - POT.wall - 0.1, POT.water, 56), waterMat);
  water.position.set(0, POT.base + POT.water / 2, 0);
  pot.add(water);
  root.add(pot);

  // ── the 10 kg gold bar ─────────────────────────────────────────────────────
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#e3b232',
    metalness: 1,
    roughness: 0.22,
    emissive: new THREE.Color('#c2480a'),
    emissiveIntensity: 0,
  });
  const IN = { lx: 22, lz: 8.4, hy: 3.6, tx: 19.4, tz: 6.0 };
  const gold = new THREE.Mesh(ingotGeometry(IN), goldMat);
  gold.position.set(PLATE_X.gold, PLATE_TOP, 0);
  gold.castShadow = true;
  gold.receiveShadow = true;
  // a stamped panel on top: a shallow raised rim round a darker recess carrying the fineness and a hallmark
  const panelCanvas = document.createElement('canvas');
  panelCanvas.width = 256;
  panelCanvas.height = 96;
  const pg = /** @type {CanvasRenderingContext2D} */ (panelCanvas.getContext('2d'));
  pg.fillStyle = '#a97a14';
  pg.fillRect(0, 0, 256, 96);
  pg.fillStyle = '#d9a82a';
  pg.font = 'bold 40px sans-serif';
  pg.textAlign = 'center';
  pg.textBaseline = 'middle';
  pg.fillText('Au 999.9', 128, 36);
  pg.font = 'bold 22px sans-serif';
  pg.fillText('10 kg', 128, 72);
  const panelTex = new THREE.CanvasTexture(panelCanvas);
  panelTex.colorSpace = THREE.SRGBColorSpace;
  const rim = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 4.2), std('#f0c43e', { metalness: 1, roughness: 0.2 }));
  rim.position.set(0, IN.hy + 0.2, 0);
  const stamp = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 3.0), std('#ffffff', { map: panelTex, metalness: 0.9, roughness: 0.4 }));
  stamp.rotation.x = -Math.PI / 2;
  stamp.position.set(0, IN.hy + 0.46, 0);
  gold.add(rim, stamp);
  root.add(gold);

  // ── two glass thermometers with the same scale ─────────────────────────────
  const glass = new THREE.MeshStandardMaterial({ color: '#dfeaf2', transparent: true, opacity: 0.38, roughness: 0.05, depthWrite: false });
  const liquidMat = new THREE.MeshStandardMaterial({ color: '#d8262b', roughness: 0.3, emissive: '#7a0b0f', emissiveIntensity: 0.35 });
  const plateTherm = std('#f4eddd', { roughness: 0.6 });
  const tickMat = new THREE.MeshBasicMaterial({ color: '#4a4f57' });
  const startMat = new THREE.MeshBasicMaterial({ color: '#1c6fd9' });
  const mounts = {};
  const columns = {};
  const unitCyl = new THREE.CylinderGeometry(0.32, 0.32, 1, 12);
  for (const id of Object.keys(THERMO_X)) {
    const g = new THREE.Group();
    g.position.set(THERMO_X[id], 0, 0);
    const height = THERMO_TOP - (STOVE_TOP + 0.4);
    const back = new THREE.Mesh(new THREE.BoxGeometry(4.2, height, 0.45), plateTherm);
    back.position.set(0, STOVE_TOP + 0.4 + height / 2, -0.4);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 3.4), std('#5b606a', { roughness: 0.5 }));
    foot.position.set(0, STOVE_TOP + 0.25, -0.1);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 14), liquidMat);
    bulb.position.set(0, BULB_Y, 0.3);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, thermoY(T_MAX) - BULB_Y + 0.8, 14), glass);
    tube.position.set(0, BULB_Y + (thermoY(T_MAX) - BULB_Y + 0.8) / 2, 0.3);
    const col = new THREE.Mesh(unitCyl, liquidMat);
    col.position.set(0, BULB_Y, 0.3);
    columns[id] = col;
    g.add(back, foot, bulb, tube, col);
    // ticks every 10 °C (long), every 5 (short); the starting 30 °C is a blue line across the plate
    for (let T = T_MIN; T <= T_MAX; T += 5) {
      const long = T % 10 === 0;
      const w = T === 30 ? 3.9 : long ? 1.3 : 0.75;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, T === 30 ? 0.2 : 0.12, 0.05), T === 30 ? startMat : tickMat);
      m.position.set(T === 30 ? 0 : -2 + w / 2, thermoY(T), -0.15);
      g.add(m);
    }
    root.add(g);
    mounts[id] = g;
  }

  // ── what a figure changes ──────────────────────────────────────────────────
  const pickable = [knob, pot, water, gold];
  const api = {
    root,
    pot,
    water,
    gold,
    knob,
    plates,
    pickable,
    /** The glow of each plate (0 … 1) and the little lamp on the stove (on when either is). */
    setGlow(gw, gg) {
      for (const [id, g] of [
        ['water', gw],
        ['gold', gg],
      ]) {
        glowMats[id].top.emissiveIntensity = g * 1.1;
        glowMats[id].side.emissiveIntensity = g * 0.7;
      }
      lampMat.emissiveIntensity = Math.max(gw, gg) * 2.2;
    },
    /** The two red columns and the gold's warmth, from the temperatures in °C. */
    setTemps(Tw, Tg) {
      for (const [id, T] of [
        ['water', Tw],
        ['gold', Tg],
      ]) {
        const top = thermoY(T);
        const h = Math.max(0.01, top - BULB_Y);
        columns[id].scale.set(1, h, 1);
        columns[id].position.y = BULB_Y + h / 2;
      }
      goldMat.emissiveIntensity = Math.min(0.28, Math.max(0, (Tg - 30) / 90) * 0.3);
    },
    /** World points for the labels. */
    points: {
      water: new THREE.Vector3(PLATE_X.water, PLATE_TOP + POT.H + 0.5, 6),
      gold: new THREE.Vector3(PLATE_X.gold, PLATE_TOP + IN.hy + 0.2, 4.2),
      thermo: (id, T) => new THREE.Vector3(THERMO_X[id], thermoY(T), 0.6),
      thermoTop: (id) => new THREE.Vector3(THERMO_X[id], THERMO_TOP, 0.4),
      q: (id) => new THREE.Vector3(PLATE_X[id], STOVE_TOP + 0.3, 17),
    },
  };
  return api;
}
