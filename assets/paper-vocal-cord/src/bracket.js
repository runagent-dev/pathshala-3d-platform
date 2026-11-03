// The λ bracket, drawn over the picture in screen space (an SVG in the labels' layer): a bar from one compression
// centre to the next, with a cap and an arrow head at each end, orange in a white halo with a thin dark edge, so it
// reads on the dark and the light bands alike and keeps the same stroke however far the camera is.
const NS = 'http://www.w3.org/2000/svg';

export function createBracket(layer, color) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pv-bracket');
  svg.setAttribute('aria-hidden', 'true');
  const path = (stroke, width) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-width', String(width));
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.append(p);
    return p;
  };
  const edge = path('rgba(16,33,58,0.75)', 7.5);
  const halo = path('#ffffff', 6);
  const core = path(color, 2.6);
  layer.append(svg);
  let shown = false;
  const box = { left: 0, top: 0, right: 0, bottom: 0 };
  return {
    get visible() {
      return shown;
    },
    /** From screen point a to b (px). */
    set(a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 8) return this.hide();
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;
      const cap = 7;
      const head = Math.min(8, len / 4);
      const f = (n) => n.toFixed(1);
      const d = [
        `M${f(a.x + nx * cap)} ${f(a.y + ny * cap)}L${f(a.x - nx * cap)} ${f(a.y - ny * cap)}`,
        `M${f(b.x + nx * cap)} ${f(b.y + ny * cap)}L${f(b.x - nx * cap)} ${f(b.y - ny * cap)}`,
        `M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}`,
        `M${f(a.x + ux * head + nx * head * 0.6)} ${f(a.y + uy * head + ny * head * 0.6)}L${f(a.x)} ${f(a.y)}L${f(a.x + ux * head - nx * head * 0.6)} ${f(a.y + uy * head - ny * head * 0.6)}`,
        `M${f(b.x - ux * head + nx * head * 0.6)} ${f(b.y - uy * head + ny * head * 0.6)}L${f(b.x)} ${f(b.y)}L${f(b.x - ux * head - nx * head * 0.6)} ${f(b.y - uy * head - ny * head * 0.6)}`,
      ].join('');
      for (const p of [edge, halo, core]) p.setAttribute('d', d);
      svg.style.display = '';
      shown = true;
      box.left = Math.min(a.x, b.x) - cap - 3;
      box.right = Math.max(a.x, b.x) + cap + 3;
      box.top = Math.min(a.y, b.y) - cap - 3;
      box.bottom = Math.max(a.y, b.y) + cap + 3;
    },
    hide() {
      svg.style.display = 'none';
      shown = false;
    },
    /** Its box on screen (for the labels to keep clear of), or null. */
    box: () => (shown ? box : null),
  };
}

/**
 * The two flaps' edges over the picture: each flap's outline (top edge, free edge, foot) in a thin warm-brown line and
 * its free edge heavier, so the two "cords" read as two distinct tongues that move apart and together.
 */
export function createFlapEdges(layer) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pv-bracket');
  svg.setAttribute('aria-hidden', 'true');
  const mk = (width, stroke) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-width', String(width));
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.append(p);
    return p;
  };
  const outline = mk(1.4, 'rgba(92,72,40,0.85)');
  const free = mk(2.6, '#5c4828');
  layer.prepend(svg);
  const f = (n) => n.toFixed(1);
  return {
    /** pts: per flap, its 51 outline points on screen (0–16 top edge, 17–33 free edge, 34–50 foot). */
    set(flaps) {
      let d = '';
      let e = '';
      for (const pts of flaps) {
        d += `M${f(pts[0].x)} ${f(pts[0].y)}`;
        for (let i = 1; i < pts.length; i++) d += `L${f(pts[i].x)} ${f(pts[i].y)}`;
        e += `M${f(pts[17].x)} ${f(pts[17].y)}`;
        for (let i = 18; i <= 33; i++) e += `L${f(pts[i].x)} ${f(pts[i].y)}`;
      }
      outline.setAttribute('d', d);
      free.setAttribute('d', e);
      svg.style.display = '';
    },
    hide() {
      svg.style.display = 'none';
    },
  };
}
