// Where things go on the stage, in CSS pixels, for any frame size: the one big lens and the room left for the stove
// and pan, and the three lenses of the last part with the curved arrows between them. Pure functions (unit-tested).

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** True when the stage is taller than wide enough to stack things (phones in portrait, narrow frames). */
export const isTall = (W, H) => W / H < 1.05;

/**
 * The big lens and the free region for the 3D subject. Tall frames: the lens at the top right, the stove below it.
 * Wide frames: the lens on the right, the stove on the left.
 */
export function singleLayout(W, H) {
  if (isTall(W, H)) {
    const r = clamp(Math.min(W * 0.25, H * 0.21), 50, 160);
    const lens = { cx: W - r - 14, cy: r + 12, r };
    const top = lens.cy + r + 6;
    return { lens, region: { x0: 8, y0: top, x1: W - 8, y1: H - 8 }, tag: { side: 'left' } };
  }
  const r = clamp(Math.min(H * 0.33, W * 0.2), 50, 180);
  const lens = { cx: W - r - 18, cy: H * 0.5 + 10, r };
  return { lens, region: { x0: 8, y0: 8, x1: lens.cx - r - 12, y1: H - 8 }, tag: { side: 'top' } };
}

/**
 * The three lenses: ice, water, vapour, rising as heat is added. Tall frames: a zigzag from the bottom left up to the
 * top left; wide frames: ice and water side by side at the bottom, the vapour up on the right.
 */
export function cycleLayout(W, H) {
  if (isTall(W, H)) {
    const r = clamp(Math.min(W * 0.19, H * 0.15), 34, 120);
    return [
      { cx: W * 0.27, cy: H - r - 32, r, label: 'below' },
      { cx: W * 0.73, cy: H * 0.5 + 4, r, label: 'below' },
      { cx: W * 0.27, cy: r + 10, r, label: 'below' },
    ];
  }
  const r = clamp(Math.min(H * 0.19, W * 0.13), 34, 130);
  return [
    { cx: W * 0.16, cy: H * 0.7, r, label: 'below' },
    { cx: W * 0.56, cy: H * 0.7, r, label: 'below' },
    { cx: W * 0.84, cy: H * 0.27 + 4, r, label: 'above' },
  ];
}

/**
 * A curved arrow from lens a to lens b, on one side of the line between them (side +1 or −1): where it leaves a's rim,
 * where it reaches b's rim, the bend, and where its label goes (outside the bend).
 */
export function arcArrow(a, b, side, { spread = 0.5, bulge = 0.22, gap = 5 } = {}) {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy * side;
  const ny = ux * side;
  const rim = (c, dirx, diry, r) => {
    // a point on c's rim, turned from the direction (dirx, diry) towards the arrow's side by `spread` radians
    const cs = Math.cos(spread);
    const sn = Math.sin(spread);
    const px = dirx * cs + nx * sn;
    const py = diry * cs + ny * sn;
    return { x: c.cx + px * (r + gap), y: c.cy + py * (r + gap) };
  };
  const p0 = rim(a, ux, uy, a.r);
  const p1 = rim(b, -ux, -uy, b.r);
  const span = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;
  const c = { x: mx + nx * span * bulge, y: my + ny * span * bulge };
  // the curve's middle (quadratic Bézier at ½) and the label just outside it
  const mid = { x: 0.25 * p0.x + 0.5 * c.x + 0.25 * p1.x, y: 0.25 * p0.y + 0.5 * c.y + 0.25 * p1.y };
  return { p0, p1, c, mid, normal: { x: nx, y: ny } };
}

/**
 * How much farther (k > 1) or nearer the camera must be for a box, projected to NDC from distance d, to fit a pixel
 * region of a W×H frame. Iterate: perspective makes it approximate.
 */
export function fitToRegion(ndc, d, W, H, region) {
  const xs = ndc.map((p) => p.x);
  const ys = ndc.map((p) => p.y);
  const needW = ((Math.max(...xs) - Math.min(...xs)) / 2) * W;
  const needH = ((Math.max(...ys) - Math.min(...ys)) / 2) * H;
  const k = Math.max(needW / (region.x1 - region.x0), needH / (region.y1 - region.y0));
  return { d: d * k, k };
}

/** Points along a quadratic Bézier { p0, c, p1 } (for keeping words off the arrows). */
export function bezierPoints({ p0, c, p1 }, n = 14) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = (1 - u) * (1 - u);
    const b = 2 * u * (1 - u);
    const d = u * u;
    out.push({ x: a * p0.x + b * c.x + d * p1.x, y: a * p0.y + b * c.y + d * p1.y });
  }
  return out;
}

/**
 * A box of size w×h for the words naming a lens: the first of the candidate places (below, above, beside…) that stays
 * on the stage and clear of the given points (arrows), boxes (other words) and circles (lenses). Returns its centre.
 */
export function placeBeside(lens, w, h, W, H, { points = [], boxes = [], circles = [], order = ['below', 'above', 'right', 'left'] } = {}) {
  const g = Math.max(6, lens.r * 0.08);
  const at = {
    below: { x: lens.cx, y: lens.cy + lens.r + g + h / 2 },
    above: { x: lens.cx, y: lens.cy - lens.r - g - h / 2 },
    right: { x: lens.cx + lens.r + g + w / 2, y: lens.cy + lens.r * 0.45 },
    left: { x: lens.cx - lens.r - g - w / 2, y: lens.cy + lens.r * 0.45 },
    'below-left': { x: lens.cx - w / 2 + lens.r * 0.3, y: lens.cy + lens.r + g + h / 2 },
    'below-right': { x: lens.cx + w / 2 - lens.r * 0.3, y: lens.cy + lens.r + g + h / 2 },
  };
  let best = null;
  let bestBad = Infinity;
  for (const k of order) {
    const p = at[k];
    if (!p) continue;
    // slide back onto the stage
    const x = clamp(p.x, w / 2 + 4, W - w / 2 - 4);
    const y = clamp(p.y, h / 2 + 4, H - h / 2 - 4);
    const x0 = x - w / 2 - 3;
    const x1 = x + w / 2 + 3;
    const y0 = y - h / 2 - 3;
    const y1 = y + h / 2 + 3;
    let bad = 0;
    for (const q of points) if (q.x > x0 && q.x < x1 && q.y > y0 && q.y < y1) bad++;
    for (const b of boxes) if (b.x0 < x1 && b.x1 > x0 && b.y0 < y1 && b.y1 > y0) bad += 3;
    for (const c of circles) {
      const nx = clamp(c.cx, x0, x1);
      const ny = clamp(c.cy, y0, y1);
      if (Math.hypot(nx - c.cx, ny - c.cy) < c.r) bad += 3;
    }
    if (bad < bestBad) {
      bestBad = bad;
      best = { x, y, x0, x1, y0, y1 };
    }
    if (bad === 0) break;
  }
  return best;
}
