// Every string the figure shows, in Bangla (in the book's words, page 64, ৩.১: নিউটনের প্রথম সূত্র, বল প্রয়োগ, স্থির
// বস্তু, সমবেগ, সরলরেখা, সমদ্রুতি, ঘর্ষণ, বাতাসের বাধা, বেগের বিপরীত দিকে, অনন্তকাল) and English.
// Use t('key', vars) in code, and t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    title: 'নিউটনের প্রথম গতি সূত্র',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বেগ',
    surfaces: 'মেঝে বেছে নাও',

    book_title: 'পদার্থবিজ্ঞান',
    book_class: 'নবম-দশম শ্রেণি',
    u_m: 'মি',
    u_ms: 'মি/সে',

    chip_mat: 'মাদুর',
    chip_wood: 'কাঠ',
    chip_ice: 'বরফ',
    chip_none: 'ঘর্ষণ নেই',
    at_mat: 'মাদুরে',
    at_wood: 'কাঠের মেঝেতে',
    at_ice: 'বরফে',
    res_m: '{d} মি',
    res_none: 'থামে না',

    r_speed: 'বেগ',
    r_dist: 'দূরত্ব',

    act_push: 'ধাক্কা দাও',
    act_again: 'আবার ধাক্কা দাও',
    act_home: 'শুরুতে ফেরাও',

    l_velocity: 'বেগ',
    l_friction: 'ঘর্ষণ',
    l_push: 'ধাক্কা',
    badge_head: 'কাল্পনিক তল:',
    badge_none: 'ঘর্ষণ ও বাতাসের বাধা নেই',
    badge_none_short: 'ঘর্ষণ নেই',

    x_rest: '<b>বল প্রয়োগ না করলে স্থির বস্তু স্থির থাকে।</b> বইটি নিজে থেকে নড়বে না: ধাক্কা দাও। প্রতিবার ধাক্কা একই।',
    x_rest_none: '<b>কল্পনা করো: ঘর্ষণ নেই, বাতাসের বাধাও নেই।</b> তবু বল প্রয়োগ না করলে স্থির বইটি স্থিরই থাকবে। ধাক্কা দাও।',
    x_slide: '<b>ছেড়ে দেওয়ার পর সামনের দিকে কোনো বল নেই।</b> ঘর্ষণ বেগের বিপরীত দিকে কাজ করে, তাই বেগ কমে।',
    x_stop: '<b>{d} মিটার গিয়ে থেমেছে।</b> ঘর্ষণ বেগের বিপরীত দিকে কাজ করে বইটিকে থামিয়েছে। ঘর্ষণ যত কম, বই তত দূরে যায়।',
    x_stop_ice: '<b>{d} মিটার গিয়ে থেমেছে।</b> বরফে ঘর্ষণ খুব কম, কিন্তু শূন্য নয়, তাই শেষে থামে। ঘর্ষণ একেবারে না থাকলে কী হবে?',
    x_none: '<b>সমবেগে চলতে থাকা বস্তু সমবেগে চলতে থাকে।</b> ছেড়ে দেওয়ার পর সামনে-পেছনে কোনো বল নেই, তাই বেগ বদলায় না: বইটি সরলরেখায় সমদ্রুতিতে অনন্তকাল চলবে।',

    coach_push: 'চাপ দিলে ধাক্কা লাগবে',
    coach_lens: 'এখানে ধরে টানো',
    hint_wait: 'ধাক্কা দেওয়া হয়ে গেছে: দেখো বইটি কী করে।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'দৃশ্যটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_look: 'দেখো…',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। দেখে উত্তর বেছে নাও।',
    letters: 'কখগঘ',
    opt_path: 'পথ {k}',

    q_predict: 'এই তলে ঘর্ষণ ও বাতাসের বাধা নেই। বইটিকে ধাক্কা দিয়ে ছেড়ে দিলে কী হবে?',
    c_keep: 'একই বেগে চলতেই থাকবে',
    c_slow: 'বেগ কমতে কমতে থেমে যাবে',
    c_stop_push: 'ধাক্কা শেষ হলেই থেমে যাবে',
    c_faster: 'বেগ বাড়তে বাড়তে চলবে',
    why_predict: '<b>একই বেগে চলতেই থাকবে</b>: ছাড়ার পর সামনে-পেছনে কোনো বল নেই, তাই বেগ বদলায় না।',
    not_slow: 'থামায় ঘর্ষণ; এখানে তা নেই।',
    not_stop_push: 'চলতে থাকার জন্য বল লাগে না।',
    not_faster: 'বেগ বাড়াতেও বল লাগে।',

    q_whystop: '{at} ধাক্কা দিয়ে ছেড়ে দেওয়া বইটি থেমে গেল। কেন?',
    w_friction: 'মেঝের ঘর্ষণ একে থামিয়েছে',
    w_used: 'ধাক্কার বল ফুরিয়ে গেছে',
    w_natural: 'চলন্ত বস্তু নিজে থেকেই থামে',
    w_heavy: 'বইয়ের ওজন একে থামিয়েছে',
    why_whystop: '<b>ঘর্ষণ</b>: ছাড়ার পর সামনের দিকে কোনো বল ছিল না; ঘর্ষণ বেগের বিপরীত দিকে কাজ করে বেগ শূন্য করেছে।',
    not_used: 'ধাক্কা ছাড়ার সাথেই শেষ।',
    not_natural: 'বল না থাকলে চলন্ত বস্তু থামে না।',
    not_heavy: 'ওজন টানে নিচের দিকে, পেছনে নয়।',

    q_ice: 'একই ধাক্কায় বই মাদুরে {a} মি, কাঠের মেঝেতে {b} মি গিয়ে থেমেছে। বরফে কী হবে?',
    q_mat: 'একই ধাক্কায় বই কাঠের মেঝেতে {b} মি, বরফে {c} মি গিয়ে থেমেছে। মাদুরে কী হবে?',
    f_more: '{b} মিটারের বেশি গিয়ে থামবে',
    f_never: 'কখনো না থেমে চলতেই থাকবে',
    f_same: '{b} মিটারেই থেমে যাবে',
    f_less_a: '{a} মিটারের আগেই থেমে যাবে',
    f_less: '{b} মিটারের কম গিয়ে থামবে',
    f_more_c: '{c} মিটারের বেশি গিয়ে থামবে',
    f_still: 'জায়গা থেকে একটুও নড়বে না',
    why_ice: '<b>{b} মিটারের বেশি গিয়ে থামবে</b> (প্রায় {d} মি): বরফে ঘর্ষণ খুব কম, কিন্তু শূন্য নয়।',
    why_mat: '<b>{b} মিটারের কম গিয়ে থামবে</b> (প্রায় {d} মি): মাদুরে ঘর্ষণ বেশি, বেগ তাড়াতাড়ি কমে।',
    not_never: 'তাই শেষে থামে।',
    not_same: 'ধাক্কা একই, ঘর্ষণ আলাদা।',

    q_curve: 'ঘর্ষণহীন তলে বইটি বাঁকা দেয়াল ঘেঁষে ঘুরছে। দেয়াল যেখানে শেষ, তার পরে বইটি কোন পথে যাবে?',
    why_curve: '<b>পথ {k}, সোজা</b>: দেয়ালের ঠেলায় দিক বদলাচ্ছিল; দেয়াল শেষ হলে বল নেই, তাই সরলরেখায় চলে।',
    l_wall: 'দেয়াল',

    q_space: 'মহাশূন্যে, সব গ্রহ-নক্ষত্র থেকে অনেক দূরে, একটি চলন্ত মহাকাশযানের ইঞ্জিন বন্ধ করা হলো। এরপর এটি—',
    p_keep: 'সমবেগে চলতে থাকবে',
    p_slow: 'ধীরে ধীরে থেমে যাবে',
    p_stop: 'সাথে সাথে থেমে যাবে',
    p_turn: 'বাঁক নিয়ে ঘুরতে থাকবে',
    why_space: '<b>সমবেগে চলতে থাকবে</b>: সেখানে ঘর্ষণ, বাতাসের বাধা বা ইঞ্জিনের বল নেই, তাই বেগ বদলায় না।',

    q_rest: 'এই তলে ঘর্ষণ ও বাতাসের বাধা নেই। বইটি স্থির, কেউ একে ছুঁয়েও দেখছে না। এরপর বইটি—',
    r_stay: 'যেখানে আছে সেখানেই থাকবে',
    r_slide: 'নিজে থেকেই পিছলে চলবে',
    r_start: 'ধীরে ধীরে চলতে শুরু করবে',
    r_steady: 'সমবেগে চলতে শুরু করবে',
    why_rest: '<b>যেখানে আছে সেখানেই থাকবে</b>: বল প্রয়োগ না করলে স্থির বস্তু স্থির থাকে।',
    not_move: 'ঘর্ষণ না থাকলেও নিজে থেকে চলে না।',
  },
  en: {
    title: "Newton's first law of motion",
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Velocity',
    surfaces: 'Choose a floor',

    book_title: 'Physics',
    book_class: 'Classes 9–10',
    u_m: 'm',
    u_ms: 'm/s',

    chip_mat: 'Mat',
    chip_wood: 'Wood',
    chip_ice: 'Ice',
    chip_none: 'No friction',
    at_mat: 'On the mat',
    at_wood: 'On the wooden floor',
    at_ice: 'On ice',
    res_m: '{d} m',
    res_none: 'never stops',

    r_speed: 'Velocity',
    r_dist: 'Distance',

    act_push: 'Push',
    act_again: 'Push again',
    act_home: 'Back to start',

    l_velocity: 'velocity',
    l_friction: 'friction',
    l_push: 'push',
    badge_head: 'Imagined floor:',
    badge_none: 'no friction, no air resistance',
    badge_none_short: 'no friction',

    x_rest: '<b>Without a force, a body at rest stays at rest.</b> The book will not move by itself: push it. The push is the same every time.',
    x_rest_none: '<b>Imagine: no friction, no air resistance.</b> Still, without a force the book at rest stays at rest. Push it.',
    x_slide: '<b>Once let go, no force pushes the book forward.</b> Friction acts against the velocity, so the velocity falls.',
    x_stop: '<b>It stopped after {d} metres.</b> Friction, acting against the velocity, stopped the book. The less friction, the farther it goes.',
    x_stop_ice:
      '<b>It stopped after {d} metres.</b> On ice friction is very small, but not zero, so it stops in the end. What if there were no friction at all?',
    x_none:
      '<b>A body moving with uniform velocity keeps moving with uniform velocity.</b> Once let go, no force acts forward or back, so the velocity does not change: the book goes on in a straight line at the same speed for ever.',

    coach_push: 'Tap to push',
    coach_lens: 'Drag here',
    hint_wait: 'The push is done: watch what the book does.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the scene, think, and pick the right answer.',
    q_look: 'Watch…',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Look at it and pick an answer.',
    letters: 'ABCD',
    opt_path: 'Path {k}',

    q_predict: 'This floor has no friction and no air resistance. What happens if the book is pushed and let go?',
    c_keep: 'It keeps going at the same velocity',
    c_slow: 'It slows down and stops',
    c_stop_push: 'It stops as soon as the push ends',
    c_faster: 'It goes faster and faster',
    why_predict: '<b>It keeps going at the same velocity</b>: once let go, no force acts forward or back, so the velocity does not change.',
    not_slow: 'Friction stops things; there is none here.',
    not_stop_push: 'No force is needed to keep moving.',
    not_faster: 'Speeding up needs a force too.',

    q_whystop: '{at}, the book that was pushed and let go stopped. Why?',
    w_friction: 'The floor’s friction stopped it',
    w_used: 'The force of the push ran out',
    w_natural: 'Moving things stop by themselves',
    w_heavy: 'The book’s weight stopped it',
    why_whystop: '<b>Friction</b>: once let go, nothing pushed the book forward; friction, acting against the velocity, brought it to zero.',
    not_used: 'The push ends the moment it lets go.',
    not_natural: 'Without a force a moving body does not stop.',
    not_heavy: 'Weight pulls down, not back.',

    q_ice: 'With the same push the book stopped after {a} m on the mat and {b} m on the wooden floor. What happens on ice?',
    q_mat: 'With the same push the book stopped after {b} m on the wooden floor and {c} m on ice. What happens on the mat?',
    f_more: 'It stops beyond {b} m',
    f_never: 'It goes on and never stops',
    f_same: 'It stops at {b} m too',
    f_less_a: 'It stops before {a} m',
    f_less: 'It stops short of {b} m',
    f_more_c: 'It stops beyond {c} m',
    f_still: 'It does not move at all',
    why_ice: '<b>It stops beyond {b} m</b> (about {d} m): ice has very little friction, but not none.',
    why_mat: '<b>It stops short of {b} m</b> (about {d} m): the mat has more friction, so the velocity falls quickly.',
    not_never: 'So it stops in the end.',
    not_same: 'The push is the same, but the friction is not.',

    q_curve: 'On a floor without friction the book is going round along a curved wall. Which way will it go after the wall ends?',
    why_curve: '<b>Path {k}, straight</b>: the wall’s push was turning it; once the wall ends there is no force, so it goes straight.',
    l_wall: 'wall',

    q_space: 'In space, far from every planet and star, a moving spacecraft turns its engines off. Then it…',
    p_keep: 'keeps moving with uniform velocity',
    p_slow: 'slowly comes to a stop',
    p_stop: 'stops at once',
    p_turn: 'turns and goes round',
    why_space:
      '<b>It keeps moving with uniform velocity</b>: there is no friction, no air resistance and no engine force; so the velocity does not change.',

    q_rest: 'This floor has no friction and no air resistance. The book is at rest and nobody touches it. Then the book…',
    r_stay: 'stays where it is',
    r_slide: 'slides off by itself',
    r_start: 'slowly starts to move',
    r_steady: 'starts moving at a steady speed',
    why_rest: '<b>It stays where it is</b>: without a force a body at rest stays at rest.',
    not_move: 'No friction does not make it move by itself.',
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
