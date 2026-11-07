// The drawing over the 3D view, like the book's line figures (চিত্র ৯.১৪–৯.১৭): the outline of each lens's section, the circles of the
// spheres its faces belong to with their centres, the principal axis, the rays of the ray box and the laser's beam. Nothing here is a
// 3D object: the exact points of reading.js are projected through the camera and painted on a 2D canvas above the view, with even
// anti-aliased lines, a thin dark edge so that they read on the blue and on the table, and small filled chevrons.
import * as THREE from 'three';
import { RAIL } from './bench.js';
import { leftFace, rightFace } from './reading.js';

export const C = {
  ray: '#f59f00', // the ray box's light (chapter 9: amber)
  rayEdge: '#5f3400',
  laser: '#e03131', // the laser's red
  laserEdge: '#4a0b0b',
  focus: '#7048e8', // F
  line: '#eef2f6', // circles, the axis, the shift bar: light, with a dark edge
  edge: '#14202e',
  section: '#16324f', // the outline of a cut lens
  orig: '#ffffff', // the original direction, dashed
};

export function createDrawing({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lt-draw';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let w = 1;
  let h = 1;
  function size() {
    w = stage.width;
    h = stage.height;
    dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
  }
  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  let behind = false;
  /** A point (x, height y above the axis, z) to the canvas. */
  const P = (x, y = 0, z = 0) => {
    pv.set(x, RAIL.axis + y, z).project(camera);
    behind = pv.z > 1;
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };
  const to = { x: 0, y: 0 };
  /** The same, returned in a reused object (canvas pixels). */
  function screen(x, y = 0, z = 0) {
    P(x, y, z);
    to.x = sx;
    to.y = sy;
    return to;
  }

  // what is drawn; the figure fills it in
  const v = {
    alpha: 1,
    axis: { k: 0, x0: -30, x1: 30 },
    sections: [], // { L, at, k }
    circles: [], // { cx, r, k, plus }
    rays: null, // { list, inK, outK, extK, F, showF, color: 'ray' }
    beam: null, // { start, a, b, end, origEnd, k, shiftK }
    dots: [], // { x, y, k, color }
    candidates: null, // { from, list: [{ to }], k }
  };

  // the segments drawn on the last frame (canvas pixels), for labels to keep off; pooled, nothing allocated per frame
  const drawn = new Float32Array(4 * 96);
  let nDrawn = 0;
  function note(x0, y0, x1, y1) {
    if (nDrawn >= 96) return;
    const k = nDrawn * 4;
    drawn[k] = x0;
    drawn[k + 1] = y0;
    drawn[k + 2] = x1;
    drawn[k + 3] = y1;
    nDrawn++;
  }
  const pool = [];
  const out = [];
  /** Small boxes along every ray drawn, for the labels' avoid list. */
  function boxes() {
    out.length = 0;
    let used = 0;
    for (let i = 0; i < nDrawn; i++) {
      const x0 = drawn[i * 4];
      const y0 = drawn[i * 4 + 1];
      const x1 = drawn[i * 4 + 2];
      const y1 = drawn[i * 4 + 3];
      const n = Math.min(40, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 14));
      for (let j = 0; j <= n; j++) {
        const x = x0 + ((x1 - x0) * j) / Math.max(1, n);
        const y = y0 + ((y1 - y0) * j) / Math.max(1, n);
        if (!pool[used]) pool[used] = { left: 0, top: 0, right: 0, bottom: 0 };
        const b = pool[used++];
        b.left = x - 6;
        b.right = x + 6;
        b.top = y - 6;
        b.bottom = y + 6;
        out.push(b);
      }
    }
    return out;
  }

  function chevron(x, y, dx, dy, fill, edge, length = 10) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = length * 0.6;
    const b = length * 0.4;
    const c = length * 0.42;
    const n = length * 0.12;
    ctx.beginPath();
    ctx.moveTo(x + ux * a, y + uy * a);
    ctx.lineTo(x - ux * b - uy * c, y - uy * b + ux * c);
    ctx.lineTo(x - ux * n, y - uy * n);
    ctx.lineTo(x - ux * b + uy * c, y - uy * b - ux * c);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
  /** A segment from a to b (cm, heights above the axis, z = 0), drawn as far as k, with an arrow at the fraction `at` (< 0: none). */
  function seg(a, b, k, at, color, edge, width = 1.9) {
    if (k <= 0) return;
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    const dx = sx - x0;
    const dy = sy - y0;
    const x1 = x0 + dx * Math.min(1, k);
    const y1 = y0 + dy * Math.min(1, k);
    note(x0, y0, x1, y1);
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = edge;
    ctx.lineWidth = width + 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    if (at >= 0 && k >= at) chevron(x0 + dx * at, y0 + dy * at, dx, dy, color, edge);
  }
  function dashed(a, b, k, color, edge, width = 1.5, pattern = [6, 4.5], noted = true) {
    if (k <= 0) return;
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    const x1 = x0 + (sx - x0) * Math.min(1, k);
    const y1 = y0 + (sy - y0) * Math.min(1, k);
    if (noted && v.alpha > 0.5) note(x0, y0, x1, y1);
    ctx.lineCap = 'butt';
    ctx.setLineDash(pattern);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = edge;
    ctx.lineWidth = width + 1.3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function dot(x, y, r, fill) {
    P(x, y);
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  function plus(x, y, size = 6) {
    P(x, y);
    ctx.lineCap = 'round';
    for (const [lw, col] of [
      [4.2, C.edge],
      [2, C.line],
    ]) {
      ctx.beginPath();
      ctx.moveTo(sx - size, sy);
      ctx.lineTo(sx + size, sy);
      ctx.moveTo(sx, sy - size);
      ctx.lineTo(sx, sy + size);
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }

  function axis() {
    const a = v.axis;
    if (a.k <= 0) return;
    ctx.globalAlpha = Math.min(1, a.k) * v.alpha;
    const xm = a.x0 + (a.x1 - a.x0) * Math.min(1, a.k);
    dashed({ x: a.x0, y: 0 }, { x: xm, y: 0 }, 1, C.line, 'rgba(20,32,46,0.75)', 1.2, [12, 4, 2, 4]);
    ctx.globalAlpha = 1;
  }
  function section({ L, at, k }) {
    if (k <= 0.01) return;
    ctx.globalAlpha = Math.min(1, k);
    ctx.beginPath();
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const y = -L.h + (2 * L.h * i) / n;
      P(at + leftFace(L, Math.abs(y)), y);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    for (let i = n; i >= 0; i--) {
      const y = -L.h + (2 * L.h * i) / n;
      P(at + rightFace(L, Math.abs(y)), y);
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = C.section;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function circle({ cx, r, k, plus: mark }) {
    if (k <= 0.01) return;
    ctx.globalAlpha = v.alpha;
    const n = 96;
    const end = Math.max(1, Math.round(n * Math.min(1, k)));
    for (const [lw, col] of [
      [3, 'rgba(20,32,46,0.6)'],
      [1.4, C.line],
    ]) {
      ctx.beginPath();
      for (let i = 0; i <= end; i++) {
        const a = Math.PI + (i / n) * Math.PI * 2; // from the side away from the lens, round
        P(cx + r * Math.cos(a), r * Math.sin(a));
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    // the circle, in a few chords, for the labels to keep off
    let px = 0;
    let py = 0;
    for (let i = 0; i <= end; i += 6) {
      const a = Math.PI + (i / n) * Math.PI * 2;
      P(cx + r * Math.cos(a), r * Math.sin(a));
      if (i > 0) note(px, py, sx, sy);
      px = sx;
      py = sy;
    }
    if (mark && k >= 1) plus(cx, 0);
    ctx.globalAlpha = 1;
  }
  function parallel(rv) {
    const col = C.ray;
    const edge = C.rayEdge;
    ctx.globalAlpha = v.alpha;
    for (const r of rv.list) {
      if (!r.a) {
        seg(r.start, r.end, rv.inK, 0.35, col, edge);
        continue;
      }
      // in, through the glass, out: each part grows in its turn
      seg(r.start, r.a, rv.inK * 1.08, 0.5, col, edge);
      seg(r.a, r.b, (rv.inK - 0.92) / 0.08, -1, col, edge, 1.6);
      seg(r.b, r.end, rv.outK, 0.55, col, edge);
      if (rv.extK > 0 && rv.F != null && r.h !== 0) {
        // the line out extended back: it seems to come from F
        const back = { x: rv.F, y: 0 };
        const k = rv.extK;
        dashed(r.b, { x: r.b.x + (back.x - r.b.x) * 1.04, y: r.b.y + (back.y - r.b.y) * 1.04 }, k, col, edge, 1.4);
      }
    }
    if (rv.showF > 0 && rv.F != null) {
      ctx.globalAlpha = Math.min(1, rv.showF) * v.alpha;
      dot(rv.F, 0, 4.6, C.focus);
    }
    ctx.globalAlpha = 1;
  }
  function beam(b) {
    if (!b || b.k <= 0) return;
    ctx.globalAlpha = v.alpha;
    const k = b.k * 3;
    // the original direction: the line in, continued (dashed) past the glass
    if (b.origK > 0) dashed(b.a, b.origEnd, b.origK, C.orig, 'rgba(20,32,46,0.8)', 1.3, [5, 4]);
    seg(b.start, b.a, k, 0.55, C.laser, C.laserEdge, 2);
    seg(b.a, b.b, k - 1, -1, C.laser, C.laserEdge, 1.8);
    seg(b.b, b.end, k - 2, 0.5, C.laser, C.laserEdge, 2);
    // the shift: a short bar across from the original line to the ray out, near where it leaves the glass
    if (b.shiftK > 0 && b.foot) {
      P(b.foot.x, b.foot.y);
      const x0 = sx;
      const y0 = sy;
      P(b.at.x, b.at.y);
      const L = Math.hypot(sx - x0, sy - y0);
      if (L > 3) {
        ctx.globalAlpha = Math.min(1, b.shiftK) * v.alpha;
        const ux = (sx - x0) / L;
        const uy = (sy - y0) / L;
        for (const [lw, col] of [
          [3.6, C.edge],
          [1.6, C.line],
        ]) {
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(sx, sy);
          for (const [px, py] of [
            [x0, y0],
            [sx, sy],
          ]) {
            ctx.moveTo(px - uy * 5, py + ux * 5);
            ctx.lineTo(px + uy * 5, py - ux * 5);
          }
          ctx.strokeStyle = col;
          ctx.lineWidth = lw;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  function candidates(cv) {
    if (!cv || cv.k <= 0) return;
    ctx.globalAlpha = Math.min(1, cv.k) * v.alpha;
    for (const c of cv.list) dashed(c.from ?? cv.from, c.to, 1, '#ffe066', 'rgba(20,32,46,0.85)', 2, [7, 4], false);
    ctx.globalAlpha = 1;
  }

  function draw() {
    size();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    nDrawn = 0;
    if (v.alpha <= 0) return;
    axis();
    for (const s of v.sections) section(s);
    for (const c of v.circles) circle(c);
    if (v.rays) parallel(v.rays);
    beam(v.beam);
    candidates(v.candidates);
    for (const d of v.dots) {
      if (d.k <= 0) continue;
      ctx.globalAlpha = Math.min(1, d.k) * v.alpha;
      dot(d.x, d.y, d.r ?? 4.4, d.color);
      ctx.globalAlpha = 1;
    }
  }
  stage.onAfterRender(draw);
  return { canvas, view: v, draw, screen, boxes, isBehind: () => behind };
}
