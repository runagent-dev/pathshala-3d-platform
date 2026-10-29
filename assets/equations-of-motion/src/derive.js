// "সমীকরণ কীভাবে এল": the derivation sheet, a closable overlay inside the figure. Four steps from the বেগ–সময় গ্রাফ:
// the slope (v = u + at), the area as a rectangle and a triangle (s = ut + ½at²), the fold (V = (u + v)/2, s = Vt)
// and t taken out (v² = u² + 2as, as the book does it: t from v = u + at put into s = (u + v)/2 × t). Each step has a
// small graph with the part in use lit in its colour, one plain sentence, then the formula line by line ("পরের ধাপ"
// shows the next line, "আগের ধাপ" goes back), each line with the student's own numbers, so the same answer
// visibly comes out each way. The graph is SVG (crisp, coloured from style.css); the numbers come from motion.js.
import { ICONS } from '@shared/student/icons.js';
import { swapTriangles } from './graph.js';
import { derivation, fmt, niceAxis, solve } from './motion.js';

/** The lines of each step (i18n keys dv_f_<id> / dv_n_<id>) and what the small graph lights at each part. */
export const STEPS = [
  { lines: ['1a', '1b', '1c'], lit: [['line'], ['slope'], ['slope'], ['slope', 'v']] },
  { lines: ['2a', '2b', '2c', '2d'], lit: [['area'], ['rect'], ['rect', 'tri'], ['rect', 'tri'], ['rect', 'tri']] },
  { lines: ['3a', '3b', '3c'], lit: [['V'], ['V'], ['fold'], ['Vt']] },
  { lines: ['4a', '4b', '4c', '4d'], lit: [['area'], ['slope'], ['Vt', 'noT'], ['area', 'noT'], ['area', 'noT']] },
];

const SYM = /[uvatsV]/g;
/** A formula with its Latin letters coloured (Bangla words and signs as they are). */
export const colour = (f) => f.replace(SYM, (c) => `<i class="q-${c}">${c}</i>`);
/** The same inside the SVG graph (an HTML <i> would end the SVG there). */
const tspans = (f) => f.replace(SYM, (c) => `<tspan class="q-${c}">${c}</tspan>`);

/**
 * @param {{ root: HTMLElement, t: any, onChange?: (state: { open: boolean, step: number, part: number }) => void }} o
 */
export function createDerivation({ root, t, onChange = () => {} }) {
  const N = t.num;
  const n = (x, d = 2) => N(fmt(x, d));
  const p = (x) => (x < 0 ? `(${n(x)})` : n(x));
  const el = document.createElement('div');
  el.className = 'eom-dv';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'eom-dv-title');
  el.innerHTML = `
    <div class="eom-dv-card">
      <div class="eom-dv-head">
        <h2 id="eom-dv-title">${t('derive')}</h2>
        <button type="button" class="eom-dv-x" data-dv="close" aria-label="${t('dv_close')}" title="${t('dv_close')}">${ICONS.close}</button>
      </div>
      <div class="eom-dv-tabs" role="tablist" aria-label="${t('dv_steps')}">
        ${STEPS.map((_, i) => `<button type="button" role="tab" data-dv-step="${i + 1}"><b>${N(i + 1)}</b><span>${t(`dv_step_${i + 1}`)}</span></button>`).join('')}
      </div>
      <div class="eom-dv-body">
        <div class="eom-dv-fig"><svg viewBox="0 0 320 180" role="img" aria-hidden="true"></svg></div>
        <div class="eom-dv-text">
          <p class="eom-dv-yours"></p>
          <p class="eom-dv-say"></p>
          <ol class="eom-dv-lines"></ol>
        </div>
      </div>
      <div class="eom-dv-foot">
        <button type="button" class="eom-dv-nav" data-dv="prev">${ICONS.chevL}<span>${t('dv_prev')}</span></button>
        <span class="eom-dv-dots" aria-hidden="true"></span>
        <button type="button" class="eom-dv-nav primary" data-dv="next"><span>${t('dv_next')}</span>${ICONS.chevR}</button>
      </div>
    </div>`;
  root.append(el);
  const $ = (sel) => el.querySelector(sel);
  const svg = $('.eom-dv-fig svg');
  const st = { open: false, step: 1, part: 0, plan: { u: 4, a: 1, t: 6 } };
  let opener = null;

  /** The numbers of every line for the plan, already in the language's digits. */
  function vars() {
    const { u, a, t: tt } = st.plan;
    const r = solve(st.plan);
    const d = derivation(st.plan);
    return {
      u: n(u),
      v: n(r.v),
      a: p(a),
      t: n(tt),
      at: p(d.slope.at),
      dv: p(d.slope.dv),
      ut: n(d.area.rect),
      half: p(d.area.tri),
      aR: n(a),
      atR: n(d.slope.at),
      halfR: n(d.area.tri),
      tasR: n(d.noTime.twoAS),
      s: n(r.s),
      V: n(d.fold.V),
      tas: p(d.noTime.twoAS),
      v2: n(d.noTime.v2),
      u2: n(d.noTime.u2),
      k2: N(2),
      k0: N(0),
    };
  }

  // ── the small graph ──
  const X0 = 40;
  const X1 = 296;
  const Y0 = 150;
  const Y1 = 22;
  function graphSVG(lit) {
    const { u, a, t: tt } = st.plan;
    const v = u + a * tt;
    const V = (u + v) / 2;
    const VM = niceAxis(Math.max(u, v, 1) * 1.18).max;
    const x = (k) => X0 + (k / tt) * (X1 - X0);
    const y = (k) => Y0 - (k / VM) * (Y0 - Y1);
    const on = (k) => lit.includes(k);
    const pts = (list) => list.map(([a0, b0]) => `${x(a0).toFixed(1)},${y(b0).toFixed(1)}`).join(' ');
    const out = [];
    const txt = (cls, tx, ty, s, anchor = 'middle', extra = '') =>
      `<text class="${cls}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}"${extra}>${s}</text>`;
    // grid and the area under the line, faint
    out.push(`<rect class="g-card" x="0" y="0" width="320" height="180"/>`);
    for (let k = 1; k <= tt; k++) out.push(`<line class="g-grid" x1="${x(k)}" y1="${Y0}" x2="${x(k)}" y2="${Y1}"/>`);
    out.push(
      `<polygon class="g-area${on('area') ? ' on' : ''}" points="${pts([
        [0, 0],
        [0, u],
        [tt, v],
        [tt, 0],
      ])}"/>`,
    );
    // the parts in use
    if (on('rect')) out.push(`<rect class="g-rect" x="${x(0)}" y="${y(u)}" width="${x(tt) - x(0)}" height="${Y0 - y(u)}"/>`);
    if (on('tri') && Math.abs(a) > 1e-9)
      out.push(
        `<polygon class="g-tri${a < 0 ? ' minus' : ''}" points="${pts([
          [0, u],
          [tt, u],
          [tt, v],
        ])}"/>`,
      );
    if (on('Vt') || on('fold')) out.push(`<rect class="g-vt" x="${x(0)}" y="${y(V)}" width="${x(tt) - x(0)}" height="${Y0 - y(V)}"/>`);
    if (on('fold') && Math.abs(a) > 1e-9) {
      const { piece, gap } = swapTriangles({ u, a, t: tt, v, V });
      out.push(`<polygon class="g-was" points="${pts(piece)}"/>`);
      out.push(`<polygon class="g-tri" points="${pts(gap)}"/>`);
      // a curved arrow from where it was to where it went
      const c = (tri) => tri.reduce((acc, [a0, b0]) => [acc[0] + a0 / 3, acc[1] + b0 / 3], [0, 0]);
      const [fa, fb] = c(piece);
      const [ga, gb] = c(gap);
      const mx = (x(fa) + x(ga)) / 2;
      const my = Math.min(y(fb), y(gb)) - 26;
      out.push(`<path class="g-arrow" d="M${x(fa)},${y(fb) - 6} Q${mx},${my} ${x(ga)},${y(gb) - 6}" marker-end="url(#eom-dv-head)"/>`);
    }
    if (on('slope') && Math.abs(a) > 1e-9) {
      out.push(
        `<polygon class="g-slope" points="${pts([
          [0, u],
          [tt, u],
          [tt, v],
        ])}"/>`,
      );
      out.push(`<line class="g-t" x1="${x(0)}" y1="${y(u)}" x2="${x(tt)}" y2="${y(u)}"/>`);
      out.push(`<line class="g-dv" x1="${x(tt)}" y1="${y(u)}" x2="${x(tt)}" y2="${y(v)}"/>`);
    }
    // axes
    out.push(`<path class="g-axis" d="M${X0},${Y1 - 10} L${X0},${Y0} L${X1 + 12},${Y0}"/>`);
    out.push(
      `<path class="g-axis-head" d="M${X0 - 4},${Y1 - 4} L${X0},${Y1 - 12} L${X0 + 4},${Y1 - 4}Z M${X1 + 8},${Y0 - 4} L${X1 + 16},${Y0} L${X1 + 8},${Y0 + 4}Z"/>`,
    );
    // V, dashed
    if (on('V') || on('fold') || on('Vt')) {
      out.push(`<line class="g-V" x1="${x(0)}" y1="${y(V)}" x2="${x(tt)}" y2="${y(V)}"/>`);
      out.push(`<circle class="g-mid" cx="${x(tt / 2)}" cy="${y(V)}" r="4"/>`);
    }
    // the velocity line
    out.push(`<line class="g-line${on('slope') ? ' slope' : ''}" x1="${x(0)}" y1="${y(u)}" x2="${x(tt)}" y2="${y(v)}"/>`);
    out.push(`<circle class="g-u" cx="${x(0)}" cy="${y(u)}" r="4"/><circle class="g-v" cx="${x(tt)}" cy="${y(v)}" r="${on('v') ? 5.5 : 4}"/>`);
    // labels: u and V on the left, v at the end, t under the axis, the parts inside them
    out.push(txt('l-u', X0 - 6, y(u) + 5, 'u', 'end'));
    if ((on('V') || on('fold') || on('Vt')) && Math.abs(y(V) - y(u)) > 13) out.push(txt('l-V', X0 - 6, y(V) + 5, 'V', 'end'));
    out.push(txt('l-v', x(tt) + 7, y(v) + 5, 'v', 'start'));
    out.push(txt(`l-t${on('noT') ? ' gone' : ''}`, x(tt), Y0 + 18, 't'));
    if (on('noT')) out.push(`<line class="g-gone" x1="${x(tt) - 8}" y1="${Y0 + 20}" x2="${x(tt) + 8}" y2="${Y0 + 5}"/>`);
    out.push(txt('l-o', X0 - 6, Y0 + 5, N(0), 'end'));
    if (on('slope') && Math.abs(a) > 1e-9) {
      out.push(txt('l-t', (x(0) + x(tt)) / 2, y(u) + (a > 0 ? 16 : -7), 't'));
      out.push(txt('l-dv', x(tt) - 6, (y(u) + y(v)) / 2 + 5, tspans('v − u'), 'end'));
    }
    // the rectangle's name inside it, under the line (when braking the line crosses the rectangle)
    if (on('rect') && Y0 - y(u) > 20) {
      const lx = a < 0 ? tt * 0.28 : tt / 2;
      const ly = a < 0 ? (u + a * lx) * 0.42 : u / 2;
      out.push(txt('l-rect', x(lx), y(ly) + 6, tspans('ut')));
    }
    if (on('tri') && Math.abs(y(v) - y(u)) > 22) out.push(txt('l-tri', x((tt * 2) / 3), y(u + (v - u) / 3) + 5, tspans('½at²')));
    if (on('Vt') && !on('rect') && Y0 - y(V) > 20) out.push(txt('l-vt', (x(0) + x(tt)) / 2, (Y0 + y(V)) / 2 + 6, tspans('Vt')));
    if (on('area') && !on('rect') && !on('Vt') && Y0 - y(Math.min(u, v)) > 20)
      out.push(txt('l-s', (x(0) + x(tt)) / 2, (Y0 + y(Math.min(u, v))) / 2 + 6, tspans('s')));
    svg.innerHTML = `<defs><marker id="eom-dv-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="g-head"/></marker></defs>${out.join('')}`;
  }

  // ── the text ──
  const lastPart = () => STEPS[st.step - 1].lines.length;
  function render() {
    const step = STEPS[st.step - 1];
    const { a } = st.plan;
    const zero = Math.abs(a) < 1e-9;
    const V0 = vars();
    for (const b of el.querySelectorAll('[data-dv-step]')) {
      const on = Number(/** @type {HTMLElement} */ (b).dataset.dvStep) === st.step;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    $('.eom-dv-yours').innerHTML =
      `${t('dv_yours')}: ${colour('u')} = ${V0.u} ${t('u_ms')} · ${colour('a')} = ${N(fmt(a))} ${t('u_ms2')} · ${colour('t')} = ${V0.t} ${t('u_s')}`;
    const sayKey = `dv_say_${st.step}${zero ? '_zero' : st.step === 2 && a < 0 ? '_down' : ''}`;
    $('.eom-dv-say').textContent = t(sayKey);
    const last = step.lines.length;
    $('.eom-dv-lines').innerHTML = step.lines
      .map((id, i) => {
        const nKey = id === '4a' && zero ? 'dv_n_4a_zero' : `dv_n_${id}`;
        const res = i === last - 1;
        const same =
          res && st.part >= last
            ? `<span class="eom-dv-ok">${ICONS.check}${st.step === 2 || st.step === 3 ? `<span>${t('dv_same')}</span>` : ''}</span>`
            : '';
        return `<li class="eom-dv-line${res ? ' res' : ''}${i < st.part ? ' in' : ''}"${i < st.part ? '' : ' aria-hidden="true"'}><span class="f">${colour(t(`dv_f_${id}`))}</span><span class="n">${t(nKey, V0)}${same}</span></li>`;
      })
      .join('')
      .concat(
        // after the fold, the book's own way to the same equation
        st.step === 3 && !zero ? `<li class="eom-dv-line note${st.part >= last ? ' in' : ''}">${colour(t('dv_book'))}</li>` : '',
      );
    $('.eom-dv-dots').innerHTML = Array.from({ length: last + 1 }, (_, i) => `<i class="${i <= st.part ? 'on' : ''}"></i>`).join('');
    graphSVG(step.lit[Math.min(st.part, step.lit.length - 1)]);
    const prev = /** @type {HTMLButtonElement} */ ($('[data-dv="prev"]'));
    const next = /** @type {HTMLButtonElement} */ ($('[data-dv="next"]'));
    prev.disabled = st.step === 1 && st.part === 0;
    // at the very end the forward button closes the sheet
    const end = st.step === STEPS.length && st.part >= last;
    next.dataset.end = String(end);
    const label = /** @type {HTMLElement} */ (next.querySelector('span'));
    label.textContent = t(end ? 'dv_close' : 'dv_next');
    onChange({ open: st.open, step: st.step, part: st.part });
  }

  function go(step, part) {
    st.step = Math.min(STEPS.length, Math.max(1, step));
    st.part = Math.min(lastPart(), Math.max(0, part));
    render();
  }
  function next() {
    if (st.part < lastPart()) go(st.step, st.part + 1);
    else if (st.step < STEPS.length) go(st.step + 1, 0);
    else close();
  }
  function prev() {
    if (st.part > 0) go(st.step, st.part - 1);
    else if (st.step > 1) {
      st.step -= 1;
      go(st.step, lastPart());
    }
  }
  function open(step = st.step, part = 0) {
    if (!st.open) opener = /** @type {HTMLElement | null} */ (document.activeElement);
    st.open = true;
    el.hidden = false;
    root.classList.add('eom-dv-open');
    go(step, part);
    /** @type {HTMLElement} */ ($('[data-dv="next"]')).focus({ preventScroll: true });
  }
  function close() {
    if (!st.open) return;
    st.open = false;
    el.hidden = true;
    root.classList.remove('eom-dv-open');
    onChange({ open: false, step: st.step, part: st.part });
    if (opener && root.contains(opener)) opener.focus({ preventScroll: true });
  }

  el.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (b?.dataset.dvStep) go(Number(b.dataset.dvStep), 0);
    else if (b?.dataset.dv === 'next') next();
    else if (b?.dataset.dv === 'prev') prev();
    else if (b?.dataset.dv === 'close') close();
    else if (e.target === el) close(); // a tap on the backdrop
    e.stopPropagation();
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' && !(/** @type {Element} */ (e.target).closest('[role="tab"]'))) next();
    else if (e.key === 'ArrowLeft' && !(/** @type {Element} */ (e.target).closest('[role="tab"]'))) prev();
    else if (e.key === 'Tab') {
      // focus stays inside the sheet
      const list = [...el.querySelectorAll('button:not(:disabled)')];
      const i = list.indexOf(/** @type {Element} */ (document.activeElement));
      if (e.shiftKey && i <= 0) /** @type {HTMLElement} */ (list[list.length - 1]).focus();
      else if (!e.shiftKey && i === list.length - 1) /** @type {HTMLElement} */ (list[0]).focus();
      else return e.stopPropagation();
    } else return e.stopPropagation();
    e.preventDefault();
    e.stopPropagation();
  });
  // a finger on the sheet never reaches the 3D view under it
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) el.addEventListener(type, (e) => e.stopPropagation());

  return {
    el,
    open,
    close,
    go,
    next,
    prev,
    get state() {
      return { open: st.open, step: st.step, part: st.part };
    },
    /** The student's plan changed: the numbers follow. */
    setPlan(plan) {
      st.plan = { u: plan.u, a: plan.a, t: plan.t };
      if (st.open) render();
    },
  };
}
