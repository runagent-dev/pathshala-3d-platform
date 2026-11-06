// Every string the figure shows, in Bangla and English. The book's words on pages 145–146 (topic 5.4.1, টরিসেলির
// পরীক্ষা): স্ট্র, কোল্ড ড্রিংকস, চুমুক, "আসলে ব্যাপারটি ঘটে বাতাসের চাপের জন্য", "কোল্ড ড্রিংকসটা 10.3 মিটার পর্যন্ত
// উঠে হঠাৎ করে থেমে গেছে", "পারদ ঠিক 76 cm উচ্চতায় এসে থেমে গেছে", "পানির ঘনত্ব থেকে পারদের ঘনত্ব 13.6 গুণ বেশি",
// "দুটো চাপই সমান, কাজেই এর ভেতরে কোনো কার্যকর বল নেই", "চুমুক দিলে ... মুখের ভেতরে শূন্যতা তৈরি করার চেষ্টা করো,
// তখন সেখানে বাতাসের চাপ কমে যায়", বিজ্ঞানী টরিসেলি, 1643, "এক মুখ বন্ধ একটা নলের ভেতর পারদ ভরে, নলটি পারদ ভরা একটা
// পাত্রে উল্টে", শূন্যতা, "বাতাস পারদের উপরে চাপ দিচ্ছে এবং সেই চাপ তরলের সব জায়গায় সঞ্চালিত হয়ে নলের নিচেও এসেছে",
// "নলের উপরে কোনো ফুটো নেই, তাই সেদিক দিয়ে বাতাস চাপ দিতে পারছে না", "76 cm উঁচু পারদ স্তম্ভের ওজনের কারণে তৈরি
// হওয়া চাপ", ব্যারোমিটার ("বাতাসের চাপ মাপার যন্ত্রের নাম ব্যারোমিটার"), চিত্র ৫.১০. The page writes উপর / উপরে.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language (the unit {u_m}). intro / intro_short are the first screen's calm card
// (the short one for small frames); lead_* the line before the action; out_* the result; rule_* the rule, the book's
// term last and in bold. The questions (q_*) are plain text, no HTML: the quiz writes them as text.

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
    aria_stage: 'একটি কাচের গ্লাসে কোল্ড ড্রিংকস, তাতে একটি স্ট্র; স্ট্রের উপরের মাথা মুখের ভেতরে',
    u_m: 'মিটার',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_tap: 'গ্লাসে টোকা দাও',

    // the steps
    ex_label: 'ধাপ',
    ex_rest: 'চুমুক ছাড়া',
    ex_suck: 'চুমুক দিলে',
    ex_max: 'কত উঁচু?',

    // the action and the quiet buttons
    act_look: 'বাতাসের চাপ দেখো',
    act_suck: 'চুমুক দাও',
    act_max: 'সবচেয়ে উঁচুতে কত?',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',

    // the first screen: a few calm words
    intro: 'তুমি নিশ্চয়ই কখনো না কখনো স্ট্র দিয়ে কোল্ড ড্রিংকস খেয়েছ। চুমুক দিলেই ড্রিংকসটা উপরে উঠে মুখে চলে আসে। কিন্তু কে তাকে উপরে তোলে? চলো দেখি।',
    intro_short: 'স্ট্র দিয়ে কোল্ড ড্রিংকস তো খেয়েছ। কিন্তু ড্রিংকসটা উপরে ওঠে কেন? চলো দেখি।',

    // the line before the action: what the next tap will show
    lead_rest: 'এবার চুমুক দিয়ে দেখি, কী বদলায়।',
    lead_suck: 'যত জোরেই চুমুক দাও, ড্রিংকস কত উঁচু পর্যন্ত উঠতে পারে?',
    lead_max: 'এবার নিজে যাচাই করো।',

    // the result line
    out_rest: 'ছোট বিন্দুগুলো বাতাস। মুখের ভেতরে আর গ্লাসে বাতাস <b>সমান ঘন</b>, তাই ড্রিংকস স্ট্রে গ্লাসের সমান উঁচুতেই থাকে।',
    out_suck: 'মুখের ভেতরে বাতাস <b>কমে গেছে</b>। বাইরের বাতাস ড্রিংকসকে ঠেলে মুখে তুলে দিল।',
    out_max: 'ড্রিংকস <b>{h}&nbsp;{u_m}</b> উঠে থেমে গেছে, স্ট্রের বাকিটা ফাঁকা।',

    // the rule: the book's words, the book's term last and in bold
    rule_rest: 'মুখের ভেতরের বাতাসের চাপ আর ড্রিংকসের উপরে বাতাসের চাপ একই। দুটো চাপই সমান, কাজেই কোনো <b>কার্যকর বল</b> নেই।',
    rule_suck: 'চুমুক দিলে মুখের ভেতরে বাতাসের চাপ কমে যায়। মুখ টানে না: তরলের উপরে বাইরের বাতাস বেশি চাপ দেয়, তাই তরল ওঠে। আসলে ব্যাপারটি ঘটে <b>বাতাসের চাপের</b> জন্য।',
    rule_max: 'মুখে চাপ একদম না থাকলেও বাইরের বাতাস কোল্ড ড্রিংকসকে এর বেশি ঠেলে তুলতে পারে না। তাই যত জোরেই চুমুক দাও, ড্রিংকস <b>{h}&nbsp;{u_m}</b>-এর বেশি উঠবে না।',

    // labels on the picture (short)
    lbl_outside: 'বাইরের বাতাস',
    lbl_mouth: 'মুখের ভেতর',
    lbl_net: 'কার্যকর বল',
    lbl_max: '{h} {u_m}',
    lbl_five: '{h} {u_m}',
    lbl_person: 'মানুষ',

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

    q_straw: 'স্ট্র মুখে, গ্লাসে ডোবানো, কিন্তু চুমুক নেই। কোল্ড ড্রিংকস স্ট্র বেয়ে ওঠে না কেন?',
    c_st_right: 'মুখে আর গ্লাসে চাপ সমান',
    c_st_noair: 'স্ট্রের ভেতরে বাতাস নেই',
    c_st_narrow: 'স্ট্র সরু, তরল ঢোকে না',
    c_st_down: 'বাতাস শুধু নিচে চাপ দেয়',
    why_straw: '<b>দুটো চাপই সমান</b>। মুখে আর গ্লাসে একই চাপ, তাই কার্যকর বল নেই।',
    mis_st_noair: 'স্ট্রেও বাতাস আছে, তার চাপ বাইরের সমান।',
    mis_st_narrow: 'তরল স্ট্রে ঢোকে, গ্লাসের তরলের সমান উঁচু পর্যন্ত।',
    mis_st_down: 'তরলে চাপ সব দিকে যায়; চুমুক দিলেই তরল ওঠে।',

    q_st_where: 'চুমুক দিলে কোথায় বাতাসের চাপ কমে যায়?',
    c_wh_right: 'মুখের ভেতরে',
    c_wh_glass: 'গ্লাসের তরলের উপরে',
    c_wh_all: 'সব জায়গায় সমানভাবে',
    c_wh_none: 'কোথাও কমে না',
    why_where: '<b>মুখের ভেতরে</b>। সেখানে বাতাস কমে যায়, তাই চাপ কমে। তরলের উপরে বাইরের বাতাসের চাপ আগের মতোই থাকে।',
    mis_wh_glass: 'গ্লাসের উপরের বাতাস আগের মতোই ঘন থাকে।',
    mis_wh_all: 'সব জায়গায় সমান কমলে কোনো কার্যকর বল হতো না।',
    mis_wh_none: 'চাপ না কমলে ড্রিংকস উঠত না।',

    q_st_suck: 'চুমুক দিলে কোল্ড ড্রিংকস স্ট্র বেয়ে ওঠে কেন?',
    c_su_right: 'বাইরের বাতাস ঠেলে তোলে',
    c_su_pull: 'মুখ তরলকে টেনে তোলে',
    c_su_straw: 'স্ট্র নিজেই তরল টানে',
    c_su_light: 'চুমুকে তরল হালকা হয়',
    why_su: '<b>বাইরের বাতাস ঠেলে তোলে</b>। মুখে চাপ কমে, কিন্তু তরলের উপরে বাতাসের চাপ বেশি থাকে।',
    mis_su_pull: 'মুখ টানে না; মুখে শুধু চাপ কমে।',
    mis_su_straw: 'চুমুক না দিলে স্ট্রে তরল ওঠে না।',
    mis_su_light: 'তরলের ঘনত্ব বদলায় না।',

    q_st_max: 'যত জোরেই চুমুক দাও, কোল্ড ড্রিংকস স্ট্র বেয়ে সবচেয়ে বেশি কত উঁচুতে উঠতে পারে?',
    why_st_max: '<b>প্রায় {h}&nbsp;{u_m}</b>। মুখে চাপ শূন্য হলেও বাইরের বাতাসের চাপ এর বেশি তুলতে পারে না।',
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
    aria_stage: 'A glass of cold drink with a straw in it; the top end of the straw is inside a mouth',
    u_m: 'm',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_tap: 'Tap the glass',

    ex_label: 'Steps',
    ex_rest: 'No sucking',
    ex_suck: 'Sucking',
    ex_max: 'How high?',

    act_look: "See the air's pressure",
    act_suck: 'Suck',
    act_max: 'How high at most?',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',

    intro: 'You have surely drunk a cold drink through a straw. You suck, and the drink comes up into your mouth. But what lifts it up? Let’s see.',
    intro_short: 'You have drunk through a straw. But why does the drink go up? Let’s see.',

    lead_rest: 'Now suck, and see what changes.',
    lead_suck: 'However hard you suck, how high can the drink go?',
    lead_max: 'Now check yourself.',

    out_rest:
      'The small dots are air. It is <b>equally crowded</b> in the mouth and over the glass, so the drink in the straw stays level with the glass.',
    out_suck: 'There is <b>less air</b> in the mouth now. The outside air pushed the drink up into it.',
    out_max: 'The drink rose <b>{h}&nbsp;{u_m}</b> and stopped; the rest of the straw is empty.',

    rule_rest: 'The air presses as hard in the mouth as over the drink. The two pressures are equal, so there is no <b>net force</b>.',
    rule_suck:
      'Sucking lowers the air’s pressure in the mouth. The mouth doesn’t pull: the outside air presses harder on the drink, so it rises. It all happens because of the <b>air’s pressure</b>.',
    rule_max:
      'Even with no pressure at all in the mouth, the outside air cannot push a cold drink any higher. However hard you suck, it never rises more than <b>{h}&nbsp;{u_m}</b>.',

    lbl_outside: 'outside air',
    lbl_mouth: 'inside the mouth',
    lbl_net: 'net force',
    lbl_max: '{h} {u_m}',
    lbl_five: '{h} {u_m}',
    lbl_person: 'a person',

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

    q_straw: 'The straw is in the mouth and the glass, but nobody sucks. Why doesn’t the drink climb the straw?',
    c_st_right: 'Equal pressures, mouth and glass',
    c_st_noair: 'No air inside the straw',
    c_st_narrow: 'Too narrow for the drink',
    c_st_down: 'Air only presses downward',
    why_straw: '<b>Equal pressures</b>. Mouth and glass press the same, so there is no net force.',
    mis_st_noair: 'There is air in the straw too, pressing as hard as outside.',
    mis_st_narrow: 'The drink enters the straw, level with the glass.',
    mis_st_down: 'Pressure in a liquid acts every way; suck and it rises.',

    q_st_where: 'When you suck, where does the air’s pressure fall?',
    c_wh_right: 'Inside the mouth',
    c_wh_glass: 'Over the drink in the glass',
    c_wh_all: 'Everywhere alike',
    c_wh_none: 'Nowhere',
    why_where: '<b>Inside the mouth</b>. There is less air there, so less pressure. Over the drink the outside air presses as before.',
    mis_wh_glass: 'The air over the glass stays as crowded as before.',
    mis_wh_all: 'If it fell everywhere alike there would be no net force.',
    mis_wh_none: 'Without a fall in pressure the drink would not rise.',

    q_st_suck: 'When you suck, why does the drink climb the straw?',
    c_su_right: 'The outside air pushes it up',
    c_su_pull: 'The mouth pulls it up',
    c_su_straw: 'The straw pulls it up',
    c_su_light: 'Sucking makes it lighter',
    why_su: '<b>The outside air pushes it up</b>. The mouth’s pressure falls, but the air pressing on the drink stays.',
    mis_su_pull: "The mouth doesn't pull; its pressure only falls.",
    mis_su_straw: "Without sucking the drink doesn't climb.",
    mis_su_light: "The drink's density doesn't change.",

    q_st_max: 'However hard you suck, how high can a cold drink rise in a straw at most?',
    why_st_max: '<b>About {h}&nbsp;{u_m}</b>. Even with no pressure in the mouth, the outside air can’t push it higher.',
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
