// Every string the figure shows, in Bangla (the book's words, page 79, topic ৩.৭: মহাকর্ষ বল, আকর্ষণ করে, মহাকর্ষীয়
// ধ্রুবক, ভর, পৃথিবীর ভর, পৃথিবীর ব্যাসার্ধ, কেন্দ্র, ওজন, মাধ্যাকর্ষণ, ত্বরণ; this page writes উপর) and English. Use
// t('key', vars) in code and t.num() for numbers: every digit comes in as a var, so ?numerals=latin still works. Symbols
// with subscripts and powers come in as vars built in app.js with <sup>: the bundled font has no ² ⁻ glyphs.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'মহাকর্ষ: আপেল কেন পড়ে',
    view: 'দেখার ধরন',
    view_front_short: 'শুরুর দৃশ্য',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'মহাকর্ষ বল',
    newton: 'নিউটন',

    // the formula: each symbol is a button; the words say what a tap on it shows
    aria_formula: 'মহাকর্ষ বলের সূত্র: একটি প্রতীকে টোকা দাও',
    aria_F: 'F, পৃথিবীর টান, মানে আপেলের ওজন',
    aria_g: 'g, মাধ্যাকর্ষণের ত্বরণ',
    aria_G: 'G, মহাকর্ষীয় ধ্রুবক',
    aria_m: 'm, আপেলের ভর',
    aria_M: 'M, পৃথিবীর ভর',
    aria_R: 'R, পৃথিবীর কেন্দ্র থেকে আপেলের দূরত্ব',

    // the two sliders
    sl_m: 'ভর {m}',
    sl_h: 'উচ্চতা {h}',
    aria_graph_F: 'গ্রাফ: ভর বাড়লে বল F সমান হারে বাড়ে',
    aria_graph_g: 'গ্রাফ: ভর বাড়লেও ত্বরণ g একই থাকে',
    aria_sl_m: 'আপেলের ভর, গ্রামে',
    aria_sl_h: 'মাটি থেকে আপেলের উচ্চতা, মিটারে',

    // the action
    act_drop: 'আপেলটি ছেড়ে দাও',
    act_again: 'আবার ছেড়ে দাও',
    act_falling: 'আপেলটি পড়ছে…',
    act_home: 'শুরুতে ফেরাও',

    // labels on the 3D view: short
    l_m: '{m} = {v} g',
    l_F: '{F} = {v} নিউটন',
    l_h: '{h} = {v} m',
    l_tv: '{t} s · {v} m/s',
    l_every: 'প্রতি {dt} s-এ একটি ছবি',
    l_M: 'পৃথিবীর ভর {M}',
    l_R: '{R} = {v} km',
    l_centre: 'পৃথিবীর কেন্দ্র',
    l_on_earth: 'পৃথিবীর উপর {F}',
    l_on_apple: 'আপেলের উপর {F}',
    l_tree: 'গাছ',
    l_a: 'ক',
    l_b: 'খ',
    l_c: 'গ',

    // the honest notes, in a corner
    note_meadow: 'আপেল {k} গুণ বড় করে আঁকা · সময় {slow} গুণ ধীর',
    note_globe: 'গাছ অনেক বড় করে আঁকা',

    // the result line: the sum that stays the same
    out_g: '{g} = {F} ÷ {m} ≈ <b>{v} {ms2}</b>',
    out_g_sum: '{g} = {Fv} ÷ {mv} ≈ <b>{v} {ms2}</b>',

    // the rule: what the student has found so far, in the book's words
    rule_start: 'পৃথিবী আপেলকে নিজের <b>কেন্দ্রের দিকে</b> {F} বলে আকর্ষণ করে। এই বলটিই আসলে আপেলের <b>ওজন</b>।',
    rule_fall: 'বল {F} পুরো পথে একই থাকে। তাই আপেলের বেগ বাড়তেই থাকে।',
    rule_fell: 'ছবিগুলোর ফাঁক নিচের দিকে বড় হচ্ছে: আপেলের <b>ত্বরণ</b> আছে। এবার ভর {m} বদলে আবার ছাড়ো।',
    rule_mass: '{a} g ও {b} g দুটোই <b>{t} s</b>-এ পড়ল। ভর বাড়লে {F} বাড়ে, কিন্তু {g} একই থাকে।',
    rule_height: '{h} m থেকে পড়তে লাগল <b>{t} s</b>। তবু {g} একই: ডালের উচ্চতা পৃথিবীর ব্যাসার্ধের তুলনায় কিছুই নয়।',
    rule_F: '<b>{F}</b> হলো পৃথিবীর টান, মানে আপেলের ওজন। ভর {m} বাড়াও: তীরটি বড় হবে।',
    rule_G: '<b>{G}</b> হলো মহাকর্ষীয় ধ্রুবক। এর মান {Gv} {Gu}, সব বস্তুর জন্য একই।',
    rule_m: '<b>{m}</b> হলো আপেলের ভর। ভর দ্বিগুণ করো: {F} দ্বিগুণ হবে, {g} একই থাকবে।',
    rule_M: '<b>{M}</b> পৃথিবীর ভর। আপেলও পৃথিবীকে একই {F} বলে আকর্ষণ করে, কিন্তু এত ভরের ত্বরণ মাত্র প্রায় {a} {ms2}।',
    rule_R: '<b>{R}</b> মাপা হয় পৃথিবীর কেন্দ্র থেকে, পৃথিবীপৃষ্ঠ থেকে নয়। {km} km + {h} m প্রায় {km} km-ই।',
    rule_g: 'দুই পাশের {m} কেটে যায়: {law}। তাই <b>{g} ভরের উপর নির্ভর করে না</b>।',

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

    q_gap: 'ছবিতে পড়ন্ত আপেলের ফাঁকগুলো নিচের দিকে বড় হয়েছে। কেন?',
    gap_v: 'আপেলের বেগ বাড়ছে',
    gap_F: 'নিচে বল বেড়ে যাচ্ছে',
    gap_m: 'পড়ার সময় ভর বাড়ছে',
    gap_a: 'ছবি তোলার সময় বদলাচ্ছে',
    why_gap: '<b>আপেলের বেগ বাড়ছে।</b> বল আর ত্বরণ একই থাকে, তাই প্রতি {dt} s-এ বেগ একই পরিমাণ বাড়ে।',
    not_gap_F: 'মাটির কাছে {F} প্রায় একই: {R} বদলায় না বললেই চলে।',
    not_gap_m: 'ভর বদলায় না।',
    not_gap_a: 'ছবি তোলা হয়েছে সমান সময় পরপর।',

    q_weight: 'ছবির আপেলটির ওজন কত?',
    why_weight: '<b>{v} নিউটন:</b> {F} = {m}{g} = {kg} kg × {gv} {ms2}। ভর আগে kg-তে নিতে হয়।',
    not_w_g: 'ভর গ্রামে রয়ে গেছে। আগে kg করো: {g0} g = {kg} kg।',
    not_w_m: 'এটি শুধু ভরের সংখ্যা। ওজন = ভর × {g}।',
    not_w_gv: 'এটি {g}-এর মান। ওজনে ভরও গুণ করতে হয়।',

    q_radius: 'ছবিতে ক, খ, গ তিনটি দূরত্ব। সূত্রের {R} কোনটি?',
    why_radius: '<b>খ:</b> {R} মাপা হয় পৃথিবীর কেন্দ্র থেকে আপেল পর্যন্ত, প্রায় {km} km।',
    rad_a: 'ক',
    rad_b: 'খ',
    rad_c: 'গ',
    rad_ab: 'ক + গ',
    not_rad_a: 'ক শুধু মাটি থেকে উচ্চতা। {R} কেন্দ্র থেকে মাপা হয়।',
    not_rad_c: 'গ পুরো পৃথিবীর ব্যাস। {R} শুধু কেন্দ্র থেকে।',
    not_rad_ab: 'দূরত্ব যোগ করতে হয় না: {R} সরাসরি কেন্দ্র থেকে আপেল পর্যন্ত।',

    q_race: 'দুটি আপেল একই ডাল থেকে একসঙ্গে ছাড়া হলো (বাতাসের বাধা ধরা হয়নি)। কোনটি আগে মাটিতে পড়বে?',
    race_same: 'দুটোই একসঙ্গে',
    race_heavy: 'ভারীটি আগে',
    race_light: 'হালকাটি আগে',
    race_five: 'ভারীটি {n} গুণ আগে',
    why_race: '<b>দুটোই একসঙ্গে।</b> {F} ভরের সমান হারে বাড়ে, তাই {F} ÷ {m} = {g} দুটোরই সমান।',
    not_race_heavy: 'ভারীটির উপর বল বেশি, কিন্তু তাকে নড়াতেও বেশি লাগে।',
    not_race_light: 'হালকাটির ত্বরণ বেশি নয়: {g} ভরের উপর নির্ভর করে না।',

    q_pair: 'ছবিতে পৃথিবী আপেলকে নিচে টানছে। আপেল পৃথিবীকে কত বলে টানে?',
    pair_same: 'একই {v} নিউটন, উপরের দিকে',
    pair_less: 'প্রায় {zero} নিউটন, কারণ আপেল ছোট',
    pair_none: 'একেবারেই টানে না',
    pair_more: 'আরও বেশি, কারণ পৃথিবী বড়',
    why_pair: '<b>একই {v} নিউটন:</b> দুটি ভর একে অপরকে একই বলে আকর্ষণ করে। পৃথিবীর ভর বিশাল, তাই সে প্রায় নড়ে না।',
    not_pair_less: 'বল কম নয়, সমান। ত্বরণ কম, কারণ পৃথিবীর ভর বিশাল।',
    not_pair_none: 'বই বলছে: দুটি ভর একে অপরকে একই বলে আকর্ষণ করে।',
    not_pair_more: 'বেশি নয়: দুটি বল সমান।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Gravitation: why the apple falls',
    view: 'View',
    view_front_short: 'First view',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Gravitational force',
    newton: 'N',

    aria_formula: 'The law of gravitation: tap a symbol',
    aria_F: 'F, the Earth’s pull, which is the apple’s weight',
    aria_g: 'g, the acceleration due to gravity',
    aria_G: 'G, the gravitational constant',
    aria_m: 'm, the apple’s mass',
    aria_M: 'M, the Earth’s mass',
    aria_R: 'R, the distance from the Earth’s centre to the apple',

    sl_m: 'Mass {m}',
    sl_h: 'Height {h}',
    aria_graph_F: 'Graph: F grows in step with the mass',
    aria_graph_g: 'Graph: g stays the same whatever the mass',
    aria_sl_m: 'The apple’s mass, in grams',
    aria_sl_h: 'The apple’s height above the ground, in metres',

    act_drop: 'Let the apple go',
    act_again: 'Let it go again',
    act_falling: 'The apple is falling…',
    act_home: 'Back to the start',

    l_m: '{m} = {v} g',
    l_F: '{F} = {v} N',
    l_h: '{h} = {v} m',
    l_tv: '{t} s · {v} m/s',
    l_every: 'One picture every {dt} s',
    l_M: 'Earth’s mass {M}',
    l_R: '{R} = {v} km',
    l_centre: 'Earth’s centre',
    l_on_earth: '{F} on the Earth',
    l_on_apple: '{F} on the apple',
    l_tree: 'tree',
    l_a: 'A',
    l_b: 'B',
    l_c: 'C',

    note_meadow: 'Apple drawn {k} times too big · time {slow} times slower',
    note_globe: 'The tree is drawn far too big',

    out_g: '{g} = {F} ÷ {m} ≈ <b>{v} {ms2}</b>',
    out_g_sum: '{g} = {Fv} ÷ {mv} ≈ <b>{v} {ms2}</b>',

    rule_start: 'The Earth attracts the apple towards its <b>centre</b> with a force {F}. This force is the apple’s <b>weight</b>.',
    rule_fall: 'The force {F} stays the same all the way down, so the apple keeps gaining speed.',
    rule_fell: 'The gaps grow on the way down: the apple has an <b>acceleration</b>. Now change the mass {m} and let it go again.',
    rule_mass: '{a} g and {b} g both fell in <b>{t} s</b>. More mass means more {F}, but the same {g}.',
    rule_height: 'From {h} m it took <b>{t} s</b>. Still the same {g}: a branch’s height is nothing next to the Earth’s radius.',
    rule_F: '<b>{F}</b> is the Earth’s pull, the apple’s weight. Raise the mass {m}: the arrow grows.',
    rule_G: '<b>{G}</b> is the gravitational constant, {Gv} {Gu}, the same for all bodies.',
    rule_m: '<b>{m}</b> is the apple’s mass. Double it: {F} doubles, {g} stays the same.',
    rule_M: '<b>{M}</b> is the Earth’s mass. The apple attracts the Earth with the same {F}, but so much mass accelerates only about {a} {ms2}.',
    rule_R: '<b>{R}</b> is measured from the Earth’s centre, not from its surface. {km} km + {h} m is still about {km} km.',
    rule_g: 'The {m} on both sides cancels: {law}. So <b>{g} does not depend on the mass</b>.',

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

    q_gap: 'In the picture the falling apple’s gaps grow on the way down. Why?',
    gap_v: 'The apple is gaining speed',
    gap_F: 'The force grows lower down',
    gap_m: 'The mass grows as it falls',
    gap_a: 'The picture timing changes',
    why_gap: '<b>The apple is gaining speed.</b> Force and acceleration stay the same, so each {dt} s adds the same speed.',
    not_gap_F: 'Near the ground {F} is almost the same: {R} hardly changes.',
    not_gap_m: 'The mass does not change.',
    not_gap_a: 'The pictures are taken at equal times.',

    q_weight: 'What is the weight of the apple in the picture?',
    why_weight: '<b>{v} N:</b> {F} = {m}{g} = {kg} kg × {gv} {ms2}. First put the mass in kg.',
    not_w_g: 'The mass was left in grams. First: {g0} g = {kg} kg.',
    not_w_m: 'That is only the mass’s number. Weight = mass × {g}.',
    not_w_gv: 'That is the value of {g}. The weight needs the mass too.',

    q_radius: 'A, B and C are three distances. Which is the {R} of the formula?',
    why_radius: '<b>B:</b> {R} is measured from the Earth’s centre to the apple, about {km} km.',
    rad_a: 'A',
    rad_b: 'B',
    rad_c: 'C',
    rad_ab: 'A + C',
    not_rad_a: 'A is only the height above the ground. {R} starts at the centre.',
    not_rad_c: 'C is the whole Earth’s diameter. {R} starts at the centre.',
    not_rad_ab: 'Nothing is added up: {R} goes straight from the centre to the apple.',

    q_race: 'Two apples are let go together from the same branch (no air resistance). Which lands first?',
    race_same: 'Both together',
    race_heavy: 'The heavy one',
    race_light: 'The light one',
    race_five: 'Heavy, {n} times sooner',
    why_race: '<b>Both together.</b> {F} grows in step with the mass, so {F} ÷ {m} = {g} is the same for both.',
    not_race_heavy: 'The heavy one is pulled harder, but it is also harder to move.',
    not_race_light: 'The light one has no more acceleration: {g} does not depend on the mass.',

    q_pair: 'In the picture the Earth pulls the apple down. How hard does the apple pull the Earth?',
    pair_same: 'The same {v} N, upwards',
    pair_less: 'About {zero} N: the apple is small',
    pair_none: 'It does not pull at all',
    pair_more: 'Harder: the Earth is big',
    why_pair: '<b>The same {v} N:</b> two masses attract each other with the same force. The Earth’s mass is huge, so it hardly moves.',
    not_pair_less: 'The force is not smaller but equal. The acceleration is small, as the Earth’s mass is huge.',
    not_pair_none: 'The book says: two masses attract each other with the same force.',
    not_pair_more: 'Not harder: the two forces are equal.',
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
