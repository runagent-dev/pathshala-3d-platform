// The magnifier of the smooth-and-rough step: one clean inset, drawn in the same vector style as the laws, with a thin line
// to the spot on the water it enlarges. Inside, the book's চিত্র ৮.০৭ as a cross-section of the surface: three parallel rays
// come in from the upper left, each meets the surface, each has its dashed normal, each leaves by the law. Every point comes
// from loupeInto in reading.js, so what is drawn is traced. The strength of the waves morphs the line and the rays together.
import { LOUPE, LOUPE_FIELDS, loupeHeight, loupeInto, loupeSpread } from './reading.js';

const W = 400; // the inset's drawing units
const H = 172;
const Y0 = 122; // where the undisturbed surface lies, from the top
const X0 = W / 2 - 6; // the rays lean right on the way out: the drawing sits a little left
const MIN_S = 0.6; // the smallest frames: the inset stays at least 240 px across
const MAX_S = 1.7;
const MIN_TEXT = 10; // px
const FONT = "'Noto Sans Bengali', 'Segoe UI', Roboto, Arial, sans-serif";
const ARC_R = 34;
const INK = '#212529';
const WATER = '#0b4f6c';
const AMBER_TEXT = '#8a4b00';

/**
 * @param {{ colors: Record<string, string>, words: Record<string, string> }} o colors: ray, rayDark, normal, ti, tr;
 *   words: smooth, rough, parallel, spread, normal, note, ti, tr (ti and tr are the letter under the θ).
 */
export function createLoupe({ colors, words }) {
  const rays = new Float32Array(LOUPE.hits.length * LOUPE_FIELDS);
  const box = { x: 0, y: 0, w: 0, h: 0, s: 1 };
  let g = null; // the context, while painting
  let sc = 1;
  const px = (x) => box.x + (X0 + x) * sc;
  const py = (y) => box.y + (Y0 - y) * sc;

  function roundRect(x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function line(ax, ay, bx, by) {
    g.beginPath();
    g.moveTo(px(ax), py(ay));
    g.lineTo(px(bx), py(by));
  }
  function head(x, y, dx, dy, size, color, edge) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = -dy / l; // on the canvas y runs down
    const cx = px(x);
    const cy = py(y);
    const a = size * sc * 0.6;
    const b = size * sc * 0.4;
    const c = size * sc * 0.42;
    const n = size * sc * 0.12;
    g.beginPath();
    g.moveTo(cx + ux * a, cy + uy * a);
    g.lineTo(cx - ux * b - uy * c, cy - uy * b + ux * c);
    g.lineTo(cx - ux * n, cy - uy * n);
    g.lineTo(cx - ux * b + uy * c, cy - uy * b - ux * c);
    g.closePath();
    g.fillStyle = color;
    g.fill();
    g.strokeStyle = edge;
    g.lineWidth = sc;
    g.stroke();
  }
  function ray(ax, ay, bx, by, at) {
    g.setLineDash([]);
    g.lineCap = 'round';
    line(ax, ay, bx, by);
    g.strokeStyle = colors.rayDark;
    g.lineWidth = 4 * sc;
    g.stroke();
    line(ax, ay, bx, by);
    g.strokeStyle = colors.ray;
    g.lineWidth = 2.5 * sc;
    g.stroke();
    head(ax + (bx - ax) * at, ay + (by - ay) * at, bx - ax, by - ay, 13, colors.ray, colors.rayDark);
  }
  function normal(x, y, nx, ny, length) {
    g.lineCap = 'butt';
    g.setLineDash([7 * sc, 5 * sc]);
    line(x, y, x + nx * length, y + ny * length);
    g.strokeStyle = colors.normal;
    g.lineWidth = 1.8 * sc;
    g.stroke();
    g.setLineDash([]);
  }
  function text(str, x, y, size, color, align = 'center', weight = 600) {
    g.font = `${weight} ${Math.max(MIN_TEXT, size * sc)}px ${FONT}`;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.fillStyle = color;
    g.fillText(str, x, y);
  }
  /** θ with its small letter under the line (a canvas has no <sub>). */
  function theta(letter, x, y, color) {
    text('θ', x - 3 * sc, y, 15, color, 'center');
    text(letter, x + 3.5 * sc, y + 4 * sc, 10.5, color, 'center');
  }
  /** One angle, on the screen's sense: signed angles from the upright, + toward +x. */
  function arc(x, y, from, to, r, color) {
    const a = ((from - 90) * Math.PI) / 180;
    const b = ((to - 90) * Math.PI) / 180;
    g.beginPath();
    g.arc(px(x), py(y), r * sc, a, b, to < from);
    g.strokeStyle = color;
    g.lineWidth = 2 * sc;
    g.stroke();
  }

  function surface(strength, time) {
    const left = -X0;
    const right = W - X0;
    const trace = () => {
      for (let x = left; x <= right; x += 4) {
        const h = loupeHeight(x, strength, time);
        if (x === left) g.moveTo(px(x), py(h));
        else g.lineTo(px(x), py(h));
      }
    };
    g.beginPath();
    trace();
    g.lineTo(box.x + box.w, box.y + box.h);
    g.lineTo(box.x, box.y + box.h);
    g.closePath();
    g.fillStyle = '#cfe8f1';
    g.fill();
    g.beginPath();
    trace();
    g.strokeStyle = WATER;
    g.lineWidth = 2.4 * sc;
    g.lineJoin = 'round';
    g.stroke();
  }

  /** The rays' way through the surface now. Returns the widest angle between the reflected rays, degrees. */
  function trace(strength, time) {
    loupeInto(rays, strength, time);
    return loupeSpread(rays);
  }

  /** Where the inset goes in a view of w × h: along the bottom, in the near water, clear of the mountain's image. */
  function layout(w, h) {
    const room = h * 0.47;
    const s = Math.min(MAX_S, (w - 16) / W, Math.max(room / H, MIN_S));
    box.s = s;
    box.w = W * s;
    box.h = H * s;
    box.x = (w - box.w) / 2;
    box.y = h - box.h - 8;
    return box;
  }

  function frame(alpha) {
    sc = box.s;
    g.globalAlpha = alpha;
    roundRect(box.x, box.y, box.w, box.h, 13 * sc);
    g.fillStyle = '#fdfdf9';
    g.fill();
  }
  function edge() {
    roundRect(box.x, box.y, box.w, box.h, 13 * sc);
    g.strokeStyle = '#33506b';
    g.lineWidth = 1.6;
    g.setLineDash([]);
    g.stroke();
  }
  /** A thin line from the rim to the spot on the water, and a small ring round the spot. */
  function leader(x, y) {
    const tx = Math.min(box.x + box.w - 24, Math.max(box.x + 24, x));
    const ring = 9;
    for (const [color, width] of [
      ['#16324a', 3.4],
      ['#ffffff', 1.8],
    ]) {
      g.beginPath();
      g.moveTo(tx, box.y);
      const a = Math.atan2(box.y - y, tx - x);
      g.lineTo(x + Math.cos(a) * ring, y + Math.sin(a) * ring);
      g.moveTo(x + ring, y);
      g.arc(x, y, ring, 0, Math.PI * 2);
      g.strokeStyle = color;
      g.lineWidth = width;
      g.stroke();
    }
  }

  /** The inset on the context ctx, in view pixels. spot: { x, y } on the water or null. */
  function paint(ctx, { strength, time, alpha = 1, spot = null }) {
    g = ctx;
    g.save();
    if (spot) {
      g.globalAlpha = alpha;
      leader(spot.x, spot.y);
    }
    frame(alpha);
    g.save();
    roundRect(box.x, box.y, box.w, box.h, 13 * sc);
    g.clip();
    surface(strength, time);
    trace(strength, time);
    const n = LOUPE.hits.length;
    const dIn = Math.sin((LOUPE.theta * Math.PI) / 180);
    const dUp = Math.cos((LOUPE.theta * Math.PI) / 180);
    for (let i = 0; i < n; i++) {
      const o = i * LOUPE_FIELDS;
      normal(rays[o], rays[o + 1], rays[o + 3], rays[o + 4], LOUPE.normal);
    }
    // one pair of equal arcs, on the middle ray
    const m = 1 * LOUPE_FIELDS;
    const lean = rays[m + 2];
    const thetaI = rays[m + 7];
    arc(rays[m], rays[m + 1], lean - thetaI, lean, ARC_R, colors.ti);
    arc(rays[m], rays[m + 1], lean, lean + thetaI, ARC_R, colors.tr);
    for (let i = 0; i < n; i++) {
      const o = i * LOUPE_FIELDS;
      const x = rays[o];
      const y = rays[o + 1];
      ray(LOUPE.hits[i] - dIn * LOUPE.in, dUp * LOUPE.in, x, y, 0.5);
      ray(x, y, x + rays[o + 5] * LOUPE.out, y + rays[o + 6] * LOUPE.out, 0.6);
    }
    const label = (angle, r, letter, color) => {
      const a = (angle * Math.PI) / 180;
      theta(letter, px(rays[m] + Math.sin(a) * r), py(rays[m + 1] + Math.cos(a) * r), color);
    };
    label(lean - thetaI / 2, ARC_R + 15, words.ti, colors.ti);
    label(lean + thetaI / 2, ARC_R + 15, words.tr, colors.tr);
    const rough = strength > 0.5;
    // the words: the surface under its line, the result beside the rays that go out
    text(rough ? words.rough : words.smooth, px(0), py(-27), 15.5, WATER);
    text(words.note, box.x + box.w - 9 * sc, py(-37), 10.5, '#35586b', 'right', 400);
    text(rough ? words.spread : words.parallel, box.x + box.w - 11 * sc, box.y + 15 * sc, 14.5, AMBER_TEXT, 'right');
    const tip = rays[3 + 0] * LOUPE.normal + rays[0];
    text(words.normal, Math.max(box.x + 34 * sc, px(tip)), box.y + 15 * sc, 13, colors.normal);
    g.restore();
    edge();
    g.restore();
  }

  /** A way out of the middle ray's point, degrees from the upright: the law's, the one flat water gives, two wrong ones. */
  function angleOf(kind, m) {
    const real = (Math.atan2(rays[m + 5], rays[m + 6]) * 180) / Math.PI;
    if (kind === 'real') return real;
    if (kind === 'flat') return LOUPE.theta;
    return kind === 'wrong' ? LOUPE.theta + (LOUPE.theta - real) + 2 : -34;
  }
  /** The test on one slope: one ray, its normal, four rays out, each with its letter. picks: [{ kind, letter }]. */
  function paintPick(ctx, { strength, time, alpha = 1, picks, spot = null }) {
    g = ctx;
    g.save();
    if (spot) {
      g.globalAlpha = alpha;
      leader(spot.x, spot.y);
    }
    frame(alpha);
    g.save();
    roundRect(box.x, box.y, box.w, box.h, 13 * sc);
    g.clip();
    surface(strength, time);
    trace(strength, time);
    const m = 1 * LOUPE_FIELDS;
    const x = rays[m];
    const y = rays[m + 1];
    normal(x, y, rays[m + 3], rays[m + 4], LOUPE.normal + 8);
    const dIn = Math.sin((LOUPE.theta * Math.PI) / 180);
    const dUp = Math.cos((LOUPE.theta * Math.PI) / 180);
    ray(-dIn * LOUPE.normal, dUp * LOUPE.normal, x, y, 0.5);
    for (const p of picks) {
      const a = (angleOf(p.kind, m) * Math.PI) / 180;
      const tx = x + Math.sin(a) * LOUPE.out;
      const ty = y + Math.cos(a) * LOUPE.out;
      ray(x, y, tx, ty, 0.62);
      const lx = px(tx + Math.sin(a) * 12);
      const ly = py(ty + Math.cos(a) * 12);
      g.beginPath();
      g.arc(lx, ly, 10.5 * sc, 0, Math.PI * 2);
      g.fillStyle = '#ffffff';
      g.fill();
      g.strokeStyle = colors.rayDark;
      g.lineWidth = 1.2 * sc;
      g.stroke();
      text(p.letter, lx, ly, 13.5, INK);
    }
    text(words.normal, px(x + rays[m + 3] * (LOUPE.normal + 8)) - 34 * sc, box.y + 15 * sc, 13, colors.normal);
    g.restore();
    edge();
    g.restore();
  }

  return { box, layout, trace, paint, paintPick, rays };
}
