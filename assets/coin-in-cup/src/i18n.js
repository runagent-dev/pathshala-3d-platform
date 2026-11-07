// Every string the figure shows, in Bangla and English. The book's words on page 246 (topic 9.1.1, নিজে করো, চিত্র
// ৯.০৩): "একটি কাপের মাঝে একটা মুদ্রা রেখে সেটাকে সামনে এমনভাবে রাখো যেন সেটি দেখা না যায়। মাথা না নাড়িয়ে মুদ্রাটি
// কীভাবে দেখা সম্ভব? কাপে পানি ঢাললেই মুদ্রাটি দৃশ্যমান হয়ে যাবে। প্রতিসরণের কারণে আলো বাঁকা হয়ে এসে তোমার চোখে পড়বে।
// তোমার চোখ ঐ বাঁকা আলোর দিক বরাবর মুদ্রাটি দেখতে পাবে। শুধু তাই নয়, তোমার কাছে মনে হবে মুদ্রাটি বুঝি উপরে উঠে
// এসেছে।" From pages 244–245: লম্ব, আপতন কোণ, প্রতিসরণ কোণ, প্রতিসরণের দ্বিতীয় সূত্র n₁ sin θ₁ = n₂ sin θ₂, ঘন মাধ্যম,
// হালকা মাধ্যম, "ঘন মাধ্যম থেকে হালকা মাধ্যমে যাবার সময় আলো লম্ব থেকে দূরে সরে যায়" (চিত্র ৯.০২), and table ৯.০১:
// পানি 1.33. The page writes উপরে.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not a
// var is another string of the same language (the unit {u_cm}). intro / intro_short are the first screen's calm card;
// lead_* the line before the action; out_* the result; rule_* the rule, the book's words last and in bold. The
// questions (q_*) are plain text, no HTML: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'পানিতে মুদ্রা: প্রতিসরণে লুকানো মুদ্রা দেখা যায়',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',
    aria_stage: 'টেবিলে একটি চওড়া কাপ, তার তলায় একটি মুদ্রা; বাঁ পাশে উপরে একটি চোখ কাপের কিনারার উপর দিয়ে তাকিয়ে আছে',
    u_cm: 'cm',
    note_cut: 'কাপটি কেটে ভেতর দেখানো',
    note_cut_short: 'কেটে দেখানো',

    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_tap: 'কাপে টোকা দাও',
    howto_level: 'পানি বাড়াও-কমাও',
    drag_me: 'টানো',
    aria_drag_level: 'পানির উচ্চতা: উপর বা নিচের তীর চাপো',

    // the steps
    ex_label: 'ধাপ',
    ex_hidden: 'আড়ালে',
    ex_pour: 'পানিতে',
    ex_angles: 'লম্ব',
    ex_image: 'দেখায়',

    // the action and the quiet buttons
    act_look: 'কাপটি কেটে ভেতরে দেখো',
    act_pour: 'কাপে পানি ঢালো',
    act_normal: 'লম্ব আঁকো',
    act_image: 'কোথায় দেখায়?',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',
    act_replay: 'আবার দেখো',

    // the first screen: a few calm words
    intro:
      'টেবিলে একটি কাপ, তার তলায় একটি মুদ্রা। কাপের কিনারার আড়ালে চোখ মুদ্রাটি দেখতে পায় না। মাথা না নাড়িয়ে কীভাবে দেখা সম্ভব? চলো দেখি। পরে তুমিও ঘরে একটি কাপ আর মুদ্রা নিয়ে করে দেখো।',
    intro_short: 'কাপের তলায় মুদ্রা, কিন্তু চোখ তা দেখে না। মাথা না নাড়িয়ে কীভাবে দেখবে?',

    // the line before the action: what the next tap will show
    lead_hidden: 'এবার কাপে পানি ঢালি। চোখ কিন্তু একটুও নড়বে না।',
    lead_pour: 'আলো ঘন মাধ্যম পানি থেকে হালকা মাধ্যম বাতাসে গেল। সেখানে একটি লম্ব আঁকি।',
    lead_angles: 'চোখ তো জানে না আলো বেঁকেছে। চোখ মুদ্রাটি কোথায় দেখবে?',
    lead_image: 'পানি কমিয়ে-বাড়িয়ে দেখো, তারপর নিজে যাচাই করো।',

    // the result line
    out_hidden: 'চোখ কিনারার পাশ দিয়ে শুধু মুদ্রার ওপাশের তলা দেখে: মুদ্রা <b>দেখা যায় না</b>।',
    out_empty: 'কাপে পানি নেই: মুদ্রা <b>আড়ালে</b>।',
    out_none: '<b>{d}&nbsp;{u_cm}</b> পানি, তবু মুদ্রা এখনো <b>আড়ালে</b>।',
    out_edge: '<b>{d}&nbsp;{u_cm}</b> পানিতে মুদ্রার দূরের <b>ধার</b> দেখা যায়, মাঝখান এখনো আড়ালে।',
    out_seen: '<b>{d}&nbsp;{u_cm}</b> পানি: মুদ্রা <b>দেখা যায়</b>!',
    out_angles: 'আপতন কোণ <b class="cc-t1">θ<sub>1</sub> = {a}°</b>, প্রতিসরণ কোণ <b class="cc-t2">θ<sub>2</sub> = {b}°</b>',
    out_dry: 'কাপে পানি নেই: আলো সোজা চলে, বাঁকে না।',
    out_image: 'মুদ্রা আসলে <b>{d}&nbsp;{u_cm}</b> গভীরে, দেখায় প্রায় <b class="cc-img">{a}&nbsp;{u_cm}</b> গভীরে। চোখ তেরছাভাবে দেখছে বলে এতটা উপরে।',
    out_image_none: 'এই পানিতে চোখ মুদ্রা দেখে না। পানি বাড়াও।',
    out_image_edge: 'এই পানিতে চোখ শুধু মুদ্রার ধার দেখে। পানি বাড়াও।',

    // the rule: the book's words, the book's term in bold
    rule_hidden: 'আলো সোজা পথে চলে। মুদ্রা থেকে চোখের দিকে আসা আলো কাপের দেয়ালে <b>আটকে যায়</b>।',
    rule_pour: 'কাপে পানি ঢাললেই মুদ্রাটি দৃশ্যমান হয়ে যাবে। <b>প্রতিসরণের</b> কারণে আলো বাঁকা হয়ে এসে তোমার চোখে পড়বে।',
    rule_angles:
      'প্রতিসরণের দ্বিতীয় সূত্র <i>n</i><sub>1</sub>&#8239;sin&#8239;θ<sub>1</sub> = <i>n</i><sub>2</sub>&#8239;sin&#8239;θ<sub>2</sub>। ঘন মাধ্যম থেকে হালকা মাধ্যমে যাবার সময় আলো <b>লম্ব থেকে দূরে সরে যায়</b>।',
    rule_image: 'তোমার চোখ ঐ বাঁকা আলোর দিক বরাবর মুদ্রাটি দেখতে পাবে। শুধু তাই নয়, তোমার কাছে <b>মনে হবে মুদ্রাটি বুঝি উপরে উঠে এসেছে</b>।',

    // labels on the picture (short)
    lbl_eye: 'চোখ',
    lbl_coin: 'মুদ্রা',
    lbl_coin_real: 'আসল মুদ্রা',
    lbl_q: '?',
    lbl_blocked: 'আলো আটকে গেল',
    lbl_seen: 'দেখা যায়',
    lbl_edge_seen: 'ধার দেখা যায়',
    lbl_water: 'পানি',
    lbl_normal: 'লম্ব',
    lbl_t1: 'θ<sub>1</sub> = {a}°',
    lbl_t2: 'θ<sub>2</sub> = {a}°',
    lbl_image: 'মুদ্রা যেমন দেখায়',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',

    // the graph (last step, tall panels)
    g_aria: 'গ্রাফ: পানির গভীরতা বাড়লে মুদ্রা আসলে কত গভীরে আর চোখে কত গভীরে দেখায়',
    g_x: 'পানি (cm)',
    g_y: 'গভীরতা (cm)',
    g_real: 'আসল',
    g_seen: 'যেমন দেখায়',
    g_hidden: 'দেখা যায় না',
    g_down: 'ঠিক উপর থেকে দেখলে',

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

    q_hidden: 'খালি কাপে চোখ মুদ্রাটি দেখতে পায় না কেন?',
    c_hd_right: 'আলো সোজা চলে, কিনারা আটকায়',
    c_hd_dark: 'মুদ্রা থেকে কোনো আলো আসে না',
    c_hd_bend: 'আলো বেঁকে কাপের বাইরে যায়',
    c_hd_eye: 'চোখের আলো মুদ্রায় পৌঁছায় না',
    why_hidden: '<b>আলো সোজা পথে চলে</b>; মুদ্রার আলো কাপের দেয়ালে আটকে যায়।',
    mis_hd_dark: 'মুদ্রায় আলো পড়ে ফিরে আসে বলেই আমরা মুদ্রা দেখি।',
    mis_hd_bend: 'বাতাসে আলো সোজা চলে; বাঁকে এক মাধ্যম থেকে অন্য মাধ্যমে যাবার সময়।',
    mis_hd_eye: 'চোখ আলো ছোড়ে না; মুদ্রা থেকে আলো এসে চোখে পড়ে।',

    q_bend: 'পানি থেকে বাতাসে বেরোনোর সময় আলো কোন দিকে বাঁকে?',
    c_bd_right: 'লম্ব থেকে দূরে সরে যায়',
    c_bd_toward: 'লম্বের দিকে বেঁকে যায়',
    c_bd_none: 'একটুও বাঁকে না',
    c_bd_back: 'পানিতেই ফিরে আসে',
    why_bend: '<b>লম্ব থেকে দূরে সরে যায়</b>। আলো ঘন মাধ্যম (পানি) থেকে হালকা মাধ্যমে (বাতাস) যাচ্ছে।',
    mis_bd_toward: 'লম্বের দিকে বাঁকে হালকা থেকে ঘন মাধ্যমে ঢোকার সময়।',
    mis_bd_none: 'না বাঁকলে আলো কিনারায় আটকে যেত।',
    mis_bd_back: 'খানিকটা আলো ফিরে আসে বটে, কিন্তু বেশির ভাগ বেরিয়ে চোখে আসে।',

    q_angle: 'ছবিতে পানিতে আপতন কোণ মাপা আছে। পানির প্রতিসরণাঙ্ক {n}, বাতাসের {one}। প্রতিসরণ কোণ কত?',
    why_angle: '<b>{r}°</b>। {n} × sin {a}° = sin θ<sub>2</sub> = {s}।',
    mis_an_divided: 'n উল্টো জায়গায় বসেছে: তাহলে আলো লম্বের দিকে বাঁকত।',
    mis_an_same: 'কোণ না বদলালে আলো বাঁকত না।',
    mis_an_surface: 'কোণ মাপতে হয় লম্ব থেকে, পানির তল থেকে নয়।',

    q_image: 'চোখ মুদ্রাটি কোথায় দেখবে?',
    c_im_right: 'আসল জায়গার চেয়ে উপরে',
    c_im_same: 'ঠিক আসল জায়গায়',
    c_im_lower: 'আসল জায়গার চেয়ে নিচে',
    c_im_air: 'পানির উপরে, বাতাসে',
    why_image: '<b>আসল জায়গার চেয়ে উপরে</b>। চোখ বাঁকা আলোর দিক বরাবর সোজা পেছনে দেখে, তাই মনে হয় মুদ্রাটি উপরে উঠে এসেছে।',
    mis_im_same: 'আলো বেঁকেছে, কিন্তু চোখ ধরে নেয় আলো সোজা এসেছে।',
    mis_im_lower: 'বাঁকা আলোর রেখা পেছনে টানলে তা মুদ্রার উপরে পৌঁছায়।',
    mis_im_air: 'মুদ্রা উপরে উঠে এসেছে মনে হয়, তবে পানির নিচেই।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways the picture is bigger, with the text beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Keep it upright',
    title: 'A coin in water: refraction shows a hidden coin',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn the view',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',
    aria_stage: 'A wide cup on a table with a coin on its bottom; an eye at the upper left looks over the rim',
    u_cm: 'cm',
    note_cut: 'The cup cut open to show inside',
    note_cut_short: 'Cut open',

    howto_label: 'How to use',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_tap: 'Tap the cup',
    howto_level: 'Water up or down',
    drag_me: 'Drag',
    aria_drag_level: 'Water level: press the up or down arrow',

    ex_label: 'Step',
    ex_hidden: 'Hidden',
    ex_pour: 'Water',
    ex_angles: 'Normal',
    ex_image: 'Looks',

    act_look: 'Cut the cup and look inside',
    act_pour: 'Pour water into the cup',
    act_normal: 'Draw the normal',
    act_image: 'Where does it look?',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',
    act_replay: 'Watch again',

    intro:
      'A cup on a table, a coin on its bottom. The cup’s rim hides the coin from the eye. How can it be seen without moving? Let’s find out, then try it at home with a cup and a coin.',
    intro_short: 'A coin in the cup, but the eye can’t see it. How, without moving?',

    lead_hidden: 'Now let’s pour water into the cup. The eye won’t move at all.',
    lead_pour: 'The light went from water, the denser medium, into air, the lighter. Let’s draw a normal there.',
    lead_angles: 'The eye doesn’t know the light bent. Where will it see the coin?',
    lead_image: 'Change the water level, then test yourself.',

    out_hidden: 'Past the rim the eye sees only the bottom beyond the coin: the coin is <b>not seen</b>.',
    out_empty: 'No water in the cup: the coin is <b>hidden</b>.',
    out_none: '<b>{d}&nbsp;{u_cm}</b> of water, but the coin is still <b>hidden</b>.',
    out_edge: 'With <b>{d}&nbsp;{u_cm}</b> of water the coin’s far <b>edge</b> is seen; its middle is still hidden.',
    out_seen: '<b>{d}&nbsp;{u_cm}</b> of water: the coin <b>is seen</b>!',
    out_angles: 'Angle of incidence <b class="cc-t1">θ<sub>1</sub> = {a}°</b>, angle of refraction <b class="cc-t2">θ<sub>2</sub> = {b}°</b>',
    out_dry: 'No water in the cup: the light goes straight, it doesn’t bend.',
    out_image:
      'The coin is really <b>{d}&nbsp;{u_cm}</b> deep but looks about <b class="cc-img">{a}&nbsp;{u_cm}</b> deep: the eye looks in at a slant, so it rises this much.',
    out_image_none: 'With this much water the eye can’t see the coin. Add water.',
    out_image_edge: 'With this much water the eye sees only the coin’s edge. Add water.',

    rule_hidden: 'Light travels in straight lines. The light from the coin toward the eye is <b>stopped</b> by the cup’s wall.',
    rule_pour: 'Pour water into the cup and the coin becomes visible. Because of <b>refraction</b> the light bends and reaches your eye.',
    rule_angles:
      'The second law of refraction, <i>n</i><sub>1</sub>&#8239;sin&#8239;θ<sub>1</sub> = <i>n</i><sub>2</sub>&#8239;sin&#8239;θ<sub>2</sub>. Going from a denser into a lighter medium, light <b>bends away from the normal</b>.',
    rule_image: 'Your eye sees the coin along the direction of the bent light. Not only that: <b>the coin seems to have risen</b>.',

    lbl_eye: 'Eye',
    lbl_coin: 'Coin',
    lbl_coin_real: 'Real coin',
    lbl_q: '?',
    lbl_blocked: 'Light stopped',
    lbl_seen: 'Seen',
    lbl_edge_seen: 'Edge seen',
    lbl_water: 'Water',
    lbl_normal: 'Normal',
    lbl_t1: 'θ<sub>1</sub> = {a}°',
    lbl_t2: 'θ<sub>2</sub> = {a}°',
    lbl_image: 'The coin as it looks',

    hint_wait: 'Wait a moment and watch.',

    g_aria: 'Graph: as the water deepens, how deep the coin really is and how deep it looks to the eye',
    g_x: 'Water (cm)',
    g_y: 'Depth (cm)',
    g_real: 'Real',
    g_seen: 'As it looks',
    g_hidden: 'Not seen',
    g_down: 'Seen from straight above',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture and pick the right answer.',
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

    q_hidden: 'In the empty cup, why can’t the eye see the coin?',
    c_hd_right: 'Light goes straight; the rim blocks it',
    c_hd_dark: 'No light comes from the coin',
    c_hd_bend: 'The light bends out of the cup',
    c_hd_eye: 'The eye’s light can’t reach the coin',
    why_hidden: '<b>Light travels in straight lines</b>; the coin’s light is stopped by the cup’s wall.',
    mis_hd_dark: 'We see the coin because light falls on it and comes back.',
    mis_hd_bend: 'In air light goes straight; it bends going from one medium into another.',
    mis_hd_eye: 'The eye sends out no light; light from the coin comes into the eye.',

    q_bend: 'Leaving water for air, which way does the light bend?',
    c_bd_right: 'Away from the normal',
    c_bd_toward: 'Toward the normal',
    c_bd_none: 'It doesn’t bend at all',
    c_bd_back: 'It turns back into the water',
    why_bend: '<b>Away from the normal</b>. The light goes from a denser medium (water) into a lighter one (air).',
    mis_bd_toward: 'It bends toward the normal going from a lighter into a denser medium.',
    mis_bd_none: 'Without bending, the light would be stopped at the rim.',
    mis_bd_back: 'A little light does turn back, but most of it leaves and reaches the eye.',

    q_angle: 'The picture shows the angle of incidence in the water. Water’s refractive index is {n}, air’s {one}. What is the angle of refraction?',
    why_angle: '<b>{r}°</b>. {n} × sin {a}° = sin θ<sub>2</sub> = {s}.',
    mis_an_divided: 'n is on the wrong side: then the light would bend toward the normal.',
    mis_an_same: 'If the angle didn’t change, the light wouldn’t bend.',
    mis_an_surface: 'Angles are measured from the normal, not from the surface.',

    q_image: 'Where will the eye see the coin?',
    c_im_right: 'Higher than it really is',
    c_im_same: 'Exactly where it is',
    c_im_lower: 'Lower than it really is',
    c_im_air: 'Above the water, in the air',
    why_image: '<b>Higher than it really is</b>. The eye looks straight back along the bent light, so the coin seems to have risen.',
    mis_im_same: 'The light bent, but the eye assumes it came straight.',
    mis_im_lower: 'Extended back, the bent ray reaches a point above the coin.',
    mis_im_air: 'The coin seems to rise, but it stays under the water.',
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
