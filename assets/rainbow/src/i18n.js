// Every string the figure shows, in Bangla and English. The book's words on page 251 (topic 9.2.1 রংধনু, চিত্র ৯.০৯):
// রংধনু, পানির কণা, "সাদা আলোকে তার রংগুলোতে ভাগ করে", প্রিজম, "বৃষ্টি হওয়ার পরপর যদি রোদ ওঠে", "ভিন্ন ভিন্ন রঙের আলো
// ভিন্ন ভিন্ন পরিমাণে বেঁকে যায়", "রংধনুর ভিন্ন ভিন্ন রঙের ব্যান্ড (Band)", "সব সময়ই সূর্যের বিপরীত আকাশে দেখা যায়",
// "ভরদুপুরে রংধনু দেখা যায় না কেন?"; and from the chapter: প্রতিসরণ, প্রতিফলন. The book calls the reflection inside
// the drop পূর্ণ অভ্যন্তরীণ প্রতিফলন; in a real drop it is an ordinary (partial) reflection (the angle at the back,
// about 40°, is below water's critical angle, 48.6°), so the figure says প্রতিফলিত (see NOTES.md, open questions).
// The page writes উপর. Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}.
// intro / intro_short: the first screen's calm card; lead_*: the line before the action; out_*: the result; rule_*:
// the rule, the book's term in bold. The questions (q_*) are plain text, no HTML.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'রংধনু: পানির কণায় সাদা আলো রঙে ভাগ হয়',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',
    aria_stage:
      'বৃষ্টির পরের আকাশ: পেছনে সূর্য, সামনে বাতাসে পানির কণা, মাঝে একটি চোখ। একটি কণা বড় করে কেটে দেখানো যায়, তার ভেতরে আলোর পথ। উপর ও নিচের তীর দিয়ে সূর্য ওঠানো-নামানো যায়।',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘোরাও',
    howto_front: 'শুরুর দৃশ্য',
    howto_sun: 'সূর্য সরাও',
    drag_me: 'টেনে সরাও',
    drag_aria: 'সূর্যকে উপরে বা নিচে সরাও',

    // the steps
    ex_label: 'ধাপ',
    ex_in: 'কণায় ঢোকে',
    ex_back: 'ফিরে আসে',
    ex_bow: 'রংধনু',
    ex_noon: 'ভরদুপুরে',

    // the action and the quiet buttons
    act_in: 'একটি কণায় আলো',
    act_back: 'আলো ফিরে আসে',
    act_bow: 'দূর থেকে দেখো',
    act_noon: 'সূর্য উপরে তোলো',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',

    // the first screen: a few calm words
    intro:
      'বৃষ্টির পরপর রোদ উঠলে আকাশে রংধনু দেখা যায়। সূর্য তোমার পেছনে, সামনে বাতাসে অসংখ্য পানির কণা। সাদা রোদ থেকে এত রং আসে কোথা থেকে? একটি কণার ভেতরে কী ঘটে, চলো দেখি।',
    intro_short: 'সূর্য পেছনে, সামনে বৃষ্টির কণা। সাদা রোদ থেকে রংধনুর রং আসে কীভাবে? চলো দেখি।',

    // the line before the action: what the next tap will show
    lead_intro: 'প্রথমে একটি পানির কণার ভেতরে দেখি।',
    lead_in: 'এবার দেখো, আলো কণার পেছনে গিয়ে কী করে।',
    lead_back: 'এবার দূর থেকে দেখি: অসংখ্য কণা মিলে কী হয়?',
    lead_bow: 'দুপুরে সূর্য অনেক উপরে ওঠে। তখন রংধনুর কী হয়?',
    lead_noon: 'সূর্য টেনে সরিয়ে দেখো, তারপর যাচাই করো।',

    // the result line
    out_in: 'সাদা আলো কণায় ঢুকেই বেঁকে গেল, আর <b>নানা রঙে</b> ভাগ হয়ে গেল।',
    out_back: 'কণার পেছন থেকে আলো <b>প্রতিফলিত</b> হয়ে ফিরে এল, বের হওয়ার সময় আবার বেঁকে গেল।',
    out_bow: 'প্রায় <b>{r}°</b> কোণে থাকা কণা থেকে লাল আলো আসে, প্রায় <b>{v}°</b> কোণে থাকা কণা থেকে বেগুনি।',
    out_noon_up: 'সূর্য <b>{a}°</b> উঁচুতে: রংধনুর চূড়া দিগন্ত থেকে <b>{b}°</b> উঁচুতে।',
    out_noon_gone: 'সূর্য অনেক উপরে (<b>{a}°</b>): রংধনু <b>দিগন্তের নিচে</b>, দেখা যায় না।',

    // the rule: the book's words, its term in bold
    rule_in: 'পানিতে ঢোকার সময় আলোর <b>প্রতিসরণ</b> হয়। ভিন্ন ভিন্ন রঙের আলো ভিন্ন ভিন্ন পরিমাণে বেঁকে যায়: বেগুনি সবচেয়ে বেশি, লাল সবচেয়ে কম।',
    rule_back: 'প্রিজমের মতোই পানির কণা সাদা আলোকে তার <b>রংগুলোতে ভাগ</b> করে দেয়। বের হয়ে লাল আলো একটু বেশি নিচের দিকে যায়, বেগুনি একটু কম।',
    rule_bow:
      'কোণ মাপা হয় সূর্যের বিপরীত দিক থেকে: তাই লাল বাইরে, বেগুনি ভেতরে, আর রংধনু সব সময়ই <b>সূর্যের বিপরীত আকাশে</b>। অসংখ্য কণার রশ্মি দিয়েই রংধনুর ভিন্ন ভিন্ন রঙের <b>ব্যান্ড (Band)</b>।',
    rule_noon: 'সূর্য যত উপরে ওঠে, রংধনু তত নিচে নামে। সূর্য প্রায় {r}°-এর বেশি উঁচুতে থাকলে রংধনু দিগন্তের নিচে চলে যায়। তাই <b>ভরদুপুরে রংধনু দেখা যায় না</b>।',

    // the honest note in the corner of the view
    note_drop: 'কণাটি অনেক বড় করে, রঙের ফাঁক বাড়িয়ে দেখানো',
    note_sky: 'দূরত্ব ও আকার প্রকৃত অনুপাতে নয়',

    // labels on the picture (short)
    lbl_sun: 'সূর্য',
    lbl_eye: 'চোখ',
    lbl_rain: 'পানির কণা',
    lbl_beam: 'সূর্যের আলো',
    lbl_normal: 'লম্ব',
    lbl_through: 'কিছু আলো বেরিয়ে যায়',
    lbl_deg: '{d}°',
    lbl_white: 'সাদা আলো',
    lbl_refract: 'প্রতিসরণ',
    lbl_reflect: 'প্রতিফলন',
    lbl_red: 'লাল',
    lbl_violet: 'বেগুনি',
    lbl_red_deg: 'লাল {d}°',
    lbl_violet_deg: 'বেগুনি {d}°',
    lbl_anti: 'সূর্যের বিপরীত দিক',
    lbl_sun_deg: '{d}°',
    lbl_k: 'ক',
    lbl_kh: 'খ',

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

    q_where: 'সূর্য চোখের পেছনে, সামনে বৃষ্টি। রংধনু দেখতে হলে কোন দিকের আকাশে তাকাতে হবে?',
    c_wh_right: 'সূর্যের বিপরীত দিকে',
    c_wh_sun: 'সূর্যের দিকে',
    c_wh_top: 'ঠিক মাথার উপরে',
    c_wh_any: 'যেকোনো দিকে',
    why_where: '<b>সূর্যের বিপরীত দিকে</b>। কণা রঙিন আলো সূর্যের দিকেই ফেরত পাঠায়।',
    mis_wh_sun: 'সূর্যের দিকে কণা থেকে ফেরা আলো চোখে আসে না।',
    mis_wh_top: 'রংধনু সূর্যের বিপরীত দিক থেকে প্রায় {r}° দূরে, মাথার উপরে নয়।',
    mis_wh_any: 'দিকটি সূর্যের অবস্থান ঠিক করে দেয়।',

    q_bend: 'পানির কণায় ঢোকার সময় কোন রঙের আলো সবচেয়ে বেশি বেঁকে যায়?',
    c_be_right: 'বেগুনি',
    c_be_red: 'লাল',
    c_be_green: 'সবুজ',
    c_be_same: 'সব রং সমান',
    why_bend: '<b>বেগুনি</b>। ভিন্ন ভিন্ন রঙের আলো ভিন্ন ভিন্ন পরিমাণে বেঁকে যায়: বেগুনি সবচেয়ে বেশি, লাল সবচেয়ে কম।',
    mis_be_red: 'লাল আলো সবচেয়ে কম বেঁকে যায়।',
    mis_be_green: 'সবুজ মাঝামাঝি বেঁকে যায়।',
    mis_be_same: 'সব রং সমান বেঁকে গেলে রং আলাদা হতো না, রংধনুও হতো না।',

    q_outer: 'সূর্যের বিপরীত দিক থেকে প্রায় {r}° কোণে কণা ‘ক’, প্রায় {v}° কোণে কণা ‘খ’। কণা ‘ক’ থেকে কোন রঙের আলো চোখে আসে?',
    c_ou_right: 'লাল',
    c_ou_violet: 'বেগুনি',
    c_ou_green: 'সবুজ',
    c_ou_white: 'সাদা',
    why_outer: '<b>লাল</b>। লাল আলো ফেরে প্রায় {r}° কোণে, বেগুনি প্রায় {v}° কোণে। তাই বাইরের কণা ‘ক’ থেকে লাল আসে: রংধনুর বাইরে লাল।',
    mis_ou_violet: 'বেগুনি আসে ভেতরের কণা ‘খ’ থেকে, প্রায় {v}° কোণে।',
    mis_ou_green: 'সবুজ আসে এ দুটির মাঝের কণা থেকে।',
    mis_ou_white: 'কণা সাদা আলোকে রঙে ভাগ করে; এক দিকে একটিই রং আসে।',

    q_noon: 'ভরদুপুর: সূর্য অনেক উপরে ({a}°), সামনে বৃষ্টি। তবু রংধনু দেখা যায় না কেন?',
    c_no_right: 'রংধনু দিগন্তের নিচে চলে যায়',
    c_no_bright: 'রংধনু মাথার ঠিক উপরে ওঠে',
    c_no_enter: 'রংধনু সূর্যের পাশে সরে যায়',
    c_no_heat: 'রংধনু হয়, রোদে মিলিয়ে যায়',
    why_noon: '<b>রংধনু দিগন্তের নিচে চলে যায়</b>। চূড়া থাকে দিগন্ত থেকে {r}° − {a}° উঁচুতে, যা এখন শূন্যের কম।',
    mis_no_bright: 'সূর্য যত উপরে ওঠে, রংধনু তত নিচে নামে, উপরে নয়।',
    mis_no_enter: 'রংধনু সব সময় সূর্যের বিপরীত দিকে থাকে, পাশে নয়।',
    mis_no_heat: 'রোদ বেশি হলে রংধনু আরও উজ্জ্বল হওয়ার কথা; সমস্যা তার জায়গায়।',

    q_height: 'বিকেলে সূর্য {a}° উঁচুতে। রংধনুর চূড়া দিগন্ত থেকে প্রায় কত ডিগ্রি উঁচুতে দেখা যাবে?',
    why_height: '<b>প্রায় {b}°</b>। চূড়া সূর্যের বিপরীত দিক থেকে প্রায় {r}° উপরে, আর সেই দিক দিগন্তের {a}° নিচে: {r}° − {a}° = {b}°।',
    mis_he_theta: '{r}° মাপা হয় সূর্যের বিপরীত দিক থেকে, দিগন্ত থেকে নয়।',
    mis_he_sum: 'সূর্যের বিপরীত দিক দিগন্তের নিচে, তাই বিয়োগ করতে হয়।',
    mis_he_sun: 'এটি সূর্যের উচ্চতা, রংধনুর নয়।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'A rainbow: water drops split white light into colours',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',
    aria_stage:
      'The sky after rain: the sun behind, water drops in the air in front, an eye between them. One drop can be shown big and cut open, with the path of the light inside. The up and down arrows raise and lower the sun.',

    howto_label: 'How to move it',
    howto_orbit: 'Turn',
    howto_front: 'Start view',
    howto_sun: 'Move the sun',
    drag_me: 'Drag me',
    drag_aria: 'Move the sun up or down',

    ex_label: 'Step',
    ex_in: 'Into a drop',
    ex_back: 'Back out',
    ex_bow: 'Rainbow',
    ex_noon: 'At midday',

    act_in: 'Light in one drop',
    act_back: 'The light comes back',
    act_bow: 'Look from afar',
    act_noon: 'Raise the sun',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',

    intro:
      'Right after rain, if the sun comes out, we see a rainbow. The sun is behind you, countless water drops in the air in front. Where do so many colours come from in white sunlight? Let us see what happens inside one drop.',
    intro_short: 'The sun behind, rain in front. How does white sunlight make a rainbow’s colours? Let us see.',

    lead_intro: 'First, a look inside one water drop.',
    lead_in: 'Now see what the light does at the back of the drop.',
    lead_back: 'Now from afar: what do countless drops make?',
    lead_bow: 'At midday the sun is high. What happens to the rainbow then?',
    lead_noon: 'Drag the sun, then test yourself.',

    out_in: 'The white light bent as it went into the drop, and split into <b>colours</b>.',
    out_back: 'The light was <b>reflected</b> from the back of the drop, and bent again on the way out.',
    out_bow: 'Drops about <b>{r}°</b> away send red light to the eye; drops about <b>{v}°</b> away send violet.',
    out_noon_up: 'The sun is <b>{a}°</b> high: the top of the rainbow is <b>{b}°</b> above the horizon.',
    out_noon_gone: 'The sun is very high (<b>{a}°</b>): the rainbow is <b>below the horizon</b>, not seen.',

    rule_in: 'Going into water, light is <b>refracted</b>. Different colours bend by different amounts: violet the most, red the least.',
    rule_back:
      'Like a prism, a water drop <b>splits white light into its colours</b>. Red light leaves the drop a little more steeply downward, violet a little less.',
    rule_bow:
      'The angle is from the point opposite the sun: so red is outside, violet inside, and a rainbow is always <b>in the sky opposite the sun</b>. Countless drops make its coloured <b>bands</b>.',
    rule_noon:
      'The higher the sun, the lower the rainbow. With the sun higher than about {r}°, the whole rainbow is below the horizon. That is why <b>there is no rainbow at midday</b>.',

    note_drop: 'The drop is drawn much bigger, the colours spread wider',
    note_sky: 'Distances and sizes not to scale',

    lbl_sun: 'Sun',
    lbl_eye: 'Eye',
    lbl_rain: 'Water drops',
    lbl_beam: 'Sunlight',
    lbl_normal: 'Normal',
    lbl_through: 'Some light goes out',
    lbl_deg: '{d}°',
    lbl_white: 'White light',
    lbl_refract: 'Refraction',
    lbl_reflect: 'Reflection',
    lbl_red: 'Red',
    lbl_violet: 'Violet',
    lbl_red_deg: 'Red {d}°',
    lbl_violet_deg: 'Violet {d}°',
    lbl_anti: 'Opposite the sun',
    lbl_sun_deg: '{d}°',
    lbl_k: 'A',
    lbl_kh: 'B',

    hint_wait: 'Wait a moment and watch.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The right answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Look at the picture and pick an answer.',

    q_where: 'The sun is behind the eye, rain in front. Where in the sky must you look to see a rainbow?',
    c_wh_right: 'Opposite the sun',
    c_wh_sun: 'Toward the sun',
    c_wh_top: 'Straight overhead',
    c_wh_any: 'In any direction',
    why_where: '<b>Opposite the sun</b>. The drops send the coloured light back toward the sun.',
    mis_wh_sun: 'Toward the sun, the light the drops send back does not reach the eye.',
    mis_wh_top: 'The rainbow is about {r}° from the point opposite the sun, not overhead.',
    mis_wh_any: 'Where the sun is decides the direction.',

    q_bend: 'Going into a water drop, which colour of light bends the most?',
    c_be_right: 'Violet',
    c_be_red: 'Red',
    c_be_green: 'Green',
    c_be_same: 'All the same',
    why_bend: '<b>Violet</b>. Different colours bend by different amounts: violet the most, red the least.',
    mis_be_red: 'Red light bends the least.',
    mis_be_green: 'Green bends a middle amount.',
    mis_be_same: 'If all bent the same, the colours would not part and there would be no rainbow.',

    q_outer: 'From the point opposite the sun, drop A is about {r}° away, drop B about {v}°. Which colour reaches the eye from drop A?',
    c_ou_right: 'Red',
    c_ou_violet: 'Violet',
    c_ou_green: 'Green',
    c_ou_white: 'White',
    why_outer: '<b>Red</b>. Red light comes back at about {r}°, violet at about {v}°. So the outer drop A sends red: red is outside the rainbow.',
    mis_ou_violet: 'Violet comes from the inner drop B, at about {v}°.',
    mis_ou_green: 'Green comes from a drop between these two.',
    mis_ou_white: 'A drop splits white light into colours; in one direction only one colour comes.',

    q_noon: 'Midday: the sun is very high ({a}°), rain in front. Why is there no rainbow?',
    c_no_right: 'The rainbow is below the horizon',
    c_no_bright: 'The rainbow rises overhead',
    c_no_enter: 'The rainbow moves beside the sun',
    c_no_heat: 'It forms but fades in the sun',
    why_noon: '<b>The rainbow is below the horizon</b>. Its top stands {r}° − {a}° above the horizon, now less than zero.',
    mis_no_bright: 'The higher the sun, the lower the rainbow, not higher.',
    mis_no_enter: 'A rainbow is always opposite the sun, never beside it.',
    mis_no_heat: 'Stronger sun would make it brighter; the trouble is where it is.',

    q_height: 'In the afternoon the sun is {a}° high. About how many degrees above the horizon is the top of the rainbow?',
    why_height:
      '<b>About {b}°</b>. The top is about {r}° above the point opposite the sun, and that point is {a}° below the horizon: {r}° − {a}° = {b}°.',
    mis_he_theta: '{r}° is measured from the point opposite the sun, not from the horizon.',
    mis_he_sum: 'The point opposite the sun is below the horizon, so subtract.',
    mis_he_sun: 'That is the sun’s height, not the rainbow’s.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language is put in.
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
