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
    out_idle_rope: 'দড়িটি স্থির। <b class="wt-g">সবুজ চিহ্ন</b>টি দড়ির একটি কণা: এটির দিকে তাকিয়ে থাকো।',
    out_idle_spring: 'স্প্রিংটি স্থির। <b class="wt-g">সবুজ প্যাঁচ</b>টি স্প্রিংয়ের একটি কণা: এটির দিকে তাকিয়ে থাকো।',
    out_coming: 'তরঙ্গ এগিয়ে আসছে… <b class="wt-g">সবুজ কণা</b>টি এখনো স্থির।',
    out_rope: '<b>অনুপ্রস্থ তরঙ্গ</b>: <span class="wt-g">কণা ওঠে আর নামে</span>, <span class="wt-b">তরঙ্গ এগোয় ডানে</span>।',
    out_spring: '<b>অনুদৈর্ঘ্য তরঙ্গ</b>: <span class="wt-g">কণা সামনে-পেছনে নড়ে</span>, <span class="wt-b">তরঙ্গও এগোয় সেই দিকে</span>।',
    out_paused: ' (থামানো)',

    // the rule, growing
    rule_start: 'তরঙ্গ মাধ্যমের ভেতর দিয়ে এগিয়ে যায়। কিন্তু মাধ্যমের কণাগুলো কী করে? সবুজ কণাটি লক্ষ করো।',
    rule_rope:
      'দড়ির কণাগুলোর কম্পন তরঙ্গের বেগের দিকে ঘটে না: দড়ির ওঠা এবং নামা তরঙ্গের বেগের সাথে <b>লম্ব</b>। এরকম তরঙ্গের নাম <b>অনুপ্রস্থ তরঙ্গ</b>। পানির ঢেউ এর আরেকটি উদাহরণ।',
    rule_spring:
      'স্প্রিংয়ে তরঙ্গটি <b>সংকোচন</b> এবং <b>প্রসারণের</b>; সেই সংকোচন এবং প্রসারণের দিক এবং তরঙ্গের বেগের দিক <b>একই</b>। এই ধরনের তরঙ্গের নাম <b>অনুদৈর্ঘ্য তরঙ্গ</b>। শব্দ এক ধরনের অনুদৈর্ঘ্য তরঙ্গ।',
    rule_both:
      'দুটিতেই কণা <b>নিজের জায়গায় কাঁপে</b>, এগিয়ে যায় তরঙ্গ (শক্তি)। কম্পন তরঙ্গের বেগের সাথে লম্ব হলে <b>অনুপ্রস্থ</b>, একই দিকে হলে <b>অনুদৈর্ঘ্য</b> তরঙ্গ।',

    // the comparison under the rule
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

    hint_tap: 'যন্ত্রটিতে বা বোতামে চাপ দাও।',

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

    q_rope: 'দড়িতে তরঙ্গ ডান দিকে যাচ্ছে। সবুজ চিহ্নের কণাটি কোন দিকে কাঁপছে?',
    c_updown: 'উপর-নিচে, তরঙ্গের দিকের সাথে লম্ব',
    c_along: 'সামনে-পেছনে, তরঙ্গের দিক বরাবর',
    c_carried: 'তরঙ্গের সাথে ডান দিকে চলে যাচ্ছে',
    c_still: 'কাঁপছে না, শুধু তরঙ্গটি নড়ছে',
    why_rope: '<b>উপর-নিচে।</b> দড়ির ওঠা এবং নামা তরঙ্গের বেগের সাথে লম্ব: এটি অনুপ্রস্থ তরঙ্গ।',
    mis_along: 'সামনে-পেছনে কাঁপে স্প্রিংয়ের প্যাঁচ (অনুদৈর্ঘ্য তরঙ্গে), দড়িতে নয়।',
    mis_carried: 'কণা তরঙ্গের সাথে চলে যায় না; সাদা আংটির জায়গাতেই ওঠা-নামা করে।',
    mis_still: 'তরঙ্গ মানেই মাধ্যমের কণার কম্পন: কণা না কাঁপলে তরঙ্গও থাকত না।',

    q_where: 'স্প্রিংয়ে অনেকক্ষণ ধরে তরঙ্গ ডান দিকে যাচ্ছে। সবুজ প্যাঁচটি এখন কোথায়?',
    c_home: 'নিজের জায়গার (সাদা দাগের) দুপাশে কাঁপছে',
    c_far: 'তরঙ্গের সাথে দূরের প্রান্তে চলে গেছে',
    c_back: 'পিছিয়ে যন্ত্রটির কাছে চলে এসেছে',
    c_stuck: 'একটু ডানে সরে সেখানেই থেমে আছে',
    why_where: '<b>নিজের জায়গার দুপাশে কাঁপছে।</b> এগিয়ে যায় তরঙ্গ, মানে সংকোচন-প্রসারণ আর শক্তি; প্যাঁচ নয়।',
    mis_far: 'দূরে যায় তরঙ্গ, প্যাঁচ নয়: প্যাঁচটি সাদা দাগ ছাড়িয়ে বেশি দূর যায় না।',
    mis_back: 'প্যাঁচটি সামনে-পেছনে সমান সমান নড়ে, তাই পেছনে সরে যায় না।',
    mis_stuck: 'তরঙ্গ চলতে থাকলে প্যাঁচও কাঁপতেই থাকে; থেমে থাকে না।',

    q_feature: 'থামানো স্প্রিংয়ে চিহ্ন দেওয়া জায়গায় প্যাঁচগুলোর অবস্থাকে কী বলে?',
    c_comp: 'সংকোচন',
    c_rare: 'প্রসারণ',
    c_lambda: 'তরঙ্গদৈর্ঘ্য',
    c_amp: 'বিস্তার',
    why_comp: '<b>সংকোচন।</b> এখানে প্যাঁচগুলো কাছাকাছি ঘেঁষে আছে।',
    why_rare: '<b>প্রসারণ।</b> এখানে প্যাঁচগুলো দূরে দূরে ছড়িয়ে আছে।',
    mis_swap: 'প্যাঁচ ঘেঁষাঘেঁষি হলে সংকোচন, দূরে দূরে হলে প্রসারণ।',
    mis_lambda: 'তরঙ্গদৈর্ঘ্য একটি দূরত্ব (পরপর দুটি সংকোচনের মাঝে), কোনো একটি জায়গার নাম নয়।',
    mis_amp: 'বিস্তার হলো একটি প্যাঁচ নিজের জায়গা থেকে সবচেয়ে বেশি কতটা সরে, কোনো জায়গার নাম নয়।',

    q_sound: 'বই বলছে, শব্দ হচ্ছে বাতাসের সংকোচন এবং প্রসারণ (চিত্র {fig})। শব্দ কোন ধরনের তরঙ্গ?',
    q_water: 'পানির ঢেউয়ে পানি ওঠে আর নামে, ঢেউ এগোয় সামনে। এটি কোন ধরনের তরঙ্গ?',
    c_long: 'অনুদৈর্ঘ্য তরঙ্গ',
    c_trans: 'অনুপ্রস্থ তরঙ্গ',
    c_nowave: 'তরঙ্গ নয়, বাতাস বা পানি নিজেই ছুটে যায়',
    c_both: 'কোনোটিই নয়, কণা মোটেই কাঁপে না',
    why_sound: '<b>অনুদৈর্ঘ্য তরঙ্গ।</b> বাতাসের কণা তরঙ্গের দিকেই সামনে-পেছনে কাঁপে, তৈরি হয় সংকোচন আর প্রসারণ: স্প্রিংয়ের মতো।',
    why_water: '<b>অনুপ্রস্থ তরঙ্গ।</b> ওঠা-নামা ঢেউ এগোনোর দিকের সাথে লম্ব: দড়ির মতো।',
    mis_trans_sound: 'বইয়ের ছবিতে ঢেউয়ের মতো রেখাটি শুধু চাপ বোঝায়; বাতাস আসলে ওঠা-নামা করে না।',
    mis_long_water: 'ঢেউয়ে পানি এগোয় না, ওঠা-নামা করে: কম্পন ঢেউয়ের দিকের সাথে লম্ব।',
    mis_nowave: 'কণা নিজের জায়গাতেই কাঁপে; এগিয়ে যায় শক্তি, বাতাস বা পানি নয়।',
    mis_both: 'কণা না কাঁপলে তরঙ্গই হতো না; প্রশ্নেই আছে কীভাবে কাঁপে।',
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

    out_idle_rope: 'The rope is still. The <b class="wt-g">green mark</b> is one particle of it: keep your eye on it.',
    out_idle_spring: 'The spring is still. The <b class="wt-g">green coil</b> is one particle of it: keep your eye on it.',
    out_coming: 'The wave is coming… the <b class="wt-g">green particle</b> is still at rest.',
    out_rope: '<b>Transverse wave</b>: <span class="wt-g">the particle goes up and down</span>, <span class="wt-b">the wave moves right</span>.',
    out_spring:
      '<b>Longitudinal wave</b>: <span class="wt-g">the particle moves back and forth</span>, <span class="wt-b">the wave moves the same way</span>.',
    out_paused: ' (paused)',

    rule_start: 'A wave travels through a medium. But what do the particles of the medium do? Watch the green particle.',
    rule_rope:
      'The rope’s particles do not vibrate in the direction of the wave’s velocity: the rope’s rise and fall is <b>at right angles</b> to it. Such a wave is a <b>transverse wave</b>. Water waves are another example.',
    rule_spring:
      'In the spring the wave is one of <b>compressions</b> and <b>rarefactions</b>, and their direction is the <b>same</b> as the wave’s velocity. Such a wave is a <b>longitudinal wave</b>. Sound is a kind of longitudinal wave.',
    rule_both:
      'In both, the particles <b>only vibrate in place</b>; the wave (energy) moves on. Vibration at right angles to the wave: <b>transverse</b>; along it: <b>longitudinal</b>.',

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

    hint_tap: 'Tap the driver or the button.',

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

    q_rope: 'The wave on the rope goes to the right. Which way does the particle with the green mark vibrate?',
    c_updown: 'Up and down, at right angles to the wave',
    c_along: 'Back and forth, along the wave',
    c_carried: 'It is carried off to the right with the wave',
    c_still: 'It does not vibrate; only the wave moves',
    why_rope: '<b>Up and down.</b> The rope’s rise and fall is at right angles to the wave’s velocity: a transverse wave.',
    mis_along: 'Back and forth is how the spring’s coils move (a longitudinal wave), not the rope.',
    mis_carried: 'A particle is not carried along; it rises and falls about the white ring.',
    mis_still: 'A wave is the particles’ vibration passed on: without it there would be no wave.',

    q_where: 'A wave has been going right along the spring for a long time. Where is the green coil now?',
    c_home: 'Vibrating on both sides of its own place (the white tape)',
    c_far: 'Carried to the far end with the wave',
    c_back: 'Pushed back next to the driver',
    c_stuck: 'Moved a little right and stopped there',
    why_where: '<b>Vibrating about its own place.</b> What travels is the wave (the compressions, rarefactions and energy), not the coil.',
    mis_far: 'The wave goes far, not the coil: it never moves far from the white tape.',
    mis_back: 'The coil moves back and forth equally, so it does not drift backwards.',
    mis_stuck: 'As long as the wave runs, the coil keeps vibrating; it does not stop.',

    q_feature: 'In the paused spring, what is the state of the coils at the marked place called?',
    c_comp: 'compression',
    c_rare: 'rarefaction',
    c_lambda: 'wavelength',
    c_amp: 'amplitude',
    why_comp: '<b>A compression.</b> The coils here are crowded close together.',
    why_rare: '<b>A rarefaction.</b> The coils here are spread far apart.',
    mis_swap: 'Coils crowded together: compression; spread apart: rarefaction.',
    mis_lambda: 'Wavelength is a distance (between two compressions in a row), not the name of a place.',
    mis_amp: 'Amplitude is how far a coil moves from its own place at most, not the name of a place.',

    q_sound: 'The book says sound is compressions and rarefactions of the air (figure {fig}). What kind of wave is sound?',
    q_water: 'In a water wave the water rises and falls while the wave moves forward. What kind of wave is it?',
    c_long: 'longitudinal wave',
    c_trans: 'transverse wave',
    c_nowave: 'Not a wave; the air or water itself rushes along',
    c_both: 'Neither; the particles do not vibrate at all',
    why_sound: '<b>Longitudinal.</b> Air particles vibrate back and forth along the wave, making compressions and rarefactions, like the spring.',
    why_water: '<b>Transverse.</b> The rise and fall is at right angles to the way the wave moves, like the rope.',
    mis_trans_sound: 'The wavy line in the book’s picture only shows pressure; the air does not go up and down.',
    mis_long_water: 'In a wave the water does not move forward; it rises and falls, at right angles to the wave.',
    mis_nowave: 'Particles vibrate in place; energy moves on, not the air or the water.',
    mis_both: 'Without the particles vibrating there would be no wave; the question says how they move.',
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
