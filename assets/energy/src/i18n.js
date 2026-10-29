// Every string the figure shows, in Bangla (the book's words on page 102, section 4.2 শক্তি) and English. Use
// t('key', vars) in code; numbers in vars go through t.num (Bangla digits). Units are the book's Latin symbols
// (J, m, kg, m/s), passed in as words around them stay Bangla.

export const STRINGS = {
  bn: {
    title: 'শক্তি (Energy)',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'শক্তি',
    aria_stage: 'একজন আরোহী সাইকেলে একটি পাহাড়ে ওঠেন, চূড়া থেকে গড়িয়ে নামেন, তারপর ব্রেক করে থামেন',
    parts: 'যাত্রার তিন অংশ',
    chip_up: 'ধনাত্মক কাজ',
    chip_down: 'শক্তির রূপান্তর',
    chip_brake: 'ঋণাত্মক কাজ',
    res_up: '+{e} J',
    res_down: 'মোট একই',
    res_brake: '−{e} J',
    act_climb: 'প্যাডেল করে পাহাড়ে ওঠো',
    act_climbing: 'আরোহী প্যাডেল করছে…',
    act_roll: 'চূড়া থেকে গড়িয়ে নামতে দাও',
    act_brake: 'ব্রেক করো',
    act_braking: 'ব্রেক চাপা হচ্ছে…',
    act_go: 'চালিয়ে যাও',
    act_again: 'আবার শুরু করো',
    act_home: 'শুরুতে ফেরো',
    m_pe: 'বিভব শক্তি',
    m_ke: 'গতিশক্তি',
    m_total: 'মোট',
    m_heat: 'ব্রেকে তাপ',
    m_value: '{e} J',
    m_aria: 'বিভব শক্তি {pe} J, গতিশক্তি {ke} J, মোট {total} J, ব্রেকে তাপ {heat} J',
    note: 'আরোহী ও সাইকেলের ভর {m} kg · ঘর্ষণ ও বাতাসের বাধা ধরা হয়নি',
    l_height: 'উচ্চতা {h} m',
    l_push: 'প্যাডেলের বল: চলার দিকে',
    l_brake: 'ব্রেকের বল: উল্টো দিকে',
    l_pe: 'বিভব শক্তি {e} J',
    rule_start:
      '<b>শক্তি হচ্ছে কাজ করার সামর্থ্য।</b> সাইকেলটি নিচের রাস্তায় থেমে আছে: উচ্চতা ও বেগ দুটোই শূন্য, তাই এখনো এর কাজ করার মতো শক্তি নেই। প্যাডেলে বল দিয়ে একে পাহাড়ে তোলো।',
    rule_climb:
      '<b>ধনাত্মক কাজ করা → বস্তুটিকে শক্তি দেওয়া।</b> প্যাডেলের বল চলার দিকে: আরোহী যতটুকু কাজ করছেন, সাইকেল ততটুকু শক্তি পাচ্ছে। সেই শক্তি আরোহীকে দিতে হচ্ছে, শরীরের রাসায়নিক শক্তি থেকে।',
    rule_top:
      'চূড়ায় সাইকেল থেমে আছে, তবু এর <b>{e} J</b> শক্তি আছে: উঁচুতে থাকার জন্য জমা <b>বিভব শক্তি</b>। এই শক্তি দিয়ে সাইকেলটি কাজ করতে পারে: ছেড়ে দিলেই গড়িয়ে নামবে।',
    rule_roll:
      '<b>আমরা শুধু এক ধরনের শক্তিকে অন্য ধরনের শক্তিতে রূপান্তর করি।</b> নামার সময় বিভব শক্তি কমছে, গতিশক্তি ঠিক ততটুকু বাড়ছে। ঘর্ষণ ধরা হয়নি, তাই মোট শক্তি একই: {e} J।',
    rule_flat: 'নিচে উচ্চতা শূন্য: সবটুকু শক্তি এখন <b>গতিশক্তি</b>, {e} J (বেগ প্রায় {v} m/s)। ঘর্ষণ নেই ধরেছি, তাই সাইকেল এভাবেই চলতে থাকবে। এবার ব্রেক করো।',
    rule_brake: '<b>ঋণাত্মক কাজ করা → বস্তুটি থেকে শক্তি সরিয়ে নেওয়া।</b> ব্রেকের বল চলার উল্টো দিকে: যতটুকু কাজ, সাইকেল থেকে ততটুকু শক্তি সরে গিয়ে ব্রেকে তাপ হচ্ছে।',
    rule_stopped: 'সাইকেল থেমেছে: {e} J শক্তি সরে গিয়ে ব্রেকে তাপ হয়েছে, হারিয়ে যায়নি। <b>শক্তির কোনো দিক নেই, এটি একটি স্কেলার। শক্তির একক J (জুল)।</b>',

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
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_climb: 'আরোহী প্যাডেল করে পাহাড়ে উঠছেন। প্যাডেলের বল সাইকেলের উপর কী করছে?',
    c_pos: 'ধনাত্মক কাজ করে শক্তি দিচ্ছে',
    c_neg: 'ঋণাত্মক কাজ করে শক্তি সরিয়ে নিচ্ছে',
    c_none: 'কোনো কাজ করছে না, শক্তি একই আছে',
    c_nowork: 'শক্তি দিচ্ছে, কিন্তু কোনো কাজ করছে না',
    why_climb: '<b>ধনাত্মক কাজ করে শক্তি দিচ্ছে।</b> বল চলার দিকে, তাই কাজ ধনাত্মক; যতটুকু কাজ, সাইকেল ততটুকু শক্তি পায়। উঁচুতে উঠছে, তাই বিভব শক্তি বাড়ছে।',
    not_c_neg: 'ঋণাত্মক কাজ হয় বল চলার উল্টো দিকে হলে, যেমন ব্রেকের বল।',
    not_c_none: 'সাইকেল উঁচুতে উঠছে, তাই এর শক্তি বাড়ছে।',
    not_c_nowork: 'বই বলছে: ধনাত্মক কাজ করা মানেই বস্তুটিকে শক্তি দেওয়া।',

    q_top: 'সাইকেলটি পাহাড়ের চূড়ায় থেমে আছে। এখন এর শক্তি কেমন?',
    t_pe: 'উঁচুতে থাকার জন্য জমা শক্তি আছে',
    t_none: 'কোনো শক্তি নেই, কারণ এটি থেমে আছে',
    t_ke: 'এর সবটুকু শক্তি গতিশক্তি',
    t_lost: 'ওঠার সময় সব শক্তি খরচ হয়ে গেছে',
    why_top: '<b>উঁচুতে থাকার জন্য জমা শক্তি (বিভব শক্তি) আছে: {e} J।</b> থেমে থাকলেও এটি কাজ করতে পারে: ছেড়ে দিলেই গড়িয়ে নামবে। শক্তি মানে কাজ করার সামর্থ্য।',
    not_t_none: 'থেমে আছে বলে গতিশক্তি নেই, কিন্তু উচ্চতার জন্য শক্তি আছে।',
    not_t_ke: 'বেগ শূন্য, তাই গতিশক্তিও শূন্য।',
    not_t_lost: 'আরোহীর কাজ হারায়নি: সেটিই চূড়ায় জমা শক্তি।',

    q_roll: 'চূড়ায় মোট শক্তি ছিল {total} J; ঘর্ষণ নেই। ছবিতে এখনকার বিভব শক্তি দেখো। এখন গতিশক্তি কত?',
    why_roll: '<b>{ke} J।</b> মোট শক্তি একই থাকে, তাই গতিশক্তি = {total} J − {pe} J = {ke} J।',
    not_r_pe: 'এটি বিভব শক্তি, গতিশক্তি নয়।',
    not_r_total: 'সবটুকু গতিশক্তি হয় একেবারে নিচে নামলে।',
    not_r_sum: 'মোট শক্তি বাড়ে না: যোগ নয়, বিয়োগ করতে হবে।',

    q_brake: 'সমতল রাস্তায় আরোহী ব্রেক করছেন। ব্রেকের বল কী করছে?',
    b_neg: 'ঋণাত্মক কাজ করে শক্তি সরিয়ে নিচ্ছে',
    b_pos: 'ধনাত্মক কাজ করে শক্তি দিচ্ছে',
    b_gone: 'শক্তি ধ্বংস করছে, তা আর কোথাও থাকে না',
    b_pe: 'গতিশক্তিকে বিভব শক্তিতে বদলাচ্ছে',
    why_brake: '<b>ঋণাত্মক কাজ করে শক্তি সরিয়ে নিচ্ছে।</b> ব্রেকের বল চলার উল্টো দিকে; সরানো শক্তি ব্রেকে তাপ হয়ে যায় (প্যাডগুলো গরম হয়ে ওঠে)।',
    not_b_pos: 'বল চলার উল্টো দিকে, তাই কাজ ঋণাত্মক।',
    not_b_gone: 'শক্তি হারায় না: বল প্রয়োগকারী, এখানে ব্রেক, তা তাপ হিসেবে পায়।',
    not_b_pe: 'রাস্তা সমতল, সাইকেল উঁচুতে উঠছে না।',

    q_dir: 'চূড়া থেকে ডান দিকের ঢাল বেয়ে নামলে নিচে গতিশক্তি হয় {total} J। বাম দিকের ঢাল বেয়ে নামলে নিচে গতিশক্তি কত হতো?',
    why_dir: '<b>{total} J, একই।</b> শক্তির কোনো দিক নেই, এটি একটি স্কেলার; একই উচ্চতা থেকে যে দিকেই নামুক, একই শক্তি পায়।',
    not_d_neg: 'শক্তির দিক নেই, তাই দিক বদলালে এর চিহ্ন বদলায় না।',
    not_d_zero: 'একই উচ্চতা থেকে নামছে, তাই একই গতিশক্তি পায়।',
    not_d_half: 'বাম দিকের ঢালও {h} m উঁচু: পুরো উচ্চতা নামে।',

    q_unit: 'বই অনুযায়ী শক্তির একক কোনটি?',
    u_j: 'J (জুল)',
    u_n: 'N (নিউটন)',
    u_w: 'W (ওয়াট)',
    u_p: 'kg m/s',
    why_unit: '<b>J (জুল)।</b> কাজ করে শক্তি তৈরি হয়, শক্তি খরচ করে কাজ হয়; তাই দুটোর একই একক আর একই মাত্রা: [W] = ML<sup>2</sup>T<sup>−2</sup>।',
    not_u_n: 'নিউটন বলের একক।',
    not_u_w: 'ওয়াট ক্ষমতার একক।',
    not_u_p: 'kg m/s ভরবেগের একক।',
  },
  en: {
    title: 'Energy (শক্তি)',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Energy',
    aria_stage: 'A cyclist rides up a hill, rolls down from the top, then brakes to a stop',
    parts: 'The three parts of the ride',
    chip_up: 'Positive work',
    chip_down: 'Energy changes form',
    chip_brake: 'Negative work',
    res_up: '+{e} J',
    res_down: 'Total the same',
    res_brake: '−{e} J',
    act_climb: 'Pedal up the hill',
    act_climbing: 'The rider is pedalling…',
    act_roll: 'Let it roll down from the top',
    act_brake: 'Brake',
    act_braking: 'Braking…',
    act_go: 'Carry on',
    act_again: 'Start again',
    act_home: 'Back to the start',
    m_pe: 'Potential energy',
    m_ke: 'Kinetic energy',
    m_total: 'Total',
    m_heat: 'Heat in the brakes',
    m_value: '{e} J',
    m_aria: 'Potential energy {pe} J, kinetic energy {ke} J, total {total} J, heat in the brakes {heat} J',
    note: 'Rider and bicycle {m} kg · friction and air resistance left out',
    l_height: 'Height {h} m',
    l_push: 'Pedal force: along the motion',
    l_brake: 'Brake force: against the motion',
    l_pe: 'Potential energy {e} J',
    rule_start:
      '<b>Energy is the capacity to do work.</b> The bicycle is at rest on the road below: its height and speed are both zero, so it has no energy to do work yet. Pedal to take it up the hill.',
    rule_climb:
      '<b>Positive work → giving the object energy.</b> The pedal force is along the motion: as much work as the rider does, that much energy the bicycle gets. The rider has to supply it, from the chemical energy in their body.',
    rule_top:
      'At the top the bicycle is at rest, yet it has <b>{e} J</b> of energy: <b>potential energy</b>, stored because it is high up. With it, the bicycle can do work: let go, and it rolls down.',
    rule_roll:
      '<b>We only change one kind of energy into another.</b> On the way down the potential energy falls and the kinetic energy rises by just as much. Friction is left out, so the total stays the same: {e} J.',
    rule_flat:
      'At the bottom the height is zero: all the energy is now <b>kinetic energy</b>, {e} J (speed about {v} m/s). With no friction the bicycle would keep going like this. Now brake.',
    rule_brake:
      '<b>Negative work → taking energy away from the object.</b> The brake force is against the motion: as much work as it does, that much energy leaves the bicycle and becomes heat in the brakes.',
    rule_stopped:
      'The bicycle has stopped: {e} J of energy left it and became heat in the brakes; it was not lost. <b>Energy has no direction: it is a scalar. Its unit is the J (joule).</b>',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The scene stays put during the test. Look at the picture and pick an answer.',

    q_climb: 'The rider is pedalling up the hill. What is the pedal force doing to the bicycle?',
    c_pos: 'Doing positive work, giving it energy',
    c_neg: 'Doing negative work, taking energy away',
    c_none: 'Doing no work; the energy stays the same',
    c_nowork: 'Giving it energy, but doing no work',
    why_climb:
      '<b>Doing positive work, giving it energy.</b> The force is along the motion, so the work is positive; as much work, that much energy. It is getting higher, so its potential energy rises.',
    not_c_neg: 'Negative work is done by a force against the motion, like the brakes.',
    not_c_none: 'The bicycle is getting higher, so its energy is rising.',
    not_c_nowork: 'The book says: doing positive work is giving the object energy.',

    q_top: 'The bicycle is at rest on top of the hill. What about its energy now?',
    t_pe: 'It has energy stored by being high up',
    t_none: 'It has no energy, because it is at rest',
    t_ke: 'All its energy is kinetic energy',
    t_lost: 'All the energy was used up on the way up',
    why_top:
      '<b>It has energy stored by being high up (potential energy): {e} J.</b> Even at rest it can do work: let go, and it rolls down. Energy is the capacity to do work.',
    not_t_none: 'At rest it has no kinetic energy, but it has energy from its height.',
    not_t_ke: 'Its speed is zero, so its kinetic energy is zero.',
    not_t_lost: 'The rider’s work was not lost: it is the energy stored at the top.',

    q_roll:
      'At the top the total energy was {total} J; there is no friction. See the potential energy now in the picture. What is the kinetic energy now?',
    why_roll: '<b>{ke} J.</b> The total stays the same, so kinetic energy = {total} J − {pe} J = {ke} J.',
    not_r_pe: 'That is the potential energy, not the kinetic energy.',
    not_r_total: 'It is all kinetic energy only at the very bottom.',
    not_r_sum: 'The total does not grow: subtract, don’t add.',

    q_brake: 'The rider is braking on the flat road. What is the brake force doing?',
    b_neg: 'Doing negative work, taking energy away',
    b_pos: 'Doing positive work, giving energy',
    b_gone: 'Destroying energy, so it is nowhere any more',
    b_pe: 'Turning kinetic energy into potential energy',
    why_brake:
      '<b>Doing negative work, taking energy away.</b> The brake force is against the motion; the energy taken away becomes heat in the brakes (the pads get hot).',
    not_b_pos: 'The force is against the motion, so the work is negative.',
    not_b_gone: 'Energy is not lost: whatever applies the force, here the brakes, gets it as heat.',
    not_b_pe: 'The road is flat: the bicycle is not getting higher.',

    q_dir:
      'Rolling down the right-hand slope from the top, the kinetic energy at the bottom is {total} J. Rolling down the left-hand slope, what would it be at the bottom?',
    why_dir:
      '<b>{total} J, the same.</b> Energy has no direction: it is a scalar. From the same height, whichever way it rolls, it gets the same energy.',
    not_d_neg: 'Energy has no direction, so changing direction does not change its sign.',
    not_d_zero: 'It comes down the same height, so it gets the same kinetic energy.',
    not_d_half: 'The left-hand slope is also {h} m high: it comes down the whole height.',

    q_unit: 'According to the book, what is the unit of energy?',
    u_j: 'J (joule)',
    u_n: 'N (newton)',
    u_w: 'W (watt)',
    u_p: 'kg m/s',
    why_unit:
      '<b>J (joule).</b> Work makes energy and spending energy does work, so both have the same unit and the same dimension: [W] = ML<sup>2</sup>T<sup>−2</sup>.',
    not_u_n: 'The newton is the unit of force.',
    not_u_w: 'The watt is the unit of power.',
    not_u_p: 'kg m/s is the unit of momentum.',
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
