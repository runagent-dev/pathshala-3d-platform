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
    title: 'তড়িৎ চৌম্বক বল: চুম্বক',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে থেকে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'আধান',

    // the one action (the big button and its numbered badge on the picture)
    act_on: 'সুইচ চালু করো',
    act_flip: 'চুম্বকটি ঘুরিয়ে দাও',
    act_flip_back: 'চুম্বকটি আবার ঘুরিয়ে দাও',

    // the result line
    out_off: 'কয়েলে তড়িৎ <b>নেই</b>, কোনো বল নেই',
    out_attract: 'বিপরীত মেরু {a} {b}: <b>আকর্ষণ</b>',
    out_repel: 'সমমেরু {a} {b}: <b>বিকর্ষণ</b>',
    out_turn: 'চুম্বকটি ঘুরছে…',

    // the rule line: the book's words, growing with what the student has seen
    rule_mag_0: 'এটি তামার তারের কুণ্ডলী (কয়েল), এখনো চুম্বক নয়। তারে <b>তড়িৎ</b> চালালে কী হয়, দেখো।',
    rule_mag_on: 'তড়িৎ চলতেই কয়েলটি চুম্বক হয়ে গেল: তড়িৎ আর চুম্বকের বল আসলে <b>একই বল</b>। বিপরীত মেরু পরস্পরকে আকর্ষণ করে।',
    rule_mag_repel: 'সমমেরু পরস্পরকে বিকর্ষণ করে। দূরে সরলে বল কমে, কিন্তু কখনো শূন্য হয় না: এই বলের <b>পাল্লা অসীম</b>।',
    rule_mag_far: 'এত দূর থেকেও কয়েল চুম্বকটিকে টেনে আনল। বল কমে, কিন্তু শূন্য হয় না: এই বলের <b>পাল্লা অসীম</b>।',
    rule_mag_off: 'সুইচ খোলা, তড়িৎ নেই, তাই কয়েলটি আর চুম্বক নয়। <b>তড়িৎ চললে তবেই</b> এই চৌম্বক বল।',
    rule_law: 'তড়িৎ বল ও চৌম্বক বল মিলে <b>তড়িৎ চৌম্বক বল</b> (বিদ্যুৎ চৌম্বকীয় বল)। এটি মাধ্যাকর্ষণের তুলনায় অনেক শক্তিশালী (বই বলছে {p} গুণ), পাল্লা অসীম।',

    // the four forces (the same heading in the four figures of 3.2)
    forces: 'চার মৌলিক বল (সবচেয়ে দুর্বল → সবচেয়ে শক্তিশালী)',
    f_grav: 'মহাকর্ষ',
    f_weak: 'দুর্বল নিউক্লীয়',
    f_em: 'তড়িৎ চৌম্বক',
    f_strong: 'সবল নিউক্লীয়',

    // the magnets
    current_on: 'তড়িৎ চলছে',
    attract: 'আকর্ষণ',
    repel: 'বিকর্ষণ',
    note_pull: '(টান বাড়িয়ে দেখানো)',

    // labels in the picture
    lbl_coil: 'তারের কুণ্ডলী (কয়েল)',
    lbl_cell: 'তড়িৎ কোষ',
    lbl_switch: 'সুইচ',
    lbl_magnet: 'দণ্ড চুম্বক',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_poles: 'কয়েলে তড়িৎ চলছে। কয়েল আর চুম্বকের মুখোমুখি প্রান্ত দুটি দেখো। চুম্বকটি ছেড়ে দিলে কী হবে?',
    q_off: 'সুইচ খোলা, কয়েলে তড়িৎ নেই। চুম্বকটি ছেড়ে দিলে কী হবে?',
    q_strength: 'তড়িৎ চৌম্বক বল আর মাধ্যাকর্ষণ বলের মধ্যে কোনটি বেশি শক্তিশালী, আর বই অনুযায়ী প্রায় কত গুণ?',
    q_range: 'সুইচ চালু, চুম্বকটি পথের শেষ মাথায়। কয়েল কি এখনো চুম্বকটিকে টানছে?',
    opt_like_rep: 'সমমেরু, তাই বিকর্ষণ',
    opt_like_att: 'সমমেরু, তাই আকর্ষণ',
    opt_unlike_att: 'বিপরীত মেরু, তাই আকর্ষণ',
    opt_unlike_rep: 'বিপরীত মেরু, তাই বিকর্ষণ',
    opt_off_right: 'স্থির থাকবে: কয়েল এখন চুম্বক নয়',
    opt_off_always: 'কাছে আসবে: তড়িৎ না থাকলেও কয়েল চুম্বক',
    opt_off_copper: 'কাছে আসবে: তামার তার চুম্বককে টানে',
    opt_off_repel: 'দূরে সরবে: তড়িৎ না থাকলে বিকর্ষণ',
    opt_str: '{f}, প্রায় {p} গুণ',
    f_em_long: 'তড়িৎ চৌম্বক বল',
    f_grav_long: 'মাধ্যাকর্ষণ বল',
    opt_far_right: 'হ্যাঁ: বল কম, কিন্তু শূন্য নয়',
    opt_far_zero: 'না: এত দূরে বল একেবারে শূন্য',
    opt_far_touch: 'না: শুধু ছুঁয়ে থাকলে টানে',
    opt_far_more: 'হ্যাঁ: দূরে গেলে টান আরও বাড়ে',
    why_poles_rep: '<b>সমমেরু, তাই বিকর্ষণ</b>: মুখোমুখি দুটিই {p} মেরু, আর সমমেরু পরস্পরকে বিকর্ষণ করে।',
    why_poles_att: '<b>বিপরীত মেরু, তাই আকর্ষণ</b>: কয়েলের {a} মেরুর মুখোমুখি চুম্বকের {b} মেরু। বিপরীত মেরু আকর্ষণ করে।',
    why_off: '<b>স্থির থাকবে</b>: তারের কুণ্ডলী চুম্বক হয় শুধু তড়িৎ চললে। সুইচ চালু করলে তবেই টানবে।',
    why_strength: '<b>তড়িৎ চৌম্বক বল, প্রায় {p} গুণ</b>: {one}-এর পরে {n}টি শূন্য! (দুটি প্রোটনের মতো একই রকম কণার বেলায়।)',
    why_range: '<b>হ্যাঁ: বল কম, কিন্তু শূন্য নয়</b>: দূরত্ব বাড়লে বল কমে, কিন্তু কখনো শূন্য হয় না। এই বলের পাল্লা অসীম।',
    // what the wrong answer missed (by the order of the choices above: 1, 2, 3)
    mis_poles_1: 'নিয়মটি উল্টো হয়ে গেছে।',
    mis_poles_2: 'মেরুর অক্ষর একই হলে সমমেরু।',
    mis_poles_3: 'মেরুর অক্ষর একই হলে সমমেরু।',
    mis_off_1: 'কয়েলে লোহা নেই। তড়িৎ না চললে এটি চুম্বক নয়।',
    mis_off_2: 'তামা চুম্বকে আকৃষ্ট হয় না।',
    mis_off_3: 'তড়িৎ না থাকলে চৌম্বক বলই নেই।',
    mis_range_1: 'বল কমে, কিন্তু কোনো দূরত্বে শূন্য হয় না।',
    mis_range_2: 'চুম্বক না ছুঁয়েই দূর থেকে টানে।',
    mis_range_3: 'উল্টো: দূরে গেলে টান কমে।',
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
    title: 'Electromagnetic force: magnets',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Charge',

    act_on: 'Switch on',
    act_flip: 'Turn the magnet round',
    act_flip_back: 'Turn the magnet round again',

    out_off: 'No current in the coil: <b>no force</b>',
    out_attract: 'Unlike poles {a} {b}: <b>attraction</b>',
    out_repel: 'Like poles {a} {b}: <b>repulsion</b>',
    out_turn: 'Turning the magnet…',

    rule_mag_0: 'This is a coil of copper wire, not a magnet yet. See what an electric <b>current</b> in the wire does.',
    rule_mag_on: 'With the current on, the coil became a magnet: electric and magnetic forces are really <b>one force</b>. Unlike poles attract.',
    rule_mag_repel: 'Like poles repel each other. Farther away the force is smaller, but never zero: its <b>range is infinite</b>.',
    rule_mag_far: 'Even from this far the coil pulled the magnet back. The force is smaller, but never zero: its <b>range is infinite</b>.',
    rule_mag_off: 'The switch is open, no current, so the coil is no magnet now. <b>No current</b>, no magnetic force here.',
    rule_law:
      'Electric and magnetic forces together are the <b>electromagnetic force</b>. It is far stronger than gravity (the book says {p} times), with infinite range.',

    forces: 'The four fundamental forces (weakest → strongest)',
    f_grav: 'gravitational',
    f_weak: 'weak nuclear',
    f_em: 'electromagnetic',
    f_strong: 'strong nuclear',

    current_on: 'current flowing',
    attract: 'attraction',
    repel: 'repulsion',
    note_pull: '(pull exaggerated)',

    lbl_coil: 'coil of wire',
    lbl_cell: 'cell',
    lbl_switch: 'switch',
    lbl_magnet: 'bar magnet',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_poles: 'Current flows. Look at the facing ends: what happens when the magnet is let go?',
    q_off: 'Switch open, no current in the coil. What happens when the magnet is let go?',
    q_strength: 'Electromagnetic force or gravity: which is stronger, and by about how much?',
    q_range: 'Switch on, the magnet at the far end of its track. Is the coil still pulling it?',
    opt_like_rep: 'like poles, so repulsion',
    opt_like_att: 'like poles, so attraction',
    opt_unlike_att: 'unlike poles, so attraction',
    opt_unlike_rep: 'unlike poles, so repulsion',
    opt_off_right: 'stays put: the coil is no magnet now',
    opt_off_always: 'comes closer: a coil is always a magnet',
    opt_off_copper: 'comes closer: copper pulls magnets',
    opt_off_repel: 'moves away: no current, so it repels',
    opt_str: '{f}, about {p} times',
    f_em_long: 'electromagnetic',
    f_grav_long: 'gravity',
    opt_far_right: 'yes: a small force, but not zero',
    opt_far_zero: 'no: this far the force is zero',
    opt_far_touch: 'no: it pulls only when touching',
    opt_far_more: 'yes: farther away it pulls harder',
    why_poles_rep: '<b>Like poles, so repulsion</b>: both facing ends are {p} poles, and like poles repel each other.',
    why_poles_att: '<b>Unlike poles, so attraction</b>: the coil’s {a} pole faces the magnet’s {b} pole. Unlike poles attract.',
    why_off: '<b>It stays</b>: a coil of wire is a magnet only while a current flows. Only when the switch is on will it pull.',
    why_strength: '<b>Electromagnetic, about {p} times</b>: {one} and {n} zeros! (For like particles such as two protons.)',
    why_range: '<b>Yes: small, but not zero</b>: farther away it is smaller, but never zero. Its range is infinite.',
    mis_poles_1: 'The rule is the other way round.',
    mis_poles_2: 'Same letters mean like poles.',
    mis_poles_3: 'Same letters mean like poles.',
    mis_off_1: 'No current, no magnet.',
    mis_off_2: 'Magnets do not pull copper.',
    mis_off_3: 'No current, no force at all.',
    mis_range_1: 'It is never exactly zero.',
    mis_range_2: 'It pulls without touching.',
    mis_range_3: 'Farther away it pulls less.',
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
