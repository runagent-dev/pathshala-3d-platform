// The drawing over the 3D view, in the style of the sister figures reflection-laws and plane-mirror-image: a 2D canvas above
// the view, painted from exact 3D points projected through the camera, so lines are anti-aliased and of a constant width at
// any size. All of it lies in the plane of the picture, z = 0, where the book draws it. A real ray is solid amber with a thin
// dark halo and clean filled arrowheads; where a ray only seems to come from, dashed amber; the book's distances are thin
// light double arrows standing above the candles, each tied to what it measures by a dotted line. Every number comes from
// reading.js.
import * as THREE from 'three';

export const C = {
  ray: '#f59f00',
  rayDark: '#5f3400',
  dim: '#f2f6fb',
  dimDark: '#1c2a38',
  ink: '#212529',
  glow: '#ffd43b',
};

export function createDiagram({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pm2-draw';
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
    unit = Math.max(1, Math.min(1.12, Math.min(w, h) / 460));
  }
  size();
  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  /** Projects a scene point into sx, sy (canvas pixels). */
  function P(x, y, z = 0) {
    pv.set(x, y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  }
  let fade = 1; // everything being drawn now is this faint
  const NO_DASH = [];
  const DASH_R = [9, 6];
  const DOTS = [1.6, 4.4];
  const TRACK_DASH = [7, 6];
  function line(ax, ay, bx, by, color, width, halo, haloWidth, dash = NO_DASH, alpha = 1) {
    P(ax, ay);
    const x0 = sx;
    const y0 = sy;
    P(bx, by);
    ctx.globalAlpha = alpha * fade;
    ctx.setLineDash(dash);
    ctx.lineCap = dash.length ? 'butt' : 'round';
    if (halo) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = halo;
      ctx.lineWidth = haloWidth * unit;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(sx, sy);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * unit;
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.globalAlpha = 1;
  }
  function chevron(x, y, dx, dy, length, color, edge) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = length * unit * 0.6;
    const b = length * unit * 0.4;
    const c = length * unit * 0.42;
    const n = length * unit * 0.12;
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.moveTo(x + ux * a, y + uy * a);
    ctx.lineTo(x - ux * b - uy * c, y - uy * b + ux * c);
    ctx.lineTo(x - ux * n, y - uy * n);
    ctx.lineTo(x - ux * b + uy * c, y - uy * b - ux * c);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1 * unit;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function dot(x, y, radius, color, ring = '#ffffff', z = 0) {
    P(x, y, z);
    ctx.beginPath();
    ctx.arc(sx, sy, radius * unit, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = ring;
    ctx.lineWidth = 1.6 * unit;
    ctx.stroke();
  }
  function glowLine(ax, ay, bx, by, width = 11) {
    if (v.flash <= 0) return;
    line(ax, ay, bx, by, C.glow, width, null, 0, NO_DASH, 0.55 * v.flash);
  }
  /** One straight stretch of the ray, with its arrowhead at the fraction t. */
  function segment(ax, ay, bx, by, t, lit) {
    if (lit) glowLine(ax, ay, bx, by);
    line(ax, ay, bx, by, C.ray, 2.3, C.rayDark, 3.3);
    P(ax + (bx - ax) * t, ay + (by - ay) * t);
    const mx = sx;
    const my = sy;
    P(ax + (bx - ax) * (t + 0.04), ay + (by - ay) * (t + 0.04));
    chevron(mx, my, sx - mx, sy - my, 11, C.ray, C.rayDark);
  }
  /** The polyline of a ray, grown to k segments: each straight stretch takes the same time, whatever its length. */
  function ray(points, k, lit) {
    for (let i = 1; i < points.length && k > i - 1; i++) {
      const a = points[i - 1];
      const b = points[i];
      const q = Math.min(1, k - (i - 1));
      const near = i === points.length - 1 ? 0.62 : 0.5;
      segment(a.x, a.y, a.x + (b.x - a.x) * q, a.y + (b.y - a.y) * q, near / Math.max(near, q), lit);
    }
  }
  /** The book's distance: a double arrow at height y, its two ends tied down by dotted lines. */
  function dimension(q) {
    const { x0, x1, y, k = 1, lit, drop0, drop1, a = 1 } = q;
    const xe = x0 + (x1 - x0) * k;
    fade = a;
    if (drop0 != null) line(x0, y, x0, drop0, C.dim, 1.2, C.dimDark, 2.4, DOTS, 0.9);
    if (drop1 != null && k >= 1) line(x1, y, x1, drop1, C.dim, 1.2, C.dimDark, 2.4, DOTS, 0.9);
    if (lit) glowLine(x0, y, xe, y, 10);
    line(x0, y, xe, y, C.dim, 1.8, C.dimDark, 3.4);
    P(x0, y);
    const ax = sx;
    const ay = sy;
    P(xe, y);
    const bx = sx;
    const by = sy;
    if (Math.hypot(bx - ax, by - ay) < 9) {
      fade = 1;
      return;
    }
    chevron(
      ax + ((bx - ax) / Math.hypot(bx - ax, by - ay)) * 5,
      ay + ((by - ay) / Math.hypot(bx - ax, by - ay)) * 5,
      ax - bx,
      ay - by,
      10,
      C.dim,
      C.dimDark,
    );
    chevron(
      bx - ((bx - ax) / Math.hypot(bx - ax, by - ay)) * 5,
      by - ((by - ay) / Math.hypot(bx - ax, by - ay)) * 5,
      bx - ax,
      by - ay,
      10,
      C.dim,
      C.dimDark,
    );
    fade = 1;
  }
  /** A soft glow round a whole image: this one is an object now. */
  function halo(q) {
    P(q.x, q.y);
    const cx = sx;
    const cy = sy;
    P(q.x, q.y + q.r);
    const r = Math.max(24, Math.abs(sy - cy));
    const g = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
    g.addColorStop(0, 'rgba(255, 212, 59, 0.62)');
    g.addColorStop(0.55, 'rgba(255, 190, 40, 0.26)');
    g.addColorStop(1, 'rgba(255, 170, 20, 0)');
    ctx.globalAlpha = q.k;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  /** Where the candle can go: a faint dashed line on the table, with its two ends marked. */
  function track(q) {
    P(q.x0, 0.05, q.z);
    const x0 = sx;
    const y0 = sy + q.dy;
    P(q.x1, 0.05, q.z);
    const x1 = sx;
    const y1 = sy + q.dy;
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = (-(y1 - y0) / l) * 6;
    const ny = ((x1 - x0) / l) * 6;
    ctx.lineCap = 'butt';
    for (const [colour, width, dash] of [
      ['rgba(16, 24, 32, 0.55)', 3.6, TRACK_DASH],
      ['rgba(255, 255, 255, 0.9)', 1.7, TRACK_DASH],
    ]) {
      ctx.setLineDash(dash);
      ctx.strokeStyle = colour;
      ctx.lineWidth = width * unit;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash(NO_DASH);
      ctx.beginPath();
      ctx.moveTo(x0 - nx, y0 - ny);
      ctx.lineTo(x0 + nx, y0 + ny);
      ctx.moveTo(x1 - nx, y1 - ny);
      ctx.lineTo(x1 + nx, y1 + ny);
      ctx.stroke();
    }
    ctx.lineCap = 'round';
  }
  /** A small eye, looking along (dx, dy) on the screen: an almond with an iris, drawn in vector. */
  function eye(q) {
    P(q.x, q.y);
    const cx = sx;
    const cy = sy;
    P(q.tx, q.ty);
    const a = Math.atan2(sy - cy, sx - cx);
    const r = 11.5 * unit;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(0, -r * 1.04, r, 0);
    ctx.quadraticCurveTo(0, r * 1.04, -r, 0);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.7 * unit;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.26, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#2c6fb0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.3, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#10171f';
    ctx.fill();
    ctx.restore();
  }
  /** A place on the table in the test: a ring and a cross on the wood. */
  function spot(x, z) {
    P(x, 0.05, z);
    const cx = sx;
    const cy = sy;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 9 * unit, 4.5 * unit, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * unit;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
  }
  // ── what is shown: a plain description the figure fills in ──────────────────────────────────────────────────
  const v = {
    dims: [], // { x0, x1, y, k, lit, drop0, drop1 }
    ray: null, // { points, k, lit, a }: k counts the straight stretches drawn so far
    halo: null, // { x, y, r, k }
    track: null, // { x0, x1, z, dy }: dy in pixels, down the screen
    backs: [], // dashed: { x0, y0, x1, y1, k, lit }
    eye: null, // { x, y, tx, ty }
    aim: null, // the image a ray is traced to: { x, y }
    points: [], // [x, y, radius, colour]
    spots: [], // the test's places on the table: [x, z]
    flash: 0,
  };

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (v.track) track(v.track);
    if (v.halo) halo(v.halo);
    for (const q of v.dims) dimension(q);
    for (const q of v.spots) spot(q[0], q[1]);
    fade = v.ray?.a ?? 1;
    for (const b of v.backs) {
      const k = Math.min(1, b.k ?? 1);
      if (k <= 0) continue;
      const xe = b.x0 + (b.x1 - b.x0) * k;
      const ye = b.y0 + (b.y1 - b.y0) * k;
      if (b.lit) glowLine(b.x0, b.y0, xe, ye);
      line(b.x0, b.y0, xe, ye, C.ray, 2.1, C.rayDark, 3.1, DASH_R);
    }
    if (v.ray) ray(v.ray.points, v.ray.k, v.ray.lit);
    fade = 1;
    for (const p of v.points) dot(p[0], p[1], p[2], p[3]);
    if (v.aim) {
      P(v.aim.x, v.aim.y);
      ctx.beginPath();
      ctx.arc(sx, sy, 13 * unit, 0, Math.PI * 2);
      ctx.strokeStyle = C.rayDark;
      ctx.lineWidth = 3.8 * unit;
      ctx.stroke();
      ctx.strokeStyle = C.ray;
      ctx.lineWidth = 2.3 * unit;
      ctx.stroke();
    }
    if (v.eye) eye(v.eye);
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  return {
    canvas,
    view: v,
    clear() {
      Object.assign(v, { ray: null, halo: null, eye: null, aim: null, flash: 0 });
      v.dims.length = 0;
      v.backs.length = 0;
      v.points.length = 0;
      v.spots.length = 0;
    },
    paint,
  };
}
