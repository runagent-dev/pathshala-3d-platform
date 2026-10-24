// Every string the figure shows, in Bangla (as the book, page 39: দূরত্ব, সরণ, অতিক্রান্ত দূরত্ব, অবস্থান,
// সাপেক্ষে, স্কেলার রাশি, ভেক্টর রাশি, তির চিহ্নিত সরলরেখা, মান, দিক) and English.
// Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    title: 'দূরত্ব ও সরণ',
    view: 'দেখার ধরন',
    view_front_short: 'ওপর থেকে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'দূরত্ব',
    unit_km: 'কিমি',
    north_short: 'উ',

    distance: 'দূরত্ব',
    displacement: 'সরণ',
    scalar: 'স্কেলার রাশি',
    vector: 'ভেক্টর রাশি',
    dist_note: 'পথ ধরে মোট',
    dir_N: 'উত্তর',
    dir_NE: 'উত্তর-পূর্ব',
    dir_E: 'পূর্ব',
    dir_SE: 'দক্ষিণ-পূর্ব',
    dir_S: 'দক্ষিণ',
    dir_SW: 'দক্ষিণ-পশ্চিম',
    dir_W: 'পশ্চিম',
    dir_NW: 'উত্তর-পশ্চিম',
    dir_line: '{dir} দিকে',
    dir_none: 'শূন্য: কোনো দিক নেই',
    pill_dist: 'দূরত্ব {v} কিমি',
    pill_disp: 'সরণ {v} কিমি',

    idea: 'দূরত্ব: পথ ধরে মোট কতটা গেলে, শুধু মান (স্কেলার রাশি)। সরণ: A থেকে তোমার অবস্থান পর্যন্ত তির চিহ্নিত সরলরেখা, মান ও দিক দুটোই (ভেক্টর রাশি)।',
    line_moving: 'সাইকেল যত চলে, দূরত্ব তত বাড়ে। সরণের তির শুধু দেখায় A-র সাপেক্ষে তুমি এখন কোথায়।',
    line_b: 'B-তে পৌঁছেছ: রাস্তা ধরে দূরত্ব {dist} কিমি, কিন্তু A-র সাপেক্ষে B-এর সরণ মাত্র {disp} কিমি, {dir} দিকে।',
    line_c: 'C-তে: দূরত্ব {dist} কিমি, অথচ সরণ মাত্র {disp} কিমি। আঁকাবাঁকা পথ ঘুরে C আসলে A-র বেশ কাছে।',
    line_back: 'A-তে ফিরে এসেছ: দূরত্ব {dist} কিমি, কিন্তু সরণ শূন্য, কারণ শুরু আর শেষের অবস্থান একই।',
    line_any: 'দূরত্ব {dist} কিমি, সরণের মান {disp} কিমি। সরণের মান কখনো দূরত্বের চেয়ে বেশি হয় না।',

    act_b: 'B-তে যাও',
    act_c: 'C-তে যাও',
    act_a: 'A-তে ফেরো',
    act_new: 'নতুন যাত্রা',
    act_new_long: 'নতুন যাত্রা: সাইকেল A-তে, দূরত্ব শূন্য',

    coach_drag: 'সাইকেল টেনে রাস্তা ধরে চালাও',
    coach_lens: 'বিবর্ধক সরাতে এখানে ধরে টানো',
    q_locked: 'পরীক্ষার সময় সাইকেল নিজে চলে। ছবি দেখে উত্তর বেছে নাও।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',

    q_say: 'A থেকে {stop}-তে এলে A-র সাপেক্ষে তোমার সরণ কীভাবে বলবে?',
    opt_vec: '{d} কিমি, {dir} দিকে',
    opt_only: 'শুধু {d} কিমি',
    why_say: 'সরণ ভেক্টর রাশি: মান ({d} কিমি) ও দিক ({dir}) দুটোই লাগে। {dist} কিমি হলো রাস্তা ধরে দূরত্ব।',
    q_dir: 'A-র সাপেক্ষে সাইকেলের সরণ কোন দিকে? (উ = উত্তর)',
    why_dir: 'সরণ A থেকে সাইকেলের দিকে: {dir}। সাইকেল এখন চলছে {heading} দিকে, সেটা সরণের দিক নয়।',
    q_trip: 'সাইকেলটি যেভাবে চলল, তাতে মোট কত দূরত্ব অতিক্রম করল?',
    why_trip: '{k1} কিমি গিয়ে {back} কিমি ফিরেছে: {k1} + {back} = {total} কিমি। ফেরার পথও দূরত্বে গোনা হয়।',
    q_zero: 'রাস্তা ধরে {k} কিমি গিয়ে আবার A-তে ফিরলে সরণের মান কত?',
    why_zero: 'শুরু আর শেষ একই অবস্থানে (A), তাই সরণ শূন্য; দূরত্ব কিন্তু {k} + {k} = {total} কিমি।',
    q_rule: 'যেকোনো যাত্রায় কোনটি সব সময় সত্য?',
    opt_rule_ok: 'সরণের মান দূরত্বের সমান বা কম',
    opt_rule_eq: 'সরণ আর দূরত্ব সব সময় সমান',
    opt_rule_more: 'সরণের মান দূরত্বের চেয়ে বেশি হতে পারে',
    opt_rule_back: 'ফিরে এলে দূরত্বও শূন্য হয়',
    why_rule: 'সোজা রেখাই সবচেয়ে ছোট পথ, তাই সরণের মান দূরত্বের বেশি হয় না (এখানে {disp} কিমি < {dist} কিমি)।',
  },
  en: {
    title: 'Distance and displacement',
    view: 'View',
    view_front_short: 'From above',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Distance',
    unit_km: 'km',
    north_short: 'N',

    distance: 'Distance',
    displacement: 'Displacement',
    scalar: 'scalar',
    vector: 'vector',
    dist_note: 'along the path, in all',
    dir_N: 'north',
    dir_NE: 'north-east',
    dir_E: 'east',
    dir_SE: 'south-east',
    dir_S: 'south',
    dir_SW: 'south-west',
    dir_W: 'west',
    dir_NW: 'north-west',
    dir_line: 'towards the {dir}',
    dir_none: 'zero: no direction',
    pill_dist: 'distance {v} km',
    pill_disp: 'displacement {v} km',

    idea: 'Distance: how far you went along the path, just a size (a scalar). Displacement: the straight arrow from A to where you are, size and direction (a vector).',
    line_moving: 'The more the cycle rides, the bigger the distance. The displacement arrow only shows where you are now, seen from A.',
    line_b: 'At B: {dist} km along the road, but the displacement of B from A is only {disp} km, towards the {dir}.',
    line_c: 'At C: distance {dist} km, yet the displacement is only {disp} km. After all the bends, C is quite close to A.',
    line_back: 'Back at A: distance {dist} km, but the displacement is zero, because the start and the end are the same place.',
    line_any: 'Distance {dist} km, displacement {disp} km. The displacement is never bigger than the distance.',

    act_b: 'Go to B',
    act_c: 'Go to C',
    act_a: 'Back to A',
    act_new: 'New trip',
    act_new_long: 'New trip: the cycle at A, distance zero',

    coach_drag: 'Drag the cycle along the road',
    coach_lens: 'Drag here to move the magnifier',
    q_locked: 'In the test the cycle moves by itself. Look at the picture and pick an answer.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',

    q_say: 'You rode from A to {stop}. How do you state your displacement from A?',
    opt_vec: '{d} km, towards the {dir}',
    opt_only: 'just {d} km',
    why_say: 'Displacement is a vector: it needs a size ({d} km) and a direction ({dir}). {dist} km is the distance along the road.',
    q_dir: 'Which way is the displacement of the cycle from A? (N = north)',
    why_dir: 'The displacement points from A to the cycle: {dir}. The cycle is now riding {heading}; that is not the direction of the displacement.',
    q_trip: 'Riding the way you saw, how much distance did the cycle cover?',
    why_trip: 'It went {k1} km and came back {back} km: {k1} + {back} = {total} km. The way back counts in the distance too.',
    q_zero: 'Out to km {k} and back to A: what is the size of the displacement?',
    why_zero: 'It starts and ends at the same place (A), so the displacement is zero; the distance is {k} + {k} = {total} km.',
    q_rule: 'Which is always true, on any trip?',
    opt_rule_ok: 'The displacement is at most the distance',
    opt_rule_eq: 'Displacement and distance are always equal',
    opt_rule_more: 'The displacement can be bigger than the distance',
    opt_rule_back: 'Coming back makes the distance zero too',
    why_rule: 'A straight line is the shortest way, so the displacement is never more than the distance (here {disp} km < {dist} km).',
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
