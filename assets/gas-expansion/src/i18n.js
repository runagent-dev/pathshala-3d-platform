// Every string the figure shows, in Bangla (the book's words, pages 173-175, topic ৬.৩.৩ গ্যাসের প্রসারণ: আয়তন, চাপ,
// সিলিন্ডার, পিস্টন, নির্দিষ্ট ওজন, আদর্শ গ্যাসের সূত্র PV = nRT, কেলভিন স্কেলে তাপমাত্রা, গ্যাসের আয়তন প্রসারণ সহগ γ_P = 1/T₁)
// and English. Units are Latin symbols (K, L, Pa) as in docs/book-notes.md. Use t(key, vars) in code and t.num() for
// numbers (Bangla digits in Bangla); {one}, {two} are the subscripts' digits and {k200}… the chips' numbers.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'গ্যাসের প্রসারণ',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'গ্যাসের আয়তন',

    // the starting temperature T<sub>1</sub> (one row of words, with the gas's expansion under each once it was heated)
    examples: 'শুরুর তাপমাত্রা T1',
    ex_200: '{k200} K',
    ex_300: '{k300} K',
    ex_400: '{k400} K',
    res_pct: '+{p}%',

    // the action: one big button
    act_heat: 'গ্যাসকে তাপ দাও',
    act_cool: 'আবার ঠান্ডা করো',
    act_home: 'আবার শুরু থেকে',

    // the readings: before and after (the book's picture, চিত্র ৬.০৭)
    rd: 'আগে আর পরে: তাপমাত্রা (কেলভিন) আর আয়তন (লিটার)',
    rd_before: 'আগে',
    rd_after: 'পরে',
    rd_T: 'তাপমাত্রা',
    rd_V: 'আয়তন',
    rd_const: 'চাপ <i>P</i> = {P} Pa (প্যাসকেল) আর গ্যাসের পরিমাণ <i>n</i> = {n} মোল একই',
    u_K: 'K',
    u_L: 'L',
    u_Pa: 'Pa',

    // the formula: the book's γ_P
    fx: 'গ্যাসের আয়তন প্রসারণ সহগ',

    // the rule (the book's words), growing with what the student finds out
    rule_0: 'গ্যাসের <b>নির্দিষ্ট আকারও নেই, নির্দিষ্ট আয়তনও নেই।</b> যে পাত্রে রাখা হয়, তার পুরোটা জুড়ে ছড়িয়ে যায়। পিস্টনের ওপর নির্দিষ্ট ওজন সব সময় সমান চাপ দেয়।',
    rule_1:
      'চাপ <i>P</i> আর পরিমাণ <i>n</i> একই থাকলে তাপমাত্রা <i>T</i> বাড়লে আয়তন <i>V</i> বাড়ে।<span class="pvc-formula"><i>PV</i> = <i>nRT</i></span>তাপ দিলে বাতাসের আয়তন বাড়ে (চিত্র {fig})।',
    rule_2:
      'তাপমাত্রা যত কম, গ্যাসের প্রসারণ তত বেশি।<span class="pvc-formula">γ<sub>P</sub> = 1/<i>T</i><sub>1</sub></span>আয়তন প্রতিবার প্রায় {dv} L বাড়ে, কিন্তু <i>V</i><sub>1</sub> ছোট হলে ভাগফল বড়।',

    // labels on the picture
    lab_T1: 'T<sub>1</sub> = {T} K',
    lab_V1: 'V<sub>1</sub> = {V} L',
    lab_T2: 'T<sub>2</sub> = {T} K',
    lab_V2: 'V<sub>2</sub> = {V} L',
    lab_V2q: 'V<sub>2</sub> = ?',
    lab_dV: 'V<sub>2</sub> − V<sub>1</sub>',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি আর পাশের সূত্র দেখে সঠিক উত্তরটি বেছে নাও।',
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

    qw_text: 'পিস্টনের ওপর নির্দিষ্ট ওজন রাখা হয়েছে। কেন?',
    qw_ok: 'গ্যাসের চাপ সব সময় একই থাকে',
    qw_a: 'গ্যাসের তাপমাত্রা সব সময় একই থাকে',
    qw_b: 'গ্যাসের পরিমাণ বেড়ে যায়',
    qw_c: 'গ্যাসের আয়তন সব সময় একই থাকে',
    qw_r: '<b>গ্যাসের চাপ একই রাখতে।</b> নির্দিষ্ট ওজন সব সময় সমান চাপ দেয়, তাই আয়তনের বৃদ্ধি মাপা যায়।',
    qw_a_why: 'তাপমাত্রা তো আগুনে বাড়ছে; ওজন রাখা হয়েছে চাপ ঠিক রাখতে।',
    qw_b_why: 'ওজন গ্যাস বাড়ায় না; পাত্রের গ্যাস একই থাকে।',
    qw_c_why: 'আয়তন বাড়তে পারে বলেই পিস্টন ওপরে ওঠে; একই থাকে চাপ।',

    qg_text: 'ডানের গ্যাসকে তাপ দেওয়ার পর কোনটি বেড়েছে?',
    qg_ok: 'আয়তন',
    qg_a: 'চাপ',
    qg_b: 'গ্যাসের পরিমাণ',
    qg_c: 'ওজনের ভার',
    qg_r: '<b>আয়তন বেড়েছে</b> (V<sub>2</sub> > V<sub>1</sub>): পিস্টন ওপরে উঠেছে, গ্যাস বেশি জায়গা নিয়েছে।',
    qg_a_why: 'একই ওজন, তাই চাপ একই থাকে।',
    qg_b_why: 'গ্যাস একই, শুধু ছড়িয়ে গেছে (অণুগুলো গুনে দেখো)।',
    qg_c_why: 'ওজনটা একই; তার ভার বদলায়নি।',

    qv_text: 'ডানের গ্যাস {T1} K থেকে {T2} K-এ গরম হলো। চাপ আর পরিমাণ একই। এখন আয়তন কত?',
    qv_r: '<b><i>V</i><sub>2</sub> = {V2} L:</b> চাপ আর <i>n</i> একই, তাই <i>V</i> সমানুপাতিক <i>T</i>-এর: {V1} × {T2}/{T1} = {V2} L।',
    qv_same_why: 'আয়তন বাড়ে, V<sub>2</sub> = V<sub>1</sub> নয়।',
    qv_twice_why: 'তাপমাত্রা দ্বিগুণ হয়নি, তাই আয়তনও দ্বিগুণ নয়।',
    qv_flip_why: 'T<sub>1</sub>/T<sub>2</sub> উল্টো করা হয়েছে: গরম হলে আয়তন কমে না, বাড়ে।',
    qv_cm: '<b>V</b> আর <b>T</b> সমান হারে বাড়ে।',

    qy_text: 'গ্যাসটির প্রসারণ সহগ কত? (শুরুর তাপমাত্রা {T1} K)',
    qy_r: '<b>γ<sub>P</sub> = 1/<i>T</i><sub>1</sub> = {one}/{T1} K<sup>−1</sup>।</b> হর হলো গরম করার আগের তাপমাত্রা।',
    qy_t2_why: 'হর T<sub>2</sub> নয়, শুরুর তাপমাত্রা T<sub>1</sub>।',
    qy_dt_why: 'T<sub>2</sub> − T<sub>1</sub> হর নয়; সেটা আগেই ভাগ হয়ে গেছে, হর T<sub>1</sub>।',
    qy_flip_why: 'উল্টো হয়েছে: γP = 1/T<sub>1</sub>, T<sub>1</sub> নয়।',

    qc_text: 'একই চাপে একটি গ্যাস {Ta} K-এ আর আরেকটি {Tb} K-এ আছে। দুটিকেই এক ডিগ্রি গরম করলে কোনটির প্রসারণ সহগ বেশি?',
    qc_ok: '{Ta} K-এর গ্যাসের',
    qc_a: '{Tb} K-এর গ্যাসের',
    qc_b: 'দুটোর সমান',
    qc_c: 'হিসাব করে বলা যায় না',
    qc_r: '<b>{Ta} K-এর গ্যাসের:</b> γ<sub>P</sub> = 1/<i>T</i><sub>1</sub>, তাপমাত্রা যত কম, প্রসারণ তত বেশি। এখানে {one}/{Ta} > {one}/{Tb}।',
    qc_a_why: 'উল্টো: T<sub>1</sub> বেশি হলে 1/T<sub>1</sub> কম, প্রসারণ কম।',
    qc_b_why: 'γP ধ্রুব সংখ্যা নয়, T<sub>1</sub>-এর ওপর নির্ভর করে।',
    qc_c_why: 'γP = 1/T<sub>1</sub> দিয়েই বলা যায়।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Expansion of gas',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Volume of the gas',

    examples: 'Starting temperature T1',
    ex_200: '{k200} K',
    ex_300: '{k300} K',
    ex_400: '{k400} K',
    res_pct: '+{p}%',

    act_heat: 'Heat the gas',
    act_cool: 'Cool it again',
    act_home: 'Start again',

    rd: 'Before and after: temperature (kelvin) and volume (litres)',
    rd_before: 'Before',
    rd_after: 'After',
    rd_T: 'Temperature',
    rd_V: 'Volume',
    rd_const: 'Pressure <i>P</i> = {P} Pa and amount of gas <i>n</i> = {n} mol stay the same',
    u_K: 'K',
    u_L: 'L',
    u_Pa: 'Pa',

    fx: 'Coefficient of volume expansion of a gas',

    rule_0:
      'A gas has <b>no fixed shape and no fixed volume.</b> It spreads through the whole container it is put in. The fixed weight on the piston always gives the same pressure.',
    rule_1:
      'With the pressure <i>P</i> and the amount <i>n</i> the same, a rise in temperature <i>T</i> raises the volume <i>V</i>.<span class="pvc-formula"><i>PV</i> = <i>nRT</i></span>Heat makes the volume of the air increase (figure {fig}).',
    rule_2:
      'The lower the temperature, the more the gas expands.<span class="pvc-formula">γ<sub>P</sub> = 1/<i>T</i><sub>1</sub></span>The volume rises by about {dv} L each time, but when <i>V</i><sub>1</sub> is smaller the ratio is bigger.',

    lab_T1: 'T<sub>1</sub> = {T} K',
    lab_V1: 'V<sub>1</sub> = {V} L',
    lab_T2: 'T<sub>2</sub> = {T} K',
    lab_V2: 'V<sub>2</sub> = {V} L',
    lab_V2q: 'V<sub>2</sub> = ?',
    lab_dV: 'V<sub>2</sub> − V<sub>1</sub>',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture and the formula beside it, then pick an answer.',
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

    qw_text: 'A fixed weight is put on the piston. Why?',
    qw_ok: 'The pressure of the gas always stays the same',
    qw_a: 'The temperature of the gas always stays the same',
    qw_b: 'The amount of gas goes up',
    qw_c: 'The volume of the gas always stays the same',
    qw_r: '<b>To keep the pressure the same.</b> A fixed weight always gives the same pressure, so the rise in volume can be measured.',
    qw_a_why: 'The temperature is rising in the flame; the weight keeps the pressure fixed.',
    qw_b_why: 'The weight does not add gas; the gas in the container is the same.',
    qw_c_why: 'The piston rises because the volume can grow; the pressure stays the same.',

    qg_text: 'After the gas on the right is heated, what has gone up?',
    qg_ok: 'The volume',
    qg_a: 'The pressure',
    qg_b: 'The amount of gas',
    qg_c: 'The weight',
    qg_r: '<b>The volume went up</b> (V<sub>2</sub> > V<sub>1</sub>): the piston rose, the gas takes more room.',
    qg_a_why: 'The same weight, so the same pressure.',
    qg_b_why: 'It is the same gas, only spread out (count the molecules).',
    qg_c_why: 'The weight is the same one.',

    qv_text: 'The gas on the right is heated from {T1} K to {T2} K. Pressure and amount stay the same. What is its volume now?',
    qv_r: '<b><i>V</i><sub>2</sub> = {V2} L:</b> <i>P</i> and <i>n</i> are the same, so <i>V</i> is proportional to <i>T</i>: {V1} × {T2}/{T1} = {V2} L.',
    qv_same_why: 'The volume grows, V<sub>2</sub> is not V<sub>1</sub>.',
    qv_twice_why: 'The temperature did not double, so neither did the volume.',
    qv_flip_why: 'T<sub>1</sub>/T<sub>2</sub> is upside down: a hotter gas takes more room.',
    qv_cm: '<b>V</b> and <b>T</b> grow together.',

    qy_text: 'What is the coefficient of expansion of this gas? (starting temperature {T1} K)',
    qy_r: '<b>γ<sub>P</sub> = 1/<i>T</i><sub>1</sub> = 1/{T1} K<sup>−1</sup>.</b> The bottom is the temperature before heating.',
    qy_t2_why: 'The bottom is the starting temperature T<sub>1</sub>, not T<sub>2</sub>.',
    qy_dt_why: 'T<sub>2</sub> − T<sub>1</sub> is already divided out; the bottom is T<sub>1</sub>.',
    qy_flip_why: 'Upside down: γP = 1/T<sub>1</sub>, not T<sub>1</sub>.',

    qc_text:
      'At the same pressure one gas is at {Ta} K and another at {Tb} K. Both are heated by one degree. Which has the larger coefficient of expansion?',
    qc_ok: 'The gas at {Ta} K',
    qc_a: 'The gas at {Tb} K',
    qc_b: 'Both the same',
    qc_c: 'It cannot be worked out',
    qc_r: '<b>The gas at {Ta} K:</b> γ<sub>P</sub> = 1/<i>T</i><sub>1</sub>, the lower the temperature the more it expands. Here 1/{Ta} > 1/{Tb}.',
    qc_a_why: 'Upside down: a higher T<sub>1</sub> gives a smaller 1/T<sub>1</sub>, less expansion.',
    qc_b_why: 'γP is not a constant, it depends on T<sub>1</sub>.',
    qc_c_why: 'γP = 1/T<sub>1</sub> tells you.',
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
    const all = { one: 1, two: 2, k200: 200, k300: 300, k400: 400, fig: '6.07', ...vars }; // these follow the digits too
    return s.replace(/\{(\w+)\}/g, (m, k) => (k in all ? num(all[k]) : m));
  }
  t.num = num;
  t.lang = code;
  return t;
}
