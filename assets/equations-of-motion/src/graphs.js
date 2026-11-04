// The panel's two small live graphs (kit 1.6.0 `.pvc-graph`): x against t (a parabola) and v against t (a straight
// line), as the owner's reference draws them beside its sliders. Fixed scales, so a change of x₀, u or a shows as a
// change of the curve: x from −7 m to 10 m (the number line), v from −12 m/s to 12 m/s (the car can never go faster
// than about 11.3 m/s before it reaches an end of the axis), t from 0 to 6 s. The planned curve is drawn faint, the
// part already run solid, and a dot marks the moment shown.
import { AXIS, LIMITS, position, velocity } from './motion.js';

const W = 150;
const H = 84;
const PAD = { left: 25, right: 12, top: 9, bottom: 15 };
const SPEC = {
  x: { min: AXIS.min, max: AXIS.max, ticks: [-5, 0, 5] },
  v: { min: -12, max: 12, ticks: [-10, 0, 10] },
};
const SAMPLES = 48;

/**
 * Build one graph in `svg` (an <svg class="pvc-graph">). kind: 'x' | 'v'; num: the language's digits; color: the
 * curve's colour. Returns update({ x0, u, a }, t, tEnd, { preview }).
 */
export function createGraph(svg, { kind, num, color, label }) {
  const S = SPEC[kind];
  const tMax = LIMITS.t.max;
  const px = (t) => PAD.left + (t / tMax) * (W - PAD.left - PAD.right);
  const py = (y) => PAD.top + ((S.max - Math.min(S.max, Math.max(S.min, y))) / (S.max - S.min)) * (H - PAD.top - PAD.bottom);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const grid = S.ticks
    .filter((v) => v !== 0)
    .map((v) => `<path class="grid" d="M${px(0)} ${py(v)}H${px(tMax)}"/>`)
    .join('');
  const tGrid = [2, 4, 6].map((t) => `<path class="grid" d="M${px(t)} ${py(S.max)}V${py(S.min)}"/>`).join('');
  const yLabels = S.ticks
    .map((v) => `<text x="${px(0) - 3}" y="${py(v) + 3.8}" text-anchor="end" font-size="11">${num(String(v).replace('-', '−'))}</text>`)
    .join('');
  const tLabels = [2, 4, 6].map((t) => `<text x="${px(t)}" y="${H - 2}" text-anchor="middle" font-size="11">${num(t)}</text>`).join('');
  svg.innerHTML = `${grid}${tGrid}
    <path class="axis" d="M${px(0)} ${py(S.max)}V${py(S.min)}"/>
    <path class="axis" d="M${px(0)} ${py(0)}H${px(tMax) + 6}"/>
    <path class="axis" d="M${px(tMax) + 6} ${py(0)}l-4 -2.5v5z" style="fill: currentColor"/>
    ${yLabels}${tLabels}
    <text x="${px(tMax) + 4}" y="${py(0) + 10}" text-anchor="middle" font-style="italic" font-size="12">t</text>
    <text x="${px(0) + 4}" y="${PAD.top + 3}" font-style="italic" font-size="12">${label}</text>
    <path class="eom-g-plan" fill="none" stroke="${color}" stroke-width="1.6" stroke-dasharray="3 3" opacity="0.38"/>
    <path class="eom-g-run" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="eom-g-dot" r="3.6" fill="${color}" stroke="#fff" stroke-width="1.4"/>`;
  const plan = svg.querySelector('.eom-g-plan');
  const run = svg.querySelector('.eom-g-run');
  const dot = svg.querySelector('.eom-g-dot');
  const value = (p, t) => (kind === 'x' ? position(p.x0, p.u, p.a, t) : velocity(p.u, p.a, t));
  const path = (p, t1) => {
    if (t1 <= 0) return '';
    let d = '';
    for (let i = 0; i <= SAMPLES; i++) {
      const t = (t1 * i) / SAMPLES;
      d += `${i ? 'L' : 'M'}${px(t).toFixed(2)} ${py(value(p, t)).toFixed(2)}`;
    }
    return d;
  };
  let last = '';
  return function update(p, t, tEnd, { preview = true, x = null } = {}) {
    const key = `${p.x0}|${p.u}|${p.a}|${t}|${tEnd}|${preview}|${x}`;
    if (key === last) return;
    last = key;
    plan.setAttribute('d', preview ? path(p, tEnd) : '');
    run.setAttribute('d', path(p, t));
    const y = kind === 'x' && x != null ? x : value(p, t);
    dot.setAttribute('cx', px(t).toFixed(2));
    dot.setAttribute('cy', py(y).toFixed(2));
  };
}
