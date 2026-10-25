// The student view: the 3D figure on top (layers for labels, the magnifier and pointers, a hint line, and the
// "front / rotate" + fullscreen buttons), and one panel below it (beside it on short, wide frames) with two
// tabs: শেখো (the reading written as a named sum, or the clean sheet: one action, one result, one rule) and পরীক্ষা
// (the test, run by ./quiz.js).
// Styles: ./student.css. Strings come from the figure: view, view_front_short, view_rotate, fullscreen,
// tab_learn, tab_quiz, reading, q_again (plus the quiz and pointer strings).
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
 *   - one row of example words (a text segmented control: the chosen word underlined; with `results: true` a small
 *     result can sit under each word once it is known, and room is kept for it);
 *   - the action row: `.pvc-act-slot`, where createAction (./action.js) puts its big button, then quiet secondary
 *     buttons (`quiet`: an icon and words; only the icon in a narrow panel);
 *   - one result line (`.pvc-outcome`: the key number in <b>, drawn larger);
 *   - one rule line (`.pvc-rule`: the rule in the book's words, explained plainly).
 * `lines` keeps room for that many lines of result and rule, so the sheet keeps its height when they change (a figure
 * can set `--pvc-outcome-lines` / `--pvc-rule-lines` for one layout in its own CSS). Write it with bindCleanSheet.
 * @param {(key: string, vars?: object) => string} t
 * @param {{ examples?: { label?: string, items: Array<{ id: string, label: string }>, results?: boolean },
 *           quiet?: Array<{ act: string, label: string, icon?: string }>,
 *           lines?: { outcome?: number, rule?: number } }} [options]
 */
export function cleanSheet(t, { examples, quiet = [], lines = {} } = {}) {
  const words = examples
    ? `<div class="pvc-examples" role="radiogroup"${examples.label ? ` aria-label="${t(examples.label)}"` : ''}${examples.results ? ' data-results' : ''}>${examples.items
        .map(
          ({ id, label }) =>
            `<button type="button" role="radio" aria-checked="false" data-example="${id}"><span class="pvc-ex-word">${t(label)}</span><small class="pvc-ex-res"></small></button>`,
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
          <div class="pvc-act-row"><div class="pvc-act-slot"></div>${extra}</div>
          <p class="pvc-outcome"${room('outcome', lines.outcome)}></p>
          <p class="pvc-rule"${room('rule', lines.rule)}></p>`;
}

/**
 * Writes a sheet made by cleanSheet: which example is chosen, the small result under a word, the result line and
 * the rule line (each written only when it changes, so it can be called every frame).
 * @param {Element} learn the শেখো sheet (`ui.learn`)
 */
export function bindCleanSheet(learn) {
  const words = /** @type {HTMLElement[]} */ ([...learn.querySelectorAll('[data-example]')]);
  const outcome = learn.querySelector('.pvc-outcome');
  const rule = learn.querySelector('.pvc-rule');
  const last = { outcome: null, rule: null };
  const write = (el, key, html) => {
    if (!el || last[key] === html) return;
    el.innerHTML = html;
    last[key] = html;
  };
  return {
    /** The example words' buttons (each has data-example="<id>"). */
    words,
    /** Underline one example (aria-checked follows). */
    choose(id) {
      for (const b of words) {
        const on = b.dataset.example === id;
        b.setAttribute('aria-checked', String(on));
        b.classList.toggle('on', on);
      }
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
 * @param {{ learn?: string, learnAlign?: 'spread' | 'start' }} [options]
 */
export function buildStudentShell(root, t, { learn = '', learnAlign = 'spread' } = {}) {
  root.innerHTML = `
  <div class="pvc-shell">
    <div class="pvc-stage" data-ui="simple">
      <div class="pvc-canvas"></div>
      <div class="pvc-anno-layer"></div>
      <div class="pvc-lens-layer"></div>
      <div class="pvc-coach-layer"></div>
      <div class="pvc-hint" role="status" aria-live="polite"><span class="pvc-hint-text"></span><button class="pvc-hint-act" hidden></button></div>
      <div class="pvc-corner">
        <div class="pvc-seg" role="group" aria-label="${t('view')}">
          <button data-view="front">${t('view_front_short')}</button>
          <button data-view="3d">${t('view_rotate')}</button>
        </div>
        <button class="pvc-tool icon-only" data-act="fullscreen" title="${t('fullscreen')}" aria-label="${t('fullscreen')}">${ICONS.expand}</button>
      </div>
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
  </div>`;

  const $ = (s) => root.querySelector(s);
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
