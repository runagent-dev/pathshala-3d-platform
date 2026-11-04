// The two live graphs in the right column, as the owner's reference draws them: x against t (a parabola) and v against
// t (a straight line), plain axes with arrowheads and their names (x or v, t), a few small numbers, the planned curve
// faint and dashed, the part already run solid, and a dot at the moment shown. Each SVG is drawn at its own size in
// pixels (redrawn when its box changes), so the text keeps its size on every frame. Fixed scales, so a change of x₀,
// u or a shows as a change of the curve: x from −7 m to 10 m (the number line), v from −12 m/s to 12 m/s (the car can
// never go faster than about 11.3 m/s before it reaches an end of the axis), t from 0 to 6 s.
import { AXIS, LIMITS, position, velocity } from './motion.js';

const SPEC = {
  x: { min: AXIS.min, max: AXIS.max, ticks: [-5, 5] },
  v: { min: -12, max: 12, ticks: [-10, 10] },
};
const SAMPLES = 60;

/**
 * Build one graph in `svg`. kind: 'x' | 'v'; num: the language's digits; color: the curve's colour; label: the axis'
 * name. Returns update({ x0, u, a }, t, tEnd, { preview, x }).
 */
export function createGraph(svg, { kind, num, color, label }) {
  const S = SPEC[kind];
  const tMax = LIMITS.t.max;
  let W = 0;
  let H = 0;
  let px = (t) => t;
  let py = (y) => y;
  let plan;
  let run;
  let dot;
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
          `<path class="axis" d="M${px(t)} ${y0 - 3}v6"/><text x="${px(t)}" y="${y0 + fs * 1.15}" text-anchor="middle" font-size="${fs * 0.9}">${n(t)}</text>`,
      )
      .join('');
    svg.innerHTML = `${ticks}${tTicks}
      <path class="eom-g-axis" d="M${x0} ${py(S.min) + 2}V${pad.top - fs * 0.5}"/>
      <path class="eom-g-axis fill" d="M${x0} ${pad.top - fs * 0.9}l-3.6 7h7.2z"/>
      <path class="eom-g-axis" d="M${x0} ${y0}H${xr}"/>
      <path class="eom-g-axis fill" d="M${xr + 4} ${y0}l-7 -3.6v7.2z"/>
      <text class="eom-g-name" x="${x0 + fs * 0.55}" y="${pad.top + fs * 0.2}" font-size="${fs * 1.25}">${label}</text>
      <text class="eom-g-name" x="${xr + 2}" y="${y0 - fs * 0.55}" text-anchor="end" font-size="${fs * 1.25}">t</text>
      <path class="eom-g-plan" fill="none" stroke="${color}" stroke-width="1.6" stroke-dasharray="4 4" opacity="0.45"/>
      <path class="eom-g-run" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle class="eom-g-dot" r="4.5" fill="${color}" stroke="#fff" stroke-width="1.6"/>`;
    plan = svg.querySelector('.eom-g-plan');
    run = svg.querySelector('.eom-g-run');
    dot = svg.querySelector('.eom-g-dot');
    last = '';
  };
  const value = (p, t) => (kind === 'x' ? position(p.x0, p.u, p.a, t) : velocity(p.u, p.a, t));
  const path = (p, t1) => {
    if (t1 <= 0) return '';
    let d = '';
    for (let i = 0; i <= SAMPLES; i++) {
      const t = (t1 * i) / SAMPLES;
      d += `${i ? 'L' : 'M'}${px(t).toFixed(1)} ${py(value(p, t)).toFixed(1)}`;
    }
    return d;
  };
  return function update(p, t, tEnd, { preview = true, x = null } = {}) {
    const w = Math.round(svg.clientWidth);
    const h = Math.round(svg.clientHeight);
    if (w < 20 || h < 20) return;
    if (w !== W || h !== H || !plan) build(w, h);
    const key = `${p.x0}|${p.u}|${p.a}|${t}|${tEnd}|${preview}|${x}`;
    if (key === last) return;
    last = key;
    plan.setAttribute('d', preview ? path(p, tEnd) : '');
    run.setAttribute('d', path(p, t));
    const y = kind === 'x' && x != null ? x : value(p, t);
    dot.setAttribute('cx', px(t).toFixed(1));
    dot.setAttribute('cy', py(y).toFixed(1));
  };
}
