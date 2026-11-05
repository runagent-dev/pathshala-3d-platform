// The small graph in the panel: Fresnel's curve for glass, how much is reflected against the angle of incidence, with a dot at
// the angle shown. Plain SVG drawn at its real size, so that its 12 px words stay 12 px in any panel, from the same numbers as
// the 3D view.
import { fresnel, STOPS } from './reading.js';

const NS = 'http://www.w3.org/2000/svg';
const PAD = { l: 35, r: 10, t: 6, b: 18 };

export function createGraph(t) {
  const N = t.num;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pvc-graph ra-graph');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', t('graph_aria'));
  let W = 300;
  let H = 100;
  let now = 30;
  const gx = (a) => PAD.l + (a / 90) * (W - PAD.l - PAD.r);
  const gy = (r) => H - PAD.b - r * (H - PAD.b - PAD.t);
  function curve() {
    let d = '';
    for (let a = 0; a <= 90; a += a < 70 ? 5 : 0.5) d += `${d ? 'L' : 'M'}${gx(a).toFixed(1)} ${gy(fresnel(a)).toFixed(1)}`;
    return d;
  }
  function draw() {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const ticksX = [0, 30, 60, 90]
      .map(
        (a) =>
          `<line class="grid" x1="${gx(a)}" x2="${gx(a)}" y1="${PAD.t}" y2="${gy(0)}"/><text x="${gx(a)}" y="${H - 4}" text-anchor="middle">${N(a)}°</text>`,
      )
      .join('');
    const ticksY = [0, 50, 100]
      .map(
        (p) =>
          `<line class="grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${gy(p / 100)}" y2="${gy(p / 100)}"/><text x="${PAD.l - 5}" y="${gy(p / 100) + 4}" text-anchor="end">${N(p)}%</text>`,
      )
      .join('');
    svg.innerHTML = `${ticksX}${ticksY}
      <path class="axis" d="M${PAD.l} ${PAD.t}V${gy(0)}H${W - PAD.r}"/>
      <path class="ra-curve" d="${curve()}"/>
      <text class="ra-gx" x="${gx(44)}" y="${gy(0.05) - 5}" text-anchor="middle">${t('g_x')}</text>
      <text class="ra-gy" x="${gx(4)}" y="${PAD.t + 12}">${t('g_y')}</text>
      <line class="ra-drop" y1="${gy(0)}"/>
      ${STOPS.map((a) => `<circle class="ra-stop" r="2.4" cx="${gx(a)}" cy="${gy(fresnel(a))}"/>`).join('')}
      <circle class="ra-now" r="5.5"/>`;
    place();
  }
  function place() {
    const x = gx(now).toFixed(1);
    const y = gy(fresnel(now)).toFixed(1);
    const dot = svg.querySelector('.ra-now');
    const drop = svg.querySelector('.ra-drop');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    drop.setAttribute('x1', x);
    drop.setAttribute('x2', x);
    drop.setAttribute('y2', y);
  }
  draw();
  new ResizeObserver(() => {
    const r = svg.getBoundingClientRect();
    if (r.width < 40 || r.height < 30) return;
    W = Math.round(r.width);
    H = Math.round(r.height);
    draw();
  }).observe(svg);
  return {
    el: svg,
    set(a) {
      if (a === now) return;
      now = a;
      place();
    },
  };
}
