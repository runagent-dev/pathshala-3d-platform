// The live graph in the panel (last step, on tall panels beside the 3D): across, the water in the cup (cm); up, how
// deep the coin lies under the surface: really (a dashed grey line) and as the eye sees it (amber), from trace(). Below
// the level at which the light from the coin's middle clears the rim the eye sees nothing (shaded). A dot marks the
// level now. Drawn as SVG in real pixels for its size (numbers stay 12–13 px), rebuilt only when the size or level changes.
import { COIN, CUP, LEVEL, N_WATER, threshold, trace } from './reading.js';

const NS = 'http://www.w3.org/2000/svg';
const MAXW = LEVEL.full - CUP.base; // cm of water when full
const MAXD = 6; // cm on the depth scale

export function createGraph({ t }) {
  const el = document.createElement('div');
  el.className = 'cc-graph';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pvc-graph cc-graph-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', t('g_aria'));
  el.appendChild(svg);
  const N = t.num;
  // the curve, once: water depth → how deep the coin looks (only where the eye sees it)
  const from = threshold() ?? LEVEL.full;
  const curve = [];
  for (let i = 0; i <= 40; i++) {
    const y = from + ((LEVEL.full - from) * i) / 40;
    const g = trace(y);
    if (g.visible) curve.push([y - CUP.base, g.apparent]);
  }
  const hiddenUpTo = from - CUP.base;
  let w = 0;
  let h = 0;
  let level = -1;
  const mk = (tag, attrs, text) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    if (text != null) n.textContent = text;
    svg.appendChild(n);
    return n;
  };
  function draw() {
    svg.textContent = '';
    if (w < 120 || h < 90) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const L = 34;
    const R = 10;
    const T = 22;
    const B = 34;
    const X = (d) => L + (d / MAXW) * (w - L - R);
    // depth grows downward, as in the cup: 0 at the top (the surface)
    const Y = (d) => T + (d / MAXD) * (h - T - B);
    // what the eye cannot see
    mk('rect', { class: 'g-none', x: X(0), y: T, width: X(hiddenUpTo) - X(0), height: h - T - B });
    mk('text', { class: 'g-none-t', x: (X(0) + X(hiddenUpTo)) / 2, y: h - B - 8, 'text-anchor': 'middle', 'font-size': 12 }, t('g_hidden'));
    for (let d = 0; d <= MAXD; d += 2) {
      mk('line', { class: 'g-grid', x1: L, x2: w - R, y1: Y(d), y2: Y(d) });
      mk('text', { class: 'g-num', x: L - 5, y: Y(d) + 4, 'text-anchor': 'end', 'font-size': 12 }, N(d));
    }
    for (let d = 0; d <= 5; d++) mk('text', { class: 'g-num', x: X(d), y: h - B + 15, 'text-anchor': 'middle', 'font-size': 12 }, N(d));
    mk('path', { class: 'g-axis', d: `M${L} ${T}V${h - B}H${w - R}` });
    mk('text', { class: 'g-name', x: w - R, y: h - 6, 'text-anchor': 'end', 'font-size': 12 }, t('g_x'));
    mk('text', { class: 'g-name', x: L - 28, y: 13, 'font-size': 12 }, t('g_y'));
    // really: the coin's face under the surface (water depth less the coin's thickness)
    const r0 = COIN.h;
    mk('path', { class: 'g-real', d: `M${X(r0)} ${Y(0)}L${X(MAXW)} ${Y(MAXW - r0)}`, 'stroke-width': 2 });
    mk('text', { class: 'g-real-t', x: X(2.2) + 6, y: Y(2.2 - r0) - 6, 'text-anchor': 'end', 'font-size': 12 }, t('g_real'));
    // for comparison: looking straight down it would look d/n deep (dotted)
    mk('path', { class: 'g-down', d: `M${X(r0)} ${Y(0)}L${X(MAXW)} ${Y((MAXW - r0) / N_WATER)}`, 'stroke-width': 1.6 });
    mk('text', { class: 'g-down-t', x: X(MAXW) - 2, y: Y((MAXW - r0) / N_WATER) + 15, 'text-anchor': 'end', 'font-size': 12 }, t('g_down'));
    // as it looks
    const d = curve.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join('');
    mk('path', { class: 'g-seen', d, 'stroke-width': 3 });
    mk('text', { class: 'g-seen-t', x: X(curve[0][0]) - 4, y: Y(curve[0][1]) - 8, 'text-anchor': 'end', 'font-size': 12 }, t('g_seen'));
    // now
    const now = level - CUP.base;
    const g = trace(level);
    mk('line', { class: 'g-now', x1: X(now), x2: X(now), y1: T, y2: h - B });
    if (g.visible) mk('circle', { class: 'g-dot', cx: X(now), cy: Y(g.apparent), r: 5 });
    if (g.water) mk('circle', { class: 'g-dot-real', cx: X(now), cy: Y(g.depth), r: 4 });
  }
  const ro = new ResizeObserver(() => {
    const r = el.getBoundingClientRect();
    const nw = Math.round(r.width);
    const nh = Math.round(r.height);
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    draw();
  });
  ro.observe(el);
  return {
    el,
    update(y) {
      const k = Math.round(y * 100) / 100;
      if (k === level) return;
      level = k;
      draw();
    },
  };
}
