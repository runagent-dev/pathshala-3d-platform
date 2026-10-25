// The forces added tip to tail, drawn small in the panel (an SVG at its own pixel size, so the symbols stay 11.5 px
// on every screen): each force's arrow starts where the one before it ended. When the last one ends on the ring
// where the first began, the chain is closed and the resultant is zero; otherwise the resultant (black, dashed) goes
// from the ring to the end. Every arrow carries its symbol, placed where it touches no arrow and no other symbol, so
// colour is never alone.
import { chain, len } from './physics.js';

const NS = 'http://www.w3.org/2000/svg';
const PAD = 8; // px kept free round the drawing
const MAX_SCALE = 58 / 9.8; // px per N: the weight of 1 kg is 58 px long when nothing needs more room
const SHIFT = 10; // px: an arrow that goes straight back over the one before is drawn this far beside it
const FONT = 11.5; // px
const FONT_FAMILY = "'Noto Sans Bengali', sans-serif";

let measureCtx = null;
/** The width of a symbol in px (the tspan of T₁ counts as a smaller digit). */
function textWidth(html) {
  measureCtx ||= document.createElement('canvas').getContext('2d');
  measureCtx.font = `700 ${FONT}px ${FONT_FAMILY}`;
  const plain = html.replace(/<tspan[^>]*>(.*?)<\/tspan>/g, '$1').replace(/<[^>]+>/g, '');
  return measureCtx.measureText(plain).width + 2;
}

function el(svg, name, attrs) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  svg.appendChild(e);
  return e;
}

/** An arrow from a to b (px): a shaft and a head, in its colour. */
function arrow(svg, a, b, { color, dashed = false, width = 2.4 }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy);
  if (l < 1) return;
  const ux = dx / l;
  const uy = dy / l;
  const head = Math.min(8, l * 0.55);
  const hw = head * 0.48;
  const bx = b.x - ux * head;
  const by = b.y - uy * head;
  el(svg, 'line', {
    x1: a.x,
    y1: a.y,
    x2: bx,
    y2: by,
    stroke: color,
    'stroke-width': width,
    'stroke-linecap': 'round',
    ...(dashed ? { 'stroke-dasharray': '3.2 2.6' } : {}),
  });
  el(svg, 'path', { d: `M${b.x},${b.y} L${bx - uy * hw},${by + ux * hw} L${bx + uy * hw},${by - ux * hw} Z`, fill: color });
}

/** The arrows' segments in px for a scale k (N → px, y up), arrows that turn straight back moved aside. */
function layout(list, closed, k) {
  const pts = chain(
    list.map((f) => f.v),
    1e-3,
  ).points.map((p) => ({ x: p.x * k, y: -p.y * k }));
  let shift = { x: 0, y: 0 };
  const segs = [];
  for (let i = 0; i < list.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const prev = segs[i - 1];
    if (prev) {
      const pl = Math.hypot(prev.b.x - prev.a.x, prev.b.y - prev.a.y) || 1;
      const dot = ((b.x - a.x) * (prev.b.x - prev.a.x) + (b.y - a.y) * (prev.b.y - prev.a.y)) / ((Math.hypot(b.x - a.x, b.y - a.y) || 1) * pl);
      if (dot < -0.97) shift = { x: shift.x - ((prev.b.y - prev.a.y) / pl) * SHIFT, y: shift.y + ((prev.b.x - prev.a.x) / pl) * SHIFT };
    }
    segs.push({ a: { x: a.x + shift.x, y: a.y + shift.y }, b: { x: b.x + shift.x, y: b.y + shift.y }, ...list[i] });
  }
  let res = null;
  if (!closed) {
    const first = segs[0];
    const last = segs[segs.length - 1];
    res = { a: { ...first.a }, b: { ...last.b } };
    if (segs.length === 1) {
      // a resultant along the only force: beside it
      const l = Math.hypot(first.b.x - first.a.x, first.b.y - first.a.y) || 1;
      const n = { x: (-(first.b.y - first.a.y) / l) * SHIFT, y: ((first.b.x - first.a.x) / l) * SHIFT };
      res = { a: { x: first.a.x + n.x, y: first.a.y + n.y }, b: { x: first.b.x + n.x, y: first.b.y + n.y } };
    }
  }
  const all = [...segs.flatMap((s) => [s.a, s.b]), ...(res ? [res.a, res.b] : [])];
  const box = {
    x0: Math.min(...all.map((p) => p.x)),
    x1: Math.max(...all.map((p) => p.x)),
    y0: Math.min(...all.map((p) => p.y)),
    y1: Math.max(...all.map((p) => p.y)),
  };
  return { segs, res, box };
}

/**
 * Draws the forces tip to tail, fitted to the SVG's own size (every segment, the moved ones and the resultant
 * included, with room for the symbols at the sides).
 * @param {SVGSVGElement} svg
 * @param {{ forces: { v: { x: number, y: number }, color: string, label: string }[], resultant: { color: string, label: string } }} spec
 */
export function drawSum(svg, { forces, resultant }) {
  const W = Math.round(svg.clientWidth || svg.getBoundingClientRect().width) || 116;
  const H = Math.round(svg.clientHeight || svg.getBoundingClientRect().height) || 92;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.replaceChildren();
  const list = forces.filter((f) => len(f.v) > 1e-9);
  if (!list.length) return;
  const closed = chain(
    list.map((f) => f.v),
    1e-3,
  ).closed;
  // room: the symbols need about 14 px on each side and 7 px above and below
  const roomW = W - 2 * PAD - 28;
  const roomH = H - 2 * PAD - 8;
  let k = MAX_SCALE;
  let L = layout(list, closed, k);
  for (let i = 0; i < 4; i++) {
    const bw = L.box.x1 - L.box.x0;
    const bh = L.box.y1 - L.box.y0;
    if (bw <= roomW + 0.5 && bh <= roomH + 0.5) break;
    // the moved arrows keep their 10 px whatever the scale: shrink the rest
    const fx = bw > roomW ? Math.max(0.05, (roomW - Math.min(bw, SHIFT * 2)) / Math.max(bw - Math.min(bw, SHIFT * 2), 1e-6)) : 1;
    const fy = bh > roomH ? Math.max(0.05, (roomH - Math.min(bh, SHIFT * 2)) / Math.max(bh - Math.min(bh, SHIFT * 2), 1e-6)) : 1;
    k *= Math.min(fx, fy, 0.99);
    L = layout(list, closed, k);
  }
  const dx = W / 2 - (L.box.x0 + L.box.x1) / 2;
  const dy = H / 2 - (L.box.y0 + L.box.y1) / 2;
  const move = (p) => ({ x: p.x + dx, y: p.y + dy });
  for (const s of L.segs) {
    s.a = move(s.a);
    s.b = move(s.b);
  }
  const res = L.res ? { a: move(L.res.a), b: move(L.res.b) } : null;
  const centre = { x: W / 2, y: H / 2 };

  for (const s of L.segs) arrow(svg, s.a, s.b, s);
  if (res) arrow(svg, res.a, res.b, { color: resultant.color, dashed: true, width: 2.2 });
  el(svg, 'circle', { cx: L.segs[0].a.x, cy: L.segs[0].a.y, r: 2.8, fill: '#fff', stroke: resultant.color, 'stroke-width': 1.6 });

  // the symbols: try places beside each arrow (away from the middle first), keep the first that touches nothing
  const lines = [...L.segs.map((s) => [s.a, s.b]), ...(res ? [[res.a, res.b]] : [])];
  const samples = [];
  for (const [a, b] of lines) {
    const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let i = 0; i <= n; i++) samples.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
  }
  const placed = [];
  const free = (r) =>
    r.x0 >= 1 &&
    r.x1 <= W - 1 &&
    r.y0 >= 1 &&
    r.y1 <= H - 1 &&
    !placed.some((q) => r.x0 < q.x1 + 2 && r.x1 > q.x0 - 2 && r.y0 < q.y1 + 1 && r.y1 > q.y0 - 1) &&
    !samples.some((p) => p.x > r.x0 - 2.5 && p.x < r.x1 + 2.5 && p.y > r.y0 - 2.5 && p.y < r.y1 + 2.5);
  const label = ([a, b], text, color) => {
    const w = textWidth(text);
    const h = FONT;
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const n = { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const out = n.x * (mid.x - centre.x) + n.y * (mid.y - centre.y) >= 0 ? 1 : -1;
    const tries = [];
    for (const along of [0.5, 0.35, 0.65, 0.2, 0.8])
      for (const side of [out, -out])
        for (const d of [4, 8, 13]) {
          const px = a.x + (b.x - a.x) * along + n.x * side * (d + (Math.abs(n.x) * w) / 2);
          const py = a.y + (b.y - a.y) * along + n.y * side * (d + (Math.abs(n.y) * h) / 2);
          tries.push({ x0: px - w / 2, x1: px + w / 2, y0: py - h / 2, y1: py + h / 2 });
        }
    // past the head, for a short arrow
    const u = { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
    for (const d of [6, 10]) {
      const px = b.x + u.x * (d + w / 2);
      const py = b.y + u.y * (d + h / 2);
      tries.push({ x0: px - w / 2, x1: px + w / 2, y0: py - h / 2, y1: py + h / 2 });
    }
    const box = tries.find(free) || tries[0];
    placed.push(box);
    const t = el(svg, 'text', {
      x: (box.x0 + box.x1) / 2,
      y: box.y1 - 2,
      fill: color,
      'font-size': FONT,
      'font-weight': 700,
      'text-anchor': 'middle',
      stroke: '#fbfcfd',
      'stroke-width': 3,
      'paint-order': 'stroke',
      'stroke-linejoin': 'round',
    });
    t.innerHTML = text;
  };
  if (res) label([res.a, res.b], resultant.label, resultant.color);
  for (const s of L.segs) label([s.a, s.b], s.label, s.color);
}
