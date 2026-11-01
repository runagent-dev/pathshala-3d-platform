// One oscillator state drives every number, curve marker and energy share. No history buffer: pause/seek,
// reverse the starting side, or change amplitude and the entire set still describes the same cycle.
import { motionAt, omega, period, springQuantities } from './motion.js';

const grid = '<path class="sg-grid" d="M0 25H240M60 0V50M120 0V50M180 0V50"/>';
const plot = (content) =>
  `<svg viewBox="0 0 240 50" preserveAspectRatio="none" aria-hidden="true">${grid}${content}<line class="sg-cursor" x1="0" y1="0" x2="0" y2="50"/></svg>`;
const curve = (key) =>
  `<path class="sg-curve sg-${key}" data-curve="${key}"/><circle class="sg-marker sg-${key}" data-marker="${key}" cx="0" cy="25" r="3"/>`;
const quantities = [
  ['x', 'unit_m'],
  ['v', 'unit_velocity'],
  ['a', 'unit_acceleration'],
];
const path = (values, mapY) => values.map((v, i) => `${i ? 'L' : 'M'}${i * 2.4},${mapY(v).toFixed(3)}`).join('');

/**
 * The spring's graphs in `host`: the two views (গতি: x, v, a; শক্তি: K, U, E) chosen by two buttons beside them.
 * onMode(mode) runs when the view changes (the figure shows that view's note under the graphs).
 */
export function createSpringGraphs(host, t, { onMode = (_mode) => {} } = {}) {
  const value = (key, unit) => `<span class="sg-value"><span data-value="${key}"></span> ${t(unit)}</span>`;
  host.innerHTML = `
    <div class="sg-switch" role="group" aria-label="${t('graph_views')}">
      <button type="button" data-graph="motion" aria-pressed="true">${t('graph_motion')}</button>
      <button type="button" data-graph="energy" aria-pressed="false">${t('graph_energy')}</button>
    </div>
    <div class="sg-body">
      <div class="sg-motion">
        ${quantities.map(([key, unit]) => `<div class="sg-row sg-${key}" role="group" aria-label="${t(`trace_${key}`)}"><span class="sg-label"><b>${t(`trace_${key}`)}</b>${value(key, unit)}</span>${plot(curve(key))}</div>`).join('')}
      </div>
      <div class="sg-energy" hidden>
        <div class="sg-energy-share">
          <svg class="sg-donut" viewBox="0 0 80 80" role="img" aria-label="${t('energy_share')}">
            <circle class="sg-ring-u" cx="40" cy="40" r="29"/>
            <circle class="sg-ring-k" cx="40" cy="40" r="29" pathLength="100" transform="rotate(-90 40 40)"/>
          </svg>
          <div class="sg-energy-values">
            ${[
              ['k', 'unit_energy'],
              ['u', 'unit_energy'],
              ['e', 'unit_energy'],
            ]
              .map(([key, unit]) => `<span class="sg-${key}"><b>${t(`trace_${key}`)}</b>${value(key, unit)}</span>`)
              .join('')}
          </div>
        </div>
        <div class="sg-energy-plot" role="img" aria-label="${t('energy_graph')}">${plot(`${curve('u')}${curve('k')}<path class="sg-total" d="M0 5H240"/>`)}</div>
      </div>
      <span class="sg-held" hidden>${t('graph_release')}</span>
    </div>
`;
  let mode = 'motion';
  let lastCycle = '';
  let shownHeld = null;
  /** @type {Record<string, string>} */
  const shownText = {};
  const $ = (selector) => host.querySelector(selector);
  const values = Object.fromEntries([...host.querySelectorAll('[data-value]')].map((e) => [e.dataset.value, e]));
  const format = (v) => t.num((Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace('-', '−'));
  function setMode(next) {
    mode = next;
    host.dataset.graphMode = mode;
    $('.sg-motion').hidden = mode !== 'motion';
    $('.sg-energy').hidden = mode !== 'energy';
    for (const b of host.querySelectorAll('[data-graph]')) b.setAttribute('aria-pressed', String(b.dataset.graph === mode));
    onMode(mode);
  }
  host.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-graph]');
    if (button) setMode(button.dataset.graph);
  });
  setMode(mode);
  return {
    /** Back to the motion view (the figure's reset). */
    reset: () => setMode('motion'),
    /** The note for the view shown: what the signs and the energies mean. */
    note: () => t(mode === 'motion' ? 'motion_hint' : 'energy_hint'),
    update(m, { amplitude, side, phase, held }) {
      if (held !== shownHeld) {
        $('.sg-held').hidden = !held;
        $('.sg-body').classList.toggle('is-held', held);
        shownHeld = held;
      }
      const q = springQuantities(m);
      const current = { x: m.x, v: m.v, a: q.acceleration, k: q.kinetic, u: q.potential, e: q.total };
      for (const [key, el] of Object.entries(values)) {
        const text = format(current[key]);
        if (shownText[key] !== text) el.textContent = shownText[key] = text;
      }
      const total = Math.max(1e-12, q.total);
      const scale = { x: amplitude, v: amplitude * omega('spring'), a: amplitude * omega('spring') ** 2, k: total, u: total };
      const y = (key, v) => (key === 'k' || key === 'u' ? 45 - (40 * v) / scale[key] : 25 - (20 * v) / Math.max(1e-12, scale[key]));
      const cycle = `${amplitude}:${side}`;
      if (cycle !== lastCycle) {
        const samples = Array.from({ length: 101 }, (_, i) => {
          const p = motionAt('spring', side * amplitude, (i * period('spring')) / 100);
          const e = springQuantities(p);
          return { x: p.x, v: p.v, a: e.acceleration, k: e.kinetic, u: e.potential };
        });
        for (const key of ['x', 'v', 'a', 'k', 'u'])
          $(`[data-curve="${key}"]`).setAttribute(
            'd',
            path(
              samples.map((s) => s[key]),
              (v) => y(key, v),
            ),
          );
        lastCycle = cycle;
      }
      for (const key of ['x', 'v', 'a', 'k', 'u']) {
        const marker = $(`[data-marker="${key}"]`);
        marker.setAttribute('cx', String(phase * 240));
        marker.setAttribute('cy', String(y(key, current[key])));
      }
      for (const cursor of host.querySelectorAll('.sg-cursor')) {
        cursor.setAttribute('x1', String(phase * 240));
        cursor.setAttribute('x2', String(phase * 240));
      }
      $('.sg-ring-k').style.strokeDasharray = `${(100 * q.kinetic) / total} 100`;
      // Useful to assistive technology and bridge-driven tests; readouts above remain the visible numbers.
      host.dataset.graphPhase = String(phase);
    },
  };
}
