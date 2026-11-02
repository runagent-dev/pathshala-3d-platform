// Every string the figure shows, in Bangla (the book's words, pages 78–79, topic ৩.৭: মহাকর্ষ বল, ভর, দূরত্ব,
// আকর্ষণ করে, মহাকর্ষীয় ধ্রুবক, পৃথিবীর কেন্দ্র, পৃথিবীপৃষ্ঠ, ব্যাসার্ধ, ওজন, মাধ্যাকর্ষণ, ত্বরণ, কেন্দ্রবিন্দু; this page
// writes উপর) and English. Plain words first (the owner: "this needs to explain more easily"): a student reads টান,
// গোলক, বাম/ডান, ২ গুণ, ৪ ভাগের ১ ভাগ before any symbol; F, G, m₁, m₂, r, R, g come in only after the student has
// seen what they stand for, and no power of ten stands in a sentence a student reads first. Use t('key', vars) in
// code, and t.num() for numbers (Bangla digits when the language is Bangla): every digit comes in as a var, so
// ?numerals=latin still works. Symbols with subscripts and powers (m₁, r², ms⁻²) come in as vars built in app.js with
// <sub>/<sup>: the bundled font has no ₁ ² ⁻ glyphs.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'মহাকর্ষ বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'মহাকর্ষ বল',
    newton: 'নিউটন',

    // the two things the student changes keep one colour: in the sentences, on the picture (the bench's r, the
    // spheres' m) and in the formula at the end
    w_dist: 'দূরত্ব',
    w_mass: 'ভর',

    // the examples: one row of words, a small result under each once found
    ex_label: 'কী বদলে দেখবে',
    ex_dist: 'দূরত্ব',
    ex_mass: 'ভর',
    res_part: 'টান {b}/{a}',
    res_times: 'টান {k} গুণ',
    cmp_times: '{k} গুণ',

    // the action: the big button, and the same numbered badge on the sphere or the weight
    act_double_r: 'দূরত্ব {two} গুণ করো',
    act_double_m1: 'বাম গোলকের ভর {two} গুণ করো',
    act_double_m2: 'ডান গোলকের ভরও {two} গুণ করো',
    act_again: 'আবার প্রথম থেকে দেখো',
    act_home: 'শুরুতে ফেরাও',

    // labels on the 3D view: each arrow is named at its tail ("টান") and says how big it is next to the faint one
    l_mass: '{m}<small>{kg} kg</small>',
    l_mass_plain: '{kg} kg',
    l_pull: 'টান',
    l_pull_cmp: 'টান {k}',
    l_r: '{r} = {v} m',
    l_dist: '{dist} = {v} m',
    l_before: 'আগে',
    // the honest notes: a quiet grey line under the result (never on the picture)
    note_spheres: 'আসল টান পিঁপড়ার ওজনের মতো ছোট; তীর অনেক বড় করে আঁকা',

    // the result line: what happened, as a comparison; the number that matters in <b>
    out_start: 'দুটি ভারী গোলক একে অপরকে টানে: এই টানের নাম <b>মহাকর্ষ বল</b>।',
    out_start_mass: 'দুই গোলকের দূরত্ব এখন {two} m: {mass} বদলালে টান কেমন হয়, দেখো।',
    out_vs_part: 'টান আগের <b>{frac}</b> <small>({a} ভাগের {b} ভাগ)</small>',
    out_vs_times: 'টান আগের <b>{k} গুণ</b>',
    out_exact: '<small class="lg-exact">আসল মান {f} নিউটন</small>',

    // the rule line: one short idea; the quantity just changed in its colour
    rule_start: '<b>দুটি গোলকই সমান জোরে টানে,</b> তাই দুটি তীর সমান লম্বা।',
    rule_dist: '<b>দূরে গেলে টান অনেক কমে:</b> {dist} {two} গুণ হলে টান {four} ভাগের {one} ভাগ, কারণ দূরত্ব দুবার কাজ করে: {sq}।',
    rule_m1: '<b>ভারী হলে টান বাড়ে:</b> একটি গোলকের {mass} {two} গুণ হলে দুই গোলকেরই টান {two} গুণ।',
    rule_m2: '<b>দুটি {mass}ই {two} গুণ হলে টান {four} গুণ,</b> কারণ {sq}।',
    rule_hint_dist: ' {dist} বদলালে কী হয়, দেখো।',
    rule_sum_dist: '<b>দূরে গেলে টান অনেক কমে।</b> {mass} বদলালে কী হয়, দেখো।',
    rule_sum_mass: '<b>ভারী হলে টান বাড়ে।</b> {dist} বদলালে কী হয়, দেখো।',
    rule_sum_both: '<b>{mass} বাড়লে টান বাড়ে, {dist} বাড়লে টান কমে।</b>',
    rule_all: '<b>{mass} বাড়লে টান বাড়ে, {dist} বাড়লে টান কমে।</b>',

    // the formula: last, each symbol with the word for what the student changed, in the same colour
    sum_word: 'সব মিলিয়ে',
    cap_pull: 'টান (বল)',
    cap_G: 'স্থির সংখ্যা',
    cap_mass: 'ভর',
    cap_dist2: 'দূরত্ব × দূরত্ব',
    book_G: 'বইয়ের মান: মহাকর্ষীয় ধ্রুবক {G} = {Gv} {Gu}',

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

    // the choices for "how many times": all words, so none gives the answer away by its look
    ch_half: 'অর্ধেক',
    ch_times: '{k} গুণ',
    ch_part: '{k} ভাগের {one} ভাগ',
    ch_same: 'একই থাকে',

    q_mass: 'ছবির {side} গোলকের ভর বাড়িয়ে {to} kg করা হলো, দূরত্ব একই। টান কত হবে?',
    side_left: 'বাম',
    side_right: 'ডান',
    why_mass: '<b>{k} গুণ:</b> ভর {kg0} kg থেকে {to} kg, মানে {k} গুণ; একটি ভর {k} গুণ হলে টানও {k} গুণ (তীরটি দেখো)।',
    not_mass_sq: 'ভরের বর্গ হয় না। {k2} গুণ হয় দুটি ভরই {k} গুণ হলে।',
    not_mass_inv: 'ভর বাড়লে টান বাড়ে, কমে না।',
    not_mass_same: 'দুটি ভরই টানের জন্য দায়ী; একটি বাড়লেই টান বাড়ে।',

    q_dist2: 'ছবির গোলক দুটির দূরত্ব {two} গুণ করা হলো, ভর একই। টান কত হবে?',
    q_dist_half: 'ছবির গোলক দুটির দূরত্ব অর্ধেক করা হলো, ভর একই। টান কত হবে?',
    why_dist2: '<b>{four} ভাগের {one} ভাগ:</b> দূরত্ব {two} গুণ হলে টান {four} ভাগের {one} ভাগ, কারণ {sq}।',
    why_dist_half: '<b>{four} গুণ:</b> দূরত্ব অর্ধেক হলে টান {four} গুণ, কারণ {sq}।',
    not_dist_nosq: 'দূরত্ব দুবার কাজ করে: {sq}, শুধু {two} নয়।',
    not_dist_far: 'দূরে গেলে টান কমে, বাড়ে না।',
    not_dist_near: 'কাছে এলে টান বাড়ে, কমে না।',

    q_equal: 'বড় গোলকটি ছোটটিকে যে জোরে টানে, ছোট গোলকটি বড়টিকে কত জোরে টানে?',
    eq_same: 'সমান জোরে',
    eq_less: '{four} গুণ কম জোরে',
    eq_more: '{four} গুণ বেশি জোরে',
    eq_none: 'একেবারেই টানে না',
    why_equal: '<b>সমান জোরে:</b> দুজনেই একই টান পায়, ছবির তীর দুটিও সমান লম্বা।',
    not_eq_less: 'টান নির্ভর করে দুটি ভরের উপর, সেটি দুই গোলকের জন্য একই।',
    not_eq_more: 'ছোট গোলকটি বেশি টান পায় না: একই দুটি ভর, একই টান।',
    not_eq_none: 'ভর আছে এমন যেকোনো বস্তু অন্য বস্তুকে টানে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Gravitational force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Gravitational force',
    newton: 'N',

    w_dist: 'distance',
    w_mass: 'mass',

    ex_label: 'What to change',
    ex_dist: 'Distance',
    ex_mass: 'Mass',
    res_part: 'pull {b}/{a}',
    res_times: 'pull × {k}',
    cmp_times: '{k} times',

    act_double_r: 'Double the distance',
    act_double_m1: 'Double the left mass',
    act_double_m2: 'Double the right mass too',
    act_again: 'Start again',
    act_home: 'Back to the start',

    l_mass: '{m}<small>{kg} kg</small>',
    l_mass_plain: '{kg} kg',
    l_pull: 'pull',
    l_pull_cmp: 'pull {k}',
    l_r: '{r} = {v} m',
    l_dist: '{dist} = {v} m',
    l_before: 'before',
    note_spheres: 'The real pull is an ant’s weight; arrows drawn far bigger',

    out_start: 'Two heavy spheres pull each other: this pull is called <b>gravitational force</b>.',
    out_start_mass: 'The spheres are now {two} m apart: what does a change of {mass} do?',
    out_vs_part: 'Pull <b>{frac}</b> of before <small>(one part in {a})</small>',
    out_vs_times: 'Pull <b>{k} times</b> before',
    out_exact: '<small class="lg-exact">real value {f} N</small>',

    rule_start: '<b>Each pulls the other equally hard,</b> so the two arrows are equally long.',
    rule_dist: '<b>Farther apart, much less pull:</b> {dist} {two} times as big, pull {one}/{four}, because the distance counts twice: {sq}.',
    rule_m1: '<b>Heavier, more pull:</b> one sphere’s {mass} {two} times as big, and the pull on both spheres is {two} times.',
    rule_m2: '<b>Both masses {two} times, pull {four} times,</b> because {sq}.',
    rule_hint_dist: ' What does the {dist} do?',
    rule_sum_dist: '<b>Farther apart, much less pull.</b> What does the {mass} do?',
    rule_sum_mass: '<b>Heavier, more pull.</b> What does the {dist} do?',
    rule_sum_both: '<b>More {mass}, more pull; more {dist}, less pull.</b>',
    rule_all: '<b>More {mass}, more pull; more {dist}, less pull.</b>',

    sum_word: 'All together',
    cap_pull: 'pull',
    cap_G: 'constant',
    cap_mass: 'mass',
    cap_dist2: 'dist. × dist.',
    book_G: 'Book value: gravitational constant {G} = {Gv} {Gu}',

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

    ch_half: 'half',
    ch_times: '{k} times',
    ch_part: 'one part in {k}',
    ch_same: 'stays the same',

    q_mass: 'The {side} sphere’s mass becomes {to} kg; same distance. What is the pull now?',
    side_left: 'left',
    side_right: 'right',
    why_mass: '<b>{k} times:</b> {kg0} kg to {to} kg is {k} times the mass, so {k} times the pull (see the arrow).',
    not_mass_sq: 'Masses are not squared: {k2} times needs both masses {k} times.',
    not_mass_inv: 'More mass, more pull, not less.',
    not_mass_same: 'Both masses make the pull; increase one and it grows.',

    q_dist2: 'The spheres are moved {two} times as far apart; same masses. What is the pull now?',
    q_dist_half: 'The spheres are moved to half the distance; same masses. What is the pull now?',
    why_dist2: '<b>One part in {four}:</b> distance {two} times, pull {one}/{four}, because {sq}.',
    why_dist_half: '<b>{four} times:</b> half the distance, pull {four} times, because {sq}.',
    not_dist_nosq: 'The distance counts twice: {sq}, not just {two}.',
    not_dist_far: 'Farther apart, less pull, not more.',
    not_dist_near: 'Closer together, more pull, not less.',

    q_equal: 'The big sphere pulls the small one. How hard does the small one pull the big one?',
    eq_same: 'Equally hard',
    eq_less: '{four} times less',
    eq_more: '{four} times more',
    eq_none: 'Not at all',
    why_equal: '<b>Equally hard:</b> each gets the same pull; the two arrows are equally long.',
    not_eq_less: 'The pull depends on both masses: the same pair for both spheres.',
    not_eq_more: 'The small sphere is not pulled harder: same two masses, same pull.',
    not_eq_none: 'Any body with mass pulls any other.',
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
