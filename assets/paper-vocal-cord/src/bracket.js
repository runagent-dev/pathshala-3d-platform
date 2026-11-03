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
