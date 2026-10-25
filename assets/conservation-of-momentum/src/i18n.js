// Every string the figure shows, in Bangla (the book's words on pages 72–73: সংঘর্ষ, ভরবেগ, সম্মিলিত ভরবেগ, শক্তি,
// গতিশক্তি, সংরক্ষণশীলতা, নিত্যতা, ভরবেগের সংরক্ষণশীলতা বা নিত্যতা, শক্তির সংরক্ষণশীলতা, সংঘর্ষের আগে, সংঘর্ষের পর,
// বাইরে থেকে কোনো বল, সমতল, সরলরেখা, ভর, বেগ, সমীকরণ, অজানা রাশি) and English. Use t('key') in code, and t.num()
// for numbers (Bangla digits when the language is Bangla). The two balls are called by the book's name for them,
// "ভর" (m₁ ভরটি): "বল" means force here (বাইরে থেকে কোনো বল), so a ball is never called বল.
// Symbols stay as the book prints them (m₁, u₁, v₁, ½m₁u₁²), written with <sub>/<sup> (the font has no ₁ ₂), and
// units are the book's SI symbols (kg, m/s, kg m/s, J) in every language. Digits inside the symbols are Latin;
// numbers always come in through {vars}, so t() turns them into Bangla digits; a number and its unit are joined by
// no-break spaces, so they never part at the end of a line.

export const UNITS = { u_kg: 'kg', u_ms: 'm/s', u_p: 'kg m/s', u_j: 'J' };

const SYM = {
  m1: 'm<sub>1</sub>',
  m2: 'm<sub>2</sub>',
  u1: 'u<sub>1</sub>',
  u2: 'u<sub>2</sub>',
  v1: 'v<sub>1</sub>',
  v2: 'v<sub>2</sub>',
  p_u1: 'm<sub>1</sub>u<sub>1</sub>',
  p_u2: 'm<sub>2</sub>u<sub>2</sub>',
  p_v1: 'm<sub>1</sub>v<sub>1</sub>',
  p_v2: 'm<sub>2</sub>v<sub>2</sub>',
  k_u1: '½m<sub>1</sub>u<sub>1</sub><sup>2</sup>',
  k_u2: '½m<sub>2</sub>u<sub>2</sub><sup>2</sup>',
  k_v1: '½m<sub>1</sub>v<sub>1</sub><sup>2</sup>',
  k_v2: '½m<sub>2</sub>v<sub>2</sub><sup>2</sup>',
};
const S = SYM;

export const STRINGS = {
  bn: {
    title: 'ভরবেগ এবং শক্তির সংরক্ষণশীলতা',
    ...UNITS,
    ...Object.fromEntries(Object.entries(SYM).map(([k, v]) => [`sym_${k}`, v])),
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ভরবেগ',

    // the examples
    presets: 'উদাহরণ',
    preset_heavy: 'ভারী পেছনে',
    preset_equal: 'সমান ভর',
    preset_light: 'হালকা পেছনে',
    preset_headon: 'মুখোমুখি',
    preset_aria: '{name}: m₁ = {m1} kg, m₂ = {m2} kg, u₁ = {u1} m/s, u₂ = {u2} m/s',

    // the panel: the book's two equations with the student's numbers
    col_before: 'সংঘর্ষের আগে',
    col_after: 'সংঘর্ষের পর',
    row_p: 'ভরবেগ',
    row_k: 'গতিশক্তি',
    eq_p_name: 'ভরবেগের সংরক্ষণশীলতা',
    eq_k_name: 'শক্তির সংরক্ষণশীলতা',
    say_before: `সংঘর্ষের পর ${S.v1} আর ${S.v2} কত? ভরবেগের একটি সমীকরণে অজানা রাশি দুটি, তাই শক্তির সমীকরণটিও লাগে: দুটি মিলিয়ে ${S.v1}, ${S.v2} পাওয়া যায়।`,
    say_contact: 'ধাক্কার সময় একটির ভরবেগ যতটা কমে, অন্যটির ঠিক ততটা বাড়ে: সম্মিলিত ভরবেগ সব সময় একই।',
    say_after:
      'বাইরে থেকে কোনো বল দেওয়া হয়নি, তাই সম্মিলিত ভরবেগ আগে ও পরে সমান: <b>ভরবেগের সংরক্ষণশীলতা বা নিত্যতা</b>। গতিশক্তিও সমান: <b>শক্তির সংরক্ষণশীলতা</b>।',
    say_assume: 'ধরে নিই: সংঘর্ষে গতিশক্তি ব্যতীত অন্য কোনো শক্তির আদান-প্রদান ঘটেনি।',
    act_play: 'চালাও',
    act_pause: 'থামাও',
    act_replay: 'আবার চালাও',
    scrub: 'সময়: সংঘর্ষের আগে থেকে পর পর্যন্ত',
    phase_before: 'সংঘর্ষের আগে',
    phase_contact: 'সংঘর্ষ',
    phase_after: 'সংঘর্ষের পর',

    // on the picture
    note_slow: 'সময় {n} গুণ ধীর',
    note_contact: 'ধাক্কার মুহূর্ত আরও ধীরে',
    lbl_mass1: `${S.m1} = {m} kg`,
    lbl_mass2: `${S.m2} = {m} kg`,
    lbl_u1: `${S.u1} = {v} m/s`,
    lbl_u2: `${S.u2} = {v} m/s`,
    lbl_v1: `${S.v1} = {v} m/s`,
    lbl_v2: `${S.v2} = {v} m/s`,
    lbl_now: '{v} m/s',
    lbl_v1_q: `${S.v1} = ?`,
    lbl_v2_q: `${S.v2} = ?`,
    strip_title: 'ভরবেগ, mv (kg m/s)',
    strip_before: 'আগে',
    strip_now: 'এখন',
    strip_after: 'পরে',
    strip_total: 'মোট',
    hint_meet: `ধাক্কা লাগতে হলে ${S.m1} কে ${S.m2} এর চেয়ে বেশি বেগে ডানে যেতে হবে (${S.u1} > ${S.u2})।`,
    coach_drag: 'টেনে বেগ বদলাও',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ভর আর বেগ বদলানো যায় না। ছবি দেখে উত্তর বেছে নাও।',

    q_total: 'সংঘর্ষের আগে ভর দুটির সম্মিলিত ভরবেগ কত?',
    why_total: `<b>{P} kg m/s</b>: ${S.p_u1} + ${S.p_u2} = {m1} × {u1} + {m2} × {u2} = {p1} + {p2} = {P} kg m/s।`,
    mis_sign: ` ${S.u2} বাঁ দিকে, তাই ঋণাত্মক।`,
    mis_one: ' দুটি ভরেরই ভরবেগ যোগ করতে হবে।',
    mis_swap: ' প্রতিটি ভরকে তার নিজের বেগ দিয়ে গুণ করতে হয়।',
    mis_noMass: ' শুধু বেগ যোগ করলে হবে না: ভরবেগ = ভর × বেগ।',
    mis_lump: ` (${S.m1} + ${S.m2}) × (${S.u1} + ${S.u2}) নয়: প্রতিটির ভরবেগ আলাদা করে বের করে যোগ করো।`,

    q_v2: `সংঘর্ষের পর ${S.v1} = {v1} m/s। ভরবেগের সমীকরণ থেকে ${S.v2} কত?`,
    why_v2: `<b>{v2} m/s</b>: {P} = {m1} × {v1} + {m2} × ${S.v2}, তাই ${S.v2} = ({P} − {p1}) ÷ {m2} = {v2} m/s।`,
    mis_noDiv: ` এটি ${S.m2} এর ভরবেগ; বেগ পেতে ${S.m2} দিয়ে ভাগ করো।`,
    mis_noSub: ` আগে ${S.m1} এর ভরবেগ ({p1}) বাদ দিতে হবে।`,
    mis_addSub: ` ${S.m1} এর ভরবেগ যোগ নয়, বিয়োগ করতে হবে।`,
    mis_carry: ` সংঘর্ষে বেগ বদলায়; ${S.u1} নিজে ${S.m2} তে চলে যায় না।`,
    mis_flip: ' দিক ভুল: ঋণাত্মক মানে বাঁ দিকে।',

    q_ke: 'বই ধরে নেয়, গতিশক্তি ছাড়া অন্য কোনো শক্তির আদান-প্রদান হয় না। সংঘর্ষের পর মোট গতিশক্তি কত?',
    why_ke: `<b>{K} J</b>: পরের গতিশক্তি = আগের = ${S.k_u1} + ${S.k_u2} = {k1} + {k2} = {K} J।`,
    mis_half: ' গতিশক্তি ½mv², ½ বাদ পড়েছে।',
    mis_square: ' বেগের বর্গ নিতে হবে: ½mv²।',
    mis_minus: ' গতিশক্তি দিক মানে না (বেগের বর্গ ধনাত্মক), তাই দুটি যোগ হয়।',
    mis_isP: ' এটি সম্মিলিত ভরবেগ (kg m/s), গতিশক্তি নয়।',

    q_equal: `দুটির ভর সমান। সংঘর্ষের পর ${S.v1} কত হবে?`,
    why_equal: `<b>{v1} m/s</b>: ভর সমান হলে বেগ অদলবদল হয়: ${S.v1} = ${S.u2} = {v1} m/s, ${S.v2} = ${S.u1} = {v2} m/s। ভরবেগ: {P} = {P} kg m/s।`,
    mis_keep: ' সংঘর্ষে বেগ বদলায়, একই থাকে না।',
    mis_stop: ' সব সময় থেমে যায় না; এখানে বেগ অদলবদল হয়।',
    mis_share: ' দুটি জুড়ে গেলে গড় বেগ হতো; এখানে বেগ অদলবদল হয়।',
    mis_back: ' উল্টো দিকে ফিরতে হলে ভারী কিছুতে ধাক্কা লাগতে হয়।',

    q_light: `হালকা ${S.m1} গিয়ে স্থির, ভারী ${S.m2} কে ধাক্কা দেবে। সংঘর্ষের পর ${S.m1} কী করবে?`,
    ans_back: 'ফিরে আসবে',
    ans_stop: 'থেমে যাবে',
    ans_slow: 'আস্তে সামনে যাবে',
    ans_together: 'একসাথে যাবে',
    why_light: `<b>ফিরে আসবে</b>: ${S.v1} = ({m1} − {m2}) × {u1} ÷ ({m1} + {m2}) = {v1} m/s, ঋণাত্মক মানে বাঁ দিকে। ${S.v2} = {v2} m/s। ভরবেগ: {P} = {p1} + {p2}।`,
    mis_l_stop: ' থামে সমান ভরে; হালকাটি ভারীতে লেগে ফিরে আসে।',
    mis_l_slow: ' ভারী ভর আগে থাকলে হালকাটি সামনে যেতে পারে না।',
    mis_l_together: ' একসাথে চলে জুড়ে গেলে; এখানে গতিশক্তি ঠিক থাকে, তাই আলাদা হয়ে যায়।',

    q_same: 'বাইরে থেকে কোনো বল নেই। সংঘর্ষের আগে আর পরে কোনটি একই থাকে?',
    ans_totalP: 'মোট ভরবেগ',
    ans_totalV: 'মোট বেগ',
    ans_v1: `${S.m1} এর বেগ`,
    ans_p2: `${S.m2} এর ভরবেগ`,
    why_same: `<b>মোট ভরবেগ</b>: আগে {P}, পরে {P} kg m/s। ${S.m1} এর বেগ {u1} থেকে {v1} m/s, মোট বেগ {su} থেকে {sv} m/s, ${S.m2} এর ভরবেগ {p2u} থেকে {p2v} kg m/s হলো।`,
    mis_s_v: ' মোট বেগ নয়, ভর × বেগের যোগফল একই থাকে।',
    mis_s_v1: ' প্রতিটি ভরের বেগ বদলায়; একই থাকে শুধু মোট ভরবেগ।',
    mis_s_p2: ' একটির ভরবেগ বাড়ে, অন্যটির কমে; একই থাকে মোট ভরবেগ।',

    q_two: `শুধু ভরবেগের সমীকরণ দিয়ে ${S.v1}, ${S.v2} বের করা যায় না কেন?`,
    ans_unknowns: 'অজানা রাশি দুটি',
    ans_changes: 'ভরবেগ বদলে যায়',
    ans_mass: 'ভর জানা নেই',
    ans_force: 'বাইরের বল আছে',
    why_two: `<b>অজানা রাশি দুটি</b>: ${S.p_u1} + ${S.p_u2} = ${S.p_v1} + ${S.p_v2} একটি মাত্র সমীকরণ, অথচ ${S.v1} আর ${S.v2} দুটিই অজানা। তাই শক্তির সংরক্ষণশীলতার সমীকরণটিও লাগে।`,
    mis_t_changes: ' সম্মিলিত ভরবেগ বদলায় না, সেটিই এই সমীকরণ।',
    mis_t_mass: ' ভর দুটি জানা: ছবিতে লেখা আছে।',
    mis_t_force: ' বাইরে থেকে কোনো বল দেওয়া হয়নি; তাই তো ভরবেগ সংরক্ষিত।',
  },
  en: {
    title: 'Conservation of momentum and energy',
    ...UNITS,
    ...Object.fromEntries(Object.entries(SYM).map(([k, v]) => [`sym_${k}`, v])),
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Momentum',

    presets: 'Examples',
    preset_heavy: 'Heavy behind',
    preset_equal: 'Equal masses',
    preset_light: 'Light behind',
    preset_headon: 'Head-on',
    preset_aria: '{name}: m₁ = {m1} kg, m₂ = {m2} kg, u₁ = {u1} m/s, u₂ = {u2} m/s',

    col_before: 'Before the collision',
    col_after: 'After the collision',
    row_p: 'Momentum',
    row_k: 'Kinetic energy',
    eq_p_name: 'Conservation of momentum',
    eq_k_name: 'Conservation of energy',
    say_before: `What are ${S.v1} and ${S.v2} after the collision? The momentum equation alone has two unknowns, so the energy equation is needed too: together they give ${S.v1} and ${S.v2}.`,
    say_contact: 'While they touch, whatever momentum one loses the other gains: the total momentum stays the same all the time.',
    say_after:
      'No force acts from outside, so the total momentum is the same before and after: <b>conservation of momentum</b>. The kinetic energy is the same too: <b>conservation of energy</b>.',
    say_assume: 'Assumed: no energy other than kinetic energy changes hands in the collision.',
    act_play: 'Play',
    act_pause: 'Pause',
    act_replay: 'Play again',
    scrub: 'Time: from before to after the collision',
    phase_before: 'Before the collision',
    phase_contact: 'Collision',
    phase_after: 'After the collision',

    note_slow: 'Time {n}× slower',
    note_contact: 'The moment of impact: much slower still',
    lbl_mass1: `${S.m1} = {m} kg`,
    lbl_mass2: `${S.m2} = {m} kg`,
    lbl_u1: `${S.u1} = {v} m/s`,
    lbl_u2: `${S.u2} = {v} m/s`,
    lbl_v1: `${S.v1} = {v} m/s`,
    lbl_v2: `${S.v2} = {v} m/s`,
    lbl_now: '{v} m/s',
    lbl_v1_q: `${S.v1} = ?`,
    lbl_v2_q: `${S.v2} = ?`,
    strip_title: 'Momentum, mv (kg m/s)',
    strip_before: 'Before',
    strip_now: 'Now',
    strip_after: 'After',
    strip_total: 'Total',
    hint_meet: `To collide, ${S.m1} must move to the right faster than ${S.m2} (${S.u1} > ${S.u2}).`,
    coach_drag: 'Drag the arrow to change the velocity',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'Masses and velocities stay put during the test. Look at the picture and pick an answer.',

    q_total: 'What is the total momentum of the two masses before the collision?',
    why_total: `<b>{P} kg m/s</b>: ${S.p_u1} + ${S.p_u2} = {m1} × {u1} + {m2} × {u2} = {p1} + {p2} = {P} kg m/s.`,
    mis_sign: ` ${S.u2} points left, so it is negative.`,
    mis_one: ' Add the momentum of both masses.',
    mis_swap: ' Multiply each mass by its own velocity.',
    mis_noMass: ' Adding the velocities is not enough: momentum = mass × velocity.',
    mis_lump: ` Not (${S.m1} + ${S.m2}) × (${S.u1} + ${S.u2}): find each momentum, then add them.`,

    q_v2: `After the collision ${S.v1} = {v1} m/s. What is ${S.v2}, from the momentum equation?`,
    why_v2: `<b>{v2} m/s</b>: {P} = {m1} × {v1} + {m2} × ${S.v2}, so ${S.v2} = ({P} − {p1}) ÷ {m2} = {v2} m/s.`,
    mis_noDiv: ` That is ${S.m2}'s momentum; divide by ${S.m2} for its velocity.`,
    mis_noSub: ` First take away ${S.m1}'s momentum ({p1}).`,
    mis_addSub: ` Subtract ${S.m1}'s momentum, do not add it.`,
    mis_carry: ` The velocities change; ${S.u1} does not simply pass on to ${S.m2}.`,
    mis_flip: ' Wrong direction: negative means to the left.',

    q_ke: 'The book assumes only kinetic energy changes hands. What is the total kinetic energy after the collision?',
    why_ke: `<b>{K} J</b>: after = before = ${S.k_u1} + ${S.k_u2} = {k1} + {k2} = {K} J.`,
    mis_half: ' Kinetic energy is ½mv²: the ½ is missing.',
    mis_square: ' Square the velocity: ½mv².',
    mis_minus: ' Kinetic energy has no direction (a squared velocity is positive), so the two add up.',
    mis_isP: ' That is the total momentum (kg m/s), not the kinetic energy.',

    q_equal: `The two masses are equal. What will ${S.v1} be after the collision?`,
    why_equal: `<b>{v1} m/s</b>: equal masses swap velocities: ${S.v1} = ${S.u2} = {v1} m/s, ${S.v2} = ${S.u1} = {v2} m/s. Momentum: {P} = {P} kg m/s.`,
    mis_keep: ' The velocities change in a collision; they do not stay the same.',
    mis_stop: ' It does not always stop; here the velocities swap.',
    mis_share: ' Stuck together they would share an average velocity; here they swap.',
    mis_back: ' A ball bounces back when it hits something heavier.',

    q_light: `The light ${S.m1} will hit the heavy ${S.m2}, which is at rest. What will ${S.m1} do after the collision?`,
    ans_back: 'Bounce back',
    ans_stop: 'Stop',
    ans_slow: 'Go on slower',
    ans_together: 'Move with it',
    why_light: `<b>Bounce back</b>: ${S.v1} = ({m1} − {m2}) × {u1} ÷ ({m1} + {m2}) = {v1} m/s, negative means to the left. ${S.v2} = {v2} m/s. Momentum: {P} = {p1} + {p2}.`,
    mis_l_stop: ' It stops when the masses are equal; a light one bounces off a heavy one.',
    mis_l_slow: ' With the heavy mass in front, the light one cannot go on forwards.',
    mis_l_together: ' They move together only if they stick; here the kinetic energy is kept, so they part.',

    q_same: 'No force acts from outside. What is the same before and after the collision?',
    ans_totalP: 'Total momentum',
    ans_totalV: 'Total velocity',
    ans_v1: `${S.m1}'s velocity`,
    ans_p2: `${S.m2}'s momentum`,
    why_same: `<b>Total momentum</b>: {P} before and {P} kg m/s after. ${S.m1}'s velocity went from {u1} to {v1} m/s, the total velocity from {su} to {sv} m/s, ${S.m2}'s momentum from {p2u} to {p2v} kg m/s.`,
    mis_s_v: ' Not the velocities: the sum of mass × velocity stays the same.',
    mis_s_v1: ' Each velocity changes; only the total momentum stays the same.',
    mis_s_p2: ' One momentum grows and the other shrinks; the total stays the same.',

    q_two: `Why can the momentum equation alone not give ${S.v1} and ${S.v2}?`,
    ans_unknowns: 'Two unknowns',
    ans_changes: 'Momentum changes',
    ans_mass: 'Masses unknown',
    ans_force: 'An outside force',
    why_two: `<b>Two unknowns</b>: ${S.p_u1} + ${S.p_u2} = ${S.p_v1} + ${S.p_v2} is one equation, but ${S.v1} and ${S.v2} are both unknown. So the energy equation is needed too.`,
    mis_t_changes: ' The total momentum does not change: that is what the equation says.',
    mis_t_mass: ' Both masses are known: they are written on the picture.',
    mis_t_force: ' No force acts from outside; that is why momentum is conserved.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/** t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? num(vars[k]) : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
