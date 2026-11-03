// The live চিত্র ৭.০৩ in the panel: for each floating ball (two columns, ক and খ) the displacement of the 1st wave,
// the 2nd wave and their sum against time (the last three periods, now at the right edge), stacked as in the book:
// wave + wave = sum. One canvas, drawn only when the time changes; the sum in the chapter's displacement green.
const INK = '#343a40';
const SUM = '#2b8a3e';
const GRID = '#dbe2ea';
const AXIS = '#adb5bd';

/**
 * host: the element to fill; t: i18n; sample(ball, wave, time) → displacement (m, real) of wave 0/1 at the ball,
 * or the sum when wave = 2; ref: the height drawn as the full half-row; window: seconds shown.
 */
export function createGraph(host, { t, labels, rowLabels, sample, ref, window: span, axes = null }) {
  const wrap = document.createElement('div');
  wrap.className = 'wi-graph';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  wrap.append(canvas);
  host.append(wrap);
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  let W = 0;
  let H = 0;
  let dpr = 1;
  let hideSum = false;
  let lastKey = '';

  function size() {
    const r = wrap.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    lastKey = '';
    draw(lastNow);
  }
  let lastNow = 0;
  const ro = new ResizeObserver(() => size());
  ro.observe(wrap);

  function draw(now) {
    lastNow = now;
    const key = `${now.toFixed(4)}|${W}|${H}|${hideSum}`;
    if (key === lastKey || W < 40 || H < 30) return;
    lastKey = key;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const font = getComputedStyle(wrap).fontFamily;
    ctx.font = `600 12px ${font}`;
    const labelW = Math.ceil(Math.max(...rowLabels.map((x) => ctx.measureText(x).width))) + 8;
    const gap = 10;
    const head = 18;
    const roomy = axes && H >= 130; // a tall panel: the axis words too
    const foot = roomy ? 18 : 0;
    const colW = (W - labelW - gap) / 2;
    const rowH = (H - head - foot) / 3;
    if (roomy) {
      ctx.font = `600 11.5px ${font}`;
      ctx.fillStyle = '#5b6472';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${axes.y} ↕`, 0, 8);
      ctx.fillStyle = '#c2255c'; // the chapter's colour for time
      ctx.textAlign = 'right';
      ctx.fillText(axes.t, W - 2, H - foot / 2);
    }
    ctx.textBaseline = 'middle';
    // the row names
    ctx.font = `600 12px ${font}`;
    rowLabels.forEach((name, r) => {
      ctx.fillStyle = r === 2 ? SUM : INK;
      ctx.textAlign = 'left';
      ctx.fillText(name, 0, head + rowH * (r + 0.5));
    });
    for (let b = 0; b < 2; b++) {
      const x0 = labelW + b * (colW + gap);
      ctx.font = `700 13px ${font}`;
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.fillText(labels[b], x0 + colW / 2, 8);
      for (let r = 0; r < 3; r++) {
        const yc = head + rowH * (r + 0.5);
        const amp = rowH * 0.42;
        // the frame and the zero line
        ctx.strokeStyle = GRID;
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 0.5, head + rowH * r + 2.5, colW - 1, rowH - 5);
        ctx.strokeStyle = AXIS;
        ctx.beginPath();
        ctx.moveTo(x0 + 1, yc + 0.5);
        ctx.lineTo(x0 + colW - 1, yc + 0.5);
        ctx.stroke();
        if (r === 2 && hideSum) {
          ctx.font = `700 14px ${font}`;
          ctx.fillStyle = '#868e96';
          ctx.fillText('?', x0 + colW / 2, yc);
          continue;
        }
        // the trace
        ctx.strokeStyle = r === 2 ? SUM : INK;
        ctx.lineWidth = r === 2 ? 2.4 : 1.6;
        ctx.beginPath();
        const steps = Math.max(24, Math.round(colW / 2));
        let yLast = yc;
        for (let k = 0; k <= steps; k++) {
          const tt = now - span + (span * k) / steps;
          const v = sample(b, r, tt) / ref;
          const y = yc - Math.max(-1.15, Math.min(1.15, v)) * amp;
          const x = x0 + 3 + ((colW - 6) * k) / steps;
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          yLast = y;
        }
        ctx.stroke();
        // now: a dot at the right end (the ball itself)
        ctx.fillStyle = r === 2 ? SUM : INK;
        ctx.beginPath();
        ctx.arc(x0 + colW - 3, yLast, r === 2 ? 3.2 : 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    canvas.setAttribute('aria-label', t('graph_aria'));
  }

  return {
    el: wrap,
    draw,
    /** In the test the sum row waits for the answer. */
    setHideSum(v) {
      hideSum = Boolean(v);
      lastKey = '';
      draw(lastNow);
    },
    setLabels(list) {
      labels = list;
      lastKey = '';
      draw(lastNow);
    },
    redraw() {
      lastKey = '';
      draw(lastNow);
    },
    dispose() {
      ro.disconnect();
    },
  };
}
