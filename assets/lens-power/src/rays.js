// The drawing over the 3D view, like the book's চিত্র ৯.১৮, ৯.২১ and ৯.২৭: nothing here is a 3D object. The rays, the axis, the lens's
// outline, the focal length and the points on the axis are painted on a 2D canvas above the view, from the exact points of reading.js
// projected through the camera: even anti-aliased lines with a thin dark edge and small filled chevrons at any size (the style of the
// chapter 8 and 9 sister figures). It costs no draw call of the 3D view.
import * as THREE from 'three';
import { RAIL, SCALE_POINT } from './bench.js';
import { LENS, leftFace, lensOf, rightFace } from './reading.js';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  focus: '#7048e8',
  focusSoft: '#c7b8ff',
  ink: '#eef2f6',
  axis: '#dfe6ee',
  glass: '#c5f6fa',
  image: '#ffd43b',
};
/** The focal length's bar runs this far under the axis (cm): below the glass, above the rail. */
export const BAR_Y = -(LENS.half + 2.6);

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lp-draw';
  host.appendChild(canvas);
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
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

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  let behind = false;
  /** World point to the canvas: (x, height y above the axis, z). */
  const P = (x, y = 0, z = 0) => {
    pv.set(x, RAIL.axis + y, z).project(camera);
    behind = pv.z > 1;
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };
  /** The same for a point given by its height above the table. */
  const Q = (x, y, z) => P(x, y - RAIL.axis, z);

  // ── what is shown; the figure fills this in ──────────────────────────────────────────────────────────────
  const v = {
    axis: 1,
    lens: { id: 'plus40', k: 1 }, // the outline of the glass in the plane of the rays
    middle: false, // its middle plane (where the pencil's rays bend)
    beams: [], // the ray box's beams, traced (reading.beamsOf)
    beamK: { in: 0, out: 0, ext: 0 },
    pencil: [], // the pencil's two rays (reading.pencilRays)
    pencilK: { in: 0, out: 0, ext: 0 },
    F: { x: 40, k: 0 },
    F2: { x: -40, k: 0 }, // F′, the focus on the other side
    oldF: { x: 40, k: 0 }, // where the last lens's rays met, faint
    bar: { x: 40, k: 0 }, // the focal length: O to x
    O: 0,
    image: { x: 0, y: 0, k: 0 }, // X′
    eye: 0, // the eye that looks through the lens at a virtual image
  };

  const line = (x0, y0, x1, y1) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  };

  /** The swept-back arrowhead of the sister figures, at x, y, along (dx, dy). */
  function chevron(x, y, dx, dy, length = 11) {
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
    ctx.fillStyle = C.ray;
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }

  /** A ray from a to b (cm above the axis) as far as k, with an arrow at the fraction `at` (< 0: none). */
  function ray(a, b, k, at, width = 2) {
    if (k <= 0) return;
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    const dx = sx - x0;
    const dy = sy - y0;
    const x1 = x0 + dx * k;
    const y1 = y0 + dy * k;
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    line(x0, y0, x1, y1);
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = width + 1.3;
    ctx.stroke();
    line(x0, y0, x1, y1);
    ctx.strokeStyle = C.ray;
    ctx.lineWidth = width;
    ctx.stroke();
    if (at >= 0 && k >= at) chevron(x0 + dx * at, y0 + dy * at, dx, dy);
    if (k < 1) {
      ctx.beginPath();
      ctx.arc(x1, y1, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7d6';
      ctx.fill();
    }
  }
  /** Where light only seems to come from: the same amber, dashed. */
  function dashed(a, b, k, alpha = 1) {
    if (k <= 0) return;
    ctx.globalAlpha = alpha;
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    const x1 = x0 + (sx - x0) * k;
    const y1 = y0 + (sy - y0) * k;
    ctx.lineCap = 'butt';
    ctx.setLineDash([6, 4.5]);
    line(x0, y0, x1, y1);
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 2.9;
    ctx.stroke();
    line(x0, y0, x1, y1);
    ctx.strokeStyle = C.ray;
    ctx.lineWidth = 1.7;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  function axis(k) {
    P(RAIL.left + 2, 0);
    const x0 = sx;
    const y0 = sy;
    P(RAIL.right - 4, 0);
    ctx.globalAlpha = k * 0.8;
    ctx.setLineDash([10, 4, 2, 4]);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = C.axis;
    line(x0, y0, sx, sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  /** A thin line from the point on the axis down to its place on the printed scale. */
  function drop(x, color, k) {
    if (k <= 0) return;
    P(x, 0);
    const x0 = sx;
    const y0 = sy;
    Q(x, SCALE_POINT.y + 0.7, SCALE_POINT.z);
    ctx.globalAlpha = k;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = color;
    line(x0, y0, sx, sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  /** A point: a small disc in its colour on a white ring. */
  function dot(x, y, color, k, radius = 4.6) {
    if (k <= 0) return;
    P(x, y);
    ctx.globalAlpha = k;
    ctx.beginPath();
    ctx.arc(sx, sy, radius + 1.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  /** A point that was: a ring only. */
  function ring(x, y, color, k, radius = 4.6) {
    if (k <= 0) return;
    P(x, y);
    ctx.globalAlpha = k;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /** A measure in the plane of the rays, at height y: a line with two end ticks (the book's dimension arrows), grown to k. */
  function bar(a, b, y, color, k) {
    if (k <= 0) return;
    P(a, y);
    const x0 = sx;
    const y0 = sy;
    P(a + (b - a) * k, y);
    const x1 = sx;
    const y1 = sy;
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = (-(y1 - y0) / l) * 5;
    const ny = ((x1 - x0) / l) * 5;
    ctx.lineCap = 'round';
    for (const [c, wd] of [
      ['#ffffff', 5],
      [color, 2.4],
    ]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = wd;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.moveTo(x0 - nx, y0 - ny);
      ctx.lineTo(x0 + nx, y0 + ny);
      ctx.moveTo(x1 - nx, y1 - ny);
      ctx.lineTo(x1 + nx, y1 + ny);
      ctx.stroke();
    }
  }
  /** The outline of the glass in the plane of the rays (the book's lens shape: the traced faces), and the middle line where the book's rays bend. */
  function lensLine(id, k) {
    if (k <= 0 || !id) return;
    const L = lensOf(id);
    const half = L.h;
    const outline = () => {
      ctx.beginPath();
      const n = 24;
      for (let i = 0; i <= n; i++) {
        const y = half - (i / n) * 2 * half;
        P(leftFace(L, Math.abs(y)), y);
        if (i) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      }
      for (let i = 0; i <= n; i++) {
        const y = -half + (i / n) * 2 * half;
        P(rightFace(L, Math.abs(y)), y);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
    };
    ctx.globalAlpha = k;
    ctx.lineJoin = 'round';
    outline();
    ctx.fillStyle = 'rgba(197, 246, 250, 0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(8, 30, 60, 0.75)';
    ctx.lineWidth = 3.4;
    ctx.stroke();
    outline();
    ctx.strokeStyle = C.glass;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (v.middle) {
      // the middle plane, faint, where the book's rays bend
      P(0, half - 0.2);
      const x0 = sx;
      const y0 = sy;
      P(0, -half + 0.2);
      ctx.globalAlpha = k * 0.55;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      line(x0, y0, sx, sy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
  }
  /** The textbook's eye, seen from the side, looking left through the lens, at (x, y). */
  function eye(x, y, k) {
    if (k <= 0) return;
    P(x, y);
    const cx = sx;
    const cy = sy;
    const r = Math.max(9, Math.min(14, h / 36));
    ctx.globalAlpha = k;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.25, cy);
    ctx.quadraticCurveTo(cx - r * 0.1, cy - r * 1.05, cx + r * 0.9, cy - r * 0.15);
    ctx.lineTo(cx + r * 0.9, cy + r * 0.15);
    ctx.quadraticCurveTo(cx - r * 0.1, cy + r * 1.05, cx - r * 1.25, cy);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1f2933';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - r * 0.55, cy, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#1c6fd9';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - r * 0.62, cy, r * 0.19, 0, Math.PI * 2);
    ctx.fillStyle = '#10161d';
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (v.axis > 0) axis(v.axis);
    drop(v.F.x, C.focusSoft, v.F.k);
    drop(v.F2.x, C.focusSoft, v.F2.k * 0.8);
    if (v.bar.k > 0) bar(0, v.bar.x, BAR_Y, C.focus, v.bar.k);
    lensLine(v.lens.id, v.lens.k);
    // the ray box's beams: in to the lens, out of it; a concave lens's dashed lines back to F
    const bk = v.beamK;
    v.beams.forEach((r) => {
      const mid = r.h === 0;
      // fainter than the light itself: near F the backward lines cross the incoming beams
      if (r.back) dashed(r.b, r.back, bk.ext, 0.55);
      ray(r.start, r.a, bk.in, mid ? -1 : 0.55, 1.9);
      ray(r.a, r.b, bk.in >= 1 ? Math.min(1, bk.out * 6) : 0, -1, 1.9);
      ray(r.b, r.end, Math.max(0, (bk.out - 1 / 6) * 1.2), mid ? -1 : 0.5, 1.9);
    });
    // the pencil's two rays
    const pk = v.pencilK;
    for (const r of v.pencil) {
      if (r.back) dashed(r.hit, r.back, pk.ext);
      ray(r.start, r.hit, pk.in, 0.5, 2.1);
      ray(r.hit, r.end, pk.out, 0.5, 2.1);
    }
    if (v.eye > 0) eye(Math.min(32, (v.pencil[0]?.end.x ?? 26) + 4), 1.2, v.eye);
    ring(v.oldF.x, 0, C.focus, v.oldF.k * 0.85, 4.2);
    dot(0, 0, C.ink, v.O, 3.6);
    dot(v.F.x, 0, C.focus, v.F.k);
    dot(v.F2.x, 0, C.focus, v.F2.k * 0.9, 4);
    if (v.image.k > 0) dot(v.image.x, v.image.y, C.image, v.image.k, 3.8);
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along the rays now shown, canvas px: a label keeps off them, so it never lies on what it names
  const pool = Array.from({ length: 200 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const out = [];
  let used = 0;
  function along(a, b) {
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    const n = Math.min(8, Math.ceil(Math.hypot(sx - x0, sy - y0) / 26));
    for (let i = 0; i <= n && used < pool.length; i++) {
      const x = x0 + ((sx - x0) * i) / n;
      const y = y0 + ((sy - y0) * i) / n;
      const r = pool[used++];
      r.left = x - 5;
      r.right = x + 5;
      r.top = y - 5;
      r.bottom = y + 5;
      out.push(r);
    }
  }
  function boxes() {
    out.length = 0;
    used = 0;
    for (const r of v.beams) {
      if (v.beamK.in >= 1) along(r.start, r.a);
      if (v.beamK.out >= 1) along(r.b, r.end);
      if (v.beamK.ext >= 1 && r.back) along(r.b, r.back);
    }
    for (const r of v.pencil) {
      if (v.pencilK.in >= 1) along(r.start, r.hit);
      if (v.pencilK.out >= 1) along(r.hit, r.end);
      if (v.pencilK.ext >= 1 && r.back) along(r.hit, r.back);
    }
    return out;
  }
  /** A point of the plane of the rays on the canvas (px), or null behind the camera. */
  function toCanvas(x, y) {
    P(x, y);
    return behind ? null : { x: sx, y: sy };
  }

  return { canvas, view: v, paint, boxes, toCanvas };
}
