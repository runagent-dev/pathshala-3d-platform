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
    title: 'ছিদ্রওয়ালা ট্যাংক: উপরে বাতাসের চাপ না থাকলে পানি পড়ে না',
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
    act_cork: 'ছিদ্রের ছিপি খোলো',
    act_lid: 'ঢাকনা খোলো',
    act_refill: 'আবার ভরে ঢাকনা দাও',

    // the result line
    out_k_ready: 'ঢাকনা লাগানো পানির ট্যাংক, নিচের ছিদ্রে ছিপি। ছিপি খোলো।',
    out_k_corking: 'ছিপি খোলা হচ্ছে…',
    out_k_stopped: 'ঢাকনা বন্ধ: পানি একটু বের হয়ে <b>থেমে গেল</b>',
    out_k_opening: 'ঢাকনা খোলা হচ্ছে…',
    out_k_open: 'ঢাকনা খুলতেই <b>জোরে ধারা</b> বের হলো',
    out_k_drain: 'পানি কমছে, h কমছে: ধারা <b>দুর্বল</b> হচ্ছে',

    // the rule: the book's words, one idea at a time
    rule_tank1: '<b>ঢাকনা বন্ধ, তাই উপর থেকে বাতাস চাপ দিতে পারছে না;</b> বাইরের বাতাসের চাপ ছিদ্রের মুখে পানিকে আটকে রাখছে, ঠিক যেমন টরিসেলির নলে পারদকে।',
    rule_tank2: '<b>ঢাকনা খুললে পানির উপরেও বাতাসের চাপ পড়ে,</b> তখন ছিদ্রের উপরের পানির স্তম্ভের চাপ hρg পানিকে বাইরে ঠেলে দেয়। h যত বেশি, ধারা তত জোরে।',

    // labels on the picture
    lbl_air: 'বাতাসের চাপ',
    lbl_depth: 'h = {h}&nbsp;{u_m}',

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

    q_tank: 'ঢাকনা লাগানো, ছিপি খোলা, অথচ ছিদ্র দিয়ে পানি পড়ছে না। কেন?',
    c_tk_right: 'উপরে বাতাসের চাপ নেই',
    c_tk_small: 'ছিদ্রটি খুব বেশি ছোট',
    c_tk_shallow: 'ছিদ্রের উপরে পানি খুব কম',
    c_tk_lid: 'ঢাকনা পানিকে চেপে রাখে',
    why_tank: '<b>উপরে বাতাসের চাপ নেই</b>: বাইরের বাতাস ছিদ্রে পানি আটকে রাখে, টরিসেলির নলের মতো।',
    mis_tk_small: 'ঢাকনা খুললে এই ছিদ্র দিয়েই জোরে ধারা বের হয়।',
    mis_tk_shallow: 'ছিদ্রটি প্রায় {h}&nbsp;{u_m} গভীরে।',
    mis_tk_lid: 'ঢাকনা শুধু উপরের বাতাসকে আটকায়, চাপ দেয় না।',
    read_depth: 'ছিদ্রের উপরে পানি: h = <b>{h}&nbsp;{u_m}</b>',
    q_tk_open: 'ঢাকনা খুলতেই ছিদ্র দিয়ে জোরে ধারা বের হয় কেন?',
    c_to_right: 'এখন উপর থেকেও বাতাস চাপ দেয়',
    c_to_hole: 'ছিদ্রটি বড় হয়ে গেছে',
    c_to_warm: 'পানি গরম হয়ে গেছে',
    c_to_lid: 'ঢাকনা পানিকে চেপে ধরে রেখেছিল',
    why_to: '<b>উপর থেকেও বাতাসের চাপ</b>: তখন ছিদ্রের উপরের পানির স্তম্ভের চাপ hρg পানিকে বাইরে ঠেলে দেয়।',
    mis_to_hole: 'ছিদ্র একই আছে; বদলেছে শুধু ঢাকনা।',
    mis_to_warm: 'পানির তাপমাত্রা বদলায়নি।',
    q_tk_drain: 'ঢাকনা খোলা, পানি কমছে। ধারার কী হয়?',
    c_td_right: 'দুর্বল হয়',
    c_td_more: 'আরও জোরে হয়',
    c_td_same: 'একই থাকে',
    c_td_stop: 'সাথে সাথে থেমে যায়',
    why_td: '<b>দুর্বল হয়</b>: পানি কমলে h কমে, তাই ছিদ্রে চাপ hρg কমে।',
    mis_td_more: 'চাপ h-এর সাথে কমে, বাড়ে না।',
    mis_td_stop: 'ছিদ্রের উপরে পানি থাকা পর্যন্ত ধারা চলে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'A tank with a hole: no air pressing from above, no jet',
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

    act_cork: 'Pull out the cork',
    act_lid: 'Take off the lid',
    act_refill: 'Refill, put the lid on',

    out_k_ready: 'A tank of water with its lid on, a cork in the hole near the bottom. Pull out the cork.',
    out_k_corking: 'Pulling out the cork…',
    out_k_stopped: 'Lid on: a few drops, then it <b>stops</b>',
    out_k_opening: 'Taking off the lid…',
    out_k_open: 'Lid off: <b>a strong jet</b>',
    out_k_drain: 'Less water, smaller h: the jet <b>weakens</b>',

    rule_tank1:
      "<b>The lid is on, so the air cannot press from above;</b> the outside air's pressure holds the water in at the hole, just as it holds the mercury in Torricelli's tube.",
    rule_tank2:
      '<b>Lid off: the air presses on the water too,</b> and the pressure hρg of the water above the hole pushes it out. The bigger h, the stronger the jet.',

    lbl_air: "air's pressure",
    lbl_depth: 'h = {h}&nbsp;{u_m}',

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

    q_tank: 'The lid is on, the cork is out, yet no water comes out of the hole. Why?',
    c_tk_right: 'No air pressing from above',
    c_tk_small: 'The hole is far too small',
    c_tk_shallow: 'Too little water above it',
    c_tk_lid: 'The lid presses the water',
    why_tank: '<b>No air pressing from above</b>: the outside air holds the water in, as in Torricelli’s tube.',
    mis_tk_small: 'Lid off, a strong jet comes through this same hole.',
    mis_tk_shallow: 'The hole is about {h}&nbsp;{u_m} deep.',
    mis_tk_lid: 'The lid only keeps the air off; it doesn’t press.',
    read_depth: 'Water above the hole: h = <b>{h}&nbsp;{u_m}</b>',
    q_tk_open: 'When the lid comes off, why does a strong jet come out of the hole?',
    c_to_right: 'Now the air presses from above too',
    c_to_hole: 'The hole got bigger',
    c_to_warm: 'The water got warmer',
    c_to_lid: 'The lid was holding the water down',
    why_to: '<b>The air presses from above too</b>: then the pressure hρg of the water above the hole pushes it out.',
    mis_to_hole: 'The hole is the same; only the lid changed.',
    mis_to_warm: "The water's temperature didn't change.",
    q_tk_drain: 'The lid is off and the water level falls. What happens to the jet?',
    c_td_right: 'It weakens',
    c_td_more: 'It gets stronger',
    c_td_same: 'It stays the same',
    c_td_stop: 'It stops at once',
    why_td: '<b>It weakens</b>: less water, smaller h, so less pressure hρg at the hole.',
    mis_td_more: "The pressure falls with h; it doesn't grow.",
    mis_td_stop: 'The jet runs as long as there is water above the hole.',
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
