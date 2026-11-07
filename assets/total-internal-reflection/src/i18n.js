// Every string the figure shows, in Bangla and English. The book's words on pages 248–251 (topic 9.2): পূর্ণ অভ্যন্তরীণ
// প্রতিফলন, ঘন মাধ্যম, হালকা মাধ্যম, আলোক রশ্মি, প্রতিফলিত, প্রতিসরিত, n₁ sinθ₁ = n₂ sin θ₂ (here n₂, θ₂ are the DENSE
// medium the light starts in, n₁, θ₁ the light medium it leaves into), "θ₂ অল্প অল্প করে বাড়াতে থাকলে θ₁ বাড়তে থাকবে",
// "θ₁ = 90° হয় সেই কোণকে ক্রান্তি কোণ বা সংকট কোণ (Critical Angle) θc বলে", sin θc = n₁/n₂, θc = sin⁻¹(n₁/n₂),
// "ক্রান্তি কোণ θc = 41.8°", কাচ-বাতাস বিভেদতল, আপতন কোণ, প্রিজম, "সবচেয়ে পরিপূর্ণ প্রতিফলন হয় পূর্ণ অভ্যন্তরীণ
// প্রতিফলনে", the water example (পানির n₁ = 1.33; "আপতন কোণ যেহেতু 45°, যা ক্রান্তি কোণ ... থেকে কম, তাই পূর্ণ অভ্যন্তরীণ
// প্রতিফলন হবে না") and the 75° example (1.45, sin θ = 1.40, θc = 43.6°). The page writes উপরের. The normal is
// "লম্ব", as everywhere in chapter 9 (৯.১.১: "একটি লম্ব কল্পনা কর", "লম্বের সাথে আপতিত রশ্মিটির কোণ"); never chapter 8's অভিলম্ব. Added by the figure:
// আলোর উৎস, চাকতি (the optical disc), পানির পাত্র.
// Use t('key', vars) in code and t.num() for numbers; numbers in sentences come in as {vars}. A {key} that is not a var
// is another string of the same language (the symbols {T1}, {T2}, {TC}, {N1}, {N2}). intro / intro_short are the first
// screen's calm card; lead_* the line before the action; out_* the result; rule_* the rule, the book's term in bold.
// The questions (q_*) are plain text (the quiz writes them as text): they spell θ₂ with Unicode subscripts, which the
// bundled font lacks, so they say "কাচের ভেতরের কোণ" in words where it matters and use θ only through HTML elsewhere.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'পূর্ণ অভ্যন্তরীণ প্রতিফলন: কাচ থেকে বাতাসে আলো',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',
    aria_stage: 'কোণ মাপার চাকতির মাঝে অর্ধেক গোল একটি কাচের টুকরো; নিচ থেকে একটি আলোর উৎস কাচের ভেতর দিয়ে উপরের সমতলে আলো পাঠাচ্ছে',

    // symbols (HTML: the font has no subscript digits)
    T1: 'θ<sub>1</sub>',
    T2: 'θ<sub>2</sub>',
    TC: 'θ<sub>c</sub>',
    N1: 'n<sub>1</sub>',
    N2: 'n<sub>2</sub>',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_turn: 'টেনে উৎস ঘোরাও',
    drag_me: 'টেনে ঘোরাও',
    aria_drag: 'আলোর উৎস ঘোরাও (তীর কী দিয়েও)',

    // the steps (the book's three cases of চিত্র ৯.০৬, the water example, চিত্র ৯.০৭)
    ex_label: 'ধাপ',
    ex_less: '{T2} &lt; {TC}',
    ex_critical: '{T2} = {TC}',
    ex_more: '{T2} &gt; {TC}',
    ex_water: 'পানিতে',
    ex_prism: 'প্রিজম',

    // the action and the quiet buttons
    act_light: 'আলো জ্বালাও',
    act_turn: 'উৎসটি আরও ঘোরাও',
    act_more: 'আরও ঘোরাও',
    act_water: 'উপরে পানি দাও',
    act_prism: 'প্রিজম বসাও',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',
    act_replay: 'আবার দেখো',

    // the first screen: a few calm words
    intro:
      'চাকতিতে কোণ মাপার দাগ কাটা, মাঝে অর্ধেক গোল একটি কাচের টুকরো। নিচের উৎস থেকে আলো কাচের ভেতর দিয়ে উপরের বাতাসে যাবে। আলো যত তেরছা করে পাঠাব, তত কী হয়, চলো দেখি।',
    intro_short: 'কাচের ভেতর থেকে আলো বাতাসে পাঠাব। আলো তেরছা করলে কী হয়, চলো দেখি।',

    // the line before the action
    lead_less: 'এবার উৎসটি ঘুরিয়ে {T2} একটু একটু করে বাড়াই।',
    lead_critical: 'আরও একটু ঘোরালে কী হবে?',
    lead_more: 'বইয়ের প্রশ্ন: কাচের উপরে বাতাসের বদলে পানি থাকলে কী হবে?',
    lead_water: 'এবার একটি প্রিজমে একই ব্যাপার দেখি (চিত্র ৯.০৭)।',
    lead_prism: 'এবার নিজে যাচাই করো।',
    lead_short_less: '{T2} একটু একটু করে বাড়াই।',
    lead_short_more: 'উপরে পানি থাকলে কী হবে?',
    lead_short_water: 'এবার প্রিজমে দেখি।',

    // the result: from the light now (the place of the source, the medium above)
    out_less: '{T2} = {a}° হলে {T1} = <b>{b}°</b>: রশ্মি লম্ব থেকে দূরে সরে গেল। প্রায় {r}% আলো প্রতিফলিত হয়।',
    out_zero: '{T2} = ০° হলে {T1} = <b>০°</b>: লম্ব বরাবর আলো না বেঁকে বের হয়। প্রায় {r}% আলো প্রতিফলিত হয়।',
    out_critical: '{T2} = <b>{a}°</b> হলে {T1} = <b>{b}°</b>: প্রতিসরিত রশ্মি বিভেদতল ঘেঁষে যায়।',
    out_more: '{T2} = {a}°: sin {T1} = {f} = <b>{s}</b> &gt; ১, তাই <b>কোনো আলো বের হয় না</b>।',
    out_prism: 'অতিভুজ তলে আপতন কোণ <b>{a}°</b> &gt; {c}°: পুরো আলো প্রতিফলিত হয়ে <b>{b}°</b> ঘুরে গেল।',

    // the rule: the book's words, the term in bold
    f_snell: '{N1} sin {T1} = {N2} sin {T2}',
    f_crit_air:
      'sin {TC} = <span class="tir-fr"><span>{N1}</span><span>{N2}</span></span> = <span class="tir-fr"><span>{n1}</span><span>{n2}</span></span> = {s}, &nbsp;{TC} = <b>{c}°</b>',
    rule_less: 'ঘন মাধ্যম থেকে হালকা মাধ্যমে গেলে রশ্মি <b>লম্ব থেকে দূরে সরে যায়</b>: {T1} &gt; {T2}। খানিকটা আলো প্রতিফলিতও হয়।',
    rule_zero: 'লম্ব বরাবর আসা আলো বাঁকে না, খানিকটা ফিরেও আসে। উৎসটি ঘুরিয়ে {T2} বাড়াও।',
    rule_critical: '{T2} এর যে মানের জন্য {T1} = ৯০° হয়, সেই কোণকে <b>ক্রান্তি কোণ বা সংকট কোণ</b> {TC} বলে: sin {TC} = {N1}/{N2}।',
    rule_more: 'পুরো আলোই প্রতিফলিত হয়; বইয়ের উদাহরণেও (n = ১.৪৫, ৭৫°) sin {T1} = ১.৪০ &gt; ১। একে বলে <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন</b>।',
    rule_water_less: 'আপতন কোণ {a}°, পানির ক্রান্তি কোণ {c}° থেকে কম, তাই <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন হবে না</b>।',
    rule_water_critical: 'পানিতে ক্রান্তি কোণ বড়: {c}°। এই কোণে রশ্মি বিভেদতল ঘেঁষে যায়।',
    rule_water_more: 'আপতন কোণ {a}°, পানির ক্রান্তি কোণ {c}° থেকেও বেশি: এবার পানিতেও <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন</b>।',
    rule_prism: 'প্রিজম তাই আয়নার কাজ করে, আরও ভালোভাবে: <b>সবচেয়ে পরিপূর্ণ প্রতিফলন হয় পূর্ণ অভ্যন্তরীণ প্রতিফলনে।</b>',
    tbl_inc: 'অতিভুজ তলে আপতন কোণ',
    tbl_crit: 'কাচ-বাতাসের ক্রান্তি কোণ',
    tbl_refl: 'প্রতিফলিত আলো',
    tbl_label: 'প্রিজমের অতিভুজ তলে কী হয়',

    // labels on the picture (short)
    lbl_glass0: 'কাচ (ঘন মাধ্যম)',
    lbl_air0: 'বাতাস (হালকা মাধ্যম)',
    lbl_glass: 'কাচ, {N2} = {n}',
    lbl_air: 'বাতাস, {N1} = {n}',
    lbl_water: 'পানি, {N1} = {n}',
    lbl_source: 'আলোর উৎস',
    lbl_normal: 'লম্ব',
    lbl_t2: '{T2} = {a}°',
    lbl_t2c: '{T2} = {TC} = {a}°',
    lbl_t1: '{T1} = {a}°',
    lbl_none: 'প্রতিসরিত রশ্মি নেই',
    lbl_prism: 'প্রিজম',
    lbl_45: '{a}°',
    lbl_turn: '{a}° ঘুরল',
    note_scale: 'আলোর পথ বোঝাতে রশ্মি আঁকা',

    // the graph
    graph_x: 'কাচে কোণ',
    graph_r: 'প্রতিফলিত %',
    graph_none: 'প্রতিসরণ নেই',
    graph_air: 'বাতাস',
    graph_aria: 'লেখচিত্র: কাচের ভেতরের কোণ বাড়লে বাইরের কোণ বাড়ে, ক্রান্তি কোণে ৯০° হয়; তারপর সব আলো প্রতিফলিত হয়',

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
    q_locked: 'পরীক্ষার সময় উৎসটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_away: 'কাচের ভেতরে আলো যে কোণে আসছে, চাকতিতে পড়ো। বাতাসে বের হয়ে রশ্মি কোন দিকে যাবে?',
    c_away_right: 'লম্ব থেকে দূরে, প্রায় ৪৯°',
    c_away_toward: 'লম্বের দিকে, প্রায় ১৯°',
    c_away_straight: 'না বেঁকে, একই কোণে',
    c_away_back: 'বের হবে না, পুরোটা ফিরবে',
    why_away: '<b>লম্ব থেকে দূরে, প্রায় ৪৯°</b>: চাকতিতে কোণটি ৩০°; ১.০০ × sin {T1} = ১.৫০ × sin ৩০° = ০.৭৫, তাই {T1} = ৪৮.৬°।',
    mis_away_toward: 'হালকা থেকে ঘন মাধ্যমে গেলে লম্বের দিকে সরে; এখানে উল্টো।',
    mis_away_straight: 'শুধু লম্ব বরাবর (০°) আলো না বেঁকে যায়।',
    mis_away_back: '৩০° ক্রান্তি কোণ ৪১.৮° থেকে কম, তাই আলো বের হয়।',

    q_crit: 'বাতাসের রশ্মি এখন বিভেদতল ঘেঁষে যাচ্ছে (বাইরের কোণ ৯০°)। কাচের ভেতরের কোণটি কত, আর একে কী বলে?',
    c_crit_right: '৪১.৮°, ক্রান্তি কোণ',
    c_crit_ninety: '৯০°, ক্রান্তি কোণ',
    why_crit: '<b>৪১.৮°, ক্রান্তি কোণ বা সংকট কোণ {TC}</b>: যে {T2} তে {T1} = ৯০° হয়। sin {TC} = ১.০০ ÷ ১.৫০ = ০.৬৭।',
    mis_crit_ninety: '৯০° বাইরের কোণ {T1}; ক্রান্তি কোণ ভেতরের কোণ {T2}।',
    c_crit_surface: '৪৮.২°, ক্রান্তি কোণ',
    c_crit_name: '৪১.৮°, প্রতিসরণ কোণ',
    mis_crit_surface: '৪৮.২° হলো বিভেদতল থেকে মাপা কোণ (৯০° − ৪১.৮°); কোণ মাপা হয় লম্ব থেকে।',
    mis_crit_name: 'প্রতিসরণ কোণ বাইরের কোণ {T1} (এখানে ৯০°); ভেতরের এই কোণের নাম ক্রান্তি কোণ।',
    c_water_wa: 'পানিতে বের হবে, {TC} = ৪৮.৮°',
    mis_water_wa: '৪৮.৮° পানি থেকে বাতাসে যাওয়ার ক্রান্তি কোণ; এখানে আলো কাচ থেকে পানিতে যাচ্ছে।',

    q_tir: 'কাচের ভেতরে আলো এবার এই কোণে আসছে (চাকতিতে পড়ো)। কী হবে?',
    c_tir_right: 'পুরো আলো ফিরে আসবে',
    c_tir_out: 'বাতাসে বের হবে, লম্ব থেকে দূরে সরে',
    c_tir_graze: 'বিভেদতল ঘেঁষে বের হবে',
    c_tir_half: 'অর্ধেক বের হবে, অর্ধেক ফিরবে',
    why_tir:
      '<b>পুরো আলো ফিরে আসবে</b>: চাকতিতে কোণটি ৭০°, ৪১.৮° এর বেশি: পূর্ণ অভ্যন্তরীণ প্রতিফলন। বইয়ের উদাহরণেও (n = ১.৪৫, ৭৫°) sin {T1} = ১.৪০ আসে, যা হতে পারে না।',
    mis_tir_out: 'sin {T1} = ১.৫০ × sin ৭০° = ১.৪১, যা ১ এর বেশি হতে পারে না।',
    mis_tir_graze: 'বিভেদতল ঘেঁষে যায় শুধু ঠিক ক্রান্তি কোণে, ৪১.৮° এ।',
    mis_tir_half: 'ক্রান্তি কোণের পরে প্রতিসরিত হওয়ার কোনো সুযোগ নেই।',

    q_water: 'কাচের উপরে এখন পানি (প্রতিসরণাঙ্ক ১.৩৩)। চাকতিতে কোণটি পড়ো। আলো কী করবে?',
    c_water_right: 'পানিতে বের হবে, {TC} = ৬২.৫°',
    c_water_tir: 'পুরোটা ফিরবে, {TC} = ৪১.৮°',
    c_water_graze: 'বিভেদতল ঘেঁষে যাবে, {TC} = ৫০°',
    why_water: '<b>পানিতে বের হবে, {TC} = ৬২.৫°</b>: sin {TC} = ১.৩৩ ÷ ১.৫০ = ০.৮৯; চাকতিতে কোণটি ৫০°, তার চেয়ে কম। রশ্মি যায় প্রায় ৬০° কোণে।',
    mis_water_tir: '৪১.৮° কাচ-বাতাসের ক্রান্তি কোণ; কাচ-পানিতে sin {TC} = ১.৩৩ ÷ ১.৫০।',
    mis_water_graze: 'কোণটি ৫০° ঠিকই, কিন্তু ক্রান্তি কোণ সূত্র থেকে আসে, ৫০° নয়।',

    q_prism: 'প্রিজমের অতিভুজ তলে কাচের ভেতর থেকে আলো তেরছা করে পড়ছে। আলো কোথায় যাবে?',
    c_prism_right: 'পুরোটা ফিরে, ৯০° ঘুরে ডানে',
    c_prism_out: 'অতিভুজ তল দিয়ে বেরিয়ে যাবে',
    c_prism_straight: 'না বেঁকে সোজা উপরে',
    c_prism_half: 'অর্ধেক বেরোবে, অর্ধেক ঘুরবে',
    why_prism: '<b>পুরোটা ফিরে, ৯০° ঘুরে ডানে</b>: ৪৫° কাচ-বাতাসের ক্রান্তি কোণ ৪১.৮° থেকে বেশি, তাই পূর্ণ অভ্যন্তরীণ প্রতিফলন; প্রিজম আয়নার কাজ করে (চিত্র ৯.০৭)।',
    mis_prism_out: 'বের হতো যদি ৪৫° ক্রান্তি কোণ থেকে কম হতো।',
    mis_prism_straight: 'কাচ-বাতাস বিভেদতলে আলো তেরছা পড়লে সোজা যায় না।',
    mis_prism_half: '৪১.৮° এর বেশি কোণে কোনো আলোই বের হয় না।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Total internal reflection: light from glass into air',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn to look',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',
    aria_stage:
      'A semicircular glass block at the centre of a disc marked in degrees; a light source below sends light through the glass to its flat top',

    T1: 'θ<sub>1</sub>',
    T2: 'θ<sub>2</sub>',
    TC: 'θ<sub>c</sub>',
    N1: 'n<sub>1</sub>',
    N2: 'n<sub>2</sub>',

    howto_label: 'How to use it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_turn: 'Drag the source',
    drag_me: 'Drag to turn',
    aria_drag: 'Turn the light source (arrow keys too)',

    ex_label: 'Steps',
    ex_less: '{T2} &lt; {TC}',
    ex_critical: '{T2} = {TC}',
    ex_more: '{T2} &gt; {TC}',
    ex_water: 'In water',
    ex_prism: 'Prism',

    act_light: 'Switch on the light',
    act_turn: 'Turn the source further',
    act_more: 'Turn it more',
    act_water: 'Put water on top',
    act_prism: 'Put in a prism',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',
    act_replay: 'Play again',

    intro:
      'The disc is marked in degrees, with a half-round piece of glass at its centre. Light from the source below will go through the glass into the air above. Let us see what happens as we send it more and more slantwise.',
    intro_short: 'We send light from inside glass into air. What happens when it slants more? Let us see.',

    lead_less: 'Now turn the source to raise {T2} little by little.',
    lead_critical: 'What happens if we turn it a little more?',
    lead_more: 'The book asks: what if there is water above the glass instead of air?',
    lead_water: 'Now the same thing in a prism (fig. 9.07).',
    lead_prism: 'Now check yourself.',
    lead_short_less: 'Raise {T2} little by little.',
    lead_short_more: 'What if there is water on top?',
    lead_short_water: 'Now in a prism.',

    out_less: '{T2} = {a}° → {T1} = <b>{b}°</b>: bent away from the normal; about {r}% reflects.',
    out_zero: '{T2} = 0° → {T1} = <b>0°</b>: along the normal it goes straight; about {r}% reflects.',
    out_critical: 'At {T2} = <b>{a}°</b>, {T1} = <b>{b}°</b>: the refracted ray grazes the surface.',
    out_more: '{T2} = {a}°: sin {T1} = {f} = <b>{s}</b> &gt; 1, so <b>no light leaves</b>.',
    out_prism: 'On the long (hypotenuse) face <b>{a}°</b> &gt; {c}°: all reflected, turned <b>{b}°</b>.',

    f_snell: '{N1} sin {T1} = {N2} sin {T2}',
    f_crit_air:
      'sin {TC} = <span class="tir-fr"><span>{N1}</span><span>{N2}</span></span> = <span class="tir-fr"><span>{n1}</span><span>{n2}</span></span> = {s}, &nbsp;{TC} = <b>{c}°</b>',
    rule_less: 'From a dense medium into a lighter one the ray <b>bends away from the normal</b>: {T1} &gt; {T2}. A little light reflects.',
    rule_zero: 'Light along the normal does not bend; a little comes back. Turn the source.',
    rule_critical: 'The value of {T2} for which {T1} = 90° is called the <b>critical angle</b> {TC}: sin {TC} = {N1}/{N2}.',
    rule_more:
      'All the light is reflected; in the book’s example too (n = 1.45, 75°) sin {T1} = 1.40 &gt; 1. This is <b>total internal reflection</b>.',
    rule_water_less: '{a}° is less than the water\u2019s critical angle {c}°, so <b>no total internal reflection</b>.',
    rule_water_critical: 'In water the critical angle is larger: {c}°. At this angle the ray grazes the surface.',
    rule_water_more: '{a}° is more than even the water\u2019s critical angle {c}°: <b>total internal reflection</b> in water too.',
    rule_prism: 'So the prism works as a mirror, and a better one: <b>the most complete reflection is total internal reflection.</b>',
    tbl_inc: 'Angle on the long (hypotenuse) face',
    tbl_crit: 'Critical angle, glass–air',
    tbl_refl: 'Light reflected',
    tbl_label: 'What happens at the prism’s long (hypotenuse) face',

    lbl_glass0: 'Glass (dense medium)',
    lbl_air0: 'Air (light medium)',
    lbl_glass: 'Glass, {N2} = {n}',
    lbl_air: 'Air, {N1} = {n}',
    lbl_water: 'Water, {N1} = {n}',
    lbl_source: 'Light source',
    lbl_normal: 'Normal',
    lbl_t2: '{T2} = {a}°',
    lbl_t2c: '{T2} = {TC} = {a}°',
    lbl_t1: '{T1} = {a}°',
    lbl_none: 'No refracted ray',
    lbl_prism: 'Prism',
    lbl_45: '{a}°',
    lbl_turn: 'turned {a}°',
    note_scale: 'Rays drawn to show the path of light',

    graph_x: 'Angle in glass',
    graph_r: 'reflected %',
    graph_none: 'no refraction',
    graph_air: 'air',
    graph_aria:
      'Graph: as the angle inside the glass grows, the angle outside grows and reaches 90° at the critical angle; after that all the light is reflected',

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
    q_locked: 'The source stays put during the test. Look at the picture and pick an answer.',

    q_away: 'Read on the disc the angle at which the light comes inside the glass. Where does the ray go in the air?',
    c_away_right: 'Away from the normal, about 49°',
    c_away_toward: 'Toward the normal, about 19°',
    c_away_straight: 'Straight on, at the same angle',
    c_away_back: 'It does not leave at all',
    why_away: '<b>Away from the normal, about 49°</b>: the disc reads 30°; 1.00 × sin {T1} = 1.50 × sin 30° = 0.75, so {T1} = 48.6°.',
    mis_away_toward: 'Going from light to dense it bends toward the normal; here it is the other way.',
    mis_away_straight: 'Only along the normal (0°) does light go straight.',
    mis_away_back: '30° is less than the critical angle 41.8°, so light leaves.',

    q_crit: 'The ray in the air now grazes the surface. What is the angle inside the glass, and its name?',
    c_crit_right: '41.8°, the critical angle',
    c_crit_ninety: '90°, the critical angle',
    why_crit: '<b>41.8°, the critical angle {TC}</b>: the {T2} at which {T1} = 90°. sin {TC} = 1.00 ÷ 1.50 = 0.67.',
    mis_crit_ninety: '90° is the outside angle {T1}; the critical angle is the inside angle {T2}.',
    c_crit_surface: '48.2°, the critical angle',
    c_crit_name: '41.8°, the angle of refraction',
    mis_crit_surface: '48.2° is measured from the surface (90° − 41.8°); angles are measured from the normal.',
    mis_crit_name: 'The angle of refraction is the outside angle {T1} (here 90°); this inside angle is the critical angle.',
    c_water_wa: 'Leaves into the water, {TC} = 48.8°',
    mis_water_wa: '48.8° is the critical angle from water into air; here the light goes from glass into water.',

    q_tir: 'Now the light comes inside the glass at this angle (read the disc). What happens?',
    c_tir_right: 'All of the light comes back',
    c_tir_out: 'It leaves into the air, bent away from the normal',
    c_tir_graze: 'Out, grazing the surface',
    c_tir_half: 'Half leaves, half comes back',
    why_tir:
      '<b>All of the light comes back</b>: the disc reads 70°, more than 41.8°. The book\u2019s example too (n = 1.45, 75°) gives sin {T1} = 1.40 &gt; 1.',
    mis_tir_out: 'sin {T1} = 1.50 × sin 70° = 1.41, more than 1: impossible.',
    mis_tir_graze: 'It grazes only at 41.8°.',
    mis_tir_half: 'Past {TC} no light leaves.',

    q_water: 'Water above the glass now (index 1.33). Read the angle on the disc: what does the light do?',
    c_water_right: 'Leaves into the water, {TC} = 62.5°',
    c_water_tir: 'All comes back, {TC} = 41.8°',
    c_water_graze: 'Grazes the surface, {TC} = 50°',
    why_water:
      '<b>Leaves into the water, {TC} = 62.5°</b>: sin {TC} = 1.33 ÷ 1.50 = 0.89; the disc reads 50°, less than that. The ray leaves at about 60°.',
    mis_water_tir: '41.8° is the glass–air critical angle; glass–water has sin {TC} = 1.33 ÷ 1.50.',
    mis_water_graze: 'The angle is 50°, but the critical angle comes from the formula, not from the angle now.',

    q_prism: 'In the prism, light meets the long (hypotenuse) face slantwise. Where does it go?',
    c_prism_right: 'All back, turned 90° to the right',
    c_prism_out: 'Out of the long (hypotenuse) face',
    c_prism_straight: 'Straight up, unbent',
    c_prism_half: 'Half leaves, half turns',
    why_prism: '<b>All back, turned 90° to the right</b>: 45° &gt; 41.8°, so total internal reflection; the prism works as a mirror (fig. 9.07).',
    mis_prism_out: 'It would leave only if 45° were below 41.8°.',
    mis_prism_straight: 'Slantwise at glass–air, light does not go straight.',
    mis_prism_half: 'Past 41.8° no light leaves.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);
export const toLatinDigits = (s) => String(s).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a symbol) is put in.
 */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    // the book's fixed numbers written into the Bangla sentences follow the digits asked for, too
    return bangla ? s : toLatinDigits(s);
  }
  t.num = num;
  t.lang = code;
  return t;
}
