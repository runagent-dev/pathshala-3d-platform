// The graph in the panel, live with the 3D: across, θ₂ (the angle in the glass, 0–90°); up, θ₁ (the angle in the
// light medium, 0–90°, green) and the part of the light reflected (0–100 %, amber, on the right-hand scale). θ₁ climbs
// faster and faster and reaches 90° at θc; after θc there is no θ₁ at all ("প্রতিসরণ নেই", shaded), and the reflected
// part has jumped to 100 %. In water the curves are the water's, and the air's θ₁ stays as a faint line to compare.
// Drawn as SVG in real pixels for its box (never stretched), again whenever the box or the state changes.
import { lightAt, N, outsideN, refracted, reflectance, thetaC } from './reading.js';

const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const COL = { t1: '#2b8a3e', t1Text: '#237032', r: '#e67700', rText: '#b35c00', crit: '#7048e8' };

/** The θ₁ curve up to θc and the reflected part over 0–90°, as lists of [θ₂, value]. Pure; unit tested. */
export function curves(outside = 'air') {
  const n1 = outsideN(outside);
  const c = thetaC(outside);
  const t1 = [];
  const r = [];
  for (let a = 0; a <= 90; a += 1) {
    if (a < c) t1.push([a, refracted(a, n1, N.glass)]);
    r.push([a, a < c ? reflectance(a, n1, N.glass) * 100 : 100]);
  }
  t1.push([c, 90]);
  // the steep part just before θc, finely
  r.sort((p, q) => p[0] - q[0]);
  for (let a = Math.floor(c * 10) / 10 - 1; a < c; a += 0.1) r.push([a, reflectance(a, n1, N.glass) * 100]);
  r.push([c, 100]);
  r.sort((p, q) => p[0] - q[0]);
  return { t1, r, c };
}

/**
 * @param {HTMLElement} el
 * @param {{ t: (key: string, vars?: object) => string, N: (x: number | string) => string }} o
 */
export function createGraph(el, { t, N: num }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'tir-graph-svg');
  svg.setAttribute('role', 'img');
  el.append(svg);
  let lastKey = '';
  let last = null;
  const cache = new Map();
  const curvesOf = (outside) => {
    if (!cache.has(outside)) cache.set(outside, curves(outside));
    return cache.get(outside);
  };
  // the box's size, read when it changes (never in a frame: reading it after the panel's words change would force a layout)
  let size = null;
  if (typeof ResizeObserver !== 'undefined')
    new ResizeObserver(([e]) => {
      size = { w: e.contentRect.width, h: e.contentRect.height };
      lastKey = '';
      if (last) draw(last);
    }).observe(el);

  /** state: { theta, outside, show (0: axes only), compare (the air's curve faintly) } */
  // the moving part (the dots and the line of θ₂ now) is three elements moved in place; the rest is drawn only when
  // the box, the medium or what is shown changes
  let geom = null;
  let dots = null;
  function draw(state) {
    last = state;
    if (!size) size = { w: el.clientWidth, h: el.clientHeight };
    const W = Math.max(120, size.w);
    const H = Math.max(60, size.h);
    const { theta, outside, show, compare } = state;
    const key = `${W}|${H}|${outside}|${show}|${compare}`;
    if (key === lastKey) {
      moveDots(theta);
      return;
    }
    lastKey = key;
    const f = Math.min(15, Math.max(12, H / 10)); // numbers ≥ 12 px
    const lw = Math.min(4, Math.max(2.4, H / 50));
    const x0 = f * 2.3;
    const x1 = W - f * 2.6;
    const y1 = f * 1.5;
    const y0 = H - f * 1.35;
    const X = (a) => x0 + (a / 90) * (x1 - x0);
    const Y = (d) => y0 - (d / 90) * (y0 - y1);
    const YR = (p) => y0 - (p / 100) * (y0 - y1);
    const cv = curvesOf(outside);
    let out = '';
    // the shaded part beyond θc: no refraction
    if (show) {
      out += `<rect class="g-none" x="${X(cv.c)}" y="${y1}" width="${x1 - X(cv.c)}" height="${y0 - y1}"/>`;
      if (x1 - X(cv.c) > f * 4.5)
        out += `<text class="g-none-t" x="${(X(cv.c) + x1) / 2}" y="${Y(52)}" text-anchor="middle" font-size="${f}">${esc(t('graph_none'))}</text>`;
    }
    // grid and axes: a line every 30°; numbers at each when there is room, else at the ends
    const roomyX = x1 - x0 >= f * 24;
    const roomyY = y0 - y1 >= f * 4.5;
    for (const a of [0, 30, 60, 90]) {
      out += `<line class="g-grid" x1="${X(a)}" x2="${X(a)}" y1="${y0}" y2="${y1}"/>`;
      if (roomyX || a === 0 || a === 90)
        out += `<text class="g-num" x="${X(a)}" y="${y0 + f * 1.1}" text-anchor="middle" font-size="${f}">${num(a)}°</text>`;
      out += `<line class="g-grid" x1="${x0}" x2="${x1}" y1="${Y(a)}" y2="${Y(a)}"/>`;
      if (roomyY || a === 0 || a === 90)
        out += `<text class="g-num g-t1n" x="${x0 - f * 0.3}" y="${Y(a) + f * 0.35}" text-anchor="end" font-size="${f}">${num(a)}°</text>`;
    }
    for (const p of roomyY ? [0, 50, 100] : [0, 100])
      out += `<text class="g-num g-rn" x="${x1 + f * 0.3}" y="${YR(p) + f * 0.35}" font-size="${f}">${num(p)}%</text>`;
    out += `<path class="g-axis" d="M${x0} ${y1}V${y0}H${x1}V${y1}"/>`;
    out += `<text class="g-name" x="${X(45)}" y="${y0 + f * 1.1}" text-anchor="middle" font-size="${f}">${esc(t('graph_x'))} θ<tspan baseline-shift="sub" font-size="${f * 0.7}">2</tspan></text>`;
    if (show) {
      const poly = (pts, Yf) => pts.map(([a, d], i) => `${i ? 'L' : 'M'}${X(a).toFixed(1)} ${Yf(d).toFixed(1)}`).join('');
      if (compare && outside !== 'air') {
        const air = curvesOf('air');
        out += `<path class="g-past" stroke-width="${lw * 0.7}" d="${poly(air.t1, Y)}"/>`;
        out += `<text class="g-past-t" x="${X(air.c) + f * 0.2}" y="${Y(90) + f * 1.05}" font-size="${f * 0.92}">${esc(t('graph_air'))}</text>`;
      }
      // θc
      out += `<line class="g-crit" x1="${X(cv.c)}" x2="${X(cv.c)}" y1="${y0}" y2="${y1 - f * 0.2}"/>`;
      out += `<text class="g-crit-t" x="${X(cv.c)}" y="${y1 - f * 0.4}" text-anchor="middle" font-size="${f}" fill="${COL.crit}">θ<tspan baseline-shift="sub" font-size="${f * 0.7}">c</tspan> = ${num(cv.c)}°</text>`;
      out += `<path class="g-r" stroke="${COL.r}" stroke-width="${lw * 0.8}" d="${poly(cv.r, YR)}"/>`;
      out += `<path class="g-t1" stroke="${COL.t1}" stroke-width="${lw}" d="${poly(cv.t1, Y)}"/>`;
      // the names of the two lines
      out += `<text class="g-tag" x="${X(4)}" y="${Y(cv.t1[4][1]) - f * 0.55}" font-size="${f}" fill="${COL.t1Text}">θ<tspan baseline-shift="sub" font-size="${f * 0.7}">1</tspan></text>`;
      out += `<text class="g-tag" x="${X(3)}" y="${YR(cv.r[3][1]) - f * 0.5}" font-size="${f}" fill="${COL.rText}">${esc(t('graph_r'))}</text>`;
      // the light now
      out += `<line class="g-now" x1="0" x2="0" y1="${y0}" y2="${y1}"/>`;
      out += `<circle class="g-dot g-dot-t1" cx="0" cy="0" r="${f * 0.38}" fill="${COL.t1}"/>`;
      out += `<circle class="g-dot g-dot-r" cx="0" cy="0" r="${f * 0.34}" fill="${COL.r}"/>`;
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-label', state.aria || t('graph_aria'));
    svg.innerHTML = out;
    geom = { X, Y, YR, outside };
    dots = show ? { now: svg.querySelector('.g-now'), t1: svg.querySelector('.g-dot-t1'), r: svg.querySelector('.g-dot-r'), at: null } : null;
    moveDots(theta);
  }
  function moveDots(theta) {
    if (!dots || dots.at === theta) return;
    dots.at = theta;
    const L = lightAt(theta, geom.outside);
    const x = geom.X(theta).toFixed(1);
    dots.now.setAttribute('x1', x);
    dots.now.setAttribute('x2', x);
    dots.t1.setAttribute('cx', x);
    dots.t1.setAttribute('cy', L.theta1 == null ? -99 : geom.Y(L.theta1).toFixed(1));
    dots.t1.style.display = L.theta1 == null ? 'none' : '';
    dots.r.setAttribute('cx', x);
    dots.r.setAttribute('cy', geom.YR(L.R * 100).toFixed(1));
  }
  return { draw };
}
