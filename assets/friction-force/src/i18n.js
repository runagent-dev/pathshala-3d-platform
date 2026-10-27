// Every string the figure shows, in Bangla (the book's words, pages 88–89, ৩.৯ ঘর্ষণ বল: ঘর্ষণ বল, প্রয়োগ করা বল,
// বিপরীত দিকে, ওজন, এবড়োখেবড়ো, খাঁজ, তাপ) and English. Plain everyday words come first; the symbols F and f only
// after the student has seen what they stand for.
// Use t('key', vars) in code, and t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    title: 'ঘর্ষণ বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ঘর্ষণ',

    loads: 'ব্লকের ওপর ওজন বসাও',
    chip_w0: 'খালি ব্লক',
    chip_w: '+{n} কেজি',
    res_move: 'সরাতে {f} নিউটন',

    // the action (the big button and the numbered ring on the block)
    act_push: 'ব্লকটিকে ঠেলা দাও',
    act_other: 'উল্টো দিক থেকে ঠেলা',
    act_weight: 'ওজন চাপিয়ে ঠেলা দাও',
    act_lens: 'ছোঁয়া জায়গা বড় করে দেখো',
    act_rub: 'ব্লকটি ঘষো',
    act_again: 'আবার ঠেলা দাও',
    act_home: 'ব্লক মাঝখানে আনো',
    act_side: 'অন্য দিক থেকে ঠেলা',

    // on the picture: the plain word first; the symbol once the student has seen what it stands for
    l_push: 'ঠেলা',
    l_push_f: 'ঠেলা F',
    l_push_n: 'ঠেলা {f} নিউটন',
    l_fric: 'ঘর্ষণ',
    l_fric_f: 'ঘর্ষণ f',
    l_block: '{n} কেজি',
    l_weight: '{n} কেজি',
    l_weight_short: 'ওজন',
    l_block_word: 'ব্লক',
    l_table_word: 'টেবিল',
    lens_cap: 'অনেক বড় করে দেখা',
    lens_note: 'আকার প্রকৃত অনুপাতে নয়',

    // the result line: what the student sees right now (one number, in <b>)
    out_rest: 'ঠেলা না দিলে ব্লক স্থির, ঘর্ষণও নেই',
    out_hold: 'ব্লক নড়ছে না: ঘর্ষণ ঠেলার সমান, দুটোই <b>{f}</b> নিউটন',
    out_slip: 'ঠেলা <b>{f}</b> নিউটনের বেশি, মানে ঘর্ষণের চেয়ে বেশি হতেই ব্লক গতি পেল',
    out_slip_more: 'আগের চেয়ে বেশি ঠেলা লাগল: <b>{f}</b> নিউটনের বেশি ঠেলায় ব্লক গতি পেল',
    out_rub: 'ব্লকটিকে সামনে-পেছনে ঘষা হচ্ছে: ঘর্ষণ সব সময় বেগের বিপরীত দিকে',
    out_rub_hot: 'ঘর্ষণ সব সময় বেগের বিপরীত দিকে, আর ঘষতে ঘষতে তল দুটো গরম হচ্ছে',
    out_hot: 'ঘষা শেষ, তল দুটো এখনও গরম',
    out_lens: 'বড় করে দেখলে তল দুটো এবড়োখেবড়ো: খাঁজে খাঁজে আটকে আছে। ওজন বদলে দেখো।',
    out_lens_more: 'ওজন বাড়াতেই খাঁজ আরও গভীরে ঢুকল',
    out_lens_less: 'ওজন কমাতেই খাঁজ আলগা হল',

    // the rule line: one short sentence for what was just found, in the book's words where it can be
    rule_start: 'ব্লককে ঠেললে টেবিলের ছোঁয়া জায়গা ঠেলাকে আটকায়। এই আটকানো বলের নাম <b>ঘর্ষণ বল</b>।',
    rule_push: '<b>ঠেলা বাড়লে ঘর্ষণও ততটা বাড়ে,</b> একটা সীমা পর্যন্ত। তার পর ঠেলার বাকি অংশে ব্লক গতি পায়।',
    rule_side: '<b>ঘর্ষণ বল সব সময়েই ঠেলার (প্রয়োগ করা বলের) বিপরীত দিকে কাজ করে।</b>',
    rule_load: '<b>ব্লকের ওপর ওজন বসালে ঘর্ষণ আরও বাড়ে</b>, তাই সরাতে আরও জোরে ঠেলতে হয়।',
    rule_lens: '<b>সমান মনে হলেও তল দুটো এবড়োখেবড়ো।</b> উঁচুনিচু অংশ একে অন্যের খাঁজে আটকে যায়।',
    rule_rub: '<b>ঘর্ষণের জন্য তাপ সৃষ্টি হয়।</b> গাড়ির ইঞ্জিনেও তাই, ইঞ্জিনকে ঠান্ডা রাখতে হয়।',
    rule_all: '<b>ঘর্ষণ ঠেলার উল্টো দিকে কাজ করে।</b> ওজন বাড়লে ঘর্ষণও বাড়ে, আর তাপ তৈরি করে।',

    hint_wait: 'ঠেলা চলছে, দেখো ব্লকটি কী করে।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_look: 'দেখো…',
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

    q_dir: 'ব্লকটিকে ঠেলা দেওয়া হচ্ছে (কমলা তীর), কিন্তু সেটি নড়ছে না। ঘর্ষণ বল কোন দিকে কাজ করছে?',
    dir_right: 'ডান দিকে',
    dir_left: 'বাম দিকে',
    dir_up: 'ওপর দিকে',
    dir_none: 'কোনো দিকে নয়',
    why_dir: '<b>{dir}, ঠেলার উল্টো দিকে।</b> ঘর্ষণ বল সব সময়েই প্রয়োগ করা বলের বিপরীত দিকে কাজ করে।',
    not_dir_same: 'ঘর্ষণ ঠেলাকে বাড়ায় না, আটকায়।',
    not_dir_up: 'ঘর্ষণ ছোঁয়া তল বরাবর, পাশের দিকে কাজ করে।',
    not_dir_none: 'ঠেলা আছে বলেই ঘর্ষণ আছে; সেটাই ব্লকটিকে নড়তে দিচ্ছে না।',

    q_eq: 'ব্লকটি নড়ছে না। ছবির তীরে ঠেলার মাপ দেখো: ঘর্ষণ বল কত?',
    n_newton: '{f} নিউটন',
    why_eq: '<b>ঠেলার সমান, {f} নিউটন।</b> ব্লক নড়ছে না মানে ঘর্ষণ ঠেলাকে ঠিক আটকে রেখেছে।',
    not_zero: 'ঘর্ষণ না থাকলে ব্লক ঠেলায় সরে যেত।',
    not_double: 'ঘর্ষণ ঠেলার চেয়ে বেশি হলে ব্লক উল্টো দিকে সরত।',
    not_weight: 'ওজন নিচের দিকে, ঘর্ষণ পাশের দিকে: দুটো আলাদা বল।',

    q_wt: 'খালি ব্লকটি ছবির এই ঠেলায় সরে গিয়েছিল। এখন এর ওপর ওজন বসানো। একই ঠেলা দিলে কী হবে?',
    w_stay: 'নড়বে না',
    w_same: 'আগের মতোই সরবে',
    w_easy: 'আরও সহজে সরবে',
    w_fast: 'আরও জোরে ছুটবে',
    why_wt: '<b>নড়বে না।</b> ওজনের চাপে ঘর্ষণ বেড়েছে; এখন সরাতে {c} নিউটনের বেশি ঠেলা লাগে।',
    not_same: 'ওজন বসালে ঘর্ষণ বাড়ে, তাই আগের ঠেলা আর যথেষ্ট নয়।',
    not_easy: 'ওজন ঘর্ষণ কমায় না, বাড়ায়।',
    not_fast: 'ঘর্ষণ বাড়লে ব্লক আরও ধীর হয়, দ্রুত নয়।',

    q_why: 'ছবিতে ব্লক আর টেবিলের ছোঁয়া জায়গা অনেক বড় করে দেখানো হয়েছে। ঘর্ষণ কেন হয়?',
    y_lock: 'তল দুটোর খাঁজ আটকে যায়',
    y_glue: 'তল দুটো আঠার মতো লাগে',
    y_magnet: 'চুম্বকের মতো টান থাকে',
    y_smooth: 'ওজন তল দুটোকে মসৃণ করে',
    why_why: '<b>তল দুটোর খাঁজ একে অন্যে আটকে যায়।</b> সমান মনে হলেও সব তলই এবড়োখেবড়ো; তাই ব্লকের গতি বাধা পায়।',
    not_glue: 'আঠা নয়: আটকায় তলের উঁচুনিচু অংশ।',
    not_magnet: 'এটা চুম্বকের টান নয়, খাঁজ আটকানো।',
    not_smooth: 'ওজন চাপলে খাঁজ আরও গভীরে ঢোকে, মসৃণ হয় না।',

    q_heat: 'ব্লকটিকে অনেকক্ষণ সামনে-পেছনে ঘষা হচ্ছে। তল দুটোর কী হবে?',
    h_warm: 'গরম হয়ে উঠবে',
    h_cold: 'ঠান্ডা হয়ে যাবে',
    h_same: 'একই রকম থাকবে',
    h_slick: 'আরও পিচ্ছিল হয়ে যাবে',
    why_heat: '<b>গরম হয়ে উঠবে।</b> ঘর্ষণের জন্য তাপ সৃষ্টি হয়; গাড়ির ইঞ্জিনের পিস্টনও তাই গরম হয়।',
    not_cold: 'ঘষলে তাপ তৈরি হয়, ঠান্ডা হয় না।',
    not_hsame: 'ঘর্ষণ থাকলে ঘষা তল গরম হয়, একই থাকে না।',
    not_slick: 'ঘষলে তল পিচ্ছিল হয় না, গরম হয়।',

    aria_stage: 'টেবিলের ওপর কাঠের ব্লক, তাকে ঠেলা দেওয়া হচ্ছে',
  },
  en: {
    title: 'Friction',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn it',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Friction',

    loads: 'Put weights on the block',
    chip_w0: 'empty block',
    chip_w: '+{n} kg',
    res_move: 'to move {f} N',

    act_push: 'Push the block',
    act_other: 'Push from the other side',
    act_weight: 'Add a weight and push',
    act_lens: 'Zoom in on the touching place',
    act_rub: 'Rub the block',
    act_again: 'Push again',
    act_home: 'Block back to the middle',
    act_side: 'Push from the other side',

    l_push: 'push',
    l_push_f: 'push F',
    l_push_n: 'push {f} N',
    l_fric: 'friction',
    l_fric_f: 'friction f',
    l_block: '{n} kg',
    l_weight: '{n} kg',
    l_weight_short: 'weight',
    l_block_word: 'block',
    l_table_word: 'table',
    lens_cap: 'zoomed in a lot',
    lens_note: 'not to scale',

    out_rest: 'No push: the block stays still, and there is no friction',
    out_hold: 'The block is not moving: friction equals the push, both <b>{f}</b> N',
    out_slip: 'A push of over <b>{f}</b> N, more than the friction, and the block speeds up',
    out_slip_more: 'It took a bigger push than before: over <b>{f}</b> N and the block speeds up',
    out_rub: 'The block is rubbed to and fro: friction is always against the velocity',
    out_rub_hot: 'Friction is always against the velocity, and rubbing makes the surfaces hot',
    out_hot: 'Rubbing has stopped, the surfaces are still hot',
    out_lens: 'Zoomed in, both surfaces are rough: the teeth lock together. Try changing the weight.',
    out_lens_more: 'More weight: the teeth sank deeper into each other',
    out_lens_less: 'Less weight: the teeth are looser',

    rule_start: 'When you push the block, the touching surfaces hold the push back. That holding force is called <b>friction</b>.',
    rule_push: '<b>A bigger push gets an equally big friction,</b> up to a limit. Past it, what is left of the push speeds the block up.',
    rule_side: '<b>Friction always acts opposite to the push (the applied force).</b>',
    rule_load: '<b>Put a weight on the block and friction grows</b>, so you must push harder to move it.',
    rule_lens: '<b>The surfaces look smooth but are rough.</b> The bumps lock into each other’s grooves.',
    rule_rub: '<b>Friction makes heat.</b> That is why a car engine has to be kept cool.',
    rule_all: '<b>Friction acts opposite to the push.</b> It grows with weight, and it makes heat.',

    hint_wait: 'The push is on: watch what the block does.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_look: 'Look…',
    q_right: 'Right!',
    q_wrong: 'Not quite. The right answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Great! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Look and pick an answer.',

    q_dir: 'The block is being pushed (orange arrow) but it is not moving. Which way does friction act?',
    dir_right: 'To the right',
    dir_left: 'To the left',
    dir_up: 'Upward',
    dir_none: 'In no direction',
    why_dir: '<b>{dir}, opposite to the push.</b> Friction always acts opposite to the applied force.',
    not_dir_same: 'Friction does not add to the push, it holds it back.',
    not_dir_up: 'Friction acts along the touching surfaces, sideways.',
    not_dir_none: 'Friction exists because of the push; it is what keeps the block from moving.',

    q_eq: 'The block is not moving. Read the push on the arrow: how big is friction?',
    n_newton: '{f} N',
    why_eq: '<b>Equal to the push, {f} N.</b> The block is not moving, so friction exactly holds the push back.',
    not_zero: 'Without friction the push would move the block.',
    not_double: 'If friction were bigger than the push the block would slide backwards.',
    not_weight: 'Weight points down, friction sideways: two different forces.',

    q_wt: 'The empty block slid at the push in the picture. Now a weight sits on it. What happens with the same push?',
    w_stay: 'It will not move',
    w_same: 'It moves as before',
    w_easy: 'It moves more easily',
    w_fast: 'It shoots off faster',
    why_wt: '<b>It will not move.</b> The weight presses harder, so friction grew; now it takes more than {c} N to move it.',
    not_same: 'A weight makes friction grow, so the old push is no longer enough.',
    not_easy: 'A weight does not reduce friction, it increases it.',
    not_fast: 'More friction slows the block, it does not speed it.',

    q_why: 'The picture shows the touching place of block and table zoomed in a lot. Why is there friction?',
    y_lock: 'The teeth of the two surfaces lock',
    y_glue: 'The surfaces stick like glue',
    y_magnet: 'The table pulls the block like a magnet',
    y_smooth: 'The block’s weight makes them smooth',
    why_why: '<b>The teeth of the two surfaces lock.</b> Surfaces that look smooth are rough, so the motion is held back.',
    not_glue: 'Not glue: the bumps of the surfaces lock.',
    not_magnet: 'Not a magnet’s pull: the grooves lock.',
    not_smooth: 'Weight presses the teeth deeper, it does not smooth them.',

    q_heat: 'The block is rubbed to and fro for a long time. What happens to the two surfaces?',
    h_warm: 'They get hot',
    h_cold: 'They get cold',
    h_same: 'They stay the same',
    h_slick: 'They get more slippery',
    why_heat: '<b>They get hot.</b> Friction makes heat; a car engine’s pistons get hot the same way.',
    not_cold: 'Rubbing makes heat, not cold.',
    not_hsame: 'With friction heat is made, so rubbed surfaces do not stay the same.',
    not_slick: 'Rubbing does not make surfaces slippery, it makes them hot.',

    aria_stage: 'A wooden block on a table, being pushed',
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
