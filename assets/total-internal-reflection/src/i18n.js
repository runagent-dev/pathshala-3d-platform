// Every string the figure shows, in Bangla and English. The book's words on pages 248–251 (topic 9.2): পূর্ণ অভ্যন্তরীণ
// প্রতিফলন, ঘন মাধ্যম, হালকা মাধ্যম, আলোক রশ্মি, প্রতিফলিত, প্রতিসরিত, n₁ sinθ₁ = n₂ sin θ₂ (here n₂, θ₂ are the DENSE
// medium the light starts in, n₁, θ₁ the light medium it leaves into), "θ₂ অল্প অল্প করে বাড়াতে থাকলে θ₁ বাড়তে থাকবে",
// "θ₁ = 90° হয় সেই কোণকে ক্রান্তি কোণ বা সংকট কোণ (Critical Angle) θc বলে", sin θc = n₁/n₂, θc = sin⁻¹(n₁/n₂),
// "ক্রান্তি কোণ θc = 41.8°", কাচ-বাতাস বিভেদতল, আপতন কোণ, প্রিজম, "সবচেয়ে পরিপূর্ণ প্রতিফলন হয় পূর্ণ অভ্যন্তরীণ
// প্রতিফলনে", the water example (পানির n₁ = 1.33; "আপতন কোণ যেহেতু 45°, যা ক্রান্তি কোণ ... থেকে কম, তাই পূর্ণ অভ্যন্তরীণ
// প্রতিফলন হবে না") and the 75° example (1.45, sin θ = 1.40, θc = 43.6°). The page writes উপরের. Added by the figure:
// অভিলম্ব (the chapter's word, ৯.১.১), আলোর উৎস, চাকতি (the optical disc), পানির পাত্র.
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
    in_air: 'বাতাসে',
    in_water: 'পানিতে',
    out_less: '{T2} = {a}° হলে {T1} = <b>{b}°</b>: {m} রশ্মি অভিলম্ব থেকে দূরে সরল। প্রতিফলিত প্রায় {r}%।',
    out_zero: '{T2} = ০° → {T1} = <b>০°</b>। অভিলম্ব বরাবর আলো না বেঁকে বের হয়; প্রতিফলিত প্রায় {r}%।',
    out_critical: '{T2} = <b>{a}°</b> হলে {T1} = <b>{b}°</b>: প্রতিসরিত রশ্মি বিভেদতল ঘেঁষে যায়।',
    out_more: '{T2} = {a}°, {TC} থেকে বেশি: <b>কোনো আলো বের হয় না</b>, পুরোটা ফিরে আসে।',
    out_prism: 'লম্বা তলে আপতন কোণ <b>{a}°</b>, {c}° থেকে বেশি: পুরো আলো প্রতিফলিত হয়ে <b>{b}°</b> ঘুরে গেল।',

    // the rule: the book's words, the term in bold
    f_snell: '{N1} sin {T1} = {N2} sin {T2}',
    f_crit_air:
      'sin {TC} = <span class="tir-fr"><span>{N1}</span><span>{N2}</span></span> = <span class="tir-fr"><span>{n1}</span><span>{n2}</span></span> = {s}, &nbsp;{TC} = <b>{c}°</b>',
    rule_less: 'ঘন মাধ্যম থেকে হালকা মাধ্যমে গেলে রশ্মি <b>অভিলম্ব থেকে দূরে সরে যায়</b>: {T1} &gt; {T2}। খানিকটা আলো প্রতিফলিতও হয়।',
    rule_critical: '{T2} এর যে মানের জন্য {T1} = ৯০° হয়, সেই কোণকে <b>ক্রান্তি কোণ বা সংকট কোণ</b> {TC} বলে: sin {TC} = {N1}/{N2}।',
    rule_more: '{T2} &gt; {TC} হলে আলোর প্রতিসরিত হওয়ার আর কোনো সুযোগ নেই, পুরো আলোই প্রতিফলিত হয়: <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন</b>।',
    rule_water_less: 'আপতন কোণ {a}°, পানির ক্রান্তি কোণ {c}° থেকে কম, তাই <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন হবে না</b>।',
    rule_water_critical: 'পানিতে ক্রান্তি কোণ বড়: {c}°। এই কোণে রশ্মি বিভেদতল ঘেঁষে যায়।',
    rule_water_more: 'আপতন কোণ {a}°, পানির ক্রান্তি কোণ {c}° থেকেও বেশি: এবার পানিতেও <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন</b>।',
    rule_prism: 'প্রিজম তাই আয়নার কাজ করে, আরও ভালোভাবে: <b>সবচেয়ে পরিপূর্ণ প্রতিফলন হয় পূর্ণ অভ্যন্তরীণ প্রতিফলনে।</b>',

    // labels on the picture (short)
    lbl_glass0: 'কাচ (ঘন মাধ্যম)',
    lbl_air0: 'বাতাস (হালকা মাধ্যম)',
    lbl_glass: 'কাচ, {N2} = {n}',
    lbl_air: 'বাতাস, {N1} = {n}',
    lbl_water: 'পানি, {N1} = {n}',
    lbl_source: 'আলোর উৎস',
    lbl_normal: 'অভিলম্ব',
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
    graph_r: 'প্রতিফলিত',
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

    q_away: 'কাচের ভেতরে আলো অভিলম্বের সাথে ৩০° কোণে আসছে। বাতাসে বের হয়ে রশ্মি কোন দিকে যাবে?',
    c_away_right: 'অভিলম্ব থেকে দূরে, প্রায় ৪৯°',
    c_away_toward: 'অভিলম্বের দিকে, প্রায় ১৯°',
    c_away_straight: 'না বেঁকে, ৩০° কোণেই',
    c_away_back: 'বের হবে না, পুরোটা ফিরবে',
    why_away: '<b>অভিলম্ব থেকে দূরে, প্রায় ৪৯°</b>: ১.০০ × sin {T1} = ১.৫০ × sin ৩০° = ০.৭৫, তাই {T1} = ৪৮.৬°। ঘন থেকে হালকা মাধ্যমে {T1} &gt; {T2}।',
    mis_away_toward: 'হালকা থেকে ঘন মাধ্যমে গেলে অভিলম্বের দিকে সরে; এখানে উল্টো।',
    mis_away_straight: 'শুধু অভিলম্ব বরাবর (০°) আলো না বেঁকে যায়।',
    mis_away_back: '৩০° ক্রান্তি কোণ ৪১.৮° থেকে কম, তাই আলো বের হয়।',

    q_crit: 'বাতাসের রশ্মি এখন বিভেদতল ঘেঁষে যাচ্ছে (বাইরের কোণ ৯০°)। কাচের ভেতরের কোণটি কত, আর একে কী বলে?',
    c_crit_right: '৪১.৮°, ক্রান্তি কোণ',
    c_crit_ninety: '৯০°, ক্রান্তি কোণ',
    c_crit_refr: '৪৮.২°, প্রতিসরণ কোণ',
    c_crit_45: '৪৫°, প্রতিফলন কোণ',
    why_crit: '<b>৪১.৮°, ক্রান্তি কোণ বা সংকট কোণ {TC}</b>: যে {T2} তে {T1} = ৯০° হয়। sin {TC} = ১.০০ ÷ ১.৫০ = ০.৬৭।',
    mis_crit_ninety: '৯০° বাইরের কোণ {T1}; ক্রান্তি কোণ ভেতরের কোণ {T2}।',
    mis_crit_refr: '৪৮.২° হলো চাকতির পাশের দাগ থেকে মাপা; কোণ মাপো অভিলম্ব থেকে।',
    mis_crit_45: 'প্রিজমের কোণ ৪৫°; এখানে চাকতিতে দাগটি ৪১.৮° এ।',

    q_tir: 'কাচের ভেতরে আলো এবার ৭০° কোণে আসছে। কী হবে?',
    c_tir_right: 'পুরো আলো ফিরে আসবে',
    c_tir_out: 'বাতাসে বের হবে, ৭০° এর বেশি কোণে',
    c_tir_graze: 'বিভেদতল ঘেঁষে বের হবে',
    c_tir_half: 'অর্ধেক বের হবে, অর্ধেক ফিরবে',
    why_tir:
      '<b>পুরো আলো ফিরে আসবে</b>: ৭০° &gt; ৪১.৮°, তাই পূর্ণ অভ্যন্তরীণ প্রতিফলন। বইয়ের উদাহরণেও (n = ১.৪৫, ৭৫°) sin θ = ১.৪০ আসে, যা হতে পারে না: {TC} = ৪৩.৬°।',
    mis_tir_out: 'sin {T1} = ১.৫০ × sin ৭০° = ১.৪১, যা ১ এর বেশি হতে পারে না।',
    mis_tir_graze: 'বিভেদতল ঘেঁষে যায় শুধু ঠিক ক্রান্তি কোণে, ৪১.৮° এ।',
    mis_tir_half: 'ক্রান্তি কোণের পরে প্রতিসরিত হওয়ার কোনো সুযোগ নেই।',

    q_water: 'কাচের উপরে এখন পানি (প্রতিসরণাঙ্ক ১.৩৩)। কাচের ভেতরে আলো ৫০° কোণে আসছে। কী হবে?',
    c_water_right: 'পানিতে বের হবে ({TC} = ৬২.৫°)',
    c_water_tir: 'পুরোটা ফিরবে (৫০° &gt; ৪১.৮°)',
    c_water_graze: 'বিভেদতল ঘেঁষে যাবে',
    c_water_straight: 'না বেঁকে, ৫০° কোণেই',
    why_water: '<b>আলো পানিতে বের হবে</b>: পানিতে sin {TC} = ১.৩৩ ÷ ১.৫০ = ০.৮৯, {TC} = ৬২.৫°; ৫০° তার চেয়ে কম। রশ্মি যায় প্রায় ৬০° কোণে।',
    mis_water_tir: '৪১.৮° কাচ-বাতাসের ক্রান্তি কোণ; কাচ-পানিতে তা বড়।',
    mis_water_graze: 'বিভেদতল ঘেঁষে যায় শুধু ৬২.৫° এ।',
    mis_water_straight: 'পানি কাচের চেয়ে হালকা মাধ্যম, তাই রশ্মি অভিলম্ব থেকে দূরে সরে।',

    q_prism: 'প্রিজমের লম্বা তলে কাচের ভেতর থেকে আলো ৪৫° কোণে পড়ছে। আলো কোথায় যাবে?',
    c_prism_right: 'পুরোটা ফিরে, ৯০° ঘুরে ডানে',
    c_prism_out: 'লম্বা তল দিয়ে বেরিয়ে যাবে',
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

    in_air: 'In the air the',
    in_water: 'In the water the',
    out_less: '{T2} = {a}° → {T1} = <b>{b}°</b>. {m} ray bends away from the normal; about {r}% is reflected.',
    out_zero: '{T2} = 0° → {T1} = <b>0°</b>. Along the normal the light goes straight out; about {r}% is reflected.',
    out_critical: 'At {T2} = <b>{a}°</b>, {T1} = <b>{b}°</b>: the refracted ray grazes the surface.',
    out_more: '{T2} = {a}°, more than {TC}: <b>no light leaves</b>, all of it comes back.',
    out_prism: 'At the long face the angle of incidence is <b>{a}°</b>, more than {c}°: all the light is reflected and turns by <b>{b}°</b>.',

    f_snell: '{N1} sin {T1} = {N2} sin {T2}',
    f_crit_air:
      'sin {TC} = <span class="tir-fr"><span>{N1}</span><span>{N2}</span></span> = <span class="tir-fr"><span>{n1}</span><span>{n2}</span></span> = {s}, &nbsp;{TC} = <b>{c}°</b>',
    rule_less:
      'Going from a dense medium into a lighter one, the ray <b>bends away from the normal</b>: {T1} &gt; {T2}. A little light is reflected too.',
    rule_critical: 'The value of {T2} for which {T1} = 90° is called the <b>critical angle</b> {TC}: sin {TC} = {N1}/{N2}.',
    rule_more: 'When {T2} &gt; {TC} the light has no way to be refracted; all of it is reflected. This is <b>total internal reflection</b>.',
    rule_water_less:
      'The angle of incidence, {a}°, is less than the water\u2019s critical angle {c}°, so <b>there is no total internal reflection</b>.',
    rule_water_critical: 'In water the critical angle is larger: {c}°. At this angle the ray grazes the surface.',
    rule_water_more:
      'The angle of incidence, {a}°, is more than even the water’s critical angle {c}°: now there is <b>total internal reflection</b> in water too.',
    rule_prism: 'So the prism works as a mirror, and a better one: <b>the most complete reflection is total internal reflection.</b>',

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
    graph_r: 'reflected',
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

    q_away: 'Inside the glass the light meets the normal at 30°. Where does the ray go in the air?',
    c_away_right: 'Away from the normal, about 49°',
    c_away_toward: 'Toward the normal, about 19°',
    c_away_straight: 'Straight on, still at 30°',
    c_away_back: 'It does not leave at all',
    why_away:
      '<b>Away from the normal, about 49°</b>: 1.00 × sin {T1} = 1.50 × sin 30° = 0.75, so {T1} = 48.6°. From dense to light, {T1} &gt; {T2}.',
    mis_away_toward: 'Going from light to dense it bends toward the normal; here it is the other way.',
    mis_away_straight: 'Only along the normal (0°) does light go straight.',
    mis_away_back: '30° is less than the critical angle 41.8°, so light leaves.',

    q_crit: 'The ray in the air now grazes the surface (the outside angle is 90°). What is the angle inside the glass, and what is it called?',
    c_crit_right: '41.8°, the critical angle',
    c_crit_ninety: '90°, the critical angle',
    c_crit_refr: '48.2°, the angle of refraction',
    c_crit_45: '45°, the angle of reflection',
    why_crit: '<b>41.8°, the critical angle {TC}</b>: the {T2} at which {T1} = 90°. sin {TC} = 1.00 ÷ 1.50 = 0.67.',
    mis_crit_ninety: '90° is the outside angle {T1}; the critical angle is the inside angle {T2}.',
    mis_crit_refr: '48.2° is measured from the surface; angles are measured from the normal.',
    mis_crit_45: 'The prism’s angle is 45°; here the disc reads 41.8°.',

    q_tir: 'Now the light meets the normal inside the glass at 70°. What happens?',
    c_tir_right: 'All of the light comes back',
    c_tir_out: 'Out into the air, at over 70°',
    c_tir_graze: 'Out, grazing the surface',
    c_tir_half: 'Half leaves, half comes back',
    why_tir:
      '<b>All of the light comes back</b>: 70° &gt; 41.8°, so total internal reflection. In the book’s example too (n = 1.45, 75°) sin θ comes out 1.40, which cannot be: {TC} = 43.6°.',
    mis_tir_out: 'sin {T1} = 1.50 × sin 70° = 1.41, which cannot be more than 1.',
    mis_tir_graze: 'It grazes only exactly at the critical angle, 41.8°.',
    mis_tir_half: 'Beyond the critical angle there is no way to be refracted.',

    q_water: 'Now there is water above the glass (refractive index 1.33). The light meets the normal inside the glass at 50°. What happens?',
    c_water_right: 'Out into the water ({TC} = 62.5°)',
    c_water_tir: 'All comes back (50° &gt; 41.8°)',
    c_water_graze: 'It grazes the surface',
    c_water_straight: 'Unbent, still at 50°',
    why_water: '<b>It leaves into the water</b>: in water sin {TC} = 1.33 ÷ 1.50 = 0.89, {TC} = 62.5°; 50° is less. The ray leaves at about 60°.',
    mis_water_tir: '41.8° is the glass–air critical angle; glass–water is larger.',
    mis_water_graze: 'It grazes only at 62.5°.',
    mis_water_straight: 'Water is a lighter medium than glass, so the ray bends away from the normal.',

    q_prism: 'Inside the prism the light meets the long face at 45°. Where does it go?',
    c_prism_right: 'All back, turned 90° to the right',
    c_prism_out: 'Out through the long face',
    c_prism_straight: 'Straight up, unbent',
    c_prism_half: 'Half leaves, half turns',
    why_prism:
      '<b>All back, turned 90° to the right</b>: 45° is more than the glass–air critical angle 41.8°, so total internal reflection; the prism works as a mirror (fig. 9.07).',
    mis_prism_out: 'It would leave if 45° were less than the critical angle.',
    mis_prism_straight: 'Light meeting a glass–air surface slantwise does not go straight.',
    mis_prism_half: 'Beyond 41.8° no light leaves at all.',
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
