// The drawing over the 3D view, like the book's চিত্র ৯.১৮–৯.২০: nothing here is a 3D object. The rays, the axis, the lens's outline,
// the points on the axis and the dashed lines where light only seems to come from are painted on a 2D canvas above the view, from the
// exact points of reading.js projected through the camera: even anti-aliased lines with a thin dark edge and small filled chevrons at
// any size (the style of the sister figures). It costs no draw call of the 3D view.
import * as THREE from 'three';
import { RAIL, SCALE_POINT } from './bench.js';
import { F0, LENS, R_FACE, sag } from './reading.js';

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

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lab-draw';
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

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  let behind = false;
  /** World point to the canvas: (x, height y above the axis, z). */
  const P = (x, y = 0, z = 0) => {
    pv.set(x, RAIL.axis + y, z).applyMatrix4(camera.matrixWorldInverse);
    behind = pv.z > -1;
    pv.applyMatrix4(camera.projectionMatrix);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };
  /** The same for a point given by its height above the table. */
  const Q = (x, y, z) => P(x, y - RAIL.axis, z);

  // ── what is shown; the figure fills this in ──────────────────────────────────────────────────────────────
  const v = {
    on: 1, // 0 hides the whole drawing (the eye's view)
    rays: [], // the three rays of reading.js (the book's rules), in the order (ii), (i), (iii)
    keys: [
      { in: 0, out: 0, ext: 0 },
      { in: 0, out: 0, ext: 0 },
      { in: 0, out: 0, ext: 0 },
    ],
    now: -1, // the ray being told: the others step back
    bundle: null, // { rays, in, out, ext }: চিত্র ৯.১৮ or ৯.১৯
    axis: 1,
    lens: 1, // the outline of the glass in the plane of the rays
    showF: 0, // F (the book's, on the pencil's side)
    showF2: 0, // F′ (on the far side)
    showO: 0,
    fBar: 0, // the focal length, O to F
    imageAt: null, // { x, y } X′, once found
    imageK: 0,
    perp: 0, // the perpendicular from X′ to the axis (Y′)
    drop: 0, // a thin line from Y′ down to the scale
    eye: 0, // the eye on the far side that looks through the lens
    eyeX: 12,
    eyeY: 4.5,
    picks: null, // the test's candidates: [{ from, dir, length }]
    hole: null, // { x, y, r } canvas px: the magnifier's glass, kept clear of the drawing
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
  /** Where light only seems to come from: the same amber, dashed (the book's dotted line). */
  function dashed(a, b, k, alpha = 1) {
    if (k <= 0) return;
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    const x1 = x0 + (sx - x0) * k;
    const y1 = y0 + (sy - y0) * k;
    ctx.globalAlpha = alpha;
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
    P(RAIL.right - 2, 0);
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
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = color;
    line(x0, y0, sx, sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  /** A point: a small ring in its colour. */
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
  /** A measure in the plane of the rays, at height y: a line with two end ticks (the book's dimension arrows). */
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
  /** The outline of the glass in the plane of the rays (the book's biconcave shape), and the middle line where the rays bend. */
  function lensLine(k) {
    if (k <= 0) return;
    const c = LENS.middle / 2;
    const outline = () => {
      ctx.beginPath();
      const n = 24;
      for (let i = 0; i <= n; i++) {
        const y = LENS.half - (i / n) * 2 * LENS.half;
        P(-(c + sag(R_FACE, Math.abs(y))), y);
        if (i) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      }
      for (let i = 0; i <= n; i++) {
        const y = -LENS.half + (i / n) * 2 * LENS.half;
        P(c + sag(R_FACE, Math.abs(y)), y);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
    };
    ctx.globalAlpha = k;
    ctx.lineJoin = 'round';
    outline();
    ctx.fillStyle = 'rgba(197, 246, 250, 0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(8, 30, 60, 0.75)';
    ctx.lineWidth = 3.6;
    ctx.stroke();
    outline();
    ctx.strokeStyle = C.glass;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // the middle plane, faint, as the book draws it
    P(0, LENS.half - 0.2);
    const x0 = sx;
    const y0 = sy;
    P(0, -LENS.half + 0.2);
    ctx.globalAlpha = k * 0.55;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    line(x0, y0, sx, sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  /** The textbook's eye, seen from the side, looking left through the lens, at (x, y). */
  function eye(x, y, k) {
    if (k <= 0) return;
    P(x, y);
    const cx = sx;
    const cy = sy;
    const r = Math.max(9, Math.min(15, h / 36));
    ctx.globalAlpha = k;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // the almond of the lids, opening to the left
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

  const at = { x: 0, y: 0 };
  /** The point at the fraction k from a to b, in the plane of the rays. */
  const lerp = (a, b, k) => {
    at.x = a.x + (b.x - a.x) * k;
    at.y = a.y + (b.y - a.y) * k;
    return at;
  };

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (v.on <= 0) return;
    ctx.globalAlpha = 1;
    ctx.save();
    if (v.hole) {
      // nothing is drawn over the magnifier: it shows the 3D enlarged, and the lines would not be
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.arc(v.hole.x, v.hole.y, v.hole.r, 0, Math.PI * 2, true);
      ctx.clip('evenodd');
    }
    if (v.axis > 0) axis(v.axis);
    drop(-F0, C.focusSoft, v.showF);
    drop(F0, C.focusSoft, v.showF2);
    if (v.fBar > 0) bar(0, -F0, -LENS.half - 2.2, C.focus, v.fBar);
    lensLine(v.lens);
    const b = v.bundle;
    if (b) {
      for (const r of b.rays) {
        if (r.back && b.ext > 0) dashed(r.hit, r.back, b.ext, 0.85);
        if (r.aim && b.ext > 0) dashed(r.hit, r.aim, b.ext, 0.5);
        ray(r.start, r.hit, b.in, 0.5, 1.8);
        ray(r.hit, r.end, b.out, 0.45, 1.8);
      }
    }
    v.rays.forEach((r, i) => {
      const k = v.keys[i];
      if (!r || !k || k.in <= 0) return;
      const faint = v.now >= 0 && v.now !== i;
      ctx.globalAlpha = faint ? 0.6 : 1;
      const width = faint ? 1.6 : 2.1;
      if (r.back) dashed(r.hit, r.back, k.ext, faint ? 0.6 : 1);
      ctx.globalAlpha = faint ? 0.6 : 1;
      ray(r.start, r.hit, k.in, 0.5, width);
      ray(r.hit, r.end, k.out, 0.5, width);
      ctx.globalAlpha = 1;
    });
    if (v.picks) {
      for (const p of v.picks) ray(p.from, { x: p.from.x + p.dir.x * p.length, y: p.from.y + p.dir.y * p.length }, 1, 0.55, 2);
    }
    if (v.imageAt && v.perp > 0) {
      // the perpendicular from X′ to the axis: Y′
      const top = v.imageAt;
      P(top.x, top.y);
      const x0 = sx;
      const y0 = sy;
      lerp(top, { x: top.x, y: 0 }, v.perp);
      P(at.x, at.y);
      ctx.globalAlpha = 0.95;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.ink;
      line(x0, y0, sx, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    if (v.imageAt) drop(v.imageAt.x, C.image, v.drop);
    if (v.eye > 0) eye(v.eyeX, v.eyeY, v.eye);
    dot(0, 0, C.ink, v.showO, 3.8);
    dot(-F0, 0, C.focus, v.showF);
    dot(F0, 0, C.focus, v.showF2);
    if (v.imageAt && v.imageK > 0) dot(v.imageAt.x, v.imageAt.y, C.image, v.imageK, 3.8);
    ctx.restore();
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along the rays now shown, canvas px: a label keeps off them, so it never lies on what it names
  const pool = Array.from({ length: 900 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const out = [];
  let used = 0;
  function along(a, b) {
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    const n = Math.min(24, Math.ceil(Math.hypot(sx - x0, sy - y0) / 14));
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
    if (v.on <= 0) return out;
    v.rays.forEach((r, i) => {
      const k = v.keys[i];
      if (!r || !k) return;
      if (k.in >= 1) along(r.start, r.hit);
      if (k.out >= 1) along(r.hit, r.end);
      if (k.ext >= 1 && r.back) along(r.hit, r.back);
    });
    const b = v.bundle;
    if (b && b.out >= 1) {
      for (const r of b.rays) {
        along(r.start, r.hit);
        along(r.hit, r.end);
        if (r.back && b.ext >= 1) along(r.hit, r.back);
      }
    }
    if (v.picks) for (const p of v.picks) along(p.from, { x: p.from.x + p.dir.x * p.length, y: p.from.y + p.dir.y * p.length });
    return out;
  }
  /** Where a point of the plane of the rays is on the canvas (px), and whether it is in front of the camera. */
  function toScreen(x, y) {
    P(x, y);
    return { x: sx, y: sy, behind };
  }

  return { canvas, view: v, paint, boxes, toScreen };
}
