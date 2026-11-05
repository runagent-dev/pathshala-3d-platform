// Two small drawings for the view and the panel: the graph of how much is reflected (চিত্র ৮.০৫'s idea) and the
// magnifier on the wavy water (চিত্র ৮.০৭ at one spot). Plain SVG: light, crisp, and they share the figure's numbers.
import { BUNDLE } from './diagram.js';
import { fresnel, heightAt, N_GLASS, N_WATER, slopeAt } from './reading.js';

const G = { w: 300, h: 118, l: 34, r: 8, t: 8, b: 30 };
const gx = (th) => G.l + (th / 90) * (G.w - G.l - G.r);
const gy = (r) => G.h - G.b - r * (G.h - G.b - G.t);
function curve(n) {
  let d = '';
  for (let th = 0; th <= 90; th += th < 70 ? 5 : 1) d += `${d ? 'L' : 'M'}${gx(th).toFixed(1)} ${gy(fresnel(th, n)).toFixed(1)}`;
  return d;
}
const WATER = curve(N_WATER);
const GLASS = curve(N_GLASS);

/** The graph, with a dot at theta. */
export function fresnelGraph(theta, t) {
  const N = t.num;
  const ticksX = [0, 30, 60, 90]
    .map(
      (a) =>
        `<line class="grid" x1="${gx(a)}" x2="${gx(a)}" y1="${G.t}" y2="${gy(0)}"/><text x="${gx(a)}" y="${G.h - 17}" text-anchor="middle">${N(a)}°</text>`,
    )
    .join('');
  const ticksY = [0, 0.5, 1]
    .map(
      (r) =>
        `<line class="grid" x1="${G.l}" x2="${G.w - G.r}" y1="${gy(r)}" y2="${gy(r)}"/><text x="${G.l - 5}" y="${gy(r) + 4}" text-anchor="end">${N(r * 100)}%</text>`,
    )
    .join('');
  const r = fresnel(theta, N_WATER);
  return `<svg class="pvc-graph rl-graph" viewBox="0 0 ${G.w} ${G.h}" role="img" aria-label="${t('graph_aria')}">
    ${ticksX}${ticksY}
    <path class="axis" d="M${G.l} ${G.t}V${gy(0)}H${G.w - G.r}"/>
    <path d="${GLASS}" fill="none" stroke="#868e96" stroke-width="1.5" stroke-dasharray="4 3"/>
    <path d="${WATER}" fill="none" stroke="#f59f00" stroke-width="2.5"/>
    <text x="${gx(50)}" y="${gy(0.26)}" text-anchor="middle" class="rl-g-glass">${t('g_glass')}</text>
    <text x="${gx(72)}" y="${gy(0.03) - 2}" text-anchor="middle" class="rl-g-water">${t('g_water')}</text>
    <circle cx="${gx(theta).toFixed(1)}" cy="${gy(r).toFixed(1)}" r="5" fill="#1971c2" stroke="#fff" stroke-width="2"/>
    <text x="${(G.l + G.w - G.r) / 2}" y="${G.h - 3}" text-anchor="middle">${t('g_axis')}</text>
  </svg>`;
}

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}, parent) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.appendChild(e);
  return e;
};
const R = 58; // the drawing's half width
const SPAN = 22; // the units of water shown on each side of O

/** The magnifier on the view: the true section of the water along the sheet, with three of the rays. */
export function createMagnifier({ host, t }) {
  const box = document.createElement('div');
  box.className = 'rl-mag';
  host.appendChild(box);
  const svg = el('svg', { viewBox: `${-R} ${-R} ${2 * R} ${2 * R}`, role: 'img', 'aria-label': t('mag_aria') }, box);
  const clip = el('clipPath', { id: 'rl-mag-clip' }, el('defs', {}, svg));
  el('circle', { r: R - 2 }, clip);
  const g = el('g', { 'clip-path': 'url(#rl-mag-clip)' }, svg);
  el('rect', { x: -R, y: -R, width: 2 * R, height: 2 * R, fill: '#dcebf7' }, g);
  const water = el('path', { fill: '#2f6d8c', stroke: '#fff', 'stroke-width': 1.4 }, g);
  const rays = [0, 1, 2].map(() => ({
    normal: el('line', { stroke: '#495057', 'stroke-width': 1.3, 'stroke-dasharray': '4 2.5' }, g),
    ray: el('path', { fill: 'none', stroke: '#b35c00', 'stroke-width': 1.9, 'stroke-linejoin': 'round' }, g),
  }));
  el('circle', { r: R - 2, fill: 'none', stroke: '#33506b', 'stroke-width': 3 }, svg);
  const cap = document.createElement('div');
  cap.className = 'rl-mag-cap';
  cap.innerHTML = t('mag_cap');
  box.appendChild(cap);
  let on = false;
  const scale = R / SPAN;
  return {
    box,
    show(v) {
      on = v;
      box.hidden = !v;
    },
    /** theta: the rays' angle; u: the sheet's direction on the water. */
    draw(theta, ux, uz, time, wind) {
      if (!on) return;
      const a = (theta * Math.PI) / 180;
      const sx = Math.sin(a);
      const cy = Math.cos(a);
      const h0 = heightAt(0, 0, time, wind);
      const hAt = (s) => heightAt(ux * s, uz * s, time, wind) - h0;
      let d = '';
      for (let i = 0; i <= 36; i++) {
        const s = -SPAN - 2 + (i / 36) * (2 * SPAN + 4);
        d += `${d ? 'L' : 'M'}${(s * scale).toFixed(1)} ${(14 - hAt(s) * scale).toFixed(1)}`;
      }
      water.setAttribute('d', `${d}V${R + 4}H${-R - 4}Z`);
      rays.forEach((r, i) => {
        const s = (i - 1) * BUNDLE.gap;
        const y = 14 - hAt(s) * scale;
        const x = s * scale;
        // the slope along the section: the facet's normal in the drawing (y grows downward)
        const sl = slopeAt(ux * s, uz * s, time, wind);
        const m = sl.x * ux + sl.z * uz;
        const nl = Math.hypot(m, 1);
        const nx = -m / nl;
        const ny = -1 / nl;
        r.normal.setAttribute('x1', x.toFixed(1));
        r.normal.setAttribute('y1', y.toFixed(1));
        r.normal.setAttribute('x2', (x + nx * 30).toFixed(1));
        r.normal.setAttribute('y2', (y + ny * 30).toFixed(1));
        // in: travelling (sx, cy) on the screen; out: reflected in the facet
        const dx = sx;
        const dy = cy;
        const k = 2 * (dx * nx + dy * ny);
        const ox = dx - k * nx;
        const oy = dy - k * ny;
        r.ray.setAttribute(
          'd',
          `M${(x - dx * 70).toFixed(1)} ${(y - dy * 70).toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${(x + ox * 70).toFixed(1)} ${(y + oy * 70).toFixed(1)}`,
        );
      });
    },
  };
}
