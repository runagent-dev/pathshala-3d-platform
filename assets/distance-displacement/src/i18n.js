// Every string the figure shows, in Bangla (as the book, page 39: দূরত্ব, সরণ, আঁকাবাঁকা পথ, অবস্থান, সাপেক্ষে,
// স্কেলার রাশি, ভেক্টর রাশি, তির চিহ্নিত সরলরেখা, তিরের দিক, মান, দিক; the page spells তির) and English.
// Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla). Units: km, as the book
// writes it and as the speed figure on page 41 (the same road) does. In the panel's lines, <i class="d"> is the
// distance's blue (the trail) and <i class="s"> the displacement's orange (the arrow); <b> is the number.

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
    u_km: 'km',
    north_short: 'উ',
    scale_km: '{n} km',
    // under the key: what is to scale on the map and what is not
    note_scale: 'রাস্তা ও দূরত্ব মাপমতো; সাইকেল, বাড়ি, গাছ বড় করে আঁকা',

    // the key: what the two marks on the map are
    key: 'মানচিত্রে কোনটি কী',
    key_dist: 'নীল পথ: দূরত্ব',
    key_dist_sub: 'পথ ধরে মোট যতটা গেলে',
    key_disp: 'কমলা তির: সরণ',
    key_disp_sub: 'A থেকে সোজা, দিকসহ',

    dir_N: 'উত্তর',
    dir_NE: 'উত্তর-পূর্ব',
    dir_E: 'পূর্ব',
    dir_SE: 'দক্ষিণ-পূর্ব',
    dir_S: 'দক্ষিণ',
    dir_SW: 'দক্ষিণ-পশ্চিম',
    dir_W: 'পশ্চিম',
    dir_NW: 'উত্তর-পশ্চিম',
    pill_dist: 'দূরত্ব {v} km',
    pill_disp: 'সরণ {v} km',
    pill_zero: 'সরণ {z}',

    // the one action: the story's next leg (its number is on the button and on the stop in the picture)
    act_b: 'B পর্যন্ত চালাও',
    act_c: 'C পর্যন্ত চালাও',
    act_a: 'A-তে ফিরে চলো',
    act_again: 'আবার B পর্যন্ত চালাও',
    act_new: 'নতুন করে শুরু',

    // the one result line
    out_start: 'তুমি A বিন্দুতে: এখনো <i class="d">দূরত্ব <b>{z}</b></i>, <i class="s">সরণ <b>{z}</b></i>।',
    out_move: '<i class="d">দূরত্ব <b>{dist} {u}</b></i> <span class="dd-dot">·</span> <i class="s">সরণ <b>{disp} {u}</b></i>',
    out_stop: '{at}-তে: পথ ধরে <i class="d">দূরত্ব <b>{dist} {u}</b></i>, কিন্তু A থেকে সোজা <i class="s">সরণ <b>{disp} {u}</b>, {dir} দিকে</i>।',
    out_here: 'এখানে: পথ ধরে <i class="d">দূরত্ব <b>{dist} {u}</b></i>, A থেকে সোজা <i class="s">সরণ <b>{disp} {u}</b>, {dir} দিকে</i>।',
    out_here0: 'এখানে: পথ ধরে <i class="d">দূরত্ব <b>{dist} {u}</b></i>, কিন্তু <i class="s">সরণ <b>{z}</b></i>।',
    out_back: 'A-তে ফিরে এলে <i class="s">সরণ <b>{z}</b></i>, কিন্তু <i class="d">দূরত্ব <b>{sum} {u}</b></i>।',

    // the one rule, growing: before the first stop, after a stop, after C, back at A
    rule_0: 'খুঁটির সংখ্যা বলে A থেকে রাস্তা ধরে কত {u}, আর <b>সরণ</b> হলো A বিন্দুর সাপেক্ষে তোমার <b>অবস্থান</b>।',
    rule_1: '<b>দূরত্ব একটি স্কেলার রাশি</b> (শুধু মান), <b>সরণ ভেক্টর রাশি</b> (মান ও দিক): <b>তিরের দিকটি হচ্ছে সরণের দিক</b>।',
    rule_2: '<b>দূরত্ব</b> যত চলবে তত বাড়বে, কিন্তু <b>সরণ</b> শুধু দেখে শুরু আর শেষের অবস্থান, তাই কমতেও পারে।',
    rule_3: '<b>দূরত্ব স্কেলার রাশি</b>, <b>সরণ ভেক্টর রাশি</b>, আর <b>সরণের মান কখনো দূরত্বের চেয়ে বেশি হয় না</b>: সোজা রেখাই সবচেয়ে ছোট পথ।',

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

    // 1. how to state the displacement at B (a vector: size and direction)
    q_vec: 'সাইকেলটি A থেকে আঁকাবাঁকা পথে B-তে এসেছে। A বিন্দুর সাপেক্ষে এর সরণ কোনটি?',
    opt_vec: '{d} {u}, {dir} দিকে',
    opt_only: 'শুধু {d} {u}',
    why_vec: '<b>{d} {u}, {dir} দিকে</b>: সরণ ভেক্টর রাশি, তাই মান ও দিক দুটোই লাগে।',
    miss_vec_only: 'দিক বাদ গেছে: শুধু মান বললে সেটা স্কেলার।',
    miss_vec_dist: '{dist} {u} হলো পথ ধরে দূরত্ব (নীল পথ), সরণ নয়।',
    miss_vec_dist_only: '{dist} {u} হলো দূরত্ব (নীল পথ), সরণ নয়।',
    // 2. the direction of the displacement, against the way the cycle rides there
    q_dir: 'A বিন্দুর সাপেক্ষে সাইকেলের সরণ কোন দিকে? (উ = উত্তর)',
    why_dir: '<b>{dir}</b>: কমলা তির A থেকে সাইকেলের দিকে, সেটাই সরণের দিক।',
    miss_dir_heading: 'সাইকেল রাস্তা ধরে {heading} দিকে এসেছে; সরণের দিক রাস্তার বাঁক দেখে না।',
    miss_dir_back: 'এটা উল্টো দিক: তির A থেকে শুরু হয়ে সাইকেলে শেষ।',
    miss_dir_mirror: 'পূর্ব আর পশ্চিম উল্টে গেছে: উ-এর ডান দিকে পূর্ব।',
    miss_dir_other: 'কম্পাসের উ দেখে তিরের দিক মেলাও।',
    // 3. the distance of an out-and-back ride
    q_trip: 'সাইকেলটি A থেকে খুঁটি {k1} পর্যন্ত গিয়ে খুঁটি {k2}-তে ফিরে এসেছে। মোট দূরত্ব কত?',
    why_trip: '<b>{total} {u}</b>: {k1} {u} গিয়ে {back} {u} ফিরেছে, {k1} + {back} = {total} {u}।',
    miss_trip_at: '{k2} শুধু বলে সাইকেল এখন কোথায়; ফেরার পথও গুনতে হয়।',
    miss_trip_far: '{k1} {u} শুধু যাওয়ার পথ; ফেরার {back} {u} বাদ গেছে।',
    miss_trip_sum: 'খুঁটির সংখ্যা দুটো যোগ করলে হয় না: ফেরার পথ {back} {u}।',
    miss_trip_disp: '{d} {u} হলো এখনকার সরণ (কমলা তির), দূরত্ব নয়।',
    // 4. the displacement after a round trip
    q_zero: 'সাইকেলটি একটি খুঁটি পর্যন্ত গিয়ে A-তে ফিরে এসেছে। এখন সরণের মান কত?',
    why_zero: '<b>{z}</b>: শুরু আর শেষের অবস্থান একই (A), তাই সরণ শূন্য। দূরত্ব কিন্তু {k} + {k} = {total} {u}।',
    miss_zero_dist: '{total} {u} হলো দূরত্ব (যাওয়া + ফেরা), সরণ নয়।',
    miss_zero_half: '{k} {u} হলো যাওয়ার পথ, সেটাও দূরত্ব।',
    miss_zero_far: '{d} {u} ছিল খুঁটি {k}-তে থাকার সময়ের সরণ।',
    // 5. the displacement is never more than the distance
    q_rule: 'সাইকেল রাস্তা ধরে {k} {u} এসেছে। {one} {u} দাগে মেপে বলো, সরণ (কমলা তির) প্রায় কত?',
    why_rule: '<b>প্রায় {d} {u}</b>: তিরটি {one} {u} দাগের প্রায় {d} গুণ লম্বা, পথ ধরে দূরত্ব ({k} {u}) থেকে অনেক কম।',
    miss_rule_dist: '{k} {u} হলো পথ ধরে দূরত্ব (নীল পথ), সোজা তির নয়।',
    miss_rule_book: '{book} {u} ছিল বইয়ের B-র সরণ; এই তিরটি মেপে দেখো।',
    miss_rule_more: 'সরণের মান কখনো দূরত্বের চেয়ে বেশি হয় না: সোজা রেখাই সবচেয়ে ছোট পথ।',
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
    u_km: 'km',
    north_short: 'N',
    scale_km: '{n} km',
    note_scale: 'Road and distances to scale; cycle, homes and trees drawn bigger',

    key: 'What is what on the map',
    key_dist: 'Blue path: distance',
    key_dist_sub: 'the whole way along',
    key_disp: 'Orange arrow: displacement',
    key_disp_sub: 'straight from A, which way',

    dir_N: 'north',
    dir_NE: 'north-east',
    dir_E: 'east',
    dir_SE: 'south-east',
    dir_S: 'south',
    dir_SW: 'south-west',
    dir_W: 'west',
    dir_NW: 'north-west',
    pill_dist: 'distance {v} km',
    pill_disp: 'displacement {v} km',
    pill_zero: 'displacement {z}',

    act_b: 'Ride to B',
    act_c: 'Ride on to C',
    act_a: 'Ride back to A',
    act_again: 'Ride to B again',
    act_new: 'Start again',

    out_start: 'You are at A: <i class="d">distance <b>{z}</b></i>, <i class="s">displacement <b>{z}</b></i> so far.',
    out_move: '<i class="d">distance <b>{dist} {u}</b></i> <span class="dd-dot">·</span> <i class="s">displacement <b>{disp} {u}</b></i>',
    out_stop:
      'At {at}: <i class="d">distance <b>{dist} {u}</b></i> along the road, but <i class="s">displacement <b>{disp} {u}</b> {dir}</i> from A.',
    out_here: 'Here: <i class="d">distance <b>{dist} {u}</b></i> along the road; <i class="s">displacement <b>{disp} {u}</b> {dir}</i> from A.',
    out_here0: 'Here: along the way, <i class="d">distance <b>{dist} {u}</b></i>, but <i class="s">displacement <b>{z}</b></i>.',
    out_back: 'Back at A, the <i class="s">displacement is <b>{z}</b></i>, but the <i class="d">distance is <b>{sum} {u}</b></i>.',

    rule_0: 'The posts’ numbers say how many {u} along the road from A, and <b>displacement</b> is your <b>position</b> with respect to point A.',
    rule_1: '<b>Distance is a scalar</b> (just a size), <b>displacement a vector</b> (size and direction): <b>the arrow’s way is its direction</b>.',
    rule_2:
      'The <b>distance</b> grows as long as you ride, but the <b>displacement</b> only looks at where you started and where you are, so it can shrink.',
    rule_3:
      '<b>Distance is a scalar</b>, <b>displacement a vector</b>, and <b>the displacement is never more than the distance</b>: a straight line is the shortest way.',

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

    q_vec: 'The cycle rode from A along the winding road to B. What is its displacement from A?',
    opt_vec: '{d} {u}, towards the {dir}',
    opt_only: 'just {d} {u}',
    why_vec: '<b>{d} {u}, towards the {dir}</b>: displacement is a vector, so it needs a size and a direction.',
    miss_vec_only: 'The direction is missing: a size alone is a scalar.',
    miss_vec_dist: '{dist} {u} is the distance along the road (the blue path), not the displacement.',
    miss_vec_dist_only: '{dist} {u} is the distance (the blue path), not the displacement.',
    q_dir: 'Which way is the displacement of the cycle with respect to point A? (N = north)',
    why_dir: '<b>{dir}</b>: the orange arrow points from A to the cycle; that is the direction of the displacement.',
    miss_dir_heading: 'The cycle came {heading} along the road; the displacement does not follow the bends of the road.',
    miss_dir_back: 'That is the opposite way: the arrow starts at A and ends at the cycle.',
    miss_dir_mirror: 'East and west are swapped: east is to the right of N.',
    miss_dir_other: 'Match the arrow against the compass’s N.',
    q_trip: 'The cycle rode from A to post {k1}, then back to post {k2}. What is the distance in all?',
    why_trip: '<b>{total} {u}</b>: it went {k1} {u} and came back {back} {u}, {k1} + {back} = {total} {u}.',
    miss_trip_at: '{k2} only says where the cycle is now; the way back counts too.',
    miss_trip_far: '{k1} {u} is only the way out; the {back} {u} back is missing.',
    miss_trip_sum: 'Adding the two post numbers does not work: the way back is {back} {u}.',
    miss_trip_disp: '{d} {u} is the displacement now (the orange arrow), not the distance.',
    q_zero: 'The cycle rode out to a post and back to A. What is the size of the displacement now?',
    why_zero: '<b>{z}</b>: it starts and ends at the same place (A), so the displacement is zero. The distance is {k} + {k} = {total} {u}.',
    miss_zero_dist: '{total} {u} is the distance (out + back), not the displacement.',
    miss_zero_half: '{k} {u} is the way out, a distance too.',
    miss_zero_far: '{d} {u} was the displacement at post {k}.',
    q_rule: 'The cycle rode {k} {u} along the road. With the {one} {u} bar, about how big is the displacement?',
    why_rule: '<b>About {d} {u}</b>: the arrow is about {d} times the {one} {u} bar, much less than the distance along the way ({k} {u}).',
    miss_rule_dist: '{k} {u} is the distance along the road (the blue path), not the straight arrow.',
    miss_rule_book: '{book} {u} was the displacement of B in the book; measure this arrow.',
    miss_rule_more: 'The displacement is never more than the distance: a straight line is the shortest way.',
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
