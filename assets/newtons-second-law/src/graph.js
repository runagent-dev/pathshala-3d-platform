// The বেগ–সময় গ্রাফ in the panel, beside F = ma: the velocity over the 2 s the force acts, drawn as the cart moves.
// Its steepness is the acceleration: at each whole second a step (1 s across, +a up) is drawn under the line, and the
// lines of the examples already tried stay, faint and tagged with their a, so the steepness compares at a glance
// (the force doubled: twice as steep; the mass doubled: half as steep; the force backward: the line goes down).

const NS = 'http://www.w3.org/2000/svg';
export const T_MAX = 2; // s on the time axis: the push
export const V_MAX = 4; // m/s on the velocity axis: the fastest example (two people, 2 s)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * Labels in the right margin, one over the other: each keeps its y if it can, else moves the least so that none
 * overlap (gap px apart) and all stay between lo and hi. Pure; unit tested.
 * @param {number[]} ys wanted y of each label (px, down the screen)
 * @returns {number[]} the y given to each, in the same order
 */
export function spreadLabels(ys, gap, lo, hi) {
  const order = ys.map((y, i) => ({ y: Math.min(hi, Math.max(lo, y)), i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < order.length; k++) order[k].y = Math.max(order[k].y, order[k - 1].y + gap);
  const over = order.length ? order[order.length - 1].y - hi : 0;
  if (over > 0) {
    order[order.length - 1].y = hi;
    for (let k = order.length - 2; k >= 0; k--) order[k].y = Math.min(order[k].y, order[k + 1].y - gap);
  }
  const out = [];
  for (const o of order) out[o.i] = o.y;
  return out;
}

/**
 * @param {HTMLElement} el
 * @param {{ t: (key: string, vars?: object) => string, N: (x: number | string) => string, colors: Record<string, string> }} o
 */
export function createGraph(el, { t, N, colors }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ns-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';

  /**
   * past: [{ v0, a, dur, tag }] lines of the examples tried (over their whole push, dur s); cur: { v0, a, upto, held } the run now
   * (upto: s of the push shown so far), or null; aria: the words for a screen reader.
   */
  function draw({ past = [], cur = null, aria = '' }) {
    const W = Math.max(110, el.clientWidth);
    const H = Math.max(60, el.clientHeight);
    const key = JSON.stringify([W, H, past, cur, aria]);
    if (key === lastKey) return;
    lastKey = key;
    const f = H > 120 ? 11.5 : 9.5; // font size
    const x0 = f * 1.5;
    const x1 = W - f * 3.6; // room on the right for the tags
    const y0 = H - f * 1.35;
    const y1 = f * 1.5; // room over the plot for the axis's name
    const X = (s) => x0 + (s / T_MAX) * (x1 - x0);
    const Y = (v) => y0 - (Math.min(V_MAX, Math.max(0, v)) / V_MAX) * (y0 - y1);
    const vAt = (l, s) => l.v0 + l.a * s;
    let out = '';
    // grid and axes: every second, every m/s (the numbers 0, 2, 4 when it is small)
    const step = (y0 - y1) / V_MAX >= f * 1.3 ? 1 : 2;
    for (let v = 0; v <= V_MAX; v++) {
      out += `<line class="g-grid" x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}"/>`;
      if (v % step === 0) out += `<text class="g-num" x="${x0 - f * 0.35}" y="${Y(v) + f * 0.35}" text-anchor="end" font-size="${f}">${N(v)}</text>`;
    }
    for (let s = 0; s <= T_MAX; s++) {
      out += `<line class="g-grid" x1="${X(s)}" x2="${X(s)}" y1="${y0}" y2="${y1}"/>`;
      out += `<text class="g-num" x="${X(s)}" y="${y0 + f * 1.1}" text-anchor="middle" font-size="${f}">${N(s)}</text>`;
    }
    out += `<path class="g-axis" d="M${x0} ${y1}V${y0}H${x1}"/>`;
    out += `<text class="g-name" x="${X(T_MAX * 0.75)}" y="${y0 + f * 1.1}" text-anchor="middle" font-size="${f}">${esc(t('graph_t'))}</text>`;
    out += `<text class="g-name" x="0" y="${f * 0.95}" font-size="${f}">${esc(t('graph_v'))}</text>`;
    // the graph's name over the plot, at its right (the axis's name is at its left), where there is room for both
    const name = t('graph_name');
    if (x1 > f * (0.55 * (t('graph_v').length + name.length) + 1.2))
      out += `<text class="g-title" x="${x1}" y="${f * 0.95}" text-anchor="end" font-size="${f}">${esc(name)}</text>`;

    const tags = []; // in the right margin: { y, text, cls }
    for (const l of past) {
      out += `<line class="g-past" x1="${X(0)}" y1="${Y(l.v0)}" x2="${X(l.dur)}" y2="${Y(vAt(l, l.dur))}"/>`;
      tags.push({ y: Y(vAt(l, l.dur)), text: l.tag, cls: 'g-tag' });
    }
    if (cur) {
      const upto = Math.min(T_MAX, Math.max(0, cur.upto));
      // the steps: each whole second reached, 1 s across and +a up (down when a < 0) under the line
      for (let k = 1; k <= Math.floor(upto + 1e-6); k++) {
        const va = vAt(cur, k - 1);
        const vb = vAt(cur, k);
        out += `<path class="g-run" d="M${X(k - 1)} ${Y(va)}H${X(k)}"/>`;
        out += `<path class="g-rise" d="M${X(k)} ${Y(va)}V${Y(vb)}" stroke="${colors.acc}"/>`;
        const text = `${cur.a > 0 ? '+' : '−'}${N(Math.abs(cur.a))}`;
        if (k < T_MAX)
          out += `<text class="g-step" x="${X(k) + f * 0.3}" y="${(Y(va) + Y(vb)) / 2 + f * 0.35}" font-size="${f}" fill="${colors.accText}">${esc(text)}</text>`;
        else tags.push({ y: (Y(va) + Y(vb)) / 2, text, cls: 'g-step', fill: colors.accText });
      }
      out += `<line class="g-line" x1="${X(0)}" y1="${Y(cur.v0)}" x2="${X(upto)}" y2="${Y(vAt(cur, upto))}" stroke="${colors.vel}"/>`;
      for (let k = 0; k <= Math.floor(upto + 1e-6); k++)
        out += `<circle class="g-stamp" cx="${X(k)}" cy="${Y(vAt(cur, k))}" r="${f * 0.24}" fill="${colors.vel}"/>`;
      if (cur.held) out += `<circle class="g-ring" cx="${X(upto)}" cy="${Y(vAt(cur, upto))}" r="${f * 0.75}" stroke="${colors.acc}"/>`;
      out += `<circle class="g-dot" cx="${X(upto)}" cy="${Y(vAt(cur, upto))}" r="${f * 0.36}" fill="${colors.vel}"/>`;
      // what the steps mean, where the lines never go (early, fast)
      if (upto >= 1 - 1e-6)
        out += `<text class="g-slope" x="${x0 + f * 0.3}" y="${y1 + f * 1.05}" font-size="${f}" fill="${colors.accText}">${esc(t(x1 - x0 < f * 13 ? 'graph_slope_short' : 'graph_slope'))}</text>`;
    }
    if (!cur && !past.length)
      out += `<text class="g-hint" x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2 + f * 0.35}" text-anchor="middle" font-size="${f}">${esc(t('graph_hint'))}</text>`;
    const ys = spreadLabels(
      tags.map((g) => g.y),
      f * 1.05,
      y1 + f * 0.3,
      y0,
    );
    tags.forEach((g, i) => {
      out += `<text class="${g.cls}" x="${x1 + f * 0.35}" y="${ys[i] + f * 0.35}" font-size="${f}"${g.fill ? ` fill="${g.fill}"` : ''}>${esc(g.text)}</text>`;
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', aria);
    svg.innerHTML = out;
  }

  return { draw, reset: () => (lastKey = '') };
}
