// The student view: the 3D figure on top (layers for labels, the magnifier and pointers, a hint line, and the
// "front / rotate" + fullscreen buttons), and one panel below it (beside it on short, wide frames) with two
// tabs: শেখো (the reading written as a named sum) and পরীক্ষা (the test, run by ./quiz.js).
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
