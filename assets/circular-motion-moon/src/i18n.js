// Every string the figure shows, in Bangla (the book's words, page 36: ঘূর্ণন গতি, নির্দিষ্ট বিন্দু, সমদূরত্ব,
// বৃত্তাকার পথ, বৈদ্যুতিক পাখা, ঘড়ির কাঁটা, চাঁদ, পৃথিবী) and English.
// Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'ঘূর্ণন গতি',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'দূরত্ব',

    idea: 'একটি বস্তু যদি একটা <span class="c-ctr">নির্দিষ্ট বিন্দু</span> থেকে <span class="c-dist">সমদূরত্বে</span> থেকে <span class="c-path">বৃত্তাকার পথে</span> ঘুরতে থাকে, তাহলে তার গতিকে বলে <b>ঘূর্ণন গতি</b>।',
    dist_k: 'পৃথিবীর কেন্দ্র থেকে দূরত্ব ({u})',
    book: 'চাঁদকে কোনো কিছু দিয়ে পৃথিবীর সাথে বেঁধে রাখা নেই। তবু এটি পৃথিবীকে ঘিরে ঘুরছে, টুপ করে পড়েও যাচ্ছে না!',
    note: '(আকার, দূরত্ব, সময় মাপমতো নয়)',
    label_known: 'প্রায় {d} {u}',
    who_moon: 'চাঁদ',
    unit_lakh_km: 'লক্ষ কিমি',

    act_pause: 'থামাও',
    act_play: 'চালাও',
    act_measure: 'দূরত্ব মাপো',

    status_start: 'বিন্দুটি ছুঁয়ে মাপো',
    status_more: 'আরও {n} জায়গায় মাপো',
    status_same: 'দূরত্ব প্রায় সমান!',
    status_locked: 'পরীক্ষার জন্য আটকানো',

    label_center: 'নির্দিষ্ট বিন্দু',
    label_path: 'বৃত্তাকার পথ',
    label_dist: '{d} {u}',
    label_earth: 'পৃথিবী',
    label_moon: 'চাঁদ',

    // how the picture is stylised: a quiet aside after the book's line in the panel

    hint_drag: 'ধরে টেনে ঘোরাও: বিন্দুটি বৃত্তাকার পথের বাইরে যায় না।',
    hint_elsewhere: 'এখানে আগেই মেপেছ। অন্য জায়গায় মাপো।',

    coach_tap: 'ছুঁয়ে দূরত্ব মাপো',

    // the test
    q_same: '{who} ঘুরছে। কোনটি বদলাচ্ছে না?',
    same_dist: 'নির্দিষ্ট বিন্দু থেকে দূরত্ব',
    same_place: 'অবস্থান',
    same_dir: 'চলার দিক',
    same_start: 'শুরুর জায়গা থেকে দূরত্ব',
    same_why: 'পৃথিবীর কেন্দ্র থেকে দূরত্ব সবসময় প্রায় <b>{d} {u}</b>; অবস্থান, চলার দিক, শুরু থেকে দূরত্ব বদলায়।',
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
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Circular motion',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Distance',

    idea: 'An object going round a <span class="c-ctr">fixed point</span> on a <span class="c-path">circular path</span>, always at the <span class="c-dist">same distance</span>, is in <b>circular motion</b>.',
    dist_k: "From the Earth's centre ({u})",
    book: 'Nothing ties the Moon to the Earth. Yet it keeps going round the Earth and does not fall!',
    note: '(Not to scale.)',
    label_known: 'about {d} {u}',
    who_moon: 'The Moon',
    unit_lakh_km: 'lakh km',

    act_pause: 'Pause',
    act_play: 'Play',
    act_measure: 'Measure',

    status_start: 'Touch the point',
    status_more: '{n} more places',
    status_same: 'About the same!',
    status_locked: 'Locked for the test',

    label_center: 'Fixed point',
    label_path: 'Circular path',
    label_dist: '{d} {u}',
    label_earth: 'Earth',
    label_moon: 'Moon',

    hint_drag: 'Drag to turn it: the point never leaves the circular path.',
    hint_elsewhere: 'You measured here already. Measure somewhere else.',

    coach_tap: 'Touch to measure the distance',

    q_same: '{who} is going round. What is not changing?',
    same_dist: 'Distance from the fixed point',
    same_place: 'Position',
    same_dir: 'Direction of motion',
    same_start: 'Distance from the start',
    same_why: "Only the distance from the Earth's centre stays about <b>{d} {u}</b>; the others change.",
    q_everyday: 'Which of these is circular motion?',
    life_pinwheel: 'The tip of a turning paper pinwheel',
    life_stone: 'A stone whirled on a string',
    life_ball: 'A ball dropped from above',
    life_car: 'A car on a straight road',
    life_box: 'A box pushed along the floor',
    life_why_pinwheel: 'The tip circles the pin, always the same distance away. The others move in straight lines.',
    life_why_stone: 'The stone circles the hand, a string’s length away. The others move in straight lines.',
    q_moon_kind: 'What kind of motion is the Moon’s motion round the Earth?',
    kind_rotation: 'Circular motion',
    kind_linear: 'Linear motion',
    kind_translation: 'Translational motion',
    kind_shm: 'Simple harmonic motion',
    moon_kind_why: 'The Moon circles the Earth’s centre at about the same distance: <b>circular motion</b>.',
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
