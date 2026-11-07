// The graph in the panel: the power P of each lens tried against its focal length f (in metres). The curve P = 1/f (convex lenses,
// above the line P = 0) and P = −1/f (concave lenses, below it) is drawn faint once the student knows the formula; each lens tried is a
// dot on it, the one in the cradle ringed and tagged with its power. A shorter f is to the left, where the curve shoots up: a stronger
// lens. Drawn in real pixels for the box it is given, again whenever the box changes.
import { curve, GRAPH } from './reading.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * @param {HTMLElement} el
 * @param {{ t: (key: string, vars?: object) => string, N: (x: number | string) => string, signed: (p: number) => string }} o
 */
export function createGraph(el, { t, N, signed }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'lp-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';
  /** @type {any} */
  let last = null;
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => last && draw(last)).observe(el);

  /**
   * dots: [{ f (m), p, now }] the lenses tried; curve: show the faint curve; aria: the words for a screen reader.
   */
  function draw(args) {
    last = args;
    const { dots = [], showCurve = false, aria = '' } = args;
    const W = el.clientWidth;
    const H = el.clientHeight;
    // too little room (a short panel, a step with long words): no graph rather than an unreadable one
    if (W < 150 || H < 72) {
      if (lastKey !== 'none') svg.innerHTML = '';
      lastKey = 'none';
      return;
    }
    const key = JSON.stringify([W, H, dots, showCurve, aria]);
    if (key === lastKey) return;
    lastKey = key;
    // the numbers at least 12 px, the names at least 12.5 (Bangla digits are small for their size)
    const f = Math.min(15, Math.max(12, H / 12));
    const x0 = f * 2.3;
    const x1 = W - f * 0.9;
    const y1 = f * 1.5;
    // the name of the f axis on a row of its own under the numbers when there is room, else short at the end of their row
    const ownRow = H >= 130;
    const y0 = H - f * (ownRow ? 2.75 : 1.6);
    const fName = t(ownRow ? 'graph_f' : 'graph_f_short');
    const fNameW = f * 0.62 * fName.length;
    const { fMax, pMax } = GRAPH;
    const X = (m) => x0 + (m / fMax) * (x1 - x0);
    const Y = (p) => (y0 + y1) / 2 - (Math.max(-pMax, Math.min(pMax, p)) / pMax) * ((y0 - y1) / 2);
    let out = '';
    // grid: every 0.1 m; P every 5 (every 10 when small)
    const step = (y0 - y1) / 2 / pMax >= f * 0.24 ? 5 : 10;
    for (let p = -10; p <= 10; p += step) {
      out += `<line class="g-grid" x1="${x0}" x2="${x1}" y1="${Y(p)}" y2="${Y(p)}"/>`;
      out += `<text class="g-num" x="${x0 - f * 0.3}" y="${Y(p) + f * 0.35}" text-anchor="end" font-size="${f}">${esc(signed(p))}</text>`;
    }
    for (let i = 1; i <= 5; i++) {
      const m = i / 10;
      out += `<line class="g-grid" x1="${X(m)}" x2="${X(m)}" y1="${y1}" y2="${y0}"/>`;
      const clear = ownRow || X(m) + f * 1.2 < x1 - fNameW - f * 0.4;
      if (clear && (i % 2 === 0 || x1 - x0 > f * 14))
        out += `<text class="g-num" x="${X(m)}" y="${y0 + f * 1.15}" text-anchor="middle" font-size="${f}">${N(m)}</text>`;
    }
    // the axes: P up the left side, f along P = 0
    out += `<path class="g-axis" d="M${x0} ${y1 - f * 0.4}V${y0}"/>`;
    out += `<path class="g-axis" d="M${x0} ${Y(0)}H${x1}"/>`;
    out += `<text class="g-name" x="${x0 + f * 0.35}" y="${y1 - f * 0.5}" font-size="${f}">${esc(t('graph_p'))}</text>`;
    out += `<text class="g-name" x="${x1}" y="${y0 + f * (ownRow ? 2.3 : 1.15)}" text-anchor="end" font-size="${f}">${esc(fName)}</text>`;
    // which half is which
    out += `<text class="g-kind" x="${x1 - f * 0.2}" y="${y1 + f * 1.0}" text-anchor="end" font-size="${f}">${esc(t('graph_convex'))}</text>`;
    out += `<text class="g-kind" x="${x1 - f * 0.2}" y="${y0 - f * 0.5}" text-anchor="end" font-size="${f}">${esc(t('graph_concave'))}</text>`;
    if (showCurve) {
      for (const s of [1, -1]) {
        const pts = curve(s, 1 / (pMax + 1))
          .map((q) => `${X(q.f).toFixed(1)},${Y(q.p).toFixed(1)}`)
          .join(' ');
        out += `<polyline class="g-curve" points="${pts}"/>`;
      }
    }
    for (const d of dots) {
      if (!d.now) out += `<circle class="g-dot g-old" cx="${X(d.f)}" cy="${Y(d.p)}" r="${f * 0.3}"/>`;
    }
    const cur = dots.find((d) => d.now);
    if (cur) {
      const cx = X(cur.f);
      const cy = Y(cur.p);
      out += `<path class="g-drop" d="M${cx} ${cy}V${Y(0)}M${cx} ${cy}H${x0}"/>`;
      out += `<circle class="g-ring" cx="${cx}" cy="${cy}" r="${f * 0.72}"/>`;
      out += `<circle class="g-dot" cx="${cx}" cy="${cy}" r="${f * 0.36}"/>`;
      const right = cx + f * 6 < x1;
      out += `<text class="g-tag" x="${cx + (right ? f * 0.95 : -f * 0.95)}" y="${cy + f * 0.35}" text-anchor="${right ? 'start' : 'end'}" font-size="${f}">${esc(t('graph_tag', { p: signed(cur.p) }))}</text>`;
    }
    if (!dots.length)
      out += `<text class="g-hint" x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2 - f * 0.6}" text-anchor="middle" font-size="${f}">${esc(t('graph_hint'))}</text>`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', aria);
    svg.innerHTML = out;
  }

  return { draw, reset: () => (lastKey = '') };
}
