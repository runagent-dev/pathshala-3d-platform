// Every string the figure shows, in Bangla and English. The book's words on pages 142–143 (topic 5.4): বাতাসের চাপ
// (Air Pressure), "বাতাসের একটা চাপ আছে", "আমাদের শরীরের ভেতর থেকেও বাইরে একটি চাপ দেওয়া হচ্ছে", "দুটো চাপ একটা
// আরেকটিকে কাটাকাটি করে দেয়", মহাকাশ, মহাকাশচারী, "চাপ নিরোধক স্পেস স্যুট", "পৃথিবী পৃষ্ঠে বাতাসের এই চাপ 10⁵ N/m²",
// "1 m² ক্ষেত্রফলের", বাতাসের স্তম্ভ, "তার ওজন 10⁵ N, এটা মোটামুটিভাবে একটা হাতির ওজন", "ওজন হচ্ছে বল এবং এই বলটি নিচের
// দিকে কাজ করে", "চাপ ভেক্টর নয়, তার কোনো দিক নেই তাই যেকোনো জায়গায় চারদিকে চাপ সমান", "পাতলা টিন অথবা
// অ্যালুমিনিয়ামের তৈরি কোনো নিশ্ছিদ্র কৌটা", বায়ুশূন্য, দুমড়েমুচড়ে, "বাইরের বাতাসের চাপকে কৌটার ভেতরের বাতাসের পাল্টা চাপ
// দিয়ে একটা সমতা বজায় রেখেছিল", "ভেতরের বাতাস পাম্প করে সরিয়ে নেবার পর ভেতরে বাইরের বাতাসের চাপ প্রতিহত করার মতো কিছু
// নেই", "চাপ যদি শুধু উপর থেকে আসত, তাহলে কৌটাটা শুধু উপর থেকে দুমড়েমুচড়ে যেত", চ্যাপ্টা, সংকুচিত, চিত্র ৫.০৬, চিত্র ৫.০৭.
// The page writes উপর (and once ওপর). Units as the book: N/m² = Pa (প্যাসকেল, topic 5.1), N, m², cm².
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language: units are {u_N}, {u_Pa}, {u_m2}, {u_cm2}, {u_Nm2} (written with
// <sup>: the bundled font has no ²), always after a no-break space. {p5} is the book's 10⁵, written by the figure.

export const STRINGS = {
  bn: {
    title: 'বাতাসের চাপ: টিনের কৌটা দুমড়েমুচড়ে যায়',
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
    chip_column: 'বাতাসের স্তম্ভ',
    chip_body: 'শরীর',

    // the action and the quiet button
    act_pump: 'পাম্প করে বাতাস সরাও',
    act_pump_more: 'আরও বাতাস সরাও',
    act_whatif: 'যদি শুধু উপর থেকে চাপ দিত?',
    act_real: 'আসলে কী হয় দেখো',
    act_new: 'নতুন কৌটা নাও',
    act_weigh: 'স্তম্ভের ওজন দেখো',
    act_weigh_again: 'আবার দেখো',
    act_space: 'মহাকাশে হলে?',
    act_earth: 'পৃথিবীতে ফেরো',
    act_home: 'শুরুতে ফেরাও',

    // the readout under the action
    cell_out: 'বাইরের চাপ',
    cell_in: 'ভেতরের চাপ',
    cell_W: 'স্তম্ভের ওজন',
    cell_A: 'ক্ষেত্রফল',
    val_Pa: '{v}&nbsp;{u_Pa}',
    val_W: '≈&nbsp;{p5}&nbsp;{u_N}',
    val_A: '{v}&nbsp;{u_m2}',
    sum_can: 'এক পাশে বল = পার্থক্য × A = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = <b>{F}&nbsp;{u_N}</b>',
    sum_can_short: 'F = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = <b>{F}&nbsp;{u_N}</b>',
    sum_column: 'P = F/A = {p5}&nbsp;{u_N} ÷ {one}&nbsp;{u_m2} = <b>{p5}&nbsp;{u_Nm2}</b>',
    sum_body: 'পার্থক্য = <b>{dP}&nbsp;{u_Pa}</b>: কাটাকাটি',
    sum_space: 'পার্থক্য = <b>{dP}&nbsp;{u_Pa}</b>: ভেতর থেকে ঠেলা',

    // the result line
    out_can_start: 'ভেতরে আর বাইরে সমান চাপ: কৌটা যেমন ছিল তেমনই',
    out_pumping: 'ভেতরের বাতাস বের হচ্ছে…',
    out_can: 'প্রতি পাশে বাইরের বাতাসের বল <b>{F}&nbsp;{u_N}</b> বেশি',
    out_vacuum: 'বায়ুশূন্য! প্রতি পাশে <b>{F}&nbsp;{u_N}</b>: চারদিক থেকে দুমড়েমুচড়ে গেল',
    out_whatif: 'চাপ শুধু উপর থেকে এলে কৌটা <b>চ্যাপ্টা</b> হয়ে যেত (চিত্র ৫.০৭ b)',
    out_real: 'আসলে চারদিক থেকে চাপ আসে: কৌটা <b>সংকুচিত</b> হয় (চিত্র ৫.০৭ c)',
    out_column: '{one}&nbsp;{u_m2} জায়গার উপরে বাতাসের একটা স্তম্ভ (চিত্র ৫.০৬)',
    out_weighed: 'স্তম্ভের ওজন <b>{p5}&nbsp;{u_N}</b>: মোটামুটি একটা হাতির ওজন!',
    out_body: 'বাইরে আর ভেতরে সমান চাপ: দুটো চাপ <b>কাটাকাটি</b>',
    out_space: 'মহাকাশে বাইরে চাপ <b>{zero}</b>: কাটাকাটি করার কিছু নেই',

    // the rule: the book's words, one idea at a time
    rule_can_start: '<b>বাতাসের একটা চাপ আছে।</b> কৌটার ভেতরের বাতাসের পাল্টা চাপ বাইরের বাতাসের চাপের সাথে একটা সমতা বজায় রাখে।',
    rule_pump: '<b>ভেতরের বাতাস পাম্প করে সরিয়ে নিলে</b> বাইরের বাতাসের চাপ প্রতিহত করার মতো কিছু থাকে না, তাই কৌটা দুমড়েমুচড়ে যায়।',
    rule_vacuum: '<b>চাপ ভেক্টর নয়, তার কোনো দিক নেই,</b> তাই যেকোনো জায়গায় চারদিকে চাপ সমান: কৌটা শুধু উপর দিক থেকে নয়, চারদিক থেকে দুমড়েমুচড়ে যায়।',
    rule_whatif: '<b>চাপ যদি শুধু উপর থেকে আসত,</b> তাহলে কৌটাটা শুধু উপর থেকে দুমড়েমুচড়ে চ্যাপ্টা হয়ে যেত। কিন্তু তা হয় না।',
    rule_real: '<b>চাপ যেহেতু চারদিকেই সমান,</b> তাই চাপটা চারদিক থেকেই আসছে এবং টিনের কৌটাটা চারদিক থেকে দুমড়েমুচড়ে যাচ্ছে।',
    rule_column: '<b>বাতাসের চাপটি আসে বাতাসের স্তম্ভের ওজন থেকে।</b> পৃথিবী পৃষ্ঠে {one}&nbsp;{u_m2} জায়গার উপরে যে বাতাসের স্তম্ভ রয়েছে, তার ওজন কত?',
    rule_weighed:
      '<b>পৃথিবী পৃষ্ঠে বাতাসের চাপ {p5}&nbsp;{u_Nm2}।</b> ওজন হচ্ছে বল এবং এই বলটি নিচের দিকে কাজ করে, কিন্তু চাপ ভেক্টর নয়: যেকোনো জায়গায় চারদিকে চাপ সমান।',
    rule_body: '<b>আমাদের শরীরের ভেতর থেকেও বাইরে একটি চাপ দেওয়া হচ্ছে।</b> তাই দুটো চাপ একটা আরেকটিকে কাটাকাটি করে দেয়, আমরা বাতাসের চাপ আলাদাভাবে অনুভব করি না।',
    rule_space: '<b>মহাকাশে বাতাস নেই, তাই বাতাসের চাপও নেই।</b> শরীরের ভেতরের চাপকে কাটাকাটি করার কিছু নেই, তাই মহাকাশচারীরা সব সময় চাপ নিরোধক স্পেস স্যুট পরে থাকেন।',

    // notes on the stage
    note_steps: 'সহজ করে: প্রতি টানে {v}&nbsp;{u_Pa} কমে',
    note_whatif: 'কল্পনা: আসলে এমন হয় না',
    note_column: 'স্তম্ভটি আসলে বহু কিলোমিটার উঁচু',
    note_body: 'সমান লম্বা তীর: সমান চাপ',
    note_space: 'মহাকাশ: বাইরে বাতাস নেই',

    // labels on the picture
    lbl_out: 'বাইরের চাপ',
    lbl_in: 'ভেতরের চাপ',
    lbl_out_v: 'বাইরের চাপ {v}&nbsp;{u_Pa}',
    lbl_in_v: 'ভেতরের চাপ {v}&nbsp;{u_Pa}',
    lbl_top_only: 'শুধু উপর থেকে চাপ',
    lbl_ghost: 'চ্যাপ্টা (কল্পনা)',
    lbl_column: 'বাতাসের স্তম্ভ',
    lbl_1m: '{one}&nbsp;m',
    lbl_W: 'ওজন ≈ {p5}&nbsp;{u_N}',
    lbl_elephant: 'হাতির ওজন ≈ {p5}&nbsp;{u_N}',
    lbl_body_in: 'শরীরের ভেতরের চাপ',

    hint_wait: 'দেখো কৌটার কী হয়।',
    hint_part: 'আগে "{part}" বেছে নাও।',

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
      '<b>{F}&nbsp;{u_N}</b>: পার্থক্য = {Po}&nbsp;{u_Pa} − {Pi}&nbsp;{u_Pa} = {dP}&nbsp;{u_Pa}; A = {c}&nbsp;{u_cm2} = {A}&nbsp;{u_m2}; বল = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = {F}&nbsp;{u_N}।',
    mis_outside: 'এটি শুধু বাইরের চাপ × A; ভেতরের বাতাসও তো পাল্টা চাপ দিচ্ছে।',
    mis_inside: 'এটি ভেতরের চাপ × A; নিতে হবে বাইরের আর ভেতরের চাপের পার্থক্য।',
    mis_cm2: '{u_cm2}-কে {u_m2} না করে গুণ করা হয়েছে; {c}&nbsp;{u_cm2} = {A}&nbsp;{u_m2}।',

    q_top: 'ধরো, বাতাসের চাপ শুধু উপর থেকে আসে (ছবির তীরের মতো)। ভেতরের বাতাস সরালে কৌটাটা কেমন হতো?',
    c_flat: 'উচ্চতা কমে চ্যাপ্টা হয়ে যেত',
    c_inward: 'চার পাশের দেয়াল ভেতরে ঢুকে যেত',
    c_nothing: 'কৌটার কোনো বদলই হতো না',
    c_swell: 'কৌটাটা ফুলে বড় হয়ে যেত',
    why_top: '<b>উচ্চতা কমে চ্যাপ্টা হয়ে যেত</b>: বই বলে, চাপ যদি শুধু উপর থেকে আসত, তাহলে কৌটাটা শুধু উপর থেকে দুমড়েমুচড়ে যেত (চিত্র ৫.০৭ b)।',
    mis_inward: 'পাশ থেকে চাপ এলে তবেই দেয়াল ভেতরে ঢুকত; এখানে ধরা হয়েছে চাপ শুধু উপর থেকে আসে।',
    mis_nothing: 'ভেতরের পাল্টা চাপ না থাকলে উপরের চাপ কৌটাকে চেপে দেবে।',
    mis_swell: 'কৌটা ফোলে ভেতরের চাপ বেশি হলে; এখানে ভেতরের চাপ কমেছে।',

    q_all: 'ভেতরের বাতাস সরালে কৌটাটা আসলে চারদিক থেকে দুমড়েমুচড়ে যায় (ছবি)। কেন?',
    c_nodir: 'চাপ চারদিকে সমান, তার কোনো দিক নেই',
    c_pump: 'পাম্প ভেতর থেকে দেয়ালগুলো টেনে নেয়',
    c_weight: 'বাতাসের ওজন শুধু নিচের দিকে কাজ করে',
    c_piles: 'বাতাস কৌটার পাশে জমে চাপ বাড়ায়',
    why_all: '<b>চাপ চারদিকে সমান</b>: চাপ ভেক্টর নয়, তার কোনো দিক নেই; তাই বাইরের বাতাস প্রতিটি পাশে সমান চাপ দেয়।',
    mis_pump: 'পাম্প শুধু ভেতরের বাতাস সরিয়ে নেয়; কৌটাকে চাপ দেয় বাইরের বাতাস।',
    mis_weight: 'ওজন নিচের দিকে কাজ করে, কিন্তু চাপ ভেক্টর নয়: যেকোনো জায়গায় চারদিকে চাপ সমান।',
    mis_piles: 'বাতাস কোনো এক পাশে জমে না; সব পাশে বাতাসের চাপ সমান।',

    q_column: 'ছবির {one} m × {one} m জায়গার উপরে বাতাসের স্তম্ভের ওজন প্রায় কত?',
    c_w5: '{p5}&nbsp;{u_N}',
    c_p5: '{p5}&nbsp;{u_Nm2}',
    c_w1: '{p1}&nbsp;{u_N}',
    c_w3: '{p3}&nbsp;{u_N}',
    why_column:
      '<b>{p5}&nbsp;{u_N}</b>: পৃথিবী পৃষ্ঠে বাতাসের চাপ {p5}&nbsp;{u_Nm2}; তাই {one}&nbsp;{u_m2} জায়গার উপরের স্তম্ভের ওজন = {p5}&nbsp;{u_Nm2} × {one}&nbsp;{u_m2} = {p5}&nbsp;{u_N}, মোটামুটি একটা হাতির ওজন।',
    mis_p5: '{u_Nm2} চাপের একক; ওজন একটি বল, তার একক {u_N}।',
    mis_w1: 'বাতাস হালকা মনে হলেও স্তম্ভটি বহু কিলোমিটার উঁচু, তাই তার ওজন অনেক বেশি।',
    mis_w3: 'এটি {p5}&nbsp;{u_N}-এর একশো ভাগের এক ভাগ; বই বলছে ওজনটা প্রায় একটা হাতির ওজন।',

    q_body: 'বাইরের বাতাস তোমার শরীরে চারদিক থেকে চাপ দিচ্ছে (লাল তীর)। তবু তুমি এই চাপ টের পাও না কেন?',
    c_inside: 'শরীরের ভেতর থেকেও বাইরে সমান চাপ পড়ে',
    c_noweight: 'বাতাসের কোনো ওজন নেই, তাই চাপও নেই',
    c_toponly: 'বাতাস শুধু মাথার উপরে চাপ দেয়',
    c_tiny: 'বাতাসের চাপ খুব কম, মাত্র কয়েক Pa',
    why_body: '<b>শরীরের ভেতর থেকেও বাইরে সমান চাপ পড়ে</b>: তাই দুটো চাপ একটা আরেকটিকে কাটাকাটি করে দেয়, আমরা আলাদাভাবে অনুভব করি না।',
    mis_noweight: 'বাতাসের ওজন আছে: {one}&nbsp;{u_m2} জায়গার উপরের স্তম্ভের ওজন প্রায় {p5}&nbsp;{u_N}।',
    mis_toponly: 'চাপের কোনো দিক নেই: শুধু উপর থেকে নয়, চারদিক থেকে সমান চাপ আসে।',
    mis_tiny: 'বাতাসের চাপ অনেক: {p5}&nbsp;{u_Nm2}, মানে {P}&nbsp;{u_Pa}।',
  },
  en: {
    title: 'Air pressure: a tin box crumples',
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
    chip_column: 'Air column',
    chip_body: 'Body',

    act_pump: 'Pump the air out',
    act_pump_more: 'Pump out more air',
    act_whatif: 'What if only from the top?',
    act_real: 'See what really happens',
    act_new: 'Take a new box',
    act_weigh: 'Show its weight',
    act_weigh_again: 'Show it again',
    act_space: 'And in space?',
    act_earth: 'Back to the Earth',
    act_home: 'Back to the start',

    cell_out: 'Outside',
    cell_in: 'Inside',
    cell_W: 'Column’s weight',
    cell_A: 'Area',
    val_Pa: '{v}&nbsp;{u_Pa}',
    val_W: '≈&nbsp;{p5}&nbsp;{u_N}',
    val_A: '{v}&nbsp;{u_m2}',
    sum_can: 'Force on one face = difference × A = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = <b>{F}&nbsp;{u_N}</b>',
    sum_can_short: 'F = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = <b>{F}&nbsp;{u_N}</b>',
    sum_column: 'P = F/A = {p5}&nbsp;{u_N} ÷ {one}&nbsp;{u_m2} = <b>{p5}&nbsp;{u_Nm2}</b>',
    sum_body: 'Difference = <b>{dP}&nbsp;{u_Pa}</b>: they cancel',
    sum_space: 'Difference = <b>{dP}&nbsp;{u_Pa}</b>: pushing out',

    out_can_start: 'The same pressure inside and outside: the box stays as it is',
    out_pumping: 'The air inside is going out…',
    out_can: 'On each face the outside air pushes <b>{F}&nbsp;{u_N}</b> more',
    out_vacuum: 'No air inside! <b>{F}&nbsp;{u_N}</b> on each face: crushed from every side',
    out_whatif: 'Pushed only from the top, the box would be <b>flattened</b> (fig. 5.07 b)',
    out_real: 'Pressure really comes from every side: the box <b>shrinks inward</b> (fig. 5.07 c)',
    out_column: 'A column of air over {one}&nbsp;{u_m2} of ground (fig. 5.06)',
    out_weighed: 'The column weighs <b>{p5}&nbsp;{u_N}</b>: roughly an elephant’s weight!',
    out_body: 'The same pressure outside and inside: the two <b>cancel</b>',
    out_space: 'In space the outside pressure is <b>{zero}</b>: nothing to cancel',

    rule_can_start: '<b>Air has a pressure.</b> The air inside the box pushes back on the outside air’s pressure and keeps a balance.',
    rule_pump: '<b>Once the air inside is pumped out,</b> nothing inside resists the outside air’s pressure, so the box crumples.',
    rule_vacuum:
      '<b>Pressure is not a vector: it has no direction,</b> so at any place it is the same in every direction. The box crumples from every side, not only from the top.',
    rule_whatif: '<b>If pressure came only from the top,</b> the box would crumple from the top only and be flattened. But that is not what happens.',
    rule_real: '<b>Since pressure is the same in every direction,</b> it comes from every side, and the tin box crumples from every side.',
    rule_column:
      '<b>Air pressure comes from the weight of the air column.</b> How much does the column of air over {one}&nbsp;{u_m2} of the Earth’s surface weigh?',
    rule_weighed:
      '<b>Air pressure at the Earth’s surface is {p5}&nbsp;{u_Nm2}.</b> Weight is a force and acts downward, but pressure is not a vector: at any place it is the same in every direction.',
    rule_body: '<b>Our body pushes outward from inside too.</b> So the two pressures cancel each other, and we don’t feel the air’s pressure.',
    rule_space:
      '<b>In space there is no air, so no air pressure.</b> Nothing cancels the pressure inside the body, so astronauts always wear pressure suits.',

    note_steps: 'Made simple: each stroke lowers it by {v}&nbsp;{u_Pa}',
    note_whatif: 'Imagined: this is not what happens',
    note_column: 'The real column is many kilometres high',
    note_body: 'Arrows of equal length: equal pressure',
    note_space: 'Space: no air outside',

    lbl_out: 'Outside pressure',
    lbl_in: 'Inside pressure',
    lbl_out_v: 'Outside {v}&nbsp;{u_Pa}',
    lbl_in_v: 'Inside {v}&nbsp;{u_Pa}',
    lbl_top_only: 'Pressure from the top only',
    lbl_ghost: 'Flattened (imagined)',
    lbl_column: 'Air column',
    lbl_1m: '{one}&nbsp;m',
    lbl_W: 'Weight ≈ {p5}&nbsp;{u_N}',
    lbl_elephant: 'Elephant ≈ {p5}&nbsp;{u_N}',
    lbl_body_in: 'Pressure from inside',

    hint_wait: 'Watch what happens to the box.',
    hint_part: 'First choose "{part}".',

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
      '<b>{F}&nbsp;{u_N}</b>: difference = {Po}&nbsp;{u_Pa} − {Pi}&nbsp;{u_Pa} = {dP}&nbsp;{u_Pa}; A = {c}&nbsp;{u_cm2} = {A}&nbsp;{u_m2}; force = {dP}&nbsp;{u_Pa} × {A}&nbsp;{u_m2} = {F}&nbsp;{u_N}.',
    mis_outside: 'That is the outside pressure × A alone; the inside air still pushes back.',
    mis_inside: 'That is the inside pressure × A; take the difference between outside and inside.',
    mis_cm2: 'That multiplies by {u_cm2} without changing to {u_m2}; {c}&nbsp;{u_cm2} = {A}&nbsp;{u_m2}.',

    q_top:
      'Suppose air pressure came only from the top (like the arrows in the picture). If the air inside were taken out, what would the box look like?',
    c_flat: 'Lower and flattened',
    c_inward: 'Its four walls pushed in',
    c_nothing: 'Not changed at all',
    c_swell: 'Swollen up, bigger',
    why_top:
      '<b>Lower and flattened</b>: the book says that if pressure came only from the top, the box would crumple from the top only (fig. 5.07 b).',
    mis_inward: 'The walls go in only when pressure comes from the sides; here we supposed it comes only from the top.',
    mis_nothing: 'Without the inside air pushing back, the pressure from the top squashes the box.',
    mis_swell: 'A box swells when the pressure inside is bigger; here the inside pressure went down.',

    q_all: 'With the air inside taken out, the box really crumples from every side (picture). Why?',
    c_nodir: 'Pressure is the same every way: it has no direction',
    c_pump: 'The pump pulls the walls from inside',
    c_weight: 'The air’s weight acts only downward',
    c_piles: 'Air piles up by the box’s sides',
    why_all:
      '<b>Pressure is the same every way</b>: pressure is not a vector, it has no direction, so the outside air presses equally on every face.',
    mis_pump: 'The pump only takes the inside air away; it is the outside air that presses on the box.',
    mis_weight: 'Weight acts downward, but pressure is not a vector: at any place it is the same in every direction.',
    mis_piles: 'Air does not pile up on one side; its pressure is the same on every side.',

    q_column: 'About how much does the column of air over the {one} m × {one} m square in the picture weigh?',
    c_w5: '{p5}&nbsp;{u_N}',
    c_p5: '{p5}&nbsp;{u_Nm2}',
    c_w1: '{p1}&nbsp;{u_N}',
    c_w3: '{p3}&nbsp;{u_N}',
    why_column:
      '<b>{p5}&nbsp;{u_N}</b>: air pressure at the Earth’s surface is {p5}&nbsp;{u_Nm2}, so the column over {one}&nbsp;{u_m2} weighs {p5}&nbsp;{u_Nm2} × {one}&nbsp;{u_m2} = {p5}&nbsp;{u_N}, roughly an elephant’s weight.',
    mis_p5: '{u_Nm2} is the unit of pressure; a weight is a force, measured in {u_N}.',
    mis_w1: 'Air feels light, but the column is many kilometres high, so it weighs a lot.',
    mis_w3: 'That is a hundredth of {p5}&nbsp;{u_N}; the book says it is about an elephant’s weight.',

    q_body: 'The outside air presses on your body from every side (red arrows). Why don’t you feel it?',
    c_inside: 'The body pushes out equally from inside',
    c_noweight: 'Air has no weight, so no pressure',
    c_toponly: 'Air presses only on top of the head',
    c_tiny: 'Air pressure is tiny, a few Pa',
    why_body: '<b>The body pushes out equally from inside</b>: so the two pressures cancel each other, and we don’t feel it.',
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
