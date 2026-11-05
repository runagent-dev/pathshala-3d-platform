// The drawing over the 3D view, like the book's চিত্র ৮.১৯: nothing here is a 3D object. The rays, the axis, the mirror's curve and
// the marks are painted on a 2D canvas above the view, from the exact points of reading.js projected through the camera: even
// anti-aliased lines with a thin dark edge and small filled chevrons, at any size (the style of spherical-mirror-focus).
import * as THREE from 'three';
import { RAIL } from './bench.js';
import { SHAPE } from './pencil.js';
import { EYE_X, FLAT_R, fieldOf, MIRROR, PENCIL, postsSeen, R0, ROW_X, sag, U } from './reading.js';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  focus: '#7048e8',
  focusSoft: '#c7b8ff',
  ink: '#eef2f6',
  axis: '#dfe6ee',
  silver: '#f4f7fa',
  plane: '#a5d8ff',
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
  /** World point to the canvas: (x, height y above the axis, z). */
  const P = (x, y = 0, z = 0) => {
    pv.set(x, RAIL.axis + y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };
  /** The same for a point given by its height above the table. */
  const Q = (x, y, z) => P(x, y - RAIL.axis, z);

  // ── what is shown; the figure fills this in ───────────────────────────────────────────────────────────────
  const v = {
    r: R0,
    rays: [], // threeRays() of reading.js: (i), (ii), (iii)
    keys: [
      { in: 0, out: 0, ext: 0 },
      { in: 0, out: 0, ext: 0 },
      { in: 0, out: 0, ext: 0 },
    ],
    now: -1, // the ray being told: the others step back
    axis: 1,
    showF: 1,
    showO: 1,
    imageAt: null, // { x, y } X′ on the view, once found
    imageK: 0,
    ghostK: 0, // the image's amber rim, as far as it has grown
    size: 0, // the object's height, as a faint outline at the image's depth
    track: 0, // the dashed range of the pencil's handle
    trackY: -2,
    tie: 0, // the arrow from the pencil to its picture in the silver
    tieFrom: { x: 0, y: 0, z: 0 },
    tieTo: { x: 0, y: 0, z: 0 },
    bars: 0, // u and v along the rail
    u: 15,
    cone: 0, // the field of the mirror now
    coneFlat: 0, // and the plane mirror's, for comparison
    eye: 0,
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

  /** A ray from a to b, in cm above the axis, as far as k, with an arrow at the fraction `at` (<0: none). */
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

  /** A point on the axis: a small ring in its colour. */
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
  /** A measure along the rail: a line with two ends, just above the rail's top. */
  function bar(a, b, y, color, k) {
    if (k <= 0) return;
    Q(a, y, 0);
    const x0 = sx;
    const y0 = sy;
    Q(a + (b - a) * k, y, 0);
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
  /** The curve of the mirror where the rays land: the book's line, in bright silver, so that its bend can be seen. */
  function arc(k) {
    if (k <= 0) return;
    const curve = () => {
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const y = -MIRROR.half + (i / 28) * 2 * MIRROR.half;
        P(-sag(v.r, y), y);
        if (i) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      }
    };
    ctx.globalAlpha = k;
    ctx.lineCap = 'round';
    curve();
    ctx.strokeStyle = 'rgba(12,16,22,0.8)';
    ctx.lineWidth = 4.4;
    ctx.stroke();
    curve();
    ctx.strokeStyle = C.silver;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** The field of view of the eye in a mirror of radius r, on the level of the axis: the eye to the rim, the rim out to the row. */
  function cone(r, color, k, fill) {
    if (k <= 0) return;
    const f = fieldOf(r);
    // out past the row, whatever its width
    const t = (ROW_X + 6 - f.rim.x) / f.out.x;
    const ex = f.rim.x + f.out.x * t;
    const ez = f.rim.y + f.out.y * t;
    const path = () => {
      ctx.beginPath();
      P(f.rim.x, 0, f.rim.y);
      ctx.moveTo(sx, sy);
      P(ex, 0, ez);
      ctx.lineTo(sx, sy);
      P(ex, 0, -ez);
      ctx.lineTo(sx, sy);
      P(f.rim.x, 0, -f.rim.y);
      ctx.lineTo(sx, sy);
      ctx.closePath();
    };
    ctx.globalAlpha = k * fill;
    path();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = k;
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (const s of [1, -1]) {
      P(EYE_X, 0, 0);
      const x0 = sx;
      const y0 = sy;
      P(f.rim.x, 0, s * f.rim.y);
      const x1 = sx;
      const y1 = sy;
      P(ex, 0, s * ez);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  /** Where the pencil can go: a faint dashed line along the rail, with its two ends marked. */
  function track() {
    if (v.track <= 0) return;
    P(U.min, v.trackY);
    const x0 = sx;
    const y0 = sy;
    P(U.max, v.trackY);
    const x1 = sx;
    const y1 = sy;
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = (-(y1 - y0) / l) * 6;
    const ny = ((x1 - x0) / l) * 6;
    ctx.lineCap = 'butt';
    ctx.setLineDash([7, 6]);
    for (const [c, wd] of [
      ['rgba(12,16,22,0.4)', 3.4],
      ['rgba(255,255,255,0.8)', 1.6],
    ]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = wd;
      line(x0, y0, x1, y1);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    line(x0 - nx, y0 - ny, x0 + nx, y0 + ny);
    ctx.stroke();
    line(x1 - nx, y1 - ny, x1 + nx, y1 + ny);
    ctx.stroke();
  }
  /** A ring round each post a mirror shows, at the level of the axis. */
  function marks(r, color, k, radius) {
    if (k <= 0) return;
    ctx.globalAlpha = k;
    for (const z of postsSeen(r)) {
      P(ROW_X, 0, z);
      ctx.beginPath();
      ctx.arc(sx, sy, radius + 1.4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(12,16,22,0.8)';
      ctx.lineWidth = 2.8 + 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, radius + 1.4, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  /** A pencil's shape at x, on the axis, m times the pencil's size: the rim of the image, or the object's height for comparison. */
  function outline(x, m, k, color, width, dash = []) {
    if (k <= 0) return;
    const R = SHAPE.radius * m;
    const h = (y) => y * m * k;
    const pts = [
      [-R, 0],
      [-R, h(SHAPE.body)],
      [0, h(PENCIL)],
      [R, h(SHAPE.body)],
      [R, 0],
    ];
    ctx.beginPath();
    pts.forEach(([a, y], i) => {
      P(x + a, y);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    });
    ctx.closePath();
    ctx.setLineDash(dash);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  /** The curved arrow from the pencil to its picture in the silver. */
  function tie(k) {
    if (k <= 0) return;
    const a = v.tieFrom;
    const b = v.tieTo;
    P(a.x, a.y, a.z);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y, b.z);
    const x1 = sx;
    const y1 = sy;
    const mx = (x0 + x1) / 2;
    const my = Math.max(y0, y1) + Math.abs(x1 - x0) * 0.42;
    ctx.globalAlpha = k;
    ctx.lineCap = 'round';
    for (const [c, wd] of [
      ['rgba(12,16,22,0.8)', 3.8],
      ['#ffffff', 2.2],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(mx, my, x1, y1);
      ctx.strokeStyle = c;
      ctx.lineWidth = wd;
      ctx.stroke();
    }
    chevronIn('#ffffff', x1, y1, x1 - mx, y1 - my);
    ctx.globalAlpha = 1;
  }
  function chevronIn(color, x, y, dx, dy) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - ux * 10 - uy * 5, y - uy * 10 + ux * 5);
    ctx.lineTo(x - ux * 10 + uy * 5, y - uy * 10 - ux * 5);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(12,16,22,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /** The eye on the bench: a plain almond with its iris, seen from over the bench. */
  function eye(k) {
    if (k <= 0) return;
    P(EYE_X, 0, 0);
    const x = sx;
    const y = sy;
    ctx.globalAlpha = k;
    ctx.beginPath();
    ctx.moveTo(x - 15, y);
    ctx.quadraticCurveTo(x, y - 14, x + 15, y);
    ctx.quadraticCurveTo(x, y + 14, x - 15, y);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1f2933';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 1, y, 5.4, 0, Math.PI * 2);
    ctx.fillStyle = '#1f2933';
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = -v.r;
    const fx = -v.r / 2;
    if (v.axis > 0) axis(v.axis);
    track();
    if (v.bars > 0) {
      bar(0, v.u, RAIL.top + 1.6, '#1f2933', v.bars);
    }
    cone(R0, C.ray, v.cone, 0.16);
    cone(FLAT_R, C.plane, v.coneFlat, 0.26);
    marks(R0, C.ray, v.cone, 11);
    marks(FLAT_R, C.plane, v.coneFlat, 7);
    eye(v.eye);
    tie(v.tie);
    v.rays.forEach((r, i) => {
      const k = v.keys[i];
      if (k.in <= 0) return;
      const faint = v.now >= 0 && v.now !== i;
      ctx.globalAlpha = faint ? 0.6 : 1;
      const width = faint ? 1.6 : 2.1;
      dashed(r.hit, r.back, k.ext);
      // the first ray goes in and comes back along itself: one arrow each way, apart
      ray(r.start, r.hit, k.in, i === 0 ? 0.32 : 0.5, width);
      ray(r.hit, r.end, k.out, i === 0 ? 0.3 : 0.55, width);
      ctx.globalAlpha = 1;
    });
    arc(v.axis);
    dot(cx, 0, C.ink, v.showO);
    if (v.axis > 0) dot(0, 0, C.ink, v.axis, 3.6);
    dot(fx, 0, C.focus, v.showF);
    if (v.imageAt) {
      outline(v.imageAt.x, 1, v.size, 'rgba(12,16,22,0.55)', 3.2, [6, 4]);
      outline(v.imageAt.x, 1, v.size, '#ffffff', 1.7, [6, 4]);
      outline(v.imageAt.x, v.imageAt.m, v.ghostK, 'rgba(95,52,0,0.9)', 3.6);
      outline(v.imageAt.x, v.imageAt.m, v.ghostK, C.ray, 2);
      if (v.imageK > 0) dot(v.imageAt.x, v.imageAt.y, '#ffd43b', v.imageK, 3.8);
    }
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along the rays now shown, canvas px: a label keeps off them, so it never lies on what it names
  const pool = Array.from({ length: 120 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
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
    if (v.track > 0) along({ x: U.min, y: v.trackY }, { x: U.max, y: v.trackY });
    v.rays.forEach((r, i) => {
      const k = v.keys[i];
      if (k.in >= 1) along(r.start, r.hit);
      if (k.out >= 1) along(r.hit, r.end);
      if (k.ext >= 1) along(r.hit, r.back);
    });
    return out;
  }

  return { canvas, view: v, paint, boxes };
}
