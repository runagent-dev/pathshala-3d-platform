// Every string the figure shows, in Bangla and English. The book's words on page 145 (topic 5.4.1, টরিসেলির
// পরীক্ষা): স্ট্র, কোল্ড ড্রিংকস, চুমুক, "10.5 মিটার লম্বা একটা স্ট্র", "কোল্ড ড্রিংকসটা 10.3 মিটার পর্যন্ত উঠে হঠাৎ করে
// থেমে গেছে", "যতই চুমুক দেওয়ার চেষ্টা করো ড্রিংকসটা উপরে উঠছে না", "আমরা ধরে নিচ্ছি কোল্ড ড্রিংকসের ঘনত্ব পানির
// ঘনত্বের কাছাকাছি", "পারদ ঠিক 76 cm উচ্চতায় এসে থেমে গেছে", "পানির ঘনত্ব থেকে পারদের ঘনত্ব 13.6 গুণ বেশি", "আসলে
// ব্যাপারটি ঘটে বাতাসের চাপের জন্য"; page 146: শূন্যতা, পারদ স্তম্ভ, "নলের উপরে কোনো ফুটো নেই, তাই সেদিক দিয়ে বাতাস
// চাপ দিতে পারছে না". The page writes উপর / উপরে. Use t('key', vars) in code and t.num() for numbers; numbers inside
// sentences come in as {vars}. A {key} that is not a var is another string of the same language: units are {u_cm},
// {u_m}, after a no-break space. The questions (q_*) are plain text, no HTML: the quiz writes them as text (their units
// follow a plain no-break space character).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'পানির ব্যারোমিটার',
    view: 'দেখার ধরন',
    view_front_short: 'আগের মতো দেখো',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    u_cm: 'cm',
    u_m: 'm',

    // the one button, step by step
    act_water: 'পারদের বদলে পানি দিলে?',
    act_compare: 'দুটো স্তম্ভ তুলনা করো',
    act_straw: 'স্ট্র দিয়ে চুমুক দিলে?',
    act_again: 'আবার দেখো',
    step_of: 'ধাপ {i} / {n}',

    // one short line per step
    out_mercury: 'পারদ ঠিক <b>{h}&nbsp;{u_cm}</b> উচ্চতায় এসে থেমে গেছে, উপরে শূন্যতা।',
    out_rising: 'নল থেকে বাতাস সরিয়ে নিলে বাইরের বাতাসের চাপ পানিকে ঠেলে তোলে…',
    out_water: 'একই বাতাসের চাপে পানি থামে <b>{h}&nbsp;{u_m}</b> উঁচুতে: প্রায় {n} জন মানুষের সমান!',
    out_compare: 'পানির স্তম্ভ পারদের <b>{k} গুণ</b> উঁচু: <span class="wb-sum">{hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}</span>',
    out_straw: '{L}&nbsp;{u_m} লম্বা স্ট্রতে যত জোরেই চুমুক দাও, কোল্ড ড্রিংকস <b>{h}&nbsp;{u_m}</b>-এর বেশি ওঠে না।',

    // the reason, growing step by step
    rule_mercury: 'পাত্রের পারদের উপর বাতাস চাপ দিচ্ছে; নলের উপরে বাতাস নেই। তাই বাতাসের চাপই {h}&nbsp;{u_cm} পারদ স্তম্ভকে ধরে রাখে।',
    rule_water: 'বাতাসের চাপ দুই পাত্রে সমান। সেই চাপ ধরে রাখে {hHg}&nbsp;{u_cm} পারদ, আবার {h}&nbsp;{u_m} পানি। পানি এত উঁচুতে কেন?',
    rule_compare: '<b>পানির ঘনত্ব থেকে পারদের ঘনত্ব {k} গুণ বেশি,</b> তাই একই চাপে পানি {k} গুণ উঁচুতে ওঠে।',
    rule_straw: 'বাতাসের চাপ এর বেশি তুলতে পারে না, তাই উপরের {gap}&nbsp;{u_m} ফাঁকা থাকে। কোল্ড ড্রিংকসের ঘনত্ব পানির কাছাকাছি।',

    read_cols: 'পারদ স্তম্ভ: <b>{hg}</b> · পানির স্তম্ভ: <b>{w}</b>',
    note_thick: 'নলগুলো আসলের চেয়ে মোটা করে আঁকা।',

    // labels on the picture
    lbl_hg: 'পারদ',
    lbl_hg_h: 'পারদ {h}&nbsp;{u_cm}',
    lbl_water: 'পানি',
    lbl_drink: 'কোল্ড ড্রিংকস {h}&nbsp;{u_m}',
    lbl_vacuum: 'শূন্যতা',
    lbl_air: 'বাতাসের চাপ',
    lbl_cm: '{h}&nbsp;{u_cm}',
    lbl_m: '{h}&nbsp;{u_m}',
    lbl_stack: '{k} × {h}&nbsp;{u_cm}',
    lbl_person: 'মানুষ ≈ {h}&nbsp;{u_m}',
    lbl_straw: 'স্ট্র {h}&nbsp;{u_m}',
    lbl_gap: 'ফাঁকা {h}&nbsp;{u_m}',

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

    q_water: 'এই পরীক্ষা পারদের বদলে পানি দিয়ে করলে পানির স্তম্ভ কত উঁচু হতো?',
    why_water: '<b>প্রায় {h}&nbsp;{u_m}</b>: পারদের ঘনত্ব পানির {k} গুণ, তাই {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}।',
    mis_water_same: 'একই চাপে কম ঘন তরলের স্তম্ভ বেশি উঁচু হয়, সমান নয়।',
    mis_water_divide: 'এখানে ভাগ করা হয়েছে; পানি হালকা, তাই গুণ করতে হবে।',
    mis_water_tenth: 'দশমিক ভুল জায়গায় বসেছে।',

    q_why: 'একই বাতাসের চাপে পানির স্তম্ভ পারদের চেয়ে এত উঁচু হয় কেন?',
    c_why_right: 'পানির ঘনত্ব পারদের চেয়ে অনেক কম',
    c_why_wide: 'পানির নলটি বেশি চওড়া',
    c_why_more: 'পানির পাত্রে বাতাসের চাপ বেশি',
    c_why_pull: 'শূন্যতা পানিকে বেশি টানে',
    why_why: '<b>পানির ঘনত্ব কম</b>: পারদের ঘনত্ব পানির {k} গুণ, তাই একই চাপে পানি {k} গুণ উঁচুতে ওঠে।',
    mis_why_wide: 'স্তম্ভের উচ্চতা নলের চওড়ার উপর নির্ভর করে না।',
    mis_why_more: 'দুই পাত্রে বাতাসের চাপ সমান; নীল তীর দুটোও সমান।',
    mis_why_pull: 'শূন্যতা টানে না; বাতাসের চাপ নিচ থেকে ঠেলে তোলে।',

    q_vac: 'পানির স্তম্ভের উপরে নলের ফাঁকা অংশে কী আছে?',
    c_vac_right: 'শূন্যতা: সেখানে বাতাস নেই',
    c_vac_pull: 'শূন্যতা, যা পানিকে টেনে রাখে',
    c_vac_air: 'নলে ঢুকে পড়া বাতাস',
    c_vac_press: 'বাতাস, যা পানিকে নিচে চাপে',
    why_vac: '<b>শূন্যতা</b>: উপর থেকে কোনো চাপ নেই, তাই নিচের বাতাসের চাপ পানি ধরে রাখে।',
    mis_vac_air: 'নলের মুখ পানির নিচে, তাই বাতাস ঢুকতে পারে না।',
    mis_vac_press: 'উপরে বাতাস থাকলে সে পানিকে নিচে চাপত, পানি এত উঁচুতে থাকত না।',

    q_straw: '{L} m লম্বা একটা স্ট্র দিয়ে খুব জোরে চুমুক দিলে কোল্ড ড্রিংকস কত উঁচুতে উঠবে?',
    why_straw: '<b>প্রায় {h}&nbsp;{u_m}</b>: স্ট্র যত লম্বাই হোক, বাতাসের চাপ কোল্ড ড্রিংকসকে এর বেশি তুলতে পারে না।',
    mis_straw_whole: 'জোরে চুমুক দিলে বড়জোর উপরে শূন্যতা হয়; বাতাসের চাপ {h}&nbsp;{u_m}-এর বেশি তুলতে পারে না।',
    mis_straw_mercury: '{hHg}&nbsp;{u_cm} পারদের বেলায়; কোল্ড ড্রিংকস পানির মতো, পারদের চেয়ে অনেক হালকা।',
    mis_straw_tenth: 'দশমিক ভুল জায়গায়: {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'A water barometer',
    view: 'View',
    view_front_short: 'Back to the view',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    u_cm: 'cm',
    u_m: 'm',

    act_water: 'What if we use water, not mercury?',
    act_compare: 'Compare the two columns',
    act_straw: 'Drinking through a straw?',
    act_again: 'Watch again',
    step_of: 'Step {i} of {n}',

    out_mercury: 'The mercury stops at exactly <b>{h}&nbsp;{u_cm}</b>, with a vacuum above it.',
    out_rising: 'Take the air out of the tube, and the air’s pressure outside pushes the water up…',
    out_water: 'The same air holds the water up to <b>{h}&nbsp;{u_m}</b>: about {n} people tall!',
    out_compare: 'The water column is <b>{k} times</b> as tall: <span class="wb-sum">{hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}</span>',
    out_straw: 'However hard you suck on a {L}&nbsp;{u_m} straw, a cold drink rises no higher than <b>{h}&nbsp;{u_m}</b>.',

    rule_mercury:
      'The air presses on the mercury in the dish; there is no air above it in the tube. So the air’s pressure holds up the {h}&nbsp;{u_cm} column.',
    rule_water:
      'The air presses equally on both dishes. That pressure holds up {hHg}&nbsp;{u_cm} of mercury, and also {h}&nbsp;{u_m} of water. Why is the water so tall?',
    rule_compare: '<b>Mercury is {k} times as dense as water,</b> so the same pressure holds water {k} times as high.',
    rule_straw: 'The air’s pressure can lift it no higher, so the top {gap}&nbsp;{u_m} stays empty. A cold drink is about as dense as water.',

    read_cols: 'Mercury column: <b>{hg}</b> · water column: <b>{w}</b>',
    note_thick: 'The tubes are drawn thicker than real ones.',

    lbl_hg: 'mercury',
    lbl_hg_h: 'mercury {h}&nbsp;{u_cm}',
    lbl_water: 'water',
    lbl_drink: 'cold drink {h}&nbsp;{u_m}',
    lbl_vacuum: 'vacuum',
    lbl_air: 'air pressure',
    lbl_cm: '{h}&nbsp;{u_cm}',
    lbl_m: '{h}&nbsp;{u_m}',
    lbl_stack: '{k} × {h}&nbsp;{u_cm}',
    lbl_person: 'person ≈ {h}&nbsp;{u_m}',
    lbl_straw: 'straw {h}&nbsp;{u_m}',
    lbl_gap: 'empty {h}&nbsp;{u_m}',

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

    q_water: 'If this experiment used water instead of mercury, how tall would the water column be?',
    why_water: '<b>About {h}&nbsp;{u_m}</b>: mercury is {k} times as dense as water, so {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}.',
    mis_water_same: 'The same pressure holds up a taller column of a less dense liquid, not an equal one.',
    mis_water_divide: 'That divides; water is lighter, so multiply.',
    mis_water_tenth: 'The decimal point slipped.',

    q_why: 'With the same air pressure, why is the water column so much taller than the mercury one?',
    c_why_right: 'Water is much less dense than mercury',
    c_why_wide: 'The water tube is wider',
    c_why_more: 'The air presses harder on the water dish',
    c_why_pull: 'The vacuum pulls water harder',
    why_why: '<b>Water is less dense</b>: mercury is {k} times as dense, so the same pressure holds water {k} times as high.',
    mis_why_wide: 'A column’s height does not depend on the tube’s width.',
    mis_why_more: 'The air presses equally on both dishes; the two blue arrows are equal too.',
    mis_why_pull: 'A vacuum does not pull; the air’s pressure pushes from below.',

    q_vac: 'What is in the empty part of the tube above the water?',
    c_vac_right: 'A vacuum: no air at all',
    c_vac_pull: 'A vacuum that pulls the water up',
    c_vac_air: 'Air that got into the tube',
    c_vac_press: 'Air pressing the water down',
    why_vac: '<b>A vacuum</b>: nothing presses from above, so the air’s pressure below holds the water up.',
    mis_vac_air: 'The tube’s mouth is under the water, so no air can get in.',
    mis_vac_press: 'Air above would press the water down; it could not stand so high.',

    q_straw: 'How high would a cold drink rise if you sucked very hard on a {L} m straw?',
    why_straw: '<b>About {h}&nbsp;{u_m}</b>: however long the straw, the air’s pressure can lift a cold drink no higher.',
    mis_straw_whole: 'Sucking hard makes at most a vacuum at the top; the air can lift no more than {h}&nbsp;{u_m}.',
    mis_straw_mercury: '{hHg}&nbsp;{u_cm} is for mercury; a cold drink is like water, far less dense.',
    mis_straw_tenth: 'The decimal point slipped: {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}.',
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
