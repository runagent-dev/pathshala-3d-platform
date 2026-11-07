// The graph in the panel, drawn in real pixels for its box (an SVG redrawn when the box or the values change):
// - 'W': the work W (nJ) to bring q₀ from infinity to r, against r (cm). The line is drawn from the rail's far end
//   (30 cm) to where q₀ is now, so it grows as q₀ comes closer; a dashed tail past a break in the axis comes down to 0 at
//   the axis's last tick, ∞: the work starts from nothing, far away.
// - 'V': the same line divided by q₀: the potential V = W/q₀ (V) against r. The line keeps its shape and only the numbers
//   on the axis change (W ÷ ২ nC), so "per unit test charge" is seen, not just read. Open circles mark the shells.
//   `morph` (0 … 1) cross-fades the numbers of 'W' into those of 'V'.
// - 'bars': the potentials of sphere A, sphere B and the earth as three columns (like water levels), with the
//   difference between A and B written over them.
import { potentialAt, Q0_NC, R_MAX, R_MIN, R_SPHERE, SHELLS, workTo } from './reading.js';

const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const R_AXIS = 42; // cm of the r axis, the last few past the break
const R_TICK = 37; // where the true scale stops (the break)
const W_MAX = 2000; // nJ
const V_MAX = 1000; // V
const BAR_MAX = 2000; // V

/**
 * @param {HTMLElement} el
 * @param {{ t: (key: string, vars?: object) => string, N: (x: number | string) => string, fmt: (x: number) => string,
 *           colors: { work: string, pot: string, shell: string, earth: string } }} o
 */
export function createGraph(el, { t, N, fmt, colors }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ep-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';
  /** @type {any} */
  let last = null;
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => last && draw(last)).observe(el);

  /**
   * args: { mode: 'empty' | 'W' | 'V' | 'bars', r, morph, shells, bars: { a, b, earth }, aria }
   */
  function draw(args) {
    last = args;
    const W = Math.max(120, Math.round(el.clientWidth));
    const H = Math.max(70, Math.round(el.clientHeight));
    const key = JSON.stringify([W, H, args]);
    if (key === lastKey) return;
    lastKey = key;
    const f = Math.min(15, Math.max(12.5, H / 10.5));
    const out = args.mode === 'bars' ? bars(W, H, f, args) : curve(W, H, f, args);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.setAttribute('aria-label', args.aria || '');
    svg.innerHTML = out;
  }

  function curve(W, H, f, { mode, r, morph = 0, shells = false }) {
    const isV = mode === 'V';
    const k = isV ? Math.min(1, Math.max(0, morph)) : 0; // 0: W's numbers, 1: V's
    const x0 = f * 3.1;
    const x1 = W - f * 0.9;
    const y0 = H - f * 1.45;
    const y1 = f * 2;
    const X = (cm) => x0 + (cm / R_AXIS) * (x1 - x0);
    // one shape for both: W in nJ is twice V in volts (q₀ = 2 nC), so the same pixels carry either set of numbers
    const Y = (wNj) => y0 - (Math.min(W_MAX, Math.max(0, wNj)) / W_MAX) * (y0 - y1);
    let s = '';
    // the sphere: its region on the r axis (0 to R)
    s += `<rect class="g-sphere" x="${X(0)}" y="${y1}" width="${X(R_SPHERE * 100) - X(0)}" height="${y0 - y1}"/>`;
    const every = y0 - y1 < f * 6 ? 2 : 1; // a low graph: every other number
    for (let q = 0; q <= 4; q += every) {
      const y = Y((q / 4) * W_MAX);
      s += `<line class="g-grid" x1="${x0}" x2="${x1}" y1="${y}" y2="${y}"/>`;
      const wTxt = N(fmt((q / 4) * W_MAX));
      const vTxt = N(fmt((q / 4) * V_MAX));
      if (k < 1)
        s += `<text class="g-num" x="${x0 - f * 0.35}" y="${y + f * 0.35}" text-anchor="end" font-size="${f}" opacity="${1 - k}">${wTxt}</text>`;
      if (k > 0) s += `<text class="g-num" x="${x0 - f * 0.35}" y="${y + f * 0.35}" text-anchor="end" font-size="${f}" opacity="${k}">${vTxt}</text>`;
    }
    for (let cm = 0; cm <= 30; cm += 10) {
      s += `<line class="g-grid" x1="${X(cm)}" x2="${X(cm)}" y1="${y0}" y2="${y1}"/>`;
      s += `<text class="g-num" x="${X(cm)}" y="${y0 + f * 1.15}" text-anchor="middle" font-size="${f}">${N(cm)}</text>`;
    }
    const brk = X((R_TICK + R_AXIS) / 2 - 1);
    s += `<path class="g-axis" d="M${x0} ${y1 - f * 0.4}V${y0}H${brk - 4}M${brk + 4} ${y0}H${x1}M${brk - 7} ${y0 + 5}l6 -10M${brk + 1} ${y0 + 5}l6 -10"/>`;
    s += `<text class="g-num" x="${x1}" y="${y0 + f * 1.15}" text-anchor="middle" font-size="${f * 1.2}">∞</text>`;
    // the axes' names: W or V over the y axis, r under the x axis's end
    const yName = k > 0.5 ? t('graph_v') : t('graph_w');
    s += `<text class="g-name" x="${f * 0.1}" y="${f * 1.05}" font-size="${f}" fill="${k > 0.5 ? colors.pot : colors.work}">${esc(yName)}</text>`;
    s += `<text class="g-name" x="${x1}" y="${y1 - f * 0.45}" text-anchor="end" font-size="${f}">${esc(t('graph_r'))}</text>`;
    if (mode === 'empty') {
      s += `<text class="g-hint" x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2 + f * 0.6}" text-anchor="middle" font-size="${f}">${esc(t('graph_hint'))}</text>`;
      return s;
    }
    const col = k > 0.5 ? colors.pot : colors.work;
    const lw = Math.min(4.5, Math.max(3, H / 40));
    // the line: from 50 cm in to r (W), or the whole of it (V); the tail beyond the rail dashed
    const from = isV ? 9 : Math.max(R_MIN, Math.min(R_MAX, r));
    const pts = [];
    for (let cm = R_MAX; cm >= from - 1e-9; cm -= 0.5) pts.push(`${X(cm).toFixed(1)},${Y(workTo(cm)).toFixed(1)}`);
    if (pts.length) pts.push(`${X(from).toFixed(1)},${Y(workTo(from)).toFixed(1)}`);
    const tail = [];
    for (let cm = R_MAX; cm <= R_TICK; cm += 1) tail.push(`${X(cm).toFixed(1)},${Y(workTo(cm)).toFixed(1)}`);
    tail.push(`${x1.toFixed(1)},${y0.toFixed(1)}`);
    s += `<polyline class="g-tail" points="${tail.join(' ')}" stroke="${col}" stroke-width="${lw * 0.6}"/>`;
    s += `<polyline class="g-line" points="${pts.join(' ')}" stroke="${col}" stroke-width="${lw}"/>`;
    if (isV && shells)
      for (const cm of SHELLS)
        s += `<circle class="g-shell" cx="${X(cm)}" cy="${Y(workTo(cm))}" r="${f * 0.38}" stroke="${colors.shell}" stroke-width="${lw * 0.6}"/>`;
    // the dot where q₀ is, and its value beside it
    const rr = Math.max(R_MIN, Math.min(R_MAX, r));
    const cx = X(rr);
    const cy = Y(workTo(rr));
    s += `<line class="g-drop" x1="${cx}" x2="${cx}" y1="${cy}" y2="${y0}"/>`;
    s += `<circle class="g-dot" cx="${cx}" cy="${cy}" r="${f * 0.42}" fill="${col}"/>`;
    const val = k > 0.5 ? potentialAt(rr) : workTo(rr);
    const unit = k > 0.5 ? 'V' : 'nJ';
    const txt = `${Math.abs(val - Math.round(val)) > 1e-6 ? '≈ ' : ''}${N(fmt(val))} ${unit}`;
    const tw = f * 0.6 * txt.length;
    const right = cx + f * 0.8 + tw < x1;
    const tx = right ? cx + f * 0.75 : cx - f * 0.75;
    const ty = Math.max(y1 + f, Math.min(y0 - f * 0.4, cy - f * 0.55));
    s += `<text class="g-tag" x="${tx}" y="${ty}" text-anchor="${right ? 'start' : 'end'}" font-size="${f}" fill="${col}">${esc(txt)}</text>`;
    if (isV && k > 0.5) {
      const note = t('graph_div', { q0: Q0_NC });
      s += `<text class="g-note" x="${x1}" y="${y1 + f * 1.1}" text-anchor="end" font-size="${f * 0.92}">${esc(note)}</text>`;
    }
    return s;
  }

  function bars(W, H, f, { bars: b }) {
    const x0 = f * 3.1;
    const x1 = W - f * 0.6;
    const y0 = H - f * 1.45;
    const y1 = f * 2;
    const Y = (v) => y0 - (Math.min(BAR_MAX, Math.max(0, v)) / BAR_MAX) * (y0 - y1);
    let s = '';
    const every = y0 - y1 < f * 6 ? 2 : 1; // a low graph: every other number
    for (let q = 0; q <= 4; q += every) {
      const y = Y((q / 4) * BAR_MAX);
      s += `<line class="g-grid" x1="${x0}" x2="${x1}" y1="${y}" y2="${y}"/>`;
      s += `<text class="g-num" x="${x0 - f * 0.35}" y="${y + f * 0.35}" text-anchor="end" font-size="${f}">${N(fmt((q / 4) * BAR_MAX))}</text>`;
    }
    s += `<path class="g-axis" d="M${x0} ${y1 - f * 0.4}V${y0}H${x1}"/>`;
    s += `<text class="g-name" x="${f * 0.1}" y="${f * 1.05}" font-size="${f}" fill="${colors.pot}">${esc(t('graph_v'))}</text>`;
    const cols = [
      { name: t('bar_a'), v: b.a },
      { name: t('bar_b'), v: b.b },
      { name: t('bar_earth'), v: 0, earth: true },
    ];
    const slot = (x1 - x0) / cols.length;
    const bw = Math.min(slot * 0.46, f * 3.4);
    cols.forEach((c, i) => {
      const cx = x0 + slot * (i + 0.5);
      const top = Y(c.v);
      if (c.v > 0.5) s += `<rect class="g-bar" x="${cx - bw / 2}" y="${top}" width="${bw}" height="${y0 - top}" fill="${colors.pot}"/>`;
      else
        s += `<line class="g-zero" x1="${cx - bw / 2}" x2="${cx + bw / 2}" y1="${y0 - 1.5}" y2="${y0 - 1.5}" stroke="${c.earth ? colors.earth : colors.pot}"/>`;
      s += `<text class="g-tag" x="${cx}" y="${Math.max(y1 + f * 0.2, top - f * 0.35)}" text-anchor="middle" font-size="${f}" fill="${colors.pot}">${esc(`${N(fmt(c.v))} V`)}</text>`;
      s += `<text class="g-cat" x="${cx}" y="${y0 + f * 1.15}" text-anchor="middle" font-size="${f}">${esc(c.name)}</text>`;
    });
    const diff = Math.abs(b.a - b.b);
    s += `<text class="g-note" x="${x1}" y="${f * 1.05}" text-anchor="end" font-size="${f}">${esc(t('graph_diff', { d: N(fmt(diff)) }))}</text>`;
    return s;
  }

  return { draw, reset: () => (lastKey = '') };
}
