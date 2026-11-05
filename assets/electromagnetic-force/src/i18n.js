// Every string of the figure, in Bangla (the book's words, page 68, 3.2.2: তড়িৎ চৌম্বক বল, বিদ্যুৎ চৌম্বকীয় বল,
// চিরুনি, চুল আঁচড়ানো, কাগজের টুকরো, আকর্ষণ, বিকর্ষণ, চুম্বক, আধান, মাধ্যাকর্ষণ বল, পাল্লা, অসীম; the four forces'
// names as in 3.2.1–3.2.4; page 68 writes "ওপর") and English. Use t('key') in code, and t.num() for numbers (Bangla
// digits in Bangla). Powers of ten are passed in as HTML ({p} = '10<sup>36</sup>'), so their digits follow the
// language too; so are the two pulls' names ({em}, {grav}) and the poles ({a}, {b}), coloured like the picture.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'তড়িৎ চৌম্বক বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে থেকে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'আধান',

    // the one action (the big button and its numbered badge on the picture)
    act_comb: 'চিরুনি দিয়ে চুল আঁচড়াও',
    act_bring: 'চিরুনি কাগজের কাছে আনো',
    act_again_comb: 'আবার চুল আঁচড়াও',

    // the result line
    pull_comb: 'চিরুনির টান',
    pull_earth: 'পুরো পৃথিবীর টান',
    out_none: 'চিরুনিতে আধান <b>নেই</b>',
    out_rub: '<b>{n}</b> বার ঘষা: চুল (+), চিরুনি (−)',
    out_pull: '{em} <b>{rel}</b> {grav}',

    // the rule line: the book's words, growing with what the student has seen
    rule_comb_0: 'চুলে ঘষলে চিরুনি ইলেকট্রন নেয়, তাই <b>ঋণাত্মক (−)</b> হয়। চুলে থাকে ধনাত্মক (+) আধান।',
    rule_comb_q: 'ইলেকট্রন চুল থেকে চিরুনিতে এসেছে: <b>চুল (+), চিরুনি (−)</b>। এবার নিরপেক্ষ কাগজের কাছে আনো।',
    rule_comb_near: '<b>কাগজ মোট নিরপেক্ষ</b>। চিরুনির কাছের দিকে (+), দূরের দিকে (−)। তড়িৎ টান পৃথিবীর টানকে ছাড়ালে কাগজ ওঠে।',
    rule_comb_won: 'চিরুনির অল্প একটু আধান পুরো পৃথিবীর মাধ্যাকর্ষণকে হারিয়ে দিল। তড়িৎ চৌম্বক বল মাধ্যাকর্ষণ বলের তুলনায় <b>অনেক শক্তিশালী</b> (বই বলছে {p} গুণ)।',
    rule_comb_none: 'চিরুনিতে আধান নেই, তাই তড়িৎ বলও নেই। <b>পৃথিবীর টানে</b> টুকরোগুলো নিচেই থাকে।',

    // the four forces (the same heading in the four figures of 3.2)
    forces: 'চার মৌলিক বল (সবচেয়ে দুর্বল → সবচেয়ে শক্তিশালী)',
    f_grav: 'মহাকর্ষ',
    f_weak: 'দুর্বল নিউক্লীয়',
    f_em: 'তড়িৎ চৌম্বক',
    f_strong: 'সবল নিউক্লীয়',

    // labels in the picture
    lbl_charge: 'চিরুনি (−)',
    lbl_hair_charge: 'চুল (+)',
    lbl_paper_neutral: 'নিরপেক্ষ কাগজ (+/−)',
    lbl_paper: 'কাগজের টুকরো',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_rise: 'চিরুনি দিয়ে চুল আঁচড়ে কাগজের টুকরোর কাছে আনা হলো। টুকরোগুলো ওপরে উঠে এল কেন?',
    q_lower: 'ছবির চিরুনিটি কাগজের টুকরোর কাছে নামালে কী হবে?',
    q_strength: 'তড়িৎ চৌম্বক বল আর মাধ্যাকর্ষণ বলের মধ্যে কোনটি বেশি শক্তিশালী, আর বই অনুযায়ী প্রায় কত গুণ?',
    opt_rise_right: 'আধানের টান পৃথিবীর টানের চেয়ে বেশি',
    opt_rise_mass: 'চিরুনির ভরের টান পৃথিবীর টানের চেয়ে বেশি',
    opt_rise_nograv: 'চিরুনির আধান কাগজের মাধ্যাকর্ষণ বল বন্ধ করে দেয়',
    opt_rise_air: 'চিরুনি নাড়ার বাতাস কাগজ ঠেলে তোলে',
    opt_low_jump: 'লাফিয়ে উঠবে: চিরুনিতে আধান আছে',
    opt_low_stay: 'নিচেই থাকবে: চিরুনিতে কোনো − নেই',
    opt_low_earth: 'নিচেই থাকবে: পৃথিবীর টান সবসময় বেশি',
    opt_low_always: 'লাফিয়ে উঠবে: চিরুনি সবসময় টানে',
    opt_low_away: 'দূরে সরবে: আধান কাগজকে ঠেলে দেয়',
    opt_str: '{f}, প্রায় {p} গুণ',
    f_em_long: 'তড়িৎ চৌম্বক বল',
    f_grav_long: 'মাধ্যাকর্ষণ বল',
    why_rise: '<b>আধানের টান বেশি</b>: চিরুনির অল্প একটু আধানের টান পুরো পৃথিবীর মাধ্যাকর্ষণকে হারিয়ে দেয়।',
    why_low_jump: '<b>লাফিয়ে উঠবে</b>: ছবির চিরুনিতে − আধান আছে। কাছে আনলে তার টান পুরো পৃথিবীর টানের চেয়ে বেশি হয়।',
    why_low_stay: '<b>নিচেই থাকবে</b>: ছবির চিরুনিতে কোনো − নেই, তাই টানও নেই। থাকে শুধু পৃথিবীর টান।',
    why_strength:
      '<b>তড়িৎ চৌম্বক বল, প্রায় {p} গুণ</b>: {one}-এর পরে {n}টি শূন্য! (দুটি প্রোটনের মতো একই রকম কণার বেলায়। চিরুনির টান কাগজের ওজনের চেয়ে সামান্য বেশি মাত্র।)',
    // what the wrong answer missed (by the order of the choices above: 1, 2, 3)
    mis_rise_1: 'চিরুনির ভর খুব কম, তার মহাকর্ষ টান নগণ্য।',
    mis_rise_2: 'আধান মাধ্যাকর্ষণ বন্ধ করে না। কাগজে দুটি বলই কাজ করে।',
    mis_rise_3: 'চিরুনি না নাড়ালেও কাগজ লাফিয়ে ওঠে।',
    mis_lowq_1: 'ছবির চিরুনিতে − আছে: আঁচড়ানো হয়েছে।',
    mis_lowq_2: 'কাছে আনলে আধানের টান পৃথিবীর টানের চেয়ে বেশি হয়।',
    mis_lowq_3: 'আধান কাগজকে টানে, ঠেলে না।',
    mis_low0_1: 'ছবির চিরুনিতে কোনো − নেই: আধান নেই।',
    mis_low0_2: 'আধান ছাড়া চিরুনি কাগজ টানে না।',
    mis_low0_3: 'আধান না থাকলে বিকর্ষণও হয় না।',
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
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Electromagnetic force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Charge',

    act_comb: 'Comb the hair',
    act_bring: 'Bring the comb to the paper',
    act_again_comb: 'Comb the hair again',

    pull_comb: 'comb’s pull',
    pull_earth: 'whole Earth’s pull',
    out_none: 'Charge on the comb: <b>none</b>',
    out_rub: '<b>{n}</b> strokes: hair (+), comb (−)',
    out_pull: '{em} <b>{rel}</b> {grav}',

    rule_comb_0: 'Rubbing moves electrons to the comb, so it becomes <b>negative (−)</b>. The hair is left positive (+).',
    rule_comb_q: 'Electrons moved from hair to comb: <b>hair (+), comb (−)</b>. Now bring it near the neutral paper.',
    rule_comb_near:
      '<b>The paper stays neutral</b>. Its side nearer the comb is (+), the farther side (−). It rises when the electric pull beats gravity.',
    rule_comb_won:
      'The comb’s tiny charge beat the gravity of the whole Earth. The electromagnetic force is <b>far stronger</b> than gravity (the book says {p} times).',
    rule_comb_none: 'No charge on the comb, so no electric force. <b>The Earth’s pull</b> keeps the bits down.',

    forces: 'The four fundamental forces (weakest → strongest)',
    f_grav: 'gravitational',
    f_weak: 'weak nuclear',
    f_em: 'electromagnetic',
    f_strong: 'strong nuclear',

    lbl_charge: 'Comb (−)',
    lbl_hair_charge: 'Hair (+)',
    lbl_paper_neutral: 'Neutral paper (+/−)',
    lbl_paper: 'bits of paper',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_rise: 'A comb run through hair was brought to the paper. Why did the bits jump up?',
    q_lower: 'What happens when the comb in the picture is lowered to the paper?',
    q_strength: 'Electromagnetic force or gravity: which is stronger, and by about how much?',
    opt_rise_right: 'the charge’s pull beats the Earth’s',
    opt_rise_mass: 'the comb’s mass outpulls the Earth',
    opt_rise_nograv: 'the comb’s charge switches gravity off',
    opt_rise_air: 'air from the comb pushes them up',
    opt_low_jump: 'jump up: the comb has charge',
    opt_low_stay: 'stay down: no − on the comb',
    opt_low_earth: 'stay down: the Earth always pulls harder',
    opt_low_always: 'jump up: a comb always pulls',
    opt_low_away: 'move away: charge pushes paper',
    opt_str: '{f}, about {p} times',
    f_em_long: 'electromagnetic',
    f_grav_long: 'gravity',
    why_rise: '<b>The pull of the charge is bigger</b>: the pull of the comb’s tiny charge beats the whole Earth’s gravity.',
    why_low_jump: '<b>They jump up</b>: the comb in the picture has − charge. Close up, its pull beats the whole Earth’s.',
    why_low_stay: '<b>They stay down</b>: no − on the comb in the picture, so no pull. Only the Earth’s.',
    why_strength:
      '<b>Electromagnetic, about {p} times</b>: {one} and {n} zeros! (For like particles such as two protons. The comb only just beats the paper’s weight.)',
    mis_rise_1: 'The comb’s gravity is negligible.',
    mis_rise_2: 'Charge does not switch gravity off.',
    mis_rise_3: 'They jump even if the comb is still.',
    mis_lowq_1: 'There is − on the comb: it was combed.',
    mis_lowq_2: 'Close up, the charge’s pull beats the Earth’s.',
    mis_lowq_3: 'Charge pulls paper, it does not push it.',
    mis_low0_1: 'No − on the comb: no charge.',
    mis_low0_2: 'No charge, no pull.',
    mis_low0_3: 'No charge, no push either.',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The picture is locked during the test. Look at it and pick an answer.',
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
