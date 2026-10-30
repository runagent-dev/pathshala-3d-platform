// Every string the figure shows, in Bangla (in the book's words, page 120, ৪.৭: ক্ষমতা, কাজ করার হার, t সময়ে W কাজ,
// শক্তির রূপান্তর, শক্তির রূপান্তরের হার, ক্ষমতার একক W (ওয়াট), ক্ষমতার মাত্রা [P] = ML²T⁻³, প্রতি সেকেন্ডে 1 J,
// 100 W এর একটা বাতি, শক্তি ব্যয়, 1000 MW নিউক্লিয়ার বিদ্যুৎকেন্দ্র, বিদ্যুৎশক্তি উৎপন্ন) and English. Units are the
// book's Latin symbols (kg, m, s, J, W, ms⁻²). Use t('key', vars) in code, and t.num() for numbers (Bangla digits when
// the language is Bangla). No-break spaces ( ) keep a number with its unit. Powers of ten come in as HTML vars
// ({p6} = '10<sup>6</sup>'), so their digits follow the language too.

export const STRINGS = {
  bn: {
    title: 'ক্ষমতা',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ক্ষমতা',

    // the examples (one row of words)
    examples: 'উদাহরণ',
    ex_work: 'একই কাজ',
    ex_time: 'একই সময়',
    ex_bulb: 'বাতি',

    // the action (the big button and the numbered ring on the pumps or the bulb)
    act_run: 'পাম্প দুটি চালু করো',
    act_try_time: 'একই সময় চালিয়ে দেখো',
    act_try_bulb: 'বাতি জ্বালিয়ে দেখো',
    act_try_work: 'একই কাজে ফিরে দেখো',
    act_bulb: 'বাতি জ্বালাও',
    act_again: 'আবার চালাও',
    act_home: 'শুরুতে ফেরাও',

    // the result: P = W ÷ t for each pump (or the bulb), a column per symbol
    col_W: 'কাজ',
    col_t: 'সময়',
    col_P: 'ক্ষমতা',
    pump_small: 'ছোট পাম্প',
    pump_big: 'বড় পাম্প',
    of_small: 'ছোট পাম্পের',
    of_big: 'বড় পাম্পের',
    row_bulb: 'বাতি',
    row_plant: 'বিদ্যুৎকেন্দ্র',
    calc: 'ক্ষমতার হিসাব: P = W ÷ t',

    // the rule line: the book's words in <b>, growing with what the student has found out
    rule_work_ready: 'দুটি পাম্পই {m} kg পানি {h} m উপরে তুলবে, <b>একই কাজ</b>: W = mgh = {m} kg × {g} ms<sup>−2</sup> × {h} m = {W} J। কোনটি কম সময় নেয়?',
    rule_work_run: 'পানি উঠছে। দুটি স্টপওয়াচ দেখো: কোন ট্যাংক আগে ভরে?',
    rule_work_done: '<b>একই কাজ</b> বড় পাম্প অর্ধেক সময়ে করল, তাই তার <b>ক্ষমতা</b> দ্বিগুণ। <b>ক্ষমতা হচ্ছে কাজ করার হার:</b> t সময়ে W কাজ হলে P = W/t।',
    rule_time_ready: 'এবার দুটি পাম্পই <b>একই সময়</b>, {T} s করে চলবে। কোনটি বেশি পানি তোলে, মানে বেশি কাজ করে, দেখো।',
    rule_time_run: 'একই সময়ে বড় পাম্পের ট্যাংকে পানি দ্বিগুণ দ্রুত উঠছে।',
    rule_time_done: 'একই সময়ে বড় পাম্প দ্বিগুণ পানি তুলল, <b>দ্বিগুণ কাজ</b>। কাজ করা মানে শক্তির রূপান্তর, তাই <b>ক্ষমতা হচ্ছে শক্তির রূপান্তরের হার।</b>',
    rule_bulb_ready: 'বাতির গায়ে লেখা {P} W। জ্বালালে প্রতি সেকেন্ডে কত শক্তি ব্যয় হয়, দেখো।',
    rule_bulb_run: 'বাতিতে <b>প্রতি সেকেন্ডে {P} J</b> বিদ্যুৎশক্তি ব্যয় হচ্ছে, আলো আর তাপ হয়ে।',
    rule_bulb_done: '<b>ক্ষমতার একক W (ওয়াট):</b> প্রতি সেকেন্ডে {one} J কাজ বা শক্তির রূপান্তর হলে ক্ষমতা {one} W। মাত্রা [P] = ML<sup>2</sup>T<sup>−3</sup>।',

    // labels on the picture
    l_h: 'h = {h} m',
    l_time: '{t} s',
    l_mass: '{m} kg পানি',
    l_P: '{P} W',
    l_bulb: '{P} W বাতি',
    l_energy: '{E} J',
    note: 'সময় {k} গুণ দ্রুত দেখানো · আদর্শ পাম্প (শক্তির অপচয় নেই)',
    note_short: 'সময় {k} গুণ দ্রুত · আদর্শ পাম্প',
    note_bulb: 'সময় প্রকৃত',

    // the test
    q_count: 'প্রশ্ন {i}/{n}',
    q_score: 'ঠিক: {right}',
    q_hint: 'ছবিটা দেখো, ভাবো, তারপর একটি উত্তর বেছে নাও।',
    q_right: 'ঠিক!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি ঠিক',
    q_great: 'চমৎকার, সব ঠিক!',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় দৃশ্য বদলানো যায় না। ছবি দেখে উত্তর বেছে নাও।',

    q_P: '{name} ট্যাংকটি ভরল। ছবি থেকে পানির ভর, উচ্চতা h আর সময় পড়ো: পাম্পটির ক্ষমতা কত? (g = {g} ধরো)',
    r_P: '<b>{P} W</b>: কাজ W = mgh = {m} kg × {g} ms<sup>−2</sup> × {h} m = {W} J, তাই P = W/t = {W} J ÷ {t} s = {P} W।',
    p_other: 'অন্য পাম্পের স্টপওয়াচের সময় নেওয়া হয়েছে।',
    p_noT: 'এটা কাজ W, ক্ষমতা নয়: সময় t দিয়ে ভাগ করতে হবে।',
    p_noG: 'g বাদ পড়েছে: পানির ওজন mg, তাই W = mgh।',
    p_mul: 'W কে t দিয়ে গুণ করা হয়েছে; ক্ষমতা P = W ÷ t।',
    p_noH: 'উচ্চতা h বাদ পড়েছে: W = mgh।',

    q_same: 'দুটি পাম্প একই সময়, {T} s করে চলেছে। ট্যাংকের পানি দেখো: কোনটি ঠিক?',
    c_same_right: 'বড় পাম্পের কাজ দ্বিগুণ, তাই ক্ষমতাও দ্বিগুণ',
    c_same_eq: 'একই সময় চলেছে, তাই ক্ষমতা সমান',
    c_same_work: 'উচ্চতা h সমান, তাই কাজও সমান',
    c_same_half: 'বড় পাম্পের কাজ দ্বিগুণ, কিন্তু ক্ষমতা সমান',
    r_same: '<b>বড় পাম্পের ক্ষমতা দ্বিগুণ</b>: একই {T} s-এ বড় পাম্প {mb} kg আর ছোট পাম্প {ms} kg পানি তুলেছে, দ্বিগুণ কাজ। একই সময়ে বেশি কাজ মানে বেশি ক্ষমতা।',
    m_same_eq: 'সময় সমান, কিন্তু কাজ সমান নয়; ক্ষমতা = কাজ ÷ সময়।',
    m_same_work: 'উচ্চতা সমান, কিন্তু পানির ভর আলাদা: W = mgh।',
    m_same_half: 'একই সময়ে দ্বিগুণ কাজ মানে দ্বিগুণ হার, দ্বিগুণ ক্ষমতা।',

    q_bulb: 'বাতিটি স্টপওয়াচে দেখানো সময় ধরে জ্বলেছে। ছবি দেখে বলো: বাতিতে কত শক্তি ব্যয় হয়েছে?',
    r_bulb: '<b>{E} J</b>: {P} W বাতিতে প্রতি সেকেন্ডে {P} J শক্তি ব্যয় হয়; {t} s-এ {P} × {t} = {E} J।',
    e_one: 'এটা মাত্র {one} সেকেন্ডের শক্তি; t সেকেন্ডে P × t।',
    e_add: 'ক্ষমতা আর সময় যোগ করা হয়েছে; শক্তি = P × t।',
    e_div: 'ক্ষমতাকে সময় দিয়ে ভাগ করা হয়েছে; শক্তি = P × t।',
    e_min: 'সময়কে মিনিট ধরে {sixty} দিয়ে গুণ করা হয়েছে; সময় সেকেন্ডেই দেওয়া।',

    q_unit: '{name} ক্ষমতা {P} W। এর অর্থ কী?',
    c_u_right: 'প্রতি সেকেন্ডে {P} J শক্তির রূপান্তর',
    c_u_total: 'সব মিলিয়ে {P} J কাজ করতে পারে',
    c_u_kg: 'প্রতি সেকেন্ডে {P} kg পানি তোলে',
    c_u_time: 'ট্যাংক ভরতে {P} s লাগে',
    r_unit: '<b>প্রতি সেকেন্ডে {P} J শক্তির রূপান্তর</b>: {one} W মানে প্রতি সেকেন্ডে {one} J কাজ। পাম্পটি প্রতি সেকেন্ডে {P} J বিদ্যুৎশক্তিকে পানির শক্তিতে রূপান্তর করে।',
    m_u_total: 'W (ওয়াট) হার বোঝায়: প্রতি সেকেন্ডে কত J, সব মিলিয়ে নয়।',
    m_u_kg: 'J শক্তির একক, kg ভরের; প্রতি সেকেন্ডে কত পানি ওঠে তা উচ্চতা h-এর উপরও নির্ভর করে।',
    m_u_time: 'W সময়ের একক নয়; সময় লাগে কাজ ÷ ক্ষমতা।',

    q_plant: 'খবরের কাগজে লেখা: দেশে {MW} MW নিউক্লিয়ার বিদ্যুৎকেন্দ্র তৈরি হবে। সেটি প্রতি সেকেন্ডে কত বিদ্যুৎশক্তি উৎপন্ন করবে?',
    c_pl_right: '{MW} × {p6} J',
    c_pl_M: '{MW} J',
    c_pl_k: '{MW} × {p3} J',
    c_pl_W: '{MW} × {p6} W',
    r_plant: '<b>{MW} × {p6} J</b>: M (মেগা) মানে {p6}, তাই {MW} MW = {MW} × {p6} W, অর্থাৎ প্রতি সেকেন্ডে {MW} × {p6} J।',
    m_pl_M: 'M (মেগা) বাদ পড়েছে: M মানে {p6}।',
    m_pl_k: 'M (মেগা) মানে {p6}; {p3} হলো k (কিলো)।',
    m_pl_W: 'প্রতি সেকেন্ডের শক্তি J-এ; W হলো ক্ষমতার একক।',
  },

  en: {
    title: 'Power',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn it',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Power',

    examples: 'Examples',
    ex_work: 'Same work',
    ex_time: 'Same time',
    ex_bulb: 'Bulb',

    act_run: 'Switch both pumps on',
    act_try_time: 'Now run them for the same time',
    act_try_bulb: 'Now switch the bulb on',
    act_try_work: 'Back to the same work',
    act_bulb: 'Switch the bulb on',
    act_again: 'Run again',
    act_home: 'Back to the start',

    col_W: 'Work',
    col_t: 'Time',
    col_P: 'Power',
    pump_small: 'Small pump',
    pump_big: 'Big pump',
    of_small: 'small pump',
    of_big: 'big pump',
    row_bulb: 'Bulb',
    row_plant: 'Power plant',
    calc: 'Working out the power: P = W ÷ t',

    rule_work_ready:
      'Both pumps will lift {m} kg of water {h} m up, <b>the same work</b>: W = mgh = {m} kg × {g} ms<sup>−2</sup> × {h} m = {W} J. Which one takes less time?',
    rule_work_run: 'The water is rising. Watch both stopwatches: which tank fills first?',
    rule_work_done:
      'The big pump did <b>the same work</b> in half the time, so its <b>power</b> is twice as much. <b>Power is the rate of doing work:</b> W work in time t means P = W/t.',
    rule_time_ready: 'Now both pumps run for <b>the same time</b>, {T} s each. Which lifts more water, so does more work?',
    rule_time_run: 'In the same time, the big pump’s tank fills twice as fast.',
    rule_time_done:
      'In the same time the big pump lifted twice the water: <b>twice the work</b>. Doing work means converting energy, so <b>power is the rate of converting energy.</b>',
    rule_bulb_ready: 'The bulb says {P} W. Switch it on and see how much energy it uses each second.',
    rule_bulb_run: 'The bulb uses <b>{P} J of electrical energy each second</b>, as light and heat.',
    rule_bulb_done:
      '<b>The unit of power is the W (watt):</b> {one} J of work, or of energy converted, each second is a power of {one} W. Dimension [P] = ML<sup>2</sup>T<sup>−3</sup>.',

    l_h: 'h = {h} m',
    l_time: '{t} s',
    l_mass: '{m} kg water',
    l_P: '{P} W',
    l_bulb: '{P} W bulb',
    l_energy: '{E} J',
    note: 'Time shown {k} times faster · ideal pumps (no energy lost)',
    note_short: 'Time × {k} · ideal pumps',
    note_bulb: 'Real time',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The scene stays put during the test. Read the picture and pick an answer.',

    q_P: 'The {name}’s tank is full. Read the mass of water, the height h and the time off the picture: what is the pump’s power? (take g = {g})',
    r_P: '<b>{P} W</b>: the work W = mgh = {m} kg × {g} ms<sup>−2</sup> × {h} m = {W} J, so P = W/t = {W} J ÷ {t} s = {P} W.',
    p_other: 'That is the other pump’s stopwatch.',
    p_noT: 'That is the work W, not the power: divide by the time t.',
    p_noG: 'g is missing: the water’s weight is mg, so W = mgh.',
    p_mul: 'W was multiplied by t; power is P = W ÷ t.',
    p_noH: 'The height h is missing: W = mgh.',

    q_same: 'Both pumps ran for the same time, {T} s each. Look at the tanks: which is right?',
    c_same_right: 'Big pump: twice the work, so twice the power',
    c_same_eq: 'Same time, so the same power',
    c_same_work: 'Same height h, so the same work',
    c_same_half: 'Big pump: twice the work, but the same power',
    r_same:
      '<b>The big pump has twice the power</b>: in the same {T} s it lifted {mb} kg and the small one {ms} kg, twice the work. More work in the same time means more power.',
    m_same_eq: 'The time is the same, the work is not; power = work ÷ time.',
    m_same_work: 'The height is the same, but not the mass of water: W = mgh.',
    m_same_half: 'Twice the work in the same time is twice the rate: twice the power.',

    q_bulb: 'The bulb was on for the time on the stopwatch. From the picture: how much energy did it use?',
    r_bulb: '<b>{E} J</b>: a {P} W bulb uses {P} J each second; in {t} s, {P} × {t} = {E} J.',
    e_one: 'That is the energy of just {one} second; in t seconds it is P × t.',
    e_add: 'Power and time were added; energy = P × t.',
    e_div: 'Power was divided by time; energy = P × t.',
    e_min: 'The time was taken as minutes (× {sixty}); it is already in seconds.',

    q_unit: 'The {name}’s power is {P} W. What does that mean?',
    c_u_right: '{P} J of energy converted each second',
    c_u_total: '{P} J of work in all',
    c_u_kg: '{P} kg of water lifted each second',
    c_u_time: 'The tank fills in {P} s',
    r_unit:
      '<b>{P} J of energy converted each second</b>: {one} W means {one} J of work each second. The pump turns {P} J of electrical energy into the water’s energy each second.',
    m_u_total: 'The watt is a rate: joules each second, not in all.',
    m_u_kg: 'J is energy, kg is mass; how much water rises each second also depends on the height h.',
    m_u_time: 'W is not a unit of time; the time taken is work ÷ power.',

    q_plant: 'The newspaper says a {MW} MW nuclear power plant will be built. How much electrical energy will it produce each second?',
    c_pl_right: '{MW} × {p6} J',
    c_pl_M: '{MW} J',
    c_pl_k: '{MW} × {p3} J',
    c_pl_W: '{MW} × {p6} W',
    r_plant: '<b>{MW} × {p6} J</b>: M (mega) means {p6}, so {MW} MW = {MW} × {p6} W, that is {MW} × {p6} J each second.',
    m_pl_M: 'The M (mega) was left out: M means {p6}.',
    m_pl_k: 'M (mega) means {p6}; {p3} is k (kilo).',
    m_pl_W: 'Energy each second is in J; the W is the unit of power.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/** Bangladeshi grouping: 48000 → "48,000", 150000 → "1,50,000". */
export function group(n) {
  const [whole, frac] = String(n).split('.');
  const neg = whole.startsWith('-');
  const digits = neg ? whole.slice(1) : whole;
  let out = digits;
  if (digits.length > 3) {
    const head = digits.slice(0, -3);
    out = `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${digits.slice(-3)}`;
  }
  return `${neg ? '-' : ''}${out}${frac ? `.${frac}` : ''}`;
}

/** t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    const all = { z: 0, one: 1, sixty: 60, p6: '10<sup>6</sup>', p3: '10<sup>3</sup>', ...vars }; // so they follow the digits too
    s = s.replace(/\{(\w+)\}/g, (m, k) => (k in all ? num(all[k]) : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
