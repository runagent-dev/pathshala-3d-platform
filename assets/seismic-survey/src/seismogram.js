// The seismogram in the panel: one trace per geophone of the front row (nearest the blast on top), time to the
// right, recorded live as the echoes arrive. Each echo is a blip filled in its boundary's colour; the arrivals of one
// boundary bend into a curve (later at the far geophones). The chosen echo is marked on the first trace with its time.
// A tap on a blip chooses that echo. A 2D canvas, redrawn only when what it shows changes.
import { FONT } from '@shared/student/materials.js';
import { arrivals, LINE, RECORD, readTime, trace } from './reading.js';

export function createSeismogram({ host, t, colors, onPick }) {
  const N = t.num;
  const cv = document.createElement('canvas');
  cv.className = 'ss-seis-canvas';
  cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', t('seis_aria'));
  host.appendChild(cv);
  const g = cv.getContext('2d');
  let W = 0;
  let H = 0;
  let last = '';
  const state = { time: 0, sel: -1, on: true };
  const PAD = { l: 20, r: 8, t: 6, b: 18 };

  const xOf = (s) => PAD.l + (s / RECORD) * (W - PAD.l - PAD.r);
  const rowH = () => (H - PAD.t - PAD.b) / LINE.length;
  const yOf = (row) => PAD.t + rowH() * (row + 0.5);

  function size() {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (w !== W || h !== H || cv.width !== Math.round(w * dpr)) {
      W = w;
      H = h;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      last = '';
    }
  }

  function draw() {
    size();
    const key = `${W}x${H}|${state.time.toFixed(3)}|${state.sel}|${state.on}`;
    if (key === last || W < 40) return;
    last = key;
    g.clearRect(0, 0, W, H);
    const rh = rowH();
    const amp = rh * 0.62;
    // the frame: a pale paper, the time axis
    g.fillStyle = '#fbfaf6';
    g.fillRect(PAD.l, PAD.t, W - PAD.l - PAD.r, H - PAD.t - PAD.b);
    g.strokeStyle = '#d5d1c6';
    g.lineWidth = 1;
    g.font = `500 10.5px ${FONT}`;
    g.fillStyle = '#5c6470';
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (let s = 0; s <= RECORD + 1e-9; s += 0.2) {
      const x = Math.round(xOf(s)) + 0.5;
      g.beginPath();
      g.moveTo(x, PAD.t);
      g.lineTo(x, H - PAD.b + 3);
      g.stroke();
      if (s > 0.01) g.fillText(N(+s.toFixed(1)), x, H - PAD.b + 4);
    }
    g.textAlign = 'left';
    g.fillText(N(0), PAD.l - 2, H - PAD.b + 4);
    g.textAlign = 'right';
    g.fillStyle = '#c2255c';
    g.font = `600 10.5px ${FONT}`;
    // the axis name sits at the end of the axis, over the last tick's place
    const label = t('seis_time');
    const lw = g.measureText(label).width;
    g.fillStyle = '#fbfaf6';
    g.fillRect(W - PAD.r - lw - 4, H - PAD.b + 2, lw + 4, 14);
    g.fillStyle = '#c2255c';
    g.fillText(label, W - PAD.r, H - PAD.b + 4);
    // the geophones' numbers
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#5c6470';
    g.font = `600 10.5px ${FONT}`;
    // (every number when there is room, else the first and the last)
    for (let i = 0; i < LINE.length; i++) if (rowH() >= 12 || i === 0 || i === LINE.length - 1) g.fillText(N(i + 1), PAD.l / 2, yOf(i));
    if (!state.on) return;
    // the chosen echo's curve across the traces (dashed), under the traces
    if (state.sel >= 0 && state.time > 0) {
      g.strokeStyle = colors[state.sel];
      g.setLineDash([3, 3]);
      g.lineWidth = 1.4;
      g.beginPath();
      LINE.forEach((p, i) => {
        const ta = arrivals(p)[state.sel];
        if (ta <= state.time) (i ? g.lineTo : g.moveTo).call(g, xOf(ta), yOf(i));
      });
      g.stroke();
      g.setLineDash([]);
    }
    // the traces, up to the time recorded so far
    const t1 = Math.min(state.time, RECORD);
    const x1 = xOf(t1);
    for (let i = 0; i < LINE.length; i++) {
      const y0 = yOf(i);
      const p = LINE[i];
      // filled lobes (positive), coloured by which echo they belong to
      const step = 0.75;
      let px = PAD.l;
      while (px < x1) {
        const s = ((px - PAD.l) / (W - PAD.l - PAD.r)) * RECORD;
        const tr = trace(p, s);
        if (tr.y > 0.02 && tr.k >= 0) {
          g.fillStyle = colors[tr.k];
          g.globalAlpha = state.sel < 0 || state.sel === tr.k ? 1 : 0.45;
          g.fillRect(px, y0 - tr.y * amp, step + 0.2, tr.y * amp);
        }
        px += step;
      }
      g.globalAlpha = 1;
      // the wiggle
      g.strokeStyle = '#1f252c';
      g.lineWidth = 1;
      g.beginPath();
      for (let x = PAD.l; x <= x1; x += 1) {
        const s = ((x - PAD.l) / (W - PAD.l - PAD.r)) * RECORD;
        const y = y0 - trace(p, s).y * amp;
        if (x === PAD.l) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
    // the recording pen, while it records
    if (state.time > 0 && state.time < RECORD) {
      g.strokeStyle = '#c2255c';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x1, PAD.t);
      g.lineTo(x1, H - PAD.b);
      g.stroke();
    }
    // the chosen echo on the first trace: a mark and its time
    if (state.sel >= 0) {
      const ta = arrivals(LINE[0])[state.sel];
      if (ta <= state.time) {
        const x = xOf(ta);
        g.strokeStyle = '#c2255c';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x, PAD.t);
        g.lineTo(x, yOf(0) + rh * 0.5);
        g.stroke();
        const txt = `t = ${N(readTime(state.sel).toFixed(2))} s`;
        g.font = `700 11px ${FONT}`;
        const w = g.measureText(txt).width + 8;
        const lx = Math.min(W - PAD.r - w, x + 4);
        g.fillStyle = '#ffffff';
        g.strokeStyle = '#c2255c';
        g.lineWidth = 1;
        g.beginPath();
        g.roundRect(lx, PAD.t + 1, w, 15, 3);
        g.fill();
        g.stroke();
        g.fillStyle = '#c2255c';
        g.textAlign = 'left';
        g.textBaseline = 'middle';
        g.fillText(txt, lx + 4, PAD.t + 9);
      }
    }
  }

  // a tap on a blip chooses its echo (the nearest arrival on that trace, within 0.07 s)
  cv.addEventListener('pointerdown', (e) => {
    if (!state.on) return;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const row = Math.max(0, Math.min(LINE.length - 1, Math.floor((y - PAD.t) / rowH())));
    const s = ((x - PAD.l) / (W - PAD.l - PAD.r)) * RECORD;
    const ts = arrivals(LINE[row]);
    let best = -1;
    let bd = 0.07;
    ts.forEach((ta, k) => {
      if (ta <= state.time && Math.abs(ta - s) < bd) {
        bd = Math.abs(ta - s);
        best = k;
      }
    });
    if (best >= 0) onPick?.(best);
    else onPick?.(-1);
  });

  return {
    el: cv,
    set(p) {
      Object.assign(state, p);
      draw();
    },
    draw,
    /** Where echo k's blip on trace row is, in client pixels (tests). */
    blipAt(k, row = 0) {
      const r = cv.getBoundingClientRect();
      return { x: r.left + xOf(arrivals(LINE[row])[k]), y: r.top + yOf(row) };
    },
  };
}
