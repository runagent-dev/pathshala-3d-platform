// The drawing over the 3D view: the book's arrows as a crisp textbook diagram. Nothing here is a 3D object. The band of the
// spectrum colours, the arrows that leave the petal and the leaf, and the eye are painted on a 2D canvas over the view, from
// the scene's 3D points projected through the camera: even anti-aliased shapes of a constant width, with filled chevrons,
// at any size. The band ends on the surface it meets: a colour that is absorbed fades out into it, and the object's
// own colour leaves from the exact spot where its stripe landed.
import * as THREE from 'three';
import { BANDS } from './reading.js';
import { LAYOUT } from './scene.js';

/** The band's colours, and the colour of each object's arrow (the same red and green). */
export const SPECTRUM = { violet: '#7a3fe0', blue: '#1c7ed6', green: '#2f9e44', yellow: '#fcc419', orange: '#fd7e14', red: '#e03131' };
const EDGE = '#14171c';
const STRIPE = 4.2; // px: one colour's width in the white band
const FADE = 26; // px: the length over which an absorbed colour sinks into the surface
const SINK = 9; // px: how far past the outline it lands

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
    unit = Math.max(0.86, Math.min(1.5, Math.min(w, h) / 400));
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
  const v = {
    widths: new Float32Array(6).fill(1), // each colour's width in the band, in stripes
    grow: 0, // how far the band has come, 0 … 1
    absorb: 0, // how far the absorbed colours have sunk in, 0 … 1
    rose: { on: true, keeps: 'red', out: 0 }, // the band to the bloom: which colour it gives back, how far that has gone
    leaf: { on: true, keeps: 'green', out: 0 },
    eye: true,
  };

  // the two ribbons start side by side on the lens, the eye's direction fixes which edge is red
  const eyeOffset = { x: 0, y: 0 };
  /** Where each ribbon's colours ended, canvas px, in the order of BANDS. */
  const ends = { rose: new Float32Array(12), leaf: new Float32Array(12) };
  const seg = { dx: 0, dy: 0, nx: 0, ny: 0 };

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

  function gapFor() {
    // the widths in pixels; a coloured light's stripe is the band's middle
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += v.widths[i];
    return (sum * STRIPE * unit) / 2;
  }

  /** The chevron that shows the way the light goes: the ribbon's own stripes, wider, cut to an arrowhead. */
  function bandHead(cx, cy, s) {
    const half = gapFor();
    const spread = 1.55;
    const hw = half * spread;
    const length = Math.max(16 * unit, hw * 1.15);
    const { dx, dy, nx, ny } = s;
    const tipX = cx + dx * length * 0.62;
    const tipY = cy + dy * length * 0.62;
    const bx = cx - dx * length * 0.38;
    const by = cy - dy * length * 0.38;
    const midX = cx - dx * length * 0.1;
    const midY = cy - dy * length * 0.1;
    const shape = () => {
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(bx + nx * hw, by + ny * hw);
      ctx.lineTo(midX, midY);
      ctx.lineTo(bx - nx * hw, by - ny * hw);
      ctx.closePath();
    };
    shape();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 2.8 * unit;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.save();
    shape();
    ctx.clip();
    let o = -half;
    for (let i = 0; i < 6; i++) {
      const wd = v.widths[i] * STRIPE * unit;
      if (wd > 0.1) {
        // this colour's slice of the head, side by side as in the band
        const a0 = o * spread;
        const a1 = (o + wd) * spread;
        const fx = dx * length * 1.1;
        const fy = dy * length * 1.1;
        ctx.beginPath();
        ctx.moveTo(cx - fx + nx * a0, cy - fy + ny * a0);
        ctx.lineTo(cx + fx + nx * a0, cy + fy + ny * a0);
        ctx.lineTo(cx + fx + nx * (a1 + 0.5), cy + fy + ny * (a1 + 0.5));
        ctx.lineTo(cx - fx + nx * (a1 + 0.5), cy - fy + ny * (a1 + 0.5));
        ctx.closePath();
        ctx.fillStyle = SPECTRUM[BANDS[i]];
        ctx.fill();
      }
      o += wd;
    }
    ctx.restore();
  }

  /**
   * A ribbon from the lens to a surface. hit(x, y, dx, dy) → distance to the surface along that line.
   * keeps: the colour that is not absorbed here.
   */
  function ribbon(key, ax, ay, tx, ty, keeps, head, hit) {
    const store = ends[key];
    let dx = tx - ax;
    let dy = ty - ay;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    // red toward the eye, as the band is drawn in the reference: n points to the eye's side
    let nx = -dy;
    let ny = dx;
    if (nx * eyeOffset.x + ny * eyeOffset.y < 0) {
      nx = -nx;
      ny = -ny;
    }
    const half = gapFor();
    // every colour's ending first: the shared edges are drawn from them
    let o = -half;
    let first = -1;
    let last = -1;
    let shortest = 1e9;
    for (let i = 0; i < 6; i++) {
      const wd = v.widths[i] * STRIPE * unit;
      const cx = ax + nx * (o + wd / 2);
      const cy = ay + ny * (o + wd / 2);
      let d = hit(cx, cy, dx, dy);
      if (d < 0) d = l;
      d += SINK * unit;
      store[i * 2] = cx + dx * d;
      store[i * 2 + 1] = cy + dy * d;
      if (wd > 0.3) {
        if (first < 0) first = i;
        last = i;
        shortest = Math.min(shortest, d);
      }
      o += wd;
    }
    if (first < 0) return;
    const reach = v.grow;
    // the dark edge of the band, along both sides, fading as the colours do
    const edgeLine = (off, i) => {
      const x = ax + nx * off;
      const y = ay + ny * off;
      const end = Math.hypot(store[i * 2] - ax - nx * off, store[i * 2 + 1] - ay - ny * off);
      const d = end * reach;
      const fade = BANDS[i] === keeps ? 0 : FADE * unit * v.absorb;
      const g = ctx.createLinearGradient(x, y, x + dx * end, y + dy * end);
      g.addColorStop(0, EDGE);
      g.addColorStop(Math.max(0, 1 - fade / end), EDGE);
      g.addColorStop(1, fade > 0 ? 'rgba(20,23,28,0)' : EDGE);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.4 * unit;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx * d, y + dy * d);
      ctx.stroke();
    };
    edgeLine(-half - 0.4 * unit, first);
    edgeLine(half + 0.4 * unit, last);
    o = -half;
    for (let i = 0; i < 6; i++) {
      const wd = v.widths[i] * STRIPE * unit;
      if (wd > 0.1) {
        const name = BANDS[i];
        const color = SPECTRUM[name];
        const sx = ax + nx * o;
        const sy = ay + ny * o;
        const mx = ax + nx * (o + wd / 2);
        const my = ay + ny * (o + wd / 2);
        const end = Math.hypot(store[i * 2] - mx, store[i * 2 + 1] - my);
        const d = end * reach;
        const fade = name === keeps ? 0 : FADE * unit * v.absorb;
        if (fade > 0.5) {
          const g = ctx.createLinearGradient(mx, my, mx + dx * end, my + dy * end);
          const k = Math.max(0, 1 - fade / end);
          g.addColorStop(0, color);
          g.addColorStop(k, color);
          // the alpha falls away in the colour itself: no grey at the end of the fade
          g.addColorStop(1, `${color}00`);
          ctx.fillStyle = g;
        } else ctx.fillStyle = color;
        const ov = i < 5 ? 0.5 : 0; // a hair under the next stripe: no seam shows between them
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + nx * (wd + ov), sy + ny * (wd + ov));
        ctx.lineTo(sx + nx * (wd + ov) + dx * d, sy + ny * (wd + ov) + dy * d);
        ctx.lineTo(sx + dx * d, sy + dy * d);
        ctx.closePath();
        ctx.fill();
      }
      o += wd;
    }
    // the chevron, past half way
    if (reach > head + 0.04) {
      Object.assign(seg, { dx, dy, nx, ny });
      bandHead(ax + dx * shortest * head, ay + dy * shortest * head, seg);
    }
  }

  /** An arrow from a point on a surface to the eye. */
  function arrow(x0, y0, x1, y1, color, k) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const reach = l * k;
    const head = 22 * unit;
    const hw = 10.5 * unit;
    const tipX = x0 + ux * reach;
    const tipY = y0 + uy * reach;
    const neckX = tipX - ux * head * 0.82;
    const neckY = tipY - uy * head * 0.82;
    const shaft = () => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(neckX, neckY);
    };
    ctx.lineCap = 'round';
    shaft();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 8.2 * unit;
    ctx.stroke();
    shaft();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5.4 * unit;
    ctx.stroke();
    const bx = tipX - ux * head;
    const by = tipY - uy * head;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bx - uy * hw, by + ux * hw);
    ctx.lineTo(neckX, neckY);
    ctx.lineTo(bx + uy * hw, by - ux * hw);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 1.5 * unit;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  /** The eye: a simple line drawing, looking down toward the rose. */
  function eye(x, y, lookX, lookY) {
    const s = 0.86 * unit;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const W = 36;
    const H = 17;
    // the lids, a soft skin shape, so the eye reads on a dim wall
    ctx.beginPath();
    ctx.moveTo(-W - 12, 3);
    ctx.bezierCurveTo(-W + 2, -H - 26, W - 4, -H - 27, W + 12, -5);
    ctx.bezierCurveTo(W - 6, H + 11, -W + 8, H + 14, -W - 12, 3);
    ctx.closePath();
    ctx.fillStyle = '#e9bd96';
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,23,28,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // the white
    const almond = () => {
      ctx.beginPath();
      ctx.moveTo(-W, 4);
      ctx.bezierCurveTo(-W * 0.5, -H - 3, W * 0.42, -H - 5, W, -3);
      ctx.bezierCurveTo(W * 0.48, H + 1, -W * 0.46, H + 3, -W, 4);
      ctx.closePath();
    };
    almond();
    ctx.fillStyle = '#fbfbf8';
    ctx.fill();
    // the iris and the pupil turn toward the light that comes in
    ctx.save();
    almond();
    ctx.clip();
    const ix = lookX * 10;
    const iy = lookY * 4.5;
    const iris = ctx.createRadialGradient(ix, iy, 4, ix, iy, 15);
    iris.addColorStop(0, '#a56a35');
    iris.addColorStop(0.7, '#6d4220');
    iris.addColorStop(1, '#382010');
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(ix, iy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0e0f12';
    ctx.beginPath();
    ctx.arc(ix, iy, 6.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(ix + 4.6, iy - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // the shade of the upper lid
    ctx.fillStyle = 'rgba(30,20,12,0.16)';
    ctx.beginPath();
    ctx.moveTo(-W, 4);
    ctx.bezierCurveTo(-W * 0.5, -H - 3, W * 0.42, -H - 5, W, -3);
    ctx.bezierCurveTo(W * 0.42, -H + 3, -W * 0.5, -H + 5, -W, 4);
    ctx.fill();
    ctx.restore();
    // the upper lid, heavy; the lower, fine
    almond();
    ctx.strokeStyle = 'rgba(30,20,14,0.6)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-W, 4);
    ctx.bezierCurveTo(-W * 0.5, -H - 3, W * 0.42, -H - 5, W, -3);
    ctx.strokeStyle = '#191310';
    ctx.lineWidth = 3.1;
    ctx.stroke();
    // the crease
    ctx.beginPath();
    ctx.moveTo(-W * 0.82, -7);
    ctx.bezierCurveTo(-W * 0.4, -H - 9, W * 0.42, -H - 10, W * 0.9, -9);
    ctx.strokeStyle = 'rgba(70,40,24,0.65)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  const tmp = new THREE.Vector3();

  /** Canvas px of the ribbons' key points, for the labels. */
  const info = { lens: { x: 0, y: 0 }, bloom: { x: 0, y: 0, r: 0 }, eye: { x: 0, y: 0 }, leaf: { x: 0, y: 0 }, leafEnd: { x: 0, y: 0 } };

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
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    measure();
    if (v.grow > 0) {
      // the lens, on the screen: its two ribbons leave from opposite sides of its centre
      const s = P(LAYOUT.lamp);
      const lx = s.x;
      const ly = s.y;
      info.lens.x = lx;
      info.lens.y = ly;
      const toBloomX = info.bloom.x - lx;
      const toBloomY = info.bloom.y - ly;
      const toLeafX = info.leaf.x - lx;
      const toLeafY = info.leaf.y - ly;
      const lb = Math.hypot(toBloomX, toBloomY) || 1;
      const ll = Math.hypot(toLeafX, toLeafY) || 1;
      const lens = gapFor() + 1.5 * unit;
      // apart across the beam: the bloom's ribbon above, the leaf's below
      const mx = toBloomX / lb + toLeafX / ll;
      const my = toBloomY / lb + toLeafY / ll;
      const ml = Math.hypot(mx, my) || 1;
      const nx = -my / ml;
      const ny = mx / ml;
      const sign = nx * (toBloomX - toLeafX) + ny * (toBloomY - toLeafY) > 0 ? 1 : -1;
      eyeOffset.x = info.eye.x - lx;
      eyeOffset.y = info.eye.y - ly;
      const bloomR = info.bloom.r;
      const rx = info.bloom.x;
      const ry = info.bloom.y;
      if (v.rose.on)
        ribbon('rose', lx + nx * sign * lens, ly + ny * sign * lens, rx - bloomR * 0.2, ry - bloomR * 0.42, v.rose.keeps, 0.5, (x, y, dx, dy) =>
          toCircle(x, y, dx, dy, rx, ry, bloomR),
        );
      const a0 = P(LAYOUT.leafAxis[0]);
      const ax0 = a0.x;
      const ay0 = a0.y;
      const a1 = P(LAYOUT.leafAxis[1]);
      const ax1 = a1.x;
      const ay1 = a1.y;
      if (v.leaf.on)
        ribbon('leaf', lx - nx * sign * lens, ly - ny * sign * lens, info.leaf.x, info.leaf.y, v.leaf.keeps, 0.66, (x, y, dx, dy) =>
          toLine(x, y, dx, dy, ax0, ay0, ax1, ay1),
        );
    }
    const ex = info.eye.x;
    const ey = info.eye.y;
    const away = (x, y) => {
      // an arrow stops at the edge of the eye
      const dx = ex - x;
      const dy = ey - y;
      const l = Math.hypot(dx, dy) || 1;
      const stop = 34 * unit;
      pt.x = ex - (dx / l) * stop;
      pt.y = ey - (dy / l) * stop * 0.75;
    };
    for (const [key, o] of [
      ['leaf', v.leaf],
      ['rose', v.rose],
    ]) {
      if (!o.on || o.out <= 0 || !o.keeps) continue;
      const i = BANDS.indexOf(o.keeps);
      if (v.widths[i] < 0.05) continue;
      const x = ends[key][i * 2];
      const y = ends[key][i * 2 + 1];
      away(x, y);
      arrow(x, y, pt.x, pt.y, SPECTRUM[o.keeps], o.out);
    }
    if (v.eye) {
      // it looks toward the bloom
      const dx = info.bloom.x - ex;
      const dy = info.bloom.y - ey;
      const l = Math.hypot(dx, dy) || 1;
      eye(ex, ey, dx / l, dy / l);
    }
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  return {
    canvas,
    view: v,
    info,
    paint,
    /** Small boxes along a ribbon or an arrow, so labels step round them. */
    boxes(out = []) {
      const pad = 9 * unit;
      const line = (x0, y0, x1, y1, n, r) => {
        for (let i = 0; i <= n; i++) {
          const k = i / n;
          const x = x0 + (x1 - x0) * k;
          const y = y0 + (y1 - y0) * k;
          out.push({ left: x - r, top: y - r, right: x + r, bottom: y + r });
        }
      };
      const { lens, eye: e } = info;
      if (v.grow > 0) {
        for (const key of ['rose', 'leaf']) {
          const o = v[key];
          if (!o.on) continue;
          line(lens.x, lens.y, ends[key][4], ends[key][5], 14, pad * 1.8);
          const i = BANDS.indexOf(o.keeps);
          if (o.out > 0 && v.widths[i] > 0.05) line(ends[key][i * 2], ends[key][i * 2 + 1], e.x, e.y, 14, pad * 0.7);
        }
      }
      if (v.eye) out.push({ left: e.x - 40 * unit, top: e.y - 26 * unit, right: e.x + 40 * unit, bottom: e.y + 24 * unit });
      return out;
    },
  };
}
