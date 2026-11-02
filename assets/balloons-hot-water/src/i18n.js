// Every string the figure shows, in Bangla (the book's words, page 175, "নিজে করো" at the end of ৬.৩.৩: বেলুন, পানি ভরা,
// সমান আয়তনের বাতাস, গরম পানিতে কিছুক্ষণ ডুবিয়ে রাখো, তাপে তরলের সেরকম প্রসারণ হয় না, তাপে গ্যাসের প্রসারণ তরল থেকে
// অনেক বেশি) and English. Units are Latin symbols (°C, K, mL) as in docs/book-notes.md. Use t(key, vars) in code and
// t.num() for numbers (Bangla digits in Bangla); {k50}… are the chips' numbers.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'বেলুন গরম পানিতে',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বেলুনের আয়তন',

    // the hot water's temperature (one row of words, with the swelling of the air balloon under each once tried)
    examples: 'গরম পানির তাপমাত্রা',
    ex_50: '{k50} °C',
    ex_70: '{k70} °C',
    ex_90: '{k90} °C',
    res_pct: '+{p}%',

    // the action: one big button
    act_hot: 'বেলুন দুটো গরম পানিতে রাখো',
    act_cool: 'আবার ঠান্ডা করো',
    act_home: 'আবার শুরু থেকে',

    // the readings: both balloons, before → after
    rd: 'দুটি বেলুনের আয়তন',
    rd_air: 'বাতাস ভরা',
    rd_water: 'পানি ভরা',
    rd_T: 'তাপমাত্রা',
    rd_V: 'আয়তন',
    rd_up: 'বাড়ল',
    u_C: '°C',
    u_mL: 'mL',
    note: 'ছবিতে ফোলা প্রায় {three} গুণ বাড়িয়ে আঁকা; সংখ্যাগুলো প্রকৃত। শুরুতে দুটোতেই {v0} mL।',

    // the rule (the book's words)
    rule_0: '<b>দুটি বেলুন নাও:</b> একটিতে খানিকটা পানি ভরো আর অন্যটিতে সমান আয়তনের বাতাস। এবারে দুটোই গরম পানিতে কিছুক্ষণ ডুবিয়ে রাখো।',
    rule_1:
      '<b>তাপে তরলের সেরকম প্রসারণ হয় না:</b> পানি ভরা বেলুনের আকার আগের মতোই আছে। <b>কিন্তু তাপে গ্যাসের প্রসারণ তরল থেকে অনেক বেশি:</b> বাতাস ভরা বেলুনটি অনেকখানি ফুলে উঠেছে।',

    // labels on the picture
    lab_air: 'বাতাস ভরা',
    lab_water: 'পানি ভরা',
    lab_pct: '+{p}%',
    lab_T: 'পানি {T} °C',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছবি আটকানো থাকে। উত্তর বেছে নাও।',

    qm_text: 'গরম পানিতে রাখার পর কোন বেলুনটি বেশি ফুলে উঠেছে?',
    qm_ok: 'বাতাস ভরা বেলুনটি',
    qm_a: 'পানি ভরা বেলুনটি',
    qm_b: 'দুটোই সমান',
    qm_c: 'কোনোটিই ফুলে ওঠেনি',
    qm_r: '<b>বাতাস ভরা বেলুনটি।</b> তাপে গ্যাসের প্রসারণ তরল থেকে অনেক বেশি।',
    qm_a_why: 'পানি ভরা বেলুনের আকার আগের মতোই আছে।',
    qm_b_why: 'ছবিতে দুটোর আকার আলাদা।',
    qm_c_why: 'বাতাস ভরা বেলুনটি ফুলে উঠেছে।',

    qw_text: 'পানি ভরা বেলুনের আকার প্রায় আগের মতোই থাকল। কেন?',
    qw_ok: 'তাপে তরলের সেরকম প্রসারণ হয় না',
    qw_a: 'পানিতে তাপ পৌঁছায়নি',
    qw_b: 'গরম হলে পানি সংকুচিত হয়ে যায়',
    qw_c: 'রবার ভেতরের পানিকে ফুলতে দেয় না',
    qw_r: '<b>তাপে তরলের সেরকম প্রসারণ হয় না।</b> তাই পানি ভরা বেলুনটি প্রায় আগের মতোই থাকে।',
    qw_a_why: 'দুটো বেলুনই একই গরম পানিতে ছিল, তাপ দুটোতেই পৌঁছেছে।',
    qw_b_why: 'তাপে পানি সামান্য বাড়ে, কমে না।',
    qw_c_why: 'রবার নরম; পানির প্রসারণই খুব কম।',

    qp_text: 'পানি ৩০ °C থেকে {T} °C-এ গরম হলো। বাতাস ভরা বেলুনের আয়তন প্রায় কত শতাংশ বাড়ল?',
    qp_r: '<b>প্রায় +{p}%:</b> আয়তন বাড়ার ভাগ = তাপমাত্রা বাড়া ÷ শুরুর তাপমাত্রা (কেলভিনে) = {dT} ÷ {T1} (γ<sub>P</sub> = 1/<i>T</i><sub>1</sub>)।',
    qp_dt_why: 'তাপমাত্রা বাড়ার সংখ্যা শতাংশ নয়; ভাগ করতে হয় শুরুর কেলভিন তাপমাত্রা দিয়ে।',
    qp_w_why: 'ওটা পানি ভরা বেলুনের, বাতাসের নয়।',
    qp_x2_why: 'দ্বিগুণ হিসাব হয়ে গেছে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Balloons in hot water',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Volume of the balloons',

    examples: 'Temperature of the hot water',
    ex_50: '{k50} °C',
    ex_70: '{k70} °C',
    ex_90: '{k90} °C',
    res_pct: '+{p}%',

    act_hot: 'Put both balloons in the hot water',
    act_cool: 'Cool them again',
    act_home: 'Start again',

    rd: 'The volume of the two balloons',
    rd_air: 'Air',
    rd_water: 'Water',
    rd_T: 'Temperature',
    rd_V: 'Volume',
    rd_up: 'Rise',
    u_C: '°C',
    u_mL: 'mL',
    note: 'The picture draws the swelling about {three} times too big; the numbers are real. Both start at {v0} mL.',

    rule_0: '<b>Take two balloons:</b> fill one with some water and the other with the same volume of air. Now keep both in hot water for a while.',
    rule_1:
      '<b>Heat does not expand a liquid that much:</b> the balloon of water is the same size as before. <b>But heat expands a gas much more than a liquid:</b> the balloon of air has swollen a lot.',

    lab_air: 'Air',
    lab_water: 'Water',
    lab_pct: '+{p}%',
    lab_T: 'Water {T} °C',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The picture stays put during the test. Pick an answer.',

    qm_text: 'After the hot water, which balloon has swollen more?',
    qm_ok: 'The balloon of air',
    qm_a: 'The balloon of water',
    qm_b: 'Both the same',
    qm_c: 'Neither has swollen',
    qm_r: '<b>The balloon of air.</b> Heat expands a gas much more than a liquid.',
    qm_a_why: 'The balloon of water is the same size as before.',
    qm_b_why: 'The picture shows two different sizes.',
    qm_c_why: 'The balloon of air has swollen.',

    qw_text: 'The balloon of water stayed about the same size. Why?',
    qw_ok: 'Heat does not expand a liquid that much',
    qw_a: 'The heat did not reach the water',
    qw_b: 'Hot water shrinks',
    qw_c: 'The rubber does not let the water swell',
    qw_r: '<b>Heat does not expand a liquid that much,</b> so the balloon of water stays about the same.',
    qw_a_why: 'Both balloons were in the same hot water, so the heat reached both.',
    qw_b_why: 'Water grows a little when heated, it does not shrink.',
    qw_c_why: 'Rubber is soft; the water itself expands very little.',

    qp_text: 'The water is heated from 30 °C to {T} °C. About how many percent does the balloon of air grow?',
    qp_r: '<b>About +{p}%:</b> the rise in volume as a share = the rise in temperature ÷ the starting temperature (in kelvin) = {dT} ÷ {T1} (γ<sub>P</sub> = 1/<i>T</i><sub>1</sub>).',
    qp_dt_why: 'The rise in degrees is not a percentage; divide by the starting temperature in kelvin.',
    qp_w_why: 'That is the balloon of water, not the air.',
    qp_x2_why: 'That counts it twice.',
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
    const s = dict[key] ?? key;
    const all = { k50: 50, k70: 70, k90: 90, three: 3, v0: 1000, ...vars }; // these follow the digits too
    return s.replace(/\{(\w+)\}/g, (m, k) => (k in all ? num(all[k]) : m));
  }
  t.num = num;
  t.lang = code;
  return t;
}
