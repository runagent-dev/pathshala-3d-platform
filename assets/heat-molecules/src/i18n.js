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
    title: 'তাপ ও তাপমাত্রা',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',

    ex_label: 'পদার্থের অবস্থা',
    ex_solid: 'কঠিন',
    ex_liquid: 'তরল',
    ex_gas: 'গ্যাস',
    res_solid: 'কাঁপে',
    res_liquid: 'ছোটাছুটি',
    res_gas: 'মুক্ত',
    act_heat: 'তাপ দাও',
    act_again: 'আবার প্রথম থেকে',
    act_home: 'ঠান্ডা করে প্রথমে ফিরে যাও',
    lbl_temp: 'তাপমাত্রা',
    lbl_solid: 'কঠিন',
    lbl_liquid: 'তরল',
    lbl_gas: 'গ্যাস',
    meter_label: 'অণুর গতি',
    meter_low: 'কম',
    meter_high: 'বেশি',
    unit_note: 'অণুগুলো বহু গুণ বড় করে আঁকা। ধাপগুলো মাপা তাপমাত্রা নয়।',

    // one short line for each step of the heat button
    out_0: '<b>কঠিন:</b> অণুগুলো নিজের নির্দিষ্ট অবস্থানে থেকে অল্প কাঁপছে।',
    out_1: '<b>কঠিন:</b> উত্তপ্ত করায় অণুগুলোর কাঁপুনি বেড়েছে।',
    out_2: '<b>তরল:</b> অণুগুলো আন্তঃআণবিক বল ছাড়িয়ে মুক্ত হয়েছে এবং এলোমেলোভাবে ছোটাছুটি করছে।',
    out_3: '<b>তরল:</b> যত উত্তপ্ত করা হয়, অণুগুলো তত জোরে ছোটাছুটি করে।',
    out_4: '<b>গ্যাস:</b> অণুগুলো আণবিক বন্ধন থেকে পুরোপুরি মুক্ত।',
    out_5: '<b>গ্যাস:</b> যত উত্তপ্ত করা হয়, অণুগুলো তত জোরে ছোটাছুটি করে।',

    eq_law: '<b>তাপশক্তি</b> = অণুগুলোর সম্মিলিত গতিশক্তি',
    eq_label: 'তাপশক্তি সমান অণুগুলোর সম্মিলিত গতিশক্তি',
    rule_a: 'তাপ এক ধরনের <b>শক্তি।</b> অণুগুলোর গতি যত বেশি, তাদের গতিশক্তি তত বেশি।',
    rule_b: 'অণুগুলোর কম্পন বা গতির কারণে যে শক্তি পাওয়া যায়, সেটাই <b>তাপ।</b> আর তাপমাত্রা বলে দেয় পদার্থের তাপীয় অবস্থা।',

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
    q_locked: 'পরীক্ষার সময় তাপ দেওয়া যায় না। ছবি দেখে উত্তর বেছে নাও।',

    q_state: 'ছবিতে পদার্থের অণুগুলো কী করছে?',
    c_solid: 'নিজের জায়গায় কাঁপছে',
    c_liquid: 'কাছাকাছি, এলোমেলো ছোটাছুটি',
    c_gas: 'পুরোপুরি মুক্ত হয়ে ছুটছে',
    c_still: 'একদম স্থির আছে',
    why_solid: '<b>কঠিন:</b> অণুগুলো নিজের নির্দিষ্ট অবস্থানে থেকে কাঁপে।',
    why_liquid: '<b>তরল:</b> অণুগুলো এলোমেলোভাবে একে অন্যের ভেতর দিয়ে ছোটাছুটি করে।',
    why_gas: '<b>গ্যাস:</b> অণুগুলো আণবিক বন্ধন থেকে পুরোপুরি মুক্ত হয়ে ছোটাছুটি করে।',
    mis_solid: 'কঠিনের অণু নিজের জায়গা ছাড়ে না, শুধু কাঁপে।',
    mis_liquid: 'তরলের অণু জায়গা ছেড়ে এলোমেলো ছোটাছুটি করে, তাই ওগুলো নিজের জায়গায় কাঁপে না।',
    mis_gas: 'গ্যাসের অণু আণবিক বন্ধন থেকে পুরোপুরি মুক্ত; কাছাকাছি কাঁপা বা একে অন্যের ভেতর দিয়ে চলা তার কাজ নয়।',
    mis_still: 'অণু কখনো স্থির থাকে না; কঠিন পদার্থেও অণু কাঁপতে থাকে।',

    q_more: 'এই পদার্থকে আরও উত্তপ্ত করলে অণুগুলোর গতি আর গতিশক্তির কী হবে?',
    c_faster: 'দুটোই বাড়বে',
    c_slower: 'দুটোই কমবে',
    c_same: 'কোনোটাই বদলাবে না',
    c_stop: 'অণুগুলো থেমে যাবে',
    why_more: '<b>দুটোই বাড়বে:</b> গতি যত বেশি হবে, গতিশক্তি তত বেশি হবে।',
    mis_slower: 'উত্তপ্ত করলে অণুর গতি কমে না, বাড়ে।',
    mis_same: 'তাপ দিলে অণুর গতি বাড়ে, তাই গতিশক্তিও বদলায়।',
    mis_stop: 'অণু কখনো থামে না; তাপ দিলে আরও জোরে কাঁপে বা ছোটাছুটি করে।',

    q_name: 'পদার্থের অণুগুলোর কম্পন বা গতির কারণে যে শক্তি পাওয়া যায়, তার নাম কী?',
    c_heat: 'তাপ',
    c_electric: 'বিদ্যুৎ',
    c_light: 'আলো',
    c_stored: 'স্থিতিশক্তি',
    why_name: '<b>তাপ:</b> তাপশক্তি আসলে অণুগুলোর সম্মিলিত গতিশক্তি ছাড়া কিছু নয়।',
    mis_electric: 'বিদ্যুৎ আলাদা এক ধরনের শক্তি; এখানে অণুগুলোর গতির কথা হচ্ছে।',
    mis_light: 'আলোও আলাদা এক ধরনের শক্তি; এটা অণুগুলোর গতি থেকে পাওয়া শক্তির নাম নয়।',
    mis_stored: 'স্থিতিশক্তি আসে অবস্থান বা আকারের কারণে, গতির কারণে নয়।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Heat and temperature',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',

    ex_label: 'State of matter',
    ex_solid: 'Solid',
    ex_liquid: 'Liquid',
    ex_gas: 'Gas',
    res_solid: 'shake',
    res_liquid: 'roam',
    res_gas: 'free',
    act_heat: 'Add heat',
    act_again: 'Start again',
    act_home: 'Cool down, back to the start',
    lbl_temp: 'Temperature',
    lbl_solid: 'Solid',
    lbl_liquid: 'Liquid',
    lbl_gas: 'Gas',
    meter_label: 'Molecule speed',
    meter_low: 'low',
    meter_high: 'high',
    unit_note: 'The molecules are drawn many times too big. The steps are not measured temperatures.',

    out_0: '<b>Solid:</b> the molecules stay at their fixed places and shake a little.',
    out_1: '<b>Solid:</b> heated, the molecules shake more.',
    out_2: '<b>Liquid:</b> the molecules break free of the forces between them and dart about, jumbled.',
    out_3: '<b>Liquid:</b> the more it is heated, the faster the molecules dart about.',
    out_4: '<b>Gas:</b> the molecules are completely free of the molecular bonds.',
    out_5: '<b>Gas:</b> the more it is heated, the faster the molecules dart about.',

    eq_law: '<b>Heat energy</b> = the molecules’ combined kinetic energy',
    eq_label: 'Heat energy equals the molecules’ combined kinetic energy',
    rule_a: 'Heat is a kind of <b>energy.</b> The faster the molecules move, the more kinetic energy they have.',
    rule_b:
      'The energy that comes from the vibration or motion of the molecules is <b>heat.</b> Temperature tells the thermal state of the substance.',

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
    q_locked: 'You cannot add heat during the test. Look at the picture and pick an answer.',

    q_state: 'What are the molecules in the picture doing?',
    c_solid: 'Shaking in place',
    c_liquid: 'Darting about, close together',
    c_gas: 'Rushing about, completely free',
    c_still: 'Perfectly still',
    why_solid: '<b>Solid:</b> the molecules stay at their fixed places and shake.',
    why_liquid: '<b>Liquid:</b> the molecules dart about, jumbled, through each other.',
    why_gas: '<b>Gas:</b> the molecules are completely free of the molecular bonds and dart about.',
    mis_solid: 'The molecules of a solid never leave their places; they only shake.',
    mis_liquid: 'The molecules of a liquid leave their places and dart about, so they do not shake in place.',
    mis_gas: 'The molecules of a gas are completely free; staying close together is not what they do.',
    mis_still: 'Molecules are never still; even in a solid they keep shaking.',

    q_more: 'If this substance is heated more, what happens to the molecules’ speed and kinetic energy?',
    c_faster: 'Both increase',
    c_slower: 'Both decrease',
    c_same: 'Neither changes',
    c_stop: 'The molecules stop',
    why_more: '<b>Both increase:</b> the faster the motion, the more kinetic energy.',
    mis_slower: 'Heating does not slow molecules down; it speeds them up.',
    mis_same: 'Heat speeds the molecules up, so their kinetic energy changes too.',
    mis_stop: 'Molecules never stop; heated, they shake or dart about harder.',

    q_name: 'What is the energy that comes from the vibration or motion of a substance’s molecules called?',
    c_heat: 'Heat',
    c_electric: 'Electricity',
    c_light: 'Light',
    c_stored: 'Potential energy',
    why_name: '<b>Heat:</b> heat energy is nothing but the molecules’ combined kinetic energy.',
    mis_electric: 'Electricity is another kind of energy; this question is about the molecules’ motion.',
    mis_light: 'Light is another kind of energy; it is not the name for energy from the molecules’ motion.',
    mis_stored: 'Potential energy comes from position or shape, not from motion.',
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
