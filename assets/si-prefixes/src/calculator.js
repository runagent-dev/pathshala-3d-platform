// The prefix calculator (the ক্যালকুলেটর tab): the student types a number on the keypad, picks the unit it is in and
// the unit they want, and reads the answer with the working: "১ km = ১০³ ÷ ১০⁰ m = ১০³ m", then
// "২.৫ km = ২.৫ × ১০³ m = ২,৫০০ m". The answer is exact (./convert.js moves the decimal point; no rounding).
// It also names the tour's object nearest to that length, and the 3D flies there (onLook).
import { ICONS, svg } from '@shared/student/icons.js';
import { convertValue, groupIndian, nearestStop, parseInput, plain, press, scientific } from './convert.js';
import { BN_DIGITS as BN, PREFIXES, SIZES } from './i18n.js';

const UNITS = PREFIXES.slice().reverse(); // smallest first, like the stops
const EXP = Object.fromEntries(PREFIXES.map((p) => [p.key, p.exp]));
const SWAP = svg('<path d="M8 4v16M8 20l-3.5-3.5M8 20l3.5-3.5M16 20V4M16 4l-3.5 3.5M16 4l3.5 3.5"/>');
const BACK = svg('<path d="M9 5h11v14H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/>');

/** km, cm, µm, m … */
export const symbolOf = (key) => (key === 'base' ? 'm' : `${key}m`);

/**
 * @param {HTMLElement} host  the tab panel to fill
 * @param {(k: string, v?: object) => string} t
 * @param {{ value?: string, from?: string, to?: string, onLook?: (id: string) => void, onChange?: (s: object) => void }} [opts]
 */
export function createCalculator(host, t, { value = '1', from = 'k', to = 'base', onLook, onChange } = {}) {
  const N = t.num;
  const pow = (n) => `${N(10)}<sup>${n < 0 ? '−' : ''}${N(Math.abs(n))}</sup>`;
  const unitName = (key) => t(`u_${key}`);
  const sym = (key) => `<span class="hb-sym">${symbolOf(key)}</span>`;
  const keys = [
    ['7', '8', '9', 'back'],
    ['4', '5', '6', 'clear'],
    ['1', '2', '3', 'exp'],
    ['0', '.', 'neg', 'swap'],
  ];
  const keyFace = {
    back: BACK,
    clear: t('key_clear'),
    exp: `×${N(10)}<sup>n</sup>`,
    neg: '(−)',
    swap: SWAP,
    '.': '.',
  };
  const keyLabel = { back: 'key_back', clear: 'key_clear_long', exp: 'key_exp', neg: 'key_neg', swap: 'key_swap', '.': 'key_point' };

  host.innerHTML = `
    <div class="hb-display">
      <div class="hb-io" role="group" aria-label="${t('calc_from')}">
        <button type="button" class="hb-unit" data-pick="from" aria-haspopup="dialog" aria-expanded="false"></button>
        <output class="hb-num" data-in></output>
      </div>
      <div class="hb-io to" role="group" aria-label="${t('calc_to')}">
        <button type="button" class="hb-unit" data-pick="to" aria-haspopup="dialog" aria-expanded="false"></button>
        <output class="hb-num" data-out aria-live="polite"></output>
      </div>
    </div>
    <div class="hb-work">
      <p class="hb-w1" data-w1></p>
      <p class="pvc-formula hb-w2" data-w2></p>
      <p class="hb-w3" data-w3></p>
    </div>
    <div class="hb-keys">${keys
      .flat()
      .map(
        (k) =>
          `<button type="button" data-key="${k}"${keyLabel[k] ? ` aria-label="${t(keyLabel[k])}" title="${t(keyLabel[k])}"` : ''}${/\d/.test(k) ? '' : ' class="op"'}><span>${keyFace[k] ?? N(k)}</span></button>`,
      )
      .join('')}</div>
    <div class="hb-picker" role="dialog" hidden>
      <div class="hb-pick-head"><b></b><button type="button" class="pvc-icon" data-close aria-label="${t('pick_close')}" title="${t('pick_close')}">${ICONS.close}</button></div>
      <div class="hb-pick-grid">${UNITS.map(
        (u) =>
          `<button type="button" data-unit="${u.key}" aria-label="${unitName(u.key)}"><b>${u.key === 'base' ? t('base_name') : t(`p_${u.key}`)}</b><small>${symbolOf(u.key)} = ${pow(u.exp)} m</small></button>`,
      ).join('')}</div>
    </div>`;
  const $ = (s) => /** @type {HTMLElement} */ (host.querySelector(s));
  const el = {
    from: $('[data-pick="from"]'),
    to: $('[data-pick="to"]'),
    inp: $('[data-in]'),
    out: $('[data-out]'),
    w1: $('[data-w1]'),
    w2: $('[data-w2]'),
    w3: $('[data-w3]'),
    picker: $('.hb-picker'),
    pickTitle: $('.hb-pick-head b'),
    neg: $('[data-key="neg"]'),
  };

  const s = { mant: String(value), exp: null, from: EXP[from] != null ? from : 'k', to: EXP[to] != null ? to : 'base' };
  let picking = null; // 'from' | 'to' while the unit list is open
  let lookTimer = 0;
  let looked = null;

  /** What the student typed, as it reads: grouped, Bangla digits, "× ১০⁻³" once ×10ⁿ was pressed. */
  function typedHTML() {
    const [w, f] = s.mant.split('.');
    let h = N(`${w ? groupIndian(w) : '0'}${f != null ? `.${f}` : ''}`);
    if (s.exp != null) {
      const e = s.exp;
      h += ` <span class="op">×</span> ${N(10)}<sup>${e.startsWith('-') ? '−' : ''}${e.replace('-', '') ? N(e.replace('-', '')) : '<i class="hb-caret"></i>'}</sup>`;
    }
    return h;
  }
  /** A value as the student reads it: in full if that is short, else a × 10ⁿ. */
  function numHTML(v, { maxInt = 12 } = {}) {
    const p = plain(v, { maxInt, maxZeros: 8 });
    if (p != null) return N(p);
    const { mant, exp } = scientific(v);
    return `${N(mant)} <span class="op">×</span> ${pow(exp)}`;
  }
  const fit = (node, html) => {
    node.innerHTML = html;
    const len = node.textContent.length;
    node.dataset.len = len > 15 ? 'xl' : len > 11 ? 'l' : '';
  };

  function render() {
    el.from.innerHTML = `<span>${unitName(s.from)}</span>${ICONS.chevR}`;
    el.to.innerHTML = `<span>${unitName(s.to)}</span>${ICONS.chevR}`;
    fit(el.inp, typedHTML());
    el.neg.disabled = s.exp == null;
    const v = parseInput(s.mant, s.exp === '-' ? '' : s.exp);
    const fe = EXP[s.from];
    const te = EXP[s.to];
    const k = fe - te;
    const r = convertValue(v, fe, te);
    fit(el.out, `<span class="op">=</span> ${numHTML(r)}`);
    const one = (key) => `${N(1)} ${sym(key)}`;
    const e10 = (n, key) => (key === 'base' ? N(1) : pow(n)); // 10⁰ reads as 1
    // line 1: the book's table for the two units, then how many of the new unit make one of the old
    const facts = [s.from, s.to].filter((u, i, a) => u !== 'base' && a.indexOf(u) === i).map((u) => `${one(u)} = ${pow(EXP[u])} m`);
    if (k === 0) el.w1.innerHTML = t('calc_same');
    else if (te === 0)
      el.w1.innerHTML = `${facts.join('')}<br>${t(k > 0 ? 'calc_bigger' : 'calc_smaller')}`; // into metres: line 2 says which way the number goes
    else
      el.w1.innerHTML = `${facts.join(' <span class="sep">·</span> ')}<br>${t('calc_then')} ${one(s.from)} = ${e10(fe, s.from)} ÷ ${pow(te)} ${sym(s.to)} = ${pow(k)} ${sym(s.to)}`;
    // line 2: the student's number times that, = the answer
    const x = s.mant === '' && s.exp == null ? null : v;
    if (!x || x.int === 0n) {
      el.w2.innerHTML = x ? `${N(0)} ${sym(s.from)} = <b>${N(0)} ${sym(s.to)}</b>` : t('calc_empty');
    } else {
      const xs = s.exp != null ? `(${typedHTML()})` : typedHTML();
      const answer = `<b>${numHTML(r, { maxInt: 15 })} ${sym(s.to)}</b>`;
      el.w2.innerHTML = `${xs} ${sym(s.from)}${k ? ` = ${xs} <span class="op">×</span> ${pow(k)} ${sym(s.to)}` : ''} = ${answer}`;
      // too long for one line of a narrow panel: leave out the middle step (line 1 already gives the ×10ⁿ)
      if (el.w2.textContent.length > 40) el.w2.innerHTML = `${typedHTML()} ${sym(s.from)} = ${answer}`;
    }
    el.w2.dataset.len = el.w2.textContent.length > 34 ? 'l' : '';
    // line 3: which way the number goes, and the tour's object of about this length
    const metres = convertValue(v, fe, 0);
    const near = x && x.int !== 0n ? nearestStop(metres, SIZES) : null;
    const dir = k > 0 ? t('calc_bigger') : k < 0 ? t('calc_smaller') : '';
    el.w3.innerHTML = near ? t('calc_near', { name: `<b>${t(`${near}_short`)}</b>` }) : dir;
    el.w3.dataset.near = near || '';
    clearTimeout(lookTimer);
    if (near && near !== looked)
      lookTimer = setTimeout(() => {
        looked = near;
        onLook?.(near);
      }, 700); // after the student stops typing, so the view does not jump at every key
    onChange?.(getState());
  }

  function getState() {
    const v = parseInput(s.mant, s.exp === '-' ? '' : s.exp);
    const r = convertValue(v, EXP[s.from], EXP[s.to]);
    const sci = scientific(r);
    return {
      typed: s.exp != null ? `${s.mant || '0'}e${s.exp}` : s.mant,
      from: s.from,
      to: s.to,
      result: plain(r, { maxInt: 40, maxZeros: 40 }),
      scientific: `${sci.mant}e${sci.exp}`,
      near: el.w3.dataset.near || null,
    };
  }

  function key(k) {
    if (k === 'swap') [s.from, s.to] = [s.to, s.from];
    else Object.assign(s, press(s, k));
    render();
  }

  function openPicker(which) {
    picking = which;
    el.pickTitle.textContent = t(which === 'from' ? 'pick_from' : 'pick_to');
    el.picker.setAttribute('aria-label', el.pickTitle.textContent);
    el.picker.hidden = false;
    host.dataset.picking = which;
    for (const b of el.picker.querySelectorAll('[data-unit]')) {
      const on = b.getAttribute('data-unit') === s[which];
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    el[which].setAttribute('aria-expanded', 'true');
    /** @type {HTMLElement} */ (el.picker.querySelector('[data-unit].on') || el.picker.querySelector('[data-unit]'))?.focus();
  }
  function closePicker() {
    if (!picking) return;
    const which = picking;
    picking = null;
    el.picker.hidden = true;
    delete host.dataset.picking;
    el[which].setAttribute('aria-expanded', 'false');
    el[which].focus();
  }

  host.addEventListener('click', (e) => {
    const target = /** @type {Element} */ (e.target);
    const b = target.closest('button');
    if (!b) return;
    if (b.dataset.key) key(b.dataset.key);
    else if (b.dataset.pick) openPicker(b.dataset.pick);
    else if (b.dataset.unit && picking) {
      s[picking] = b.dataset.unit;
      closePicker();
      render();
    } else if (b.hasAttribute('data-close')) closePicker();
  });

  /** A key from a real keyboard (digits, Bangla digits, . , Backspace, Delete/Escape, e for ×10ⁿ, - for its sign). */
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (picking) {
      if (e.key === 'Escape') {
        closePicker();
        return true;
      }
      return false;
    }
    let k = e.key;
    const bn = BN.indexOf(k);
    if (bn >= 0) k = String(bn);
    const map = { Backspace: 'back', Delete: 'clear', Escape: 'clear', e: 'exp', E: 'exp', '-': 'neg', ',': '.' };
    k = map[k] || k;
    if (!/^[\d.]$/.test(k) && !['back', 'clear', 'exp', 'neg'].includes(k)) return false;
    if (k === 'neg' && s.exp == null) return false;
    key(k);
    return true;
  }

  render();
  return {
    onKey,
    getState,
    /** { value: "2.5" or "6e24", from: "k", to: "c" } (any of them) */
    set({ value: val, from: f, to: tt } = {}) {
      if (val != null) {
        const [m, e = null] = String(val).toLowerCase().split('e');
        s.mant = m.replace(/[^\d.]/g, '');
        s.exp = e;
      }
      if (f != null && EXP[f] != null) s.from = f;
      if (tt != null && EXP[tt] != null) s.to = tt;
      closePicker();
      render();
      return getState();
    },
    get picking() {
      return picking;
    },
    closePicker,
  };
}
