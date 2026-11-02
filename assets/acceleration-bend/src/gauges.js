// The flat drawings next to the 3D view, as SVG: the compass of the বেগ's direction on the bend, and the CNG's
// speedometer.
import { VMAX } from './drive.js';

const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

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
