// Every string the figure shows, in Bangla (in the book's words, page 100, ৪.১: কাজ, বল প্রয়োগ, বলের দিকে, দূরত্ব,
// সরণ, অতিক্রম, ঠেলে নিয়ে, ছেড়ে দেওয়া, কাজের পরিমাণ W = Fs, কাজের একক J (জুল), দারোয়ান, পদার্থবিজ্ঞানের ভাষায়)
// and English. Units are the book's Latin symbols (N, m, J). Use t('key', vars) in code, and t.num() for numbers
// (Bangla digits when the language is Bangla). No-break spaces ( ) keep a number with its unit.

export const STRINGS = {
  bn: {
    title: 'কাজ',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'কাজ',

    u_N: 'N',
    u_m: 'm',
    u_J: 'J',

    // the examples (one row of words)
    examples: 'উদাহরণ',
    ex_push: 'ঠেলে ছেড়ে দাও',
    ex_wall: 'দেয়ালে ঠেলা',
    res_J: '{W} J',

    // the calculator: tap steppers for F and s
    calc: 'কাজের হিসাব',
    calc_F: 'বল F',
    calc_s: 'সরণ s',
    F_down: 'বল কমাও',
    F_up: 'বল বাড়াও',
    s_down: 'সরণ কমাও',
    s_up: 'সরণ বাড়াও',
    s_fixed: 'দেয়ালের জন্য বাক্সটি সরতে পারে না: s = {z}',

    // the action (the big button and the numbered ring on the crate)
    act_push: 'বাক্সটি ঠেলো',
    act_again: 'আবার ঠেলো',
    act_wall: 'জোরে ঠেলো',
    act_try_wall: 'দেয়ালে ঠেলে দেখো',
    act_try_push: 'ঠেলে ছেড়ে দাও',
    act_home: 'শুরুতে ফেরাও',

    // the result line: the number that matters in <b>
    out_ready: 'কাজ W = Fs = {F} N × {s} m = <b>?</b>',
    out_work: 'কাজ W = Fs = {F} N × {s} m = <b>{W} J</b>',

    // the rule line: the book's words in <b>, growing with what the student has found out
    rule_ready: 'বাক্সটিকে {s} m ঠেলে নিয়ে ছেড়ে দেওয়া হবে। দেখো, কখন কাজ হয় আর কখন হয় না।',
    rule_push: '<b>বল প্রয়োগ করা হচ্ছে, আর বাক্সটি বলের দিকে সরছে:</b> তাই কাজ হচ্ছে, W বাড়ছে।',
    rule_slide: 'হাত ছেড়ে দেওয়া হয়েছে: <b>এখন F বল প্রয়োগ করা হচ্ছে না।</b> বাক্সটি সরছে, কিন্তু W আর বাড়ছে না।',
    rule_done: '<b>কাজের পরিমাণ W = Fs</b>, একক J (জুল)। পরের d = {d} m দূরত্ব অতিক্রম করার সময় F বল প্রয়োগ করা হয়নি বলে <b>F বল দ্বারা কোনো কাজ হয়নি।</b>',
    rule_calc: '<b>W = Fs:</b> F দ্বিগুণ হলে কাজও দ্বিগুণ, s দ্বিগুণ হলেও তাই। পদার্থবিজ্ঞানের ভাষায় <b>বল কাজ করে</b>, মানুষ নয়।',
    rule_wall_ready: 'বাক্সটি দেয়ালে ঠেকে আছে। খুব জোরে ঠেলে দেখো, কাজ হয় কি না।',
    rule_wall_push: 'জোরে বল প্রয়োগ করা হচ্ছে, কিন্তু বাক্সটি একটুও সরছে না…',
    rule_wall_done:
      '<b>সরণ s = {z}, তাই W = F × {z} = {z}।</b> যত জোরেই ঠেলো, বাক্সটি না সরলে কাজ হয় না। সারা দিন পাহারা দেওয়া দারোয়ানের মতো: <b>পদার্থবিজ্ঞানের ভাষায় সেটি কোনো কাজ নয়।</b>',

    // labels on the picture
    l_F: 'F = {F} N',
    l_s: 's = {s} m',
    l_s0: 's = {z}',
    l_d: 'd = {d} m <small>(F নেই)</small>',
    l_s_only: 's',
    l_d_only: 'd',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    // 1: which part of the trip F did work in
    q_part: 'বাক্সটিকে ঠেলে নিয়ে ছেড়ে দেওয়া হলো, তারপর এটি আরো খানিকটা গিয়ে থামল। ছবির কোন পথে F বল কাজ করেছে?',
    c_s: 'শুধু s পথে',
    c_d: 'শুধু d পথে',
    c_both: 's ও d দুই পথেই',
    c_none: 'কোনো পথেই নয়',
    r_part: '<b>শুধু s পথে</b>: বল প্রয়োগ আর বলের দিকে সরণ, দুটোই ছিল শুধু s পথে। d পথে হাত ছিল না, তাই F বল দ্বারা কোনো কাজ হয়নি।',
    m_d: 'd পথে হাত বাক্সটিতে ছিল না, তাই সেখানে F বলই ছিল না।',
    m_both: 'বাক্সটি d পথেও সরেছে, কিন্তু তখন F বল প্রয়োগ করা হয়নি।',
    m_none: 's পথে বল আর বলের দিকে সরণ দুটোই ছিল, তাই সেখানে কাজ হয়েছে।',

    // 2: W from F and s read off the tape
    q_W: 'বাক্সটিকে F = {F} N বলে ঠেলে নিয়ে ছেড়ে দেওয়া হলো; এটি আরো খানিকটা গিয়ে থামল। ফিতা দেখে বলো, F বল কত কাজ করল?',
    r_W: '<b>{W} J</b>: হাত ছিল শুধু s = {s} m পথে, তাই W = Fs = {F} N × {s} m = {W} J। পরের d = {d} m পথে F ছিল না।',
    w_sd: 'ছেড়ে দেওয়ার পরের d পথও গোনা হয়েছে; তখন F বল ছিল না।',
    w_add: 'F আর s যোগ করা হয়েছে; কাজ হলো গুণফল, W = F × s।',
    w_d: 'শুধু d পথ নেওয়া হয়েছে; F কাজ করেছে ঠেলার s পথে।',
    w_div: 'F-কে s দিয়ে ভাগ করা হয়েছে; কাজ W = F × s।',

    // 3: the wall, pushed for minutes
    q_wall: 'লোকটি {F} N বলে {min} মিনিট ধরে বাক্সটিকে ঠেলছে। ছবি দেখে বলো, F বল কত কাজ করল?',
    r_wall: '<b>{z} J</b>: দেয়ালের জন্য বাক্সটি একটুও সরেনি, s = {z}। তাই W = F × {z} = {z}, যত সময় ধরেই ঠেলুক।',
    t_min: 'বল × সময় (মিনিট) নেওয়া হয়েছে; কাজ সময় দিয়ে হিসাব হয় না, W = F × s, আর s = {z}।',
    t_sec: 'বল × সময় (সেকেন্ড) নেওয়া হয়েছে; কাজ সময় দিয়ে হিসাব হয় না, W = F × s, আর s = {z}।',
    t_one: 'বাক্সটি সরেনি, তাই s = {z}, {one} m নয়।',

    // 4: F from W and s read off the tape
    q_F: 'বাক্সটিকে ঠেলে নিয়ে ছেড়ে দেওয়া হলো। বল দিয়ে {W} J কাজ হয়েছে। ফিতা দেখে বলো, বল F কত ছিল?',
    r_F: '<b>{F} N</b>: বল ছিল শুধু s = {s} m পথে। W = Fs থেকে F = W ÷ s = {W} J ÷ {s} m = {F} N।',
    f_sd: 's + d দিয়ে ভাগ করা হয়েছে; d পথে বল ছিল না।',
    f_mul: 'W-কে s দিয়ে গুণ করা হয়েছে; F = W ÷ s।',
    f_d: 'd দিয়ে ভাগ করা হয়েছে; বল ছিল s পথে।',
    f_sub: 'W থেকে s বিয়োগ করা হয়েছে; F = W ÷ s।',

    // 5: the unit
    q_unit: 'ছবিতে বল F নিউটনে (N) আর দূরত্ব s মিটারে (m) মাপা। তাহলে কাজ W-এর একক কী?',
    c_J: 'J (জুল)',
    c_N: 'N (নিউটন)',
    c_W: 'W (ওয়াট)',
    c_m: 'm (মিটার)',
    r_unit: '<b>J (জুল)</b>: W = Fs, তাই একক N × m = J। {one} N বল কোনো বস্তুকে বলের দিকে {one} m সরালে {one} J কাজ হয়।',
    u_N_why: 'নিউটন বলের একক; কাজ = বল × দূরত্ব, তাই N × m = J।',
    u_W_why: 'W কাজের প্রতীক, একক নয়; কাজের একক জুল (J)।',
    u_m_why: 'মিটার দূরত্বের একক; কাজের একক N × m = J।',
  },
  en: {
    title: 'Work',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Work',

    u_N: 'N',
    u_m: 'm',
    u_J: 'J',

    examples: 'Examples',
    ex_push: 'Push, let go',
    ex_wall: 'Push a wall',
    res_J: '{W} J',

    calc: 'Work out the work',
    calc_F: 'Force F',
    calc_s: 'Displacement s',
    F_down: 'Less force',
    F_up: 'More force',
    s_down: 'Shorter push',
    s_up: 'Longer push',
    s_fixed: 'The wall stops the crate: s = {z}',

    act_push: 'Push the crate',
    act_again: 'Push again',
    act_wall: 'Push hard',
    act_try_wall: 'Now push it against a wall',
    act_try_push: 'Push it and let go',
    act_home: 'Back to the start',

    out_ready: 'Work W = Fs = {F} N × {s} m = <b>?</b>',
    out_work: 'Work W = Fs = {F} N × {s} m = <b>{W} J</b>',

    rule_ready: 'The crate will be pushed {s} m and then let go. Watch when work is done, and when it is not.',
    rule_push: '<b>A force is applied and the crate moves along it:</b> so work is being done, W grows.',
    rule_slide: 'The hands have let go: <b>no force F is applied now.</b> The crate still moves, but W stops growing.',
    rule_done:
      '<b>The work done is W = Fs</b>, in J (joules). Over the next d = {d} m no force F was applied, so <b>the force F did no work there.</b>',
    rule_calc: '<b>W = Fs:</b> twice the force, twice the work; twice the distance, the same. In physics <b>a force does work</b>, not a person.',
    rule_wall_ready: 'The crate is up against a wall. Push it very hard and see whether any work is done.',
    rule_wall_push: 'A big force is applied, but the crate does not move at all…',
    rule_wall_done:
      '<b>Displacement s = {z}, so W = F × {z} = {z}.</b> However hard you push, no movement means no work. Like the guard who watches the gate all day: <b>in physics that is no work.</b>',

    l_F: 'F = {F} N',
    l_s: 's = {s} m',
    l_s0: 's = {z}',
    l_d: 'd = {d} m <small>(no F)</small>',
    l_s_only: 's',
    l_d_only: 'd',

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

    q_part: 'The crate was pushed, then let go, and it slid a little further before it stopped. Over which part did the force F do work?',
    c_s: 'Only over s',
    c_d: 'Only over d',
    c_both: 'Over both s and d',
    c_none: 'Over neither',
    r_part: '<b>Only over s</b>: the force and a movement along it were both there only over s. Over d the hands were off, so F did no work.',
    m_d: 'Over d the hands were off the crate, so there was no force F.',
    m_both: 'The crate also moved over d, but no force F was applied then.',
    m_none: 'Over s there was a force and a movement along it, so work was done.',

    q_W: 'The crate was pushed with F = {F} N and let go; it slid a little further. Read the tape: how much work did F do?',
    r_W: '<b>{W} J</b>: the hands were on only over s = {s} m, so W = Fs = {F} N × {s} m = {W} J. Over the next d = {d} m there was no F.',
    w_sd: 'The slide d after letting go was counted too; there was no force then.',
    w_add: 'F and s were added; work is the product, W = F × s.',
    w_d: 'Only the slide d was used; F did its work over the push s.',
    w_div: 'F was divided by s; work is W = F × s.',

    q_wall: 'The man pushes the crate with {F} N for {min} minutes. Look at the picture: how much work does F do?',
    r_wall: '<b>{z} J</b>: because of the wall the crate did not move at all, s = {z}. So W = F × {z} = {z}, however long he pushes.',
    t_min: 'Force × time (minutes) was used; work does not depend on time: W = F × s, and s = {z}.',
    t_sec: 'Force × time (seconds) was used; work does not depend on time: W = F × s, and s = {z}.',
    t_one: 'The crate did not move, so s = {z}, not {one} m.',

    q_F: 'The crate was pushed and let go. The force did {W} J of work. Read the tape: what was the force F?',
    r_F: '<b>{F} N</b>: the force acted only over s = {s} m. From W = Fs, F = W ÷ s = {W} J ÷ {s} m = {F} N.',
    f_sd: 'Divided by s + d; there was no force over d.',
    f_mul: 'W was multiplied by s; F = W ÷ s.',
    f_d: 'Divided by d; the force acted over s.',
    f_sub: 's was taken from W; F = W ÷ s.',

    q_unit: 'In the picture the force F is in newtons (N) and the distance s in metres (m). What is the unit of the work W?',
    c_J: 'J (joule)',
    c_N: 'N (newton)',
    c_W: 'W (watt)',
    c_m: 'm (metre)',
    r_unit: '<b>J (joule)</b>: W = Fs, so its unit is N × m = J. A force of {one} N moving something {one} m along it does {one} J of work.',
    u_N_why: 'The newton is the unit of force; work = force × distance, so N × m = J.',
    u_W_why: 'W is the symbol for work, not its unit; the unit of work is the joule (J).',
    u_m_why: 'The metre is the unit of distance; the unit of work is N × m = J.',
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
    const all = { z: 0, one: 1, ...vars }; // 0 and 1 in sentences, so they follow the digits too
    s = s.replace(/\{(\w+)\}/g, (m, k) => (k in all ? num(all[k]) : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
