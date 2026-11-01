// Every string of the figure, in Bangla (the book's words, pages 69–70, 3.3: বল একটি ভেক্টর, সাম্যাবস্থা, অসাম্যাবস্থা,
// অসাম্য বল, লব্ধি বল, সম্মিলিত লব্ধি, শূন্য, ত্বরণ, পৃথিবীর আকর্ষণ বল, ওজন W, সুতার টান T, টান T₁ এবং T₂, অভিকর্ষ বল,
// মাধ্যাকর্ষণজনিত ত্বরণ, পেন্ডুলাম, দুলতে থাকবে, স্থির অবস্থা, নিষ্ক্রিয়, কাটাকাটি) and English. The page writes "ওপর" for
// "on (a body)" and "উপরের দিকে" for upward; so do we. The ball is called বস্তু, as on the page (বল is force).
// Use t('key') in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not a var
// is another string of the same language: units are {u_N} (Bangla "নিউটন", English "N") and {u_kg}, always after a
// no-break space, so a number never parts from its unit.

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
    u_N: 'নিউটন',
    u_kg: 'kg',
    val_N: '{v} {u_N}',
    val_N_up: '{v} {u_N}, উপরের দিকে',

    scenes: 'উদাহরণ',
    chip_pendulum: 'সুতায় ঝোলানো বস্তু',
    chip_book: 'দড়িতে ঝোলানো বই',
    chip_fig: 'চিত্র {n}',

    st_balanced: 'সাম্যাবস্থা',
    st_unbalanced: 'অসাম্যাবস্থা',
    res_zero: 'লব্ধি বল = {zero}, তাই ত্বরণ নেই',
    res_swing: 'লব্ধি বল শূন্য নয়, তাই ত্বরণ আছে',
    res_fall: 'লব্ধি বল = W, তাই ত্বরণ g',
    res_landed: 'ঠেলা = W, তাই লব্ধি বল = {zero}',
    sum_aria: 'বলগুলোর তীর পরপর জুড়ে আঁকা: শেষ তীর শুরুতে ফিরলে লব্ধি শূন্য',
    sum_caption: 'তীর পরপর জোড়া: শুরুতে ফিরলে লব্ধি {zero}',

    say_rest: 'সুতার টান T খাড়া উপরের দিকে, ওজন W সোজা নিচের দিকে: দুটি বল পরস্পরকে নিষ্ক্রিয় করে সাম্যাবস্থার সৃষ্টি করেছে। বস্তুটিকে পাশে টেনে ছাড়ো, বা সুতা কাটো।',
    say_held: 'হাতে ধরে রাখায় তিনটি বল: সুতার টান, ওজন আর হাতের টান; লব্ধি শূন্য। ছেড়ে দেওয়া মাত্র হাতের টান থাকবে না, তখন সুতার টান আর ওজন মিলে একটি লব্ধি বল কাজ করবে।',
    say_swing: 'হাতের টান নেই: সুতার টান আর ওজন মিলে লব্ধি বল কাজ করছে, তাই বস্তুটি দুলছে। এটি অসাম্য বলের আরেকটি উদাহরণ। দোলার সময় লব্ধি কখনো শূন্য হয় না।',
    say_fall: 'সুতা কেটে দেওয়ায় টান T আর কাজ করছে না; শুধু ওজন W নিচের দিকে। এটিই অসাম্য বল: বস্তুটি মাধ্যাকর্ষণজনিত ত্বরণে নিচে পড়ছে।',
    say_landed: 'সুতা কাটার পর শুধু ওজন W কাজ করেছে; এই অসাম্য বলের জন্য বস্তুটি ক্রমেই দ্রুত পড়েছে (দাগগুলোর ফাঁক বেড়েছে)। এখন টেবিল ঠেলে ধরে রেখেছে: আবার সাম্যাবস্থা।',
    say_book: 'বইটির ওজন W এবং দড়ির দুই প্রান্তের দুটি টান T<sub>1</sub> এবং T<sub>2</sub> মিলে লব্ধি শূন্য, তাই বইটি স্থির। হাত দুটি টেনে দূরে সরিয়ে দেখো।',
    say_book_moved: 'দড়ি যত টানটান, T<sub>1</sub> ও T<sub>2</sub> তত বড়; তবু তিনটি বলের লব্ধি শূন্যই থাকে, বইটি স্থির। তিনটি বল মিলেও সাম্যাবস্থা তৈরি হয়।',

    lbl_T: 'T = {v} {u_N}',
    lbl_W: 'W = {v} {u_N}',
    lbl_R: 'লব্ধি = {v} {u_N}',
    lbl_H: 'হাত = {v} {u_N}',
    lbl_push: 'ঠেলা = {v} {u_N}',
    lbl_T_q: 'টান T',
    lbl_T_ask: 'T = ?',
    lbl_W_q: 'ওজন W',
    lbl_W_fall: 'W: অসাম্য বল',
    lbl_zero: 'লব্ধি = {zero}',
    lbl_T1: 'T<sub>1</sub> = {v} {u_N}',
    lbl_T2: 'T<sub>2</sub> = {v} {u_N}',
    lbl_Wb: 'W = {v} {u_N}',
    lbl_pair: 'দুই টানের লব্ধি = {v} {u_N}',
    sym_T: 'T',
    sym_W: 'W',
    sym_R: 'লব্ধি',
    sym_hand: 'হাত',
    sym_push: 'ঠেলা',
    sym_T1: 'T<tspan font-size="8.5" dy="2.5">1</tspan>',
    sym_T2: 'T<tspan font-size="8.5" dy="2.5">2</tspan>',

    note_scale: 'তীরের দৈর্ঘ্য বলের মানের সমানুপাতিক',
    note_slow: 'সময় {k} গুণ ধীর · দাগ প্রতি {dt} সেকেন্ডে',

    act_cut: 'সুতা কাটো',
    act_rehang: 'আবার ঝোলাও',
    act_apart: 'হাত দূরে',
    act_closer: 'হাত কাছে',

    coach_pull: 'পাশে টেনে ছেড়ে দাও',
    coach_hands: 'হাত টেনে দূরে সরাও',
    hint_cut_still: 'আগে বস্তুটিকে স্থির ঝুলতে দাও, তারপর সুতা কাটো।',
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

    q_tension: 'বস্তুটি সুতায় স্থির ঝুলছে (ছবি দেখো)। সুতার টান T কত?',
    why_tension: '<b>{w} {u_N}</b>: বস্তুটি স্থির, তাই লব্ধি শূন্য; ওজন W = {w} {u_N} নিচের দিকে, তাই সুতার টান T = W, উপরের দিকে।',
    miss_t_zero: 'স্থির মানে বল নেই তা নয়: ওজন W নিচে টানছে, সুতার টান T উপরে টেনে তাকে কাটাকাটি করছে, তাই T = W।',
    miss_t_double: 'T, W-এর চেয়ে বড় হলে লব্ধি উপরের দিকে হতো, বস্তুটি উঠতে শুরু করত; স্থির থাকতে T = W।',
    miss_t_g: '{g} {u_N} হলো {one} {u_kg} ভরের ওজন; এই বস্তুর ওজন ছবিতে লেখা আছে, T তার সমান।',

    q_cut: 'বস্তুটি স্থির ঝুলছে। সুতা কেটে দিলে বস্তুটির ওপর কোন বল অসাম্য বল হবে?',
    c_cut_w: 'ওজন W, নিচের দিকে',
    c_cut_t: 'সুতার টান T, উপরের দিকে',
    c_cut_none: 'কোনো বলই থাকবে না',
    c_cut_both: 'T ও W থাকবে, লব্ধি শূন্য',
    why_cut: '<b>ওজন W, নিচের দিকে</b>: কাটা সুতা আর টানে না, শুধু W থাকে; এই অসাম্য বলে বস্তুটি মাধ্যাকর্ষণজনিত ত্বরণে পড়ে।',
    miss_cut_t: 'সুতা কেটে দিলে টান T আর বস্তুটির ওপর কাজ করে না; থাকে শুধু ওজন W।',
    miss_cut_none: 'পৃথিবী তখনো বস্তুটিকে টানে: ওজন W থেকেই যায়, তাই বস্তুটি পড়ে।',
    miss_cut_both: 'T না থাকলে W একা; তাকে কাটাকাটি করার কোনো বল নেই, তাই লব্ধি শূন্য নয়।',

    q_release: 'বস্তুটিকে পাশে টেনে ছেড়ে দেওয়া হলো। ঠিক তখন সুতার টান আর ওজনের লব্ধি কোন দিকে?',
    letters: 'কখগঘ',
    why_release: '<b>{k}</b>: লব্ধি ({r}\u00a0{u_N}) সুতার সাথে সমকোণে, দোলার পথ বরাবর নিচের দিকে; তাই বস্তুটি মাঝের দিকে দুলতে শুরু করে।',
    head_release: '{k} (লব্ধি {r}\u00a0{u_N})',
    miss_rel_down: 'সোজা নিচে শুধু ওজন W; সুতার টান T-ও যোগ করলে লব্ধি সুতার সাথে সমকোণে, পথ বরাবর নিচের দিকে।',
    miss_rel_string: 'সুতা বরাবর শুধু টান T; ওজন W-ও যোগ করলে লব্ধি সুতার সাথে সমকোণে, পথ বরাবর নিচের দিকে।',
    miss_rel_level: 'একেবারে অনুভূমিক নয়: সুতা হেলে আছে, লব্ধি তার সাথে সমকোণে, তাই খানিকটা নিচের দিকেও।',

    q_book: 'বইটি স্থির ঝুলছে (ছবি দেখো)। দড়ির দুই টানের লব্ধি কত, কোন দিকে?',
    why_book: '<b>{w} {u_N}, উপরের দিকে</b>: বইটি স্থির, তাই তিন বলের লব্ধি শূন্য; দুই টানের পাশের দিকের অংশ কাটাকাটি হয়, উপরের দিকের অংশ মিলে W-এর সমান।',
    miss_b_sum: 'বল ভেক্টর: হেলানো দুই টানের মান সোজা যোগ করা যায় না, তাদের পাশের দিকের অংশ কাটাকাটি হয়।',
    miss_b_zero: 'শূন্য হয় তিনটি বলের (ওজনসহ) লব্ধি; দুই টানের লব্ধি W-কে ধরে রাখে, তাই W-এর সমান, উপরের দিকে।',
    miss_b_one: 'একটি টান নয়, দুটি টান মিলে বইটিকে ধরে রেখেছে।',

    q_pull: 'হাত দুটি আরও দূরে সরালে (দড়ি আরও টানটান হলে) কী হবে?',
    head_pull: 'টান বাড়বে, লব্ধি শূন্যই থাকবে',
    c_p_more_zero: 'T<sub>1</sub>, T<sub>2</sub> বাড়বে; লব্ধি শূন্যই থাকবে',
    c_p_less_zero: 'T<sub>1</sub>, T<sub>2</sub> কমবে; লব্ধি শূন্যই থাকবে',
    c_p_more_up: 'T<sub>1</sub>, T<sub>2</sub> বাড়বে; লব্ধি উপরের দিকে হবে',
    c_p_less_down: 'T<sub>1</sub>, T<sub>2</sub> কমবে; লব্ধি নিচের দিকে হবে',
    why_pull: '<b>টান বাড়বে, লব্ধি শূন্যই থাকবে</b>: টানটান দড়িতে টানের অল্প অংশ উপরে, তাই W ধরতে টান বাড়ে ({a} থেকে {b} {u_N}); বইটি স্থির থাকে।',
    miss_p_less_zero: 'দড়ি যত টানটান, প্রতিটি টানের তত কম অংশ উপরের দিকে; তাই W ধরে রাখতে টান বাড়াতে হয়, কমে না।',
    miss_p_more_up: 'টান বাড়লেও লব্ধি উপরের দিকে হয় না: বাড়তি টানের পাশের দিকের অংশ দুটি কাটাকাটি হয়; বইটি উঠে যায় না, স্থিরই থাকে।',
    miss_p_less_down: 'টান কমে না, বাড়ে; আর বইটি স্থির থাকে, তাই লব্ধি শূন্য, নিচের দিকে নয়।',
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
    u_N: 'N',
    u_kg: 'kg',
    val_N: '{v} {u_N}',
    val_N_up: '{v} {u_N}, upward',

    scenes: 'Examples',
    chip_pendulum: 'Body on a string',
    chip_book: 'Book on a rope',
    chip_fig: 'Fig. {n}',

    st_balanced: 'Balanced',
    st_unbalanced: 'Unbalanced',
    res_zero: 'Resultant = {zero}, so no acceleration',
    res_swing: 'Resultant ≠ {zero}, so it accelerates',
    res_fall: 'Resultant = W, so acceleration g',
    res_landed: 'Push = W, so resultant = {zero}',
    sum_aria: 'The force arrows drawn tip to tail: if the last one ends at the start, the resultant is zero',
    sum_caption: 'Arrows tip to tail: back at the start, zero',

    say_rest:
      'The string’s pull T acts straight up, the weight W straight down: the two forces cancel, so the body is in equilibrium. Pull it aside, or cut the string.',
    say_held:
      'Held by the hand: the string’s pull, the weight and the hand’s pull; the resultant is zero. Let go and the hand’s pull is gone: T and W give a resultant force.',
    say_swing:
      'No hand now: T and W give a resultant force, so the body swings, another example of an unbalanced force. While it swings the resultant is never zero.',
    say_fall:
      'With the string cut, T no longer acts; only the weight W, downward. That is the unbalanced force: the body falls with the acceleration due to gravity.',
    say_landed:
      'After the cut only W acted, an unbalanced force: the body fell faster and faster (the gaps between the marks grew). Now the table pushes it up: balanced again.',
    say_book:
      'The weight W of the book and the two pulls T<sub>1</sub> and T<sub>2</sub> of the rope give a resultant of zero, so the book stays at rest. Pull the hands apart.',
    say_book_moved:
      'The tighter the rope, the bigger T<sub>1</sub> and T<sub>2</sub>; still the resultant of the three forces is zero and the book stays at rest. Three forces can balance too.',

    lbl_T: 'T = {v} {u_N}',
    lbl_W: 'W = {v} {u_N}',
    lbl_R: 'R = {v} {u_N}',
    lbl_H: 'Hand = {v} {u_N}',
    lbl_push: 'Push = {v} {u_N}',
    lbl_T_q: 'Pull T',
    lbl_T_ask: 'T = ?',
    lbl_W_q: 'Weight W',
    lbl_W_fall: 'W: unbalanced force',
    lbl_zero: 'R = {zero}',
    lbl_T1: 'T<sub>1</sub> = {v} {u_N}',
    lbl_T2: 'T<sub>2</sub> = {v} {u_N}',
    lbl_Wb: 'W = {v} {u_N}',
    lbl_pair: 'Two pulls together = {v} {u_N}',
    sym_T: 'T',
    sym_W: 'W',
    sym_R: 'R',
    sym_hand: 'hand',
    sym_push: 'push',
    sym_T1: 'T<tspan font-size="8.5" dy="2.5">1</tspan>',
    sym_T2: 'T<tspan font-size="8.5" dy="2.5">2</tspan>',

    note_scale: 'Arrow length is proportional to the force',
    note_slow: 'Time {k}× slower · a mark every {dt} s',

    act_cut: 'Cut string',
    act_rehang: 'Hang again',
    act_apart: 'Hands apart',
    act_closer: 'Hands closer',

    coach_pull: 'Pull aside and let go',
    coach_hands: 'Pull the hands apart',
    hint_cut_still: 'Let the body hang still first, then cut the string.',
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

    q_tension: 'The body hangs at rest on the string (see the picture). How big is the string’s pull T?',
    why_tension: '<b>{w} {u_N}</b>: at rest the resultant is zero; W = {w} {u_N} pulls down, so T = W, upward.',
    miss_t_zero: 'At rest does not mean no forces: W pulls down and T pulls up and cancels it.',
    miss_t_double: 'If T were bigger than W, the resultant would point up and the body would start to rise; at rest T = W.',
    miss_t_g: '{g} {u_N} is the weight of {one} {u_kg}; this body’s weight is written in the picture, and T equals it.',

    q_cut: 'The body hangs at rest. If the string is cut, which force on it is the unbalanced force?',
    c_cut_w: 'The weight W, downward',
    c_cut_t: 'The pull T, upward',
    c_cut_none: 'No force at all',
    c_cut_both: 'T and W, resultant zero',
    why_cut: '<b>The weight W, downward</b>: a cut string pulls no more; W alone is unbalanced, so the body falls.',
    miss_cut_t: 'Once the string is cut, its pull T no longer acts on the body; only W is left.',
    miss_cut_none: 'The Earth still pulls the body: the weight W stays, so the body falls.',
    miss_cut_both: 'Without T, W is alone; nothing cancels it, so the resultant is not zero.',

    q_release: 'The body is pulled aside and let go. Just then, which way does the resultant of T and W point?',
    letters: 'ABCD',
    why_release: '<b>{k}</b>: the resultant ({r} {u_N}) is at right angles to the string, along the path and down: it swings to the middle.',
    head_release: '{k} (resultant {r}\u00a0{u_N})',
    miss_rel_down: 'Straight down is W alone; with T added the resultant is at right angles to the string, along the path.',
    miss_rel_string: 'Along the string is T alone; with W added the resultant is at right angles to the string, along the path.',
    miss_rel_level: 'Not level: the string slants, and the resultant is at right angles to it, so a little downward too.',

    q_book: 'The book hangs at rest (see the picture). What is the resultant of the rope’s two pulls?',
    why_book: '<b>{w} {u_N}, upward</b>: at rest the three forces add to zero; the pulls’ sideways parts cancel, their upward parts equal W.',
    miss_b_sum: 'Forces are vectors: the sizes of two slanting pulls do not simply add; their sideways parts cancel.',
    miss_b_zero: 'Zero is the resultant of all three forces; the two pulls alone hold W up, so they equal W, upward.',
    miss_b_one: 'Not one pull: the two pulls together hold the book.',

    q_pull: 'What happens if the hands move further apart (the rope pulled tighter)?',
    head_pull: 'The pulls grow, the resultant stays zero',
    c_p_more_zero: 'T<sub>1</sub>, T<sub>2</sub> grow; the resultant stays zero',
    c_p_less_zero: 'T<sub>1</sub>, T<sub>2</sub> shrink; the resultant stays zero',
    c_p_more_up: 'T<sub>1</sub>, T<sub>2</sub> grow; the resultant points up',
    c_p_less_down: 'T<sub>1</sub>, T<sub>2</sub> shrink; the resultant points down',
    why_pull: '<b>The pulls grow, the resultant stays zero</b>: on a tighter rope less of each pull is upward, so it takes more ({a} to {b} {u_N}).',
    miss_p_less_zero: 'A tighter rope pulls up with less of each pull, so the pulls must grow to hold W, not shrink.',
    miss_p_more_up: 'The sideways parts of bigger pulls cancel: the resultant stays zero and the book does not rise.',
    miss_p_less_down: 'The pulls grow, not shrink; and the book stays at rest, so the resultant is zero, not downward.',
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
    const all = { zero: '0', ...vars };
    const fill = (s) =>
      s.replace(/\{(\w+)\}/g, (m, k) => (k in all ? num(all[k]) : typeof dict[k] === 'string' && !dict[k].includes('{') ? dict[k] : m));
    return fill(dict[key] ?? key);
  }
  t.num = num;
  t.lang = code;
  return t;
}
