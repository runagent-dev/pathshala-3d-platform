// Practice: a random object is clamped, the reading is hidden, the student types what they read.
import { SPECIMENS, SPECIMEN_KINDS } from './specimens.js';
import { roundTo, format, formatSigned } from './reading.js';
import { fromBanglaDigits } from './i18n.js';

export function createPractice(ctx) {
  const { t, s, ui } = ctx;
  const el = {
    form: ui.practice,
    q: ui.$('.pvc-p-q'),
    input: ui.$('.pvc-p-input input'),
    feedback: ui.$('.pvc-p-feedback'),
    score: ui.$('.pvc-p-score'),
    ze: ui.$('[data-act="p-ze"]'),
  };

  let current = null;
  let right = 0;
  let total = 0;
  let revealed = false;
  let answered = false;
  let saved = null;
  let lastKind = null;

  function randomSize(def, lc) {
    const lo = Math.ceil(def.min / lc);
    const hi = Math.floor(def.max / lc);
    return roundTo((lo + Math.floor(Math.random() * (hi - lo + 1))) * lc, lc);
  }

  function randomZeroError(lc) {
    const steps = Math.max(1, Math.round(0.5 / lc));
    let k = 0;
    while (!k) k = Math.round((Math.random() * 2 - 1) * steps);
    return roundTo(k * lc, lc);
  }

  function setFeedback(text, tone = '') {
    el.feedback.innerHTML = text;
    el.feedback.dataset.tone = tone;
  }

  function updateScore() {
    el.score.textContent = total ? t('p_score', { right, total }) : '';
  }

  async function next() {
    revealed = false;
    answered = false;
    el.input.value = '';
    setFeedback('');
    ctx.setHighlightOverride(() => ({}));
    const kinds = SPECIMEN_KINDS.filter((k) => k !== lastKind);
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    lastKind = kind;
    const def = SPECIMENS[kind];
    const size = randomSize(def, s.lc);
    const ze = el.ze.checked ? randomZeroError(s.lc) : 0;
    ctx.setZeroError(ze, { demo: false });
    current = { kind, size, zeroError: ze };
    const what = t(`sp_${kind}_q`);
    el.q.innerHTML = ze ? t('p_question_ze', { ze: formatSigned(ze, s.lc, 'mm'), what }) : t('p_question', { what });
    ctx.loupe.setFollow(true);
    await ctx.setSpecimen(kind, { size, autoContact: true, hint: false });
    if (s.mode === 'practice') el.input.focus({ preventScroll: true });
  }

  function expected() {
    // If the student moved the jaws, mark what the caliper shows now, not the object's size.
    const r = ctx.reading();
    return current.zeroError ? r.corrected : r.observed;
  }

  function check() {
    if (!current) return;
    const raw = fromBanglaDigits(el.input.value.trim()).replace(',', '.').replace('।', '.');
    const value = parseFloat(raw);
    if (!raw || Number.isNaN(value)) {
      el.input.classList.remove('shake');
      void el.input.offsetWidth;
      el.input.classList.add('shake');
      return;
    }
    const mm = s.unit === 'cm' ? value * 10 : value;
    const want = expected();
    const diff = Math.abs(mm - want);
    const correct = diff < s.lc / 2 + 1e-9;
    if (!answered) {
      total++;
      if (correct) right++;
      answered = correct;
    }
    updateScore();
    if (correct) {
      ctx.audio.success();
      setFeedback(t('p_correct', { value: format(want, s.lc, s.unit), unit: t.unit(s.unit) }), 'ok');
      reveal(false);
    } else {
      ctx.audio.error();
      setFeedback(diff <= s.lc * 2.5 ? t('p_close') : t('p_wrong'), 'bad');
    }
    ctx.emit('practice-result', {
      specimen: current.kind,
      size: current.size,
      zeroError: current.zeroError,
      answer: mm,
      expected: want,
      correct,
      score: { right, total },
    });
  }

  function reveal(withText = true) {
    revealed = true;
    ctx.setHighlightOverride(null);
    ctx.setGuides(true);
    if (withText) {
      const r = ctx.reading();
      const u = s.unit;
      const N = t.num;
      const msr = N(u === 'cm' ? (r.msr / 10).toFixed(1) : r.msr);
      const lc = N(u === 'cm' ? +(s.lc / 10).toFixed(4) : s.lc);
      const ze = current.zeroError ? ` − (${N(formatSigned(current.zeroError, s.lc, u))})` : '';
      const shown = current.zeroError ? r.corrected : r.observed;
      setFeedback(`<b class="c-msr">${msr}</b> + <b class="c-vsr">${N(r.vsr)}</b> × <b class="c-lc">${lc}</b>${ze} = <b>${N(format(shown, s.lc, u))} ${t.unit(u)}</b>`, 'info');
    }
  }

  async function start({ zeroErrors } = {}) {
    if (s.mode === 'practice') return next();
    saved = { guides: s.guides, zeroError: s.zeroError, hidden: s.hidden, magnifier: s.magnifier };
    if (zeroErrors != null) el.ze.checked = !!zeroErrors;
    s.mode = 'practice';
    ctx.hideHint();
    if (s.locked) ctx.setLocked(false, { sound: false });
    ctx.showParts(false);
    ui.read.hidden = true;
    el.form.hidden = false;
    ctx.setMagnifier(true);
    ctx.syncUI();
    right = 0;
    total = 0;
    updateScore();
    ctx.emit('practice-start', {});
    await ctx.setView('front');
    return next();
  }

  function stop() {
    if (s.mode !== 'practice') return;
    s.mode = 'explore';
    el.form.hidden = true;
    ui.read.hidden = false;
    ctx.setHighlightOverride(null);
    if (saved) {
      ctx.setGuides(saved.guides);
      ctx.setZeroError(saved.zeroError, { demo: false });
      ctx.setMagnifier(saved.magnifier);
    }
    current = null;
    ctx.syncUI();
    ctx.emit('practice-end', { right, total });
  }

  return {
    start,
    stop,
    check,
    get revealed() {
      return revealed;
    },
    handle(act) {
      if (act === 'p-next') next();
      if (act === 'p-reveal') reveal(true);
      if (act === 'p-exit') stop();
    },
  };
}
