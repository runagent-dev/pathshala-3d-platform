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
    title: 'টরিসেলির পরীক্ষা: বাতাসের চাপ পারদ স্তম্ভকে ধরে রাখে',
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
    act_fill: 'নলটি পারদে ভরো',
    act_turn: 'আঙুলে চেপে উল্টে দাও',
    act_release: 'আঙুল সরিয়ে নাও',
    act_again: 'আবার শুরু করো',

    // the result line
    out_t_ready: 'এক মুখ বন্ধ কাচের নল আর এক পাত্র পারদ। নলটি পারদে ভরো।',
    out_t_filling: 'নলটি পারদে ভরা হচ্ছে…',
    out_t_full: 'নল পারদে ভরা। এবার আঙুলে মুখ চেপে উল্টে পাত্রে ডোবাও।',
    out_t_turning: 'নলটি উল্টে পাত্রে ডোবানো হচ্ছে…',
    out_t_dipped: 'নলের মুখ পারদের নিচে। এবার আঙুল সরাও।',
    out_t_falling: 'পারদ নামছে…',
    out_t_settled: 'পারদ <b>{h}&nbsp;{u_cm}</b> উঁচুতে থামল। উপরের ফাঁকা জায়গা শূন্যতা।',

    // the rule: the book's words, one idea at a time
    rule_t_settled: 'নলের উপরে বাতাস নেই, তাই উপর থেকে চাপ নেই। পাত্রের পারদের উপর <b>বাতাসের চাপই</b> {h}&nbsp;{u_cm} পারদ স্তম্ভকে ধরে রাখে। এটিই ব্যারোমিটার।',

    // labels on the picture
    lbl_air: 'বাতাসের চাপ',
    lbl_vacuum: 'টরিসেলির শূন্যস্থান',
    lbl_tube: 'কাচের নল',
    lbl_hg: 'পারদ',
    lbl_dish: 'পাত্র',
    lbl_scale: 'স্কেল',
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

    q_vacuum: 'টরিসেলির নলে পারদ স্তম্ভের উপরের ফাঁকা জায়গায় কী আছে?',
    c_vac_right: 'শূন্যতা: কিছুই নেই',
    c_vac_pull: 'শূন্যতা, যা পারদ টেনে রাখে',
    c_vac_air: 'আঙুল সরানোর সময় ঢোকা বাতাস',
    c_vac_press: 'বাতাস, যা পারদকে নিচে চাপে',
    why_vacuum: '<b>শূন্যতা</b>। উপর থেকে চাপ নেই, নিচের বাতাসের চাপ পারদ ধরে রাখে।',
    mis_vac_pull: 'শূন্যতা টানে না; বাতাসের চাপ নিচ থেকে ঠেলে।',
    mis_vac_air: 'নলের মুখ পারদের নিচে ছিল, বাতাস ঢুকতে পারেনি।',
    mis_vac_press: 'উপরে বাতাস থাকলে পারদ নেমে যেত, ছিদ্র করার মতো।',

    q_water: 'পারদের বদলে পানি দিয়ে এই পরীক্ষা করলে পানির স্তম্ভ কত উঁচু হতো?',
    why_water: '<b>প্রায় {h}&nbsp;{u_m}</b>। পারদ {k} গুণ ঘন, তাই {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}।',
    mis_water_same: 'একই চাপে কম ঘন তরলের স্তম্ভ বেশি উঁচু হয়।',
    mis_water_divide: 'এখানে ভাগ করা হয়েছে; গুণ করতে হবে।',
    mis_water_tenth: 'দশমিক ভুল জায়গায় বসেছে।',

    read_col: 'পারদ স্তম্ভের উচ্চতা: {h}',
    q_hold: 'নলের {h} cm উঁচু পারদ স্তম্ভকে কী ধরে রেখেছে?',
    c_hold_right: 'পাত্রের পারদের উপর বাতাসের চাপ',
    c_hold_vac: 'উপরের শূন্যতার টান',
    c_hold_glass: 'কাচের নলের দেয়াল',
    c_hold_light: 'পারদ খুব হালকা বলে',
    why_hold: '<b>বাতাসের চাপ</b>। পাত্রের পারদের উপর বাতাসের চাপ নলের নিচে পৌঁছে স্তম্ভের চাপের সমান হয়।',
    mis_hold_glass: 'দেয়াল ধরে রাখলে নলের মাথায় ছিদ্র করলেও পারদ নামত না।',
    mis_hold_light: 'পারদ পানির চেয়ে {k} গুণ ঘন, খুব ভারী।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: "Torricelli's experiment: the air's pressure holds up a column of mercury",
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

    act_fill: 'Fill the tube with mercury',
    act_turn: 'Seal it with a thumb, turn it over',
    act_release: 'Take the thumb away',
    act_again: 'Start again',

    out_t_ready: 'A glass tube closed at one end, and a dish of mercury. Fill the tube.',
    out_t_filling: 'Filling the tube with mercury…',
    out_t_full: 'The tube is full. Seal it with a thumb and turn it over into the dish.',
    out_t_turning: 'Turning the tube over into the dish…',
    out_t_dipped: 'The mouth is under the mercury. Now take the thumb away.',
    out_t_falling: 'The mercury falls…',
    out_t_settled: 'The mercury stops <b>{h}&nbsp;{u_cm}</b> high. The empty space above is a vacuum.',

    rule_t_settled:
      'There is no air above the mercury, so nothing presses from above. <b>The air pressing</b> on the mercury in the dish holds up the {h}&nbsp;{u_cm} column. This is a barometer.',

    lbl_air: "air's pressure",
    lbl_vacuum: 'Torricelli’s vacuum',
    lbl_tube: 'glass tube',
    lbl_hg: 'mercury',
    lbl_dish: 'dish',
    lbl_scale: 'scale',
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

    q_vacuum: "What is in the empty space above the mercury in Torricelli's tube?",
    c_vac_right: 'A vacuum: nothing at all',
    c_vac_pull: 'A vacuum pulling the mercury up',
    c_vac_air: 'Air let in with the thumb',
    c_vac_press: 'Air pressing the mercury down',
    why_vacuum: '<b>A vacuum</b>. Nothing presses from above, and the air below holds the mercury up.',
    mis_vac_pull: 'A vacuum doesn’t pull; the air pushes from below.',
    mis_vac_air: 'The mouth was under the mercury; no air could get in.',
    mis_vac_press: 'With air above, the mercury would fall, as when pierced.',

    q_water: 'If this experiment used water instead of mercury, how high would the water column be?',
    why_water: '<b>About {h}&nbsp;{u_m}</b>. Mercury is {k} times as dense: {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}.',
    mis_water_same: 'The same pressure holds up a taller column of a lighter liquid.',
    mis_water_divide: 'That divides; multiply instead.',
    mis_water_tenth: 'The decimal point slipped.',

    read_col: 'Height of the column: {h}',
    q_hold: 'What holds up the {h} cm column of mercury in the tube?',
    c_hold_right: 'The air pressing on the dish',
    c_hold_vac: 'The vacuum above pulling it',
    c_hold_glass: 'The glass walls of the tube',
    c_hold_light: 'Mercury is very light',
    why_hold: '<b>The air’s pressure</b>. The air pressing on the dish passes the pressure to the tube’s foot, where it balances the column’s.',
    mis_hold_glass: 'If the walls held it, a hole at the top would not let it fall.',
    mis_hold_light: 'Mercury is {k} times as dense as water: very heavy.',
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
