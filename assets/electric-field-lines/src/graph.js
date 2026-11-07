// The graph in the panel, live with the 3D: for one charge, E against r (E = kq/r², the 1/r² curve) with a dot where
// q₀ is; for a pair, the size of E along the line between the two spheres (x measured from the left sphere's centre),
// with the dot at q₀ and, for like charges, the zero in the middle. Drawn in real pixels for its box (never stretched),
// numbers at least 12–13 px. Pure SVG strings, no library.

const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * @param {HTMLElement} el
 * @param {{ t: (key: string, vars?: object) => string, N: (x: number | string) => string, colors: { curve: string, dot: string, ghost: string, zero: string } }} o
 */
export function createGraph(el, { t, N, colors }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'efl-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';
  /** @type {any} */
  let last = null;
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => last && draw(last)).observe(el);

  /**
   * spec: { f(x) → E (N/C, ≥ 0), x0, x1 (the axis, cm), from, to (where the curve is drawn, cm), xStep, yMax (thousand
   * N/C), yStep, xName, yName, dot: x | null, ghost: { x, label } | null, zero: x | null, walls: [x, …] (sphere surfaces),
   * aria }
   */
  function draw(spec) {
    last = spec;
    const W = Math.max(120, el.clientWidth);
    const H = Math.max(60, el.clientHeight);
    const key = JSON.stringify([W, H, spec.id, spec.dot, spec.ghost, spec.zero, spec.aria, spec.yMax]);
    if (key === lastKey) return;
    lastKey = key;
    const f = Math.min(15, Math.max(12.5, H / 9));
    const lw = Math.min(3.6, Math.max(2.4, H / 50));
    const yw = Math.max(...spec.yTicks.map((v) => N(v).length)) * f * 0.62;
    const x0 = yw + f * 0.6;
    const x1 = W - f * 0.8;
    const y0 = H - f * 1.5;
    const y1 = f * 1.5;
    // a low graph keeps every other number on the side, so they never touch
    const gap = (y0 - y1) / (spec.yTicks.length - 1);
    const yTicks = gap < f * 1.2 ? spec.yTicks.filter((_, i) => i % 2 === (spec.yTicks.length - 1) % 2) : spec.yTicks;
    const X = (x) => x0 + ((x - spec.x0) / (spec.x1 - spec.x0)) * (x1 - x0);
    const Y = (e) => y0 - (Math.min(spec.yMax * 1.04, Math.max(0, e / 1000)) / spec.yMax) * (y0 - y1);
    let out = '';
    for (const v of yTicks) {
      out += `<line class="g-grid" x1="${x0}" x2="${x1}" y1="${Y(v * 1000)}" y2="${Y(v * 1000)}"/>`;
      out += `<text class="g-num" x="${x0 - f * 0.35}" y="${Y(v * 1000) + f * 0.35}" text-anchor="end" font-size="${f}">${N(v)}</text>`;
    }
    // a narrow graph keeps every other number under it, so the axis's name fits between the last two
    const xTicks = x1 - x0 < 300 ? spec.xTicks.filter((_, i) => i % 2 === 0) : spec.xTicks;
    for (const x of xTicks) {
      out += `<line class="g-grid" x1="${X(x)}" x2="${X(x)}" y1="${y0}" y2="${y1}"/>`;
      out += `<text class="g-num" x="${X(x)}" y="${y0 + f * 1.15}" text-anchor="middle" font-size="${f}">${N(x)}</text>`;
    }
    // the spheres: shaded where the line would be inside one
    for (const w of spec.walls || []) {
      const a = X(w.from);
      const b = X(w.to);
      out += `<rect class="g-wall" x="${Math.min(a, b)}" y="${y1}" width="${Math.abs(b - a)}" height="${y0 - y1}"/>`;
      if (spec.wallName)
        out += `<text class="g-side" x="${(a + b) / 2}" y="${y1 + f * 1.1}" text-anchor="middle" font-size="${f * 0.92}">${esc(spec.wallName)}</text>`;
    }
    out += `<path class="g-axis" d="M${x0} ${y1 - f * 0.4}V${y0}H${x1}"/>`;
    // the axis's name in the row of numbers, between the last two
    const [xa, xb] = xTicks.slice(-2);
    out += `<text class="g-name" x="${X((xa + xb) / 2)}" y="${y0 + f * 1.15}" text-anchor="middle" font-size="${f}">${esc(spec.xName)}</text>`;
    out += `<text class="g-name" x="${x0 + f * 0.3}" y="${f * 0.95}" font-size="${f}">${esc(spec.yName)}</text>`;
    // the curve, clipped to the plot (none before anything is charged: the axes wait for it)
    const n = spec.curve ? 90 : -1;
    let d = '';
    let pen = false;
    for (let i = 0; i <= n; i++) {
      const x = spec.from + ((spec.to - spec.from) * i) / n;
      const e = spec.f(x);
      if (e / 1000 > spec.yMax * 1.04) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(e).toFixed(1)}`;
      pen = true;
    }
    out += `<path class="g-curve" d="${d}" stroke="${colors.curve}" stroke-width="${lw}"/>`;
    if (spec.zero != null) {
      // the curve closes in on the zero from both sides: its name stands higher up, where they are far apart, with a thin line down
      const zx = X(spec.zero);
      out += `<path class="g-zline" d="M${zx} ${y1 + f * 1.15}V${Y(0)}" stroke="${colors.zero}"/>`;
      out += `<circle class="g-zero" cx="${zx}" cy="${Y(0)}" r="${f * 0.42}" stroke="${colors.zero}"/>`;
      out += `<text class="g-zero-t" x="${zx}" y="${y1 + f * 0.85}" text-anchor="middle" font-size="${f}" fill="${colors.zero}">${esc(t('graph_zero', { z: 0 }))}</text>`;
    }
    if (spec.ghost) {
      const gx = X(spec.ghost.x);
      const gy = Y(spec.f(spec.ghost.x));
      out += `<circle class="g-ghost" cx="${gx}" cy="${gy}" r="${f * 0.32}" stroke="${colors.ghost}"/>`;
      out += `<text class="g-tag" x="${gx + f * 0.5}" y="${gy - f * 0.5}" font-size="${f}">${esc(spec.ghost.label)}</text>`;
    }
    if (spec.dot != null) {
      const e = spec.f(spec.dot);
      const dx = X(spec.dot);
      const dy = Y(e);
      out += `<path class="g-guide" d="M${dx} ${y0}V${dy}H${x0}"/>`;
      out += `<circle class="g-dot" cx="${dx}" cy="${dy}" r="${f * 0.4}" fill="${colors.dot}"/>`;
      if (spec.dotLabel && spec.dot !== spec.zero) {
        // clear of the curve: over the dot inside a U; to the upper right of a falling curve (upper left, higher, near its end)
        const u = spec.tag === 'above';
        const end = !u && dx > x0 + 0.7 * (x1 - x0);
        const tx = u ? dx : dx + (end ? -f * 0.2 : f * 0.6);
        const ty = Math.max(y1 + f * 0.9, dy - f * (end ? 1.2 : 0.7));
        out += `<text class="g-tag g-tag-now" x="${tx}" y="${ty}" text-anchor="${u ? 'middle' : end ? 'end' : 'start'}" font-size="${f}">${esc(spec.dotLabel)}</text>`;
      }
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', spec.aria || '');
    svg.innerHTML = out;
  }
  return { draw, reset: () => (lastKey = '') };
}
