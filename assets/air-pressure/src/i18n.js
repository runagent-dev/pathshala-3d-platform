// Every string the figure shows, in Bangla and English. The book's words on pages 142–143 (topic 5.4): বাতাসের চাপ
// (Air Pressure), "বাতাসের একটা চাপ আছে", "আমাদের শরীরের ভেতর থেকেও বাইরে একটি চাপ দেওয়া হচ্ছে", "দুটো চাপ একটা
// আরেকটিকে কাটাকাটি করে দেয়", মহাকাশ, মহাকাশচারী, "চাপ নিরোধক স্পেস স্যুট", "পৃথিবী পৃষ্ঠে বাতাসের এই চাপ 10⁵ N/m²",
// "মহাকাশে বাতাস নেই, তাই বাতাসের চাপও নেই", "শরীরের ভেতরের চাপকে কাটাকাটি করার জন্য কিছু নেই", "এ রকম পরিবেশে মানুষের
// শরীর তার ভেতরকার চাপে বিস্ফোরিত হয়ে যেতে পারে", "ওজন হচ্ছে বল এবং এই বলটি নিচের দিকে কাজ করে", "চাপ ভেক্টর নয়, তার কোনো দিক নেই তাই যেকোনো জায়গায় চারদিকে চাপ সমান", "পাতলা টিন অথবা
// অ্যালুমিনিয়ামের তৈরি কোনো নিশ্ছিদ্র কৌটা", বায়ুশূন্য, দুমড়েমুচড়ে, "বাইরের বাতাসের চাপকে কৌটার ভেতরের বাতাসের পাল্টা চাপ
// দিয়ে একটা সমতা বজায় রেখেছিল", "ভেতরের বাতাস পাম্প করে সরিয়ে নেবার পর ভেতরে বাইরের বাতাসের চাপ প্রতিহত করার মতো কিছু
// নেই", "চাপ যদি শুধু উপর থেকে আসত, তাহলে কৌটাটা শুধু উপর থেকে দুমড়েমুচড়ে যেত", চ্যাপ্টা, সংকুচিত, চিত্র ৫.০৬, চিত্র ৫.০৭.
// The page writes উপর (and once ওপর). Units as the book: N/m² = Pa (প্যাসকেল, topic 5.1), N, m², cm².
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language: units are {u_N}, {u_Pa}, {u_m2}, {u_cm2}, {u_Nm2} (written with
// <sup>: the bundled font has no ²), always after a no-break space. {p5} is the book's 10⁵, written by the figure.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'বাতাসের চাপ: টিনের কৌটা আর আমাদের শরীর',
    act_space: 'মহাকাশে নিয়ে যাও',
    act_suit: 'স্পেস স্যুট পরাও',
    act_again: 'আবার দেখো',
    cell_suit: 'স্যুটের চাপ',
    cell_body_in: 'শরীরের ভেতরের চাপ',
    out_earth: 'বাইরে = ভেতরে: <b>সমান চাপ, কাটাকাটি</b>',
    out_going: 'মহাকাশে যাচ্ছে…',
    out_space: 'বাইরে চাপ <b>{zero}</b>: কাটাকাটি করার কিছু নেই',
    out_suiting: 'স্পেস স্যুট পরানো হচ্ছে…',
    out_suit: 'স্যুট = ভেতরে: <b>আবার সমান, কাটাকাটি</b>',
    rule_earth: 'শরীরের ভেতর থেকেও বাইরের দিকে একটি চাপ পড়ছে। দুটো চাপ একে অন্যকে <b>কাটাকাটি</b> করে দেয়, তাই আমরা বাতাসের চাপ আলাদাভাবে অনুভব করি না।',
    rule_space: 'মহাকাশে <b>বাতাস নেই</b>, তাই বাতাসের চাপও নেই। শরীরের ভেতরের চাপকে কাটাকাটি করার মতো কিছু সেখানে নেই।',
    rule_suit: 'তাই মহাকাশচারীরা সব সময় চাপ নিরোধক <b>স্পেস স্যুট</b> পরে থাকেন। স্যুট শরীরের চারপাশে চাপ ধরে রাখে, তাই দুটো চাপ আবার কাটাকাটি হয়।',
    note_burst: 'এ রকম পরিবেশে মানুষের শরীর তার ভেতরকার চাপে বিস্ফোরিত হয়ে যেতে পারে।',
    note_suit: 'সহজ করে দেখানো: আসল স্যুটে চাপ এর চেয়ে কিছুটা কম রাখা হয়',
    lbl_air: 'বাইরের বাতাসের চাপ',
    lbl_suit: 'স্যুটের চাপ',
    lbl_body_in: 'শরীরের ভেতরের চাপ',
    hint_watch: 'দেখো কী হয়।',
    q_space: 'মহাকাশে বাতাস নেই (ছবি)। মহাকাশচারীরা সব সময় চাপ নিরোধক স্পেস স্যুট পরেন কেন?',
    c_cancel: 'ভেতরের চাপকে কাটাকাটি করতে',
    c_morepush: 'মহাকাশে বাতাসের চাপ অনেক বেশি বলে',
    c_stopair: 'বাইরের বাতাস যেন শরীরে চাপ না দেয়',
    c_float: 'ভারী স্যুটে শরীর যেন ভেসে না যায়',
    why_space: '<b>ভেতরের চাপকে কাটাকাটি করতে</b>। মহাকাশে বাইরে থেকে কোনো চাপ নেই। স্যুট শরীরের চারপাশে চাপ ধরে রাখে, নইলে শরীর ভেতরের চাপে বিস্ফোরিত হয়ে যেতে পারে।',
    mis_morepush: 'মহাকাশে বাতাসই নেই, তাই বাতাসের চাপও নেই।',
    mis_stopair: 'মহাকাশে বাইরে কোনো বাতাস নেই যে চাপ দেবে; উল্টো, স্যুট নিজেই শরীরে চাপ দেয়।',
    mis_float: 'স্যুট শরীরকে ভারী করার জন্য নয়; স্যুট শরীরের চারপাশে চাপ ধরে রাখে।',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বাতাসের চাপ',
    u_N: 'N',
    u_Pa: 'Pa',
    u_m2: 'm<sup>2</sup>',
    u_cm2: 'cm<sup>2</sup>',
    u_Nm2: 'N/m<sup>2</sup>',
    pow: '{b}<sup>{e}</sup>',

    // the row of words: the three parts
    parts: 'কী দেখবে',
    chip_can: 'টিনের কৌটা',
    chip_body: 'আমাদের শরীর',

    // the action and the quiet button
    act_pump: 'পাম্প করে বাতাস সরাও',
    act_pump_more: 'আরও বাতাস সরাও',
    act_whatif: 'যদি শুধু উপর থেকে চাপ দিত?',
    act_real: 'আসলে কী হয় দেখো',
    act_new: 'নতুন কৌটা নাও',
    act_home: 'শুরুতে ফেরাও',

    // the readout under the action
    cell_out: 'বাইরের চাপ',
    cell_in: 'ভেতরের চাপ',
    val_Pa: '{v}&nbsp;{u_Pa}',
    sum_can: 'এক পাশে বল = পার্থক্য × A = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = <b>{F}&nbsp;{u_N}</b>',
    sum_can_short: 'F = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = <b>{F}&nbsp;{u_N}</b>',

    // the result line
    out_can_start: 'ভেতরে আর বাইরে সমান চাপ: কৌটা যেমন ছিল তেমনই',
    out_pumping: 'ভেতরের বাতাস বের হচ্ছে…',
    out_can: 'প্রতি পাশে বাইরের বাতাসের বল <b>{F}&nbsp;{u_N}</b> বেশি',
    out_vacuum: 'বায়ুশূন্য! প্রতি পাশে <b>{F}&nbsp;{u_N}</b>: চারদিক থেকে দুমড়েমুচড়ে গেল',
    out_whatif: 'চাপ শুধু উপর থেকে এলে কৌটা <b>চ্যাপ্টা</b> হয়ে যেত (চিত্র ৫.০৭ b)',
    out_real: 'আসলে চারদিক থেকে চাপ আসে: কৌটা <b>সংকুচিত</b> হয় (চিত্র ৫.০৭ c)',

    // the rule: the book's words, one idea at a time
    rule_can_start: '<b>বাতাসের চাপ</b> আছে। কৌটার ভেতরের বাতাসের পাল্টা চাপ বাইরের বাতাসের চাপের সাথে সমতা রাখে।',
    rule_pump: 'ভেতরের বাতাস পাম্প করে সরিয়ে নিলে বাইরের চাপ প্রতিহত করার মতো কিছু থাকে না। তাই কৌটা <b>দুমড়েমুচড়ে</b> যায়।',
    rule_vacuum: 'চাপ ভেক্টর নয়, তার কোনো <b>দিক</b> নেই। তাই যেকোনো জায়গায় চারদিকে চাপ সমান। কৌটা শুধু উপর থেকে নয়, চারদিক থেকে দুমড়েমুচড়ে যায়।',
    rule_whatif: 'চাপ যদি <b>শুধু উপর থেকে</b> আসত, কৌটাটা উপর থেকে দুমড়েমুচড়ে চ্যাপ্টা হয়ে যেত। কিন্তু তা হয় না।',
    rule_real: 'চাপ <b>চারদিকেই সমান</b>। তাই চাপ চারদিক থেকেই আসে, আর টিনের কৌটাটা চারদিক থেকে দুমড়েমুচড়ে যায়।',

    // notes on the stage
    note_steps: 'সহজ করে: প্রতি টানে {v}&nbsp;{u_Pa} কমে',
    note_whatif: 'কল্পনা: আসলে এমন হয় না',

    // labels on the picture
    lbl_out: 'বাইরের চাপ',
    lbl_in: 'ভেতরের চাপ',
    lbl_out_v: 'বাইরের চাপ {v}&nbsp;{u_Pa}',
    lbl_in_v: 'ভেতরের চাপ {v}&nbsp;{u_Pa}',
    lbl_top_only: 'শুধু উপর থেকে চাপ',
    lbl_ghost: 'চ্যাপ্টা (কল্পনা)',

    hint_wait: 'দেখো কৌটার কী হয়।',

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

    q_force: 'কৌটার ভেতরের আর বাইরের চাপ ছবিতে লেখা আছে। কৌটার এক পাশে ({s} cm × {s} cm) বাইরের বাতাস ভেতরের বাতাসের চেয়ে কত বেশি বল দিচ্ছে?',
    why_force:
      '<b>{F}&nbsp;{u_N}</b><span class="pvc-formula">পার্থক্য = {Po}&nbsp;{u_Pa} − {Pi}&nbsp;{u_Pa} = {dP}&nbsp;{u_Pa}<br><i>A</i> = {c}&nbsp;{u_cm2} = {A}&nbsp;{u_m2}<br>বল = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = {F}&nbsp;{u_N}</span>',
    mis_outside: 'এটি শুধু বাইরের চাপ × A; ভেতরের বাতাসও তো পাল্টা চাপ দিচ্ছে।',
    mis_inside: 'এটি ভেতরের চাপ × A; নিতে হবে বাইরের আর ভেতরের চাপের পার্থক্য।',
    mis_cm2: '{u_cm2}-কে {u_m2} না করে গুণ করা হয়েছে; {c}&nbsp;{u_cm2} = {A}&nbsp;{u_m2}।',

    q_all: 'ভেতরের বাতাস সরালে কৌটাটা আসলে চারদিক থেকে দুমড়েমুচড়ে যায় (ছবি)। কেন?',
    c_nodir: 'চাপ চারদিকে সমান, তার কোনো দিক নেই',
    c_pump: 'পাম্প ভেতর থেকে দেয়ালগুলো টেনে নেয়',
    c_weight: 'বাতাসের ওজন শুধু নিচের দিকে কাজ করে',
    c_piles: 'বাতাস কৌটার পাশে জমে চাপ বাড়ায়',
    why_all: '<b>চাপ চারদিকে সমান</b>। চাপ ভেক্টর নয়, তার কোনো দিক নেই। তাই বাইরের বাতাস প্রতিটি পাশে সমান চাপ দেয়।',
    mis_pump: 'পাম্প শুধু ভেতরের বাতাস সরিয়ে নেয়; কৌটাকে চাপ দেয় বাইরের বাতাস।',
    mis_weight: 'ওজন নিচের দিকে কাজ করে, কিন্তু চাপ ভেক্টর নয়: যেকোনো জায়গায় চারদিকে চাপ সমান।',
    mis_piles: 'বাতাস কোনো এক পাশে জমে না; সব পাশে বাতাসের চাপ সমান।',

    q_body: 'বাইরের বাতাস তোমার শরীরে চারদিক থেকে চাপ দিচ্ছে (লাল তীর)। তবু তুমি এই চাপ টের পাও না কেন?',
    c_inside: 'শরীরের ভেতর থেকেও বাইরে সমান চাপ পড়ে',
    c_noweight: 'বাতাসের কোনো ওজন নেই, তাই চাপও নেই',
    c_toponly: 'বাতাস শুধু মাথার উপরে চাপ দেয়',
    c_tiny: 'বাতাসের চাপ খুব কম, মাত্র কয়েক Pa',
    why_body: '<b>শরীরের ভেতর থেকেও বাইরে সমান চাপ পড়ে</b>। দুটো চাপ কাটাকাটি হয়, তাই আমরা আলাদাভাবে অনুভব করি না।',
    mis_noweight: 'বাতাসের ওজন আছে: {one}&nbsp;{u_m2} জায়গার উপরের স্তম্ভের ওজন প্রায় {p5}&nbsp;{u_N}।',
    mis_toponly: 'চাপের কোনো দিক নেই: শুধু উপর থেকে নয়, চারদিক থেকে সমান চাপ আসে।',
    mis_tiny: 'বাতাসের চাপ অনেক: {p5}&nbsp;{u_Nm2}, মানে {P}&nbsp;{u_Pa}।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Air pressure: a tin box and our body',
    act_space: 'Take him to space',
    act_suit: 'Put on the space suit',
    act_again: 'See it again',
    cell_suit: 'Suit’s pressure',
    cell_body_in: 'Inside the body',
    out_earth: 'Outside = inside: <b>equal, they cancel</b>',
    out_going: 'Going to space…',
    out_space: 'Outside <b>{zero}</b>: nothing to cancel it',
    out_suiting: 'Putting on the space suit…',
    out_suit: 'Suit = inside: <b>equal again, they cancel</b>',
    rule_earth: 'Our body pushes outward from inside too. The two pressures <b>cancel</b> each other, so we don’t feel the air’s pressure.',
    rule_space: 'In space there is <b>no air</b>, so no air pressure. Nothing there cancels the pressure inside the body.',
    rule_suit:
      'That is why astronauts always wear a pressure-tight <b>space suit</b>. It keeps a pressure all round the body, so the two pressures cancel again.',
    note_burst: 'In such a place a person’s body could burst from the pressure inside it.',
    note_suit: 'Made simple: a real suit keeps a somewhat lower pressure',
    lbl_air: 'Outside air’s pressure',
    lbl_suit: 'Suit’s pressure',
    lbl_body_in: 'Pressure from inside',
    hint_watch: 'Watch what happens.',
    q_space: 'There is no air in space (picture). Why do astronauts always wear pressure suits?',
    c_cancel: 'To cancel the pressure inside',
    c_morepush: 'Air pressure in space is very high',
    c_stopair: 'To keep the outside air from pressing',
    c_float: 'A heavy suit keeps the body from floating',
    why_space:
      '<b>To cancel the pressure inside</b>. In space nothing presses from outside. The suit keeps a pressure round the body, or it could burst from the pressure inside.',
    mis_morepush: 'There is no air in space at all, so no air pressure.',
    mis_stopair: 'There is no outside air in space to press; it is the suit that presses on the body.',
    mis_float: 'The suit is not there to make the body heavy; it keeps a pressure all round the body.',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Air pressure',
    u_N: 'N',
    u_Pa: 'Pa',
    u_m2: 'm<sup>2</sup>',
    u_cm2: 'cm<sup>2</sup>',
    u_Nm2: 'N/m<sup>2</sup>',
    pow: '{b}<sup>{e}</sup>',

    parts: 'What to look at',
    chip_can: 'Tin box',
    chip_body: 'Our body',

    act_pump: 'Pump the air out',
    act_pump_more: 'Pump out more air',
    act_whatif: 'What if only from the top?',
    act_real: 'See what really happens',
    act_new: 'Take a new box',
    act_home: 'Back to the start',

    cell_out: 'Outside',
    cell_in: 'Inside',
    val_Pa: '{v}&nbsp;{u_Pa}',
    sum_can: 'Force on one face = difference × A = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = <b>{F}&nbsp;{u_N}</b>',
    sum_can_short: 'F = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = <b>{F}&nbsp;{u_N}</b>',

    out_can_start: 'The same pressure inside and outside: the box stays as it is',
    out_pumping: 'The air inside is going out…',
    out_can: 'On each face the outside air pushes <b>{F}&nbsp;{u_N}</b> more',
    out_vacuum: 'No air inside! <b>{F}&nbsp;{u_N}</b> on each face: crushed from every side',
    out_whatif: 'Pushed only from the top, the box would be <b>flattened</b> (fig. 5.07 b)',
    out_real: 'Pressure really comes from every side: the box <b>shrinks inward</b> (fig. 5.07 c)',

    rule_can_start: 'Air has a <b>pressure</b>. The air inside the box pushes back and balances the outside air’s pressure.',
    rule_pump: 'Pump out the air inside, and nothing resists the outside air’s pressure. So the box <b>crumples</b>.',
    rule_vacuum:
      'Pressure is not a vector: it has no <b>direction</b>. So at any place it is the same every way. The box crumples from every side, not only from the top.',
    rule_whatif: 'If pressure came <b>only from the top</b>, the box would crumple from the top and go flat. But that is not what happens.',
    rule_real: 'Pressure is the same <b>in every direction</b>. So it comes from every side, and the tin box crumples from every side.',

    note_steps: 'Made simple: each stroke lowers it by {v}&nbsp;{u_Pa}',
    note_whatif: 'Imagined: this is not what happens',

    lbl_out: 'Outside pressure',
    lbl_in: 'Inside pressure',
    lbl_out_v: 'Outside {v}&nbsp;{u_Pa}',
    lbl_in_v: 'Inside {v}&nbsp;{u_Pa}',
    lbl_top_only: 'Pressure from the top only',
    lbl_ghost: 'Flattened (imagined)',

    hint_wait: 'Watch what happens to the box.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The right answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Great! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The picture is locked during the test. Pick an answer from the picture.',

    q_force:
      'The pressures inside and outside the box are written on the picture. On one face ({s} cm × {s} cm), how much more force does the outside air push with than the inside air?',
    why_force:
      '<b>{F}&nbsp;{u_N}</b><span class="pvc-formula">difference = {Po}&nbsp;{u_Pa} − {Pi}&nbsp;{u_Pa} = {dP}&nbsp;{u_Pa}<br><i>A</i> = {c}&nbsp;{u_cm2} = {A}&nbsp;{u_m2}<br>force = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = {F}&nbsp;{u_N}</span>',
    mis_outside: 'That is the outside pressure × A alone; the inside air still pushes back.',
    mis_inside: 'That is the inside pressure × A; take the difference between outside and inside.',
    mis_cm2: 'That multiplies by {u_cm2} without changing to {u_m2}; {c}&nbsp;{u_cm2} = {A}&nbsp;{u_m2}.',

    q_all: 'With the air inside taken out, the box really crumples from every side (picture). Why?',
    c_nodir: 'Pressure is the same every way: it has no direction',
    c_pump: 'The pump pulls the walls from inside',
    c_weight: 'The air’s weight acts only downward',
    c_piles: 'Air piles up by the box’s sides',
    why_all: '<b>Pressure is the same every way</b>. It is not a vector and has no direction, so the outside air presses equally on every face.',
    mis_pump: 'The pump only takes the inside air away; it is the outside air that presses on the box.',
    mis_weight: 'Weight acts downward, but pressure is not a vector: at any place it is the same in every direction.',
    mis_piles: 'Air does not pile up on one side; its pressure is the same on every side.',

    q_body: 'The outside air presses on your body from every side (red arrows). Why don’t you feel it?',
    c_inside: 'The body pushes out equally from inside',
    c_noweight: 'Air has no weight, so no pressure',
    c_toponly: 'Air presses only on top of the head',
    c_tiny: 'Air pressure is tiny, a few Pa',
    why_body: '<b>The body pushes out equally from inside</b>. The two pressures cancel, so we don’t feel it.',
    mis_noweight: 'Air has weight: the column over {one}&nbsp;{u_m2} weighs about {p5}&nbsp;{u_N}.',
    mis_toponly: 'Pressure has no direction: it comes equally from every side, not only from the top.',
    mis_tiny: 'Air pressure is big: {p5}&nbsp;{u_Nm2}, that is {P}&nbsp;{u_Pa}.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a unit) is put in. A var that is already HTML (a power of ten
 * from t.pow) is put in as it is.
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
  /** 10ⁿ the book's way, with this language's digits. */
  t.pow = (b, e) => t('pow', { b, e });
  return t;
}
