// The graph in the panel: where the image is (v) for each place of the pencil (u), live with the bench. Above the u axis the image is
// real (on the lens's other side), below it virtual (on the pencil's side). The dashed violet lines are the asymptotes: near F (u = f)
// the image runs off to infinity; far away (u large) it comes to F′ (v = f). The point of 2F (u = v = 2f) is marked. Drawn as SVG in
// real pixels for its box, again whenever the box changes size.
import { F0, U } from './reading.js';

const NS = 'http://www.w3.org/2000/svg';
const V_MIN = -50;
const V_MAX = 70;

/** @param {HTMLElement} el @param {{ t: (key: string, vars?: object) => string }} o */
export function createGraph(el, { t }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pvc-graph lab-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';
  let last = null;
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => last && draw(last)).observe(el);

  /** { u, kind, v } of the pencil now. */
  function draw(state) {
    last = state;
    const W = Math.round(el.clientWidth);
    const H = Math.round(el.clientHeight);
    if (W < 120 || H < 80) return;
    const key = JSON.stringify([W, H, state.u, state.kind, state.v]);
    if (key === lastKey) return;
    lastKey = key;
    const f = Math.min(14, Math.max(12, H / 12)); // the numbers, never under 12 px
    const x0 = f * 2.4;
    const x1 = W - 6;
    const y0 = H - f * 2.55; // the bottom of the plot (the numbers and the axis's name under it)
    const y1 = f * 1.4; // its top (room for the v axis's name)
    const X = (u) => x0 + (u / U.max) * (x1 - x0);
    const Y = (v) => y1 + ((V_MAX - Math.max(V_MIN, Math.min(V_MAX, v))) / (V_MAX - V_MIN)) * (y0 - y1);
    const N = t.num;
    let out = '';
    // the two halves: real above, virtual below
    out += `<rect x="${x0}" y="${y1}" width="${x1 - x0}" height="${Y(0) - y1}" fill="#fff4dc"/>`;
    out += `<rect x="${x0}" y="${Y(0)}" width="${x1 - x0}" height="${y0 - Y(0)}" fill="#e7f1fb"/>`;
    // grid every 15 cm (f), numbers at 0, f, 2f, 3f, 4f
    for (let u = 0; u <= U.max; u += F0) {
      out += `<line class="grid" x1="${X(u)}" x2="${X(u)}" y1="${y1}" y2="${y0}"/>`;
      out += `<text x="${X(u)}" y="${y0 + f * 1.15}" text-anchor="${u === U.max ? 'end' : u === 0 ? 'start' : 'middle'}" font-size="${f}">${N(u)}</text>`;
    }
    for (const v of [-45, -30, -15, 15, 30, 45, 60]) out += `<line class="grid" x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}"/>`;
    for (const v of [-30, 0, 30, 60])
      out += `<text x="${x0 - f * 0.3}" y="${Y(v) + f * 0.35}" text-anchor="end" font-size="${f}">${v < 0 ? `−${N(-v)}` : N(v)}</text>`;
    out += `<line class="axis" x1="${x0}" x2="${x1}" y1="${Y(0)}" y2="${Y(0)}"/>`;
    out += `<line class="axis" x1="${x0}" x2="${x0}" y1="${y1}" y2="${y0}"/>`;
    // the asymptotes: u = f and v = f
    out += `<line x1="${X(F0)}" x2="${X(F0)}" y1="${y1}" y2="${y0}" stroke="#7048e8" stroke-width="1.4" stroke-dasharray="5 4"/>`;
    out += `<line x1="${x0}" x2="${x1}" y1="${Y(F0)}" y2="${Y(F0)}" stroke="#7048e8" stroke-width="1.4" stroke-dasharray="5 4"/>`;
    // the curve, in two branches
    const path = (a, b) => {
      let d = '';
      for (let u = a; u <= b + 1e-9; u += 0.25) {
        const v = (u * F0) / (u - F0);
        if (v < V_MIN - 20 || v > V_MAX + 20) continue;
        d += `${d ? 'L' : 'M'}${X(u).toFixed(1)} ${Y(v).toFixed(1)}`;
      }
      return d;
    };
    const lw = Math.min(3.4, Math.max(2.4, H / 60));
    out += `<clipPath id="lab-plot"><rect x="${x0}" y="${y1}" width="${x1 - x0}" height="${y0 - y1}"/></clipPath>`;
    out += `<g clip-path="url(#lab-plot)" fill="none" stroke="#1f2933" stroke-width="${lw}" stroke-linejoin="round">`;
    out += `<path d="${path(F0 + 0.75, U.max)}"/><path d="${path(U.min, F0 - 0.75)}" stroke-dasharray="6 4"/></g>`;
    // the 2F point
    out += `<circle cx="${X(2 * F0)}" cy="${Y(2 * F0)}" r="3.2" fill="#fff" stroke="#1f2933" stroke-width="1.5"/>`;
    // the names: the halves, the axes
    out += `<text x="${x1 - 4}" y="${y1 + f * 1.05}" text-anchor="end" font-size="${f}" style="fill:#8a4f00">${t('g_real')}</text>`;
    out += `<text x="${x1 - 4}" y="${y0 - f * 0.45}" text-anchor="end" font-size="${f}" style="fill:#1864ab">${t('g_virtual')}</text>`;
    out += `<text x="${x0 + 3}" y="${y1 - f * 0.4}" font-size="${f}" font-weight="600" style="fill:#1f2933">${t('g_v')}</text>`;
    out += `<text x="${X(F0) + 3}" y="${y0 - f * 0.45}" font-size="${f}" style="fill:#5a37d0">F</text>`;
    out += `<text x="${X(U.max) - 3}" y="${Y(F0) - 4}" text-anchor="end" font-size="${f}" style="fill:#5a37d0">F′</text>`;
    // where the pencil is now
    const { u, kind, v } = state;
    if (kind === 'none') {
      out += `<line x1="${X(u)}" x2="${X(u)}" y1="${y1 + 2}" y2="${y1 + 18}" stroke="#f59f00" stroke-width="3"/>`;
    } else if (Number.isFinite(v)) {
      const off = v > V_MAX || v < V_MIN;
      const cy = Y(v);
      out += `<line x1="${X(u)}" x2="${X(u)}" y1="${Y(0)}" y2="${cy}" stroke="#f59f00" stroke-width="1.5" stroke-dasharray="3 3"/>`;
      out += `<circle cx="${X(u)}" cy="${cy}" r="${off ? 5 : 6.5}" fill="#f59f00" stroke="#5f3400" stroke-width="2"/>`;
    }
    out += `<text x="${(x0 + x1) / 2}" y="${H - 2}" text-anchor="middle" font-size="${f}" font-weight="600" style="fill:#1f2933">${t('g_u')}</text>`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.setAttribute('aria-label', state.aria || t('g_aria'));
    svg.innerHTML = out;
  }
  return { draw, el };
}
