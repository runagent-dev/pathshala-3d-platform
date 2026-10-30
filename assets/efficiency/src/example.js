// "উদাহরণ": the book's worked example on page 121 as a sheet over the figure, with its numbers to play with. The
// question in the book's words, four steppers (the motor's power P in W, the time t in s, the mass m in kg, the height
// h in m: the book's 1000 W, 15 s, 100 kg and 10 m to start), and the book's answer line by line with the numbers of
// the steppers: কাজের পরিমাণ = m × g × h, প্রদত্ত শক্তি = P × t, শক্তির অপচয় = প্রদত্ত শক্তি − কাজের পরিমাণ, and
// কর্মদক্ষতা in both of the book's forms. With the book's numbers the answer carries "বইয়ের উত্তর"; when the work would
// be as large as the energy supplied, the sheet says it cannot happen (a machine always wastes some). "যন্ত্রে চালিয়ে
// দেখো" closes the sheet and runs the winch with these numbers. Each term in the sum is a button that lights its part
// of the machine (through onTerm).
import { ICONS } from '@shared/student/icons.js';
import { BOOK, EX_LIMITS, G, fixExample, groupJ, isBook, pct, solve } from './reading.js';

const KEYS = /** @type {const} */ (['P', 't', 'm', 'h']);
const UNIT = { P: 'W', t: 's', m: 'kg', h: 'm' };

/**
 * @param {{ root: HTMLElement, t: any, onRun: (run: { P: number, t: number, m: number, h: number }) => void,
 *   onTerm: (term: string) => void, onChange?: (state: object) => void }} o
 */
export function createExample({ root, t, onRun, onTerm, onChange = () => {} }) {
  const N = t.num;
  const J = (x) => `${N(groupJ(x))} J`;
  const el = document.createElement('div');
  el.className = 'ef-ex';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'ef-ex-title');
  const stepper = (k) => `
        <div class="ef-step k-${k}">
          <span class="ef-name">${t(`ex_name_${k}`)}</span>
          <div class="ef-ctl">
            <button type="button" class="ef-pm" data-ex-step="${k}" data-dir="-1" aria-label="${t('ex_less', { name: t(`ex_name_${k}`) })}">${ICONS.minus}</button>
            <output class="ef-val" data-ex-val="${k}"></output>
            <button type="button" class="ef-pm" data-ex-step="${k}" data-dir="1" aria-label="${t('ex_more', { name: t(`ex_name_${k}`) })}">${ICONS.plus}</button>
          </div>
        </div>`;
  el.innerHTML = `
    <div class="ef-ex-card">
      <div class="ef-ex-head">
        <h2 id="ef-ex-title"><span class="ef-ex-hand" aria-hidden="true">${ICONS.hand}</span>${t('ex_title')}</h2>
        <button type="button" class="ef-ex-x" data-ex="close" aria-label="${t('ex_close')}" title="${t('ex_close')}">${ICONS.close}</button>
      </div>
      <div class="ef-ex-body">
        <p class="ef-ex-q"></p>
        <div class="ef-ex-steps">${KEYS.map(stepper).join('')}</div>
        <p class="ef-ex-ans"><b>${t('ex_ans')}</b> <small>${t('ex_g')}</small></p>
        <ol class="ef-ex-lines"></ol>
      </div>
      <div class="ef-ex-foot">
        <button type="button" class="ef-ex-btn" data-ex="book">${ICONS.reset}<span>${t('ex_reset')}</span></button>
        <button type="button" class="ef-ex-btn primary" data-ex="run">${ICONS.play}<span>${t('ex_run')}</span></button>
      </div>
    </div>`;
  root.append(el);
  const $ = (sel) => /** @type {HTMLElement} */ (el.querySelector(sel));
  const st = { open: false, ...BOOK };
  let opener = /** @type {HTMLElement | null} */ (null);

  const term = (k, html) => `<button type="button" class="ef-term ${k}" data-term="${k}">${html}</button>`;
  const fr = (top, bottom) => `<span class="fr"><span>${top}</span><span>${bottom}</span></span>`;
  function state() {
    const r = solve(st);
    return {
      open: st.open,
      P: st.P,
      t: st.t,
      m: st.m,
      h: st.h,
      work: Math.round(r.work),
      input: Math.round(r.input),
      waste: Math.round(r.waste),
      eff: +pct(r.eff),
      possible: r.possible,
      book: isBook(st),
    };
  }
  function render() {
    const r = solve(st);
    $('.ef-ex-q').innerHTML = t('ex_q', { p: st.P, t: st.t, m: st.m, h: st.h });
    for (const k of KEYS) {
      const out = $(`[data-ex-val="${k}"]`);
      out.textContent = `${N(st[k])} ${UNIT[k]}`;
      for (const b of el.querySelectorAll(`[data-ex-step="${k}"]`)) {
        const dir = Number(/** @type {HTMLElement} */ (b).dataset.dir);
        /** @type {HTMLButtonElement} */ (b).disabled = dir < 0 ? st[k] <= EX_LIMITS[k].min : st[k] >= EX_LIMITS[k].max;
      }
    }
    const lines = [
      `${term('work', t('ex_work'))}: ${N(st.m)} × ${N(G)} × ${N(st.h)} J = <b class="c-work">${J(r.work)}</b>`,
      `${term('input', t('ex_input'))}: ${N(st.P)} × ${N(st.t)} J = <b class="c-input">${J(r.input)}</b>`,
    ];
    if (r.possible) {
      lines.push(`${term('waste', t('ex_waste'))}: ${J(r.input)} − ${J(r.work)} = <b class="c-waste">${J(r.waste)}</b>`);
      lines.push(
        `<span class="ef-eq">${t('ex_eff')} = ${fr(J(r.work), J(r.input))} × 100% = <b class="c-eff">${N(pct(r.eff))}%</b>${isBook(st) ? ` <span class="ef-book">${ICONS.check}${t('ex_book')}</span>` : ''}</span>` +
          `<span class="ef-eq ef-eq2">= ${fr(`${J(r.input)} − ${J(r.waste)}`, J(r.input))} × 100%</span>`,
      );
    } else lines.push(`<span class="ef-bad">${t('ex_bad', { w: groupJ(r.work), e: groupJ(r.input), c: 100 })}</span>`);
    $('.ef-ex-lines').innerHTML = lines.map((l) => `<li>${l}</li>`).join('');
    /** @type {HTMLButtonElement} */ ($('[data-ex="run"]')).disabled = !r.possible;
    /** @type {HTMLButtonElement} */ ($('[data-ex="book"]')).disabled = isBook(st);
    onChange(state());
  }

  el.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('button');
    if (!b || !el.contains(b)) return;
    e.stopPropagation();
    if (b.dataset.exStep) {
      const k = /** @type {'P' | 't' | 'm' | 'h'} */ (b.dataset.exStep);
      st[k] = fixExample(k, st[k] + Number(b.dataset.dir) * EX_LIMITS[k].step);
      render();
    } else if (b.dataset.term) onTerm(b.dataset.term);
    else if (b.dataset.ex === 'close') close();
    else if (b.dataset.ex === 'book') {
      Object.assign(st, BOOK);
      render();
    } else if (b.dataset.ex === 'run') {
      const run = { P: st.P, t: st.t, m: st.m, h: st.h };
      close();
      onRun(run);
    }
  });
  el.addEventListener('keydown', (e) => {
    e.stopPropagation(); // never the figure's scene keys
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const items = /** @type {HTMLElement[]} */ ([...el.querySelectorAll('button:not([disabled])')]);
      const i = items.indexOf(/** @type {HTMLElement} */ (document.activeElement));
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    }
  });

  function open(from = null) {
    opener = from;
    st.open = true;
    el.hidden = false;
    render();
    /** @type {HTMLElement} */ ($('.ef-ex-x')).focus({ preventScroll: true });
  }
  function close() {
    if (!st.open) return;
    st.open = false;
    el.hidden = true;
    opener?.focus?.({ preventScroll: true });
    onChange(state());
  }
  /** Set any of P, t, m, h (clamped to the steppers). */
  function set(p) {
    for (const k of KEYS) if (p[k] != null && Number.isFinite(+p[k])) st[k] = fixExample(k, +p[k]);
    render();
  }
  return {
    open,
    close,
    set,
    get state() {
      return state();
    },
    get isOpen() {
      return st.open;
    },
  };
}
