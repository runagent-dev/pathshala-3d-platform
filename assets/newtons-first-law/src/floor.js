// The floors the book slides on (metres; the floor's top is y = 0; x = 0 is where the book's front edge is when the
// launcher lets go, and the floor starts under the book's back edge then): a jute mat, a varnished wooden floor,
// ice, and an imagined floor with no friction (drawn like graph paper, so it reads as an idea, not a material).
// Procedural textures (no image files), aligned to the world so the floor does not swim as it grows. Also: the
// yellow measuring tape beside the floor from x = 0 (a tick every 10 cm, metres numbered), the marks the book
// leaves every 0.1 s, and the lines where it stopped.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { BOOK, STEP } from './motion.js';

export const FLOOR = { width: 0.7, thick: 0.03, start: -BOOK.length };
export const SURFACE_COLORS = { mat: '#9c6b2f', wood: '#b06a1e', ice: '#1c8fb0', none: '#6e59c9' };
const TAPE = { z0: FLOOR.width / 2 + 0.01, width: 0.1 };

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function texture(c, aniso) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  return t;
}

/** A woven jute mat (মাদুর): over-under strips of tan fibre. One tile = 0.2 m. */
function matTexture(aniso) {
  const S = 256;
  const c = canvas(S, S);
  const ctx = c.getContext('2d');
  const r = rand(5);
  ctx.fillStyle = '#d2a868';
  ctx.fillRect(0, 0, S, S);
  const n = 8; // strips per tile
  const w = S / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const across = (i + j) % 2 === 0;
      const x = i * w;
      const y = j * w;
      const g = ctx.createLinearGradient(x, y, across ? x : x + w, across ? y + w : y);
      const base = across ? [222, 184, 122] : [204, 164, 102];
      g.addColorStop(0, `rgb(${base.map((v) => v - 30).join(',')})`);
      g.addColorStop(0.5, `rgb(${base.join(',')})`);
      g.addColorStop(1, `rgb(${base.map((v) => v - 34).join(',')})`);
      ctx.fillStyle = g;
      ctx.fillRect(x + 1, y + 1, w - 2, w - 2);
      // fibres along the strip
      ctx.strokeStyle = 'rgba(90,60,25,0.28)';
      ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        const o = 3 + r() * (w - 6);
        ctx.beginPath();
        if (across) {
          ctx.moveTo(x + 2, y + o);
          ctx.lineTo(x + w - 2, y + o + (r() - 0.5) * 2);
        } else {
          ctx.moveTo(x + o, y + 2);
          ctx.lineTo(x + o + (r() - 0.5) * 2, y + w - 2);
        }
        ctx.stroke();
      }
    }
  return texture(c, aniso);
}

/** Varnished floorboards along the floor (x), 10 cm wide, with grain and staggered joints. One tile = 1 m × 0.5 m. */
function woodTexture(aniso) {
  const W = 1024;
  const H = 512;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const r = rand(17);
  const boards = 5;
  const bh = H / boards;
  for (let b = 0; b < boards; b++) {
    const tone = 0.85 + r() * 0.25;
    const col = (v) => Math.round(v * tone);
    ctx.fillStyle = `rgb(${col(196)},${col(140)},${col(88)})`;
    ctx.fillRect(0, b * bh, W, bh);
    for (let k = 0; k < 26; k++) {
      const y0 = b * bh + r() * bh;
      const amp = 1 + r() * 3;
      ctx.strokeStyle = `rgba(${110 + r() * 30},${62 + r() * 20},${28},${0.12 + r() * 0.22})`;
      ctx.lineWidth = 0.8 + r() * 1.8;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const y = Math.min(b * bh + bh - 1, Math.max(b * bh + 1, y0 + Math.sin(x * 0.006 + k) * amp));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    // the seam under the board and one end joint
    ctx.fillStyle = 'rgba(70,40,15,0.55)';
    ctx.fillRect(0, b * bh + bh - 2, W, 2);
    const jx = ((b * 0.37 + 0.15) % 1) * W;
    ctx.fillRect(jx, b * bh, 2, bh);
  }
  return texture(c, aniso);
}

/** Ice: blue-white, with faint skate scratches and a few frozen bubbles. One tile = 1 m × 0.5 m. */
function iceTexture(aniso) {
  const W = 1024;
  const H = 512;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const r = rand(23);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#dff2fa');
  g.addColorStop(0.5, '#eef9fd');
  g.addColorStop(1, '#d6eef8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    const x = r() * W;
    const y = r() * H;
    const rr = 30 + r() * 120;
    const cg = ctx.createRadialGradient(x, y, 0, x, y, rr);
    cg.addColorStop(0, `rgba(170,215,235,${0.15 + r() * 0.2})`);
    cg.addColorStop(1, 'rgba(170,215,235,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  ctx.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = r() * H;
    const len = 60 + r() * 260;
    const a = (r() - 0.5) * 0.5;
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + r() * 0.4})`;
    ctx.lineWidth = 0.6 + r() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
    // wrap so the tile repeats along the floor
    ctx.beginPath();
    ctx.moveTo(x - W, y);
    ctx.lineTo(x - W + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  return texture(c, aniso);
}

/** The imagined floor with no friction: pale graph paper, a line every 10 cm, darker every 50 cm. One tile = 0.5 m. */
function gridTexture(aniso) {
  const S = 500;
  const c = canvas(S, S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4f3fb';
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = '#d9d4f0';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(i * 100, 0, 2, S);
    ctx.fillRect(0, i * 100, S, 2);
  }
  ctx.fillStyle = '#b9b0e6';
  ctx.fillRect(0, 0, 3, S);
  ctx.fillRect(0, 0, S, 3);
  return texture(c, aniso);
}

/** The four floors: material for the top, colour for the sides, and the tile size of the texture (m). */
export function createSurfaces(aniso) {
  return {
    mat: {
      top: new THREE.MeshStandardMaterial({ name: 'JuteMat', map: matTexture(aniso), roughness: 0.95 }),
      side: '#7d5a2e',
      tile: [0.2, 0.2],
    },
    wood: {
      top: new THREE.MeshPhysicalMaterial({
        name: 'WoodenFloor',
        map: woodTexture(aniso),
        roughness: 0.38,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      }),
      side: '#7a4a1f',
      tile: [1, 0.5],
    },
    ice: {
      top: new THREE.MeshPhysicalMaterial({
        name: 'Ice',
        map: iceTexture(aniso),
        roughness: 0.12,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
      side: '#9fd3e6',
      tile: [1, 0.5],
    },
    none: {
      top: new THREE.MeshStandardMaterial({ name: 'NoFrictionFloor', map: gridTexture(aniso), roughness: 0.9 }),
      side: '#c9c2ea',
      tile: [0.5, 0.5],
    },
  };
}

/**
 * The floor strip from x0 to x1 (it grows ahead of the book). setSurface swaps its look; setExtent its length (the
 * texture stays put on the ground).
 */
export function createFloor(surfaces) {
  const sideMat = new THREE.MeshStandardMaterial({ name: 'FloorSide', color: '#7d5a2e', roughness: 0.8 });
  const geo = new THREE.BoxGeometry(1, FLOOR.thick, FLOOR.width);
  const mesh = new THREE.Mesh(geo, [sideMat, sideMat, surfaces.mat.top, sideMat, sideMat, sideMat]);
  mesh.name = 'Floor';
  mesh.receiveShadow = true;
  let id = 'mat';
  let x0 = FLOOR.start;
  let x1 = 4;
  function apply() {
    const s = surfaces[id];
    const len = x1 - x0;
    mesh.scale.x = len;
    mesh.position.set((x0 + x1) / 2, -FLOOR.thick / 2, 0);
    const map = s.top.map;
    map.repeat.set(len / s.tile[0], FLOOR.width / s.tile[1]);
    map.offset.set(x0 / s.tile[0], 0);
  }
  apply();
  return {
    mesh,
    get surface() {
      return id;
    },
    setSurface(next) {
      id = next;
      mesh.material[2] = surfaces[id].top;
      sideMat.color.set(surfaces[id].side);
      apply();
    },
    setExtent(from, to) {
      if (Math.abs(from - x0) < 1e-6 && Math.abs(to - x1) < 1e-6) return;
      x0 = from;
      x1 = to;
      apply();
    },
    get extent() {
      return [x0, x1];
    },
  };
}

/**
 * The measuring tape beside the floor, from 0 m on: a tick every 10 cm (longer at 50 cm), the metres numbered
 * ("১ মি"). Ticks and numbers are made only near the camera (show(from, to)), so it can run on for ever.
 */
export function createTape({ t }) {
  const group = new THREE.Group();
  group.name = 'Tape';
  const tapeMat = new THREE.MeshStandardMaterial({ name: 'Tape', color: '#f5d33f', roughness: 0.55 });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1, 0.002, TAPE.width), tapeMat);
  group.add(strip);
  const ink = new THREE.MeshBasicMaterial({ name: 'TapeInk', color: '#2b2b2b', toneMapped: false });
  const MAX = 120;
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0022, 0.0006, 1), ink, MAX);
  ticks.count = 0;
  ticks.frustumCulled = false;
  group.add(ticks);
  const numbers = new Map(); // metre → mesh group
  const m = new THREE.Matrix4();
  const zEdge = TAPE.z0; // the tape's edge next to the floor: ticks start there

  /** "১২ মি" from cached digit pictures (a picture per digit, not per number, so it can count up for ever). */
  function numberMesh(k) {
    const g = new THREE.Group();
    const sizes = [...t.num(String(k))].map((d) => [d, 0.056, 700]);
    sizes.push([t('u_m'), 0.04, 600]);
    const parts = sizes.map(([text, h, weight]) => textMesh(text, h, { color: '#2b2b2b', weight }));
    // a text plane is its text plus 0.16 em of padding: lay the texts side by side by their real widths
    const widths = parts.map((p, i) => p.geometry.parameters.width - 0.16 * sizes[i][1]);
    const gap = 0.012;
    const total = widths.reduce((a, b) => a + b, 0) + gap;
    let x = -total / 2;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) x += gap;
      p.position.x = x + widths[i] / 2;
      x += widths[i];
      g.add(p);
    });
    g.rotation.x = -Math.PI / 2;
    return g;
  }

  let shown = [Number.NaN, Number.NaN];
  function show(from, to) {
    const a = Math.max(0, Math.floor(from * 10) / 10);
    const b = Math.max(a, Math.ceil(to * 10) / 10);
    if (a === shown[0] && b === shown[1]) return;
    shown = [a, b];
    strip.scale.x = Math.max(0.001, b - a + 0.1);
    strip.position.set((a + b) / 2, 0.001, zEdge + TAPE.width / 2);
    let n = 0;
    for (let i = Math.round(a * 10); i <= Math.round(b * 10) && n < MAX; i++) {
      const len = i % 10 === 0 ? 0.04 : i % 5 === 0 ? 0.028 : 0.016;
      m.makeScale(1, 1, len).setPosition(i / 10, 0.0024, zEdge + len / 2);
      ticks.setMatrixAt(n++, m);
    }
    ticks.count = n;
    ticks.instanceMatrix.needsUpdate = true;
    for (const [k, g] of numbers)
      if (k < a - 0.5 || k > b + 0.5) {
        group.remove(g);
        for (const p of g.children) p.geometry.dispose();
        numbers.delete(k);
      }
    for (let k = Math.ceil(a); k <= Math.floor(b); k++) {
      if (numbers.has(k)) continue;
      const g = numberMesh(k);
      g.position.set(k + 0.012, 0.0026, zEdge + 0.068);
      group.add(g);
      numbers.set(k, g);
    }
  }
  return { group, show };
}

/** The marks the book leaves every STEP s (small dark dots along the middle of the floor). */
export function createMarks(max = 120) {
  const mat = new THREE.MeshBasicMaterial({ name: 'Marks', color: '#34404e', toneMapped: false });
  const geo = new THREE.CylinderGeometry(0.0085, 0.0085, 0.001, 16);
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.name = 'Marks';
  mesh.count = 0;
  mesh.frustumCulled = false;
  const m = new THREE.Matrix4();
  return {
    mesh,
    step: STEP,
    max,
    /** xs: positions (m) of the marks to show; only the last `max` are kept. */
    set(xs, z = 0) {
      const list = xs.length > max ? xs.slice(xs.length - max) : xs;
      list.forEach((x, i) => mesh.setMatrixAt(i, m.makeTranslation(x, 0.0012, z)));
      mesh.count = list.length;
      mesh.instanceMatrix.needsUpdate = true;
    },
    clear() {
      mesh.count = 0;
    },
  };
}

/** Where the book stopped on a floor: a line painted across the floor in that floor's colour (labelled at its far end). */
export function createStopMark(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ name: 'StopMark', color, toneMapped: false });
  // dashed, so it reads as paint on the floor (a solid line seen at the edge of the view looks like a stick)
  const dash = new THREE.BoxGeometry(0.012, 0.0016, 0.032);
  for (let z = -FLOOR.width / 2 + 0.02; z < FLOOR.width / 2 - 0.01; z += 0.052) {
    const m = new THREE.Mesh(dash, mat);
    m.position.set(0, 0.0018, z + 0.016);
    g.add(m);
  }
  g.visible = false;
  const top = new THREE.Vector3();
  return {
    group: g,
    /** The far end of the line, where its label goes. */
    top,
    place(x) {
      g.position.x = x;
      g.visible = true;
      top.set(x, 0.002, -FLOOR.width / 2);
    },
  };
}
