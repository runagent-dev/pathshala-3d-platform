// The পীড়ন–বিকৃতি graph on a white card over the stage, drawn as SVG: a point for every load the spring has carried,
// joined in the order they happened (so taking weights off shows as a line coming back down). As the student finds
// things out it shows more: Hooke's straight line from the origin, the elastic limit (a dashed line across, with a
// hatched band before it and a dotted band after it; points past it are squares, never told apart by colour alone)
// and the permanent set left on the axis. On the card itself only the axes and the elastic limit are named: what the
// lines, bands and marks mean is the key in the panel (keySwatch draws its little pictures, in the same colours).
import { FONT } from '@shared/student/materials.js';

const NS = 'http://www.w3.org/2000/svg';
export const AXES = { e: 1, eStep: 0.2, eLabel: 0.4, s: 8, sStep: 1, sLabel: 2 }; // strain 0…1, stress 0…8 lakh Pa
export const C = {
  ink: '#1f2430',
  ink2: '#4a5262',
  grid: '#e7eaf0',
  line: '#1c6fd9', // Hooke's line and the points on it
  beyond: '#c2410c', // the points past the limit
  set: '#d6336c', // the permanent set
  limit: '#3b2f8f',
};

const el = (name, attrs = {}, parent = null) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
};

let measureCtx = null;
function textWidth(text, size, weight = 600) {
  if (!measureCtx) measureCtx = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
  measureCtx.font = `${weight} ${size}px ${FONT}`;
  return measureCtx.measureText(text).width;
}

/**
 * A little picture for the key in the panel, drawn as on the graph: 'point' (a load within the limit), 'hooke' (the
 * dashed straight line), 'in' (the hatched band with a circle), 'out' (the dotted band with a square), 'set' (the bar
 * on the strain axis).
 * @param {'point' | 'hooke' | 'in' | 'out' | 'set'} kind
 */
export function keySwatch(kind) {
  const svg = (body) => `<svg class="el-sw" viewBox="0 0 22 14" aria-hidden="true">${body}</svg>`;
  if (kind === 'point') return svg(`<circle cx="11" cy="7" r="4.6" fill="${C.line}" stroke="#fff" stroke-width="1.4"/>`);
  if (kind === 'hooke') return svg(`<line x1="1" y1="12" x2="21" y2="2" stroke="${C.line}" stroke-width="2" stroke-dasharray="5 3"/>`);
  if (kind === 'set') return svg(`<line x1="3" y1="10" x2="19" y2="10" stroke="${C.set}" stroke-width="5" stroke-linecap="round"/>`);
  if (kind === 'in')
    return svg(
      `<rect x="0.5" y="0.5" width="21" height="13" rx="2" fill="#eef5ff" stroke="#b9d3f5"/><path d="M-2 10 6-2M4 16 16-2M12 16 24-2" stroke="#b9d3f5" stroke-width="2"/><circle cx="11" cy="7" r="3.8" fill="${C.line}" stroke="#fff" stroke-width="1.2"/>`,
    );
  return svg(
    `<rect x="0.5" y="0.5" width="21" height="13" rx="2" fill="#fff6ee" stroke="#f2b38c"/><g fill="#f2b38c"><circle cx="4" cy="4" r="1.1"/><circle cx="4" cy="10" r="1.1"/><circle cx="18" cy="4" r="1.1"/><circle cx="18" cy="10" r="1.1"/></g><rect x="7.4" y="3.4" width="7.2" height="7.2" fill="${C.beyond}" stroke="#fff" stroke-width="1.1"/>`,
  );
}

/**
 * @param {HTMLElement} host where the card goes (the stage)
 * @param {{ N: (x: any) => string, text: Record<string, string> }} opts digits and the words (already translated)
 */
export function createGraph(host, { N, text }) {
  const card = document.createElement('div');
  card.className = 'el-graph';
  card.setAttribute('role', 'img');
  const svg = el('svg', { class: 'el-graph-svg' });
  card.appendChild(svg);
  host.appendChild(card);
  const defs = el('defs', {}, svg);
  const hatch = el('pattern', { id: 'el-hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  el('rect', { width: 7, height: 7, fill: '#eef5ff' }, hatch);
  el('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: '#b9d3f5', 'stroke-width': 2.2 }, hatch);
  const dots = el('pattern', { id: 'el-dots', width: 7, height: 7, patternUnits: 'userSpaceOnUse' }, defs);
  el('rect', { width: 7, height: 7, fill: '#fff6ee' }, dots);
  el('circle', { cx: 3.5, cy: 3.5, r: 1.15, fill: '#f2b38c' }, dots);
  const arrowHead = el(
    'marker',
    { id: 'el-ax', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
    defs,
  );
  el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: C.ink2 }, arrowHead);
  const layer = el('g', {}, svg);

  let W = 0;
  let H = 0;
  let last = '';

  /**
   * g: { path: [{ e, s }] (strain, stress in lakh Pa, in order), loads: [{ e, s, beyond }] (every load point),
   *      now: { e, s } | null, show: { hooke, limit, set, bands }, limit: { e, s }, set: strain left, marks }
   */
  function draw(g) {
    const key = JSON.stringify([W, H, g]);
    if (key === last) return;
    last = key;
    layer.replaceChildren();
    if (W < 60 || H < 60) return;
    const compact = W < 200 || H < 170;
    const fs = compact ? 10.5 : 12; // tick labels
    const ls = compact ? 11 : 12.5; // the words on the graph
    const padL = Math.ceil(textWidth(N(AXES.s), fs) + 12);
    const padR = 10;
    const padT = compact ? 22 : 26;
    const padB = compact ? 30 : 34;
    const X0 = padL;
    const X1 = W - padR;
    const Y0 = H - padB;
    const Y1 = padT;
    const xOf = (e) => X0 + (Math.min(e, AXES.e * 1.04) / AXES.e) * (X1 - X0);
    const yOf = (s) => Y0 - (s / AXES.s) * (Y0 - Y1);
    const taken = []; // label boxes and points: no label goes on these
    const hit = (b) => taken.some((o) => b.left < o.right && b.right > o.left && b.top < o.bottom && b.bottom > o.top);
    const inPlot = (b) => b.left >= X0 + 1 && b.right <= X1 + 2 && b.top >= Y1 - 2 && b.bottom <= Y0 - 1;

    // the bands: hatched up to the limit, dotted after it (only once the student has found the limit)
    if (g.show.bands) {
      el('rect', { x: X0, y: Y1, width: xOf(g.limit.e) - X0, height: Y0 - Y1, fill: 'url(#el-hatch)' }, layer);
      el('rect', { x: xOf(g.limit.e), y: Y1, width: X1 - xOf(g.limit.e), height: Y0 - Y1, fill: 'url(#el-dots)' }, layer);
    }
    // grid
    const grid = el('g', { stroke: C.grid, 'stroke-width': 1 }, layer);
    for (let s = AXES.sStep; s <= AXES.s + 1e-9; s += AXES.sStep) el('line', { x1: X0, x2: X1, y1: yOf(s), y2: yOf(s) }, grid);
    for (let e = AXES.eStep; e <= AXES.e + 1e-9; e += AXES.eStep) el('line', { x1: xOf(e), x2: xOf(e), y1: Y0, y2: Y1 }, grid);
    // axes with arrows, ticks and their numbers
    el('line', { x1: X0, y1: Y0, x2: X1 + 4, y2: Y0, stroke: C.ink2, 'stroke-width': 1.6, 'marker-end': 'url(#el-ax)' }, layer);
    el('line', { x1: X0, y1: Y0, x2: X0, y2: Y1 - 8, stroke: C.ink2, 'stroke-width': 1.6, 'marker-end': 'url(#el-ax)' }, layer);
    const ticks = el('g', { fill: C.ink2, 'font-size': fs, 'font-weight': 500, 'font-family': FONT }, layer);
    for (let s = 0; s <= AXES.s + 1e-9; s += AXES.sLabel) {
      const tx = el('text', { x: X0 - 5, y: yOf(s) + fs * 0.36, 'text-anchor': 'end' }, ticks);
      tx.textContent = N(s);
    }
    for (let i = 0; i * AXES.eLabel <= AXES.e + 1e-9; i++) {
      const e = +(i * AXES.eLabel).toFixed(1);
      const tx = el('text', { x: xOf(e), y: Y0 + fs + 3, 'text-anchor': 'middle' }, ticks);
      tx.textContent = N(e);
    }
    // the axes' names: stress above the y axis, strain under the x axis at its end
    const yName = el('text', { x: 4, y: Y1 - 10, fill: C.ink, 'font-size': ls, 'font-weight': 700, 'font-family': FONT }, layer);
    yName.textContent = text.axisS;
    const xw = textWidth(text.axisE, ls, 700);
    const xName = el('text', { x: X1 - xw, y: H - 4, fill: C.ink, 'font-size': ls, 'font-weight': 700, 'font-family': FONT }, layer);
    xName.textContent = text.axisE;

    // the points and the lines between them: taken, so labels keep off
    for (const p of g.loads) {
      const x = xOf(p.e);
      const y = yOf(p.s);
      taken.push({ left: x - 7, right: x + 7, top: y - 7, bottom: y + 7 });
    }
    for (let i = 1; i < g.path.length; i++) {
      const a = g.path[i - 1];
      const b = g.path[i];
      for (let k = 0; k <= 8; k++) {
        const x = xOf(a.e + ((b.e - a.e) * k) / 8);
        const y = yOf(a.s + ((b.s - a.s) * k) / 8);
        taken.push({ left: x - 3, right: x + 3, top: y - 3, bottom: y + 3 });
      }
    }

    /** A label in the plot at the first clear spot (each spot: x, y of the text's anchor and its alignment). */
    function label(words, spots, { color, size = ls, weight = 700, force = false, lead = null } = {}) {
      const lines = Array.isArray(words) ? words : [words];
      const w = Math.max(...lines.map((l) => textWidth(l, size, weight)));
      const h = size * 1.2 * lines.length;
      for (let pass = 0; pass < 2; pass++)
        for (const sp of spots) {
          const left = sp.align === 'end' ? sp.x - w : sp.align === 'middle' ? sp.x - w / 2 : sp.x;
          const b = { left: left - 2, right: left + w + 2, top: sp.y - size - 1, bottom: sp.y - size + h + 1 };
          if (pass === 0 && (hit(b) || !inPlot(b))) continue;
          if (pass === 1 && !force) return null;
          const bg = el(
            'rect',
            { x: b.left, y: b.top, width: b.right - b.left, height: b.bottom - b.top, rx: 3, fill: 'rgba(255,255,255,0.88)' },
            layer,
          );
          if (lead) {
            const lx = Math.min(Math.max(lead.x, b.left), b.right);
            const ly = lead.y > b.bottom ? b.bottom : b.top;
            el('line', { x1: lx, y1: ly, x2: lead.x, y2: lead.y, stroke: color, 'stroke-width': 1.3 }, layer).before(bg);
          }
          const tx = el('text', { x: left, y: sp.y, fill: color, 'font-size': size, 'font-weight': weight, 'font-family': FONT }, layer);
          lines.forEach((l, i) => {
            const ts = el('tspan', { x: left + (w - textWidth(l, size, weight)) / 2, dy: i ? size * 1.2 : 0 }, tx);
            ts.textContent = l;
          });
          taken.push(b);
          return b;
        }
      return null;
    }

    // Hooke's line: from the origin through the points within the limit (dashed), named along its middle
    if (g.show.hooke) {
      el(
        'line',
        { x1: xOf(0), y1: yOf(0), x2: xOf(g.limit.e), y2: yOf(g.limit.s), stroke: C.line, 'stroke-width': 2, 'stroke-dasharray': '6 4' },
        layer,
      );
    }
    // the elastic limit: a dashed line across the plot at its strain
    if (g.show.limit) {
      const x = xOf(g.limit.e);
      el('line', { x1: x, y1: Y0, x2: x, y2: Y1, stroke: C.limit, 'stroke-width': 1.6, 'stroke-dasharray': '3 3' }, layer);
      const ring = el('circle', { cx: x, cy: yOf(g.limit.s), r: 8, fill: 'none', stroke: C.limit, 'stroke-width': 2 }, layer);
      ring.classList.add('el-limit-ring');
    }
    // the permanent set: a thick bar on the strain axis from 0 to where the spring now rests
    if (g.show.set && g.set > 0) {
      el('line', { x1: xOf(0), y1: Y0 - 1, x2: xOf(g.set), y2: Y0 - 1, stroke: C.set, 'stroke-width': 5, 'stroke-linecap': 'round' }, layer);
    }
    // the path the spring took, then the points
    if (g.path.length > 1) {
      el(
        'polyline',
        {
          points: g.path.map((p) => `${xOf(p.e)},${yOf(p.s)}`).join(' '),
          fill: 'none',
          stroke: C.ink,
          'stroke-width': 1.8,
          'stroke-linejoin': 'round',
          opacity: 0.8,
        },
        layer,
      );
    }
    for (const p of g.loads) {
      const x = xOf(p.e);
      const y = yOf(p.s);
      // within the limit: a filled circle; past it: a filled square (the shape tells them apart, not only the colour)
      if (p.beyond) el('rect', { x: x - 4.6, y: y - 4.6, width: 9.2, height: 9.2, fill: C.beyond, stroke: '#fff', 'stroke-width': 1.4 }, layer);
      else el('circle', { cx: x, cy: y, r: 4.8, fill: C.line, stroke: '#fff', 'stroke-width': 1.4 }, layer);
    }
    if (g.now) {
      const x = xOf(g.now.e);
      const y = yOf(g.now.s);
      el('circle', { cx: x, cy: y, r: 8, fill: 'none', stroke: '#e03131', 'stroke-width': 2.4 }, layer).classList.add('el-now');
      taken.push({ left: x - 9, right: x + 9, top: y - 9, bottom: y + 9 });
    }
    // letters on chosen points (the test)
    for (const m of g.marks || []) {
      const x = xOf(m.e);
      const y = yOf(m.s);
      label(
        m.text,
        [
          { x: x - 8, y: y - 6, align: 'end' },
          { x: x + 8, y: y - 6, align: 'start' },
          { x: x - 8, y: y + 16, align: 'end' },
          { x: x + 8, y: y + 16, align: 'start' },
        ],
        { color: C.ink, size: ls + 1, force: true },
      );
    }

    // the one name on the plot: the elastic limit
    if (g.show.limit) {
      const x = xOf(g.limit.e);
      const y = yOf(g.limit.s);
      const words = compact ? text.limit2 : [text.limit];
      label(
        words,
        [
          { x: x - 6, y: Y1 + ls + 2, align: 'end' },
          { x: x + 6, y: Y1 + ls + 2, align: 'start' },
          { x: x - 6, y: y - 14, align: 'end' },
          { x: X0 + 4, y: Y1 + ls + 2, align: 'start' },
        ],
        { color: C.limit, force: true, lead: { x, y: y - 8 } },
      );
    }
  }

  return {
    el: card,
    /** The card's place on the stage (CSS px) and the graph to draw in it. */
    place(rect) {
      card.style.left = `${rect.x}px`;
      card.style.top = `${rect.y}px`;
      card.style.width = `${rect.w}px`;
      card.style.height = `${rect.h}px`;
      W = rect.w;
      H = rect.h;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('width', String(W));
      svg.setAttribute('height', String(H));
      last = '';
    },
    draw,
    label(aria) {
      card.setAttribute('aria-label', aria);
    },
  };
}
