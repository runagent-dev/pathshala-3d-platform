// A small live graph for the panel, where there is room: the image's length against the paper's distance, a straight line
// through zero. Its slope changes with the candle; the dot is the paper now.
import { FLAME, imageLength, round, V } from './reading.js';

const W = 280;
const H = 132;
const LEFT = 30;
const RIGHT = 10;
const TOP = 8;
const BOTTOM = 26;
const MAX_L = 12; // cm: the most the image can be
const NS = 'http://www.w3.org/2000/svg';

const X = (v) => LEFT + (v / V.max) * (W - LEFT - RIGHT);
const Y = (l) => H - BOTTOM - (l / MAX_L) * (H - TOP - BOTTOM);

export function createGraph(t) {
  const N = t.num;
  const el = document.createElementNS(NS, 'svg');
  el.setAttribute('class', 'pvc-graph ph-graph');
  el.setAttribute('viewBox', `0 0 ${W} ${H}`);
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', t('graph_aria'));
  const ticksX = [0, 9, 18, 27];
  const ticksY = [0, 4, 8, 12];
  el.innerHTML = [
    ...ticksX.slice(1).map((v) => `<line class="grid" x1="${X(v)}" x2="${X(v)}" y1="${TOP}" y2="${Y(0)}"/>`),
    ...ticksY.slice(1).map((l) => `<line class="grid" x1="${LEFT}" x2="${W - RIGHT}" y1="${Y(l)}" y2="${Y(l)}"/>`),
    `<line class="axis" x1="${LEFT}" x2="${W - RIGHT}" y1="${Y(0)}" y2="${Y(0)}"/>`,
    `<line class="axis" x1="${LEFT}" x2="${LEFT}" y1="${TOP}" y2="${Y(0)}"/>`,
    ...ticksX.map((v) => `<text x="${X(v)}" y="${Y(0) + 13}" text-anchor="middle">${N(v)}</text>`),
    ...ticksY.map((l) => `<text x="${LEFT - 5}" y="${Y(l) + 4}" text-anchor="end">${N(l)}</text>`),
    `<text x="${W - RIGHT}" y="${H - 1}" text-anchor="end">v (cm)</text>`,
    `<text x="${LEFT + 5}" y="${TOP + 9}">l′ (cm)</text>`,
    '<line class="ph-line" stroke-linecap="round"/>',
    '<circle class="ph-dot" r="5"/>',
  ].join('');
  const line = el.querySelector('.ph-line');
  const dot = el.querySelector('.ph-dot');
  let key = '';
  return {
    el,
    show(on, u, v) {
      const next = on ? `${u}|${v}` : 'off';
      if (next === key) return;
      key = next;
      el.classList.toggle('on', on);
      if (!on) return;
      // the line stops at the top of the graph or at the end of the rail
      const top = Math.min(V.max, (MAX_L * u) / FLAME.length);
      line.setAttribute('x1', String(X(0)));
      line.setAttribute('y1', String(Y(0)));
      line.setAttribute('x2', String(round(X(top), 1)));
      line.setAttribute('y2', String(round(Y(imageLength(u, top)), 1)));
      dot.setAttribute('cx', String(round(X(v), 1)));
      dot.setAttribute('cy', String(round(Y(imageLength(u, v)), 1)));
    },
  };
}
