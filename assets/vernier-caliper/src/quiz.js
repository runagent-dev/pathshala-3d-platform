// The caliper's test (shared screen and scoring: @shared/student/quiz.js). Each question clamps a random
// object and locks the jaw; the student picks the reading from four choices built from the usual mistakes.
import { createQuiz as createStudentQuiz } from '@shared/student/quiz.js';
import { SPECIMENS } from './specimens.js';
import { roundTo, format } from './reading.js';

export const QUIZ_KINDS = ['sphere', 'cylinder', 'block']; // outside jaws: what the school practical uses
export const QUESTIONS = 5;

const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function randomSize(def, lc) {
  const lo = Math.ceil(def.min / lc);
  const hi = Math.floor(def.max / lc);
  return roundTo((lo + Math.floor(Math.random() * (hi - lo + 1))) * lc, lc);
}

/** The right reading plus three wrong ones built from the usual mistakes. */
export function makeChoices(r, lc) {
  const correct = roundTo(r.observed, lc);
  const fine = r.vsr * lc;
  const neighbours = [1, -1, 2, -2].map((d) => r.vsr + d).filter((v) => v >= 0 && v < r.n).map((v) => r.msr + v * lc);
  const mistakes = [
    r.msr + 1 + fine, // took the main-scale mark after the vernier zero
    pickOne(neighbours.slice(0, 2)) ?? neighbours[0], // read the line next to the one that coincides
    ...shuffle([
      ...neighbours,
      ...(r.vsr > 1 ? [r.msr + r.vsr] : []), // forgot to multiply by the vernier constant
      ...(r.msr >= 1 ? [r.msr - 1 + fine] : []),
      r.msr + 2 + fine,
    ]),
  ];
  const seen = new Set([correct.toFixed(4)]);
  const wrong = [];
  for (const m of mistakes) {
    const v = roundTo(m, lc);
    if (v == null || v < 0 || seen.has(v.toFixed(4))) continue;
    seen.add(v.toFixed(4));
    wrong.push(v);
    if (wrong.length === 3) break;
  }
  return shuffle([correct, ...wrong]);
}

export function createQuiz(ctx) {
  const { t, s } = ctx;
  const N = t.num;
  let lastKind = null;
  return createStudentQuiz({
    ui: ctx.ui,
    t,
    emit: ctx.emit,
    audio: ctx.audio,
    questions: QUESTIONS,
    hooks: {
      enter() {
        s.mode = 'quiz';
        ctx.hideHint();
        ctx.showParts(false);
        ctx.syncUI();
        if (s.view !== 'front') ctx.setView('front');
      },
      leave() {
        s.mode = 'explore';
        ctx.setHighlightOverride(null);
        if (s.locked) ctx.setLocked(false, { sound: false });
        ctx.syncUI();
      },
      async prepare(_index, alive, say) {
        const kind = pickOne(QUIZ_KINDS.filter((k) => k !== lastKind));
        lastKind = kind;
        const size = randomSize(SPECIMENS[kind], s.lc);
        say(t('q_text', { what: t(`sp_${kind}_q`) }));
        ctx.setHighlightOverride(() => ({})); // coloured lines would give the answer away
        ctx.loupe.setFollow(true);
        if (s.locked) ctx.setLocked(false, { sound: false });
        await ctx.setSpecimen(kind, { size, autoContact: true, hint: false });
        if (!alive()) return null;
        ctx.setLocked(true);
        const r = ctx.reading();
        return {
          choices: makeChoices(r, s.lc),
          expected: roundTo(r.observed, s.lc),
          tolerance: s.lc / 2,
          label: (v) => `${N(format(v, s.lc, 'mm'))}<small>${t('unit_mm')}</small>`,
          meta: { specimen: kind, size },
        };
      },
      // Show how it is read: colour the scales and write the sum.
      reveal() {
        ctx.setHighlightOverride(null);
        ctx.setGuides(true);
        const r = ctx.reading();
        return `<b class="c-msr">${N(r.msr)}</b> + <b class="c-vsr">${N(r.vsr)}</b> × <b class="c-lc">${N(s.lc)}</b> = <b>${N(format(r.observed, s.lc, 'mm'))} ${t('unit_mm')}</b>`;
      },
      done() {
        if (s.locked) ctx.setLocked(false, { sound: false });
      },
    },
  });
}
