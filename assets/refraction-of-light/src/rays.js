// The drawing over the 3D view, as in the sister figures of chapter 8: nothing here is a 3D object. The rays, the normal,
// the angles, the wavefronts and the right-angle mark are painted on a 2D canvas above the view, from the exact 3D points
// of reading.js projected through the camera: even anti-aliased lines with a thin dark edge and small filled chevrons, at
// any size. Every ray comes from trace() (n₁ sin θ₁ = n₂ sin θ₂ at each boundary), so what is drawn is the law itself.
import * as THREE from 'three';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  glow: '#ffe36e',
  normal: '#495057',
  t1: '#1971c2',
  t2: '#2b8a3e',
  front: '#fff7d6',
  white: 'rgba(255,255,255,0.92)',
};
const ARC = 2.7; // cm: the radius of the angles' arcs
const NORMAL_UP = 6.2; // cm of the normal above the boundary and below it
const NORMAL_DOWN = 5.6;
const LAMBDA = 1.25; // cm between wavefronts in air (drawn, not the real 0.0005 mm)
const FRONT_HALF = 0.75; // cm: half the width of a wavefront mark
const SPEED = 2.2; // cm/s in air in the slowed picture

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'rl-draw';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let w = 1;
  let h = 1;
  let unit = 1;
  function size() {
    w = stage.width;
    h = stage.height;
    dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    unit = Math.max(0.9, Math.min(1.3, Math.min(w, h) / 380));
  }
  size();

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  const P = (x, y, z = 0) => {
    pv.set(x, y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
    return pv.z < 1;
  };

  // ── what is shown; the figure fills this in ───────────────────────────────────────────────────────────────
  const v = {
    geo: null, // trace(): points, angles, ns, reflected, reflect
    inK: 0, // the incident ray, 0 … 1 of its length
    outK: 0, // the rays inside, 0 … 1 of all of them together
    reflK: 0, // the weak reflected ray
    shine: 0, // the glow of what just arrived
    normal: 0, // the normal at the boundary that matters, 0 … 1 (it grows from the point)
    normal0: 0, // the faint normal at the first boundary (the water's surface, last step)
    focus: 1, // which hit the angles are at: 1 the first boundary, 2 the second
    arcs: 0, // the angles' arcs
    march: 0, // the wavefronts: their strength
    phase: 0, // s of the slowed clock
    right: 0, // the right-angle mark between the plane and the surface
    rightAt: { x: -7.6, y: 7 },
  };

  /** A line through projected points pts[0..n], as far as k of its whole length; then its chevron. */
  function polyline(pts, from, to, k, width, alpha, shine, at) {
    if (k <= 0 || !v.geo) return;
    const a = pts[from];
    const b = pts[to];
    P(a.x, a.y, a.z);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y, b.z);
    const x1 = x0 + (sx - x0) * k;
    const y1 = y0 + (sy - y0) * k;
    const line = () => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    };
    ctx.lineCap = 'round';
    if (shine > 0) {
      line();
      ctx.globalAlpha = 0.3 * shine;
      ctx.strokeStyle = C.glow;
      ctx.lineWidth = 14 * unit;
      ctx.stroke();
      line();
      ctx.globalAlpha = 0.75 * shine;
      ctx.lineWidth = 7 * unit;
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    line();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = (width + 1.8) * unit;
    ctx.stroke();
    line();
    ctx.strokeStyle = C.ray;
    ctx.lineWidth = width * unit;
    ctx.stroke();
    if (k >= at) chevron(x0 + (sx - x0) * at, y0 + (sy - y0) * at, sx - x0, sy - y0, 13);
    ctx.globalAlpha = 1;
    if (k < 1) bead(x1, y1);
  }
  /** The swept-back arrowhead of the sister figures, at x, y, along (dx, dy). */
  function chevron(x, y, dx, dy, length) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = length * unit * 0.6;
    const b = length * unit * 0.4;
    const c = length * unit * 0.42;
    const n = length * unit * 0.12;
    ctx.beginPath();
    ctx.moveTo(x + ux * a, y + uy * a);
    ctx.lineTo(x - ux * b - uy * c, y - uy * b + ux * c);
    ctx.lineTo(x - ux * n, y - uy * n);
    ctx.lineTo(x - ux * b + uy * c, y - uy * b - ux * c);
    ctx.closePath();
    ctx.fillStyle = C.ray;
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = unit;
    ctx.stroke();
  }
  function bead(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 3.2 * unit, 0, Math.PI * 2);
    ctx.fillStyle = '#fff7d6';
    ctx.fill();
  }
  /** A dashed line with a white halo, so it reads on the blue and on the table alike. */
  function dashed(x0, y0, x1, y1, color, alpha, width = 1.8) {
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'butt';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = (width + 2.6) * unit;
    ctx.stroke();
    ctx.setLineDash([7 * unit, 5 * unit]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * unit;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  /** The normal at point p: grows from p up and down as k goes 0 → 1. */
  function normalAt(p, k, alpha) {
    if (k <= 0) return;
    P(p.x, p.y + NORMAL_UP * k);
    const x0 = sx;
    const y0 = sy;
    P(p.x, p.y - NORMAL_DOWN * k);
    dashed(x0, y0, sx, sy, C.normal, alpha);
  }
  /** An angle's arc in the plane z = 0, round p, from the direction `fromDeg` to `toDeg` (0 = straight up, clockwise +). */
  function arc(p, fromDeg, toDeg, color, alpha) {
    const n = Math.max(6, Math.ceil(Math.abs(toDeg - fromDeg) / 3));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = ((fromDeg + ((toDeg - fromDeg) * i) / n) * Math.PI) / 180;
      P(p.x + ARC * Math.sin(a), p.y + ARC * Math.cos(a));
      pts.push(sx, sy);
    }
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    };
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    path();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 5 * unit;
    ctx.stroke();
    path();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4 * unit;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /** The wavefronts: short marks across the beam where the light's phase is whole, moving at v = c/n in each medium. */
  function fronts(alpha) {
    const g = v.geo;
    if (!g || alpha <= 0) return;
    const pts = g.points;
    // the optical length of each segment (its length × n): marks fall every LAMBDA of it
    const shift = (v.phase * SPEED) % LAMBDA;
    let opt0 = 0;
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    const reach = [v.inK, ...Array(pts.length - 2).fill(v.outK)];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const n = g.ns[i] ?? g.ns[g.ns.length - 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ux = (b.x - a.x) / len;
      const uy = (b.y - a.y) / len;
      const shown = len * (i === 0 ? v.inK : v.outK);
      const optLen = len * n;
      let k = Math.ceil((opt0 - shift) / LAMBDA);
      for (;;) {
        const opt = k * LAMBDA + shift - opt0;
        if (opt > optLen) break;
        k++;
        if (opt < 0) continue;
        const d = opt / n;
        if (d > shown || reach[i] <= 0) break;
        const cx = a.x + ux * d;
        const cy = a.y + uy * d;
        // across the beam, in the plane; clipped so a mark never crosses into the next medium
        let lo = -FRONT_HALF;
        let hi = FRONT_HALF;
        const py = ux; // the across direction is (−uy, ux)
        const top = a.y; // this medium's top boundary (the point it entered at)
        const bottom = b.y;
        if (i > 0 && Math.abs(py) > 1e-6) {
          const lim = (top - cy) / py;
          if (py > 0) hi = Math.min(hi, lim);
          else lo = Math.max(lo, lim);
        }
        if (i < pts.length - 2 && Math.abs(py) > 1e-6) {
          const lim = (bottom - cy) / py;
          if (py > 0) lo = Math.max(lo, lim);
          else hi = Math.min(hi, lim);
        }
        if (hi - lo < 0.15) continue;
        P(cx - uy * lo, cy + ux * lo);
        const x0 = sx;
        const y0 = sy;
        P(cx - uy * hi, cy + ux * hi);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = C.edge;
        ctx.lineWidth = 4.4 * unit;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = C.front;
        ctx.lineWidth = 2.4 * unit;
        ctx.stroke();
      }
      opt0 += optLen;
    }
    ctx.globalAlpha = 1;
  }
  /** The right angle between the upright plane and the top face (চিত্র ৯.০১'s 90°): an L and a small square. */
  function rightMark(k) {
    if (k <= 0) return;
    const { x, y } = v.rightAt;
    const L = 1.8;
    const q = 0.55;
    ctx.globalAlpha = k;
    const seg = (a, b) => {
      P(...a);
      const x0 = sx;
      const y0 = sy;
      P(...b);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 4.6 * unit;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = '#1d2733';
      ctx.lineWidth = 2 * unit;
      ctx.stroke();
    };
    seg([x, y, 0], [x, y + L, 0]);
    seg([x, y, 0], [x, y, L]);
    seg([x, y + q, 0], [x, y + q, q]);
    seg([x, y + q, q], [x, y, q]);
    ctx.globalAlpha = 1;
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const g = v.geo;
    if (!g) return;
    const pts = g.points;
    const last = pts.length - 1;
    // the normals and angles go under the rays
    if (v.normal0 > 0 && pts.length > 3) normalAt(pts[1], v.normal0, 0.55);
    const f = Math.min(v.focus, last - 1);
    const at = pts[f];
    normalAt(at, v.normal, 0.95);
    if (v.arcs > 0) {
      const t1 = g.angles[f - 1];
      const t2 = g.angles[f];
      // θ₁ between the normal above and the ray coming in (toward the light: up and to the left)
      arc(at, -t1, 0, C.t1, v.arcs);
      // θ₂ between the normal below and the ray going on (down and to the right)
      if (t2 != null) arc(at, 180 - t2, 180, C.t2, v.arcs);
    }
    rightMark(v.right);
    // the weak reflected ray: its strength from how much light reflects (more at a bigger angle, as the book says)
    if (v.reflK > 0) {
      const a = 0.28 + 0.9 * Math.sqrt(g.reflect);
      polyline([pts[1], g.reflected], 0, 1, v.reflK, 1.3 + 2.2 * Math.sqrt(g.reflect), Math.min(0.85, a), 0, 0.6);
    }
    // the rays inside: one after the other, as far as outK of their whole length
    if (v.outK > 0) {
      let total = 0;
      const lens = [];
      for (let i = 1; i < last; i++) {
        const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        lens.push(l);
        total += l;
      }
      let left = v.outK * total;
      for (let i = 1; i < last && left > 0; i++) {
        const l = lens[i - 1];
        const k = Math.min(1, left / l);
        polyline(pts, i, i + 1, k, 3 * (1 - 0.35 * g.reflect), 1, v.shine, i === last - 1 ? 0.55 : 0.6);
        left -= l;
      }
    }
    polyline(pts, 0, 1, v.inK, 3, 1, v.inK < 1 ? v.shine : 0, 0.5);
    fronts(v.march);
    // the point of incidence: a small white-hot mark
    if (v.inK >= 1) {
      P(pts[1].x, pts[1].y, pts[1].z);
      ctx.beginPath();
      ctx.arc(sx, sy, 2.8 * unit, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7d6';
      ctx.fill();
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 1.1 * unit;
      ctx.stroke();
    }
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along what is drawn, canvas px: a label keeps off them, so it never lies on what it names
  const pool = Array.from({ length: 96 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const out = [];
  let used = 0;
  function along(a, b, k) {
    if (k <= 0) return;
    P(a.x, a.y, a.z);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y, b.z);
    const n = Math.min(14, Math.ceil((Math.hypot(sx - x0, sy - y0) * k) / 18));
    for (let i = 0; i <= n && used < pool.length; i++) {
      const x = x0 + ((sx - x0) * k * i) / n;
      const y = y0 + ((sy - y0) * k * i) / n;
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
    const g = v.geo;
    if (!g) return out;
    const pts = g.points;
    along(pts[0], pts[1], v.inK);
    for (let i = 1; i < pts.length - 1; i++) along(pts[i], pts[i + 1], v.outK);
    along(pts[1], g.reflected, v.reflK);
    if (v.normal > 0) {
      const p = pts[Math.min(v.focus, pts.length - 2)];
      along({ x: p.x, y: p.y + NORMAL_UP, z: 0 }, { x: p.x, y: p.y - NORMAL_DOWN, z: 0 }, v.normal);
    }
    return out;
  }
  /** Canvas px of a scene point (for labels' leaders and tests). */
  function toScreen(p) {
    P(p.x, p.y, p.z ?? 0);
    return { x: sx, y: sy };
  }

  return { canvas, view: v, paint, boxes, toScreen, ARC, NORMAL_UP, NORMAL_DOWN };
}
