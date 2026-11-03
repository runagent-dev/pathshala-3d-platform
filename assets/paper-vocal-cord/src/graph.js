// A small live graph for the panel when there is room (800 × 500, 1280 × 800): the air's pressure against the
// distance from the source, 0–4 m in real metres, in step with the 3D. Peaks are compressions (সংকোচন), troughs
// rarefactions (প্রসারণ); an orange bracket spans one λ between two neighbouring peaks. With the same 0–4 m for every
// cut, the long flaps' waves are long and the short flaps' crowd together. A 2D canvas, drawn only while it shows.
import { LAMBDA_SCALE } from './reading.js';

const RANGE = 4; // m
const C = { curve: '#0c8599', dark: 'rgba(5,69,78,0.22)', light: 'rgba(166,227,234,0.55)', axis: '#5b6472', lambda: '#c2410c' };

export function createGraph(host, t) {
  const wrap = document.createElement('div');
  wrap.className = 'pv-graph';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', t('g_aria'));
  wrap.append(canvas);
  host.after(wrap);
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  let w = 0;
  let h = 0;
  let font = 'sans-serif';
  let last = null;
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = r.width;
    h = r.height;
    if (w < 2 || h < 2) return false;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    font = getComputedStyle(wrap).fontFamily || font;
    return true;
  };
  new ResizeObserver(() => last && draw(...last)).observe(wrap);

  /**
   * t: the picture's time (s); wave: the drawn wave; on(τ): the source's strength at τ; lambda: the real λ (m);
   * fmt(x): a number in the student's digits.
   */
  function draw(time, wave, on, lambda, fmt) {
    last = [time, wave, on, lambda, fmt];
    if (!wrap.offsetParent || !fit()) return;
    const L = 26;
    const R = 10;
    const T = 40; // two rows above the plot: the words, then the λ bracket
    const B = 34; // the ticks, then the axis's name
    const pw = w - L - R;
    const ph = Math.max(20, h - T - B);
    const y0 = T + ph / 2;
    const amp = ph / 2 - 2;
    const X = (d) => L + (d / RANGE) * pw;
    g.clearRect(0, 0, w, h);
    // axes: pressure up, distance along; the normal pressure as a dashed line
    g.strokeStyle = C.axis;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(L, T - 4);
    g.lineTo(L, T + ph);
    g.stroke();
    g.setLineDash([3, 3]);
    g.beginPath();
    g.moveTo(L, y0);
    g.lineTo(L + pw, y0);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = C.axis;
    g.font = `12px ${font}`;
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (let d = 0; d <= RANGE; d++) {
      g.fillRect(X(d) - 0.5, T + ph, 1, 4);
      g.fillText(fmt(d), X(d), T + ph + 5);
    }
    g.fillText(t('g_x'), L + pw / 2, T + ph + 19);
    g.save();
    g.translate(11, y0);
    g.rotate(-Math.PI / 2);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(t('g_y'), 0, 0);
    g.restore();

    // the curve: how squeezed the air is at each distance now (the same wave as the 3D, without the fading)
    const N = 220;
    const ys = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) {
      const d = (i / N) * RANGE;
      const r = d * 1000 * LAMBDA_SCALE;
      const tau = time - r / wave.speed;
      const env = on(tau);
      ys[i] = env > 0 ? -Math.cos(wave.omega * tau) * env : 0;
    }
    for (const [sign, fill] of [
      [1, C.dark],
      [-1, C.light],
    ]) {
      g.fillStyle = fill;
      g.beginPath();
      g.moveTo(X(0), y0);
      for (let i = 0; i <= N; i++) g.lineTo(X((i / N) * RANGE), y0 - amp * Math.max(0, sign * ys[i]) * sign);
      g.lineTo(X(RANGE), y0);
      g.closePath();
      g.fill();
    }
    g.strokeStyle = C.curve;
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = X((i / N) * RANGE);
      if (i === 0) g.moveTo(x, y0 - amp * ys[i]);
      else g.lineTo(x, y0 - amp * ys[i]);
    }
    g.stroke();

    // one compression, the rarefaction after it, and λ to the next compression, where the wave is full
    const full = (d) => on(time - (d * 1000 * LAMBDA_SCALE) / wave.speed) > 0.9;
    const k = wave.omega * time;
    let d0 = lambda * ((((k / (2 * Math.PI) - 0.5) % 1) + 1) % 1);
    while (d0 < 0.12 * RANGE && d0 + lambda < RANGE) d0 += lambda;
    if (d0 + lambda <= RANGE - 0.05 && full(d0) && full(d0 + lambda)) {
      const a = X(d0);
      const b = X(d0 + lambda);
      const yb = T - 8;
      g.strokeStyle = C.lambda;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(a, yb);
      g.lineTo(b, yb);
      for (const [x, s] of [
        [a, 1],
        [b, -1],
      ]) {
        g.moveTo(x, yb - 4);
        g.lineTo(x, yb + 4);
        g.moveTo(x + s * 5, yb - 3.5);
        g.lineTo(x, yb);
        g.lineTo(x + s * 5, yb + 3.5);
      }
      g.stroke();
      g.setLineDash([2, 3]);
      g.lineWidth = 1;
      g.beginPath();
      for (const x of [a, b]) {
        g.moveTo(x, yb + 4);
        g.lineTo(x, y0 - amp);
      }
      g.stroke();
      g.setLineDash([]);
      // λ's value: beside the bracket's right end (it is short for the short flaps)
      g.font = `600 12px ${font}`;
      g.textBaseline = 'middle';
      const label = `λ ≈ ${fmt(lambda)} m`;
      const lw = g.measureText(label).width;
      const inside = b - a > lw + 24;
      g.textAlign = inside ? 'center' : 'left';
      const lx = inside ? (a + b) / 2 : Math.min(b + 6, L + pw - lw);
      if (inside) {
        g.fillStyle = '#ffffff';
        g.fillRect(lx - lw / 2 - 4, yb - 8, lw + 8, 16);
      }
      g.fillStyle = C.lambda;
      g.fillText(label, lx, yb);
      // the words over the first compression and over a rarefaction after it, far enough not to touch
      g.font = `600 11.5px ${font}`;
      g.textAlign = 'center';
      g.textBaseline = 'top';
      const wc = g.measureText(t('g_c')).width;
      const wr = g.measureText(t('g_r')).width;
      let dr = d0 + lambda / 2;
      while (X(dr) - a < (wc + wr) / 2 + 8 && dr + lambda < RANGE) dr += lambda;
      const xr = X(dr);
      const xc = Math.max(L + wc / 2, a);
      g.fillStyle = '#05454e';
      g.fillText(t('g_c'), xc, 1);
      if (xr + wr / 2 <= L + pw + R) {
        g.fillStyle = '#0b7285';
        g.fillText(t('g_r'), xr, 1);
        // a short tick from each word down to its place on the curve
        g.strokeStyle = 'rgba(29,39,51,0.45)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(xr, 16);
        g.lineTo(xr, y0 + amp);
        g.stroke();
      }
    }
  }
  return { draw, el: wrap };
}
