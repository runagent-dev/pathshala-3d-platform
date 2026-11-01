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

    ex_label: 'কী দেখবে',
    ex_one: 'একটি নিউক্লিয়াস',
    ex_chain: 'চেইন রি-অ্যাকশন',
    ex_plant: 'শক্তিকেন্দ্র',

    act_shoot: 'নিউট্রন ছোড়ো',
    act_again: 'আবার দেখো',
    act_plant_on: 'শক্তিকেন্দ্র চালু করো',
    act_plant_off: 'বন্ধ করো',
    act_home: 'নতুন করে',
    scrub: 'সময়: টেনে আগে-পিছে দেখো',

    eq_aria: 'বইয়ের সমীকরণ: একটি নিউট্রন আর ইউরেনিয়াম ২৩৫ থেকে ক্রিপ্টন ৯২, বেরিয়াম ১৪১ আর তিনটি নিউট্রন',
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
    u_u: 'u',

    chain_gen: '{n}টি',
    chain_aria: 'প্রতি ধাপে কয়টি নিউক্লিয়াস ভাঙল',

    out_start: 'ছবিতে নিউক্লিয়াস লক্ষ কোটি গুণ বড়, চলে অনেক ধীরে',
    out_come: 'ধীরগতির নিউট্রন ছুটে আসছে…',
    out_wobble: 'নিউট্রন ঢুকে গেল: নিউক্লিয়াস <b>অস্থিতিশীল</b>, কাঁপছে',
    out_neck: 'নিউক্লিয়াস দুই ভাগ হয়ে যাচ্ছে…',
    out_split: 'ডান পাশে ভর কম: <b>{dm}&nbsp;u</b> = {kg}&nbsp;kg',
    f_left: 'বাম পাশের ভর = {n}<span class="me-u">&nbsp;u</span> + {U}<span class="me-u">&nbsp;u</span> = <b>{L}&nbsp;u</b>',
    f_E: '{emc} = {kg}<span class="me-u">&nbsp;kg</span> × ({c}<span class="me-u">&nbsp;m/s</span>)<sup>{two}</sup> = <b>{E}&nbsp;J</b>',

    out_chain_start: 'একটি নিউট্রন দিয়ে শুরু (ছবিতে অনেক বড়, অনেক ধীরে)',
    out_chain_run: 'ভেঙেছে <b>{n}টি</b> নিউক্লিয়াস',
    out_chain_done: '{a} + {b} + {c} = <b>{n}টি</b> নিউক্লিয়াস ভাঙল',
    f_chain_start: 'প্রতিটি ভাঙনে শক্তি {e1}&nbsp;J, আর তিনটি নতুন নিউট্রন',
    f_chain: 'শক্তি = {n} × {e1}&nbsp;J = <b>{E}&nbsp;J</b>',

    out_plant: '{m} এর প্রায় {p}% ভর শক্তি হয়: <i>m</i> = {kg}&nbsp;kg',
    out_plant_full: 'পুরো {m} ভর শক্তি হলে: <i>m</i> = {kg}&nbsp;kg',

    rule_start: '<b>ইউরেনিয়াম ২৩৫:</b> ৯২টি প্রোটন (লাল, +), ১৪৩টি নিউট্রন (ধূসর)। ধীরগতির নিউট্রন পেলে এটি পুরোপুরি অস্থিতিশীল হয়।',
    rule_split: '<b>যেটুকু ভর কম, সেটুকুই {emc} অনুযায়ী শক্তি হয়।</b> {c2} = {cc} m<sup>{two}</sup>/s<sup>{two}</sup> অনেক বড়, তাই সামান্য ভরে অনেক শক্তি।',
    rule_chain: 'নতুন তিনটি নিউট্রন প্রচণ্ড গতিতে ছোটে; <b>গতি কমে আসার পর</b> সেগুলো অন্য ইউরেনিয়াম ২৩৫ নিউক্লিয়াস ভাঙে।',
    rule_chain_done: '<b>এভাবে চলতেই থাকে: একে বলে চেইন রি-অ্যাকশন (Chain Reaction)।</b> প্রতি ধাপে ভাঙে তিন গুণ।',
    rule_plant_off: 'শক্তিকেন্দ্রে ঠিক এটাই ঘটে (ভেতরটা কেটে দেখানো)। এই শক্তিতে {W}&nbsp;W বাল্ব জ্বলবে প্রায় <b>{years}</b>।',
    rule_plant_on: '<b>তাপে পানি বাষ্প হয়, বাষ্প টারবাইন ঘোরায়, জেনারেটরে বিদ্যুৎ হয়।</b> {W}&nbsp;W বাল্ব জ্বলবে প্রায় <b>{years}</b>।',
    years: '{n} বছর',
    w_thousand: '{n} হাজার',
    w_lakh: '{n} লাখ',
    w_crore: '{n} কোটি',

    l_n_in: 'ধীরগতির নিউট্রন',
    l_unstable: 'অস্থিতিশীল',
    l_n: 'n',
    l_slow: 'গতি কমছে',
    star: 'শক্তি',
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
    c_count: '{n}টি',

    q_neutrons: 'ইউরেনিয়াম ২৩৫ নিউক্লিয়াসটি ভেঙে গেছে। ভাঙার সময় কয়টি নতুন নিউট্রন বের হলো?',
    n_neutrons_1: 'যে একটি নিউট্রন ঢুকেছিল সেটি এখন একটি ছোট নিউক্লিয়াসের ভেতরে; নতুন বের হয়েছে তিনটি।',
    n_neutrons_2: 'আবার গুনে দেখো: দুটো ছোট নিউক্লিয়াসের বাইরে তিনটি নিউট্রন ছুটছে।',
    n_neutrons_4: 'ঢুকে যাওয়া নিউট্রনটিকেও গুনেছ; সেটি এখন ভেতরে। নতুন বের হয়েছে তিনটি।',
    a_neutrons: '<b>{n}টি</b>: বইয়ের সমীকরণের ডান পাশে আছে {n}টি নিউট্রন, সাথে <sup>{kr}</sup>Kr আর <sup>{ba}</sup>Ba।',

    q_mass_book: 'বাম পাশের ভর {L}&nbsp;u, ডান পাশের {R}&nbsp;u।',
    q_mass: 'এই বিক্রিয়ায় কতটুকু ভর শক্তিতে রূপান্তরিত হলো?',
    n_mass_0: 'ডান পাশের ভর বাম পাশের চেয়ে কম, তাই কিছু ভর শক্তি হয়েছে।',
    n_mass_dec: 'বিয়োগে দশমিকের ঘর সরে গেছে।',
    n_mass_n: 'নিউট্রন হারিয়ে যায়নি: ডান পাশে তিনটি নিউট্রন আছে।',
    a_mass: '<b>{dm}&nbsp;u</b>: {L}&nbsp;u − {R}&nbsp;u = {dm}&nbsp;u। এটুকু ভরই {emc} অনুযায়ী শক্তি হয়েছে।',

    q_calc: '{m}&nbsp;g জ্বালানির পুরো ভর শক্তি হলে কত শক্তি পাওয়া যেত? (c = {c}&nbsp;m/s)',
    n_calc_g: 'ভর কিলোগ্রামে নিতে হয়: {m}&nbsp;g = {kg}&nbsp;kg।',
    n_calc_c: '<i>c</i> নয়, {c2} দিয়ে গুণ করতে হয়।',
    n_calc_2c: '{c2} মানে <i>c</i> × <i>c</i>, {two} × <i>c</i> নয়।',
    a_calc: '<b>{E}&nbsp;J</b>: {emc} = {kg}&nbsp;kg × ({c}&nbsp;m/s)<sup>{two}</sup> = {E}&nbsp;J।',

    q_chain: 'এই ধাপে {k}টি নিউক্লিয়াস ভাঙল। প্রতিটি নতুন নিউট্রন একটি করে ভাঙলে পরের ধাপে কয়টি?',
    n_chain_same: 'প্রতিটি ভাঙন থেকে {k}টি নিউট্রন: {k}টি ভাঙন থেকে {k} × {k} = {a}টি।',
    n_chain_add: 'যোগ নয়, গুণ: {k} × {k} = {a}।',
    n_chain_27: '{w}টি ভাঙবে তার পরের ধাপে ({a} × {k})।',
    a_chain: '<b>{a}টি</b>: {k}টি ভাঙন × {k}টি নিউট্রন = {a}। এভাবে চলতেই থাকে: চেইন রি-অ্যাকশন।',

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

    ex_label: 'What to see',
    ex_one: 'One nucleus',
    ex_chain: 'Chain reaction',
    ex_plant: 'Power plant',

    act_shoot: 'Fire a neutron',
    act_again: 'Watch again',
    act_plant_on: 'Start the plant',
    act_plant_off: 'Switch off',
    act_home: 'Start over',
    scrub: 'Time: drag to go back and forth',

    eq_aria: "The book's equation: a neutron and uranium-235 give krypton-92, barium-141 and three neutrons",
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
    u_u: 'u',

    chain_gen: '{n}',
    chain_aria: 'Nuclei split at each step',

    out_start: 'Nuclei shown far bigger and much slower',
    out_come: 'A slow neutron is on its way…',
    out_wobble: 'The neutron went in: the nucleus is <b>unstable</b> and wobbles',
    out_neck: 'The nucleus is splitting in two…',
    out_split: 'Right side lighter by <b>{dm}&nbsp;u</b> = {kg}&nbsp;kg',
    f_left: 'Left side = {n}<span class="me-u">&nbsp;u</span> + {U}<span class="me-u">&nbsp;u</span> = <b>{L}&nbsp;u</b>',
    f_E: '{emc} = {kg}<span class="me-u">&nbsp;kg</span> × ({c}<span class="me-u">&nbsp;m/s</span>)<sup>{two}</sup> = <b>{E}&nbsp;J</b>',

    out_chain_start: 'One neutron starts it (far bigger, slower)',
    out_chain_run: '<b>{n}</b> nuclei split so far',
    out_chain_done: '{a} + {b} + {c} = <b>{n}</b> nuclei split',
    f_chain_start: 'Each split gives {e1}&nbsp;J and three new neutrons',
    f_chain: 'Energy = {n} × {e1}&nbsp;J = <b>{E}&nbsp;J</b>',

    out_plant: 'About {p}% of {m} becomes energy: <i>m</i> = {kg}&nbsp;kg',
    out_plant_full: 'If all of {m} became energy: <i>m</i> = {kg}&nbsp;kg',

    rule_start: '<b>Uranium-235:</b> 92 protons (red, +), 143 neutrons (grey). A slow neutron makes it completely unstable.',
    rule_split:
      '<b>The missing mass comes out as energy, by {emc}.</b> {c2} = {cc} m<sup>{two}</sup>/s<sup>{two}</sup> is huge: a tiny mass, a lot of energy.',
    rule_chain: 'The three new neutrons are very fast; <b>once slowed down</b> they split other uranium-235 nuclei.',
    rule_chain_done: '<b>And so it goes on: this is a chain reaction.</b> Each step splits three times as many.',
    rule_plant_off: 'A power plant does just this (shown cut open). This energy lights a {W}&nbsp;W bulb for about <b>{years}</b>.',
    rule_plant_on: '<b>The heat makes steam, the steam turns the turbine, the generator makes electricity.</b> {W}&nbsp;W bulb: <b>{years}</b>.',
    years: '{n} years',
    w_thousand: '{n} thousand',
    w_lakh: '{n} lakh',
    w_crore: '{n} crore',

    l_n_in: 'slow neutron',
    l_unstable: 'unstable',
    l_n: 'n',
    l_slow: 'slowing down',
    star: 'energy',
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
    c_count: '{n}',

    q_neutrons: 'The uranium-235 nucleus has split. How many new neutrons came out?',
    n_neutrons_1: 'The neutron that went in is now inside a smaller nucleus; three new ones came out.',
    n_neutrons_2: 'Count again: three neutrons are flying away outside the two smaller nuclei.',
    n_neutrons_4: 'You counted the neutron that went in; it is now inside. Three new ones came out.',
    a_neutrons: "<b>{n}</b>: the book's equation has {n} neutrons on the right, with <sup>{kr}</sup>Kr and <sup>{ba}</sup>Ba.",

    q_mass_book: 'Left side {L}&nbsp;u, right side {R}&nbsp;u.',
    q_mass: 'How much mass became energy in this reaction?',
    n_mass_0: 'The right side has less mass than the left, so some mass became energy.',
    n_mass_dec: 'The decimal point slipped in the subtraction.',
    n_mass_n: 'No neutron was lost: there are three on the right.',
    a_mass: '<b>{dm}&nbsp;u</b>: {L}&nbsp;u − {R}&nbsp;u = {dm}&nbsp;u. Just this mass became energy, by {emc}.',

    q_calc: 'If all the mass of {m}&nbsp;g of fuel became energy, how much would that be? (c = {c}&nbsp;m/s)',
    n_calc_g: 'Mass must be in kilograms: {m}&nbsp;g = {kg}&nbsp;kg.',
    n_calc_c: 'Multiply by {c2}, not by <i>c</i>.',
    n_calc_2c: '{c2} means <i>c</i> × <i>c</i>, not {two} × <i>c</i>.',
    a_calc: '<b>{E}&nbsp;J</b>: {emc} = {kg}&nbsp;kg × ({c}&nbsp;m/s)<sup>{two}</sup> = {E}&nbsp;J.',

    q_chain: '{k} nuclei split at this step. If each new neutron splits one, how many split next?',
    n_chain_same: 'Each split gives {k} neutrons: {k} splits give {k} × {k} = {a}.',
    n_chain_add: 'Multiply, do not add: {k} × {k} = {a}.',
    n_chain_27: '{w} split at the step after that ({a} × {k}).',
    a_chain: '<b>{a}</b>: {k} splits × {k} neutrons = {a}. And so it goes on: a chain reaction.',

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
