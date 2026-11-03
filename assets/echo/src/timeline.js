// The time line in the panel (SVG): real time after the clap, 0 to 0.25 s. A shaded crimson band from 0 to 0.1 s
// (how long a sound stays with us), the clap at 0, the echo's mark at t = 2d ÷ 330 once it has come back, and a moving
// crimson cursor while the slowed pulse travels. The echo's mark inside the band means the two sounds merge.
// Drawn at the panel's own pixel width (redrawn on resize), so its words keep their real size and stay crisp. Rows,
// top to bottom: the marks' words (হাততালি at 0, প্রতিধ্বনি at its mark), the band with the marks, the axis and its
// numbers with the band's words between ০ and ০.১ and the unit after ০.২: nothing sits under the cursor or the marks.
const NS = 'http://www.w3.org/2000/svg';
export const T_MAX = 0.25;

function el(name, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
}

/**
 * host: the element to fill. t(key, vars), N (digits). Returns { root, set({ cursor, echo, inside }) }:
 * cursor (s or null), echo (s or null: its mark), inside (whether the echo is within 0.1 s).
 */
export function createTimeline(host, t, N, { gap = 0.1 } = {}) {
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
    const top = fs + 5; // the marks' words above the band
    const bandH = compact ? 12 : large ? 30 : 20;
    const Y = top + bandH; // the axis
    const rowN = Y + fs + 5; // the numbers, the band's words (between ০ and ০.১) and the unit (after ০.২)
    const H = rowN + 4;
    const x = (s) => L + ((R - L) * Math.min(T_MAX, Math.max(0, s))) / T_MAX;
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.style.width = `${W}px`;
    svg.style.height = `${H}px`;
    svg.style.fontSize = `${fs}px`;
    el('rect', { x: x(0), y: top, width: x(gap) - x(0), height: bandH, rx: 3, class: 'ec-tl-band' }, svg);
    // the axis, ticks every 0.05 s, numbers every 0.1 s
    el('line', { x1: L, y1: Y, x2: R + 4, y2: Y, class: 'ec-tl-axis' }, svg);
    el('path', { d: `M${R + 11},${Y} l-8,-4.5 v9 z`, class: 'ec-tl-head' }, svg);
    for (let k = 0; k <= 5; k++) {
      const s = k * 0.05;
      el('line', { x1: x(s), y1: Y, x2: x(s), y2: Y + (k % 2 ? 4 : 6), class: 'ec-tl-axis' }, svg);
      if (k % 2 === 0) {
        const n = el('text', { x: x(s), y: rowN, class: 'ec-tl-num', 'text-anchor': k === 0 ? 'start' : 'middle' }, svg);
        n.textContent = N(Math.round(s * 10) / 10);
      }
    }
    // the band's words under the band, between the ০ and the ০.১ (shrunk to fit there), the unit at the axis's end
    const band = el('text', { x: (x(0) + x(gap)) / 2 + 3, y: rowN, class: 'ec-tl-bandtext', 'text-anchor': 'middle' }, svg);
    band.textContent = t('tl_band', { gap: N(gap) });
    const room = x(gap) - x(0) - 2 * fs - 4;
    try {
      if (band.getComputedTextLength() > room) band.setAttribute('textLength', String(room));
      if (band.getComputedTextLength() > room) band.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    } catch {}
    const unit = el('text', { x: R + 12, y: rowN, class: 'ec-tl-unit', 'text-anchor': 'end' }, svg);
    unit.textContent = t('tl_unit');
    // the clap at 0 (ink) and its word, the echo (teal), the cursor (crimson)
    el('rect', { x: x(0), y: top - 2, width: 4, height: bandH + 2, rx: 1.5, class: 'ec-tl-clap' }, svg);
    const clapText = el('text', { x: x(0), y: top - 5, class: 'ec-tl-claptext', 'text-anchor': 'start' }, svg);
    clapText.textContent = t('tl_clap');
    const echo = el('g', { class: 'ec-tl-echo' }, svg);
    el('rect', { x: -2.5, y: top - 2, width: 5, height: bandH + 4, rx: 1.5 }, echo);
    const echoText = el('text', { x: 0, y: top - 5, 'text-anchor': 'start' }, svg);
    echoText.setAttribute('class', 'ec-tl-echotext');
    echoText.textContent = t('tl_echo');
    const cursor = el('line', { x1: 0, y1: top - 2, x2: 0, y2: Y + 3, class: 'ec-tl-cursor' }, svg);
    parts = { x, echo, echoText, clapText, cursor, R };
    draw();
  }

  function draw() {
    if (!parts) return;
    const { x, echo, echoText, clapText, cursor, R } = parts;
    const { cursor: c, echo: e, inside } = state;
    cursor.style.display = c == null ? 'none' : '';
    if (c != null) {
      cursor.setAttribute('x1', String(x(c)));
      cursor.setAttribute('x2', String(x(c)));
    }
    echo.style.display = e == null ? 'none' : '';
    echoText.style.display = e == null ? 'none' : '';
    if (e != null) {
      const px = x(e);
      echo.setAttribute('transform', `translate(${px},0)`);
      echo.classList.toggle('inside', inside);
      // the word over its mark, kept clear of হাততালি and inside the box
      let w = 60;
      let cw = 50;
      try {
        w = echoText.getComputedTextLength() || w;
        cw = clapText.getComputedTextLength() || cw;
      } catch {}
      const left = Math.min(R + 12 - w, Math.max(x(0) + cw + 8, px - w / 2));
      echoText.setAttribute('x', String(left));
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
