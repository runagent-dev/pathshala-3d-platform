// Every string the figure shows, in Bangla and English. The book's words on pages 163–164 (topic 6.2, পদার্থের
// তাপমাত্রিক ধর্ম, Thermometric Properties of Matter): তাপমাত্রিক ধর্ম, তাপমাত্রিক পদার্থ, পারদ, সেলসিয়াস (°C),
// কেলভিন (K), ফারেনহাইট, পরম শূন্য (Absolute Zero), পানির ত্রৈধ বিন্দু (Triple Point), "সেলসিয়াস স্কেলের সাথে 273.15
// যোগ করলেই কেলভিন স্কেল পাওয়া যায়", "তাপমাত্রা 10°C বেড়েছে বলা যে কথা, তাপমাত্রা 10 K বেড়েছে বলা সেই একই কথা",
// চিত্র ৬.০২: সেলসিয়াস কেলভিন এবং ফারেনহাইট তাপমাত্রার স্কেল। The page writes তাপমাত্রা (not উষ্ণতা).
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars} (Latin digits, shown
// as Bangla digits). Units are Latin symbols: °C, K, °F.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'সেলসিয়াস, কেলভিন এবং ফারেনহাইট তাপমাত্রার স্কেল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'তাপমাত্রা',

    // the three scales, the mercury, the readings
    scale_C: 'সেলসিয়াস',
    scale_K: 'কেলভিন',
    scale_F: 'ফারেনহাইট',
    mercury: 'পারদ',
    lbl_cur: '{v}&nbsp;{u}',
    lbl_fix: '{v}&nbsp;{u}',
    read_label: 'তিনটি স্কেলে একই তাপমাত্রা',
    read_val: '{v}&nbsp;{u}',

    // the row of words: the book's own temperatures, in the book's order
    examples: 'কোন তাপমাত্রা',
    ex_ice: 'গলন্ত বরফ',
    ex_boil: 'ফুটন্ত পানি',
    ex_room: 'ঘরের তাপ',
    ex_abs: 'পরম শূন্য',
    ex_triple: 'ত্রৈধ বিন্দু',

    // the action and the quiet button
    act_ice: 'বরফ গলার তাপমাত্রা দেখো',
    act_boil: 'পানি ফোটার তাপমাত্রা দেখো',
    act_room: 'ঘরের তাপমাত্রা দেখো',
    act_abs: 'সবচেয়ে কম তাপমাত্রা দেখো',
    act_triple: 'পানির ত্রৈধ বিন্দু দেখো',
    act_home: 'শুরুতে ফেরাও',

    // the formula and the result line
    law_label: 'কেলভিন = সেলসিয়াস + {off}',
    sum: '{c} + {off} = <b>{k}&nbsp;K</b>',
    out_drag: 'পারদের মাথা টেনে তাপমাত্রা বদলাও।',
    out_up: 'তাপমাত্রা <b>{d}&nbsp;°C বেড়েছে</b> বলা আর <b>{d}&nbsp;K বেড়েছে</b> বলা একই কথা।',
    out_down: 'তাপমাত্রা <b>{d}&nbsp;°C কমেছে</b> বলা আর <b>{d}&nbsp;K কমেছে</b> বলা একই কথা।',

    // the rule: the book's words, one idea at a time
    rule_start: 'তাপমাত্রা মাপতে পদার্থের যে ধর্ম ব্যবহার করা হয়, তার নাম <b>তাপমাত্রিক ধর্ম।</b> এখানে পারদ তাপমাত্রিক পদার্থ, আর পারদের আয়তনের প্রসারণ তার তাপমাত্রিক ধর্ম।',
    rule_ice:
      '{atm}&nbsp;atm চাপে <b>বরফ গলার তাপমাত্রা:</b> সেলসিয়াস স্কেলে {c}&nbsp;°C, কেলভিন স্কেলে {k}&nbsp;K, ফারেনহাইট স্কেলে {f}&nbsp;°F।',
    rule_boil: '<b>পানি ফোটার তাপমাত্রা:</b> সেলসিয়াস স্কেলে {c}&nbsp;°C, কেলভিন স্কেলে {k}&nbsp;K, ফারেনহাইট স্কেলে {f}&nbsp;°F।',
    rule_room:
      'সেলসিয়াস স্কেলের সঙ্গে <b>{off} যোগ করলে</b> কেলভিন স্কেল পাওয়া যায়। ঘরের তাপমাত্রা {c}&nbsp;°C হলে কেলভিনে তা ({c} + {off} =) {k}&nbsp;K।',
    rule_abs: '<b>পরম শূন্য</b> (Absolute Zero) সবচেয়ে কম তাপমাত্রা; এর চেয়ে কম হওয়া যায় না। সেলসিয়াস স্কেলে এর মান {a}&nbsp;°C, কেলভিন স্কেলে শূন্য কেলভিন।',
    rule_triple:
      'পানির <b>ত্রৈধ বিন্দু</b> (Triple Point): {p}&nbsp;atm চাপে বরফ, পানি ও জলীয় বাষ্প একসঙ্গে থাকতে পারে। সেলসিয়াস স্কেলে এর মান {c}&nbsp;°C, কেলভিন স্কেলে {k}&nbsp;K।',

    hint_abs: 'পরম শূন্যের থেকে কম তাপমাত্রা হয় না।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবির স্কেলটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় পারদ আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_c2k: 'সেলসিয়াস থার্মোমিটারের পাঠ দেখো। কেলভিন স্কেলে এই তাপমাত্রা কত?',
    why_c2k: '<b>{k}&nbsp;K</b>: {c} + {off} = {k}।',
    mis_c2k_same: 'কেলভিন স্কেলের সংখ্যা সেলসিয়াসের সমান হয় না; সেলসিয়াসের সাথে {off} যোগ করতে হয়।',
    mis_c2k_rev: '{off} থেকে সেলসিয়াস বিয়োগ নয়; সেলসিয়াসের সাথে {off} যোগ করতে হয়।',
    mis_c2k_neg: 'বিয়োগ নয়, যোগ: সেলসিয়াসের সাথে {off} যোগ করলে কেলভিন পাওয়া যায়।',

    q_k2c: 'কেলভিন থার্মোমিটারের পাঠ দেখো। সেলসিয়াস স্কেলে এই তাপমাত্রা কত?',
    why_k2c: '<b>{c}&nbsp;°C</b>: {k} − {off} = {c}।',
    mis_k2c_same: 'এটি কেলভিনের পাঠ; সেলসিয়াসে {off} কম হয়।',
    mis_k2c_add: 'যোগ নয়, বিয়োগ: কেলভিন থেকে {off} বিয়োগ করলে সেলসিয়াস পাওয়া যায়।',
    mis_k2c_rev: '{off} থেকে কেলভিন বিয়োগ নয়; কেলভিন থেকে {off} বিয়োগ করতে হয়।',

    q_delta: 'তাপমাত্রা {a}&nbsp;°C থেকে {b}&nbsp;°C হলো, পারদ উঠছে। কেলভিন স্কেলে কত বেড়েছে?',
    why_delta: '<b>{d}&nbsp;K</b>: {d}&nbsp;°C বেড়েছে বলা আর {d}&nbsp;K বেড়েছে বলা একই কথা।',
    mis_delta_add: 'পার্থক্যের সাথে {off} যোগ হয় না; দুই স্কেলে বাড়ার পরিমাণ সমান।',
    mis_delta_level: 'এটি এখনকার তাপমাত্রা ({k}&nbsp;K); প্রশ্নটি কত বেড়েছে তা নিয়ে।',
    mis_delta_celsius: 'এটি সেলসিয়াসে এখনকার তাপমাত্রা; কত বাড়ল তা জানতে দুই তাপমাত্রার পার্থক্য নিতে হয়।',

    q_abs: 'সেলসিয়াস স্কেলে পরম শূন্যের মান কত?',
    why_abs: '<b>{a}&nbsp;°C</b>: কেলভিন স্কেল তৈরি হয়েছে পরম শূন্য তাপমাত্রাকে শূন্য কেলভিন ধরে।',
    mis_abs_k0: '{off} হচ্ছে বরফ গলার তাপমাত্রার কেলভিন মান; পরম শূন্য এর অনেক নিচে।',
    mis_abs_ice: 'এটি বরফ গলার তাপমাত্রা; এর থেকেও কম তাপমাত্রা আছে।',
    mis_abs_boil: 'এটি পানি ফোটার তাপমাত্রার কেলভিন মান ({k}&nbsp;K); পরম শূন্য সবচেয়ে কম তাপমাত্রা।',

    q_fboil: 'সেলসিয়াস থার্মোমিটারে পানি ফুটছে। ফারেনহাইট স্কেলে এই তাপমাত্রা কত?',
    q_fice: 'সেলসিয়াস থার্মোমিটারে বরফ গলছে। ফারেনহাইট স্কেলে এই তাপমাত্রা কত?',
    why_f: '<b>{f}&nbsp;°F</b>: চিত্র ৬.০২-এ {c}&nbsp;°C = {k}&nbsp;K = {f}&nbsp;°F।',
    mis_f_same: 'এটি সেলসিয়াস স্কেলের পাঠ; ফারেনহাইট স্কেলে সংখ্যাটি আলাদা।',
    mis_f_kelvin: 'এটি কেলভিন স্কেলের পাঠ, ফারেনহাইটের নয়।',
    mis_f_other: 'এটি অন্য অবস্থার ({other}&nbsp;°F); বরফ গলন ও পানির বাষ্পীভবনের মান উল্টে গেছে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'The Celsius, Kelvin and Fahrenheit temperature scales',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Temperature',

    scale_C: 'Celsius',
    scale_K: 'Kelvin',
    scale_F: 'Fahrenheit',
    mercury: 'Mercury',
    lbl_cur: '{v}&nbsp;{u}',
    lbl_fix: '{v}&nbsp;{u}',
    read_label: 'The same temperature on the three scales',
    read_val: '{v}&nbsp;{u}',

    examples: 'Which temperature',
    ex_ice: 'Melting ice',
    ex_boil: 'Boiling water',
    ex_room: 'Room',
    ex_abs: 'Absolute zero',
    ex_triple: 'Triple point',

    act_ice: 'See the melting point of ice',
    act_boil: 'See the boiling point of water',
    act_room: 'See the room temperature',
    act_abs: 'See the lowest temperature',
    act_triple: 'See the triple point of water',
    act_home: 'Back to the start',

    law_label: 'Kelvin = Celsius + {off}',
    sum: '{c} + {off} = <b>{k}&nbsp;K</b>',
    out_drag: 'Drag the top of the mercury to change the temperature.',
    out_up: 'Saying the temperature <b>rose by {d}&nbsp;°C</b> and saying it <b>rose by {d}&nbsp;K</b> mean the same.',
    out_down: 'Saying the temperature <b>fell by {d}&nbsp;°C</b> and saying it <b>fell by {d}&nbsp;K</b> mean the same.',

    rule_start:
      'The property of a substance used to measure temperature is its <b>thermometric property.</b> Here mercury is the thermometric substance, and the expansion of its volume is its thermometric property.',
    rule_ice:
      'At {atm}&nbsp;atm, the <b>melting point of ice</b> is {c}&nbsp;°C on the Celsius scale, {k}&nbsp;K on the Kelvin scale and {f}&nbsp;°F on the Fahrenheit scale.',
    rule_boil:
      'The <b>boiling point of water</b> is {c}&nbsp;°C on the Celsius scale, {k}&nbsp;K on the Kelvin scale and {f}&nbsp;°F on the Fahrenheit scale.',
    rule_room:
      '<b>Add {off}</b> to the Celsius scale and you get the Kelvin scale. A room at {c}&nbsp;°C is ({c} + {off} =) {k}&nbsp;K.',
    rule_abs:
      '<b>Absolute zero</b> is the lowest temperature; nothing can be colder. On the Celsius scale it is {a}&nbsp;°C, on the Kelvin scale zero kelvin.',
    rule_triple:
      'The <b>triple point</b> of water: at {p}&nbsp;atm, ice, water and water vapour can exist together. It is {c}&nbsp;°C on the Celsius scale and {k}&nbsp;K on the Kelvin scale.',

    hint_abs: 'There is no temperature below absolute zero.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the scale in the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The right answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent, all right!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try the test again',
    q_locked: 'The mercury stays put during the test. Look at the picture and pick an answer.',

    q_c2k: 'Read the Celsius thermometer. What is this temperature on the Kelvin scale?',
    why_c2k: '<b>{k}&nbsp;K</b>: {c} + {off} = {k}.',
    mis_c2k_same: 'The Kelvin number is not the same as the Celsius one: add {off} to the Celsius value.',
    mis_c2k_rev: 'Not {off} minus Celsius: add {off} to the Celsius value.',
    mis_c2k_neg: 'Add, do not subtract: Celsius plus {off} is Kelvin.',

    q_k2c: 'Read the Kelvin thermometer. What is this temperature on the Celsius scale?',
    why_k2c: '<b>{c}&nbsp;°C</b>: {k} − {off} = {c}.',
    mis_k2c_same: 'That is the Kelvin reading; Celsius is {off} less.',
    mis_k2c_add: 'Subtract, do not add: Kelvin minus {off} is Celsius.',
    mis_k2c_rev: 'Not {off} minus Kelvin: subtract {off} from the Kelvin value.',

    q_delta: 'The temperature goes from {a}&nbsp;°C to {b}&nbsp;°C; the mercury rises. By how much does it rise on the Kelvin scale?',
    why_delta: '<b>{d}&nbsp;K</b>: saying it rose by {d}&nbsp;°C and saying it rose by {d}&nbsp;K is the same thing.',
    mis_delta_add: 'The {off} is not added to a difference: both scales rise by the same amount.',
    mis_delta_level: 'That is the temperature now ({k}&nbsp;K); the question asks how much it rose.',
    mis_delta_celsius: 'That is the temperature now in Celsius; the rise is the difference of the two temperatures.',

    q_abs: 'What is absolute zero on the Celsius scale?',
    why_abs: '<b>{a}&nbsp;°C</b>: the Kelvin scale was made by taking absolute zero as zero kelvin.',
    mis_abs_k0: '{off} is the Kelvin value of the melting point of ice; absolute zero is far below it.',
    mis_abs_ice: 'That is the melting point of ice; colder temperatures exist.',
    mis_abs_boil: 'That is the Kelvin value of the boiling point of water ({k}&nbsp;K); absolute zero is the lowest temperature.',

    q_fboil: 'Water is boiling on the Celsius thermometer. What is this temperature on the Fahrenheit scale?',
    q_fice: 'Ice is melting on the Celsius thermometer. What is this temperature on the Fahrenheit scale?',
    why_f: '<b>{f}&nbsp;°F</b>: in figure 6.02, {c}&nbsp;°C = {k}&nbsp;K = {f}&nbsp;°F.',
    mis_f_same: 'That is the Celsius reading; the Fahrenheit number is different.',
    mis_f_kelvin: 'That is the Kelvin reading, not Fahrenheit.',
    mis_f_other: 'That is the other case ({other}&nbsp;°F): melting ice and boiling water are swapped.',
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
