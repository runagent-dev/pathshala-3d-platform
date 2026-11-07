// The graph in the panel: the refractive index of the prism's glass against the wavelength (its colour), the curve the
// book's sentence describes ("ভিন্ন ভিন্ন রঙের জন্য প্রতিসরণাঙ্ক ভিন্ন"). Drawn as an SVG in real pixels for its box (redrawn
// when the box changes size), numbers 12 px or more. Before the white light, only the red light's point is shown; with
// white light, the curve in the spectrum's colours and a dot per colour (each a button: a tap picks that colour).
import { COLOURS, cssColour, indexAt, RED_NM, round3 } from './reading.js';

const NS = 'http://www.w3.org/2000/svg';
const N_RANGE = [1.511, 1.536];
const NM_RANGE = [400, 700];

export function createGraph(host, t, { onPick }) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pvc-graph pd-graph-svg');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', t('g_aria'));
  host.append(svg);
  let w = 0;
  let h = 0;
  let last = '';
  let state = { full: false, pick: null };

  const el = (name, attrs, parent = svg) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    parent.append(e);
    return e;
  };

  function draw() {
    const r = host.getBoundingClientRect();
    w = Math.round(r.width);
    h = Math.round(r.height);
    const key = `${w}x${h}|${state.full}|${state.pick}`;
    if (key === last) return;
    last = key;
    svg.replaceChildren();
    if (w < 120 || h < 60) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    const small = h < 110;
    const left = 44;
    const right = 12;
    const top = small ? 22 : 26;
    const bottom = small ? 30 : 36;
    const pw = w - left - right;
    const ph = h - top - bottom;
    const X = (nm) => left + ((nm - NM_RANGE[0]) / (NM_RANGE[1] - NM_RANGE[0])) * pw;
    const Y = (n) => top + (1 - (n - N_RANGE[0]) / (N_RANGE[1] - N_RANGE[0])) * ph;

    // title
    el('text', { x: 2, y: 12, class: 'g-title' }).textContent = t('g_title');
    // the spectrum along the wavelength axis, as a gradient
    const defs = el('defs', {});
    const grad = el('linearGradient', { id: 'pd-spec', x1: X(400), x2: X(700), y1: 0, y2: 0, gradientUnits: 'userSpaceOnUse' }, defs);
    for (let nm = 400; nm <= 700; nm += 20) el('stop', { offset: (nm - 400) / 300, 'stop-color': cssColour(nm) }, grad);
    // grid and axes
    for (const n of [1.52, 1.53]) {
      el('line', { x1: left, x2: left + pw, y1: Y(n), y2: Y(n), class: 'grid' });
      el('text', { x: left - 6, y: Y(n) + 4, 'text-anchor': 'end', class: 'g-num' }).textContent = t.num(n.toFixed(2));
    }
    el('path', { d: `M${left},${top} V${top + ph} H${left + pw}`, class: 'axis' });
    el('rect', { x: X(400), y: top + ph + 2, width: pw, height: 6, fill: 'url(#pd-spec)', rx: 2 });
    for (const nm of [400, 500, 600, 700])
      el('text', { x: X(nm), y: top + ph + 20, 'text-anchor': nm === 700 ? 'end' : 'middle', class: 'g-num' }).textContent = t.num(nm);
    if (!small) el('text', { x: left + pw / 2, y: h - 2, 'text-anchor': 'middle', class: 'g-name' }).textContent = t('g_axis_nm');

    // the book's table value for glass, at yellow light
    el('line', { x1: left, x2: left + pw, y1: Y(1.52), y2: Y(1.52), class: 'g-book' });
    if (!small && state.full)
      el('text', { x: left + 6, y: Y(1.52) + 14, 'text-anchor': 'start', class: 'g-tag' }).textContent = t('g_book', { n: '1.52' });

    if (state.full) {
      // the curve, in the colours
      let d = '';
      for (let nm = 400; nm <= 700; nm += 5) d += `${nm === 400 ? 'M' : 'L'}${X(nm).toFixed(1)},${Y(indexAt(nm)).toFixed(1)}`;
      el('path', { d, class: 'g-curve', stroke: 'url(#pd-spec)' });
      for (const c of COLOURS) {
        const g = el('g', {
          class: `g-pick${state.pick === c.id ? ' on' : ''}`,
          role: 'button',
          tabindex: 0,
          'data-colour': c.id,
          'aria-label': t('g_pick', { c: t(`c_${c.id}`), n: round3(indexAt(c.nm)).toFixed(3) }),
          'aria-pressed': String(state.pick === c.id),
        });
        const x = X(c.nm);
        const y = Y(indexAt(c.nm));
        el('circle', { cx: x, cy: y, r: 15, class: 'g-hit' }, g);
        if (state.pick === c.id) el('circle', { cx: x, cy: y, r: 9.5, class: 'g-ring' }, g);
        el('circle', { cx: x, cy: y, r: 6, fill: cssColour(c.nm), class: 'g-dot' }, g);
      }
      // the picked colour's value is in the result line; here only its ring
    } else {
      // only the red light, so far
      const x = X(RED_NM);
      const y = Y(indexAt(RED_NM));
      el('circle', { cx: x, cy: y, r: 6, fill: cssColour(RED_NM), class: 'g-dot' });
      // its value to the left of the dot, on a white chip so the dashed 1.52 line never runs through the words
      const txt = el('text', { x: x - 14, y: y + 4, 'text-anchor': 'end', class: 'g-val' });
      txt.textContent = t('g_pick', { c: t('c_red'), n: round3(indexAt(RED_NM)).toFixed(3) });
      const bb = txt.getBBox();
      const chip = document.createElementNS(NS, 'rect');
      for (const [k, v] of Object.entries({ x: bb.x - 3, y: bb.y - 1, width: bb.width + 6, height: bb.height + 2, rx: 3, class: 'g-chip' }))
        chip.setAttribute(k, String(v));
      svg.insertBefore(chip, txt);
    }
  }

  svg.addEventListener('click', (e) => {
    const g = /** @type {Element} */ (e.target).closest('[data-colour]');
    if (g) onPick(g.getAttribute('data-colour'));
  });
  svg.addEventListener('keydown', (e) => {
    const g = /** @type {Element} */ (e.target).closest('[data-colour]');
    if (g && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      onPick(g.getAttribute('data-colour'));
    }
  });
  const ro = new ResizeObserver(() => draw());
  ro.observe(host);

  return {
    set(next) {
      state = { ...state, ...next };
      draw();
      // keep the keyboard focus on the picked dot after a redraw
      if (next.focus) svg.querySelector(`[data-colour="${state.pick}"]`)?.focus();
    },
    draw,
    dispose() {
      ro.disconnect();
    },
  };
}
