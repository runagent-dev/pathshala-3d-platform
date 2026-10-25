// The forces added tip to tail, drawn small in the panel (an SVG): each force's arrow starts where the one before it
// ended. When the last one ends on the ring where the first began, the chain is closed and the resultant is zero;
// otherwise the resultant (black, dashed) goes from the ring to the end. Every arrow carries its symbol, so colour
// is never alone.
import { chain, len } from './physics.js';

const NS = 'http://www.w3.org/2000/svg';
const BOX = { w: 116, h: 92, pad: 11 };
const MAX_SCALE = 58 / 9.8; // px per N: the weight of 1 kg is 58 px long when nothing needs more room
const SHIFT = 5; // px: an arrow that goes straight back over the one before is drawn this far beside it

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

/** A symbol beside the middle of a segment, on the side away from `away` (with a pale halo, so a line under it never hides it). */
function label(svg, a, b, text, color, away) {
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const n = { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const side = n.x * (mid.x - away.x) + n.y * (mid.y - away.y) >= 0 ? 1 : -1;
  const wide = text.replace(/<[^>]+>/g, '').length > 2 ? 16 : 8; // a word needs more room sideways than a letter
  const x = Math.min(BOX.w - 6, Math.max(6, mid.x + n.x * side * (7 + wide * Math.abs(n.x))));
  const y = Math.min(BOX.h - 3, Math.max(10, mid.y + n.y * side * 9 + 4));
  const t = el(svg, 'text', {
    x,
    y,
    fill: color,
    'font-size': 11.5,
    'font-weight': 700,
    'text-anchor': 'middle',
    stroke: '#fbfcfd',
    'stroke-width': 3,
    'paint-order': 'stroke',
    'stroke-linejoin': 'round',
  });
  t.innerHTML = text;
}

/**
 * Draws the forces tip to tail.
 * @param {SVGSVGElement} svg
 * @param {{ forces: { v: { x: number, y: number }, color: string, label: string }[], resultant: { color: string, label: string } }} spec
 */
export function drawSum(svg, { forces, resultant }) {
  svg.setAttribute('viewBox', `0 0 ${BOX.w} ${BOX.h}`);
  svg.replaceChildren();
  const list = forces.filter((f) => len(f.v) > 1e-9);
  if (!list.length) return;
  const c = chain(
    list.map((f) => f.v),
    1e-3,
  );
  const pts = c.points;
  // the scale that fits the chain (the resultant's line lies inside the chain's box), centred
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const room = { w: BOX.w - 2 * BOX.pad - 20, h: BOX.h - 2 * BOX.pad };
  const k = Math.min(MAX_SCALE, room.w / Math.max(maxX - minX, 1e-6), room.h / Math.max(maxY - minY, 1e-6));
  const at = (p) => ({ x: p.x * k, y: -p.y * k });

  // arrows that turn straight back over the previous one go beside it
  let shift = { x: 0, y: 0 };
  const segs = [];
  for (let i = 0; i < list.length; i++) {
    const a = at(pts[i]);
    const b = at(pts[i + 1]);
    const prev = segs[i - 1];
    if (prev) {
      const ux = b.x - a.x;
      const uy = b.y - a.y;
      const pl = Math.hypot(prev.b.x - prev.a.x, prev.b.y - prev.a.y) || 1;
      const dot = (ux * (prev.b.x - prev.a.x) + uy * (prev.b.y - prev.a.y)) / ((Math.hypot(ux, uy) || 1) * pl);
      if (dot < -0.97) shift = { x: shift.x - ((prev.b.y - prev.a.y) / pl) * SHIFT * 2, y: shift.y + ((prev.b.x - prev.a.x) / pl) * SHIFT * 2 };
    }
    segs.push({ a: { x: a.x + shift.x, y: a.y + shift.y }, b: { x: b.x + shift.x, y: b.y + shift.y }, ...list[i] });
  }
  // the resultant, from the ring to the end (beside the force if there is only one)
  let res = null;
  if (!c.closed) {
    const first = segs[0];
    const last = segs[segs.length - 1];
    res = { a: { ...first.a }, b: { ...last.b } };
    if (segs.length === 1) {
      const l = Math.hypot(first.b.x - first.a.x, first.b.y - first.a.y) || 1;
      const n = { x: (-(first.b.y - first.a.y) / l) * SHIFT * 2, y: ((first.b.x - first.a.x) / l) * SHIFT * 2 };
      res = { a: { x: first.a.x + n.x, y: first.a.y + n.y }, b: { x: first.b.x + n.x, y: first.b.y + n.y } };
    }
  }
  // centre everything in the box
  const all = [...segs.flatMap((s) => [s.a, s.b]), ...(res ? [res.a, res.b] : [])];
  const bx = [Math.min(...all.map((p) => p.x)), Math.max(...all.map((p) => p.x))];
  const by = [Math.min(...all.map((p) => p.y)), Math.max(...all.map((p) => p.y))];
  const dx = BOX.w / 2 - (bx[0] + bx[1]) / 2;
  const dy = BOX.h / 2 - (by[0] + by[1]) / 2;
  const move = (p) => ({ x: p.x + dx, y: p.y + dy });
  for (const s of segs) {
    s.a = move(s.a);
    s.b = move(s.b);
  }
  if (res) res = { a: move(res.a), b: move(res.b) };
  const centre = all.length ? { x: (bx[0] + bx[1]) / 2 + dx, y: (by[0] + by[1]) / 2 + dy } : { x: BOX.w / 2, y: BOX.h / 2 };

  for (const s of segs) arrow(svg, s.a, s.b, s);
  if (res) arrow(svg, res.a, res.b, { color: resultant.color, dashed: true, width: 2.2 });
  // where the chain began
  el(svg, 'circle', { cx: segs[0].a.x, cy: segs[0].a.y, r: 2.8, fill: '#fff', stroke: resultant.color, 'stroke-width': 1.6 });
  for (const s of segs) label(svg, s.a, s.b, s.label, s.color, centre);
  if (res) {
    // the resultant's word goes just past its head, where the chain's other arrows are not
    const l = Math.hypot(res.b.x - res.a.x, res.b.y - res.a.y) || 1;
    const u = { x: (res.b.x - res.a.x) / l, y: (res.b.y - res.a.y) / l };
    const x = Math.min(BOX.w - 15, Math.max(15, res.b.x + u.x * 16));
    const y = Math.min(BOX.h - 3, Math.max(11, res.b.y + u.y * 12 + 4));
    const t = el(svg, 'text', {
      x,
      y,
      fill: resultant.color,
      'font-size': 11.5,
      'font-weight': 700,
      'text-anchor': 'middle',
      stroke: '#fbfcfd',
      'stroke-width': 3,
      'paint-order': 'stroke',
      'stroke-linejoin': 'round',
    });
    t.textContent = resultant.label;
  }
}
