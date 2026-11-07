// The light, drawn over the 3D view on a 2D canvas from exact 3D points projected through the camera (the chapter's ray
// style: even lines of a constant width with a thin dark edge and small filled chevrons, at any size). Nothing here is a
// 3D object. In the big drop: the white ray, its colours inside, the reflection at the back and the colours going out
// (traced in reading.js). In the sky: sunlight past the eye and on to the point opposite the sun (dashed), the parallel
// sunlight that reaches two drops of the bow and the red and violet light they send to the eye, the angles at the eye,
// and the sun's height.
import * as THREE from 'three';
import { ANGLE, DROP_PATHS, THETA_RED, THETA_VIOLET, toRad } from './reading.js';
import { ARC, ARC_R, along, EYE, keyDrop, SUN_D, sunPoint, upOf } from './sky.js';

export const C = {
  white: '#fffdf2',
  edge: '#1d2430',
  red: DROP_PATHS[0].css,
  violet: DROP_PATHS[DROP_PATHS.length - 1].css,
  axis: '#e9eef5',
  normal: '#495057',
  sun: '#f59f00',
  quiz: '#f1f3f5',
};
const LIN = 1.5; // the white ray before the drop, in drop radii
const LOUT = 1.45; // the colours after it
const FAN = 8; // how much wider the colours leaving one drop of the sky are drawn

export function createRays({ stage, host, drop }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'rb-draw';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let w = 1;
  let h = 1;
  function size() {
    w = stage.width;
    h = stage.height;
    dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  size();
  stage.onResize(size);

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  /** A world point on the canvas: { x, y, ok } (ok: in front of the camera). */
  const S = (p, out) => {
    pv.copy(p).project(camera);
    out.x = ((pv.x + 1) / 2) * w;
    out.y = ((1 - pv.y) / 2) * h;
    out.ok = pv.z < 1;
    return out;
  };
  const lp = new THREE.Vector3();
  /** A point of the drop's cut face (its own frame) on the canvas. */
  const D = (x, y, out) => {
    lp.set(x, y, 0).applyMatrix4(drop.root.matrixWorld);
    return S(lp, out);
  };

  // ── what is shown; the figure fills this in ──────────────────────────────────────────────────────────────────
  const v = {
    drop: 0, // the drop's light, as a whole (fades as the camera pulls back)
    inK: 0, // the white ray in, then its colours to the back of the drop
    outK: 0, // the reflection at the back, then the colours out
    sun: 15, // the sun's height (degrees)
    beam: 0, // the parallel sunlight: a bundle from the sun's side, one ray past the eye
    axis: 0, // on past the eye (dashed) to the point opposite the sun, the bow's centre
    lines: 0, // the sunlight to two drops of the bow (red one, violet one), their colours, and the one the eye catches
    arcs: 0, // the angles at the eye
    sunArc: 0, // the sun's height, at the eye
    plain: false, // the test: the light from the two drops drawn white (the question is which colour)
  };

  // ── drawing ──────────────────────────────────────────────────────────────────────────────────────────────────
  const A = { x: 0, y: 0, ok: true };
  const B = { x: 0, y: 0, ok: true };
  let edged = true; // a dark edge round each line (off for the colours packed close inside the drop)
  function stroke(pts, n, color, width, alpha = 1, dash = null) {
    if (n < 2) return;
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash || []);
    ctx.lineCap = dash ? 'butt' : 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i * 2], pts[i * 2 + 1]);
    if (!dash && edged) {
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = width + 2;
      ctx.stroke();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  const buf = new Float32Array(2 * 64);
  /** A straight piece from a to b (canvas points), as far as k of it. */
  function seg(a, b, k, color, width, alpha = 1, dash = null) {
    if (k <= 0 || !a.ok || !b.ok) return;
    buf[0] = a.x;
    buf[1] = a.y;
    buf[2] = a.x + (b.x - a.x) * Math.min(1, k);
    buf[3] = a.y + (b.y - a.y) * Math.min(1, k);
    stroke(buf, 2, color, width, alpha, dash);
  }
  /** A straight piece that fades in from nothing at a (light from far away). */
  function fadeSeg(a, b, color, width, alpha = 1) {
    if (!a.ok || !b.ok) return;
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, 'rgba(255,253,242,0)');
    g.addColorStop(0.45, color);
    g.addColorStop(1, color);
    const ge = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    ge.addColorStop(0, 'rgba(29,36,48,0)');
    ge.addColorStop(0.45, C.edge);
    ge.addColorStop(1, C.edge);
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = ge;
    ctx.lineWidth = width + 2;
    ctx.stroke();
    ctx.strokeStyle = g;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /** The chapter's swept-back arrowhead at (x, y), pointing along (dx, dy). */
  function chevron(x, y, dx, dy, color, length = 11, alpha = 1) {
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
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const chevAt = (a, b, at, color, length, alpha) => {
    if (!a.ok || !b.ok) return;
    chevron(a.x + (b.x - a.x) * at, a.y + (b.y - a.y) * at, b.x - a.x, b.y - a.y, color, length, alpha);
  };

  // ── the big drop ─────────────────────────────────────────────────────────────────────────────────────────────
  const P = [{}, {}, {}, {}, {}].map(() => ({ x: 0, y: 0, ok: true }));
  const NORMAL = [6, 5];
  /** The normal (লম্ব) at the point where the light goes in: dashed slate on a pale underlay, so it reads on blue and on water. */
  function normalAt(p, alpha) {
    D(p.x * 1.55, p.y * 1.55, P[0]);
    D(p.x * 0.45, p.y * 0.45, P[1]);
    seg(P[0], P[1], 1, 'rgba(255,255,255,0.85)', 3.2, alpha, NORMAL);
    seg(P[0], P[1], 1, C.normal, 1.7, alpha, NORMAL);
  }
  function dropLight() {
    const alpha = v.drop;
    if (alpha <= 0.01) return;
    const first = DROP_PATHS[0];
    // the white ray, in
    const kIn = Math.min(1, v.inK * 2);
    const kInside = Math.max(0, v.inK * 2 - 1);
    if (kIn > 0.6) normalAt(first.p1, alpha * Math.min(1, (kIn - 0.6) * 3));
    D(first.p1.x - LIN, first.p1.y, P[0]);
    D(first.p1.x, first.p1.y, P[1]);
    seg(P[0], P[1], kIn, C.white, 3.4, alpha);
    if (kIn > 0.5) chevAt(P[0], P[1], 0.42, C.white, 13, alpha);
    // where it would have gone, unbent: faint and dashed, so the bending shows
    if (kInside > 0) {
      D(first.p1.x + 0.95 * kInside, first.p1.y, P[2]);
      seg(P[1], P[2], 1, C.white, 1.4, alpha * 0.55, [4, 4]);
    }
    // its colours inside, to the back; then back to the front and out
    const kBack = Math.min(1, v.outK * 2.2);
    const kOut = Math.max(0, (v.outK * 2.2 - 1) / 1.2);
    // the part that goes on out of the back (faint: the reflection at the back is only partial)
    if (kBack > 0)
      for (const p of [DROP_PATHS[0], DROP_PATHS[DROP_PATHS.length - 1]]) {
        D(p.p2.x, p.p2.y, P[0]);
        D(p.p2.x + p.out.x * 0.75, p.p2.y + p.out.y * 0.75, P[1]);
        seg(P[0], P[1], kBack, p.css, 1.6, alpha * 0.4);
      }
    // inside the drop the colours lie close together: drawn as a filled band, red to violet, edged by the outer two
    const r0 = DROP_PATHS[0];
    const r6 = DROP_PATHS[DROP_PATHS.length - 1];
    if (kInside > 0) wedge([r0.p1, r0.p2, r6.p2], kInside, alpha);
    if (kBack > 0) wedge([r0.p2, r0.p3, r6.p3, r6.p2], kBack, alpha);
    for (let i = DROP_PATHS.length - 1; i >= 0; i--) {
      const p = DROP_PATHS[i];
      D(p.p1.x, p.p1.y, P[0]);
      D(p.p2.x, p.p2.y, P[1]);
      D(p.p3.x, p.p3.y, P[2]);
      D(p.p3.x + p.d3.x * LOUT, p.p3.y + p.d3.y * LOUT, P[3]);
      if (i === 0 || i === DROP_PATHS.length - 1) {
        edged = false;
        seg(P[0], P[1], kInside, p.css, 1.6, alpha);
        seg(P[1], P[2], kBack, p.css, 1.6, alpha);
        edged = true;
      }
      seg(P[2], P[3], kOut, p.css, 2.4, alpha);
      if (kOut > 0.75 && (i === 0 || i === DROP_PATHS.length - 1)) chevAt(P[2], P[3], 0.62, p.css, 12, alpha);
    }
  }
  const W = [{}, {}, {}, {}].map(() => ({ x: 0, y: 0, ok: true }));
  /**
   * A band of colour through the drop: the points of the red path (first) and the violet path (last); the far side
   * grows with k. Painted with a spectrum across it, from the red edge to the violet edge.
   */
  function wedge(points, k, alpha) {
    const n = points.length;
    const red = points[1];
    const vio = points[n - 1];
    const start = n === 3 ? points[0] : null;
    if (start) {
      D(start.x, start.y, W[0]);
      D(start.x + (red.x - start.x) * k, start.y + (red.y - start.y) * k, W[1]);
      D(start.x + (vio.x - start.x) * k, start.y + (vio.y - start.y) * k, W[2]);
    } else {
      const r0 = points[0];
      const v0 = points[3];
      const r1 = points[1];
      const v1 = points[2];
      D(r0.x, r0.y, W[0]);
      D(r0.x + (r1.x - r0.x) * k, r0.y + (r1.y - r0.y) * k, W[1]);
      D(v0.x + (v1.x - v0.x) * k, v0.y + (v1.y - v0.y) * k, W[2]);
      D(v0.x, v0.y, W[3]);
    }
    const m = start ? 3 : 4;
    // across the band: from its red edge to its violet edge, at the far end
    const ax = W[1].x;
    const ay = W[1].y;
    const bx = W[2].x;
    const by = W[2].y;
    if (Math.hypot(bx - ax, by - ay) < 0.5) return;
    const g = ctx.createLinearGradient(ax, ay, bx, by);
    DROP_PATHS.forEach((c, i) => g.addColorStop(i / (DROP_PATHS.length - 1), c.css));
    ctx.globalAlpha = alpha * 0.95;
    ctx.beginPath();
    ctx.moveTo(W[0].x, W[0].y);
    for (let i = 1; i < m; i++) ctx.lineTo(W[i].x, W[i].y);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── the sky ──────────────────────────────────────────────────────────────────────────────────────────────────
  const a = new THREE.Vector3();
  const u = new THREE.Vector3();
  const q = new THREE.Vector3();
  const q2 = new THREE.Vector3();
  const wv = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const sunP = new THREE.Vector3();
  const pts = new Float32Array(2 * 64);
  const T = { x: 0, y: 0, ok: true };
  const E2 = { x: 0, y: 0, ok: true };
  /** An arc at the eye from direction e0 toward e1 (unit, square to e0), through angle t1, radius r. */
  function arcAtEye(e0, e1, t1, r, color, width, alpha) {
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const t = (t1 * i) / n;
      q.copy(EYE)
        .addScaledVector(e0, r * Math.cos(t))
        .addScaledVector(e1, r * Math.sin(t));
      S(q, T);
      pts[i * 2] = T.x;
      pts[i * 2 + 1] = T.y;
    }
    stroke(pts, n + 1, color, width, alpha);
  }
  /** The unit direction, square to the sunlight a, from the axis toward a point p seen from the eye. */
  const sideOf = (p, out) => {
    out.copy(p).sub(EYE);
    out.addScaledVector(a, -out.dot(a));
    return out.normalize();
  };
  const back = new THREE.Vector3(0, 0, -1);
  const upY = new THREE.Vector3(0, 1, 0);
  /** One parallel ray of sunlight that reaches the point p, from the plane through the sun square to the light. */
  function sunRay(p, alpha, width = 2.2, arrow = 0.8) {
    sunPoint(v.sun, sunP);
    const back2 = dir.copy(p).sub(sunP).dot(a) + 2.2;
    q2.copy(p).addScaledVector(a, -back2);
    S(q2, A);
    S(p, B);
    fadeSeg(A, B, C.white, width, alpha);
    if (arrow > 0) chevAt(A, B, arrow, C.white, 10, alpha);
  }
  function skyLight() {
    along(v.sun, a);
    upOf(v.sun, u);
    sunPoint(v.sun, sunP);
    // the sun's height: the level line back from the eye and the arc up to the sunlight
    if (v.sunArc > 0.01) {
      S(EYE, A);
      q.copy(EYE).addScaledVector(back, 4.2);
      S(q, B);
      seg(A, B, 1, C.axis, 1.6, v.sunArc * 0.9, [6, 5]);
      arcAtEye(back, upY, toRad(v.sun), 3.2, C.sun, 2.8, v.sunArc);
    }
    // sunlight: a bundle of parallel rays from the sun's side, one of them past the eye
    if (v.beam > 0.01) {
      for (const [k, j, al] of BUNDLE) {
        q.copy(sunP)
          .addScaledVector(u, k)
          .addScaledVector(X, j)
          .addScaledVector(a, SUN_D + 4.5);
        sunRay(q, v.beam * al, 1.6, 0.55);
      }
      S(sunP, A);
      S(EYE, B);
      fadeSeg(A, B, C.white, 2.4, v.beam);
      chevAt(A, B, 0.7, C.white, 11, v.beam);
    }
    // on past the eye (dashed) to the point opposite the sun: the bow's centre, marked with a dot
    if (v.axis > 0.01) {
      S(EYE, B);
      q.copy(EYE).addScaledVector(a, ARC * Math.cos(toRad((THETA_RED + THETA_VIOLET) / 2)));
      S(q, A);
      seg(B, A, 1, C.axis, 1.8, v.axis * 0.95, [7, 6]);
      if (A.ok) {
        ctx.globalAlpha = v.axis;
        ctx.beginPath();
        ctx.arc(A.x, A.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = C.axis;
        ctx.fill();
        ctx.strokeStyle = C.edge;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    if (v.lines > 0.01) {
      const k = v.lines;
      for (const [which, color, own] of KEYS) {
        keyDrop(which, v.sun, q);
        sunRay(q, Math.min(1, k * 2));
        S(q, B);
        // the drop sends every colour, each its own way (the spread drawn FAN times wider); the eye catches one
        const kk = Math.max(0, k * 2 - 1);
        if (kk > 0 && !v.plain) {
          sideOf(q, wv);
          for (const c of DROP_PATHS) {
            if (c.id === own) continue;
            const th = toRad(ANGLE[own] - FAN * (ANGLE[own] - ANGLE[c.id]));
            dir.copy(a).multiplyScalar(-Math.cos(th)).addScaledVector(wv, -Math.sin(th));
            q2.copy(q).addScaledVector(dir, 2.6 * kk);
            S(q2, T);
            seg(B, T, 1, c.css, 1.8, 0.75);
          }
        }
        S(EYE, E2);
        seg(B, E2, kk, v.plain ? C.quiz : color, 2.6, 1);
        if (kk > 0.6) chevAt(B, E2, 0.55, v.plain ? C.quiz : color, 11, 1);
        // the drop itself: a small bright bead
        if (B.ok && k > 0.3) {
          ctx.beginPath();
          ctx.arc(B.x, B.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#e6f4ff';
          ctx.fill();
          ctx.strokeStyle = C.edge;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }
    if (v.arcs > 0.01) {
      for (const [which, color] of KEYS) {
        keyDrop(which, v.sun, q);
        sideOf(q, wv);
        const th = toRad(which === 'red' ? THETA_RED : THETA_VIOLET);
        arcAtEye(a, wv, th, which === 'red' ? ARC_R.red : ARC_R.violet, v.plain ? C.quiz : color, 2.6, v.arcs);
      }
    }
  }
  const X = new THREE.Vector3(1, 0, 0);
  const KEYS = [
    ['red', C.red, 'red'],
    ['violet', C.violet, 'violet'],
  ];
  /** The faint rays of the bundle: (along u, along x, strength), from the plane through the sun. */
  const BUNDLE = [
    [-1.4, 0, 0.5],
    [3.4, 0, 0.5],
    [8.8, 0, 0.45],
  ];

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    skyLight();
    dropLight();
  }
  stage.onAfterRender(paint);

  /** Where things are on the canvas, for the labels: the drop's white ray, its red and violet ends, the drop's back point. */
  const out = { x: 0, y: 0, ok: true };
  function dropPoint(which) {
    const p = which === 'violet' ? DROP_PATHS[DROP_PATHS.length - 1] : DROP_PATHS[0];
    if (which === 'in') return { x: p.p1.x - LIN * 0.55, y: p.p1.y };
    if (which === 'back') return { x: p.p2.x, y: p.p2.y };
    if (which === 'enter') return { x: p.p1.x, y: p.p1.y };
    if (which === 'normal') return { x: p.p1.x * 1.5, y: p.p1.y * 1.5 };
    if (which === 'through') return { x: p.p2.x + p.out.x * 0.6, y: p.p2.y + p.out.y * 0.6 };
    if (which === 'redIn' || which === 'violetIn') {
      const c = which === 'redIn' ? DROP_PATHS[0] : DROP_PATHS[DROP_PATHS.length - 1];
      return { x: c.p2.x, y: c.p2.y };
    }
    return { x: p.p3.x + p.d3.x * LOUT * 0.7, y: p.p3.y + p.d3.y * LOUT * 0.7 };
  }
  /** Boxes (canvas pixels) round the ends of what is drawn, for the labels to keep clear of. */
  const boxes = () => {
    const list = [];
    if (v.arcs > 0.5 || v.lines > 0.5) {
      S(EYE, out);
      list.push({ left: out.x - 22, top: out.y - 22, right: out.x + 22, bottom: out.y + 22 });
    }
    return list;
  };
  return { canvas, view: v, paint, boxes, dropPoint, size };
}
