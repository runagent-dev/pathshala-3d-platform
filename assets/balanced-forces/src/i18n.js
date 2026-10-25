// Every string of the figure, in Bangla (the book's words, pages 69–70, 3.3: বল একটি ভেক্টর, সাম্যাবস্থা, অসাম্যাবস্থা,
// অসাম্য বল, লব্ধি বল, সম্মিলিত লব্ধি, শূন্য, ত্বরণ, পৃথিবীর আকর্ষণ বল, ওজন W, সুতার টান T, টান T₁ এবং T₂, অভিকর্ষ বল,
// মাধ্যাকর্ষণজনিত ত্বরণ, পেন্ডুলাম, দুলতে থাকবে, স্থির অবস্থা, নিষ্ক্রিয়, কাটাকাটি) and English. The page writes "ওপর" for
// "on (a body)" and "উপরের দিকে" for upward; so do we. The ball is called বস্তু, as on the page (বল is force).
// Use t('key') in code and t.num() for numbers; numbers inside sentences come in as {vars}. Units are the book's
// Latin SI symbols (N, kg, ms⁻², s) in every language, from UNITS: write {u_N} etc.

export const UNITS = { u_N: 'N', u_kg: 'kg', u_ms2: 'ms⁻²', u_s: 's' };

export const STRINGS = {
  bn: {
    title: 'বলের সাম্যাবস্থা ও অসাম্যাবস্থা',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'লব্ধি বল',

    scenes: 'উদাহরণ',
    chip_pendulum: 'সুতায় ঝোলানো বস্তু',
    chip_book: 'দড়িতে ঝোলানো বই',
    chip_fig: 'চিত্র {n}',

    st_balanced: 'সাম্যাবস্থা',
    st_unbalanced: 'অসাম্যাবস্থা',
    st_held: 'হাতে ধরা',
    res_zero: 'লব্ধি বল = {zero}, তাই ত্বরণ নেই',
    res_held: 'T ও W-এর লব্ধি = {r} {u_N}; হাত ধরে রেখেছে',
    res_swing: 'লব্ধি বল শূন্য নয়, তাই ত্বরণ আছে',
    res_fall: 'লব্ধি বল = W, তাই নিচের দিকে ত্বরণ g',
    res_landed: 'টেবিলের ঠেলা = W, তাই লব্ধি বল = {zero}',
    sum_aria: 'বলগুলোর তীর পরপর জুড়ে আঁকা: শেষ তীর শুরুতে ফিরলে লব্ধি শূন্য',

    say_rest: 'সুতার টান T খাড়া উপরের দিকে, ওজন W সোজা নিচের দিকে: দুটি বল পরস্পরকে নিষ্ক্রিয় করে সাম্যাবস্থার সৃষ্টি করেছে। বস্তুটিকে পাশে টেনে ছাড়ো, বা সুতা কাটো।',
    say_held: 'পাশে সরালে ওজন আর সুতার টান বিপরীত দিকে থাকে না; দুটি বল মিলে একটি লব্ধি বল হয়। ছেড়ে দেওয়া মাত্র এটি বস্তুটির ওপর কাজ করবে।',
    say_swing: 'ছেড়ে দেওয়া মাত্র লব্ধি বল কাজ করতে শুরু করেছে, তাই বস্তুটি দুলছে: অসাম্য বলের আরেকটি উদাহরণ। দোলার সময় লব্ধি কখনো শূন্য হয় না।',
    say_fall: 'সুতা কেটে দেওয়ায় টান T আর কাজ করছে না; শুধু ওজন W নিচের দিকে। এটিই অসাম্য বল: বস্তুটি মাধ্যাকর্ষণজনিত ত্বরণে নিচে পড়ছে।',
    say_landed: 'শুধু ওজন W, এই অসাম্য বলে বস্তুটি ক্রমেই দ্রুত পড়েছে (দাগগুলোর ফাঁক বেড়েছে)। এখন টেবিল ঠেলে ধরে রেখেছে: আবার সাম্যাবস্থা।',
    say_book: 'বইটির ওজন W এবং দড়ির দুই প্রান্তের দুটি টান T<sub>1</sub> এবং T<sub>2</sub> মিলে লব্ধি শূন্য, তাই বইটি স্থির। হাত দুটি টেনে দূরে সরিয়ে দেখো।',
    say_book_moved: 'দড়ি যত টানটান, T<sub>1</sub> ও T<sub>2</sub> তত বড়; তবু তিনটি বলের লব্ধি শূন্যই থাকে, বইটি স্থির। তিনটি বল মিলেও সাম্যাবস্থা তৈরি হয়।',

    lbl_T: 'সুতার টান T = {v} {u_N}',
    lbl_W: 'ওজন W = {v} {u_N}',
    lbl_R: 'লব্ধি বল = {v} {u_N}',
    lbl_T_q: 'সুতার টান T',
    lbl_T_ask: 'সুতার টান T = ?',
    lbl_W_q: 'ওজন W',
    lbl_W_fall: 'ওজন W: অসাম্য বল',
    lbl_zero: 'লব্ধি বল = {zero}',
    lbl_T1: 'টান T<sub>1</sub> = {v} {u_N}',
    lbl_T2: 'টান T<sub>2</sub> = {v} {u_N}',
    lbl_Wb: 'বইটির ওজন W = {v} {u_N}',
    lbl_mass: 'ভর {m} {u_kg}',
    lbl_table: 'টেবিলে থেমেছে',
    lbl_cut: 'কাটা সুতা',
    sym_T: 'T',
    sym_W: 'W',
    sym_R: 'লব্ধি',
    sym_push: 'ঠেলা',
    sym_T1: 'T<tspan font-size="8" dy="2.5">1</tspan>',
    sym_T2: 'T<tspan font-size="8" dy="2.5">2</tspan>',

    note_scale: 'তীরের দৈর্ঘ্য বলের মানের সমানুপাতিক',
    note_slow: 'সময় {k} গুণ ধীর · দাগ প্রতি {dt} সেকেন্ডে',

    act_cut: 'সুতা কাটো',
    act_rehang: 'আবার ঝোলাও',
    act_apart: 'হাত দূরে',
    act_closer: 'হাত কাছে',

    coach_pull: 'পাশে টেনে ছেড়ে দাও',
    coach_hands: 'হাত টেনে দূরে সরাও',
    hint_landed: '“আবার ঝোলাও” চাপলে বস্তুটি আবার সুতায় ঝুলবে।',
    hint_falling: 'বস্তুটি পড়ছে…',
    hint_limit: 'আর সরানো যায় না।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখে, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছবিটি আটকানো থাকে। দেখে উত্তর বেছে নাও।',

    q_tension: 'বস্তুটি সুতায় স্থির ঝুলছে (ছবি দেখো)। সুতার টান T কত, কোন দিকে?',
    c_t_up: '{w} {u_N}, উপরের দিকে',
    c_t_down: '{w} {u_N}, নিচের দিকে',
    c_t_zero: '{zero} {u_N}, বস্তুটি তো স্থির',
    c_t_double: '{w2} {u_N}, উপরের দিকে',
    why_tension: '<b>{w} {u_N}, উপরের দিকে</b>: স্থির, তাই লব্ধি শূন্য; W = {w} {u_N} নিচে, তাই T = W, উপরে।',
    miss_t_down: 'সুতা টানে হুকের দিকে, উপরে; নিচে টানে W।',
    miss_t_zero: 'স্থির মানে বল নেই তা নয়: T আর W কাটাকাটি।',
    miss_t_double: 'T বড় হলে লব্ধি উপরে হতো, বস্তুটি উঠত।',

    q_cut: 'বস্তুটি স্থির ঝুলছে। সুতা কেটে দিলে বস্তুটির ওপর কোন বল অসাম্য বল হবে?',
    c_cut_w: 'ওজন W, নিচের দিকে',
    c_cut_t: 'সুতার টান T, উপরের দিকে',
    c_cut_none: 'কোনো বলই থাকবে না',
    c_cut_both: 'T ও W থাকবে, লব্ধি শূন্য',
    why_cut: '<b>ওজন W, নিচের দিকে</b>: কাটা সুতা আর টানে না, শুধু W থাকে; তাই বস্তুটি মাধ্যাকর্ষণজনিত ত্বরণে পড়ে।',
    miss_cut_t: 'কাটা সুতার টান T আর কাজ করে না।',
    miss_cut_none: 'পৃথিবী তখনো টানে: ওজন W থেকেই যায়।',
    miss_cut_both: 'T না থাকলে W একা; লব্ধি আর শূন্য নয়।',

    q_release: 'বস্তুটিকে পাশে টেনে ছেড়ে দেওয়া হলো। ঠিক তখন সুতার টান আর ওজনের লব্ধি কোন দিকে?',
    letters: 'কখগঘ',
    why_release: '<b>{k}</b>: লব্ধি সুতার সাথে সমকোণে, দোলার পথ বরাবর নিচের দিকে; তাই বস্তুটি মাঝের দিকে দুলতে শুরু করে।',
    miss_rel_down: 'সোজা নিচে শুধু W; টান T-ও আছে।',
    miss_rel_string: 'সুতা বরাবর শুধু T; W-ও যোগ করতে হবে।',
    miss_rel_level: 'আনুভূমিক নয়: লব্ধি হেলানো সুতার সাথে সমকোণে।',

    q_book: 'বইটি স্থির ঝুলছে। ছবির তিনটি বলের (দুই টান আর ওজন) লব্ধি কত?',
    c_b_zero: '{zero} {u_N}',
    why_book: '<b>{zero} {u_N}</b>: বইটি স্থির, তাই লব্ধি শূন্য; তীর তিনটি পরপর জুড়লে শেষটি শুরুতে ফেরে।',
    miss_b_sum: 'বল ভেক্টর: দিক না দেখে মান যোগ চলে না।',
    miss_b_diff: 'T<sub>1</sub>, T<sub>2</sub> খাড়া উপরে নয়, হেলানো; এই বিয়োগ চলে না।',
    miss_b_w: 'দড়ির দুই টানও বল; তারা W-কে কাটাকাটি করে।',

    q_pull: 'হাত দুটি আরও দূরে সরালে (দড়ি আরও টানটান হলে) কী হবে?',
    c_p_more: 'T<sub>1</sub>, T<sub>2</sub> বাড়বে; লব্ধি শূন্যই থাকবে',
    c_p_less: 'T<sub>1</sub>, T<sub>2</sub> কমবে; লব্ধি শূন্যই থাকবে',
    c_p_up: 'T<sub>1</sub>, T<sub>2</sub> বাড়বে; লব্ধি উপরের দিকে হবে',
    c_p_same: 'T<sub>1</sub>, T<sub>2</sub> একই থাকবে, W তো একই',
    why_pull: '<b>টান বাড়বে, লব্ধি শূন্যই থাকবে</b>: টানটান দড়িতে টানের অল্প অংশ উপরে, তাই W ধরতে টান বাড়ে ({a} থেকে {b} {u_N})।',
    miss_p_less: 'দড়ি যত টানটান, টানের তত কম অংশ উপরে।',
    miss_p_up: 'বাড়তি টানের পাশের অংশ দুটি কাটাকাটি হয়।',
    miss_p_same: 'W একই, কিন্তু দড়ির কোণ বদলেছে।',
  },
  en: {
    title: 'Balanced and unbalanced forces',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Resultant',

    scenes: 'Examples',
    chip_pendulum: 'Body on a string',
    chip_book: 'Book on a rope',
    chip_fig: 'Fig. {n}',

    st_balanced: 'Balanced',
    st_unbalanced: 'Unbalanced',
    st_held: 'Held by hand',
    res_zero: 'Resultant = {zero}, so no acceleration',
    res_held: 'Resultant of T and W = {r} {u_N}; the hand holds it',
    res_swing: 'Resultant is not zero, so it accelerates',
    res_fall: 'Resultant = W, so acceleration g downward',
    res_landed: 'Push of the table = W, so resultant = {zero}',
    sum_aria: 'The force arrows drawn tip to tail: if the last one ends at the start, the resultant is zero',

    say_rest:
      'The pull of the string T acts straight up, the weight W straight down: the two forces cancel each other and the body is in equilibrium. Pull it aside and let go, or cut the string.',
    say_held:
      'Pulled aside, the weight and the pull of the string are no longer opposite; together they give a resultant force. The moment it is let go, this acts on the body.',
    say_swing:
      'The moment it was let go the resultant force began to act, so the body swings: another example of an unbalanced force. While it swings the resultant is never zero.',
    say_fall:
      'With the string cut, the pull T no longer acts; only the weight W, downward. That is the unbalanced force: the body falls with the acceleration due to gravity.',
    say_landed:
      'With only the weight W, an unbalanced force, the body fell faster and faster (the gaps between the marks grew). Now the table pushes it up: balanced again.',
    say_book:
      'The weight W of the book and the two pulls T<sub>1</sub> and T<sub>2</sub> of the rope give a resultant of zero, so the book stays at rest. Pull the hands apart.',
    say_book_moved:
      'The tighter the rope, the bigger T<sub>1</sub> and T<sub>2</sub>; still the resultant of the three forces stays zero and the book stays at rest. Three forces can balance too.',

    lbl_T: 'Pull of string T = {v} {u_N}',
    lbl_W: 'Weight W = {v} {u_N}',
    lbl_R: 'Resultant = {v} {u_N}',
    lbl_T_q: 'Pull of string T',
    lbl_T_ask: 'Pull of string T = ?',
    lbl_W_q: 'Weight W',
    lbl_W_fall: 'Weight W: the unbalanced force',
    lbl_zero: 'Resultant = {zero}',
    lbl_T1: 'Pull T<sub>1</sub> = {v} {u_N}',
    lbl_T2: 'Pull T<sub>2</sub> = {v} {u_N}',
    lbl_Wb: 'Weight of book W = {v} {u_N}',
    lbl_mass: 'Mass {m} {u_kg}',
    lbl_table: 'Stopped on the table',
    lbl_cut: 'Cut string',
    sym_T: 'T',
    sym_W: 'W',
    sym_R: 'R',
    sym_push: 'push',
    sym_T1: 'T<tspan font-size="8" dy="2.5">1</tspan>',
    sym_T2: 'T<tspan font-size="8" dy="2.5">2</tspan>',

    note_scale: 'Arrow lengths are proportional to the forces',
    note_slow: 'Time {k}× slower · a mark every {dt} s',

    act_cut: 'Cut string',
    act_rehang: 'Hang again',
    act_apart: 'Hands apart',
    act_closer: 'Hands closer',

    coach_pull: 'Pull aside and let go',
    coach_hands: 'Pull the hands apart',
    hint_landed: 'Press “Hang again” to hang the body on the string again.',
    hint_falling: 'The body is falling…',
    hint_limit: 'It cannot go further.',

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
    q_locked: 'The picture stays put during the test. Look and pick an answer.',

    q_tension: 'The body hangs at rest on the string (see the picture). How big is the pull T of the string, and which way?',
    c_t_up: '{w} {u_N}, upward',
    c_t_down: '{w} {u_N}, downward',
    c_t_zero: '{zero} {u_N}, it is at rest',
    c_t_double: '{w2} {u_N}, upward',
    why_tension: '<b>{w} {u_N}, upward</b>: the body is at rest, so the resultant is zero; W = {w} {u_N} acts straight down, so T = W, straight up.',
    miss_t_down: 'The string pulls the body towards the hook, upward; the weight pulls down.',
    miss_t_zero: 'At rest does not mean no forces: W pulls down and T cancels it.',
    miss_t_double: 'If T were bigger than W, the resultant would point up and the body would start to rise.',

    q_cut: 'The body hangs at rest. If the string is cut, which force on the body becomes the unbalanced force?',
    c_cut_w: 'The weight W, downward',
    c_cut_t: 'The pull T, upward',
    c_cut_none: 'No force at all',
    c_cut_both: 'T and W, resultant zero',
    why_cut:
      '<b>The weight W, downward</b>: a cut string pulls no more, only W is left; this unbalanced force makes the body fall with the acceleration due to gravity.',
    miss_cut_t: 'Once the string is cut, its pull T no longer acts on the body.',
    miss_cut_none: 'The Earth still pulls the body: the weight W stays.',
    miss_cut_both: 'Without T, W is alone; the resultant is no longer zero.',

    q_release: 'The body is pulled aside and let go. Just then, which way does the resultant of the pull of the string and the weight point?',
    letters: 'ABCD',
    why_release:
      '<b>{k}</b>: T and W together give a resultant at right angles to the string, along the path and downward; so the body starts to swing towards the lowest point.',
    miss_rel_down: 'Straight down is the weight W alone; the pull T acts too.',
    miss_rel_string: 'Along the string is the pull T alone; add the weight W.',
    miss_rel_level: 'Not quite level: the string slants, and the resultant is at right angles to it.',

    q_book: 'The book hangs at rest. What is the resultant of the three forces in the picture (the two pulls and the weight)?',
    c_b_zero: '{zero} {u_N}',
    why_book:
      '<b>{zero} {u_N}</b>: the book is at rest, so the resultant is zero. Join the three arrows tip to tail and the last one ends at the start; the sideways parts of the two pulls cancel.',
    miss_b_sum: 'Forces are vectors: you cannot add their sizes without their directions.',
    miss_b_diff: 'T<sub>1</sub> and T<sub>2</sub> do not pull straight up but at a slant, so this subtraction does not work.',
    miss_b_w: 'The two pulls of the rope are forces too, and they cancel W.',

    q_pull: 'What happens if the hands move further apart (the rope pulled tighter)?',
    c_p_more: 'T<sub>1</sub>, T<sub>2</sub> grow; the resultant stays zero',
    c_p_less: 'T<sub>1</sub>, T<sub>2</sub> shrink; the resultant stays zero',
    c_p_up: 'T<sub>1</sub>, T<sub>2</sub> grow; the resultant points up',
    c_p_same: 'T<sub>1</sub>, T<sub>2</sub> stay the same, W is the same',
    why_pull:
      '<b>The pulls grow, the resultant stays zero</b>: on a tight rope only a small part of each pull is upward, so it takes more pull to hold W ({a} to {b} {u_N}).',
    miss_p_less: 'The tighter the rope, the smaller the upward part of each pull; so the pulls must grow.',
    miss_p_up: 'The sideways parts of the bigger pulls cancel each other; the book stays at rest.',
    miss_p_same: 'W is the same, but the angle of the rope changed; a tight rope needs more pull.',
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
    const all = { ...UNITS, zero: '0', ...vars };
    s = s.replace(/\{(\w+)\}/g, (m, k) => (k in all ? (k in UNITS ? all[k] : num(all[k])) : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
