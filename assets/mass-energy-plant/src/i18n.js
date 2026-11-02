// Every string the figure shows, in Bangla (the NCTB words of book p119: ভর ও শক্তির সম্পর্ক, অস্থিতিশীল, ডান পাশে ভর
// কম, চেইন রি-অ্যাকশন, নিউক্লিয়ার শক্তিকেন্দ্র …) and English. Use t('key') in code and t.num() for numbers (Bangla
// digits when the language is Bangla). Formula pieces ({emc}, {c2}) and numbers in scientific notation are built in
// app.js and passed in as {vars}; powers are <sup> (the bundled Noto Sans Bengali has no ² or ⁻ glyphs).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'ভর ও শক্তির সম্পর্ক (Relation between mass and energy)',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'শক্তি',
    aria_stage: 'একটি ধীরগতির নিউট্রন ইউরেনিয়াম ২৩৫ নিউক্লিয়াসে ঢুকে যায়; নিউক্লিয়াসটি কেঁপে দুটো ছোট নিউক্লিয়াস, তিনটি নিউট্রন আর শক্তিতে ভাগ হয়ে যায়।',

    act_plant_on: 'শক্তিকেন্দ্র চালু করো',
    act_plant_off: 'বন্ধ করো',
    act_home: 'নতুন করে',

    calc: 'জ্বালানির ভর আর কতটুকু শক্তি হয়',
    calc_m: 'ভর',
    m_down: 'ভর কমাও',
    m_up: 'ভর বাড়াও',
    part: 'শক্তি হয়',
    part_fission: 'ভাঙলে: ভরের প্রায় {p}%',
    part_full: 'পুরো ভর শক্তি হলে',

    u_g: 'g',
    u_kg: 'kg',
    u_J: 'J',

    f_E: '{emc} = {kg}<span class="me-u">&nbsp;kg</span> × ({c}<span class="me-u">&nbsp;m/s</span>)<sup>{two}</sup> = <b>{E}&nbsp;J</b>',

    out_plant: '{m} এর প্রায় {p}% ভর শক্তি হয়: <i>m</i> = {kg}&nbsp;kg',
    out_plant_full: 'পুরো {m} ভর শক্তি হলে: <i>m</i> = {kg}&nbsp;kg',

    rule_plant_off: 'শক্তিকেন্দ্রে ঠিক এটাই ঘটে (ভেতরটা কেটে দেখানো)। এই শক্তিতে {W}&nbsp;W বাল্ব জ্বলবে প্রায় <b>{years}</b>।',
    rule_plant_on: '<b>তাপে পানি বাষ্প হয়, বাষ্প টারবাইন ঘোরায়, জেনারেটরে বিদ্যুৎ হয়।</b> {W}&nbsp;W বাল্ব জ্বলবে প্রায় <b>{years}</b>।',
    years: '{n} বছর',
    w_thousand: '{n} হাজার',
    w_lakh: '{n} লাখ',
    w_crore: '{n} কোটি',

    l_core: 'চুল্লি',
    l_steam: 'বাষ্প',
    l_turbine: 'টারবাইন',
    l_generator: 'জেনারেটর',
    l_power: 'বিদ্যুৎ',
    l_fuel: 'জ্বালানি {m}&nbsp;g',

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
    q_locked: 'পরীক্ষার সময় ছবি থেমে থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_calc: '{m}&nbsp;g জ্বালানির পুরো ভর শক্তি হলে কত শক্তি পাওয়া যেত? (c = {c}&nbsp;m/s)',
    n_calc_g: 'ভর কিলোগ্রামে নিতে হয়: {m}&nbsp;g = {kg}&nbsp;kg।',
    n_calc_c: '<i>c</i> নয়, {c2} দিয়ে গুণ করতে হয়।',
    n_calc_2c: '{c2} মানে <i>c</i> × <i>c</i>, {two} × <i>c</i> নয়।',
    a_calc: '<b>{E}&nbsp;J</b>: {emc} = {kg}&nbsp;kg × ({c}&nbsp;m/s)<sup>{two}</sup> = {E}&nbsp;J।',

    q_parts: 'শক্তিকেন্দ্রের কোন অংশে বিদ্যুৎ তৈরি হয়?',
    n_parts_core: 'চুল্লিতে নিউক্লিয়াস ভেঙে তাপ তৈরি হয়, বিদ্যুৎ নয়।',
    n_parts_steam: 'বাষ্প টারবাইন ঘোরায়; বাষ্পে বিদ্যুৎ তৈরি হয় না।',
    n_parts_turbine: 'টারবাইন ঘুরে জেনারেটর ঘোরায়; বিদ্যুৎ তৈরি হয় জেনারেটরে।',
    a_parts: 'চুল্লির তাপে পানি বাষ্প হয়, বাষ্প টারবাইন ঘোরায়, টারবাইন জেনারেটর ঘোরায়: <b>জেনারেটরে</b> বিদ্যুৎ তৈরি হয়।',
    q_why: 'নিউক্লিয়ার শক্তিকেন্দ্রে অল্প একটু ভর থেকেই অনেক বেশি শক্তি পাওয়া যায় কেন?',
    c_why_c2: '{c2} খুব বড় সংখ্যা',
    c_why_more: 'ভাঙার পর ভর বেড়ে যায়',
    c_why_half: 'ইউরেনিয়ামের অর্ধায়ু অনেক বেশি',
    c_why_n: 'নিউট্রনের ভর খুব বেশি',
    n_why_more: 'ভাঙার পর ভর কমে, বাড়ে না; কমে যাওয়া ভরটুকুই শক্তি।',
    n_why_half: 'অর্ধায়ু বলে নিজে থেকে কত ধীরে ক্ষয় হয়; শক্তির পরিমাণ বলে {emc}।',
    n_why_n: 'নিউট্রনের ভর মাত্র প্রায় {one}&nbsp;u, খুবই কম।',
    a_why: '<b>{c2} খুব বড়</b>: {cc} m<sup>{two}</sup>/s<sup>{two}</sup>। তাই {emc} এ সামান্য <i>m</i> থেকেও বিপুল শক্তি।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Relation between mass and energy (ভর ও শক্তির সম্পর্ক)',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Energy',
    aria_stage: 'A slow neutron enters a uranium-235 nucleus; the nucleus wobbles and splits into two smaller nuclei, three neutrons and energy.',

    act_plant_on: 'Start the plant',
    act_plant_off: 'Switch off',
    act_home: 'Start over',

    calc: 'Fuel mass and how much becomes energy',
    calc_m: 'Mass',
    m_down: 'Less mass',
    m_up: 'More mass',
    part: 'Becomes energy',
    part_fission: 'Split: about {p}% of the mass',
    part_full: 'All of the mass',

    u_g: 'g',
    u_kg: 'kg',
    u_J: 'J',

    f_E: '{emc} = {kg}<span class="me-u">&nbsp;kg</span> × ({c}<span class="me-u">&nbsp;m/s</span>)<sup>{two}</sup> = <b>{E}&nbsp;J</b>',

    out_plant: 'About {p}% of {m} becomes energy: <i>m</i> = {kg}&nbsp;kg',
    out_plant_full: 'If all of {m} became energy: <i>m</i> = {kg}&nbsp;kg',

    rule_plant_off: 'A power plant does just this (shown cut open). This energy lights a {W}&nbsp;W bulb for about <b>{years}</b>.',
    rule_plant_on: '<b>The heat makes steam, the steam turns the turbine, the generator makes electricity.</b> {W}&nbsp;W bulb: <b>{years}</b>.',
    years: '{n} years',
    w_thousand: '{n} thousand',
    w_lakh: '{n} lakh',
    w_crore: '{n} crore',

    l_core: 'reactor',
    l_steam: 'steam',
    l_turbine: 'turbine',
    l_generator: 'generator',
    l_power: 'electricity',
    l_fuel: 'fuel {m}&nbsp;g',

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
    q_locked: 'The picture stays still during the test. Look at it and pick an answer.',

    q_calc: 'If all the mass of {m}&nbsp;g of fuel became energy, how much would that be? (c = {c}&nbsp;m/s)',
    n_calc_g: 'Mass must be in kilograms: {m}&nbsp;g = {kg}&nbsp;kg.',
    n_calc_c: 'Multiply by {c2}, not by <i>c</i>.',
    n_calc_2c: '{c2} means <i>c</i> × <i>c</i>, not {two} × <i>c</i>.',
    a_calc: '<b>{E}&nbsp;J</b>: {emc} = {kg}&nbsp;kg × ({c}&nbsp;m/s)<sup>{two}</sup> = {E}&nbsp;J.',

    q_parts: 'In which part of the power plant is the electricity made?',
    n_parts_core: 'The core splits nuclei and makes heat, not electricity.',
    n_parts_steam: 'The steam turns the turbine; it makes no electricity itself.',
    n_parts_turbine: 'The turbine turns the generator; the electricity is made there.',
    a_parts: "The core's heat boils water, the steam turns the turbine, the turbine turns the generator: the <b>generator</b> makes the electricity.",
    q_why: 'Why does a nuclear power plant get so much energy from so little mass?',
    c_why_c2: '{c2} is a huge number',
    c_why_more: 'The mass grows after the split',
    c_why_half: "Uranium's half-life is very long",
    c_why_n: 'A neutron has a very large mass',
    n_why_more: 'The mass goes down, not up, in a split; the missing mass is the energy.',
    n_why_half: 'The half-life says how slowly it decays by itself; {emc} says how much energy.',
    n_why_n: 'A neutron is only about {one}&nbsp;u, very little.',
    a_why: '<b>{c2} is huge</b>: {cc} m<sup>{two}</sup>/s<sup>{two}</sup>. So in {emc} even a tiny <i>m</i> gives a vast energy.',
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
