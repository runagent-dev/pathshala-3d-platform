// The student view: the 3D figure (layers for labels, the magnifier and pointers, a hint line, and the
// full-screen button; the view starts from the front and turns when the student drags it, and a "front" button
// appears only after it was turned), and one panel beside it on landscape frames (it can be hidden, so the 3D
// fills the frame) or below it on portrait ones; on a phone held upright a card asks to turn it sideways. Two
// tabs: শেখো (the reading written as a named sum, or the clean sheet: one action, one result, one rule) and পরীক্ষা
// (the test, run by ./quiz.js).
// Styles: ./student.css. Strings come from the figure: view, view_front_short, view_rotate, fullscreen,
// tab_learn, tab_quiz, reading, q_again, panel_hide, panel_show, rotate_title, rotate_body, rotate_go, rotate_stay
// (plus the quiz and pointer strings).
import { ICONS } from './icons.js';

/**
 * The শেখো sheet: the reading, then "= term op term …" with each term named underneath, an optional extra
 * line, and a status line with one button (e.g. "measure an object").
 *   terms: [{ cls, label, op, wrap? }]  op is the sign in front ('=' for the first); wrap puts it in a span
 */
export function learnSheet(t, { terms, extra = '', button = true }) {
  const term = ({ cls, label }) => `<span class="pvc-t ${cls}"><b>0</b><small>${t(label)}</small></span>`;
  const sum = terms.map((x) => (x.wrap ? `<span class="${x.wrap}"><i>${x.op}</i>${term(x)}</span>` : `<i>${x.op}</i>${term(x)}`)).join('');
  return `
          <div class="pvc-learn-main">
            <div class="pvc-result"><span class="k">${t('reading')}</span><span class="v">0</span><span class="u"></span></div>
            <div class="pvc-sum">${sum}</div>
          </div>${extra}
          <div class="pvc-learn-foot">
            <span class="pvc-status"><i></i><span></span></span>
            ${button ? `<button class="pvc-btn" data-act="object">${ICONS.measure}<span></span></button>` : ''}
          </div>`;
}

/**
 * The clean শেখো sheet (kit 1.3.0: one action, one result, one rule), in this order:
 *   - one row of example words: a radio group (one Tab stop; the arrow keys, Home and End move and choose, once
 *     bindCleanSheet runs), the chosen word underlined; with `results: true` a small result can sit under each word
 *     once it is known, and room is kept for it;
 *   - the action row: `.pvc-act-slot`, where createAction (./action.js) puts its big button, then quiet secondary
 *     buttons (`quiet`: an icon and words; only the icon in a narrow panel). It never wraps: a long verb wraps inside
 *     the pill;
 *   - one result line (`.pvc-outcome`: the key number in <b>, drawn larger);
 *   - one rule line (`.pvc-rule`: the rule in the book's words, explained plainly).
 * `lines` keeps room for that many lines of the action's words, the result and the rule, so the sheet keeps its
 * height when they change (a figure can set `--pvc-act-lines` / `--pvc-outcome-lines` / `--pvc-rule-lines` for one
 * layout in its own CSS). Write it with bindCleanSheet.
 * @param {(key: string, vars?: object) => string} t
 * @param {{ examples?: { label?: string, items: Array<{ id: string, label: string }>, results?: boolean },
 *           quiet?: Array<{ act: string, label: string, icon?: string }>,
 *           lines?: { action?: number, outcome?: number, rule?: number } }} [options]
 */
export function cleanSheet(t, { examples, quiet = [], lines = {} } = {}) {
  const words = examples
    ? `<div class="pvc-examples" role="radiogroup"${examples.label ? ` aria-label="${t(examples.label)}"` : ''}${examples.results ? ' data-results' : ''}>${examples.items
        .map(
          ({ id, label }, i) =>
            `<button type="button" role="radio" aria-checked="false" tabindex="${i ? -1 : 0}" data-example="${id}"><span class="pvc-ex-word">${t(label)}</span><small class="pvc-ex-res"></small></button>`,
        )
        .join('')}</div>`
    : '';
  const extra = quiet
    .map(
      ({ act, label, icon = '' }) =>
        `<button type="button" class="pvc-quiet" data-act="${act}" aria-label="${t(label)}" title="${t(label)}">${icon}<span>${t(label)}</span></button>`,
    )
    .join('');
  // the default room is set on the line itself; a figure's CSS overrides it per layout with --pvc-<line>-lines
  const room = (name, n) => (n > 0 ? ` style="--pvc-${name}-room: ${n}"` : '');
  return `
          ${words}
          <div class="pvc-act-row"${room('act', lines.action)}><div class="pvc-act-slot"></div>${extra}</div>
          <p class="pvc-outcome"${room('outcome', lines.outcome)}></p>
          <p class="pvc-rule"${room('rule', lines.rule)}></p>`;
}

const STEP_KEYS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * Writes a sheet made by cleanSheet: which example is chosen, the word the action will choose next, the small result
 * under a word, the result line and the rule line (each written only when it changes, so it can be called every
 * frame). It also makes the row of words a proper radio group: one Tab stop (the chosen word); the arrow keys, Home
 * and End move to a word and choose it by clicking it (so the figure's own click handler does the rest), and those
 * keys never reach the figure's scene keys.
 * @param {Element} learn the শেখো sheet (`ui.learn`)
 */
export function bindCleanSheet(learn) {
  const words = /** @type {HTMLElement[]} */ ([...learn.querySelectorAll('[data-example]')]);
  const row = learn.querySelector('.pvc-examples');
  const outcome = learn.querySelector('.pvc-outcome');
  const rule = learn.querySelector('.pvc-rule');
  const last = { outcome: null, rule: null };
  const write = (el, key, html) => {
    if (!el || last[key] === html) return;
    el.innerHTML = html;
    last[key] = html;
  };
  row?.addEventListener('keydown', (e) => {
    const ev = /** @type {KeyboardEvent} */ (e);
    const at = words.indexOf(/** @type {HTMLElement} */ (ev.target));
    if (at < 0) return;
    let to = -1;
    if (ev.key in STEP_KEYS) to = (at + STEP_KEYS[ev.key] + words.length) % words.length;
    else if (ev.key === 'Home') to = 0;
    else if (ev.key === 'End') to = words.length - 1;
    else return;
    ev.preventDefault();
    ev.stopPropagation(); // never the figure's scene keys
    words[to].focus();
    words[to].click();
  });
  return {
    /** The example words' buttons (each has data-example="<id>"). */
    words,
    /** Underline one example (aria-checked and the Tab stop follow). */
    choose(id) {
      const any = words.some((b) => b.dataset.example === id);
      words.forEach((b, i) => {
        const on = b.dataset.example === id;
        b.setAttribute('aria-checked', String(on));
        b.classList.toggle('on', on);
        b.tabIndex = on || (!any && i === 0) ? 0 : -1;
      });
    },
    /** Mark the word the action will choose next (a dotted underline), or none with null. */
    next(id = null) {
      for (const b of words) b.classList.toggle('next', id != null && b.dataset.example === id);
    },
    /** The small result under an example's word ('' for none yet). */
    result(id, text = '') {
      const small = words.find((b) => b.dataset.example === id)?.querySelector('.pvc-ex-res');
      if (small && small.textContent !== text) small.textContent = text;
    },
    /** The result line (HTML; the key number in <b>). */
    outcome: (html) => write(outcome, 'outcome', html),
    /** The rule line (HTML; the book's words in <b>). */
    rule: (html) => write(rule, 'rule', html),
  };
}

/**
 * The student view's frame. `learnAlign: 'start'` keeps the শেখো sheet's content together at the top; by default
 * ('spread') its first and last rows go to the top and bottom of the panel, which the পরীক্ষা sheet may make taller.
 * @param {HTMLElement} root
 * @param {(key: string, vars?: object) => string} t
 * `layout: 'side'` (the standard from kit 1.5.0): the panel beside the 3D on landscape frames with a hide tab, a
 * turn-sideways card on upright phones, and no front/rotate buttons (a drag turns the view; a hidden "front" icon
 * button is for the figure to show once it was turned). The default 'stack' keeps the older layout.
 * @param {{ learn?: string, learnAlign?: 'spread' | 'start', layout?: 'stack' | 'side' }} [options]
 */
export function buildStudentShell(root, t, { learn = '', learnAlign = 'spread', layout = 'stack' } = {}) {
  const side = layout === 'side';
  const viewButtons = side
    ? `<button class="pvc-tool icon-only" data-view="front" hidden title="${t('view_front_short')}" aria-label="${t('view_front_short')}">${ICONS.reset}</button>`
    : `<div class="pvc-seg" role="group" aria-label="${t('view')}">
          <button data-view="front">${t('view_front_short')}</button>
          <button data-view="3d">${t('view_rotate')}</button>
        </div>`;
  const rotateCard = `
    <div class="pvc-rotate" hidden>
      <div class="pvc-rotate-card" role="dialog" aria-label="${t('rotate_title')}">
        <svg class="pvc-rotate-phone" viewBox="0 0 64 64" aria-hidden="true"><rect x="22" y="8" width="20" height="36" rx="4"/><path d="M14 46a20 20 0 0 0 36 0M50 46l-1-7M50 46l-7-1"/></svg>
        <p class="pvc-rotate-title">${t('rotate_title')}</p>
        <p class="pvc-rotate-body">${t('rotate_body')}</p>
        <button class="pvc-btn primary" data-act="rotate-go">${t('rotate_go')}</button>
        <button class="pvc-quiet" data-act="rotate-stay">${t('rotate_stay')}</button>
      </div>
    </div>`;
  root.innerHTML = `
  <div class="pvc-shell"${side ? ' data-layout="side"' : ''}>
    <div class="pvc-stage" data-ui="simple">
      <div class="pvc-canvas"></div>
      <div class="pvc-anno-layer"></div>
      <div class="pvc-lens-layer"></div>
      <div class="pvc-coach-layer"></div>
      <div class="pvc-hint" role="status" aria-live="polite"><span class="pvc-hint-text"></span><button class="pvc-hint-act" hidden></button></div>
      <div class="pvc-corner">
        ${viewButtons}
        <button class="pvc-tool icon-only" data-act="fullscreen" title="${t('fullscreen')}" aria-label="${t('fullscreen')}">${ICONS.expand}</button>
      </div>
      ${side ? `<button class="pvc-panel-toggle" data-act="panel" aria-expanded="true" title="${t('panel_hide')}" aria-label="${t('panel_hide')}">${ICONS.chevR}</button>` : ''}
    </div>

    <div class="pvc-panel">
      <div class="pvc-tabs" role="tablist">
        <button role="tab" data-mode="explore">${t('tab_learn')}</button>
        <button role="tab" data-mode="quiz">${t('tab_quiz')}</button>
      </div>
      <div class="pvc-sheets">
        <section class="pvc-learn" role="tabpanel"${learnAlign === 'start' ? ' data-align="start"' : ''}>
${learn}
        </section>

        <section class="pvc-quiz" role="tabpanel">
          <div class="pvc-q-ask">
            <div class="pvc-q-head">
              <span class="pvc-q-count">&nbsp;</span><span class="pvc-q-score"></span>
              <button class="pvc-btn primary is-off" data-act="q-next"><span></span>${ICONS.chevR}</button>
            </div>
            <p class="pvc-q-text">&nbsp;</p>
            <div class="pvc-q-options">${'<button class="pvc-opt" disabled></button>'.repeat(4)}</div>
            <p class="pvc-q-feedback" role="status" aria-live="polite">&nbsp;</p>
          </div>
          <div class="pvc-q-done">
            <p class="pvc-q-result"></p>
            <p class="pvc-q-praise"></p>
            <button class="pvc-btn primary" data-act="q-again">${ICONS.reset}${t('q_again')}</button>
          </div>
        </section>
      </div>
    </div>
    ${side ? rotateCard : ''}
  </div>`;

  const $ = (s) => root.querySelector(s);
  if (side) wireLayout(root, t);
  return {
    $,
    $$: (s) => [...root.querySelectorAll(s)],
    simple: true,
    stage: $('.pvc-stage'),
    canvasHost: $('.pvc-canvas'),
    annoLayer: $('.pvc-anno-layer'),
    lensLayer: $('.pvc-lens-layer'),
    coachLayer: $('.pvc-coach-layer'),
    corner: $('.pvc-corner'),
    hint: $('.pvc-hint'),
    hintText: $('.pvc-hint-text'),
    hintAct: $('.pvc-hint-act'),
    learn: $('.pvc-learn'),
    quiz: $('.pvc-quiz'),
  };
}

/** The hide/show button for the side panel, and the "turn your phone" card for touch phones held upright. */
function wireLayout(root, t) {
  const shell = /** @type {HTMLElement} */ (root.querySelector('.pvc-shell'));
  const toggle = /** @type {HTMLButtonElement} */ (root.querySelector('.pvc-panel-toggle'));
  toggle.addEventListener('click', () => {
    const open = shell.dataset.panel === 'closed';
    if (open) delete shell.dataset.panel;
    else shell.dataset.panel = 'closed';
    const word = t(open ? 'panel_hide' : 'panel_show');
    toggle.title = word;
    toggle.setAttribute('aria-label', word);
    toggle.setAttribute('aria-expanded', String(open));
  });

  const card = /** @type {HTMLElement} */ (root.querySelector('.pvc-rotate'));
  const params = new URLSearchParams(location.search);
  const touch = window.matchMedia?.('(pointer: coarse)').matches;
  let dismissed = params.get('rotate') === '0' || params.get('coach') === '0';
  const update = () => {
    const portrait = root.clientHeight > root.clientWidth * 1.15 && root.clientWidth < 600;
    card.hidden = dismissed || !touch || !portrait;
  };
  card.addEventListener('click', async (e) => {
    const act = /** @type {HTMLElement} */ (e.target).closest('[data-act]')?.getAttribute('data-act');
    if (act === 'rotate-stay') dismissed = true;
    if (act === 'rotate-go') {
      dismissed = true;
      try {
        if (!document.fullscreenElement) await root.requestFullscreen?.();
        await screen.orientation?.lock?.('landscape');
      } catch {
        /* iOS and desktop: the student turns the phone by hand */
      }
    }
    if (act) update();
  });
  new ResizeObserver(update).observe(root);
  update();
}
