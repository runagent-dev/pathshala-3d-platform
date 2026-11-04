// Every string the figure shows, in Bangla and English. The book's words (pages 194–195, topic 7.2.2, তরঙ্গের
// প্রকারভেদ): "একটা স্প্রিংয়ের মধ্য দিয়ে একটা তরঙ্গ প্রবাহিত হওয়ার সময় তরঙ্গটি স্প্রিংকে সংকুচিত এবং প্রসারিত করে এগিয়ে
// যায়", "দড়ির এক প্রান্তে একটা ঝাঁকুনি দিয়ে", "স্প্রিংয়ে তরঙ্গটি ছিল সংকোচন এবং প্রসারণের, এবং সেই সংকোচন এবং
// প্রসারণের দিক এবং তরঙ্গের বেগের দিক একই", "অনুদৈর্ঘ্য তরঙ্গ", "শব্দ (চিত্র ৭.০৪) হচ্ছে এক ধরনের অনুদৈর্ঘ্য তরঙ্গ",
// "দড়ির কণাগুলোর কম্পন কিন্তু তরঙ্গের বেগের দিকে ঘটে না। কম্পনের দিক অর্থাৎ দড়ির ওঠা এবং নামা, তরঙ্গের বেগের সাথে
// লম্ব", "অনুপ্রস্থ তরঙ্গ", "পানির ঢেউ হচ্ছে এর আরেকটি উদাহরণ"; page 195 (7.2.3) "মাধ্যমের কোনো একটা কণার দিকে
// তাকিয়ে থাকি". The page writes উপর. Use t('key', vars) in code and t.num() for numbers. The questions (q_*) are plain
// text: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'অনুপ্রস্থ ও অনুদৈর্ঘ্য তরঙ্গ',
    view: 'দেখার ধরন',
    view_front_short: 'আগের মতো দেখো',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    act_reset: 'শুরুর অবস্থায় ফেরো',

    // the row of words: the two media, and what each one's wave is called once seen
    media: 'মাধ্যম',
    ex_rope: 'দড়ি',
    ex_spring: 'স্প্রিং',
    res_rope: 'অনুপ্রস্থ',
    res_spring: 'অনুদৈর্ঘ্য',

    // the one action
    act_rope: 'দড়ির প্রান্তে ঝাঁকুনি দাও',
    act_spring: 'স্প্রিংয়ের প্রান্ত ঠেলো আর টানো',
    act_pause: 'থামাও',
    act_resume: 'আবার চালাও',

    // the result line
    out_idle_rope: 'দড়িটি স্থির। <b class="wt-g">সবুজ চিহ্ন</b>টি দড়ির একটি কণা। এটির দিকে চোখ রাখো।',
    out_idle_spring: 'স্প্রিংটি স্থির। <b class="wt-g">সবুজ প্যাঁচ</b>টি স্প্রিংয়ের একটি কণা। এটির দিকে চোখ রাখো।',
    out_coming: 'তরঙ্গ এগিয়ে আসছে… <b class="wt-g">সবুজ কণা</b>টি এখনো স্থির।',
    out_rope: '<b>অনুপ্রস্থ তরঙ্গ</b>: <span class="wt-g">কণা ওঠে আর নামে</span>, <span class="wt-b">তরঙ্গ এগোয় ডানে</span>।',
    out_spring: '<b>অনুদৈর্ঘ্য তরঙ্গ</b>: <span class="wt-g">কণা সামনে-পেছনে নড়ে</span>, <span class="wt-b">তরঙ্গও এগোয় সেই দিকে</span>।',
    out_paused: ' (থামানো)',

    // the rule, growing
    rule_start: 'তরঙ্গ মাধ্যমের ভেতর দিয়ে এগিয়ে যায়। কিন্তু মাধ্যমের কণাগুলো কী করে? সবুজ কণাটি লক্ষ করো।',
    rule_rope: 'দড়ির কণাগুলো তরঙ্গের বেগের দিকে কাঁপে না। দড়ির ওঠা-নামা তরঙ্গের বেগের সাথে <b>লম্ব</b>। এরকম তরঙ্গের নাম অনুপ্রস্থ তরঙ্গ। পানির ঢেউ এর আরেকটি উদাহরণ।',
    rule_spring:
      'স্প্রিংয়ে তরঙ্গটি সংকোচন আর প্রসারণের। এদের দিক আর তরঙ্গের বেগের দিক <b>একই</b>। এই ধরনের তরঙ্গের নাম অনুদৈর্ঘ্য তরঙ্গ। শব্দও এক ধরনের অনুদৈর্ঘ্য তরঙ্গ।',
    rule_both: 'দুটিতেই কণা নিজের জায়গায় কাঁপে, এগিয়ে যায় তরঙ্গ (শক্তি)। কম্পন তরঙ্গের বেগের সাথে লম্ব হলে <b>অনুপ্রস্থ</b>, একই দিকে হলে <b>অনুদৈর্ঘ্য</b> তরঙ্গ।',

    // the comparison under the rule
    strip_head: 'মাধ্যমের কণাগুলো, পাশ থেকে দেখা',
    cmp_head: 'কণার কম্পন আর তরঙ্গের দিক',
    cmp_rope: 'দড়ি: কম্পন তরঙ্গের সাথে <b>লম্ব</b>',
    cmp_spring: 'স্প্রিং: কম্পন তরঙ্গের <b>একই দিকে</b>',
    cmp_rope_new: 'দড়ি: ঝাঁকুনি দিয়ে দেখো',
    cmp_spring_new: 'স্প্রিং: ঠেলে-টেনে দেখো',
    cmp_kind_rope: 'অনুপ্রস্থ তরঙ্গ',
    cmp_kind_spring: 'অনুদৈর্ঘ্য তরঙ্গ',
    cmp_particle: 'কণার কম্পন',
    cmp_wave: 'তরঙ্গের দিক',
    note_end: 'দূরের প্রান্ত থেকে তরঙ্গ ফিরে আসা দেখানো হয়নি।',

    // labels on the picture
    lbl_particle: 'কণার কম্পন',
    lbl_wave: 'তরঙ্গের দিক',
    lbl_comp: 'সংকোচন',
    lbl_rare: 'প্রসারণ',
    lbl_which: 'এই জায়গা ?',

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
    q_locked: 'পরীক্ষার সময় যন্ত্রটি নিজে চলে। ছবি দেখে উত্তর বেছে নাও।',

    q_rope: 'দড়িতে তরঙ্গ ডান দিকে যাচ্ছে। সবুজ চিহ্নের কণাটি কীভাবে নড়ছে?',
    c1_updown: 'নিজের জায়গায় উপর-নিচে',
    c1_along: 'নিজের জায়গায় সামনে-পেছনে',
    c1_carried: 'তরঙ্গের সাথে ডানে এগিয়ে যায়',
    c1_wavy: 'উপর-নিচে, সাথে ডানেও এগোয়',
    why_rope: '<b>নিজের জায়গায় উপর-নিচে।</b> কণাটি সাদা আংটির উপরে-নিচে ওঠা-নামা করে।',
    mis1_along: 'সামনে-পেছনে নড়ে স্প্রিংয়ের প্যাঁচ। দড়ির কণা ওঠা-নামা করে।',
    mis1_carried: 'ডানে এগোয় ঢেউয়ের আকার। কণাটি আংটি ছেড়ে যায় না।',
    mis1_wavy: 'ঢেউয়ের আকার ডানে সরে, কণা নয়: কণাটি আংটির ঠিক উপর-নিচেই থাকে।',

    q_spring: 'স্প্রিংয়ে অনেকক্ষণ ধরে তরঙ্গ ডান দিকে যাচ্ছে। সবুজ প্যাঁচটি কীভাবে নড়ছে?',
    c2_along: 'নিজের জায়গায় সামনে-পেছনে',
    c2_updown: 'নিজের জায়গায় উপর-নিচে',
    c2_carried: 'তরঙ্গের সাথে ডানে এগিয়ে যায়',
    c2_stuck: 'একটু ডানে সরে থেমে আছে',
    why_spring: '<b>নিজের জায়গায় সামনে-পেছনে।</b> প্যাঁচটি সাদা দাগের দুপাশে কাঁপে, তরঙ্গের দিক বরাবর।',
    mis2_updown: 'ওঠা-নামা করে দড়ির কণা। প্যাঁচ নড়ে তরঙ্গের দিক বরাবর।',
    mis2_carried: 'দূরে যায় তরঙ্গ, প্যাঁচ নয়। প্যাঁচটি সাদা দাগ ছাড়ে না।',
    mis2_stuck: 'তরঙ্গ চলতে থাকলে প্যাঁচও কাঁপতে থাকে, থামে না।',

    q_feature: 'থামানো স্প্রিংয়ে আংটি দেওয়া জায়গায় প্যাঁচগুলো কেমন আছে?',
    c_comp: 'সংকোচন: প্যাঁচগুলো ঘেঁষাঘেঁষি',
    c_rare: 'প্রসারণ: প্যাঁচগুলো দূরে দূরে',
    c_rest: 'সাম্যাবস্থা: কোনো সরণ নেই',
    c_notyet: 'তরঙ্গ এখনো এখানে পৌঁছায়নি',
    why_comp: '<b>সংকোচন।</b> আংটিতে প্যাঁচগুলো পাশের চেয়ে কাছাকাছি।',
    why_rare: '<b>প্রসারণ।</b> আংটিতে প্যাঁচগুলো পাশের চেয়ে দূরে দূরে।',
    mis_swap: 'আংটির ফাঁক পাশের ফাঁকের সাথে মেলাও: ঘেঁষাঘেঁষি হলে সংকোচন, দূরে দূরে হলে প্রসারণ।',
    mis_rest: 'মাঝের প্যাঁচের সরণ এখন শূন্য হতে পারে, কিন্তু ফাঁকগুলো সমান নয়। সাম্যাবস্থায় সব ফাঁক সমান।',
    mis_notyet: 'তরঙ্গ আগেই পৌঁছেছে: আরও দূরেও প্যাঁচ ঘেঁষে আর ছড়িয়ে আছে।',

    q_type_rope: 'সবুজ কণা আর তরঙ্গের দিক দেখো। দড়ির এই তরঙ্গটি কোন ধরনের?',
    c4_trans: 'অনুপ্রস্থ: কণা ওঠা-নামা করে',
    c4_moves: 'অনুদৈর্ঘ্য: তরঙ্গ সামনে এগোয়',
    c4_long: 'অনুদৈর্ঘ্য: দড়িটি অনেক লম্বা',
    c4_both: 'দুই ধরনেরই: কণা ও তরঙ্গ নড়ে',
    why_type_rope: '<b>অনুপ্রস্থ তরঙ্গ।</b> কণার ওঠা-নামা তরঙ্গের বেগের সাথে লম্ব। পানির ঢেউও এমন।',
    mis4_moves: 'সব তরঙ্গই সামনে এগোয়। ধরন বোঝা যায় কণার কম্পনের দিক থেকে।',
    mis4_long: 'নাম দড়ির দৈর্ঘ্য থেকে নয়: কম্পন তরঙ্গের দিকে হলে অনুদৈর্ঘ্য, লম্ব হলে অনুপ্রস্থ।',
    mis4_both: 'সব তরঙ্গেই কণা কাঁপে আর তরঙ্গ এগোয়। কম্পন হয় লম্ব, নয়তো একই দিকে।',

    q_type_spring: 'সবুজ প্যাঁচ আর তরঙ্গের দিক দেখো। স্প্রিংয়ের এই তরঙ্গটি কোন ধরনের?',
    c5_long: 'অনুদৈর্ঘ্য: প্যাঁচ তরঙ্গের দিকে কাঁপে',
    c5_lying: 'অনুপ্রস্থ: স্প্রিংটি শুইয়ে রাখা',
    c5_round: 'অনুপ্রস্থ: প্যাঁচগুলো গোল হয়ে ঘোরে',
    c5_both: 'দুই ধরনেরই: সংকোচন ও প্রসারণ আছে',
    why_type_spring: '<b>অনুদৈর্ঘ্য তরঙ্গ।</b> কম্পন আর তরঙ্গের বেগের দিক একই। শব্দও অনুদৈর্ঘ্য তরঙ্গ।',
    mis5_lying: 'স্প্রিং কীভাবে রাখা তা নয়, প্যাঁচ কোন দিকে কাঁপে সেটিই দেখো।',
    mis5_round: 'প্যাঁচগুলো গোল, কিন্তু ঘোরে না। সামনে-পেছনে নড়ে।',
    mis5_both: 'সংকোচন আর প্রসারণ মিলেই একটি অনুদৈর্ঘ্য তরঙ্গ, দুই ধরন নয়।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Transverse and longitudinal waves',
    view: 'View',
    view_front_short: 'Back to the start view',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    act_reset: 'Start again',

    media: 'Medium',
    ex_rope: 'Rope',
    ex_spring: 'Spring',
    res_rope: 'transverse',
    res_spring: 'longitudinal',

    act_rope: 'Shake the end of the rope',
    act_spring: 'Push and pull the spring’s end',
    act_pause: 'Pause',
    act_resume: 'Play again',

    out_idle_rope: 'The rope is still. The <b class="wt-g">green mark</b> is one particle of it. Keep your eye on it.',
    out_idle_spring: 'The spring is still. The <b class="wt-g">green coil</b> is one particle of it. Keep your eye on it.',
    out_coming: 'The wave is coming… the <b class="wt-g">green particle</b> is still at rest.',
    out_rope: '<b>Transverse wave</b>: <span class="wt-g">the particle goes up and down</span>, <span class="wt-b">the wave moves right</span>.',
    out_spring:
      '<b>Longitudinal wave</b>: <span class="wt-g">the particle moves back and forth</span>, <span class="wt-b">the wave moves the same way</span>.',
    out_paused: ' (paused)',

    rule_start: 'A wave travels through a medium. But what do the particles of the medium do? Watch the green particle.',
    rule_rope:
      'The rope’s particles do not vibrate along the wave. Their rise and fall is <b>at right angles</b> to the wave’s velocity. This is a transverse wave. Water waves are another example.',
    rule_spring:
      'In the spring the wave is made of compressions and rarefactions. Their direction is the <b>same</b> as the wave’s velocity. This is a longitudinal wave. Sound is one too.',
    rule_both:
      'In both, the particles vibrate in place and the wave (energy) moves on. Vibration at right angles to the wave: <b>transverse</b>. Along it: <b>longitudinal</b>.',

    strip_head: 'The medium’s particles, seen from the side',
    cmp_head: 'The particle’s vibration and the wave’s direction',
    cmp_rope: 'Rope: vibration <b>at right angles</b> to the wave',
    cmp_spring: 'Spring: vibration <b>along</b> the wave',
    cmp_rope_new: 'Rope: shake it and see',
    cmp_spring_new: 'Spring: push and pull it and see',
    cmp_kind_rope: 'transverse wave',
    cmp_kind_spring: 'longitudinal wave',
    cmp_particle: 'particle',
    cmp_wave: 'wave',
    note_end: 'The wave reflected from the far end is not shown.',

    lbl_particle: 'particle vibrates',
    lbl_wave: 'wave’s direction',
    lbl_comp: 'compression',
    lbl_rare: 'rarefaction',
    lbl_which: 'this place ?',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'During the test the driver runs by itself. Look at the picture and pick an answer.',

    q_rope: 'The wave on the rope goes to the right. How does the particle with the green mark move?',
    c1_updown: 'Up and down, in its own place',
    c1_along: 'Back and forth, in its own place',
    c1_carried: 'It is carried right with the wave',
    c1_wavy: 'Up and down, and right as well',
    why_rope: '<b>Up and down, in its own place.</b> It rises and falls about the white ring.',
    mis1_along: 'Back and forth is how the spring’s coils move; the rope’s particles rise and fall.',
    mis1_carried: 'What moves right is the wave’s shape; the particle never leaves the ring.',
    mis1_wavy: 'The shape moves right, not the particle: it stays above and below the ring.',

    q_spring: 'A wave has been going right along the spring for a long time. How does the green coil move?',
    c2_along: 'Back and forth, in its own place',
    c2_updown: 'Up and down, in its own place',
    c2_carried: 'It is carried right with the wave',
    c2_stuck: 'It moved a little right and stopped',
    why_spring: '<b>Back and forth, in its own place.</b> The coil vibrates about the white tape, along the wave.',
    mis2_updown: 'The rope’s particles rise and fall; the coils move along the wave.',
    mis2_carried: 'The wave goes far, not the coil; it never leaves the white tape.',
    mis2_stuck: 'While the wave runs, the coil keeps vibrating; it does not stop.',

    q_feature: 'In the paused spring, what are the coils like inside the ring?',
    c_comp: 'compression: coils crowded together',
    c_rare: 'rarefaction: coils spread apart',
    c_rest: 'equilibrium: no displacement',
    c_notyet: 'the wave has not reached here yet',
    why_comp: '<b>A compression.</b> In the ring the coils are closer than beside it.',
    why_rare: '<b>A rarefaction.</b> In the ring the coils are further apart than beside it.',
    mis_swap: 'Compare the gaps in the ring with those beside it: crowded is compression, spread is rarefaction.',
    mis_rest: 'The middle coil may have no displacement now, but the gaps are not equal; at equilibrium all are.',
    mis_notyet: 'The wave got here long ago: the coils crowd and spread further on too.',

    q_type_rope: 'Look at the green particle and the wave’s direction. What kind of wave is this on the rope?',
    c4_trans: 'transverse: the particle rises and falls',
    c4_moves: 'longitudinal: the wave moves forward',
    c4_long: 'longitudinal: the rope is very long',
    c4_both: 'both kinds: particle and wave both move',
    why_type_rope: '<b>Transverse.</b> The particle’s rise and fall is at right angles to the wave’s velocity. Water waves are like this too.',
    mis4_moves: 'Every wave moves forward; its kind is told by the direction the particles vibrate.',
    mis4_long: 'The name is not about the rope’s length: along the wave is longitudinal, at right angles transverse.',
    mis4_both: 'In every wave the particles vibrate and the wave moves on; the vibration is either at right angles or along.',

    q_type_spring: 'Look at the green coil and the wave’s direction. What kind of wave is this on the spring?',
    c5_long: 'longitudinal: the coil vibrates along the wave',
    c5_lying: 'transverse: the spring is lying down',
    c5_round: 'transverse: the coils go round and round',
    c5_both: 'both kinds: it has compressions and rarefactions',
    why_type_spring: '<b>Longitudinal.</b> The vibration is along the wave’s velocity. Sound is longitudinal too.',
    mis5_lying: 'Not how the spring lies, but which way its coils vibrate.',
    mis5_round: 'The coils are round, but they don’t turn; they move back and forth.',
    mis5_both: 'Compressions and rarefactions together make one longitudinal wave.',
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
