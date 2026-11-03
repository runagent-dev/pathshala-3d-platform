// The two graphs in the panel, as the book's চিত্র ৭.০৮ draws them side by side: the rope's বিচ্যুতি–দূরত্ব
// (displacement–distance, the shape now, 0–3 m) with λ (orange) and a (green) marked and the marked particle (green
// dot); and that particle's বিচ্যুতি–সময় (displacement–time, 0–0.8 s) with T (crimson) marked and a dot at the
// moment shown (during "one period" the part already run is drawn thick in crimson). Live, in sync with the 3D,
// drawn on one canvas (crisp at the device's pixel ratio). Pure drawing: the app passes the state.
import { FONT } from '@shared/student/materials.js';
import { A, LENGTH, WINDOW, XP, ampMark, displacement, markers } from './reading.js';

export const COLORS = {
  a: '#2b8a3e',
  lambda: '#e8590c',
  T: '#c2255c',
  f: '#862e9c',
  v: '#1c6fd9',
  curve: '#1d2733',
  grid: '#d9e2ec',
  axis: '#5b6472',
};

/**
 * createGraphs(host, t): a canvas in `host`; draw(state) with { q, tau, runFrom (s or null) } redraws it.
 */
export function createGraphs(host, t) {
  const N = t.num;
  const canvas = document.createElement('canvas');
  canvas.className = 'wq-graph-canvas';
  canvas.setAttribute('role', 'img');
  host.append(canvas);
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  let W = 0;
  let H = 0;
  let last = null;
  const ro = new ResizeObserver(() => {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (last) draw(last);
  });
  ro.observe(host);

  const font = (px, w = 600) => `${w} ${px}px ${FONT}`;

  /** A bracket |←→| between x0 and x1 at y, with a label above or below. */
  function hBracket(x0, x1, y, color, label, below = false) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.moveTo(x0, y - 4);
    ctx.lineTo(x0, y + 4);
    ctx.moveTo(x1, y - 4);
    ctx.lineTo(x1, y + 4);
    ctx.stroke();
    for (const [x, d] of [
      [x0, 1],
      [x1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + d * 5, y - 3);
      ctx.lineTo(x + d * 5, y + 3);
      ctx.fill();
    }
    ctx.font = font(11, 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = below ? 'top' : 'bottom';
    const lx = Math.min(Math.max((x0 + x1) / 2, 18), W - 18);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.strokeText(label, lx, below ? y + 2 : y - 2);
    ctx.fillText(label, lx, below ? y + 2 : y - 2);
  }

  /** One plot: frame, grid, axis numbers; returns its mapping. */
  function frame(x, y, w, h, { xMax, xStep, xLabel, title }) {
    const sx = (v) => x + (v / xMax) * w;
    const sy = (v) => y + h / 2 - (v / (A * 1.35)) * (h / 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let v = xStep; v < xMax - 1e-9; v += xStep) {
      ctx.moveTo(Math.round(sx(v)) + 0.5, y);
      ctx.lineTo(Math.round(sx(v)) + 0.5, y + h);
    }
    for (const v of [A, -A]) {
      ctx.moveTo(x, Math.round(sy(v)) + 0.5);
      ctx.lineTo(x + w, Math.round(sy(v)) + 0.5);
    }
    ctx.stroke();
    ctx.strokeStyle = COLORS.axis;
    ctx.beginPath();
    ctx.moveTo(x, Math.round(sy(0)) + 0.5);
    ctx.lineTo(x + w, Math.round(sy(0)) + 0.5);
    ctx.stroke();
    ctx.strokeStyle = '#9aa7b4';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // numbers
    ctx.fillStyle = COLORS.axis;
    ctx.font = font(10, 600);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(N(0.1), x - 3, sy(A));
    if (h >= 56) ctx.fillText(N(0), x - 3, sy(0));
    ctx.fillText(`−${N(0.1)}`, x - 3, sy(-A));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const every = w / (xMax / xStep) < 22 ? 2 : 1;
    let i = 0;
    for (let v = xStep; v <= xMax + 1e-9; v += xStep, i++) if ((i + 1) % every === 0) ctx.fillText(N(+v.toFixed(2)), sx(v), y + h + 2);
    ctx.textAlign = 'left';
    ctx.fillText(xLabel, x, y + h + 14);
    ctx.textBaseline = 'top';
    ctx.font = font(10.5, 700);
    ctx.fillStyle = '#33404d';
    ctx.fillText(title, x - 22, 1);
    return { sx, sy };
  }

  function draw(state) {
    last = state;
    if (!W || !H) return;
    const { q, tau, runFrom } = state;
    ctx.clearRect(0, 0, W, H);
    const gap = 36;
    const left = 26;
    const top = 36;
    const bottom = 28;
    const pw = (W - left - gap - 8) / 2;
    const ph = Math.max(20, H - top - bottom);
    // ── displacement–distance ──
    const g1 = frame(left, top, pw, ph, { xMax: LENGTH, xStep: 0.5, xLabel: t('g_x_axis'), title: t('g_y') });
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, pw, ph);
    ctx.clip();
    ctx.strokeStyle = COLORS.curve;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const x = (i / 160) * LENGTH;
      const px = g1.sx(x);
      const py = g1.sy(displacement(q, x, tau));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    // a: from the rest line to a crest or a trough (green), where the 3D marks it
    const mk = markers(q, tau);
    const am = ampMark(q, tau);
    if (am) {
      const ax = g1.sx(am.x);
      const yEnd = am.up ? A : -A;
      const dir = am.up ? 1 : -1;
      ctx.strokeStyle = COLORS.a;
      ctx.fillStyle = COLORS.a;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ax, g1.sy(0));
      ctx.lineTo(ax, g1.sy(yEnd) + dir * 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax, g1.sy(yEnd));
      ctx.lineTo(ax - 3.5, g1.sy(yEnd) + dir * 6);
      ctx.lineTo(ax + 3.5, g1.sy(yEnd) + dir * 6);
      ctx.fill();
    }
    // the marked particle
    ctx.fillStyle = COLORS.a;
    ctx.beginPath();
    ctx.arc(g1.sx(XP), g1.sy(displacement(q, XP, tau)), 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (am) {
      const ax = g1.sx(am.x);
      ctx.font = font(11, 700);
      ctx.fillStyle = COLORS.a;
      ctx.textAlign = ax > left + pw - 14 ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('a', ax + (ctx.textAlign === 'left' ? 4 : -4), g1.sy(am.up ? A / 2 : -A / 2));
    }
    if (mk) {
      hBracket(g1.sx(mk.start), g1.sx(mk.end), top - 7, COLORS.lambda, 'λ');
    }
    // ── displacement–time of the marked particle ──
    const ox = left + pw + gap;
    const g2 = frame(ox, top, pw, ph, { xMax: WINDOW, xStep: 0.1, xLabel: t('g_t_axis'), title: t('g_y') });
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, top, pw, ph);
    ctx.clip();
    ctx.strokeStyle = COLORS.curve;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const s = (i / 200) * WINDOW;
      const px = g2.sx(s);
      const py = g2.sy(displacement(q, XP, s));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    const now = ((tau % WINDOW) + WINDOW) % WINDOW;
    if (runFrom != null) {
      const s0 = ((runFrom % WINDOW) + WINDOW) % WINDOW;
      const s1 = Math.min(s0 + q.T, s0 + Math.max(0, tau - runFrom));
      ctx.strokeStyle = COLORS.T;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const s = s0 + ((s1 - s0) * i) / 80;
        const px = g2.sx(s);
        const py = g2.sy(displacement(q, XP, s));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    ctx.fillStyle = COLORS.a;
    ctx.beginPath();
    ctx.arc(g2.sx(now), g2.sy(displacement(q, XP, now)), 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // T: between two neighbouring crests of the particle's motion
    const p0 = ((((q.k * XP) / q.w) % q.T) + q.T) % q.T; // the first time it is at a crest
    hBracket(g2.sx(p0), g2.sx(p0 + q.T), top - 7, COLORS.T, 'T');
    canvas.setAttribute('aria-label', t('g_aria', { lambda: N(q.lambda), a: N(q.a), T: N(q.T) }));
  }
  return { canvas, draw, dispose: () => ro.disconnect() };
}
