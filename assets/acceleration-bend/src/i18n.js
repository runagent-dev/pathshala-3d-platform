// Every string of the figure, in Bangla (the book's words, pages 43–44, 2.6: ত্বরণ, সমবেগ, বেগের পরিবর্তনের হার,
// দিক, মান, দ্রুতি, ধনাত্মক ত্বরণ, ঋণাত্মক ত্বরণ, মন্দন, সমত্বরণ, আদি বেগ, শেষ বেগ, সময়, ভেক্টর রাশি, ms⁻²) and
// English. Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla). Units are
// the book's symbols (m/s, s, ms⁻²) and stay Latin.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'বাঁকে ত্বরণ',
    view: 'দেখার ধরন',
    view_front_short: 'পাশ থেকে',
    view_top_short: 'উপর থেকে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ত্বরণ',

    act_restart: 'আবার শুরু',
    pedals: 'সিএনজি চালাও',
    pedal_left: 'বাঁয়ে',
    pedal_right: 'ডানে',
    speedo: 'দ্রুতি',
    u_ms: 'm/s',
    u_acc: 'ms⁻²',

    // the compass
    compass_aria: 'বেগের দিক',
    dir_N_short: 'উ',
    dir_E_short: 'পূ',
    dir_S_short: 'দ',
    dir_W_short: 'প',
    dir_E: 'পূর্ব',
    dir_NE: 'উত্তর-পূর্ব',
    dir_N: 'উত্তর',
    dir_NW: 'উত্তর-পশ্চিম',
    dir_W: 'পশ্চিম',
    dir_SW: 'দক্ষিণ-পশ্চিম',
    dir_S: 'দক্ষিণ',
    dir_SE: 'দক্ষিণ-পূর্ব',

    mis_bend_dir: ' বেগ ভেক্টর রাশি: তার দিকও বেগের অংশ।',
    opt_bend_no_dir: 'নেই, কারণ দিক বদলালে বেগ বদলায় না',
    lbl_centre: 'বাঁকের কেন্দ্র',

    // the panel on the bend
    speed_name: 'দ্রুতি',
    speed_same: 'সবসময় একই',
    dir_name: 'বেগের দিক',
    dir_changing: 'বদলাচ্ছে',
    dir_same: 'একই থাকছে',
    acc_yes: 'আছে',
    acc_no: 'নেই',
    acc_center: 'বাঁকের কেন্দ্রের দিকে',
    acc_none_why: 'বেগ বদলাচ্ছে না',
    say_turn: 'দ্রুতি একই, তবু বেগের দিক বদলাচ্ছে। বেগ বদলালেই ত্বরণ, তাই বাঁক নেওয়ার সময় ত্বরণ আছে।',
    say_straight: 'সোজা চলছে: বেগের মান ও দিক দুটিই একই, তাই ত্বরণ নেই। বাঁয়ে বা ডানে চেপে ধরে বাঁক নাও।',

    // labels in the 3D picture
    lbl_velocity: 'বেগ',
    lbl_acc: 'ত্বরণ',
    lbl_no_acc: 'ত্বরণ নেই',

    coach_lens: 'এখানে ধরে টানো',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছবিটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',
    q_bend: 'সিএনজিটি একই দ্রুতিতে ঘুরে ঘুরে চলছে। এর কি ত্বরণ আছে?',
    opt_bend_yes_dir: 'আছে, কারণ বেগের দিক বদলাচ্ছে',
    opt_bend_no_speed: 'নেই, কারণ দ্রুতি একই থাকছে',
    opt_bend_yes_speed: 'আছে, কারণ দ্রুতি বাড়ছে',
    why_bend: '<b>আছে</b>: দ্রুতি সবসময় {v} m/s, কিন্তু বেগের দিক প্রতি মুহূর্তে বদলাচ্ছে। দিক বদলালেও বেগ বদলায়, তাই ত্বরণ আছে।',
    mis_bend_speed: ' শুধু দ্রুতি একই থাকলেই ত্বরণ শূন্য হয় না।',
    mis_bend_up: ' স্পিডোমিটার দেখো: দ্রুতি বাড়ছে না।',
    coach_turn: 'চেপে ধরে বাঁক নাও',
    q_dir: 'সিএনজিটি একই দ্রুতিতে বাঁক নিচ্ছে। এর ত্বরণ কোন দিকে?',
    opt_dir_centre: 'বাঁকের কেন্দ্রের দিকে',
    opt_dir_forward: 'সামনের দিকে, বেগের দিকে',
    opt_dir_back: 'পেছনের দিকে',
    opt_dir_out: 'বাঁকের বাইরের দিকে',
    why_dir: '<b>বাঁকের কেন্দ্রের দিকে</b>: দ্রুতি সবসময় {v} m/s, কিন্তু বেগের দিক প্রতি মুহূর্তে কেন্দ্রের দিকে বেঁকে যাচ্ছে, তাই ত্বরণ কেন্দ্রের দিকে।',
    mis_dir_forward: ' সামনের দিকে ত্বরণ হলে দ্রুতি বাড়ত; দ্রুতি তো একই থাকছে।',
    mis_dir_back: ' পেছনের দিকে ত্বরণ হলে দ্রুতি কমত; দ্রুতি তো একই থাকছে।',
    mis_dir_out: ' বাইরের দিকে নয়: বেগ ভেতরের দিকে, কেন্দ্রের দিকে বাঁকছে।',
    q_straight: 'সিএনজিটি একই দ্রুতিতে সোজা চলছে। এর কি ত্বরণ আছে?',
    opt_str_none: 'নেই, বেগের মান ও দিক একই',
    opt_str_moving: 'আছে, কারণ সিএনজি চলছে',
    opt_str_speed: 'আছে, কারণ দ্রুতি {v} m/s',
    opt_str_forward: 'আছে, সামনের দিকে',
    why_straight: '<b>নেই</b>: দ্রুতি সবসময় {v} m/s, দিকও একই। বেগ বদলাচ্ছে না, তাই ত্বরণ নেই।',
    mis_str_moving: ' চলা মানেই ত্বরণ নয়: বেগ বদলালে তবেই ত্বরণ।',
    mis_str_speed: ' দ্রুতি কত, তা নয়: বেগের (মান বা দিকের) পরিবর্তনই ত্বরণ।',
    mis_str_forward: ' সামনের দিকে তো বেগ; বেগ বদলাচ্ছে না, তাই ত্বরণ নেই।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Acceleration on a bend',
    view: 'View',
    view_front_short: 'From the side',
    view_top_short: 'From above',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Acceleration',

    act_restart: 'Start again',
    pedals: 'Drive the CNG',
    pedal_left: 'Left',
    pedal_right: 'Right',
    speedo: 'Speed',
    u_ms: 'm/s',
    u_acc: 'ms⁻²',

    compass_aria: 'Direction of the velocity',
    dir_N_short: 'N',
    dir_E_short: 'E',
    dir_S_short: 'S',
    dir_W_short: 'W',
    dir_E: 'east',
    dir_NE: 'north-east',
    dir_N: 'north',
    dir_NW: 'north-west',
    dir_W: 'west',
    dir_SW: 'south-west',
    dir_S: 'south',
    dir_SE: 'south-east',

    mis_bend_dir: ' Velocity is a vector: its direction is part of it.',
    opt_bend_no_dir: 'No, a new direction does not change the velocity',
    lbl_centre: 'centre of the turn',

    speed_name: 'speed',
    speed_same: 'always the same',
    dir_name: 'direction of velocity',
    dir_changing: 'changing',
    dir_same: 'not changing',
    acc_yes: 'yes',
    acc_no: 'none',
    acc_center: 'towards the centre of the turn',
    acc_none_why: 'velocity not changing',
    say_turn: 'Same speed, but the direction of the velocity keeps changing. A change of velocity is acceleration, so turning means acceleration.',
    say_straight:
      'Going straight: the size and direction of the velocity both stay the same, so no acceleration. Press and hold Left or Right to turn.',

    lbl_velocity: 'velocity',
    lbl_acc: 'acceleration',
    lbl_no_acc: 'no acceleration',

    coach_lens: 'Drag here',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
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
    q_bend: 'The CNG goes round and round at the same speed. Does it have an acceleration?',
    opt_bend_yes_dir: 'Yes, its direction of velocity changes',
    opt_bend_no_speed: 'No, its speed stays the same',
    opt_bend_yes_speed: 'Yes, its speed is growing',
    why_bend:
      '<b>Yes</b>: the speed stays {v} m/s, but the direction of the velocity changes all the time. A change of direction changes the velocity, so there is acceleration.',
    mis_bend_speed: ' Same speed alone does not mean zero acceleration.',
    mis_bend_up: ' Look at the speedometer: the speed is not growing.',
    coach_turn: 'Hold to turn',
    q_dir: 'The CNG takes a bend at the same speed. Which way is its acceleration?',
    opt_dir_centre: 'Towards the centre of the bend',
    opt_dir_forward: 'Forwards, along the velocity',
    opt_dir_back: 'Backwards',
    opt_dir_out: 'Away from the centre of the bend',
    why_dir:
      '<b>Towards the centre of the bend</b>: the speed stays {v} m/s, but the direction of the velocity keeps bending towards the centre, so the acceleration points there.',
    mis_dir_forward: ' An acceleration forwards would make it faster; the speed stays the same.',
    mis_dir_back: ' An acceleration backwards would make it slower; the speed stays the same.',
    mis_dir_out: ' Not outwards: the velocity bends inwards, towards the centre.',
    q_straight: 'The CNG goes straight at the same speed. Does it have an acceleration?',
    opt_str_none: 'No, the size and direction of the velocity stay the same',
    opt_str_moving: 'Yes, because the CNG is moving',
    opt_str_speed: 'Yes, because its speed is {v} m/s',
    opt_str_forward: 'Yes, forwards',
    why_straight: '<b>No</b>: the speed stays {v} m/s and the direction too. The velocity does not change, so there is no acceleration.',
    mis_str_moving: ' Moving is not accelerating: only a change of velocity is.',
    mis_str_speed: ' Not how fast it goes: a change of velocity (its size or direction) is acceleration.',
    mis_str_forward: ' Forwards is its velocity; the velocity does not change, so no acceleration.',
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
