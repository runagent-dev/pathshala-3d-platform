// Every string the figure shows, in Bangla and English. The book's words on pages 147–148 (topic 5.5): স্থিতিস্থাপকতা
// (Elasticity), স্প্রিং, রাবার ব্যান্ড, "বল প্রয়োগ করা আর দৈর্ঘ্য পরিবর্তন হওয়াকে বলা হয় বিকৃতি ঘটা", প্রত্যয়নী বল,
// "বলটি সরিয়ে নিলে বিকৃতির অবসান ঘটে আর বস্তুটি আবার তার আগের অবস্থায় ফিরে যায়", "কতটুকু বল প্রয়োগ করা যাবে তার একটা
// সীমা আছে", স্থায়ী বিকৃতি, স্থিতিস্থাপক সীমা, the rod bent a little or a lot (সোজা হয়ে যায় / বাঁকা হয়েই থাকে), বিকৃতি
// = (L − L₀)/L₀ ("বিকৃতির কোনো একক নেই, এটি একটি সংখ্যা মাত্র"), পীড়ন = F/A ("এটা চাপের মতো এবং এর একক (Pa)
// প্যাসকেল"), প্রস্থচ্ছেদ, চিত্র ৫.১১ (L₀, L, T, W), হুকের সূত্র ("স্থিতিস্থাপক সীমার ভেতরে পীড়ন এবং বিকৃতি
// সমানুপাতিক", পীড়ন ∝ বিকৃতি, পীড়ন = ধ্রুবক × বিকৃতি), স্থিতিস্থাপক গুণাঙ্ক, টেনশন (T), ইয়াংস মডুলাস (Y).
// The test's questions are plain text (no HTML): they name L₀ as আগের দৈর্ঘ্য and m² in words.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language: the units {u_N}, {u_Pa}, {u_cm}, {u_m2}, {u_mm2}, the symbols {L0s}
// (L₀ with <sub>: the bundled font has no ₀ ²) and {prop} (∝ drawn as a small SVG: the font has no ∝ either), always
// after a no-break space (&nbsp;).

const PROP =
  '<svg class="el-prop" viewBox="0 0 18 11" aria-hidden="true"><path d="M16.5 2.2C12.4 2.2 10.6 8.8 6.2 8.8 3.4 8.8 1.6 7.2 1.6 5.5S3.4 2.2 6.2 2.2C10.6 2.2 12.4 8.8 16.5 8.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

export const STRINGS = {
  bn: {
    title: 'স্থিতিস্থাপকতা: স্প্রিং, পীড়ন আর বিকৃতি',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বিকৃতি',
    u_N: 'N',
    u_Pa: 'Pa',
    u_cm: 'cm',
    u_m2: 'm<sup>2</sup>',
    u_mm2: 'mm<sup>2</sup>',
    L0s: 'L<sub>0</sub>',
    prop: PROP,
    pa_lakh: '{v}&nbsp;লাখ&nbsp;Pa',
    pa_plain: '{v}&nbsp;Pa',

    // the action and the quiet button
    act_hang1: 'একটি ওজন ঝোলাও',
    act_hang2: 'আরেকটি ওজন ঝোলাও',
    act_off: 'সব ওজন খুলে নাও',
    act_more: 'আরও ওজন ঝোলাও',
    act_new: 'নতুন স্প্রিং নাও',
    act_home: 'নতুন স্প্রিং',

    // the stepper and the sums
    name_W: 'ওজন',
    less_W: 'একটি ওজন খুলে নাও',
    more_W: 'একটি ওজন ঝোলাও',
    lengths: '{L0s}&nbsp;=&nbsp;{L0}&nbsp;{u_cm} · L&nbsp;=&nbsp;<b>{L}&nbsp;{u_cm}</b>',
    s_strain: 'বিকৃতি',
    s_stress: 'পীড়ন',
    s_ratio: 'পীড়ন ÷ বিকৃতি',
    sum_strain: '<span class="el-f">(L − {L0s})/{L0s} = </span>({L} − {L0}) ÷ {L0} = <b>{e}</b> <small>(একক নেই)</small>',
    sum_stress: '<span class="el-f">F/A = </span>{F}&nbsp;{u_N} ÷ {A}&nbsp;{u_m2} = <b>{S}</b>',
    sum_ratio: '<b>{R}</b> <small>(ধ্রুবক)</small>',
    sum_ratio_off: 'প্রায় <b>{R}</b> <small>(আর ধ্রুবক নয়)</small>',
    sum_ratio_none: '<small>ওজন ঝোলালে দেখা যাবে</small>',
    sum_ratio_set: '<small>পীড়ন শূন্য, তবু বিকৃতি রয়ে গেছে</small>',

    // the result line
    out_rest: 'স্প্রিংয়ের দৈর্ঘ্য {L0s}&nbsp;=&nbsp;<b>{L0}&nbsp;{u_cm}</b>; প্রতিটি ওজন {W}&nbsp;{u_N}',
    out_back: 'ওজন খুলতেই আবার <b>{L0}&nbsp;{u_cm}</b>: আগের দৈর্ঘ্যে ফিরে এল',
    out_one: '{n}টি ওজন: দৈর্ঘ্য বৃদ্ধি x&nbsp;=&nbsp;<b>{x}&nbsp;{u_cm}</b>',
    out_times: '{n}টি ওজন: x&nbsp;=&nbsp;<b>{x}&nbsp;{u_cm}</b>, একটির {n}&nbsp;গুণ',
    out_beyond: '{n}টি ওজন: x&nbsp;=&nbsp;<b>{x}&nbsp;{u_cm}</b>, {n}&nbsp;গুণ ({xx}&nbsp;{u_cm}) নয়, অনেক বেশি!',
    out_set: 'সব ওজন খোলার পরও L&nbsp;=&nbsp;<b>{L}&nbsp;{u_cm}</b>: {s}&nbsp;{u_cm} স্থায়ী বিকৃতি',
    out_set_some: '{n}টি ওজন: x&nbsp;=&nbsp;<b>{x}&nbsp;{u_cm}</b> (এর {s}&nbsp;{u_cm} স্থায়ী)',

    // the rule: the book's words, one idea at a time
    rule_start: '<b>বল প্রয়োগ করলে স্প্রিংয়ের দৈর্ঘ্য বাড়ে: একে বলে বিকৃতি ঘটা।</b> একটি একটি করে ওজন ঝুলিয়ে দেখো।',
    rule_hang: '<b>ওজন W স্প্রিংকে নিচে টানে; বিকৃতির জন্য স্প্রিংয়ের ভেতরে তৈরি হয় প্রত্যয়নী বল, টান T,</b> যা ওজনকে ধরে রাখে।',
    rule_double: '<b>বল {two}&nbsp;গুণ হলে বিকৃতিও {two}&nbsp;গুণ: পীড়ন&nbsp;{prop}&nbsp;বিকৃতি (হুকের সূত্র)।</b> তাই পীড়ন ÷ বিকৃতি প্রতিবার একই: একটি ধ্রুবক।',
    rule_back: '<b>বলটি সরিয়ে নিলে বিকৃতির অবসান ঘটে, স্প্রিং আগের দৈর্ঘ্যে ফিরে যায়।</b> পদার্থের এই ধর্মের নাম স্থিতিস্থাপকতা।',
    rule_limit: '<b>কতটুকু বল প্রয়োগ করা যাবে তার একটা সীমা আছে: স্থিতিস্থাপক সীমা।</b> এই স্প্রিংয়ের সীমা {F}&nbsp;{u_N}। আরও ওজন ঝুলিয়ে দেখো।',
    rule_beyond: '<b>সীমা পার হলে বিকৃতি আর পীড়নের সমানুপাতিক নয়:</b> গ্রাফ আর সরলরেখা নয়। এবার সব ওজন খুলে দেখো।',
    rule_set: '<b>সীমা অতিক্রম করলে পদার্থ আগের অবস্থায় ফিরতে পারে না: একটা স্থায়ী বিকৃতি ঘটে যায়।</b> বেশি বাঁকা করা রডের মতো।',
    rule_law:
      '<b>হুকের সূত্র: স্থিতিস্থাপক সীমার ভেতরে পীড়ন&nbsp;{prop}&nbsp;বিকৃতি, অর্থাৎ পীড়ন = ধ্রুবক × বিকৃতি।</b> তার বা দণ্ড টানলে এই ধ্রুবকের নাম ইয়াংস মডুলাস (Y)।',

    // notes on the stage
    note_W: 'প্রতিটি ওজন {W}&nbsp;{u_N} · তারের প্রস্থচ্ছেদ A&nbsp;=&nbsp;{A}&nbsp;{u_mm2}',
    note_W_short: 'প্রতিটি ওজন {W}&nbsp;{u_N}',

    // labels on the picture
    lbl_L0: '{L0s}&nbsp;=&nbsp;{v}&nbsp;{u_cm}',
    lbl_x: 'x&nbsp;=&nbsp;{v}&nbsp;{u_cm}',
    lbl_xs: 'স্থায়ী x&nbsp;=&nbsp;{v}&nbsp;{u_cm}',
    lbl_x_q: 'x&nbsp;=&nbsp;?',
    lbl_T: 'T&nbsp;=&nbsp;{v}&nbsp;{u_N}',
    lbl_W: 'W&nbsp;=&nbsp;{v}&nbsp;{u_N}',
    lbl_Tw: 'প্রত্যয়নী বল T',
    lbl_Ww: 'ওজন W',

    // the graph
    g_title: 'পীড়ন–বিকৃতি গ্রাফ',
    g_axisS: 'পীড়ন (লাখ Pa)',
    g_axisE: 'বিকৃতি',
    g_limit: 'স্থিতিস্থাপক সীমা',
    g_limit2: 'স্থিতিস্থাপক|সীমা',
    g_set: 'স্থায়ী বিকৃতি',
    g_hooke: 'হুকের সূত্র',
    g_inside: 'সীমার ভেতরে',
    g_inside2: 'সীমার|ভেতরে',
    g_outside: 'সীমার বাইরে',
    g_outside2: 'সীমার|বাইরে',
    g_aria: 'পীড়ন–বিকৃতি গ্রাফ: {k}টি বিন্দু',

    hint_wait: 'একটু দাঁড়াও, স্প্রিংটি থামুক।',
    hint_max: 'স্ট্যান্ডের সব ওজন ঝোলানো হয়ে গেছে।',
    hint_none: 'স্প্রিংয়ে কোনো ওজন নেই।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় স্প্রিংটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_strain: 'স্কেলে স্প্রিংয়ের এখনকার দৈর্ঘ্য L পড়ো (আগের দৈর্ঘ্য {L0} cm)। বিকৃতি কত?',
    c_unit: '{v}&nbsp;{u_cm}',
    why_strain: '<b>{e}</b>: বিকৃতি = (L − {L0s})/{L0s} = ({L} − {L0}) ÷ {L0} = {e}। দুটো দৈর্ঘ্যের ভাগফল, তাই এর কোনো একক নেই।',
    mis_strain_cm: 'এটি শুধু দৈর্ঘ্য বৃদ্ধি L − {L0s}; বিকৃতি পেতে একে {L0s} দিয়ে ভাগ করতে হয়।',
    mis_strain_ratio: 'এটি L ÷ {L0s}; আগে L থেকে {L0s} বাদ দিতে হয়।',
    mis_strain_unit: 'সংখ্যাটি ঠিক, কিন্তু বিকৃতির কোনো একক নেই, এটি একটি সংখ্যা মাত্র।',

    q_stress: 'স্প্রিংয়ে কয়টি ওজন ঝুলছে গুনে দেখো (প্রতিটি {W} N)। তারের প্রস্থচ্ছেদ A = {A} বর্গমিটার। পীড়ন কত?',
    why_stress: '<b>{S}</b>: পীড়ন = F/A = {F}&nbsp;{u_N} ÷ {A}&nbsp;{u_m2} = {S}। এর একক চাপের মতো, প্যাসকেল (Pa)।',
    mis_stress_force: 'এটি বল F; পীড়ন হলো একক ক্ষেত্রফলে বল, F ÷ A।',
    mis_stress_mm2: 'এখানে {Amm}&nbsp;{u_mm2} দিয়ে ভাগ করা হয়েছে; আগে m<sup>2</sup>-এ নিতে হয়: {Amm}&nbsp;{u_mm2} = {A}&nbsp;{u_m2}।',
    mis_stress_zero: 'A-তে একটি শূন্য বেশি ধরা হয়েছে; A = {A}&nbsp;{u_m2}।',

    q_hooke: 'একটি ওজনে স্প্রিংটি x = {x} cm লম্বা হয়েছে। স্থিতিস্থাপক সীমার ভেতরে {n}টি ওজনে x কত হবে?',
    why_hooke: '<b>{v}&nbsp;{u_cm}</b>: সীমার ভেতরে বল {n}&nbsp;গুণ হলে বিকৃতিও {n}&nbsp;গুণ: {x} × {n} = {v}&nbsp;{u_cm}। ছবিতে দেখো।',
    mis_hooke_same: 'ওজন বাড়লে বিকৃতিও বাড়ে; একই থাকে না।',
    mis_hooke_count: 'ওজনের সংখ্যা আর সেন্টিমিটার এক নয়; একটি ওজনে x = {x}&nbsp;{u_cm}।',
    mis_hooke_square: 'হুকের সূত্রে বিকৃতি বলের সমানুপাতিক, বলের বর্গের নয়।',

    q_limit: 'গ্রাফ দেখো। কত পীড়ন পর্যন্ত বিন্দুগুলো মূলবিন্দু থেকে একটি সরলরেখায় আছে, অর্থাৎ স্থিতিস্থাপক সীমা কোথায়?',
    why_limit: '<b>{S}</b>: এ পর্যন্ত পীড়ন {prop} বিকৃতি (সরলরেখা)। এর পরের বিন্দুতে বিকৃতি হঠাৎ অনেক বেশি: সীমা পার।',
    mis_limit_top: 'এটি সবচেয়ে উঁচু বিন্দু; কিন্তু {S} পার হওয়ার পর গ্রাফ বেঁকে গেছে।',
    mis_limit_after: 'এই বিন্দুটি বাঁকের পরে, সরলরেখার বাইরে; সীমা তার আগেই।',
    mis_limit_early: 'এর পরের বিন্দুগুলোও একই সরলরেখায় আছে; সীমা আরও উপরে।',

    q_set: 'স্প্রিংটিতে {n}টি ওজন ঝুলিয়ে আবার সব খুলে নেওয়া হয়েছে। তবু এটি আগের দৈর্ঘ্য {L0} cm-এ ফেরেনি। কেন?',
    c_set_right: 'ওজন স্থিতিস্থাপক সীমার বেশি ছিল, তাই স্থায়ী বিকৃতি হয়েছে',
    c_set_never: 'ওজন খুলে নিলে কোনো স্প্রিংই আগের দৈর্ঘ্যে ফেরে না',
    c_set_hooke: 'হুকের সূত্র মেনে বিকৃতি ওজনের সমানুপাতিকভাবে রয়ে গেছে',
    c_set_restore: 'খোলার পরও স্প্রিংয়ে প্রত্যয়নী বল কাজ করছে, তাই লম্বা',
    why_set: '<b>সীমা পার হয়েছিল</b>: স্থিতিস্থাপক সীমা অতিক্রম করলে পদার্থ আগের অবস্থায় ফিরতে পারে না; গ্রাফে বিকৃতি শূন্যে নামেনি।',
    mis_set_never: 'সীমার ভেতরে ওজন খুললে স্প্রিং ঠিকই ফেরে: এটাই স্থিতিস্থাপকতা।',
    mis_set_hooke: 'হুকের সূত্র শুধু সীমার ভেতরে খাটে; ওজন শূন্য হলে সেখানে বিকৃতিও শূন্য।',
    mis_set_restore: 'ওজন নেই বলে টান T-ও নেই; দৈর্ঘ্য রয়ে গেছে স্থায়ী বিকৃতির জন্য।',
  },
  en: {
    title: 'Elasticity: a spring, stress and strain',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Strain',
    u_N: 'N',
    u_Pa: 'Pa',
    u_cm: 'cm',
    u_m2: 'm<sup>2</sup>',
    u_mm2: 'mm<sup>2</sup>',
    L0s: 'L<sub>0</sub>',
    prop: PROP,
    pa_lakh: '{v}&nbsp;Pa',
    pa_plain: '{v}&nbsp;Pa',

    act_hang1: 'Hang a weight',
    act_hang2: 'Hang another weight',
    act_off: 'Take all the weights off',
    act_more: 'Hang more weights',
    act_new: 'Take a new spring',
    act_home: 'New spring',

    name_W: 'Weight',
    less_W: 'Take one weight off',
    more_W: 'Hang one weight',
    lengths: '{L0s}&nbsp;=&nbsp;{L0}&nbsp;{u_cm} · L&nbsp;=&nbsp;<b>{L}&nbsp;{u_cm}</b>',
    s_strain: 'Strain',
    s_stress: 'Stress',
    s_ratio: 'Stress ÷ strain',
    sum_strain: '<span class="el-f">(L − {L0s})/{L0s} = </span>({L} − {L0}) ÷ {L0} = <b>{e}</b> <small>(no unit)</small>',
    sum_stress: '<span class="el-f">F/A = </span>{F}&nbsp;{u_N} ÷ {A}&nbsp;{u_m2} = <b>{S}</b>',
    sum_ratio: '<b>{R}</b> <small>(constant)</small>',
    sum_ratio_off: 'about <b>{R}</b> <small>(no longer constant)</small>',
    sum_ratio_none: '<small>hang a weight to see it</small>',
    sum_ratio_set: '<small>no stress, yet strain is left</small>',

    out_rest: 'The spring’s length {L0s}&nbsp;=&nbsp;<b>{L0}&nbsp;{u_cm}</b>; each weight is {W}&nbsp;{u_N}',
    out_back: 'Weights off: back to <b>{L0}&nbsp;{u_cm}</b>, its old length',
    out_one: '{n} weight: stretch x&nbsp;=&nbsp;<b>{x}&nbsp;{u_cm}</b>',
    out_times: '{n} weights: x&nbsp;=&nbsp;<b>{x}&nbsp;{u_cm}</b>, {n}&nbsp;times one weight’s',
    out_beyond: '{n} weights: x&nbsp;=&nbsp;<b>{x}&nbsp;{u_cm}</b>, far more than {n}&nbsp;times ({xx}&nbsp;{u_cm})!',
    out_set: 'All weights off, yet L&nbsp;=&nbsp;<b>{L}&nbsp;{u_cm}</b>: a permanent strain of {s}&nbsp;{u_cm}',
    out_set_some: '{n} weights: x&nbsp;=&nbsp;<b>{x}&nbsp;{u_cm}</b> ({s}&nbsp;{u_cm} of it permanent)',

    rule_start: '<b>A force makes the spring longer: this change is called strain.</b> Hang the weights one at a time.',
    rule_hang:
      '<b>The weight W pulls the spring down; the strain makes a restoring force inside the spring, the tension T,</b> that holds the weight up.',
    rule_double:
      '<b>Twice the force, twice the strain: stress&nbsp;{prop}&nbsp;strain (Hooke’s law).</b> So stress ÷ strain is the same every time: a constant.',
    rule_back: '<b>Take the force away and the strain is gone: the spring returns to its old length.</b> This property of a material is elasticity.',
    rule_limit:
      '<b>There is a limit to how much force you can apply: the elastic limit.</b> For this spring it is {F}&nbsp;{u_N}. Hang more weights and see.',
    rule_beyond: '<b>Past the limit, strain is no longer proportional to stress:</b> the graph is no longer straight. Now take all the weights off.',
    rule_set: '<b>Past the elastic limit a material cannot return to its old state: a permanent strain is left.</b> Like a rod bent too far.',
    rule_law:
      '<b>Hooke’s law: within the elastic limit stress&nbsp;{prop}&nbsp;strain, so stress = constant × strain.</b> For a stretched wire or rod this constant is Young’s modulus (Y).',

    note_W: 'Each weight {W}&nbsp;{u_N} · wire cross-section A&nbsp;=&nbsp;{A}&nbsp;{u_mm2}',
    note_W_short: 'Each weight {W}&nbsp;{u_N}',

    lbl_L0: '{L0s}&nbsp;=&nbsp;{v}&nbsp;{u_cm}',
    lbl_x: 'x&nbsp;=&nbsp;{v}&nbsp;{u_cm}',
    lbl_xs: 'permanent x&nbsp;=&nbsp;{v}&nbsp;{u_cm}',
    lbl_x_q: 'x&nbsp;=&nbsp;?',
    lbl_T: 'T&nbsp;=&nbsp;{v}&nbsp;{u_N}',
    lbl_W: 'W&nbsp;=&nbsp;{v}&nbsp;{u_N}',
    lbl_Tw: 'restoring force T',
    lbl_Ww: 'weight W',

    g_title: 'Stress–strain graph',
    g_axisS: 'Stress (×100 kPa)',
    g_axisE: 'Strain',
    g_limit: 'Elastic limit',
    g_limit2: 'Elastic|limit',
    g_set: 'Permanent strain',
    g_hooke: 'Hooke’s law',
    g_inside: 'Within the limit',
    g_inside2: 'Within|the limit',
    g_outside: 'Past the limit',
    g_outside2: 'Past|the limit',
    g_aria: 'Stress–strain graph: {k} points',

    hint_wait: 'Wait a moment for the spring to settle.',
    hint_max: 'All the weights on the stand are hanging.',
    hint_none: 'There are no weights on the spring.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The spring stays put during the test. Look at the picture and pick an answer.',

    q_strain: 'Read the spring’s length L on the rule now (its old length was {L0} cm). What is the strain?',
    c_unit: '{v}&nbsp;{u_cm}',
    why_strain: '<b>{e}</b>: strain = (L − {L0s})/{L0s} = ({L} − {L0}) ÷ {L0} = {e}. A length divided by a length, so it has no unit.',
    mis_strain_cm: 'That is only the stretch L − {L0s}; divide it by {L0s} to get the strain.',
    mis_strain_ratio: 'That is L ÷ {L0s}; take {L0s} away from L first.',
    mis_strain_unit: 'The number is right, but strain has no unit: it is just a number.',

    q_stress: 'Count the weights on the spring (each {W} N). The wire’s cross-section A = {A} square metres. What is the stress?',
    why_stress: '<b>{S}</b>: stress = F/A = {F}&nbsp;{u_N} ÷ {A}&nbsp;{u_m2} = {S}. Its unit is like pressure’s, the pascal (Pa).',
    mis_stress_force: 'That is the force F; stress is force per unit area, F ÷ A.',
    mis_stress_mm2: 'That divides by {Amm}&nbsp;{u_mm2}; change it to m<sup>2</sup> first: {Amm}&nbsp;{u_mm2} = {A}&nbsp;{u_m2}.',
    mis_stress_zero: 'One zero too many in A; A = {A}&nbsp;{u_m2}.',

    q_hooke: 'With one weight the spring stretched x = {x} cm. Within the elastic limit, what is x with {n} weights?',
    why_hooke:
      '<b>{v}&nbsp;{u_cm}</b>: within the limit, {n} times the force gives {n} times the strain: {x} × {n} = {v}&nbsp;{u_cm}. See the picture.',
    mis_hooke_same: 'More weight means more strain; it does not stay the same.',
    mis_hooke_count: 'The number of weights is not centimetres; one weight gives x = {x}&nbsp;{u_cm}.',
    mis_hooke_square: 'By Hooke’s law strain is proportional to the force, not to its square.',

    q_limit: 'Look at the graph. Up to which stress do the points lie on a straight line from the origin: where is the elastic limit?',
    why_limit: '<b>{S}</b>: up to here stress {prop} strain (a straight line). At the next point the strain jumps: past the limit.',
    mis_limit_top: 'That is the highest point, but past {S} the graph bends.',
    mis_limit_after: 'That point is after the bend, off the straight line; the limit comes before it.',
    mis_limit_early: 'The points after it are on the same straight line; the limit is higher.',

    q_set: '{n} weights were hung on this spring and all taken off again. Yet it has not gone back to its old length of {L0} cm. Why?',
    c_set_right: 'The load was past the elastic limit, so a permanent strain is left',
    c_set_never: 'No spring returns to its old length when the weights come off',
    c_set_hooke: 'By Hooke’s law the strain stays in proportion to the weights',
    c_set_restore: 'A restoring force still acts in the spring, so it stays long',
    why_set:
      '<b>The limit was passed</b>: past the elastic limit a material cannot return to its old state; on the graph the strain did not come back to zero.',
    mis_set_never: 'Within the limit a spring does return when the weights come off: that is elasticity.',
    mis_set_hooke: 'Hooke’s law holds only within the limit; there, no weight means no strain.',
    mis_set_restore: 'With no weight there is no tension T either; the length stays because of the permanent strain.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a unit, a symbol) is put in as it is.
 */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
