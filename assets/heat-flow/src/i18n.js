// Every string the figure shows, in Bangla (in the book's words, page 162, ৬.১.১: অভ্যন্তরীণ শক্তি ও তাপের প্রবাহ: তাপশক্তি,
// তাপমাত্রা, পানির পৃষ্ঠদেশের উচ্চতা, আয়তন, আলপিন, এক গ্লাস পানি, সংস্পর্শ, অণুগুলোর গড় গতিশক্তি) and English.
// Use t('key', vars) in code, and t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'অভ্যন্তরীণ শক্তি ও তাপের প্রবাহ',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'উচ্চতা',
    examples: 'কী দেখবে',

    unit_cm: 'সেমি',
    chip_water: 'পানির পাত্র',
    chip_heat: 'তাপের প্রবাহ',

    // the action (the big button and the numbered ring on the tap)
    act_open: 'কলটি খোলো',
    act_contact: 'সংস্পর্শে আনো',
    act_again: 'আবার করো',

    // short labels on the 3D view
    l_height: 'উচ্চতা {v} সেমি',
    l_hot: 'তাপমাত্রা বেশি',
    l_cold: 'তাপমাত্রা কম',
    l_same: 'তাপমাত্রা সমান',
    l_pin: 'গরম আলপিন',
    l_glass: 'এক গ্লাস পানি',
    l_flow_water: 'পানির প্রবাহ',
    l_flow_heat: 'তাপের প্রবাহ',

    // the water view (চিত্র ৬.০১): result and rule at each step
    out_w_levels: 'পানির উচ্চতা: বাম নলে <b>{l} সেমি</b>, ডান পাত্রে <b>{r} সেমি</b>।',
    out_w_done: 'দুই পাত্রেই পানির উচ্চতা এখন <b>{h} সেমি</b>। প্রবাহ থেমে গেছে।',
    rule_w_rest: 'দুটি পাত্রে পানির পৃষ্ঠদেশের উচ্চতা ভিন্ন। কলটি খুললে পানি কোন দিকে যাবে?',
    rule_w_run: 'পানি <b>বেশি উচ্চতা থেকে কম উচ্চতায়</b> যাচ্ছে। কোন পাত্রে পানি বেশি, তা দিয়ে দিক ঠিক হয় না।',
    rule_w_done: 'পানি সব সময় <b>বেশি উচ্চতা থেকে কম উচ্চতায়</b> বয়, যতক্ষণ না দুটি উচ্চতা সমান হয়।',

    // the heat view: the same picture, the book's pin and glass of water
    out_h_rest: 'আলপিনের তাপমাত্রা বেশি, তাপশক্তি অল্প। পানির তাপমাত্রা কম, তাপশক্তি অনেক বেশি।',
    out_h_run: 'আলপিনের তাপমাত্রা কমছে, পানির তাপমাত্রা সামান্য বাড়ছে।',
    out_h_done: 'দুটোর তাপমাত্রা সমান হয়েছে, তাই তাপের প্রবাহ থেমে গেছে।',
    rule_h_rest: '<b>তাপমাত্রা</b> তরলের উচ্চতার মতো, আর তাপ তরলের আয়তনের মতো। তাপমাত্রা হলো পদার্থের অণুগুলোর গড় গতিশক্তির একটি পরিমাপ।',
    rule_h_run: 'তাপ <b>বেশি তাপমাত্রা থেকে কম তাপমাত্রায়</b> যাচ্ছে। আলপিনে তাপের পরিমাণ কম হলেও তাপ আলপিন থেকেই যায়।',
    rule_h_done: 'তাপ সব সময় <b>বেশি তাপমাত্রা থেকে কম তাপমাত্রার</b> জিনিসে যায়, যতক্ষণ না দুটোর তাপমাত্রা সমান হয়।',

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
    q_locked: 'পরীক্ষার সময় কলটি বন্ধ থাকে। প্রশ্নের উত্তর বেছে নাও।',

    // 1: which way does the water go (the tube is lower)
    q_dir: 'কলটি খুললে পানি কোন দিকে যাবে?',
    d_right: 'বাম নল থেকে ডান পাত্রে',
    d_left: 'ডান পাত্র থেকে বাম নলে',
    d_none: 'কোনো দিকেই যাবে না',
    d_both: 'দুই দিকেই সমান যাবে',
    why_dir_left: '<b>ডান পাত্র থেকে বাম নলে</b>: ডান পাত্রে উচ্চতা বেশি ({r} সেমি), বাম নলে কম ({l} সেমি)। পানি বেশি উচ্চতা থেকে কম উচ্চতায় যায়।',
    not_d_right: 'উল্টো দিক। পানি কম উচ্চতার দিকে যায়।',
    not_d_none: 'দুটি উচ্চতা ভিন্ন, তাই প্রবাহ হবেই।',
    not_d_both: 'প্রবাহ একদিকেই হয়: বেশি উচ্চতা থেকে কমে।',

    // 2: heat from the pin to the glass of water
    q_pin: 'গরম আলপিনটা এক গ্লাস পানিতে ডুবিয়ে দেওয়া হলো। আলপিনে তাপশক্তি অল্প, পানিতে অনেক বেশি। তাপ কোন দিকে যাবে?',
    p_pin: 'আলপিন থেকে পানিতে',
    p_water: 'পানি থেকে আলপিনে',
    p_none: 'কোনো দিকেই যাবে না',
    p_both: 'দুই দিকেই সমান যাবে',
    why_pin: '<b>আলপিন থেকে পানিতে</b>: আলপিনের তাপমাত্রা বেশি। তাপ কোন দিকে যাবে, তা ঠিক করে তাপমাত্রা, তাপের পরিমাণ নয়।',
    not_p_water: 'পানিতে তাপশক্তি বেশি হলেও প্রবাহ ঠিক করে তাপমাত্রা।',
    not_p_none: 'তাপমাত্রা ভিন্ন, তাই তাপ প্রবাহিত হবেই।',
    not_p_both: 'তাপ একদিকেই যায়: বেশি তাপমাত্রা থেকে কমে।',

    // 3: when does the flow stop
    q_stop: 'কলটি খুললে পানির প্রবাহ কখন থামবে?',
    s_equal: 'যখন দুই পাত্রে পানির উচ্চতা সমান হবে',
    s_empty: 'যখন বাম নলের সব পানি ডান পাত্রে চলে যাবে',
    s_volume: 'যখন দুই পাত্রে পানির আয়তন সমান হবে',
    s_full: 'যখন ডান পাত্র পানিতে ভরে যাবে',
    why_stop: '<b>দুই পাত্রে পানির উচ্চতা সমান হলে</b> থামবে: তখন আর বেশি-কম উচ্চতা থাকে না, তাই প্রবাহ থেমে যায়।',
    not_s_empty: 'নলে পানি থেকে যায়: প্রবাহ থামে উচ্চতা সমান হলে।',
    not_s_volume: 'আয়তন সমান হয় না (ডান পাত্রে পানি অনেক বেশি), তবু প্রবাহ থামে।',
    not_s_full: 'ডান পাত্র ভরার আগেই উচ্চতা সমান হয়ে যায়।',

    // 4: what is equal when the heat stops flowing
    q_equal: 'আলপিন আর পানির মধ্যে তাপের প্রবাহ থেমে গেছে। এখন কোনটি সমান?',
    e_temp: 'দুটোর তাপমাত্রা',
    e_heat: 'দুটোর তাপশক্তির পরিমাণ',
    e_both: 'তাপমাত্রা আর তাপশক্তি, দুটোই',
    e_none: 'কোনোটিই সমান নয়',
    why_equal: '<b>দুটোর তাপমাত্রা</b>: তাপ ততক্ষণ প্রবাহিত হয়, যতক্ষণ না দুটোর তাপমাত্রা সমান হয়।',
    not_e_heat: 'ছবিতে দুই পাত্রের পানির আয়তন সমান নয়: তাপশক্তির পরিমাণও সমান নয়।',
    not_e_both: 'তাপশক্তির পরিমাণ সমান হয় না, শুধু তাপমাত্রা সমান হয়।',
    not_e_none: 'প্রবাহ থামে ঠিক তখনই, যখন তাপমাত্রা সমান।',

    // 5: what temperature measures
    q_def: 'তাপমাত্রা কীসের একটা পরিমাপ?',
    f_ke: 'পদার্থের ভেতরকার অণুগুলোর গড় গতিশক্তির',
    f_count: 'পদার্থের ভেতরকার অণুগুলোর মোট সংখ্যার',
    f_heat: 'পদার্থের ভেতরকার মোট তাপশক্তির পরিমাণের',
    f_size: 'পদার্থের ভেতরকার অণুগুলোর আকারের',
    why_def: '<b>অণুগুলোর গড় গতিশক্তির</b>: তাপমাত্রা হচ্ছে পদার্থের ভেতরকার অণুগুলোর গড় গতিশক্তির একটা পরিমাপ।',
    not_f_count: 'অণুর সংখ্যা তাপমাত্রা ঠিক করে না।',
    not_f_heat: 'গ্লাসের পানিতে তাপশক্তি বেশি, তবু আলপিনের তাপমাত্রা বেশি।',
    not_f_size: 'অণুর আকার তাপমাত্রা ঠিক করে না।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Internal Energy and Flow of Heat',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Height',
    examples: 'What to look at',

    unit_cm: 'cm',
    chip_water: 'Water vessels',
    chip_heat: 'Flow of heat',

    act_open: 'Open the tap',
    act_contact: 'Bring them in contact',
    act_again: 'Do it again',

    l_height: 'Height {v} cm',
    l_hot: 'Higher temperature',
    l_cold: 'Lower temperature',
    l_same: 'Same temperature',
    l_pin: 'Hot pin',
    l_glass: 'A glass of water',
    l_flow_water: 'Flow of water',
    l_flow_heat: 'Flow of heat',

    out_w_levels: 'Height of the water: left tube <b>{l} cm</b>, right vessel <b>{r} cm</b>.',
    out_w_done: 'The water is now <b>{h} cm</b> high in both. The flow has stopped.',
    rule_w_rest: 'The water surfaces stand at different heights. Which way will the water go when the tap opens?',
    rule_w_run: 'Water flows <b>from the greater height to the lower height.</b> Which vessel holds more water does not decide the way.',
    rule_w_done: 'Water always flows <b>from the greater height to the lower height,</b> until the two heights are equal.',

    out_h_rest: 'The pin: high temperature, little heat energy. The water: lower temperature, much more heat energy.',
    out_h_run: 'The pin’s temperature is falling, the water’s is rising a little.',
    out_h_done: 'The two temperatures are equal, so the flow of heat has stopped.',
    rule_h_rest:
      '<b>Temperature</b> is like the height of a liquid, and heat is like its volume. Temperature measures the average kinetic energy of the molecules in a substance.',
    rule_h_run: 'Heat goes <b>from the higher temperature to the lower.</b> It goes from the pin, though the pin has less heat.',
    rule_h_done: 'Heat always goes <b>from the higher temperature to the lower,</b> until the two temperatures are equal.',

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
    q_locked: 'The tap stays shut during the test. Pick an answer.',

    q_dir: 'Which way will the water go when the tap opens?',
    d_right: 'From the left tube to the right vessel',
    d_left: 'From the right vessel to the left tube',
    d_none: 'It will not go either way',
    d_both: 'The same amount each way',
    why_dir_left:
      '<b>From the right vessel to the left tube</b>: the right vessel is higher ({r} cm), the left tube lower ({l} cm). Water goes from the greater height to the lower height.',
    not_d_right: 'The wrong way round. Water goes toward the lower height.',
    not_d_none: 'The heights differ, so water will flow.',
    not_d_both: 'The flow goes one way: from the greater height to the lower.',

    q_pin: 'A hot pin is dipped into a glass of water. The pin has little heat energy, the water much more. Which way will heat go?',
    p_pin: 'From the pin to the water',
    p_water: 'From the water to the pin',
    p_none: 'It will not go either way',
    p_both: 'The same amount each way',
    why_pin:
      '<b>From the pin to the water</b>: the pin has the higher temperature. The temperature decides which way heat goes, not the amount of heat.',
    not_p_water: 'The water has more heat energy, but the temperature decides the flow.',
    not_p_none: 'The temperatures differ, so heat will flow.',
    not_p_both: 'Heat goes one way: from the higher temperature to the lower.',

    q_stop: 'When will the flow of water stop after the tap opens?',
    s_equal: 'When the water in both vessels is at the same height',
    s_empty: 'When all the water in the left tube has gone into the right vessel',
    s_volume: 'When both vessels hold the same volume of water',
    s_full: 'When the right vessel is full of water',
    why_stop: '<b>When the water is at the same height in both</b>: there is no greater or lower height any more, so the flow stops.',
    not_s_empty: 'Some water stays in the tube: the flow stops when the heights are equal.',
    not_s_volume: 'The volumes are not equal (the right vessel holds far more), yet the flow stops.',
    not_s_full: 'The heights become equal long before the right vessel is full.',

    q_equal: 'The flow of heat between the pin and the water has stopped. Which is equal now?',
    e_temp: 'Their temperatures',
    e_heat: 'Their amounts of heat energy',
    e_both: 'Temperature and heat energy, both',
    e_none: 'Neither is equal',
    why_equal: '<b>Their temperatures</b>: heat keeps flowing until the two temperatures are equal.',
    not_e_heat: 'In the picture the volumes of water are not equal: neither are the amounts of heat energy.',
    not_e_both: 'The amounts of heat energy are not equal, only the temperatures.',
    not_e_none: 'The flow stops exactly when the temperatures are equal.',

    q_def: 'Temperature is a measure of what?',
    f_ke: 'The average kinetic energy of the molecules inside a substance',
    f_count: 'The total number of molecules inside a substance',
    f_heat: 'The total amount of heat energy inside a substance',
    f_size: 'The size of the molecules inside a substance',
    why_def:
      '<b>The average kinetic energy of the molecules</b>: temperature is a measure of the average kinetic energy of the molecules inside a substance.',
    not_f_count: 'The number of molecules does not decide the temperature.',
    not_f_heat: 'A glass of water holds more heat energy, yet the pin is hotter.',
    not_f_size: 'The size of the molecules does not decide the temperature.',
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
