// চিত্র ৮.০১ as a clean drawing in the panel, in real pixels: the bar of all the wavelengths with the visible band a sliver in
// it, and the eye's sensitivity across that sliver, filled with the spectrum as in the book. A dot follows the wavelength on
// the wall. On a low panel only one of the two shows: the curve for what the eye can see, the bar for what it cannot.
import { BANDS, isVisible, MIN_NM, PEAK, pureColour, sensitivity, VISIBLE } from './reading.js';

const NS = 'http://www.w3.org/2000/svg';
const PAD = { l: 34, r: 10, t: 6, b: 32 };
const TALL = 190; // from this height both drawings show
const BAR_ROOM = 96;
const FROM = -14;
const TO = 6;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function createGraph(t, { onScrub } = {}) {
  const N = t.num;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pvc-graph lab-graph');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', t('g_aria', { peak: PEAK }));
  let W = 320;
  let H = 120;
  let now = 550;
  let both = false;
  let id = 0;
  let wholeBar = false; // the bar, whatever the wavelength
  let dotOn = false; // the dot shows only while there is a wavelength on the wall
  const uid = `lab-${Math.random().toString(36).slice(2, 8)}`;
  // the two parts: their boxes
  const curveTop = () => (both ? BAR_ROOM + 6 : 0);
  const gx = (nm) => PAD.l + ((nm - VISIBLE[0]) / (VISIBLE[1] - VISIBLE[0])) * (W - PAD.l - PAD.r);
  const gy = (s) => {
    const top = curveTop() + PAD.t;
    return H - PAD.b + (top - (H - PAD.b)) * s;
  };
  const bx = (log) => 6 + ((log - FROM) / (TO - FROM)) * (W - 12);

  function area() {
    let d = `M${gx(400)} ${gy(0)}`;
    for (let nm = 400; nm <= 700; nm += 5) d += `L${gx(nm).toFixed(1)} ${gy(sensitivity(nm)).toFixed(1)}`;
    return `${d}L${gx(700)} ${gy(0)}Z`;
  }
  function line() {
    let d = '';
    for (let nm = 400; nm <= 700; nm += 5) d += `${d ? 'L' : 'M'}${gx(nm).toFixed(1)} ${gy(sensitivity(nm)).toFixed(1)}`;
    return d;
  }
  function stops() {
    let s = '';
    for (let nm = 400; nm <= 700; nm += 10) s += `<stop offset="${((nm - 400) / 300).toFixed(3)}" stop-color="${pureColour(nm)}"/>`;
    return s;
  }
  function curveSvg() {
    const xs = [400, 500, 600, 700]
      .map(
        (n) =>
          `<line class="grid" x1="${gx(n)}" x2="${gx(n)}" y1="${gy(1)}" y2="${gy(0)}"/><text x="${gx(n)}" y="${gy(0) + 13}" text-anchor="middle">${N(n)}</text>`,
      )
      .join('');
    const ys = [0, 0.5, 1]
      .map(
        (s) =>
          `<line class="grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${gy(s)}" y2="${gy(s)}"/><text x="${PAD.l - 5}" y="${gy(s) + 4}" text-anchor="end">${N(s === 0.5 ? '0.5' : s)}</text>`,
      )
      .join('');
    return `<g class="lab-curve-part">
      <defs><linearGradient id="${uid}" x1="${gx(400)}" x2="${gx(700)}" gradientUnits="userSpaceOnUse">${stops()}</linearGradient></defs>
      ${xs}${ys}
      <path d="${area()}" fill="url(#${uid})"/>
      <path class="lab-curve" d="${line()}"/>
      <text class="lab-gy" x="${W - PAD.r - 2}" y="${gy(1) + 11}" text-anchor="end">${t('g_y')}</text>
      <text x="${(gx(400) + gx(700)) / 2}" y="${H - 3}" text-anchor="middle">${t('g_x')}</text>
      <line class="lab-drop" y1="${gy(0)}"/>
      <g class="lab-now"><circle r="10"/><path d="M-6 0h12M-3.4 -3 -6 0l2.6 3M3.4 -3 6 0l-2.6 3"/></g>
    </g>`;
  }
  function barSvg() {
    const y = 19;
    const hb = 14;
    const uvEnd = bx(Math.log10(VISIBLE[0] * 1e-9));
    const irEnd = bx(Math.log10(VISIBLE[1] * 1e-9));
    const rects = BANDS.map((b, i) => {
      const x0 = bx(b.from);
      const x1 = bx(b.to);
      if (b.id === 'visible') return `<rect x="${x0 - 1}" y="${y - 4}" width="${x1 - x0 + 2}" height="${hb + 8}" fill="url(#${uid}-b)"/>`;
      return `<rect class="lab-band b${i % 2}" x="${x0}" y="${y}" width="${x1 - x0}" height="${hb}"/>`;
    }).join('');
    const word = (id, x, top, anchor = 'middle', key = `b_${id}`) =>
      `<text class="lab-bname${id === 'visible' ? ' on' : ''}" x="${x}" y="${top ? y - 7 : y + hb + 14}" text-anchor="${anchor}">${t(key)}</text>`;
    const mid = (id) => {
      const b = BANDS.find((x) => x.id === id);
      return (bx(b.from) + bx(b.to)) / 2;
    };
    const names = [
      word('gamma', 6, true, 'start'),
      word('uv', uvEnd - 5, true, 'end'),
      word('ir', irEnd + 5, true, 'start'),
      word('radio', W - 6, true, 'end'),
      word('xray', mid('xray'), false),
      word('visible', (uvEnd + irEnd) / 2 + 4, false, 'middle', W >= 330 ? 'b_visible' : 'b_visible_short'),
      word('micro', Math.max(mid('micro'), (uvEnd + irEnd) / 2 + (W >= 330 ? 86 : 62)), false),
    ].join('');
    // the book's scale, where there is room for a third row
    const scale =
      H >= 70
        ? `${[-14, -10, -6, -2, 2, 6]
            .map(
              (e) =>
                `<text class="lab-exp" x="${clamp(bx(e), 14, W - 14)}" y="${y + hb + 30}" text-anchor="middle">${N(10)}<tspan dy="-4" font-size="9.5">${e < 0 ? '−' : ''}${N(Math.abs(e))}</tspan></text>`,
            )
            .join('')}<text x="${W / 2}" y="${y + hb + 44}" text-anchor="middle">${t('g_m')}</text>`
        : '';
    return `<g class="lab-bar-part">
      <defs><linearGradient id="${uid}-b">${stops()}</linearGradient></defs>
      ${rects}${names}${scale}
      <path class="lab-pointer" d="M0 0l-6 -8h12z"/>
    </g>`;
  }
  function zoom() {
    if (!both) return '';
    const a = bx(Math.log10(VISIBLE[0] * 1e-9));
    const b = bx(Math.log10(VISIBLE[1] * 1e-9));
    return `<path class="lab-zoom" d="M${a} 37L${gx(400)} ${gy(1)}M${b} 37L${gx(700)} ${gy(1)}"/>`;
  }
  function draw() {
    both = H >= TALL;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `${zoom()}${barSvg()}${curveSvg()}`;
    place();
  }
  function place() {
    const seen = isVisible(now);
    const part = (cl, on) => {
      const el = svg.querySelector(cl);
      if (el) el.style.display = on ? '' : 'none';
    };
    part('.lab-bar-part', both || !seen || wholeBar);
    part('.lab-curve-part', both || (seen && !wholeBar));
    const n = clamp(now, VISIBLE[0], VISIBLE[1]);
    const x = gx(n).toFixed(1);
    const y = gy(sensitivity(n)).toFixed(1);
    const dot = svg.querySelector('.lab-now');
    const drop = svg.querySelector('.lab-drop');
    dot.setAttribute('transform', `translate(${x} ${y})`);
    dot.style.display = seen && dotOn ? '' : 'none';
    drop.style.display = seen && dotOn ? '' : 'none';
    drop.setAttribute('x1', x);
    drop.setAttribute('x2', x);
    drop.setAttribute('y2', y);
    // the pointer on the bar: the bands are so wide that the sliver is its own place
    const p = svg.querySelector('.lab-pointer');
    p.setAttribute('transform', `translate(${bx(Math.log10(now * 1e-9)).toFixed(1)} 16)`);
  }
  draw();
  new ResizeObserver(() => {
    const r = svg.getBoundingClientRect();
    if (r.width < 40 || r.height < 30) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    draw();
  }).observe(svg);

  // a finger on the curve moves the wavelength
  function scrub(e) {
    if ((!isVisible(now) || wholeBar) && !both) return;
    const r = svg.getBoundingClientRect();
    const x = e.clientX - r.left;
    if (e.clientY - r.top < curveTop()) return;
    const nm = VISIBLE[0] + ((x - PAD.l) / (W - PAD.l - PAD.r)) * (VISIBLE[1] - VISIBLE[0]);
    onScrub?.(clamp(Math.round(nm), MIN_NM + 70, VISIBLE[1]));
  }
  svg.addEventListener('pointerdown', (e) => {
    id = e.pointerId;
    svg.setPointerCapture?.(id);
    scrub(e);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (id && e.pointerId === id) scrub(e);
  });
  const up = () => {
    id = 0;
  };
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);
  return {
    el: svg,
    set(nm) {
      if (nm === now) return;
      now = nm;
      place();
    },
    /** Show the dot on the curve, or not. */
    mark(on) {
      if (on === dotOn) return;
      dotOn = on;
      place();
    },
    /** Show the bar of all the wavelengths, whatever the wavelength is. */
    whole(on) {
      if (on === wholeBar) return;
      wholeBar = on;
      place();
    },
  };
}
