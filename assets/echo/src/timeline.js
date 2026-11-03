// The time line in the panel (SVG): real time after the clap, 0 to 0.25 s. A shaded crimson band from 0 to 0.1 s
// (how long a sound stays with us), the clap at 0, the echo's mark at t = 2d ÷ 330 once it has come back, and a moving
// crimson cursor while the slowed pulse travels. The echo's mark inside the band means the two sounds merge.
const NS = 'http://www.w3.org/2000/svg';
export const T_MAX = 0.25;

function el(name, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
}

/**
 * host: the element to fill. t(key, vars), N (digits). Returns { root, set({ cursor, echo, inside, show }) }:
 * cursor (s or null), echo (s or null: its mark), inside (whether the echo is within 0.1 s).
 */
export function createTimeline(host, t, N, { gap = 0.1 } = {}) {
  const W = 300;
  const H = 52;
  const L = 12;
  const R = W - 14;
  const Y = 24; // the axis
  const x = (s) => L + ((R - L) * Math.min(T_MAX, Math.max(0, s))) / T_MAX;
  const root = document.createElement('div');
  root.className = 'ec-tl';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': t('tl_aria') });
  root.appendChild(svg);
  host.appendChild(root);
  // the band: 0 → 0.1 s
  el('rect', { x: x(0), y: Y - 15, width: x(gap) - x(0), height: 22, rx: 3, class: 'ec-tl-band' }, svg);
  const bandText = el('text', { x: (x(0) + x(gap)) / 2, y: Y + 1, class: 'ec-tl-bandtext', 'text-anchor': 'middle' }, svg);
  bandText.textContent = t('tl_band', { gap: N(gap) });
  // the axis, ticks every 0.05 s, numbers every 0.1 s
  el('line', { x1: L, y1: Y + 7, x2: R + 6, y2: Y + 7, class: 'ec-tl-axis' }, svg);
  el('path', { d: `M${R + 9},${Y + 7} l-6,-3.5 v7 z`, class: 'ec-tl-head' }, svg);
  for (let k = 0; k <= 5; k++) {
    const s = k * 0.05;
    el('line', { x1: x(s), y1: Y + 7, x2: x(s), y2: Y + (k % 2 ? 10 : 12), class: 'ec-tl-axis' }, svg);
    if (k % 2 === 0) {
      const n = el('text', { x: x(s), y: Y + 23, class: 'ec-tl-num', 'text-anchor': k === 0 ? 'start' : 'middle' }, svg);
      n.textContent = N(Math.round(s * 10) / 10);
    }
  }
  const unit = el('text', { x: R + 8, y: Y + 23, class: 'ec-tl-num', 'text-anchor': 'end' }, svg);
  unit.textContent = t('tl_unit');
  // the clap at 0 (ink), the echo (teal), the cursor (crimson)
  el('rect', { x: x(0) - 2, y: Y - 13, width: 4, height: 20, rx: 1.5, class: 'ec-tl-clap' }, svg);
  const echo = el('g', { class: 'ec-tl-echo' }, svg);
  el('rect', { x: -2, y: Y - 13, width: 4, height: 20, rx: 1.5 }, echo);
  const echoText = el('text', { x: 0, y: Y - 17, 'text-anchor': 'middle' }, echo);
  echoText.textContent = t('tl_echo');
  const cursor = el('line', { x1: 0, y1: Y - 15, x2: 0, y2: Y + 9, class: 'ec-tl-cursor' }, svg);
  let last = '';
  function set({ cursor: c = null, echo: e = null, inside = false }) {
    const key = `${c == null ? '' : c.toFixed(4)}|${e == null ? '' : e.toFixed(4)}|${inside}`;
    if (key === last) return;
    last = key;
    cursor.style.display = c == null ? 'none' : '';
    if (c != null) {
      cursor.setAttribute('x1', String(x(c)));
      cursor.setAttribute('x2', String(x(c)));
    }
    echo.style.display = e == null ? 'none' : '';
    if (e != null) {
      echo.setAttribute('transform', `translate(${x(e)},0)`);
      echo.classList.toggle('inside', inside);
      // keep the word inside the box and clear of the band's words
      const px = x(e);
      echoText.setAttribute('text-anchor', px > W - 40 ? 'end' : 'middle');
      echoText.setAttribute('x', px > W - 40 ? '4' : '0');
      echoText.style.display = inside ? 'none' : '';
    }
  }
  set({});
  return { root, set };
}
