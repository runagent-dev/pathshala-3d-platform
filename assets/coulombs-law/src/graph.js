// The graph in the panel, live with the 3D. Two kinds:
// - 'r': the force between the two spheres against their distance, F = k q₁q₂ / r² (its size, in 10¹¹ N, against r in
//   cm): the 1/r² curve and a dot at the spheres' distance now; after "twice as far" the earlier point stays as a ring
//   with its level, so the drop to a quarter shows at a glance.
// - 'x': the book's example (b): the net force on the third charge (to the right positive, in 10¹¹ N) against its
//   distance x from +9 C: the curve crosses zero at x = 0.43 m, where the dot is when the forces balance.
// Drawn in real pixels for its box whenever the box changes (ResizeObserver): numbers ≥ 12–13 px.
import { coulomb, forcesOnQ, niceCeil } from './reading.js';

const NS = 'http://www.w3.org/2000/svg';
const UNIT = 1e11; // the force axis counts in 10¹¹ N
export const R_AXIS = 40; // cm on the distance axis
const X_LO = 0.12; // m: the 'x' curve runs between the two spheres' surfaces
const X_HI = 0.88;
const NET_MAX = 10; // the 'x' graph's force axis: −10 … +10 (× 10¹¹ N)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * @param {HTMLElement} el
 * @param {{ t: (key: string, vars?: object) => string, N: (x: number | string) => string, colors: { force: string, text: string } }} o
 */
export function createGraph(el, { t, N, colors }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'cl-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';
  const clipId = `cl-plot-${Math.random().toString(36).slice(2, 8)}`;
  /** @type {any} */
  let last = null;
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => last && draw(last)).observe(el);

  /** "name (× 10¹¹ N)" as svg text: the power drawn raised and smaller (the font has no superscript digits). */
  const unitText = (name, f) =>
    `${esc(name)} (×${N(10)}<tspan dy="${-f * 0.4}" font-size="${f * 0.72}">${N(11)}</tspan><tspan dy="${f * 0.4}"> N)</tspan>`;
  const fmt = (v) => {
    const a = Math.round(v * 100) / 100;
    return N(String(a).replace('-', '−'));
  };

  /**
   * kind 'empty' | 'r' | 'x'.
   * 'r': { prod: |q₁q₂| (C²), r: m, was: { r, F } | null (the point before "twice as far"), dot: boolean }
   * 'x': { x: m (the third charge now), x0: m (where the forces balance), found: boolean }
   */
  function draw(args) {
    last = args;
    const W = Math.max(120, el.clientWidth);
    const H = Math.max(60, el.clientHeight);
    const key = JSON.stringify([W, H, args]);
    if (key === lastKey) return;
    lastKey = key;
    const f = Math.min(15, Math.max(12.5, H / 10));
    const lw = Math.min(4, Math.max(2.5, H / 50));
    const x0 = f * 2.3;
    const x1 = W - f * 0.9;
    const y1 = f * 1.45; // room over the plot for the force axis's name
    const y0 = H - f * 1.4;
    // the curves are clipped to the plot (a curve off the top is cut, never drawn flat along it)
    let out = `<defs><clipPath id="${clipId}"><rect x="${x0}" y="${y1 - 2}" width="${x1 - x0 + 2}" height="${y0 - y1 + 4}"/></clipPath></defs>`;
    if (args.kind === 'x') out += drawX(args, { W, H, f, lw, x0, x1, y0, y1 });
    else out += drawR(args, { W, H, f, lw, x0, x1, y0, y1 });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', args.aria || '');
    svg.innerHTML = out;
  }

  function drawR(a, { f, lw, x0, x1, y0, y1 }) {
    const prod = a.kind === 'r' ? Math.abs(a.prod) : 1;
    const top = niceCeil(Math.max(1, (coulomb(1, 1, 0.1) * prod) / UNIT));
    const X = (cm) => x0 + (cm / R_AXIS) * (x1 - x0);
    const Y = (F) => y0 - (Math.min(top, Math.max(0, F)) / top) * (y0 - y1);
    let out = '';
    // grid: every 10 cm; the force axis in 4 or 5 parts
    for (let cm = 0; cm <= R_AXIS; cm += 10) {
      out += `<line class="grid" x1="${X(cm)}" x2="${X(cm)}" y1="${y1}" y2="${y0}"/>`;
      out += `<text class="g-num" x="${X(cm)}" y="${y0 + f * 1.05}" text-anchor="middle" font-size="${f}">${N(cm)}</text>`;
    }
    const parts = top / niceCeil(top / 5) <= 5 ? Math.round(top / niceCeil(top / 5)) : 4;
    const step = top / parts;
    const rowsFit = (y0 - y1) / parts >= f * 1.05;
    for (let i = 0; i <= parts; i++) {
      const v = step * i;
      out += `<line class="grid" x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}"/>`;
      if (rowsFit || i === 0 || i === parts)
        out += `<text class="g-num" x="${x0 - f * 0.35}" y="${Y(v) + f * 0.35}" text-anchor="end" font-size="${f}">${fmt(v)}</text>`;
    }
    out += `<path class="axis g-axis" d="M${x0} ${y1 - f * 0.3}V${y0}H${x1}"/>`;
    // the distance's name over the axis at the right, high enough to clear the curve's tail (under 16 % of the top there)
    out += `<text class="g-name" x="${x1}" y="${y0 - Math.max(f * 1.5, (y0 - y1) * 0.24)}" text-anchor="end" font-size="${f}">${esc(t('g_r'))}</text>`;
    out += `<text class="g-name" x="${x0 - f * 1.9}" y="${f * 0.95}" font-size="${f}">${unitText(t('g_F'), f)}</text>`;
    if (a.kind !== 'r') {
      out += `<text class="g-hint" x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2 + f * 0.4}" text-anchor="middle" font-size="${f}">${esc(t('g_hint'))}</text>`;
      return out;
    }
    // the curve, from where it enters the plot to the end of the axis
    if (prod > 0) {
      const rMin = Math.max(1, 100 * Math.sqrt((9e9 * prod) / (top * UNIT)));
      let d = '';
      const n = 64;
      for (let i = 0; i <= n; i++) {
        const cm = rMin + ((R_AXIS - rMin) * i) / n;
        d += `${i ? 'L' : 'M'}${X(cm).toFixed(1)} ${Y(coulomb(1, prod, cm / 100) / UNIT).toFixed(1)}`;
      }
      out += `<path class="g-curve" clip-path="url(#${clipId})" d="${d}" stroke="${colors.force}" stroke-width="${lw}"/>`;
    } else {
      out += `<path class="g-curve" d="M${X(0)} ${Y(0)}H${X(R_AXIS)}" stroke="${colors.force}" stroke-width="${lw}"/>`;
    }
    const cmNow = a.r * 100;
    const Fnow = (coulomb(1, prod, a.r) || 0) / UNIT;
    if (a.was) {
      const cw = a.was.r * 100;
      const Fw = Math.abs(a.was.F) / UNIT;
      out += `<path class="g-guide" d="M${X(cw)} ${y0}V${Y(Fw)}H${x0}"/>`;
      out += `<circle class="g-was" cx="${X(cw)}" cy="${Y(Fw)}" r="${f * 0.38}" stroke="${colors.force}"/>`;
    }
    out += `<path class="g-guide" d="M${X(cmNow)} ${y0}V${Y(Fnow)}H${x0}"/>`;
    out += `<circle class="g-dot" cx="${X(cmNow)}" cy="${Y(Fnow)}" r="${f * 0.42}" fill="${colors.force}"/>`;
    if (a.was) {
      const q = a.quarter ? t('g_quarter') : '';
      if (q) out += `<text class="g-tag" x="${X(cmNow) + f * 0.6}" y="${Y(Fnow) - f * 0.5}" font-size="${f}" fill="${colors.text}">${esc(q)}</text>`;
    }
    return out;
  }

  function drawX(a, { f, lw, x0, x1, y0, y1 }) {
    const X = (m) => x0 + m * (x1 - x0);
    const Y = (F) => y1 + ((NET_MAX - F) / (2 * NET_MAX)) * (y0 - y1);
    const Yc = (F) => Y(Math.min(NET_MAX * 1.2, Math.max(-NET_MAX * 1.2, F)));
    let out = '';
    for (let i = 0; i <= 5; i++) {
      const m = i / 5;
      out += `<line class="grid" x1="${X(m)}" x2="${X(m)}" y1="${y1}" y2="${y0}"/>`;
      out += `<text class="g-num" x="${X(m)}" y="${y0 + f * 1.05}" text-anchor="middle" font-size="${f}">${fmt(m)}</text>`;
    }
    const rowsFit = (y0 - y1) / 4 >= f * 1.05;
    for (const v of [-NET_MAX, -NET_MAX / 2, 0, NET_MAX / 2, NET_MAX]) {
      out += `<line class="grid" x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}"/>`;
      if (rowsFit || v === 0 || Math.abs(v) === NET_MAX)
        out += `<text class="g-num" x="${x0 - f * 0.35}" y="${Y(v) + f * 0.35}" text-anchor="end" font-size="${f}">${fmt(v)}</text>`;
    }
    out += `<path class="axis g-axis" d="M${x0} ${y1 - f * 0.3}V${y0}H${x1}"/>`;
    out += `<line class="g-zero" x1="${x0}" x2="${x1}" y1="${Y(0)}" y2="${Y(0)}"/>`;
    out += `<text class="g-name" x="${x1}" y="${y0 - f * 0.45}" text-anchor="end" font-size="${f}">${esc(t('g_x'))}</text>`;
    out += `<text class="g-name" x="${x0 - f * 1.9}" y="${f * 0.95}" font-size="${f}">${unitText(t('g_net'), f)}</text>`;
    // the two halves: above zero the net force pushes q to the right (toward +16 C), below to the left
    out += `<text class="g-side" x="${X(0.97)}" y="${Y(NET_MAX * 0.55)}" text-anchor="end" font-size="${f * 0.92}">${esc(t('g_right'))}</text>`;
    out += `<text class="g-side" x="${X(0.03)}" y="${Y(-NET_MAX * 0.62)}" font-size="${f * 0.92}">${esc(t('g_left'))}</text>`;
    let d = '';
    const n = 80;
    for (let i = 0; i <= n; i++) {
      const m = X_LO + ((X_HI - X_LO) * i) / n;
      d += `${i ? 'L' : 'M'}${X(m).toFixed(1)} ${Yc(forcesOnQ(m).net / UNIT).toFixed(1)}`;
    }
    out += `<path class="g-curve" clip-path="url(#${clipId})" d="${d}" stroke="${colors.force}" stroke-width="${lw}"/>`;
    // where the forces balance: marked once the student has found it (the drag's goal must not be given away)
    if (a.found) {
      out += `<path class="g-guide" d="M${X(a.x0)} ${Y(0)}V${y0}"/>`;
      out += `<text class="g-tag" x="${X(a.x0) + f * 0.3}" y="${Y(0) + f * 1.2}" font-size="${f}" fill="${colors.text}">${esc(N(a.x0.toFixed(2)))}</text>`;
    }
    // the dot: on the curve, or a small arrowhead on the plot's edge when the force is off the scale
    const Fn = forcesOnQ(a.x).net / UNIT;
    if (Math.abs(Fn) <= NET_MAX) out += `<circle class="g-dot" cx="${X(a.x)}" cy="${Y(Fn)}" r="${f * 0.42}" fill="${colors.force}"/>`;
    else {
      const ye = Fn > 0 ? y1 : y0;
      const k = Fn > 0 ? -1 : 1;
      out += `<path class="g-off" d="M${X(a.x) - f * 0.45} ${ye - k * f * 0.1}L${X(a.x) + f * 0.45} ${ye - k * f * 0.1}L${X(a.x)} ${ye + k * f * 0.6}Z" fill="${colors.force}"/>`;
    }
    return out;
  }

  return { draw, reset: () => (lastKey = '') };
}
