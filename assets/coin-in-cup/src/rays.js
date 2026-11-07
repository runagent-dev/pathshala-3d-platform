// The drawing over the 3D view, as in the sister figures of chapters 8 and 9: the light, the eye's line of sight, the
// normal, the angles, the straight line back to where the coin seems to be, and the eye itself are painted on a 2D
// canvas above the view, from the exact points of reading.js (in the plane of the rays, z = ZP) projected through the
// camera: even anti-aliased lines with a thin dark edge and small filled chevrons, at any size. Every ray comes from
// trace() (n₁ sin θ₁ = n₂ sin θ₂ at the water's surface), so what is drawn is the law itself.
import * as THREE from 'three';
import { EYE, RIM, ZP } from './reading.js';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  glow: '#ffe36e',
  normal: '#495057',
  t1: '#1971c2',
  t2: '#2b8a3e',
  sight: '#f8f9fa',
  stop: '#c92a2a',
  white: 'rgba(255,255,255,0.92)',
};
const ARC = 1.7; // cm: the radius of the angles' arcs
const NORMAL_UP = 3.4; // cm of the normal above the surface and below it
const NORMAL_DOWN = 3;

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'cc-draw';
  host.appendChild(canvas);
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
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
    unit = Math.max(0.85, Math.min(1.3, Math.min(w, h) / 380));
  }
  size();

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  /** Projects the point (x, y) of the plane of the rays to canvas px in sx, sy. */
  const P = (x, y, z = ZP) => {
    pv.set(x, y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
    return pv.z < 1;
  };

  // ── what is shown; the figure fills this in ───────────────────────────────────────────────────────────────
  const v = {
    geo: null, // trace(): points, visible, theta1, theta2, surface, image
    sightLine: null, // sightLine(): from, rim, to
    eye: 1, // the eye icon
    sight: 0, // the eye's line of sight past the rim (empty cup), 0 … 1
    ray: 0, // the light from the coin, 0 … 1 of its whole length
    shine: 0, // the glow at the eye when the light arrives
    normal: 0, // the normal at S, 0 … 1 (it grows from S)
    arcs: 0, // the angles' arcs
    showT2: true, // the arc of θ₂ (hidden in one question)
    back: 0, // the dashed line from S back to where the coin seems to be
    lit: 0, // the eye "sees": its iris lights up a little
    edgeGeo: null, // trace() from the coin's far edge: drawn thin while only the edge reaches the eye
    edge: 0,
  };

  function strokeLine(pts, width, color, edgeColor, alpha, dash) {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    };
    ctx.globalAlpha = alpha;
    ctx.lineCap = dash ? 'butt' : 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    if (edgeColor) {
      path();
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = (width + 1.8) * unit;
      ctx.stroke();
    }
    if (dash) ctx.setLineDash(dash.map((d) => d * unit));
    path();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * unit;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  /** The swept-back arrowhead of the sister figures, at x, y, along (dx, dy). */
  function chevron(x, y, dx, dy, length, alpha = 1) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = length * unit * 0.6;
    const b = length * unit * 0.4;
    const c = length * unit * 0.42;
    const n = length * unit * 0.12;
    ctx.globalAlpha = alpha;
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
    ctx.globalAlpha = 1;
  }

  /** The light: along the path points (plane coordinates) as far as k of its whole length, a chevron on each part. */
  const seg = new Float32Array(16);
  function light(points, k, width = 3, head = 13, glow = true) {
    if (k <= 0 || !points || points.length < 2) return { x: 0, y: 0, done: false };
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) total += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    let left = k * total;
    let n = 0;
    let lastX = 0;
    let lastY = 0;
    const heads = [];
    for (let i = 0; i < points.length - 1 && left > 0; i++) {
      const a = points[i];
      const b = points[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const f = Math.min(1, left / len);
      left -= len;
      P(a.x, a.y);
      const x0 = sx;
      const y0 = sy;
      P(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
      if (n === 0) {
        seg[0] = x0;
        seg[1] = y0;
        n = 2;
      }
      seg[n++] = sx;
      seg[n++] = sy;
      lastX = sx;
      lastY = sy;
      // a chevron half way along each part, once the light has passed it
      if (f >= 0.55) {
        P(b.x, b.y);
        heads.push([x0 + (sx - x0) * 0.5, y0 + (sy - y0) * 0.5, sx - x0, sy - y0]);
      }
    }
    if (glow && v.shine > 0) {
      strokeLine(seg.subarray(0, n), 9, C.glow, null, 0.35 * v.shine);
    }
    strokeLine(seg.subarray(0, n), width, C.ray, C.edge, 1);
    for (const [x, y, dx, dy] of heads) chevron(x, y, dx, dy, head);
    if (k < 1) {
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3.2 * unit, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7d6';
      ctx.fill();
    }
    return { x: lastX, y: lastY, done: k >= 1 };
  }

  /** Where the light is stopped by the wall: a short red bar across it. */
  function stopMark(p, from) {
    P(from.x, from.y);
    const ax = sx;
    const ay = sy;
    P(p.x, p.y);
    const l = Math.hypot(sx - ax, sy - ay) || 1;
    const nx = -(sy - ay) / l;
    const ny = (sx - ax) / l;
    const s = 8 * unit;
    const pts = [sx - nx * s, sy - ny * s, sx + nx * s, sy + ny * s];
    strokeLine(pts, 3.2, C.stop, '#ffffff', 1);
  }

  /** A dashed line with a white halo, so it reads on the blue and on the table alike. */
  function dashed(a, b, color, alpha, width = 1.8, k = 1) {
    if (k <= 0) return;
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
    const pts = [x0, y0, sx, sy];
    ctx.globalAlpha = alpha;
    strokeLine(pts, width + 2.6, 'rgba(255,255,255,0.55)', null, alpha);
    strokeLine(pts, width, color, null, alpha, [7, 5]);
  }

  /** An angle's arc in the plane of the rays round p, from `fromDeg` to `toDeg` (0 = straight up, clockwise +). */
  const arcPts = new Float32Array(2 * 64);
  function arc(p, fromDeg, toDeg, color, alpha) {
    const n = Math.min(31, Math.max(6, Math.ceil(Math.abs(toDeg - fromDeg) / 3)));
    for (let i = 0; i <= n; i++) {
      const a = ((fromDeg + ((toDeg - fromDeg) * i) / n) * Math.PI) / 180;
      P(p.x + ARC * Math.sin(a), p.y + ARC * Math.cos(a));
      arcPts[i * 2] = sx;
      arcPts[i * 2 + 1] = sy;
    }
    const pts = arcPts.subarray(0, (n + 1) * 2);
    strokeLine(pts, 5, C.white, null, alpha);
    strokeLine(pts, 2.6, color, null, alpha);
  }

  /** The eye, drawn as in the book: an eye seen from the side (lids, the white, the iris and pupil at the front, lashes,
   * a brow and a little skin round it; no face), looking along (dx, dy) on the screen, tipped at most 30° so it stays
   * upright. When the light arrives it glows softly round the eye. */
  function eye(x, y, dx, dy, alpha) {
    const s = unit * (Math.min(w, h) < 450 ? 1.3 : 1.1);
    const flip = dx < 0;
    const tilt = Math.max(-0.52, Math.min(0.52, Math.atan2(dy, Math.abs(dx))));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(flip ? -s : s, s);
    ctx.rotate(tilt);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (v.lit > 0) {
      const glow = ctx.createRadialGradient(4, -2, 4, 4, -2, 26);
      glow.addColorStop(0, 'rgba(255,227,110,0.85)');
      glow.addColorStop(1, 'rgba(255,227,110,0)');
      ctx.globalAlpha = alpha * v.lit;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(4, -2, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
    }
    // the skin of the lids and round the eye: a soft rounded patch, smaller than the eye's reach
    ctx.fillStyle = '#e9b994';
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.bezierCurveTo(-18, -14, -4, -24, 10, -21);
    ctx.bezierCurveTo(18, -19, 20, -10, 17, -3);
    ctx.bezierCurveTo(14, 9, 2, 13, -6, 12);
    ctx.bezierCurveTo(-12, 11, -15, 8, -16, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // the opening between the lids: open toward the front (+x)
    const opening = () => {
      ctx.beginPath();
      ctx.moveTo(-11, -1);
      ctx.bezierCurveTo(-4, -12, 8, -12, 14, -3);
      ctx.bezierCurveTo(9, 6, -2, 8, -11, -1);
      ctx.closePath();
    };
    opening();
    ctx.fillStyle = '#fbfbf8';
    ctx.fill();
    ctx.save();
    opening();
    ctx.clip();
    ctx.fillStyle = '#7a4a24';
    ctx.beginPath();
    ctx.ellipse(8.5, -3, 3.6, 6.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0e0f12';
    ctx.beginPath();
    ctx.ellipse(10, -3, 1.9, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(9.2, -5, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // the lids: a heavy upper lid, a fine lower one, the crease, three lashes; the brow above
    opening();
    ctx.strokeStyle = '#4a2d1c';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, -1);
    ctx.bezierCurveTo(-4, -12, 8, -12, 14, -3);
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, -9);
    ctx.bezierCurveTo(-2, -16, 7, -15, 12, -10);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(74,45,28,0.6)';
    ctx.stroke();
    ctx.beginPath();
    for (const [x0, y0, x1, y1] of [
      [6, -9.5, 8, -13.5],
      [9.5, -7.5, 12.5, -10.5],
      [12.5, -4.8, 16.5, -6.5],
    ]) {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    }
    ctx.strokeStyle = '#4a2d1c';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.bezierCurveTo(-3, -24, 8, -24, 15, -17);
    ctx.strokeStyle = '#5a3a24';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  const eyePt = { x: 0, y: 0 };
  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const g = v.geo;
    // the eye's line of sight past the rim (drawn from the eye outward)
    if (v.sight > 0 && v.sightLine) {
      const L = v.sightLine;
      dashed(L.from, L.to, C.sight, 0.95, 1.8, v.sight);
    }
    // the normal and the angles go under the rays
    if (g?.surface) {
      const S = g.surface;
      if (v.normal > 0) {
        dashed({ x: S.x, y: S.y }, { x: S.x, y: S.y + NORMAL_UP }, C.normal, 0.95, 1.8, v.normal);
        dashed({ x: S.x, y: S.y }, { x: S.x, y: S.y - NORMAL_DOWN }, C.normal, 0.95, 1.8, v.normal);
      }
      if (v.arcs > 0 && g.theta1 != null) {
        // θ₁ between the normal below and the ray coming up from the coin (down and to the right)
        arc(S, 180 - g.theta1, 180, C.t1, v.arcs);
        // θ₂ between the normal above and the ray going on to the eye (up and to the left)
        if (v.showT2) arc(S, -g.theta2, 0, C.t2, v.arcs);
      }
      if (v.back > 0 && g.image) dashed(S, g.image, C.ray, 1, 2, v.back);
    }
    // the thin light from the coin's far edge, when only that edge is seen
    if (v.edge > 0 && v.edgeGeo?.visible) light(v.edgeGeo.points, Math.min(v.ray, v.edge), 1.8, 10, false);
    if (g) {
      const end = light(g.points, v.ray);
      if (end.done && !g.visible) stopMark(g.points.at(-1), g.points.at(-2));
    }
    if (v.back > 0.98 && g?.image) {
      P(g.image.x, g.image.y);
      ctx.beginPath();
      ctx.arc(sx, sy, 3.4 * unit, 0, Math.PI * 2);
      ctx.fillStyle = C.ray;
      ctx.fill();
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 1.2 * unit;
      ctx.stroke();
    }
    // the eye, looking at the rim
    if (v.eye > 0) {
      P(EYE.x, EYE.y);
      eyePt.x = sx;
      eyePt.y = sy;
      P(RIM.x, RIM.y);
      eye(eyePt.x, eyePt.y, sx - eyePt.x, sy - eyePt.y, v.eye);
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
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
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
    if (v.sight > 0 && v.sightLine) along(v.sightLine.from, v.sightLine.to, v.sight);
    if (g && v.ray > 0) for (let i = 0; i < g.points.length - 1; i++) along(g.points[i], g.points[i + 1], 1);
    const e = v.edgeGeo;
    if (e?.visible && v.edge > 0) for (let i = 0; i < e.points.length - 1; i++) along(e.points[i], e.points[i + 1], 1);
    if (g?.surface && v.normal > 0) {
      const S = g.surface;
      along({ x: S.x, y: S.y + NORMAL_UP }, { x: S.x, y: S.y - NORMAL_DOWN }, v.normal);
    }
    if (g?.image && v.back > 0) along(g.surface, g.image, v.back);
    // the eye
    if (v.eye > 0 && used < pool.length) {
      P(EYE.x, EYE.y);
      const r = pool[used++];
      const s = 24 * unit * (Math.min(w, h) < 450 ? 1.3 : 1.1); // the eye icon's reach, as drawn
      r.left = sx - s;
      r.right = sx + s;
      r.top = sy - s;
      r.bottom = sy + s;
      out.push(r);
    }
    return out;
  }
  /** Canvas px of a point of the plane of the rays (for labels and tests). */
  function toScreen(p) {
    P(p.x, p.y, p.z ?? ZP);
    return { x: sx, y: sy };
  }

  return { canvas, view: v, paint, boxes, toScreen, ARC, NORMAL_UP };
}
