// The test: five questions, one of each kind, in a new order each time (the range comes last, so no later question
// can be answered from its picture). Each kind sets up its own scene (hiding the pulls when they would give the
// answer away), offers four choices built from real mistakes, and after the answer shows the pulls (dropping the
// apples or taking a pull away where that shows the answer), with a worked answer that names the student's mistake.
import { directionChoices, FACTS, PEOPLE, angleBetween, applePull, fairQuestionAngles, scientific } from './physics.js';

const shuffle = (list) => {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

// places for the "which way" question: all four choices clearly apart, and not on top of the other people
const DOWN_PLACES = fairQuestionAngles(45).filter((a) => [PEOPLE.north, PEOPLE.south, PEOPLE.far].every((b) => angleBetween(a, b) > 22));
const DIR_WORDS = ['dir_e', 'dir_ne', 'dir_n', 'dir_nw', 'dir_w', 'dir_sw', 'dir_s', 'dir_se']; // every 45°, from "right"

/**
 * api: { t, sup, sciHtml, setup({ stop, pulls, labels, angle, gap }), showPulls(), drop(), startFree() }
 */
export function createQuestions(api) {
  const { t, sup, sciHtml } = api;
  const textOpt =
    (keys, vars = {}) =>
    (j) =>
      `<span class="gf-opt">${t(keys[j], vars[keys[j]])}</span>`;
  const arrowSvg = (deg) => {
    const word = t(DIR_WORDS[Math.round(deg / 45) % 8]);
    return `<svg class="gf-dir" viewBox="-14 -14 28 28" role="img" aria-label="${t('dir_aria', { d: word })}"><g transform="rotate(${-deg})"><path d="M-10 0H3"/><path class="fill" d="M1.5-6L11 0 1.5 6z"/></g></svg>`;
  };
  /** The worked answer, plus the student's mistake when the choice was wrong. */
  const worked = (base, correct, mistakes, picked) => {
    const m = !correct && mistakes[picked];
    return m ? `${base} ${Array.isArray(m) ? t(m[0], m[1]) : t(m)}` : base;
  };
  const choice = (keys, right, label = textOpt(keys)) => ({ choices: [0, 1, 2, 3], expected: keys.indexOf(right), tolerance: 0.5, label });

  const KINDS = {
    // which way is the pull (or the fall) for you, standing somewhere on the edge? Arrows as answers.
    down: {
      prepare(say) {
        const variant = pickOne(['pull', 'apple']);
        const angle = pickOne(DOWN_PLACES);
        api.setup({ stop: 'earth', pulls: false, labels: ['you'], angle });
        const d = directionChoices(angle);
        const keys = shuffle(['inward', 'outward', 'tangent', 'screenDown']);
        say(t(variant === 'pull' ? 'q_down_pull' : 'q_down_apple'));
        return { q: { variant, keys }, ...choice(keys, 'inward', (j) => arrowSvg(d[keys[j]])), meta: { variant, angle } };
      },
      reveal(q, correct, picked) {
        api.showPulls();
        if (q.variant === 'apple') api.drop();
        return worked(t('down_why'), correct, { screenDown: 'down_mis_screen', outward: 'down_mis_outward', tangent: 'down_mis_tangent' }, picked);
      },
    },
    // what keeps the Moon (or the Earth) going round? Or: where would the Moon go without the pull?
    orbit: {
      prepare(say) {
        const variant = pickOne(['why', 'why', 'nopull']);
        const stop = variant === 'nopull' ? 'moon' : pickOne(['moon', 'sun']);
        api.setup({ stop, pulls: false, labels: ['small', 'big'] });
        const keys =
          variant === 'nopull'
            ? shuffle(['np_straight', 'np_out', 'np_round', 'np_fall'])
            : stop === 'moon'
              ? shuffle(['o_earth_g', 'o_moon_own', 'o_none', 'o_earth_mag'])
              : shuffle(['o_sun_g', 'o_earth_own', 'o_none', 'o_sun_mag']);
        const right = variant === 'nopull' ? 'np_straight' : stop === 'moon' ? 'o_earth_g' : 'o_sun_g';
        say(t(variant === 'nopull' ? 'q_nopull' : `q_orbit_${stop}`));
        return { q: { variant, stop, keys }, ...choice(keys, right), meta: { variant, stop } };
      },
      reveal(q, correct, picked) {
        api.showPulls();
        if (q.variant === 'nopull') {
          api.startFree(); // the pull goes: the Moon flies off in a straight line
          return worked(t('nopull_why'), correct, { np_out: 'np_mis_out', np_round: 'np_mis_round', np_fall: 'np_mis_fall' }, picked);
        }
        const own = { o_moon_own: 'orbit_mis_own', o_earth_own: 'orbit_mis_own' };
        return worked(
          t(`orbit_why_${q.stop}`),
          correct,
          { o_none: 'orbit_mis_none', o_earth_mag: 'orbit_mis_mag', o_sun_mag: 'orbit_mis_mag', ...own },
          picked,
        );
      },
    },
    // মাধ্যাকর্ষণ or মহাকর্ষ? Or, from the picture: does the person at the South Pole (upside down here) feel weight?
    name: {
      prepare(say) {
        const variant = pickOne(['name', 'weight']);
        api.setup({ stop: 'earth', pulls: false, labels: variant === 'weight' ? ['south'] : [], angle: PEOPLE.you });
        const keys =
          variant === 'name' ? shuffle(['n_earth_us', 'n_sun_earth', 'n_two_apples', 'n_magnet']) : shuffle(['w_yes', 'w_upside', 'w_up', 'w_none']);
        say(t(variant === 'name' ? 'q_name' : 'q_weight'));
        return { q: { variant, keys }, ...choice(keys, variant === 'name' ? 'n_earth_us' : 'w_yes'), meta: { variant } };
      },
      reveal(q, correct, picked) {
        api.showPulls();
        api.drop(); // every apple falls towards the centre, the South Pole's "up" the screen
        if (q.variant === 'name')
          return worked(
            t('name_why'),
            correct,
            { n_sun_earth: 'name_mis_other', n_two_apples: 'name_mis_other', n_magnet: 'name_mis_magnet' },
            picked,
          );
        return worked(t('weight_why'), correct, { w_upside: 'w_mis_upside', w_up: 'w_mis_up', w_none: 'w_mis_none' }, picked);
      },
    },
    // do two apples attract each other? (the arrows hidden until the answer)
    pairs: {
      prepare(say) {
        api.setup({ stop: 'apples', pulls: false, labels: ['dist'], gap: 20 });
        const keys = shuffle(['p_yes_weak', 'p_no_big', 'p_no_earth', 'p_yes_move']);
        say(t('q_pairs'));
        return { q: { keys }, ...choice(keys, 'p_yes_weak'), meta: {} };
      },
      reveal(_q, correct, picked) {
        api.showPulls();
        const f = sciHtml(scientific(applePull(20)));
        return worked(t('pairs_why', { f }), correct, { p_no_big: 'p_mis_big', p_no_earth: 'p_mis_earth', p_yes_move: 'p_mis_move' }, picked);
      },
    },
    // the range: infinite (the galaxy), or the pull at twice the distance (the Moon)
    range: {
      prepare(say) {
        const variant = pickOne(['range', 'double']);
        if (variant === 'range') {
          api.setup({ stop: 'galaxy', pulls: true, labels: null });
          const keys = shuffle(['range_inf', 'r_15', 'r_18', 'r_air']);
          say(t('q_range'));
          const text = { range_inf: t('range_inf'), r_air: t('r_air'), r_15: t('r_m', { p: sup(-15) }), r_18: t('r_m', { p: sup(-18) }) };
          return { q: { variant, keys }, ...choice(keys, 'range_inf', (j) => `<span class="gf-opt">${text[keys[j]]}</span>`), meta: { variant } };
        }
        api.setup({ stop: 'moon', pulls: true, labels: null });
        const keys = shuffle(['d_less', 'd_zero', 'd_same', 'd_more']);
        say(t('q_double'));
        return { q: { variant, keys }, ...choice(keys, 'd_less'), meta: { variant } };
      },
      reveal(q, correct, picked) {
        if (q.variant === 'range') {
          const mis = { r_15: ['range_mis_strong', { p: sup(-15) }], r_18: ['range_mis_weak', { p: sup(-18) }], r_air: 'range_mis_air' };
          return worked(t('range_why', { d: FACTS.galaxy.thousandLy }), correct, mis, picked);
        }
        return worked(t('double_why'), correct, { d_zero: 'd_mis_zero', d_same: 'd_mis_same', d_more: 'd_mis_more' }, picked);
      },
    },
  };

  let current = null;
  return {
    /** A new order of the kinds: the first four shuffled, the range last. */
    order: () => [...shuffle(['down', 'orbit', 'name', 'pairs']), 'range'],
    prepare(kind, say) {
      const r = KINDS[kind].prepare(say);
      current = { kind, ...r.q };
      return { choices: r.choices, expected: r.expected, tolerance: r.tolerance, label: r.label, meta: { kind, ...r.meta } };
    },
    /** The worked answer for the question just answered; `picked` is the key of the chosen answer. */
    reveal(correct, pickedIndex) {
      const q = current;
      return KINDS[q.kind].reveal(q, correct, q.keys?.[pickedIndex]);
    },
    get current() {
      return current;
    },
  };
}
