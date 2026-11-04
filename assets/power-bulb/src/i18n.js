// Every string the figure shows, in Bangla (in the book's words, page 120, ৪.৭: ক্ষমতা, কাজ করার হার, t সময়ে W কাজ,
// শক্তির রূপান্তর, শক্তির রূপান্তরের হার, ক্ষমতার একক W (ওয়াট), ক্ষমতার মাত্রা [P] = ML²T⁻³, প্রতি সেকেন্ডে 1 J,
// 100 W এর একটা বাতি, শক্তি ব্যয়, 1000 MW নিউক্লিয়ার বিদ্যুৎকেন্দ্র, বিদ্যুৎশক্তি উৎপন্ন) and English. Units are the
// book's Latin symbols (kg, m, s, J, W, ms⁻²). Use t('key', vars) in code, and t.num() for numbers (Bangla digits when
// the language is Bangla). No-break spaces ( ) keep a number with its unit. Powers of ten come in as HTML vars
// ({p6} = '10<sup>6</sup>'), so their digits follow the language too.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'ক্ষমতা',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ক্ষমতা',

    // the examples (one row of words)

    // the action (the big button and the numbered ring on the pumps or the bulb)
    act_bulb: 'বাতি জ্বালাও',
    act_again: 'আবার চালাও',
    act_home: 'শুরুতে ফেরাও',

    // the result: P = W ÷ t for each pump (or the bulb), a column per symbol
    col_W: 'কাজ',
    col_t: 'সময়',
    col_P: 'ক্ষমতা',
    row_bulb: 'বাতি',
    row_plant: 'বিদ্যুৎকেন্দ্র',
    calc: 'ক্ষমতার হিসাব: P = W ÷ t',

    // the rule line: the book's words in <b>, growing with what the student has found out
    rule_bulb_ready: 'বাতির গায়ে লেখা {P} W। জ্বালালে প্রতি সেকেন্ডে কত শক্তি ব্যয় হয়, দেখো।',
    rule_bulb_run: 'বাতিতে <b>প্রতি সেকেন্ডে {P} J</b> বিদ্যুৎশক্তি ব্যয় হচ্ছে, আলো আর তাপ হয়ে। (সময় প্রকৃত।)',
    rule_bulb_done:
      'ক্ষমতার একক <b>W (ওয়াট)</b>। প্রতি সেকেন্ডে {one} J কাজ বা শক্তির রূপান্তর হলে ক্ষমতা {one} W। মাত্রা:<span class="pvc-formula">[<i>P</i>] = ML<sup>2</sup>T<sup>−3</sup></span>',

    // labels on the picture
    l_time: '{t} s',
    l_bulb: '{P} W বাতি',
    l_energy: '{E} J',

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

    q_bulb: 'বাতিটি স্টপওয়াচের সময় ধরে জ্বলেছে। বাতিতে কত শক্তি ব্যয় হয়েছে?',
    r_bulb: '<b>{E} J</b>: {P} W বাতিতে প্রতি সেকেন্ডে {P} J শক্তি ব্যয় হয়; {t} s-এ {P} × {t} = {E} J।',
    e_one: 'এটা মাত্র {one} সেকেন্ডের শক্তি; t সেকেন্ডে P × t।',
    e_add: 'ক্ষমতা আর সময় যোগ করা হয়েছে; শক্তি = P × t।',
    e_div: 'ক্ষমতাকে সময় দিয়ে ভাগ করা হয়েছে; শক্তি = P × t।',
    e_min: 'সময়কে মিনিট ধরে {sixty} দিয়ে গুণ করা হয়েছে; সময় সেকেন্ডেই দেওয়া।',

    q_unit: 'বাতিটির ক্ষমতা {P} W। এর অর্থ কী?',
    c_u_right: 'প্রতি সেকেন্ডে {P} J শক্তির রূপান্তর',
    c_u_total: 'সব মিলিয়ে {P} J কাজ করতে পারে',
    c_u_time: 'বাতিটি {P} s জ্বলে',
    r_unit: '<b>প্রতি সেকেন্ডে {P} J শক্তির রূপান্তর</b>: {one} W মানে প্রতি সেকেন্ডে {one} J কাজ।',
    m_u_total: 'W (ওয়াট) হার বোঝায়: প্রতি সেকেন্ডে কত J, সব মিলিয়ে নয়।',
    c_u_bright: 'অন্য বাতির চেয়ে {P} গুণ উজ্জ্বল',
    m_u_bright: 'W উজ্জ্বলতার একক নয়; এটি বলে প্রতি সেকেন্ডে কত J শক্তির রূপান্তর হয়।',
    m_u_time: 'W সময়ের একক নয়; সময় লাগে কাজ ÷ ক্ষমতা।',

    q_plant: 'দেশে {MW} MW নিউক্লিয়ার বিদ্যুৎকেন্দ্র হবে। সেটি প্রতি সেকেন্ডে কত বিদ্যুৎশক্তি উৎপন্ন করবে?',
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
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Power',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn it',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Power',

    act_bulb: 'Switch the bulb on',
    act_again: 'Run again',
    act_home: 'Back to the start',

    col_W: 'Work',
    col_t: 'Time',
    col_P: 'Power',
    row_bulb: 'Bulb',
    row_plant: 'Power plant',
    calc: 'Working out the power: P = W ÷ t',

    rule_bulb_ready: 'The bulb says {P} W. Switch it on and see how much energy it uses each second.',
    rule_bulb_run: 'The bulb uses <b>{P} J of electrical energy each second</b>, as light and heat. (Real time.)',
    rule_bulb_done:
      'The unit of power is the <b>W (watt)</b>. {one} J of work, or of energy converted, each second is a power of {one} W. Dimension:<span class="pvc-formula">[<i>P</i>] = ML<sup>2</sup>T<sup>−3</sup></span>',

    l_time: '{t} s',
    l_bulb: '{P} W bulb',
    l_energy: '{E} J',

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

    q_bulb: 'The bulb was on for the time on its stopwatch. How much energy did it use?',
    r_bulb: '<b>{E} J</b>: a {P} W bulb uses {P} J each second; in {t} s, {P} × {t} = {E} J.',
    e_one: 'That is the energy of just {one} second; in t seconds it is P × t.',
    e_add: 'Power and time were added; energy = P × t.',
    e_div: 'Power was divided by time; energy = P × t.',
    e_min: 'The time was taken as minutes (× {sixty}); it is already in seconds.',

    q_unit: 'The bulb’s power is {P} W. What does that mean?',
    c_u_right: '{P} J of energy converted each second',
    c_u_total: '{P} J of work in all',
    c_u_time: 'It glows for {P} s',
    r_unit: '<b>{P} J of energy converted each second</b>: {one} W means {one} J of work each second.',
    m_u_total: 'The watt is a rate: joules each second, not in all.',
    c_u_bright: '{P} times brighter than other bulbs',
    m_u_bright: 'The watt is not brightness; it says how many joules are converted each second.',
    m_u_time: 'W is not a unit of time; the time taken is work ÷ power.',

    q_plant: 'A {MW} MW nuclear power plant: how much electrical energy does it produce each second?',
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
