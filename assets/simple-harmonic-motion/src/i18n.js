// Every string the figure shows, in Bangla (as the book, page 37: সরল স্পন্দন গতি, সাম্যবিন্দু, প্রান্ত, দ্রুতি,
// পর্যায়কাল, দোলনা, স্প্রিং) and English. Use t('key') in code, and t.num() for numbers (Bangla digits in Bangla).

export const STRINGS = {
  bn: {
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    q_again: 'আবার পরীক্ষা দাও',

    speed: 'দ্রুতি',
    unit_speed: 'মি/সে',
    unit_s: 'সেকেন্ড',
    examples: 'উদাহরণ',
    ex_swing: 'দোলনা',
    ex_spring: 'স্প্রিং',
    stop_end: 'প্রান্ত',
    stop_mid: 'সাম্যবিন্দু',
    speed_zero: 'দ্রুতি শূন্য',
    speed_max: 'দ্রুতি সর্বোচ্চ',
    graph_label: 'এক পর্যায়কালে দ্রুতি: দুই প্রান্তে শূন্য, সাম্যবিন্দুতে সর্বোচ্চ',
    graph_time: 'সময় →',
    period_span: 'এক পর্যায়কাল = <b>{T}</b> সেকেন্ড',
    act_play: 'চালাও',
    act_pause: 'থামাও',
    act_slow: 'ধীরে',
    slow_badge: 'সময় {k} গুণ ধীর',
    who_swing: 'দোলনাটি',
    who_spring: 'বস্তুটি',

    idea: '<b>প্রান্তে দ্রুতি শূন্য, সাম্যবিন্দুতে সর্বোচ্চ।</b> নীল বিন্দুগুলো দেখায় প্রতি {dt} সেকেন্ডে {who} কোথায় থাকে: প্রান্তের কাছে ঘন, মাঝখানে দূরে দূরে।',
    idea_drag: '<b>এবার ছেড়ে দাও!</b> যেখান থেকে ছাড়বে সেটিই হবে একটি প্রান্ত: সেখানে দ্রুতি শূন্য, সেখান থেকেই স্পন্দন শুরু।',
    coach_drag: 'টেনে ছেড়ে দাও',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'দেখে, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_locked: 'পরীক্ষার সময় টানা যায় না। দেখে উত্তর বেছে নাও।',

    q_fastest: 'ছবির ক, খ, গ বিন্দুর মধ্যে কোনটিতে দোলনার দ্রুতি সবচেয়ে বেশি?',
    q_zero: 'ছবির ক, খ, গ বিন্দুর মধ্যে কোনটিতে দোলনার দ্রুতি শূন্য?',
    opt_same: 'সব বিন্দুতে সমান',
    why_fastest: '<b>{p}</b> সাম্যবিন্দু: সেখানেই দ্রুতি সর্বোচ্চ; প্রান্তে দ্রুতি শূন্য।',
    why_zero: '<b>{p}</b> প্রান্ত: সেখানে এক মুহূর্ত থেমে দিক বদলায়, তাই দ্রুতি শূন্য।',
    q_trend: '{who} চিহ্নিত পথে তীরের দিকে যায়। এ সময় এর দ্রুতি কী হয়?',
    opt_up: 'ক্রমান্বয়ে বাড়ে',
    opt_down: 'ক্রমান্বয়ে কমে',
    opt_same_speed: 'একই থাকে',
    opt_up_down: 'বাড়ে, তারপর কমে',
    why_in: 'তীরটি প্রান্ত থেকে সাম্যবিন্দুর দিকে: দ্রুতি শূন্য থেকে সর্বোচ্চে, <b>ক্রমান্বয়ে বাড়ে</b>।',
    why_out: 'তীরটি সাম্যবিন্দু থেকে প্রান্তের দিকে: দ্রুতি সর্বোচ্চ থেকে শূন্যে, <b>ক্রমান্বয়ে কমে</b>।',
    q_journey: 'ক ও গ দুই প্রান্ত, খ সাম্যবিন্দু। কোন যাত্রায় সময় লাগে এক পর্যায়কাল?',
    why_journey: 'ক থেকে গ-তে গিয়ে আবার ক-তে ফেরা, পুরো একবার যাওয়া-আসা: <b>এক পর্যায়কাল</b>।',
    q_time_swing: 'একটি দোলনার এক প্রান্ত থেকে অপর প্রান্তে যেতে {h} সেকেন্ড লাগে। পর্যায়কাল কত?',
    q_time_spring: 'স্প্রিংয়ে ঝোলানো একটি বস্তুর এক প্রান্ত থেকে অপর প্রান্তে যেতে {h} সেকেন্ড লাগে। পর্যায়কাল কত?',
    why_time: 'যেতে {h} সেকেন্ড, ফিরতে আরও {h} সেকেন্ড: পর্যায়কাল <b>{T} সেকেন্ড</b>।',
    q_example: 'নিচের কোনটির গতি সরল স্পন্দন গতি?',
    opt_pendulum: 'ঘড়ির পেন্ডুলাম',
    opt_swing_child: 'দোলনায় দুলতে থাকা শিশু',
    opt_spring_mass: 'স্প্রিংয়ে ঝোলানো বস্তু',
    opt_clock_hand: 'ঘড়ির কাঁটা',
    opt_fan: 'ফ্যানের পাখা',
    opt_falling: 'পড়ন্ত বল',
    why_example: '<b>{right}</b> সাম্যবিন্দুর দুই পাশে যাওয়া-আসা করে: এটিই স্পন্দন।',
    why_example_turns: '<b>{right}</b> সাম্যবিন্দুর দুই পাশে যাওয়া-আসা করে; {pick} শুধু ঘোরে।',
    why_example_falls: '<b>{right}</b> যাওয়া-আসা করে; বল একদিকেই পড়ে, ফিরে আসে না।',
  },
  en: {
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    q_again: 'Take the test again',

    speed: 'Speed',
    unit_speed: 'm/s',
    unit_s: 's',
    examples: 'Example',
    ex_swing: 'Swing',
    ex_spring: 'Spring',
    stop_end: 'End',
    stop_mid: 'Equilibrium',
    speed_zero: 'speed zero',
    speed_max: 'speed greatest',
    graph_label: 'Speed over one period: zero at both ends, greatest at the equilibrium point',
    graph_time: 'time →',
    period_span: 'one period = <b>{T}</b> s',
    act_play: 'Play',
    act_pause: 'Pause',
    act_slow: 'Slow',
    slow_badge: 'Time {k}× slower',
    who_swing: 'the swing',
    who_spring: 'the mass',

    idea: '<b>Speed: zero at the ends, greatest at the equilibrium point.</b> The blue dots show where {who} is every {dt} s: close together near the ends.',
    idea_drag: '<b>Now let go!</b> Where you let go becomes an end: the speed there is zero.',
    coach_drag: 'Pull and let go',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_locked: 'You cannot pull it during the test. Look and pick an answer.',

    q_fastest: 'Of the points A, B and C in the picture, where is the swing fastest?',
    q_zero: "Of the points A, B and C in the picture, where is the swing's speed zero?",
    opt_same: 'Same everywhere',
    why_fastest: '<b>{p}</b> is the equilibrium point: the speed is greatest there; zero at the ends.',
    why_zero: '<b>{p}</b> is an end: it stops for an instant and turns back, so the speed is zero.',
    q_trend: 'Going along the marked path the way the arrow points, what does the speed of {who} do?',
    opt_up: 'keeps rising',
    opt_down: 'keeps falling',
    opt_same_speed: 'stays the same',
    opt_up_down: 'rises, then falls',
    why_in: 'The arrow points from an end to the equilibrium point: the speed <b>keeps rising</b>.',
    why_out: 'The arrow points from the equilibrium point to an end: the speed <b>keeps falling</b>.',
    q_journey: 'A and C are the ends, B the equilibrium point. Which journey takes one period?',
    why_journey: 'From A to C and back to A, one full back-and-forth: <b>one period</b>.',
    q_time_swing: 'A swing goes from one end to the other in {h} s. What is its period?',
    q_time_spring: 'A mass on a spring goes from one end to the other in {h} s. What is its period?',
    why_time: 'There in {h} s, back in another {h} s: the period is <b>{T} s</b>.',
    q_example: 'Which of these moves in simple harmonic motion?',
    opt_pendulum: 'Clock pendulum',
    opt_swing_child: 'Child on a swing',
    opt_spring_mass: 'Mass on a spring',
    opt_clock_hand: 'Clock hand',
    opt_fan: 'Fan blade',
    opt_falling: 'A falling ball',
    why_example: '<b>{right}</b> goes to and fro about the equilibrium point: that is oscillation.',
    why_example_turns: '<b>{right}</b> goes to and fro about the equilibrium point; “{pick}” only goes round.',
    why_example_falls: '<b>{right}</b> goes to and fro; a ball falls one way and does not come back.',
  },
};

/** The letters that mark points in the test (ক খ গ in Bangla). */
export const LETTERS = { bn: ['ক', 'খ', 'গ'], en: ['A', 'B', 'C'] };

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
  t.letters = LETTERS[code];
  return t;
}
