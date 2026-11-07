// Every string the figure shows, in Bangla and English. The book's words on page 253 (topic 9.3.1): অপটিক্যাল ফাইবার,
// "অত্যন্ত সরু কাচের তন্তু", কোর (core), ক্ল্যাড (clad), "দুটিই একই কাচ দিয়ে তৈরি হলেও ভেতরের অংশের (কোর)
// প্রতিসরণাঙ্ক বাইরের অংশ থেকে বেশি", "পূর্ণ অভ্যন্তরীণ প্রতিফলনের মাধ্যমে আলোকে কোরের মাঝে আটকে রেখে অনেক দূরে নিয়ে
// যাওয়া যায়", "মুক্ত অবস্থায় আলো সরলরেখায় যায় কিন্তু ফাইবারে আলো আটকা পড়ে যায় বলে সেটাকে ঘুরিয়ে পেঁচিয়ে যেকোনো দিকে
// নেওয়া সম্ভব", শত শত কিলোমিটার, শোষণ, দৃশ্যমান আলো, ইনফ্রারেড বা অবলাল রশ্মি, বৈদ্যুতিক সংকেত / আলোর সংকেত, তথ্য;
// the example: n₁ = 1.45 (clad), n₂ = 1.50 (core), θc = sin⁻¹(n₁/n₂) = 75°, "কাজেই আলোকরশ্মিকে 75° কিংবা তার চেয়ে
// বেশি কোণে আপতিত হতে হবে", চিত্র ৯.১১ (b) marks the angle θ₁. From section 9.2: সংকট কোণ, ঘন / হালকা মাধ্যম; from
// 9.1: লম্ব (chapter 9's word for the normal), আপতন কোণ. Added by the figure: আলোর উৎস, পর্দা, (প্লাস্টিকের) আবরণ (a
// real fibre's coating, which takes up the light that leaves the core).
// Use t('key', vars) in code and t.num() for numbers; numbers in sentences come in as {vars}. A {key} that is not a var
// is another string of the same language (the symbols {T1}, {TC}, {N1}, {N2}). intro / intro_short: the first screen's
// calm card; lead_*: the line before the action; out_*: the result; rule_*: the rule, the book's term in bold. The
// questions (q_*) are plain text (the quiz writes them as text), so they say "আপতন কোণ" in words, not θ₁.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'অপটিক্যাল ফাইবার: পূর্ণ অভ্যন্তরীণ প্রতিফলনে আলো আটকে থাকে',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',
    aria_stage: 'টেবিলে অনেক বড় করে বানানো একটি অপটিক্যাল ফাইবার, দুই প্রান্তে ধরে রাখা: ভেতরে কাচের কোর, বাইরে কাচের ক্ল্যাড; এক প্রান্তে আলোর উৎস, অন্য প্রান্তে একটি পর্দা',

    // symbols (HTML: the font has no subscript digits)
    T1: 'θ<sub>1</sub>',
    TC: 'θ<sub>c</sub>',
    N1: 'n<sub>1</sub>',
    N2: 'n<sub>2</sub>',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_bend: 'টেনে ফাইবার বাঁকাও',
    howto_tilt: 'টেনে উৎস ঘোরাও',
    drag_bend: 'টেনে বাঁকাও',
    drag_tilt: 'টেনে ঘোরাও',
    aria_bend: 'ফাইবারের দূরের প্রান্ত ওঠাও বা নামাও (উপর-নিচ তীর কী দিয়েও)',
    aria_tilt: 'আলোর উৎস ঘোরাও (ডান-বাম তীর কী দিয়েও)',

    // the steps
    ex_label: 'ধাপ',
    ex_parts: 'কোর',
    ex_light: 'আলো',
    ex_one: 'সংকট কোণ',
    ex_bend: 'বাঁক',
    ex_tilt: 'তেরছা',

    // the action and the quiet buttons
    act_look: 'ভেতরটা দেখো',
    act_light: 'আলো পাঠাও',
    act_one: 'কাছ থেকে দেখো',
    act_bend: 'ফাইবার বাঁকাও',
    act_tilt: 'আলো তেরছা করো',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',
    act_replay: 'আবার দেখো',

    // the first screen: a few calm words
    intro:
      'টেবিলে একটি অপটিক্যাল ফাইবার, অনেক বড় করে বানানো। আসলটি চুলের মতো সরু কাচের তন্তু; এর ভেতর দিয়ে আলোর সংকেতে তথ্য যায়। আলো কীভাবে এর ভেতরে আটকে থাকে, চলো দেখি।',
    intro_short: 'অনেক বড় করে বানানো একটি অপটিক্যাল ফাইবার। আলো কীভাবে এর ভেতরে আটকে থাকে, চলো দেখি।',

    // the line before the action
    lead_parts: 'এবার এক প্রান্ত দিয়ে ফাইবারে আলো পাঠাই।',
    lead_light: 'এবার একটি প্রতিফলন কাছ থেকে দেখি।',
    lead_one: 'ফাইবারটি বাঁকালে কি আলো বেরিয়ে যাবে?',
    lead_bend: 'আলো খুব তেরছা করে পাঠালে কী হয়?',
    lead_tilt: 'এবার নিজে যাচাই করো।',

    // the result
    out_parts: 'ভেতরে <b>কোর</b>, {N2} = {n2}; বাইরে <b>ক্ল্যাড</b>, {N1} = {n1}।',
    out_light: 'আলো কোরের দেয়ালে <b>{k} বার</b> প্রতিফলিত হয়ে অন্য প্রান্তের পর্দায় পৌঁছাল।',
    out_one: 'এখানে আপতন কোণ {T1} = <b>{a}°</b>, সংকট কোণ {c}°-এর চেয়ে বেশি।',
    out_bend: 'বাঁকেও সবচেয়ে ছোট {T1} = <b>{a}°</b>, {c}°-এর বেশি। পুরো আলো পর্দায় পৌঁছায়।',
    out_tilt_ok: 'সবচেয়ে ছোট {T1} = <b>{a}°</b>, {c}°-এর বেশি। পুরো আলো পর্দায় পৌঁছায়।',
    out_tilt_some: '{T1} = <b>{a}°</b>, {c}°-এর কম। আলো ক্ল্যাডে বেরিয়ে যায়; পর্দায় মাত্র <b>{p}%</b>।',
    out_tilt_none: '{T1} = <b>{a}°</b>, {c}°-এর কম। আলো ক্ল্যাডে বেরিয়ে যায়; পর্দায় <b>আলো নেই</b>।',
    out_none: 'আলো দেয়ালে না পড়ে সোজা পর্দায় যায়।',

    // the rule: the book's words, the term in bold
    rule_parts: 'দুটিই একই কাচ দিয়ে তৈরি হলেও ভেতরের অংশের (কোর) <b>প্রতিসরণাঙ্ক বাইরের অংশ থেকে বেশি</b>। কোর ঘন মাধ্যম, ক্ল্যাড হালকা।',
    rule_light: 'এ কারণে <b>পূর্ণ অভ্যন্তরীণ প্রতিফলনের</b> মাধ্যমে আলো কোরের মাঝে আটকে থেকে অনেক দূরে যায়। (আসল ফাইবারে যায় অদৃশ্য ইনফ্রারেড রশ্মি।)',
    rule_one: 'sin {TC} = {N1}/{N2} = {n1}/{n2} = {s}, তাই {TC} = <b>{c}°</b>। {T1} এর চেয়ে বড় হলে <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন</b>।',
    rule_bend: 'মুক্ত অবস্থায় আলো সরলরেখায় যায়, কিন্তু ফাইবারে আলো আটকা পড়ে বলে সেটাকে <b>ঘুরিয়ে পেঁচিয়ে যেকোনো দিকে</b> নেওয়া যায়।',
    rule_tilt: 'কাজেই আলোকরশ্মিকে <b>{c}° কিংবা তার চেয়ে বেশি কোণে</b> আপতিত হতে হবে। কম কোণে আলো ক্ল্যাডে বেরিয়ে যায়, আবরণ তা শুষে নেয়।',

    // labels on the picture (short)
    lbl_core: 'কোর, {N2} = {n}',
    lbl_clad: 'ক্ল্যাড, {N1} = {n}',
    lbl_coat: 'আবরণ',
    lbl_source: 'আলোর উৎস',
    lbl_screen: 'পর্দা',
    lbl_t1: '{T1} = {a}°',
    lbl_normal: 'লম্ব',
    lbl_tc: '{TC} = {c}°',
    lbl_leak: 'আলো বেরিয়ে গেল',
    note_scale: 'আসলের চেয়ে অনেক গুণ বড়',

    // the graph
    graph_y: 'আপতন কোণ',
    graph_x: 'দেয়ালে আলো পড়ার ক্রম',
    graph_crit: 'সংকট কোণ {c}°',
    graph_aria: 'লেখচিত্র: প্রতিবার কোরের দেয়ালে আলো পড়ার আপতন কোণ, সংকট কোণ {c}° রেখার সাথে তুলনা',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',
    hint_keys: 'চতুর্থ ধাপ থেকে তীর কী দিয়ে ফাইবার বাঁকানো যায়, পঞ্চম ধাপে উৎস ঘোরানো যায়।',

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
    q_locked: 'পরীক্ষার সময় ফাইবার আর উৎস আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_what: 'ছবিতে আলো কোরের দেয়ালে যে আপতন কোণে পড়েছে, তাতে এখানে আলোর কী হবে?',
    c_wh_tir: 'পুরো আলো কোরে ফিরে আসবে',
    c_wh_leak: 'বেশির ভাগ আলো ক্ল্যাডে চলে যাবে',
    c_wh_air: 'আলো না বেঁকে বাতাসে বেরোবে',
    c_wh_stop: 'আলো দেয়ালেই থেমে যাবে',
    why_wh_tir: '<b>পুরো আলো ফিরে আসবে।</b> {T1} = {a}°, সংকট কোণ {c}°-এর চেয়ে বড়: পূর্ণ অভ্যন্তরীণ প্রতিফলন।',
    why_wh_leak: '<b>বেশির ভাগ আলো ক্ল্যাডে চলে যাবে।</b> {T1} = {a}°, সংকট কোণ {c}°-এর চেয়ে ছোট; অল্প একটু আলো প্রতিফলিত হয়।',
    mis_wh_leak_tir: 'আপতন কোণ সংকট কোণের চেয়ে বড় হলে কোনো আলো বের হয় না।',
    mis_wh_tir_leak: 'পুরো আলো ফেরে কেবল আপতন কোণ সংকট কোণের সমান বা বড় হলে।',
    mis_wh_air: 'দেয়ালের ওপাশে বাতাস নয়, ক্ল্যাডের কাচ; আর তির্যক আলো সেখানে বেঁকে যায়।',
    mis_wh_stop: 'স্বচ্ছ কাচে আলো থেমে যায় না: হয় ফিরে আসে, নয় পার হয়ে যায়।',

    q_crit: 'ছবির ফাইবারের কোর আর ক্ল্যাডের প্রতিসরণাঙ্ক দেখো। এর সংকট কোণ কত?',
    why_crit: '<b>{c}°।</b> sin {TC} = {N1}/{N2} = {n1}/{n2} = {s}, তাই {TC} = {c}°।',
    mis_cr_air: '{v}° কাচ থেকে বাতাসে যাওয়ার সংকট কোণ; এখানে ওপাশে ক্ল্যাড।',
    mis_cr_wall: '{v}° হলো দেয়ালের সাথে কোণ; সংকট কোণ মাপা হয় লম্ব থেকে।',
    mis_cr_clad: '{v}° ক্ল্যাড থেকে বাতাসে যাওয়ার সংকট কোণ; এখানে কোর থেকে ক্ল্যাডে।',

    q_leak: 'ছবিতে আলো কোরে আটকে না থেকে বেরিয়ে যাচ্ছে। কেন?',
    c_lk_right: 'দেয়ালে আপতন কোণ সংকট কোণের চেয়ে ছোট',
    c_lk_more: 'দেয়ালে আপতন কোণ সংকট কোণের চেয়ে বড়',
    c_lk_absorb: 'কোরের কাচ সব আলো শুষে নেয়',
    c_lk_same: 'কোর আর ক্ল্যাড একই কাচ, তাই প্রতিফলন হয় না',
    why_leak: '<b>আপতন কোণ সংকট কোণের চেয়ে ছোট।</b> {T1} = {a}° &lt; {c}°, তাই প্রতিবার বেশির ভাগ আলো ক্ল্যাডে বেরিয়ে যায়।',
    mis_lk_more: 'বড় হলে তো পুরো আলো ফিরে আসত; ছবির কোণ {c}°-এর কম।',
    mis_lk_absorb: 'এই কাচে শোষণ খুব কম; আলো বেরিয়ে যাচ্ছে ক্ল্যাডে।',
    mis_lk_same: 'একই কাচ হলেও কোরের প্রতিসরণাঙ্ক বেশি; তাই ঠিক কোণে পূর্ণ প্রতিফলন হয়।',

    q_bend: 'ছবির ফাইবারটি বাঁকানো, তবু আলো অন্য প্রান্তে পৌঁছাল। কেন?',
    c_bd_right: 'প্রতিটি দেয়ালে আপতন কোণ সংকট কোণের চেয়ে বড়',
    c_bd_curve: 'আলো নিজেই বাঁকা পথে চলতে পারে',
    c_bd_mirror: 'কোরের দেয়ালে আয়নার মতো রুপালি প্রলেপ আছে',
    c_bd_coat: 'বাইরের আবরণ আলো ফিরিয়ে দেয়',
    why_bend: '<b>প্রতিটি দেয়ালে আপতন কোণ সংকট কোণের চেয়ে বড়।</b> সবচেয়ে ছোটটিও {T1} = {a}°, তাই প্রতিবার পূর্ণ অভ্যন্তরীণ প্রতিফলন।',
    mis_bd_curve: 'আলো প্রতিটি অংশে সরলরেখায় যায়; বাঁক নেয় দেয়ালে প্রতিফলিত হয়ে।',
    mis_bd_mirror: 'কোনো রুপালি প্রলেপ নেই: কোর আর ক্ল্যাড দুটিই স্বচ্ছ কাচ।',
    mis_bd_coat: 'আবরণ আলো ফেরায় না, শুষে নেয়; আলো ফেরে কোর-ক্ল্যাডের দেয়ালেই।',

    q_ir: 'আসল অপটিক্যাল ফাইবারে কোন রশ্মি পাঠানো হয়, আর কেন?',
    c_ir_right: 'ইনফ্রারেড, কারণ কাচে এর শোষণ কম',
    c_ir_seen: 'দৃশ্যমান আলো, কারণ চোখে দেখা যায়',
    c_ir_uv: 'অতিবেগুনি রশ্মি, কারণ এর শক্তি বেশি',
    c_ir_straight: 'ইনফ্রারেড, কারণ এটি প্রতিফলিত হয় না',
    why_ir: '<b>ইনফ্রারেড বা অবলাল রশ্মি।</b> দৃশ্যমান আলো হলে শোষণ বেশি হয়, তাই লম্বা তরঙ্গদৈর্ঘ্যের ইনফ্রারেড ব্যবহার করা হয়।',
    mis_ir_seen: 'দৃশ্যমান আলোর শোষণ বেশি, তাই দূরে পাঠাতে এটি ব্যবহার হয় না।',
    mis_ir_uv: 'বই বলছে লম্বা তরঙ্গদৈর্ঘ্যের রশ্মি ব্যবহার হয়; অতিবেগুনির তরঙ্গদৈর্ঘ্য ছোট।',
    mis_ir_straight: 'ইনফ্রারেডও পূর্ণ অভ্যন্তরীণ প্রতিফলনে আটকে থাকে; কারণটি কম শোষণ।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Optical fibre: total internal reflection keeps the light inside',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn it',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',
    aria_stage:
      'A magnified optical fibre on a table, held at both ends: a glass core inside a glass clad; a light source at one end, a screen at the other',

    T1: 'θ<sub>1</sub>',
    TC: 'θ<sub>c</sub>',
    N1: 'n<sub>1</sub>',
    N2: 'n<sub>2</sub>',

    howto_label: 'How to use it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_bend: 'Drag to bend the fibre',
    howto_tilt: 'Drag to turn the source',
    drag_bend: 'Drag to bend',
    drag_tilt: 'Drag to turn',
    aria_bend: 'Raise or lower the far end of the fibre (or the up and down arrow keys)',
    aria_tilt: 'Turn the light source (or the left and right arrow keys)',

    ex_label: 'Steps',
    ex_parts: 'Core',
    ex_light: 'Light',
    ex_one: 'Angle',
    ex_bend: 'Bend',
    ex_tilt: 'Slant',

    act_look: 'Look inside',
    act_light: 'Send the light',
    act_one: 'Look up close',
    act_bend: 'Bend the fibre',
    act_tilt: 'Slant the light',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',
    act_replay: 'Watch again',

    intro:
      'On the table, an optical fibre made many times bigger. A real one is a glass thread as thin as a hair; information travels through it as light signals. How does the light stay inside? Let’s see.',
    intro_short: 'An optical fibre, made many times bigger. How does the light stay inside? Let’s see.',

    lead_parts: 'Now we send light into one end.',
    lead_light: 'Now let’s look at one reflection up close.',
    lead_one: 'If we bend the fibre, will the light get out?',
    lead_bend: 'And if the light goes in very slanted?',
    lead_tilt: 'Now test yourself.',

    out_parts: 'Inside, the <b>core</b>, {N2} = {n2}; outside, the <b>clad</b>, {N1} = {n1}.',
    out_light: 'The light was reflected <b>{k} times</b> at the core’s wall and reached the screen at the far end.',
    out_one: 'Here the angle of incidence {T1} = <b>{a}°</b>, above the critical angle {c}°.',
    out_bend: 'In the bends the smallest {T1} = <b>{a}°</b>, above {c}°: all the light arrives.',
    out_tilt_ok: 'The smallest {T1} = <b>{a}°</b>, above {c}°: all the light arrives.',
    out_tilt_some: '{T1} = <b>{a}°</b>, below {c}°. The light leaves into the clad; only <b>{p}%</b> arrives.',
    out_tilt_none: '{T1} = <b>{a}°</b>, below {c}°. The light leaves into the clad; <b>no light</b> arrives.',
    out_none: 'The light goes straight to the screen without meeting the wall.',

    rule_parts:
      'Both are made of the same glass, but the inner part (the core) <b>has a higher refractive index than the outer part</b>. The core is the denser medium, the clad the lighter one.',
    rule_light:
      'So by <b>total internal reflection</b> the light stays trapped in the core and goes a long way. (Real fibres carry invisible infrared.)',
    rule_one: 'sin {TC} = {N1}/{N2} = {n1}/{n2} = {s}, so {TC} = <b>{c}°</b>. If {T1} is larger: <b>total internal reflection</b>.',
    rule_bend: 'Free light travels in a straight line, but in a fibre it is trapped, so the fibre can be <b>twisted and turned any way</b>.',
    rule_tilt: 'So the ray must meet the wall at <b>{c}° or more</b>. At less, the light leaves into the clad and the coating takes it up.',

    lbl_core: 'core, {N2} = {n}',
    lbl_clad: 'clad, {N1} = {n}',
    lbl_coat: 'coating',
    lbl_source: 'light source',
    lbl_screen: 'screen',
    lbl_t1: '{T1} = {a}°',
    lbl_normal: 'normal',
    lbl_tc: '{TC} = {c}°',
    lbl_leak: 'light leaves',
    note_scale: 'many times bigger than real',

    graph_y: 'angle of incidence',
    graph_x: 'the walls in turn',
    graph_crit: 'critical angle {c}°',
    graph_aria: 'Graph: the angle of incidence at each wall the light meets, against the critical angle of {c}°',

    hint_wait: 'Wait a moment and watch.',
    hint_keys: 'From step 4 the arrow keys bend the fibre; in step 5 they turn the source.',

    q_count: 'Question {i} of {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The fibre and the source are locked during the test. Look at the picture and pick an answer.',

    q_what: 'At the angle of incidence shown, what happens to the light at this wall?',
    c_wh_tir: 'All of it comes back into the core',
    c_wh_leak: 'Most of it goes into the clad',
    c_wh_air: 'It goes out into the air unbent',
    c_wh_stop: 'It stops at the wall',
    why_wh_tir: '<b>All of it comes back.</b> {T1} = {a}°, larger than the critical angle {c}°: total internal reflection.',
    why_wh_leak: '<b>Most of it goes into the clad.</b> {T1} = {a}°, smaller than the critical angle {c}°; only a little is reflected.',
    mis_wh_leak_tir: 'Above the critical angle no light gets out.',
    mis_wh_tir_leak: 'All the light comes back only at or above the critical angle.',
    mis_wh_air: 'Beyond the wall is the clad’s glass, not air, and slanted light bends there.',
    mis_wh_stop: 'Light doesn’t stop in clear glass: it is reflected or it goes through.',

    q_crit: 'Look at the core’s and the clad’s refractive indices. What is the critical angle?',
    why_crit: '<b>{c}°.</b> sin {TC} = {N1}/{N2} = {n1}/{n2} = {s}, so {TC} = {c}°.',
    mis_cr_air: '{v}° is the critical angle from glass into air; here the clad is on the other side.',
    mis_cr_wall: '{v}° is the angle with the wall; the critical angle is measured from the normal.',
    mis_cr_clad: '{v}° is from the clad into air; here the light goes from core to clad.',

    q_leak: 'In the picture the light does not stay in the core. Why?',
    c_lk_right: 'The angle at the wall is below the critical angle',
    c_lk_more: 'The angle at the wall is above the critical angle',
    c_lk_absorb: 'The core’s glass takes up all the light',
    c_lk_same: 'Core and clad are the same glass, so nothing reflects',
    why_leak: '<b>The angle is below the critical angle.</b> {T1} = {a}° &lt; {c}°, so each time most of the light leaves into the clad.',
    mis_lk_more: 'Above it, all the light would come back; the angle in the picture is under {c}°.',
    mis_lk_absorb: 'This glass takes up very little light; the light leaves into the clad.',
    mis_lk_same: 'Same glass, but the core’s index is higher, so at the right angle all of it reflects.',

    q_bend: 'The fibre in the picture is bent, yet the light reached the far end. Why?',
    c_bd_right: 'At every wall the angle is above the critical angle',
    c_bd_curve: 'Light can travel along a curved path by itself',
    c_bd_mirror: 'The core’s wall has a silvery mirror coating',
    c_bd_coat: 'The outer coating sends the light back',
    why_bend: '<b>At every wall the angle is above the critical angle.</b> Even the smallest is {T1} = {a}°, so every reflection is total.',
    mis_bd_curve: 'Light goes straight between walls; it turns by reflecting.',
    mis_bd_mirror: 'There is no silver: core and clad are both clear glass.',
    mis_bd_coat: 'The coating takes light up; the light comes back at the core–clad wall.',

    q_ir: 'Which rays do real optical fibres carry, and why?',
    c_ir_right: 'Infrared, because glass takes up little of it',
    c_ir_seen: 'Visible light, because we can see it',
    c_ir_uv: 'Ultraviolet, because it has more energy',
    c_ir_straight: 'Infrared, because it is never reflected',
    why_ir: '<b>Infrared.</b> Glass takes up more visible light, so the longer-wavelength infrared is used.',
    mis_ir_seen: 'Visible light is taken up more, so it isn’t used for long distances.',
    mis_ir_uv: 'The book says longer-wavelength rays are used; ultraviolet’s are shorter.',
    mis_ir_straight: 'Infrared is trapped by total internal reflection too; the reason is the low absorption.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

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
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
