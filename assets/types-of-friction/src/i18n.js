// Every string the figure shows, in Bangla (in the book's words, pages 89–90, ৩.৯.১: ঘর্ষণের প্রকারভেদ, স্থিতি ঘর্ষণ,
// গতি ঘর্ষণ, আবর্ত ঘর্ষণ, ঘর্ষণ সহগ, নিউটন, ওজন, তল) and English. Plain everyday words first (ঠেলা, ব্লক, পিছলে চলা,
// গড়িয়ে চলা); the book's terms and the formulas f_s = μ_s N and f_k = μ_k N come last. "ঠেলা" and "ঘর্ষণ" as in the
// sister figure friction-force (page 88). Subscripts as <sub> (the bundled font has no ₛ ₖ). Forces in "নিউটন" with a
// no-break space; numbers go through t.num() (Bangla digits).
// Use t('key', vars) in code, and t.num() for numbers.

const NB = '\u00a0';

export const STRINGS = {
  bn: {
    title: 'ঘর্ষণের প্রকারভেদ',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ঠেলা',
    types: 'ঘর্ষণের তিন ধরন',

    // the row of words: the book's three terms; under each the friction found (one number)
    chip_static: 'স্থিতি ঘর্ষণ',
    chip_kinetic: 'গতি ঘর্ষণ',
    chip_rolling: 'আবর্ত ঘর্ষণ',
    res_n: `{f}${NB}নিউটন`,
    res_max: `সর্বোচ্চ {f}${NB}নিউটন`,

    // on the stage
    block_kg: '{m} কেজি',
    l_gauge: 'বলমাপক',
    l_push: `ঠেলা {f}${NB}নিউটন`,
    l_fric: `ঘর্ষণ {f}${NB}নিউটন`,
    l_fric_q: 'ঘর্ষণ কত?',
    l_max: `সর্বোচ্চ {f}${NB}নিউটন`,
    l_old_slide: `পিছলে {f}${NB}নিউটন`,
    aria_stage: 'তলের উপর কাঠের ব্লক, বলমাপক দিয়ে তাকে ঠেলা হচ্ছে',
    note_examples: 'সংখ্যাগুলো উদাহরণ',

    // the action (the big button and the numbered ring on the block)
    act_push1: 'ধীরে ধীরে ঠেলো',
    act_push: 'আরও জোরে ঠেলো',
    act_let_go: 'ঠেলা ছেড়ে দাও',
    act_wheels: 'ব্লকটি চাকায় তোলো',
    act_roll: 'চাকার ব্লকটি ঠেলো',
    act_again: 'আবার দেখো',
    act_home: 'শুরুতে ফেরাও',

    // the result line: the number that matters in <b>
    out_rest: `কাঠের ব্লকটি তলে স্থির। ঠেলা <b>০</b>${NB}নিউটন, ঘর্ষণও ০।`,
    out_ramp: 'ঠেলা বাড়ছে, ঘর্ষণও সঙ্গে সঙ্গে বাড়ছে। ব্লক এখনও নড়ছে না।',
    out_push: `ঠেলা <b>{p}${NB}নিউটন</b>। ঘর্ষণও {p}${NB}নিউটন, তাই ব্লক নড়ছে না।`,
    out_slide: `নড়ার ঠিক আগে স্থিতি ঘর্ষণ সর্বোচ্চ {m}${NB}নিউটন ছিল। এখন গতি ঘর্ষণ <b>{k}${NB}নিউটন</b>।`,
    out_slid: `ঠেলা বন্ধ হতেই ব্লক থেমে গেল: গতি ঘর্ষণ <b>{k}${NB}নিউটন</b> একাই তাকে থামায়।`,
    out_wheels: `একই ব্লক, এখন চাকার উপর। ঠেলা <b>০</b>${NB}নিউটন।`,
    out_roll: `গড়িয়ে চলতে ঘর্ষণ মাত্র <b>{r}${NB}নিউটন</b>। পিছলে চলতে ঠেলা লেগেছিল {k}${NB}নিউটন।`,
    out_all: `গড়িয়ে চলতে ঘর্ষণ <b>{r}${NB}নিউটন</b>: তিনটির মধ্যে সবচেয়ে কম।`,

    // the rule line: the book's words in <b>, growing with what the student has found out
    rule_rest: '<b>কাঠের ব্লকটি ঠেলে দেখো,</b> তল কী করে। বলমাপক বলে, কত জোরে ঠেলছ।',
    rule_push: '<b>স্থিতি ঘর্ষণ:</b> ব্লক স্থির থাকলে ঘর্ষণ ঠিক ঠেলার সমান, উল্টো দিকে। যত ঠেলো, ঘর্ষণও তত বাড়ে।',
    rule_push3: '<b>স্থিতি ঘর্ষণ ঠেলার সমান হয়েই বাড়ছে।</b> আর কতটা ঠেললে ব্লক নড়বে? আরও ঠেলো।',
    rule_slide: '<b>ব্লক নড়তে শুরু করেছে।</b> চলন্ত ব্লকে <b>গতি ঘর্ষণ</b> কাজ করে। তা সর্বোচ্চ স্থিতি ঘর্ষণের চেয়ে কম, তাই কম ঠেলাই লাগছে।',
    rule_slid: '<b>গতি ঘর্ষণ</b> সর্বোচ্চ স্থিতি ঘর্ষণের চেয়ে কম: ভারী জিনিস সরাতে শুরুতে বেশি জোর লাগে, চলতে শুরু করলে কম। এবার ব্লকের নিচে চাকা লাগিয়ে দেখো।',
    rule_wheels: '<b>চাকা লাগালে?</b> ব্লক আর তলে ঘষা খায় না, গড়িয়ে চলে। কত ঠেলা লাগবে, আন্দাজ করো।',
    rule_roll: '<b>আবর্ত ঘর্ষণ:</b> গড়িয়ে চলার ঘর্ষণ সবচেয়ে ছোট। তাই সুটকেস আর সব যানবাহনে চাকা থাকে; চাকা না থাকলে টেনে নিতে অনেক বেগ পেতে হতো।',
    rule_all: `<b><span class="nw"><i class="c-f">f<sub>s</sub></i> = <i class="c-mu">μ<sub>s</sub></i><i class="c-n">N</i></span> (সর্বোচ্চ স্থিতি ঘর্ষণ), <span class="nw"><i class="c-f">f<sub>k</sub></i> = <i class="c-mu">μ<sub>k</sub></i><i class="c-n">N</i></span> (গতি ঘর্ষণ)।</b> <i class="c-n">N</i>: তল ব্লককে যত জোরে উপরে ঠেলে (ওজনের সমান, {w}${NB}নিউটন)। <i class="c-mu">μ</i>: তল কত খসখসে। যেমন <span class="nw">{ms} × {w} = {fs}</span>, <span class="nw">{mk} × {w} = {fk}</span> নিউটন।`,

    // the test
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
    q_locked: 'পরীক্ষার সময় দৃশ্য আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_static: 'ব্লকটি নড়ছে না। বলমাপকে ঠেলার মাপ দেখো: তখন ঘর্ষণ কত?',
    q_slide: 'ব্লকটি একই বেগে পিছলে চলছে। বলমাপকে ঠেলার মাপ দেখো: ঘর্ষণ কত?',
    q_which: 'ছবিতে ব্লকটির উপর কোন ঘর্ষণ কাজ করছে?',
    q_load: `ব্লকের উপর ওজন চাপানো হলো: ছবিতে মোট ভর দেখো। {m0} কেজির ব্লক নড়াতে {f0}${NB}নিউটন ঠেলা লাগত। এখন নড়াতে প্রায় কত ঠেলা লাগবে?`,
    q_wheels: 'সুটকেসে চাকা থাকলে টেনে নেওয়া সহজ। এই ব্লকটি চাকার উপর সহজে চলছে কেন?',

    a_n: `{f}${NB}নিউটন`,
    w_static: 'স্থিতি ঘর্ষণ',
    w_kinetic: 'গতি ঘর্ষণ',
    w_rolling: 'আবর্ত ঘর্ষণ',
    w_none: 'কোনো ঘর্ষণ নেই',
    y_roll: 'গড়ানোর ঘর্ষণ পিছলানোর চেয়ে অনেক কম',
    y_light: 'চাকা লাগালে ব্লকের ওজন অনেক কমে যায়',
    y_none: 'চাকা গড়ালে ঘর্ষণ একেবারেই থাকে না',
    y_floor: 'চাকা লাগালে তল অনেক বেশি মসৃণ হয়ে যায়',

    // worked answers: the answer first
    why_static: `<b>{p}${NB}নিউটন।</b> ব্লক স্থির, তাই স্থিতি ঘর্ষণ ঠিক ঠেলার সমান (উল্টো দিকে)।`,
    why_slide: `<b>{k}${NB}নিউটন।</b> একই বেগে চলছে, তাই গতি ঘর্ষণ ঠেলার সমান। নড়াতে ঠেলা লাগত {m}${NB}নিউটন, চলতে তার চেয়ে কম।`,
    why_which_static: '<b>স্থিতি ঘর্ষণ।</b> ব্লক স্থির থাকলে এই ঘর্ষণ ঠেলার সমান হয়ে তাকে আটকে রাখে।',
    why_which_kinetic: '<b>গতি ঘর্ষণ।</b> ব্লক তলের উপর পিছলে চলছে।',
    why_which_rolling: '<b>আবর্ত ঘর্ষণ।</b> ব্লক চাকার উপর গড়িয়ে চলছে।',
    why_load: `<b>{f}${NB}নিউটন।</b> ওজন {k} গুণ হলে সর্বোচ্চ ঘর্ষণও {k} গুণ: {f0} × {k} = {f}${NB}নিউটন।`,
    why_wheels: `<b>গড়িয়ে চললে ঘর্ষণ সবচেয়ে কম।</b> বলমাপক মাত্র {r}${NB}নিউটন দেখাচ্ছে, পিছলে চলতে লাগত {k}${NB}নিউটন।`,

    // a note on a wrong choice
    not_zero: 'নড়ছে না বলেই ঘর্ষণ আছে: সে ঠেলাকে ঠিক আটকে রেখেছে।',
    not_max: 'সর্বোচ্চ মান তখনই, যখন ব্লক নড়ার মুখে। এখন ঠেলা কম, ঘর্ষণও কম।',
    not_weight: 'ওজন নিচের দিকে, ঘর্ষণ ঠেলার উল্টো দিকে: দুটি আলাদা বল।',
    not_moving_zero: 'চললেও ঘর্ষণ থাকে। নইলে ব্লক ক্রমেই দ্রুত হতো।',
    not_moving_max: 'সর্বোচ্চ মান স্থির ব্লকের জন্য। চলতে শুরু করলে ঘর্ষণ কমে।',
    not_none: 'তল ছুঁয়ে থাকলে ঘর্ষণ থাকেই: স্থির, পিছলে চলা বা গড়ানো, সব অবস্থায়।',
    not_same: 'ওজন বাড়লে ব্লক তলকে আরও জোরে চাপে, তাই ঘর্ষণও বাড়ে।',
    not_add: 'কেজি আর নিউটন যোগ করা যায় না। ওজন যত গুণ, ঘর্ষণও তত গুণ।',
    not_whole: 'ওজনের পুরোটা ঘর্ষণ নয়: এখানে ঘর্ষণ ওজনের অর্ধেক।',
    not_light: 'ওজন একই থাকে। ঘর্ষণ কমে, কারণ ব্লক পিছলায় না, গড়ায়।',
    not_wheel_none: `আবর্ত ঘর্ষণ খুব ছোট, কিন্তু শূন্য নয়: বলমাপকে {r}${NB}নিউটন।`,
    not_floor: 'তল একই থাকে। বদলায় ঘর্ষণের ধরন: পিছলানোর বদলে গড়ানো।',
  },
  en: {
    title: 'Types of friction',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Push',
    types: 'The three kinds of friction',

    chip_static: 'Static friction',
    chip_kinetic: 'Kinetic friction',
    chip_rolling: 'Rolling friction',
    res_n: `{f}${NB}N`,
    res_max: `Maximum {f}${NB}N`,

    block_kg: '{m} kg',
    l_gauge: 'Force gauge',
    l_push: `Push {f}${NB}N`,
    l_fric: `Friction {f}${NB}N`,
    l_fric_q: 'Friction = ?',
    l_max: `Maximum {f}${NB}N`,
    l_old_slide: `Sliding {f}${NB}N`,
    aria_stage: 'A wooden block on a surface, being pushed with a force gauge',
    note_examples: 'Example numbers',

    act_push1: 'Push slowly',
    act_push: 'Push harder',
    act_let_go: 'Let go',
    act_wheels: 'Put the block on wheels',
    act_roll: 'Push the block on wheels',
    act_again: 'Watch again',
    act_home: 'Back to the start',

    out_rest: `The wooden block rests on the surface. Push <b>0</b>${NB}N, friction 0 too.`,
    out_ramp: 'The push grows and the friction grows with it. The block is not moving yet.',
    out_push: `Push <b>{p}${NB}N</b>. Friction is {p}${NB}N too, so the block does not move.`,
    out_slide: `Just before it moved, static friction was at its maximum, {m}${NB}N. Now kinetic friction is <b>{k}${NB}N</b>.`,
    out_slid: `The push stopped and the block stopped: kinetic friction of <b>{k}${NB}N</b> alone stops it.`,
    out_wheels: `The same block, now on wheels. Push <b>0</b>${NB}N.`,
    out_roll: `Rolling: friction only <b>{r}${NB}N</b>. Sliding took a push of {k}${NB}N.`,
    out_all: `Rolling friction is <b>{r}${NB}N</b>: the smallest of the three.`,

    rule_rest: '<b>Push the wooden block</b> and see what the surface does. The force gauge shows how hard you push.',
    rule_push: '<b>Static friction:</b> while the block is at rest, friction is exactly equal to the push, the other way. Push more, friction grows.',
    rule_push3: '<b>Static friction keeps equal to the push.</b> How hard must you push before the block moves? Push harder.',
    rule_slide:
      '<b>The block has started to move.</b> A moving block has <b>kinetic friction</b>, which is less than the maximum static friction, so less push is needed.',
    rule_slid:
      '<b>Kinetic friction</b> is less than the maximum static friction: a heavy thing takes more force to start, less once it moves. Now put wheels under the block.',
    rule_wheels: '<b>With wheels?</b> The block no longer rubs on the surface, it rolls. Guess how much push it needs.',
    rule_roll:
      '<b>Rolling friction:</b> the smallest of all. That is why suitcases and every vehicle have wheels; without wheels we would have a hard time pulling them.',
    rule_all: `<b><span class="nw"><i class="c-f">f<sub>s</sub></i> = <i class="c-mu">μ<sub>s</sub></i><i class="c-n">N</i></span> (maximum static friction), <span class="nw"><i class="c-f">f<sub>k</sub></i> = <i class="c-mu">μ<sub>k</sub></i><i class="c-n">N</i></span> (kinetic friction).</b> <i class="c-n">N</i>: how hard the surface pushes up on the block (equal to its weight, {w}${NB}N). <i class="c-mu">μ</i>: how rough the surface is. For example <span class="nw">{ms} × {w} = {fs}</span>, <span class="nw">{mk} × {w} = {fk}</span> N (examples).`,

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

    q_static: 'The block is not moving. Read the push on the force gauge: how big is the friction on it?',
    q_slide: 'The block slides at a steady speed. Read the push on the force gauge: how big is the friction?',
    q_which: 'Which friction acts on the block in the picture?',
    q_load: `Weights are put on the block: read its total mass in the picture. A {m0} kg block took {f0}${NB}N to start. About how much push starts it now?`,
    q_wheels: 'Suitcases with wheels are easy to pull. Why does this block move so easily on wheels?',

    a_n: `{f}${NB}N`,
    w_static: 'Static friction',
    w_kinetic: 'Kinetic friction',
    w_rolling: 'Rolling friction',
    w_none: 'No friction',
    y_roll: 'Rolling friction is far less than sliding friction',
    y_light: 'Putting wheels on makes the block far lighter in weight',
    y_none: 'A wheel that is rolling has no friction at all',
    y_floor: 'Putting wheels on makes the surface far smoother',

    why_static: `<b>{p}${NB}N.</b> The block is at rest, so static friction is exactly equal to the push (the other way).`,
    why_slide: `<b>{k}${NB}N.</b> It moves at a steady speed, so kinetic friction equals the push. Starting it took a push of {m}${NB}N, moving takes less.`,
    why_which_static: '<b>Static friction.</b> While the block is at rest, it grows to match the push and holds the block.',
    why_which_kinetic: '<b>Kinetic friction.</b> The block slides over the surface.',
    why_which_rolling: '<b>Rolling friction.</b> The block rolls on wheels.',
    why_load: `<b>{f}${NB}N.</b> {k} times the weight means {k} times the maximum friction: {f0} × {k} = {f}${NB}N.`,
    why_wheels: `<b>Rolling friction is the smallest.</b> The gauge shows only {r}${NB}N; sliding needed {k}${NB}N.`,

    not_zero: 'Friction is there because it is not moving: it holds the push exactly.',
    not_max: 'The maximum is only reached when the block is about to move. Here the push is smaller, so is the friction.',
    not_weight: 'Weight points down, friction points against the push: two different forces.',
    not_moving_zero: 'There is friction while it moves. Otherwise the block would speed up and up.',
    not_moving_max: 'The maximum is for a block at rest. Once it moves, the friction is less.',
    not_none: 'Whenever it touches the surface there is friction: at rest, sliding or rolling.',
    not_same: 'More weight presses the block harder on the surface, so there is more friction.',
    not_add: 'You cannot add kg and newtons. {k} times the weight means {k} times the friction.',
    not_whole: 'The whole weight is not the friction: here the friction is half the weight.',
    not_light: 'The weight stays the same. The friction is smaller because the block rolls instead of sliding.',
    not_wheel_none: `Rolling friction is very small but not zero: the gauge shows {r}${NB}N.`,
    not_floor: 'The surface is the same. What changes is the kind of friction: rolling instead of sliding.',
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
