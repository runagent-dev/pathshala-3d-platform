// Every string the figure shows, in Bangla and English. The book's words on page 131 (topic 5.2): ঘনত্ব (Density),
// "ঘনত্ব হচ্ছে একক আয়তনে ভরের পরিমাণ অর্থাৎ কোনো বস্তুর ভর যদি m এবং আয়তন V হয় তাহলে তার ঘনত্ব ρ = m/V", "ঘনত্বের
// একক kg/m³ অথবা gm/cc", টেবিল ৫.০১: বিভিন্ন পদার্থের ঘনত্ব (কর্ক 0.25, কাঠ 0.4 – 0.5, পানি 1.00, কাচ 2.60, লোহা 7.80
// gm/cc), "তাপমাত্রা বাড়লে কিংবা কমলে পদার্থের আয়তন বাড়বে কিংবা কমতে পারে। যেহেতু ভরের কোনো পরিবর্তন হয় না তাই
// পদার্থের ঘনত্ব তাপমাত্রার সাথে পরিবর্তন হতে পারে।" The page writes উপর. The scene's own words: বল (a ball: the
// figure has no forces), কণা, বাক্স, ভাসে, ডুবে যায়.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language: units are {u_gm}, {u_cc}, {u_gcc}, {u_kgm3} (written with <sup>: the
// bundled font has no ³), always after a no-break space (&nbsp;).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'ঘনত্ব: একক আয়তনে ভরের পরিমাণ',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ঘনত্ব',
    u_gm: 'gm',
    u_cc: 'cc',
    u_gcc: 'gm/cc',
    u_kgm3: 'kg/m<sup>3</sup>',

    // the row of words
    examples: 'কী দেখবে',
    ex_cork: 'কর্ক',
    ex_wood: 'কাঠ',
    ex_iron: 'লোহা',
    ex_box: 'কণার বাক্স',
    res: '{v}',

    // the action and the quiet button
    act_drop_cork: 'কর্কের বলটি পানিতে ছাড়ো',
    act_drop_wood: 'কাঠের বলটি পানিতে ছাড়ো',
    act_drop_iron: 'লোহার বলটি পানিতে ছাড়ো',
    act_box: 'কণার বাক্সটি দেখো',
    act_squeeze: 'বাক্সটি চেপে ছোট করো',
    act_expand: 'বাক্সটি আবার বড় করো',
    act_home: 'শুরুতে ফেরাও',

    // the formula
    law_label: 'ঘনত্ব = ভর ÷ আয়তন: ρ = m/V',
    name_rho: 'ঘনত্ব',
    name_m: 'ভর',
    name_V: 'আয়তন',
    sum_mv: '<span class="c-m">{m}&nbsp;{u_gm}</span> ÷ <span class="c-V">{V}&nbsp;{u_cc}</span>',
    sum_rho: '= <b>{r}&nbsp;{u_gcc}</b>',
    sum_kg: '= {k}&nbsp;{u_kgm3}',

    // the result line
    out_ready: 'তিনটি বলের আয়তন সমান, <b class="c-V">{V}&nbsp;{u_cc}</b>; ভর আলাদা',
    out_falling: 'দেখো বলটি পানিতে কোথায় থামে…',
    out_cork: 'কর্ক <b>ভাসে</b>: ঘনত্ব পানির ({w}&nbsp;{u_gcc}) চেয়ে অনেক কম',
    out_wood: 'কাঠ <b>ভাসে</b>, প্রায় অর্ধেক ডুবে: ঘনত্ব পানির চেয়ে কম',
    out_iron: 'লোহা <b>ডুবে যায়</b>: ঘনত্ব পানির ({w}&nbsp;{u_gcc}) চেয়ে বেশি',
    out_box: '{n}টি কণা (বড় করে আঁকা), ভর <b class="c-m">{m}&nbsp;{u_gm}</b>',
    out_squeezing: 'কণাগুলো কাছাকাছি আসছে…',
    out_expanding: 'কণাগুলো ছড়িয়ে যাচ্ছে…',
    out_half: 'ভর একই, আয়তন অর্ধেক: ঘনত্ব <b>দ্বিগুণ</b>',
    out_less: 'ভর একই, আয়তন কম: ঘনত্ব <b>বেশি</b>',
    out_more: 'ভর একই, আয়তন বেশি: ঘনত্ব <b>কম</b>',
    out_back: 'আয়তন আবার {V}&nbsp;{u_cc}: ঘনত্ব আবার <b>{r}&nbsp;{u_gcc}</b>',

    // the rule: the book's words, one idea at a time
    rule_start: '<b>ঘনত্ব হচ্ছে একক আয়তনে ভরের পরিমাণ:</b> কোনো বস্তুর ভর m এবং আয়তন V হলে তার ঘনত্ব ρ = m/V। ঘনত্বের একক kg/m<sup>3</sup> অথবা gm/cc।',
    rule_water: '<b>পানির ঘনত্ব {w}&nbsp;{u_gcc}</b> (বইয়ের টেবিল)। যে বলের ঘনত্ব এর চেয়ে কম, সেটি পানিতে ভাসে; বেশি হলে ডুবে যায়।',
    rule_same_v:
      '<b>আয়তন সমান হলে ভর যত বেশি, ঘনত্ব তত বেশি:</b> কর্ক ({a}) &lt; কাঠ ({b}) &lt; লোহা ({c}), সব gm/cc-তে। {one}&nbsp;{u_gcc} = {k}&nbsp;{u_kgm3}।',
    rule_box: '<b>এবার একই ভর, ভিন্ন আয়তন:</b> বাক্সের কণাগুলো একই থাকবে, তাই ভর বদলাবে না; শুধু আয়তন বদলাবে। ঘনত্বের কী হয় দেখো।',
    rule_squeeze:
      '<b>ভর একই থাকলে আয়তন কমলে ঘনত্ব বাড়ে:</b> আয়তন অর্ধেক হলে ঘনত্ব দ্বিগুণ। বই বলে, তাপমাত্রা বাড়লে বা কমলে আয়তন বদলায় কিন্তু ভর বদলায় না, তাই ঘনত্ব তাপমাত্রার সাথে বদলায়।',

    // labels on the picture
    lbl_ball: '{name}<br><span class="c-m">{m}&nbsp;{u_gm}</span>',
    lbl_m: 'm = {m}&nbsp;{u_gm}',
    lbl_V: 'V = {V}&nbsp;{u_cc}',
    lbl_quiz: '<b>{x}</b> <span class="c-m">{m}&nbsp;{u_gm}</span><br><span class="c-V">{V}&nbsp;{u_cc}</span>',
    lbl_letter: '<b>{x}</b>',
    letters: 'ক,খ,গ,ঘ',

    hint_wait: 'বলটি পানিতে থামা পর্যন্ত দেখো।',
    hint_in: 'বলটি পানিতেই আছে; শুরুতে ফেরাও চাপলে উঠে আসে।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_box: 'বাক্সের কণাগুলোর ভর m আর বাক্সের আয়তন V ছবিতে লেখা আছে। কণাগুলোর ঘনত্ব কত?',
    why_box: '<b>{r}&nbsp;{u_gcc}</b>: ρ = m/V = {m}&nbsp;{u_gm} ÷ {V}&nbsp;{u_cc}।',
    mis_box_flip: 'এটি V ÷ m; ঘনত্ব হলো ভর ÷ আয়তন।',
    mis_box_times: 'এটি m × V; ঘনত্বে ভরকে আয়তন দিয়ে ভাগ করতে হয়।',
    mis_box_kg: 'এটি kg/m<sup>3</sup> এককে ঠিক, gm/cc এককে নয়।',

    q_order: 'তিনটি বল একই আকারের, একই রঙের। পানিতে কোনটি কোথায় আছে দেখো। কোন বলের ঘনত্ব সবচেয়ে বেশি?',
    c_equal: 'তিনটির ঘনত্ব সমান',
    why_order: '<b>{x}</b>: এটি ডুবে গেছে, তাই এর ঘনত্ব পানির চেয়ে বেশি; বাকি দুটি ভাসছে।',
    mis_order_float: '{x} ভাসছে, তাই এর ঘনত্ব পানির চেয়ে কম।',
    mis_order_equal: 'আয়তন সমান হলেও ভর আলাদা, তাই বল তিনটি তিন জায়গায় থেমেছে।',

    q_sink: 'চারটি রং করা বলের ভর আর আয়তন ছবিতে লেখা আছে। কোন বলটি পানিতে ডুবে যাবে?',
    why_sink: '<b>{x}</b>: ρ = {m}&nbsp;{u_gm} ÷ {V}&nbsp;{u_cc} = {r}&nbsp;{u_gcc}, পানির চেয়ে বেশি।',
    mis_sink_heavy: '{x}-এর ভর সবচেয়ে বেশি, কিন্তু আয়তনও বড়: ঘনত্ব {r}&nbsp;{u_gcc}, তাই ভাসবে।',
    mis_sink_other: '{x}-এর ঘনত্ব {r}&nbsp;{u_gcc}, পানির চেয়ে কম।',

    q_heat: 'ছবির বাক্সের কণাগুলো গরম করায় আয়তন দ্বিগুণ হলো, ভর একই থাকল। এখন ঘনত্ব কত?',
    why_heat: '<b>{r}&nbsp;{u_gcc}</b>: ρ = {m}&nbsp;{u_gm} ÷ {V2}&nbsp;{u_cc}; আয়তন দ্বিগুণ, তাই ঘনত্ব অর্ধেক।',
    mis_heat_double: 'আয়তন বাড়লে ঘনত্ব বাড়ে না, কমে: আয়তন দিয়ে ভাগ করতে হয়।',
    mis_heat_same: 'ভর একই, কিন্তু আয়তন বদলেছে, তাই ঘনত্বও বদলায়।',
    mis_heat_quarter: 'আয়তন দ্বিগুণ হয়েছে, চার গুণ নয়।',

    q_unit: 'ছবির বলটির ভর আর আয়তন লেখা আছে। এর ঘনত্ব kg/m³ এককে কত?',
    why_unit: '<b>{k}&nbsp;{u_kgm3}</b>: {m}&nbsp;{u_gm} ÷ {V}&nbsp;{u_cc} = {g}&nbsp;{u_gcc}; {one}&nbsp;{u_gcc} = {th}&nbsp;{u_kgm3}।',
    mis_unit_same: 'এটি gm/cc এককের সংখ্যা; kg/m<sup>3</sup> এককে {th} দিয়ে গুণ করতে হয়।',
    mis_unit_div: 'উল্টো দিকে: kg/m<sup>3</sup>-এ সংখ্যাটি {th} গুণ বড় হয়।',
    mis_unit_hundred: '{h} নয়, {th} দিয়ে গুণ করতে হয়।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Density: mass per unit volume',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Density',
    u_gm: 'gm',
    u_cc: 'cc',
    u_gcc: 'gm/cc',
    u_kgm3: 'kg/m<sup>3</sup>',

    examples: 'What to look at',
    ex_cork: 'Cork',
    ex_wood: 'Wood',
    ex_iron: 'Iron',
    ex_box: 'Box of particles',
    res: '{v}',

    act_drop_cork: 'Drop the cork ball in',
    act_drop_wood: 'Drop the wooden ball in',
    act_drop_iron: 'Drop the iron ball in',
    act_box: 'See the box of particles',
    act_squeeze: 'Squeeze the box',
    act_expand: 'Make the box big again',
    act_home: 'Back to the start',

    law_label: 'Density = mass ÷ volume: ρ = m/V',
    name_rho: 'density',
    name_m: 'mass',
    name_V: 'volume',
    sum_mv: '<span class="c-m">{m}&nbsp;{u_gm}</span> ÷ <span class="c-V">{V}&nbsp;{u_cc}</span>',
    sum_rho: '= <b>{r}&nbsp;{u_gcc}</b>',
    sum_kg: '= {k}&nbsp;{u_kgm3}',

    out_ready: 'The three balls have the same volume, <b class="c-V">{V}&nbsp;{u_cc}</b>; their masses differ',
    out_falling: 'Watch where the ball stops in the water…',
    out_cork: 'Cork <b>floats</b>: far less dense than water ({w}&nbsp;{u_gcc})',
    out_wood: 'Wood <b>floats</b>, about half under: less dense than water',
    out_iron: 'Iron <b>sinks</b>: denser than water ({w}&nbsp;{u_gcc})',
    out_box: '{n} particles (drawn large), mass <b class="c-m">{m}&nbsp;{u_gm}</b>',
    out_squeezing: 'The particles are coming closer…',
    out_expanding: 'The particles are spreading out…',
    out_half: 'The same mass in half the volume: <b>twice</b> the density',
    out_less: 'The same mass in less volume: <b>more</b> density',
    out_more: 'The same mass in more volume: <b>less</b> density',
    out_back: 'The volume is {V}&nbsp;{u_cc} again: the density is <b>{r}&nbsp;{u_gcc}</b> again',

    rule_start:
      '<b>Density is the mass per unit volume:</b> if a body’s mass is m and its volume V, its density is ρ = m/V. Density is measured in kg/m<sup>3</sup> or gm/cc.',
    rule_water: '<b>Water’s density is {w}&nbsp;{u_gcc}</b> (the book’s table). A ball less dense than that floats in water; a denser one sinks.',
    rule_same_v:
      '<b>For the same volume, the more mass, the more density:</b> cork ({a}) &lt; wood ({b}) &lt; iron ({c}), all in gm/cc. {one}&nbsp;{u_gcc} = {k}&nbsp;{u_kgm3}.',
    rule_box:
      '<b>Now the same mass in a different volume:</b> the particles in the box stay the same, so the mass does not change; only the volume does. Watch the density.',
    rule_squeeze:
      '<b>For the same mass, less volume means more density:</b> half the volume, twice the density. The book says: heating or cooling changes a substance’s volume but not its mass, so its density changes with temperature.',

    lbl_ball: '{name}<br><span class="c-m">{m}&nbsp;{u_gm}</span>',
    lbl_m: 'm = {m}&nbsp;{u_gm}',
    lbl_V: 'V = {V}&nbsp;{u_cc}',
    lbl_quiz: '<b>{x}</b> <span class="c-m">{m}&nbsp;{u_gm}</span><br><span class="c-V">{V}&nbsp;{u_cc}</span>',
    lbl_letter: '<b>{x}</b>',
    letters: 'A,B,C,D',

    hint_wait: 'Watch until the ball stops in the water.',
    hint_in: 'It is in the water already; “Back to the start” brings it out.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The right answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Great! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The picture is locked during the test. Pick an answer from the picture.',

    q_box: 'The mass m of the particles and the volume V of the box are written on the picture. What is the particles’ density?',
    why_box: '<b>{r}&nbsp;{u_gcc}</b>: ρ = m/V = {m}&nbsp;{u_gm} ÷ {V}&nbsp;{u_cc}.',
    mis_box_flip: 'That is V ÷ m; density is mass ÷ volume.',
    mis_box_times: 'That is m × V; density divides the mass by the volume.',
    mis_box_kg: 'That is right in kg/m<sup>3</sup>, not in gm/cc.',

    q_order: 'The three balls are the same size and colour. See where each one is in the water. Which ball has the greatest density?',
    c_equal: 'All three are equally dense',
    why_order: '<b>{x}</b>: it sank, so it is denser than water; the other two float.',
    mis_order_float: '{x} floats, so it is less dense than water.',
    mis_order_equal: 'The same volume, but different masses: the three balls stopped in three places.',

    q_sink: 'The mass and volume of four painted balls are written on the picture. Which ball will sink in water?',
    why_sink: '<b>{x}</b>: ρ = {m}&nbsp;{u_gm} ÷ {V}&nbsp;{u_cc} = {r}&nbsp;{u_gcc}, more than water’s.',
    mis_sink_heavy: '{x} has the most mass, but a big volume too: {r}&nbsp;{u_gcc}, so it floats.',
    mis_sink_other: '{x}’s density is {r}&nbsp;{u_gcc}, less than water’s.',

    q_heat: 'The particles in the box on the picture are heated: the volume doubles and the mass stays the same. What is the density now?',
    why_heat: '<b>{r}&nbsp;{u_gcc}</b>: ρ = {m}&nbsp;{u_gm} ÷ {V2}&nbsp;{u_cc}; twice the volume, half the density.',
    mis_heat_double: 'More volume does not raise the density, it lowers it: the volume divides.',
    mis_heat_same: 'The mass is the same, but the volume changed, so the density changes too.',
    mis_heat_quarter: 'The volume doubled; it did not become four times.',

    q_unit: 'The ball’s mass and volume are written on the picture. What is its density in kg/m³?',
    why_unit: '<b>{k}&nbsp;{u_kgm3}</b>: {m}&nbsp;{u_gm} ÷ {V}&nbsp;{u_cc} = {g}&nbsp;{u_gcc}; {one}&nbsp;{u_gcc} = {th}&nbsp;{u_kgm3}.',
    mis_unit_same: 'That is the number in gm/cc; for kg/m<sup>3</sup> multiply by {th}.',
    mis_unit_div: 'The wrong way: in kg/m<sup>3</sup> the number is {th} times bigger.',
    mis_unit_hundred: 'Multiply by {th}, not {h}.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a unit) is put in.
 */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
