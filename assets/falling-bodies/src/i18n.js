// Every string of the figure, in Bangla (the book's words, pages 48–49, 2.8: পড়ন্ত বস্তু, মাধ্যাকর্ষণজনিত ত্বরণ g,
// স্থির অবস্থান, বিনা বাধায়, সমান সময়ে সমান পথ, সমানুপাতিক, উচ্চতা h, বেগ v, বাতাসের বাধা, বাতাসহীন টিউব, ভর)
// and English. Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla); numbers
// inside sentences come in as {vars}, never typed into the strings.

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
    lbl_time: '{t} সে',
    slow: 'সময় {k} গুণ ধীর করে দেখানো',
    slow_short: 'সময় {k} গুণ ধীর',

    row_t: 'সময় t',
    row_v: 'বেগ v',
    row_h: 'উচ্চতা h',
    u_s: 'সে',
    u_ms: 'মি/সে',
    u_ms2: 'মি/সে²',
    u_m: 'মি',
    u_cm: 'সেমি',
    times: '×{k}',
    law_v: 'v ∝ t',
    law_h: 'h ∝ t²',

    say_ready: 'দুই টিউবেই একটি ছোট পাথর আর এক টুকরো কাগজ একই উচ্চতায় স্থির আছে। একসাথে ছেড়ে দিলে কোনটি আগে নিচে পড়বে?',
    say_ready_crumpled: 'কাগজটি দলা পাকানো হলো: ভর একই আছে, শুধু আকার ছোট হলো। এবার বাতাস আছে এমন টিউবে কী হবে?',
    say_fall: 'পড়ছে… বাতাসহীন টিউবে প্রতি {dt} সেকেন্ড পরপর অবস্থানের একটি হালকা ছবি থেকে যাচ্ছে।',
    say_paused: '{t} সেকেন্ড পর: বাতাসহীন টিউবে পাথর আর কাগজ একই উচ্চতায় (সমান সময়ে সমান পথ), কিন্তু বাতাসে কাগজ পিছিয়ে আছে।',
    say_paused_crumpled: '{t} সেকেন্ড পর: বাতাসহীন টিউবে পাথর আর কাগজ একই উচ্চতায়; বাতাসে দলা কাগজ পাথরের চেয়ে সামান্য পিছিয়ে।',
    say_vac_down: 'বাতাসহীন টিউবে পাথর আর কাগজ একসাথে নিচে পৌঁছাল, {t} সেকেন্ডে। বাতাস আছে এমন টিউবে কাগজ এখনো পড়ছে…',
    say_done:
      'বাতাসহীন টিউবে (বিনা বাধায়) পাথর আর কাগজ সমান সময়ে সমান পথ পড়ে: দুটোই {tv} সেকেন্ডে নিচে। বাতাসে পাথর {ts} সেকেন্ডে, কিন্তু বাতাসের বাধায় কাগজ {tp} সেকেন্ডে।',
    say_done_crumpled: 'দলা পাকানো কাগজের ভর একই, কিন্তু বাতাসের বাধা অনেক কম: বাতাসেও প্রায় পাথরের সাথে পড়ে ({tp} সেকেন্ডে, পাথর {ts} সেকেন্ডে)।',

    act_release: 'ছেড়ে দাও',
    act_pause: 'থামাও',
    act_resume: 'চালাও',
    act_again: 'আবার ছেড়ে দাও',
    act_step: '{dt} সে',
    act_step_long: '{dt} সেকেন্ড এগোও',
    act_crumple: 'কাগজ দলা পাকাও',
    act_flatten: 'খোলা কাগজ নাও',

    coach_release: 'চাপ দিয়ে ছেড়ে দাও',
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

    q_together: 'বাতাসহীন টিউবে পাথর আর কাগজ একসাথে ছেড়ে দিলে কোনটি আগে নিচে পড়বে?',
    c_same: 'দুটোই একই সময়ে',
    c_stone: 'পাথর আগে',
    c_stone_bit: 'পাথর সামান্য আগে',
    c_float: 'কাগজ ভেসে থাকবে, পড়বে না',
    why_together: '<b>দুটোই একই সময়ে</b>: বিনা বাধায় ভারী-হালকা সব বস্তুর উপর g সমানভাবে কাজ করে।',
    miss_stone: 'ভারী বলে পাথর আগে পড়ে না।',
    miss_stone_bit: 'সামান্য আগেও নয়: পড়ন্ত বস্তুর সমীকরণে ভর নেই।',
    miss_float: 'বাতাসহীন টিউবেও মাধ্যাকর্ষণ আছে: কাগজও পড়ে।',

    q_why: 'বাতাস আছে এমন টিউবে পাথর নিচে, কাগজ মাঝপথে; বাতাসহীন টিউবে দুটোই একসাথে নিচে। কেন?',
    c_drag: 'কাগজে বাতাসের বাধা বেশি',
    c_less_g: 'বাতাসে ত্বরণ g কম',
    c_light: 'কাগজের ভর কম, তাই ত্বরণ কম',
    c_late: 'কাগজ একটু পরে ছাড়া হয়েছিল',
    why_air: '<b>বাতাসের বাধা</b>: হালকা, চওড়া কাগজকে বাতাস বেশি বাধা দেয়; বাতাস না থাকলে দুটোরই ত্বরণ g।',
    miss_less_g: 'বাতাসে g কমে না: পাথর দুই টিউবেই একসাথে পড়েছে।',
    miss_light: 'ভর কম বলে ত্বরণ কম নয়: বাতাসহীন টিউবে কাগজও সাথে পড়েছে।',
    miss_late: 'দুটো একসাথে ছাড়া হয়েছিল: বাতাসহীন টিউবেই তা দেখা যায়।',

    q_speed_pic: '{t1} সেকেন্ডে বেগ {v1} মি/সে (নীল তীর)। {t2} সেকেন্ডে বেগ কত হবে?',
    why_speed_pic: '<b>{v} মি/সে</b>: v ∝ t; সময় {k} গুণ, তাই বেগও {k} গুণ: {v1} × {k}।',
    miss_v_sq: 'সময়ের বর্গের (t²) সমানুপাতিক উচ্চতা h, বেগ নয়।',
    miss_v_const: 'বেগ একই থাকে না: পড়ন্ত বস্তু ক্রমাগত ত্বরান্বিত বেগে নামে।',
    miss_v_once: 'বেগ প্রতি {dt} সেকেন্ডে {v1} মি/সে করে বাড়ে: {t2} সেকেন্ডে {k} বার।',
    q_speed_num: 'স্থির অবস্থান থেকে বিনা বাধায় পড়ন্ত পাথরের {t} সেকেন্ড পর বেগ কত? (g = {g} মি/সে²)',
    why_speed_num: '<b>{v} মি/সে</b>: v = u + gt = {u} + {g} × {t}।',
    miss_v_half_sq: '½gt² দিয়ে নামা উচ্চতা h পাওয়া যায়, বেগ নয়।',
    miss_v_half: '½ লাগে না: v = gt।',
    miss_v_gt2: 'বেগের সমীকরণে t-এর বর্গ নেই: v = gt।',
    miss_v_div: 'ভাগ নয়, গুণ: v = g × t।',

    q_height_pic: '{t1} সেকেন্ডে পাথর আর কাগজ {h1} সেমি নেমেছে। শুরু থেকে {t2} সেকেন্ডে মোট কত নামবে?',
    why_height_pic: '<b>{h} সেমি</b>: h ∝ t²; সময় {k} গুণ, তাই উচ্চতা {k}² = {k2} গুণ: {h1} × {k2}।',
    miss_h_lin: 'উচ্চতা সময়ের সমানুপাতিক নয়, সময়ের বর্গের সমানুপাতিক।',
    miss_h_gap: 'এটি শুধু দ্বিতীয় {dt} সেকেন্ডে নামা পথ, শুরু থেকে মোট নয়।',
    miss_h_cube: 'সময়ের ঘন নয়, বর্গ: {k}² = {k2} গুণ।',
    q_height_num: 'স্থির অবস্থান থেকে বিনা বাধায় পড়ন্ত পাথর {t} সেকেন্ডে কত উচ্চতা নামবে? (g = {g} মি/সে²)',
    why_height_num: '<b>{h} মি</b>: h = ut + ½gt² = ½ × {g} × {t}²।',
    miss_h_no_half: '½ বাদ পড়েছে: h = ½gt²।',
    miss_h_no_sq: 't-এর বর্গ নিতে হবে: h = ½gt²।',
    miss_h_gt: 'gt হলো বেগ (মি/সে), উচ্চতা নয়।',
    miss_h_sq_all: 'বর্গ শুধু t-এর, ½g-এর নয়: h = ½ × g × t²।',

    q_ratio_h: 'বিনা বাধায় পড়ন্ত বস্তু স্থির অবস্থান থেকে {a}, {b} ও {c} সেকেন্ডে মোট যে উচ্চতা নামে, তার অনুপাত কত?',
    q_ratio_v: 'বিনা বাধায় পড়ন্ত বস্তুর স্থির অবস্থান থেকে {a}, {b} ও {c} সেকেন্ড পরের বেগের অনুপাত কত?',
    why_ratio_h: '<b>{r}</b>: h ∝ t², তাই {a}² : {b}² : {c}²। ছবিতেও {h1} : {h2} : {h3} সেমি।',
    why_ratio_v: '<b>{r}</b>: v ∝ t, বেগ সময়ের মতোই বাড়ে; ছবির নীল তীরগুলোও {r}।',
    miss_r_odd: '{r} হলো প্রতি সেকেন্ডে আলাদা করে নামা পথ, শুরু থেকে মোট নয়।',
    miss_r_lin: 'এটি বেগের অনুপাত (v ∝ t), উচ্চতার নয়।',
    miss_r_sq: 'এটি উচ্চতার অনুপাত (h ∝ t²), বেগের নয়।',
    miss_r_const: 'বেগ সমান থাকে না: প্রতি সেকেন্ডে g পরিমাণ বাড়ে।',

    q_mass: 'বিনা বাধায় {m1} কেজির লোহার বল {t} সেকেন্ডে পড়ে। একই উচ্চতা থেকে {m2} কেজির বলের কত সময় লাগবে?',
    why_mass: '<b>{t} সেকেন্ড</b>: পড়ন্ত বস্তুর সমীকরণে (v = gt, h = ½gt²) ভর নেই, তাই ভারী-হালকা একই সময়ে পড়ে।',
    miss_mass: 'ভর {k} গুণ হলেও সময় বদলায় না।',
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
    lbl_time: '{t} s',
    slow: 'Shown {k} times slower',
    slow_short: '{k} times slower',

    row_t: 'Time t',
    row_v: 'Velocity v',
    row_h: 'Height h',
    u_s: 's',
    u_ms: 'm/s',
    u_ms2: 'm/s²',
    u_m: 'm',
    u_cm: 'cm',
    times: '×{k}',
    law_v: 'v ∝ t',
    law_h: 'h ∝ t²',

    say_ready: 'In both tubes a small stone and a piece of paper rest at the same height. Let go together: which reaches the bottom first?',
    say_ready_crumpled: 'The paper is crumpled into a ball: the same mass, only smaller. What happens in the tube with air now?',
    say_fall: 'Falling… in the tube without air a faint picture is left every {dt} s.',
    say_paused:
      'After {t} s: without air the stone and the paper are at the same height (equal distances in equal times), but in air the paper lags behind.',
    say_paused_crumpled:
      'After {t} s: without air the stone and the paper are at the same height; in air the paper ball is only a little behind the stone.',
    say_vac_down: 'Without air the stone and the paper reached the bottom together, in {t} s. In the tube with air the paper is still falling…',
    say_done:
      'Without air (no hindrance) the stone and the paper fall equal distances in equal times: both down in {tv} s. In air the stone takes {ts} s, but air holds the paper back to {tp} s.',
    say_done_crumpled:
      'The crumpled paper has the same mass but much less air hindrance: even in air it falls almost with the stone ({tp} s, the stone {ts} s).',

    act_release: 'Let go',
    act_pause: 'Pause',
    act_resume: 'Go on',
    act_again: 'Let go again',
    act_step: '{dt} s',
    act_step_long: 'Step {dt} s',
    act_crumple: 'Crumple the paper',
    act_flatten: 'Use a flat paper',

    coach_release: 'Press to let go',
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

    q_together: 'In the tube without air, a stone and a paper are let go together from the same height. Which reaches the bottom first?',
    c_same: 'Both at the same time',
    c_stone: 'The stone',
    c_stone_bit: 'The stone, just a little earlier',
    c_float: 'The paper floats, it does not fall',
    why_together: '<b>Both at the same time</b>: without hindrance the acceleration due to gravity g acts equally on heavy and light bodies.',
    miss_stone: 'Being heavier does not make the stone fall first.',
    miss_stone_bit: 'Not even a little: there is no mass in the equations of a falling body.',
    miss_float: 'There is gravity in the empty tube too: the paper falls.',

    q_why: 'In the tube with air the stone is down, the paper only half way. Yet without air both arrived together. Why?',
    c_drag: 'Air hinders the paper much more',
    c_less_g: 'g is smaller in air',
    c_light: 'The paper is lighter, so it accelerates less',
    c_late: 'The paper was let go a little later',
    why_air: '<b>Air hindrance</b>: air holds back the light, wide paper much more; without air both accelerate at g.',
    miss_less_g: 'g is not smaller in air: the stone fell together in both tubes.',
    miss_light: 'Lighter does not mean less acceleration: without air the paper fell with the stone.',
    miss_late: 'Both were let go together: the tube without air shows it.',

    q_speed_pic: 'After {t1} s the velocity is {v1} m/s (blue arrow). Falling from rest without hindrance, what is the velocity after {t2} s?',
    why_speed_pic: '<b>{v} m/s</b>: v ∝ t, so {k} times the time gives {k} times the velocity: {v1} × {k} = {v} m/s.',
    miss_v_sq: 'The height h goes as the square of the time (t²), not the velocity.',
    miss_v_const: 'The velocity does not stay the same: a falling body keeps speeding up.',
    miss_v_once: 'The velocity grows by {v1} m/s every {dt} s: {k} times by {t2} s.',
    q_speed_num: 'A stone falls from rest without hindrance. What is its velocity after {t} s? (g = {g} m/s²)',
    why_speed_num: '<b>{v} m/s</b>: v = u + gt = {u} + {g} × {t} = {v} m/s.',
    miss_v_half_sq: '½gt² gives the height fallen, not the velocity.',
    miss_v_half: 'No ½ here: v = gt.',
    miss_v_gt2: 'No square of t in the velocity: v = gt.',
    miss_v_div: 'Multiply, do not divide: v = g × t.',

    q_height_pic:
      'After {t1} s the stone and the paper have fallen {h1} cm (see the scale). How far will they have fallen from the start after {t2} s?',
    why_height_pic: '<b>{h} cm</b>: h ∝ t², so {k} times the time gives {k}² = {k2} times the height: {h1} × {k2} = {h} cm.',
    miss_h_lin: 'The height is not proportional to the time but to its square.',
    miss_h_gap: 'That is only the distance in the second {dt} s, not the total from the start.',
    miss_h_cube: 'The square of the time, not the cube: {k}² = {k2} times.',
    q_height_num: 'A stone falls from rest without hindrance. How far does it fall in {t} s? (g = {g} m/s²)',
    why_height_num: '<b>{h} m</b>: h = ut + ½gt² = ½ × {g} × {t}² = {h} m.',
    miss_h_no_half: 'The ½ is missing: h = ½gt².',
    miss_h_no_sq: 'Square the time: h = ½gt².',
    miss_h_gt: 'gt is the velocity (m/s), not the height.',
    miss_h_sq_all: 'Only t is squared, not ½g: h = ½ × g × t².',

    q_ratio_h: 'A body falls from rest without hindrance. What is the ratio of the total heights fallen from the start after {a}, {b} and {c} s?',
    q_ratio_v: 'A body falls from rest without hindrance. What is the ratio of its velocities after {a}, {b} and {c} s?',
    why_ratio_h: '<b>{r}</b>: h ∝ t², so {a}² : {b}² : {c}² = {r}. In the picture too: {h1} : {h2} : {h3} cm = {r}.',
    why_ratio_v: '<b>{r}</b>: v ∝ t, so the velocity grows like the time. The blue arrows in the picture are {r} too.',
    miss_r_odd: '{r} is the distance in each second on its own, not the total from the start.',
    miss_r_lin: 'That is the ratio of the velocities (v ∝ t), not of the heights.',
    miss_r_sq: 'That is the ratio of the heights (h ∝ t²), not of the velocities.',
    miss_r_const: 'The velocity does not stay the same: it grows by g every second.',

    q_mass: 'Without hindrance a {m1} kg iron ball falls in {t} s. How long does a {m2} kg ball take from the same height?',
    why_mass: '<b>{t} s</b>: there is no mass in the equations of a falling body (v = gt, h = ½gt²), so heavy and light fall in the same time.',
    miss_mass: '{k} times the mass does not change the time.',
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
