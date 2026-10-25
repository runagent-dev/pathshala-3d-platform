// The 3D pieces of the figure, procedural three.js in millimetres: a sheet of graph paper (1 cm squares, a compass
// rose in one corner) on a wooden drawing board, arrow pieces lying on it like cut-outs (a shaft with a light mark
// at every unit, so the মান can be counted, and a round tail), a clinical thermometer reading 37° C (a scalar
// beside the vectors), and the helpers drawn on the paper: the দিক arc, the ring of every place a head of the same
// মান could be, a house and a flag for the "where is the school?" question.
// Paper coordinates are squares from the grid's bottom-left corner, x to পূর্ব (east), y to উত্তর (north).
import * as THREE from 'three';
import { FONT, textMesh } from '@shared/student/materials.js';
import { PAPER, ROSE, TEMPERATURE } from './reading.js';

export const UNIT = 10; // mm per square
const EDGE = 0.4; // squares of plain paper round the grid
const PAD = 7; // mm of board round the paper
export const PAPER_TOP = 0.35; // mm: the paper's surface (the board's top is y = 0)
export const ARROW = { thick: 2.4, shaft: 4.2, headW: 10.5, headL: 9, tailR: 2.9 }; // mm
export const COLORS = {
  arrow: '#2b3644',
  mark: '#f4f6f8',
  ink: '#1d2733',
  mag: '#1c6fd9', // মান
  dir: '#d9480f', // দিক
  highlight: '#ffe27a',
  match: '#8fdca8',
  grid: '#9fc4e6',
  gridFine: '#dce9f6',
};

/** Paper coordinates → a point in the scene (on the paper's surface, or `lift` mm above it). */
export function toWorld(x, y, lift = 0, out = new THREE.Vector3()) {
  return out.set((x - PAPER.w / 2) * UNIT, PAPER_TOP + lift, -(y - PAPER.h / 2) * UNIT);
}
/** A point in the scene → paper coordinates [x, y]. */
export const toPaper = (v) => [v.x / UNIT + PAPER.w / 2, -v.z / UNIT + PAPER.h / 2];

/** The extent of the paper and of the board, for framing the camera. */
export const PAPER_SIZE = { w: (PAPER.w + 2 * EDGE) * UNIT, d: (PAPER.h + 2 * EDGE) * UNIT };
export const BOARD_SIZE = { w: (PAPER.w + 2 * EDGE) * UNIT + 2 * PAD, d: (PAPER.h + 2 * EDGE) * UNIT + 2 * PAD, h: 8 };

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** The graph paper: fine 2 mm lines, 1 cm squares, and the compass rose (উ, পূ, দ, প from the figure's strings). */
function paperTexture(t, aniso) {
  const ppu = 168; // texture pixels per square
  const W = Math.round((PAPER.w + 2 * EDGE) * ppu);
  const H = Math.round((PAPER.h + 2 * EDGE) * ppu);
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const X = (x) => (x + EDGE) * ppu;
  const Y = (y) => (PAPER.h + EDGE - y) * ppu;
  const line = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(X(x1), Y(y1));
    ctx.lineTo(X(x2), Y(y2));
    ctx.stroke();
  };
  ctx.strokeStyle = COLORS.gridFine;
  ctx.lineWidth = 2;
  for (let i = 0; i <= PAPER.w * 5; i++) if (i % 5) line(i / 5, 0, i / 5, PAPER.h);
  for (let i = 0; i <= PAPER.h * 5; i++) if (i % 5) line(0, i / 5, PAPER.w, i / 5);
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 4;
  for (let i = 0; i <= PAPER.w; i++) line(i, 0, i, PAPER.h);
  for (let i = 0; i <= PAPER.h; i++) line(0, i, PAPER.w, i);

  // the compass rose: a white disc, the four directions, north filled
  const cx = X(ROSE.x);
  const cy = Y(ROSE.y);
  const r = ROSE.r * ppu;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4b5766';
  ctx.lineWidth = 4;
  ctx.stroke();
  const arm = r * 0.5;
  ctx.fillStyle = '#4b5766';
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const tip = [cx + Math.sin(a) * arm, cy - Math.cos(a) * arm];
    const side = [Math.cos(a) * r * 0.11, Math.sin(a) * r * 0.11];
    ctx.beginPath();
    ctx.moveTo(tip[0], tip[1]);
    ctx.lineTo(cx + side[0], cy + side[1]);
    ctx.lineTo(cx - side[0], cy - side[1]);
    ctx.closePath();
    if (k === 0) {
      ctx.fillStyle = COLORS.ink;
      ctx.fill();
      ctx.fillStyle = '#4b5766';
    } else {
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  ctx.font = `700 ${Math.round(r * 0.42)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const letters = [
    ['rose_n', 0, -1],
    ['rose_e', 1, 0],
    ['rose_s', 0, 1],
    ['rose_w', -1, 0],
  ];
  for (const [key, dx, dy] of letters) {
    ctx.fillStyle = key === 'rose_n' ? COLORS.ink : '#4b5766';
    ctx.fillText(t(key), cx + dx * r * 0.72, cy + dy * r * 0.72 + r * 0.03);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  return tex;
}

/** The drawing board and the paper on it. */
export function createBoard({ materials, t }) {
  const root = new THREE.Group();
  root.name = 'GraphPaperBoard';
  const wood = new THREE.Mesh(new THREE.BoxGeometry(BOARD_SIZE.w, BOARD_SIZE.h, BOARD_SIZE.d), materials.wood);
  wood.name = 'DrawingBoard';
  wood.position.y = -BOARD_SIZE.h / 2;
  wood.receiveShadow = true;
  const pw = (PAPER.w + 2 * EDGE) * UNIT;
  const ph = (PAPER.h + 2 * EDGE) * UNIT;
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(pw, PAPER_TOP * 0.9, ph), new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.9 }));
  sheet.name = 'PaperEdge';
  sheet.position.y = (PAPER_TOP * 0.9) / 2;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(pw, ph),
    new THREE.MeshStandardMaterial({ name: 'GraphPaper', map: paperTexture(t, materials.aniso), roughness: 0.92, metalness: 0 }),
  );
  face.name = 'GraphPaper';
  face.rotation.x = -Math.PI / 2;
  face.position.y = PAPER_TOP;
  root.add(wood, sheet, face);
  // the arrows' shadows on the paper (used when the figure has soft shadows)
  const shade = new THREE.Mesh(
    new THREE.PlaneGeometry(pw, ph),
    new THREE.ShadowMaterial({ opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  );
  shade.name = 'PaperShadow';
  shade.rotation.x = -Math.PI / 2;
  shade.position.y = PAPER_TOP + 0.05;
  shade.receiveShadow = true;
  shade.userData.noExport = true;
  root.add(shade);
  return { root, paper: face };
}

// ── the arrows ─────────────────────────────────────────────────────────────────

const labelCache = new Map();
/** A vector's name as it is written by hand (the book, p38): the letter with a small arrow over it. */
function letterTexture(name, color) {
  const key = `${name}|${color}`;
  if (labelCache.has(key)) return labelCache.get(key);
  const c = canvas(200, 240);
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.font = `700 150px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(name, 100, 212);
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(42, 46);
  ctx.lineTo(150, 46);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(166, 46);
  ctx.lineTo(136, 26);
  ctx.lineTo(136, 66);
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  labelCache.set(key, tex);
  return tex;
}

/** A rounded rectangle (the shaft's cross-section): w across, h tall, from y = 0. */
function roundedSection(w, h, r) {
  const s = new THREE.Shape();
  const x0 = -w / 2;
  const x1 = w / 2;
  s.moveTo(x0 + r, 0);
  s.lineTo(x1 - r, 0);
  s.quadraticCurveTo(x1, 0, x1, r);
  s.lineTo(x1, h - r);
  s.quadraticCurveTo(x1, h, x1 - r, h);
  s.lineTo(x0 + r, h);
  s.quadraticCurveTo(x0, h, x0, h - r);
  s.lineTo(x0, r);
  s.quadraticCurveTo(x0, 0, x0 + r, 0);
  return s;
}

// shared by every arrow: one geometry each, the shaft stretched to length
const shared = {};
function sharedParts() {
  if (shared.shaft) return shared;
  const { thick, shaft, headW, headL, tailR } = ARROW;
  // shaft: the rounded section pushed out 1 mm along +x, stretched to the arrow's length
  const shaftGeo = new THREE.ExtrudeGeometry(roundedSection(shaft, thick, 0.9), { depth: 1, bevelEnabled: false, curveSegments: 3 });
  shaftGeo.rotateY(Math.PI / 2);
  // head: a triangle with a small bevel, base at x = 0, tip at x = headL
  const b = 0.45;
  const tri = new THREE.Shape();
  tri.moveTo(b * 1.6, -(headW / 2 - b * 1.4));
  tri.lineTo(headL - b * 2.2, 0);
  tri.lineTo(b * 1.6, headW / 2 - b * 1.4);
  tri.closePath();
  const headGeo = new THREE.ExtrudeGeometry(tri, { depth: thick - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2 });
  headGeo.translate(0, 0, b);
  headGeo.rotateX(-Math.PI / 2);
  const tailGeo = new THREE.CylinderGeometry(tailR, tailR, thick, 28);
  tailGeo.translate(0, thick / 2, 0);
  const markGeo = new THREE.BoxGeometry(1.1, 0.12, shaft * 0.92);
  markGeo.translate(0, thick + 0.02, 0);
  // the highlighter stroke under a chosen arrow: a strip and two round ends
  const stripGeo = new THREE.PlaneGeometry(1, 13);
  stripGeo.rotateX(-Math.PI / 2);
  stripGeo.translate(0.5, 0, 0);
  const endGeo = new THREE.CircleGeometry(6.5, 20, Math.PI / 2, Math.PI);
  endGeo.rotateX(-Math.PI / 2);
  shared.shaft = shaftGeo;
  shared.head = headGeo;
  shared.tail = tailGeo;
  shared.mark = markGeo;
  shared.strip = stripGeo;
  shared.end = endGeo;
  shared.hitBody = new THREE.BoxGeometry(1, 9, 1);
  shared.hitHead = new THREE.SphereGeometry(1, 12, 8);
  shared.hitMat = new THREE.MeshBasicMaterial({ visible: false });
  shared.highlight = new THREE.MeshBasicMaterial({
    color: COLORS.highlight,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  shared.labelGeo = new THREE.PlaneGeometry(8.4, 10);
  shared.labelGeo.rotateX(-Math.PI / 2);
  return shared;
}

/**
 * One arrow piece. set({ tail, length, angle }) in paper coordinates and degrees; lift (mm) raises it off the
 * paper while it is carried; labelSide 1 puts the name to the left of the arrow, -1 to the right.
 */
export function createArrow(name) {
  const P = sharedParts();
  const root = new THREE.Group();
  root.name = `Vector ${name}`;
  const piece = new THREE.Group(); // at the tail, turned to the arrow's দিক; x runs along the arrow
  piece.name = `Arrow ${name}`;
  root.add(piece);
  const body = new THREE.MeshPhysicalMaterial({
    name: 'ArrowPiece',
    color: COLORS.arrow,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.35,
  });
  const shaft = new THREE.Mesh(P.shaft, body);
  shaft.name = 'Shaft';
  const head = new THREE.Mesh(P.head, body);
  head.name = 'Head';
  const tail = new THREE.Mesh(P.tail, body);
  tail.name = 'Tail';
  const markMat = new THREE.MeshStandardMaterial({
    name: 'UnitMark',
    color: COLORS.mark,
    roughness: 0.6,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const marks = new THREE.InstancedMesh(P.mark, markMat, 8);
  marks.name = 'UnitMarks';
  marks.count = 0;
  const mark = P.highlight.clone(); // its own, so it can flash green when two arrows match
  const strip = new THREE.Mesh(P.strip, mark);
  const endA = new THREE.Mesh(P.end, mark);
  const endB = new THREE.Mesh(P.end, mark);
  endB.rotation.y = Math.PI;
  const highlight = new THREE.Group();
  highlight.add(strip, endA, endB);
  highlight.position.y = 0.06; // just above the paper
  highlight.visible = false;
  highlight.userData.noExport = true;
  for (const m of [strip, endA, endB]) m.renderOrder = 1;
  const hitBody = new THREE.Mesh(P.hitBody, P.hitMat);
  hitBody.userData = { arrow: name, part: 'body', noExport: true };
  const hitHead = new THREE.Mesh(P.hitHead, P.hitMat);
  hitHead.userData = { arrow: name, part: 'head', noExport: true };
  piece.add(highlight, shaft, head, tail, marks, hitBody, hitHead);
  for (const m of [shaft, head, tail]) m.castShadow = true;

  const label = new THREE.Mesh(
    P.labelGeo,
    new THREE.MeshBasicMaterial({ map: letterTexture(name, COLORS.ink), transparent: true, depthWrite: false, toneMapped: false }),
  );
  label.name = `Label ${name}`;
  label.renderOrder = 2;
  root.add(label);

  const m4 = new THREE.Matrix4();
  const state = { tail: [0, 0], length: 1, angle: 0, lift: 0, spot: { k: 0.5, side: 1, off: 1.05 }, shape: '' };
  const v = new THREE.Vector3();

  function layout() {
    const { tail: tl, length, angle, lift } = state;
    const L = length * UNIT;
    toWorld(tl[0], tl[1], lift, piece.position);
    piece.rotation.y = (angle * Math.PI) / 180;
    const shape = `${length}`;
    if (shape !== state.shape) {
      state.shape = shape;
      const shaftLen = Math.max(0.5, L - ARROW.headL + 0.6);
      shaft.scale.x = shaftLen;
      head.position.x = L - ARROW.headL;
      // a light mark at every whole unit along the shaft: the মান can be counted (5 parts = 5 units)
      let n = 0;
      for (let k = 1; k < length && n < 8; k++) {
        if (k * UNIT > L - ARROW.headL - 0.8) break;
        m4.makeTranslation(k * UNIT, 0, 0);
        marks.setMatrixAt(n++, m4);
      }
      marks.count = n;
      marks.instanceMatrix.needsUpdate = true;
      strip.scale.x = L + 2;
      strip.position.x = -1;
      endA.position.x = -1;
      endB.position.x = L + 1;
      hitBody.scale.set(Math.max(4, L - ARROW.headL), 1, 11);
      hitBody.position.set(Math.max(4, L - ARROW.headL) / 2, 3, 0);
      // a short arrow keeps a body to drag: its head target shrinks with it
      hitHead.scale.setScalar(Math.min(8.5, L * 0.32));
      hitHead.position.set(L - Math.min(ARROW.headL * 0.45, L * 0.25), 3, 0);
    }
    // the name beside the arrow, upright on the paper
    const at = spot(state.spot);
    toWorld(at[0], at[1], lift + 0.3, v);
    label.position.copy(v);
  }
  /**
   * Where the name goes, in paper coordinates: at fraction k along the arrow, on its left (side 1) or right (-1),
   * `off` squares from it.
   */
  function spot({ k = 0.5, side = 1, off = 1.05 }) {
    const { tail: tl, length, angle } = state;
    const a = (angle * Math.PI) / 180;
    const at = [tl[0] + Math.cos(a) * length * k, tl[1] + Math.sin(a) * length * k];
    return [at[0] - Math.sin(a) * off * side, at[1] + Math.cos(a) * off * side];
  }

  return {
    name,
    root,
    piece,
    hits: [hitBody, hitHead],
    get state() {
      return state;
    },
    set({ tail: tl, length, angle }) {
      if (tl) state.tail = [tl[0], tl[1]];
      if (length != null) state.length = length;
      if (angle != null) state.angle = angle;
      layout();
    },
    setLift(mm) {
      state.lift = mm;
      layout();
    },
    /** Put the name at a spot ({ k, side, off }, see spot()). */
    setLabelSpot(sp) {
      const c = state.spot;
      if (c.k === sp.k && c.side === sp.side && c.off === sp.off) return;
      state.spot = { ...sp };
      layout();
    },
    /** Where the label sits (or would sit at that spot), in paper coordinates, to keep it clear of others. */
    labelAt(sp = state.spot) {
      return spot(sp);
    },
    setSelected(on) {
      highlight.visible = on;
    },
    /** The highlighter's colour: green for a moment when the arrow matches another exactly, else yellow. */
    setMatch(on) {
      mark.color.set(on ? COLORS.match : COLORS.highlight);
    },
    setLabelVisible(on) {
      label.visible = on;
    },
    setVisible(on) {
      root.visible = on;
    },
    get visible() {
      return root.visible;
    },
    /** A point on the shaft (0 = tail, 1 = tip) in the scene, for the first-use pointer. */
    pointAt(k, out = new THREE.Vector3()) {
      const a = (state.angle * Math.PI) / 180;
      return toWorld(state.tail[0] + Math.cos(a) * state.length * k, state.tail[1] + Math.sin(a) * state.length * k, ARROW.thick, out);
    },
  };
}

// ── helpers drawn on the paper (not exported) ───────────────────────────────────

/** How far a ray from a paper point at angle th (radians) goes before it leaves the sheet, in squares. */
function reach(p, th) {
  const dx = Math.cos(th);
  const dy = Math.sin(th);
  let r = Infinity;
  if (dx > 1e-6) r = Math.min(r, (PAPER.w + EDGE - p[0]) / dx);
  if (dx < -1e-6) r = Math.min(r, (-EDGE - p[0]) / dx);
  if (dy > 1e-6) r = Math.min(r, (PAPER.h + EDGE - p[1]) / dy);
  if (dy < -1e-6) r = Math.min(r, (-EDGE - p[1]) / dy);
  return r;
}

/**
 * The দিক: a dashed line to পূর্ব from the tail, an arc from it round to the arrow, and the angle written inside
 * the arc. Arc and line shrink near the edge so they stay on the paper. `faint`: a smaller, lighter one, for the
 * other arrow of a lined-up pair.
 */
export function createAngleMark({ radius = 12.5, faint = false } = {}) {
  const root = new THREE.Group();
  root.name = 'AngleMark';
  root.userData.noExport = true;
  const mat = new THREE.MeshBasicMaterial({ color: COLORS.dir, toneMapped: false, transparent: true, opacity: faint ? 0.6 : 1, depthWrite: false });
  const dashes = [];
  for (let k = 0; k < 5; k++) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.8), mat);
    d.rotation.x = -Math.PI / 2;
    d.position.set(4 + k * 3.6, 0, 0);
    dashes.push(d);
    root.add(d);
  }
  let arc = null;
  let text = null;
  let drawn = '';
  let textAt = null;
  let R = radius;
  root.renderOrder = 3;
  function rebuild(angle, label) {
    drawn = `${angle}|${label}|${R}`;
    if (arc) {
      root.remove(arc);
      arc.geometry.dispose();
    }
    const span = Math.max(0.001, (angle * Math.PI) / 180);
    const w = faint ? 0.42 : 0.55;
    arc = new THREE.Mesh(new THREE.RingGeometry(R - w, R + w, Math.max(4, Math.ceil(angle / 6)), 1, 0, span), mat);
    arc.rotation.x = -Math.PI / 2;
    arc.renderOrder = 3;
    root.add(arc);
    if (text) {
      root.remove(text);
      text.geometry.dispose();
      text.material.dispose();
    }
    text = textMesh(label, faint ? 4.8 : 5.2, { color: COLORS.dir, weight: 700, opacity: faint ? 0.85 : 1 });
    text.rotation.x = -Math.PI / 2;
    root.add(text);
  }
  /** The angle goes where it has most room inside the arc (`room(p)`: free squares round a paper point). */
  function placeText(tail, angle, room) {
    const span = (angle * Math.PI) / 180;
    const spots = angle > 0 ? [0.5, 0.35, 0.65, 0.22, 0.78].map((f, i) => [span * f, i * 0.06]) : [[0.32, 0]];
    let best = null;
    for (const out of [6.5, 10.5])
      for (const [a, pref] of spots) {
        const r = (R + out) / UNIT;
        const p = [tail[0] + Math.cos(a) * r, tail[1] + Math.sin(a) * r];
        const score = (room ? room(p) : 1) - pref - (out > 7 ? 0.15 : 0);
        if (!best || score > best.score) best = { score, a, out };
      }
    const d = R + best.out;
    text.position.set(Math.cos(best.a) * d, 0.1, -Math.sin(best.a) * d);
    textAt = [tail[0] + (Math.cos(best.a) * d) / UNIT, tail[1] + (Math.sin(best.a) * d) / UNIT];
  }
  return {
    root,
    set(tail, angle, label, room) {
      toWorld(tail[0], tail[1], faint ? 0.2 : 0.25, root.position);
      // stay on the paper: the arc no further out than the sheet allows in any direction it sweeps
      let free = Infinity;
      for (let th = 0; th <= angle + 1e-6; th += 15) free = Math.min(free, reach(tail, (th * Math.PI) / 180));
      R = Math.round(THREE.MathUtils.clamp((free - 0.35) * UNIT, radius * 0.5, radius) * 2) / 2;
      const line = THREE.MathUtils.clamp((reach(tail, 0) - 0.2) * UNIT, 6, 20.6);
      dashes.forEach((d, k) => (d.visible = 4 + k * 3.6 + 1.1 <= line));
      if (drawn !== `${angle}|${label}|${R}`) rebuild(angle, label);
      placeText(tail, angle, room);
    },
    setVisible(on) {
      root.visible = on;
    },
    get visible() {
      return root.visible;
    },
    /** Where the angle is written, in paper coordinates (null when hidden): names keep clear of it. */
    textAt: () => (root.visible ? textAt : null),
  };
}

/** Where a lined-up arrow came from: a faint copy at its old place and a dotted path to the new one. */
export function createGhost() {
  const P = sharedParts();
  const root = new THREE.Group();
  root.name = 'Ghost';
  root.userData.noExport = true;
  const piece = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: COLORS.arrow, transparent: true, opacity: 0.2, depthWrite: false });
  const shaft = new THREE.Mesh(P.shaft, mat);
  const head = new THREE.Mesh(P.head, mat);
  const tail = new THREE.Mesh(P.tail, mat);
  piece.add(shaft, head, tail);
  const dots = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.75, 10).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: COLORS.arrow, transparent: true, opacity: 0.45, depthWrite: false }),
    40,
  );
  root.add(piece, dots);
  root.visible = false;
  for (const m of [shaft, head, tail, dots]) m.renderOrder = 1;
  const m4 = new THREE.Matrix4();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    root,
    /** from: { tail, length, angle } where it was; to: [x, y] the tail it slid to; null hides it. */
    show(from, to) {
      root.visible = Boolean(from);
      if (!from) return;
      const L = from.length * UNIT;
      toWorld(from.tail[0], from.tail[1], 0, piece.position);
      piece.rotation.y = (from.angle * Math.PI) / 180;
      shaft.scale.x = Math.max(0.5, L - ARROW.headL + 0.6);
      head.position.x = L - ARROW.headL;
      toWorld(from.tail[0], from.tail[1], 0.15, a);
      toWorld(to[0], to[1], 0.15, b);
      // the dots stop short of the new tail, leaving room there for the দিক arcs and their angles
      const len = a.distanceTo(b) || 1;
      const n = Math.min(40, Math.max(0, Math.floor((len - 2.2 * UNIT) / 3.2)));
      for (let k = 1; k <= n; k++) {
        const f = (3.2 * k) / len;
        m4.makeTranslation(a.x + (b.x - a.x) * f, a.y, a.z + (b.z - a.z) * f);
        dots.setMatrixAt(k - 1, m4);
      }
      dots.count = n;
      dots.instanceMatrix.needsUpdate = true;
    },
  };
}

/** Every place the head of an arrow with this মান could be: a ring of dots round the tail. */
export function createRing() {
  const dots = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.85, 12).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: COLORS.mag, toneMapped: false, transparent: true, opacity: 0.85, depthWrite: false }),
    60,
  );
  dots.name = 'SameMagnitudeRing';
  dots.userData.noExport = true;
  dots.renderOrder = 2;
  const m4 = new THREE.Matrix4();
  const v = new THREE.Vector3();
  return {
    root: dots,
    set(tail, length) {
      const c = toWorld(tail[0], tail[1], 0.2, v);
      const n = Math.min(60, Math.max(16, Math.round(length * 9)));
      let shown = 0;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const x = tail[0] + Math.cos(a) * length;
        const y = tail[1] + Math.sin(a) * length;
        if (x < -EDGE || y < -EDGE || x > PAPER.w + EDGE || y > PAPER.h + EDGE) continue; // only on the paper
        m4.makeTranslation(c.x + Math.cos(a) * length * UNIT, c.y, c.z - Math.sin(a) * length * UNIT);
        dots.setMatrixAt(shown++, m4);
      }
      dots.count = shown;
      dots.instanceMatrix.needsUpdate = true;
    },
    setVisible(on) {
      dots.visible = on;
    },
  };
}

/** A soft circle at a tail where a carried arrow will sit if it is let go. */
export function createDockMark() {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(4.2, 5.6, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: COLORS.ink, toneMapped: false, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  ring.name = 'DockMark';
  ring.userData.noExport = true;
  ring.visible = false;
  ring.renderOrder = 2;
  return {
    root: ring,
    show(tail) {
      if (!tail) {
        ring.visible = false;
        return;
      }
      toWorld(tail[0], tail[1], 0.15, ring.position);
      ring.visible = true;
    },
  };
}

/** A small house (home) and a school flag (Bangladesh's), for the "where is the school?" question. */
export function createPlaces() {
  const root = new THREE.Group();
  root.name = 'Places';
  root.userData.noExport = true;
  const house = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 8), new THREE.MeshStandardMaterial({ color: 0xf3e6c9, roughness: 0.8 }));
  walls.position.y = 3;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-5.4, 0);
  roofShape.lineTo(0, 4.4);
  roofShape.lineTo(5.4, 0);
  roofShape.closePath();
  // the ridge runs east–west, so the slope facing the student is lit and the other one is in shade
  const roof = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roofShape, { depth: 11.4, bevelEnabled: false }).translate(0, 0, -5.7),
    new THREE.MeshStandardMaterial({ color: 0xb5482c, roughness: 0.7 }),
  );
  roof.position.y = 6;
  roof.rotation.y = Math.PI / 2;
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.8 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9cc3e6, roughness: 0.3 });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.6), wood);
  door.position.set(0, 1.8, 4.01);
  const win1 = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.8), glass);
  win1.position.set(-3, 3.4, 4.01);
  const win2 = win1.clone();
  win2.position.x = 3;
  house.add(walls, roof, door, win1, win2);
  for (const m of [walls, roof]) m.castShadow = true;

  // the flag stands exactly on the school's place; its cloth leans back a little so it reads from above
  const flag = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 16, 10),
    new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.6, roughness: 0.4 }),
  );
  pole.position.y = 8;
  const banner = new THREE.Group();
  banner.position.set(0, 13, 0);
  banner.rotation.x = -0.75;
  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 6),
    new THREE.MeshStandardMaterial({ color: 0x006a4e, side: THREE.DoubleSide, roughness: 0.8 }),
  );
  cloth.position.set(5.4, 0, 0);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.9, 24), new THREE.MeshStandardMaterial({ color: 0xf42a41, side: THREE.DoubleSide }));
  disc.position.set(4.9, 0, 0.03);
  banner.add(cloth, disc);
  flag.add(pole, banner);
  pole.castShadow = true;
  cloth.castShadow = true;
  root.add(house, flag);
  return {
    root,
    house,
    flag,
    setHouse(at) {
      house.visible = Boolean(at);
      if (at) toWorld(at[0], at[1], 0, house.position);
    },
    setFlag(at) {
      flag.visible = Boolean(at);
      if (at) toWorld(at[0], at[1], 0, flag.position);
    },
  };
}

/** The printed scale of the thermometer: 35–42 °C, a long mark every degree and a short one every half. */
function scaleTexture(num) {
  const c = canvas(560, 72);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 560, 72);
  ctx.strokeStyle = '#1d2733';
  ctx.fillStyle = '#1d2733';
  ctx.lineWidth = 3;
  ctx.font = `700 30px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (let k = 0; k <= 14; k++) {
    const x = 20 + (k / 14) * 520;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, k % 2 ? 14 : 24);
    ctx.stroke();
    if (k % 2 === 0) ctx.fillText(num(35 + k / 2), x, 62);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * A clinical thermometer lying on the paper, reading 37° C. It can be moved and turned like the arrows, but
 * nothing about it changes: a temperature has a মান and no দিক. set({ at, angle }) in paper coordinates
 * (its middle) and degrees; its reading is also written beside it, upright.
 */
export function createThermometer({ num, label }) {
  const P = sharedParts();
  const root = new THREE.Group();
  root.name = 'Thermometer';
  const piece = new THREE.Group(); // at the middle, turned; x runs from the bulb to the cap
  root.add(piece);
  const glass = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: 0xf4f8fb,
    roughness: 0.1,
    metalness: 0,
    clearcoat: 1,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 30, 24, 1, true).rotateZ(Math.PI / 2).translate(1.5, 2.3, 0), glass);
  tube.name = 'Glass';
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(2.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2).translate(16.5, 2.3, 0),
    glass,
  );
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(27, 3.4), new THREE.MeshBasicMaterial({ map: scaleTexture(num), toneMapped: false }));
  strip.name = 'Scale';
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(1.5, 1.1, 0);
  // the red liquid: 35° is at x = -11, 42° at x = 14 (the scale's ends), so 37° at -11 + 25 × 2/7
  const red = new THREE.MeshStandardMaterial({ name: 'Liquid', color: 0xd9342b, roughness: 0.35 });
  const top = -11 + (25 * (TEMPERATURE - 35)) / 7;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, top + 13.6, 12).rotateZ(Math.PI / 2), red);
  column.position.set((top - 13.6) / 2, 2.3, 0);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(2.8, 24, 16), red);
  bulb.name = 'Bulb';
  bulb.position.set(-15.6, 2.8, 0);
  const mark = P.highlight.clone();
  const hl = new THREE.Group();
  const s1 = new THREE.Mesh(P.strip, mark);
  s1.scale.x = 38;
  s1.position.x = -19;
  const e1 = new THREE.Mesh(P.end, mark);
  e1.position.x = -19;
  const e2 = new THREE.Mesh(P.end, mark);
  e2.rotation.y = Math.PI;
  e2.position.x = 19;
  hl.add(s1, e1, e2);
  hl.position.y = 0.06;
  hl.visible = false;
  hl.userData.noExport = true;
  const hit = new THREE.Mesh(new THREE.BoxGeometry(40, 9, 11), P.hitMat);
  hit.position.y = 3;
  hit.userData = { thermo: true, noExport: true };
  piece.add(hl, strip, column, bulb, tube, cap, hit);
  for (const m of [bulb, column]) m.castShadow = true;
  const text = textMesh(label, 5.2, { color: COLORS.ink, weight: 700 });
  text.name = 'Reading';
  text.rotation.x = -Math.PI / 2;
  root.add(text);

  const state = { at: [0, 0], angle: 0, lift: 0, side: 1 };
  const v = new THREE.Vector3();
  function spot(side) {
    const a = (state.angle * Math.PI) / 180;
    return [state.at[0] - Math.sin(a) * 0.95 * side, state.at[1] + Math.cos(a) * 0.95 * side];
  }
  function layout() {
    toWorld(state.at[0], state.at[1], state.lift, piece.position);
    piece.rotation.y = (state.angle * Math.PI) / 180;
    const p = spot(state.side);
    toWorld(p[0], p[1], state.lift + 0.3, v);
    text.position.copy(v);
  }
  return {
    root,
    hits: [hit],
    get state() {
      return state;
    },
    set({ at, angle, lift }) {
      if (at) state.at = [at[0], at[1]];
      if (angle != null) state.angle = angle;
      if (lift != null) state.lift = lift;
      layout();
    },
    labelAt: (side = state.side) => spot(side),
    setLabelSide(side) {
      if (state.side === side) return;
      state.side = side;
      layout();
    },
    setSelected(on) {
      hl.visible = on;
    },
    setVisible(on) {
      root.visible = on;
    },
    get visible() {
      return root.visible;
    },
    /** The middle of the glass in the scene, for pointers. */
    point: (out = new THREE.Vector3()) => toWorld(state.at[0], state.at[1], 4, out),
  };
}
