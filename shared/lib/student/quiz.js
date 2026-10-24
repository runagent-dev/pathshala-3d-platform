// Multiple-choice test for the student view: a few questions, four choices each, feedback with the worked
// answer, and a score at the end. The figure sets up each question (clamps an object, locks it, builds the
// choices) and shows how the answer is read; this module runs the screen, the counting and the events.
//
//   createQuiz({ ui, t, emit, audio, questions: 5, hooks: {
//     enter(), leave(),                         // switch the figure into / out of test mode
//     prepare(index, alive, say) → { text, choices, expected, tolerance, label(v), meta } | null
//                                               // set up a question (say(text) shows it at once);
//                                               // return null if alive() went false
//     reveal(q, correct) → html                 // show how it is read; return the worked sum
//     done(),                                   // after the last answer (unlock, …)
//   }})
//
// Strings (from the figure's i18n): q_count, q_score, q_hint, q_right, q_wrong, q_next, q_finish,
// q_result, q_great, q_good, q_try. Events: practice-start, practice-result, practice-end.

export function createQuiz({ ui, t, emit, audio, questions = 5, hooks }) {
  const el = {
    ask: ui.$('.pvc-q-ask'),
    count: ui.$('.pvc-q-count'),
    score: ui.$('.pvc-q-score'),
    text: ui.$('.pvc-q-text'),
    options: ui.$('.pvc-q-options'),
    feedback: ui.$('.pvc-q-feedback'),
    next: ui.$('[data-act="q-next"]'),
    nextLabel: ui.$('[data-act="q-next"] span'),
    done: ui.$('.pvc-q-done'),
    result: ui.$('.pvc-q-result'),
    praise: ui.$('.pvc-q-praise'),
  };

  let active = false;
  let asked = 0; // questions answered this round
  let right = 0;
  let current = null;
  let answered = false;
  let token = 0;

  function setFeedback(html, tone = '') {
    el.feedback.innerHTML = html;
    el.feedback.dataset.tone = tone;
  }

  function renderOptions(q) {
    el.options.innerHTML = q
      ? q.choices.map((v, i) => `<button class="pvc-opt" data-q="${i}">${q.label(v)}</button>`).join('')
      : '<button class="pvc-opt" disabled></button>'.repeat(4);
  }

  // The question and the result share one spot, so the panel (and the 3D view above it) keeps its size.
  function showDone(isDone) {
    ui.quiz.classList.toggle('is-done', isDone);
    el.ask.inert = isDone;
    el.done.inert = !isDone;
  }

  async function next() {
    if (asked >= questions) return finish();
    const my = ++token;
    answered = false;
    current = null;
    showDone(false);
    el.next.classList.add('is-off');
    el.count.textContent = t('q_count', { i: asked + 1, n: questions });
    el.score.textContent = asked ? t('q_score', { right }) : '';
    el.text.innerHTML = '&nbsp;';
    setFeedback(t('q_hint'));
    renderOptions(null);
    const say = (text) => my === token && (el.text.textContent = text);
    const q = await hooks.prepare(asked, () => my === token && active, say);
    if (!q || my !== token || !active) return;
    current = q;
    if (q.text) el.text.textContent = q.text;
    renderOptions(q);
  }

  function choose(i) {
    if (answered || !current) return;
    answered = true;
    asked++;
    const q = current;
    const pick = q.choices[i];
    const isRight = (v) => Math.abs(v - q.expected) < q.tolerance;
    const correct = isRight(pick);
    if (correct) right++;
    el.options.querySelectorAll('.pvc-opt').forEach((b, j) => {
      b.disabled = true;
      if (isRight(q.choices[j])) b.classList.add('right');
      else if (j === i) b.classList.add('wrong');
    });
    const work = hooks.reveal(q, correct);
    setFeedback(`<span class="lead">${t(correct ? 'q_right' : 'q_wrong')}</span> ${work}`, correct ? 'ok' : 'bad');
    if (correct) audio?.success();
    else audio?.error();
    el.score.textContent = t('q_score', { right });
    el.nextLabel.textContent = asked >= questions ? t('q_finish') : t('q_next');
    el.next.classList.remove('is-off');
    el.next.focus({ preventScroll: true });
    emit('practice-result', {
      type: 'choice',
      question: asked,
      of: questions,
      ...q.meta,
      choices: q.choices,
      answer: pick,
      expected: q.expected,
      correct,
      score: { right, total: asked },
    });
  }

  function finish() {
    token++;
    showDone(true);
    el.result.textContent = t('q_result', { right, total: questions });
    el.praise.textContent = t(right === questions ? 'q_great' : right >= questions - 2 ? 'q_good' : 'q_try');
    hooks.done?.();
    emit('practice-end', { right, total: questions, finished: true });
  }

  function start() {
    asked = 0;
    right = 0;
    if (!active) {
      active = true;
      hooks.enter?.();
    }
    emit('practice-start', { questions });
    return next();
  }

  function stop() {
    if (!active) return;
    token++;
    active = false;
    if (asked > 0 && asked < questions) emit('practice-end', { right, total: asked, finished: false });
    current = null;
    hooks.leave?.();
  }

  return {
    start,
    stop,
    next,
    choose,
    get active() {
      return active;
    },
    /** True once the current question is answered (the magnifier may then show the answer). */
    get revealed() {
      return answered || !active;
    },
  };
}
