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
    unit_cm: 'সেমি',
    unit_lakh_km: 'লক্ষ কিমি',

    act_pause: 'থামাও',
    act_play: 'চালাও',
    act_measure: 'দূরত্ব মাপো',

    status_start: 'বিন্দুটি ছুঁয়ে মাপো',
    status_more: 'আরও {n} জায়গায় মাপো',
    status_same: 'দূরত্ব সবসময় সমান!',
    status_locked: 'পরীক্ষার জন্য আটকানো',

    label_center: 'নির্দিষ্ট বিন্দু',
    label_center_moon: 'নির্দিষ্ট বিন্দু<br><small>পৃথিবীর কেন্দ্র</small>',
    label_path: 'বৃত্তাকার পথ',
    label_dist: '{d} {u}',
    label_dist_about: 'প্রায় {d} {u}',
    label_nostring: 'কোনো দড়ি নেই!',
    label_earth: 'পৃথিবী',
    label_moon: 'চাঁদ',
    label_after_half: 'আধা পাক পরে',
    label_after_full: 'এক পাক পরে',

    note_fan: 'অনেক ধীর করে দেখানো',
    note_clock: 'সময় দ্রুত করে দেখানো',
    note_moon: 'আকার, দূরত্ব ও সময় মাপমতো নয়',

    hint_moon: 'চাঁদকে কোনো কিছু দিয়ে পৃথিবীর সাথে বেঁধে রাখা নেই, তবু এটা পৃথিবীকে ঘিরে ঘুরছে!',
    hint_drag: 'ধরে টেনে ঘোরাও: বিন্দুটি বৃত্তাকার পথের বাইরে যায় না।',
    hint_elsewhere: 'এখানে আগেই মেপেছ। অন্য জায়গায় মাপো।',

    coach_tap: 'ছুঁয়ে দূরত্ব মাপো',
    coach_lens: 'বিবর্ধক সরাতে এখানে ধরে টানো',

    // the test
    who_fan: 'পাখার ফলার মাথা',
    who_clock: 'সেকেন্ডের কাঁটার মাথা',
    who_moon: 'চাঁদ',
    letters: 'ক খ গ ঘ',
    q_center: 'কোন বিন্দুটি নির্দিষ্ট বিন্দু, যাকে ঘিরে বাকিরা ঘুরছে?',
    center_why: '<b>{c}</b> নড়ে না; বাকি সব বিন্দু একে ঘিরে বৃত্তাকার পথে ঘোরে।',
    q_turn_half: '{who} এখন নির্দিষ্ট বিন্দু থেকে {d} {u} দূরে। আধা পাক ঘোরার পর কত দূরে থাকবে?',
    q_turn_full: '{who} এখন নির্দিষ্ট বিন্দু থেকে {d} {u} দূরে। এক পাক ঘোরার পর কত দূরে থাকবে?',
    turn_why: 'যত পাকই ঘুরুক, দূরত্ব একই: <b>{d} {u}</b>। বদলায় শুধু শুরুর জায়গা থেকে দূরত্ব ({c} {u})।',
    q_same: '{who} ঘুরছে। কোনটি বদলাচ্ছে না?',
    same_dist: 'নির্দিষ্ট বিন্দু থেকে দূরত্ব',
    same_place: 'অবস্থান',
    same_dir: 'চলার দিক',
    same_start: 'শুরুর জায়গা থেকে দূরত্ব',
    same_why: 'নির্দিষ্ট বিন্দু থেকে দূরত্ব সবসময় <b>{d} {u}</b>; অবস্থান, চলার দিক, শুরু থেকে দূরত্ব বদলায়।',
    q_everyday: 'নিচের কোনটি ঘূর্ণন গতি?',
    life_wheel: 'নাগরদোলায় বসা শিশু',
    life_stone: 'সুতায় বেঁধে ঘোরানো ঢিল',
    life_ball: 'উপর থেকে ছেড়ে দেওয়া বল',
    life_car: 'সোজা রাস্তায় চলা গাড়ি',
    life_box: 'মেঝেতে ধাক্কা দেওয়া বাক্স',
    life_why_wheel: 'নাগরদোলার শিশু চাকার কেন্দ্র থেকে সমান দূরে থেকে বৃত্তাকার পথে ঘোরে। বাকিগুলো সরল রেখায় চলে।',
    life_why_stone: 'ঢিলটি হাত থেকে সুতার সমান দূরত্বে থেকে বৃত্তাকার পথে ঘোরে। বাকিগুলো সরল রেখায় চলে।',
    q_moon_what: 'চাঁদকে কোনো কিছু দিয়ে পৃথিবীর সাথে বেঁধে রাখা নেই। তবু চাঁদ কী করছে?',
    moon_turns: 'পৃথিবীকে ঘিরে ঘুরছে',
    moon_falls: 'পৃথিবীতে পড়ে যাচ্ছে',
    moon_flies: 'সোজা দূরে চলে যাচ্ছে',
    moon_stops: 'এক জায়গায় থেমে আছে',
    moon_what_why: 'দড়ি নেই, তবু চাঁদ প্রায় সমান দূরত্বে থেকে পৃথিবীকে ঘিরে ঘুরছে, টুপ করে পড়েও যাচ্ছে না!',
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
    unit_cm: 'cm',
    unit_lakh_km: 'lakh km',

    act_pause: 'Pause',
    act_play: 'Play',
    act_measure: 'Measure',

    status_start: 'Touch the point',
    status_more: 'Measure at {n} more places',
    status_same: 'Always the same distance!',
    status_locked: 'Locked for the test',

    label_center: 'Fixed point',
    label_center_moon: "Fixed point<br><small>the Earth's centre</small>",
    label_path: 'Circular path',
    label_dist: '{d} {u}',
    label_dist_about: 'about {d} {u}',
    label_nostring: 'No string!',
    label_earth: 'Earth',
    label_moon: 'Moon',
    label_after_half: 'After half a turn',
    label_after_full: 'After one turn',

    note_fan: 'Shown much slower',
    note_clock: 'Time shown faster',
    note_moon: 'Sizes, distance and time not to scale',

    hint_moon: 'Nothing ties the Moon to the Earth, yet it keeps going round the Earth!',
    hint_drag: 'Drag to turn it: the point never leaves the circular path.',
    hint_elsewhere: 'You measured here already. Measure somewhere else.',

    coach_tap: 'Touch to measure the distance',
    coach_lens: 'Drag here to move the magnifier',

    who_fan: 'The tip of the fan blade',
    who_clock: 'The tip of the second hand',
    who_moon: 'The Moon',
    letters: 'A B C D',
    q_center: 'Which point is the fixed point that the others go round?',
    center_why: '<b>{c}</b> does not move; every other point goes round it on a circular path.',
    q_turn_half: '{who} is now {d} {u} from the fixed point. How far will it be after half a turn?',
    q_turn_full: '{who} is now {d} {u} from the fixed point. How far will it be after one turn?',
    turn_why: 'However far it turns, the distance stays <b>{d} {u}</b>. Only the distance from the start changes ({c} {u}).',
    q_same: '{who} is going round. What is not changing?',
    same_dist: 'Distance from the fixed point',
    same_place: 'Position',
    same_dir: 'Direction of motion',
    same_start: 'Distance from the start',
    same_why: 'The distance from the fixed point is always <b>{d} {u}</b>; position, direction and distance from the start change.',
    q_everyday: 'Which of these is circular motion?',
    life_wheel: 'A child on a Ferris wheel',
    life_stone: 'A stone whirled on a string',
    life_ball: 'A ball dropped from above',
    life_car: 'A car on a straight road',
    life_box: 'A box pushed along the floor',
    life_why_wheel: 'The child goes round on a circle at the same distance from the wheel’s centre. The others move in straight lines.',
    life_why_stone: 'The stone goes round on a circle, a string’s length from the hand. The others move in straight lines.',
    q_moon_what: 'Nothing ties the Moon to the Earth. Still, what is the Moon doing?',
    moon_turns: 'Going round the Earth',
    moon_falls: 'Falling onto the Earth',
    moon_flies: 'Flying straight away',
    moon_stops: 'Standing still',
    moon_what_why: 'No string, yet the Moon keeps going round the Earth at about the same distance, and it does not fall!',
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
