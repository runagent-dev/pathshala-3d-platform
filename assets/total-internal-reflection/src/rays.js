// The drawing over the 3D view, in the style of the chapter's sister figures (reflection-amount, the mirror figures):
// nothing here is a 3D object. The light, the normal and the angles are painted on a 2D canvas above the view from the
// exact points of reading.js (Snell's law at O, the curved faces crossed along radii), projected through the camera:
// even lines with a dark edge and small filled chevrons. A ray is as wide as the share of the light it carries
// (Fresnel), never thinner than a line that can be seen; a thin one fades instead.
import * as THREE from 'three';
import { points, prismPath, Z_RAY } from './reading.js';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  normal: '#495057',
  ti: '#1971c2', // θ₂, the angle in the dense medium (the angle of incidence)
  tr: '#2b8a3e', // θ₁, the angle in the light medium (the angle of refraction)
};
const FULL = 6.5; // the incoming ray, px
const THINNEST = 1.4;
const ARC_IN = 2.7; // the radius of the angles, cm
const ARC_OUT = 3.2;
const NORMAL = 8.6; // the normal, cm each side of O
const DASH = [7, 5];
const NO_DASH = [];

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'tir-draw';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
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
  let sx = 0;
  let sy = 0;
  const P = (x, y) => {
    pv.set(x, y, Z_RAY).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };

  /**
   * What is drawn. theta, outside: the light now. light: 0…2 (0–1 the incoming ray grows from the slit to O, 1–2 the
   * rays leaving O grow). normal, arcs, labels 0…1. prism: the prism's light instead of the block's.
   */
  const v = { show: true, theta: 30, outside: 'air', light: 0, normal: 0, arcs: 0, prism: false, dim: 1, piece: 1 };
  let unit = 1;
  /** The geometry now (recomputed when theta or outside change). */
  let geo = points(30, 'air');
  let key = '';
  const PR = prismPath();
  function sync() {
    const k = `${v.theta}|${v.outside}`;
    if (k !== key) {
      key = k;
      geo = points(v.theta, v.outside);
    }
    return geo;
  }

  function seg(a, b, k, width, alpha, chevron) {
    if (k <= 0) return;
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
    const x1 = sx;
    const y1 = sy;
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = width + 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = C.ray;
    ctx.lineWidth = width;
    ctx.stroke();
    if (chevron != null && k >= chevron) {
      P(a.x + (b.x - a.x) * chevron, a.y + (b.y - a.y) * chevron);
      arrowhead(sx, sy, x1 - x0, y1 - y0, 9 + width * 1.15);
    }
    ctx.globalAlpha = 1;
  }
  function arrowhead(x, y, dx, dy, length) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const L = length * unit;
    const a = L * 0.6;
    const b = L * 0.4;
    const c = L * 0.42;
    const n = L * 0.12;
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
  }
  /** A polyline of world points, drawn as far as k (0…1 of its length), a chevron at `at` of the whole. */
  const lens = [];
  function path(pts, k, width, alpha, at) {
    if (k <= 0) return;
    lens.length = 0;
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      lens.push(l);
      total += l;
    }
    let left = k * total;
    let done = 0;
    for (let i = 1; i < pts.length && left > 0; i++) {
      const l = lens[i - 1];
      const part = Math.min(1, left / l);
      // the chevron sits on the segment that holds `at` of the whole length
      const chev = at * total >= done && at * total <= done + l ? (at * total - done) / l : null;
      seg(pts[i - 1], pts[i], part, width, alpha, chev);
      left -= l;
      done += l;
    }
  }
  const widthOf = (share) => Math.max(THINNEST, FULL * share);
  const alphaOf = (share) => Math.min(1, Math.max(0.55, (FULL * share) / THINNEST));

  function dashed(a, b, color, alpha = 1) {
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(sx, sy);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3.8;
    ctx.stroke();
    ctx.setLineDash(DASH);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(sx, sy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.9;
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.globalAlpha = 1;
  }
  /** An angle at O: from the direction `from` (degrees, measured from +x, counter-clockwise) through `sweep` degrees. */
  function arc(from, sweep, r, color) {
    const N = Math.max(6, Math.ceil(Math.abs(sweep) / 4));
    const a0 = (from * Math.PI) / 180;
    const da = (sweep * Math.PI) / 180 / N;
    ctx.beginPath();
    P(0, 0);
    ctx.moveTo(sx, sy);
    for (let i = 0; i <= N; i++) {
      P(r * Math.cos(a0 + da * i), r * Math.sin(a0 + da * i));
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      P(r * Math.cos(a0 + da * i), r * Math.sin(a0 + da * i));
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.6;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.1;
    ctx.stroke();
  }

  function paintBlock() {
    const g = sync();
    const into = Math.min(1, v.light);
    const out = Math.max(0, Math.min(1, v.light - 1));
    if (v.normal > 0 && v.piece > 0.99) dashed({ x: 0, y: -NORMAL * v.normal }, { x: 0, y: NORMAL * v.normal }, C.normal);
    if (v.arcs > 0) {
      const a = g.theta2 * v.arcs;
      // θ₂ between the downward normal (−90°) and the incoming ray (toward the lower left)
      if (into >= 1) arc(-90, -a, ARC_IN, C.ti);
      // the reflected ray makes the same θ₂ on the other side
      if (out > 0.4) arc(-90, a, ARC_IN * 0.78, C.ti);
      if (out > 0.4 && g.theta1 != null) arc(90, -g.theta1 * v.arcs, ARC_OUT, C.tr);
    }
    // the incoming ray: from the slit, through the air, into the curved face (along a radius: no bending), on to O
    path([g.slit, g.entry, g.o], into, FULL * v.dim, v.dim, 0.75);
    if (out > 0) {
      // the reflected ray: weak below θc, all of the light from θc on
      path([g.o, g.reflExit, g.reflEnd], out, widthOf(g.R) * v.dim, alphaOf(g.R) * v.dim, 0.42);
      // the refracted ray (along the surface at θc), as wide as the light that leaves
      if (g.theta1 != null) {
        const end = g.refrEnd;
        path([g.o, end], out, widthOf(g.T), alphaOf(g.T) * v.dim, g.theta1 > 89 ? 0.62 : 0.48);
      }
    }
    if (into > 0.98) dot(0, 0);
  }
  function paintPrism() {
    const p = PR;
    const into = Math.min(1, v.light);
    const out = Math.max(0, Math.min(1, v.light - 1));
    if (v.normal > 0 && v.piece > 0.99) {
      const r = 4 * v.normal;
      dashed({ x: r * Math.SQRT1_2, y: -r * Math.SQRT1_2 }, { x: -r * Math.SQRT1_2, y: r * Math.SQRT1_2 }, C.normal);
    }
    if (v.arcs > 0 && into >= 1) {
      // 45° each side of the long face's normal (which points down-right, into the glass)
      arc(-90, 45 * v.arcs, 1.9, C.ti);
      if (out > 0.3) arc(0, -45 * v.arcs, 1.9, C.ti);
    }
    path([p.slit, p.enter, p.o], into, FULL * v.dim, v.dim, 0.55);
    if (out > 0) path([p.o, p.exit, p.end], out, FULL * v.dim, v.dim, 0.42);
    if (into > 0.98) dot(0, 0);
  }
  function dot(x, y) {
    P(x, y);
    ctx.beginPath();
    ctx.arc(sx, sy, 3 * unit, 0, Math.PI * 2);
    ctx.fillStyle = '#fff7d6';
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!v.show) return;
    unit = Math.max(0.9, Math.min(1.25, Math.min(w, h) / 400));
    if (v.prism) paintPrism();
    else paintBlock();
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  /** Where a point of the plane of the light is on the view (canvas px). */
  const at = { x: 0, y: 0 };
  const screen = (x, y) => {
    P(x, y);
    at.x = sx;
    at.y = sy;
    return at;
  };
  // boxes along the rays and the normal (canvas px), for the labels to keep off
  const pool = Array.from({ length: 90 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const outBoxes = [];
  let used = 0;
  function along(a, b) {
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    const n = Math.min(14, Math.ceil(Math.hypot(sx - x0, sy - y0) / 20));
    for (let i = 0; i <= n && used < pool.length; i++) {
      const r = pool[used++];
      const x = x0 + ((sx - x0) * i) / n;
      const y = y0 + ((sy - y0) * i) / n;
      r.left = x - 6;
      r.right = x + 6;
      r.top = y - 6;
      r.bottom = y + 6;
      outBoxes.push(r);
    }
  }
  function boxes() {
    outBoxes.length = 0;
    used = 0;
    if (!v.show) return outBoxes;
    if (v.prism) {
      if (v.light > 0) along(PR.slit, PR.o);
      if (v.light > 1) along(PR.o, PR.end);
      return outBoxes;
    }
    const g = sync();
    if (v.light > 0) along(g.slit, g.o);
    if (v.light > 1) {
      along(g.o, g.reflEnd);
      if (g.theta1 != null) along(g.o, g.refrEnd);
    }
    if (v.normal > 0) along({ x: 0, y: -NORMAL }, { x: 0, y: NORMAL });
    return outBoxes;
  }

  return { canvas, view: v, paint, boxes, screen, geometry: sync };
}
