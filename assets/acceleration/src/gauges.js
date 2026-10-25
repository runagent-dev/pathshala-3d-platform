// The flat drawings next to the 3D view, as SVG: the বেগ–সময় graph the student draws by driving (the book's
// চিত্র ২.০৬ made live), the compass of the বেগ's direction on the bend, and the CNG's speedometer.
import { TICK, TRIP, VMAX, lettersOf } from './drive.js';

const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * The বেগ–সময় graph in `el`. draw({ trip, upto, selected, plain, hint }) redraws it: the line in pieces coloured by
 * kind (plain: one ink colour, for the test, so colour never gives the answer away), a pale band under each piece,
 * the letters A, B, C… of the pieces of 1 s or more, and a dot where the CNG is now.
 */
export function createGraph(el, { t, N, colors }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ac-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let last = null;
  let geom = null;

  function layout() {
    const W = Math.max(120, el.clientWidth);
    const H = Math.max(60, el.clientHeight);
    const big = H > 150;
    const f = big ? 14 : 11.5; // font size of the numbers
    const m = { l: f * 2.3, r: f * 4.2, t: f * 1.5, b: f * 1.55 };
    geom = { W, H, f, m, x0: m.l, x1: W - m.r, y0: H - m.b, y1: m.t };
    return geom;
  }
  let tmax = TRIP;
  const X = (sec) => geom.x0 + (sec / tmax) * (geom.x1 - geom.x0);
  const Y = (v) => geom.y0 - (v / VMAX) * (geom.y0 - geom.y1);

  /** opts: { trip, upto, selected, plain, hint, tmax (s on the time axis: 30 while driving, 20 for a test graph) } */
  function draw(opts = last) {
    if (!opts) return;
    last = opts;
    const { trip, upto = trip.n, selected = -1, plain = false, hint = '' } = opts;
    tmax = opts.tmax || TRIP;
    const { W, H, f, x0, x1, y0, y1 } = layout();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', t('graph_aria'));
    let out = '';
    // grid and axes
    for (const v of [0, 5, 10, 15]) {
      out += `<line class="g-grid" x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}"/>`;
      out += `<text class="g-num" x="${x0 - f * 0.45}" y="${Y(v) + f * 0.36}" text-anchor="end" font-size="${f}">${N(v)}</text>`;
    }
    for (let sec = 0; sec <= tmax; sec += tmax > 20 ? 10 : 5) {
      out += `<line class="g-grid" x1="${X(sec)}" x2="${X(sec)}" y1="${y0}" y2="${y1}"/>`;
      out += `<text class="g-num" x="${X(sec)}" y="${y0 + f * 1.2}" text-anchor="middle" font-size="${f}">${N(sec)}</text>`;
    }
    out += `<path class="g-axis" d="M${x0} ${y1 - f * 0.5}V${y0}H${x1 + f * 0.5}"/>`;
    out += `<path class="g-axis g-head" d="M${x0 - 3.5} ${y1 - f * 0.1}L${x0} ${y1 - f * 0.65}L${x0 + 3.5} ${y1 - f * 0.1}M${x1 + f * 0.05} ${y0 - 3.5}L${x1 + f * 0.6} ${y0}L${x1 + f * 0.05} ${y0 + 3.5}"/>`;
    out += `<text class="g-name" x="${x0 + f * 0.4}" y="${y1 - f * 0.45}" font-size="${f}">${esc(t('axis_v'))}</text>`;
    out += `<text class="g-name" x="${x1 + f * 0.8}" y="${y0 + f * 0.36}" font-size="${f}">${esc(t('axis_t'))}</text>`;

    const sts = trip.stretches;
    const letters = lettersOf(sts);
    const nowTick = Math.min(upto, trip.n);
    sts.forEach((st, i) => {
      if (st.t0 >= nowTick) return;
      const t1 = Math.min(st.t1, nowTick);
      const v1 = trip.vs[t1];
      const xa = X(st.t0 * TICK);
      const xb = X(t1 * TICK);
      const c = plain ? colors.ink : colors[st.kind];
      if (!plain)
        out += `<rect class="g-band${i === selected ? ' on' : ''}" x="${xa}" y="${y1}" width="${Math.max(0, xb - xa)}" height="${y0 - y1}" fill="${c}"/>`;
      out += `<line class="g-line" x1="${xa}" y1="${Y(trip.vs[st.t0] / 10)}" x2="${xb}" y2="${Y(v1 / 10)}" stroke="${c}"/>`;
      const letter = st.t1 <= nowTick || t1 - st.t0 >= 10 ? letters[i] : '';
      if (letter) {
        // beside the middle of the piece, off the line: above a flat piece, up-left of a rising one, up-right of a
        // falling one (below it when there is no room above)
        const ya = Y(trip.vs[st.t0] / 10);
        const yb = Y(v1 / 10);
        const len = Math.hypot(xb - xa, yb - ya) || 1;
        let nx = (yb - ya) / len;
        let ny = -(xb - xa) / len;
        const r = f * 0.95;
        let lx = (xa + xb) / 2 + nx * r;
        let ly = (ya + yb) / 2 + ny * r;
        if (ly - f * 0.5 < y1 || lx < x0 + f * 0.75 || lx > x1 - f * 0.4) {
          nx = -nx;
          ny = -ny;
          lx = (xa + xb) / 2 + nx * r;
          ly = (ya + yb) / 2 + ny * r;
        }
        out += `<text class="g-letter" x="${lx.toFixed(1)}" y="${(ly + f * 0.4).toFixed(1)}" text-anchor="middle" font-size="${f * 1.12}" fill="${c}">${letter}</text>`;
      }
    });
    if (opts.tmax) {
      // a test graph: no "now" dot, it is a finished trip like the book's
    } else if (trip.started && nowTick > 0) {
      const cur = sts.find((st) => st.t0 < nowTick && st.t1 >= nowTick) || sts.at(-1);
      out += `<circle class="g-dot" cx="${X(nowTick * TICK)}" cy="${Y(trip.vs[nowTick] / 10)}" r="${f * 0.36}" fill="${plain ? colors.ink : colors[cur.kind]}"/>`;
    } else if (hint) {
      out += `<text class="g-hint" x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2 + f * 0.35}" text-anchor="middle" font-size="${f}">${esc(hint)}</text>`;
    }
    svg.innerHTML = out;
  }

  /** The piece of the graph under a point (client x), or -1. */
  function pick(clientX, trip) {
    if (!geom) return -1;
    const r = svg.getBoundingClientRect();
    const sec = ((clientX - r.left - geom.x0) / (geom.x1 - geom.x0)) * tmax;
    const tick = sec / TICK;
    return trip.stretches.findIndex((st) => tick >= st.t0 - 2 && tick <= st.t1 + 2 && st.t0 < trip.n);
  }

  new ResizeObserver(() => draw()).observe(el);
  return { draw, pick, svg };
}

/**
 * The compass of the বেগ on the bend: north up (as the view from above), the বেগ arrow from the middle (its length
 * is the speed, the same all the time), and the ত্বরণ arrow when the CNG turns.
 */
export function createCompass(el, { t, colors }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-50 -50 100 100');
  svg.setAttribute('class', 'ac-compass-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', t('compass_aria'));
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const r0 = i % 2 ? 40 : 37;
    return `<line class="c-tick" x1="${Math.cos(a) * r0}" y1="${Math.sin(a) * r0}" x2="${Math.cos(a) * 43}" y2="${Math.sin(a) * 43}"/>`;
  }).join('');
  svg.innerHTML = `<circle class="c-ring" r="43"/>${ticks}
    <text class="c-dir" x="0" y="-31" text-anchor="middle">${esc(t('dir_N_short'))}</text>
    <text class="c-dir" x="31" y="4" text-anchor="middle">${esc(t('dir_E_short'))}</text>
    <text class="c-dir" x="0" y="38" text-anchor="middle">${esc(t('dir_S_short'))}</text>
    <text class="c-dir" x="-31" y="4" text-anchor="middle">${esc(t('dir_W_short'))}</text>
    <g class="c-acc" fill="${colors.turn}" stroke="${colors.turn}"><line x1="0" y1="0" x2="15" y2="0"/><path d="M22 0L13 -5L13 5Z"/></g>
    <g class="c-vel" fill="${colors.velocity}" stroke="${colors.velocity}"><line x1="0" y1="0" x2="22" y2="0"/><path d="M31 0L20 -6.5L20 6.5Z"/></g>
    <circle class="c-hub" r="3.2"/>`;
  el.append(svg);
  const vel = svg.querySelector('.c-vel');
  const acc = svg.querySelector('.c-acc');
  return {
    /** heading: rad from east, anticlockwise; steer: +1 left, −1 right, 0 straight. */
    set(heading, steer) {
      const deg = (-heading * 180) / Math.PI;
      vel.setAttribute('transform', `rotate(${deg.toFixed(2)})`);
      acc.style.display = steer ? '' : 'none';
      if (steer) acc.setAttribute('transform', `rotate(${(deg - steer * 90).toFixed(2)})`);
    },
  };
}

/** The speedometer (দ্রুতি in m/s): a dial with a needle, and the reading. */
export function createSpeedometer(el, { t, N, colors }) {
  // a half circle, 0 on the left, 15 m/s on the right; the reading sits under it, clear of the needle
  const A0 = 180; // degrees (from east, anticlockwise) at 0 m/s
  const SWEEP = 180;
  const ang = (v) => ((A0 - (v / VMAX) * SWEEP) * Math.PI) / 180;
  const pt = (v, r) => [Math.cos(ang(v)) * r, -Math.sin(ang(v)) * r];
  let ticks = '';
  for (let v = 0; v <= VMAX; v++) {
    const major = v % 5 === 0;
    const [a, b] = pt(v, major ? 31 : 34);
    const [c, d] = pt(v, 38);
    ticks += `<line class="s-tick${major ? ' major' : ''}" x1="${a.toFixed(2)}" y1="${b.toFixed(2)}" x2="${c.toFixed(2)}" y2="${d.toFixed(2)}"/>`;
    if (major) {
      const [x, y] = pt(v, 23);
      ticks += `<text class="s-num" x="${x.toFixed(2)}" y="${Math.min(y + 3.6, 1.5).toFixed(2)}" text-anchor="middle">${N(v)}</text>`;
    }
  }
  const [ax, ay] = pt(0, 38);
  const [bx, by] = pt(VMAX, 38);
  el.innerHTML = `<svg viewBox="-44 -42 88 46" class="ac-speedo-svg" aria-hidden="true">
      <path class="s-arc" d="M${ax.toFixed(2)} ${ay.toFixed(2)}A38 38 0 0 1 ${bx.toFixed(2)} ${by.toFixed(2)}"/>
      <path class="s-val" stroke="${colors.velocity}" d=""/>
      ${ticks}
      <line class="s-needle" x1="0" y1="0" x2="0" y2="-33"/>
      <circle class="s-hub" r="3.6"/>
    </svg>
    <div class="ac-speedo-read"><b></b><span>${esc(t('u_ms'))}</span></div>
    <div class="ac-speedo-name">${esc(t('speedo'))}</div>`;
  const needle = el.querySelector('.s-needle');
  const val = el.querySelector('.s-val');
  const read = el.querySelector('.ac-speedo-read b');
  let shown = null;
  return {
    /** v: the speed for the needle (smooth); text: the reading (one decimal). */
    set(v, text) {
      const deg = 90 - (A0 - (Math.min(VMAX, Math.max(0, v)) / VMAX) * SWEEP);
      needle.setAttribute('transform', `rotate(${deg.toFixed(2)})`);
      const [cx, cy] = pt(Math.max(0.001, v), 38);
      val.setAttribute(
        'd',
        v > 0.05 ? `M${ax.toFixed(2)} ${ay.toFixed(2)}A38 38 0 ${(v / VMAX) * SWEEP > 180 ? 1 : 0} 1 ${cx.toFixed(2)} ${cy.toFixed(2)}` : '',
      );
      if (text !== shown) {
        shown = text;
        read.textContent = text;
      }
    },
  };
}
