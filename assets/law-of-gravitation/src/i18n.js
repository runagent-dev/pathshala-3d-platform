// Every string the figure shows, in Bangla (the book's words, pages 78–79, topic ৩.৭: মহাকর্ষ বল, ভর, দূরত্ব,
// আকর্ষণ করে, মহাকর্ষীয় ধ্রুবক, পৃথিবীর কেন্দ্র, পৃথিবীপৃষ্ঠ, ব্যাসার্ধ, ওজন, মাধ্যাকর্ষণ, ত্বরণ, কেন্দ্রবিন্দু; this page
// writes উপর) and English. Use t('key', vars) in code, and t.num() for numbers (Bangla digits when the language is
// Bangla). Symbols with subscripts and powers (m₁, r², 10⁻⁵, ms⁻²) come in as vars built in app.js with <sub>/<sup>:
// the bundled font has no ₁ ² ⁻ glyphs.

export const STRINGS = {
  bn: {
    title: 'মহাকর্ষ বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'মহাকর্ষ বল',
    newton: 'নিউটন',

    // the examples: one row of words, a small result under each once found
    ex_label: 'কী বদলে দেখবে',
    ex_dist: 'দূরত্ব',
    ex_mass: 'ভর',
    ex_earth: 'পৃথিবী',
    res_part: 'বল {a} ভাগের {b}',
    res_times: 'বল {k} গুণ',
    res_g: 'g প্রায় {g}',
    res_weight: 'ওজন {w} নিউটন',

    // the action: the big button, and the same numbered badge on the sphere or the weight
    act_double_r: 'দূরত্ব দ্বিগুণ করো',
    act_double_m1: 'বাম গোলকের ভর দ্বিগুণ করো',
    act_double_m2: 'ডান গোলকের ভর দ্বিগুণ করো',
    act_place: 'বাটখারাটি পৃথিবীতে রাখো',
    act_add: 'আরেকটি বাটখারা উপরে রাখো',
    act_again: 'আবার প্রথম থেকে দেখো',
    act_home: 'শুরুতে ফেরাও',

    // labels on the 3D view
    l_mass: '{m}<small>{kg} kg</small>',
    l_force: '{F}',
    l_force_value: '{F} = {f} নিউটন',
    l_r: '{r} = {v} m',
    l_weight: 'ওজন {F}',
    l_on_earth: '{F}',
    l_centre: 'পৃথিবীর কেন্দ্র',
    l_R: '{R} = {v} m',
    l_radius: 'পৃথিবীর ব্যাসার্ধ {v} km',
    l_lift: '{h} m',
    l_start: 'শুরুতে',
    l_before: 'আগে',
    l_weight_m: '{m} = {kg} kg',
    l_R_short: '{R}',
    l_r2R: '{r} = {two}{R}',
    note_spheres: 'আসল বল {kg} kg বাটখারার ওজনের প্রায় দেড় লক্ষ ভাগের {one} ভাগ; তাই তীর অনেক বড় করে আঁকা',
    note_earth: 'পৃথিবীর তুলনায় বাটখারা অনেক বড় করে আঁকা',

    // the result line: the number that matters in <b>; no-break spaces keep a number with its unit
    out_force: 'বল {F} = <b>{f} নিউটন</b>',
    out_force_vs: 'বল {F} = <b>{f} নিউটন</b> <small>(শুরুর {k})</small>',
    k_part: '{a} ভাগের {b}',
    k_times: '{a} গুণ',
    out_earth: '{M} = {mv} kg, {R} = {rv} m',
    out_weight: '{kg} kg বাটখারার ওজন প্রায় <b>{w} নিউটন</b>',
    out_weight2: '{kg} kg এর ওজন প্রায় {w} নিউটন, {g} = <b>{gv} {ms2}</b>',

    // the rule line: the book's words in <b>, growing with what the student has found out
    rule_start: '<b>{m1} ভরটি {m2} কে নিজের দিকে {F} বলে আকর্ষণ করে আবার {m2} ভরটি একই বলে {m1} কে নিজের দিকে আকর্ষণ করে।</b>',
    rule_dist: '<b>{law}</b>: দূরত্ব দ্বিগুণ হলে {r2} হয় {four} গুণ, তাই <b>বল হয় {four} ভাগের {one} ভাগ</b>।',
    rule_m1: '<b>{law}</b>: একটি ভর দ্বিগুণ হলে <b>বল দ্বিগুণ</b>, দুই গোলকের উপরই। ছোট গোলকটিও বড়টিকে একই বলে টানে।',
    rule_m2: '<b>{law}</b>: দুটি ভরই দ্বিগুণ হলে <b>বল {four} গুণ</b>: বল বাড়ে ভর দুটির গুণফল {m1}{m2} এর সাথে।',
    rule_sum_dist: '<b>{law}</b>: দূরত্ব দ্বিগুণ হলে বল {four} ভাগের {one} ভাগ। ভর বদলালে কী হয়?',
    rule_sum_mass: '<b>{law}</b>: একটি ভর দ্বিগুণ হলে বল দ্বিগুণ। দূরত্ব বদলালে কী হয়?',
    rule_sum_both: '<b>{law}</b>: একটি ভর দ্বিগুণ হলে বল দ্বিগুণ; দূরত্ব দ্বিগুণ হলে বল {four} ভাগের {one} ভাগ।',
    rule_earth0: '<b>পৃথিবী {m} ভরকে তার কেন্দ্রের দিকে {F} = {GMm} বলে আকর্ষণ করবে।</b> এই বলটিই আসলে বস্তুটির ওজন।',
    rule_earth1: '<b>{R} পৃথিবীর কেন্দ্র থেকে {m} ভরটি পর্যন্ত দূরত্ব, পৃথিবীপৃষ্ঠ থেকে নয়।</b> পৃথিবী এমনভাবে টানে যেন তার সমস্ত ভর কেন্দ্রবিন্দুতে জমা।',
    rule_earth2: '<b>{GMm} = {mg}, তাই {g} = {GM}।</b> এতে {m} নেই: যেকোনো ভরের জন্য {g} একই, প্রায় {gv} {ms2}।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। দেখে উত্তর বেছে নাও।',

    q_mass: 'দূরত্ব একই রেখে {side} গোলকের ভর দ্বিগুণ করলে বল {F} কত হবে?',
    side_left: 'বাম',
    side_right: 'ডান',
    why_mass: '<b>{ans} নিউটন</b>: একটি ভর দ্বিগুণ হলে {m1}{m2} দ্বিগুণ, তাই বলও দ্বিগুণ: {f} × {two} ≈ {ans}।',
    not_mass_sq: 'ভরের বর্গ হয় না; বর্গ শুধু দূরত্বের ({r2})।',
    not_mass_inv: 'ভর বাড়লে বল বাড়ে, কমে না।',
    not_mass_same: 'দুটি ভরই বলের জন্য দায়ী; একটি বাড়লেই বল বাড়ে।',

    q_dist2: 'ভর একই রেখে দূরত্ব দ্বিগুণ করলে বল {F} কত হবে?',
    q_dist_half: 'ভর একই রেখে দূরত্ব অর্ধেক করলে বল {F} কত হবে?',
    why_dist2: '<b>{ans} নিউটন</b>: দূরত্ব দ্বিগুণ হলে {r2} হয় {four} গুণ, তাই বল {four} ভাগের {one} ভাগ: {f} ÷ {four} ≈ {ans}।',
    why_dist_half: '<b>{ans} নিউটন</b>: দূরত্ব অর্ধেক হলে {r2} হয় {four} ভাগের {one} ভাগ, তাই বল {four} গুণ: {f} × {four} ≈ {ans}।',
    not_dist_nosq: 'সূত্রে দূরত্বের বর্গ {r2} আছে, শুধু {r} নয়।',
    not_dist_far: 'দূরত্ব বাড়লে বল কমে, বাড়ে না।',
    not_dist_near: 'দূরত্ব কমলে বল বাড়ে, কমে না।',

    q_equal: 'বড় গোলকটি ছোটটিকে যে বলে টানে, ছোট গোলকটি বড়টিকে কত বলে টানে?',
    eq_same: 'একই মানের বলে',
    eq_less: '{k} গুণ কম বলে',
    eq_more: '{k} গুণ বেশি বলে',
    eq_none: 'কোনো বলেই টানে না',
    why_equal: '<b>একই মানের বলে</b>: {m1} যে বলে {m2} কে আকর্ষণ করে, {m2} ও একই বলে {m1} কে আকর্ষণ করে।',
    not_eq_less: 'বল ভর দুটির গুণফলের উপর নির্ভর করে: দুই গোলকের জন্য একই।',
    not_eq_more: 'ছোট গোলকের উপর বল বেশি নয়: একই গুণফল, একই বল।',
    not_eq_none: 'ভর আছে এমন যেকোনো বস্তু অন্য বস্তুকে আকর্ষণ করে।',

    q_radius: 'বাটখারাটি মাটি থেকে {h} m উপরে। {F} = {GMm} সূত্রে {R} কত নেবে?',
    why_radius: '<b>প্রায় {ans} m</b>: {R} পৃথিবীর কেন্দ্র থেকে বাটখারা পর্যন্ত দূরত্ব, {km} km আর তার উপর {h} m: প্রায় পৃথিবীর ব্যাসার্ধ।',
    not_rad_height: 'পৃথিবীপৃষ্ঠ থেকে দূরত্ব নয়, কেন্দ্র থেকে।',
    not_rad_diam: 'এটি পৃথিবীর ব্যাস; {R} মাপা হয় কেন্দ্র থেকে।',
    not_rad_km: '{km} km = {m} m, {kmm} m নয়।',

    q_h: 'ছবিতে বাটখারাটি যেখানে আছে, সেখানে {g} কত? পৃথিবীপৃষ্ঠে {g} = {g0} {ms2}।',
    why_h: '<b>প্রায় {ans} {ms2}</b>: দূরত্ব {two}{R}, {r2} হয় {four} গুণ, তাই {g} হয় {four} ভাগের {one} ভাগ: {g0} ÷ {four} ≈ {ans}।',
    not_h_nosq: 'দূরত্ব {two} গুণ হলে {g} {four} ভাগের {one} ভাগ হয়, অর্ধেক নয়।',
    not_h_same: 'দূরত্ব বাড়লে {g} কমে, একই থাকে না।',
    not_h_more: 'দূরত্ব বাড়লে {g} কমে, বাড়ে না।',
  },
  en: {
    title: 'Gravitational force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Gravitational force',
    newton: 'N',

    ex_label: 'What to change',
    ex_dist: 'Distance',
    ex_mass: 'Mass',
    ex_earth: 'Earth',
    res_part: 'force {b}/{a}',
    res_times: 'force × {k}',
    res_g: 'g about {g}',
    res_weight: 'weight {w} N',

    act_double_r: 'Double the distance',
    act_double_m1: 'Double the left mass',
    act_double_m2: 'Double the right mass',
    act_place: 'Put the weight on the Earth',
    act_add: 'Put another weight on top',
    act_again: 'Start again',
    act_home: 'Back to the start',

    l_mass: '{m}<small>{kg} kg</small>',
    l_force: '{F}',
    l_force_value: '{F} = {f} N',
    l_r: '{r} = {v} m',
    l_weight: 'weight {F}',
    l_on_earth: '{F}',
    l_centre: "Earth's centre",
    l_R: '{R} = {v} m',
    l_radius: "Earth's radius {v} km",
    l_lift: '{h} m',
    l_start: 'start',
    l_before: 'before',
    l_weight_m: '{m} = {kg} kg',
    l_R_short: '{R}',
    l_r2R: '{r} = {two}{R}',
    note_spheres: 'The real force is about 1/150,000 of the weight of a {kg} kg mass, so the arrows are drawn much bigger',
    note_earth: 'The weight is drawn much bigger than the Earth allows',

    out_force: 'Force {F} = <b>{f} N</b>',
    out_force_vs: 'Force {F} = <b>{f} N</b> <small>({k} the start)</small>',
    k_part: '{b}/{a} of',
    k_times: '{a} ×',
    out_earth: '{M} = {mv} kg, {R} = {rv} m',
    out_weight: 'The {kg} kg weight weighs about <b>{w} N</b>',
    out_weight2: '{kg} kg weighs about {w} N, {g} = <b>{gv} {ms2}</b>',

    rule_start: '<b>{m1} pulls {m2} towards itself with a force {F}, and {m2} pulls {m1} towards itself with the same force.</b>',
    rule_dist: '<b>{law}</b>: double the distance and {r2} becomes {four} times as big, so <b>the force drops to {one}/{four}</b>.',
    rule_m1: '<b>{law}</b>: double one mass and <b>the force doubles</b>, on both spheres. The small sphere pulls the big one just as hard.',
    rule_m2: '<b>{law}</b>: double both masses and <b>the force is {four} times</b>: it grows with the product {m1}{m2}.',
    rule_sum_dist: '<b>{law}</b>: double the distance, the force drops to {one}/{four}. What does a mass do?',
    rule_sum_mass: '<b>{law}</b>: double one mass, the force doubles. What does the distance do?',
    rule_sum_both: '<b>{law}</b>: double one mass, the force doubles; double the distance, it drops to {one}/{four}.',
    rule_earth0: '<b>The Earth pulls a mass {m} towards its centre with {F} = {GMm}.</b> This force is the body’s weight.',
    rule_earth1:
      '<b>{R} is the distance from the Earth’s centre to {m}, not from the surface.</b> The Earth pulls as if all its mass were at its centre.',
    rule_earth2: '<b>{GMm} = {mg}, so {g} = {GM}.</b> There is no {m} in it: {g} is the same for any mass, about {gv} {ms2}.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The scene stays put during the test. Look and pick an answer.',

    q_mass: 'Keeping the distance, double the {side} mass. What does the force {F} become?',
    side_left: 'left',
    side_right: 'right',
    why_mass: '<b>{ans} N</b>: one mass doubled doubles {m1}{m2}, so the force doubles: {f} × {two} ≈ {ans}.',
    not_mass_sq: 'Masses are not squared; only the distance is ({r2}).',
    not_mass_inv: 'More mass, more force, not less.',
    not_mass_same: 'Both masses make the force; increase one and it grows.',

    q_dist2: 'Keeping the masses, double the distance. What does the force {F} become?',
    q_dist_half: 'Keeping the masses, halve the distance. What does the force {F} become?',
    why_dist2: '<b>{ans} N</b>: double the distance and {r2} is {four} times, so the force is {one}/{four}: {f} ÷ {four} ≈ {ans}.',
    why_dist_half: '<b>{ans} N</b>: halve the distance and {r2} is {one}/{four}, so the force is {four} times: {f} × {four} ≈ {ans}.',
    not_dist_nosq: 'The formula has the square {r2}, not just {r}.',
    not_dist_far: 'Farther apart, less force, not more.',
    not_dist_near: 'Closer together, more force, not less.',

    q_equal: 'The big sphere pulls the small one with some force. How hard does the small one pull the big one?',
    eq_same: 'With the same force',
    eq_less: '{k} times less',
    eq_more: '{k} times more',
    eq_none: 'Not at all',
    why_equal: '<b>With the same force</b>: {m1} pulls {m2} with the same force as {m2} pulls {m1}.',
    not_eq_less: 'The force depends on the product of both masses, the same for both spheres.',
    not_eq_more: 'The small sphere is not pulled harder; same product, same force.',
    not_eq_none: 'Any body with mass attracts any other.',

    q_radius: 'The weight is {h} m above the ground. Which {R} goes in {F} = {GMm}?',
    why_radius:
      '<b>About {ans} m</b>: {R} is the distance from the Earth’s centre to the weight, {km} km and {h} m on top: about the Earth’s radius.',
    not_rad_height: 'Not from the surface: from the centre.',
    not_rad_diam: 'That is the diameter; {R} is from the centre.',
    not_rad_km: '{km} km = {m} m, not {kmm} m.',

    q_h: 'What is {g} where the weight is in the picture? At the Earth’s surface {g} = {g0} {ms2}.',
    why_h: '<b>About {ans} {ms2}</b>: the distance is {two}{R}, {r2} is {four} times, so {g} is {one}/{four}: {g0} ÷ {four} ≈ {ans}.',
    not_h_nosq: 'Twice as far, {g} is {one}/{four}, not a half.',
    not_h_same: 'Farther away, {g} is less, not the same.',
    not_h_more: 'Farther away, {g} is less, not more.',
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
