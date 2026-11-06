// The drawing over the 3D view, in the style of the sister figure reflection-laws: a 2D canvas above the view, painted from
// the exact 3D points projected through the camera, so lines are anti-aliased and of a constant width at any size. Real
// rays are solid amber with a thin dark halo and clean filled arrowheads, their extensions behind the mirror dashed, the
// normals dashed slate, the angles thin arcs. Every point comes from reading.js.
import * as THREE from 'three';
import { MIRROR, VIEW } from './setting.js';

export const C = {
  ray: '#f59f00',
  rayDark: '#5f3400',
  normal: '#495057',
  ti: '#1971c2',
  tr: '#2b8a3e',
  ink: '#212529',
  card: '#fbf6f1',
  frame: '#5b3f2d',
  bar: '#245a8a',
  glow: '#ffd43b',
};

export function createDiagram({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pm-draw';
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
  const MAX = 64;
  const path = new Float32Array(MAX * 2);
  let count = 0;
  const add = (x, y, z = 0) => {
    P(x, y, z);
    path[count * 2] = sx;
    path[count * 2 + 1] = sy;
    count++;
  };
  function trace() {
    ctx.beginPath();
    ctx.moveTo(path[0], path[1]);
    for (let i = 1; i < count; i++) ctx.lineTo(path[i * 2], path[i * 2 + 1]);
  }
  const NO_DASH = [];
  const DASH_N = [8, 6];
  const DASH_R = [9, 6];
  const DOTS = [2, 5];
  function stroke(color, width, halo, haloWidth, dash = NO_DASH, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);
    ctx.lineCap = dash.length ? 'butt' : 'round';
    if (halo) {
      trace();
      ctx.strokeStyle = halo;
      ctx.lineWidth = haloWidth * unit;
      ctx.stroke();
    }
    trace();
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
  function dot(x, y, radius, color, ring, z = 0) {
    P(x, y, z);
    ctx.beginPath();
    ctx.arc(sx, sy, radius * unit, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = ring;
    ctx.lineWidth = 1.6 * unit;
    ctx.stroke();
  }
  /** A soft wide glow under the newest thing, fading with v.flash. */
  function glow(width = 11) {
    if (v.flash <= 0) return;
    trace();
    ctx.globalAlpha = 0.6 * v.flash;
    ctx.strokeStyle = C.glow;
    ctx.lineCap = 'round';
    ctx.lineWidth = width * unit;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /** a → b, with its arrowhead at the fraction t. */
  function segment(ax, ay, bx, by, t = 0.55, plain = false, lit = false) {
    count = 0;
    add(ax, ay);
    add(bx, by);
    if (lit) glow();
    stroke(C.ray, 2.2, C.rayDark, 3.2);
    if (plain) return;
    P(ax + (bx - ax) * t, ay + (by - ay) * t);
    const mx = sx;
    const my = sy;
    P(ax + (bx - ax) * (t + 0.04), ay + (by - ay) * (t + 0.04));
    chevron(mx, my, sx - mx, sy - my, 11, C.ray, null);
  }
  /** The ray a → m → e, grown to k of the way. */
  function bent(r, e, k, lit) {
    const a = r.src;
    // the way in and the way out carry their arrowheads apart, so that two rays close together stay clean
    const tin = 0.74;
    const tout = 0.62;
    if (k <= 0.5) {
      const q = k * 2;
      segment(a.x, a.y, a.x + (0 - a.x) * q, a.y + (r.m - a.y) * q, tin / Math.max(tin, q), false, lit);
      return;
    }
    const q = (k - 0.5) * 2;
    segment(a.x, a.y, 0, r.m, tin, false, lit);
    segment(0, r.m, e.x * q, r.m + (e.y - r.m) * q, tout / Math.max(tout, q), false, lit);
  }
  function dashedTo(r, k, lit) {
    const i = r.image;
    count = 0;
    add(0, r.m);
    add(i.x * k, r.m + (i.y - r.m) * k);
    if (lit) glow();
    stroke(C.ray, 2, C.rayDark, 3, DASH_R);
  }
  /** A thin arc at the mirror point (0, m), from the normal (angle 0, along −x) to the angle a, up positive. */
  function arc(m, r, a0, a1, color) {
    const n = 24;
    count = 0;
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      add(-Math.cos(a) * r, m + Math.sin(a) * r);
    }
    stroke(color, 2, '#ffffff', 3.4);
    if (Math.abs(a1 - a0) < 10) return;
    const head = (from, to) => {
      const a = (from * Math.PI) / 180;
      const b = (to * Math.PI) / 180;
      P(-Math.cos(b) * r, m + Math.sin(b) * r);
      const bx = sx;
      const by = sy;
      P(-Math.cos(a) * r, m + Math.sin(a) * r);
      chevron(sx - (sx - bx) * 0.2, sy - (sy - by) * 0.2, sx - bx, sy - by, 9, color, '#ffffff');
    };
    const inward = a1 > a0 ? -2 : 2;
    head(a1, a1 + inward);
    head(a0, a0 - inward);
  }
  /** An upright measure from y0 to y1, with an arrowhead at each end, standing at x, z. */
  function dimension(x, y0, y1, z = 0, color = C.ink) {
    count = 0;
    add(x, y0, z);
    add(x, y1, z);
    stroke(color, 1.7, '#ffffff', 3.2);
    P(x, y0, z);
    const bx = sx;
    const by = sy;
    P(x, y1, z);
    const tx = sx;
    const ty = sy;
    chevron(tx, ty + 5 * unit, tx - bx, ty - by, 11, color, '#ffffff');
    chevron(bx, by - 5 * unit, bx - tx, by - ty, 11, color, '#ffffff');
  }
  /** One strip on the floor from x0 to x1 at depth z, with a tick each quarter metre: equal bars read as equal in depth. */
  function floorBar(x0, x1, z, half, lit) {
    const y = 0.003;
    count = 0;
    add(x0, y, z - half);
    add(x1, y, z - half);
    add(x1, y, z + half);
    add(x0, y, z + half);
    trace();
    ctx.closePath();
    if (lit && v.flash > 0) {
      ctx.globalAlpha = 0.6 * v.flash;
      ctx.strokeStyle = C.glow;
      ctx.lineWidth = 11 * unit;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = C.bar;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * unit;
    ctx.stroke();
    const dir = x1 > x0 ? 1 : -1;
    const len = Math.abs(x1 - x0);
    for (let m = 0.25; m < len - 0.01; m += 0.25) {
      const x = x0 + dir * m;
      count = 0;
      add(x, y, z - half);
      add(x, y, z + half);
      stroke('#ffffff', 1.3, null, 0);
    }
    // the end caps stand up from the floor a little, so that the ends read
    for (const x of [x0, x1]) {
      count = 0;
      add(x, y, z - half * 2.2);
      add(x, y, z + half * 2.2);
      stroke(C.bar, 2.4, '#ffffff', 4);
    }
  }
  /** The card of the small picture round the mirror's hole: where there is no mirror, a dashed outline and the words. */
  function card(view) {
    const { rect, top, bottom, low, high, absent, from } = view;
    const py = rect.h / (VIEW.y1 - VIEW.y0);
    const pz = rect.w / (2 * VIEW.z);
    const yOf = (y) => rect.y + (VIEW.y1 - y) * py;
    const my = yOf(top);
    const mh = (top - bottom) * py;
    const mw = 2 * MIRROR.halfW * pz;
    const mx = rect.x + (rect.w - mw) / 2;
    const x0 = rect.x - 3;
    const y0 = rect.y - 21;
    const cw = rect.w + 6;
    const ch = rect.h + 24;
    // a thin line from the mirror to the card: this is what that mirror shows
    P(0, from, MIRROR.halfW);
    const fx = sx;
    const fy = sy;
    const inside = fx > x0 + cw ? x0 + cw : fx < x0 ? x0 : fx;
    const across = fy < y0 ? y0 : fy > y0 + ch ? y0 + ch : fy;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(inside, fx > x0 + cw || fx < x0 ? Math.min(y0 + ch - 12, Math.max(y0 + 12, fy)) : across);
    ctx.strokeStyle = 'rgba(51,80,107,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(x0, y0, cw, ch, 6);
    ctx.rect(mx, my, mw, mh);
    ctx.fillStyle = C.card;
    ctx.fill('evenodd');
    ctx.beginPath();
    ctx.roundRect(x0, y0, cw, ch, 6);
    ctx.strokeStyle = 'rgba(51,80,107,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(51,80,107,0.5)';
    ctx.strokeRect(mx - 1.5, yOf(high), mw + 3, (high - low) * py);
    ctx.setLineDash(NO_DASH);
    ctx.strokeStyle = C.frame;
    ctx.lineWidth = 3;
    ctx.strokeRect(mx - 1.5, my - 1.5, mw + 3, mh + 3);
    if (absent) {
      ctx.fillStyle = 'rgba(51,80,107,0.8)';
      ctx.font = `600 ${Math.max(10.5, Math.min(13, mw / 6))}px "Noto Sans Bengali", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const gapT = my - 3 - yOf(high);
      const gapB = yOf(low) - (my + mh + 3);
      const cx = mx + mw / 2;
      if (gapT >= 18) ctx.fillText(absent, cx, yOf(high) + gapT / 2);
      if (gapB >= 18) ctx.fillText(absent, cx, my + mh + 3 + gapB / 2);
    }
  }

  // ── what is shown: a plain description the figure fills in ──────────────────────────────────────────────────
  const v = {
    bars: null, // { d, k, z, half }: the two distance bars on the floor, grown to k
    marks: [], // upright measures: { x, y0, y1, z, color }
    plumb: [], // dotted lines from a point down to its bar: { x, y, z }
    flash: 0, // the highlight on the newest thing, 1 … 0
    lit: '', // what it is on
    rays: null, // { head, feet, eye }
    head: 0,
    feet: 0,
    ext: 0,
    normals: 0,
    arcs: [], // { m, r, a0, a1, color }
    points: [], // [x, y, radius, colour]
    segs: [], // the test's plain segments [ax, ay, bx, by]
    drag: { boy: null, top: null, bottom: null },
    card: null,
    normalLen: 0.6,
  };

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (v.bars) {
      const { d, k, z, half } = v.bars;
      const k0 = Math.min(1, k * 2);
      const k1 = Math.max(0, k * 2 - 1);
      if (k0 > 0) floorBar(-d, -d * (1 - k0), z, half, v.lit === 'bars');
      if (k1 > 0) floorBar(0, d * k1, z, half, v.lit === 'bars');
    }
    for (const q of v.plumb) {
      count = 0;
      add(q.x, q.y, 0);
      add(q.x, 0.004, q.z);
      stroke(C.bar, 1.3, 'rgba(255,255,255,0.75)', 2.6, DOTS, 0.8);
    }
    for (const m of v.marks) dimension(m.x, m.y0, m.y1, m.z, m.color);
    const r = v.rays;
    if (r) {
      if (v.normals > 0) {
        for (const q of [v.head > 0 ? r.head : null, v.feet > 0 ? r.feet : null]) {
          if (!q) continue;
          count = 0;
          add(-v.normalLen * v.normals * (q === r.head ? 0.62 : 1), q.m);
          add(0, q.m);
          if (v.lit === 'normal') glow(9);
          stroke(C.normal, 1.8, 'rgba(255,255,255,0.8)', 3.4, DASH_N);
        }
      }
      for (const a of v.arcs) arc(a.m, a.r, a.a0, a.a1, a.color);
      if (v.ext > 0) {
        if (v.head > 0) dashedTo(r.head, v.ext, v.lit === 'ext');
        if (v.feet > 0) dashedTo(r.feet, v.ext, v.lit === 'ext');
      }
      if (v.head > 0) bent(r.head, r.eye, v.head, v.lit === 'head');
      if (v.feet > 0) bent(r.feet, r.eye, v.feet, v.lit === 'feet');
    }
    if (v.card) card(v.card);
    for (const s of v.segs) segment(s[0], s[1], s[2], s[3], 0.5, true);
    for (const p of v.points) dot(p[0], p[1], p[2], p[3], '#ffffff');
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  return {
    canvas,
    view: v,
    clear() {
      Object.assign(v, { bars: null, rays: null, head: 0, feet: 0, ext: 0, normals: 0, card: null, flash: 0, lit: '' });
      v.marks.length = 0;
      v.plumb.length = 0;
      v.arcs.length = 0;
      v.points.length = 0;
      v.segs.length = 0;
      v.drag.boy = v.drag.top = v.drag.bottom = null;
    },
    paint,
  };
}
