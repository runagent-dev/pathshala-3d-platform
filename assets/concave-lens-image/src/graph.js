// The graph in the panel, live with the bench: as the pencil goes away from the lens (u, along), how far from the lens the image is (blue)
// and how tall it is (teal), both in cm. The image's distance climbs toward the dashed violet line of F and never reaches it; its
// height falls from the pencil's own 6 cm (the dashed grey line). Drawn as SVG in real pixels for its box, again whenever the box
// changes size.
import { F0, imageOf, PENCIL, U } from './reading.js';

const NS = 'http://www.w3.org/2000/svg';
const Y_MAX = 16;
export const G = { v: '#1c6fd9', height: '#0c8599', focus: '#7048e8', pencil: '#868e96', dot: '#f59f00' };

/** @param {HTMLElement} el @param {{ t: (key: string, vars?: object) => string }} o */
export function createGraph(el, { t }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pvc-graph lab-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';
  let last = null;
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => last != null && draw(last)).observe(el);

  /** u: where the pencil stands now. */
  function draw(u) {
    last = u;
    const W = Math.round(el.clientWidth);
    const H = Math.round(el.clientHeight);
    if (W < 120 || H < 70) return;
    const key = `${W}|${H}|${u}`;
    if (key === lastKey) return;
    lastKey = key;
    const f = Math.min(14, Math.max(12, H / 11)); // the numbers, never under 12 px
    const N = t.num;
    const x0 = f * 1.9;
    const x1 = W - 6;
    const y0 = H - f * 2.45; // the bottom of the plot (the numbers and the axis's name under it)
    const y1 = f * 1.2;
    const X = (x) => x0 + (x / U.max) * (x1 - x0);
    const Y = (y) => y0 - (Math.min(Y_MAX, y) / Y_MAX) * (y0 - y1);
    let out = '';
    for (let x = 0; x <= U.max; x += 10) {
      out += `<line class="grid" x1="${X(x)}" x2="${X(x)}" y1="${y1}" y2="${y0}"/>`;
      out += `<text x="${X(x)}" y="${y0 + f * 1.15}" text-anchor="middle" font-size="${f}">${N(x)}</text>`;
    }
    for (const y of [5, 10, 15]) {
      out += `<line class="grid" x1="${x0}" x2="${x1}" y1="${Y(y)}" y2="${Y(y)}"/>`;
      out += `<text x="${x0 - f * 0.3}" y="${Y(y) + f * 0.35}" text-anchor="end" font-size="${f}">${N(y)}</text>`;
    }
    out += `<text x="${x0 - f * 0.3}" y="${Y(0) + f * 0.35}" text-anchor="end" font-size="${f}">${N(0)}</text>`;
    out += `<line class="axis" x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}"/>`;
    out += `<line class="axis" x1="${x0}" x2="${x0}" y1="${y1}" y2="${y0}"/>`;
    // F, never reached; the pencil's own height
    out += `<line x1="${x0}" x2="${x1}" y1="${Y(F0)}" y2="${Y(F0)}" stroke="${G.focus}" stroke-width="1.4" stroke-dasharray="5 4"/>`;
    out += `<line x1="${x0}" x2="${x1}" y1="${Y(PENCIL)}" y2="${Y(PENCIL)}" stroke="${G.pencil}" stroke-width="1.2" stroke-dasharray="3 4"/>`;
    // the two curves
    const path = (pick) => {
      let d = '';
      for (let x = 0; x <= U.max + 1e-9; x += 0.5) d += `${d ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(pick(imageOf(x))).toFixed(1)}`;
      return d;
    };
    const lw = Math.min(3.4, Math.max(2.4, H / 55));
    out += `<g fill="none" stroke-width="${lw}" stroke-linejoin="round" stroke-linecap="round">`;
    out += `<path d="${path((i) => i.behind)}" stroke="${G.v}"/><path d="${path((i) => i.height)}" stroke="${G.height}"/></g>`;
    // the names, each in the clear band beside its own line: v over its curve, the height over its curve, the pencil over its line
    const at = (u) => imageOf(u);
    out += `<text x="${x1 - 2}" y="${Y(F0) - f * 0.35}" text-anchor="end" font-size="${f}" font-weight="600" style="fill:${G.focus}">${t('g_f', { f: F0 })}</text>`;
    out += `<text x="${X(36)}" y="${Y(at(36).behind) - f * 0.45}" text-anchor="middle" font-size="${f}" font-weight="600" style="fill:${G.v}">${t('g_v')}</text>`;
    out += `<text x="${X(U.max) - 2}" y="${Y(PENCIL) - f * 0.35}" text-anchor="end" font-size="${f}" style="fill:#5c636a">${t('g_pencil', { h: PENCIL })}</text>`;
    out += `<text x="${X(36)}" y="${Y(at(36).height) - f * 0.45}" text-anchor="middle" font-size="${f}" font-weight="600" style="fill:${G.height}">${t('g_h')}</text>`;
    // where the pencil is now: a guide and a dot on each curve
    const img = imageOf(u);
    out += `<line x1="${X(u)}" x2="${X(u)}" y1="${y1}" y2="${y0}" stroke="${G.dot}" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    out += `<circle cx="${X(u)}" cy="${Y(img.behind)}" r="5.5" fill="${G.v}" stroke="#fff" stroke-width="2"/>`;
    out += `<circle cx="${X(u)}" cy="${Y(img.height)}" r="5.5" fill="${G.height}" stroke="#fff" stroke-width="2"/>`;
    out += `<text x="${(x0 + x1) / 2}" y="${H - 3}" text-anchor="middle" font-size="${f}" font-weight="600" style="fill:#1f2933">${t('g_u')}</text>`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.setAttribute('aria-label', t('g_aria', { u, v: Math.round(img.behind * 10) / 10, h: Math.round(img.height * 10) / 10 }));
    svg.innerHTML = out;
  }
  return { draw, el };
}
