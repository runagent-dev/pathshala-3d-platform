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
    const rowH = Math.min(26, (H - head - 2) / n); // a tall box keeps the rows together
    const f = Math.min(14, Math.max(12, rowH * 0.62));
    const nameW = Math.min(W * 0.46, f * 8.6);
    const valW = f * 2.6;
    const bx = nameW + f * 0.4;
    const bw = Math.max(20, W - bx - valW - f * 0.4);
    // the title with the unit: v (× 10⁸ m/s); the medium chips sit to its right (style.css)
    const ft = Math.min(13.5, Math.max(12.5, f));
    let out = `<text class="g-name" x="0" y="${head * 0.62}" font-size="${ft}">${esc(t('graph_speed'))} (× ${N(10)}<tspan dy="${-ft * 0.35}" font-size="${ft * 0.85}">${N(8)}</tspan><tspan dy="${ft * 0.35}"> m/s)</tspan></text>`;
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
    out += `<text class="g-name" x="${X(0) + f * 0.3}" y="${Y(90) + f * 0.95}" font-size="${f}"><tspan fill="${colors.t2}">θ</tspan><tspan fill="${colors.t2}" font-size="${f * 0.8}" dy="${f * 0.25}">2</tspan></text>`;
    out += `<text class="g-name" x="${X(90)}" y="${g.y0 - f * 0.45}" text-anchor="end" font-size="${f}"><tspan fill="${colors.t1}">θ</tspan><tspan fill="${colors.t1}" font-size="${f * 0.72}" dy="${f * 0.25}">1</tspan></text>`;
    return out;
  }

  /**
   * sin θ₁ (up) against sin θ₂ (across), both 0 … 1, on equal scales (a square plot as tall as the box allows, so a
   * slope of 1.52 looks steeper than 45°): the dots measured, their line, the faint lines of other media. To its right,
   * under the medium chips, the table the student fills: θ₁, θ₂ and sin θ₁ ÷ sin θ₂ of the last three measurements,
   * then the line's slope and the medium measured before.
   */
  function sine({ dots, live, slope, past, chips = true }, W, H) {
    const f = Math.min(13.5, Math.max(12, H / 9));
    const yNum = f * 1.25; // the numbers under the plot
    const side = Math.max(40, Math.min(H - yNum - f * 0.9, W - f * 13.5)); // the table keeps about 13 em
    const x0 = f * 1.9;
    const y1 = f * 0.9;
    const y0 = y1 + side;
    const X = (v) => x0 + v * side;
    const Y = (v) => y0 - v * side;
    let out = '';
    for (const v of [0, 0.5, 1]) {
      out += `<line class="g-grid" x1="${X(0)}" x2="${X(1)}" y1="${Y(v)}" y2="${Y(v)}"/><line class="g-grid" x1="${X(v)}" x2="${X(v)}" y1="${Y(0)}" y2="${Y(1)}"/>`;
      out += `<text class="g-num" x="${X(0) - f * 0.3}" y="${Y(v) + f * 0.35}" text-anchor="end" font-size="${f}">${N(v)}</text>`;
      out += `<text class="g-num" x="${X(v)}" y="${y0 + f * 1.1}" text-anchor="${v === 1 ? 'end' : 'middle'}" font-size="${f}">${N(v)}</text>`;
    }
    out += `<path class="g-axis" d="M${X(0)} ${Y(1)}V${Y(0)}H${X(1)}"/>`;
    const lineTo = (k) => (k >= 1 ? [1 / k, 1] : [1, k]);
    for (const p of past) {
      const [a, b] = lineTo(p.slope);
      out += `<line class="g-past" x1="${X(0)}" y1="${Y(0)}" x2="${X(a)}" y2="${Y(b)}"/>`;
    }
    if (slope) {
      const [a, b] = lineTo(slope);
      out += `<line class="g-line" x1="${X(0)}" y1="${Y(0)}" x2="${X(a)}" y2="${Y(b)}" stroke="${colors.law}"/>`;
    }
    for (const d of dots) out += `<circle class="g-dot" cx="${X(d.s2)}" cy="${Y(d.s1)}" r="${f * 0.34}" fill="${colors.law}"/>`;
    if (live) out += `<circle class="g-live" cx="${X(live.s2)}" cy="${Y(live.s1)}" r="${f * 0.4}" stroke="${colors.law}"/>`;
    const sub = (k, c) =>
      `<tspan fill="${c}">θ</tspan><tspan fill="${c}" font-size="${f * 0.8}" dy="${f * 0.22}">${k}</tspan><tspan dy="${-f * 0.22}"> </tspan>`;
    out += `<text class="g-name" x="${X(0) + f * 0.35}" y="${Y(1) + f * 0.95}" font-size="${f}">sin ${sub(1, colors.t1)}</text>`;
    out += `<text class="g-name" x="${X(1) - f * 0.2}" y="${Y(0) - f * 0.45}" text-anchor="end" font-size="${f}">sin ${sub(2, colors.t2)}</text>`;
    // the table, right of the plot and under the chips
    const tx = X(1) + f * 1.1;
    const tw = W - tx;
    const cols = [tx + tw * 0.16, tx + tw * 0.46, W - 2];
    // a compact box (390 × 520): no table, one line of the three ratios under the chips (the result line has the rest)
    const top = chips ? 30 : 0;
    const rows = dots.slice(-3);
    if ((H - top) / 5.2 < f * 1.15) {
      const list = [0, 1, 2].map((i) => (rows[i] ? fx(rows[i].ratio) : '–')).join('  ');
      out += `<text class="g-th" x="${W - 2}" y="${top + f * 1.2}" text-anchor="end" font-size="${f}">${esc(t('graph_ratio'))}</text>`;
      out += `<text class="g-td g-ratio" x="${W - 2}" y="${top + f * 2.5}" text-anchor="end" font-size="${f}" fill="${colors.law}">${esc(list)}</text>`;
      return out;
    }
    const lh = Math.min(f * 1.32, (H - top) / 5.2);
    let y = (chips ? 30 : 0) + lh * 0.9;
    out += `<text class="g-th" x="${cols[0]}" y="${y}" text-anchor="middle" font-size="${f}">${sub(1, colors.t1)}</text>`;
    out += `<text class="g-th" x="${cols[1]}" y="${y}" text-anchor="middle" font-size="${f}">${sub(2, colors.t2)}</text>`;
    out += `<text class="g-th" x="${cols[2]}" y="${y}" text-anchor="end" font-size="${f}">${esc(t('graph_ratio'))}</text>`;
    out += `<line class="g-rule" x1="${tx}" x2="${W}" y1="${y + lh * 0.3}" y2="${y + lh * 0.3}"/>`;
    for (let i = 0; i < 3; i++) {
      y += lh;
      const d = rows[i];
      if (!d) {
        out += `<text class="g-empty" x="${cols[0]}" y="${y}" text-anchor="middle" font-size="${f}">–</text><text class="g-empty" x="${cols[1]}" y="${y}" text-anchor="middle" font-size="${f}">–</text><text class="g-empty" x="${cols[2]}" y="${y}" text-anchor="end" font-size="${f}">–</text>`;
        continue;
      }
      out += `<text class="g-td" x="${cols[0]}" y="${y}" text-anchor="middle" font-size="${f}">${N(Math.round(d.t1 * 10) / 10)}°</text>`;
      out += `<text class="g-td" x="${cols[1]}" y="${y}" text-anchor="middle" font-size="${f}">${N(d.t2)}°</text>`;
      out += `<text class="g-td g-ratio" x="${cols[2]}" y="${y}" text-anchor="end" font-size="${f}" fill="${colors.law}">${fx(d.ratio)}</text>`;
    }
    y += lh;
    if (slope)
      out += `<text class="g-slope" x="${W - 2}" y="${y}" text-anchor="end" font-size="${f}" fill="${colors.law}">${esc(t('graph_slope', { k: fx(slope) }))}</text>`;
    else if (past.length) {
      const p = past[past.length - 1];
      out += `<text class="g-tag" x="${W - 2}" y="${y}" text-anchor="end" font-size="${f}">${esc(t('graph_past', { m: t(`m_${p.id}`), k: fx(p.slope) }))}</text>`;
    }
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
