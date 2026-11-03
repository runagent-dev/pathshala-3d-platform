// The live graph: one quantity against time since the release (displacement x, velocity v or acceleration, chosen by a
// row of words), drawn exactly from x = −a cos(ωt + φ) so it never drifts from the 3D. The time window is four periods
// long, so every pair of m and k shows the same four waves. A crimson dashed tick at every whole period after the
// release (one পূর্ণ স্পন্দন each) and "T" over the first; on the x graph a green dashed band at ±a with "a" beside
// it (a and T are different things). Beside it, two bars for the kinetic energy K (amber) and the potential energy U
// (violet), measured against the largest energy this spring can hold, with their constant sum K + U as a dashed line
// across both. A 2D canvas, sized to its box and the device's pixel ratio; it draws only when asked.
// The same drawing, without the bars and with lettered points, is the test's graph on the picture.
import { FONT } from '@shared/student/materials.js';
import { timeStep } from './reading.js';

export const COLORS = { x: '#2b8a3e', v: '#1c6fd9', acc: '#495057', T: '#c2255c', K: '#e8930c', U: '#6741d9', ink: '#1d2733', grid: '#d5dbe3' };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ time: string, num: (s: string) => string, K: string, U: string, total: string }} words
 * @param {{ bars?: boolean }} [options]
 */
export function createGraph(canvas, words, { bars = true } = {}) {
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  let W = 0;
  let H = 0;
  let dpr = 1;
  function fit() {
    const r = canvas.getBoundingClientRect();
    const d = Math.min(2, window.devicePixelRatio || 1);
    if (r.width < 2 || r.height < 2) return false;
    if (Math.round(r.width * d) !== canvas.width || Math.round(r.height * d) !== canvas.height) {
      canvas.width = Math.round(r.width * d);
      canvas.height = Math.round(r.height * d);
    }
    W = r.width;
    H = r.height;
    dpr = d;
    return true;
  }
  const label = (n) => words.num(String(Math.round(n * 10) / 10));

  /**
   * s: { show: 'x'|'v'|'acc', run, tau, a, w, phase0, x, aScale, K, U, E, Emax, window?, periods?: boolean,
   *      points?: { t: number, label: string }[] }
   * tau: seconds since the release (real time); aScale: the displacement the plot's half height stands for (m).
   */
  function draw(s) {
    if (!fit()) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const barW = bars ? 62 : 0;
    const left = 4;
    const right = W - barW - 6;
    const top = 16;
    const bottom = H - 15;
    const mid = (top + bottom) / 2;
    const half = (bottom - top) / 2 - 3;
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.grid;
    ctx.strokeRect(left + 0.5, top + 0.5 - 10, right - left - 1, bottom - top + 9);
    ctx.strokeStyle = '#9aa5b3';
    ctx.beginPath();
    ctx.moveTo(left, Math.round(mid) + 0.5);
    ctx.lineTo(right, Math.round(mid) + 0.5);
    ctx.stroke();
    // the time window: four periods (or as asked), the last part of the run
    const T = (2 * Math.PI) / s.w;
    const span = s.window || 4 * T;
    const t1 = Math.max(span, s.tau);
    const t0 = t1 - span;
    const X = (t) => left + ((t - t0) / span) * (right - left);
    const step = timeStep(span, Math.max(2, Math.floor((right - left) / 34)));
    ctx.font = `600 10.5px ${FONT}`;
    ctx.fillStyle = '#5b6472';
    ctx.textBaseline = 'alphabetic';
    for (let n = Math.ceil(t0 / step - 1e-9); n * step <= t1 + 1e-9; n++) {
      const x = X(n * step);
      ctx.fillRect(Math.round(x), bottom - 3, 1, 3);
      ctx.textAlign = x < left + 8 ? 'left' : x > right - 8 ? 'right' : 'center';
      ctx.fillText(label(n * step), x, H - 3);
    }
    ctx.textAlign = 'right';
    ctx.fillText(words.time, right - 3, top + 1);
    const { show } = s;
    const scale = show === 'x' ? s.aScale : show === 'v' ? s.aScale * s.w : s.aScale * s.w * s.w;
    const val = (t) => {
      const th = s.w * t + s.phase0;
      if (show === 'x') return -s.a * Math.cos(th);
      if (show === 'v') return s.a * s.w * Math.sin(th);
      return s.a * s.w * s.w * Math.cos(th);
    };
    const Y = (v) => mid - (v / scale) * half;
    if (s.run && s.a > 0) {
      // the amplitude: a green dashed band at ±a on the displacement graph, "a" at its left
      if (show === 'x') {
        ctx.strokeStyle = COLORS.x;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        for (const y of [Y(s.a), Y(-s.a)]) {
          ctx.beginPath();
          ctx.moveTo(left + 1, Math.round(y) + 0.5);
          ctx.lineTo(right - 1, Math.round(y) + 0.5);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(left + 2, (Y(s.a) + mid) / 2 - 7, 11, 13);
        ctx.font = `italic 700 12px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#237a35';
        ctx.fillText('a', left + 4, (Y(s.a) + mid) / 2 + 4);
      }
      // a crimson tick at each whole period from the release
      if (s.periods !== false) {
        ctx.strokeStyle = COLORS.T;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        for (let n = Math.ceil(t0 / T - 1e-9); n * T <= s.tau + 1e-9; n++) {
          const x = Math.round(X(n * T)) + 0.5;
          ctx.beginPath();
          ctx.moveTo(x, top - 9);
          ctx.lineTo(x, bottom - 1);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        const n0 = Math.ceil(t0 / T - 1e-9);
        if ((n0 + 1) * T <= s.tau && X((n0 + 1) * T) - X(n0 * T) > 16) {
          const xa = X(n0 * T);
          const xb = X((n0 + 1) * T);
          ctx.strokeStyle = COLORS.T;
          ctx.beginPath();
          ctx.moveTo(xa + 2, top - 5);
          ctx.lineTo(xb - 2, top - 5);
          ctx.stroke();
          ctx.font = `700 11px ${FONT}`;
          ctx.textAlign = 'center';
          const tx = (xa + xb) / 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(tx - 6, top - 10, 12, 10);
          ctx.fillStyle = COLORS.T;
          ctx.fillText('T', tx, top - 1);
        }
      }
      // the curve up to now
      ctx.strokeStyle = COLORS[show];
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const from = Math.max(0, t0);
      const n = Math.max(2, Math.ceil(right - left));
      for (let i = 0; i <= n; i++) {
        const t = from + ((s.tau - from) * i) / n;
        const px = X(t);
        const py = Y(val(t));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      if (!s.points) dot(X(s.tau), Y(val(s.tau)), COLORS[show]);
      for (const p of s.points || []) {
        const px = X(p.t);
        const py = Y(val(p.t));
        dot(px, py, COLORS.ink);
        ctx.font = `700 12px ${FONT}`;
        ctx.textAlign = 'center';
        const ly = py < mid ? py + 16 : py - 8;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 6, ly - 11, 12, 13);
        ctx.fillStyle = COLORS.ink;
        ctx.fillText(p.label, px, ly);
      }
    } else if (show === 'x' && Math.abs(s.x) > 1e-4) {
      dot(X(t0), Y(s.x), COLORS.x);
    } else {
      dot(X(t0), mid, COLORS[show]);
    }
    if (!bars) return;
    // the energy bars, against the most this spring can hold (a pull of aScale); K + U dashed across both
    const bx = W - barW;
    const bTop = top - 6;
    const bBot = bottom;
    const bh = bBot - bTop;
    const Emax = s.Emax > 0 ? s.Emax : 1;
    const bar = (x, e, color, name) => {
      ctx.fillStyle = '#eef1f5';
      ctx.fillRect(x, bTop, 22, bh);
      const h = Math.max(0, Math.min(1, e / Emax)) * bh;
      ctx.fillStyle = color;
      ctx.fillRect(x, bBot - h, 22, h);
      ctx.strokeStyle = '#9aa5b3';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, bTop + 0.5, 21, bh - 1);
      ctx.font = `700 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = color === COLORS.K ? '#a85d00' : color;
      ctx.fillText(name, x + 11, H - 3);
    };
    bar(bx + 4, s.K, COLORS.K, words.K);
    bar(bx + 34, s.U, COLORS.U, words.U);
    if (s.E > 1e-12) {
      const y = Math.round(bBot - Math.min(1, s.E / Emax) * bh) + 0.5;
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(bx + 1, y);
      ctx.lineTo(W - 1, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `700 9.5px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(words.total, bx + 32, y - bTop > 12 ? y - 3 : y + 11);
    }
  }
  function dot(x, y, color) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  return { draw };
}
