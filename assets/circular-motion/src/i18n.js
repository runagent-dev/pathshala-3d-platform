// Every string the figure shows, in Bangla (the book's words, page 36: ঘূর্ণন গতি, নির্দিষ্ট বিন্দু, সমদূরত্ব,
// বৃত্তাকার পথ, বৈদ্যুতিক পাখা, ঘড়ির কাঁটা, চাঁদ, পৃথিবী) and English.
// Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    title: 'ঘূর্ণন গতি',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'দূরত্ব',

    ex_label: 'উদাহরণ',
    ex_fan: 'বৈদ্যুতিক পাখা',
    ex_clock: 'ঘড়ির কাঁটা',
    ex_moon: 'চাঁদ',
    idea: 'একটি বস্তু যদি একটা <b class="c-ctr">নির্দিষ্ট বিন্দু</b> থেকে <b class="c-dist">সমদূরত্বে</b> থেকে <b class="c-path">বৃত্তাকার পথে</b> ঘুরতে থাকে, তাহলে তার গতিকে বলে <b>ঘূর্ণন গতি</b>।',
    dist_k: 'নির্দিষ্ট বিন্দু থেকে দূরত্ব ({u})',
    dist_k_moon: 'নির্দিষ্ট বিন্দু থেকে দূরত্ব (প্রায়, {u})',
    book_fan: 'বৈদ্যুতিক পাখা, ঘড়ির কাঁটা এগুলো ঘূর্ণন গতির উদাহরণ।',
    book_moon: 'চাঁদকে <b>কোনো কিছু দিয়ে পৃথিবীর সাথে বেঁধে রাখা নেই</b>, তবু এটা পৃথিবীকে ঘিরে ঘুরছে, টুপ করে পড়েও যাচ্ছে না!',
    unit_cm: 'সেমি',
    unit_lakh_km: 'লক্ষ কিমি',

    act_pause: 'থামাও',
    act_play: 'চালাও',
    act_measure: 'দূরত্ব মাপো',

    status_start: 'বিন্দুটি ছুঁয়ে মাপো',
    status_more: 'আরও {n} জায়গায় মাপো',
    status_same: 'দূরত্ব সবসময় সমান!',
    status_same_moon: 'দূরত্ব প্রায় সমান!',
    status_locked: 'পরীক্ষার জন্য আটকানো',

    label_center: 'নির্দিষ্ট বিন্দু',
    label_center_moon: 'নির্দিষ্ট বিন্দু: পৃথিবীর কেন্দ্র',
    label_path: 'বৃত্তাকার পথ',
    label_dist: '{d} {u}',
    label_dist_about: 'প্রায় {d} {u}',
    label_earth: 'পৃথিবী',
    label_moon: 'চাঁদ',
    label_after_half: 'আধা পাক পরে',

    note_fan: 'অনেক ধীর করে দেখানো',
    note_clock: 'সময় দ্রুত করে দেখানো',
    note_moon: 'আকার, দূরত্ব, সময় প্রকৃত অনুপাতে নয়',

    hint_drag: 'ধরে টেনে ঘোরাও: বিন্দুটি বৃত্তাকার পথের বাইরে যায় না।',
    hint_elsewhere: 'এখানে আগেই মেপেছ। অন্য জায়গায় মাপো।',

    coach_tap: 'ছুঁয়ে দূরত্ব মাপো',
    coach_lens: 'বিবর্ধক সরাতে এখানে ধরে টানো',

    // the test
    who_fan: 'ফ্যানের পাখার মাথা',
    who_clock: 'সেকেন্ডের কাঁটার মাথা',
    letters: 'ক খ গ ঘ',
    q_center: 'কোন বিন্দুটি নির্দিষ্ট বিন্দু, যাকে ঘিরে বাকিরা ঘুরছে?',
    center_why: '<b>{c}</b> নড়ে না; বাকি সব বিন্দু একে ঘিরে বৃত্তাকার পথে ঘোরে।',
    q_turn_half: '{who} নির্দিষ্ট বিন্দু থেকে {d} {u} দূরে। আধা পাক ঘোরার পর এই দূরত্ব কত হবে?',
    q_turn_full: '{who} নির্দিষ্ট বিন্দু থেকে {d} {u} দূরে। এক পাক ঘোরার পর এই দূরত্ব কত হবে?',
    turn_why_half: 'দূরত্ব একই: <b>{d} {u}</b>। তবে শুরুর জায়গা থেকে এখন {c} {u} দূরে (বৃত্তের উল্টো পাশে)।',
    turn_why_full: 'দূরত্ব একই: <b>{d} {u}</b>। এক পাক পরে বিন্দুটি আবার শুরুর জায়গায় ফিরে আসে।',
    q_same: '{who} ঘুরছে। কোনটি বদলাচ্ছে না?',
    same_dist: 'নির্দিষ্ট বিন্দু থেকে দূরত্ব',
    same_place: 'অবস্থান',
    same_dir: 'চলার দিক',
    same_start: 'শুরুর জায়গা থেকে দূরত্ব',
    same_why: 'নির্দিষ্ট বিন্দু থেকে দূরত্ব সবসময় <b>{d} {u}</b>; অবস্থান, চলার দিক, শুরু থেকে দূরত্ব বদলায়।',
    q_everyday: 'নিচের কোনটি ঘূর্ণন গতি?',
    life_pinwheel: 'ঘুরন্ত কাগজের চরকির মাথা',
    life_stone: 'সুতায় বেঁধে ঘোরানো ঢিল',
    life_ball: 'উপর থেকে ছেড়ে দেওয়া বল',
    life_car: 'সোজা রাস্তায় চলা গাড়ি',
    life_box: 'মেঝেতে ধাক্কা দেওয়া বাক্স',
    life_why_pinwheel: 'চরকির মাথা পিন থেকে সমান দূরত্বে থেকে বৃত্তাকার পথে ঘোরে। বাকিগুলো সরল রেখায় চলে।',
    life_why_stone: 'ঢিলটি হাত থেকে সুতার সমান দূরত্বে থেকে বৃত্তাকার পথে ঘোরে। বাকিগুলো সরল রেখায় চলে।',
    q_moon_kind: 'পৃথিবীকে ঘিরে চাঁদের গতি কোন ধরনের গতি?',
    kind_rotation: 'ঘূর্ণন গতি',
    kind_linear: 'সরলরৈখিক গতি',
    kind_translation: 'চলন গতি',
    kind_shm: 'সরল স্পন্দন গতি',
    moon_kind_why: 'চাঁদ পৃথিবীর কেন্দ্র থেকে প্রায় সমান দূরত্বে থেকে বৃত্তাকার পথে ঘোরে: <b>ঘূর্ণন গতি</b>।',
    q_moon_center: 'চাঁদের ঘূর্ণন গতিতে নির্দিষ্ট বিন্দুটি কোথায়?',
    moon_c_earth: 'পৃথিবীর কেন্দ্রে',
    moon_c_moon: 'চাঁদের কেন্দ্রে',
    moon_c_surface: 'পৃথিবীর পৃষ্ঠে',
    moon_c_middle: 'চাঁদ ও পৃথিবীর মাঝখানে',
    moon_center_why: 'চাঁদ পৃথিবীর <b>কেন্দ্র</b> থেকে প্রায় {d} {u} দূরে থেকে পৃথিবীকে ঘিরে ঘোরে।',

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
    q_locked: 'পরীক্ষার সময় ঘোরানো যায় না। ছবিটি দেখে উত্তর বেছে নাও।',
  },
  en: {
    title: 'Circular motion',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Distance',

    ex_label: 'Example',
    ex_fan: 'Electric fan',
    ex_clock: 'Clock hand',
    ex_moon: 'Moon',
    idea: 'If an object keeps going round on a <b class="c-path">circular path</b> at the <b class="c-dist">same distance</b> from a <b class="c-ctr">fixed point</b>, its motion is called <b>circular motion</b>.',
    dist_k: 'Distance from the fixed point ({u})',
    dist_k_moon: 'Distance from the fixed point (about, {u})',
    book_fan: 'An electric fan and a clock hand are examples of circular motion.',
    book_moon: 'Nothing <b>ties the Moon to the Earth</b>, yet it keeps going round the Earth, and it does not fall!',
    unit_cm: 'cm',
    unit_lakh_km: 'lakh km',

    act_pause: 'Pause',
    act_play: 'Play',
    act_measure: 'Measure',

    status_start: 'Touch the point',
    status_more: '{n} more places',
    status_same: 'Always the same distance!',
    status_same_moon: 'About the same distance!',
    status_locked: 'Locked for the test',

    label_center: 'Fixed point',
    label_center_moon: "Fixed point: the Earth's centre",
    label_path: 'Circular path',
    label_dist: '{d} {u}',
    label_dist_about: 'about {d} {u}',
    label_earth: 'Earth',
    label_moon: 'Moon',
    label_after_half: 'After half a turn',

    note_fan: 'Shown much slower',
    note_clock: 'Time shown faster',
    note_moon: 'Sizes, distance, time not to scale',

    hint_drag: 'Drag to turn it: the point never leaves the circular path.',
    hint_elsewhere: 'You measured here already. Measure somewhere else.',

    coach_tap: 'Touch to measure the distance',
    coach_lens: 'Drag here to move the magnifier',

    who_fan: 'The tip of the fan blade',
    who_clock: 'The tip of the second hand',
    letters: 'A B C D',
    q_center: 'Which point is the fixed point that the others go round?',
    center_why: '<b>{c}</b> does not move; every other point goes round it on a circular path.',
    q_turn_half: '{who} is {d} {u} from the fixed point. After half a turn, what will this distance be?',
    q_turn_full: '{who} is {d} {u} from the fixed point. After one turn, what will this distance be?',
    turn_why_half: 'The same distance: <b>{d} {u}</b>. But it is now {c} {u} from where it started (the other side of the circle).',
    turn_why_full: 'The same distance: <b>{d} {u}</b>. After one turn the point is back where it started.',
    q_same: '{who} is going round. What is not changing?',
    same_dist: 'Distance from the fixed point',
    same_place: 'Position',
    same_dir: 'Direction of motion',
    same_start: 'Distance from the start',
    same_why: 'The distance from the fixed point is always <b>{d} {u}</b>; position, direction and distance from the start change.',
    q_everyday: 'Which of these is circular motion?',
    life_pinwheel: 'The tip of a turning paper pinwheel',
    life_stone: 'A stone whirled on a string',
    life_ball: 'A ball dropped from above',
    life_car: 'A car on a straight road',
    life_box: 'A box pushed along the floor',
    life_why_pinwheel: 'The pinwheel’s tip goes round on a circle at the same distance from the pin. The others move in straight lines.',
    life_why_stone: 'The stone goes round on a circle, a string’s length from the hand. The others move in straight lines.',
    q_moon_kind: 'What kind of motion is the Moon’s motion round the Earth?',
    kind_rotation: 'Circular motion',
    kind_linear: 'Linear motion',
    kind_translation: 'Translational motion',
    kind_shm: 'Simple harmonic motion',
    moon_kind_why: 'The Moon goes round on a circle at about the same distance from the Earth’s centre: <b>circular motion</b>.',
    q_moon_center: "Where is the fixed point of the Moon's circular motion?",
    moon_c_earth: "At the Earth's centre",
    moon_c_moon: "At the Moon's centre",
    moon_c_surface: "On the Earth's surface",
    moon_c_middle: 'Halfway between them',
    moon_center_why: "The Moon goes round the Earth about {d} {u} from the Earth's <b>centre</b>.",

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
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
    q_locked: 'It cannot be turned during the test. Look at the picture and pick an answer.',
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
