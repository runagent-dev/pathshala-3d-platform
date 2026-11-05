// The two live graphs in the right column: s against t (a parabola, violet like the car's s) and v against t (a straight
// line that runs from the blue of u to the green of at, because v = u + at), on a very light tinted plot with soft
// blue-grey axes and grid, their names (s or v, t) and a few small numbers. The whole planned curve shows faint and
// solid, the part already run bold, and a dot in the curve's colour at the moment shown. Each SVG is drawn at its own
// size in pixels (redrawn when its box changes), so the text keeps its size on every frame. Fixed scales, so a change
// of u or a shows as a change of the curve: s from −7 m to 10 m (the number line), v from −12 m/s to 12 m/s (the car
// can never go faster than about 9.2 m/s before it reaches an end of the axis), t from 0 to 6 s.
import { AXIS, LIMITS, distance, velocity } from './motion.js';

const SPEC = {
  s: { min: AXIS.min, max: AXIS.max, ticks: [-5, 5] },
  v: { min: -12, max: 12, ticks: [-10, 10] },
};
const SAMPLES = 60;

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
/** The colour k of the way from one #rrggbb to another. */
const mix = (from, to, k) => {
  const [a, b] = [rgb(from), rgb(to)];
  return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * k)).join(',')})`;
};

/**
 * Build one graph in `svg`. kind: 's' | 'v'; num: the language's digits; colors: the curve's colours at its start and
 * its end; label: the axis' name. Returns update({ u, a }, t, tEnd, { preview, y }).
 */
export function createGraph(svg, { kind, num, colors, label }) {
  const S = SPEC[kind];
  const tMax = LIMITS.t.max;
  const paint = `eom-paint-${kind}`;
  let W = 0;
  let H = 0;
  let px = (t) => t;
  let py = (y) => y;
  let plan;
  let run;
  let dot;
  let stops;
  let grad;
  let last = '';
  const build = (w, h) => {
    W = w;
    H = h;
    const fs = Math.max(10.5, Math.min(13, h * 0.1));
    const pad = { left: fs * 2.3, right: fs * 1.3, top: fs * 0.9, bottom: fs * 0.5 };
    px = (t) => pad.left + (t / tMax) * (W - pad.left - pad.right);
    py = (y) => pad.top + ((S.max - Math.min(S.max, Math.max(S.min, y))) / (S.max - S.min)) * (H - pad.top - pad.bottom);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const n = (v) => num(String(v).replace('-', '−'));
    const x0 = px(0);
    const y0 = py(0);
    const xr = px(tMax) + fs * 0.6;
    const ticks = S.ticks
      .map(
        (v) =>
          `<path class="grid" d="M${x0} ${py(v)}H${px(tMax)}"/><path class="axis" d="M${x0 - 3} ${py(v)}h6"/><text x="${x0 - 5}" y="${py(v) + fs * 0.36}" text-anchor="end" font-size="${fs * 0.9}">${n(v)}</text>`,
      )
      .join('');
    const tTicks = [2, 4, 6]
      .map(
        (t) =>
          `<path class="grid" d="M${px(t)} ${py(S.max)}V${py(S.min)}"/><path class="axis" d="M${px(t)} ${y0 - 3}v6"/><text x="${px(t)}" y="${y0 + fs * 1.15}" text-anchor="middle" font-size="${fs * 0.9}">${n(t)}</text>`,
      )
      .join('');
    svg.innerHTML = `<defs><linearGradient id="${paint}" gradientUnits="userSpaceOnUse" y1="0" y2="0"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs>
      <rect class="eom-g-plot" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6"/>
      ${ticks}${tTicks}
      <path class="eom-g-axis" d="M${x0} ${py(S.min) + 2}V${pad.top - fs * 0.5}"/>
      <path class="eom-g-axis fill" d="M${x0} ${pad.top - fs * 0.9}l-3.6 7h7.2z"/>
      <path class="eom-g-axis" d="M${x0} ${y0}H${xr}"/>
      <path class="eom-g-axis fill" d="M${xr + 4} ${y0}l-7 -3.6v7.2z"/>
      <text class="eom-g-name" x="${x0 + fs * 0.55}" y="${pad.top + fs * 0.2}" font-size="${fs * 1.25}">${label}</text>
      <text class="eom-g-name" x="${xr + 2}" y="${y0 - fs * 0.55}" text-anchor="end" font-size="${fs * 1.25}">t</text>
      <path class="eom-g-plan" fill="none" stroke="url(#${paint})" stroke-width="2" stroke-linecap="round" opacity="0.38"/>
      <path class="eom-g-run" fill="none" stroke="url(#${paint})" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle class="eom-g-dot" r="5" stroke="#fff" stroke-width="1.8"/>`;
    plan = svg.querySelector('.eom-g-plan');
    run = svg.querySelector('.eom-g-run');
    dot = svg.querySelector('.eom-g-dot');
    grad = svg.querySelector('linearGradient');
    stops = svg.querySelectorAll('stop');
    last = '';
  };
  const value = (p, t) => (kind === 's' ? distance(p.u, p.a, t) : velocity(p.u, p.a, t));
  const path = (p, t1) => {
    if (t1 <= 0) return '';
    let d = '';
    for (let i = 0; i <= SAMPLES; i++) {
      const t = (t1 * i) / SAMPLES;
      d += `${i ? 'L' : 'M'}${px(t).toFixed(1)} ${py(value(p, t)).toFixed(1)}`;
    }
    return d;
  };
  return function update(p, t, tEnd, { preview = true, y = null } = {}) {
    const w = Math.round(svg.clientWidth);
    const h = Math.round(svg.clientHeight);
    if (w < 20 || h < 20) return;
    if (w !== W || h !== H || !plan) build(w, h);
    const key = `${p.u}|${p.a}|${t}|${tEnd}|${preview}|${y}`;
    if (key === last) return;
    last = key;
    // the colour runs along the whole of this run; with no acceleration v stays u, and the line stays blue
    const to = kind === 'v' && Math.abs(p.a) < 1e-9 ? colors[0] : colors[1];
    grad.setAttribute('x1', px(0).toFixed(1));
    grad.setAttribute('x2', px(tEnd).toFixed(1));
    stops[1].setAttribute('stop-color', to);
    plan.setAttribute('d', preview ? path(p, tEnd) : '');
    run.setAttribute('d', path(p, t));
    dot.setAttribute('cx', px(t).toFixed(1));
    dot.setAttribute('cy', py(y ?? value(p, t)).toFixed(1));
    dot.setAttribute('fill', mix(colors[0], to, tEnd > 0 ? t / tEnd : 0));
  };
}
