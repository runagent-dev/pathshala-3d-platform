// The drawing over the 3D view, in the crisp style of the chapter's other figures: rays, the bow-tie of light they make, the
// distance bars and the length bars, painted on a 2D canvas from exact 3D points through the camera, so a line is even and
// sharp at any size. Nothing here is a 3D object; everything is read from reading.js.
import * as THREE from 'three';
import { FLAME, HOLE_Y, imageSide, points, RAIL_BAR, U, V } from './reading.js';

const BAR_Z = 2.2; // beside the flame, on the side away from the rays
export const C = { ray: '#f59f00', edge: '#5f3400', glow: '#ffe36e', bar: '#f1f3f5', barEdge: '#16202b', mark: '#ffd43b' };

export function createDiagram({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ph-draw';
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
  }
  size();

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  const P = (x, y, z) => {
    pv.set(x, y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };
  const Q = (p) => P(p.x, p.y, p.z);

  // ── what is shown; the figure fills this in ───────────────────────────────────────────────────────────────
  const v = {
    u: U.start,
    v: V.start,
    d: 0, // the hole's real diameter, cm
    x: { k: 0, shine: 0 }, // the ray from X: 0 … 1 along its whole way
    y: { k: 0, shine: 0 },
    fan: 0, // the bow-tie between the two rays
    spread: 0, // the wide hole: the light from X and Y as bundles
    pulse: -1, // the first light on its way, 0 … 1, −1 for none
    bars: 0, // the distance bars
    lengths: 0, // the lengths l and l′
    imageLength: true, // l′ too
    point: 0, // the hole as a bright point
    marks: [], // the test's marks on the paper: { y, tag }
  };

  function line(x0, y0, x1, y1) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
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
  /** One ray: from a through the hole o to b, drawn as far as k of the whole way, its chevrons at the middle of each part. */
  function ray(a, o, b, r) {
    if (r.k <= 0) return;
    Q(a);
    const x0 = sx;
    const y0 = sy;
    Q(o);
    const x1 = sx;
    const y1 = sy;
    Q(b);
    const x2 = sx;
    const y2 = sy;
    const l1 = Math.hypot(x1 - x0, y1 - y0);
    const l2 = Math.hypot(x2 - x1, y2 - y1);
    const reach = r.half ? l1 : (l1 + l2) * r.k; // half: it has come only as far as the hole
    const past = reach > l1;
    const ex = past ? x1 + ((x2 - x1) * (reach - l1)) / l2 : x0 + ((x1 - x0) * reach) / l1;
    const ey = past ? y1 + ((y2 - y1) * (reach - l1)) / l2 : y0 + ((y1 - y0) * reach) / l1;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      if (past) ctx.lineTo(x1, y1);
      ctx.lineTo(ex, ey);
    };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (r.shine > 0) {
      path();
      ctx.globalAlpha = 0.32 * r.shine;
      ctx.strokeStyle = C.glow;
      ctx.lineWidth = 15 * unit;
      ctx.stroke();
      path();
      ctx.globalAlpha = 0.8 * r.shine;
      ctx.lineWidth = 7 * unit;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 1 - 0.72 * v.spread; // a wide hole: the bundle is what matters, not one line
    path();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 4.2 * unit;
    ctx.stroke();
    path();
    ctx.strokeStyle = C.ray;
    ctx.lineWidth = 2.6 * unit;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (v.spread > 0.5) return;
    if (reach > l1 * 0.56) chevron(x0 + (x1 - x0) * 0.52, y0 + (y1 - y0) * 0.52, x1 - x0, y1 - y0, 13);
    if (reach > l1 + l2 * 0.6) chevron(x1 + (x2 - x1) * 0.55, y1 + (y2 - y1) * 0.55, x2 - x1, y2 - y1, 13);
    if (r.k < 1 || r.half) {
      ctx.beginPath();
      ctx.arc(ex, ey, 3.2 * unit, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7d6';
      ctx.fill();
    }
    // where it lands
    if (r.k >= 1 && !r.half) {
      ctx.beginPath();
      ctx.arc(x2, y2, 3 * unit, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7d6';
      ctx.fill();
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 1.1 * unit;
      ctx.stroke();
    }
  }
  function polygon(list, alpha, fill = C.ray) {
    ctx.beginPath();
    list.forEach((p, i) => {
      Q(p);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    });
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  /** The bundle from one point of the flame through a wide hole: it lands as a patch, not a point. */
  function bundle(p, land, alpha) {
    const half = v.d / 2;
    const spread = (half * (v.u + v.v)) / v.u;
    polygon(
      [
        p,
        { x: 0, y: HOLE_Y + half, z: 0 },
        { x: land.x, y: land.y + spread, z: 0 },
        { x: land.x, y: land.y - spread, z: 0 },
        { x: 0, y: HOLE_Y - half, z: 0 },
      ],
      alpha,
    );
  }
  /** A measuring bar from a to b, with end ticks. */
  function bar(ax, ay, az, bx, by, bz, alpha, tick) {
    Q({ x: ax, y: ay, z: az });
    const x0 = sx;
    const y0 = sy;
    Q({ x: bx, y: by, z: bz });
    const x1 = sx;
    const y1 = sy;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l = Math.hypot(dx, dy) || 1;
    const tx = (-dy / l) * tick * unit;
    const ty = (dx / l) * tick * unit;
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'butt';
    for (const [color, width] of [
      [C.barEdge, 3.6],
      [C.bar, 1.7],
    ]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width * unit;
      line(x0, y0, x1, y1);
      ctx.stroke();
      line(x0 - tx, y0 - ty, x0 + tx, y0 + ty);
      ctx.stroke();
      line(x1 - tx, y1 - ty, x1 + tx, y1 + ty);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  /** A numbered mark on the paper, for the test. */
  function mark(y) {
    P(v.v - 0.1, y, 0);
    ctx.beginPath();
    ctx.arc(sx, sy, 4.2 * unit, 0, Math.PI * 2);
    ctx.fillStyle = C.mark;
    ctx.fill();
    ctx.strokeStyle = C.barEdge;
    ctx.lineWidth = 1.4 * unit;
    ctx.stroke();
  }

  const up = new THREE.Vector3();
  /** Px to a centimetre at the hole: lines grow a little as the camera comes closer. */
  function measure() {
    up.set(0, HOLE_Y, 0).applyMatrix4(camera.matrixWorldInverse);
    const cm = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * -up.z);
    unit = Math.max(0.95, Math.min(1.3, (cm / 13) ** 0.3));
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    measure();
    const g = points(v.u, v.v);
    if (v.fan > 0) {
      polygon([g.X, g.O, g.Y], 0.16 * v.fan);
      polygon([g.X1, g.O, g.Y1], 0.16 * v.fan);
    }
    if (v.spread > 0) {
      bundle(g.X, g.X1, 0.3 * v.spread);
      bundle(g.Y, g.Y1, 0.3 * v.spread);
    }
    if (v.bars > 0) {
      bar(-v.u, 0.04, RAIL_BAR, 0, 0.04, RAIL_BAR, v.bars, 5);
      bar(0, 0.04, RAIL_BAR, v.v, 0.04, RAIL_BAR, v.bars, 5);
    }
    const lengths = v.lengths * (1 - v.spread);
    if (lengths > 0) {
      bar(-v.u, FLAME.tip, -BAR_Z, -v.u, FLAME.base, -BAR_Z, lengths, 4);
      if (v.imageLength) {
        const side = imageSide(v.u, v.v);
        bar(v.v - 0.1, g.X1.y, side, v.v - 0.1, g.Y1.y, side, lengths, 4);
      }
    }
    ray(g.Y, g.O, g.Y1, v.y);
    ray(g.X, g.O, g.X1, v.x);
    if (v.pulse >= 0) {
      const k = v.pulse;
      const land = { x: v.v, y: HOLE_Y, z: 0 };
      const at = k < 0.5 ? { x: -v.u * (1 - 2 * k), y: HOLE_Y, z: 0 } : { x: land.x * (2 * k - 1), y: HOLE_Y, z: 0 };
      Q(at);
      ctx.beginPath();
      ctx.arc(sx, sy, 9 * unit, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,214,110,0.36)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, 3.6 * unit, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7d6';
      ctx.fill();
    }
    if (v.point > 0) {
      Q(g.O);
      ctx.globalAlpha = v.point;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2 * unit, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7d6';
      ctx.fill();
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 1.1 * unit;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const m of v.marks) mark(m.y);
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along what is drawn, canvas px: a label keeps off them
  const pool = Array.from({ length: 48 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const out = [];
  let used = 0;
  function along(a, b) {
    Q(a);
    const x0 = sx;
    const y0 = sy;
    Q(b);
    const n = Math.min(10, Math.ceil(Math.hypot(sx - x0, sy - y0) / 22));
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
    const g = points(v.u, v.v);
    out.length = 0;
    used = 0;
    if (v.x.k >= 1) {
      along(g.X, g.O);
      along(g.O, g.X1);
    }
    if (v.y.k >= 1) {
      along(g.Y, g.O);
      along(g.O, g.Y1);
    }
    return out;
  }
  /** Where a point is on the canvas now. */
  function screen(x, y, z) {
    P(x, y, z);
    return { x: sx, y: sy };
  }

  return { canvas, view: v, paint, boxes, screen };
}
