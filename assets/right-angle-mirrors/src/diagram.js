// The drawing over the 3D view, in the style of reflection-laws, plane-mirror-image and parallel-mirrors: a 2D canvas above the
// view, painted from exact 3D points projected through the camera, so lines are anti-aliased and of a constant width at any
// size. A real ray is solid amber with a thin dark halo and clean filled arrowheads; where a ray only seems to come from,
// dashed amber. Every point comes from reading.js.
import * as THREE from 'three';

export const C = {
  ray: '#f59f00',
  rayDark: '#5f3400',
  ink: '#212529',
  line: '#f2f6fb',
  lineDark: '#1c2a38',
  handle: '#2c6fb0',
  glow: '#ffd43b',
};

export function createDiagram({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ra-draw';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  // the handle's gentle pulse is CSS, so that it never asks the 3D view for a frame
  const pulse = document.createElement('div');
  pulse.className = 'ra-pulse';
  pulse.hidden = true;
  host.appendChild(pulse);
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
  function P(x, y, z) {
    pv.set(x, y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  }
  const NO_DASH = [];
  const DASH_R = [9, 6];
  const DASH_L = [7, 6];
  const DASH_T = [5, 6];
  function stroke(ax, ay, bx, by, color, width, halo, haloWidth, dash, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);
    ctx.lineCap = dash.length ? 'butt' : 'round';
    if (halo) {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = halo;
      ctx.lineWidth = haloWidth * unit;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * unit;
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.globalAlpha = 1;
  }
  function line(a, b, color, width, halo, haloWidth, dash = NO_DASH, alpha = 1) {
    P(a.x, a.y, a.z);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y, b.z);
    stroke(x0, y0, sx, sy, color, width, halo, haloWidth, dash, alpha);
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
  function dot(p, radius, color, ring = '#ffffff') {
    P(p.x, p.y, p.z);
    ctx.beginPath();
    ctx.arc(sx, sy, radius * unit, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = ring;
    ctx.lineWidth = 1.6 * unit;
    ctx.stroke();
  }
  const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k });
  /** One straight stretch of the ray, with its arrowhead at the fraction t. */
  function segment(a, b, t, lit) {
    if (lit && v.flash > 0) line(a, b, C.glow, 11, null, 0, NO_DASH, 0.55 * v.flash);
    line(a, b, C.ray, 2.4, C.rayDark, 3.6);
    const m = lerp(a, b, t);
    P(m.x, m.y, m.z);
    const mx = sx;
    const my = sy;
    const n = lerp(a, b, t + 0.04);
    P(n.x, n.y, n.z);
    chevron(mx, my, sx - mx, sy - my, 12, C.ray, C.rayDark);
  }
  /** The polyline of a ray, each stretch grown to its own fraction ks[i]; the one growing glows. */
  function ray(points, ks) {
    for (let i = 1; i < points.length; i++) {
      const q = ks[i - 1];
      if (q <= 0) continue;
      const a = points[i - 1];
      segment(a, lerp(a, points[i], q), 0.55 / Math.max(0.55, q), q < 1);
    }
  }
  /** A small eye, looking toward t: an almond with an iris, drawn in vector. */
  function eye(q) {
    P(q.x, q.y, q.z);
    const cx = sx;
    const cy = sy;
    P(q.tx, q.ty, q.tz);
    const a = Math.atan2(sy - cy, sx - cx);
    const r = 12 * unit;
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
  /** The angle between the mirrors on the floor at O: an arc, or the square mark of a right angle. */
  function corner(q) {
    const { a, b, r } = q;
    const y = 0.012;
    ctx.beginPath();
    if (q.right) {
      P(a.x * r, y, a.z * r);
      ctx.moveTo(sx, sy);
      P((a.x + b.x) * r, y, (a.z + b.z) * r);
      ctx.lineTo(sx, sy);
      P(b.x * r, y, b.z * r);
      ctx.lineTo(sx, sy);
    } else {
      const a0 = Math.atan2(a.x, a.z);
      const a1 = Math.atan2(b.x, b.z);
      for (let i = 0; i <= 24; i++) {
        const t = a0 + ((a1 - a0) * i) / 24;
        P(Math.sin(t) * r, y, Math.cos(t) * r);
        if (i) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      }
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = C.lineDark;
    ctx.lineWidth = 5 * unit;
    ctx.stroke();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2.6 * unit;
    ctx.stroke();
  }
  /** A place on the floor in the test: a white ring. */
  function spot(p) {
    P(p.x, 0.02, p.z);
    ctx.beginPath();
    ctx.ellipse(sx, sy, 13 * unit, 11 * unit, 0, 0, Math.PI * 2);
    ctx.strokeStyle = C.lineDark;
    ctx.lineWidth = 4 * unit;
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2 * unit;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
  }
  /** The handle's range: a faint dashed arc at its own height, a small dot at each end. */
  function track(q) {
    const n = 24;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = q.at(q.from + ((q.to - q.from) * i) / n);
      P(p.x, p.y, p.z);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    }
    ctx.lineCap = 'butt';
    ctx.setLineDash(DASH_T);
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = C.lineDark;
    ctx.lineWidth = 3.4 * unit;
    ctx.stroke();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.8 * unit;
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.globalAlpha = 1;
    for (const a of [q.from, q.to]) dot(q.at(a), 2.6, C.line, C.lineDark);
  }
  /** The handle: a white disc, a thin dark ring, and arrows along the way it goes on the screen. */
  function handle(q) {
    const before = q.at(q.alpha + (q.alpha < 170 ? 6 : -6));
    P(before.x, before.y, before.z);
    const bx = sx;
    const by = sy;
    const here = q.at(q.alpha);
    P(here.x, here.y, here.z);
    const cx = sx;
    const cy = sy;
    const r = (q.calm ? 13.5 : 15.5) * unit;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5 * unit;
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    let a = Math.atan2(by - cy, bx - cx);
    if (Math.cos(a) < 0) a += Math.PI;
    ctx.rotate(a);
    const w = r * 0.66;
    const h = r * 0.34;
    ctx.strokeStyle = C.ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.1 * unit;
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(w, 0);
    for (const s of [-1, 1]) {
      ctx.moveTo(s * (w - h), -h);
      ctx.lineTo(s * w, 0);
      ctx.lineTo(s * (w - h), h);
    }
    ctx.stroke();
    ctx.restore();
    pulse.hidden = !q.pulse;
    if (q.pulse) pulse.style.transform = `translate(${cx}px, ${cy}px)`;
    return { x: cx, y: cy };
  }

  // ── what is shown: a plain description the figure fills in ──────────────────────────────────────────────────
  const v = {
    axes: [], // the mirrors' lines carried on past O, dashed: { a, b, k }
    ray: null, // { points, ks: how far each stretch has grown }
    backs: [], // dashed: { a, b, k, lit }
    eye: null, // { x, y, z, tx, ty, tz }
    corner: null, // { a, b, r, right }
    points: [], // [{ x, y, z }, radius, colour]
    spots: [], // the test's places on the floor
    fold: null, // the handle and its range: { at(α), from, to, alpha, calm, pulse }
    flash: 0,
  };
  const handles = { fold: null };

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const q of v.axes) line(q.a, lerp(q.a, q.b, q.k ?? 1), C.line, 2, C.lineDark, 3.6, DASH_L);
    if (v.corner) corner(v.corner);
    for (const q of v.spots) spot(q);
    for (const b of v.backs) {
      const k = Math.min(1, b.k ?? 1);
      if (k <= 0) continue;
      const e = lerp(b.a, b.b, k);
      if (b.lit && v.flash > 0) line(b.a, e, C.glow, 11, null, 0, NO_DASH, 0.55 * v.flash);
      line(b.a, e, C.ray, 2.2, C.rayDark, 3.4, DASH_R);
    }
    if (v.ray) ray(v.ray.points, v.ray.ks);
    for (const p of v.points) dot(p[0], p[1], p[2]);
    if (v.eye) eye(v.eye);
    if (v.fold) {
      track(v.fold);
      handles.fold = handle(v.fold);
    } else {
      handles.fold = null;
      pulse.hidden = true;
    }
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  return {
    canvas,
    view: v,
    handles,
    clear() {
      Object.assign(v, { ray: null, eye: null, corner: null, fold: null, flash: 0 });
      v.axes.length = 0;
      v.backs.length = 0;
      v.points.length = 0;
      v.spots.length = 0;
    },
    paint,
  };
}
