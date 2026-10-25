// The momentum strip, drawn on the figure's 2D overlay canvas under the 3D picture (crisp at any size, part of the
// pictures): two rows, "before" and "now", each with the two momenta as green arrows laid tip to tail (m₁'s from
// zero, m₂'s from where m₁'s ends), so the row ends at the total. A dashed line marks the total, which never moves:
// while the balls touch, the parts trade (m₁'s shrinks, m₂'s grows) and the row still ends on the line. On the
// right of each row its sum in numbers ("৪.৫ + ১.৫ = ৬"). Also the flash where the balls touch (as in চিত্র ৩.০৪).
// Every word comes in from the figure (already translated); symbols are drawn with real subscripts.

export const FONT = '"Noto Sans Bengali", "Segoe UI", Roboto, Arial, sans-serif';
export const COLORS = {
  p: '#2f9e44', // momentum (the chapter's colour for p)
  pDark: '#24803a',
  pLight: '#b7e1c0',
  ink: '#1d2733',
  ink2: '#4b5766',
  ink3: '#7a8594',
  line: '#d9dee4',
  soft: '#f4f6f8',
};

/**
 * Text with symbols: a list of runs, each a string or { sub } / { sup } (drawn smaller, lower or higher).
 * @typedef {Array<string | { sub?: string, sup?: string }>} Rich
 */

/** Width of a rich text at font size `size`. */
export function richWidth(ctx, rich, size, weight = 600) {
  let w = 0;
  for (const run of rich) {
    const small = typeof run !== 'string';
    ctx.font = `${weight} ${small ? size * 0.68 : size}px ${FONT}`;
    w += ctx.measureText(small ? (run.sub ?? run.sup) : run).width + (small ? 0.5 : 0);
  }
  return w;
}

/** Draws a rich text; `x` is its left edge (or centre/right with align), `y` its middle. Returns its width. */
export function drawRich(ctx, rich, x, y, { size = 13, weight = 600, color = COLORS.ink, align = 'left', halo = false } = {}) {
  const w = richWidth(ctx, rich, size, weight);
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  for (const run of rich) {
    const small = typeof run !== 'string';
    const s = small ? size * 0.68 : size;
    const text = small ? (run.sub ?? run.sup) : run;
    const dy = small ? (run.sub != null ? size * 0.26 : -size * 0.32) : 0;
    ctx.font = `${weight} ${s}px ${FONT}`;
    if (halo) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeText(text, cx, y + dy + 0.5);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, cx, y + dy + 0.5);
    cx += ctx.measureText(text).width + (small ? 0.5 : 0);
  }
  return w;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A flat arrow from xa to xb (pixels) at height y: a bar `h` tall and a head; nothing if they are the same. */
function flatArrow(ctx, xa, xb, y, h, fill, stroke) {
  const len = Math.abs(xb - xa);
  if (len < 0.5) return;
  const dir = Math.sign(xb - xa);
  const head = Math.min(9, len);
  const hw = h / 2 + (h < 9 ? 2.5 : 3.5);
  const xs = xb - dir * head;
  ctx.beginPath();
  ctx.moveTo(xa, y - h / 2);
  ctx.lineTo(xs, y - h / 2);
  ctx.lineTo(xs, y - hw);
  ctx.lineTo(xb, y);
  ctx.lineTo(xs, y + hw);
  ctx.lineTo(xs, y + h / 2);
  ctx.lineTo(xa, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

/**
 * The strip's height for a stage of this size (px).
 * @param {number} W @param {number} H
 */
export function stripHeight(W, H) {
  return H < 300 ? 50 : W >= 700 && H >= 380 ? 98 : 86;
}

/**
 * Draws the strip in `box` ({ x, y, w, h }, canvas pixels).
 * d: { title, phase, range: { lo, hi }, total, totalName, totalValue, zeroText, sumSamples: [text, …],
 *      rows: [{ label, parts: [p1, p2], sum, hide, sym: [Rich, Rich] }], hideTotal }
 *   sumSamples: texts as wide as a row's sum may get, so the arrows' part keeps its size while the sums change.
 *   rows[i].sum: the row's sum ("৬ + ০ = ৬"); hide: no arrows and "?" for the sum (a test asks for it).
 *   A low box (under 60 px) has room for the last row only, without the title.
 */
export function drawStrip(ctx, box, d) {
  const compact = box.h < 60;
  const rows = compact ? d.rows.slice(-1) : d.rows;
  const fs = box.w >= 520 ? 13.5 : 12.5;
  const pad = compact ? 6 : 8;
  ctx.save();
  // the card
  roundRect(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1, 8);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  const titleH = compact ? 0 : 17;
  const axisH = 13;
  const rowsTop = box.y + pad - 2 + titleH;
  const rowH = (box.h - pad * 2 + 2 - titleH - axisH) / rows.length;
  ctx.textBaseline = 'middle';
  // the title (left) and the phase (right)
  if (!compact) {
    ctx.font = `700 ${fs - 0.5}px ${FONT}`;
    ctx.fillStyle = COLORS.pDark;
    ctx.textAlign = 'left';
    ctx.fillText(d.title, box.x + pad + 2, box.y + pad + 5);
    if (d.phase) {
      ctx.font = `600 ${fs - 1}px ${FONT}`;
      ctx.fillStyle = COLORS.ink3;
      ctx.textAlign = 'right';
      ctx.fillText(d.phase, box.x + box.w - pad - 2, box.y + pad + 5);
    }
  }
  // columns: row names | arrows | sums
  ctx.font = `600 ${fs - 0.5}px ${FONT}`;
  const nameW = Math.max(...rows.map((r) => ctx.measureText(r.label).width)) + 8;
  ctx.font = `700 ${fs}px ${FONT}`;
  const sumW = Math.max(...d.sumSamples.map((s) => ctx.measureText(s).width)) + 6;
  const x0 = box.x + pad + nameW + 10;
  const x1 = box.x + box.w - pad - sumW - 14;
  const span = d.range.hi - d.range.lo;
  const X = (p) => x0 + ((p - d.range.lo) / span) * (x1 - x0);
  const barH = compact ? 10 : 11;

  // zero: a line through the rows
  const yTop = rowsTop + 1;
  const yBot = rowsTop + rowH * rows.length - 1;
  ctx.strokeStyle = '#aab3bd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(X(0)) + 0.5, yTop);
  ctx.lineTo(Math.round(X(0)) + 0.5, yBot + 3);
  ctx.stroke();

  for (const [i, row] of rows.entries()) {
    const y = rowsTop + rowH * (i + 0.5);
    ctx.font = `600 ${fs - 0.5}px ${FONT}`;
    ctx.fillStyle = COLORS.ink2;
    ctx.textAlign = 'left';
    ctx.fillText(row.label, box.x + pad + 2, y + 0.5);
    const [a, b] = row.parts;
    if (!row.hide) {
      const xa = X(0);
      const xm = X(a);
      const xe = X(a + b);
      // opposite signs: m₂'s arrow runs back over m₁'s, so the two go one above the other (tip to tail still)
      const split = a * b < 0 && Math.abs(xe - xa) > 0.5;
      const h = split ? Math.max(6, Math.min(barH - 2, rowH / 2 - 3)) : barH;
      const ya = split ? y - h / 2 - 1.5 : y;
      const yb = split ? y + h / 2 + 1.5 : y;
      flatArrow(ctx, xa, xm, ya, h, COLORS.p, COLORS.pDark);
      flatArrow(ctx, xm, xe, yb, h, COLORS.pLight, COLORS.pDark);
      // the names of the parts inside their arrows, where there is room
      if (!split)
        for (const [j, [s, e]] of [
          [xa, xm],
          [xm, xe],
        ].entries()) {
          const room = Math.abs(e - s) - 10;
          const w = richWidth(ctx, row.sym[j], fs - 2, 700);
          if (room > w + 4)
            drawRich(ctx, row.sym[j], (s + e) / 2 - Math.sign(e - s) * 3, y, {
              size: fs - 2,
              weight: 700,
              color: j ? COLORS.pDark : '#fff',
              align: 'center',
            });
        }
    }
    // the sum, right-aligned
    ctx.font = `700 ${fs}px ${FONT}`;
    ctx.fillStyle = row.hide ? COLORS.ink3 : COLORS.pDark;
    ctx.textAlign = 'right';
    ctx.fillText(row.hide ? '?' : row.sum, box.x + box.w - pad - 2, y + 0.5);
  }

  // the total's line (dashed, it never moves) and the labels under the rows: the total, and zero
  const xt = Math.round(X(d.total)) + 0.5;
  if (!d.hideTotal) {
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = COLORS.pDark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(xt, yTop - 3);
    ctx.lineTo(xt, yBot + 3);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const ya = yBot + axisH / 2 + 2;
  ctx.font = `600 ${fs - 1.5}px ${FONT}`;
  const zeroW = ctx.measureText(d.zeroText).width;
  const totText = `${d.totalName} ${d.hideTotal ? '?' : d.totalValue}`;
  ctx.font = `700 ${fs - 1.5}px ${FONT}`;
  const totW = ctx.measureText(totText).width;
  // the total's label centred under its line (at the right while it is asked for), inside the arrows' part
  const tx = d.hideTotal ? x1 : xt;
  const tl = Math.min(Math.max(tx - totW / 2, x0 - 6), x1 + 6 - totW);
  ctx.fillStyle = d.hideTotal ? COLORS.ink3 : COLORS.pDark;
  ctx.textAlign = 'left';
  ctx.fillText(totText, tl, ya);
  // zero's label only where it does not touch the total's
  const zl = X(0) - zeroW / 2;
  if (zl + zeroW < tl - 6 || zl > tl + totW + 6) {
    ctx.font = `600 ${fs - 1.5}px ${FONT}`;
    ctx.fillStyle = COLORS.ink3;
    ctx.fillText(d.zeroText, zl, ya);
  }
  ctx.restore();
}

/** The flash where the balls touch: a small star, pulsing (k 0…1 through the contact). */
export function drawFlash(ctx, x, y, size, k) {
  const pulse = 0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, k * 1.2));
  const R = size * pulse;
  const r = R * 0.45;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r : R * (i % 4 === 0 ? 1 : 0.78);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 236, 140, 0.9)';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(200, 150, 20, 0.75)';
  ctx.stroke();
  ctx.restore();
}
