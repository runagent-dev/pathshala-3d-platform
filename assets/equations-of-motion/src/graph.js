// The বেগ–সময় গ্রাফ of the run, drawn on the figure's 2D overlay canvas (so it is crisp at any size and part of
// `capture`): the velocity line from u to v, the area under it in 1-second strips (each strip is the distance of
// that second, the same colours as the trip bar under the railway), the average velocity V as a dashed line, the
// moment the line crosses it (half the time), and at the end of a run the triangle above V folding into the gap
// below it, in two flips that stay inside the graph: the trapezium becomes the rectangle V × t, so s = Vt. For
// s = ut + ½at² the area splits into the rectangle ut and the triangle ½at²; a tapped letter lights its quantity
// (u, v, a, t, s) in its colour.
// Labels are placed one by one and skip a spot that would cover one already drawn (or a line).

export const FONT = '"Noto Sans Bengali", "Segoe UI", Roboto, Arial, sans-serif';

/** A text label with a white halo; returns its box, or null if it would collide with `taken`. */
export function placeLabel(
  ctx,
  taken,
  text,
  x,
  y,
  { align = 'left', base = 'middle', color = '#1d2733', size = 13, weight = 600, pad = 2, bounds = null, force = false } = {},
) {
  ctx.font = `${weight} ${size}px ${FONT}`;
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

const smooth = (k) => {
  const x = Math.min(1, Math.max(0, k));
  return x * x * (3 - 2 * x);
};

/**
 * The triangle between the line and V on the side where the line is above V (graph units [t, v]), and the gap
 * below V it folds into. a > 0: right of half time above V, the gap left of it; a < 0 the other way round.
 */
export function swapTriangles({ u, a, t, v, V }) {
  const h = t / 2;
  return a > 0
    ? {
        piece: [
          [h, V],
          [t, V],
          [t, v],
        ],
        gap: [
          [h, V],
          [0, V],
          [0, u],
        ],
      }
    : {
        piece: [
          [0, u],
          [0, V],
          [h, V],
        ],
        gap: [
          [h, V],
          [t, V],
          [t, v],
        ],
      };
}

/**
 * Draws the graph in rect R = { x, y, w, h } (CSS px). g: {
 *   u, a, t, v, V,             the plan (m/s, ms⁻², s)
 *   tau,                       how far the line has been drawn (s)
 *   axisT, axisV: { max, step } the axes
 *   show: { plan, line, area, strips, V, mid, uLabel, vLabel, sLabel, cursor, tMark },
 *   swap,                      0…1: the triangle above V folding into the gap below it (two flips)
 *   split,                     at the end: the area as the rectangle ut and the triangle ½at² (s = ut + ½at²)
 *   hl,                        a tapped letter (u, v, a, t, s): its quantity lit in its colour
 *   sText, cursorText: { t, v }  live texts (already in the right digits)
 *   text: { axisV, axisT, area, u, v, V, formulaV, tMark, ut, half, stepA }  labels (already in the right digits)
 *   card,                      the white area behind the graph
 *   N, colors, taken            digits function, colours, boxes already taken on the overlay (corner buttons…)
 * }
 * Returns the plot's frame (for touches on the graph).
 */
export function drawGraph(ctx, R, g) {
  const C = g.colors;
  const taken = g.taken;
  const compact = R.h < 170 || R.w < 300;
  const fs = compact ? 11.5 : 12.5; // tick labels
  const widthOf = (text, size, weight = 700) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    return text ? ctx.measureText(text).width : 0;
  };
  // room on the left for the widest y-axis label, on the right for t's title beside the arrow
  const leftW = Math.max(
    g.show.uLabel ? widthOf(g.text.u, fs + 0.5) : 0,
    g.show.V ? widthOf(g.text.V, fs + 0.5) : 0,
    widthOf(g.N(g.axisV.max), fs, 500),
  );
  const padL = Math.ceil(leftW + 14);
  const padR = Math.ceil(Math.max(compact ? 40 : 48, widthOf(g.text.axisT, fs, 600) + 28));
  const padT = compact ? 18 : 26;
  const padB = compact ? 22 : 30;
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
  const halfT = g.t / 2;
  const done = tau >= g.t - 1e-9;

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

  // the axis titles first, at fixed spots outside the plot (nothing else may take them)
  placeLabel(ctx, taken, g.text.axisV, X0 + 8, Y1 - (compact ? 10 : 13), { color: C.ink2, size: fs, weight: 600, force: true });
  placeLabel(ctx, taken, g.text.axisT, X1 + 24, Y0, { color: C.ink2, size: fs, weight: 600, force: true });

  // the area under the line up to tau: 1-second strips, or (while the triangle folds) one colour
  const swap = g.swap || 0;
  const split = g.split && done && swap <= 0 && g.show.area;
  if (split) {
    // s = ut + ½at²: the rectangle u × t (u's colour) and the triangle between u and the line (its own colour; when
    // braking it lies inside the rectangle, above the line, and is taken away: hatched)
    ctx.fillStyle = C.rect;
    ctx.fillRect(xOf(0), yOf(g.u), xOf(g.t) - xOf(0), Y0 - yOf(g.u));
    if (Math.abs(g.a) > 1e-9) {
      ctx.beginPath();
      ctx.moveTo(xOf(0), yOf(g.u));
      ctx.lineTo(xOf(g.t), yOf(g.u));
      ctx.lineTo(xOf(g.t), yOf(g.v));
      ctx.closePath();
      if (g.a > 0) {
        ctx.fillStyle = C.tri;
        ctx.fill();
      } else {
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = C.triEdge;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = xOf(0) - (Y0 - Y1); x < xOf(g.t); x += 7) {
          ctx.moveTo(x, Y0);
          ctx.lineTo(x + (Y0 - Y1), Y1);
        }
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = C.triEdge;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xOf(0), yOf(g.u));
      ctx.lineTo(xOf(g.t), yOf(g.u));
      ctx.lineTo(xOf(g.t), yOf(g.v));
      ctx.stroke();
    }
  } else if (g.show.area && tau > 0) {
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

  // the fold: first across the half-time line (it stays between V and v), then down across V into the gap
  if (swap > 0 && g.show.area && Math.abs(g.a) > 1e-9) {
    const { piece } = swapTriangles(g);
    const cx = xOf(halfT);
    const cy = yOf(g.V);
    const sx = Math.cos(Math.PI * smooth(swap / 0.45));
    const sy = Math.cos(Math.PI * smooth((swap - 0.55) / 0.45));
    const path = (pts, fx, fy) => {
      ctx.beginPath();
      pts.forEach(([tt, vv], i) => {
        const x = cx + (xOf(tt) - cx) * fx;
        const y = cy + (yOf(vv) - cy) * fy;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.closePath();
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(X0, Y1 - 2, X1 - X0, Y0 - Y1 + 2);
    ctx.clip();
    // where it came from: a dashed outline
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.triEdge;
    ctx.lineWidth = 1.3;
    path(piece, 1, 1);
    ctx.stroke();
    ctx.setLineDash([]);
    // the moving piece, in the triangle's own colour
    path(piece, sx, sy);
    ctx.fillStyle = C.tri;
    ctx.fill();
    ctx.strokeStyle = C.triEdge;
    ctx.lineWidth = 1.8;
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
  // a tapped letter: its quantity lit in its colour (u and v as bars up the axes, t along the time axis, a as one
  // second's step on the line, s as the outline of the area)
  const hl = g.hl;
  const bar = (x0, y0, x1, y1, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  };
  if (hl === 'u') bar(X0, Y0, X0, yOf(g.u), C.u);
  if (hl === 'v') {
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = C.vel;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(xOf(g.t), yOf(g.v));
    ctx.lineTo(X0, yOf(g.v));
    ctx.stroke();
    ctx.setLineDash([]);
    bar(xOf(g.t), Y0, xOf(g.t), yOf(g.v), C.vel);
  }
  if (hl === 't') bar(X0, Y0, xOf(g.t), Y0, C.time);
  if (hl === 's' && g.show.area) {
    ctx.strokeStyle = C.dist;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(xOf(0), Y0);
    ctx.lineTo(xOf(0), yOf(g.u));
    ctx.lineTo(xOf(Math.max(tau, 1e-6)), yOf(vAt(tau)));
    ctx.lineTo(xOf(Math.max(tau, 1e-6)), Y0);
    ctx.closePath();
    ctx.stroke();
  }
  if (hl === 'a' && g.t >= 1) {
    // one second's step on the line, half-way along: 1 s across, a up (or down)
    const k = Math.max(0, Math.floor(g.t / 2 - 0.5));
    const xa = xOf(k);
    const xb = xOf(k + 1);
    const ya = yOf(vAt(k));
    const yb = yOf(vAt(k + 1));
    ctx.fillStyle = C.accelTint;
    ctx.beginPath();
    ctx.moveTo(xa, ya);
    ctx.lineTo(xb, ya);
    ctx.lineTo(xb, yb);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.accel;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xa, ya);
    ctx.lineTo(xb, ya);
    ctx.lineTo(xb, yb);
    ctx.stroke();
    if (g.text.stepA)
      placeFirst(
        ctx,
        taken,
        g.text.stepA,
        [
          [xb + 5, (ya + yb) / 2, {}],
          [xb + 5, ya + (g.a >= 0 ? 10 : -10), {}],
          [xa - 5, ya + (g.a >= 0 ? 10 : -10), { align: 'right' }],
        ],
        { color: C.accel, size: fs + 0.5, weight: 700, bounds },
      );
  }

  // u: the start of the line
  if (g.show.uLabel) {
    ctx.fillStyle = C.u;
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
  if (g.show.line && done) {
    ctx.fillStyle = C.vel;
    ctx.beginPath();
    ctx.arc(xOf(g.t), yOf(g.v), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // the moment shown: a dot on the line, a guide down to the time axis
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
  // y-axis: u and V, left of the axis (the left margin is as wide as they are)
  const leftLabel = (vv, text, color) =>
    placeLabel(ctx, taken, text, X0 - 6, yOf(vv), { align: 'right', color, size: fs + 0.5, weight: 700, force: true });
  if (g.show.uLabel) leftLabel(g.u, g.text.u, C.u);
  if (g.show.V && Math.abs(g.V - g.u) * ((Y0 - Y1) / VM) > fs + 2) leftLabel(g.V, g.text.V, C.avg);
  // v at the end of the line
  if (g.show.vLabel && done) {
    placeFirst(
      ctx,
      taken,
      g.text.v,
      [
        [xOf(g.t) + 8, yOf(g.v), {}],
        [xOf(g.t) + 8, yOf(g.v) - 15, {}],
        [xOf(g.t) - 8, yOf(g.v) - 15, { align: 'right' }],
        [xOf(g.t) + 8, yOf(g.v) + 15, {}],
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
        [xOf(tau) - 9, cy + 15, { align: 'right' }],
      ],
      { color: C.vel, size: fs, weight: 700, bounds },
    );
  }
  // a time marked on the axis (in the test, before the line is drawn)
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
  // s = ut + ½at²: each part named inside it, when there is room
  if (split) {
    const rh = Y0 - yOf(g.u);
    // under the line (when braking the line crosses the rectangle)
    const lx = g.a < 0 ? g.t * 0.28 : g.t / 2;
    const ly = g.a < 0 ? yOf(vAt(lx) * 0.42) : Y0 - rh / 2;
    if (rh > 18 && g.text.ut)
      placeLabel(ctx, taken, g.text.ut, xOf(lx), ly, { align: 'center', color: C.rectInk, size: fs + 2, weight: 700, bounds });
    if (Math.abs(yOf(g.v) - yOf(g.u)) > 22 && g.text.half)
      placeLabel(ctx, taken, g.text.half, xOf((g.t * 2) / 3), yOf(g.u + (g.v - g.u) / 3), {
        align: 'center',
        color: C.triInk,
        size: fs + 1,
        weight: 700,
        bounds,
      });
  }
  // the area: what it means and how big it is
  if (!split && g.show.area && g.show.sLabel && tau > 0 && g.sText) {
    const whole = swap > 0.5;
    const tm = (whole ? g.t : tau) / 2;
    const top = whole ? g.V : Math.min(vAt(tm), g.V || vAt(tm));
    const hPx = Y0 - yOf(Math.max(0, top));
    const cx = xOf(tm);
    if (hPx > 34 && xOf(whole ? g.t : tau) - X0 > 70) {
      const cy = Y0 - Math.min(hPx * 0.45, hPx - 22);
      placeLabel(ctx, taken, g.text.area, cx, cy - 10, { align: 'center', color: C.distDark, size: fs - 0.5, weight: 600, bounds, pad: 0 });
      placeLabel(ctx, taken, g.sText, cx, cy + 9, { align: 'center', color: C.distDark, size: fs + 2, weight: 700, bounds, pad: 0 });
    } else if (hPx > 16)
      placeLabel(ctx, taken, g.sText, cx, Y0 - hPx / 2, { align: 'center', color: C.distDark, size: fs, weight: 700, bounds, pad: 0 });
  }
  // V = (u+v)/2 beside the dashed line, as the book's figure writes it: above or below the line, clear of it
  if (g.show.V && g.text.formulaV) {
    const y = yOf(g.V);
    placeFirst(
      ctx,
      taken,
      g.text.formulaV,
      [
        [xOf(g.t) - 4, y - 15, { align: 'right' }],
        [xOf(g.t) - 4, y + 15, { align: 'right' }],
        [xOf(g.t * 0.25), y - 15, { align: 'center' }],
        [xOf(g.t * 0.25), y + 15, { align: 'center' }],
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

  return { X0, X1, Y0, Y1, T, VM, xOf, yOf };
}
