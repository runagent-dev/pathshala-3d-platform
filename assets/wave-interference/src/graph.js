// The live চিত্র ৭.০৩ in the panel: for each floating ball (two columns, ক and খ) the displacement of the 1st wave,
// the 2nd wave and their sum against time (the last three periods, now at the right edge), stacked as in the book:
// wave + wave = sum, the sum in the chapter's displacement green. SVG, not a canvas: the frames and words are built
// once (and again on a resize), and a frame only moves six traces and six dots. A 2D canvas would have to wait for the
// 3D view's previous frame to finish on every redraw.
const INK = '#343a40';
const SUM = '#2b8a3e';
const GRID = '#dbe2ea';
const AXIS = '#adb5bd';

/**
 * host: the element to fill; t: i18n; sample(ball, wave, time) → displacement (m, real) of wave 0/1 at the ball,
 * or the sum when wave = 2; ref: the height drawn as the full half-row; window: seconds shown.
 */
export function createGraph(host, { t, labels, rowLabels, sample, ref, window: span, axes = null }) {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, parent = null) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if (parent) parent.append(e);
    return e;
  };
  const wrap = document.createElement('div');
  wrap.className = 'wi-graph';
  const svg = el('svg', { role: 'img' });
  wrap.append(svg);
  host.append(wrap);
  // text widths for the row names (measured once per layout on a scratch canvas, which is never shown)
  const measure = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
  let W = 0;
  let H = 0;
  let hideSum = false;
  let lastKey = '';
  /** @type {{ path: SVGPathElement, dot: SVGCircleElement, b: number, r: number, x0: number, colW: number, yc: number, amp: number, steps: number }[]} */
  let traces = [];

  function layout() {
    svg.replaceChildren();
    traces = [];
    if (W < 40 || H < 30) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const font = getComputedStyle(wrap).fontFamily;
    measure.font = `600 12px ${font}`;
    const labelW = Math.ceil(Math.max(...rowLabels.map((x) => measure.measureText(x).width))) + 8;
    const gap = 10;
    const head = 18;
    const roomy = axes && H >= 130; // a tall panel: the axis words too
    const foot = roomy ? 18 : 0;
    const colW = (W - labelW - gap) / 2;
    const rowH = (H - head - foot) / 3;
    const text = (str, x, y, { size = 12, weight = 600, fill = INK, anchor = 'start' } = {}) => {
      const e = el('text', { x, y, 'font-size': size, 'font-weight': weight, fill, 'text-anchor': anchor, 'dominant-baseline': 'central' }, svg);
      e.textContent = str;
    };
    if (roomy) {
      text(`${axes.y} ↕`, 0, 8, { size: 11.5, fill: '#5b6472' });
      text(axes.t, W - 2, H - foot / 2, { size: 11.5, fill: '#c2255c', anchor: 'end' }); // the chapter's colour for time
    }
    rowLabels.forEach((name, r) => text(name, 0, head + rowH * (r + 0.5), { fill: r === 2 ? SUM : INK }));
    for (let b = 0; b < 2; b++) {
      const x0 = labelW + b * (colW + gap);
      text(labels[b], x0 + colW / 2, 8, { size: 13, weight: 700, anchor: 'middle' });
      for (let r = 0; r < 3; r++) {
        const yc = head + rowH * (r + 0.5);
        el('rect', { x: x0 + 0.5, y: head + rowH * r + 2.5, width: colW - 1, height: rowH - 5, fill: 'none', stroke: GRID }, svg);
        el('line', { x1: x0 + 1, y1: yc + 0.5, x2: x0 + colW - 1, y2: yc + 0.5, stroke: AXIS }, svg);
        if (r === 2 && hideSum) {
          text('?', x0 + colW / 2, yc, { size: 14, weight: 700, fill: '#868e96', anchor: 'middle' });
          continue;
        }
        const ink = r === 2 ? SUM : INK;
        const path = /** @type {SVGPathElement} */ (
          el('path', { fill: 'none', stroke: ink, 'stroke-width': r === 2 ? 2.4 : 1.6, 'stroke-linejoin': 'round' }, svg)
        );
        const dot = /** @type {SVGCircleElement} */ (el('circle', { cx: x0 + colW - 3, cy: yc, r: r === 2 ? 3.2 : 2.4, fill: ink }, svg));
        traces.push({ path, dot, b, r, x0, colW, yc, amp: rowH * 0.42, steps: Math.max(24, Math.round(colW / 2)) });
      }
    }
    svg.setAttribute('aria-label', t('graph_aria'));
  }

  function size() {
    const r = wrap.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    relayout();
  }
  function relayout() {
    layout();
    lastKey = '';
    draw(lastNow);
  }
  let lastNow = 0;
  const ro = new ResizeObserver(() => size());
  ro.observe(wrap);

  function draw(now) {
    lastNow = now;
    const key = `${now.toFixed(4)}|${W}|${H}|${hideSum}`;
    if (key === lastKey || !traces.length) return;
    lastKey = key;
    for (const tr of traces) {
      let d = '';
      let y = tr.yc;
      for (let k = 0; k <= tr.steps; k++) {
        const tt = now - span + (span * k) / tr.steps;
        const v = sample(tr.b, tr.r, tt) / ref;
        y = tr.yc - Math.max(-1.15, Math.min(1.15, v)) * tr.amp;
        const x = tr.x0 + 3 + ((tr.colW - 6) * k) / tr.steps;
        d += `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      tr.path.setAttribute('d', d);
      tr.dot.setAttribute('cy', y.toFixed(1));
    }
  }

  return {
    el: wrap,
    draw,
    /** In the test the sum row waits for the answer. */
    setHideSum(v) {
      hideSum = Boolean(v);
      relayout();
    },
    setLabels(list) {
      labels = list;
      relayout();
    },
    redraw: relayout,
    dispose() {
      ro.disconnect();
    },
  };
}
