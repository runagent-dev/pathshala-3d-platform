// The drawing over the 3D view, like the book's চিত্র ৮.১৭, ৮.২১ and ৮.২৭: nothing here is a 3D object. The rays, the axis, the
// measures and the circle of the hollow sphere are painted on a 2D canvas above the view, from the exact points of reading.js
// projected through the camera: even anti-aliased lines with a thin dark edge and small filled chevrons, at any size.
import * as THREE from 'three';
import { RAIL, SCALE_POINT } from './bench.js';
import { MIRROR, sag } from './reading.js';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  glow: '#ffe36e',
  focus: '#7048e8',
  focusSoft: '#c7b8ff',
  ink: '#eef2f6',
  axis: '#dfe6ee',
  silver: '#f4f7fa',
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
    rays: [], // { start, hit, end, cross } from reading.js
    kind: 'concave',
    r: 30,
    centre: { x: 0, y: 0, z: 0 }, // for the first step: the circle of the sphere, in the air
    inK: 0,
    outK: 0,
    extK: 0,
    alpha: 1,
    axis: 0, // the principal axis
    marks: 0, // the drops from F and O to the scale
    showF: 0,
    showO: 0,
    bars: 0, // f and r measured along the rail
    circle: 0, // the sphere's circle through the mirror, and the radius to its edge
    radiusOnly: null, // { x, y, z } the sphere in the air: its radius drawn alone
    crossings: 0, // the small dots where rays cross the axis (the wide bundle)
    chevX: 26, // where along the rail the arrows of the incoming rays sit
    fan: 0.11, // how strongly the body of the beam is washed in
    source: 'box', // 'box' | 'bulb'
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

  /** A ray from (ax, ay) to (bx, by), in cm above the axis, as far as k, with an arrow at the fraction `at` (<0: none), and a second at `at2`. */
  function ray(ax, ay, bx, by, k, at, width = 1.9, at2 = -1) {
    if (k <= 0) return;
    P(ax, ay);
    const x0 = sx;
    const y0 = sy;
    P(bx, by);
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
    if (at2 >= 0 && k >= at2) chevron(x0 + dx * at2, y0 + dy * at2, dx, dy);
    if (k < 1) {
      ctx.beginPath();
      ctx.arc(x1, y1, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7d6';
      ctx.fill();
    }
  }
  /** Where light only seems to come from: the same amber, dashed. */
  function dashed(ax, ay, bx, by, k) {
    if (k <= 0) return;
    P(ax, ay);
    const x0 = sx;
    const y0 = sy;
    P(bx, by);
    const x1 = x0 + (sx - x0) * k;
    const y1 = y0 + (sy - y0) * k;
    ctx.lineCap = 'butt';
    ctx.setLineDash([6, 4.5]);
    line(x0, y0, x1, y1);
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 2.8;
    ctx.stroke();
    line(x0, y0, x1, y1);
    ctx.strokeStyle = C.ray;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** The body of the light: a thin wash between the outermost rays, so that a beam reads as one thing. fade: it dies away toward b, c. */
  function wash(a, b, c, d, alpha, fade = false) {
    if (alpha <= 0) return;
    let fill = C.ray;
    if (fade) {
      P((a.x + d.x) / 2, (a.y + d.y) / 2);
      const gx = sx;
      const gy = sy;
      P((b.x + c.x) / 2, (b.y + c.y) / 2);
      fill = ctx.createLinearGradient(gx, gy, sx, sy);
      fill.addColorStop(0, C.ray);
      fill.addColorStop(0.5, C.ray);
      fill.addColorStop(1, 'rgba(245,159,0,0)');
    }
    ctx.beginPath();
    P(a.x, a.y);
    ctx.moveTo(sx, sy);
    P(b.x, b.y);
    ctx.lineTo(sx, sy);
    P(c.x, c.y);
    ctx.lineTo(sx, sy);
    P(d.x, d.y);
    ctx.lineTo(sx, sy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function axis(k) {
    P(RAIL.left + 2, 0);
    const x0 = sx;
    const y0 = sy;
    P(RAIL.right - 4, 0);
    ctx.globalAlpha = k * 0.75;
    ctx.setLineDash([10, 4, 2, 4]);
    ctx.lineWidth = 1;
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
  /** A point on the axis: a small ring in its colour. */
  function dot(x, color, k, radius = 4.6) {
    if (k <= 0) return;
    P(x, 0);
    ctx.globalAlpha = k;
    ctx.beginPath();
    ctx.arc(sx, sy, radius + 1.2, 0, Math.PI * 2);
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
  /** The circle of the sphere the mirror belongs to, through the mirror, in the plane of the rays. */
  function circle(k) {
    if (k <= 0) return;
    const cx = v.kind === 'convex' ? -v.r : v.r;
    ctx.globalAlpha = k * 0.7;
    ctx.setLineDash([2, 5]);
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = C.ink;
    ctx.beginPath();
    const N = 96;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      P(cx + v.r * Math.cos(a), v.r * Math.sin(a));
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = k;
    // the radius, from O to the top edge of the mirror
    const s = sag(v.r, MIRROR.half) * (v.kind === 'convex' ? -1 : 1);
    P(cx, 0);
    const x0 = sx;
    const y0 = sy;
    P(s, MIRROR.half);
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = 'rgba(16,20,26,0.75)';
    line(x0, y0, sx, sy);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = C.ink;
    line(x0, y0, sx, sy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /** The curve of the mirror where the rays land: the book's line, in bright silver, so that its bend can be seen. */
  function arc(k) {
    if (k <= 0) return;
    const sign = v.kind === 'convex' ? -1 : 1;
    const curve = () => {
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const y = -MIRROR.half + (i / 28) * 2 * MIRROR.half;
        P(sign * sag(v.r, y), y);
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

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (v.radiusOnly) {
      const c = v.radiusOnly;
      const rr = c.r;
      Q(c.x, c.y, 0);
      const x0 = sx;
      const y0 = sy;
      Q(c.x - rr * c.cos, c.y + rr * c.sin, 0);
      ctx.globalAlpha = c.k;
      ctx.lineCap = 'round';
      ctx.lineWidth = 3.6;
      ctx.strokeStyle = 'rgba(16,20,26,0.8)';
      line(x0, y0, sx, sy);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.ink;
      line(x0, y0, sx, sy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x0, y0, 4.6, 0, Math.PI * 2);
      ctx.fillStyle = C.ink;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (v.axis > 0) axis(v.axis);
    circle(v.circle);
    const focusAt = v.kind === 'convex' ? -v.r / 2 : v.r / 2;
    const centreAt = v.kind === 'convex' ? -v.r : v.r;
    drop(focusAt, C.focusSoft, v.marks * v.showF);
    drop(centreAt, C.ink, v.marks * v.showO);
    if (v.bars > 0) {
      bar(0, focusAt, RAIL.top + 2.2, C.focus, v.bars);
      bar(0, centreAt, RAIL.top + 5.2, '#343a40', v.bars);
    }
    const rs = v.rays;
    ctx.globalAlpha = 1;
    if (rs.length) {
      const top = rs[rs.length - 1];
      const low = rs[0];
      if (v.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = v.alpha;
        const f = v.fan * v.alpha;
        // the wash of the beam, in and out
        if (v.inK >= 1) wash(low.start, low.hit, top.hit, top.start, f * (v.outK >= 1 ? 0.6 : 1));
        if (v.outK > 0) {
          const at = (q, e) => ({ x: q.x + (e.x - q.x) * v.outK, y: q.y + (e.y - q.y) * v.outK });
          wash(low.hit, at(low.hit, low.end), at(top.hit, top.end), top.hit, f * 1.15, true);
        }
        ctx.globalAlpha = v.alpha;
        for (const r of rs) {
          if (v.extK > 0 && r.cross != null) dashed(r.hit.x, r.hit.y, r.cross, 0, v.extK);
        }
        // the light that has arrived steps back a little: what it does next is the news
        const back = v.outK >= 1 ? 0.62 : 1;
        const gathers = v.source === 'box' && v.kind !== 'convex';
        for (const r of rs) {
          const chev = v.source === 'box' ? Math.min(0.95, Math.max(0.05, (v.chevX - r.start.x) / (r.hit.x - r.start.x))) : 0.62;
          ctx.globalAlpha = v.alpha * back;
          ray(r.start.x, r.start.y, r.hit.x, r.hit.y, v.inK, chev, v.outK >= 1 ? 1.4 : 1.9);
          ctx.globalAlpha = v.alpha;
          // the arrows of the way back keep clear of the point where the rays meet
          if (r.h === 0) ray(r.hit.x, r.hit.y, r.end.x, r.end.y, v.outK, -1);
          else if (gathers) ray(r.hit.x, r.hit.y, r.end.x, r.end.y, v.outK, 0.17, 1.9, Math.abs(r.h) > v.r * 0.2 ? 0.86 : -1);
          else ray(r.hit.x, r.hit.y, r.end.x, r.end.y, v.outK, 0.55);
        }
        ctx.restore();
      }
    }
    if (v.crossings > 0) {
      ctx.globalAlpha = v.crossings;
      for (const r of rs) {
        if (r.cross == null || r.h <= 0) continue;
        P(r.cross, 0);
        ctx.beginPath();
        ctx.arc(sx, sy, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff7d6';
        ctx.fill();
        ctx.strokeStyle = C.edge;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    arc(v.axis);
    dot(centreAt, C.ink, v.showO);
    if (v.axis > 0) dot(0, C.ink, v.axis, 3.6);
    dot(focusAt, C.focus, v.showF);
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along the rays now shown, canvas px: a label keeps off them, so it never lies on what it names
  const pool = Array.from({ length: 120 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const out = [];
  let used = 0;
  function along(ax, ay, bx, by) {
    P(ax, ay);
    const x0 = sx;
    const y0 = sy;
    P(bx, by);
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
    const rs = v.rays;
    if (!rs.length || v.alpha <= 0) return out;
    // the outermost and middle rays are enough: a label never sits inside the fan either
    for (const i of [0, rs.length >> 1, rs.length - 1]) {
      const r = rs[i];
      if (!r) continue;
      if (v.inK >= 1) along(r.start.x, r.start.y, r.hit.x, r.hit.y);
      if (v.outK >= 1) along(r.hit.x, r.hit.y, r.end.x, r.end.y);
      if (v.extK >= 1 && r.cross != null) along(r.hit.x, r.hit.y, r.cross, 0);
    }
    return out;
  }

  return { canvas, view: v, paint, boxes };
}
