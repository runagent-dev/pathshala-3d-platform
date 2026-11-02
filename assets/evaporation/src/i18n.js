// Every string the figure shows, in Bangla (NCTB terms, as on pages 177–178) and English. Use t('key') in code, and
// t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'বাষ্পায়ন',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',

    // the six things evaporation depends on, in the book's order (short on the chips, full in the rule and the test)
    factors: 'বাষ্পায়ন নির্ভর করে',
    f_wind: 'প্রবাহ',
    f_area: 'ক্ষেত্রফল',
    f_liquid: 'প্রকৃতি',
    f_warm: 'উষ্ণতা',
    f_dry: 'শুষ্কতা',
    fn_wind: 'বাতাসের প্রবাহ',
    fn_area: 'তরলের উপরিভাগের ক্ষেত্রফল',
    fn_liquid: 'তরলের প্রকৃতি',
    fn_warm: 'উষ্ণতা',
    fn_dry: 'বায়ুর শুষ্কতা',

    // the names on the vessels
    n_wind_plain: 'স্থির বাতাস',
    n_wind_changed: 'বাতাসের প্রবাহ',
    n_area_plain: 'গ্লাস',
    n_area_changed: 'বড় থালা',
    n_liquid_plain: 'পানি',
    n_liquid_changed: 'উদ্বায়ী তরল',
    n_warm_plain: 'কম উষ্ণতা',
    n_warm_changed: 'বেশি উষ্ণতা',
    n_dry_plain: 'আর্দ্র বাতাস',
    n_dry_changed: 'শুষ্ক বাতাস',

    act_run: 'সময় চালাও',
    act_again: 'আবার শুরু করো',
    act_home: 'আবার শুরু করো',
    side_left: 'বামের পাত্র',
    side_right: 'ডানের পাত্র',
    side_left_in: 'বামের পাত্রে',
    side_right_in: 'ডানের পাত্রে',
    time_label: 'সময়',

    out_start: 'দুটি পাত্রে সমান তরল। সময় চালাও: শুকিয়ে যাওয়ার নামই <b>বাষ্পায়ন</b> (Evaporation)।',
    out_run: '{side} বাষ্পায়ন বেশি, তাই তরল আগে কমে।',
    out_dry: '{side} সব তরল বাষ্পায়িত হয়ে গেছে।',
    left_dry: 'শেষ',

    rule_wind: '<b>বাতাসের প্রবাহ:</b> বাতাসের প্রবাহ বেশি হলে বাষ্পায়ন বেশি হয়।',
    rule_area: '<b>ক্ষেত্রফল:</b> উপরিভাগের ক্ষেত্রফল যত বেশি, বাষ্পায়ন তত বেশি। গ্লাসের পানি বড় থালায় ঢেলে দিলে অনেক তাড়াতাড়ি শুকিয়ে যাবে।',
    rule_liquid: '<b>তরলের প্রকৃতি:</b> তরলের স্ফুটনাঙ্ক কম হলে বাষ্পায়ন বেশি। উদ্বায়ী তরলের বাষ্পায়ন সবচেয়ে বেশি।',
    rule_warm: '<b>উষ্ণতা:</b> তরল এবং তরলের কাছাকাছি বাতাসের উষ্ণতা বেশি হলে বাষ্পায়ন বেশি হয়।',
    rule_dry: '<b>বায়ুর শুষ্কতা:</b> বাতাস যত শুষ্ক হবে, তরল তত তাড়াতাড়ি বাষ্পায়ন হবে।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছবি বদলানো যায় না। ছবি দেখে উত্তর বেছে নাও।',

    q_first: 'দুটি পাত্রে সমান তরল। কোন পাত্রের তরল আগে কমবে?',
    c_left: 'বামের পাত্রের',
    c_right: 'ডানের পাত্রের',
    c_same: 'দুটোই একসঙ্গে',
    c_unknown: 'বলা যায় না',
    why_first: '<b>{side}:</b> সেখানে বাষ্পায়ন বেশি।',
    mis_same: 'একটি বিষয় আলাদা, তাই হারও আলাদা।',
    mis_unknown: 'ছবিতে আলাদা বিষয়টি দেখেই বলা যায়।',
    mis_side: 'ওই পাত্রে বাষ্পায়ন কম।',

    q_factor: 'দুটি পাত্রে কোন বিষয়টি আলাদা?',
    why_factor: '<b>{name}</b> আলাদা।',
    mis_factor: 'ওই বিষয়টি দুই পাত্রে একই।',

    q_cloth: 'বর্ষাকালে ভেজা কাপড় শুকাতে চায় না কেন?',
    c_cloth_humid: 'বাতাস শুষ্ক থাকে না',
    c_cloth_press: 'বাতাসের চাপ খুব কম থাকে',
    c_cloth_area: 'কাপড়ের ক্ষেত্রফল কমে যায়',
    c_cloth_vol: 'পানি উদ্বায়ী হয়ে যায়',
    why_cloth: '<b>বাতাস শুষ্ক নয়:</b> বাতাস যত শুষ্ক, তত তাড়াতাড়ি বাষ্পায়ন।',
    mis_cloth: 'বর্ষায় বদলায় বাতাসের ভেজা ভাব, এগুলো নয়।',

    q_vol: 'কোন তরলের বাষ্পায়ন সবচেয়ে বেশি?',
    c_vol_right: 'উদ্বায়ী তরল',
    c_vol_water: 'পানি',
    c_vol_high: 'যার স্ফুটনাঙ্ক বেশি',
    c_vol_cold: 'যে তরল ঠান্ডা',
    why_vol: '<b>উদ্বায়ী তরল:</b> স্ফুটনাঙ্ক কম বলে বাষ্পায়ন সবচেয়ে বেশি।',
    mis_vol: 'স্ফুটনাঙ্ক কম হলে বাষ্পায়ন বেশি।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Evaporation',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',

    factors: 'Evaporation depends on',
    f_wind: 'Air flow',
    f_area: 'Area',
    f_liquid: 'Liquid',
    f_warm: 'Warmth',
    f_dry: 'Dryness',
    fn_wind: 'air flow',
    fn_area: 'area of the liquid’s surface',
    fn_liquid: 'kind of liquid',
    fn_warm: 'temperature',
    fn_dry: 'dryness of the air',

    n_wind_plain: 'Still air',
    n_wind_changed: 'Air flow',
    n_area_plain: 'Glass',
    n_area_changed: 'Big plate',
    n_liquid_plain: 'Water',
    n_liquid_changed: 'Volatile liquid',
    n_warm_plain: 'Cooler',
    n_warm_changed: 'Warmer',
    n_dry_plain: 'Humid air',
    n_dry_changed: 'Dry air',

    act_run: 'Let time pass',
    act_again: 'Start again',
    act_home: 'Start again',
    side_left: 'Left vessel',
    side_right: 'Right vessel',
    side_left_in: 'In the left vessel',
    side_right_in: 'In the right vessel',
    time_label: 'Time',

    out_start: 'Both vessels hold the same amount. Let time pass: drying up is called <b>evaporation</b>.',
    out_run: '{side} evaporation is faster, so the liquid goes down sooner.',
    out_dry: '{side} all the liquid has evaporated.',
    left_dry: 'Dry',

    rule_wind: '<b>Air flow:</b> the stronger the air flow, the more evaporation.',
    rule_area:
      '<b>Area of the surface:</b> the larger the area, the more evaporation. Water from a glass poured onto a big plate dries up much sooner.',
    rule_liquid: '<b>Kind of liquid:</b> the lower the boiling point, the more evaporation. A volatile liquid evaporates the most.',
    rule_warm: '<b>Temperature:</b> the warmer the liquid and the air near it, the more evaporation.',
    rule_dry: '<b>Dryness of the air:</b> the drier the air, the sooner the liquid evaporates.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The picture stays put during the test. Look at it and pick an answer.',

    q_first: 'Both vessels hold the same amount. Which one loses its liquid first?',
    c_left: 'The left one',
    c_right: 'The right one',
    c_same: 'Both together',
    c_unknown: 'Cannot tell',
    why_first: '<b>{side}:</b> evaporation is faster there.',
    mis_same: 'One thing is different, so the rate is too.',
    mis_unknown: 'You can tell from the one difference in the picture.',
    mis_side: 'Evaporation is slower in that one.',

    q_factor: 'What is different about the two vessels?',
    why_factor: '<b>{name}</b> is different.',
    mis_factor: 'That is the same for both vessels.',

    q_cloth: 'Why do wet clothes refuse to dry in the rainy season?',
    c_cloth_humid: 'The air is not dry',
    c_cloth_press: 'The air pressure is very low',
    c_cloth_area: 'The cloth’s area shrinks',
    c_cloth_vol: 'Water becomes volatile',
    why_cloth: '<b>The air is not dry:</b> the drier the air, the faster the evaporation.',
    mis_cloth: 'What changes in the rains is how damp the air is, not these.',

    q_vol: 'Which liquid evaporates the most?',
    c_vol_right: 'A volatile liquid',
    c_vol_water: 'Water',
    c_vol_high: 'One with a high boiling point',
    c_vol_cold: 'A cold liquid',
    why_vol: '<b>A volatile liquid:</b> its low boiling point means the most evaporation.',
    mis_vol: 'The lower the boiling point, the more evaporation.',
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
