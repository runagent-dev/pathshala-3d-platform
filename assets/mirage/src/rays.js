// The light, drawn over the 3D view like the book's line drawing (the style of the chapter 8 and 9 ray figures): the
// exact points of optics.js, in the vertical plane through the tree and the eye (z = 0), projected through the camera
// onto a 2D canvas: even amber lines with a thin dark edge and small chevrons; the eye's line carried on below the
// ground dashed; the normals dashed slate in a white halo; the angles as arcs, the angle of incidence blue and the
// angle of refraction green. Nothing here is a 3D object, so lines stay crisp at any size and cost no draw calls.
import * as THREE from 'three';
import { EYE_R } from './eye.js';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  normal: '#495057',
  i: '#1971c2',
  r: '#2b8a3e',
  halo: 'rgba(255, 255, 255, 0.92)',
  sand: '#7a5a2e',
};
const NORMAL_H = 0.2; // half the length of a normal (scene units)

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'mg-draw';
  host.appendChild(canvas);
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  let dpr = 1;
  let w = 1;
  let h = 1;
  function size() {
    w = stage.width;
    h = stage.height;
    dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  size();

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  /** A point of the ray's plane on the canvas; out.ok is false behind the camera. */
  function P(x, y, out = { x: 0, y: 0, ok: true }) {
    pv.set(x, y, 0).project(camera);
    out.x = ((pv.x + 1) / 2) * w;
    out.y = ((1 - pv.y) / 2) * h;
    out.ok = pv.z < 1 && pv.z > -1;
    return out;
  }

  // ── what is drawn; the figure fills it in ─────────────────────────────────────────────────────────────────
  const v = {
    direct: null, // [{x,y},{x,y}] the straight ray, or null
    directK: 0, // how much of it is drawn, 0…1
    directA: 1, // its strength (it steps back once the bent ray is told)
    path: null, // the bent ray's points (optics.trace)
    pieces: 0, // how many pieces of the bent ray are drawn (2.5: two and a half)
    ext: 0, // the eye's line carried on below the ground, 0…1
    image: null, // { x, y } where the eye's line ends (the image of the top)
    normals: 0, // 0…1: the normals at the first two bends
    arcs: 0, // 0…1: the angles there
    sandEnd: false, // the ray ends in the sand (no mirage)
  };

  const A = { x: 0, y: 0, ok: true };
  const B = { x: 0, y: 0, ok: true };
  /** Points on the drawn ray, to keep labels off it (canvas px; reused). */
  const marks = [];

  function line(x0, y0, x1, y1) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  }
  /** The swept-back arrowhead of the sister figures, at x, y, along (dx, dy). */
  function chevron(x, y, dx, dy, length = 12, alpha = 1) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = length * 0.6;
    const b = length * 0.4;
    const c = length * 0.42;
    const n = length * 0.12;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x + ux * a, y + uy * a);
    ctx.lineTo(x - ux * b - uy * c, y - uy * b + ux * c);
    ctx.lineTo(x - ux * n, y - uy * n);
    ctx.lineTo(x - ux * b + uy * c, y - uy * b - ux * c);
    ctx.closePath();
    ctx.fillStyle = C.ray;
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /** One straight piece from a to b (scene points), drawn as far as k, with a chevron half way. */
  function piece(a, b, k, { width = 2.6, alpha = 1, arrow = true, trimEnd = 0 } = {}) {
    if (k <= 0) return;
    P(a.x, a.y, A);
    P(b.x, b.y, B);
    if (!A.ok || !B.ok) return;
    let dx = B.x - A.x;
    let dy = B.y - A.y;
    if (trimEnd > 0 && k >= 1) {
      const l = Math.hypot(dx, dy) || 1;
      const keep = Math.max(0, l - trimEnd) / l;
      dx *= keep;
      dy *= keep;
    }
    const x1 = A.x + dx * k;
    const y1 = A.y + dy * k;
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    line(A.x, A.y, x1, y1);
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = width + 1.6;
    ctx.stroke();
    line(A.x, A.y, x1, y1);
    ctx.strokeStyle = C.ray;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalAlpha = 1;
    const len = Math.hypot(dx, dy);
    if (arrow && k >= 0.55 && len > 46) chevron(A.x + dx * 0.5, A.y + dy * 0.5, dx, dy, 12, alpha);
    for (let s = 0; s <= k; s += Math.max(0.05, 24 / Math.max(1, len))) marks.push(A.x + dx * s, A.y + dy * s);
    if (k < 1) {
      // the front of the light as it travels
      ctx.beginPath();
      ctx.arc(x1, y1, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff4c2';
      ctx.fill();
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  /** Dashed, from a to b (scene points) as far as k: where the light only seems to come from. */
  function dashed(a, b, k, color = C.ray, width = 2.2) {
    if (k <= 0) return;
    P(a.x, a.y, A);
    P(b.x, b.y, B);
    if (!A.ok || !B.ok) return;
    const x1 = A.x + (B.x - A.x) * k;
    const y1 = A.y + (B.y - A.y) * k;
    ctx.lineCap = 'butt';
    ctx.setLineDash([7, 6]);
    line(A.x, A.y, x1, y1);
    ctx.strokeStyle = color === C.ray ? C.edge : C.halo;
    ctx.lineWidth = width + 2;
    ctx.stroke();
    line(A.x, A.y, x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.setLineDash([]);
    const len = Math.hypot(x1 - A.x, y1 - A.y);
    for (let s = 0; s <= 1; s += Math.max(0.05, 24 / Math.max(1, len))) marks.push(A.x + (x1 - A.x) * s, A.y + (y1 - A.y) * s);
  }
  /** The screen angle (radians, canvas y down) from point p toward q (scene points). */
  function screenAngle(p, q) {
    P(p.x, p.y, A);
    P(q.x, q.y, B);
    return Math.atan2(B.y - A.y, B.x - A.x);
  }
  /** An arc at p between the directions to q1 and q2 (the short way), radius r px, with a letter outside it. */
  function arc(p, q1, q2, r, color, letter, alpha) {
    const a1 = screenAngle(p, q1);
    const a2 = screenAngle(p, q2);
    let d = a2 - a1;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    P(p.x, p.y, A);
    const cx = A.x;
    const cy = A.y;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a1, a1 + d, d < 0);
    ctx.strokeStyle = C.halo;
    ctx.lineWidth = 5.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, a1, a1 + d, d < 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    if (letter) {
      const m = a1 + d / 2;
      const lx = cx + Math.cos(m) * (r + 11);
      const ly = cy + Math.sin(m) * (r + 11);
      ctx.font = 'italic 700 16px "Noto Sans Bengali", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(letter, lx, ly);
      ctx.fillStyle = color;
      ctx.fillText(letter, lx, ly);
      marks.push(lx, ly);
    }
    ctx.globalAlpha = 1;
  }
  const T1 = { x: 0, y: 0 };
  const T2 = { x: 0, y: 0 };
  const T3 = { x: 0, y: 0 };
  function normalAt(p, k) {
    T1.x = p.x;
    T1.y = p.y + NORMAL_H * k;
    T2.x = p.x;
    T2.y = Math.max(0.004, p.y - NORMAL_H * k);
    dashed(p, T1, 1, C.normal, 1.8);
    dashed(p, T2, 1, C.normal, 1.8);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    marks.length = 0;
    // the straight ray (seen directly)
    if (v.direct && v.directK > 0 && v.directA > 0.02)
      piece(v.direct[0], v.direct[1], v.directK, { alpha: v.directA, trimEnd: EYE_R * pxPerUnit(v.direct[1]) });
    const path = v.path;
    if (path && v.pieces > 0) {
      const n = path.length - 1;
      // normals and angles at the first two bends (under the ray)
      if (v.normals > 0 && n >= 2) {
        normalAt(path[1], v.normals);
        normalAt(path[2], v.normals);
      }
      if (v.arcs > 0 && n >= 2) {
        T1.x = path[1].x;
        T1.y = path[1].y + 1;
        T2.x = path[1].x;
        T2.y = path[1].y - 1;
        T3.x = path[2].x;
        T3.y = path[2].y + 1;
        arc(path[1], T1, path[0], 30, C.i, 'i', v.arcs);
        arc(path[1], T2, path[2], 36, C.r, 'r', v.arcs);
        arc(path[2], T3, path[1], 30, C.i, 'i', v.arcs);
      }
      for (let k = 0; k < n; k++) {
        const f = Math.min(1, Math.max(0, v.pieces - k));
        const last = k === n - 1 && !v.sandEnd;
        piece(path[k], path[k + 1], f, { trimEnd: last ? EYE_R * pxPerUnit(path[k + 1]) : 0 });
      }
      // a ray that ends in the sand: a dull mark where it stops
      if (v.sandEnd && v.pieces >= n) {
        P(path[n].x, path[n].y, A);
        ctx.beginPath();
        ctx.arc(A.x, A.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = C.sand;
        ctx.fill();
        ctx.strokeStyle = '#fff4c2';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      // the eye's line, carried on straight below the ground to where the image of the top seems to be
      if (v.ext > 0 && v.image && !v.sandEnd) {
        const eye = path[n];
        dashed(eye, v.image, v.ext);
        if (v.ext >= 1) {
          P(v.image.x, v.image.y, A);
          ctx.beginPath();
          ctx.arc(A.x, A.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = C.ray;
          ctx.fill();
          ctx.strokeStyle = C.edge;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }
  }
  /** Canvas pixels per scene unit near a point (to trim a ray at the eyeball's surface). */
  function pxPerUnit(p) {
    P(p.x, p.y, A);
    P(p.x, p.y + 1, B);
    return Math.hypot(B.x - A.x, B.y - A.y);
  }
  /** Small boxes along everything drawn, for the labels to keep off. */
  const boxList = [];
  function boxes() {
    boxList.length = 0;
    for (let k = 0; k + 1 < marks.length; k += 2) {
      const x = marks[k];
      const y = marks[k + 1];
      boxList.push({ left: x - 5, top: y - 5, right: x + 5, bottom: y + 5 });
    }
    return boxList;
  }
  /** A scene point of the ray's plane on the canvas (for labels and the action's ring). */
  const screen = (x, y) => {
    const o = { x: 0, y: 0, ok: true };
    return P(x, y, o);
  };
  return { v, draw, size, boxes, screen, canvas };
}
