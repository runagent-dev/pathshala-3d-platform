// Every string the figure shows, in Bangla and English. The book's words on pages 145–146 (topic 5.4.1, টরিসেলির
// পরীক্ষা): স্ট্র, কোল্ড ড্রিংকস, চুমুক, "আসলে ব্যাপারটি ঘটে বাতাসের চাপের জন্য", "কোল্ড ড্রিংকসটা 10.3 মিটার পর্যন্ত
// উঠে হঠাৎ করে থেমে গেছে", "পারদ ঠিক 76 cm উচ্চতায় এসে থেমে গেছে", "পানির ঘনত্ব থেকে পারদের ঘনত্ব 13.6 গুণ বেশি",
// "দুটো চাপই সমান, কাজেই এর ভেতরে কোনো কার্যকর বল নেই", "চুমুক দিলে ... মুখের ভেতরে শূন্যতা তৈরি করার চেষ্টা করো,
// তখন সেখানে বাতাসের চাপ কমে যায়", বিজ্ঞানী টরিসেলি, 1643, "এক মুখ বন্ধ একটা নলের ভেতর পারদ ভরে, নলটি পারদ ভরা একটা
// পাত্রে উল্টে", শূন্যতা, "বাতাস পারদের উপরে চাপ দিচ্ছে এবং সেই চাপ তরলের সব জায়গায় সঞ্চালিত হয়ে নলের নিচেও এসেছে",
// "নলের উপরে কোনো ফুটো নেই, তাই সেদিক দিয়ে বাতাস চাপ দিতে পারছে না", "76 cm উঁচু পারদ স্তম্ভের ওজনের কারণে তৈরি
// হওয়া চাপ", ব্যারোমিটার ("বাতাসের চাপ মাপার যন্ত্রের নাম ব্যারোমিটার"), চিত্র ৫.১০. The page writes উপর / উপরে. From
// topic 5.3: P = hρg; from 5.4: 10⁵ N/m². Use t('key', vars) in code and t.num() for numbers; numbers inside sentences
// come in as {vars}. A {key} that is not a var is another string of the same language: units are {u_cm}, {u_m},
// {u_Pa}, {u_rho}, {u_g}, {u_Nm2} (written with <sup>: the bundled font has no ² or ⁻), after a no-break space.
// The questions (q_*) are plain text, no HTML: the quiz writes them as text.

export const STRINGS = {
  bn: {
    title: 'টরিসেলির পরীক্ষা: বাতাসের চাপ পারদ স্তম্ভকে ধরে রাখে',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'চাপ',
    u_cm: 'cm',
    u_m: 'm',
    u_Pa: 'Pa',
    u_rho: 'kg&nbsp;m<sup>−3</sup>',
    u_g: 'm&nbsp;s<sup>−2</sup>',
    u_Nm2: 'N/m<sup>2</sup>',

    // the row of words: the book's steps, then two more
    examples: 'কোন পরীক্ষা দেখবে',
    chip_straw: 'স্ট্র',
    chip_torricelli: 'টরিসেলি',
    chip_tilt: 'হেলাও',
    chip_mountain: 'পাহাড়ে',
    chip_water: 'পানি',
    chip_tank: 'ছিদ্র',

    // the action and the quiet button
    act_suck: 'চুমুক দাও',
    act_stop: 'চুমুক থামাও',
    act_fill: 'নলটি পারদে ভরো',
    act_turn: 'আঙুলে চেপে উল্টে দাও',
    act_release: 'আঙুল সরিয়ে নাও',
    act_pierce: 'নলের মাথায় ছিদ্র করো',
    act_again: 'আবার শুরু করো',
    act_tilt: 'নলটি আরও হেলাও',
    act_upright: 'আবার খাড়া করো',
    act_up: 'আরও উঁচুতে নাও',
    act_down: 'সমুদ্রতলে ফেরাও',
    act_water: 'পারদের বদলে পানি নাও',
    act_replay: 'আবার দেখো',
    act_cork: 'ছিদ্রের ছিপি খোলো',
    act_lid: 'ঢাকনা খোলো',
    act_refill: 'আবার ভরে ঢাকনা দাও',
    act_home: 'শুরুতে ফেরাও',

    // the formula under the action: P = hρg with this example's numbers
    eq_straw: 'স্ট্রে ওঠা কোল্ড ড্রিংকসের স্তম্ভের চাপ',
    eq_hg: 'পারদ স্তম্ভের চাপ = বাতাসের চাপ',
    eq_hg_wait: 'পারদ স্তম্ভের চাপ',
    eq_hg_zero: 'উপরে-নিচে দুই দিকেই বাতাসের চাপ',
    eq_water: 'পানির স্তম্ভের চাপ = বাতাসের চাপ',
    eq_tank: 'ছিদ্রের উপরের পানির স্তম্ভের চাপ',
    eq_sum: '<i>P</i> = <i>hρg</i> = <span class="tb-nw">{h}&nbsp;{u_m} × {rho}&nbsp;{u_rho} × {g}&nbsp;{u_g}</span>',
    eq_res: '= <b>{P}&nbsp;{u_Pa}</b>',
    eq_res_atm: '= <b>{P}&nbsp;{u_Pa}</b> ≈ {ten}<sup>{five}</sup>&nbsp;{u_Nm2}',
    eq_wait: '<i>P</i> = <i>hρg</i>: নলটি উল্টে দেখো h কত হয়',

    // the result line
    out_straw_rest: 'চুমুক নেই: <b>সমান চাপ</b>, কোল্ড ড্রিংকস ওঠে না',
    out_straw_suck: 'মুখে চাপ কমেছে: ড্রিংকস <b>স্ট্র বেয়ে উঠছে</b>',
    out_straw_up: 'বাইরের বাতাসের চাপ ড্রিংকস <b>মুখে তুলে দিল</b>',
    out_t_ready: 'এক মুখ বন্ধ কাচের নল আর এক পাত্র পারদ',
    out_t_filling: 'নলটি পারদে ভরা হচ্ছে…',
    out_t_full: 'নলটি <b>পারদে ভরা</b>, মুখ খোলা',
    out_t_turning: 'আঙুলে মুখ চেপে নলটি উল্টে পাত্রে ডোবানো হচ্ছে…',
    out_t_dipped: 'নলের মুখ পারদের নিচে, নল এখনো <b>পুরো ভরা</b>',
    out_t_falling: 'পারদ নামছে…',
    out_t_settled: 'পারদ ঠিক <b>{h}&nbsp;{u_cm}</b> উচ্চতায় থামল, উপরে শূন্যতা',
    out_t_piercing: 'ছিদ্র দিয়ে বাতাস ঢুকছে…',
    out_t_pierced: 'উপর থেকেও বাতাসের চাপ: স্তম্ভ <b>নেমে গেল</b>',
    out_tilt0: 'নল খাড়া: পারদ স্তম্ভ <b>{h}&nbsp;{u_cm}</b> উঁচু',
    out_tilt: 'নল {deg}° হেলানো: খাড়া উচ্চতা তবু <b>{h}&nbsp;{u_cm}</b>',
    out_tilting: 'নলটি হেলানো হচ্ছে…',
    out_mt0: 'সমুদ্রতলে পারদ স্তম্ভ <b>{h}&nbsp;{u_cm}</b>',
    out_mt: '{z}&nbsp;{u_m} উঁচুতে পারদ স্তম্ভ প্রায় <b>{h}&nbsp;{u_cm}</b>',
    out_mt_moving: 'ব্যারোমিটারটি নেওয়া হচ্ছে…',
    out_w_ready: 'প্রায় {L}&nbsp;{u_m} লম্বা কাচের নল, তলায় পানি',
    out_w_rising: 'পানি উঠছে…',
    out_w_done: 'একই চাপে পানির স্তম্ভ <b>{h}&nbsp;{u_m}</b>, প্রায় ছাদ পর্যন্ত',
    out_k_ready: 'ঢাকনা লাগানো ট্যাংক, নিচের ছিদ্রে ছিপি',
    out_k_corking: 'ছিপি খোলা হচ্ছে…',
    out_k_stopped: 'ঢাকনা বন্ধ: পানি একটু বের হয়ে <b>থেমে গেল</b>',
    out_k_opening: 'ঢাকনা খোলা হচ্ছে…',
    out_k_open: 'ঢাকনা খুলতেই <b>জোরে ধারা</b> বের হলো',
    out_k_drain: 'পানি কমছে, h কমছে: ধারা <b>দুর্বল</b> হচ্ছে',

    // the rule: the book's words, one idea at a time
    rule_straw0:
      '<b>স্ট্র দিয়ে কোল্ড ড্রিংকস খাওয়ার ব্যাপারটি ঘটে বাতাসের চাপের জন্য।</b> চুমুক না দিলে মুখের ভেতরে আর বোতলে একই বাতাসের চাপ; দুটো চাপই সমান, তাই কোনো কার্যকর বল নেই।',
    rule_straw1:
      '<b>চুমুক দিলে মুখের ভেতরে বাতাসের চাপ কমে যায়,</b> তখন তরলের উপরে বাতাসের চাপের জন্য তরলটা স্ট্র বেয়ে উপরে ওঠে। তবে যত জোরেই চুমুক দাও, কোল্ড ড্রিংকস {h}&nbsp;{u_m}-এর বেশি উঠবে না।',
    rule_t0: '<b>বিজ্ঞানী টরিসেলি {year} সালে</b> এক মুখ বন্ধ একটা নলের ভেতর পারদ ভরে, নলটি পারদ ভরা একটা পাত্রে উল্টে রেখেছিলেন। তুমিও করে দেখো।',
    rule_t1: '<b>আঙুলে মুখ চেপে রাখলে পারদ পড়ে যায় না।</b> নলের মুখ পাত্রের পারদের নিচে ডুবিয়ে তবেই আঙুল সরাও, যাতে বাতাস ঢুকতে না পারে।',
    rule_t_settled:
      '<b>নলের উপরে কোনো ফুটো নেই, তাই সেদিক দিয়ে বাতাস চাপ দিতে পারছে না।</b> পাত্রের পারদের উপর বাতাসের চাপ তরলের মধ্য দিয়ে নলের নিচে পৌঁছায় আর {h}&nbsp;{u_cm} পারদ স্তম্ভের চাপের সমান হয়।',
    rule_t_pierced: '<b>উপরে ছিদ্র করলে উপর থেকেও বাতাস চাপ দেয়,</b> তাই পারদ পাত্রের তলে নেমে আসে। মানে, স্তম্ভটিকে ধরে রেখেছিল শুধু নিচ থেকে বাতাসের চাপ।',
    rule_tilt:
      '<b>চাপ নির্ভর করে খাড়া উচ্চতা h-এর উপর (P = hρg),</b> নলের দৈর্ঘ্যের উপর নয়। তাই নল হেলালে পারদ নলের বেশি অংশ ভরে, কিন্তু খাড়া উচ্চতা থাকে {h}&nbsp;{u_cm}।',
    rule_mt: '<b>বাতাসের চাপ মাপার যন্ত্রের নাম ব্যারোমিটার।</b> উঁচুতে মাথার উপরে বাতাসের স্তম্ভ ছোট, তাই বাতাসের চাপ কম, আর পারদ স্তম্ভও নিচু।',
    rule_water:
      '<b>পানির ঘনত্ব থেকে পারদের ঘনত্ব {k} গুণ বেশি,</b> তাই পানি উঠবে পারদের {k} গুণ উঁচুতে: {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}। কোল্ড ড্রিংকসের ঘনত্ব পানির কাছাকাছি, তাই স্ট্রেও এর বেশি ওঠে না।',
    rule_tank0: '<b>এটিও টরিসেলির নলের মতো:</b> ঢাকনা বন্ধ থাকলে উপর থেকে বাতাস চাপ দিতে পারে না। ছিপি খুললে কী হয় দেখো।',
    rule_tank1: '<b>ঢাকনা বন্ধ, তাই উপর থেকে বাতাস চাপ দিতে পারছে না;</b> বাইরের বাতাসের চাপ ছিদ্রের মুখে পানিকে আটকে রাখছে, ঠিক যেমন টরিসেলির নলে পারদকে।',
    rule_tank2: '<b>ঢাকনা খুললে পানির উপরেও বাতাসের চাপ পড়ে,</b> তখন ছিদ্রের উপরের পানির স্তম্ভের চাপ hρg পানিকে বাইরে ঠেলে দেয়। h যত বেশি, ধারা তত জোরে।',

    // notes on the stage
    note_sea: 'সমুদ্রতলে',
    note_mt: 'সমুদ্রতল থেকে {z}&nbsp;{u_m} উঁচুতে',
    note_straw: 'পার্থক্য বাড়িয়ে দেখানো',
    note_fast: 'সময় দ্রুত',
    note_tube: 'নল মোটা করে আঁকা',

    // labels on the picture
    lbl_air: 'বাতাসের চাপ',
    lbl_outside: 'বাইরের বাতাসের চাপ',
    lbl_mouth: 'মুখের ভেতরের বাতাসের চাপ',
    lbl_vacuum: 'শূন্যতা',
    lbl_h: '{h}&nbsp;{u_cm}',
    lbl_col: 'পারদ স্তম্ভের চাপ',
    lbl_thumb: 'আঙুল',
    lbl_mercury: 'পারদ',
    lbl_vert: 'খাড়া উচ্চতা {h}&nbsp;{u_cm}',
    lbl_along: 'নলে পারদ {L}&nbsp;{u_cm}',
    lbl_water: 'পানি {h}&nbsp;{u_m}',
    lbl_mini: 'পারদ {h}&nbsp;{u_cm}',
    lbl_depth: 'h = {h}&nbsp;{u_m}',
    lbl_same: 'একই উচ্চতা',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',

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
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_vacuum: 'টরিসেলির নলে পারদ স্তম্ভের উপরের ফাঁকা জায়গায় কী আছে?',
    c_vac_right: 'শূন্যতা: কিছুই নেই',
    c_vac_pull: 'শূন্যতা, যা পারদ টেনে রাখে',
    c_vac_air: 'আঙুল সরানোর সময় ঢোকা বাতাস',
    c_vac_press: 'বাতাস, যা পারদকে নিচে চাপে',
    why_vacuum: '<b>শূন্যতা</b>: উপর থেকে চাপ নেই; নিচের বাতাসের চাপ পারদ ধরে রাখে।',
    mis_vac_pull: 'শূন্যতা টানে না; বাতাসের চাপ নিচ থেকে ঠেলে।',
    mis_vac_air: 'নলের মুখ পারদের নিচে ছিল, বাতাস ঢুকতে পারেনি।',
    mis_vac_press: 'উপরে বাতাস থাকলে পারদ নেমে যেত, ছিদ্র করার মতো।',

    q_tilt: 'নলটি {deg}° হেলানো। পাত্রের পারদের তল থেকে নলের পারদের উপরের তল খাড়াভাবে কত উঁচুতে? স্কেল থেকে পড়ো।',
    why_tilt: '<b>{h}&nbsp;{u_cm}</b>: চাপ খাড়া উচ্চতার উপর নির্ভর করে; নলে পারদ {L}&nbsp;{u_cm}।',
    mis_tilt_along: 'এটি নল বরাবর পারদের দৈর্ঘ্য।',
    mis_tilt_cos: 'হেলালে বাতাসের চাপ বদলায় না, খাড়া উচ্চতাও না।',
    mis_tilt_less: 'স্কেলে পারদের তল {h}-এর দাগেই আছে।',

    q_mt: 'স্কেল থেকে পারদ স্তম্ভের উচ্চতা পড়ো। এই পাহাড়ে বাতাসের চাপ কত? (ρ = {rho} kg/m³, g = {g} m/s²)',
    why_mt: '<b>{P}&nbsp;{u_Pa}</b>: P = hρg = {h}&nbsp;{u_m} × {rho} × {g}।',
    mis_mt_cm: 'h-কে m-এ নেওয়া হয়নি: {cm}&nbsp;{u_cm} = {h}&nbsp;{u_m}।',
    mis_mt_water: 'এটি পানির ঘনত্ব দিয়ে হিসাব; স্তম্ভটি পারদের।',
    mis_mt_sea: 'এটি সমুদ্রতলের {sea}&nbsp;{u_cm} দিয়ে হিসাব।',

    q_water: 'পারদের বদলে পানি দিয়ে এই পরীক্ষা করলে পানির স্তম্ভ কত উঁচু হতো?',
    why_water: '<b>প্রায় {h}&nbsp;{u_m}</b>: পারদ {k} গুণ ঘন, তাই {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}।',
    mis_water_same: 'একই চাপে কম ঘন তরলের স্তম্ভ বেশি উঁচু হয়।',
    mis_water_divide: 'এখানে ভাগ করা হয়েছে; গুণ করতে হবে।',
    mis_water_tenth: 'দশমিক ভুল জায়গায় বসেছে।',

    q_straw: 'স্ট্র মুখে, বোতলে ডোবানো, কিন্তু চুমুক নেই। কোল্ড ড্রিংকস স্ট্র বেয়ে ওঠে না কেন?',
    c_st_right: 'ভেতরে-বাইরে চাপ সমান',
    c_st_noair: 'স্ট্রের ভেতরে বাতাস নেই',
    c_st_narrow: 'স্ট্র সরু, তরল ঢোকে না',
    c_st_down: 'বাতাস শুধু নিচে চাপ দেয়',
    why_straw: '<b>দুটো চাপই সমান</b>: মুখে আর বোতলে একই চাপ, কার্যকর বল নেই।',
    mis_st_noair: 'স্ট্রেও বাতাস আছে, তার চাপ বাইরের সমান।',
    mis_st_narrow: 'তরল স্ট্রে ঢোকে, বোতলের তলের সমান পর্যন্ত।',
    mis_st_down: 'তরলে চাপ সব দিকে যায়; চুমুক দিলেই তরল ওঠে।',

    q_tank: 'ঢাকনা লাগানো, ছিপি খোলা, অথচ ছিদ্র দিয়ে পানি পড়ছে না। কেন?',
    c_tk_right: 'উপরে বাতাসের চাপ নেই',
    c_tk_small: 'ছিদ্রটি খুব বেশি ছোট',
    c_tk_shallow: 'ছিদ্রের উপরে পানি খুব কম',
    c_tk_lid: 'ঢাকনা পানিকে চেপে রাখে',
    why_tank: '<b>উপরে বাতাসের চাপ নেই</b>: বাইরের বাতাস ছিদ্রে পানি আটকে রাখে, টরিসেলির নলের মতো।',
    mis_tk_small: 'ঢাকনা খুললে এই ছিদ্র দিয়েই জোরে ধারা বের হয়।',
    mis_tk_shallow: 'ছিদ্রটি প্রায় {h}&nbsp;{u_m} গভীরে।',
    mis_tk_lid: 'ঢাকনা শুধু উপরের বাতাসকে আটকায়, চাপ দেয় না।',
  },
  en: {
    title: "Torricelli's experiment: the air's pressure holds up a column of mercury",
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Pressure',
    u_cm: 'cm',
    u_m: 'm',
    u_Pa: 'Pa',
    u_rho: 'kg&nbsp;m<sup>−3</sup>',
    u_g: 'm&nbsp;s<sup>−2</sup>',
    u_Nm2: 'N/m<sup>2</sup>',

    examples: 'Which experiment',
    chip_straw: 'Straw',
    chip_torricelli: 'Torricelli',
    chip_tilt: 'Tilt',
    chip_mountain: 'Mountain',
    chip_water: 'Water',
    chip_tank: 'Hole',

    act_suck: 'Suck',
    act_stop: 'Stop sucking',
    act_fill: 'Fill the tube with mercury',
    act_turn: 'Seal it with a thumb, turn it over',
    act_release: 'Take the thumb away',
    act_pierce: 'Make a hole at the top',
    act_again: 'Start again',
    act_tilt: 'Tilt the tube more',
    act_upright: 'Stand it upright',
    act_up: 'Take it higher',
    act_down: 'Back to the sea',
    act_water: 'Use water, not mercury',
    act_replay: 'Watch again',
    act_cork: 'Pull out the cork',
    act_lid: 'Take off the lid',
    act_refill: 'Refill, put the lid on',
    act_home: 'Back to the start',

    eq_straw: 'the pressure of the cold drink in the straw',
    eq_hg: "the mercury column's pressure = the air's pressure",
    eq_hg_wait: "the mercury column's pressure",
    eq_hg_zero: "the air's pressure from above and below",
    eq_water: "the water column's pressure = the air's pressure",
    eq_tank: 'the pressure of the water above the hole',
    eq_sum: '<i>P</i> = <i>hρg</i> = <span class="tb-nw">{h}&nbsp;{u_m} × {rho}&nbsp;{u_rho} × {g}&nbsp;{u_g}</span>',
    eq_res: '= <b>{P}&nbsp;{u_Pa}</b>',
    eq_res_atm: '= <b>{P}&nbsp;{u_Pa}</b> ≈ {ten}<sup>{five}</sup>&nbsp;{u_Nm2}',
    eq_wait: '<i>P</i> = <i>hρg</i>: turn the tube over to see what h is',

    out_straw_rest: 'No sucking: <b>equal pressures</b>, the drink stays',
    out_straw_suck: 'Less pressure in the mouth: the drink <b>climbs</b>',
    out_straw_up: 'The outside air <b>pushed the drink up</b> to the mouth',
    out_t_ready: 'A glass tube closed at one end, and a dish of mercury',
    out_t_filling: 'Filling the tube with mercury…',
    out_t_full: 'The tube is <b>full of mercury</b>, its mouth open',
    out_t_turning: 'Sealed with a thumb, turned over into the dish…',
    out_t_dipped: 'Mouth under the mercury; the tube is <b>still full</b>',
    out_t_falling: 'The mercury falls…',
    out_t_settled: 'The mercury stops at <b>{h}&nbsp;{u_cm}</b>, a vacuum above',
    out_t_piercing: 'Air rushes in through the hole…',
    out_t_pierced: 'Air presses from above too: the column <b>falls</b>',
    out_tilt0: 'Upright: the column is <b>{h}&nbsp;{u_cm}</b> high',
    out_tilt: 'Tilted {deg}°: the vertical height is still <b>{h}&nbsp;{u_cm}</b>',
    out_tilting: 'Tilting the tube…',
    out_mt0: 'At the sea the column is <b>{h}&nbsp;{u_cm}</b>',
    out_mt: 'At {z}&nbsp;{u_m} the column is about <b>{h}&nbsp;{u_cm}</b>',
    out_mt_moving: 'Taking the barometer…',
    out_w_ready: 'A glass tube about {L}&nbsp;{u_m} long, water at its foot',
    out_w_rising: 'The water rises…',
    out_w_done: 'The same air holds up <b>{h}&nbsp;{u_m}</b> of water, nearly to the roof',
    out_k_ready: 'A tank with its lid on, a cork in the hole near the bottom',
    out_k_corking: 'Pulling out the cork…',
    out_k_stopped: 'Lid on: a few drops, then it <b>stops</b>',
    out_k_opening: 'Taking off the lid…',
    out_k_open: 'Lid off: <b>a strong jet</b>',
    out_k_drain: 'Less water, smaller h: the jet <b>weakens</b>',

    rule_straw0:
      "<b>A straw works because of the air's pressure.</b> Without sucking, the air in the mouth and over the drink press the same; the two pressures are equal, so there is no net force.",
    rule_straw1:
      "<b>Sucking lowers the air's pressure in the mouth,</b> and the air pressing on the drink pushes it up the straw. But however hard you suck, a cold drink never rises more than {h}&nbsp;{u_m}.",
    rule_t0:
      '<b>The scientist Torricelli, in {year},</b> filled a tube closed at one end with mercury and turned it over into a dish of mercury. Try it.',
    rule_t1:
      '<b>A thumb over the mouth keeps the mercury in.</b> Dip the mouth under the mercury in the dish before taking the thumb away, so no air gets in.',
    rule_t_settled:
      "<b>There is no hole at the top, so the air cannot press from there.</b> The air presses on the mercury in the dish; the pressure passes through the liquid to the bottom of the tube and balances the {h}&nbsp;{u_cm} column's pressure.",
    rule_t_pierced:
      "<b>A hole at the top lets the air press from above too,</b> so the mercury falls back to the dish's level. The column was held up only by the air pressing from below.",
    rule_tilt:
      '<b>Pressure depends on the vertical height h (P = hρg),</b> not on the tube’s length. A tilted tube fills more of its length, but the vertical height stays {h}&nbsp;{u_cm}.',
    rule_mt:
      "<b>An instrument that measures the air's pressure is a barometer.</b> Higher up there is less air overhead, so less pressure and a lower column.",
    rule_water:
      '<b>Mercury is {k} times as dense as water,</b> so water rises {k} times as high: {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}. A cold drink is about as dense as water, so a straw can’t lift it higher either.',
    rule_tank0: "<b>This is like Torricelli's tube:</b> with the lid on, the air cannot press from above. See what happens when the cork comes out.",
    rule_tank1:
      "<b>The lid is on, so the air cannot press from above;</b> the outside air's pressure holds the water in at the hole, just as it holds the mercury in Torricelli's tube.",
    rule_tank2:
      '<b>Lid off: the air presses on the water too,</b> and the pressure hρg of the water above the hole pushes it out. The bigger h, the stronger the jet.',

    note_sea: 'At the sea',
    note_mt: '{z}&nbsp;{u_m} above the sea',
    note_straw: 'Pressure difference exaggerated',
    note_fast: 'Shown faster',
    note_tube: 'Tube drawn thicker',

    lbl_air: "air's pressure",
    lbl_outside: "outside air's pressure",
    lbl_mouth: "air's pressure in the mouth",
    lbl_vacuum: 'vacuum',
    lbl_h: '{h}&nbsp;{u_cm}',
    lbl_col: "column's pressure",
    lbl_thumb: 'thumb',
    lbl_mercury: 'mercury',
    lbl_vert: 'vertical height {h}&nbsp;{u_cm}',
    lbl_along: 'along the tube {L}&nbsp;{u_cm}',
    lbl_water: 'water {h}&nbsp;{u_m}',
    lbl_mini: 'mercury {h}&nbsp;{u_cm}',
    lbl_depth: 'h = {h}&nbsp;{u_m}',
    lbl_same: 'same level',

    hint_wait: 'Wait a moment and watch.',

    q_count: 'Question {i} of {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Look at the picture and pick an answer.',

    q_vacuum: "What is in the empty space above the mercury in Torricelli's tube?",
    c_vac_right: 'A vacuum: nothing at all',
    c_vac_pull: 'A vacuum pulling the mercury up',
    c_vac_air: 'Air let in with the thumb',
    c_vac_press: 'Air pressing the mercury down',
    why_vacuum: '<b>A vacuum</b>: nothing presses from above; the air below holds the mercury up.',
    mis_vac_pull: 'A vacuum doesn’t pull; the air pushes from below.',
    mis_vac_air: 'The mouth was under the mercury; no air could get in.',
    mis_vac_press: 'With air above, the mercury would fall, as when pierced.',

    q_tilt: 'The tube is tilted {deg}°. How high, straight up from the mercury in the dish, is the mercury’s top? Read the scale.',
    why_tilt: '<b>{h}&nbsp;{u_cm}</b>: pressure depends on the vertical height; along the tube it is {L}&nbsp;{u_cm}.',
    mis_tilt_along: 'That is the length along the tube.',
    mis_tilt_cos: 'Tilting changes neither the air’s pressure nor the height.',
    mis_tilt_less: 'On the scale the top is still at {h}.',

    q_mt: 'Read the column on the scale. What is the air’s pressure up this mountain? (ρ = {rho} kg/m³, g = {g} m/s²)',
    why_mt: '<b>{P}&nbsp;{u_Pa}</b>: P = hρg = {h}&nbsp;{u_m} × {rho} × {g}.',
    mis_mt_cm: 'h was left in cm: {cm}&nbsp;{u_cm} = {h}&nbsp;{u_m}.',
    mis_mt_water: 'That uses water’s density; the column is mercury.',
    mis_mt_sea: 'That uses the sea’s {sea}&nbsp;{u_cm}.',

    q_water: 'If this experiment used water instead of mercury, how high would the water column be?',
    why_water: '<b>About {h}&nbsp;{u_m}</b>: mercury is {k} times as dense: {hHg}&nbsp;{u_cm} × {k} ≈ {h}&nbsp;{u_m}.',
    mis_water_same: 'The same pressure holds up a taller column of a lighter liquid.',
    mis_water_divide: 'That divides; multiply instead.',
    mis_water_tenth: 'The decimal point slipped.',

    q_straw: 'The straw is in the mouth and the bottle, but nobody sucks. Why doesn’t the drink climb the straw?',
    c_st_right: 'Equal pressures inside and out',
    c_st_noair: 'No air inside the straw',
    c_st_narrow: 'Too narrow for the drink',
    c_st_down: 'Air only presses downward',
    why_straw: '<b>Equal pressures</b>: mouth and bottle press the same, so no net force.',
    mis_st_noair: 'There is air in the straw too, pressing as hard as outside.',
    mis_st_narrow: 'The drink enters the straw, to the bottle’s level.',
    mis_st_down: 'Pressure in a liquid acts every way; suck and it rises.',

    q_tank: 'The lid is on, the cork is out, yet no water comes out of the hole. Why?',
    c_tk_right: 'No air pressing from above',
    c_tk_small: 'The hole is far too small',
    c_tk_shallow: 'Too little water above it',
    c_tk_lid: 'The lid presses the water',
    why_tank: '<b>No air pressing from above</b>: the outside air holds the water in, as in Torricelli’s tube.',
    mis_tk_small: 'Lid off, a strong jet comes through this same hole.',
    mis_tk_shallow: 'The hole is about {h}&nbsp;{u_m} deep.',
    mis_tk_lid: 'The lid only keeps the air off; it doesn’t press.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a unit) is put in.
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
