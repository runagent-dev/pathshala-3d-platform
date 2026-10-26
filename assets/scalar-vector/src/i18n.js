// Every string the figure shows, in Bangla (in the book's words, page 38, ২.৩: রাশি, স্কেলার রাশি, ভেক্টর রাশি, মান,
// দিক, তাপমাত্রা, অবস্থান, দূরত্ব, the caption of চিত্র ২.০৩: হুবহু এক, ভিন্ন অবস্থানে, মান সমান হলেও দিক ভিন্ন, দিক
// একই হলেও মান সমান নয়; and the compass words) and English. Use t('key', vars) in code, and t.num() for numbers
// (Bangla digits when the language is Bangla). {a}, {b}, … are a vector's name with its small arrow (HTML from the
// figure); every number comes in as a {var}.

export const STRINGS = {
  bn: {
    title: 'স্কেলার ও ভেক্টর রাশি',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'অবস্থান',

    rose_n: 'উ',
    rose_e: 'পূ',
    rose_s: 'দ',
    rose_w: 'প',
    dir_e: 'পূর্ব',
    dir_ne: 'উত্তর-পূর্ব',
    dir_n: 'উত্তর',
    dir_nw: 'উত্তর-পশ্চিম',
    dir_w: 'পশ্চিম',
    dir_sw: 'দক্ষিণ-পশ্চিম',
    dir_s: 'দক্ষিণ',
    dir_se: 'দক্ষিণ-পূর্ব',

    // labels on the field
    l_you: 'তুমি',
    l_friend: 'বন্ধু',
    l_metres: '{d} m',
    l_vector: '{v}: {d} m, {dir} দিকে',
    l_same: 'হুবহু এক',
    l_dir: 'দিক ভিন্ন',
    l_mag: 'মান সমান নয়',
    note_big: 'মানুষ ও গাছ বড় করে আঁকা; দূরত্ব ঠিক মাপে',
    note_big_short: 'মানুষ বড় করে আঁকা',

    // the action (the big button and the numbered ring on the field)
    act_call: 'বন্ধুকে ডাকো',
    act_ask: 'দিকও জিজ্ঞেস করো',
    act_walk: 'অন্যদেরও ডাকো',
    act_cmp_B: 'B তির মিলিয়ে দেখো',
    act_cmp_C: 'C তির মিলিয়ে দেখো',
    act_cmp_D: 'D তির মিলিয়ে দেখো',
    act_again: 'আবার শুরু করো',
    act_home: 'শুরুতে ফেরো',

    // the result line: what matters in <b>
    out_start: 'বন্ধু মাঠের কোথাও লুকিয়ে আছে। ডেকে জেনে নাও সে কোথায়।',
    out_ring: 'বন্ধু: “আমি <b>{d} m</b> দূরে!” তাহলে সে এই বৃত্তের যেকোনো জায়গায় থাকতে পারে।',
    out_found: 'বন্ধু: “<b>{d} m, {dir} দিকে</b>!” ঠিক এখানে: পেয়ে গেছ!',
    out_heard: 'বন্ধু: “<b>{d} m, {dir} দিকে</b>!”',
    out_walking: 'B, C, D হাঁটছে অন্য তিন জায়গা থেকে…',
    out_walk: 'B, C, D হাঁটল অন্য তিন জায়গা থেকে। কোনটি {a}-এর সমান?',
    out_moving: '{x}-কে না ঘুরিয়ে {y}-এর গোড়ায় আনা হচ্ছে…',
    out_equal: '{x} আর {y} <b>হুবহু এক</b>: মান সমান, দিক একই',
    out_dir: '{x} আর {y} ভিন্ন: মান সমান, কিন্তু <b>দিক ভিন্ন</b>',
    out_mag: '{x} আর {y} ভিন্ন: দিক একই, কিন্তু <b>মান সমান নয়</b>',

    // the rule line: the book's words in <b>, growing with what the student has found out
    rule_start: '<b>তাপমাত্রা</b> বোঝাতে একটি মান বললেই চলে, যেমন {temp}° C। বন্ধু কোথায় আছে, তা বোঝাতেও কি একটি মানই যথেষ্ট?',
    rule_ring: 'শুধু <b>মান</b> ({d} m) দিয়ে বন্ধুর জায়গা বোঝা গেল না। তাপমাত্রার মতো যে রাশি শুধু একটি মান দিয়ে পুরোপুরি প্রকাশ করা যায়, সেটি <b>স্কেলার রাশি</b>।',
    rule_found: '<b>অবস্থান</b> বোঝাতে শুধু দূরত্ব দিয়ে কাজ হলো না, দিকটিও বলতে হলো। যে রাশি প্রকাশ করতে মানের সাথে দিকও বলতে হয়, সেটি <b>ভেক্টর রাশি</b>।',
    rule_walk: 'মিলিয়ে দেখতে একটি তিরকে না ঘুরিয়ে, ছোট-বড় না করে অন্যটির গোড়ায় আনো। হুবহু মিলে গেলে ভেক্টর দুটি এক।',
    rule_B: '<b>{a} ও {b} ভেক্টর হুবহু এক, যদিও ভিন্ন অবস্থানে রয়েছে।</b> তির কোথায় আঁকা, তাতে ভেক্টর বদলায় না।',
    rule_C: '<b>{c} ভেক্টর {a} থেকে ভিন্ন, কারণ মান সমান হলেও দিক ভিন্ন।</b>',
    rule_C_ab: '<b>{c} ভেক্টর {a} ও {b} থেকে ভিন্ন, কারণ মান সমান হলেও দিক ভিন্ন।</b>',
    rule_D: '<b>{d} ভেক্টর {c} ভেক্টর থেকে ভিন্ন, কারণ দিক একই হলেও মান সমান নয়।</b>',
    rule_all: 'মান ও দিক দুটোই সমান হলে তবেই ভেক্টর দুটি এক। <b>স্কেলার</b>: তাপমাত্রা, সময়, দৈর্ঘ্য, ভর। <b>ভেক্টর</b>: অবস্থান, বেগ, বল।',

    hint_wait: 'দেখো…',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'মাঠের ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
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
    q_locked: 'পরীক্ষার সময় মাঠের ছবি আটকানো থাকে। দেখে উত্তর বেছে নাও।',
    letters: 'কখগঘ',
    flag: 'পতাকা {k}',

    q_clue: 'রাজু লুকিয়ে আছে। সে বলল: “আমি তোমার থেকে {d} m দূরে।” রাজু কোন পতাকার কাছে?',
    c_spot: 'পতাকা {k}, {dir} দিকে',
    c_any: 'যেকোনোটির কাছে হতে পারে',
    why_clue: '<b>যেকোনোটির কাছে হতে পারে</b>: তিনটিই তোমার থেকে {d} m দূরে। শুধু মান দিয়ে অবস্থান ঠিক হয় না।',
    not_spot: 'পতাকা {k}-এর মতো অন্য দুটিও {d} m দূরে।',

    q_find: 'বন্ধু বলল: “আমি তোমার থেকে {d} m, {dir} দিকে।” বন্ধু কোন পতাকার কাছে?',
    why_find: '<b>পতাকা {k}</b>: {d} m, {dir} দিকে। মান আর দিক দুটো জানলে জায়গা একটাই।',
    not_opposite: 'এটি উল্টো দিকে ({dir})।',
    not_eastwest: 'এখানে পূর্ব আর পশ্চিম উল্টে গেছে ({dir})।',
    not_northsouth: 'এখানে উত্তর আর দক্ষিণ উল্টে গেছে ({dir})।',

    q_equal: 'মাঠে পাঁচটি তির আঁকা। কোনটি {a} ভেক্টরের সমান?',
    why_equal: '<b>{x}</b>: মান ও দিক দুটোই {a}-এর সমান; গোড়ায় আনলে হুবহু মিলে যায়।',
    not_turned: '{x}-এর মান সমান, কিন্তু দিক ভিন্ন।',
    not_shorter: '{x}-এর দিক একই, কিন্তু মান অর্ধেক।',
    not_reversed: '{x}-এর মান সমান, কিন্তু দিক উল্টো।',

    q_why: '{p} আর {q} ভিন্ন ভেক্টর। কেন?',
    w_direction: 'মান সমান, দিক ভিন্ন',
    w_magnitude: 'দিক একই, মান ভিন্ন',
    w_both: 'মান ও দিক দুটোই ভিন্ন',
    w_place: 'দুটি ভিন্ন জায়গায় আঁকা',
    why_direction: '<b>মান সমান, দিক ভিন্ন</b>: দুটিই {l1} m লম্বা, কিন্তু দুই দিকে মুখ করা।',
    why_magnitude: '<b>দিক একই, মান ভিন্ন</b>: দুটি একই দিকে, কিন্তু একটি {l1} m, অন্যটি {l2} m।',
    why_both: '<b>মান ও দিক দুটোই ভিন্ন</b>: একটি {l1} m, অন্যটি {l2} m, মুখও দুই দিকে।',
    not_place: 'জায়গা বদলালে ভেক্টর বদলায় না।',
    not_same_mag: 'তির দুটি সমান লম্বা: মান সমান।',
    not_diff_mag: 'তির দুটি সমান লম্বা নয়: মান ভিন্ন।',
    not_same_dir: 'তির দুটি একই দিকে: দিক একই।',
    not_diff_dir: 'তির দুটি একই দিকে নয়: দিক ভিন্ন।',

    q_kind_s: 'নিচের কোনটি শুধু একটি মান দিয়েই পুরোপুরি প্রকাশ করা যায়?',
    q_kind_v: 'তাপমাত্রা বলতে একটি মানই যথেষ্ট। নিচের কোনটি বলতে মানের সাথে দিকও লাগে?',
    qn_temp: 'তাপমাত্রা',
    qn_time: 'সময়',
    qn_length: 'দৈর্ঘ্য',
    qn_mass: 'ভর',
    qn_position: 'অবস্থান',
    qn_velocity: 'বেগ',
    qn_force: 'বল',
    why_kind_s: '<b>{q}</b>: শুধু একটি মান দিয়েই প্রকাশ করা যায়, তাই স্কেলার রাশি। বাকি তিনটি ভেক্টর।',
    why_kind_v: '<b>{q}</b>: মানের সাথে দিকও বলতে হয়, তাই ভেক্টর রাশি। বাকি তিনটি স্কেলার।',
    not_is_vector: '{q} বলতে দিকও লাগে: এটি ভেক্টর।',
    not_is_scalar: '{q} বলতে একটি মানই যথেষ্ট: এটি স্কেলার।',
  },
  en: {
    title: 'Scalar and vector quantities',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Position',

    rose_n: 'N',
    rose_e: 'E',
    rose_s: 'S',
    rose_w: 'W',
    dir_e: 'east',
    dir_ne: 'north-east',
    dir_n: 'north',
    dir_nw: 'north-west',
    dir_w: 'west',
    dir_sw: 'south-west',
    dir_s: 'south',
    dir_se: 'south-east',

    l_you: 'you',
    l_friend: 'friend',
    l_metres: '{d} m',
    l_vector: '{v}: {d} m {dir}',
    l_same: 'exactly the same',
    l_dir: 'other direction',
    l_mag: 'magnitude not equal',
    note_big: 'People and trees drawn bigger; distances to scale',
    note_big_short: 'People drawn bigger',

    act_call: 'Call your friend',
    act_ask: 'Ask the direction too',
    act_walk: 'Call the others too',
    act_cmp_B: 'Compare arrow B',
    act_cmp_C: 'Compare arrow C',
    act_cmp_D: 'Compare arrow D',
    act_again: 'Start again',
    act_home: 'Back to the start',

    out_start: 'Your friend is hiding somewhere on the field. Call and find out where.',
    out_ring: 'Friend: “I am <b>{d} m</b> away!” Then they could be anywhere on this circle.',
    out_found: 'Friend: “<b>{d} m, to the {dir}</b>!” Right here: found!',
    out_heard: 'Friend: “<b>{d} m, to the {dir}</b>!”',
    out_walking: 'B, C and D are walking from three other places…',
    out_walk: 'B, C and D walked from three other places. Which equals {a}?',
    out_moving: 'Bringing {x} to the tail of {y} without turning it…',
    out_equal: '{x} and {y} are <b>exactly the same</b>: equal magnitude, same direction',
    out_dir: '{x} and {y} differ: equal magnitude, but <b>another direction</b>',
    out_mag: '{x} and {y} differ: same direction, but <b>magnitude not equal</b>',

    rule_start: 'For a <b>temperature</b> one value is enough, e.g. {temp}° C. Is one value enough to say where your friend is, too?',
    rule_ring:
      'The <b>magnitude</b> alone ({d} m) did not say where your friend is. A quantity that one value describes completely, like temperature, is a <b>scalar quantity</b>.',
    rule_found:
      'For a <b>position</b> the distance was not enough; the direction had to be given too. A quantity that needs a direction as well as a magnitude is a <b>vector quantity</b>.',
    rule_walk:
      'To compare, bring one arrow to the other’s tail without turning, stretching or shrinking it. If they match exactly, the vectors are the same.',
    rule_B:
      '<b>Vectors {a} and {b} are exactly the same, although they are in different places.</b> Where an arrow is drawn does not change the vector.',
    rule_C: '<b>Vector {c} differs from {a}: the magnitude is equal, but the direction differs.</b>',
    rule_C_ab: '<b>Vector {c} differs from {a} and {b}: the magnitude is equal, but the direction differs.</b>',
    rule_D: '<b>Vector {d} differs from vector {c}: the direction is the same, but the magnitude is not equal.</b>',
    rule_all:
      'Two vectors are the same only if both magnitude and direction are equal. <b>Scalars</b>: temperature, time, length, mass. <b>Vectors</b>: position, velocity, force.',

    hint_wait: 'Watch…',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the field, think, and pick the right answer.',
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
    q_locked: 'The field is locked during the test. Look at it and pick an answer.',
    letters: 'ABCD',
    flag: 'Flag {k}',

    q_clue: 'Raju is hiding. He says: “I am {d} m away from you.” Which flag is he at?',
    c_spot: 'Flag {k}, to the {dir}',
    c_any: 'It could be any of them',
    why_clue: '<b>It could be any of them</b>: all three are {d} m from you. The magnitude alone does not fix a position.',
    not_spot: 'Like flag {k}, the other two are {d} m away too.',

    q_find: 'Your friend says: “I am {d} m from you, to the {dir}.” Which flag is your friend at?',
    why_find: '<b>Flag {k}</b>: {d} m to the {dir}. With magnitude and direction there is only one place.',
    not_opposite: 'That is the opposite way ({dir}).',
    not_eastwest: 'East and west are swapped there ({dir}).',
    not_northsouth: 'North and south are swapped there ({dir}).',

    q_equal: 'Five arrows are drawn on the field. Which is equal to vector {a}?',
    why_equal: '<b>{x}</b>: magnitude and direction both equal those of {a}; at its tail it matches exactly.',
    not_turned: '{x} has the same magnitude, but another direction.',
    not_shorter: '{x} has the same direction, but half the magnitude.',
    not_reversed: '{x} has the same magnitude, but the opposite direction.',

    q_why: '{p} and {q} are different vectors. Why?',
    w_direction: 'Equal magnitude, other direction',
    w_magnitude: 'Same direction, other magnitude',
    w_both: 'Both magnitude and direction differ',
    w_place: 'They are drawn in different places',
    why_direction: '<b>Equal magnitude, other direction</b>: both are {l1} m long, but they point two ways.',
    why_magnitude: '<b>Same direction, other magnitude</b>: they point the same way, but one is {l1} m, the other {l2} m.',
    why_both: '<b>Both differ</b>: one is {l1} m, the other {l2} m, and they point two ways.',
    not_place: 'Moving an arrow does not change the vector.',
    not_same_mag: 'The two arrows are equally long: equal magnitude.',
    not_diff_mag: 'The two arrows are not equally long: the magnitude differs.',
    not_same_dir: 'The two arrows point the same way: same direction.',
    not_diff_dir: 'The two arrows do not point the same way: the direction differs.',

    q_kind_s: 'Which of these can be stated completely with one value alone?',
    q_kind_v: 'One value is enough for a temperature. Which of these needs a direction as well as a magnitude?',
    qn_temp: 'temperature',
    qn_time: 'time',
    qn_length: 'length',
    qn_mass: 'mass',
    qn_position: 'position',
    qn_velocity: 'velocity',
    qn_force: 'force',
    why_kind_s: '<b>{q}</b>: one value states it completely, so it is a scalar quantity. The other three are vectors.',
    why_kind_v: '<b>{q}</b>: it needs a direction as well as a magnitude, so it is a vector quantity. The other three are scalars.',
    not_is_vector: '{q} needs a direction too: it is a vector.',
    not_is_scalar: 'One value is enough for {q}: it is a scalar.',
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
