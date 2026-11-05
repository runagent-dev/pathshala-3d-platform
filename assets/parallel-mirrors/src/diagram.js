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
  handle: '#2c6fb0',
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
  const NO_DASH = [];
  const DASH_R = [9, 6];
  const DOTS = [1.6, 4.4];
  function line(ax, ay, bx, by, color, width, halo, haloWidth, dash = NO_DASH, alpha = 1) {
    P(ax, ay);
    const x0 = sx;
    const y0 = sy;
    P(bx, by);
    ctx.globalAlpha = alpha;
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
  /** The polyline of a ray, grown to the fraction k of its length. */
  function ray(points, k, lit) {
    let total = 0;
    for (let i = 1; i < points.length; i++) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    let left = total * Math.min(1, k);
    for (let i = 1; i < points.length && left > 0; i++) {
      const a = points[i - 1];
      const b = points[i];
      const long = Math.hypot(b.x - a.x, b.y - a.y);
      const q = Math.min(1, left / long);
      left -= long;
      const near = i === points.length - 1 ? 0.62 : 0.5;
      segment(a.x, a.y, a.x + (b.x - a.x) * q, a.y + (b.y - a.y) * q, near / Math.max(near, q), lit);
    }
  }
  /** The book's distance: a double arrow at height y, its two ends tied down by dotted lines. */
  function dimension(q) {
    const { x0, x1, y, k = 1, lit, drop0, drop1 } = q;
    const xe = x0 + (x1 - x0) * k;
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
    if (Math.hypot(bx - ax, by - ay) < 9) return;
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
  function knob(cx, cy) {
    const r = 13 * unit;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = C.handle;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4 * unit;
    ctx.stroke();
    const a = r * 0.58;
    ctx.lineWidth = 2 * unit;
    ctx.beginPath();
    ctx.moveTo(cx - a, cy);
    ctx.lineTo(cx + a, cy);
    for (const s of [-1, 1]) {
      const tx = cx + s * a;
      ctx.moveTo(tx - s * a * 0.55, cy - a * 0.5);
      ctx.lineTo(tx, cy);
      ctx.lineTo(tx - s * a * 0.55, cy + a * 0.5);
    }
    ctx.stroke();
    return { x: cx, y: cy };
  }

  // ── what is shown: a plain description the figure fills in ──────────────────────────────────────────────────
  const v = {
    dims: [], // { x0, x1, y, k, lit, drop0, drop1 }
    ray: null, // { points, k, lit }
    backs: [], // dashed: { x0, y0, x1, y1, k, lit }
    eye: null, // { x, y, tx, ty }
    points: [], // [x, y, radius, colour]
    spots: [], // the test's places on the table: [x, z]
    drag: { candle: null }, // { x }
    flash: 0,
  };
  const handles = { candle: null };

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const q of v.dims) dimension(q);
    for (const q of v.spots) spot(q[0], q[1]);
    for (const b of v.backs) {
      const k = Math.min(1, b.k ?? 1);
      if (k <= 0) continue;
      const xe = b.x0 + (b.x1 - b.x0) * k;
      const ye = b.y0 + (b.y1 - b.y0) * k;
      if (b.lit) glowLine(b.x0, b.y0, xe, ye);
      line(b.x0, b.y0, xe, ye, C.ray, 2.1, C.rayDark, 3.1, DASH_R);
    }
    if (v.ray) ray(v.ray.points, v.ray.k, v.ray.lit);
    for (const p of v.points) dot(p[0], p[1], p[2], p[3]);
    if (v.eye) eye(v.eye);
    if (v.drag.candle) {
      P(v.drag.candle.x, 0, 13);
      handles.candle = knob(sx, sy);
    } else handles.candle = null;
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  return {
    canvas,
    view: v,
    handles,
    clear() {
      Object.assign(v, { ray: null, eye: null, flash: 0 });
      v.dims.length = 0;
      v.backs.length = 0;
      v.points.length = 0;
      v.spots.length = 0;
      v.drag.candle = null;
    },
    paint,
  };
}
