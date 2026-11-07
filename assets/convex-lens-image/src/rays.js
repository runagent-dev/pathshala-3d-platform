// The drawing over the 3D view, like the book's চিত্র ৯.২১–৯.২৬: nothing here is a 3D object. The rays, the light between them, the
// axis, the lens's outline and the points on the axis are painted on a 2D canvas above the view, from the exact points of reading.js
// projected through the camera: even anti-aliased lines with a thin dark edge and small filled chevrons at any size (the style of the
// chapter 8 sister figures). It costs no draw call of the 3D view.
import * as THREE from 'three';
import { RAIL, SCALE_POINT } from './bench.js';
import { beamOf, CARD, F0, LENS, PAST, PENCIL, R_FACE, sag, X_END } from './reading.js';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  focus: '#7048e8',
  focusSoft: '#c7b8ff',
  ink: '#eef2f6',
  axis: '#dfe6ee',
  glass: '#c5f6fa',
};
/** The light is not followed farther back than this on the pencil's side. */
const X_BACK = -66;
const CARD_LOW = CARD.bottom - RAIL.axis;
const CARD_HIGH = CARD.top - RAIL.axis;
/** Light stops at the rail: the wash is cut off at its top. */
const FLOOR = RAIL.top - RAIL.axis;

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
  /** World point to the canvas: (x, height y above the axis, z). */
  const P = (x, y = 0, z = 0) => {
    pv.set(x, RAIL.axis + y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };
  /** The same for a point given by its height above the table. */
  const Q = (x, y, z) => P(x, y - RAIL.axis, z);

  // ── what is shown; the figure fills this in ──────────────────────────────────────────────────────────────
  const v = {
    rays: [], // rays of reading.js (the book's rules)
    keys: [
      { in: 0, out: 0, ext: 0 },
      { in: 0, out: 0, ext: 0 },
      { in: 0, out: 0, ext: 0 },
    ],
    now: -1, // the ray being told: the others step back
    bundle: null, // { rays, k }: চিত্র ৯.২১ or ৯.২২
    axis: 1,
    lens: 1, // the outline of the glass in the plane of the rays
    showF: 0, // F′ (and F, from showF2)
    showF2: 0,
    show2F: 0,
    showO: 0,
    fBar: 0, // the focal length, O to F′
    imageAt: null, // { x, y } X′, once found
    imageK: 0,
    beam: 0,
    u: 30,
    kind: 'real',
    iv: 30,
    eye: 0, // the eye that looks through the lens at a virtual image
    screenAt: null, // the x of the paper: the light stops there
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
  function dashed(a, b, k) {
    if (k <= 0) return;
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
  }

  /** A closed patch of light through the points [x, y, …], cut at the rail's top. */
  function wash(points, alpha) {
    if (alpha <= 0) return;
    ctx.beginPath();
    let first = true;
    const to = (x, y) => {
      P(x, y);
      if (first) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
      first = false;
    };
    const n = points.length;
    for (let i = 0; i < n; i += 2) {
      const ax = points[i];
      const ay = points[i + 1];
      const bx = points[(i + 2) % n];
      const by = points[(i + 3) % n];
      if (ay >= FLOOR) to(ax, ay);
      if (ay >= FLOOR !== by >= FLOOR) to(ax + ((bx - ax) * (FLOOR - ay)) / (by - ay), FLOOR);
    }
    if (first) return;
    ctx.closePath();
    ctx.fillStyle = C.ray;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const atX = (a, x) => a.hit.y + (a.dir.y / a.dir.x) * (x - a.hit.x);
  /** The light from X: to the rims of the lens, thin; from them on, gathering to X′ or spreading, as far as the paper. */
  function beam(k) {
    if (k <= 0) return;
    const [a, b] = beamOf(v.u);
    wash([-v.u, PENCIL, a.hit.x, a.hit.y, b.hit.x, b.hit.y], k * 0.08);
    const stop = v.screenAt;
    const real = v.kind === 'real';
    const iv = v.iv;
    if (real && iv <= X_END && (stop == null || stop >= iv)) {
      wash([a.hit.x, a.hit.y, iv, atX(a, iv), b.hit.x, b.hit.y], k * 0.2);
      const x = Math.min(stop ?? iv + PAST, X_END);
      if (x > iv + 0.01) wash([iv, atX(a, iv), x, atX(a, x), x, atX(b, x)], k * 0.12);
      return;
    }
    const x = Math.min(stop ?? (real ? X_END : 30), X_END);
    wash([a.hit.x, a.hit.y, x, atX(a, x), x, atX(b, x), b.hit.x, b.hit.y], k * (real ? 0.14 : 0.08));
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
  /** The outline of the glass in the plane of the rays (the book's lens shape), and the middle line where the rays bend. */
  function lensLine(k) {
    if (k <= 0) return;
    const e = LENS.edge / 2;
    const top = e + sag(R_FACE, LENS.half);
    const outline = () => {
      ctx.beginPath();
      const n = 24;
      for (let i = 0; i <= n; i++) {
        const y = LENS.half - (i / n) * 2 * LENS.half;
        P(-(top - sag(R_FACE, y)), y);
        if (i) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      }
      for (let i = 0; i <= n; i++) {
        const y = -LENS.half + (i / n) * 2 * LENS.half;
        P(top - sag(R_FACE, y), y);
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
  /** The textbook's eye, seen from the side, looking left through the lens at (x, y). */
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

  /** The end of a ray: at the paper, if it reaches it there. */
  function endOfRay(r) {
    const s = v.screenAt;
    if (s == null || r.dir.x <= 0 || s <= r.hit.x || s >= r.end.x) return r.end;
    const y = atX(r, s);
    return y >= CARD_LOW && y <= CARD_HIGH ? { x: s, y } : r.end;
  }
  function backOf(r) {
    if (r.back.x >= X_BACK) return r.back;
    return { x: X_BACK, y: atX(r, X_BACK) };
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (v.axis > 0) axis(v.axis);
    drop(F0, C.focusSoft, v.showF);
    drop(-F0, C.focusSoft, v.showF2);
    drop(2 * F0, C.ink, v.show2F);
    drop(-2 * F0, C.ink, v.show2F);
    if (v.fBar > 0) bar(0, F0, -LENS.half - 2.2, C.focus, v.fBar);
    lensLine(v.lens);
    beam(v.beam);
    if (v.bundle && v.bundle.k > 0) {
      const k = v.bundle.k;
      for (const r of v.bundle.rays) {
        ray(r.start, r.hit, Math.min(1, k * 2), 0.5, 1.8);
        ray(r.hit, r.end, Math.max(0, k * 2 - 1), 0.45, 1.8);
      }
    }
    v.rays.forEach((r, i) => {
      const k = v.keys[i];
      if (!r || !k || k.in <= 0) return;
      const faint = v.now >= 0 && v.now !== i;
      ctx.globalAlpha = faint ? 0.6 : 1;
      const width = faint ? 1.6 : 2.1;
      if (r.back) dashed(r.hit, backOf(r), k.ext);
      ray(r.start, r.hit, k.in, 0.5, width);
      ray(r.hit, endOfRay(r), k.out, 0.5, width);
      ctx.globalAlpha = 1;
    });
    if (v.eye > 0) {
      const r = v.rays[0];
      eye(r ? Math.min(30, r.end.x) + 3 : 30, 1.5, v.eye);
    }
    dot(0, 0, C.ink, v.showO, 3.8);
    dot(F0, 0, C.focus, v.showF);
    dot(-F0, 0, C.focus, v.showF2);
    dot(2 * F0, 0, C.ink, v.show2F, 3.8);
    dot(-2 * F0, 0, C.ink, v.show2F, 3.8);
    if (v.imageAt && v.imageK > 0) dot(v.imageAt.x, v.imageAt.y, '#ffd43b', v.imageK, 3.8);
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along the rays now shown, canvas px: a label keeps off them, so it never lies on what it names
  const pool = Array.from({ length: 160 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
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
    v.rays.forEach((r, i) => {
      const k = v.keys[i];
      if (!r || !k) return;
      if (k.in >= 1) along(r.start, r.hit);
      if (k.out >= 1) along(r.hit, endOfRay(r));
      if (k.ext >= 1 && r.back) along(r.hit, backOf(r));
    });
    if (v.bundle && v.bundle.k >= 1) {
      for (const r of v.bundle.rays) {
        along(r.start, r.hit);
        along(r.hit, r.end);
      }
    }
    return out;
  }

  return { canvas, view: v, paint, boxes };
}
