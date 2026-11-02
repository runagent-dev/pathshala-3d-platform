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
    title: 'পারদের বদলে পানি: বাতাসের চাপ 10.3 m পানি ধরে রাখে',
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
    act_water: 'পারদের বদলে পানি নাও',
    act_replay: 'আবার দেখো',

    // the result line
    out_w_ready: 'প্রায় {L}&nbsp;{u_m} লম্বা কাচের নল, তলায় পানির পাত্র। পারদের বদলে পানি নাও।',
    out_w_rising: 'পানি উঠছে…',
    out_w_done: 'একই চাপে পানির স্তম্ভ <b>{h}&nbsp;{u_m}</b>, প্রায় ছাদ পর্যন্ত',

    // the rule: the book's words, one idea at a time
    rule_water:
      '<b>পানির ঘনত্ব থেকে পারদের ঘনত্ব {k} গুণ বেশি,</b> তাই পানি উঠবে পারদের {k} গুণ উঁচুতে: {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}। কোল্ড ড্রিংকসের ঘনত্ব পানির কাছাকাছি, তাই স্ট্রেও এর বেশি ওঠে না।',

    // labels on the picture
    lbl_air: 'বাতাসের চাপ',
    lbl_vacuum: 'শূন্যতা',
    lbl_water: 'পানি {h}&nbsp;{u_m}',
    lbl_mini: 'পারদ {h}&nbsp;{u_cm}',

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

    c_vac_right: 'শূন্যতা: কিছুই নেই',
    c_vac_pull: 'শূন্যতা, যা পারদ টেনে রাখে',
    c_vac_air: 'আঙুল সরানোর সময় ঢোকা বাতাস',
    c_vac_press: 'বাতাস, যা পারদকে নিচে চাপে',

    q_water: 'পারদের বদলে পানি দিয়ে এই পরীক্ষা করলে পানির স্তম্ভ কত উঁচু হতো?',
    why_water: '<b>প্রায় {h}&nbsp;{u_m}</b>: পারদ {k} গুণ ঘন, তাই {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}।',
    mis_water_same: 'একই চাপে কম ঘন তরলের স্তম্ভ বেশি উঁচু হয়।',
    mis_water_divide: 'এখানে ভাগ করা হয়েছে; গুণ করতে হবে।',
    mis_water_tenth: 'দশমিক ভুল জায়গায় বসেছে।',

    read_water: 'পানির স্তম্ভ: {w} · পারদ স্তম্ভ: {hg}&nbsp;{u_cm}',
    q_w_why: 'একই বাতাসের চাপে পানির স্তম্ভ পারদের চেয়ে এত উঁচু হয় কেন?',
    c_ww_right: 'পানির ঘনত্ব পারদের চেয়ে অনেক কম',
    c_ww_wide: 'পানির নলটি বেশি চওড়া',
    c_ww_more: 'উঠোনে বাতাসের চাপ বেশি',
    c_ww_pull: 'শূন্যতা পানিকে বেশি টানে',
    why_ww: '<b>পানির ঘনত্ব কম</b>: পারদ {k} গুণ ঘন, তাই একই চাপে পানি {k} গুণ উঁচু হয়।',
    mis_ww_wide: 'স্তম্ভের উচ্চতা নলের চওড়ার উপর নির্ভর করে না।',
    mis_ww_more: 'পাশের ছোট ব্যারোমিটার দেখাচ্ছে চাপ একই: {hHg}&nbsp;{u_cm} পারদ।',
    mis_ww_pull: 'শূন্যতা টানে না; বাতাসের চাপ নিচ থেকে ঠেলে।',
    q_w_vac: 'পানির স্তম্ভের উপরে নলের ফাঁকা অংশে কী আছে?',
    why_w_vac: '<b>শূন্যতা</b> (প্রায়): উপর থেকে চাপ নেই, তাই নিচের বাতাসের চাপ পানি ধরে রাখে।',
    mis_w_air: 'নলের মুখ পানির নিচে ছিল, বাতাস ঢুকতে পারেনি।',
    mis_w_press: 'উপরে বাতাস থাকলে পানি নেমে যেত।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Water instead of mercury: the air holds up 10.3 m of water',
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

    act_water: 'Use water, not mercury',
    act_replay: 'Watch again',

    out_w_ready: 'A glass tube about {L}&nbsp;{u_m} long over a tub of water. Use water, not mercury.',
    out_w_rising: 'The water rises…',
    out_w_done: 'The same air holds up <b>{h}&nbsp;{u_m}</b> of water, nearly to the roof',

    rule_water:
      '<b>Mercury is {k} times as dense as water,</b> so water rises {k} times as high: {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}. A cold drink is about as dense as water, so a straw can’t lift it higher either.',

    lbl_air: "air's pressure",
    lbl_vacuum: 'vacuum',
    lbl_water: 'water {h}&nbsp;{u_m}',
    lbl_mini: 'mercury {h}&nbsp;{u_cm}',

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

    c_vac_right: 'A vacuum: nothing at all',
    c_vac_pull: 'A vacuum pulling the mercury up',
    c_vac_air: 'Air let in with the thumb',
    c_vac_press: 'Air pressing the mercury down',

    q_water: 'If this experiment used water instead of mercury, how high would the water column be?',
    why_water: '<b>About {h}&nbsp;{u_m}</b>: mercury is {k} times as dense: {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}.',
    mis_water_same: 'The same pressure holds up a taller column of a lighter liquid.',
    mis_water_divide: 'That divides; multiply instead.',
    mis_water_tenth: 'The decimal point slipped.',

    read_water: 'Water column: {w} · mercury column: {hg}&nbsp;{u_cm}',
    q_w_why: "With the same air's pressure, why is the water column so much taller than the mercury one?",
    c_ww_right: 'Water is much less dense than mercury',
    c_ww_wide: 'The water tube is wider',
    c_ww_more: 'The air presses harder in the yard',
    c_ww_pull: 'The vacuum pulls water harder',
    why_ww: '<b>Water is less dense</b>: mercury is {k} times as dense, so water stands {k} times as high.',
    mis_ww_wide: "A column's height doesn't depend on the tube's width.",
    mis_ww_more: 'The small barometer beside it shows the same pressure: {hHg}&nbsp;{u_cm} of mercury.',
    mis_ww_pull: "A vacuum doesn't pull; the air pushes from below.",
    q_w_vac: 'What is in the empty part of the tube above the water?',
    why_w_vac: '<b>A vacuum</b> (nearly): nothing presses from above, so the air below holds the water up.',
    mis_w_air: "The tube's mouth was under the water; no air could get in.",
    mis_w_press: 'With air above, the water would fall.',
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
