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
    title: 'স্ট্র দিয়ে কোল্ড ড্রিংকস: বাতাসের চাপ তরলকে ঠেলে তোলে',
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
    act_suck: 'চুমুক দাও',
    act_stop: 'চুমুক থামাও',

    // the result line
    out_straw_rest: 'চুমুক নেই: দুই দিকে <b>সমান চাপ</b>, ড্রিংকস ওঠে না। চুমুক দাও।',
    out_straw_suck: 'মুখে চাপ কমেছে: ড্রিংকস <b>স্ট্র বেয়ে উঠছে</b>',
    out_straw_up: 'বাইরের বাতাসের চাপ ড্রিংকস <b>মুখে তুলে দিল</b>',

    // the rule: the book's words, one idea at a time
    rule_straw0:
      '<b>স্ট্র দিয়ে কোল্ড ড্রিংকস খাওয়ার ব্যাপারটি ঘটে বাতাসের চাপের জন্য।</b> চুমুক না দিলে মুখের ভেতরে আর বোতলে একই বাতাসের চাপ; দুটো চাপই সমান, তাই কোনো কার্যকর বল নেই।',
    rule_straw1:
      '<b>চুমুক দিলে মুখের ভেতরে বাতাসের চাপ কমে যায়,</b> তখন তরলের উপরে বাতাসের চাপের জন্য তরলটা স্ট্র বেয়ে উপরে ওঠে। তবে যত জোরেই চুমুক দাও, কোল্ড ড্রিংকস {h}&nbsp;{u_m}-এর বেশি উঠবে না।',

    // labels on the picture
    lbl_air: 'বাতাসের চাপ',
    lbl_outside: 'বাইরের বাতাসের চাপ',
    lbl_mouth: 'মুখের ভেতরের বাতাসের চাপ',

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

    q_straw: 'স্ট্র মুখে, বোতলে ডোবানো, কিন্তু চুমুক নেই। কোল্ড ড্রিংকস স্ট্র বেয়ে ওঠে না কেন?',
    c_st_right: 'ভেতরে-বাইরে চাপ সমান',
    c_st_noair: 'স্ট্রের ভেতরে বাতাস নেই',
    c_st_narrow: 'স্ট্র সরু, তরল ঢোকে না',
    c_st_down: 'বাতাস শুধু নিচে চাপ দেয়',
    why_straw: '<b>দুটো চাপই সমান</b>: মুখে আর বোতলে একই চাপ, কার্যকর বল নেই।',
    mis_st_noair: 'স্ট্রেও বাতাস আছে, তার চাপ বাইরের সমান।',
    mis_st_narrow: 'তরল স্ট্রে ঢোকে, বোতলের তলের সমান পর্যন্ত।',
    mis_st_down: 'তরলে চাপ সব দিকে যায়; চুমুক দিলেই তরল ওঠে।',

    read_mouth: 'মুখের ভেতরের চাপ: <b>{p}</b>',
    read_same: 'বাইরের সমান',
    read_less: 'বাইরের চেয়ে কম',
    q_st_suck: 'চুমুক দিলে কোল্ড ড্রিংকস স্ট্র বেয়ে ওঠে কেন?',
    c_su_right: 'বাইরের বাতাস ঠেলে তোলে',
    c_su_pull: 'মুখ তরলকে টেনে তোলে',
    c_su_straw: 'স্ট্র নিজেই তরল টানে',
    c_su_light: 'চুমুকে তরল হালকা হয়',
    why_su: '<b>বাইরের বাতাস ঠেলে তোলে</b>: মুখে চাপ কমে, বোতলের তরলের উপর বাতাসের চাপ বেশি থাকে।',
    mis_su_pull: 'মুখ টানে না; মুখে শুধু চাপ কমে।',
    mis_su_straw: 'চুমুক না দিলে স্ট্রে তরল ওঠে না।',
    mis_su_light: 'তরলের ঘনত্ব বদলায় না।',
    q_st_max: 'যত জোরেই চুমুক দাও, কোল্ড ড্রিংকস স্ট্র বেয়ে সবচেয়ে বেশি কত উঁচুতে উঠতে পারে?',
    why_st_max: '<b>প্রায় {h}&nbsp;{u_m}</b>: মুখে চাপ শূন্য হলেও বাইরের বাতাসের চাপ এর বেশি তুলতে পারে না।',
    mis_st_same: 'এটি পারদের উচ্চতা; ড্রিংকস পারদের চেয়ে অনেক হালকা।',
    mis_st_small: 'বাতাসের চাপ এর চেয়ে অনেক উঁচু স্তম্ভ ধরে রাখতে পারে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: "A straw: the air's pressure pushes the drink up",
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

    act_suck: 'Suck',
    act_stop: 'Stop sucking',

    out_straw_rest: 'No sucking: <b>equal pressures</b>, the drink stays. Suck.',
    out_straw_suck: 'Less pressure in the mouth: the drink <b>climbs</b>',
    out_straw_up: 'The outside air <b>pushed the drink up</b> to the mouth',

    rule_straw0:
      "<b>A straw works because of the air's pressure.</b> Without sucking, the air in the mouth and over the drink press the same; the two pressures are equal, so there is no net force.",
    rule_straw1:
      "<b>Sucking lowers the air's pressure in the mouth,</b> and the air pressing on the drink pushes it up the straw. But however hard you suck, a cold drink never rises more than {h}&nbsp;{u_m}.",

    lbl_air: "air's pressure",
    lbl_outside: "outside air's pressure",
    lbl_mouth: "air's pressure in the mouth",

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

    q_straw: 'The straw is in the mouth and the bottle, but nobody sucks. Why doesn’t the drink climb the straw?',
    c_st_right: 'Equal pressures inside and out',
    c_st_noair: 'No air inside the straw',
    c_st_narrow: 'Too narrow for the drink',
    c_st_down: 'Air only presses downward',
    why_straw: '<b>Equal pressures</b>: mouth and bottle press the same, so no net force.',
    mis_st_noair: 'There is air in the straw too, pressing as hard as outside.',
    mis_st_narrow: 'The drink enters the straw, to the bottle’s level.',
    mis_st_down: 'Pressure in a liquid acts every way; suck and it rises.',

    read_mouth: 'Pressure in the mouth: <b>{p}</b>',
    read_same: 'same as outside',
    read_less: 'less than outside',
    q_st_suck: 'When you suck, why does the drink climb the straw?',
    c_su_right: 'The outside air pushes it up',
    c_su_pull: 'The mouth pulls it up',
    c_su_straw: 'The straw pulls it up',
    c_su_light: 'Sucking makes it lighter',
    why_su: "<b>The outside air pushes it up</b>: the mouth's pressure falls, the air pressing on the drink stays.",
    mis_su_pull: "The mouth doesn't pull; its pressure only falls.",
    mis_su_straw: "Without sucking the drink doesn't climb.",
    mis_su_light: "The drink's density doesn't change.",
    q_st_max: 'However hard you suck, how high can a cold drink rise in a straw at most?',
    why_st_max: "<b>About {h}&nbsp;{u_m}</b>: even with no pressure in the mouth, the outside air can't push it higher.",
    mis_st_same: "That is the mercury's height; the drink is much lighter than mercury.",
    mis_st_small: "The air's pressure holds up a much taller column than that.",
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
