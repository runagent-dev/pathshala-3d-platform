// Every string the figure shows, in Bangla (in the book's words, pages 74–75, ৩.৫.২ নিরাপদ ভ্রমণ: বেগ ও বল: গতিশক্তি
// ½mv², বেগের বর্গ, বেগ দ্বিগুণ করা হলে গতিশক্তি চার গুণ, সংঘর্ষ, মুখোমুখি সংঘর্ষ, ক্ষতিগ্রস্ত, আরোহী, আঘাত, দুর্ঘটনা,
// নিয়ন্ত্রণ, ভারী পাথর বোঝাই ট্রাক, ছোট গাড়ি, ভর m₁ m₂, বেগ u −u, v₁ v₂, বেগের পরিবর্তন, উল্টোদিকে, ছিটকে যাবে,
// দুমড়েমুচড়ে, সংঘর্ষের ভয়াবহতা) and English. Use t('key', vars) in code, and t.num() for numbers (Bangla digits when
// the language is Bangla). Symbols stay as the book prints them (u, −u, 3u, 4u, m₁, v₂, ½mv²), written with
// <sub>/<sup> (the font has no ₁ ₂ ²). Signs as in the sister figures: "ডান দিক ধনাত্মক (+) ধরে", to the left
// "বাম দিকে". A number and its unit are held together by a no-break space.

const S = {
  m1: 'm<sub>1</sub>',
  m2: 'm<sub>2</sub>',
  v1: 'v<sub>1</sub>',
  v2: 'v<sub>2</sub>',
  ke: '½mv<sup>2</sup>',
};

export const STRINGS = {
  bn: {
    title: 'নিরাপদ ভ্রমণ: বেগ ও বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বেগ',
    speeds: 'বেগ বেছে নাও',
    speed: '{v} km/h',
    res_cubes: '{n}টি ঘনক',

    // the action (the big button and the numbered ring on the car)
    act_go: 'মুখোমুখি চালাও',
    act_at: '{v} km/h-এ চালাও',
    act_again: 'আবার চালাও',
    act_home: 'শুরুতে ফেরাও',

    // the result line: the number that matters in <b>
    out_ready: 'বেগ {v} km/h: গাড়ির গতিশক্তি <b>{n}টি ঘনক</b>',
    out_run: 'গাড়ির বেগ <b>{v}</b> km/h, ট্রাকের {w} km/h',
    out_end: 'গাড়ির বেগ {a} থেকে {b} km/h: পরিবর্তন <b>{c} km/h</b> (= 4u)',
    out_end_real: 'গাড়ির বেগ {a} থেকে প্রায় {b} km/h: পরিবর্তন <b>প্রায় {c} km/h</b> (≈ {k}u)',

    // the rule line: the book's words in <b>, growing with what the student has found
    rule_ke_1: `<b>গতিশক্তি ${S.ke}: এর মাঝে বেগের বর্গ রয়েছে।</b> একটি ঘনক = {v} km/h বেগে গাড়িটির গতিশক্তি। বেগ বাড়ালে কী হয়?`,
    rule_ke_2: '<b>বেগ দ্বিগুণ করা হলে গতিশক্তি চার গুণ বেড়ে যায়:</b> {a} থেকে {v} km/h, তাই {n0}টি থেকে {n}টি ঘনক। এই শক্তি নিয়েই গাড়িটি সংঘর্ষে যাবে।',
    rule_ke_3: '<b>গতিশক্তির মাঝে বেগের বর্গ রয়েছে:</b> বেগ তিন গুণ ({a} থেকে {v} km/h), তাই গতিশক্তি নয় গুণ ({n}টি ঘনক)। এই শক্তি নিয়েই গাড়িটি সংঘর্ষে যাবে।',
    rule_approach: `ডান দিক ধনাত্মক (+) ধরে: <b>ট্রাকের বেগ u হলে গাড়ির বেগ −u।</b> ছোট গাড়ির ভর ${S.m2} ট্রাকের ভর ${S.m1} এর তুলনায় অনেক কম।`,
    rule_contact: '<b>সংঘর্ষে এই শক্তির কারণেই গাড়ি ক্ষতিগ্রস্ত হয় এবং আরোহীরা আঘাত পায়।</b> দেখো, কার বেগ বদলাচ্ছে।',
    rule_end: `<b>ট্রাকটি একই বেগে যেতে থাকে; ছোট গাড়িটির বেগ −u থেকে 3u:</b> বেগের পরিবর্তন 3u − (−u) = 4u, গাড়িটি উল্টোদিকে ছিটকে যায় (${S.m2} ≈ {z} ধরে)।`,
    rule_end_real: `<b>আসল ভর নিলেও প্রায় একই:</b> ট্রাকের বেগ প্রায় {a}u, গাড়ির প্রায় {b}u; গাড়ির বেগের পরিবর্তন প্রায় {c}u, ট্রাকের মাত্র {d}u।`,
    rule_more:
      '<b>বেগ {a} থেকে {b} km/h, গতিশক্তি {m}টি থেকে {n}টি ঘনক:</b> গাড়িটি আরও বেশি দুমড়ে গেল। <b>দুর্ঘটনার সময় ক্ষতি কমানোর সবচেয়ে সহজ উপায় হচ্ছে গতি কম রাখা।</b>',
    rule_less:
      '<b>বেগ {a} থেকে {b} km/h, গতিশক্তি {m}টি থেকে {n}টি ঘনক:</b> গাড়িটি কম দুমড়েছে। <b>দুর্ঘটনার সময় ক্ষতি কমানোর সবচেয়ে সহজ উপায় হচ্ছে গতি কম রাখা।</b>',
    rule_final:
      '<b>আমাদের দেশের বেশির ভাগ দুর্ঘটনা হয় গাড়ির বেগ বেশি রাখার কারণে।</b> তখন নিয়ন্ত্রণ করাও কঠিন, আর সংঘর্ষে অনেক শক্তি ব্যয় হয়। নিরাপদ ভ্রমণের উপায়: গতি কম রাখা।',

    // labels on the scene
    l_ke: 'গাড়ির গতিশক্তি',
    l_u: 'u',
    l_mu: '−u',
    l_v1: `${S.v1} = u`,
    l_v2: `${S.v2} = 3u`,
    l_v2_live: S.v2,
    l_v1_live: S.v1,
    l_v1_real: `${S.v1} ≈ {a}u`,
    l_v2_real: `${S.v2} ≈ {b}u`,
    l_u_num: '{v}\u00a0km/h',
    l_mu_num: '{v}\u00a0km/h',
    l_v1_num: `${S.v1} = {v}\u00a0km/h`,
    l_v2_num: `${S.v2} = {v}\u00a0km/h`,
    l_truck: `ট্রাক (${S.m1})`,
    l_car: `ছোট গাড়ি (${S.m2})`,
    l_m1: S.m1,
    l_m2: S.m2,
    note_slow: 'সময় {n} গুণ ধীর',
    note_contact: 'সংঘর্ষ আরও ধীরে',
    note_assume: 'বইয়ের হিসাবে গতিশক্তি ছাড়া অন্য শক্তি নেই (আসলে ঠিক নয়)',

    hint_wait: 'চলছে: দেখো কী হয়।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'দৃশ্যটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
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

    // 1. twice (or three times) the speed: how many cubes of kinetic energy?
    q_ke: 'ছবিতে {a} km/h বেগে গাড়িটির গতিশক্তি ঘনক দিয়ে দেখানো। বেগ {k} গুণ ({b} km/h) হলে কয়টি ঘনক হবে?',
    c_cubes: '{n}টি ঘনক',
    why_ke: `<b>{n}টি</b>: গতিশক্তি ${S.ke}; বেগ {k} গুণ হলে গতিশক্তি {k}<sup>{p}</sup> = {n} গুণ।`,
    n_ke_lin: ' গতিশক্তি বেগের সমানুপাতিক নয়: এতে বেগের বর্গ।',
    n_ke_cube: ' বর্গ, ঘন নয়: {k}<sup>{p}</sup> = {n}।',
    n_ke_same: ' ভর একই, কিন্তু বেগ বদলালে গতিশক্তিও বদলায়।',
    n_ke_twice: ' বেগের বর্গ মানে {k} × {k}, {k} × {two} নয়।',

    // 2. which change lowers the kinetic energy most?
    q_safe: 'ছবিতে {v} km/h বেগে গাড়িটির গতিশক্তি। কোনটি করলে গতিশক্তি সবচেয়ে বেশি কমবে?',
    s_half_v: 'বেগ অর্ধেক করলে ({h} km/h)',
    s_half_m: 'ভর অর্ধেক করলে (বেগ একই)',
    s_minus: 'বেগ {d} km/h কমালে',
    s_third_m: 'ভর তিন ভাগের এক ভাগ করলে',
    why_safe: '<b>বেগ অর্ধেক করলে</b>: গতিশক্তি (½)<sup>{p}</sup> = ¼ গুণ, {n}টি থেকে {y}টি ঘনক।',
    n_half_m: ' ভর অর্ধেকে গতিশক্তি {x}টি ঘনক।',
    n_third_m: ' ভর তিন ভাগের এক ভাগে গতিশক্তি {x}টি ঘনক।',
    n_minus: ' {w} km/h বেগে গতিশক্তি {x}টি ঘনক।',

    // 3. the car's velocity after the head-on crash
    q_v2: `ছবিতে দুটির বেগ দেখো। ${S.m2} ≈ {z} ধরে: মুখোমুখি সংঘর্ষের পর ছোট গাড়িটির বেগ কত হবে?`,
    c_3u: `${S.v2} = 3u`,
    c_4u: `${S.v2} = 4u`,
    c_u: `${S.v2} = u`,
    c_m3u: `${S.v2} = −3u`,
    why_v2: `<b>{b} km/h</b>: ${S.v2} = (${S.m1}u + 2${S.m1}u) ÷ ${S.m1} = 3u; গাড়িটি উল্টোদিকে ছিটকে যায়।`,
    n_v2_4u: ' {c} হলো বেগের পরিবর্তন, 4u; বেগ নয়।',
    n_v2_u: ' জুড়ে গেলে দুটি একসাথে u বেগে চলত।',
    n_v2_m3u: ' দিক ভুল: গাড়িটি ডান দিকে (+) ছিটকে যায়।',

    // 4. the change of the car's velocity, read off the picture
    q_change: 'সংঘর্ষের আগে গাড়িটির বেগ ছিল {a} km/h (বাম দিকে)। ছবি দেখে বলো, এর বেগের পরিবর্তন কত?',
    c_kmh: '{v} km/h',
    why_change: '<b>{c} km/h</b>: পরিবর্তন = শেষ বেগ − আগের বেগ = {b} − ({a}) = {c} km/h, অর্থাৎ 4u।',
    n_ch_drop: ' আগের বেগ ঋণাত্মক: তা বিয়োগ করলে যোগ হয়।',
    n_ch_final: ' এটি শেষ বেগ; পরিবর্তন = শেষ বেগ − আগের বেগ।',
    n_ch_order: ' উল্টো বিয়োগ: শেষ বেগ থেকে আগের বেগ বাদ দিতে হয়।',

    // 5. why the truck's velocity hardly changes
    q_truck: 'ছবিতে সংঘর্ষের পর ট্রাকটির বেগ একই রইল, কিন্তু গাড়িটির বেগ অনেক বদলাল। কেন?',
    t_mass: 'গাড়িটির ভর অনেক কম',
    t_faster: 'ট্রাকটির বেগ বেশি ছিল',
    t_noforce: 'ট্রাকটির উপর বল কাজ করেনি',
    t_less: 'ট্রাকটির উপর কম বল লেগেছে',
    why_truck: `<b>গাড়ির ভর অনেক কম</b> (বই ${S.m2} ≈ {z} ধরেছে): ট্রাক সংঘর্ষের ভয়াবহতা অনুভব করে না।`,
    n_t_faster: ' দুটির বেগের মান সমান ছিল: u।',
    n_t_noforce: ' ট্রাকের উপরও বল কাজ করে; বিশাল ভর বলে বেগ প্রায় বদলায় না।',
    n_t_less: ' দুটির উপর বল সমান ও বিপরীত; বিশাল ভর বলেই ট্রাকের বেগ প্রায় একই থাকে।',
  },
  en: {
    title: 'Safe journey: velocity and force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Velocity',
    speeds: 'Choose a speed',
    speed: '{v} km/h',
    res_cubes: '{n} cubes',

    act_go: 'Drive head-on',
    act_at: 'Now at {v} km/h',
    act_again: 'Drive again',
    act_home: 'Back to start',

    out_ready: 'Speed {v} km/h: the car’s kinetic energy <b>{n} cubes</b>',
    out_run: 'Car’s velocity <b>{v}</b> km/h, truck’s {w} km/h',
    out_end: 'Car’s velocity {a} to {b} km/h: a change of <b>{c} km/h</b> (= 4u)',
    out_end_real: 'Car’s velocity {a} to about {b} km/h: a change of <b>about {c} km/h</b> (≈ {k}u)',

    rule_ke_1: `<b>Kinetic energy is ${S.ke}: it has the square of the velocity.</b> One cube = the car’s kinetic energy at {v} km/h. What happens at a higher speed?`,
    rule_ke_2:
      '<b>Double the velocity and the kinetic energy becomes four times:</b> {a} to {v} km/h, so {n0} to {n} cubes. The car takes this energy into the crash.',
    rule_ke_3:
      '<b>Kinetic energy has the square of the velocity:</b> three times the velocity ({a} to {v} km/h), so nine times the energy ({n} cubes). The car takes this energy into the crash.',
    rule_approach: `Taking the right as positive (+): <b>if the truck’s velocity is u, the car’s is −u.</b> The small car’s mass ${S.m2} is much smaller than the truck’s mass ${S.m1}.`,
    rule_contact: '<b>In a crash this energy is what damages the car and hurts the passengers.</b> Watch whose velocity changes.',
    rule_end: `<b>The truck goes on at the same velocity; the small car’s velocity goes from −u to 3u:</b> a change of 3u − (−u) = 4u, the car is flung back the other way (taking ${S.m2} ≈ {z}).`,
    rule_end_real: `<b>With real masses it is almost the same:</b> the truck’s velocity about {a}u, the car’s about {b}u; the car’s velocity changes by about {c}u, the truck’s by only {d}u.`,
    rule_more:
      '<b>From {a} to {b} km/h, kinetic energy {m} to {n} cubes:</b> the car is crushed much more. <b>The simplest way to reduce the damage in an accident is to keep the speed low.</b>',
    rule_less:
      '<b>From {a} to {b} km/h, kinetic energy {m} to {n} cubes:</b> the car is crushed less. <b>The simplest way to reduce the damage in an accident is to keep the speed low.</b>',
    rule_final:
      '<b>Most accidents in our country happen because vehicles go too fast.</b> Then they are hard to control, and a lot of energy is spent in the crash. The way to a safe journey: keep the speed low.',

    l_ke: 'the car’s kinetic energy',
    l_u: 'u',
    l_mu: '−u',
    l_v1: `${S.v1} = u`,
    l_v2: `${S.v2} = 3u`,
    l_v2_live: S.v2,
    l_v1_live: S.v1,
    l_v1_real: `${S.v1} ≈ {a}u`,
    l_v2_real: `${S.v2} ≈ {b}u`,
    l_u_num: '{v}\u00a0km/h',
    l_mu_num: '{v}\u00a0km/h',
    l_v1_num: `${S.v1} = {v}\u00a0km/h`,
    l_v2_num: `${S.v2} = {v}\u00a0km/h`,
    l_truck: `truck (${S.m1})`,
    l_car: `small car (${S.m2})`,
    l_m1: S.m1,
    l_m2: S.m2,
    note_slow: 'time {n} times slower',
    note_contact: 'the crash even slower',
    note_assume: 'In the book’s sum there is no energy but kinetic energy (not really true)',

    hint_wait: 'It is running: watch what happens.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the scene, think, and pick the right answer.',
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

    q_ke: 'The picture shows the car’s kinetic energy at {a} km/h in cubes. At {k} times the speed ({b} km/h), how many cubes?',
    c_cubes: '{n} cubes',
    why_ke: `<b>{n}</b>: kinetic energy is ${S.ke}; {k} times the velocity gives {k}<sup>{p}</sup> = {n} times the energy.`,
    n_ke_lin: ' Kinetic energy is not proportional to the velocity: it has its square.',
    n_ke_cube: ' The square, not the cube: {k}<sup>{p}</sup> = {n}.',
    n_ke_same: ' The mass is the same, but a new velocity changes the kinetic energy.',
    n_ke_twice: ' The square of the velocity is {k} × {k}, not {k} × {two}.',

    q_safe: 'The picture shows the car’s kinetic energy at {v} km/h. Which lowers the kinetic energy most?',
    s_half_v: 'Halving the speed ({h} km/h)',
    s_half_m: 'Halving the mass (same speed)',
    s_minus: 'Slowing down by {d} km/h',
    s_third_m: 'A third of the mass',
    why_safe: '<b>Halving the speed</b>: the kinetic energy becomes (½)<sup>{p}</sup> = ¼, {n} to {y} cubes.',
    n_half_m: ' Half the mass leaves {x} cubes.',
    n_third_m: ' A third of the mass leaves {x} cubes.',
    n_minus: ' At {w} km/h the energy is {x} cubes.',

    q_v2: `Look at the two velocities. Taking ${S.m2} ≈ {z}: what is the small car’s velocity after the head-on crash?`,
    c_3u: `${S.v2} = 3u`,
    c_4u: `${S.v2} = 4u`,
    c_u: `${S.v2} = u`,
    c_m3u: `${S.v2} = −3u`,
    why_v2: `<b>{b} km/h</b>: ${S.v2} = (${S.m1}u + 2${S.m1}u) ÷ ${S.m1} = 3u; the car is flung back.`,
    n_v2_4u: ' {c} is the change of velocity, 4u; not the velocity.',
    n_v2_u: ' Stuck together they would move at u; here the car is flung away.',
    n_v2_m3u: ' Wrong way: the car is flung back, to the right (+).',

    q_change: 'Before the crash the car’s velocity was {a} km/h (to the left). From the picture: by how much did its velocity change?',
    c_kmh: '{v} km/h',
    why_change: '<b>{c} km/h</b>: change = final velocity − earlier velocity = {b} − ({a}) = {c} km/h, that is 4u.',
    n_ch_drop: ' The earlier velocity is negative: subtracting it adds.',
    n_ch_final: ' That is the final velocity; the change = final − earlier.',
    n_ch_order: ' Subtracted the wrong way round: take the earlier velocity from the final one.',

    q_truck: 'In the picture the truck kept its velocity after the crash, but the car’s changed a lot. Why?',
    t_mass: 'The car’s mass is much smaller',
    t_faster: 'The truck was faster',
    t_noforce: 'No force acted on the truck',
    t_less: 'A smaller force acted on the truck',
    why_truck: `<b>The car’s mass is much smaller</b> (the book takes ${S.m2} ≈ {z}): the truck hardly feels the crash.`,
    n_t_faster: ' Their speeds were the same: u.',
    n_t_noforce: ' A force acts on the truck too, but with its huge mass its velocity hardly changes.',
    n_t_less: ' The forces on the two are equal and opposite; the truck’s huge mass is what keeps its velocity.',
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
