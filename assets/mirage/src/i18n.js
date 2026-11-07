// Every string the figure shows, in Bangla and English. The book's words on pages 251–252 (topic 9.2.2, মরীচিকা,
// চিত্র ৯.১০): মরুভূমি, মরীচিকা, "মূল শব্দটি এসেছে মরুভূমিতে উষ্ণ স্থানে সৃষ্টি এক ধরনের দৃষ্টি বিভ্রম থেকে", উত্তপ্ত বালু,
// "সহজভাবে বোঝানোর জন্য এখানে মাত্র তিনটি স্তর দেখানো হয়েছে", "উপরের স্তরে বাতাসের ঘনত্ব বেশি তাই প্রতিসরণাঙ্ক বেশি",
// "নিচের স্তরে বাতাস উত্তপ্ত তাই ঘনত্ব কম এবং প্রতিসরণাঙ্কও কম", "প্রতিটি স্তরে প্রতিসরিত হওয়ার সময় প্রতিসরণ কোণ বেড়ে যায়",
// পূর্ণ অভ্যন্তরীণ প্রতিফলন, আপতন কোণ, ক্রান্তি কোণ ("ক্রান্তি কোণকে অতিক্রম"), "মরীচিকাকে দূর থেকে দেখা যায়, কাছে এলে
// দেখা যায় না", "সরাসরি গাছটি দেখতে পাবে", "গাছের একটি প্রতিবিম্ব গাছের নিচেও দেখতে পাবে", "মনে হবে নিচে পানি থাকার
// কারণে সেখানে গাছের প্রতিবিম্ব দেখা যাচ্ছে", "কাছে গেলে দেখা যাবে কোনো পানি নেই", and the hot road ("দূরে কালচে ভেজা
// রাস্তা", "খটখটে শুকনো"). The page writes উপরের. Sister figures (9.1, 9.2) call the virtual image "প্রতিবিম্ব (অবাস্তব)"
// and the normal "লম্ব" (chapter 9 never says অভিলম্ব).
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
    out_direct: 'গাছের মাথা থেকে আলো <b>সোজা পথে</b> চোখে আসে। চোখ গাছটি সরাসরি দেখে।',
    out_layers: 'বালুর কাছের বাতাস সবচেয়ে <b>উত্তপ্ত</b>, উপরের বাতাস ঠান্ডা।',
    out_bend: 'আপতন কোণ {i}°, প্রতিসরণ কোণ <b>{r}°</b>: কোণ বেড়ে গেল। নিচের স্তরে আলো আর ঢুকতে পারল না।',
    out_image: 'চোখ গাছটি দেখে, আর গাছের নিচে একটি <b>উল্টো গাছ</b>।',
    out_far: 'নিচের সীমানায় আপতন কোণ <b>{i}°</b>, ক্রান্তি কোণ {c}° থেকে বেশি: মরীচিকা দেখা যায়।',
    out_close: 'নিচের সীমানায় আপতন কোণ <b>{i}°</b>, ক্রান্তি কোণ {c}° থেকে কম: আলো বালুতে পড়ে।',

    // the rule: the book's words, the book's term in bold
    rule_direct: 'একই বাতাসের ভেতর দিয়ে আলো সোজা পথে চলে। তাই কোনো মানুষ দূরের একটি গাছের দিকে তাকালে <b>সরাসরি গাছটি</b> দেখতে পায়।',
    rule_layers:
      'সহজভাবে বোঝানোর জন্য মাত্র তিনটি স্তর। উপরের স্তরে বাতাসের ঘনত্ব বেশি, তাই <b>প্রতিসরণাঙ্ক বেশি</b>। নিচের স্তরে বাতাস উত্তপ্ত, তাই ঘনত্ব কম এবং <b>প্রতিসরণাঙ্কও কম</b>।',
    rule_bend:
      'গাছ থেকে আলো প্রতিটি স্তরে প্রতিসরিত হওয়ার সময় প্রতিসরণ কোণ বেড়ে যায়। নিচের সীমানায় আপতন কোণ {iB}°, ক্রান্তি কোণ {c}° থেকে বেশি। তাই সেখানে <b>পূর্ণ অভ্যন্তরীণ প্রতিফলন</b>।',
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
    lbl_top_q: 'উপরের স্তর',
    lbl_low_q: 'নিচের স্তর',
    lbl_normal: 'লম্ব',
    lbl_tir: 'পূর্ণ অভ্যন্তরীণ প্রতিফলন',
    lbl_image: 'প্রতিবিম্ব (অবাস্তব)',
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

    q_n: 'ছবির মরুভূমির বাতাসের কোন স্তরে প্রতিসরণাঙ্ক সবচেয়ে বেশি?',
    c_n_right: 'উপরের স্তরে',
    c_n_low: 'বালুর কাছের স্তরে',
    c_n_mid: 'মাঝের স্তরে',
    c_n_same: 'সব স্তরে সমান',
    why_n: '<b>উপরের স্তরে</b>: সেখানে বাতাস ঠান্ডা, ঘনত্ব বেশি, তাই প্রতিসরণাঙ্ক বেশি।',
    mis_n_low: 'বালুর কাছের বাতাস উত্তপ্ত, ঘনত্ব কম, তাই প্রতিসরণাঙ্ক সবচেয়ে কম।',
    mis_n_mid: 'মাঝের স্তর উপরের স্তরের চেয়ে গরম, তাই তার প্রতিসরণাঙ্ক কম।',
    mis_n_same: 'সব স্তরে সমান হলে আলো সোজা চলত, বাঁকত না।',

    q_r: 'আলো মাঝের স্তরে ঢুকল। ছবিতে প্রতিসরণ কোণ r, আপতন কোণ i-এর চেয়ে কেমন?',
    c_r_right: 'বড়',
    c_r_small: 'ছোট',
    c_r_same: 'সমান',
    c_r_zero: 'শূন্য',
    why_r: '<b>বড়</b>: বেশি প্রতিসরণাঙ্ক থেকে কম প্রতিসরণাঙ্কে গেলে আলো লম্ব থেকে দূরে সরে, প্রতিসরণ কোণ বেড়ে যায়।',
    mis_r_small: 'ছোট হয় হালকা থেকে ঘন মাধ্যমে গেলে; এখানে আলো কম প্রতিসরণাঙ্কে যাচ্ছে।',
    mis_r_same: 'সমান হতো যদি দুই স্তরের প্রতিসরণাঙ্ক সমান হতো।',
    mis_r_zero: 'শূন্য হয় শুধু লম্ব বরাবর এলে।',

    q_tir: 'নিচের সীমানায় পৌঁছে আলো উপরে ফিরে গেল কেন?',
    c_tir_right: 'আপতন কোণ ক্রান্তি কোণের চেয়ে বেশি',
    c_tir_less: 'আপতন কোণ ক্রান্তি কোণের চেয়ে কম',
    c_tir_sand: 'বালু আয়নার মতো আলো ফেরায়',
    c_tir_push: 'গরম বাতাস আলোকে উপরে ঠেলে',
    why_tir: '<b>আপতন কোণ ক্রান্তি কোণের চেয়ে বেশি</b>, তাই পূর্ণ অভ্যন্তরীণ প্রতিফলন হলো।',
    mis_tir_less: 'ক্রান্তি কোণের চেয়ে কম হলে আলো নিচের স্তরে প্রতিসরিত হয়ে ঢুকে যেত।',
    mis_tir_sand: 'আলো বালু পর্যন্ত পৌঁছায়ইনি; বাতাসের স্তরেই ফিরে গেছে।',
    mis_tir_push: 'বাতাস আলোকে ঠেলে না; স্তরের সীমানায় আলো প্রতিসরিত বা প্রতিফলিত হয়।',

    q_img: 'বাঁকা পথের আলো চোখে পৌঁছাল। চোখ প্রতিবিম্ব কোথায় ও কেমন দেখবে?',
    c_img_right: 'গাছের নিচে, উল্টো',
    c_img_upright: 'গাছের নিচে, সোজা',
    c_img_above: 'গাছের উপরে, উল্টো',
    c_img_none: 'কোথাও নয়, শুধু গাছ',
    why_img: '<b>গাছের নিচে, উল্টো</b>: গাছের মাথার আলো নিচ থেকে চোখে আসে, তাই মাথাটি সবচেয়ে নিচে দেখায়।',
    mis_img_upright: 'মাথার আলো নিচ থেকে আসে, তাই মাথাটি নিচে: গাছ উল্টো দেখায়।',
    mis_img_above: 'আলো চোখে নিচের দিক থেকে আসছে, উপর থেকে নয়।',
    mis_img_none: 'এই আলোও চোখে পৌঁছায়, তাই চোখ গাছ ছাড়াও প্রতিবিম্ব দেখে।',

    q_road: 'উত্তপ্ত রাস্তা দূর থেকে ভেজা দেখায়, কাছে গেলে খটখটে শুকনো। কেন?',
    c_road_right: 'আপতন কোণ ছোট হয়ে ক্রান্তি কোণের কম হয়',
    c_road_crit: 'কাছে গেলে ক্রান্তি কোণ বেড়ে যায়',
    c_road_dry: 'পানি ততক্ষণে শুকিয়ে যায়',
    c_road_cool: 'কাছে রাস্তা ঠান্ডা থাকে',
    why_road: '<b>আপতন কোণ ছোট হয়ে যায়</b>, ক্রান্তি কোণকে অতিক্রম করে না: পূর্ণ অভ্যন্তরীণ প্রতিফলন হয় না।',
    mis_road_crit: 'ক্রান্তি কোণ নির্ভর করে বাতাসের প্রতিসরণাঙ্কের উপর, দূরত্বের উপর নয়।',
    mis_road_dry: 'সেখানে কখনো পানি ছিলই না; সেটি ছিল দৃষ্টি বিভ্রম।',
    mis_road_cool: 'পুরো রাস্তাই রোদে সমান গরম; বদলেছে শুধু আলোর কোণ।',
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

    out_direct: 'Light from the top of the tree comes to the eye <b>in a straight line</b>. The eye sees the tree directly.',
    out_layers: 'The air near the sand is the <b>hottest</b>; the air above is cool.',
    out_bend: 'Angle of incidence {i}°, angle of refraction <b>{r}°</b>: it grew. The light could not enter the lowest layer.',
    out_image: 'The eye sees the tree, and an <b>upside-down tree</b> below it.',
    out_far: 'At the lowest boundary i = <b>{i}°</b>, more than the critical angle {c}°: a mirage.',
    out_close: 'At the lowest boundary i = <b>{i}°</b>, less than the critical angle {c}°: the light hits the sand.',

    rule_direct: 'In the same air light goes straight. So someone looking at a far tree sees <b>the tree directly</b>.',
    rule_layers:
      'Three layers keep it simple. Up high the air is denser: a <b>higher refractive index</b>. Low down it is hot, less dense: a <b>lower refractive index</b>.',
    rule_bend:
      'At each layer the angle of refraction grows. At the lowest boundary the angle of incidence {iB}° is more than the critical angle {c}°: <b>total internal reflection</b>.',
    rule_image:
      'The eye takes the light as straight, so along the dashed line it sees an <b>image</b> below the tree, as if in water. This illusion is a <b>mirage</b>.',
    rule_near:
      'Close up the light must come down steeply: a small angle of incidence. So <b>a mirage is seen from afar, not up close</b>. There is no water.',
    rule_far_again:
      'From afar the light comes in almost level and the angle of incidence passes the critical angle. So <b>a mirage is seen from afar</b>.',

    lbl_tree: 'Tree',
    lbl_eye: 'Eye',
    lbl_sand: 'Sand',
    lbl_sand_hot: 'Hot sand',
    lbl_top: 'Upper layer · n higher',
    lbl_mid: 'Middle layer',
    lbl_low: 'Lower layer · n lower',
    lbl_top_q: 'Upper layer',
    lbl_low_q: 'Lower layer',
    lbl_normal: 'Normal',
    lbl_tir: 'Total internal reflection',
    lbl_image: 'Image (virtual)',
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

    q_n: 'In the picture, which layer of desert air has the highest refractive index?',
    c_n_right: 'The upper layer',
    c_n_low: 'The layer by the sand',
    c_n_mid: 'The middle layer',
    c_n_same: 'All the same',
    why_n: '<b>The upper layer</b>: the air there is cool and denser, so its refractive index is higher.',
    mis_n_low: 'The air by the sand is hot and less dense: the lowest index.',
    mis_n_mid: 'The middle layer is warmer than the upper one, so its index is lower.',
    mis_n_same: 'If they were all the same, light would go straight, not bend.',

    q_r: 'Light passed from the upper layer into the middle one. How does r compare with i?',
    c_r_right: 'Larger',
    c_r_small: 'Smaller',
    c_r_same: 'Equal',
    c_r_zero: 'Zero',
    why_r: '<b>Larger</b>: into a lower refractive index, light bends away from the normal.',
    mis_r_small: 'Smaller is for light going into a denser medium.',
    mis_r_same: 'They would be equal if the two layers had the same index.',
    mis_r_zero: 'It is zero only for light along the normal.',

    q_tir: 'Why did the light turn back up at the lowest boundary?',
    c_tir_right: 'i is more than the critical angle',
    c_tir_less: 'i is less than the critical angle',
    c_tir_sand: 'The sand reflects it like a mirror',
    c_tir_push: 'Hot air pushes the light up',
    why_tir: '<b>Its angle of incidence is more than the critical angle</b>, so it was totally internally reflected.',
    mis_tir_less: 'Below the critical angle the light would pass into the lowest layer.',
    mis_tir_sand: 'The light never reached the sand; it turned back in the air.',
    mis_tir_push: 'Air does not push light; at a boundary light is refracted or reflected.',

    q_img: 'The bent light reached the eye. Where does the eye see the image, which way up?',
    c_img_right: 'Below the tree, upside down',
    c_img_upright: 'Below the tree, upright',
    c_img_above: 'Above the tree, upside down',
    c_img_none: 'Nowhere, only the tree',
    why_img: '<b>Below the tree, upside down</b>: the top’s light reaches the eye from below, so the top looks lowest.',
    mis_img_upright: 'The top’s light comes from below, so the tree looks upside down.',
    mis_img_above: 'The light reaches the eye from below, not from above.',
    mis_img_none: 'This light reaches the eye too, so it sees an image besides the tree.',

    q_road: 'On a hot day the road far ahead looks wet; close up it is bone dry. Why not wet up close?',
    c_road_right: 'i falls below the critical angle',
    c_road_crit: 'The critical angle grows up close',
    c_road_dry: 'The water has dried by then',
    c_road_cool: 'The road is cool up close',
    why_road: '<b>The angle of incidence becomes small</b> and does not pass the critical angle: no total internal reflection.',
    mis_road_crit: 'The critical angle depends on the air’s refractive index, not on the distance.',
    mis_road_dry: 'There never was water; it was an optical illusion.',
    mis_road_cool: 'The whole road is equally hot; only the light’s angle changed.',
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
