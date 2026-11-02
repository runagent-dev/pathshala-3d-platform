// The book's figure ৬.০৮ as a chart on the lab wall: temperature (°C) against time, the same grid (8 squares along,
// −20 to 120 °C up), the same curve with its two flat parts. The grid, the numbers and the faint full curve are drawn
// once on a canvas (one per direction: heating, or cooling as the mirror); the part of the curve already run is a
// small ribbon mesh that grows (blue where the temperature changes, orange where it stays, the change of state) with
// a marker and a thin line across to the temperature scale. So a frame costs a few vertices, not a texture upload.
import * as THREE from 'three';
import { T_MAX, T_MIN, TMAX, curve } from './reading.js';

export const BOARD = { w: 22, h: 16.5 };
const TEX = { w: 1280, h: 960 };
// the plot inside the texture (pixels): 8 squares of 125 px across, 20 °C = 111.4 px up
const PLOT = { x0: 230, x1: 1230, y0: 60, y1: 840 };
const FONT = '"Noto Sans Bengali", "Segoe UI", Roboto, Arial, sans-serif';
export const COLORS = { change: '#1c5fb8', flat: '#e8590c', ink: '#1d2733', dot: '#ffffff' };

const pxX = (tau) => PLOT.x0 + (tau / TMAX) * (PLOT.x1 - PLOT.x0);
const pxY = (T) => PLOT.y0 + ((T_MAX - T) / (T_MAX - T_MIN)) * (PLOT.y1 - PLOT.y0);
const toLocalX = (px) => (px / TEX.w - 0.5) * BOARD.w;
const toLocalY = (py) => (0.5 - py / TEX.h) * BOARD.h;

function drawPaper(g, labels) {
  const { x0, x1, y0, y1 } = PLOT;
  g.fillStyle = '#fbf7ea';
  g.fillRect(0, 0, TEX.w, TEX.h);
  // the grid: a line every 20 °C and every square
  g.lineWidth = 3;
  g.strokeStyle = '#b9b29c';
  for (let T = T_MIN; T <= T_MAX; T += 20) {
    g.beginPath();
    g.moveTo(x0, pxY(T));
    g.lineTo(x1, pxY(T));
    g.stroke();
  }
  for (let k = 0; k <= TMAX; k++) {
    g.beginPath();
    g.moveTo(pxX(k), y0);
    g.lineTo(pxX(k), y1);
    g.stroke();
  }
  // the two temperatures that matter, a little stronger
  g.strokeStyle = '#7e7863';
  g.lineWidth = 4;
  for (const T of [0, 100]) {
    g.beginPath();
    g.moveTo(x0, pxY(T));
    g.lineTo(x1, pxY(T));
    g.stroke();
  }
  g.strokeStyle = COLORS.ink;
  g.lineWidth = 7;
  g.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // numbers up the side (as the book's: 0 to 100)
  g.fillStyle = COLORS.ink;
  g.font = `700 50px ${FONT}`;
  g.textAlign = 'right';
  g.textBaseline = 'middle';
  for (let T = 0; T <= 100; T += 20) g.fillText(labels.num(T), x0 - 18, pxY(T) + 3);
  // the axes' names
  g.font = `700 54px ${FONT}`;
  g.textAlign = 'center';
  g.fillText(labels.xTitle, (x0 + x1) / 2, 912);
  g.save();
  g.translate(42, (y0 + y1) / 2);
  g.rotate(-Math.PI / 2);
  g.fillText(labels.yTitle, 0, 0);
  g.restore();
}

/** A small plane carrying one word, with a paper-coloured halo so a grid line never cuts through it. */
function makeName(text, { em = 1.1, color = COLORS.ink } = {}) {
  const PPU = 64; // pixels per world unit
  const px = em * PPU;
  const c = document.createElement('canvas');
  const measure = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  measure.font = `700 ${px}px ${FONT}`;
  c.width = Math.ceil(measure.measureText(text).width + px * 0.6);
  c.height = Math.ceil(px * 1.5);
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  g.font = `700 ${px}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = px * 0.22;
  g.strokeStyle = '#fbf7ea';
  g.strokeText(text, c.width / 2, c.height / 2 + px * 0.04);
  g.fillStyle = color;
  g.fillText(text, c.width / 2, c.height / 2 + px * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(c.width / PPU, c.height / PPU),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }),
  );
}

function makeTexture(draw) {
  const c = document.createElement('canvas');
  c.width = TEX.w;
  c.height = TEX.h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createBoard() {
  const root = new THREE.Group();
  root.name = 'chart';
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(BOARD.w + 1.2, BOARD.h + 1.2, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x4d3322, roughness: 0.6 }),
  );
  frame.position.z = -0.37;
  frame.castShadow = true;
  root.add(frame);

  const paperMat = (map) => new THREE.MeshBasicMaterial({ map, toneMapped: false });
  const faces = {
    heat: new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), paperMat(null)),
    cool: new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), paperMat(null)),
  };
  faces.cool.visible = false;
  root.add(faces.heat, faces.cool);
  // the words on the chart: what happens on the flat parts and the three states (hidden while a test question asks)
  const names = { heat: [], cool: [] };
  let namesOn = true;

  // the ribbon of the curve already run: five quads (one per part of the curve), a marker and a guide to the scale
  const HW = 0.24; // half the line's width
  const pos = new Float32Array(5 * 4 * 3);
  const col = new Float32Array(5 * 4 * 3);
  const idx = [];
  for (let k = 0; k < 5; k++) idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  const ribbon = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }));
  ribbon.position.z = 0.04;
  ribbon.frustumCulled = false;
  root.add(ribbon);

  const guide = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x1d2733, transparent: true, opacity: 0.55, toneMapped: false }),
  );
  guide.position.z = 0.03;
  root.add(guide);
  const marker = new THREE.Group();
  const disc = (r, color, z) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
    m.position.z = z;
    return m;
  };
  marker.add(disc(0.72, 0x1d2733, 0.06), disc(0.58, 0xffffff, 0.07), disc(0.38, 0xe8590c, 0.08));
  root.add(marker);

  /** The whole curve, faint and dashed, as one mesh of small quads: where the run is going. */
  function dashed(flow) {
    const pts = curve(flow);
    const DASH = 0.8;
    const GAP = 0.6;
    const W = 0.1;
    const v = [];
    const idx = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const ax = toLocalX(pxX(pts[k][0]));
      const ay = toLocalY(pxY(pts[k][1]));
      const bx = toLocalX(pxX(pts[k + 1][0]));
      const by = toLocalY(pxY(pts[k + 1][1]));
      const len = Math.hypot(bx - ax, by - ay);
      const dx = (bx - ax) / len;
      const dy = (by - ay) / len;
      for (let d = 0; d < len; d += DASH + GAP) {
        const e = Math.min(d + DASH, len);
        const i = v.length / 3;
        for (const [along, side] of [
          [d, 1],
          [e, 1],
          [e, -1],
          [d, -1],
        ])
          v.push(ax + dx * along - dy * W * side, ay + dy * along + dx * W * side, 0);
        idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x8b94a0, toneMapped: false }));
    m.position.z = 0.015;
    return m;
  }
  const future = { heat: dashed('heat'), cool: dashed('cool') };
  root.add(future.heat, future.cool);
  let futureOn = true;

  const c = new THREE.Color();
  let flow = 'heat';
  let pts = curve('heat');
  // the flat parts (a change of state) are parts 1 and 3 in either direction: orange; the rest blue
  for (let k = 0; k < 5; k++) {
    c.set(k === 1 || k === 3 ? COLORS.flat : COLORS.change);
    for (let v = 0; v < 4; v++) col.set([c.r, c.g, c.b], (k * 4 + v) * 3);
  }
  geo.attributes.color.needsUpdate = true;
  const lx = (tau) => toLocalX(pxX(tau));
  const ly = (T) => toLocalY(pxY(T));
  const left = toLocalX(PLOT.x0);

  /** Redraws the ribbon, the marker and the guide up to time τ (in squares); plain numbers, nothing allocated. */
  function setTau(tau) {
    const t = Math.min(TMAX, Math.max(0, tau));
    let mx = lx(pts[0][0]);
    let my = ly(pts[0][1]);
    for (let k = 0; k < 5; k++) {
      const x0 = pts[k][0];
      const y0 = pts[k][1];
      const x1 = pts[k + 1][0];
      const y1 = pts[k + 1][1];
      const on = t > x0 + 1e-9;
      const f = on ? Math.min(1, (t - x0) / (x1 - x0)) : 0;
      const ax = lx(x0);
      const ay = ly(y0);
      const bx = lx(x0 + (x1 - x0) * f);
      const by = ly(y0 + (y1 - y0) * f);
      let dx = bx - ax;
      let dy = by - ay;
      const len = Math.hypot(dx, dy);
      const o = k * 12;
      if (!on || len < 1e-6) {
        for (let v = 0; v < 4; v++) {
          pos[o + v * 3] = ax;
          pos[o + v * 3 + 1] = ay;
        }
      } else {
        dx /= len;
        dy /= len;
        const nx = -dy * HW;
        const ny = dx * HW;
        const c0 = k === 0 ? 0 : HW * 0.98; // square caps overlap at the corners (the line's two ends stay square)
        const c1 = k === 4 ? 0 : HW * 0.98;
        const sx = ax - dx * c0;
        const sy = ay - dy * c0;
        const ex = bx + dx * c1;
        const ey = by + dy * c1;
        pos[o] = sx + nx;
        pos[o + 1] = sy + ny;
        pos[o + 3] = ex + nx;
        pos[o + 4] = ey + ny;
        pos[o + 6] = ex - nx;
        pos[o + 7] = ey - ny;
        pos[o + 9] = sx - nx;
        pos[o + 10] = sy - ny;
        mx = bx;
        my = by;
      }
    }
    geo.attributes.position.needsUpdate = true;
    marker.position.set(mx, my, 0);
    guide.visible = mx - left > 0.6;
    guide.scale.x = Math.max(mx - left, 0.001);
    guide.position.set(left + guide.scale.x / 2, my, 0.03);
  }

  function setFlow(next) {
    flow = next === 'cool' ? 'cool' : 'heat';
    pts = curve(flow);
    faces.heat.visible = flow === 'heat';
    faces.cool.visible = flow === 'cool';
    setNames(namesOn);
    setFuture(futureOn);
  }

  /** Shows or hides the faint curve ahead of the marker (a test question hides it). */
  function setFuture(on) {
    futureOn = on;
    future.heat.visible = on && flow === 'heat';
    future.cool.visible = on && flow === 'cool';
  }

  function setNames(on) {
    namesOn = on;
    for (const f of ['heat', 'cool']) for (const m of names[f]) m.visible = on && flow === f;
  }

  /** Draws the two papers (waits for the font, so the numbers and words come out in Noto Sans Bengali). */
  function paint(labels) {
    faces.heat.material.map = faces.cool.material.map = makeTexture((g) => drawPaper(g, labels)); // the same paper for both
    faces.heat.material.needsUpdate = faces.cool.material.needsUpdate = true;
    // heating: melting on the flat part at 0 °C, boiling on the one at 100 °C; cooling: the other way round
    const put = (f, text, tau, T, opt) => {
      const m = makeName(text, opt);
      m.position.set(lx(tau), ly(T), 0.02);
      names[f].push(m);
      root.add(m);
    };
    const proc = { em: 1.06, color: COLORS.flat };
    const state = { em: 0.88, color: '#3b4a5a' };
    put('heat', labels.melt, 2, 10, proc);
    put('heat', labels.boil, 6, 110, proc);
    put('heat', labels.solid, 0.5, 12, state);
    put('heat', labels.liquid, 5.5, 38, state);
    put('heat', labels.gas, 7.4, 82, state);
    put('cool', labels.condense, 2, 110, proc);
    put('cool', labels.freeze, 6, 10, proc);
    put('cool', labels.gas, 0.6, 82, state);
    put('cool', labels.liquid, 2.5, 24, state);
    put('cool', labels.solid, 7.45, 34, state);
    setNames(namesOn);
  }

  /** The time (squares) under a point of the paper given as the plane's uv, or null outside the plot. */
  function tauAtUV(u) {
    const px = u * TEX.w;
    return Math.min(TMAX, Math.max(0, ((px - PLOT.x0) / (PLOT.x1 - PLOT.x0)) * TMAX));
  }

  return {
    root,
    setTau,
    setFlow,
    setNames,
    setFuture,
    paint,
    tauAtUV,
    face: () => faces[flow],
    get flow() {
      return flow;
    },
  };
}
