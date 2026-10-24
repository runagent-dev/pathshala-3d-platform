// The 3D pieces of the figure, procedural three.js in millimetres: a sheet of graph paper (1 cm squares, a compass
// rose in one corner) on a wooden drawing board, arrow pieces lying on it like cut-outs (a shaft with a light mark
// at every unit, so the মান can be counted, and a round tail), and the helpers drawn on the paper: the দিক arc, the
// ring of every place a head of the same মান could be, a house and a flag for the "where is the school?" question.
// Paper coordinates are squares from the grid's bottom-left corner, x to পূর্ব (east), y to উত্তর (north).
import * as THREE from 'three';
import { FONT, textMesh } from '@shared/student/materials.js';
import { PAPER, ROSE } from './reading.js';

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
  const strip = new THREE.Mesh(P.strip, P.highlight);
  const endA = new THREE.Mesh(P.end, P.highlight);
  const endB = new THREE.Mesh(P.end, P.highlight);
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
  const state = { tail: [0, 0], length: 1, angle: 0, lift: 0, side: 1, shape: '' };
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
      hitHead.scale.setScalar(8.5);
      hitHead.position.set(L - ARROW.headL * 0.45, 3, 0);
    }
    // the name beside the middle of the arrow, upright on the paper
    const at = spot(state.side);
    toWorld(at[0], at[1], lift + 0.3, v);
    label.position.copy(v);
  }
  /** Where the name goes on one side of the arrow (1: left of it, -1: right), in paper coordinates. */
  function spot(side) {
    const { tail: tl, length, angle } = state;
    const a = (angle * Math.PI) / 180;
    const mid = [tl[0] + (Math.cos(a) * length) / 2, tl[1] + (Math.sin(a) * length) / 2];
    const off = 1.05 * side;
    return [mid[0] - Math.sin(a) * off, mid[1] + Math.cos(a) * off];
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
    setLabelSide(side) {
      if (state.side === side) return;
      state.side = side;
      layout();
    },
    /** Where the label sits (or would sit on that side), in paper coordinates, to keep it clear of others. */
    labelAt(side = state.side) {
      return spot(side);
    },
    setSelected(on) {
      highlight.visible = on;
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

/** The দিক: a dashed line to পূর্ব from the tail, an arc from it to the arrow, and the angle. */
export function createAngleMark() {
  const root = new THREE.Group();
  root.name = 'AngleMark';
  root.userData.noExport = true;
  const mat = new THREE.MeshBasicMaterial({ color: COLORS.dir, toneMapped: false, transparent: true, depthWrite: false });
  const dashes = new THREE.Group();
  for (let k = 0; k < 5; k++) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.8), mat);
    d.rotation.x = -Math.PI / 2;
    d.position.set(4 + k * 3.6, 0, 0);
    dashes.add(d);
  }
  let arc = null;
  let text = null;
  let drawn = '';
  let textAt = null;
  const R = 12.5;
  root.add(dashes);
  root.renderOrder = 3;
  function rebuild(angle, label) {
    drawn = `${angle}|${label}`;
    if (arc) {
      root.remove(arc);
      arc.geometry.dispose();
    }
    const span = Math.max(0.001, (angle * Math.PI) / 180);
    arc = new THREE.Mesh(new THREE.RingGeometry(R - 0.55, R + 0.55, Math.max(4, Math.ceil(angle / 6)), 1, 0, span), mat);
    arc.rotation.x = -Math.PI / 2;
    arc.renderOrder = 3;
    root.add(arc);
    if (text) {
      root.remove(text);
      text.geometry.dispose();
      text.material.dispose();
    }
    text = textMesh(label, 5.2, { color: COLORS.dir, weight: 700 });
    text.rotation.x = -Math.PI / 2;
    root.add(text);
  }
  /** The angle goes where it has most room near the arc (`room(p)`: free squares round a paper point). */
  function placeText(tail, angle, room) {
    const span = (angle * Math.PI) / 180;
    const r = (R + 7) / UNIT;
    let best = null;
    for (const [a, pref] of [
      [span * 0.5, 0],
      [span * 0.35, 0.1],
      [span * 0.65, 0.1],
      [span * 0.2, 0.2],
      [span * 0.8, 0.2],
      [-0.4, 0.3],
    ]) {
      const p = [tail[0] + Math.cos(a) * r, tail[1] + Math.sin(a) * r];
      const score = (room ? room(p) : 1) - pref;
      if (!best || score > best.score) best = { score, a };
    }
    text.position.set(Math.cos(best.a) * (R + 7), 0.1, -Math.sin(best.a) * (R + 7));
    textAt = [tail[0] + (Math.cos(best.a) * (R + 7)) / UNIT, tail[1] + (Math.sin(best.a) * (R + 7)) / UNIT];
  }
  return {
    root,
    set(tail, angle, label, room) {
      toWorld(tail[0], tail[1], 0.25, root.position);
      if (drawn !== `${angle}|${label}`) rebuild(angle, label);
      placeText(tail, angle, room);
    },
    setVisible(on) {
      root.visible = on;
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
      const n = Math.min(40, Math.floor(a.distanceTo(b) / 3.2));
      for (let k = 1; k < n; k++) {
        m4.makeTranslation(a.x + ((b.x - a.x) * k) / n, a.y, a.z + ((b.z - a.z) * k) / n);
        dots.setMatrixAt(k - 1, m4);
      }
      dots.count = Math.max(0, n - 1);
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
  const walls = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 6), new THREE.MeshStandardMaterial({ color: 0xf1e3c8, roughness: 0.8 }));
  walls.position.y = 2.5;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-4.6, 0);
  roofShape.lineTo(0, 3.6);
  roofShape.lineTo(4.6, 0);
  roofShape.closePath();
  const roof = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roofShape, { depth: 7, bevelEnabled: false }).translate(0, 0, -3.5),
    new THREE.MeshStandardMaterial({ color: 0xb5482c, roughness: 0.7 }),
  );
  roof.position.y = 5;
  roof.rotation.y = Math.PI / 2;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.8), new THREE.MeshStandardMaterial({ color: 0x6b4a2b }));
  door.position.set(0, 1.4, 3.01);
  house.add(walls, roof, door);
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
