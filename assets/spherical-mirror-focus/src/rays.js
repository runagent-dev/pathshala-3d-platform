// The drawing over the 3D view, like the book's চিত্র ৮.১৭, ৮.২১ and ৮.২৭: nothing here is a 3D object. The rays, the axis, the
// measures and the circle of the hollow sphere are painted on a 2D canvas above the view, from the exact points of reading.js
// projected through the camera: even anti-aliased lines with a thin dark edge and small filled chevrons, at any size.
import * as THREE from 'three';
import { RAIL, SCALE_POINT } from './bench.js';
import { MIRROR, sag } from './reading.js';

export const C = {
  ray: '#f59f00',
  rim: '#ff5a36', // the rim rays of the wide bundle
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
    piece: null, // the dish while it is shown: { k, r, a, inner, x, y, z, thick }, for the curved lines on the side that faces the eye
    crossings: 0, // the small dots where rays cross the axis (the wide bundle)
    chevX: 26, // where along the rail the arrows of the incoming rays sit
    fan: 0.11, // how strongly the body of the beam is washed in
    source: 'box', // 'box' | 'bulb'
    arcK: 0, // the mirror's curve in bright silver
    bulge: 0, // the same curve in the outer surface's gold, for the half turn
    rimAt: Infinity, // rays this far from the axis or further are the rim rays, in their own colour
    inset: 0, // the magnifying lens on the crossings near F
    fmt: (x) => String(x), // a number for the lens
  };
  let rayColor = C.ray;
  /** One ray after another: how far ray i of n has got when the whole bundle is at K. Each takes OVERLAP rays' share of the time. */
  const OVERLAP = 2;
  const nth = (K, i, n) => (K >= 1 ? 1 : K <= 0 ? 0 : Math.min(1, Math.max(0, (K * (n - 1 + OVERLAP) - i) / OVERLAP)));

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
    ctx.fillStyle = rayColor;
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
    ctx.strokeStyle = rayColor;
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
    if (v.bulge > 0) {
      ctx.globalAlpha = k * v.bulge;
      curve();
      ctx.strokeStyle = 'rgba(12,16,22,0.85)';
      ctx.lineWidth = 7;
      ctx.stroke();
      curve();
      ctx.strokeStyle = '#ffc93c';
      ctx.lineWidth = 4.6;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const toEye = new THREE.Vector3();
  /** The hollow sphere's lines of latitude and longitude, the cut round the piece, and the radius. The far halves are fainter. */
  function sphereLines(c) {
    const ring = (at, width, color, dash, front) => {
      ctx.beginPath();
      let on = false;
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const q = at(a);
        toEye.set(q.x * c.r, q.y * c.r, q.z * c.r);
        const facing = toEye.x * (camera.position.x - c.x) + toEye.y * (camera.position.y - c.y) + toEye.z * camera.position.z > c.r * c.r;
        if (facing !== front) {
          on = false;
          continue;
        }
        Q(c.x + toEye.x, c.y + toEye.y, toEye.z);
        if (on) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
        on = true;
      }
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    const greats = [
      (a) => ({ x: Math.cos(a), y: 0, z: Math.sin(a) }), // the equator
      (a) => ({ x: Math.cos(a), y: Math.sin(a), z: 0 }), // a meridian through the piece
      (a) => ({ x: 0, y: Math.sin(a), z: Math.cos(a) }), // the one across it
      (a) => ({ x: 0.5 * Math.cos(a) * 1.73, y: 0.5, z: 0.5 * Math.sin(a) * 1.73 }), // two parallels
      (a) => ({ x: 0.5 * Math.cos(a) * 1.73, y: -0.5, z: 0.5 * Math.sin(a) * 1.73 }),
    ];
    ctx.lineCap = 'butt';
    ctx.globalAlpha = c.k;
    for (const at of greats) ring(at, 1, 'rgba(226,240,248,0.13)', [], false);
    for (const at of greats) ring(at, 1.15, 'rgba(226,240,248,0.34)', [], true);
    // the line of the cut, until the piece is out
    if (c.cut > 0) {
      const cx = c.cos;
      const rs = c.sin;
      const at = (a) => ({ x: rs * Math.sin(a), y: rs * Math.cos(a), z: cx });
      ctx.globalAlpha = c.k * c.cut;
      for (const front of [true, false]) {
        ring(at, 3.6, 'rgba(12,18,24,0.75)', [7, 5], front);
        ring(at, 2, '#ffe36e', [7, 5], front);
      }
    }
    // the radius, from O to the far edge of the piece, where it shows longest
    Q(c.x, c.y, 0);
    const x0 = sx;
    const y0 = sy;
    Q(c.x - c.r * c.sin * 0.8, c.y + c.r * c.sin * 0.6, c.r * c.cos);
    ctx.globalAlpha = c.k * c.radius;
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

  /** Lines drawn on the surface of the dish, like the sphere's: it is too shallow for shading alone to show that it is curved. */
  function pieceLines(c) {
    const ax = Math.cos(c.a);
    const az = -Math.sin(c.a);
    const zx = Math.sin(c.a);
    const zz = Math.cos(c.a);
    const off = c.thick / 2 - (c.inner ? 0 : c.thick);
    const on = (rho, th) => {
      const y = rho * Math.cos(th);
      const z = rho * Math.sin(th);
      const x = sag(c.r, rho) + off;
      Q(c.x + ax * x + zx * z, c.y + y, c.z + az * x + zz * z);
    };
    const R = MIRROR.half * 0.985;
    const path = (n, at) => {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        at(i / n);
        if (i) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      }
      ctx.stroke();
    };
    ctx.globalAlpha = 0.85 * c.k;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = c.inner ? '#e4f2ff' : '#fff6da';
    for (const th of [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4])
      path(16, (f) => {
        const u = 2 * f - 1;
        on(Math.abs(u) * R, u < 0 ? th + Math.PI : th);
      });
    for (const rho of [R / 3, (2 * R) / 3]) path(36, (f) => on(rho, f * Math.PI * 2));
    ctx.globalAlpha = 1;
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (v.piece) pieceLines(v.piece);
    if (v.radiusOnly) sphereLines(v.radiusOnly);
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
        const n = rs.length;
        if (v.outK > 0) {
          const at = (q, e, k) => ({ x: q.x + (e.x - q.x) * k, y: q.y + (e.y - q.y) * k });
          wash(low.hit, at(low.hit, low.end, nth(v.outK, 0, n)), at(top.hit, top.end, nth(v.outK, n - 1, n)), top.hit, f * 1.15, true);
        }
        ctx.globalAlpha = v.alpha;
        rs.forEach((r, i) => {
          if (v.extK > 0 && r.cross != null) dashed(r.hit.x, r.hit.y, r.cross, 0, nth(v.extK, i, n));
        });
        // the light that has arrived steps back a little: what it does next is the news
        const back = v.outK >= 1 ? 0.62 : 1;
        const gathers = v.source === 'box' && v.kind !== 'convex';
        for (let i = 0; i < n; i++) {
          const r = rs[i];
          const inK = nth(v.inK, i, n);
          const outK = nth(v.outK, i, n);
          const chev = v.source === 'box' ? Math.min(0.95, Math.max(0.05, (v.chevX - r.start.x) / (r.hit.x - r.start.x))) : 0.62;
          rayColor = Math.abs(r.h) >= v.rimAt ? C.rim : C.ray;
          ctx.globalAlpha = v.alpha * back;
          ray(r.start.x, r.start.y, r.hit.x, r.hit.y, inK, chev, v.outK >= 1 ? 1.4 : 1.9);
          ctx.globalAlpha = v.alpha;
          // the arrows of the way back keep clear of the point where the rays meet
          if (r.h === 0) ray(r.hit.x, r.hit.y, r.end.x, r.end.y, outK, -1);
          else if (gathers) ray(r.hit.x, r.hit.y, r.end.x, r.end.y, outK, 0.17, 1.9, Math.abs(r.h) > v.r * 0.2 ? 0.86 : -1);
          else ray(r.hit.x, r.hit.y, r.end.x, r.end.y, outK, 0.55);
        }
        rayColor = C.ray;
        ctx.restore();
      }
    }
    arc(v.arcK);
    dot(centreAt, C.ink, v.showO);
    if (v.axis > 0) dot(0, C.ink, v.axis, 3.6);
    dot(focusAt, C.focus, v.showF);
    if (v.inset > 0) lens(v.inset);
  }

  /** The bottom right of the view: a round lens on the place near F where the rays cross the axis, true to scale, drawn exactly. */
  function lensBox() {
    const R = Math.max(50, Math.min(92, Math.min(w, h) * 0.215));
    return { R, x: w - R - 10, y: h - R - 10 };
  }
  function lens(k) {
    const { R, x: cx, y: cy } = lensBox();
    const rs = v.rays.filter((r) => r.h > 0 && r.cross != null);
    if (!rs.length) return;
    const f = v.r / 2;
    const a = Math.min(...rs.map((r) => r.cross));
    const mid = (a + f) / 2;
    const scale = (R * 1.14) / Math.max(f - a, 0.1);
    const ax = cy - R * 0.08; // the axis, a little above the middle: the numbers go under it
    const X = (x) => cx + (x - mid) * scale;
    // the small ring round F and the two lines from it to the lens
    P(f, 0);
    const fx = sx;
    const fy = sy;
    const sr = 13;
    const l = Math.hypot(cx - fx, cy - fy) || 1;
    const nx = -(cy - fy) / l;
    const ny = (cx - fx) / l;
    ctx.globalAlpha = k;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    for (const s of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(fx + nx * s * sr, fy + ny * s * sr);
      ctx.lineTo(cx + nx * s * R, cy + ny * s * R);
      ctx.stroke();
    }
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(fx, fy, sr, 0, Math.PI * 2);
    ctx.stroke();
    // inside the lens
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#1b2531';
    ctx.fill();
    ctx.clip();
    ctx.setLineDash([9, 3, 2, 3]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.axis;
    line(cx - R, ax, cx + R, ax);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineCap = 'butt';
    for (const r of rs) {
      const color = r.h >= v.rimAt ? C.rim : C.ray;
      const m = r.dir.y / r.dir.x;
      const x0 = X(r.cross);
      for (const s of [1, -1]) {
        line(x0 - 3 * R, ax - s * m * -3 * R, x0 + 3 * R, ax - s * m * 3 * R);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    const mark = (x, color, radius) => {
      ctx.beginPath();
      ctx.arc(X(x), ax, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    };
    const num = R < 62 ? 11 : 12.5;
    ctx.font = `600 ${num}px "Noto Sans Bengali", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const tag = (text, x, y, color) => {
      const wd = ctx.measureText(text).width + 8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - wd / 2, y, wd, num + 5);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y + 1);
    };
    for (const r of rs) mark(r.cross, r.h >= v.rimAt ? C.rim : C.ray, 4);
    mark(f, C.focus, 4.6);
    const tagY = ax + R * 0.32;
    for (const r of rs) tag(v.fmt(r.cross), X(r.cross), tagY, r.h >= v.rimAt ? '#c2300e' : '#8a4f00');
    tag('F', X(f), ax - R * 0.5, '#5a37d0');
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
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
  const end = (x, y) => {
    Q(x, y, 0);
    const r = pool[used++];
    r.left = sx - 6;
    r.right = sx + 6;
    r.top = sy - 8;
    r.bottom = sy + 8;
    out.push(r);
  };
  const lensRect = { left: 0, top: 0, right: 0, bottom: 0 };
  function boxes() {
    out.length = 0;
    used = 0;
    if (v.bars > 0) {
      // the ends of the two measures: a label keeps off their ticks
      const f = v.kind === 'convex' ? -v.r / 2 : v.r / 2;
      end(0, RAIL.top + 2.2);
      end(f, RAIL.top + 2.2);
      end(0, RAIL.top + 5.2);
      end(f * 2, RAIL.top + 5.2);
    }
    if (v.inset > 0) {
      const { R, x, y } = lensBox();
      Object.assign(lensRect, { left: x - R, top: y - R, right: x + R, bottom: y + R });
      out.push(lensRect);
    }
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
