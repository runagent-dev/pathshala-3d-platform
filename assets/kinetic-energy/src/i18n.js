// Every string the figure shows, in Bangla (NCTB terms, as on book p104) and English. Use t('key') in code, and
// t.num() for numbers (Bangla digits when the language is Bangla). Symbols in <i>, powers in <sup> (the bundled
// Noto Sans Bengali has no ² or ½ glyphs); the formula's own markup is built in app.js.

export const STRINGS = {
  bn: {
    title: 'গতিশক্তি (Kinetic Energy)',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'গতিশক্তি',
    aria_stage: 'একজন তীরন্দাজ ধনুকের ছিলা টেনে তীর ছোড়েন; তীরটি খড়ের গাদায় ঢুকে যায়।',

    calc: 'তীরের ভর আর বেগ',
    calc_m: 'ভর',
    calc_v: 'বেগ',
    m_down: 'হালকা তীর নাও',
    m_up: 'ভারী তীর নাও',
    v_down: 'বেগ কমাও (ছিলা কম টানো)',
    v_up: 'বেগ বাড়াও (ছিলা বেশি টানো)',
    v_max: 'এই ধনুক এত ভারী তীরকে এর বেশি বেগ দিতে পারে না: ছিলা আর টানা যায় না।',
    u_kg: 'kg',
    u_ms: 'm/s',
    u_J: 'J',
    u_cm: 'cm',

    act_shoot: 'ছিলা টেনে ছেড়ে দাও',
    act_again: 'আবার ছোড়ো',
    act_home: 'নতুন করে',
    busy: 'তীর ছুটছে…',

    out_start: 'ছিলা যত বেশি টানবে, তীর তত জোরে ছুটবে।',
    out_drawn: 'ছিলা টানা হয়েছে: <b class="pe">বাঁকা ধনুকে শক্তি জমা</b>',
    out_flying: 'তীর ছুটছে <b>{v} m/s</b> বেগে',
    out_first: 'চলন্ত তীর খড় ঠেলে ভেতরে ঢুকল: <b>তার শক্তি আছে</b>',
    out_cmp_v: 'আগের তীরের চেয়ে বেগ {rv} গুণ, তাই গতিশক্তি <b>{rt} গুণ</b>',
    out_cmp_m: 'আগের তীরের চেয়ে ভর {rm} গুণ, তাই গতিশক্তি <b>{rt} গুণ</b>',
    out_cmp_both: 'ভর {rm} গুণ, বেগ {rv} গুণ: গতিশক্তি <b>{rt} গুণ</b>',
    out_cmp_same: 'আগের তীরের সমান ভর, সমান বেগ: গতিশক্তিও <b>সমান</b>',

    rule_start: '<b>ছিলা টেনে ধনুক বাঁকালে তাতে শক্তি জমা হয়।</b> ছেড়ে দিলে ছিলা তীরকে ঠেলে নিয়ে যায়, অর্থাৎ কাজ করে; সেই কাজ হয় তীরের গতির শক্তি।',
    rule_first: 'গতির জন্য বস্তুর যে শক্তি, তাকে বলা হয় <b>গতিশক্তি</b>। চলন্ত তীর খড়কে ঠেলে ভেতরে ঢুকল, অর্থাৎ কাজ করল। এবার বেগ <i>v</i> দ্বিগুণ করে ছোড়ো।',
    rule_v2:
      '<b>বেগ দ্বিগুণ হলে গতিশক্তি চার গুণ</b>, কারণ <i>T</i> = ½<i>mv</i><sup>2</sup>-এ <i>v</i> বর্গ হিসেবে আছে। দ্রুত তীরটি খড়েও প্রায় চার গুণ গভীরে ঢুকেছে। এবার ভর বদলে দেখো।',
    rule_v: '<b>গতিশক্তি বাড়ে বেগের বর্গের সঙ্গে</b>: বেগ {rv} গুণ হলে গতিশক্তি {rt} গুণ। বেগ ঠিক দ্বিগুণ করেও দেখো।',
    rule_m2: '<b>ভর দ্বিগুণ হলে গতিশক্তিও দ্বিগুণ</b>: ½<i>mv</i><sup>2</sup>-এ <i>m</i>-এর বর্গ নেই। একই বেগে ভারী তীর খড়ে দ্বিগুণ গভীরে ঢোকে।',
    rule_m: '<b>গতিশক্তি বাড়ে ভরের সমান হারে</b>: ভর {rm} গুণ হলে গতিশক্তিও {rt} গুণ। এবার ভর দ্বিগুণ করে দেখো।',
    rule_both:
      '<b><i>T</i> = ½<i>mv</i><sup>2</sup>:</b> ভর দ্বিগুণ হলে গতিশক্তি দ্বিগুণ, কিন্তু বেগ দ্বিগুণ হলে চার গুণ। তাই কোনো বস্তুর বেগ দ্বিগুণ করতে চার গুণ শক্তি দিতে হয়।',
    rule_mix: 'ভর আর বেগ দুটোই বদলেছে। একবারে একটা বদলে ছোড়ো, তাহলে বোঝা যাবে কোনটার জন্য কতটা বাড়ল।',

    l_store: 'বাঁকা ধনুকে শক্তি জমা',
    l_T: '<i>T</i> = {T} J',
    l_prev: 'আগের তীর: {T} J',
    l_v: '<i>v</i> = {v} m/s',
    l_mv: '<i>m</i> = {m} kg, <i>v</i> = {v} m/s',
    l_m: '<i>m</i> = {m} kg',
    l_q: '<i>T</i> = ?',
    l_rest: 'তীর এখনো স্থির',
    note: 'তীরের ওড়া {k} গুণ ধীর করে দেখানো',
    l_cut: 'খড়ের গাদা কেটে ভেতর দেখানো',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ধনুক আর তীর আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_rest: 'ছবিতে ছিলা টেনে ধরা, তীর এখনো ছোটেনি। ছেড়ে দিলে তীর {v} m/s বেগ পাবে। এই মুহূর্তে তীরের গতিশক্তি কত?',
    q_calc: 'ছবির তীরটির ভর আর বেগ তার পাশে লেখা। তীরটির গতিশক্তি T কত?',
    q_double: 'দুটি একই রকম তীর খড়ে ঢুকেছে; ছবিতে তাদের বেগ লেখা। ধীর তীরটির গতিশক্তি {T} J হলে দ্রুত তীরটির গতিশক্তি কত?',
    q_mass: 'ছবির দুটি তীর একই বেগে ({v} m/s) ছুটে খড়ে ঢুকেছে; তাদের ভর পাশে লেখা। ভারী তীরটির গতিশক্তি হালকাটির কত গুণ?',
    q_work: 'থেমে থাকা তীরকে (u = {z}) ছিলা ঠেলে নিয়ে যাওয়ার সময় তার উপর {W} J কাজ করল। ছোটার সময় তীরের গতিশক্তি কত?',
    c_times: '{r} গুণ',
    about: 'প্রায় ',
    c_same: 'সমান',
    c_half: 'অর্ধেক',

    a_rest: '<b>{z} J</b>: তীর এখনো স্থির (<i>v</i> = {z}), তাই <i>T</i> = {z}; শক্তি এখন বাঁকা ধনুকে জমা।',
    n_rest_T: '{T} J তীর পাবে ছেড়ে দেওয়ার পরে; এখন সে শক্তি ধনুকে।',
    n_rest_half: 'এটা ½<i>mv</i>, তা-ও ছোটার পরের; এখন তীর স্থির।',
    n_rest_m: 'এটা ½<i>m</i>: বেগ বাদ পড়েছে; স্থির তীরের গতিশক্তি শূন্য।',
    a_calc: '<b>{T} J</b>: <i>T</i> = ½<i>mv</i><sup>2</sup> = ½ × {m} kg × ({v} m/s)<sup>2</sup> = {T} J।',
    n_calc_half: 'এটা ½<i>mv</i>: <i>v</i>-কে বর্গ করোনি।',
    n_calc_noHalf: 'এটা <i>mv</i><sup>2</sup>: ½ দিয়ে গুণ করতে ভুলে গেছ।',
    n_calc_g: 'এটা ½ × {g} × <i>v</i><sup>2</sup>: ভর kg-তে না নিয়ে গ্রামে বসিয়েছ।',
    n_calc_mv: 'এটা <i>mv</i>: গতিশক্তির সূত্র ½<i>mv</i><sup>2</sup>।',
    a_double: '<b>{T2} J</b>: বেগ দ্বিগুণ, তাই গতিশক্তি চার গুণ: {T1} J × {k}।',
    n_double_2: 'দ্বিগুণ ধরেছ; কিন্তু ½<i>mv</i><sup>2</sup>-এ <i>v</i> বর্গ হিসেবে আছে, তাই চার গুণ।',
    n_double_same: 'একই তীর হলেও বেগ বেশি হলে গতিশক্তি বেশি।',
    n_double_8: 'এটা আট গুণ: বেগ দ্বিগুণ হলে গতিশক্তি দুই দুগুণে চার গুণ, আট নয়।',
    a_mass: '<b>{r} গুণ</b>: একই বেগে ভর দ্বিগুণ হলে ½<i>mv</i><sup>2</sup>-ও দ্বিগুণ; খড়েও দ্বিগুণ গভীরে।',
    n_mass_4: 'চার গুণ হতো বেগ দ্বিগুণ হলে; সূত্রে <i>m</i>-এর বর্গ নেই।',
    n_mass_same: 'বেগ সমান, কিন্তু ভর বেশি হলে গতিশক্তি বেশি; ভারী তীর বেশি গভীরে।',
    n_mass_half: 'উল্টো ধরেছ: ভারী তীরের গতিশক্তি বেশি।',
    a_work: '<b>{W} J</b>: ½<i>mv</i><sup>2</sup> = ½<i>mu</i><sup>2</sup> + <i>W</i>; <i>u</i> = {z}, তাই গতিশক্তি = <i>W</i>।',
    n_work_0: 'শুরুতে গতিশক্তি শূন্য ছিল; কাজ <i>W</i> সেটা বাড়ায়।',
    n_work_half: 'কাজের অর্ধেক নয়: <i>u</i> = {z} হলে ½<i>mv</i><sup>2</sup> = <i>W</i>।',
    n_work_double: 'দ্বিগুণ নয়: যতটুকু কাজ, ঠিক ততটুকু গতিশক্তি।',
  },
  en: {
    title: 'Kinetic energy',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Kinetic energy',
    aria_stage: 'An archer draws the bowstring and lets an arrow fly; it sinks into a straw bale.',

    calc: 'Mass and speed of the arrow',
    calc_m: 'Mass',
    calc_v: 'Speed',
    m_down: 'Take a lighter arrow',
    m_up: 'Take a heavier arrow',
    v_down: 'Slower (draw less)',
    v_up: 'Faster (draw more)',
    v_max: 'This bow cannot give so heavy an arrow more speed: the string cannot be drawn further.',
    u_kg: 'kg',
    u_ms: 'm/s',
    u_J: 'J',
    u_cm: 'cm',

    act_shoot: 'Draw the string and let go',
    act_again: 'Shoot again',
    act_home: 'Start over',
    busy: 'The arrow is flying…',

    out_start: 'The further you draw the string, the faster the arrow flies.',
    out_drawn: 'String drawn: <b class="pe">energy stored in the bent bow</b>',
    out_flying: 'The arrow flies at <b>{v} m/s</b>',
    out_first: 'The moving arrow pushed into the straw: <b>it has energy</b>',
    out_cmp_v: 'Speed {rv} × the last arrow’s, so kinetic energy <b>{rt} ×</b>',
    out_cmp_m: 'Mass {rm} × the last arrow’s, so kinetic energy <b>{rt} ×</b>',
    out_cmp_both: 'Mass {rm} ×, speed {rv} ×: kinetic energy <b>{rt} ×</b>',
    out_cmp_same: 'Same mass, same speed as the last arrow: <b>same</b> kinetic energy',

    rule_start:
      '<b>Drawing the string bends the bow and stores energy in it.</b> Let go, and the string pushes the arrow along, that is, it does work; that work becomes the arrow’s energy of motion.',
    rule_first:
      'The energy a body has because it moves is called <b>kinetic energy</b>. The moving arrow pushed the straw aside and went in: it did work. Now double the speed <i>v</i> and shoot again.',
    rule_v2:
      '<b>Double the speed, four times the kinetic energy</b>, because <i>v</i> is squared in <i>T</i> = ½<i>mv</i><sup>2</sup>. The faster arrow also went about four times as deep. Now change the mass.',
    rule_v: '<b>Kinetic energy grows with the square of the speed</b>: speed {rv} × gives kinetic energy {rt} ×. Try exactly double the speed too.',
    rule_m2:
      '<b>Double the mass, double the kinetic energy</b>: the mass is not squared in ½<i>mv</i><sup>2</sup>. At the same speed the heavy arrow goes twice as deep.',
    rule_m: '<b>Kinetic energy grows in step with the mass</b>: mass {rm} × gives kinetic energy {rt} ×. Now try double the mass.',
    rule_both:
      '<b><i>T</i> = ½<i>mv</i><sup>2</sup>:</b> double the mass and the kinetic energy doubles, but double the speed and it is four times. So doubling a body’s speed takes four times the energy.',
    rule_mix: 'You changed both the mass and the speed. Change one at a time, then you can see what each one does.',

    l_store: 'Energy stored in the bent bow',
    l_T: '<i>T</i> = {T} J',
    l_prev: 'Last arrow: {T} J',
    l_v: '<i>v</i> = {v} m/s',
    l_mv: '<i>m</i> = {m} kg, <i>v</i> = {v} m/s',
    l_m: '<i>m</i> = {m} kg',
    l_q: '<i>T</i> = ?',
    l_rest: 'Arrow still at rest',
    note: 'The flight is shown {k} times slower',
    l_cut: 'Bale cut open to show inside',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The bow and arrow stay put during the test. Look at the picture and pick an answer.',

    q_rest:
      'The string is held drawn; the arrow has not left yet. Released, it will fly at {v} m/s. What is the arrow’s kinetic energy <b>right now</b>?',
    q_calc: 'The arrow’s mass and speed are written next to it. What is its kinetic energy T?',
    q_double:
      'Two identical arrows went into the straw; their speeds are in the picture. The slower one had {T} J. How much did the faster one have?',
    q_mass:
      'Both arrows flew at the same speed ({v} m/s); their masses are next to them. The heavy arrow’s kinetic energy is how many times the light one’s?',
    q_work: 'The string does {W} J of work on an arrow that starts at rest (u = {z}). What is the arrow’s kinetic energy as it flies?',
    c_times: '{r} ×',
    about: 'about ',
    c_same: 'the same',
    c_half: 'half',

    a_rest: '<b>{z} J</b>: the arrow is still at rest (<i>v</i> = {z}), so <i>T</i> = {z}. The energy is stored in the bent bow for now.',
    n_rest_T: '{T} J is what the arrow gets after it is released, while it flies; for now that energy is in the bow.',
    n_rest_half: 'That is ½<i>mv</i>: you forgot to square. Besides, the arrow is still at rest.',
    n_rest_m: 'That is ½<i>m</i>: the speed is missing; and an arrow at rest has no kinetic energy.',
    a_calc: '<b>{T} J</b>: <i>T</i> = ½<i>mv</i><sup>2</sup> = ½ × {m} kg × ({v} m/s)<sup>2</sup> = {T} J.',
    n_calc_half: 'That is ½<i>mv</i>: <i>v</i> was not squared.',
    n_calc_noHalf: 'That is <i>mv</i><sup>2</sup>: you forgot the ½.',
    n_calc_g: 'That is ½ × {g} × <i>v</i><sup>2</sup>: the mass was put in grams, not kg.',
    n_calc_mv: 'That is <i>mv</i>: kinetic energy is ½<i>mv</i><sup>2</sup>.',
    a_double: '<b>{T2} J</b>: twice the speed, so four times the kinetic energy: {T1} J × {k} = {T2} J.',
    n_double_2: 'You doubled it; but <i>v</i> is squared in ½<i>mv</i><sup>2</sup>, so it is 4 times.',
    n_double_same: 'Same arrow, but more speed means more kinetic energy.',
    n_double_8: 'That is 8 times: twice the speed gives 2 × 2 = 4 times, not 8.',
    a_mass:
      '<b>{r} ×</b>: at the same speed <i>T</i> = ½<i>mv</i><sup>2</sup> grows in step with the mass; twice the mass, twice the kinetic energy (and twice as deep in the straw).',
    n_mass_4: 'Four times would be for twice the speed; the mass is not squared.',
    n_mass_same: 'Same speed, but more mass means more kinetic energy; the heavy arrow went deeper.',
    n_mass_half: 'The other way round: the heavy arrow has more kinetic energy.',
    a_work:
      '<b>{W} J</b>: ½<i>mv</i><sup>2</sup> = ½<i>mu</i><sup>2</sup> + <i>W</i>; with <i>u</i> = {z} the kinetic energy equals <i>W</i> = {W} J.',
    n_work_0: 'It started with no kinetic energy, but the work <i>W</i> raises it to ½<i>mu</i><sup>2</sup> + <i>W</i>.',
    n_work_half: 'Not half the work: with <i>u</i> = {z}, ½<i>mv</i><sup>2</sup> = <i>W</i>.',
    n_work_double: 'Not double: as much work, exactly as much kinetic energy.',
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
