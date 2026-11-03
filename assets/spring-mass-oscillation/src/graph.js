// The panel's live graph: one quantity against time since the release (displacement x, velocity v or acceleration,
// chosen by a row of words), drawn exactly from x = −a cos(ωt + φ) so it never drifts from the 3D, with a crimson tick
// at every whole period T after the release (one full oscillation each) and, beside it, two bars for the kinetic
// energy K (amber) and the potential energy U (violet) that trade while their sum stays the same. A 2D canvas, sized
// to its box and the device's pixel ratio; it draws only when asked.
import { FONT } from '@shared/student/materials.js';

export const COLORS = { x: '#2b8a3e', v: '#1c6fd9', acc: '#495057', T: '#c2255c', K: '#e8930c', U: '#6741d9', ink: '#1d2733', grid: '#d5dbe3' };
const WINDOW = 3; // seconds of real time shown

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ time: string, num: (s: string) => string, K: string, U: string }} words
 */
export function createGraph(canvas, words) {
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

  /**
   * s: { show: 'x'|'v'|'acc', run: boolean, tau, a, w, phase0, x, aScale, K, U, E }
   * tau: seconds since the release (real time); aScale: the displacement the plot's height stands for (m).
   */
  function draw(s) {
    if (!fit()) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const barW = 58;
    const left = 4;
    const right = W - barW - 6;
    const top = 6;
    const bottom = H - 15;
    const mid = (top + bottom) / 2;
    const half = (bottom - top) / 2 - 9; // room above the curve for the T bracket
    // the axes: zero line, a frame
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.grid;
    ctx.strokeRect(left + 0.5, top + 0.5, right - left - 1, bottom - top - 1);
    ctx.strokeStyle = '#9aa5b3';
    ctx.beginPath();
    ctx.moveTo(left, Math.round(mid) + 0.5);
    ctx.lineTo(right, Math.round(mid) + 0.5);
    ctx.stroke();
    // the time window: the last WINDOW seconds of the run
    const t1 = Math.max(WINDOW, s.tau);
    const t0 = t1 - WINDOW;
    const X = (t) => left + ((t - t0) / WINDOW) * (right - left);
    ctx.font = `600 10.5px ${FONT}`;
    ctx.fillStyle = '#5b6472';
    ctx.textBaseline = 'alphabetic';
    for (let sec = Math.ceil(t0); sec <= t1 + 1e-6; sec++) {
      const x = X(sec);
      ctx.fillRect(Math.round(x), bottom - 3, 1, 3);
      ctx.textAlign = sec === Math.ceil(t0) && x < left + 8 ? 'left' : 'center';
      ctx.fillText(words.num(String(sec)), Math.min(right - 4, Math.max(left + 2, x)), H - 3);
    }
    ctx.textAlign = 'right';
    ctx.fillText(words.time, right - 2, top + 11);
    // the quantity
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
      // a crimson tick at each whole period from the release
      const T = (2 * Math.PI) / s.w;
      ctx.strokeStyle = COLORS.T;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      for (let n = Math.ceil(t0 / T); n * T <= s.tau + 1e-9; n++) {
        const x = Math.round(X(n * T)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, top + 1);
        ctx.lineTo(x, bottom - 1);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // "T" between the first two ticks shown
      const n0 = Math.ceil(t0 / T);
      if ((n0 + 1) * T <= s.tau && X((n0 + 1) * T) - X(n0 * T) > 16) {
        const xa = X(n0 * T);
        const xb = X((n0 + 1) * T);
        ctx.strokeStyle = COLORS.T;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xa + 2, top + 5);
        ctx.lineTo(xb - 2, top + 5);
        ctx.stroke();
        ctx.font = `700 11px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        const tx = (xa + xb) / 2;
        ctx.fillRect(tx - 6, top, 12, 10);
        ctx.fillStyle = COLORS.T;
        ctx.fillText('T', tx, top + 9);
      }
      // the curve up to now
      ctx.strokeStyle = COLORS[show];
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const from = Math.max(0, t0);
      const steps = Math.max(2, Math.ceil(right - left));
      for (let i = 0; i <= steps; i++) {
        const t = from + ((s.tau - from) * i) / steps;
        const px = X(t);
        const py = Y(val(t));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      // the dot at now
      dot(X(s.tau), Y(val(s.tau)), COLORS[show]);
    } else if (show === 'x' && Math.abs(s.x) > 1e-4) {
      dot(X(t0), Y(s.x), COLORS.x);
    } else {
      dot(X(t0), mid, COLORS[show]);
    }
    // the energy bars
    const bx = W - barW;
    const bTop = top + 2;
    const bBot = bottom;
    const bh = bBot - bTop;
    const E = s.E > 1e-12 ? s.E : 0;
    const bar = (x, frac, color, label) => {
      ctx.fillStyle = '#eef1f5';
      ctx.fillRect(x, bTop, 20, bh);
      const h = E ? Math.max(0, Math.min(1, frac)) * bh : 0;
      ctx.fillStyle = color;
      ctx.fillRect(x, bBot - h, 20, h);
      ctx.strokeStyle = '#9aa5b3';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, bTop + 0.5, 19, bh - 1);
      ctx.font = `700 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = color === COLORS.K ? '#a85d00' : color;
      ctx.fillText(label, x + 10, H - 3);
    };
    bar(bx + 4, E ? s.K / E : 0, COLORS.K, words.K);
    bar(bx + 32, E ? s.U / E : 0, COLORS.U, words.U);
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
