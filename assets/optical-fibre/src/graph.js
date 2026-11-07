// The graph in the panel: the angle of incidence θ₁ at each wall the light meets, in turn, against the critical angle
// θc = 75° (a dashed line). Above the line the wall reflects all of the light (a filled dot); below it most of the light
// leaves the core (a hollow dot with a cross). The dots come in as the light reaches each wall, so the graph and the
// picture stay in step. Drawn in real pixels for its box (an SVG redrawn when its box changes), numbers ≥ 12 px.

const NS = 'http://www.w3.org/2000/svg';
export const Y_MIN = 60; // degrees on the axis
export const Y_MAX = 90;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * @param {HTMLElement} el the box (its size sets the graph's)
 * @param {{ t: (key: string, vars?: object) => string, N: (x: number | string) => string, theta: number, colors: Record<string, string> }} o
 */
export function createGraph(el, { t, N, theta, colors }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'of-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';
  /** @type {any} */
  let last = null;
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => last && draw(last)).observe(el);

  /** angles: [{ theta, tir }] of the walls reached so far; slots: how many places the axis keeps; focus: the index ringed. */
  function draw(args) {
    last = args;
    const { angles = [], slots = 8, focus = -1 } = args;
    const W = Math.max(150, el.clientWidth);
    const H = Math.max(70, el.clientHeight);
    const key = JSON.stringify([W, H, slots, focus, angles.map((a) => [Math.round(a.theta * 10), a.tir])]);
    if (key === lastKey) return;
    lastKey = key;
    const f = Math.min(15, Math.max(12, H / 9));
    const x0 = f * 2.3;
    const x1 = W - 6;
    const y1 = f * 1.5;
    const y0 = H - f * 2.5; // under the axis: the walls' numbers, then the axis's name
    const n = Math.max(slots, angles.length, 4);
    const X = (i) => x0 + ((i + 0.5) / n) * (x1 - x0);
    const Y = (d) => y0 - ((Math.min(Y_MAX, Math.max(Y_MIN, d)) - Y_MIN) / (Y_MAX - Y_MIN)) * (y0 - y1);
    let out = '';
    // the two regions: above θc the light stays in, below it leaves
    out += `<rect class="g-in" x="${x0}" y="${y1}" width="${x1 - x0}" height="${Y(theta) - y1}"/>`;
    out += `<rect class="g-out" x="${x0}" y="${Y(theta)}" width="${x1 - x0}" height="${y0 - Y(theta)}"/>`;
    for (const d of [60, 70, 80, 90]) {
      out += `<line class="g-grid" x1="${x0}" x2="${x1}" y1="${Y(d)}" y2="${Y(d)}"/>`;
      out += `<text class="g-num" x="${x0 - f * 0.3}" y="${Y(d) + f * 0.35}" text-anchor="end" font-size="${f}">${N(d)}°</text>`;
    }
    out += `<path class="g-axis" d="M${x0} ${y1}V${y0}H${x1}"/>`;
    // the critical angle
    out += `<line class="g-crit" x1="${x0}" x2="${x1}" y1="${Y(theta)}" y2="${Y(theta)}" stroke="${colors.crit}"/>`;
    const tag = t('graph_crit', { c: N(theta) });
    out += `<text class="g-tag" x="${x1 - 4}" y="${Y(theta) + f * 1.05}" text-anchor="end" font-size="${f}" fill="${colors.critText}">${tag}</text>`;
    // the axis's names
    out += `<text class="g-name" x="0" y="${f * 1.0}" font-size="${f}">${esc(t('graph_y'))}</text>`;
    out += `<text class="g-name" x="${(x0 + x1) / 2}" y="${H - f * 0.2}" text-anchor="middle" font-size="${f}">${esc(t('graph_x'))}</text>`;
    // the walls: a dot each, numbered under the axis when there is room
    const step = (x1 - x0) / n >= f * 1.3 ? 1 : 2;
    for (let i = 0; i < angles.length; i++) {
      const a = angles[i];
      const cx = X(i);
      const cy = Y(a.theta);
      if ((i + 1) % step === 0 || i === 0)
        out += `<text class="g-num" x="${cx}" y="${y0 + f * 1.0}" text-anchor="middle" font-size="${f * 0.9}">${N(i + 1)}</text>`;
      const r = Math.max(4, f * 0.34);
      if (i === focus) out += `<circle class="g-ring" cx="${cx}" cy="${cy}" r="${r + 4}" stroke="${colors.ti}"/>`;
      if (a.tir) out += `<circle class="g-dot" cx="${cx}" cy="${cy}" r="${r}" fill="${colors.ti}"/>`;
      else {
        out += `<circle class="g-leak" cx="${cx}" cy="${cy}" r="${r}" stroke="${colors.out}"/>`;
        const q = r * 0.62;
        out += `<path class="g-x" d="M${cx - q} ${cy - q}L${cx + q} ${cy + q}M${cx + q} ${cy - q}L${cx - q} ${cy + q}" stroke="${colors.out}"/>`;
      }
    }
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', args.aria || t('graph_aria', { c: N(theta) }));
    svg.innerHTML = out;
  }
  return { draw, el };
}
