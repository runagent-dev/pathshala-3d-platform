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
  /** @type {any} */
  let dotParts = null;
  /** @type {any} */
  let geo = null;
  let lastDot = '';
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
    const key = JSON.stringify([W, H, spec.id, spec.ghost, spec.zero, spec.aria, spec.yMax, spec.note]);
    if (key === lastKey) {
      place(spec);
      return;
    }
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
    // the charges these numbers are for: the top row's right end (spec.note is the figure's own tspans)
    if (spec.note) out += `<text class="g-note" x="${W}" y="${f * 0.95}" text-anchor="end" font-size="12">${spec.note}</text>`;
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
    // what moves with q₀: three parts, kept and moved by their attributes (place), never rebuilt while the curve stands
    out += `<path class="g-guide"/><circle class="g-dot" r="${f * 0.4}" fill="${colors.dot}"/><text class="g-tag g-tag-now" font-size="${f}"></text>`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', spec.aria || '');
    svg.innerHTML = out;
    dotParts = { guide: svg.querySelector('.g-guide'), dot: svg.querySelector('.g-dot'), tag: svg.querySelector('.g-tag-now') };
    geo = { X, Y, x0, x1, y0, y1, f };
    lastDot = '';
    place(spec);
  }

  /** The dot on the curve at spec.dot, its guide lines and its value. */
  function place(spec) {
    const key = `${spec.dot}|${spec.dotLabel}`;
    if (key === lastDot) return;
    lastDot = key;
    const { guide, dot, tag } = dotParts;
    const on = spec.dot != null;
    guide.style.display = dot.style.display = on ? '' : 'none';
    tag.style.display = on && spec.dotLabel && spec.zero == null ? '' : 'none'; // like charges: the reading says it, E = 0 stands there
    if (!on) return;
    const { X, Y, x0, x1, y0, y1, f } = geo;
    const dx = X(spec.dot);
    const dy = Y(spec.f(spec.dot));
    guide.setAttribute('d', `M${dx} ${y0}V${dy}H${x0}`);
    dot.setAttribute('cx', dx);
    dot.setAttribute('cy', dy);
    tag.textContent = spec.dotLabel;
    // clear of the curve, and of the spheres' shaded ends: inside a U, on the side of its middle; to the upper right of a
    // falling curve (upper left, higher, near its end)
    let anchor = 'start';
    let tx = dx + f * 0.6;
    let ty = dy - f * 0.7;
    if (spec.tag === 'above') {
      const mid = (x0 + x1) / 2;
      const off = Math.abs(dx - mid) < f * 0.8;
      anchor = off ? 'middle' : dx < mid ? 'start' : 'end';
      tx = off ? dx : dx + (dx < mid ? f * 0.7 : -f * 0.7);
      ty = off ? dy - f * 0.7 : dy - f * 0.2;
    } else if (dx > x0 + 0.7 * (x1 - x0)) {
      anchor = 'end';
      tx = dx - f * 0.2;
      ty = dy - f * 1.2;
    }
    tag.setAttribute('x', tx);
    tag.setAttribute('y', Math.max(y1 + f * 0.9, ty));
    tag.setAttribute('text-anchor', anchor);
  }
  return { draw, reset: () => (lastKey = '') };
}
