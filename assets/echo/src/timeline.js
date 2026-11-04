// The time line in the panel (SVG): real time after the call starts, 0 to 0.6 s. Two lanes: the call, a bar of its real
// length from 0, and (once it has come back) the echo, the same bar starting at t = 2d ÷ 330. A strong mark at each
// bar's start shows the two moments the book's rule compares. A shaded crimson band runs from the call's start to 0.1 s
// (how long a sound stays with us): if the echo's start is inside it the two merge, beyond it the echo is heard apart.
// A crimson cursor moves while the slowed picture plays. Drawn at the panel's own pixel width (redrawn on resize), so
// its words keep their real size and stay crisp. Under the axis: the numbers, the band's words between ০ and ০.২ (the
// band ends at their middle), the unit between ০.৪ and ০.৬.
const NS = 'http://www.w3.org/2000/svg';
export const T_MAX = 0.6;

function el(name, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
}

/**
 * host: the element to fill. t(key, vars), N (digits). Returns { root, set({ cursor, echo, inside }) }:
 * cursor (s or null), echo (s or null: its bar's start), inside (whether the echo's start is within 0.1 s).
 */
export function createTimeline(host, t, N, { gap = 0.1, call = 0.35 } = {}) {
  const root = document.createElement('div');
  root.className = 'ec-tl';
  const svg = el('svg', { role: 'img', 'aria-label': t('tl_aria') });
  root.appendChild(svg);
  host.appendChild(root);
  let W = 0;
  let state = { cursor: null, echo: null, inside: false };
  let parts = null;

  function build(width) {
    W = Math.max(200, Math.round(width));
    // three sizes: compact (a narrow panel, or a phone where height is short), normal, large (a tall side panel)
    const fig = root.closest('.pvc');
    const fw = fig?.clientWidth ?? 800;
    const fh = fig?.clientHeight ?? 600;
    const compact = W < 300 || fh > fw || fh < 460;
    const large = !compact && fh >= 700 && W >= 340;
    const fs = compact ? 11.5 : large ? 15 : 13.5; // the words' size in px (the SVG is drawn 1:1)
    const L = 6;
    const R = W - 14;
    const top = 1;
    const lane = compact ? 14 : large ? 26 : 21;
    const laneB = top + lane + 2;
    const Y = laneB + lane + 3; // the axis
    const rowN = Y + fs + 5; // the numbers, the band's words and the unit
    const H = rowN + 4;
    const x = (s) => L + ((R - L) * Math.min(T_MAX, Math.max(0, s))) / T_MAX;
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.style.width = `${W}px`;
    svg.style.height = `${H}px`;
    svg.style.fontSize = `${fs}px`;
    el('rect', { x: x(0), y: top, width: x(gap) - x(0), height: Y - top, rx: 3, class: 'ec-tl-band' }, svg);
    // the axis, a tick and a number every 0.1 s (every 0.2 s for the numbers)
    el('line', { x1: L, y1: Y, x2: R + 4, y2: Y, class: 'ec-tl-axis' }, svg);
    el('path', { d: `M${R + 11},${Y} l-8,-4.5 v9 z`, class: 'ec-tl-head' }, svg);
    for (let k = 0; k <= 6; k++) {
      const s = k * 0.1;
      el('line', { x1: x(s), y1: Y, x2: x(s), y2: Y + (k % 2 ? 4 : 6), class: 'ec-tl-axis' }, svg);
      if (k % 2 === 0) {
        const n = el('text', { x: x(s), y: rowN, class: 'ec-tl-num', 'text-anchor': k === 0 ? 'start' : 'middle' }, svg);
        n.textContent = N(Math.round(s * 10) / 10);
      }
    }
    // the band's words in the room between ০ and ০.২, the unit between ০.৪ and ০.৬ (each shrunk if it must)
    const fit = (e, room) => {
      try {
        if (e.getComputedTextLength() > room) {
          e.setAttribute('textLength', String(room));
          e.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        }
      } catch {}
    };
    const bandL = x(0) + fs;
    const bandR = x(0.2) - fs * 1.2;
    const band = el('text', { x: (bandL + bandR) / 2, y: rowN, class: 'ec-tl-bandtext', 'text-anchor': 'middle' }, svg);
    band.textContent = t('tl_band', { gap: N(gap) });
    fit(band, bandR - bandL);
    const unit = el('text', { x: x(0.5), y: rowN, class: 'ec-tl-unit', 'text-anchor': 'middle' }, svg);
    unit.textContent = t('tl_unit');
    fit(unit, x(0.6) - x(0.4) - 2 * fs);
    // a bar with a strong mark at its start and its word inside; the echo's is moved to its start by draw(). The call's
    // word sits at the bar's far end, where the cursor never goes (it stops at the echo's start, 0.24 s at most)
    const bar = (cls, word, y, parent, end = false) => {
      const g = el('g', { class: cls }, parent);
      el('rect', { x: 0, y, width: x(call) - x(0), height: lane, rx: 2.5, class: 'ec-tl-bar' }, g);
      el('rect', { x: 0, y, width: 4, height: lane, class: 'ec-tl-start' }, g);
      const textX = end ? x(call) - x(0) - 7 : 9;
      const w = el('text', { x: textX, y: y + lane / 2 + fs * 0.36, class: 'ec-tl-word', 'text-anchor': end ? 'end' : 'start' }, g);
      w.textContent = word;
      return g;
    };
    bar('ec-tl-call', t('tl_call'), top, svg, true).setAttribute('transform', `translate(${x(0)},0)`);
    const echo = bar('ec-tl-echo', t('tl_echo'), laneB, svg);
    const cursor = el('line', { x1: 0, y1: top, x2: 0, y2: Y + 3, class: 'ec-tl-cursor' }, svg);
    parts = { x, echo, cursor };
    draw();
  }

  function draw() {
    if (!parts) return;
    const { x, echo, cursor } = parts;
    const { cursor: c, echo: e, inside } = state;
    cursor.style.display = c == null ? 'none' : '';
    if (c != null) {
      cursor.setAttribute('x1', String(x(c)));
      cursor.setAttribute('x2', String(x(c)));
    }
    echo.style.display = e == null ? 'none' : '';
    if (e != null) {
      echo.setAttribute('transform', `translate(${x(e)},0)`);
      echo.classList.toggle('inside', inside);
    }
  }

  let last = '';
  function set({ cursor: c = null, echo: e = null, inside = false }) {
    const key = `${c == null ? '' : c.toFixed(4)}|${e == null ? '' : e.toFixed(4)}|${inside}`;
    if (key === last) return;
    last = key;
    state = { cursor: c, echo: e, inside };
    draw();
  }
  let shape = '';
  const ro = new ResizeObserver(() => {
    const w = root.clientWidth;
    const fig = root.closest('.pvc');
    const key = `${w}|${fig?.clientWidth}|${fig?.clientHeight}`;
    if (w > 0 && key !== shape) {
      shape = key;
      build(w);
    }
  });
  ro.observe(root);
  const figEl = root.closest('.pvc');
  if (figEl) ro.observe(figEl);
  build(root.clientWidth || 300);
  return { root, set };
}
