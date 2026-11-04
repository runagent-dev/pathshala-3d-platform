// Every string the figure shows, in Bangla (NCTB terms, as on book page 161) and English. Use t('key') in code, and
// t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'তাপের একক',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',

    act_heat: '{n} ক্যালরি তাপ দাও',
    act_again: 'আবার প্রথম থেকে',
    act_home: 'শুরুতে ফিরে যাও',
    lbl_water: '{g} গ্রাম পানি',
    lbl_scale: 'তাপমাত্রা বৃদ্ধি',
    lbl_rise: '+{d}°C',
    lbl_heat: '+{n} cal',

    out_0: '<b>{g} গ্রাম পানি।</b> এখনো তাপ দেওয়া হয়নি।',
    out_n: '<span class="cj-cal">{cal} cal</span> = <span class="cj-j">{j} J</span>। {g} গ্রাম পানির তাপমাত্রা <b>{d}°C</b> বেড়েছে।',
    eq_law: '<span class="cj-cal">{one} ক্যালরি (cal)</span> = <span class="cj-j">{k} জুল (J)</span>',
    eq_label: '{one} ক্যালরি সমান {k} জুল',
    rule_a: '{g} গ্রাম পানির তাপমাত্রা {d}°C বাড়াতে যে তাপ লাগে, সেটাই <b>{one} ক্যালরি</b>।',
    rule_b: 'তাপ একটি শক্তি, তাই অন্য শক্তির মতো এর একক <b>জুল (J)</b>। তাপের আরেকটি একক ক্যালরি (cal)।',
    rule_c: 'খাবারের “ফুড ক্যালরি” আসলে <b>k cal</b>, অর্থাৎ {th} ক্যালরি। এখানে আমরা শুধু তাপশক্তির কথা বলছি।',
    unit_note: 'ছবির পানি {one} গ্রামের চেয়ে অনেক বেশি আঁকা। প্রতি {one} ক্যালরিতে তাপমাত্রা {one}°C করে বাড়ে।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় তাপ দেওয়া যায় না। থার্মোমিটার দেখে উত্তর বেছে নাও।',

    q_calj: '{one} ক্যালরি কত জুলের সমান?',
    why_calj: '<b>{k} J:</b> {one} ক্যালরি হচ্ছে {k} J এর সমান।',
    mis_calj_flip: 'উল্টো হয়ে গেছে: {one} জুল প্রায় {inv} ক্যালরি। {one} ক্যালরি এর চেয়ে অনেক বড়।',
    mis_calj_ten: 'সংখ্যাটি দশ গুণ হয়ে গেছে: {one} ক্যালরি = {k} J, {ten} J নয়।',
    mis_calj_same: 'ক্যালরি আর জুল সমান নয়: {one} ক্যালরি = {k} J।',
    q_water: '{g} গ্রাম পানির তাপমাত্রা {d}°C বাড়াতে কত তাপ লাগে?',
    why_water: '<b>{one} cal:</b> {g} গ্রাম পানির তাপমাত্রা {d}°C বাড়াতে {one} ক্যালরি তাপ লাগে।',
    mis_water_joule: '{k} হলো {one} ক্যালরির জুল; এখানে ক্যালরি জানতে চাওয়া হয়েছে।',
    mis_water_oneJ: '{one} জুল নয়: {one} ক্যালরি = {k} J, তাই {one} জুল {one} ক্যালরির চেয়ে অনেক কম।',
    mis_water_food: '{th} ক্যালরি হলো {one} ফুড ক্যালরি (k cal); {g} গ্রাম পানির {one}°C-এর জন্য {one} ক্যালরিই লাগে।',
    q_cal: 'থার্মোমিটার দেখো। {g} গ্রাম পানির তাপমাত্রা যতটা বেড়েছে, তাতে কত ক্যালরি তাপ লেগেছে?',
    why_cal: '<b>{n} cal:</b> প্রতি °C বাড়াতে {one} cal, তাই {n}°C বাড়াতে {n} cal।',
    mis_cal_times: '{x} হলো জুলের সংখ্যা ({n} × {k} J); এখানে ক্যালরি চাওয়া হয়েছে।',
    mis_cal_divide: 'এখানে ভাগ করার দরকার নেই: প্রতি °C বাড়াতে {one} cal লাগে।',
    mis_cal_one: '{one} cal শুধু {one}°C-এর জন্য; {n}°C বাড়াতে {n} গুণ তাপ লাগে।',
    q_joule: 'থার্মোমিটার দেখো। {g} গ্রাম পানিতে কত জুল তাপ দেওয়া হয়েছে?',
    why_joule: '<b>{j} J:</b> {n} cal = {n} × {k} = {j} J।',
    mis_joule_cal: '{n} হলো ক্যালরির সংখ্যা; জুল পেতে {k} দিয়ে গুণ করতে হয়।',
    mis_joule_divide: 'ক্যালরি থেকে জুল পেতে {k} দিয়ে ভাগ নয়, গুণ করতে হয়।',
    mis_joule_one: '{k} J মানে মাত্র {one} cal; {n} cal-এর জন্য {n} গুণ।',
    q_food: 'খাবারের {one} ফুড ক্যালরি (k cal) কত ক্যালরি (cal)?',
    why_food: '<b>{th} cal:</b> ফুড ক্যালরি হচ্ছে k cal, অর্থাৎ {th} ক্যালরি।',
    mis_food_same: 'k মানে হাজার গুণ: {one} k cal, {one} cal নয়।',
    mis_food_joule: '{k} হলো {one} cal-এর জুল; k cal = {th} cal।',
    mis_food_hundred: '{hundred} নয়, {th}: k cal = {th} ক্যালরি।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Units of heat',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',

    act_heat: 'Add {n} calorie of heat',
    act_again: 'Start again',
    act_home: 'Back to the start',
    lbl_water: '{g} g of water',
    lbl_scale: 'Temperature rise',
    lbl_rise: '+{d}°C',
    lbl_heat: '+{n} cal',

    out_0: '<b>{g} g of water.</b> No heat has been given yet.',
    out_n: '<span class="cj-cal">{cal} cal</span> = <span class="cj-j">{j} J</span>. The temperature of {g} g of water has risen <b>{d}°C</b>.',
    eq_law: '<span class="cj-cal">{one} calorie (cal)</span> = <span class="cj-j">{k} joule (J)</span>',
    eq_label: '1 calorie equals 4.2 joules',
    rule_a: 'The heat that raises {g} g of water by {d}°C is <b>{one} calorie</b>.',
    rule_b: 'Heat is energy, so, like other energy, its unit is the <b>joule (J)</b>. Another unit of heat is the calorie (cal).',
    rule_c: 'The “food calorie” on a pack is really <b>k cal</b>, that is {th} calories. Here we talk about heat energy only.',
    unit_note: 'The water in the picture is drawn far more than {one} g. Each calorie raises it {one}°C.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Pick the right answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'You cannot add heat during the test. Read the thermometer and pick an answer.',

    q_calj: 'How many joules is 1 calorie?',
    why_calj: '<b>{k} J:</b> 1 calorie is equal to {k} J.',
    mis_calj_flip: 'That is upside down: 1 joule is about {inv} calorie. 1 calorie is much bigger.',
    mis_calj_ten: 'That is ten times too big: 1 calorie = {k} J, not {ten} J.',
    mis_calj_same: 'Calories and joules are not equal: 1 calorie = {k} J.',
    q_water: 'How much heat raises the temperature of {g} g of water by {d}°C?',
    why_water: '<b>{one} cal:</b> {one} calorie raises the temperature of {g} g of water by {d}°C.',
    mis_water_joule: '{k} is the joules in 1 calorie; the question asks for calories.',
    mis_water_oneJ: 'Not 1 joule: 1 calorie = {k} J, so 1 joule is far less than 1 calorie.',
    mis_water_food: '{th} calories is 1 food calorie (k cal); {g} g of water needs just 1 calorie per °C.',
    q_cal: 'Read the thermometer. How many calories of heat raised the temperature of {g} g of water this much?',
    why_cal: '<b>{n} cal:</b> {one} cal for each °C, so {n}°C needs {n} cal.',
    mis_cal_times: '{x} is the number of joules ({n} × {k} J); the question asks for calories.',
    mis_cal_divide: 'No dividing here: each °C takes {one} cal.',
    mis_cal_one: '{one} cal is for {one}°C only; {n}°C takes {n} times as much heat.',
    q_joule: 'Read the thermometer. How many joules of heat were given to {g} g of water?',
    why_joule: '<b>{j} J:</b> {n} cal = {n} × {k} = {j} J.',
    mis_joule_cal: '{n} is the number of calories; multiply by {k} to get joules.',
    mis_joule_divide: 'To get joules from calories, multiply by {k}, do not divide.',
    mis_joule_one: '{k} J is just 1 cal; {n} cal takes {n} times as much.',
    q_food: 'The food calorie on a pack (k cal) is how many calories (cal)?',
    why_food: '<b>{th} cal:</b> the food calorie is k cal, that is {th} calories.',
    mis_food_same: 'k means a thousand times: 1 k cal is not 1 cal.',
    mis_food_joule: '{k} is the joules in 1 cal; k cal = {th} cal.',
    mis_food_hundred: 'Not {hundred}, but {th}: k cal = {th} calories.',
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
