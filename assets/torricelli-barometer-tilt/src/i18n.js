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
    title: 'নল হেলালেও পারদ স্তম্ভের খাড়া উচ্চতা একই থাকে',
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
    act_tilt: 'নলটি আরও হেলাও',
    act_upright: 'আবার খাড়া করো',

    // the result line
    out_tilt0: 'নল খাড়া: পারদ স্তম্ভ <b>{h}&nbsp;{u_cm}</b> উঁচু। নলটি হেলাও।',
    out_tilt: 'নল {deg}° হেলানো: খাড়া উচ্চতা তবু <b>{h}&nbsp;{u_cm}</b>',
    out_tilting: 'নলটি হেলানো হচ্ছে…',

    // the rule: the book's words, one idea at a time
    rule_tilt:
      '<b>চাপ নির্ভর করে খাড়া উচ্চতা h-এর উপর (P = hρg),</b> নলের দৈর্ঘ্যের উপর নয়। তাই নল হেলালে পারদ নলের বেশি অংশ ভরে, কিন্তু খাড়া উচ্চতা থাকে {h}&nbsp;{u_cm}।',

    // labels on the picture
    lbl_air: 'বাতাসের চাপ',
    lbl_vacuum: 'শূন্যতা',
    lbl_vert: 'খাড়া উচ্চতা {h}&nbsp;{u_cm}',

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

    q_tilt: 'নলটি {deg}° হেলানো। পাত্রের পারদের তল থেকে নলের পারদের উপরের তল খাড়াভাবে কত উঁচুতে? স্কেল থেকে পড়ো।',
    why_tilt: '<b>{h}&nbsp;{u_cm}</b>: চাপ খাড়া উচ্চতার উপর নির্ভর করে; নলে পারদ {L}&nbsp;{u_cm}।',
    mis_tilt_along: 'এটি নল বরাবর পারদের দৈর্ঘ্য।',
    mis_tilt_cos: 'হেলালে বাতাসের চাপ বদলায় না, খাড়া উচ্চতাও না।',
    mis_tilt_less: 'স্কেলে পারদের তল {h}-এর দাগেই আছে।',

    read_tilt: 'খাড়া উচ্চতা: <b>{h}&nbsp;{u_cm}</b> · নলে পারদ: {L}&nbsp;{u_cm}',
    q_tilt_why: 'নল হেলালে পারদ নলের বেশি অংশ ভরে, তবু খাড়া উচ্চতা একই থাকে কেন?',
    c_tw_right: 'চাপ খাড়া উচ্চতার উপর নির্ভর করে',
    c_tw_air: 'হেলালে বাতাসের চাপ বাড়ে',
    c_tw_light: 'হেলালে পারদ হালকা হয়',
    c_tw_vac: 'শূন্যতা পারদকে টেনে রাখে',
    why_tw: '<b>চাপ খাড়া উচ্চতার উপর নির্ভর করে</b> (P = hρg), নলের দৈর্ঘ্যের উপর নয়।',
    mis_tw_light: 'পারদের ঘনত্ব বদলায় না।',
    mis_tw_vac: 'শূন্যতা টানে না; বাতাসের চাপ নিচ থেকে ঠেলে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: "A tilted tube: the mercury's vertical height stays the same",
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

    act_tilt: 'Tilt the tube more',
    act_upright: 'Stand it upright',

    out_tilt0: 'Upright: the column is <b>{h}&nbsp;{u_cm}</b> high. Tilt the tube.',
    out_tilt: 'Tilted {deg}°: the vertical height is still <b>{h}&nbsp;{u_cm}</b>',
    out_tilting: 'Tilting the tube…',

    rule_tilt:
      '<b>Pressure depends on the vertical height h (P = hρg),</b> not on the tube’s length. A tilted tube fills more of its length, but the vertical height stays {h}&nbsp;{u_cm}.',

    lbl_air: "air's pressure",
    lbl_vacuum: 'vacuum',
    lbl_vert: 'vertical height {h}&nbsp;{u_cm}',

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

    q_tilt: 'The tube is tilted {deg}°. How high, straight up from the mercury in the dish, is the mercury’s top? Read the scale.',
    why_tilt: '<b>{h}&nbsp;{u_cm}</b>: pressure depends on the vertical height; along the tube it is {L}&nbsp;{u_cm}.',
    mis_tilt_along: 'That is the length along the tube.',
    mis_tilt_cos: 'Tilting changes neither the air’s pressure nor the height.',
    mis_tilt_less: 'On the scale the top is still at {h}.',

    read_tilt: 'Vertical height: <b>{h}&nbsp;{u_cm}</b> · along the tube: {L}&nbsp;{u_cm}',
    q_tilt_why: 'A tilted tube fills more of its length with mercury, yet the vertical height stays the same. Why?',
    c_tw_right: 'Pressure depends on the vertical height',
    c_tw_air: "Tilting raises the air's pressure",
    c_tw_light: 'Tilting makes mercury lighter',
    c_tw_vac: 'The vacuum pulls the mercury',
    why_tw: "<b>Pressure depends on the vertical height</b> (P = hρg), not on the tube's length.",
    mis_tw_light: "Mercury's density doesn't change.",
    mis_tw_vac: "A vacuum doesn't pull; the air pushes from below.",
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
