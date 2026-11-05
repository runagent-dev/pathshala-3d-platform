// The drawing over the 3D view: the book's arrows as a crisp textbook diagram. Nothing here is a 3D object. The band of the
// spectrum colours, the arrows that leave the petal and the leaf, and the eye are painted on a 2D canvas over the view, from
// the scene's 3D points projected through the camera: even anti-aliased shapes that grow a little as the camera comes
// closer. The band ends on the surface it meets: a colour that is absorbed fades out into it, and the object's own colour
// leaves from the exact spot where its stripe landed. Only what leaves gets a strong arrow; the bands carry slim marks.
import * as THREE from 'three';
import { BANDS } from './reading.js';
import { LAYOUT } from './scene.js';

/** The band's colours, and the colour of each object's arrow (the same red and green). */
export const SPECTRUM = { violet: '#7a3fe0', blue: '#1c7ed6', green: '#2f9e44', yellow: '#fcc419', orange: '#fd7e14', red: '#e03131' };
const EDGE = '#14171c';
const LINE = '#e6e9ee'; // what is drawn directly on the dark wall: the eye's lashes and crease, the sight-line
const STRIPE = 4.2; // px: one colour's width in the white band, at the usual size
const FADE = 30; // px: the length over which an absorbed colour sinks into the surface
const SINK = 9; // px: how far past the outline it lands
const EYE = { W: 38, H: 17 }; // half width and half height of the eye's opening, px at the usual size
const CM = 11; // px to a centimetre at the usual size

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'coo-draw';
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
  const pt = { x: 0, y: 0 };
  const P = (v) => {
    pv.copy(v).project(camera);
    pt.x = ((pv.x + 1) / 2) * w;
    pt.y = ((1 - pv.y) / 2) * h;
    return pt;
  };

  // ── what is shown; the figure fills this in ───────────────────────────────────────────────────────────────
  const part = (keeps) => ({
    on: true,
    grow: 0, // how far its band has come, 0 … 1
    keeps, // the colour it gives back, or null
    absorb: 0, // how far the absorbed colours have sunk in, 0 … 1
    out: 0, // how far its arrow has gone, 0 … 1
    sight: 0, // the dashed line from the eye, where no arrow comes, 0 … 1
  });
  const v = {
    widths: new Float32Array(6).fill(1), // each colour's width in the band, in stripes
    rose: part('red'),
    leaf: part('green'),
    eye: true,
  };

  /** Where each ribbon's colours ended, canvas px, in the order of BANDS. */
  const ends = { rose: new Float32Array(12), leaf: new Float32Array(12) };
  const beam = { rose: { nx: 0, ny: 0, dx: 1, dy: 0, half: 0 }, leaf: { nx: 0, ny: 0, dx: 1, dy: 0, half: 0 } };
  const towardEye = { x: 0, y: 0 };

  /** Canvas px of the key points, for the labels. */
  const info = {
    bloom: { x: 0, y: 0, r: 0 },
    eye: { x: 0, y: 0 },
    iris: { x: 0, y: 0 },
    leaf: { x: 0, y: 0 },
    rose_fade: { x: 0, y: 0 }, // the middle of the part of the band that sinks in
    leaf_fade: { x: 0, y: 0 },
    rose_out: { x: 0, y: 0, ux: 1, uy: 0 }, // a point on the arrow, and its way
    leaf_out: { x: 0, y: 0, ux: 1, uy: 0 },
    rose_band: { x: 0, y: 0, nx: 0, ny: 0 },
    leaf_band: { x: 0, y: 0, nx: 0, ny: 0 }, // a point on the ribbon, and the side away from the eye
    unit: 1,
  };

  /** Distance along (x, y) + t(dx, dy) to the circle, nearest crossing; -1 if it misses. */
  function toCircle(x, y, dx, dy, cx, cy, r) {
    const fx = x - cx;
    const fy = y - cy;
    const b = fx * dx + fy * dy;
    const c = fx * fx + fy * fy - r * r;
    const q = b * b - c;
    return q < 0 ? -1 : -b - Math.sqrt(q);
  }
  /** Distance along the same ray to the line through a and b. */
  function toLine(x, y, dx, dy, ax, ay, bx, by) {
    const ex = bx - ax;
    const ey = by - ay;
    const d = dx * ey - dy * ex;
    if (Math.abs(d) < 1e-6) return -1;
    return ((ax - x) * ey - (ay - y) * ex) / d;
  }
  const widthOf = (i) => v.widths[i] * STRIPE * unit;
  function halfWidth() {
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += widthOf(i);
    return sum / 2;
  }

  /** A slim mark on a band, to show the way the light goes: no wider than the band, one tone. */
  function bandMark(cx, cy, d) {
    const hw = Math.max(5 * unit, d.half * 0.62);
    const l = hw * 0.74;
    const line = () => {
      ctx.beginPath();
      ctx.moveTo(cx - d.dx * l + d.nx * hw, cy - d.dy * l + d.ny * hw);
      ctx.lineTo(cx + d.dx * l, cy + d.dy * l);
      ctx.lineTo(cx - d.dx * l - d.nx * hw, cy - d.dy * l - d.ny * hw);
    };
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    line();
    ctx.strokeStyle = 'rgba(20,23,28,0.6)';
    ctx.lineWidth = 4 * unit;
    ctx.stroke();
    line();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.1 * unit;
    ctx.stroke();
  }

  /** A ribbon from the lens to a surface. hit(x, y, dx, dy) gives the distance to the surface along that line. */
  function ribbon(key, ax, ay, tx, ty, hit) {
    const o = v[key];
    const store = ends[key];
    const d = beam[key];
    let dx = tx - ax;
    let dy = ty - ay;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    // red on the eye's side
    let nx = -dy;
    let ny = dx;
    if (nx * towardEye.x + ny * towardEye.y < 0) {
      nx = -nx;
      ny = -ny;
    }
    const half = halfWidth();
    Object.assign(d, { dx, dy, nx, ny, half });
    let off = -half;
    let first = -1;
    let last = -1;
    let shortest = 1e9;
    let mx = 0;
    let my = 0;
    for (let i = 0; i < 6; i++) {
      const wd = widthOf(i);
      const cx = ax + nx * (off + wd / 2);
      const cy = ay + ny * (off + wd / 2);
      let t = hit(cx, cy, dx, dy);
      if (t < 0) t = l;
      t += SINK * unit;
      store[i * 2] = cx + dx * t;
      store[i * 2 + 1] = cy + dy * t;
      if (wd > 0.3) {
        if (first < 0) first = i;
        last = i;
        shortest = Math.min(shortest, t);
        mx += store[i * 2];
        my += store[i * 2 + 1];
      }
      off += wd;
    }
    if (first < 0) return;
    const count = last - first + 1;
    const fade = FADE * unit;
    // for the labels: the middle of what sinks in, and a point on the band, a third of the way along
    const a = info[`${key}_fade`];
    a.x = mx / count - dx * fade * 0.5;
    a.y = my / count - dy * fade * 0.5;
    const b = info[`${key}_band`];
    b.x = ax + dx * shortest * 0.42;
    b.y = ay + dy * shortest * 0.42;
    b.nx = -nx;
    b.ny = -ny;
    const reach = o.grow;
    const edgeLine = (e, i) => {
      const x = ax + nx * e;
      const y = ay + ny * e;
      const end = Math.hypot(store[i * 2] - x, store[i * 2 + 1] - y);
      const f = BANDS[i] === o.keeps ? 0 : fade * o.absorb;
      const g = ctx.createLinearGradient(x, y, x + dx * end, y + dy * end);
      g.addColorStop(0, EDGE);
      g.addColorStop(Math.max(0, 1 - f / end), EDGE);
      g.addColorStop(1, f > 0 ? 'rgba(20,23,28,0)' : EDGE);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.2 * unit;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx * end * reach, y + dy * end * reach);
      ctx.stroke();
    };
    edgeLine(-half - 0.4 * unit, first);
    edgeLine(half + 0.4 * unit, last);
    off = -half;
    for (let i = 0; i < 6; i++) {
      const wd = widthOf(i);
      if (wd > 0.1) {
        const name = BANDS[i];
        const color = SPECTRUM[name];
        const sx = ax + nx * off;
        const sy = ay + ny * off;
        const cx = sx + (nx * wd) / 2;
        const cy = sy + (ny * wd) / 2;
        const end = Math.hypot(store[i * 2] - cx, store[i * 2 + 1] - cy);
        const t = end * reach;
        const f = name === o.keeps ? 0 : fade * o.absorb;
        if (f > 0.5) {
          const g = ctx.createLinearGradient(cx, cy, cx + dx * end, cy + dy * end);
          g.addColorStop(0, color);
          g.addColorStop(Math.max(0, 1 - f / end), color);
          g.addColorStop(1, `${color}00`); // the alpha falls away in the colour itself: no grey at the end of the fade
          ctx.fillStyle = g;
        } else ctx.fillStyle = color;
        const ov = i < 5 ? 0.5 : 0; // a hair under the next stripe: no seam shows between them
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + nx * (wd + ov), sy + ny * (wd + ov));
        ctx.lineTo(sx + nx * (wd + ov) + dx * t, sy + ny * (wd + ov) + dy * t);
        ctx.lineTo(sx + dx * t, sy + dy * t);
        ctx.closePath();
        ctx.fill();
      }
      off += wd;
    }
    for (const f of [0.34, 0.7]) if (reach > f + 0.05) bandMark(ax + dx * shortest * f, ay + dy * shortest * f, d);
  }

  /** The arrow that leaves a surface. Its tip stops at the eye's edge; it is aimed at the iris. */
  function arrow(key, x0, y0, color, k) {
    const { iris, eye: e } = info;
    let dx = iris.x - x0;
    let dy = iris.y - y0;
    const whole = Math.hypot(dx, dy) || 1;
    dx /= whole;
    dy /= whole;
    // where this line comes into the eye's ellipse
    const s = eyeScale();
    const A = (EYE.W + 7) * s;
    const B = (EYE.H + 7) * s;
    const fx = (x0 - e.x) / A;
    const fy = (y0 - e.y) / B;
    const gx = dx / A;
    const gy = dy / B;
    const a = gx * gx + gy * gy;
    const b = fx * gx + fy * gy;
    const c = fx * fx + fy * fy - 1;
    const q = b * b - a * c;
    const stop = q > 0 ? (-b - Math.sqrt(q)) / a : whole;
    const reach = Math.max(1, stop) * k;
    const head = 22 * unit;
    const hw = 10.5 * unit;
    const tipX = x0 + dx * reach;
    const tipY = y0 + dy * reach;
    const neck = Math.min(reach, head * 0.82);
    const neckX = tipX - dx * neck;
    const neckY = tipY - dy * neck;
    const shaft = () => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(neckX, neckY);
    };
    ctx.lineCap = 'round';
    shaft();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 8 * unit;
    ctx.stroke();
    shaft();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5.4 * unit;
    ctx.stroke();
    const bx = tipX - dx * head;
    const by = tipY - dy * head;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bx - dy * hw, by + dx * hw);
    ctx.lineTo(neckX, neckY);
    ctx.lineTo(bx + dy * hw, by - dx * hw);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 1.4 * unit;
    ctx.lineJoin = 'round';
    ctx.stroke();
    // a point on the arrow for its label: half way, or not far along when the arrow leaves the view in a close-up
    const o = info[`${key}_out`];
    const at = Math.min(reach * 0.55, 92 * unit);
    o.x = x0 + dx * at;
    o.y = y0 + dy * at;
    o.ux = dx;
    o.uy = dy;
  }

  /** The dashed line of sight, where nothing comes back along it. */
  function sight(x, y, k) {
    const { iris } = info;
    ctx.save();
    ctx.globalAlpha = 0.75 * k;
    ctx.setLineDash([6 * unit, 6 * unit]);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.3 * unit;
    ctx.beginPath();
    ctx.moveTo(iris.x, iris.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
  }

  const eyeScale = () => 0.9 * Math.min(1.5, Math.max(0.9, unit));

  /** The eye: a clean line drawing that looks at the rose. */
  function eye(x, y, ix, iy) {
    const s = eyeScale();
    const { W, H } = EYE;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const upper = () => ctx.bezierCurveTo(-W * 0.5, -H - 4, W * 0.42, -H - 6, W, -3);
    const almond = () => {
      ctx.beginPath();
      ctx.moveTo(-W, 4);
      upper();
      ctx.bezierCurveTo(W * 0.48, H + 1, -W * 0.46, H + 3, -W, 4);
      ctx.closePath();
    };
    almond();
    ctx.fillStyle = '#fbfbf8';
    ctx.fill();
    ctx.save();
    almond();
    ctx.clip();
    const cx = (ix - x) / s;
    const cy = (iy - y) / s;
    const iris = ctx.createRadialGradient(cx, cy, 4, cx, cy, 15);
    iris.addColorStop(0, '#a9703a');
    iris.addColorStop(0.72, '#6f4522');
    iris.addColorStop(1, '#3a2312');
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0e0f12';
    ctx.beginPath();
    ctx.arc(cx, cy, 6.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 4.8, cy - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // the fine outline, and the heavy upper lid
    almond();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-W, 4);
    upper();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 3;
    ctx.stroke();
    // on the dark wall the crease and the lashes are pale lines
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-W * 0.8, -8);
    ctx.bezierCurveTo(-W * 0.4, -H - 11, W * 0.42, -H - 12, W * 0.88, -11);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const [a, b, c, e] of [
      [-0.66, -9, -0.76, -16],
      [-0.42, -15, -0.5, -23],
      [-0.14, -19, -0.17, -27],
    ]) {
      ctx.moveTo(W * a, b);
      ctx.lineTo(W * c, e);
    }
    ctx.stroke();
    ctx.restore();
  }

  const tmp = new THREE.Vector3();
  function measure() {
    const p = P(LAYOUT.eye);
    info.eye.x = p.x;
    info.eye.y = p.y;
    const c = P(LAYOUT.bloomCentre);
    info.bloom.x = c.x;
    info.bloom.y = c.y;
    // the sphere's radius on the screen, at its centre's depth
    tmp.copy(LAYOUT.bloomCentre).applyMatrix4(camera.matrixWorldInverse);
    const r = LAYOUT.bloomRadius / (Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * -tmp.z);
    info.bloom.r = (r * h) / 2;
    const l = P(LAYOUT.leafHit);
    info.leaf.x = l.x;
    info.leaf.y = l.y;
    // everything grows a little as the camera comes closer
    unit = Math.max(0.86, Math.min(2.6, (info.bloom.r / LAYOUT.bloomRadius / CM) ** 0.72));
    info.unit = unit;
    // the eye looks toward the bloom
    const dx = info.bloom.x - info.eye.x;
    const dy = info.bloom.y - info.eye.y;
    const d = Math.hypot(dx, dy) || 1;
    const s = eyeScale();
    info.iris.x = info.eye.x + (dx / d) * 11 * s;
    info.iris.y = info.eye.y + (dy / d) * 5 * s;
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    measure();
    const { bloom, leaf: Q, eye: e } = info;
    if (v.rose.grow > 0 || v.leaf.grow > 0) {
      // the lens, on the screen: its two ribbons leave from opposite sides of its centre
      const s = P(LAYOUT.lamp);
      const lx = s.x;
      const ly = s.y;
      const toBloomX = bloom.x - lx;
      const toBloomY = bloom.y - ly;
      const toLeafX = Q.x - lx;
      const toLeafY = Q.y - ly;
      const lb = Math.hypot(toBloomX, toBloomY) || 1;
      const ll = Math.hypot(toLeafX, toLeafY) || 1;
      const lens = halfWidth() + 1.5 * unit;
      const mx = toBloomX / lb + toLeafX / ll;
      const my = toBloomY / lb + toLeafY / ll;
      const ml = Math.hypot(mx, my) || 1;
      const nx = -my / ml;
      const ny = mx / ml;
      const sign = nx * (toBloomX - toLeafX) + ny * (toBloomY - toLeafY) > 0 ? 1 : -1;
      towardEye.x = e.x - lx;
      towardEye.y = e.y - ly;
      const rx = bloom.x;
      const ry = bloom.y;
      const R = bloom.r;
      if (v.rose.on && v.rose.grow > 0)
        ribbon('rose', lx + nx * sign * lens, ly + ny * sign * lens, rx - R * 0.22, ry - R * 0.44, (x, y, dx, dy) =>
          toCircle(x, y, dx, dy, rx, ry, R),
        );
      const a0 = P(LAYOUT.leafAxis[0]);
      const ax0 = a0.x;
      const ay0 = a0.y;
      const a1 = P(LAYOUT.leafAxis[1]);
      const ax1 = a1.x;
      const ay1 = a1.y;
      if (v.leaf.on && v.leaf.grow > 0)
        ribbon('leaf', lx - nx * sign * lens, ly - ny * sign * lens, Q.x, Q.y, (x, y, dx, dy) => toLine(x, y, dx, dy, ax0, ay0, ax1, ay1));
    }
    if (v.rose.sight > 0) sight(bloom.x - bloom.r * 0.1, bloom.y - bloom.r * 0.3, v.rose.sight);
    if (v.leaf.sight > 0) sight(Q.x + 18 * unit, Q.y, v.leaf.sight);
    for (const key of ['leaf', 'rose']) {
      const o = v[key];
      if (!o.on || o.out <= 0 || !o.keeps) continue;
      const i = BANDS.indexOf(o.keeps);
      if (v.widths[i] >= 0.05) arrow(key, ends[key][i * 2], ends[key][i * 2 + 1], SPECTRUM[o.keeps], o.out);
    }
    if (v.eye) eye(e.x, e.y, info.iris.x, info.iris.y);
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  return { canvas, view: v, info, paint };
}
