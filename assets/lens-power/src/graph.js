// The graph in the panel: the power P of each lens tried against its focal length f (in metres, with its sign, so P = 1/f): the convex
// lenses on the right branch (f > 0, P > 0), the concave ones on the left (f < 0, P < 0). The curve is drawn faint once the student
// knows the formula; each lens tried is a dot on it, the one in the holder ringed and tagged with its power. The nearer f is to 0, the
// steeper the curve: a stronger lens. Drawn in real pixels for the box it is given, again whenever the box changes.
import { curve, GRAPH } from './reading.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * @param {HTMLElement} el
 * @param {{ t: (key: string, vars?: object) => string, N?: (x: number | string) => string, signed: (p: number) => string }} o
 */
export function createGraph(el, { t, signed }) {
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
    // the numbers at least 12 px (Bangla digits are small for their size)
    const f = Math.min(15, Math.max(12, H / 12));
    const ownRow = H >= 130;
    const x0 = f * 2.4;
    const x1 = W - f * 0.6;
    const y1 = f * 1.5;
    const y0 = H - f * (ownRow ? 2.75 : 1.6);
    const fName = t(ownRow ? 'graph_f' : 'graph_f_short');
    const fNameW = f * 0.62 * fName.length;
    const { fMax, pMax } = GRAPH;
    const X = (m) => (x0 + x1) / 2 + (m / fMax) * ((x1 - x0) / 2);
    const Y = (p) => (y0 + y1) / 2 - (Math.max(-pMax, Math.min(pMax, p)) / pMax) * ((y0 - y1) / 2);
    let out = '';
    // grid: P every 5 (every 10 when small); f every 0.1 m, numbered every 0.2
    const step = (y0 - y1) / 2 / pMax >= f * 0.24 ? 5 : 10;
    for (let p = -10; p <= 10; p += step) {
      out += `<line class="g-grid" x1="${x0}" x2="${x1}" y1="${Y(p)}" y2="${Y(p)}"/>`;
      out += `<text class="g-num" x="${x0 - f * 0.3}" y="${Y(p) + f * 0.35}" text-anchor="end" font-size="${f}">${esc(signed(p))}</text>`;
    }
    for (let i = -5; i <= 5; i++) {
      const m = i / 10;
      out += `<line class="g-grid" x1="${X(m)}" x2="${X(m)}" y1="${y1}" y2="${y0}"/>`;
      const clear = ownRow || X(m) + f * 1.4 < x1 - fNameW - f * 0.3;
      if (i % 2 === 0 && clear)
        out += `<text class="g-num" x="${X(m)}" y="${y0 + f * 1.15}" text-anchor="middle" font-size="${f}">${esc(signed(m))}</text>`;
    }
    // the axes: P = 0 across, f = 0 up the middle
    out += `<path class="g-axis" d="M${x0} ${Y(0)}H${x1}"/>`;
    out += `<path class="g-axis" d="M${X(0)} ${y1 - f * 0.4}V${y0}"/>`;
    out += `<text class="g-name" x="${X(0) + f * 0.35}" y="${y1 - f * 0.5}" font-size="${f}">${esc(t('graph_p'))}</text>`;
    out += `<text class="g-name" x="${x1}" y="${y0 + f * (ownRow ? 2.3 : 1.15)}" text-anchor="end" font-size="${f}">${esc(fName)}</text>`;
    // which branch is which: in the outer corners, clear of the curve and of the dots' tags
    out += `<text class="g-kind" x="${x1 - f * 0.2}" y="${Y(9) + f * 0.35}" text-anchor="end" font-size="${f}">${esc(t('graph_convex'))}</text>`;
    out += `<text class="g-kind" x="${x0 + f * 0.2}" y="${Y(-9) + f * 0.35}" font-size="${f}">${esc(t('graph_concave'))}</text>`;
    if (showCurve) {
      for (const sgn of [1, -1]) {
        const pts = curve(sgn, 1 / (pMax + 1))
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
      out += `<path class="g-drop" d="M${cx} ${cy}V${Y(0)}"/>`;
      out += `<circle class="g-ring" cx="${cx}" cy="${cy}" r="${f * 0.72}"/>`;
      out += `<circle class="g-dot" cx="${cx}" cy="${cy}" r="${f * 0.36}"/>`;
      // the tag on the outer side of its dot (away from the f = 0 line), on the inner side if there is no room
      const out1 = cur.f > 0 ? cx + f * 4 < x1 : cx - f * 4 > x0;
      const right = cur.f > 0 ? out1 : !out1;
      out += `<text class="g-tag" x="${cx + (right ? f * 0.95 : -f * 0.95)}" y="${cy + f * 0.35}" text-anchor="${right ? 'start' : 'end'}" font-size="${f}">${esc(t('graph_tag', { p: signed(cur.p) }))}</text>`;
    }
    if (!dots.length)
      out += `<text class="g-hint" x="${(x0 + x1) / 2}" y="${Y(4)}" text-anchor="middle" font-size="${f}">${esc(t('graph_hint'))}</text>`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', aria);
    svg.innerHTML = out;
  }

  return { draw, reset: () => (lastKey = '') };
}
