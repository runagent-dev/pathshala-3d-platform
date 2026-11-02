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
    title: 'মহাকর্ষ বল: পৃথিবী ও ওজন',
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

    // the examples: one row of words, a small result under each once found
    ex_earth: 'পৃথিবী',
    res_g: 'g প্রায় {g}',
    res_weight: 'ওজন {w} নিউটন',

    // the action: the big button, and the same numbered badge on the sphere or the weight
    act_place: 'বাটখারাটি পৃথিবীতে রাখো',
    act_add: 'আরেকটি বাটখারা উপরে রাখো',
    act_again: 'আবার প্রথম থেকে দেখো',
    act_home: 'শুরুতে ফেরাও',

    // labels on the 3D view: each arrow is named at its tail ("টান") and says how big it is next to the faint one
    l_weight: 'ওজন',
    l_on_earth: 'পৃথিবীর উপর টান',
    l_on_earth_short: 'টান',
    l_centre: 'পৃথিবীর কেন্দ্র',
    l_R: '{R} = {v} km',
    l_radius: 'পৃথিবীর ব্যাসার্ধ {v} km',
    l_lift: '{h} m',
    l_weight_total: 'মোট {kg} kg',
    l_R_short: '{R}',
    l_r2R: '{r} = {two}{R}',
    // the honest notes: a quiet grey line under the result (never on the picture)
    note_earth: 'পৃথিবীর তুলনায় বাটখারা অনেক বড় করে আঁকা',

    // the result line: what happened, as a comparison; the number that matters in <b>
    out_earth0: 'পৃথিবীও একটা বিশাল গোলক।',
    out_weight: '{kg} kg বাটখারার ওজন প্রায় <b>{w} নিউটন</b>',
    out_weight2: '{kg} kg বাটখারার ওজন প্রায় <b>{w} নিউটন</b> <small>({one} kg-এর {two} গুণ)</small>',

    // the rule line: one short idea; the quantity just changed in its colour
    rule_earth0: 'পৃথিবী বাটখারাকে নিজের কেন্দ্রের দিকে টানে: এই টানকেই আমরা <b>ওজন</b> বলি।',
    rule_earth1: '<b>দূরত্ব {R} মাপা হয় পৃথিবীর কেন্দ্র থেকে</b> (প্রায় {km} km), পৃষ্ঠ থেকে নয়: পৃথিবীর সব ভর যেন কেন্দ্রে জমা।',
    rule_earth2: '<b>তাই প্রতি {one} kg-এ টান একই: {gv} নিউটন।</b> ছেড়ে দিলে ত্বরণ {g} = {gv} {ms2}।',

    // the formula: last, each symbol with the word for what the student changed, in the same colour
    cap_pull: 'টান (বল)',
    cap_G: 'স্থির সংখ্যা',
    cap_mass: 'ভর',
    cap_earth_mass: 'পৃথিবীর ভর',
    cap_centre_dist2: 'দূরত্ব × দূরত্ব',
    book_earth: 'বইয়ের মান: {G} = {Gv} {Gu}, {M} = {Mv} kg, {R} = {Rv} m',

    // the test
    q_pair: 'পৃথিবী বাটখারাকে নিচে টানছে। বাটখারা কি পৃথিবীকে টানে?',
    pair_same: 'হ্যাঁ, সমান জোরে, উপরের দিকে',
    pair_less: 'হ্যাঁ, তবে অনেক কম জোরে',
    pair_none: 'না, ছোট জিনিস বড়কে টানে না',
    pair_more: 'হ্যাঁ, আরও বেশি জোরে',
    why_pair: '<b>হ্যাঁ, সমান জোরে</b>: দুটি ভর একে অপরকে সমান জোরে, উল্টো দিকে টানে। ছবিতে দেখো, দুটি তীর সমান লম্বা; পৃথিবীর ভর অনেক বেশি বলে সে প্রায় নড়ে না।',
    not_pair_less: 'টান কম নয়, সমান; পৃথিবী কম নড়ে, কারণ তার ভর অনেক বেশি।',
    not_pair_none: 'যেকোনো দুটি ভর একে অপরকে টানে, ছোট-বড় সবাই।',
    not_pair_more: 'বেশি নয়: দুটি টান সমান, তীর দুটিও সমান লম্বা।',

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

    q_radius: 'বাটখারাটি মাটি থেকে {h} m উপরে। হিসাবে দূরত্ব {R} কত ধরবে?',
    why_radius: '<b>প্রায় {km} km:</b> {R} মাপা হয় পৃথিবীর কেন্দ্র থেকে। মাটি থেকে {h} m উপরে হলেও তা প্রায় পৃথিবীর ব্যাসার্ধ।',
    not_rad_height: 'মাটি থেকে দূরত্ব নয়: কেন্দ্র থেকে।',
    not_rad_diam: 'এটি পৃথিবীর ব্যাস; {R} মাপা হয় কেন্দ্র থেকে, মানে ব্যাসার্ধ।',
    not_rad_km: '{m} m মানে মাত্র {kmm} km; ব্যাসার্ধ {km} km।',

    q_h: 'ছবিতে {kg} kg বাটখারাটি পৃথিবীর কেন্দ্র থেকে {two}{R} দূরে। পৃষ্ঠে এর ওজন {w0} নিউটন; এখানে কত?',
    why_h: '<b>প্রায় {ans} নিউটন:</b> দূরত্ব {two} গুণ, তাই টান {four} ভাগের {one} ভাগ: {w0} ÷ {four} = প্রায় {ans}।',
    not_h_nosq: 'দূরত্ব {two} গুণ হলে টান {four} ভাগের {one} ভাগ হয়, অর্ধেক নয়।',
    not_h_same: 'দূরে গেলে ওজন কমে, একই থাকে না।',
    not_h_more: 'দূরে গেলে ওজন কমে, বাড়ে না।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Gravitational force: the Earth and weight',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Gravitational force',
    newton: 'N',

    ex_earth: 'Earth',
    res_g: 'g about {g}',
    res_weight: 'weight {w} N',

    act_place: 'Put the weight on the Earth',
    act_add: 'Put another weight on top',
    act_again: 'Start again',
    act_home: 'Back to the start',

    l_weight: 'weight',
    l_on_earth: 'pull on the Earth',
    l_on_earth_short: 'pull',
    l_centre: "Earth's centre",
    l_R: '{R} = {v} km',
    l_radius: "Earth's radius {v} km",
    l_lift: '{h} m',
    l_weight_total: 'total {kg} kg',
    l_R_short: '{R}',
    l_r2R: '{r} = {two}{R}',
    note_earth: 'The weight is drawn far bigger than the Earth allows',

    out_earth0: 'The Earth is a huge sphere too.',
    out_weight: 'The {kg} kg weight weighs about <b>{w} N</b>',
    out_weight2: '{kg} kg weighs about <b>{w} N</b> <small>({two} times {one} kg)</small>',

    rule_earth0: 'The Earth pulls the weight towards its own centre: we call this pull its <b>weight</b>.',
    rule_earth1:
      '<b>The distance {R} is measured from the Earth’s centre</b> (about {km} km), not from the surface: the Earth pulls as if all its mass were at its centre.',
    rule_earth2: '<b>So the pull on each {one} kg is the same: {gv} N.</b> Let go, and the acceleration is {g} = {gv} {ms2}.',

    cap_pull: 'pull',
    cap_G: 'constant',
    cap_mass: 'mass',
    cap_earth_mass: 'Earth’s mass',
    cap_centre_dist2: 'dist. × dist.',
    book_earth: 'Book values: {G} = {Gv} {Gu}, {M} = {Mv} kg, {R} = {Rv} m',

    q_pair: 'The Earth pulls the weight down. Does the weight pull the Earth?',
    pair_same: 'Yes, just as hard, upwards',
    pair_less: 'Yes, but much less hard',
    pair_none: 'No, a small thing does not pull a big one',
    pair_more: 'Yes, even harder',
    why_pair:
      '<b>Yes, just as hard</b>: two masses pull each other equally hard, in opposite directions. Look, the two arrows are equally long; the Earth hardly moves because its mass is so large.',
    not_pair_less: 'The pull is not smaller but equal; the Earth moves less because its mass is so large.',
    not_pair_none: 'Any two masses pull each other, small or big.',
    not_pair_more: 'Not harder: the two pulls are equal, and so are the arrows.',

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

    q_radius: 'The weight is {h} m above the ground. Which distance {R} goes in the sum?',
    why_radius: '<b>About {km} km:</b> {R} is from the Earth’s centre; {h} m up is still about the Earth’s radius.',
    not_rad_height: 'Not from the ground: from the centre.',
    not_rad_diam: 'That is the diameter; {R} is from the centre, the radius.',
    not_rad_km: '{m} m is only {kmm} km; the radius is {km} km.',

    q_h: 'The {kg} kg weight is {two}{R} from the Earth’s centre. At the surface it weighs {w0} N; here?',
    why_h: '<b>About {ans} N:</b> distance {two} times, pull {one}/{four}: {w0} ÷ {four} = about {ans}.',
    not_h_nosq: 'Twice as far, the pull is {one}/{four}, not a half.',
    not_h_same: 'Farther away, the weight is less, not the same.',
    not_h_more: 'Farther away, the weight is less, not more.',
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
