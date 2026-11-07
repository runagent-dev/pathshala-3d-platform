// Every string the figure shows, in Bangla and English. The book's words on pages 251–252 (topic 9.2.2, মরীচিকা,
// চিত্র ৯.১০): মরুভূমি, মরীচিকা, "মূল শব্দটি এসেছে মরুভূমিতে উষ্ণ স্থানে সৃষ্টি এক ধরনের দৃষ্টি বিভ্রম থেকে", উত্তপ্ত বালু,
// "সহজভাবে বোঝানোর জন্য এখানে মাত্র তিনটি স্তর দেখানো হয়েছে", "উপরের স্তরে বাতাসের ঘনত্ব বেশি তাই প্রতিসরণাঙ্ক বেশি",
// "নিচের স্তরে বাতাস উত্তপ্ত তাই ঘনত্ব কম এবং প্রতিসরণাঙ্কও কম", "প্রতিটি স্তরে প্রতিসরিত হওয়ার সময় প্রতিসরণ কোণ বেড়ে যায়",
// পূর্ণ অভ্যন্তরীণ প্রতিফলন, আপতন কোণ, ক্রান্তি কোণ ("ক্রান্তি কোণকে অতিক্রম"), "মরীচিকাকে দূর থেকে দেখা যায়, কাছে এলে
// দেখা যায় না", "সরাসরি গাছটি দেখতে পাবে", "গাছের একটি প্রতিবিম্ব গাছের নিচেও দেখতে পাবে", "মনে হবে নিচে পানি থাকার
// কারণে সেখানে গাছের প্রতিবিম্ব দেখা যাচ্ছে", "কাছে গেলে দেখা যাবে কোনো পানি নেই", and the hot road ("দূরে কালচে ভেজা
// রাস্তা", "খটখটে শুকনো"). The page writes উপরের. As in the sister figures (9.1, 9.2):
// the normal is "লম্ব" (chapter 9 never says অভিলম্ব); the boundary between two layers is a "বিভেদতল" (9.2). The page calls the
// image only "প্রতিবিম্ব".
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. intro / intro_short
// are the first screen's calm card; lead_* the line before the action; out_* the result; rule_* the rule, the book's
// term in bold. The questions (q_*) are plain text, no HTML: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'মরীচিকা: উত্তপ্ত বালুর উপরে বাতাসের স্তরে আলো বাঁকে',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    aria_stage: 'মরুভূমির উত্তপ্ত বালুর উপরে একটি নারকেল গাছ, বাম পাশে একটি চোখ গাছটির দিকে তাকিয়ে আছে',
    note: 'স্তর ও কোণ বাড়িয়ে দেখানো',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_eye: 'টেনে চোখ সরাও',
    aria_howto_eye: 'টেনে চোখ সরাও: ছবিতে চোখের নিচের সাদা চাকতিটি দেখাও',
    drag_me: 'টেনে সরাও',
    aria_drag_eye: 'চোখটি গাছের কাছে বা দূরে সরাও (বাম ও ডান তীর)',

    // the steps
    ex_label: 'ধাপ',
    ex_direct: 'সরাসরি',
    ex_layers: 'স্তর',
    ex_bend: 'বাঁকা পথ',
    ex_image: 'প্রতিবিম্ব',
    ex_near: 'কাছে',

    // the action and the quiet buttons
    act_direct: 'গাছের দিকে তাকাও',
    act_layers: 'বালু গরম হোক',
    act_bend: 'নিচের আলোটি দেখো',
    act_image: 'চোখ কী দেখে?',
    act_near: 'গাছের কাছে যাও',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',

    // the first screen: a few calm words
    intro:
      'মরুভূমির গরম বালুর উপরে দূরে একটি নারকেল গাছ। একটি চোখ গাছটির দিকে তাকিয়ে আছে। দূর থেকে মনে হয় গাছের নিচে পানি, তাতে গাছের উল্টো ছবি। সত্যিই কি পানি আছে? চলো দেখি।',
    intro_short: 'গরম বালুর উপরে দূরে একটি গাছ। দূর থেকে গাছের নিচে পানি দেখা যায় কেন? চলো দেখি।',

    // the line before the action: what the next tap will show
    lead_direct: 'এবার রোদে বালু গরম হলে বাতাসের কী হয়, দেখি।',
    lead_layers: 'গাছের মাথা থেকে আরেকটি আলো নিচের দিকে আসছে। দেখি সে কী করে।',
    lead_bend: 'ফিরে আসা আলোটি কোথায় যায়, আর চোখ কী দেখে?',
    lead_image: 'এবার গাছের দিকে কাছে এগিয়ে দেখি।',
    lead_near: 'চোখটি টেনে দূরে-কাছে সরিয়ে দেখো। তারপর নিজে যাচাই করো।',

    // the result line
    out_direct: 'গাছের মাথা থেকে আলো <b>সোজা পথে</b> চোখে আসে। তাই চোখ গাছটিকে যেখানে আছে সেখানেই দেখে।',
    out_layers: 'বালুর কাছের বাতাস সবচেয়ে <b>উত্তপ্ত</b>, উপরের বাতাস ঠান্ডা। উত্তপ্ত বাতাসের ঘনত্ব কম।',
    out_bend: 'আপতন কোণ {i}°, প্রতিসরণ কোণ <b>{r}°</b>: কোণ বেড়ে গেল। নিচের স্তরে আলো আর ঢুকতে পারল না।',
    out_image: 'চোখ গাছটি দেখে, আর গাছের নিচে একটি <b>উল্টো গাছ</b>। এই প্রতিবিম্ব সত্যিকারের গাছ নয়, আলো সেখানে যায়নি।',
    out_far: 'নিচের বিভেদতলে আপতন কোণ <b>{i}°</b>, ক্রান্তি কোণ {c}° থেকে বেশি: মরীচিকা দেখা যায়।',
    out_close: 'নিচের বিভেদতলে আপতন কোণ <b>{i}°</b>, ক্রান্তি কোণ {c}° থেকে কম। চোখের দিকে আসার মতো আলো বালুতে পড়ে।',

    // the rule: the book's words, the book's term in bold
    rule_direct: 'একই বাতাসের ভেতর দিয়ে আলো সোজা পথে চলে। তাই কোনো মানুষ দূরের একটি গাছের দিকে তাকালে <b>সরাসরি গাছটি</b> দেখতে পায়।',
    rule_layers:
      'সহজভাবে বোঝানোর জন্য মাত্র তিনটি স্তর। উপরের স্তরে বাতাসের ঘনত্ব বেশি, তাই <b>প্রতিসরণাঙ্ক বেশি</b>। নিচের স্তরে বাতাস উত্তপ্ত, তাই ঘনত্ব কম এবং <b>প্রতিসরণাঙ্কও কম</b>।',
    rule_bend:
      'প্রতিটি স্তরে প্রতিসরিত হওয়ার সময় প্রতিসরণ কোণ বেড়ে যায়। নিচের বিভেদতলে আপতন কোণ {iB}°, ক্রান্তি কোণ {c}° থেকে বেশি, তাই <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন</b>।',
    rule_image: 'চোখ ভাবে আলো সোজা পথে এসেছে, তাই ভাঙা রেখা বরাবর গাছের নিচে গাছের <b>প্রতিবিম্ব</b> দেখে। মনে হয় নিচে পানি আছে। এই দৃষ্টি বিভ্রমই <b>মরীচিকা</b>।',
    rule_near:
      'কাছে এলে আলোকে খাড়া হয়ে নামতে হয়, আপতন কোণ ছোট হয়ে যায়। তাই <b>মরীচিকাকে দূর থেকে দেখা যায়, কাছে এলে দেখা যায় না</b>। কাছে গেলে দেখা যায় কোনো পানি নেই।',
    rule_far_again: 'দূরে আলো প্রায় মাটির সমান্তরালে আসে, আপতন কোণ বড় হয়ে ক্রান্তি কোণকে অতিক্রম করে। তাই <b>মরীচিকাকে দূর থেকে দেখা যায়</b>।',

    // labels on the picture (short)
    lbl_tree: 'গাছ',
    lbl_eye: 'চোখ',
    lbl_sand: 'বালু',
    lbl_sand_hot: 'উত্তপ্ত বালু',
    lbl_top: 'উপরের স্তর · n বেশি',
    lbl_mid: 'মাঝের স্তর',
    lbl_low: 'নিচের স্তর · n কম',
    lbl_normal: 'লম্ব',
    lbl_tir: 'পূর্ণ অভ্যন্তরীণ প্রতিফলন',
    lbl_image: 'প্রতিবিম্ব',
    lbl_water: 'পানি মনে হয়',
    lbl_nowater: 'পানি নেই',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',
    hint_drag: 'চোখের নিচের সাদা চাকতিটি টেনে সরাও।',

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

    q_r: 'ছবিতে r আর i দেখো। আলো মাঝের স্তরে ঢোকার সময় প্রতিসরণ কোণ r, আপতন কোণ i-এর চেয়ে কেমন?',
    c_r_right: 'বড়',
    c_r_small: 'ছোট',
    c_r_same: 'সমান',
    c_r_zero: 'শূন্য',
    why_r: '<b>বড়</b>: বেশি প্রতিসরণাঙ্ক থেকে কম প্রতিসরণাঙ্কে গেলে আলো লম্ব থেকে দূরে সরে, প্রতিসরণ কোণ বেড়ে যায়।',
    mis_r_small: 'ছোট হয় হালকা থেকে ঘন মাধ্যমে গেলে; এখানে আলো কম প্রতিসরণাঙ্কে যাচ্ছে।',
    mis_r_same: 'সমান হতো যদি দুই স্তরের প্রতিসরণাঙ্ক সমান হতো।',
    mis_r_zero: 'শূন্য হয় শুধু লম্ব বরাবর এলে।',

    q_tir: 'নিচের বিভেদতলে পৌঁছে আলো উপরে ফিরে গেল কেন?',
    c_tir_right: 'আপতন কোণ ক্রান্তি কোণের চেয়ে বেশি',
    c_tir_less: 'আপতন কোণ ক্রান্তি কোণের চেয়ে কম',
    c_tir_sand: 'বালু আয়নার মতো আলো ফেরায়',
    c_tir_push: 'গরম বাতাস আলোকে উপরে ঠেলে',
    why_tir: '<b>আপতন কোণ ক্রান্তি কোণের চেয়ে বেশি</b>, তাই পূর্ণ অভ্যন্তরীণ প্রতিফলন হলো।',
    mis_tir_less: 'ক্রান্তি কোণের চেয়ে কম হলে আলো নিচের স্তরে প্রতিসরিত হয়ে ঢুকে যেত।',
    mis_tir_sand: 'আলো বালু পর্যন্ত পৌঁছায়নি; বাতাসের স্তরেই ফিরে গেছে।',
    mis_tir_push: 'বাতাস আলোকে ঠেলে না; বিভেদতলে আলো প্রতিসরিত বা প্রতিফলিত হয়।',

    q_img: 'বাঁকা পথের আলো চোখে পৌঁছাল। চোখ প্রতিবিম্ব কোথায় ও কেমন দেখবে?',
    c_img_right: 'গাছের নিচে, উল্টো',
    c_img_upright: 'গাছের নিচে, সোজা',
    c_img_above: 'গাছের উপরে, উল্টো',
    c_img_none: 'কোথাও নয়, শুধু গাছ',
    why_img: '<b>গাছের নিচে, উল্টো</b>: গাছের মাথার আলো নিচ থেকে চোখে আসে, তাই মাথাটি সবচেয়ে নিচে দেখায়।',
    mis_img_upright: 'মাথার আলো নিচ থেকে আসে, তাই মাথাটি নিচে: গাছ উল্টো দেখায়।',
    mis_img_above: 'আলো চোখে নিচের দিক থেকে আসছে, উপর থেকে নয়।',
    mis_img_none: 'এই আলোও চোখে পৌঁছায়, তাই চোখ গাছ ছাড়াও প্রতিবিম্ব দেখে।',

    q_road: 'গরমের দিনে উত্তপ্ত রাস্তা দূর থেকে ভেজা দেখায়, কাছে গেলে খটখটে শুকনো। কাছে কী বদলায়?',
    c_road_right: 'আপতন কোণ ক্রান্তি কোণের চেয়ে কম হয়',
    c_road_crit: 'কাছে গেলে ক্রান্তি কোণ বেড়ে যায়',
    c_road_dry: 'কাছে যেতে যেতে পানি শুকিয়ে যায়',
    why_road: '<b>আপতন কোণ ক্রান্তি কোণের চেয়ে কম হয়</b>: কাছে এলে আলো খাড়া হয়ে নামে, পূর্ণ অভ্যন্তরীণ প্রতিফলন হয় না।',
    mis_road_crit: 'ক্রান্তি কোণ নির্ভর করে বাতাসের প্রতিসরণাঙ্কের উপর, দূরত্বের উপর নয়।',
    mis_road_dry: 'সেখানে কখনো পানি ছিলই না; সেটি ছিল দৃষ্টি বিভ্রম।',
    inset_cap: 'চোখ যা দেখে',
    cap_desert: 'মরুভূমিতে মরীচিকা খুবই পরিচিত দৃশ্য। মূল শব্দটি এসেছে মরুভূমিতে উষ্ণ স্থানে সৃষ্টি এক ধরনের <b>দৃষ্টি বিভ্রম</b> থেকে।',
    cap_road:
      'গরমের দিনে উত্তপ্ত রাস্তায় গাড়ি চালিয়ে যাওয়ার সময় একই কারণে দূরে কালচে ভেজা রাস্তা দেখা যায়। সেখানে পৌঁছানোর পর দেখা যায় রাস্তাটি খটখটে শুকনো। এটাও এক ধরনের <b>মরীচিকা</b>।',
    q_walk: 'চোখটি গাছের কাছে এল, আলো বালুতে পড়ছে। এখান থেকে চোখ কী দেখবে?',
    c_walk_right: 'শুধু গাছটি',
    c_walk_both: 'গাছ আর উল্টো গাছ',
    c_walk_water: 'শুধু পানি',
    c_walk_none: 'কিছুই না',
    why_walk: '<b>শুধু গাছটি</b>: কাছ থেকে আপতন কোণ ক্রান্তি কোণের চেয়ে কম, পূর্ণ অভ্যন্তরীণ প্রতিফলন হয় না, তাই উল্টো গাছ নেই।',
    mis_walk_both: 'উল্টো গাছ দেখা যায় শুধু দূর থেকে; এখানে সেই আলো বালুতে পড়ে।',
    mis_walk_water: 'পানি কখনো ছিলই না; সেটি ছিল দৃষ্টি বিভ্রম।',
    mis_walk_none: 'গাছ থেকে সোজা আলো এখনো চোখে আসে, তাই গাছটি দেখা যায়।',
    c_road_more: 'আপতন কোণ ক্রান্তি কোণের চেয়ে বেশি হয়',
    mis_road_more: 'বেশি হলে পূর্ণ অভ্যন্তরীণ প্রতিফলন হতো, রাস্তা ভেজাই দেখাত।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'A mirage: light bends in the layers of air over hot sand',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    aria_stage: 'A coconut palm on hot desert sand; on the left an eye looks at the tree',
    note: 'Layers and angles exaggerated',

    howto_label: 'How to use it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_eye: 'Drag the eye',
    aria_howto_eye: 'Drag the eye: show the white disc under the eye on the picture',
    drag_me: 'Drag to move',
    aria_drag_eye: 'Move the eye nearer the tree or farther away (left and right arrows)',

    ex_label: 'Steps',
    ex_direct: 'Direct',
    ex_layers: 'Layers',
    ex_bend: 'Bent',
    ex_image: 'Image',
    ex_near: 'Close',

    act_direct: 'Look at the tree',
    act_layers: 'Let the sand heat up',
    act_bend: 'Follow the lower light',
    act_image: 'What does the eye see?',
    act_near: 'Walk up to the tree',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',

    intro:
      'A coconut palm stands far away on the hot sand of a desert. An eye is looking at it. From afar there seems to be water under the tree, with the tree upside down in it. Is there really water? Let us see.',
    intro_short: 'A tree far away on hot sand. Why do we see water under it from afar? Let us see.',

    lead_direct: 'Now the sun heats the sand. What happens to the air?',
    lead_layers: 'A second light leaves the treetop, heading down. What does it do?',
    lead_bend: 'Where does the turned-back light go? What does the eye see?',
    lead_image: 'Now let us walk up to the tree.',
    lead_near: 'Drag the eye near and far. Then test yourself.',

    out_direct: 'Light from the top of the tree comes to the eye <b>in a straight line</b>. So the eye sees the tree where it is.',
    out_layers: 'The air near the sand is the <b>hottest</b>; the air above is cool. Hot air is less dense.',
    out_bend: 'Angle of incidence {i}°, angle of refraction <b>{r}°</b>: it grew. The light could not enter the lowest layer.',
    out_image: 'The eye sees the tree and an <b>upside-down tree</b> below it. That is no real tree: no light went there.',
    out_far: 'At the lowest interface i = <b>{i}°</b>, more than the critical angle {c}°: a mirage.',
    out_close: 'At the lowest interface i = <b>{i}°</b>, less than the critical angle {c}°. The light for the eye hits the sand.',

    rule_direct: 'In the same air light goes straight. So someone looking at a far tree sees <b>the tree directly</b>.',
    rule_layers:
      'Three layers keep it simple. Up high the air is denser: a <b>higher refractive index</b>. Low down it is hot, less dense: a <b>lower refractive index</b>.',
    rule_bend:
      'At each layer the angle of refraction grows. At the lowest interface the angle of incidence {iB}° is more than the critical angle {c}°: <b>total internal reflection</b>.',
    rule_image:
      'The eye takes the light as straight, so along the dashed line it sees an <b>image</b> below the tree, as if in water. This illusion is a <b>mirage</b>.',
    rule_near: 'Up close light must come down steeply: i is small. So <b>a mirage is seen from afar, not up close</b>. There is no water.',
    rule_far_again:
      'From afar the light comes in almost level and the angle of incidence passes the critical angle. So <b>a mirage is seen from afar</b>.',

    lbl_tree: 'Tree',
    lbl_eye: 'Eye',
    lbl_sand: 'Sand',
    lbl_sand_hot: 'Hot sand',
    lbl_top: 'Upper layer · n higher',
    lbl_mid: 'Middle layer',
    lbl_low: 'Lower layer · n lower',
    lbl_normal: 'Normal',
    lbl_tir: 'Total internal reflection',
    lbl_image: 'Image',
    lbl_water: 'Looks like water',
    lbl_nowater: 'No water',

    hint_wait: 'Wait a moment and watch.',
    hint_drag: 'Drag the white disc under the eye.',

    q_count: 'Question {i} of {n}',
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

    q_r: 'Look at r and i. Entering the middle layer, how does r compare with i?',
    c_r_right: 'Larger',
    c_r_small: 'Smaller',
    c_r_same: 'Equal',
    c_r_zero: 'Zero',
    why_r: '<b>Larger</b>: into a lower refractive index, light bends away from the normal.',
    mis_r_small: 'Smaller is for light going into a denser medium.',
    mis_r_same: 'They would be equal if the two layers had the same index.',
    mis_r_zero: 'It is zero only for light along the normal.',

    q_tir: 'Why did the light turn back up at the lowest interface?',
    c_tir_right: 'i is more than the critical angle',
    c_tir_less: 'i is less than the critical angle',
    c_tir_sand: 'The sand reflects it like a mirror',
    c_tir_push: 'Hot air pushes the light up',
    why_tir: '<b>Its angle of incidence is more than the critical angle</b>, so it was totally internally reflected.',
    mis_tir_less: 'Below the critical angle the light would pass into the lowest layer.',
    mis_tir_sand: 'The light never reached the sand; it turned back in the air.',
    mis_tir_push: 'Air does not push light; at an interface light is refracted or reflected.',

    q_img: 'The bent light reached the eye. Where does the eye see the image, which way up?',
    c_img_right: 'Below the tree, upside down',
    c_img_upright: 'Below the tree, upright',
    c_img_above: 'Above the tree, upside down',
    c_img_none: 'Nowhere, only the tree',
    why_img: '<b>Below the tree, upside down</b>: the top’s light reaches the eye from below, so the top looks lowest.',
    mis_img_upright: 'The top’s light comes from below, so the tree looks upside down.',
    mis_img_above: 'The light reaches the eye from below, not from above.',
    mis_img_none: 'This light reaches the eye too, so it sees an image besides the tree.',

    q_road: 'On a hot day the road far ahead looks wet; close up it is bone dry. What changes up close?',
    c_road_right: 'i becomes less than the critical angle',
    c_road_crit: 'The critical angle grows up close',
    c_road_dry: 'The water dries up as you go',
    why_road: '<b>i becomes less than the critical angle</b>: up close light comes down steeply, no total internal reflection.',
    mis_road_crit: 'The critical angle depends on the air’s refractive index, not on the distance.',
    mis_road_dry: 'There never was water; it was an optical illusion.',
    inset_cap: 'What the eye sees',
    cap_desert: 'A mirage is a familiar sight in the desert. The word comes from a kind of <b>optical illusion</b> in hot places.',
    cap_road:
      'Driving on a hot road on a summer day, for the same reason the road far ahead looks dark and wet; when you get there it is bone dry. This too is a kind of <b>mirage</b>.',
    q_walk: 'The eye came near the tree; the light falls on the sand. What does the eye see from here?',
    c_walk_right: 'Only the tree',
    c_walk_both: 'The tree and an upside-down tree',
    c_walk_water: 'Only water',
    c_walk_none: 'Nothing',
    why_walk: '<b>Only the tree</b>: from near, i is less than the critical angle, no total internal reflection, so no upside-down tree.',
    mis_walk_both: 'The upside-down tree is seen only from afar; here that light falls on the sand.',
    mis_walk_water: 'There never was water; it was an optical illusion.',
    mis_walk_none: 'Straight light from the tree still reaches the eye, so the tree is seen.',
    c_road_more: 'i becomes more than the critical angle',
    mis_road_more: 'If it were more, there would be total internal reflection: the road would look wet.',
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
