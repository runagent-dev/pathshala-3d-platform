// Every string the figure shows, in Bangla and English. The book's words on pages 201–202 (topic 7.3.1, প্রতিধ্বনি):
// "শব্দ যেহেতু একধরনের তরঙ্গ, তাই তার প্রতিফলন হতে পারে", গমগম আওয়াজ, "আমরা যখন কিছু শুনি তার অনুভূতিটা 0.1 s পর্যন্ত
// থেকে যায়", "দুটি শব্দ আলাদাভাবে শুনতে হলে দুটি শব্দের মাঝে কমপক্ষে 0.1 s এর একটা ব্যবধান থাকা দরকার", "শব্দের বেগ
// 330 m/s", 33 m, "বড় দেয়াল, দালান কিংবা খাড়া পাহাড়", "এই দূরত্বের অর্ধেক দূরত্বে (16.5 m)", বাদুড়, আলট্রাসাউন্ড, 100 kHz.
// Units are the book's Latin symbols (m, s, m/s) after a no-break space. Use t('key', vars) in code and t.num() for
// numbers; numbers inside sentences come in as {vars}. A {key} that is not a var is another string of the same
// language ({u_m}, {u_s}, {u_ms}). The questions (q_*) are plain text: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'প্রতিধ্বনি',
    view: 'দেখার ধরন',
    view_front_short: 'আগের মতো দেখো',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    u_m: 'm',
    u_s: 's',
    u_ms: 'm/s',

    // the examples, the action, the quiet reset
    ex_label: 'পাহাড় থেকে দূরত্ব',
    ex_d: '{d}&nbsp;{u_m}',
    act_clap: 'হাততালি দাও',
    act_home: 'শুরুর অবস্থা',

    // the result: the distance, then the sum and what is heard
    out_before: 'পাহাড় থেকে দূরত্ব <b>{d}&nbsp;{u_m}</b>। হাততালি দিয়ে দেখো শব্দ কখন ফিরে আসে।',
    out_going: 'শব্দ পাহাড়ের দিকে যাচ্ছে… যেতে-আসতে পথ <span class="ec-nw">{two} × {d}&nbsp;{u_m} = {p}&nbsp;{u_m}</span>',
    out_back: 'পাহাড়ে প্রতিফলিত হয়ে প্রতিধ্বনি ফিরে আসছে… যেতে-আসতে পথ <span class="ec-nw">{p}&nbsp;{u_m}</span>',
    out_sum:
      'ফিরে আসার সময় = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms}</span> <span class="ec-nw">{eq} <b>{t}&nbsp;{u_s}</b></span>',
    v_more: '> {gap}&nbsp;{u_s}, তাই <b class="ec-yes">প্রতিধ্বনি আলাদা শোনা যাবে</b>',
    v_equal: '= {gap}&nbsp;{u_s}, তাই <b class="ec-yes">প্রতিধ্বনি আলাদা শোনা যাবে</b>',
    v_less: '< {gap}&nbsp;{u_s}, তাই <b class="ec-no">মিলে গমগম, আলাদা প্রতিধ্বনি নেই</b>',

    // the rule, growing with what the student has found
    rule_0: '<b>শব্দ যেহেতু একধরনের তরঙ্গ, তাই তার প্রতিফলন হতে পারে।</b> পাহাড়ে প্রতিফলিত হয়ে ফিরে আসা শব্দই প্রতিধ্বনি।',
    rule_near:
      '<b>শব্দের অনুভূতিটা {gap}&nbsp;{u_s} পর্যন্ত থেকে যায়</b>, তাই দুটি শব্দ আলাদাভাবে শুনতে মাঝে কমপক্ষে {gap}&nbsp;{u_s} ব্যবধান দরকার। এবার ছাত্রটিকে টেনে আরও দূরে নিয়ে হাততালি দাও।',
    rule_far:
      '<b>শব্দের অনুভূতিটা {gap}&nbsp;{u_s} পর্যন্ত থেকে যায়</b>, তাই দুটি শব্দ আলাদাভাবে শুনতে মাঝে কমপক্ষে {gap}&nbsp;{u_s} ব্যবধান দরকার। এবার ছাত্রটিকে টেনে পাহাড়ের আরও কাছে এনে হাততালি দাও।',
    rule_all:
      '<b><span class="ec-nw">{gap}&nbsp;{u_s} × {v}&nbsp;{u_ms} = {path}&nbsp;{u_m}</span></b>: যেতে-আসতে শব্দকে কমপক্ষে {path}&nbsp;{u_m} যেতে হয়, তাই পাহাড় থেকে এর অর্ধেক, কমপক্ষে <b>{min}&nbsp;{u_m}</b> দূরে দাঁড়ালে প্রতিধ্বনি শোনা যায়।',
    note_slow: 'ছবিতে সময় {k} গুণ ধীর',
    note_slow_sound: 'ছবিতে সময় {k} গুণ ধীর; আওয়াজ আসল সময়ে',

    // the time line
    tl_aria: 'সময়রেখা: হাততালির সময়, প্রতিধ্বনি ফিরে আসার সময় আর শব্দের অনুভূতি থাকার সময়',
    tl_band: '{gap} {u_s} পর্যন্ত',
    tl_echo: 'প্রতিধ্বনি',
    tl_clap: 'হাততালি',
    tl_unit: 'সময় (s)',

    // labels on the picture
    lbl_cliff: 'খাড়া পাহাড়',
    lbl_d: 'd = {d}&nbsp;{u_m}',
    lbl_sound: 'শব্দ',
    lbl_echo: 'প্রতিধ্বনি',
    lbl_min: '{min}&nbsp;{u_m}',
    lbl_time: 'সময় = {t}&nbsp;{u_s}',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছাত্রটি এক জায়গায় থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_what: 'ছাত্রটি হাততালি দিয়েছে। ছবিতে পাহাড়ের দিক থেকে যে শব্দ ছাত্রটির কাছে ফিরে আসছে, তাকে কী বলে?',
    c_what_right: 'প্রতিধ্বনি',
    c_what_refr: 'প্রতিসরণ',
    c_what_ultra: 'আলট্রাসাউন্ড',
    c_what_super: 'উপরিপাতন',
    why_what: '<b>প্রতিধ্বনি</b>: শব্দ তরঙ্গ, তাই তার প্রতিফলন হয়; পাহাড়ে প্রতিফলিত হয়ে ফিরে আসা শব্দই প্রতিধ্বনি।',
    mis_refr: 'প্রতিসরণে শব্দ আরেক মাধ্যমে ঢুকে দিক বদলায়, ফিরে আসে না।',
    mis_ultra: 'আলট্রাসাউন্ড আমরা শুনতে পাই না; হাততালি শুনি।',
    mis_super: 'উপরিপাতন হলো দুটি তরঙ্গের যোগ হওয়া।',

    q_gap: 'হাততালি আর তার প্রতিধ্বনি আলাদা শুনতে হলে দুটি শব্দের মাঝে কমপক্ষে কত সময়ের ব্যবধান দরকার?',
    why_gap: '<b>{gap}&nbsp;{u_s}</b>: কিছু শুনলে তার অনুভূতিটা {gap}&nbsp;{u_s} পর্যন্ত থেকে যায়।',
    mis_gap_half: '{half}&nbsp;{u_s} এ দুটি শব্দ মিলে যায়: প্রথমটির অনুভূতি তখনও থেকে যায়।',
    mis_gap_long: '{gap}&nbsp;{u_s} পরেই প্রথম শব্দের অনুভূতি চলে যায়; এত বেশি সময় লাগে না।',
    mis_gap_tiny: '{tiny}&nbsp;{u_s} খুব কম: প্রথম শব্দের অনুভূতি {gap}&nbsp;{u_s} পর্যন্ত থাকে।',

    q_far: 'ছাত্রটির মাথার উপরে লেখা সময়ে তার হাততালির প্রতিধ্বনি ফিরে এল। শব্দের বেগ {v}&nbsp;{u_ms} হলে পাহাড় কত দূরে?',
    why_far:
      '<b>{d}&nbsp;{u_m}</b>: যেতে-আসতে পথ <span class="ec-nw">{v}&nbsp;{u_ms} × {t}&nbsp;{u_s} = {whole}&nbsp;{u_m}</span>, পাহাড় তার অর্ধেক: <span class="ec-nw">{whole} ÷ {two} = {d}&nbsp;{u_m}</span>।',
    mis_far_whole: '{whole}&nbsp;{u_m} হলো যেতে-আসতে মোট পথ; পাহাড় তার অর্ধেক দূরে।',
    mis_far_gap: '{min}&nbsp;{u_m} হলো প্রতিধ্বনি শোনার সবচেয়ে কম দূরত্ব।',
    mis_far_quarter: 'যেতে-আসতে পথ {whole}&nbsp;{u_m}; পাহাড় তার অর্ধেক দূরে, একবারই {two} দিয়ে ভাগ করতে হয়।',

    q_hear: 'ছবির ছাত্রটি এখানে দাঁড়িয়ে হাততালি দিলে কি প্রতিধ্বনি আলাদা শোনা যাবে?',
    c_hear_yes_after: 'হ্যাঁ, কারণ প্রতিধ্বনি {gap}&nbsp;{u_s} এর পরে ফেরে',
    c_hear_yes_before: 'হ্যাঁ, কারণ প্রতিধ্বনি {gap}&nbsp;{u_s} এর আগেই ফেরে',
    c_hear_no_after: 'না, কারণ প্রতিধ্বনি {gap}&nbsp;{u_s} এর পরে ফেরে',
    c_hear_no_before: 'না, কারণ প্রতিধ্বনি {gap}&nbsp;{u_s} এর আগেই ফেরে',
    why_hear_yes:
      '<b>শোনা যাবে</b>: সময় = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} {t}&nbsp;{u_s}</span>, যা {gap}&nbsp;{u_s} এর সমান বা বেশি।',
    why_hear_no:
      '<b>শোনা যাবে না</b>: সময় = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} {t}&nbsp;{u_s}</span>, যা {gap}&nbsp;{u_s} এর কম; দুটি শব্দ মিলে গমগম করে।',
    mis_hear_flip: 'সময় ঠিক, কিন্তু নিয়মটি উল্টো হয়েছে: {gap}&nbsp;{u_s} বা তার বেশি পরে ফিরলে তবেই আলাদা শোনা যায়।',
    mis_hear_time: 'সময়ের হিসাব ভুল: যেতে-আসতে পথ {p}&nbsp;{u_m}, তাই সময় {eq} {t}&nbsp;{u_s}।',
    mis_hear_reason: 'উত্তরটা ঠিক, কিন্তু কারণটা ভুল: প্রতিধ্বনি ফেরে {t}&nbsp;{u_s} পরে।',

    // the panel's extras (wide panels): the book's chain and the distances tried
    ch_aria: 'বইয়ের হিসাব: {gap}&nbsp;{u_s} থেকে {path}&nbsp;{u_m}, তার অর্ধেক {min}&nbsp;{u_m}',
    ch_gap: 'অনুভূতি থাকে',
    ch_path: 'যেতে-আসতে পথ',
    ch_min: 'পাহাড় থেকে কমপক্ষে',
    tr_head: 'যেখানে হাততালি দিলে',
    tr_sep: 'আলাদা প্রতিধ্বনি',
    tr_merge: 'গমগম',
    tr_empty: 'হাততালি দিলে এখানে দূরত্ব আর ফিরে আসার সময় লেখা হবে।',

    q_bat: 'বাদুড়ও ওড়ার সময় শব্দ তৈরি করে তার প্রতিধ্বনি শোনে, ঠিক ছবির হাততালির মতো। প্রতিধ্বনি থেকে বাদুড় কী বুঝতে পারে?',
    c_bat_right: 'সামনের জিনিসটি কত দূরে',
    c_bat_color: 'সামনের জিনিসটির রং কেমন',
    c_bat_speed: 'বাতাসে শব্দের বেগ কত',
    c_bat_heavy: 'সামনের জিনিসটি কত ভারী',
    why_bat: '<b>সামনের জিনিসটি কত দূরে</b>: শব্দ কতক্ষণ পরে ফিরল, তা থেকে বাদুড় দূরত্ব বোঝে; তাই অন্ধকারেও ধাক্কা খায় না।',
    mis_bat_color: 'শব্দ রং বয়ে আনে না।',
    mis_bat_speed: 'বাতাসে শব্দের বেগ প্রায় একই থাকে।',
    mis_bat_heavy: 'ভারী না হালকা, প্রতিধ্বনি তা বলে না।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Echo',
    view: 'View',
    view_front_short: 'Back to the start view',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    u_m: 'm',
    u_s: 's',
    u_ms: 'm/s',

    ex_label: 'Distance from the cliff',
    ex_d: '{d}&nbsp;{u_m}',
    act_clap: 'Clap your hands',
    act_home: 'Start again',

    out_before: 'Distance from the cliff <b>{d}&nbsp;{u_m}</b>. Clap and see when the sound comes back.',
    out_going: 'The sound is going to the cliff… there and back: <span class="ec-nw">{two} × {d}&nbsp;{u_m} = {p}&nbsp;{u_m}</span>',
    out_back: 'Reflected by the cliff, the echo is coming back… there and back: <span class="ec-nw">{p}&nbsp;{u_m}</span>',
    out_sum:
      'Time to come back = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms}</span> <span class="ec-nw">{eq} <b>{t}&nbsp;{u_s}</b></span>',
    v_more: '> {gap}&nbsp;{u_s}, so <b class="ec-yes">the echo is heard on its own</b>',
    v_equal: '= {gap}&nbsp;{u_s}, so <b class="ec-yes">the echo is heard on its own</b>',
    v_less: '< {gap}&nbsp;{u_s}, so <b class="ec-no">they merge into a boom, no separate echo</b>',

    rule_0: '<b>Sound is a wave, so it can be reflected.</b> The sound that comes back from the cliff is the echo.',
    rule_near:
      '<b>We keep hearing a sound for {gap}&nbsp;{u_s}</b>, so two sounds are heard apart only if at least {gap}&nbsp;{u_s} lies between them. Now drag the student further from the cliff and clap.',
    rule_far:
      '<b>We keep hearing a sound for {gap}&nbsp;{u_s}</b>, so two sounds are heard apart only if at least {gap}&nbsp;{u_s} lies between them. Now drag the student closer to the cliff and clap.',
    rule_all:
      '<b><span class="ec-nw">{gap}&nbsp;{u_s} × {v}&nbsp;{u_ms} = {path}&nbsp;{u_m}</span></b>: there and back, the sound must travel at least {path}&nbsp;{u_m}. So stand at least half of that, <b>{min}&nbsp;{u_m}</b>, from the cliff to hear an echo.',
    note_slow: 'Picture slowed {k} times',
    note_slow_sound: 'Picture slowed {k} times; sound in real time',

    tl_aria: 'Time line: the clap, the moment the echo comes back, and how long a sound stays with us',
    tl_band: 'up to {gap} {u_s}',
    tl_echo: 'echo',
    tl_clap: 'clap',
    tl_unit: 'time (s)',

    lbl_cliff: 'steep cliff',
    lbl_d: 'd = {d}&nbsp;{u_m}',
    lbl_sound: 'sound',
    lbl_echo: 'echo',
    lbl_min: '{min}&nbsp;{u_m}',
    lbl_time: 'time = {t}&nbsp;{u_s}',

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
    q_locked: 'The student stays put during the test. Look at the picture and pick an answer.',

    q_what: 'The student has clapped. What is the sound called that comes back to the student from the cliff in the picture?',
    c_what_right: 'an echo',
    c_what_refr: 'refraction',
    c_what_ultra: 'ultrasound',
    c_what_super: 'superposition',
    why_what: '<b>An echo</b>: sound is a wave, so it can be reflected. The sound that comes back from the cliff is the echo.',
    mis_refr: 'In refraction sound enters another medium and changes direction; here it came back.',
    mis_ultra: 'Ultrasound is beyond our hearing; we hear a clap.',
    mis_super: 'Superposition is two waves adding up; the sound that comes back is called an echo.',

    q_gap: 'To hear the clap and its echo apart, at least how much time must lie between the two sounds?',
    why_gap:
      '<b>{gap}&nbsp;{u_s}</b>: we keep hearing a sound for {gap}&nbsp;{u_s}, so two sounds need at least {gap}&nbsp;{u_s} between them to be heard apart.',
    mis_gap_half: 'At {half}&nbsp;{u_s} the two merge: we still hear the first one.',
    mis_gap_long: 'The first sound fades after {gap}&nbsp;{u_s}; it takes no longer than that.',
    mis_gap_tiny: '{tiny}&nbsp;{u_s} is too short: we hear the first sound for {gap}&nbsp;{u_s}.',

    q_far: 'The echo of the clap came back at the time written above the student. With sound at {v}&nbsp;{u_ms}, how far is the cliff?',
    why_far:
      '<b>{d}&nbsp;{u_m}</b>: there and back = <span class="ec-nw">{v}&nbsp;{u_ms} × {t}&nbsp;{u_s} = {whole}&nbsp;{u_m}</span>; the cliff is half that far: <span class="ec-nw">{whole} ÷ {two} = {d}&nbsp;{u_m}</span>.',
    mis_far_whole: '{whole}&nbsp;{u_m} is the whole way there and back; the cliff is half that far.',
    mis_far_gap: '{min}&nbsp;{u_m} is the least distance for an echo, not this cliff’s distance.',
    mis_far_quarter: 'There and back is {whole}&nbsp;{u_m}; the cliff is half that far: divide by {two} once.',

    q_hear: 'If the student in the picture claps here, is the echo heard on its own?',
    c_hear_yes_after: 'Yes, because the echo comes back after {gap}&nbsp;{u_s}',
    c_hear_yes_before: 'Yes, because the echo comes back within {gap}&nbsp;{u_s}',
    c_hear_no_after: 'No, because the echo comes back after {gap}&nbsp;{u_s}',
    c_hear_no_before: 'No, because the echo comes back within {gap}&nbsp;{u_s}',
    why_hear_yes:
      '<b>Yes</b>: time = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} {t}&nbsp;{u_s}</span>, which is {gap}&nbsp;{u_s} or more.',
    why_hear_no:
      '<b>No</b>: time = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} {t}&nbsp;{u_s}</span>, less than {gap}&nbsp;{u_s}; the two sounds merge into a boom.',
    mis_hear_flip: 'The time is right but the rule is turned round: only {gap}&nbsp;{u_s} or more gives a separate echo.',
    mis_hear_time: 'The time is wrong: there and back is {p}&nbsp;{u_m}, so the time {eq} {t}&nbsp;{u_s}.',
    mis_hear_reason: 'The answer is right but the reason is wrong: the echo comes back after {t}&nbsp;{u_s}.',

    ch_aria: 'The book’s working: {gap}&nbsp;{u_s} gives {path}&nbsp;{u_m}, half of it {min}&nbsp;{u_m}',
    ch_gap: 'we keep hearing',
    ch_path: 'there and back',
    ch_min: 'from the cliff, at least',
    tr_head: 'Where you clapped',
    tr_sep: 'separate echo',
    tr_merge: 'merged (boom)',
    tr_empty: 'Each time you clap, the distance and the time the echo took are written here.',

    q_bat: 'A bat also makes a sound as it flies and listens for its echo, just like the clap in the picture. What does the echo tell the bat?',
    c_bat_right: 'how far away a thing ahead is',
    c_bat_color: 'what colour a thing ahead is',
    c_bat_speed: 'how fast sound goes in air',
    c_bat_heavy: 'how heavy a thing ahead is',
    why_bat:
      '<b>How far away a thing is</b>: from how long the sound takes to come back the bat judges the distance, so it does not bump into things in the dark.',
    mis_bat_color: 'Sound carries no colour.',
    mis_bat_speed: 'Sound’s speed in air stays about the same.',
    mis_bat_heavy: 'An echo does not tell weight.',
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
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
