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
    act_call: 'ডাক দাও',
    act_home: 'শুরুর অবস্থা',

    // the result: the distance, then the sum and what is heard
    out_before: 'পাহাড় থেকে দূরত্ব <b>{d}&nbsp;{u_m}</b>। “{lbl_word}” বলে ডাক দাও, দেখো শব্দ কখন ফেরে।',
    out_going: 'শব্দ পাহাড়ের দিকে যাচ্ছে…<span class="pvc-formula">যেতে-আসতে পথ = {two} × {d}&nbsp;{u_m} = {p}&nbsp;{u_m}</span>',
    out_back: 'প্রতিধ্বনি পাহাড় থেকে ফিরে আসছে…<span class="pvc-formula">যেতে-আসতে পথ = {p}&nbsp;{u_m}</span>',
    out_sum: '<span class="pvc-formula">সময় = {two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} <b>{t}&nbsp;{u_s}</b></span>',
    v_more: '{gap}&nbsp;{u_s} এর বেশি, তাই <b class="ec-yes">প্রতিধ্বনি আলাদা শোনা যাবে</b>।',
    v_equal: 'ঠিক {gap}&nbsp;{u_s}, তাই <b class="ec-yes">প্রতিধ্বনি আলাদা শোনা যাবে</b>।',
    v_less: '{gap}&nbsp;{u_s} এর কম, তাই <b class="ec-no">দুটি মিলে গমগম শোনায়</b>।',

    // the rule, growing with what the student has found
    rule_0: 'শব্দ একধরনের তরঙ্গ, তাই তার <b>প্রতিফলন</b> হতে পারে। পাহাড় থেকে প্রতিফলিত হয়ে ফিরে আসা শব্দই প্রতিধ্বনি।',
    rule_near: 'শব্দের অনুভূতি <b>{gap}&nbsp;{u_s}</b> পর্যন্ত থেকে যায়। তাই দুটি শব্দ আলাদা শুনতে মাঝে কমপক্ষে এতটুকু ব্যবধান দরকার। এবার ছাত্রটিকে আরও দূরে নিয়ে ডাক দাও।',
    rule_far:
      'শব্দের অনুভূতি <b>{gap}&nbsp;{u_s}</b> পর্যন্ত থেকে যায়। তাই দুটি শব্দ আলাদা শুনতে মাঝে কমপক্ষে এতটুকু ব্যবধান দরকার। এবার ছাত্রটিকে পাহাড়ের আরও কাছে এনে ডাক দাও।',
    rule_all:
      '<span class="pvc-formula">{gap}&nbsp;{u_s} × {v}&nbsp;{u_ms} = {path}&nbsp;{u_m} <span class="ec-step">তার অর্ধেক = <b>{min}&nbsp;{u_m}</b></span></span>পাহাড় থেকে কমপক্ষে এই দূরত্বে দাঁড়ালে প্রতিধ্বনি শোনা যায়।',
    note_slow: 'ছবিতে সময় {k} গুণ ধীর',
    note_slow_sound: 'ছবিতে সময় {k} গুণ ধীর; আওয়াজ আসল সময়ে',

    // the time line
    tl_aria: 'সময়রেখা: ডাকের শুরু ও শেষ, প্রতিধ্বনির শুরু ও শেষ আর ডাকের শুরু থেকে শব্দের অনুভূতি থাকার সময়',
    tl_band: '{gap} {u_s} পর্যন্ত',
    tl_echo: 'প্রতিধ্বনি',
    tl_call: 'ডাক',
    tl_unit: 'সময় (s)',

    // labels on the picture
    lbl_cliff: 'খাড়া পাহাড়',
    lbl_d: 'd = {d}&nbsp;{u_m}',
    lbl_sound: 'শব্দ',
    lbl_echo: 'প্রতিধ্বনি',
    lbl_word: 'হ্যালো',
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

    q_what: 'ছাত্রটি “{lbl_word}” বলে ডাক দিয়েছে। পাহাড়ের দিক থেকে যে শব্দ ফিরে আসছে, তাকে কী বলে?',
    c_what_right: 'প্রতিধ্বনি',
    c_what_refr: 'প্রতিসরণ',
    c_what_ultra: 'আলট্রাসাউন্ড',
    c_what_super: 'উপরিপাতন',
    why_what: '<b>প্রতিধ্বনি।</b> শব্দ তরঙ্গ, তাই তার প্রতিফলন হয়। পাহাড় থেকে ফিরে আসা শব্দই প্রতিধ্বনি।',
    mis_refr: 'প্রতিসরণে শব্দ আরেক মাধ্যমে ঢুকে দিক বদলায়, ফিরে আসে না।',
    mis_ultra: 'আলট্রাসাউন্ড আমরা শুনতে পাই না; মানুষের ডাক শুনি।',
    mis_super: 'উপরিপাতন হলো দুটি তরঙ্গের যোগ হওয়া।',

    q_gap: 'ডাক আর প্রতিধ্বনি আলাদা শুনতে হলে দুটির শুরুর মাঝে কমপক্ষে কত সময়ের ব্যবধান দরকার?',
    why_gap: '<b>{gap}&nbsp;{u_s}।</b> কিছু শুনলে তার অনুভূতি {gap}&nbsp;{u_s} পর্যন্ত থেকে যায়।',
    mis_gap_half: '{half}&nbsp;{u_s} এ প্রথম শব্দের অনুভূতি থেকেই যায়, তাই দুটি মিলে যায়।',
    mis_gap_long: '{gap}&nbsp;{u_s} পরেই প্রথম শব্দের অনুভূতি চলে যায়। এত সময় লাগে না।',
    mis_gap_tiny: '{tiny}&nbsp;{u_s} খুব কম। প্রথম শব্দের অনুভূতি {gap}&nbsp;{u_s} পর্যন্ত থাকে।',

    q_far: 'ডাক শুরুর পর ছাত্রটির মাথার উপরে লেখা সময়ে প্রতিধ্বনি ফিরতে শুরু করল। শব্দের বেগ {v}&nbsp;{u_ms} হলে পাহাড় কত দূরে?',
    why_far:
      'যেতে-আসতে পথ <span class="ec-nw">{v}&nbsp;{u_ms} × {t}&nbsp;{u_s} = {whole}&nbsp;{u_m}</span>। পাহাড় তার অর্ধেক দূরে: <span class="ec-nw">{whole} ÷ {two} = <b>{d}&nbsp;{u_m}</b></span>।',
    mis_far_whole: '{whole}&nbsp;{u_m} হলো যেতে-আসতে মোট পথ। পাহাড় তার অর্ধেক দূরে।',
    mis_far_gap: '{min}&nbsp;{u_m} হলো প্রতিধ্বনি শোনার সবচেয়ে কম দূরত্ব।',
    mis_far_quarter: 'পাহাড় যেতে-আসতে পথের অর্ধেক দূরে। {two} দিয়ে একবারই ভাগ করতে হয়।',

    q_hear: 'ছবির ছাত্রটি এখানে দাঁড়িয়ে ডাক দিলে কি প্রতিধ্বনি আলাদা শোনা যাবে?',
    c_hear_yes_after: 'হ্যাঁ, কারণ প্রতিধ্বনি {gap}&nbsp;{u_s} এর পরে ফেরে',
    c_hear_yes_before: 'হ্যাঁ, কারণ প্রতিধ্বনি {gap}&nbsp;{u_s} এর আগেই ফেরে',
    c_hear_no_after: 'না, কারণ প্রতিধ্বনি {gap}&nbsp;{u_s} এর পরে ফেরে',
    c_hear_no_before: 'না, কারণ প্রতিধ্বনি {gap}&nbsp;{u_s} এর আগেই ফেরে',
    why_hear_yes:
      '<b>শোনা যাবে।</b> সময় = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} {t}&nbsp;{u_s}</span>, যা {gap}&nbsp;{u_s} এর সমান বা বেশি।',
    why_hear_no:
      '<b>শোনা যাবে না।</b> সময় = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} {t}&nbsp;{u_s}</span>, যা {gap}&nbsp;{u_s} এর কম। দুটি শব্দ মিলে গমগম করে।',
    mis_hear_flip: 'সময় ঠিক, কিন্তু নিয়মটি উল্টো হয়েছে। {gap}&nbsp;{u_s} বা তার বেশি পরে ফিরলেই আলাদা শোনা যায়।',
    mis_hear_time: 'সময়ের হিসাব ভুল। যেতে-আসতে পথ {p}&nbsp;{u_m}, তাই সময় {eq} {t}&nbsp;{u_s}।',
    mis_hear_reason: 'উত্তরটি ঠিক, কারণটি ভুল। প্রতিধ্বনি ফেরে {t}&nbsp;{u_s} পরে।',

    // the panel's extras (wide panels): the book's chain and the distances tried
    tr_head: 'যেখান থেকে ডাক দিলে',
    tr_sep: 'আলাদা প্রতিধ্বনি',
    tr_merge: 'গমগম',
    tr_empty: 'ডাক দিলে এখানে দূরত্ব আর ফিরে আসার সময় লেখা হবে।',

    q_bat: 'বাদুড়ও ওড়ার সময় শব্দ তৈরি করে তার প্রতিধ্বনি শোনে। প্রতিধ্বনি থেকে বাদুড় কী বুঝতে পারে?',
    c_bat_right: 'সামনের জিনিসটি কত দূরে',
    c_bat_color: 'সামনের জিনিসটির রং কেমন',
    c_bat_speed: 'বাতাসে শব্দের বেগ কত',
    c_bat_heavy: 'সামনের জিনিসটি কত ভারী',
    why_bat: '<b>সামনের জিনিসটি কত দূরে।</b> শব্দ কতক্ষণ পরে ফিরল, তা থেকে বাদুড় দূরত্ব বোঝে। তাই অন্ধকারেও ধাক্কা খায় না।',
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
    act_call: 'Call out',
    act_home: 'Start again',

    out_before: 'You are <b>{d}&nbsp;{u_m}</b> from the cliff. Call “{lbl_word}” and see when the sound comes back.',
    out_going: 'The sound is going to the cliff…<span class="pvc-formula">there and back = {two} × {d}&nbsp;{u_m} = {p}&nbsp;{u_m}</span>',
    out_back: 'The echo is coming back from the cliff…<span class="pvc-formula">there and back = {p}&nbsp;{u_m}</span>',
    out_sum: '<span class="pvc-formula">time = {two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} <b>{t}&nbsp;{u_s}</b></span>',
    v_more: 'More than {gap}&nbsp;{u_s}, so <b class="ec-yes">the echo is heard on its own</b>.',
    v_equal: 'Exactly {gap}&nbsp;{u_s}, so <b class="ec-yes">the echo is heard on its own</b>.',
    v_less: 'Less than {gap}&nbsp;{u_s}, so <b class="ec-no">the two merge into a boom</b>.',

    rule_0: 'Sound is a wave, so it can be <b>reflected</b>. The sound that comes back from the cliff is the echo.',
    rule_near:
      'We keep hearing a sound for <b>{gap}&nbsp;{u_s}</b>. So two sounds need at least that gap to be heard apart. Now take the student further away and call.',
    rule_far:
      'We keep hearing a sound for <b>{gap}&nbsp;{u_s}</b>. So two sounds need at least that gap to be heard apart. Now bring the student closer to the cliff and call.',
    rule_all:
      '<span class="pvc-formula">{gap}&nbsp;{u_s} × {v}&nbsp;{u_ms} = {path}&nbsp;{u_m} <span class="ec-step">half of that = <b>{min}&nbsp;{u_m}</b></span></span>Stand at least this far from the cliff to hear an echo.',
    note_slow: 'Picture slowed {k} times',
    note_slow_sound: 'Picture slowed {k} times; sound in real time',

    tl_aria: 'Time line: the start and end of the call, the start and end of its echo, and how long a sound stays with us from the call’s start',
    tl_band: 'up to {gap} {u_s}',
    tl_echo: 'echo',
    tl_call: 'call',
    tl_unit: 'time (s)',

    lbl_cliff: 'steep cliff',
    lbl_d: 'd = {d}&nbsp;{u_m}',
    lbl_sound: 'sound',
    lbl_echo: 'echo',
    lbl_word: 'Hello',
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

    q_what: 'The student has called “{lbl_word}”. What is the sound that comes back from the cliff called?',
    c_what_right: 'an echo',
    c_what_refr: 'refraction',
    c_what_ultra: 'ultrasound',
    c_what_super: 'superposition',
    why_what: '<b>An echo.</b> Sound is a wave, so it can be reflected. The sound that comes back from the cliff is the echo.',
    mis_refr: 'In refraction sound enters another medium and changes direction; here it came back.',
    mis_ultra: 'Ultrasound is beyond our hearing; we hear a person calling.',
    mis_super: 'Superposition is two waves adding up; the sound that comes back is called an echo.',

    q_gap: 'To hear a call and its echo apart, at least how much time must lie between their starts?',
    why_gap: '<b>{gap}&nbsp;{u_s}.</b> We keep hearing a sound for {gap}&nbsp;{u_s}.',
    mis_gap_half: 'At {half}&nbsp;{u_s} the two merge: we still hear the first one.',
    mis_gap_long: 'The first sound fades after {gap}&nbsp;{u_s}; it takes no longer than that.',
    mis_gap_tiny: '{tiny}&nbsp;{u_s} is too short: we hear the first sound for {gap}&nbsp;{u_s}.',

    q_far:
      'The echo began to come back at the time written above the student, after the call began. With sound at {v}&nbsp;{u_ms}, how far is the cliff?',
    why_far:
      'There and back = <span class="ec-nw">{v}&nbsp;{u_ms} × {t}&nbsp;{u_s} = {whole}&nbsp;{u_m}</span>. The cliff is half that far: <span class="ec-nw">{whole} ÷ {two} = <b>{d}&nbsp;{u_m}</b></span>.',
    mis_far_whole: '{whole}&nbsp;{u_m} is the whole way there and back; the cliff is half that far.',
    mis_far_gap: '{min}&nbsp;{u_m} is the least distance for an echo, not this cliff’s distance.',
    mis_far_quarter: 'There and back is {whole}&nbsp;{u_m}; the cliff is half that far: divide by {two} once.',

    q_hear: 'If the student in the picture calls from here, is the echo heard on its own?',
    c_hear_yes_after: 'Yes, because the echo comes back after {gap}&nbsp;{u_s}',
    c_hear_yes_before: 'Yes, because the echo comes back within {gap}&nbsp;{u_s}',
    c_hear_no_after: 'No, because the echo comes back after {gap}&nbsp;{u_s}',
    c_hear_no_before: 'No, because the echo comes back within {gap}&nbsp;{u_s}',
    why_hear_yes:
      '<b>Yes.</b> Time = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} {t}&nbsp;{u_s}</span>, which is {gap}&nbsp;{u_s} or more.',
    why_hear_no:
      '<b>No.</b> Time = <span class="ec-nw">{two} × {d}&nbsp;{u_m} ÷ {v}&nbsp;{u_ms} {eq} {t}&nbsp;{u_s}</span>, less than {gap}&nbsp;{u_s}. The two sounds merge into a boom.',
    mis_hear_flip: 'The time is right but the rule is turned round: only {gap}&nbsp;{u_s} or more gives a separate echo.',
    mis_hear_time: 'The time is wrong: there and back is {p}&nbsp;{u_m}, so the time {eq} {t}&nbsp;{u_s}.',
    mis_hear_reason: 'The answer is right but the reason is wrong: the echo comes back after {t}&nbsp;{u_s}.',
    tr_head: 'Where you called from',
    tr_sep: 'separate echo',
    tr_merge: 'merged',
    tr_empty: 'Each time you call, the distance and the time the echo took are written here.',

    q_bat: 'A bat also makes a sound as it flies and listens for the echo. What does the echo tell the bat?',
    c_bat_right: 'how far away a thing ahead is',
    c_bat_color: 'what colour a thing ahead is',
    c_bat_speed: 'how fast sound goes in air',
    c_bat_heavy: 'how heavy a thing ahead is',
    why_bat:
      '<b>How far away a thing is.</b> From how long the sound takes to come back, the bat judges the distance. So it does not bump into things in the dark.',
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
