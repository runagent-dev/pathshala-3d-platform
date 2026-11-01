// Every string of the figure, in Bangla (the book's words, pages 48–49, 2.8: পড়ন্ত বস্তু, মাধ্যাকর্ষণজনিত ত্বরণ g,
// স্থির অবস্থান, বিনা বাধায়, সমান সময়ে সমান পথ অতিক্রম, সমানুপাতিক, অতিক্রান্ত দূরত্ব h, বেগ v, প্রথম/দ্বিতীয়/
// তৃতীয় সূত্র, বাতাসের বাধা, বাতাসহীন টিউব, ভর) and English. Use t('key') in code, and t.num() for numbers (Bangla
// digits when the language is Bangla); numbers inside sentences come in as {vars}, never typed into the strings.
// Units are the book's SI symbols (s, m/s, ms⁻², m, cm) in every language, from UNITS below: write {u_ms} etc.

export const UNITS = { u_s: 's', u_ms: 'm/s', u_ms2: 'ms⁻²', u_m: 'm', u_cm: 'cm' };

export const STRINGS = {
  bn: {
    title: 'পড়ন্ত বস্তুর সূত্র',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'সময়',

    tube_air: 'বাতাস আছে',
    tube_vac: 'বাতাসহীন',
    lbl_stone: 'পাথর',
    lbl_paper: 'কাগজ',
    lbl_crumpled: 'দলা কাগজ',
    lbl_time: '{t} {u_s}',
    lbl_velocity: 'বেগ v',

    row_t: 'সময় t',
    row_v: 'বেগ v',
    row_h: 'দূরত্ব h',
    eq_v: 'v = gt',
    eq_h: 'h = ½gt²',
    times: '×{k}',
    law_2: 'দ্বিতীয় সূত্র: v ∝ t',
    law_3: 'তৃতীয় সূত্র: h ∝ t²',
    law_v_short: 'v ∝ t',
    law_h_short: 'h ∝ t²',
    eqs: 'v = u + gt, h = ut + ½gt²; স্থির অবস্থান থেকে u = {z}',

    say_ready: 'দুই টিউবে একই উচ্চতায় একটি পাথর আর এক টুকরো কাগজ স্থির আছে। ডান টিউবের বাতাস পাম্প দিয়ে বের করা হয়েছে। ছেড়ে দিলে কোনটি আগে পড়বে?',
    say_ready_crumpled: 'বাড়তি পরীক্ষা (বইয়ে নেই): একই কাগজ দলা পাকানো হলো, ভর একই, শুধু আকার ছোট। এবার বাতাসে কী হবে?',
    say_fall: 'পড়ছে (সময় {k} গুণ ধীর করে দেখানো)… বাতাসহীন টিউবে প্রতি {dt} সেকেন্ড পরপর অবস্থানের একটি হালকা ছবি থেকে যাচ্ছে।',
    say_paused: '{t} সেকেন্ড পর: বাতাসহীন টিউবে পাথর আর কাগজ একই দাগে (সমান সময়ে সমান পথ), কিন্তু বাতাসে কাগজ পিছিয়ে।',
    say_paused_crumpled: '{t} সেকেন্ড পর: বাতাসহীন টিউবে পাথর আর কাগজ একই দাগে; বাতাসে দলা কাগজ পাথরের চেয়ে সামান্য পিছিয়ে।',
    say_vac_down: 'বাতাসহীন টিউবে পাথর আর কাগজ একসাথে, {t} সেকেন্ডে নিচে পৌঁছাল। বাতাস আছে এমন টিউবে কাগজ এখনো পড়ছে…',
    say_done: 'প্রথম সূত্র: বাতাসহীন টিউবে পাথর আর কাগজ সমান সময়ে সমান পথ অতিক্রম করে, দুটোই {tv} সেকেন্ডে নিচে। বাতাসে কাগজ বাধা পায়, নিচে পৌঁছায় {tp} সেকেন্ডে।',
    say_done_crumpled: 'বাড়তি পরীক্ষা: দলা কাগজের ভর একই, কিন্তু বাতাসের বাধা অনেক কম, তাই বাতাসেও প্রায় পাথরের সাথে ({tp} সেকেন্ডে) নিচে পৌঁছায়।',

    act_release: 'ছেড়ে দাও',
    act_pause: 'থামাও',
    act_resume: 'চালাও',
    act_again: 'আবার ছেড়ে দাও',
    act_step: '{dt} {u_s}',
    act_step_long: '{dt} সেকেন্ড এগোও',
    act_crumple: 'কাগজ দলা পাকাও',
    act_flatten: 'খোলা কাগজ নাও',

    coach_release: 'চেপে ছেড়ে দাও',
    coach_top: 'টিউবের মাথায় ছুঁয়ে দাও',
    coach_lens: 'এখানে ধরে টানো',

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
    q_locked: 'পরীক্ষার সময় টিউব দুটি আটকানো থাকে।',

    q_where: 'বাতাসহীন টিউবে {t} সেকেন্ড পর পাথরটি {h} {u_cm} দাগে। কাগজটি (এখানে লুকানো) তখন কোথায়?',
    c_same_line: 'পাথরের পাশে, একই দাগে',
    c_behind: 'পাথরের উপরে, পিছিয়ে',
    c_ahead: 'পাথরের নিচে, এগিয়ে',
    c_start: 'এখনো শুরুর জায়গায়',
    why_where: '<b>পাথরের পাশে, একই দাগে</b>: প্রথম সূত্র, বিনা বাধায় সমান সময়ে সমান পথ অতিক্রম করে।',
    miss_behind: 'বাম টিউবে কাগজ পিছিয়ে বাতাসের বাধায়; এখানে বাতাস নেই।',
    miss_ahead: 'হালকা বস্তু আগে পড়ে না।',
    miss_start: 'বাতাসহীন টিউবেও মাধ্যাকর্ষণ আছে: কাগজও পড়ে।',

    q_why: 'বাতাসহীন টিউবে পাথর আর কাগজ দুটোই নিচে। বাতাস আছে এমন টিউবে কাগজ পিছিয়ে পড়ল কেন?',
    c_drag: 'কাগজে বাতাসের বাধা বেশি',
    c_less_g: 'বাতাসে ত্বরণ g কম',
    c_light: 'কাগজের ভর কম, তাই ত্বরণ কম',
    c_late: 'কাগজ একটু পরে ছাড়া হয়েছিল',
    why_air: '<b>বাতাসের বাধা</b>: হালকা, চওড়া কাগজকে বাতাস বেশি বাধা দেয়; বাতাস ছাড়া দুটোরই ত্বরণ g।',
    miss_less_g: 'বাতাসে g কমে না: পাথর দুই টিউবেই একই সময়ে নিচে পৌঁছেছে।',
    miss_light: 'ভর কম বলে ত্বরণ কম নয়: বাতাসহীন টিউবে কাগজ সাথেই পড়েছে।',
    miss_late: 'দুটো একসাথে ছাড়া হয়েছিল: বাতাসহীন টিউবেই তা দেখা যায়।',

    q_speed_pic: 'বাতাসহীন টিউবে {t1} সেকেন্ড পর বেগ {v1} {u_ms} (তীর)। {t2} সেকেন্ড পর বেগ কত হবে?',
    why_speed_pic: '<b>{v} {u_ms}</b>: দ্বিতীয় সূত্র, v ∝ t; সময় {k} গুণ, তাই বেগও {k} গুণ: {v1} × {k} = {v} {u_ms}।',
    miss_v_sq: 'সময়ের বর্গের (t²) সমানুপাতিক দূরত্ব h, বেগ নয়।',
    miss_v_const: 'বেগ একই থাকে না: পড়ন্ত বস্তু ক্রমাগত ত্বরান্বিত বেগে নামে।',
    miss_v_once: 'বেগ প্রতি {dt} সেকেন্ডে {v1} {u_ms} করে বাড়ে: {t2} সেকেন্ডে {k} বার।',
    q_speed_num: 'স্থির অবস্থান থেকে বিনা বাধায় পড়ন্ত পাথরের {t} সেকেন্ড পর বেগ কত? (g = {g} {u_ms2})',
    why_speed_num: '<b>{v} {u_ms}</b>: v = u + gt = {u} + {g} × {t} = {v} {u_ms}।',
    miss_v_half_sq: '½gt² দিয়ে অতিক্রান্ত দূরত্ব h পাওয়া যায়, বেগ নয়।',
    miss_v_half: '½ লাগে না: v = gt।',
    miss_v_gt2: 'বেগের সমীকরণে t-এর বর্গ নেই: v = gt।',
    miss_v_div: 'ভাগ নয়, গুণ: v = g × t।',

    q_height_pic: 'বাতাসহীন টিউবে {t1} সেকেন্ডে অতিক্রান্ত দূরত্ব {h1} {u_cm}। শুরু থেকে {t2} সেকেন্ডে কত দূরত্ব হবে?',
    why_height_pic: '<b>{h} {u_cm}</b>: তৃতীয় সূত্র, h ∝ t²; সময় {k} গুণ, তাই দূরত্ব {k}² = {k2} গুণ: {h1} × {k2} = {h} {u_cm}।',
    miss_h_lin: 'দূরত্ব সময়ের সমানুপাতিক নয়, সময়ের বর্গের সমানুপাতিক।',
    miss_h_gap: 'এটি শুধু দ্বিতীয় {dt} সেকেন্ডে অতিক্রান্ত দূরত্ব, শুরু থেকে মোট নয়।',
    miss_h_cube: 'সময়ের ঘন (t³) নয়, বর্গ (t²)।',
    q_height_num: 'স্থির অবস্থান থেকে বিনা বাধায় পড়ন্ত পাথর {t} সেকেন্ডে কত দূরত্ব অতিক্রম করবে? (g = {g} {u_ms2})',
    why_height_num: '<b>{h} {u_m}</b>: h = ut + ½gt² = ½ × {g} × {t}² = {h} {u_m}।',
    miss_h_no_half: '½ বাদ পড়েছে: h = ½gt²।',
    miss_h_no_sq: 't-এর বর্গ নিতে হবে: h = ½gt²।',
    miss_h_gt: 'gt হলো বেগ ({u_ms}), দূরত্ব নয়।',
    miss_h_sq_all: 'বর্গ শুধু t-এর, ½g-এর নয়: h = ½ × g × t²।',

    q_ratio_h: 'বিনা বাধায় পড়ন্ত বস্তু স্থির অবস্থান থেকে {a}, {b} ও {c} সেকেন্ডে মোট যে দূরত্ব অতিক্রম করে, তার অনুপাত কত?',
    q_ratio_v: 'বিনা বাধায় পড়ন্ত বস্তুর স্থির অবস্থান থেকে {a}, {b} ও {c} সেকেন্ড পরের বেগের অনুপাত কত?',
    why_ratio_h: '<b>{r}</b>: তৃতীয় সূত্র, h ∝ t², তাই {a}² : {b}² : {c}²। ছবিতেও {h1} : {h2} : {h3} {u_cm}।',
    why_ratio_v: '<b>{r}</b>: দ্বিতীয় সূত্র, v ∝ t, বেগ সময়ের মতোই বাড়ে; ছবির তীরগুলোও {r}।',
    miss_r_odd: '{r} হলো প্রতি সেকেন্ডে আলাদা করে অতিক্রান্ত দূরত্ব, শুরু থেকে মোট নয়।',
    miss_r_lin: 'এটি বেগের অনুপাত (v ∝ t), দূরত্বের নয়।',
    miss_r_sq: 'এটি দূরত্বের অনুপাত (h ∝ t²), বেগের নয়।',
    miss_r_const: 'বেগ সমান থাকে না: প্রতি সেকেন্ডে g পরিমাণ বাড়ে।',

    q_mass: 'একই উচ্চতা থেকে বিনা বাধায় {m1} কেজির লোহার বল {t} সেকেন্ডে মাটিতে পড়ে। {m2} কেজিরটির কত সময় লাগবে?',
    why_mass: '<b>{t} সেকেন্ড</b>: পড়ন্ত বস্তুর সমীকরণে (v = gt, h = ½gt²) ভর নেই, তাই ভারী-হালকা একই সময়ে পড়ে।',
    miss_mass: 'ভর {k} গুণ হলেও সময় বদলায় না, একটুও কমে না।',
  },
  en: {
    title: 'Laws of falling bodies',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Time',

    tube_air: 'With air',
    tube_vac: 'No air',
    lbl_stone: 'Stone',
    lbl_paper: 'Paper',
    lbl_crumpled: 'Paper ball',
    lbl_time: '{t} {u_s}',
    lbl_velocity: 'Velocity v',

    row_t: 'Time t',
    row_v: 'Velocity v',
    row_h: 'Distance h',
    eq_v: 'v = gt',
    eq_h: 'h = ½gt²',
    times: '×{k}',
    law_2: 'Second law: v ∝ t',
    law_3: 'Third law: h ∝ t²',
    law_v_short: 'v ∝ t',
    law_h_short: 'h ∝ t²',
    eqs: 'v = u + gt, h = ut + ½gt²; from rest u = {z}',

    say_ready:
      'In both tubes a stone and a piece of paper rest at the same height. The air was pumped out of the right tube. Let go: which lands first?',
    say_ready_crumpled: 'An extra test (not in the book): the same paper crumpled, the same mass, only smaller. What happens in air now?',
    say_fall: 'Falling (shown {k} times slower)… in the tube without air a faint picture is left every {dt} s.',
    say_paused: 'After {t} s: without air the stone and the paper are at the same line (equal distances in equal times), but in air the paper lags.',
    say_paused_crumpled:
      'After {t} s: without air the stone and the paper are at the same line; in air the paper ball is only a little behind the stone.',
    say_vac_down: 'Without air the stone and the paper reached the bottom together, in {t} s. In the tube with air the paper is still falling…',
    say_done:
      'First law: without air the stone and the paper cover equal distances in equal times, both down in {tv} s. In air the paper is held back and lands in {tp} s.',
    say_done_crumpled:
      'Extra test: the paper ball has the same mass but much less air hindrance, so even in air it lands almost with the stone ({tp} s).',

    act_release: 'Let go',
    act_pause: 'Pause',
    act_resume: 'Go on',
    act_again: 'Let go again',
    act_step: '{dt} {u_s}',
    act_step_long: 'Step {dt} s',
    act_crumple: 'Crumple the paper',
    act_flatten: 'Use a flat paper',

    coach_release: 'Press to let go',
    coach_top: 'Touch the top of a tube',
    coach_lens: 'Drag here',

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
    q_locked: 'The tubes are locked during the test.',

    q_where: 'Without air, after {t} s the stone is at {h} {u_cm}. Where is the hidden paper?',
    c_same_line: 'Level with the stone',
    c_behind: 'Above the stone',
    c_ahead: 'Below the stone',
    c_start: 'Still at the start',
    why_where: '<b>Level with the stone</b>: first law, equal distances in equal times.',
    miss_behind: 'Only air holds the paper back; here there is none.',
    miss_ahead: 'A light body does not fall first.',
    miss_start: 'There is gravity in the empty tube too: the paper falls.',

    q_why: 'Without air both are down. Why did the paper lag in the tube with air?',
    c_drag: 'Air hinders it more',
    c_less_g: 'g is smaller in air',
    c_light: 'Lighter, so slower',
    c_late: 'It was let go later',
    why_air: '<b>Air hindrance</b>, far more on the wide, light paper; without air both fall at g.',
    miss_less_g: 'g is the same in air: the stones landed together.',
    miss_light: 'Lighter is not slower: without air it kept up.',
    miss_late: 'They were let go together, as the empty tube shows.',

    q_speed_pic: 'Without air the velocity after {t1} s is {v1} {u_ms} (arrow). And after {t2} s?',
    why_speed_pic: '<b>{v} {u_ms}</b>: v ∝ t; {k} times the time, {k} times the velocity: {v1} × {k}.',
    miss_v_sq: 'The distance goes as t², not the velocity.',
    miss_v_const: 'The velocity does not stay the same: it keeps growing.',
    miss_v_once: 'The velocity grows by {v1} {u_ms} every {dt} s: {k} times by {t2} s.',
    q_speed_num: 'A stone falls from rest without hindrance. Its velocity after {t} s? (g = {g} {u_ms2})',
    why_speed_num: '<b>{v} {u_ms}</b>: v = u + gt = {u} + {g} × {t} = {v} {u_ms}.',
    miss_v_half_sq: '½gt² gives the distance fallen, not the velocity.',
    miss_v_half: 'No ½ here: v = gt.',
    miss_v_gt2: 'No square of t in the velocity: v = gt.',
    miss_v_div: 'Multiply, do not divide: v = g × t.',

    q_height_pic: 'Without air it falls {h1} {u_cm} in {t1} s. How far from the start in {t2} s?',
    why_height_pic: '<b>{h} {u_cm}</b>: h ∝ t²; {k} times the time, {k2} times the distance: {h1} × {k2}.',
    miss_h_lin: 'The distance is not proportional to the time but to its square.',
    miss_h_gap: 'That is only the second {dt} s, not the total from the start.',
    miss_h_cube: 'The square of the time (t²), not the cube (t³).',
    q_height_num: 'A stone falls from rest without hindrance. How far in {t} s? (g = {g} {u_ms2})',
    why_height_num: '<b>{h} {u_m}</b>: h = ut + ½gt² = ½ × {g} × {t}² = {h} {u_m}.',
    miss_h_no_half: 'The ½ is missing: h = ½gt².',
    miss_h_no_sq: 'Square the time: h = ½gt².',
    miss_h_gt: 'gt is the velocity ({u_ms}), not the distance.',
    miss_h_sq_all: 'Only t is squared, not ½g: h = ½ × g × t².',

    q_ratio_h: 'Falling from rest without hindrance: the ratio of the total distances after {a}, {b} and {c} s?',
    q_ratio_v: 'Falling from rest without hindrance: the ratio of the velocities after {a}, {b} and {c} s?',
    why_ratio_h: '<b>{r}</b>: h ∝ t², so {a}² : {b}² : {c}²; on the scale {h1} : {h2} : {h3} {u_cm}.',
    why_ratio_v: '<b>{r}</b>: second law, v ∝ t; the arrows are {r} too.',
    miss_r_odd: '{r} is each second on its own, not the total.',
    miss_r_lin: 'That is the ratio of the velocities (v ∝ t).',
    miss_r_sq: 'That is the ratio of the distances (h ∝ t²).',
    miss_r_const: 'The velocity does not stay the same: it grows by g every second.',

    q_mass: 'A {m1} kg iron ball falls freely to the ground in {t} s. How long does a {m2} kg one take?',
    why_mass: '<b>{t} s</b>: there is no mass in v = gt and h = ½gt², so heavy and light take the same time.',
    miss_mass: 'Even {k} times the mass takes the same time.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. The units
 * ({u_s}, {u_ms}, …) are filled in everywhere; t('u_ms') gives a unit on its own.
 */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code], ...UNITS };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    const all = { ...UNITS, ...vars };
    return (dict[key] ?? key).replace(/\{(\w+)\}/g, (m, k) => (k in all ? (k in UNITS ? all[k] : num(all[k])) : m));
  }
  t.num = num;
  t.lang = code;
  return t;
}
