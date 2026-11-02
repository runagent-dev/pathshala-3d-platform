// Every string the figure shows, in Bangla and English. The book's words on pages 145–146 (topic 5.4.1, টরিসেলির
// পরীক্ষা): স্ট্র, কোল্ড ড্রিংকস, চুমুক, "আসলে ব্যাপারটি ঘটে বাতাসের চাপের জন্য", "কোল্ড ড্রিংকসটা 10.3 মিটার পর্যন্ত
// উঠে হঠাৎ করে থেমে গেছে", "পারদ ঠিক 76 cm উচ্চতায় এসে থেমে গেছে", "পানির ঘনত্ব থেকে পারদের ঘনত্ব 13.6 গুণ বেশি",
// "দুটো চাপই সমান, কাজেই এর ভেতরে কোনো কার্যকর বল নেই", "চুমুক দিলে ... মুখের ভেতরে শূন্যতা তৈরি করার চেষ্টা করো,
// তখন সেখানে বাতাসের চাপ কমে যায়", বিজ্ঞানী টরিসেলি, 1643, "এক মুখ বন্ধ একটা নলের ভেতর পারদ ভরে, নলটি পারদ ভরা একটা
// পাত্রে উল্টে", শূন্যতা, "বাতাস পারদের উপরে চাপ দিচ্ছে এবং সেই চাপ তরলের সব জায়গায় সঞ্চালিত হয়ে নলের নিচেও এসেছে",
// "নলের উপরে কোনো ফুটো নেই, তাই সেদিক দিয়ে বাতাস চাপ দিতে পারছে না", "76 cm উঁচু পারদ স্তম্ভের ওজনের কারণে তৈরি
// হওয়া চাপ", ব্যারোমিটার ("বাতাসের চাপ মাপার যন্ত্রের নাম ব্যারোমিটার"), চিত্র ৫.১০. The page writes উপর / উপরে. From
// topic 5.3: P = hρg; from 5.4: 10⁵ N/m². Use t('key', vars) in code and t.num() for numbers; numbers inside sentences
// come in as {vars}. A {key} that is not a var is another string of the same language: units are {u_cm}, {u_m},
// {u_Pa}, {u_rho}, {u_g}, {u_Nm2} (written with <sup>: the bundled font has no ² or ⁻), after a no-break space.
// The questions (q_*) are plain text, no HTML: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'পাহাড়ে ব্যারোমিটার: উঁচুতে বাতাসের চাপ কম',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'চাপ',
    u_cm: 'cm',
    u_m: 'm',
    u_Pa: 'Pa',
    u_rho: 'kg&nbsp;m<sup>−3</sup>',
    u_g: 'm&nbsp;s<sup>−2</sup>',
    u_Nm2: 'N/m<sup>2</sup>',

    // the action and the quiet button
    act_up: 'আরও উঁচুতে নাও',
    act_down: 'সমুদ্রতলে ফেরাও',

    // the result line
    out_mt0: 'সমুদ্রতলে পারদ স্তম্ভ <b>{h}&nbsp;{u_cm}</b>। ব্যারোমিটারটি উঁচুতে নাও।',
    out_mt: '{z}&nbsp;{u_m} উঁচুতে পারদ স্তম্ভ প্রায় <b>{h}&nbsp;{u_cm}</b>',
    out_mt_moving: 'ব্যারোমিটারটি নেওয়া হচ্ছে…',

    // the rule: the book's words, one idea at a time
    rule_mt: '<b>বাতাসের চাপ মাপার যন্ত্রের নাম ব্যারোমিটার।</b> উঁচুতে মাথার উপরে বাতাসের স্তম্ভ ছোট, তাই বাতাসের চাপ কম, আর পারদ স্তম্ভও নিচু।',

    // labels on the picture
    lbl_air: 'বাতাসের চাপ',
    lbl_vacuum: 'শূন্যতা',
    lbl_h: '{h}&nbsp;{u_cm}',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',

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
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    read_mt: 'উচ্চতা: {z}&nbsp;{u_m} · পারদ স্তম্ভ: <b>{h}&nbsp;{u_cm}</b>',
    q_mt_col: 'ব্যারোমিটারটি পাহাড়ের আরও উঁচুতে নিলে পারদ স্তম্ভের কী হয়?',
    c_mc_right: 'নিচু হয়',
    c_mc_up: 'উঁচু হয়',
    c_mc_same: 'একই থাকে',
    c_mc_zero: 'পুরো নেমে পাত্রে চলে যায়',
    why_mc: '<b>নিচু হয়</b>: উঁচুতে বাতাসের চাপ কম, তাই কম উঁচু স্তম্ভ ধরে রাখতে পারে।',
    mis_mc_up: 'উঁচুতে বাতাসের চাপ কমে, বাড়ে না।',
    mis_mc_zero: 'উঁচুতেও বাতাস আছে, শুধু চাপ কম।',
    q_mt_read: 'স্কেল থেকে পড়ো: এই উচ্চতায় পারদ স্তম্ভ কত উঁচু?',
    why_mt_read: '<b>{h}&nbsp;{u_cm}</b>: পারদের উপরের তল স্কেলের এই দাগে।',
    mis_mr_sea: '{h}&nbsp;{u_cm} সমুদ্রতলের উচ্চতা; এখানে স্তম্ভ নিচু।',
    mis_mr_up: 'স্তম্ভ উঠেনি, নেমেছে।',
    mis_mr_off: 'দাগটি আবার দেখো, একটি ঘর ভুল হয়েছে।',
    q_mt_why: 'উঁচুতে পারদ স্তম্ভ নিচু হয় কেন?',
    c_mw_right: 'মাথার উপরে বাতাস কম',
    c_mw_cold: 'ঠান্ডায় পারদ জমে যায়',
    c_mw_g: 'উঁচুতে পারদের ওজন অনেক বেশি',
    c_mw_vac: 'শূন্যতা কম টানে',
    why_mw: '<b>মাথার উপরে বাতাস কম</b>: বাতাসের স্তম্ভ ছোট, তাই বাতাসের চাপ কম।',
    mis_mw_cold: 'পারদ এখানে তরলই থাকে; স্তম্ভ নামে চাপ কমার জন্য।',
    mis_mw_g: 'কয়েক হাজার মিটারে ওজন প্রায় একই থাকে।',
    mis_mw_vac: 'শূন্যতা টানে না; বাতাসের চাপ নিচ থেকে ঠেলে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: "A barometer up a mountain: less air's pressure higher up",
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Pressure',
    u_cm: 'cm',
    u_m: 'm',
    u_Pa: 'Pa',
    u_rho: 'kg&nbsp;m<sup>−3</sup>',
    u_g: 'm&nbsp;s<sup>−2</sup>',
    u_Nm2: 'N/m<sup>2</sup>',

    act_up: 'Take it higher',
    act_down: 'Back to the sea',

    out_mt0: 'At the sea the column is <b>{h}&nbsp;{u_cm}</b>. Take the barometer higher.',
    out_mt: 'At {z}&nbsp;{u_m} the column is about <b>{h}&nbsp;{u_cm}</b>',
    out_mt_moving: 'Taking the barometer…',

    rule_mt:
      "<b>An instrument that measures the air's pressure is a barometer.</b> Higher up there is less air overhead, so less pressure and a lower column.",

    lbl_air: "air's pressure",
    lbl_vacuum: 'vacuum',
    lbl_h: '{h}&nbsp;{u_cm}',

    hint_wait: 'Wait a moment and watch.',

    q_count: 'Question {i} of {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Look at the picture and pick an answer.',

    read_mt: 'Height: {z}&nbsp;{u_m} · column: <b>{h}&nbsp;{u_cm}</b>',
    q_mt_col: 'What happens to the mercury column when the barometer goes higher up the mountain?',
    c_mc_right: 'It gets lower',
    c_mc_up: 'It gets higher',
    c_mc_same: 'It stays the same',
    c_mc_zero: 'It falls into the dish',
    why_mc: '<b>It gets lower</b>: higher up the air presses less, so it holds up a lower column.',
    mis_mc_up: "Higher up the air's pressure falls; it doesn't rise.",
    mis_mc_zero: 'There is air up there too, only less pressure.',
    q_mt_read: 'Read the scale: how high is the mercury column here?',
    why_mt_read: "<b>{h}&nbsp;{u_cm}</b>: the mercury's top is at this mark on the scale.",
    mis_mr_sea: '{h}&nbsp;{u_cm} is the column at the sea; here it is lower.',
    mis_mr_up: "The column fell; it didn't rise.",
    mis_mr_off: 'Look at the mark again; that is one step off.',
    q_mt_why: 'Why is the mercury column lower higher up?',
    c_mw_right: 'There is less air overhead',
    c_mw_cold: 'The cold freezes the mercury',
    c_mw_g: 'Mercury weighs much more up there',
    c_mw_vac: 'The vacuum pulls less',
    why_mw: "<b>There is less air overhead</b>: a shorter column of air, so less air's pressure.",
    mis_mw_cold: 'The mercury stays liquid; the column falls because the pressure falls.',
    mis_mw_g: 'A few thousand metres up, weight hardly changes.',
    mis_mw_vac: "A vacuum doesn't pull; the air pushes from below.",
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a unit) is put in.
 */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
