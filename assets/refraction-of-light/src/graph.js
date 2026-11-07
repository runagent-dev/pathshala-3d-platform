// The graph in the panel, drawn in real pixels for its box (an SVG redrawn when the box or the data change), three kinds:
// - 'speed': the book's উদাহরণ on টেবিল ৯.০১: the speed of light v = c/n in each medium, as bars, the chosen one marked;
// - 'theta': θ₂ against θ₁ for the chosen medium, under the line θ₂ = θ₁ (where it would be with no bending), and a dot
//   where the torch is now;
// - 'sine': sin θ₁ against sin θ₂: each Measure (মাপো) leaves a dot, and through them the straight line whose steepness is
//   n₂ / n₁ (the book's n₂ = sin θ₁ / sin θ₂). Lines of media measured before stay, faint, tagged with their n.

const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rad = (d) => (d * Math.PI) / 180;
const TOP_ROW = 30; // px at the top kept for the graph's title (left) and the medium chips (right, style.css)

/**
 * Labels in a margin, one over the other: each keeps its y if it can, else moves the least so that none overlap (gap
 * px apart) and all stay between lo and hi. Pure; unit tested.
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
 * @param {HTMLElement} el the box the graph fills
 * @param {{ t: (key: string, vars?: object) => string, N: (x: number | string) => string, colors: Record<string, string> }} o
 */
export function createGraph(el, { t, N, colors }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'rl-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';
  let last = null;
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => last && draw(last)).observe(el);
  const fx = (x, d = 2) => N(Number(x).toFixed(d));

  function frame(W, H, f) {
    return { W, H, f, x0: f * 2.3, x1: W - f * 0.6, y0: H - f * 1.55, y1: TOP_ROW + f * 0.6 };
  }

  /** The speed bars (the book's example): rows of name, bar, value. */
  function speed({ rows, chosen }, W, H) {
    const n = rows.length;
    const head = TOP_ROW;
    const rowH = (H - head - 2) / n;
    const f = Math.min(14, Math.max(12, rowH * 0.62));
    const nameW = Math.min(W * 0.46, f * 8.6);
    const valW = f * 2.6;
    const bx = nameW + f * 0.4;
    const bw = Math.max(20, W - bx - valW - f * 0.4);
    // the title with the unit: v (× 10⁸ m/s); the medium chips sit to its right (style.css)
    const ft = Math.min(13.5, Math.max(12.5, f));
    let out = `<text class="g-name" x="0" y="${head * 0.62}" font-size="${ft}">${esc(t('graph_speed'))} (× ${N(10)}<tspan dy="${-ft * 0.35}" font-size="${ft * 0.72}">${N(8)}</tspan><tspan dy="${ft * 0.35}"> m/s)</tspan></text>`;
    rows.forEach((r, i) => {
      const y = head + rowH * i + rowH / 2;
      const on = r.id === chosen;
      const len = (bw * r.v) / 3;
      out += `<text class="g-row${on ? ' on' : ''}" x="0" y="${y + f * 0.36}" font-size="${f}">${esc(t(`m_${r.id}`))} <tspan class="g-n">${esc(`(${fx(r.n, r.id === 'air' ? 5 : 2)})`)}</tspan></text>`;
      const bh = Math.min(rowH * 0.56, 12);
      out += `<rect class="g-bar${on ? ' on' : ''}" x="${bx}" y="${y - bh / 2}" width="${len}" height="${bh}" rx="${bh / 2.5}"${on ? ` fill="${colors.ray}"` : ''}/>`;
      out += `<text class="g-val${on ? ' on' : ''}" x="${W}" y="${y + f * 0.36}" text-anchor="end" font-size="${f}">${esc(fx(r.v))}</text>`;
    });
    return out;
  }

  /** θ₂ against θ₁, both 0 … 90°. */
  function theta({ curve, now, n }, W, H) {
    const f = Math.min(14, Math.max(12, H / 10));
    const g = frame(W, H, f);
    g.x1 = W - f * 0.6;
    const X = (a) => g.x0 + (a / 90) * (g.x1 - g.x0);
    const Y = (a) => g.y0 - (a / 90) * (g.y0 - g.y1);
    let out = '';
    for (let a = 0; a <= 90; a += 30) {
      out += `<line class="g-grid" x1="${X(0)}" x2="${X(90)}" y1="${Y(a)}" y2="${Y(a)}"/><line class="g-grid" x1="${X(a)}" x2="${X(a)}" y1="${Y(0)}" y2="${Y(90)}"/>`;
      out += `<text class="g-num" x="${X(0) - f * 0.3}" y="${Y(a) + f * 0.35}" text-anchor="end" font-size="${f}">${N(a)}°</text>`;
      out += `<text class="g-num" x="${X(a)}" y="${g.y0 + f * 1.15}" text-anchor="${a === 90 ? 'end' : 'middle'}" font-size="${f}">${N(a)}°</text>`;
    }
    out += `<path class="g-axis" d="M${X(0)} ${Y(90)}V${Y(0)}H${X(90)}"/>`;
    out += `<line class="g-same" x1="${X(0)}" y1="${Y(0)}" x2="${X(90)}" y2="${Y(90)}"/>`;
    const same = t('graph_same');
    out += `<text class="g-tag" x="${X(46)}" y="${Y(46) - f * 0.5}" text-anchor="end" font-size="${f}">${esc(same)}</text>`;
    let d = '';
    for (const [i, [a, b]] of curve.entries()) d += `${i ? 'L' : 'M'}${X(a).toFixed(1)} ${Y(b).toFixed(1)}`;
    out += `<path class="g-line" d="${d}" stroke="${colors.t2}"/>`;
    const tagAt = curve[Math.min(curve.length - 1, 36)]; // about 72°: under the curve, clear of the axis's name
    out += `<text class="g-tag" x="${X(tagAt[0])}" y="${Y(tagAt[1]) - f * 0.55}" text-anchor="middle" font-size="${f}" fill="${colors.t2}">${esc(t('graph_n', { n: N(Number(n.toFixed(2))) }))}</text>`;
    if (now) out += `<circle class="g-dot" cx="${X(now[0])}" cy="${Y(now[1])}" r="${f * 0.38}" fill="${colors.t2}"/>`;
    out += `<text class="g-name" x="${X(0) + f * 0.3}" y="${TOP_ROW * 0.62}" font-size="${f}"><tspan fill="${colors.t2}">θ</tspan><tspan fill="${colors.t2}" font-size="${f * 0.72}" dy="${f * 0.25}">2</tspan></text>`;
    out += `<text class="g-name" x="${X(90)}" y="${g.y0 - f * 0.45}" text-anchor="end" font-size="${f}"><tspan fill="${colors.t1}">θ</tspan><tspan fill="${colors.t1}" font-size="${f * 0.72}" dy="${f * 0.25}">1</tspan></text>`;
    return out;
  }

  /** sin θ₁ (up) against sin θ₂ (across), both 0 … 1: the dots measured, their line, the faint lines of before. */
  function sine({ dots, live, slope, past }, W, H) {
    const f = Math.min(14, Math.max(12, H / 10));
    const g = frame(W, H, f);
    g.x0 = f * 2.2;
    g.x1 = W - f * 3.4; // room on the right for the tags
    const X = (s) => g.x0 + s * (g.x1 - g.x0);
    const Y = (s) => g.y0 - s * (g.y0 - g.y1);
    let out = '';
    for (const s of [0, 0.5, 1]) {
      out += `<line class="g-grid" x1="${X(0)}" x2="${X(1)}" y1="${Y(s)}" y2="${Y(s)}"/><line class="g-grid" x1="${X(s)}" x2="${X(s)}" y1="${Y(0)}" y2="${Y(1)}"/>`;
      out += `<text class="g-num" x="${X(0) - f * 0.3}" y="${Y(s) + f * 0.35}" text-anchor="end" font-size="${f}">${N(s)}</text>`;
      out += `<text class="g-num" x="${X(s)}" y="${g.y0 + f * 1.15}" text-anchor="middle" font-size="${f}">${N(s)}</text>`;
    }
    out += `<path class="g-axis" d="M${X(0)} ${Y(1)}V${Y(0)}H${X(1)}"/>`;
    const lineTo = (k) => (k >= 1 ? [1 / k, 1] : [1, k]);
    const tags = [];
    for (const p of past) {
      const [a, b] = lineTo(p.slope);
      out += `<line class="g-past" x1="${X(0)}" y1="${Y(0)}" x2="${X(a)}" y2="${Y(b)}"/>`;
      tags.push({ y: Y(b), x: X(a), text: `${t(`m_${p.id}`)} ${fx(p.slope)}`, cls: 'g-tag' });
    }
    if (slope) {
      const [a, b] = lineTo(slope);
      out += `<line class="g-line" x1="${X(0)}" y1="${Y(0)}" x2="${X(a)}" y2="${Y(b)}" stroke="${colors.law}"/>`;
      tags.push({ y: Y(b), x: X(a), text: t('graph_slope', { k: fx(slope) }), cls: 'g-slope', fill: colors.law });
    }
    for (const d of dots) out += `<circle class="g-dot" cx="${X(d.s2)}" cy="${Y(d.s1)}" r="${f * 0.36}" fill="${colors.law}"/>`;
    if (live) out += `<circle class="g-live" cx="${X(live.s2)}" cy="${Y(live.s1)}" r="${f * 0.42}" stroke="${colors.law}"/>`;
    const ys = spreadLabels(
      tags.map((g2) => g2.y),
      f * 1.1,
      g.y1,
      g.y0,
    );
    tags.forEach((g2, i) => {
      out += `<text class="${g2.cls}" x="${Math.min(W - 2, g2.x + f * 0.3)}" y="${ys[i] + f * 0.35}" font-size="${f}"${g2.fill ? ` fill="${g2.fill}"` : ''}${g2.x + f * 0.3 > W - f * 3.6 ? ' text-anchor="end"' : ''}>${esc(g2.text)}</text>`;
    });
    out += `<text class="g-name" x="${X(0) + f * 0.3}" y="${TOP_ROW * 0.62}" font-size="${f}">sin <tspan fill="${colors.t1}">θ</tspan><tspan fill="${colors.t1}" font-size="${f * 0.72}" dy="${f * 0.25}">1</tspan></text>`;
    out += `<text class="g-name" x="${X(1)}" y="${g.y0 - f * 0.45}" text-anchor="end" font-size="${f}">sin <tspan fill="${colors.t2}">θ</tspan><tspan fill="${colors.t2}" font-size="${f * 0.72}" dy="${f * 0.25}">2</tspan></text>`;
    return out;
  }

  /** args: { kind: 'speed' | 'theta' | 'sine' | 'none', aria, … } as each kind above takes. */
  function draw(args) {
    last = args;
    const W = Math.max(120, el.clientWidth);
    const H = Math.max(60, el.clientHeight);
    const key = JSON.stringify([W, H, args]);
    if (key === lastKey) return;
    lastKey = key;
    let out = '';
    if (args.kind === 'speed') out = speed(args, W, H);
    else if (args.kind === 'theta') out = theta(args, W, H);
    else if (args.kind === 'sine') out = sine(args, W, H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', args.aria || '');
    svg.innerHTML = out;
  }

  /** The curve θ₂(θ₁) for a pair of media, every 2°. */
  function curveFor(n1, n2) {
    const pts = [];
    for (let a = 0; a <= 90; a += 2) {
      const s = (n1 * Math.sin(rad(a))) / n2;
      if (s > 1) break;
      pts.push([a, Number(((Math.asin(s) * 180) / Math.PI).toFixed(2))]);
    }
    return pts;
  }

  return { draw, curveFor, reset: () => (lastKey = '') };
}
