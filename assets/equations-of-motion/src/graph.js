// The বেগ–সময় graph of the run, drawn on the figure's 2D overlay canvas (so it is crisp at any size and part of
// `capture`): the velocity line from u to v, the area under it in 1-second strips (each strip is the distance of
// that second, the same colours as the bar on the railway), the average velocity V as a dashed line, the
// moment the line crosses it (half the time), and at the end of a run the triangle above V turning half round
// into the gap below it: the trapezium becomes the rectangle V × t, so s = Vt.
// Labels are placed one by one and skip a spot that would cover one already drawn.

/** A text label with a white halo; returns its box, or null if it would collide with `taken`. */
export function placeLabel(
  ctx,
  taken,
  text,
  x,
  y,
  { align = 'left', base = 'middle', color = '#1d2733', size = 13, weight = 600, pad = 2, bounds = null, force = false } = {},
) {
  ctx.font = `${weight} ${size}px "Noto Sans Bengali", "Segoe UI", Roboto, Arial, sans-serif`;
  const w = ctx.measureText(text).width;
  const h = size * 1.25;
  const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  const top = base === 'top' ? y : base === 'bottom' ? y - h : y - h / 2;
  const box = { left: left - pad, top: top - pad, right: left + w + pad, bottom: top + h + pad };
  if (!force) {
    if (bounds && (box.left < bounds.left || box.right > bounds.right || box.top < bounds.top || box.bottom > bounds.bottom)) return null;
    if (taken.some((b) => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top)) return null;
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.strokeText(text, left, top + h / 2 + 0.5);
  ctx.fillStyle = color;
  ctx.fillText(text, left, top + h / 2 + 0.5);
  taken.push(box);
  return box;
}

/** Tries the spots in order (each [x, y, options]) and draws the label at the first free one. */
export function placeFirst(ctx, taken, text, spots, common = {}) {
  for (const [x, y, opt] of spots) {
    const b = placeLabel(ctx, taken, text, x, y, { ...common, ...opt });
    if (b) return b;
  }
  return null;
}

function arrowHead(ctx, x, y, dx, dy, size = 7) {
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - ux * size - uy * size * 0.55, y - uy * size + ux * size * 0.55);
  ctx.lineTo(x - ux * size + uy * size * 0.55, y - uy * size - ux * size * 0.55);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws the graph in rect R = { x, y, w, h } (CSS px). g: {
 *   u, a, t, v, V,             the plan (m/s, m/s², s)
 *   tau,                       how far the line has been drawn (s)
 *   axisT, axisV: { max, step } the axes
 *   show: { plan, line, area, strips, V, mid, uLabel, vLabel, sLabel, cursor, tMark },
 *   swap,                      0…1: the triangle above V turning into the gap below it
 *   sText, cursorText: { t, v }  live texts (already in the right digits)
 *   text: { axisV, axisT, area, u, v, V, formulaV, tMark }  labels (already in the right digits)
 *   N, colors, taken            digits function, colours, boxes already taken on the overlay (corner buttons…)
 * }
 * Returns the plot's frame, for tests of where things are.
 */
export function drawGraph(ctx, R, g) {
  const C = g.colors;
  const taken = g.taken;
  const compact = R.h < 170 || R.w < 300;
  const fs = compact ? 11.5 : 12.5; // tick labels
  const padL = compact ? 44 : 52;
  const padR = compact ? 46 : 56;
  const padT = compact ? 18 : 26;
  const padB = compact ? 26 : 34;
  const X0 = R.x + padL;
  const X1 = R.x + R.w - padR;
  const Y0 = R.y + R.h - padB;
  const Y1 = R.y + padT;
  const T = g.axisT;
  const VM = g.axisV.max;
  const xOf = (tt) => X0 + (tt / T) * (X1 - X0);
  const yOf = (vv) => Y0 - (vv / VM) * (Y0 - Y1);
  const vAt = (tt) => g.u + g.a * tt;
  const tau = Math.max(0, Math.min(g.tau, g.t));
  const bounds = { left: R.x, top: R.y, right: R.x + R.w, bottom: R.y + R.h };

  // a white card: the 3D ground never shows behind the graph
  const card = g.card || R;
  ctx.fillStyle = '#fff';
  ctx.fillRect(card.x, card.y, card.w, card.h);

  // grid: a line at each velocity step and each second
  ctx.lineWidth = 1;
  ctx.strokeStyle = C.grid;
  ctx.beginPath();
  for (let vv = g.axisV.step; vv <= VM + 1e-9; vv += g.axisV.step) {
    ctx.moveTo(X0, Math.round(yOf(vv)) + 0.5);
    ctx.lineTo(X1, Math.round(yOf(vv)) + 0.5);
  }
  for (let k = 1; k <= T + 1e-9; k++) {
    ctx.moveTo(Math.round(xOf(k)) + 0.5, Y0);
    ctx.lineTo(Math.round(xOf(k)) + 0.5, Y1);
  }
  ctx.stroke();

  // the area under the line up to tau: 1-second strips, or (while the triangle turns) one colour
  const swap = g.swap || 0;
  if (g.show.area && tau > 0) {
    if (swap > 0) {
      // everything under min(line, V): the trapezium without the triangle above V
      ctx.fillStyle = C.strips[0];
      ctx.beginPath();
      ctx.moveTo(xOf(0), Y0);
      const n = 24;
      for (let i = 0; i <= n; i++) {
        const tt = (g.t * i) / n;
        ctx.lineTo(xOf(tt), yOf(Math.min(vAt(tt), g.V)));
      }
      ctx.lineTo(xOf(g.t), Y0);
      ctx.closePath();
      ctx.fill();
    } else {
      for (let k = 0; k < Math.ceil(tau - 1e-9); k++) {
        const t0 = k;
        const t1 = Math.min(k + 1, tau);
        ctx.fillStyle = g.show.strips ? C.strips[k % 2] : C.strips[0];
        ctx.beginPath();
        ctx.moveTo(xOf(t0), Y0);
        ctx.lineTo(xOf(t0), yOf(vAt(t0)));
        ctx.lineTo(xOf(t1), yOf(vAt(t1)));
        ctx.lineTo(xOf(t1), Y0);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // the triangle between the line and V on the side where the line is above V, turning about (t/2, V)
  const halfT = g.t / 2;
  if (swap > 0 && g.show.area && Math.abs(g.a) > 1e-9) {
    const cx = xOf(halfT);
    const cy = yOf(g.V);
    const tri =
      g.a > 0
        ? [
            [halfT, g.V],
            [g.t, g.V],
            [g.t, g.v],
          ]
        : [
            [0, g.u],
            [0, g.V],
            [halfT, g.V],
          ];
    // where it came from: a dashed outline
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.avg;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    tri.forEach(([tt, vv], i) => (i ? ctx.lineTo(xOf(tt), yOf(vv)) : ctx.moveTo(xOf(tt), yOf(vv))));
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    // the moving triangle, in screen space rotated about the crossing point
    const ang = Math.PI * swap;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.beginPath();
    tri.forEach(([tt, vv], i) => (i ? ctx.lineTo(xOf(tt) - cx, yOf(vv) - cy) : ctx.moveTo(xOf(tt) - cx, yOf(vv) - cy)));
    ctx.closePath();
    ctx.fillStyle = C.moved; // the same area as before, only moved
    ctx.fill();
    ctx.strokeStyle = C.avg;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  // axes with arrows
  ctx.strokeStyle = C.ink;
  ctx.fillStyle = C.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(X0, Y0);
  ctx.lineTo(X1 + 12, Y0);
  ctx.moveTo(X0, Y0);
  ctx.lineTo(X0, Y1 - 12);
  ctx.stroke();
  arrowHead(ctx, X1 + 16, Y0, 1, 0);
  arrowHead(ctx, X0, Y1 - 16, 0, -1);

  // the labels that matter most go first, so the tick numbers give way to them
  const labelBoxes = [];
  const vLabelAt = (vv, text, color) =>
    placeLabel(ctx, taken, text, X0 - 6, yOf(vv), { align: 'right', color, size: fs + 0.5, weight: 700, bounds, force: true });

  // the plan (faint, dotted) before the run draws it
  if (g.show.plan) {
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = C.velFaint;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(g.u));
    ctx.lineTo(xOf(g.t), yOf(g.v));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // V: the dashed line at the average velocity, over the whole time
  if (g.show.V) {
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = C.avg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(g.V));
    ctx.lineTo(xOf(g.t), yOf(g.V));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // the velocity line
  if (g.show.line && tau > 0) {
    ctx.strokeStyle = C.vel;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(g.u));
    ctx.lineTo(xOf(tau), yOf(vAt(tau)));
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  // u: the start of the line
  if (g.show.uLabel) {
    ctx.fillStyle = C.vel;
    ctx.beginPath();
    ctx.arc(xOf(0), yOf(g.u), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // half the time: the line crosses V there (the average velocity is the velocity at the middle of the time)
  if (g.show.mid && g.show.V && tau >= halfT - 1e-9) {
    const mx = xOf(halfT);
    const my = yOf(g.V);
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = C.avg;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, Y0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = C.avg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // the end of the line: v
  const done = tau >= g.t - 1e-9;
  if (g.show.line && done) {
    ctx.fillStyle = C.vel;
    ctx.beginPath();
    ctx.arc(xOf(g.t), yOf(g.v), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // the moment shown: a dot on the line, a guide down to the time axis, the time and the velocity
  if (g.show.cursor && tau > 0 && !done) {
    const cx = xOf(tau);
    const cy = yOf(vAt(tau));
    ctx.strokeStyle = C.time;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, Y0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.vel;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── labels, most important first; none may sit on the velocity line or the V line ──
  const along = (xa, ya, xb, yb) => {
    const n = Math.max(1, Math.ceil(Math.hypot(xb - xa, yb - ya) / 6));
    for (let i = 0; i <= n; i++) {
      const x = xa + ((xb - xa) * i) / n;
      const y = ya + ((yb - ya) * i) / n;
      taken.push({ left: x - 3, right: x + 3, top: y - 3, bottom: y + 3 });
    }
  };
  if (g.show.line && tau > 0) along(xOf(0), yOf(g.u), xOf(tau), yOf(vAt(tau)));
  if (g.show.V) along(xOf(0), yOf(g.V), xOf(g.t), yOf(g.V));
  // y-axis: u and V (and v at the end of the line, to its right)
  if (g.show.uLabel) labelBoxes.push(vLabelAt(g.u, g.text.u, C.vel));
  if (g.show.V && Math.abs(g.V - g.u) * ((Y0 - Y1) / VM) > fs + 2) labelBoxes.push(vLabelAt(g.V, g.text.V, C.avg));
  if (g.show.vLabel && done) {
    placeFirst(
      ctx,
      taken,
      g.text.v,
      [
        [xOf(g.t) + 8, yOf(g.v), {}],
        [xOf(g.t) + 8, yOf(g.v) - 14, {}],
        [xOf(g.t) + 8, yOf(g.v) + 14, {}],
        [xOf(g.t) - 8, yOf(g.v) - 14, { align: 'right' }],
      ],
      { color: C.vel, size: fs + 0.5, weight: 700, bounds },
    );
  }
  // the moment shown: its time under the axis, its velocity beside the dot
  if (g.show.cursor && tau > 0 && !done && g.cursorText) {
    placeLabel(ctx, taken, g.cursorText.t, xOf(tau), Y0 + 4, {
      align: 'center',
      base: 'top',
      color: C.time,
      size: fs + 0.5,
      weight: 700,
      force: true,
    });
    const cy = yOf(vAt(tau));
    placeFirst(
      ctx,
      taken,
      g.cursorText.v,
      [
        [xOf(tau) - 9, cy - 15, { align: 'right' }],
        [xOf(tau) + 9, cy - 15, {}],
        [xOf(tau) + 9, cy + 15, {}],
      ],
      { color: C.vel, size: fs, weight: 700, bounds },
    );
  }
  // the time t marked on the axis (in the test, before the line is drawn)
  if (g.show.tMark) {
    const x = xOf(g.tMarkAt ?? g.t);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = C.time;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, Y0);
    ctx.lineTo(x, Y1);
    ctx.stroke();
    ctx.setLineDash([]);
    placeFirst(
      ctx,
      taken,
      g.text.tMark,
      [
        [x - 6, Y1 + 2, { align: 'right', base: 'top' }],
        [x + 6, Y1 + 2, { base: 'top' }],
      ],
      { color: C.time, size: fs + 0.5, weight: 700, bounds },
    );
  }
  // the area: what it means and how big it is
  if (g.show.area && g.show.sLabel && tau > 0 && g.sText) {
    const tm = (swap > 0.5 ? g.t : tau) / 2;
    const top = swap > 0.5 ? g.V : Math.min(vAt(tm), g.V || vAt(tm));
    const hPx = Y0 - yOf(Math.max(0, top));
    const cx = xOf(tm);
    if (hPx > 34 && xOf(swap > 0.5 ? g.t : tau) - X0 > 70) {
      const cy = Y0 - Math.min(hPx * 0.45, hPx - 22);
      placeLabel(ctx, taken, g.text.area, cx, cy - 10, { align: 'center', color: C.distDark, size: fs - 0.5, weight: 600, bounds, pad: 0 });
      placeLabel(ctx, taken, g.sText, cx, cy + 9, { align: 'center', color: C.distDark, size: fs + 2, weight: 700, bounds, pad: 0 });
    }
  }
  // V = (u+v)/2 beside the dashed line, as the book writes it
  if (g.show.V && g.text.formulaV && !compact) {
    const y = yOf(g.V);
    placeFirst(
      ctx,
      taken,
      g.text.formulaV,
      [
        [xOf(g.t) + 8, y, {}],
        [xOf(g.t) - 4, y - 11, { align: 'right' }],
        [xOf(g.t) - 4, y + 11, { align: 'right' }],
        [xOf(g.t * 0.25), y - 11, { align: 'center' }],
        [xOf(g.t * 0.25), y + 11, { align: 'center' }],
      ],
      { color: C.avg, size: fs, weight: 700, bounds },
    );
  }

  // tick numbers where there is room
  for (let vv = 0; vv <= VM + 1e-9; vv += g.axisV.step)
    placeLabel(ctx, taken, g.N(vv), X0 - 6, yOf(vv), { align: 'right', color: C.ink3, size: fs, weight: 500, bounds });
  const every = (X1 - X0) / T < 16 ? 2 : 1;
  for (let k = 0; k <= T + 1e-9; k += every)
    placeLabel(ctx, taken, g.N(k), xOf(k), Y0 + 4, { align: 'center', base: 'top', color: C.ink3, size: fs, weight: 500, bounds });

  // axis titles (after the numbers: t's title moves above the axis rather than hide the last second)
  placeFirst(
    ctx,
    taken,
    g.text.axisV,
    [
      [X0 + 10, Y1 - 12, {}],
      [X0 + 10, Y1 - 4, {}],
    ],
    { color: C.ink2, size: fs, weight: 600, bounds },
  );
  placeFirst(
    ctx,
    taken,
    g.text.axisT,
    [
      [X1 + 18, Y0 + 15, { align: 'right' }],
      [X1 + 18, Y0 - 12, { align: 'right' }],
      [X1 - 30, Y0 - 12, { align: 'right' }],
    ],
    {
      color: C.ink2,
      size: fs,
      weight: 600,
      bounds,
    },
  );

  return { X0, X1, Y0, Y1, xOf, yOf };
}
